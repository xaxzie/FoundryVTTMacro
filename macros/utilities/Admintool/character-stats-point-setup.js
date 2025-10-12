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
    function getNextLevelCost(currentValue, effectiveBase = 2, effectiveMaxLevel = 7) {
        if (currentValue < effectiveBase || currentValue >= effectiveMaxLevel) return 0;

        const nextLevel = currentValue + 1;
        const levelFromBase = nextLevel - effectiveBase; // 1, 2, 3, 4, 5, 6, 7, 8, 9...

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

    // Step 1: Ask for base value, maximum level and main stats count (with existing value detection)
    const existingBaseValue = actor.system.attributes?.baseValue?.value || 2;
    const existingMaxLevel = actor.system.attributes?.CharacMax?.value || 7;
    const existingMainStatsCount = actor.system.attributes?.nombreDeStatsPrincipales?.value || 0;

    const configResult = await new Promise((resolve) => {
        new Dialog({
            title: "Configuration - Valeurs de Base et Maximum",
            content: `
                <div style="padding: 10px;">
                    <h3>Configuration des Paramètres</h3>
                    <p><strong>Personnage:</strong> ${actor.name}</p>
                    <hr>
                    <div style="background: #f0f8ff; padding: 10px; margin: 10px 0; border-radius: 5px;">
                        <h4>Valeurs Actuelles:</h4>
                        <p><strong>Base actuelle:</strong> ${existingBaseValue}</p>
                        <p><strong>Maximum actuel:</strong> ${existingMaxLevel}</p>
                        <p><strong>Stats principales actuelles:</strong> ${existingMainStatsCount}</p>
                    </div>

                    <div style="margin: 15px 0;">
                        <label><strong>Valeur de base:</strong></label>
                        <input type="number" id="baseValue" value="${existingBaseValue}" min="1" max="10" style="width: 60px; margin-left: 10px;">
                        <p style="font-size: 0.9em; color: #666; margin: 5px 0;"><em>Tous les personnages commencent avec cette valeur dans chaque stat</em></p>
                    </div>

                    <div style="margin: 15px 0;">
                        <label><strong>Niveau maximum:</strong></label>
                        <input type="number" id="maxLevel" value="${existingMaxLevel}" min="3" max="20" style="width: 60px; margin-left: 10px;">
                        <p style="font-size: 0.9em; color: #666; margin: 5px 0;"><em>Valeur maximale qu'une caractéristique peut atteindre</em></p>
                    </div>

                    <div style="margin: 15px 0;">
                        <label><strong>Nombre de stats principales:</strong></label>
                        <input type="number" id="mainStatsCount" value="${existingMainStatsCount}" min="0" max="7" style="width: 60px; margin-left: 10px;">
                        <p style="font-size: 0.9em; color: #666; margin: 5px 0;"><em>Nombre de caractéristiques qui auront +1 base (gratuit) et +1 maximum</em></p>
                    </div>
                </div>
            `,
            buttons: {
                confirm: {
                    label: "Continuer",
                    callback: (html) => {
                        const baseValue = parseInt(html.find('#baseValue').val()) || 2;
                        const maxLevel = parseInt(html.find('#maxLevel').val()) || 7;
                        const mainStatsCount = parseInt(html.find('#mainStatsCount').val()) || 0;

                        if (maxLevel <= baseValue) {
                            ui.notifications.error("Le niveau maximum doit être supérieur à la valeur de base!");
                            return false; // Keep dialog open
                        }

                        if (mainStatsCount > 7) {
                            ui.notifications.error("Impossible d'avoir plus de 7 stats principales!");
                            return false; // Keep dialog open
                        }

                        resolve({ baseValue, maxLevel, mainStatsCount });
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }, { width: 450 }).render(true);
    });    if (configResult === null) {
        ui.notifications.info("Configuration annulée.");
        return;
    }

    const { baseValue, maxLevel, mainStatsCount } = configResult;

    /**
     * Helper function to get effective base value for a characteristic
     * (base value + 1 if it's a main stat)
     */
    function getEffectiveBase(key, baseValue) {
        const isMainStat = actor.system.attributes?.[`Is${key.charAt(0).toUpperCase() + key.slice(1)}Statsprinciaple`]?.value || false;
        return baseValue + (isMainStat ? 1 : 0);
    }

    /**
     * Helper function to get effective maximum level for a characteristic
     * Main stats also get +1 to their maximum level
     */
    function getEffectiveMaxLevel(key, baseMaxLevel) {
        const isMainStat = actor.system.attributes?.[`Is${key.charAt(0).toUpperCase() + key.slice(1)}Statsprinciaple`]?.value || false;
        return baseMaxLevel + (isMainStat ? 1 : 0);
    }

    /**
     * Helper function to get minimum value for a characteristic
     * (cannot go below existing configured value)
     */
    function getMinimumValue(key, baseValue) {
        const existingAttr = actor.system.attributes?.[key];
        const existingValue = existingAttr?.value || baseValue;
        const effectiveBase = getEffectiveBase(key, baseValue);
        return Math.max(effectiveBase, existingValue);
    }

    // Step 2: Detect existing values and calculate current point usage
    const currentStats = {};
    const currentMainStats = {};
    let currentPointsUsed = 0;

    for (let key of Object.keys(characteristics)) {
        const existingAttr = actor.system.attributes?.[key];
        const effectiveBase = getEffectiveBase(key, baseValue);
        const currentValue = existingAttr?.value || effectiveBase;
        const isMainStat = actor.system.attributes?.[`Is${key.charAt(0).toUpperCase() + key.slice(1)}Statsprinciaple`]?.value || false;

        currentStats[key] = currentValue;
        currentMainStats[key] = isMainStat;
        currentPointsUsed += calculatePointCost(currentValue, effectiveBase);
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
                // Display effective base and max values
                const effectiveMaxLevel = getEffectiveMaxLevel(key, maxLevel);
                html.find(`#base-${key}`).text(`${effectiveBase}/${effectiveMaxLevel}`);

                // Update button states
                const nextCost = getNextLevelCost(value, effectiveBase, effectiveMaxLevel);
                const minimumValue = getMinimumValue(key, baseValue);
                const canIncrease = (usedPoints + nextCost) <= totalPoints && value < effectiveMaxLevel && nextCost > 0;
                const canDecrease = value > minimumValue;

                html.find(`#inc-${key}`).prop('disabled', !canIncrease);
                html.find(`#dec-${key}`).prop('disabled', !canDecrease);

                // Update checkbox state (disable if over limit or if already selected as main stat)
                const existingMainStat = currentMainStats[key];
                const canToggleMain = selectedMainStats < mainStatsCount || isMainStat || existingMainStat;
                html.find(`#main-${key}`).prop('disabled', !canToggleMain && !existingMainStat);

                // Update button tooltips with effective max level
                let tooltip = '';
                if (value >= effectiveMaxLevel) {
                    tooltip = `Maximum atteint (${effectiveMaxLevel})`;
                } else if (nextCost === 0) {
                    tooltip = 'Impossible d\'augmenter';
                } else if ((usedPoints + nextCost) > totalPoints) {
                    tooltip = 'Pas assez de points';
                } else {
                    tooltip = `Coûte ${nextCost} point(s)`;
                }
                html.find(`#inc-${key}`).attr('title', tooltip);

                // Update decrease tooltip
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

            // Update total display color
            const pointsDisplay = html.find('#points-summary');
            if (remainingPoints < 0) {
                pointsDisplay.css('color', '#cc0000');
            } else if (remainingPoints === 0) {
                pointsDisplay.css('color', '#008800');
            } else {
                pointsDisplay.css('color', '#333333');
            }

            // Update main stats display color
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
                <h3>Répartition des Caractéristiques</h3>
                <p><strong>Personnage:</strong> ${actor.name}</p>
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
                    <div><strong>Base/Max Effectifs</strong></div>
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
                            <span id="base-${key}">Base/Max effectifs</span>
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
                    <h4>Explications</h4>
                    <p style="font-size: 0.9em; margin: 5px 0;">
                        <strong>Stats Principales:</strong> +1 base (gratuit) et +1 maximum<br>
                        <strong>Coûts par niveau:</strong> Base gratuit | +1: 1pt | +2: 1pt | +3: 2pts | +4: 2pts | +5: 3pts | +6: 4pts...<br>
                        <strong>Maximum:</strong> ${maxLevel} | <strong>Base standard:</strong> ${baseValue}
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
                        // Check if we have too many main stats selected
                        let selectedMainStats = 0;
                        const finalMainStats = {};

                        for (let key of Object.keys(characteristics)) {
                            const isMainStat = html.find(`#main-${key}`).prop('checked');
                            finalMainStats[key] = isMainStat;
                            if (isMainStat) selectedMainStats++;
                        }

                        if (selectedMainStats > mainStatsCount) {
                            ui.notifications.error(`Trop de stats principales sélectionnées! Maximum: ${mainStatsCount}`);
                            return false; // Keep dialog open
                        }

                        // Calculate final used points with effective bases
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
                        const isMainStat = html.find(`#main-${key}`).prop('checked');
                        const effectiveBase = baseValue + (isMainStat ? 1 : 0);
                        const effectiveMaxLevel = getEffectiveMaxLevel(key, maxLevel);
                        const nextCost = getNextLevelCost(workingStats[key], effectiveBase, effectiveMaxLevel);

                        // Calculate total used points with current main stat selections
                        const currentUsed = Object.keys(characteristics)
                            .reduce((total, k) => {
                                const kIsMainStat = html.find(`#main-${k}`).prop('checked');
                                const kEffectiveBase = baseValue + (kIsMainStat ? 1 : 0);
                                return total + calculatePointCost(workingStats[k], kEffectiveBase);
                            }, 0);

                        if (currentUsed + nextCost <= totalPoints && workingStats[key] < effectiveMaxLevel && nextCost > 0) {
                            workingStats[key]++;
                            updateDialog(html);
                        }
                    });

                    html.find(`#dec-${key}`).click(() => {
                        const minimumValue = getMinimumValue(key, baseValue);
                        if (workingStats[key] > minimumValue) {
                            workingStats[key]--;
                            updateDialog(html);
                        }
                    });

                    // Bind main stat checkboxes
                    html.find(`#main-${key}`).change(() => {
                        const isMainStat = html.find(`#main-${key}`).prop('checked');
                        const effectiveBase = baseValue + (isMainStat ? 1 : 0);

                        // Ensure value is at least the effective base
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

        updateData['system.attributes.CharacMax'] = {
            value: maxLevel,
            max: "",
            label: "Niveau Maximum des Caractéristiques",
            dtype: "Number"
        };

        updateData['system.attributes.nombreDeStatsPrincipales'] = {
            value: finalResult.mainStatsCount,
            max: "",
            label: "Nombre de Stats Principales Autorisées",
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

        const mainStatsCount = Object.values(finalResult.mainStats).filter(Boolean).length;
        const mainStatsNames = Object.entries(finalResult.mainStats)
            .filter(([key, isMain]) => isMain)
            .map(([key, isMain]) => characteristics[key].split('(')[0].trim())
            .join(', ');

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
                        <p style="font-size: 0.8em; margin-top: 10px;"><em>⭐ = Stats Principale (+1 base gratuit et +1 maximum)</em></p>
                    </div>
                    <div>
                        <h4>Résumé:</h4>
                        <p><strong>Total alloué:</strong> ${finalResult.totalPoints}</p>
                        <p><strong>Points utilisés:</strong> ${finalResult.totalPoints - finalResult.unusedPoints}</p>
                        <p><strong>Points restants:</strong> ${finalResult.unusedPoints}</p>
                        <p><strong>Valeur de base:</strong> ${finalResult.baseValue}</p>
                        <p><strong>Niveau maximum:</strong> ${maxLevel}</p>
                        <hr>
                        <h4>Stats Principales (${mainStatsCount}/${finalResult.mainStatsCount}):</h4>
                        <p style="font-size: 0.9em;">${mainStatsNames || 'Aucune'}</p>
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
