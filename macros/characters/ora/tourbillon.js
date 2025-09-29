/**
 * Tourbillon Spell - Ora's Vortex Creation
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Description: Creates a water vortex around a target
 * - Single Target: Creates one vortex (2d6 + Esprit damage when traversed)
 * - Divisible: Can be split into 2 smaller vortices (1d6 + Esprit/2 each)
 * - Protection: Can block piercing damage (optional choice, except in Focus stance)
 * - Vision: Blocks line of sight (handled manually)
 * - Escape: Target can traverse without damage on Agility roll (costs movement action)
 *
 * Damage: Applied immediately on cast (simulates movement through vortex)
 * Mana Cost: 4 mana (focusable - free in Focus stance, but no choice on protection)
 * Duration: Permanent until destroyed/traversed (use tourbillon-destroy.js)
 *
 * Prerequisites:
 * - Sequencer module
 * - JB2A effects
 * - Portal module for targeting
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

    // === STANCE DETECTION UTILITY ===
    const currentStance = actor?.effects?.contents?.find(e =>
        ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
    )?.name?.toLowerCase() || null;

    console.log(`[DEBUG] Current stance detected: ${currentStance || 'No stance'}`);

    // === CHARACTER STATS UTILITY ===
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

    console.log(`[DEBUG] Base Esprit: ${baseEspritStat}, Injury stacks: ${injuryStacks}`);

    // Each injury reduces Esprit by 1, minimum of 1
    const espritStat = Math.max(1, baseEspritStat - injuryStacks);

    if (injuryStacks > 0) {
        console.log(`[DEBUG] Esprit reduced from ${baseEspritStat} to ${espritStat} due to ${injuryStacks} injuries`);
    }

    // === SPELL CONFIGURATION DIALOG ===
    const spellLevel = 1;

    // Calculate mana costs based on stance
    let manaCostInfo;
    if (currentStance === 'focus') {
        manaCostInfo = "<strong>Coût en Mana :</strong> GRATUIT (Position Focus) - <em>Pas de choix sur protection (bloque toujours)</em>";
    } else {
        manaCostInfo = "<strong>Coût en Mana :</strong> 4 mana";
    }

    // Stance-specific damage info
    let damageInfo;
    if (currentStance === 'offensif') {
        damageInfo = "Dégâts de traversée : <strong>2d6 + Esprit (MAXIMISÉ en Position Offensive)</strong>";
    } else {
        damageInfo = "Dégâts de traversée : <strong>2d6 + Esprit</strong>";
    }

    const spellConfig = await new Promise((resolve) => {
        new Dialog({
            title: `Sort de Tourbillon${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
            content: `
                <h3>Configuration du Tourbillon :</h3>
                <p>${manaCostInfo}</p>
                <p><strong>Caractéristique Esprit :</strong> ${espritStat}${injuryStacks > 0 ? ` <em>(${baseEspritStat} - ${injuryStacks} blessures)</em>` : ''}</p>

                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <h4>Type de Tourbillon</h4>
                    <label><input type="radio" name="vortexType" value="single" checked>
                        <strong>Simple :</strong> 1 tourbillon (2d6 + Esprit)</label><br>
                    <label><input type="radio" name="vortexType" value="divided">
                        <strong>Divisé :</strong> 2 tourbillons (1d6 + Esprit/2 chacun)</label>
                </div>

                ${currentStance !== 'focus' ? `
                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f0f8ff;">
                    <h4>Protection Anti-Projectiles</h4>
                    <p><em>Le tourbillon peut-il bloquer les attaques traversantes ?</em></p>
                    <label><input type="radio" name="protection" value="yes" checked>
                        <strong>Oui :</strong> Bloque les dégâts des attaques traversant</label><br>
                    <label><input type="radio" name="protection" value="no">
                        <strong>Non :</strong> N'offre aucune protection</label>
                </div>
                ` : ''}

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

                <p>${damageInfo}</p>
                <p><strong>Jet d'attaque :</strong> <span id="finalAttack">${espritStat}d7 + 2</span></p>

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
                    label: "Lancer le Sort",
                    callback: (html) => {
                        const vortexType = html.find('input[name="vortexType"]:checked').val();
                        const protection = currentStance === 'focus' ? 'yes' : html.find('input[name="protection"]:checked').val();
                        const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                        const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                        resolve({ vortexType, protection, damageBonus, attackBonus });
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    if (!spellConfig) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    const { vortexType, protection, damageBonus, attackBonus } = spellConfig;

    // === PORTAL TARGETING UTILITY ===
    let targets = [];
    try {
        const isDivided = vortexType === 'divided';
        const targetCount = isDivided ? 2 : 1;

        for (let i = 0; i < targetCount; i++) {
            const targetPrompt = isDivided ? `Tourbillon ${i + 1}` : "Cible du tourbillon";

            const portal = new Portal()
                .origin(caster)
                .range(150) // Longer range for area effect
                .color("#00bfff") // Deep sky blue for water vortex
                .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm");

            const target = await portal.pick();

            if (!target) {
                ui.notifications.info("Sort annulé.");
                return;
            }

            targets.push({ x: target.x, y: target.y });
        }
    } catch (error) {
        ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
        return;
    }

    // === ACTOR DETECTION UTILITY ===
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);

        const tolerance = canvas.grid.size;
        console.log(`[DEBUG] Tolérance de détection: ${tolerance}`);

        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
            const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;

            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
            );
            return tokenDistance <= tolerance;
        });

        if (tokensAtLocation.length === 0) {
            return null;
        }

        const targetToken = tokensAtLocation[0];
        const targetActor = targetToken.actor;

        if (!targetActor) {
            return null;
        }

        const isOwner = targetActor.isOwner;
        const isVisible = targetToken.visible;
        const isGM = game.user.isGM;

        if (isOwner || isVisible || isGM) {
            return {
                name: targetActor.name,
                token: targetToken,
                actor: targetActor
            };
        } else {
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
        const actorInfo = getActorAtLocation(targets[i].x, targets[i].y);
        targetActors.push(actorInfo);
    }

    // === DAMAGE CALCULATION UTILITY ===
    let damages = [];
    const isDivided = vortexType === 'divided';

    if (currentStance === 'offensif') {
        // Offensive stance: damage is maximized
        if (isDivided) {
            // Divided: 1d6 + Esprit/2 -> maximized to 6 + Esprit/2
            const statBonus = Math.floor((espritStat + damageBonus) / 2);
            const maxDamage = 6 + statBonus;
            damages.push({ total: maxDamage, formula: `6 + ${statBonus}`, result: `6 + ${statBonus}`, isMaximized: true });
            damages.push({ total: maxDamage, formula: `6 + ${statBonus}`, result: `6 + ${statBonus}`, isMaximized: true });
        } else {
            // Single: 2d6 + Esprit -> maximized to 12 + Esprit
            const statBonus = espritStat + damageBonus;
            const maxDamage = 12 + statBonus;
            damages.push({ total: maxDamage, formula: `12 + ${statBonus}`, result: `12 + ${statBonus}`, isMaximized: true });
        }
    } else {
        // Normal dice rolling
        if (isDivided) {
            // Two smaller vortices: 1d6 + Esprit/2 each
            const statBonus = Math.floor((espritStat + damageBonus) / 2);
            for (let i = 0; i < 2; i++) {
                const damage = new Roll("1d6 + @statBonus", { statBonus: statBonus });
                await damage.evaluate({ async: true });
                damages.push(damage);
            }
        } else {
            // Single large vortex: 2d6 + Esprit
            const statBonus = espritStat + damageBonus;
            const damage = new Roll("2d6 + @statBonus", { statBonus: statBonus });
            await damage.evaluate({ async: true });
            damages.push(damage);
        }
    }

    // === SEQUENCER EFFECTS ===
    let sequence = new Sequence();

    // Casting effect on caster
    sequence.effect()
        .file("jb2a.cast_generic.water.02.blue.0")
        .atLocation(caster)
        .scale(0.9)
        .duration(3000);

    // Create vortex effects (persistent)
    for (let i = 0; i < targets.length; i++) {
        // Detect token at target location for adaptive scaling
        const targetToken = canvas.tokens.placeables.find(token => {
            const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
            const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;
            const distance = Math.sqrt(
                Math.pow(tokenCenterX - targets[i].x, 2) + Math.pow(tokenCenterY - targets[i].y, 2)
            );
            return distance <= canvas.grid.size;
        });

        // Calculate adaptive scale based on token size
        let vortexScale;
        if (targetToken) {
            // Scale based on token size: slightly larger than the token
            const tokenSize = Math.max(targetToken.document.width, targetToken.document.height) * 0.5;
            vortexScale = (tokenSize * 1.3) * (isDivided ? 0.8 : 1.0); // 10% larger than token, reduced if divided
        } else {
            // Default scale for empty positions
            vortexScale = 0.5 * (isDivided ? 0.7 : 1.0);
        }

        // Main vortex effect - PERSISTENT
        let vortexEffect = sequence.effect()
            .file("jb2a_patreon.whirlwind.blue")
            .scale(vortexScale)
            .belowTokens() // Places the effect under tokens
            .duration(120000) // 2 minutes duration (120 seconds)
            .fadeOut(3000) // 3 second fade out when destroyed
            .persist() // Makes it persistent until manually removed
            .name(`tourbillon_${i + 1}_${Date.now()}`) // Unique identifier for destruction
            .delay(800);

        // Attach to token if one exists at target location, otherwise use fixed position
        if (targetToken) {
            vortexEffect.attachTo(targetToken);
        } else {
            vortexEffect.atLocation(targets[i]);
        }

        // Initial impact effect
        let impactEffect = sequence.effect()
            .file("jb2a.impact.water.02.blue.0")
            .scale(vortexScale * 0.8) // Scale proportionally to vortex
            .belowTokens()
            .delay(800);

        // Attach impact to token or use fixed position
        if (targetToken) {
            impactEffect.attachTo(targetToken);
        } else {
            impactEffect.atLocation(targets[i]);
        }

        // Water splash effect
        let splashEffect = sequence.effect()
            .file("animated-spell-effects-cartoon.water.water splash.01")
            .scale(vortexScale * 0.6) // Scale proportionally to vortex
            .belowTokens()
            .delay(1200);

        // Attach splash to token or use fixed position
        if (targetToken) {
            splashEffect.attachTo(targetToken);
        } else {
            splashEffect.atLocation(targets[i]);
        }
    }

    // Play the sequence
    await sequence.play();

    // === ATTACK RESOLUTION ===
    const totalAttackDice = espritStat + attackBonus;
    const levelBonus = 2 * spellLevel;
    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    const attackResolution = {
        roll: attackRoll,
        total: attackRoll.total,
        formula: attackRoll.formula,
        result: attackRoll.result
    };

    // === CHAT FORMATTING UTILITY ===
    // Generate target text
    let targetText;
    if (isDivided) {
        const target1Name = targetActors[0] ? targetActors[0].name : "position";
        const target2Name = targetActors[1] ? targetActors[1].name : "position";
        targetText = `${target1Name} et ${target2Name}`;
    } else {
        const targetName = targetActors[0] ? targetActors[0].name : "position";
        targetText = targetName;
    }

    // Format damage display
    let damageDisplay;
    const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';

    if (isDivided) {
        damageDisplay = `
            <div style="text-align: center; margin: 15px 0; padding: 10px; background: #e7f3ff; border-radius: 5px;">
                <h2 style="margin: 5px 0; color: #0066cc;">🌊 Tourbillons Divisés${stanceNote}</h2>
                <p style="margin: 5px 0;"><strong>Tourbillon 1 :</strong> ${damages[0].total} dégâts <span style="font-size: 0.7em; color: #666;">(${damages[0].formula}: ${damages[0].result})</span></p>
                <p style="margin: 5px 0;"><strong>Tourbillon 2 :</strong> ${damages[1].total} dégâts <span style="font-size: 0.7em; color: #666;">(${damages[1].formula}: ${damages[1].result})</span></p>
                <p style="margin: 5px 0; font-size: 0.9em;"><strong>Cibles :</strong> ${targetText}</p>
            </div>
        `;
    } else {
        const targetName = targetActors[0] ? targetActors[0].name : "position";
        damageDisplay = `
            <div style="text-align: center; margin: 15px 0; padding: 10px; background: #e7f3ff; border-radius: 5px;">
                <h2 style="margin: 5px 0; color: #0066cc;">🌊 Tourbillon Puissant : ${damages[0].total} dégâts${stanceNote}</h2>
                <p style="margin: 5px 0;"><strong>Cible :</strong> ${targetName}</p>
                <p style="margin: 5px 0; font-size: 0.8em; color: #666;">(${damages[0].formula}: ${damages[0].result})</p>
            </div>
        `;
    }

    // Attack resolution display
    const attackResolutionInfo = `
        <div style="text-align: center; margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
            <p style="margin: 5px 0; font-size: 0.8em; color: #666;">(${attackResolution.formula} = ${attackResolution.result})</p>
            <h2 style="margin: 5px 0; color: #d9534f;">🎯 Jet d'Attaque : ${attackResolution.total}</h2>
        </div>
    `;

    // Calculate actual mana cost
    const actualManaCost = currentStance === 'focus' ? 'GRATUIT (Position Focus)' : '4 mana';

    // Build injury info if present
    const injuryInfo = injuryStacks > 0 ?
        `<p><strong>⚠️ Blessures :</strong> ${injuryStacks} (Esprit réduit de ${baseEspritStat} à ${espritStat})</p>` :
        '';

    // Protection info
    const protectionInfo = currentStance === 'focus' ?
        "Bloque TOUJOURS les attaques traversantes (Position Focus)" :
        (protection === 'yes' ? "Peut bloquer les attaques traversantes (au choix)" : "N'offre aucune protection");

    const chatContent = `
        <div class="spell-result">
            <h3>🌊 Sort de Tourbillon</h3>
            <p><strong>Coût en Mana :</strong> ${actualManaCost}</p>
            ${injuryInfo}
            ${attackResolutionInfo}
            ${damageDisplay}
            <hr>
            <div style="background: #f9f9f9; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <h4>Effets du Tourbillon :</h4>
                <p><strong>💨 Protection :</strong> ${protectionInfo}</p>
                <p><strong>👁️ Vision :</strong> Bloque la ligne de vue </p>
                <p><strong>🏃 Traversée :</strong> Jet d'Agilité pour traverser sans dégât (coûte l'action de mouvement)</p>
            </div>
        </div>
    `;

    // Create chat message
    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    // Notification
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const vortexInfo = isDivided ? `2 tourbillons créés` : `Tourbillon puissant créé`;
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

    ui.notifications.info(`Sort de Tourbillon lancé !${stanceInfo} ${vortexInfo}${maximizedInfo}. Jet d'attaque : ${attackResolution.total}.`);
})();
