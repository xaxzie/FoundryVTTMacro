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
        ui.notifications.error("Please select your character token first!");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("No valid actor found!");
        return;
    }

    // Element Selection Dialog
    const elementChoice = await new Promise((resolve) => {
        new Dialog({
            title: "Bubbles Spell - Choose Element",
            content: `
                <h3>Select the element for your bubbles:</h3>
                <p><strong>Mana Cost:</strong> 4 mana (focusable - free in Focus stance, except Living Water)</p>
                <div style="margin: 10px 0;">
                    <label><input type="radio" name="element" value="water" checked>
                        <strong>Water</strong> - Decreases target speed by 1 square (2 projectiles)</label><br>
                    <label><input type="radio" name="element" value="ice">
                        <strong>Ice</strong> - Increases future electrical damage (2 projectiles)</label><br>
                    <label><input type="radio" name="element" value="oil">
                        <strong>Oil</strong> - Increases future fire damage (2 projectiles)</label><br>
                    <label><input type="radio" name="element" value="living_water">
                        <strong>Living Water</strong> - Heals target (1 projectile, can target self, NOT focusable)</label>
                </div>
            `,
            buttons: {
                confirm: {
                    label: "Confirm",
                    callback: (html) => {
                        const element = html.find('input[name="element"]:checked').val();
                        resolve(element);
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    if (!elementChoice) {
        ui.notifications.info("Spell cancelled.");
        return;
    }

    // Get Esprit stat and manual damage bonus
    const spellStats = await new Promise((resolve) => {
        new Dialog({
            title: "Bubbles Spell - Stats & Damage",
            content: `
                <h3>Spell Statistics</h3>
                <p>Each projectile deals: <strong>1d6 + (Esprit + bonus)/2</strong></p>
                <div style="margin: 10px 0;">
                    <label>Your Esprit stat:
                        <input type="number" id="esprit" value="11" min="1"style="width: 60px;">
                    </label><br><br>
                    <label>Manual bonus damage:
                        <input type="number" id="bonus" value="3" min="0" style="width: 60px;">
                    </label>
                </div>
                <p><small>Note: (Esprit + bonus) will be divided by 2 and added to 1d6</small></p>
            `,
            buttons: {
                confirm: {
                    label: "Continue",
                    callback: (html) => {
                        const esprit = parseInt(html.find('#esprit').val()) || 3;
                        const bonus = parseInt(html.find('#bonus').val()) || 0;
                        resolve({ esprit, bonus });
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    if (!spellStats) {
        ui.notifications.info("Spell cancelled.");
        return;
    }

    const { esprit: espritStat, bonus: damageBonus } = spellStats;

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
                    title: "Second Target?",
                    content: `<p>Do you want to target a second location, or send both projectiles to the first target?</p>`,
                    buttons: {
                        second: {
                            label: "Second Target",
                            callback: () => resolve(true)
                        },
                        same: {
                            label: "Same Target (Both Projectiles)",
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
                    ui.notifications.info("Second target cancelled - using first target only.");
                } else {
                    targets.push({ x: target2.x, y: target2.y });
                }
            }
        }
    } catch (error) {
        ui.notifications.error("Error during targeting. Make sure Portal module is installed and enabled.");
        return;
    }

    // Determine effect files based on element
    let effectFile, explosionFile, effectColor, elementDescription;
    switch (elementChoice) {
        case 'water':
            effectFile = "jb2a.bullet.03.blue";
            explosionFile = "jb2a.explosion.04.blue";
            effectColor = "blue";
            elementDescription = "Water (+Electrical dmg)";
            break;
        case 'ice':
            effectFile = "jb2a.bullet.03.blue";
            explosionFile = "jb2a.explosion.02.blue";
            effectColor = "blue";
            elementDescription = "Ice (Speed -1 square)";
            break;
        case 'oil':
            effectFile = "jb2a.explosion.03.blueyellow";
            effectColor = "orange";
            elementDescription = "Oil (+Fire dmg)";
            break;
        case 'living_water':
            effectFile = "jb2a.healing_generic.burst.greenorange";
            effectColor = "green";
            elementDescription = "Living Water (Healing)";
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

    // Display damage/healing results in chat
    const targetText = isLivingWater ?
        (allowSelfTarget ? "self-healing" : "healing target") :
        (targets.length > 1 ? "2 different targets" : "same target (both projectiles)");

    let damageDisplay;
    if (isLivingWater) {
        // Living Water - show healing
        damageDisplay = `
            <p><strong>Healing:</strong> ${damage1.total}
               <span style="font-size: 0.8em;">(${damage1.formula}: ${damage1.result})</span></p>
        `;
    } else if (targets.length > 1) {
        // Two different targets - show individual projectile damage
        damageDisplay = `
            <p><strong>Projectile 1 Damage:</strong> ${damage1.total}
               <span style="font-size: 0.8em;">(${damage1.formula}: ${damage1.result})</span></p>
            <p><strong>Projectile 2 Damage:</strong> ${damage2.total}
               <span style="font-size: 0.8em;">(${damage2.formula}: ${damage2.result})</span></p>
        `;
    } else {
        // Same target - show total damage
        const totalDamage = damage1.total + damage2.total;
        damageDisplay = `
            <p><strong>Total Damage:</strong> ${totalDamage}
               <span style="font-size: 0.8em;">(${damage1.total} + ${damage2.total} from both projectiles)</span></p>
        `;
    }

    const chatContent = `
        <div class="spell-result">
            <h3>🫧 Bubbles Spell (${elementDescription})</h3>
            <p><strong>Caster:</strong> ${actor.name}</p>
            <p><strong>Targets:</strong> ${targetText}</p>
            <p><strong>Mana Cost:</strong> ${isLivingWater ? '4 (not focusable)' : '4 (focusable - free in Focus stance)'}</p>
            <hr>
            ${damageDisplay}
            <hr>
            <p><strong>Element Effect:</strong> ${getElementEffect(elementChoice)}</p>
        </div>
    `;

    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    ui.notifications.info(`Bubbles spell cast! ${isLivingWater ? damage1.total + ' healing' : (damage1.total + (damage2?.total || 0)) + ' total damage'} dealt.`);

    function getElementEffect(element) {
        switch (element) {
            case 'water': return "Target speed reduced by 1 square for next movement";
            case 'ice': return "Target takes +2 damage from next electrical attack";
            case 'oil': return "Target takes +2 damage from next fire attack";
            case 'living_water': return allowSelfTarget ? "Self-healing restored vitality" : "Target restored to health";
            default: return "Unknown element effect";
        }
    }
})();
