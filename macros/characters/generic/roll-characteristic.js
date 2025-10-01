/**
 * Generic Roll Characteristic Macro
 *
 * A universal macro that allows any player to roll characteristic checks
 * for their selected character token using proper FoundryVTT dice rolling.
 *
 * 🎲 DICE SYSTEM: Uses d7 dice system - [Characteristic Value]d7
 * Examples: Physique 4 = 4d7, Esprit 6 = 6d7
 * See GAME-RULES.md for complete dice system documentation
 *
 * Features:
 * - Interactive characteristic selection with buttons
 * - Automatic stat retrieval with injury adjustments
 * - Bonus system (extra dice + flat modifiers)
 * - Proper FoundryVTT animated dice rolling
 * - Works with any character that has stats configured
 *
 * Usage:
 * 1. Select your character token
 * 2. Run this macro
 * 3. Choose characteristic and any bonuses
 * 4. View animated dice roll results in chat
 */

(async () => {
    // === TOKEN VALIDATION ===
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

    // === VALIDATE ACTOR HAS CHARACTERISTICS ===
    if (!actor.system.attributes) {
        ui.notifications.error("Les attributs de l'acteur ne sont pas configurés ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.");
        return;
    }

    // === CHARACTER STATS UTILITY FUNCTIONS ===
    /**
     * Retrieves a specific character statistic from the actor
     * @param {Actor} actor - The actor to get stats from
     * @param {string} statName - Name of the stat
     * @returns {number} The stat value, defaults to 3 if not found
     */
    function getCharacterStat(actor, statName) {
        const attribute = actor.system.attributes?.[statName];
        if (!attribute) {
            console.warn(`[WARNING] Characteristic ${statName} not found! Using default value of 3.`);
            return 3;
        }
        return attribute.value || 3;
    }

    /**
     * Detects injury stacks on an actor
     * @param {Actor} actor - The actor to check for injuries
     * @returns {number} Number of injury stacks (0 if none)
     */
    function detectInjuryStacks(actor) {
        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase().includes('blessures')
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        return injuryStacks;
    }    /**
     * Gets active effect bonuses for a specific characteristic
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} characteristicName - The characteristic name to look for
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, characteristicName) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[characteristicName]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${characteristicName} (total: ${totalBonus})`);
            }
        }

        return totalBonus;
    }

    /**
     * Gets injury-adjusted character statistic with active effect bonuses
     * @param {Actor} actor - The actor to get stats from
     * @param {string} statName - Name of the stat
     * @returns {Object} { baseStat, injuryStacks, effectBonus, adjustedStat }
     */
    function getInjuryAdjustedStat(actor, statName) {
        const baseStat = getCharacterStat(actor, statName);
        const injuryStacks = detectInjuryStacks(actor);
        const effectBonus = getActiveEffectBonus(actor, statName);

        // Each injury reduces the stat by 1, then add effect bonuses, minimum of 1
        const injuryAdjusted = Math.max(1, baseStat - injuryStacks);
        const adjustedStat = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${statName} reduced from ${baseStat} to ${injuryAdjusted} due to ${injuryStacks} injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[DEBUG] ${statName} adjusted by ${effectBonus} from active effects (final: ${adjustedStat})`);
        }

        return {
            baseStat,
            injuryStacks,
            effectBonus,
            adjustedStat
        };
    }

    // === DEFINE CHARACTERISTICS ===
    const characteristics = {
        physique: "Physique",
        dexterite: "Dextérité",
        agilite: "Agilité",
        esprit: "Esprit",
        sens: "Sens",
        volonte: "Volonté",
        charisme: "Charisme"
    };

    // === CREATE CHARACTERISTIC SELECTION DIALOG ===
    const rollInfo = await new Promise((resolve) => {
        const content = `
            <div style="padding: 15px;">
                <h3>🎲 Test de Caractéristique</h3>
                <p><strong>Personnage:</strong> ${actor.name}</p>
                <hr>

                <div style="margin: 15px 0;">
                    <label><strong>Sélectionnez une caractéristique:</strong></label>

                    <!-- Première ligne: Physique, Dextérité, Agilité, Esprit -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 10px 0;">
                        ${['physique', 'dexterite', 'agilite', 'esprit'].map(key => {
                            const label = characteristics[key];
                            const statInfo = getInjuryAdjustedStat(actor, key);

                            // Build display value showing all adjustments
                            let displayValue = `${statInfo.adjustedStat}`;
                            let adjustmentParts = [];

                            if (statInfo.injuryStacks > 0) {
                                adjustmentParts.push(`${statInfo.baseStat}-${statInfo.injuryStacks}`);
                            }
                            if (statInfo.effectBonus !== 0) {
                                const sign = statInfo.effectBonus >= 0 ? '+' : '';
                                adjustmentParts.push(`${sign}${statInfo.effectBonus}E`);
                            }

                            if (adjustmentParts.length > 0) {
                                displayValue += ` (${adjustmentParts.join('')})`;
                            }

                            // Icons pour chaque caractéristique
                            const icons = {
                                physique: '💪',
                                dexterite: '🎯',
                                agilite: '⚡',
                                esprit: '🧠'
                            };

                            // Couleurs thématiques pour chaque caractéristique
                            const backgrounds = {
                                physique: 'linear-gradient(135deg, #fff8e1, #ffecb3)', // Jaune doux (force)
                                dexterite: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)', // Vert doux (précision)
                                agilite: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', // Bleu clair (vitesse)
                                esprit: 'linear-gradient(135deg, #f3e5f5, #e1bee7)'    // Violet doux (mental)
                            };

                            return `
                                <button type="button" class="char-button" data-char="${key}"
                                        style="padding: 8px 4px; border: 2px solid #ccc; background: ${backgrounds[key]}; cursor: pointer; border-radius: 4px; text-align: center; font-size: 0.85em; min-height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; transition: all 0.2s ease;">
                                    <div style="margin-bottom: 2px;">
                                        <span style="font-size: 1.3em;">${icons[key]}</span> <strong style="font-size: 1.1em; font-weight: bold;">${label}</strong>
                                    </div>
                                    <div style="color: #555; font-size: 0.9em; font-weight: 500;">[${displayValue}]</div>
                                </button>
                            `;
                        }).join('')}
                    </div>

                    <!-- Deuxième ligne: Sens, Volonté, Charisme (centrée) -->
                    <div style="display: flex; justify-content: center; gap: 6px; margin: 5px 0;">
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 75%;">
                            ${['sens', 'volonte', 'charisme'].map(key => {
                                const label = characteristics[key];
                                const statInfo = getInjuryAdjustedStat(actor, key);

                                // Build display value showing all adjustments
                                let displayValue = `${statInfo.adjustedStat}`;
                                let adjustmentParts = [];

                                if (statInfo.injuryStacks > 0) {
                                    adjustmentParts.push(`${statInfo.baseStat}-${statInfo.injuryStacks}`);
                                }
                                if (statInfo.effectBonus !== 0) {
                                    const sign = statInfo.effectBonus >= 0 ? '+' : '';
                                    adjustmentParts.push(`${sign}${statInfo.effectBonus}E`);
                                }

                                if (adjustmentParts.length > 0) {
                                    displayValue += ` (${adjustmentParts.join('')})`;
                                }

                                // Icons pour chaque caractéristique
                                const icons = {
                                    sens: '👁️',
                                    volonte: '🛡️',
                                    charisme: '✨'
                                };

                                // Couleurs thématiques pour chaque caractéristique
                                const backgrounds = {
                                    sens: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',     // Orange doux (perception)
                                    volonte: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',  // Rose doux (détermination)
                                    charisme: 'linear-gradient(135deg, #f9fbe7, #f0f4c3)'  // Vert lime doux (charme)
                                };

                                return `
                                    <button type="button" class="char-button" data-char="${key}"
                                            style="padding: 8px 4px; border: 2px solid #ccc; background: ${backgrounds[key]}; cursor: pointer; border-radius: 4px; text-align: center; font-size: 0.85em; min-height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; min-width: 80px; transition: all 0.2s ease;">
                                        <div style="margin-bottom: 2px;">
                                            <span style="font-size: 1.3em;">${icons[key]}</span> <strong style="font-size: 1.1em; font-weight: bold;">${label}</strong>
                                        </div>
                                        <div style="color: #555; font-size: 0.9em; font-weight: 500;">[${displayValue}]</div>
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <input type="hidden" id="selected-characteristic" value="">
                </div>

                <div style="margin: 15px 0;">
                    <label><strong>Bonus de Caractéristique:</strong></label>
                    <input type="number" id="char-bonus" value="0" min="-10" max="10" style="width: 100%; padding: 8px; margin: 5px 0;" placeholder="Bonus en dés (ex: +2 = 2 dés supplémentaires)">
                    <small style="color: #666;">Bonus en dés supplémentaires (positif ou négatif)</small>
                </div>

                <div style="margin: 15px 0;">
                    <label><strong>Bonus Fixe:</strong></label>
                    <input type="number" id="flat-bonus" value="0" min="-20" max="20" style="width: 100%; padding: 8px; margin: 5px 0;" placeholder="Bonus fixe au résultat (ex: +3)">
                    <small style="color: #666;">Bonus fixe ajouté au résultat final</small>
                </div>
            </div>
        `;

        const dialog = new Dialog({
            title: "Test de Caractéristique",
            content: content,
            buttons: {
                roll: {
                    label: "🎲 Lancer",
                    callback: (html) => {
                        const characteristic = html.find('#selected-characteristic').val();
                        const charBonus = parseInt(html.find('#char-bonus').val()) || 0;
                        const flatBonus = parseInt(html.find('#flat-bonus').val()) || 0;

                        if (!characteristic) {
                            ui.notifications.warn("Veuillez sélectionner une caractéristique!");
                            return;
                        }

                        resolve({
                            characteristic: characteristic,
                            charBonus: charBonus,
                            flatBonus: flatBonus
                        });
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "roll",
            close: () => resolve(null),
            render: (html) => {
                // Add click handlers for characteristic buttons
                html.find('.char-button').click(function() {
                    // Remove selection from all buttons - restore original gradient backgrounds
                    const originalBackgrounds = {
                        physique: 'linear-gradient(135deg, #fff8e1, #ffecb3)',
                        dexterite: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                        agilite: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        esprit: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
                        sens: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
                        volonte: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
                        charisme: 'linear-gradient(135deg, #f9fbe7, #f0f4c3)'
                    };

                    html.find('.char-button').each(function() {
                        const charKey = $(this).data('char');
                        $(this).css({
                            'border-color': '#ccc',
                            'background': originalBackgrounds[charKey],
                            'transform': 'scale(1)',
                            'box-shadow': 'none'
                        });
                    });

                    // Highlight selected button with enhanced effect
                    $(this).css({
                        'border-color': '#2196f3',
                        'background': 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
                        'transform': 'scale(1.05)',
                        'box-shadow': '0 4px 8px rgba(33, 150, 243, 0.3)'
                    });

                    // Set selected value
                    const charValue = $(this).data('char');
                    html.find('#selected-characteristic').val(charValue);
                });
            }
        }, {
            width: 450
        });

        dialog.render(true);
    });

    if (!rollInfo) {
        ui.notifications.info("Test de caractéristique annulé.");
        return;
    }

    // === PERFORM THE ROLL ===
    const selectedCharacteristic = characteristics[rollInfo.characteristic];
    const statInfo = getInjuryAdjustedStat(actor, rollInfo.characteristic);

    // Calculate total dice (base stat + character bonus, minimum 1)
    const totalDice = Math.max(1, statInfo.adjustedStat + rollInfo.charBonus);

    // Build roll formula with flat bonus
    let rollFormula = `${totalDice}d7`;
    if (rollInfo.flatBonus !== 0) {
        rollFormula += rollInfo.flatBonus >= 0 ? ` + ${rollInfo.flatBonus}` : ` - ${Math.abs(rollInfo.flatBonus)}`;
    }

    // Roll [total dice]d7 + flat bonus using proper FoundryVTT method
    const roll = new Roll(rollFormula);

    // Build flavor text with injury, effect, and bonus information
    let flavorParts = [`Test de ${selectedCharacteristic}`];

    if (statInfo.injuryStacks > 0) {
        flavorParts.push(`⚠️ Ajusté pour blessures: ${statInfo.baseStat} - ${statInfo.injuryStacks}`);
    }

    if (statInfo.effectBonus !== 0) {
        flavorParts.push(`✨ Bonus d'effets: ${statInfo.effectBonus >= 0 ? '+' : ''}${statInfo.effectBonus}`);
    }

    if (rollInfo.charBonus !== 0) {
        flavorParts.push(`Dés: ${statInfo.adjustedStat} + ${rollInfo.charBonus} = ${totalDice}d7`);
    }

    if (rollInfo.flatBonus !== 0) {
        flavorParts.push(`Bonus fixe: ${rollInfo.flatBonus >= 0 ? '+' : ''}${rollInfo.flatBonus}`);
    }

    const flavorText = flavorParts.join(' | ');

    // Get characteristic icon for the enhanced flavor
    const characteristicIcons = {
        physique: '💪',
        dexterite: '🎯',
        agilite: '⚡',
        esprit: '🧠',
        sens: '👁️',
        volonte: '🛡️',
        charisme: '✨'
    };

    // Build enhanced flavor with all formatting and information
    const injuryInfo = statInfo.injuryStacks > 0
        ? `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
               <i>⚠️ Ajusté pour blessures: Base ${statInfo.baseStat} - ${statInfo.injuryStacks} = ${statInfo.baseStat - statInfo.injuryStacks}</i>
           </div>`
        : '';

    const effectInfo = statInfo.effectBonus !== 0
        ? `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
               <i>✨ Bonus d'effets actifs: ${statInfo.effectBonus >= 0 ? '+' : ''}${statInfo.effectBonus}</i>
           </div>`
        : '';

    const bonusInfo = (rollInfo.charBonus !== 0 || rollInfo.flatBonus !== 0)
        ? `<div style="background: #f0f4ff; padding: 8px; border-radius: 4px; margin: 8px 0; border-left: 4px solid #2196f3;">
               ${rollInfo.charBonus !== 0 ? `<div style="margin: 2px 0;"><strong>Bonus de Dés:</strong> +${rollInfo.charBonus} (${statInfo.adjustedStat} + ${rollInfo.charBonus} = ${totalDice}d7)</div>` : ''}
               ${rollInfo.flatBonus !== 0 ? `<div style="margin: 2px 0;"><strong>Bonus Fixe:</strong> ${rollInfo.flatBonus >= 0 ? '+' : ''}${rollInfo.flatBonus}</div>` : ''}
           </div>`
        : '';

    const enhancedFlavor = `
        <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
            <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #1976d2;">
                    ${characteristicIcons[rollInfo.characteristic]} Test de ${selectedCharacteristic}
                </h3>
                <div style="margin-top: 5px;">
                    <strong>Personnage:</strong> ${actor.name}
                </div>
            </div>
            ${injuryInfo}
            ${effectInfo}
            ${bonusInfo}
        </div>
    `;

    // Use proper FoundryVTT dice rolling with enhanced custom flavor
    await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // Show notification
    const bonusText = (rollInfo.charBonus !== 0 || rollInfo.flatBonus !== 0)
        ? ` (avec bonus)`
        : '';
    ui.notifications.info(`Test de ${selectedCharacteristic}: ${roll.total}${bonusText}`);

    console.log(`[DEBUG] Characteristic roll completed - ${selectedCharacteristic} (${rollFormula})`);
})();
