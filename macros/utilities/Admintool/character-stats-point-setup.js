/**
 * Character Statistics Point-Based Setup Utility
 *
 * Point-based character creation system following the new game rules:
 * - Base value: 2 in all characteristics (configurable)
 * - Point costs increase progressively:
 *   2→3: +1 point, 3→4: +1 point, 4→5: +2 points, 5→6: +2 points,
 *   6→7: +3 points, 7→8: +4 points, 8→9: +5 points, etc.
 * - Default: 20 points to distribute (configurable)
 *
 * Based on the Custom RPG Game Rules:
 * - Physique (Physical Strength)
 * - Dextérité (Dexterity/Skill)
 * - Agilité (Agility/Speed/Reflexes)
 * - Esprit (Mind/Concentration)
 * - Sens (Senses/Perception)
 * - Volonté (Will/Determination)
 * - Charisme (Charisma/Social Understanding)
 *
 * Storage: Saves characteristics as individual attributes + pointTotal + pointInutilise
 */

(async () => {
    // Validate basic requirements
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Please select a character token first!");
        return;
    }

    const token = canvas.tokens.controlled[0];
    const actor = token.actor;

    if (!actor) {
        ui.notifications.error("No valid actor found for the selected token!");
        return;
    }

    // Define the seven core characteristics
    const characteristics = {
        physique: "Physique (Physical Strength)",
        dexterite: "Dextérité (Dexterity/Skill)",
        agilite: "Agilité (Agility/Speed/Reflexes)",
        esprit: "Esprit (Mind/Concentration)",
        sens: "Sens (Senses/Perception)",
        volonte: "Volonté (Will/Determination)",
        charisme: "Charisme (Charisma/Social Understanding)"
    };

    /**
     * Calculate point cost for a characteristic value
     * Formula: Base 2 is free, then progressive cost increases
     * 2→3: +1, 3→4: +1, 4→5: +2, 5→6: +2, 6→7: +3, 7→8: +4, 8→9: +5, etc.
     * Correct sequence: 0-1-1-2-2-3-4-5-6-7-8-9-10-...
     */
    function calculatePointCost(value, baseValue = 2) {
        if (value <= baseValue) return 0;

        let totalCost = 0;

        for (let level = baseValue + 1; level <= value; level++) {
            // Calculate cost for this specific level
            const levelFromBase = level - baseValue; // 1, 2, 3, 4, 5, 6, 7, 8, 9...

            let levelCost;
            if (levelFromBase <= 2) {
                levelCost = 1; // Levels 1 and 2: cost 1 each
            } else if (levelFromBase <= 4) {
                levelCost = 2; // Levels 3 and 4: cost 2 each
            } else {
                levelCost = levelFromBase - 2; // Level 5+: cost 3, 4, 5, 6, 7, 8, 9...
            }

            totalCost += levelCost;
        }

        return totalCost;
    }

    /**
     * Calculate the cost to go from current level to next level
     */
    function getNextLevelCost(currentValue, baseValue = 2) {
        if (currentValue < baseValue) return 0;

        const nextLevel = currentValue + 1;
        const levelFromBase = nextLevel - baseValue; // 1, 2, 3, 4, 5, 6, 7, 8, 9...

        let nextLevelCost;
        if (levelFromBase <= 2) {
            nextLevelCost = 1; // Levels 1 and 2: cost 1 each
        } else if (levelFromBase <= 4) {
            nextLevelCost = 2; // Levels 3 and 4: cost 2 each
        } else {
            nextLevelCost = levelFromBase - 2; // Level 5+: cost 3, 4, 5, 6, 7, 8, 9...
        }

        return nextLevelCost;
    }

    // Step 1: Ask for base value (default 2)
    const baseValueResult = await new Promise((resolve) => {
        new Dialog({
            title: "Configuration - Valeur de Base",
            content: `
                <div style="padding: 10px;">
                    <h3>Configuration de la Valeur de Base</h3>
                    <p><strong>Personnage:</strong> ${actor.name}</p>
                    <hr>
                    <p>Quelle est la valeur de base pour toutes les caractéristiques ?</p>
                    <p><em>(Tous les personnages commencent avec cette valeur dans chaque stat)</em></p>
                    <div style="margin: 10px 0;">
                        <label><strong>Valeur de base:</strong></label>
                        <input type="number" id="baseValue" value="2" min="1" max="10" style="width: 60px; margin-left: 10px;">
                    </div>
                </div>
            `,
            buttons: {
                confirm: {
                    label: "Continuer",
                    callback: (html) => {
                        const baseValue = parseInt(html.find('#baseValue').val()) || 2;
                        resolve(baseValue);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }, { width: 400 }).render(true);
    });

    if (baseValueResult === null) {
        ui.notifications.info("Configuration annulée.");
        return;
    }

    const baseValue = baseValueResult;

    // Step 2: Detect existing values and calculate current point usage
    const currentStats = {};
    let currentPointsUsed = 0;

    for (let key of Object.keys(characteristics)) {
        const existingAttr = actor.system.attributes?.[key];
        const currentValue = existingAttr?.value || baseValue;
        currentStats[key] = currentValue;
        currentPointsUsed += calculatePointCost(currentValue, baseValue);
    }

    // Step 3: Ask for total points available
    const existingPointTotal = actor.system.attributes?.pointTotal?.value || null;
    const suggestedTotal = existingPointTotal || (currentPointsUsed > 0 ? currentPointsUsed : 20);

    const totalPointsResult = await new Promise((resolve) => {
        new Dialog({
            title: "Configuration - Points Totaux",
            content: `
                <div style="padding: 10px;">
                    <h3>Configuration des Points Totaux</h3>
                    <p><strong>Personnage:</strong> ${actor.name}</p>
                    <hr>
                    <div style="background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px;">
                        <h4>État Actuel:</h4>
                        <p><strong>Valeur de base:</strong> ${baseValue} dans chaque caractéristique</p>
                        <p><strong>Points actuellement utilisés:</strong> ${currentPointsUsed}</p>
                        ${existingPointTotal ? `<p><strong>Total configuré précédemment:</strong> ${existingPointTotal}</p>` : ''}
                    </div>
                    <p>Combien de points au total ce personnage devrait-il avoir ?</p>
                    <div style="margin: 10px 0;">
                        <label><strong>Points totaux:</strong></label>
                        <input type="number" id="totalPoints" value="${suggestedTotal}" min="0" max="200" style="width: 80px; margin-left: 10px;">
                    </div>
                    <p><em>Cette valeur sera sauvegardée dans l'attribut "pointTotal"</em></p>
                </div>
            `,
            buttons: {
                confirm: {
                    label: "Continuer",
                    callback: (html) => {
                        const totalPoints = parseInt(html.find('#totalPoints').val()) || 20;
                        resolve(totalPoints);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }, { width: 500 }).render(true);
    });

    if (totalPointsResult === null) {
        ui.notifications.info("Configuration annulée.");
        return;
    }

    const totalPoints = totalPointsResult;

    // Step 4 & 5: Interactive stat modification menu
    const finalResult = await new Promise((resolve) => {
        let workingStats = { ...currentStats };

        function updateDialog(html) {
            let usedPoints = 0;

            // Update all displays
            for (let key of Object.keys(characteristics)) {
                const value = workingStats[key];
                const cost = calculatePointCost(value, baseValue);
                usedPoints += cost;

                // Update value display
                html.find(`#value-${key}`).text(value);

                // Update cost display
                html.find(`#cost-${key}`).text(`${cost} points`);

                // Update button states
                const nextCost = getNextLevelCost(value, baseValue);
                const canIncrease = (usedPoints + nextCost) <= totalPoints;
                const canDecrease = value > baseValue;

                html.find(`#inc-${key}`).prop('disabled', !canIncrease);
                html.find(`#dec-${key}`).prop('disabled', !canDecrease);

                // Update button tooltips
                html.find(`#inc-${key}`).attr('title',
                    canIncrease ? `Coûte ${nextCost} point(s)` : 'Pas assez de points'
                );
            }

            // Update total display
            const remainingPoints = totalPoints - usedPoints;
            html.find('#remaining-points').text(remainingPoints);
            html.find('#used-points').text(usedPoints);

            // Update total display color
            const pointsDisplay = html.find('#points-summary');
            if (remainingPoints < 0) {
                pointsDisplay.css('color', '#cc0000');
            } else if (remainingPoints === 0) {
                pointsDisplay.css('color', '#008800');
            } else {
                pointsDisplay.css('color', '#333333');
            }
        }

        const content = `
            <div style="padding: 10px; max-height: 600px; overflow-y: auto;">
                <h3>Répartition des Caractéristiques</h3>
                <p><strong>Personnage:</strong> ${actor.name}</p>
                <hr>

                <div id="points-summary" style="background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px; text-align: center;">
                    <h4>Points Disponibles</h4>
                    <p><strong>Total:</strong> ${totalPoints} | <strong>Utilisés:</strong> <span id="used-points">0</span> | <strong>Restants:</strong> <span id="remaining-points">0</span></p>
                </div>

                <div style="display: grid; grid-template-columns: 2fr auto auto auto auto; gap: 10px; align-items: center; margin: 10px 0;">
                    <div><strong>Caractéristique</strong></div>
                    <div><strong>Valeur</strong></div>
                    <div><strong>Coût</strong></div>
                    <div><strong>Actions</strong></div>
                    <div></div>

                    ${Object.entries(characteristics).map(([key, label]) => `
                        <div>${label.split('(')[0].trim()}</div>
                        <div style="text-align: center; font-weight: bold; font-size: 1.2em;">
                            <span id="value-${key}">${workingStats[key]}</span>
                        </div>
                        <div style="text-align: center; font-size: 0.9em; color: #666;">
                            <span id="cost-${key}">0 points</span>
                        </div>
                        <div style="text-align: center;">
                            <button type="button" id="dec-${key}" style="width: 30px; margin: 2px;">-</button>
                        </div>
                        <div style="text-align: center;">
                            <button type="button" id="inc-${key}" style="width: 30px; margin: 2px;">+</button>
                        </div>
                    `).join('')}
                </div>

                <hr>
                <div style="background: #fff8dc; padding: 10px; border-radius: 5px; margin: 10px 0;">
                    <h4>Coûts par Niveau</h4>
                    <p style="font-size: 0.9em; margin: 5px 0;">
                        <strong>Base ${baseValue}:</strong> Gratuit |
                        <strong>${baseValue}→${baseValue+1}:</strong> 1pt |
                        <strong>${baseValue+1}→${baseValue+2}:</strong> 1pt |
                        <strong>${baseValue+2}→${baseValue+3}:</strong> 2pts |
                        <strong>${baseValue+3}→${baseValue+4}:</strong> 2pts |
                        <strong>${baseValue+4}→${baseValue+5}:</strong> 3pts |
                        <strong>${baseValue+5}→${baseValue+6}:</strong> 4pts...
                    </p>
                </div>
            </div>
        `;

        const dialog = new Dialog({
            title: "Configuration des Caractéristiques",
            content: content,
            buttons: {
                save: {
                    label: "💾 Sauvegarder",
                    callback: (html) => {
                        const finalUsedPoints = Object.keys(characteristics)
                            .reduce((total, key) => total + calculatePointCost(workingStats[key], baseValue), 0);

                        const unusedPoints = totalPoints - finalUsedPoints;

                        resolve({
                            stats: workingStats,
                            totalPoints: totalPoints,
                            unusedPoints: unusedPoints,
                            baseValue: baseValue
                        });
                    }
                },
                reset: {
                    label: "🔄 Reset",
                    callback: (html) => {
                        // Reset all stats to base value
                        for (let key of Object.keys(characteristics)) {
                            workingStats[key] = baseValue;
                        }
                        updateDialog(html);
                        return false; // Keep dialog open
                    }
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            render: (html) => {
                // Bind increment/decrement buttons
                for (let key of Object.keys(characteristics)) {
                    html.find(`#inc-${key}`).click(() => {
                        const nextCost = getNextLevelCost(workingStats[key], baseValue);
                        const currentUsed = Object.keys(characteristics)
                            .reduce((total, k) => total + calculatePointCost(workingStats[k], baseValue), 0);

                        if (currentUsed + nextCost <= totalPoints) {
                            workingStats[key]++;
                            updateDialog(html);
                        }
                    });

                    html.find(`#dec-${key}`).click(() => {
                        if (workingStats[key] > baseValue) {
                            workingStats[key]--;
                            updateDialog(html);
                        }
                    });
                }

                // Initial update
                updateDialog(html);
            }
        }, {
            width: 700,
            height: "auto",
            resizable: true
        });

        dialog.render(true);
    });

    // Handle final result
    if (!finalResult) {
        ui.notifications.info("Configuration annulée.");
        return;
    }

    // Save all data to actor
    try {
        const updateData = {};

        // Save individual characteristics
        for (let [key, value] of Object.entries(finalResult.stats)) {
            updateData[`system.attributes.${key}`] = {
                value: value,
                max: "",
                label: characteristics[key],
                dtype: "Number"
            };
        }

        // Save point tracking attributes
        updateData['system.attributes.pointTotal'] = {
            value: finalResult.totalPoints,
            max: "",
            label: "Points Totaux Alloués",
            dtype: "Number"
        };

        updateData['system.attributes.pointInutilise'] = {
            value: finalResult.unusedPoints,
            max: "",
            label: "Points Non Utilisés",
            dtype: "Number"
        };

        updateData['system.attributes.baseValue'] = {
            value: finalResult.baseValue,
            max: "",
            label: "Valeur de Base des Stats",
            dtype: "Number"
        };

        await actor.update(updateData);

        // Create success message
        const statsSummary = Object.entries(characteristics).map(([key, label]) => {
            const value = finalResult.stats[key];
            const cost = calculatePointCost(value, finalResult.baseValue);
            return `${label.split('(')[0].trim()}: ${value} (${cost} pts)`;
        }).join('<br>');

        const successMessage = `
            <div style="background: #f0f8ff; padding: 15px; border-radius: 5px;">
                <h3>✅ Configuration Sauvegardée!</h3>
                <p><strong>Personnage:</strong> ${actor.name}</p>
                <hr>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4>Caractéristiques:</h4>
                        <div style="font-family: monospace; font-size: 0.9em;">
                            ${statsSummary}
                        </div>
                    </div>
                    <div>
                        <h4>Résumé des Points:</h4>
                        <p><strong>Total alloué:</strong> ${finalResult.totalPoints}</p>
                        <p><strong>Points utilisés:</strong> ${finalResult.totalPoints - finalResult.unusedPoints}</p>
                        <p><strong>Points restants:</strong> ${finalResult.unusedPoints}</p>
                        <p><strong>Valeur de base:</strong> ${finalResult.baseValue}</p>
                    </div>
                </div>
                <hr>
                <p><em>Les caractéristiques sont accessibles via les attributs du personnage et peuvent être modifiées depuis la fiche de personnage.</em></p>
            </div>
        `;

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: successMessage,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });

        ui.notifications.info(`Configuration sauvegardée pour ${actor.name}!`);

    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        ui.notifications.error("Échec de la sauvegarde. Vérifiez la console pour plus de détails.");
    }
})();
