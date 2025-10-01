/**
 * Bubbles Spell - Ora's Dual Projectile Attack
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Description: Launches two identical projectiles that can be water, ice, oil, or living water
 * - Water: Decreases target speed by 1 square
 * - Ice: Increases future electrical damage vulnerability
 * - Oil: Increases future fire damage vulnerability
 * - Living Water: Heals target (single projectile only, can target self)
 *
 * Damage: Each projectile deals 1d6 + (Esprit + manual bonus)/2
 * Healing: Living water heals 1d6 + (Esprit + manual bonus)/2
 * Targeting: 1 target (both projectiles) or 2 targets (one each), living water allows self-targeting
 * Mana Cost: 4 mana (focusable - free in Focus stance, except Living Water which always costs 4)
 *
 * Prerequisites:
 * - Sequencer module
 * - JB2A effects
 * - Portal module for targeting
 * - Character must have turn (validation bypassed as per requirements)
 *
 * Usage: Select this macro and follow the prompts
 */

(async () => {
    // Validate basic requirements
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de votre personnage !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // Detect current stance using the simplest method
    const currentStance = actor?.effects?.contents?.find(e =>
        ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
    )?.name?.toLowerCase() || null;

    console.log(`[DEBUG] Current stance detected: ${currentStance || 'No stance'}`);

    // Calculate mana costs based on stance
    let manaCostInfo;
    if (currentStance === 'focus') {
        manaCostInfo = "<strong>Coût en Mana :</strong> GRATUIT (Position Focus) - sauf Eau Vivante: 2 mana";
    } else {
        manaCostInfo = "<strong>Coût en Mana :</strong> 4 mana";
    }

    // Element Selection Dialog
    const elementChoice = await new Promise((resolve) => {
        new Dialog({
            title: `Sort de Bulles - Choisir un Élément${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
            content: `
                <h3>Sélectionnez l'élément pour vos bulles :</h3>
                <p>${manaCostInfo}</p>
                <div style="margin: 10px 0;">
                    <label><input type="radio" name="element" value="water" checked>
                        <strong>Eau</strong> - Augmente les futurs dégâts électriques (2 projectiles)</label><br>
                    <label><input type="radio" name="element" value="ice">
                        <strong>Glace</strong> - Diminue la vitesse de la cible de 1 case (2 projectiles)</label><br>
                    <label><input type="radio" name="element" value="oil">
                        <strong>Huile</strong> - Augmente les futurs dégâts de feu (2 projectiles)</label><br>
                    <label><input type="radio" name="element" value="living_water">
                        <strong>Eau Vivante</strong> - Soigne la cible (1 projectile, peut se cibler soi-même, NON focalisable)</label>
                </div>
            `,
            buttons: {
                confirm: {
                    label: "Confirmer",
                    callback: (html) => {
                        const element = html.find('input[name="element"]:checked').val();
                        resolve(element);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    if (!elementChoice) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    // === ACTIVE EFFECT HELPER FUNCTIONS ===
    /**
     * Gets active effect bonuses for a specific flag key
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "esprit")
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey} (total: ${totalBonus})`);
            }
        }

        return totalBonus;
    }

    // Get Esprit stat from character sheet
    const espritAttribute = actor.system.attributes?.esprit;
    if (!espritAttribute) {
        ui.notifications.error("Caractéristique Esprit non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.");
        return;
    }
    const baseEspritStat = espritAttribute.value || 3;

    // Detect injury stacks and reduce Esprit accordingly
    const injuryEffect = actor?.effects?.contents?.find(e =>
        e.name?.toLowerCase() === 'blessures'
    );
    const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

    // Get active effect bonuses for Esprit
    const effectEspritBonus = getActiveEffectBonus(actor, "esprit");

    console.log(`[DEBUG] Base Esprit: ${baseEspritStat}, Injury stacks: ${injuryStacks}, Effect bonus: ${effectEspritBonus}`);

    // Calculate final Esprit: base - injuries + effects, minimum of 1
    const injuryAdjusted = Math.max(1, baseEspritStat - injuryStacks);
    const espritStat = Math.max(1, injuryAdjusted + effectEspritBonus);

    if (injuryStacks > 0) {
        console.log(`[DEBUG] Esprit reduced from ${baseEspritStat} to ${injuryAdjusted} due to ${injuryStacks} injuries`);
    }
    if (effectEspritBonus !== 0) {
        console.log(`[DEBUG] Esprit adjusted by ${effectEspritBonus} from active effects (final: ${espritStat})`);
    }

    // Get manual damage bonus (spell level is fixed at 1)
    const spellLevel = 1;

    // Get active effect damage bonuses for display
    const effectDamageBonus = getActiveEffectBonus(actor, "damage");

    // Stance-specific damage info
    let damageInfo;
    if (currentStance === 'offensif') {
        damageInfo = `Chaque projectile inflige : <strong>6 dégâts (MAXIMISÉ en Position Offensive)</strong>${effectDamageBonus !== 0 ? ` <em>(+${effectDamageBonus} bonus d'effets)</em>` : ''}`;
    } else {
        damageInfo = `Chaque projectile inflige : <strong>1d6 + (Esprit + bonus)/2</strong>${effectDamageBonus !== 0 ? ` <em>(+${effectDamageBonus} bonus d'effets)</em>` : ''}`;
    }

    const bonusValues = await new Promise((resolve) => {
        new Dialog({
            title: `Sort de Bulles - Bonus de Combat${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
            content: `
                <h3>Statistiques du Sort</h3>
                <p><strong>Position de Combat :</strong> ${currentStance ? currentStance.charAt(0).toUpperCase() + currentStance.slice(1) : 'Aucune'}</p>
                <p><strong>Caractéristique Esprit :</strong> ${espritStat}${injuryStacks > 0 || effectEspritBonus !== 0 ? ` <em>(${baseEspritStat}${injuryStacks > 0 ? ` - ${injuryStacks} blessures` : ''}${effectEspritBonus !== 0 ? ` + ${effectEspritBonus} effets` : ''})</em>` : ' (récupérée automatiquement)'}</p>
                <p><strong>Niveau du Sort :</strong> 1 (fixe)</p>
                <p>${damageInfo}</p>
                <p>Jet d'attaque de base : <strong>${espritStat}d7 + 2</strong></p>
                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <h4>Bonus Manuels</h4>
                    <div style="margin: 5px 0;">
                        <label>Bonus de dégâts :
                            <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                        </label>
                        <small style="display: block; margin-left: 20px;">Objets, effets temporaires, etc.</small>
                    </div>
                    <div style="margin: 5px 0;">
                        <label>Bonus de résolution d'attaque :
                            <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                        </label>
                        <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                    </div>
                </div>
                <p><strong>Jet d'attaque final :</strong> <span id="finalAttack">${espritStat}d7 + 2</span></p>
                <script>
                    document.getElementById('attackBonus').addEventListener('input', function() {
                        const base = ${espritStat};
                        const bonus = parseInt(this.value) || 0;
                        const total = base + bonus;
                        document.getElementById('finalAttack').textContent = total + 'd7 + 2';
                    });
                </script>
            `,
            buttons: {
                confirm: {
                    label: "Continuer",
                    callback: (html) => {
                        const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                        const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                        resolve({ damageBonus, attackBonus });
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    if (bonusValues === null) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    const { damageBonus, attackBonus } = bonusValues;

    // Special handling for Living Water - only one projectile, can target self
    const isLivingWater = elementChoice === 'living_water';
    let allowSelfTarget = false;

    // Target Selection using Portal
    let targets = [];
    try {
        // First target
        let targetPrompt = isLivingWater ?
            "Target for healing (you can target yourself)" :
            "Target 1";

        // Create Portal instance for first target
        const portal1 = new Portal()
            .origin(caster)
            .range(120) // Standard spell range
            .color(isLivingWater ? "#00ff00" : "#0000ff")
            .texture(isLivingWater ?
                "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm" :
                "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm");

        const target1 = await portal1.pick();

        if (!target1) {
            ui.notifications.info("Sort annulé.");
            return;
        }

        targets.push({ x: target1.x, y: target1.y });

        // Check if targeting self (within 1 square of caster)
        const distance = Math.sqrt(Math.pow(target1.x - caster.x, 2) + Math.pow(target1.y - caster.y, 2));
        if (distance <= canvas.grid.size) {
            allowSelfTarget = true;
        }

        // Living Water only has one projectile, skip second target
        if (!isLivingWater) {
            // Ask for second target
            const secondTarget = await new Promise((resolve) => {
                new Dialog({
                    title: "Deuxième Cible ?",
                    content: `<p>Voulez-vous cibler un deuxième emplacement, ou envoyer les deux projectiles sur la première cible ?</p>`,
                    buttons: {
                        second: {
                            label: "Deuxième Cible",
                            callback: () => resolve(true)
                        },
                        same: {
                            label: "Même Cible (Deux Projectiles)",
                            callback: () => resolve(false)
                        }
                    }
                }).render(true);
            });

            if (secondTarget) {
                // Create Portal instance for second target
                const portal2 = new Portal()
                    .origin(caster)
                    .range(120)
                    .color("#0000ff")
                    .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm");

                const target2 = await portal2.pick();

                if (!target2) {
                    ui.notifications.info("Deuxième cible annulée - utilisation de la première cible uniquement.");
                } else {
                    targets.push({ x: target2.x, y: target2.y });
                }
            }
        }
    } catch (error) {
        ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
        return;
    }

    // Helper function to find actor at target location
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);

        const tolerance = canvas.grid.size; // Full grid size tolerance (instead of half)
        console.log(`[DEBUG] Tolérance de détection: ${tolerance} (taille de grille: ${canvas.grid.size})`);        // Find tokens at or near the target location
        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            // Calculate token center coordinates (token.x and token.y are top-left corner)
            // Most tokens are 1x1 grid unit, so center is at +50 pixels (half grid size)
            const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
            const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;

            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
            );
            console.log(`[DEBUG] Token "${token.name}" à distance ${tokenDistance} (centre: x=${tokenCenterX}, y=${tokenCenterY}, coin: x=${token.x}, y=${token.y}, taille: ${token.document.width}x${token.document.height} grid)`);
            return tokenDistance <= tolerance;
        });

        console.log(`[DEBUG] Nombre de tokens trouvés dans la zone: ${tokensAtLocation.length}`);

        if (tokensAtLocation.length === 0) {
            console.log(`[DEBUG] Aucun token trouvé à la position cible`);
            return null;
        }

        // Get the first token found
        const targetToken = tokensAtLocation[0];
        const targetActor = targetToken.actor;

        console.log(`[DEBUG] Token sélectionné: "${targetToken.name}" (ID: ${targetToken.id})`);
        console.log(`[DEBUG] Actor du token:`, targetActor ? `"${targetActor.name}" (ID: ${targetActor.id})` : "null");

        if (!targetActor) {
            console.log(`[DEBUG] Aucun acteur associé au token`);
            return null;
        }

        // Check if the actor is visible/owned by the current user
        const isOwner = targetActor.isOwner;
        const isVisible = targetToken.visible;
        const isGM = game.user.isGM;

        console.log(`[DEBUG] Permissions - isOwner: ${isOwner}, isVisible: ${isVisible}, isGM: ${isGM}`);
        console.log(`[DEBUG] Utilisateur actuel: "${game.user.name}" (ID: ${game.user.id})`);

        if (isOwner || isVisible || isGM) {
            console.log(`[DEBUG] Accès autorisé - retour du nom réel: "${targetActor.name}"`);
            return {
                name: targetActor.name,
                token: targetToken,
                actor: targetActor
            };
        } else {
            console.log(`[DEBUG] Accès refusé - retour de "cible"`);
            return {
                name: "cible",
                token: targetToken,
                actor: targetActor
            };
        }
    }

    // Detect actors at target locations
    const targetActors = [];
    for (let i = 0; i < targets.length; i++) {
        console.log(`[DEBUG] Analyse de la cible ${i + 1}: x=${targets[i].x}, y=${targets[i].y}`);
        const actorInfo = getActorAtLocation(targets[i].x, targets[i].y);
        console.log(`[DEBUG] Résultat pour cible ${i + 1}:`, actorInfo);
        targetActors.push(actorInfo);
    }

    console.log(`[DEBUG] Liste finale des acteurs cibles:`, targetActors);

    // Determine effect files based on element
    let effectFile, explosionFile, effectColor, elementDescription;
    switch (elementChoice) {
        case 'water':
            effectFile = "jb2a.bullet.03.blue";
            explosionFile = "jb2a.explosion.04.blue";
            effectColor = "blue";
            elementDescription = "Eau (+Dégâts électriques)";
            break;
        case 'ice':
            effectFile = "jb2a.bullet.03.blue";
            explosionFile = "jb2a.explosion.02.blue";
            effectColor = "blue";
            elementDescription = "Glace (Vitesse -1 case)";
            break;
        case 'oil':
            effectFile = "jb2a.bullet.03.blue"; // Use water bullet but will be tinted orange
            explosionFile = "jb2a.explosion.04.blue"; // Use water explosion but will be tinted orange
            effectColor = "orange";
            elementDescription = "Huile (+Dégâts de feu)";
            break;
        case 'living_water':
            effectFile = "jb2a.healing_generic.burst.greenorange";
            effectColor = "green";
            elementDescription = "Eau Vivante (Soin)";
            break;
    }



    // Roll damage/healing based on stance
    let damage1, damage2 = null;

    if (currentStance === 'offensif' && !isLivingWater) {
        // Offensive stance: damage is maximized (6 + stat bonus)
        // Include active effect damage bonuses
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = Math.floor((espritStat + totalDamageBonus) / 2);
        const maxDamage = 6 + statBonus;

        // Create fake rolls that show the maximized result
        damage1 = { total: maxDamage, formula: `6 + ${statBonus}`, result: `6 + ${statBonus}`, isMaximized: true };
        damage2 = { total: maxDamage, formula: `6 + ${statBonus}`, result: `6 + ${statBonus}`, isMaximized: true };

        console.log(`[DEBUG] Maximized damage: ${maxDamage} (6 + ${statBonus}, manual bonus: ${damageBonus}, effect bonus: ${effectDamageBonus})`);
    } else {
        // Normal dice rolling for other stances or healing
        // Include active effect damage bonuses
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = Math.floor((espritStat + totalDamageBonus) / 2);
        damage1 = new Roll("1d6 + @statBonus", { statBonus: statBonus });
        await damage1.evaluate({ async: true });

        console.log(`[DEBUG] Damage roll: ${damage1.total} (formula: ${damage1.formula}, manual bonus: ${damageBonus}, effect bonus: ${effectDamageBonus}, total bonus: ${totalDamageBonus})`);

        // Living Water only has one projectile
        if (!isLivingWater) {
            damage2 = new Roll("1d6 + @statBonus", { statBonus: statBonus });
            await damage2.evaluate({ async: true });
        }
    }

    // Create the spell animation sequence
    let sequence = new Sequence();

    // Casting effect on caster
    const castingEffect = isLivingWater ? "jb2a.cast_generic.02.blue.0" : "jb2a.cast_generic.water.02.blue.0";
    sequence.effect()
        .file(castingEffect)
        .atLocation(caster)
        .scale(0.8)
        .duration(3000);

    // First projectile
    if (isLivingWater) {
        // Living Water: healing effect directly on target
        sequence.effect()
            .file(effectFile)
            .atLocation(targets[0])
            .scale(0.8)
            .delay(500);
    } else {
        // Damage projectiles: travel from caster to target
        let projectile1 = sequence.effect()
            .file(effectFile)
            .atLocation(caster)
            .stretchTo(targets[0])
            .scale(0.6)
            .delay(500)
            .waitUntilFinished(-200);

        // Add orange tint for oil
        if (elementChoice === 'oil') {
            projectile1.tint("#FF8C00"); // Dark orange tint
        }

        // Impact effect for first projectile
        let impact1 = sequence.effect()
            .file(explosionFile)
            .atLocation(targets[0])
            .scale(0.5);

        // Add orange tint for oil impact
        if (elementChoice === 'oil') {
            impact1.tint("#FF8C00"); // Dark orange tint
        }
    }

    // Second projectile (only for non-living water)
    if (!isLivingWater) {
        const target2Location = targets.length > 1 ? targets[1] : targets[0];

        let projectile2 = sequence.effect()
            .file(effectFile)
            .atLocation(caster)
            .stretchTo(target2Location)
            .scale(0.6)
            .delay(200)
            .waitUntilFinished(-200);

        // Add orange tint for oil
        if (elementChoice === 'oil') {
            projectile2.tint("#FF8C00"); // Dark orange tint
        }

        // Impact effect for second projectile
        let impact2 = sequence.effect()
            .file(explosionFile)
            .atLocation(target2Location)
            .scale(0.5);

        // Add orange tint for oil impact
        if (elementChoice === 'oil') {
            impact2.tint("#FF8C00"); // Dark orange tint
        }
    }

    // Play the sequence
    await sequence.play();

    // === COMBINED ATTACK AND DAMAGE RESOLUTION ===
    let combinedRoll = null;
    let attackResult = null;

    if (!isLivingWater) {
        // Build combined roll formula: attack roll + damage rolls
        const totalAttackDice = espritStat + attackBonus;
        const levelBonus = 2 * spellLevel;
        let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

        // Add damage rolls to the combined formula
        if (currentStance !== 'offensif') {
            // Only add dice rolls if not maximized (offensive stance)
            // Include active effect damage bonuses
            const totalDamageBonus = damageBonus + effectDamageBonus;
            const statBonus = Math.floor((espritStat + totalDamageBonus) / 2);
            combinedRollParts.push(`1d6 + ${statBonus}`); // Projectile 1
            combinedRollParts.push(`1d6 + ${statBonus}`); // Projectile 2
        }

        combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        // Extract results from the combined roll
        attackResult = combinedRoll.terms[0].results[0];

        if (currentStance !== 'offensif') {
            // Extract damage results and update damages array
            const damageResults = [];
            for (let i = 1; i < combinedRoll.terms[0].results.length; i++) {
                damageResults.push(combinedRoll.terms[0].results[i]);
            }

            // Update damages array with actual rolled results
            damage1 = { total: damageResults[0].result, formula: damageResults[0].expression, result: damageResults[0].result };
            damage2 = { total: damageResults[1].result, formula: damageResults[1].expression, result: damageResults[1].result };
        }
    }

    // === CREATE SIMPLIFIED DAMAGE DISPLAY ===
    let damageDisplay;
    const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';

    if (isLivingWater) {
        // Living Water - show healing with target name
        const healingTargetName = allowSelfTarget ? actor.name : (targetActors[0] ? targetActors[0].name : "cible");
        damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #d4edda; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #155724; margin-bottom: 6px;"><strong>🫧 Bulles ${getElementName(elementChoice)}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${healingTargetName}</div>
                <div style="font-size: 1.4em; color: #2e7d32; font-weight: bold;">💚 SOIN: ${damage1.total}</div>
            </div>
        `;
    } else if (targets.length > 1) {
        // Two different targets
        const target1Name = targetActors[0] ? targetActors[0].name : "cible";
        const target2Name = targetActors[1] ? targetActors[1].name : "cible";
        const totalDamage = damage1.total + damage2.total;
        damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>🫧 Bulles ${getElementName(elementChoice)}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cibles:</strong> ${target1Name} et ${target2Name}</div>
                <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${totalDamage}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${damage1.total} + ${damage2.total})</div>
            </div>
        `;
    } else {
        // Same target - show total damage
        const totalDamage = damage1.total + damage2.total;
        const targetName = targetActors[0] ? targetActors[0].name : "cible";
        damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>🫧 Bulles ${getElementName(elementChoice)}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${totalDamage}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${damage1.total} + ${damage2.total})</div>
            </div>
        `;
    }

    // Calculate actual mana cost based on stance and element
    let actualManaCost;
    if (currentStance === 'focus') {
        actualManaCost = isLivingWater ? '2 mana (Position Focus - coût réduit)' : 'GRATUIT (Position Focus)';
    } else {
        actualManaCost = '4 mana';
    }

    // Build injury info if present
    const injuryInfo = injuryStacks > 0 ?
        `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
            <i>⚠️ Ajusté pour blessures: Base ${baseEspritStat} - ${injuryStacks} = ${baseEspritStat - injuryStacks}</i>
        </div>` :
        '';

    // Build active effect info if present
    const effectInfo = effectEspritBonus !== 0 || effectDamageBonus !== 0 ?
        `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
            ${effectEspritBonus !== 0 ? `<div>✨ Bonus d'Esprit: +${effectEspritBonus}</div>` : ''}
            ${effectDamageBonus !== 0 ? `<div>✨ Bonus de Dégâts: +${effectDamageBonus}</div>` : ''}
        </div>` :
        '';

    // Build manual bonus info if present
    const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
        `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
            ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
            ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
        </div>` :
        '';

    // Build attack result display (for non-healing spells)
    const attackDisplay = !isLivingWater ? `
        <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
            <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
        </div>
    ` : '';

    // Get elemental effect description
    function getElementEffect(element) {
        switch (element) {
            case 'water': return "+2 dégâts électriques";
            case 'ice': return "Vitesse -1 case";
            case 'oil': return "+2 dégâts de feu";
            case 'living_water': return "Soins appliqués";
            default: return "Effet élémentaire";
        }
    }

    // Get element name for title
    function getElementName(element) {
        switch (element) {
            case 'water': return "Eau";
            case 'ice': return "Glace";
            case 'oil': return "Huile";
            case 'living_water': return "Eau Vivante";
            default: return "Élément";
        }
    }

    if (isLivingWater) {
        // For healing spells, roll dice and show them in chat
        // Include active effect damage bonuses for healing too
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = Math.floor((espritStat + totalDamageBonus) / 2);
        const healingRoll = new Roll("1d6 + @statBonus", { statBonus: statBonus });
        await healingRoll.evaluate({ async: true });

        console.log(`[DEBUG] Healing roll: ${healingRoll.total} (formula: ${healingRoll.formula}, manual bonus: ${damageBonus}, effect bonus: ${effectDamageBonus}, total bonus: ${totalDamageBonus})`);

        // Update damage1 with the actual rolled result
        damage1 = { total: healingRoll.total, formula: healingRoll.formula, result: healingRoll.total };

        // Create the healing damage display AFTER the dice roll with correct values
        const healingTargetName = allowSelfTarget ? actor.name : (targetActors[0] ? targetActors[0].name : "cible");
        const healingDamageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #d4edda; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #155724; margin-bottom: 6px;"><strong>🫧 Bulles ${getElementName(elementChoice)}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${healingTargetName}</div>
                <div style="font-size: 1.4em; color: #2e7d32; font-weight: bold;">💚 SOIN: ${damage1.total}</div>
            </div>
        `;

        const enhancedFlavor = `
            <div style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); padding: 12px; border-radius: 8px; border: 2px solid #4caf50; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #2e7d32;">🫧 Sort de Bulles</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${healingDamageDisplay}
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f1f8e9; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #2e7d32;"><strong>✨ Effet:</strong> ${getElementEffect(elementChoice)}</div>
                </div>
            </div>
        `;

        // Use FoundryVTT native dice rolling with enhanced custom flavor for healing
        await healingRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: enhancedFlavor,
            rollMode: game.settings.get("core", "rollMode")
        });

        ui.notifications.info(`Sort de Bulles lancé ! ${damage1.total} soin appliqué avec dés animés.`);
    } else {
        // For attack spells, use the dice rolling pattern
        const enhancedFlavor = `
            <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1976d2;">🫧 Sort de Bulles</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${damageDisplay}
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>✨ Effet:</strong> ${getElementEffect(elementChoice)}</div>
                </div>
            </div>
        `;

        // Use FoundryVTT native dice rolling with enhanced custom flavor
        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: enhancedFlavor,
            rollMode: game.settings.get("core", "rollMode")
        });

        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const damageInfo2 = (damage1.total + (damage2?.total || 0)) + ' dégâts totaux';
        const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

        ui.notifications.info(`Sort de Bulles lancé !${stanceInfo} ${damageInfo2}${maximizedInfo} prêt. Jet d'attaque : ${attackResult.result}.`);
    }
})();
