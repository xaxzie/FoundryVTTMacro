/**
 * Bubbles Spell - Ora's Dual Projectile Attack
 * 
 * RPG-COMPLIANT SPELL for Custom RPG System
 * 
 * Description: Launches two identical projectiles that can be water, ice, or oil
 * - Water: Decreases target speed by 1 square
 * - Ice: Increases future electrical damage vulnerability  
 * - Oil: Increases future fire damage vulnerability
 * 
 * Damage: Each projectile deals 1d6 + (Esprit + manual bonus)/2
 * Targeting: 1 target (both projectiles) or 2 targets (one each)
 * 
 * Prerequisites:
 * - Sequencer module
 * - JB2A effects
 * - Warp Gate for targeting
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
                <div style="margin: 10px 0;">
                    <label><input type="radio" name="element" value="water" checked> 
                        <strong>Water</strong> - Decreases target speed by 1 square</label><br>
                    <label><input type="radio" name="element" value="ice"> 
                        <strong>Ice</strong> - Increases future electrical damage</label><br>
                    <label><input type="radio" name="element" value="oil"> 
                        <strong>Oil</strong> - Increases future fire damage</label>
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
                        <input type="number" id="esprit" value="3" min="1" max="6" style="width: 60px;">
                    </label><br><br>
                    <label>Manual bonus damage: 
                        <input type="number" id="bonus" value="0" min="0" style="width: 60px;">
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
                        resolve({esprit, bonus});
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

    const {esprit: espritStat, bonus: damageBonus} = spellStats;

    // Target Selection using Warp Gate
    let targets = [];
    try {
        // First target
        const target1 = await warpgate.crosshairs.show({
            size: 1,
            icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
            label: "Target 1"
        });

        if (target1.cancelled) {
            ui.notifications.info("Spell cancelled.");
            return;
        }

        targets.push({x: target1.x, y: target1.y});

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
            const target2 = await warpgate.crosshairs.show({
                size: 1,
                icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm",
                label: "Target 2"
            });

            if (target2.cancelled) {
                ui.notifications.info("Second target cancelled - using first target only.");
            } else {
                targets.push({x: target2.x, y: target2.y});
            }
        }
    } catch (error) {
        ui.notifications.error("Error during targeting. Make sure Warp Gate is installed and enabled.");
        return;
    }

    // Determine effect files based on element
    let effectFile, effectColor, elementDescription;
    switch(elementChoice) {
        case 'water':
            effectFile = "jb2a.bullet.01.blue";
            effectColor = "blue";
            elementDescription = "Water (Speed -1 square)";
            break;
        case 'ice':
            effectFile = "jb2a.ice_spikes.radial.01.blue";
            effectColor = "blue";
            elementDescription = "Ice (+Electrical dmg)";
            break;
        case 'oil':
            effectFile = "jb2a.bullet.01.orange";
            effectColor = "orange";
            elementDescription = "Oil (+Fire dmg)";
            break;
    }

    // Roll damage for display with corrected formula: 1d6 + (Esprit + bonus)/2
    const statBonus = Math.floor((espritStat + damageBonus) / 2);
    const damage1 = new Roll("1d6 + @statBonus", {statBonus: statBonus});
    const damage2 = new Roll("1d6 + @statBonus", {statBonus: statBonus});
    
    await damage1.evaluate({async: true});
    await damage2.evaluate({async: true});

    // Create the spell animation sequence
    let sequence = new Sequence();

    // Casting effect on caster
    sequence.effect()
        .file("jb2a.cast_generic.01.blue.0")
        .atLocation(caster)
        .scale(0.8)
        .duration(1000);

    // Sound effect
    sequence.sound()
        .file("modules/jb2a_patreon/Library/Generic/UI/Spell_01.ogg")
        .volume(0.3);

    // First projectile
    sequence.effect()
        .file(effectFile)
        .atLocation(caster)
        .stretchTo(targets[0])
        .scale(0.6)
        .delay(500)
        .waitUntilFinished(-200);

    // Impact effect for first projectile
    sequence.effect()
        .file(`jb2a.explosion.01.${effectColor}`)
        .atLocation(targets[0])
        .scale(0.5);

    // Second projectile (to same or different target)
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
        .file(`jb2a.explosion.01.${effectColor}`)
        .atLocation(target2Location)
        .scale(0.5);

    // Play the sequence
    await sequence.play();

    // Display damage results in chat
    const targetText = targets.length > 1 ? "2 different targets" : "same target (both projectiles)";
    
    let damageDisplay;
    if (targets.length > 1) {
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
            <hr>
            ${damageDisplay}
            <hr>
            <p><strong>Element Effect:</strong> ${getElementEffect(elementChoice)}</p>
        </div>
    `;

    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({token: caster}),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    ui.notifications.info(`Bubbles spell cast! ${damage1.total + damage2.total} total damage dealt.`);

    function getElementEffect(element) {
        switch(element) {
            case 'water': return "Target speed reduced by 1 square for next movement";
            case 'ice': return "Target takes +2 damage from next electrical attack";
            case 'oil': return "Target takes +2 damage from next fire attack";
            default: return "Unknown element effect";
        }
    }
})();