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

    // Element Selection Dialog
    const elementChoice = await new Promise((resolve) => {
        new Dialog({
            title: "Sort de Bulles - Choisir un Élément",
            content: `
                <h3>Sélectionnez l'élément pour vos bulles :</h3>
                <p><strong>Coût en Mana :</strong> 4 mana (focalisable - gratuit en Position Focus, sauf Eau Vivante)</p>
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

    // Get Esprit stat from character sheet
    const espritAttribute = actor.system.attributes?.esprit;
    if (!espritAttribute) {
        ui.notifications.error("Caractéristique Esprit non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.");
        return;
    }
    const espritStat = espritAttribute.value || 3;

    // Get manual damage bonus (spell level is fixed at 1)
    const spellLevel = 1;
    const damageBonus = await new Promise((resolve) => {
        new Dialog({
            title: "Sort de Bulles - Bonus de Dégâts",
            content: `
                <h3>Statistiques du Sort</h3>
                <p><strong>Caractéristique Esprit :</strong> ${espritStat} (récupérée automatiquement)</p>
                <p><strong>Niveau du Sort :</strong> 1 (fixe)</p>
                <p>Chaque projectile inflige : <strong>1d6 + (Esprit + bonus)/2</strong></p>
                <p>Jet d'attaque : <strong>${espritStat}d7 + 2</strong></p>
                <div style="margin: 10px 0;">
                    <label>Bonus de dégâts manuel :
                        <input type="number" id="bonus" value="0" min="0" style="width: 60px;">
                    </label>
                </div>
                <p><small>Note : Le bonus manuel peut provenir d'objets, d'effets temporaires, etc.</small></p>
            `,
            buttons: {
                confirm: {
                    label: "Continuer",
                    callback: (html) => {
                        const bonus = parseInt(html.find('#bonus').val()) || 0;
                        resolve(bonus);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    if (damageBonus === null) {
        ui.notifications.info("Sort annulé.");
        return;
    }

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
            ui.notifications.info("Spell cancelled.");
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
            effectFile = "jb2a.explosion.03.blueyellow";
            effectColor = "orange";
            elementDescription = "Huile (+Dégâts de feu)";
            break;
        case 'living_water':
            effectFile = "jb2a.healing_generic.burst.greenorange";
            effectColor = "green";
            elementDescription = "Eau Vivante (Soin)";
            break;
    }



    // Roll damage/healing for display with corrected formula: 1d6 + (Esprit + bonus)/2
    const statBonus = Math.floor((espritStat + damageBonus) / 2);
    const damage1 = new Roll("1d6 + @statBonus", { statBonus: statBonus });
    let damage2 = null;

    await damage1.evaluate({ async: true });

    // Living Water only has one projectile
    if (!isLivingWater) {
        damage2 = new Roll("1d6 + @statBonus", { statBonus: statBonus });
        await damage2.evaluate({ async: true });
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
        sequence.effect()
            .file(effectFile)
            .atLocation(caster)
            .stretchTo(targets[0])
            .scale(0.6)
            .delay(500)
            .waitUntilFinished(-200);

        // Impact effect for first projectile
        sequence.effect()
            .file(explosionFile)
            .atLocation(targets[0])
            .scale(0.5);
    }

    // Second projectile (only for non-living water)
    if (!isLivingWater) {
        const target2Location = targets.length > 1 ? targets[1] : targets[0];

        sequence.effect()
            .file(effectFile)
            .atLocation(caster)
            .stretchTo(target2Location)
            .scale(0.6)
            .delay(200)
            .waitUntilFinished(-200);

        // Impact effect for second projectile
        sequence.effect()
            .file(explosionFile)
            .atLocation(target2Location)
            .scale(0.5);
    }

    // Play the sequence
    await sequence.play();

    // Attack Resolution for non-healing spells
    let attackResolution = null;
    if (!isLivingWater) {
        // Roll attack resolution: Esprit stat × d7 + (2 × spell level)
        const levelBonus = 2 * spellLevel;
        const attackRoll = new Roll(`${espritStat}d7 + ${levelBonus}`);
        await attackRoll.evaluate({ async: true });
        attackResolution = {
            roll: attackRoll,
            total: attackRoll.total,
            formula: attackRoll.formula,
            result: attackRoll.result,
            levelBonus: levelBonus
        };
    }

    // Display damage/healing results in chat
    const targetText = isLivingWater ?
        (allowSelfTarget ? "auto-soin" : "cible de soin") :
        (targets.length > 1 ? "2 cibles différentes" : "même cible (deux projectiles)");

    let damageDisplay;
    if (isLivingWater) {
        // Living Water - show healing
        damageDisplay = `
            <p><strong>Soin :</strong> ${damage1.total}
               <span style="font-size: 0.8em;">(${damage1.formula}: ${damage1.result})</span></p>
        `;
    } else if (targets.length > 1) {
        // Two different targets - show individual projectile damage
        damageDisplay = `
            <p><strong>Dégâts Projectile 1 :</strong> ${damage1.total}
               <span style="font-size: 0.8em;">(${damage1.formula}: ${damage1.result})</span></p>
            <p><strong>Dégâts Projectile 2 :</strong> ${damage2.total}
               <span style="font-size: 0.8em;">(${damage2.formula}: ${damage2.result})</span></p>
        `;
    } else {
        // Same target - show total damage
        const totalDamage = damage1.total + damage2.total;
        damageDisplay = `
            <p><strong>Dégâts Totaux :</strong> ${totalDamage}
               <span style="font-size: 0.8em;">(${damage1.total} + ${damage2.total} des deux projectiles)</span></p>
        `;
    }

    // Add attack resolution info for merged message
    let attackResolutionInfo = '';
    if (attackResolution) {
        attackResolutionInfo = `
            <hr>
            <h4>🎯 Résolution d'Attaque</h4>
            <p><strong>Jet d'Attaque :</strong> ${attackResolution.total}
               <span style="font-size: 0.8em;">(${attackResolution.formula} = ${attackResolution.result})</span></p>
            <p><strong>Bonus de Niveau :</strong> +${attackResolution.levelBonus} (Niveau ${spellLevel})</p>
            <p><em><strong>Défenseurs :</strong> Lancez votre contre-caractéristique (généralement Agilité) pour vous défendre !</em></p>
            <p><em>Si votre jet ≥ ${attackResolution.total}, vous évitez les effets du sort.</em></p>
        `;
    }

    const chatContent = `
        <div class="spell-result">
            <h3>🫧 Sort de Bulles (${elementDescription}) - Niveau ${spellLevel}</h3>
            <p><strong>Lanceur :</strong> ${actor.name}</p>
            <p><strong>Cibles :</strong> ${targetText}</p>
            <p><strong>Coût en Mana :</strong> ${isLivingWater ? '4 (non focalisable)' : '4 (focalisable - gratuit en Position Focus)'}</p>
            <p><strong>Caractéristique Esprit :</strong> ${espritStat}</p>
            ${attackResolutionInfo}
            <hr>
            ${damageDisplay}
            <hr>
            <p><strong>Effet Élémentaire :</strong> ${getElementEffect(elementChoice)}</p>
        </div>
    `;

    // Create single merged chat message
    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    const attackInfo = attackResolution ? ` Jet d'attaque : ${attackResolution.total}.` : '';
    ui.notifications.info(`Sort de Bulles lancé ! ${isLivingWater ? damage1.total + ' soin' : (damage1.total + (damage2?.total || 0)) + ' dégâts totaux'} prêt.${attackInfo}`);

    function getElementEffect(element) {
        switch (element) {
            case 'water': return "La cible prend +2 dégâts de la prochaine attaque électrique";
            case 'ice': return "Vitesse de la cible réduite de 1 case pour le prochain mouvement";
            case 'oil': return "La cible prend +2 dégâts de la prochaine attaque de feu";
            case 'living_water': return allowSelfTarget ? "Auto-soin a restauré la vitalité" : "Cible soignée et restaurée";
            default: return "Effet élémentaire inconnu";
        }
    }
})();
