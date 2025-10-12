/**
 * Character Statistics Quick Edit Utility
 *
 * Simplified version of the point-based character setup.
 * Directly opens the configuration menu using existing character settings.
 * All parameters (base, max, main stats count) are retrieved from the character.
 *
 * Requirements:
 * - Character must have been configured at least once with character-stats-point-setup.js
 * - Uses existing baseValue, CharacMax, nombreDeStatsPrincipales from character attributes
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

    // Retrieve all existing configuration from character
    const baseValue = actor.system.attributes?.baseValue?.value || 2;
    const maxLevel = actor.system.attributes?.CharacMax?.value || 7;
    const mainStatsCount = actor.system.attributes?.nombreDeStatsPrincipales?.value || 0;
    const totalPoints = actor.system.attributes?.pointTotal?.value || 20;

    // Check if character has been configured before
    if (!actor.system.attributes?.baseValue?.value) {
        ui.notifications.warn("Ce personnage n'a pas encore été configuré! Utilisez d'abord 'character-stats-point-setup.js'");
        return;
    }

    /**
     * Calculate point cost for a characteristic value
     */
    function calculatePointCost(value, baseValue = 2) {
        if (value <= baseValue) return 0;

        let totalCost = 0;

        for (let level = baseValue + 1; level <= value; level++) {
            const levelFromBase = level - baseValue;

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
    function getNextLevelCost(currentValue, effectiveBase = 2, maxLevel = 7) {
        if (currentValue < effectiveBase || currentValue >= maxLevel) return 0;

        const nextLevel = currentValue + 1;
        const levelFromBase = nextLevel - effectiveBase;

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

    /**
     * Helper function to get effective base value for a characteristic
     */
    function getEffectiveBase(key, baseValue) {
        const isMainStat = actor.system.attributes?.[`Is${key.charAt(0).toUpperCase() + key.slice(1)}Statsprinciaple`]?.value || false;
        return baseValue + (isMainStat ? 1 : 0);
    }

    /**
     * Helper function to get minimum value for a characteristic
     */
    function getMinimumValue(key, baseValue) {
        const existingAttr = actor.system.attributes?.[key];
        const existingValue = existingAttr?.value || baseValue;
        const effectiveBase = getEffectiveBase(key, baseValue);
        return Math.max(effectiveBase, existingValue);
    }

    // Load existing values and main stats
    const currentStats = {};
    const currentMainStats = {};

    for (let key of Object.keys(characteristics)) {
        const existingAttr = actor.system.attributes?.[key];
        const effectiveBase = getEffectiveBase(key, baseValue);
        const currentValue = existingAttr?.value || effectiveBase;
        const isMainStat = actor.system.attributes?.[`Is${key.charAt(0).toUpperCase() + key.slice(1)}Statsprinciaple`]?.value || false;

        currentStats[key] = currentValue;
        currentMainStats[key] = isMainStat;
    }

    // Open the interactive configuration menu directly
    const finalResult = await new Promise((resolve) => {
        let workingStats = { ...currentStats };
        let workingMainStats = { ...currentMainStats };

        function updateDialog(html) {
            let usedPoints = 0;
            let selectedMainStats = 0;

            // Count selected main stats
            for (let key of Object.keys(characteristics)) {
                if (html.find(`#main-${key}`).prop('checked')) {
                    selectedMainStats++;
                }
            }

            // Update all displays
            for (let key of Object.keys(characteristics)) {
                const value = workingStats[key];
                const isMainStat = html.find(`#main-${key}`).prop('checked');
                const effectiveBase = baseValue + (isMainStat ? 1 : 0);
                const cost = calculatePointCost(value, effectiveBase);
                usedPoints += cost;

                // Update value display
                html.find(`#value-${key}`).text(value);

                // Update cost display
                html.find(`#cost-${key}`).text(`${cost} points`);

                // Update base display
                html.find(`#base-${key}`).text(`(Base: ${effectiveBase})`);

                // Update button states
                const nextCost = getNextLevelCost(value, effectiveBase, maxLevel);
                const minimumValue = getMinimumValue(key, baseValue);
                const canIncrease = (usedPoints + nextCost) <= totalPoints && value < maxLevel && nextCost > 0;
                const canDecrease = value > minimumValue;

                html.find(`#inc-${key}`).prop('disabled', !canIncrease);
                html.find(`#dec-${key}`).prop('disabled', !canDecrease);

                // Update checkbox state
                const existingMainStat = currentMainStats[key];
                const canToggleMain = selectedMainStats < mainStatsCount || isMainStat || existingMainStat;
                html.find(`#main-${key}`).prop('disabled', !canToggleMain && !existingMainStat);

                // Update tooltips
                let tooltip = '';
                if (value >= maxLevel) {
                    tooltip = `Maximum atteint (${maxLevel})`;
                } else if (nextCost === 0) {
                    tooltip = 'Impossible d\'augmenter';
                } else if ((usedPoints + nextCost) > totalPoints) {
                    tooltip = 'Pas assez de points';
                } else {
                    tooltip = `Coûte ${nextCost} point(s)`;
                }
                html.find(`#inc-${key}`).attr('title', tooltip);

                let decreaseTooltip = '';
                if (value <= minimumValue) {
                    decreaseTooltip = 'Valeur minimum atteinte';
                } else {
                    decreaseTooltip = 'Diminuer la valeur';
                }
                html.find(`#dec-${key}`).attr('title', decreaseTooltip);
            }

            // Update total display
            const remainingPoints = totalPoints - usedPoints;
            html.find('#remaining-points').text(remainingPoints);
            html.find('#used-points').text(usedPoints);
            html.find('#main-stats-used').text(selectedMainStats);
            html.find('#main-stats-available').text(mainStatsCount - selectedMainStats);

            // Update colors
            const pointsDisplay = html.find('#points-summary');
            if (remainingPoints < 0) {
                pointsDisplay.css('color', '#cc0000');
            } else if (remainingPoints === 0) {
                pointsDisplay.css('color', '#008800');
            } else {
                pointsDisplay.css('color', '#333333');
            }

            const mainStatsDisplay = html.find('#main-stats-summary');
            if (selectedMainStats > mainStatsCount) {
                mainStatsDisplay.css('color', '#cc0000');
            } else if (selectedMainStats === mainStatsCount) {
                mainStatsDisplay.css('color', '#008800');
            } else {
                mainStatsDisplay.css('color', '#333333');
            }
        }

        const content = `
            <div style="padding: 10px; max-height: 700px; overflow-y: auto;">
                <h3>🚀 Édition Rapide des Caractéristiques</h3>
                <p><strong>Personnage:</strong> ${actor.name}</p>
                <p style="font-size: 0.9em; color: #666;"><em>Configuration actuelle récupérée automatiquement</em></p>
                <hr>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 10px 0;">
                    <div id="points-summary" style="background: #f0f8ff; padding: 10px; border-radius: 5px; text-align: center;">
                        <h4>Points Disponibles</h4>
                        <p><strong>Total:</strong> ${totalPoints} | <strong>Utilisés:</strong> <span id="used-points">0</span> | <strong>Restants:</strong> <span id="remaining-points">0</span></p>
                    </div>

                    <div id="main-stats-summary" style="background: #fff0f5; padding: 10px; border-radius: 5px; text-align: center;">
                        <h4>Stats Principales</h4>
                        <p><strong>Utilisées:</strong> <span id="main-stats-used">0</span> / ${mainStatsCount} | <strong>Disponibles:</strong> <span id="main-stats-available">${mainStatsCount}</span></p>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: auto 2fr auto auto auto auto auto; gap: 8px; align-items: center; margin: 10px 0;">
                    <div><strong>Principale</strong></div>
                    <div><strong>Caractéristique</strong></div>
                    <div><strong>Valeur</strong></div>
                    <div><strong>Base Effective</strong></div>
                    <div><strong>Coût</strong></div>
                    <div><strong>Actions</strong></div>
                    <div></div>

                    ${Object.entries(characteristics).map(([key, label]) => `
                        <div style="text-align: center;">
                            <input type="checkbox" id="main-${key}" ${workingMainStats[key] ? 'checked' : ''}
                                   ${currentMainStats[key] ? 'disabled title="Stats principale existante"' : ''}>
                        </div>
                        <div>${label.split('(')[0].trim()}</div>
                        <div style="text-align: center; font-weight: bold; font-size: 1.2em;">
                            <span id="value-${key}">${workingStats[key]}</span>
                        </div>
                        <div style="text-align: center; font-size: 0.9em; color: #666;">
                            <span id="base-${key}">(Base: ${baseValue})</span>
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
                    <h4>Configuration Actuelle</h4>
                    <p style="font-size: 0.9em; margin: 5px 0;">
                        <strong>Base:</strong> ${baseValue} | <strong>Maximum:</strong> ${maxLevel} | <strong>Stats Principales:</strong> ${mainStatsCount}<br>
                        <strong>Stats Principales:</strong> Augmentent la base de +1 gratuitement<br>
                        <strong>Coûts:</strong> Base gratuit | +1: 1pt | +2: 1pt | +3: 2pts | +4: 2pts | +5: 3pts | +6: 4pts...
                    </p>
                </div>
            </div>
        `;

        const dialog = new Dialog({
            title: "🚀 Édition Rapide - Caractéristiques",
            content: content,
            buttons: {
                save: {
                    label: "💾 Sauvegarder",
                    callback: (html) => {
                        // Validation des stats principales
                        let selectedMainStats = 0;
                        const finalMainStats = {};

                        for (let key of Object.keys(characteristics)) {
                            const isMainStat = html.find(`#main-${key}`).prop('checked');
                            finalMainStats[key] = isMainStat;
                            if (isMainStat) selectedMainStats++;
                        }

                        if (selectedMainStats > mainStatsCount) {
                            ui.notifications.error(`Trop de stats principales sélectionnées! Maximum: ${mainStatsCount}`);
                            return false;
                        }

                        // Calcul final des points
                        const finalUsedPoints = Object.keys(characteristics)
                            .reduce((total, key) => {
                                const isMainStat = finalMainStats[key];
                                const effectiveBase = baseValue + (isMainStat ? 1 : 0);
                                return total + calculatePointCost(workingStats[key], effectiveBase);
                            }, 0);

                        const unusedPoints = totalPoints - finalUsedPoints;

                        resolve({
                            stats: workingStats,
                            mainStats: finalMainStats,
                            totalPoints: totalPoints,
                            unusedPoints: unusedPoints,
                            baseValue: baseValue,
                            mainStatsCount: mainStatsCount
                        });
                    }
                },
                reset: {
                    label: "🔄 Reset vers Base",
                    callback: (html) => {
                        for (let key of Object.keys(characteristics)) {
                            const effectiveBase = getEffectiveBase(key, baseValue);
                            workingStats[key] = effectiveBase;
                        }
                        updateDialog(html);
                        return false;
                    }
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            render: (html) => {
                // Bind event handlers
                for (let key of Object.keys(characteristics)) {
                    // Increment button
                    html.find(`#inc-${key}`).click(() => {
                        const isMainStat = html.find(`#main-${key}`).prop('checked');
                        const effectiveBase = baseValue + (isMainStat ? 1 : 0);
                        const nextCost = getNextLevelCost(workingStats[key], effectiveBase, maxLevel);

                        const currentUsed = Object.keys(characteristics)
                            .reduce((total, k) => {
                                const kIsMainStat = html.find(`#main-${k}`).prop('checked');
                                const kEffectiveBase = baseValue + (kIsMainStat ? 1 : 0);
                                return total + calculatePointCost(workingStats[k], kEffectiveBase);
                            }, 0);

                        if (currentUsed + nextCost <= totalPoints && workingStats[key] < maxLevel && nextCost > 0) {
                            workingStats[key]++;
                            updateDialog(html);
                        }
                    });

                    // Decrement button
                    html.find(`#dec-${key}`).click(() => {
                        const minimumValue = getMinimumValue(key, baseValue);
                        if (workingStats[key] > minimumValue) {
                            workingStats[key]--;
                            updateDialog(html);
                        }
                    });

                    // Main stat checkbox
                    html.find(`#main-${key}`).change(() => {
                        const isMainStat = html.find(`#main-${key}`).prop('checked');
                        const effectiveBase = baseValue + (isMainStat ? 1 : 0);

                        if (workingStats[key] < effectiveBase) {
                            workingStats[key] = effectiveBase;
                        }

                        updateDialog(html);
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

    // Handle result and save
    if (!finalResult) {
        ui.notifications.info("Édition annulée.");
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

        // Update point tracking
        updateData['system.attributes.pointInutilise'] = {
            value: finalResult.unusedPoints,
            max: "",
            label: "Points Non Utilisés",
            dtype: "Number"
        };

        // Save main stats flags
        for (let [key, isMainStat] of Object.entries(finalResult.mainStats)) {
            const attributeName = `Is${key.charAt(0).toUpperCase() + key.slice(1)}Statsprinciaple`;
            updateData[`system.attributes.${attributeName}`] = {
                value: isMainStat,
                max: "",
                label: `${characteristics[key].split('(')[0].trim()} - Stats Principale`,
                dtype: "Boolean"
            };
        }

        await actor.update(updateData);

        // Create success message
        const statsSummary = Object.entries(characteristics).map(([key, label]) => {
            const value = finalResult.stats[key];
            const isMainStat = finalResult.mainStats[key];
            const effectiveBase = finalResult.baseValue + (isMainStat ? 1 : 0);
            const cost = calculatePointCost(value, effectiveBase);
            const mainIndicator = isMainStat ? ' ⭐' : '';
            return `${label.split('(')[0].trim()}: ${value}${mainIndicator} (${cost} pts)`;
        }).join('<br>');

        const mainStatsNames = Object.entries(finalResult.mainStats)
            .filter(([key, isMain]) => isMain)
            .map(([key, isMain]) => characteristics[key].split('(')[0].trim())
            .join(', ');

        const successMessage = `
            <div style="background: #f0fff0; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745;">
                <h3>🚀 Édition Rapide Terminée!</h3>
                <p><strong>Personnage:</strong> ${actor.name}</p>
                <hr>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <h4>Caractéristiques Mises à Jour:</h4>
                        <div style="font-family: monospace; font-size: 0.9em;">
                            ${statsSummary}
                        </div>
                        <p style="font-size: 0.8em; margin-top: 10px;"><em>⭐ = Stats Principale (+1 base gratuit)</em></p>
                    </div>
                    <div>
                        <h4>Résumé:</h4>
                        <p><strong>Points utilisés:</strong> ${finalResult.totalPoints - finalResult.unusedPoints} / ${finalResult.totalPoints}</p>
                        <p><strong>Points restants:</strong> ${finalResult.unusedPoints}</p>
                        <p><strong>Stats principales:</strong> ${mainStatsNames || 'Aucune'}</p>
                    </div>
                </div>
            </div>
        `;

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: successMessage,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });

        ui.notifications.info(`✅ Caractéristiques mises à jour pour ${actor.name}!`);

    } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        ui.notifications.error("Échec de la sauvegarde. Vérifiez la console pour plus de détails.");
    }
})();
