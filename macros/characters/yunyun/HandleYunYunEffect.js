(async () => {
    // === ACTOR VALIDATION ===
    const actor = canvas.tokens.controlled[0]?.actor;

    if (!actor) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Yunyun !");
        return;
    }

    // === CONFIGURATION ===

    // Custom Active Effects with Flags - YUNYUN'S POLYVALENT MAGIC EFFECTS
    const CUSTOM_EFFECTS = {
        "Ora Eyes": {
            name: "Ora Eyes",
            icon: "icons/svg/eye.svg",
            flags: [
                { key: "damage", value: 3 }
            ],
            description: "Bonus de +3 aux dégâts",
            category: "custom",
            increasable: false
        }
        // Futurs effets personnalisés de Yunyun seront ajoutés ici
    };

    // === DYNAMIC STATUS EFFECTS FROM CONFIG ===
    const getConfigStatusEffects = () => {
        return {
            postures: [
                { name: "Focus", icon: "icons/svg/aura.svg" },
                { name: "Offensif", icon: "icons/svg/sword.svg" },
                { name: "Defensif", icon: "icons/svg/shield.svg" }
            ],
            injuries: [
                { name: "Blessures", icon: "icons/svg/blood.svg", increasable: true }
            ],
            conditions: [
                { name: "Empoisonné", icon: "icons/svg/poison.svg" },
                { name: "Paralysé", icon: "icons/svg/paralysis.svg" },
                { name: "Aveuglé", icon: "icons/svg/blind.svg" },
                { name: "Assourdi", icon: "icons/svg/deaf.svg" }
            ]
        };
    };

    const configStatusEffects = getConfigStatusEffects();
    const POSTURES = configStatusEffects.postures;
    const INJURY_EFFECTS = configStatusEffects.injuries;

    // === TOKEN TRANSFORMATION FUNCTIONS (For future use) ===

    /**
     * Apply or revert token transformation using Token Magic FX
     * @param {Token} token - The token to transform
     * @param {Object} transformConfig - Transformation configuration
     * @param {boolean} shouldTransform - True to transform, false to revert
     */
    async function applyTokenTransformation(token, transformConfig, shouldTransform) {
        if (!token || !transformConfig) {
            console.error("[DEBUG] Invalid token or transform config for transformation");
            return false;
        }

        try {
            if (shouldTransform) {
                // Apply transformation
                const params = [{
                    filterType: "transform",
                    filterId: transformConfig.filterId,
                    autoDestroy: true,
                    padding: transformConfig.padding || 70,
                    magnify: transformConfig.magnify || 1
                }];

                await TokenMagic.addFilters(token, params);

                // Change token image if specified
                if (transformConfig.targetImagePath) {
                    await token.document.update({
                        texture: {
                            src: transformConfig.targetImagePath
                        }
                    });
                }

                console.log(`[DEBUG] Applied transformation ${transformConfig.filterId} to ${token.name}`);
                return true;
            } else {
                // Remove transformation
                await TokenMagic.deleteFilters(token, transformConfig.filterId);

                // Revert token image if needed (store original somewhere)
                // This would require storing the original image path when applying the transformation

                console.log(`[DEBUG] Removed transformation ${transformConfig.filterId} from ${token.name}`);
                return true;
            }
        } catch (error) {
            console.error(`[DEBUG] Transformation error for ${token.name}:`, error);
            return false;
        }
    }

    // === EFFECT MANAGEMENT FUNCTIONS ===

    /**
     * Create a comprehensive dropdown for effect management
     */
    async function showEffectDialog() {
        const currentEffects = actor.effects.contents.map(e => ({
            name: e.name,
            id: e.id,
            icon: e.icon,
            description: e.description || "Aucune description",
            isCustom: Object.keys(CUSTOM_EFFECTS).includes(e.name)
        }));

        return new Promise((resolve) => {
            const dialogContent = `
                <div style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 20px; border-radius: 12px; border: 2px solid #9c27b0;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #6a1b9a; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            ✨ Gestionnaire d'Effets - Yunyun ✨
                        </h2>
                        <p style="color: #666; margin: 5px 0;">Mage polyvalente aux capacités magiques variées</p>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- Current Effects -->
                        <div style="background: rgba(156, 39, 176, 0.1); padding: 15px; border-radius: 8px;">
                            <h3 style="color: #6a1b9a; margin: 0 0 10px 0;">🔮 Effets Actifs</h3>
                            <div id="currentEffectsList" style="max-height: 200px; overflow-y: auto;">
                                ${currentEffects.length > 0 ?
                                    currentEffects.map(effect => `
                                        <div style="background: rgba(255, 255, 255, 0.7); margin: 5px 0; padding: 8px; border-radius: 5px; display: flex; align-items: center; gap: 8px;">
                                            <img src="${effect.icon}" style="width: 24px; height: 24px;">
                                            <div style="flex-grow: 1;">
                                                <div style="font-weight: bold; font-size: 0.9em;">${effect.name}</div>
                                                <div style="font-size: 0.8em; color: #666;">${effect.description}</div>
                                            </div>
                                            <button onclick="removeEffect('${effect.id}')" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 0.8em;">✕</button>
                                        </div>
                                    `).join('') :
                                    '<p style="color: #666; font-style: italic;">Aucun effet actif</p>'
                                }
                            </div>
                        </div>

                        <!-- Available Effects -->
                        <div style="background: rgba(156, 39, 176, 0.1); padding: 15px; border-radius: 8px;">
                            <h3 style="color: #6a1b9a; margin: 0 0 10px 0;">➕ Ajouter Effet</h3>
                            <div style="margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Type d'Effet:</label>
                                <select id="effectType" style="width: 100%; padding: 5px; border-radius: 3px; border: 1px solid #ccc;">
                                    <option value="">-- Sélectionner --</option>
                                    <optgroup label="🔮 Effets Personnalisés">
                                        ${Object.entries(CUSTOM_EFFECTS).map(([key, effect]) =>
                                            `<option value="custom:${key}">${effect.name}</option>`
                                        ).join('')}
                                    </optgroup>
                                    <optgroup label="⚔️ Postures de Combat">
                                        ${POSTURES.map(posture =>
                                            `<option value="posture:${posture.name}">${posture.name}</option>`
                                        ).join('')}
                                    </optgroup>
                                    <optgroup label="🩸 Blessures">
                                        ${INJURY_EFFECTS.map(injury =>
                                            `<option value="injury:${injury.name}">${injury.name}</option>`
                                        ).join('')}
                                    </optgroup>
                                </select>
                            </div>

                            <div id="stackControls" style="display: none; margin-bottom: 15px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Nombre de Stacks:</label>
                                <input type="number" id="stackValue" min="1" max="10" value="1" style="width: 100%; padding: 5px; border-radius: 3px; border: 1px solid #ccc;">
                            </div>

                            <button id="addEffectBtn" disabled style="width: 100%; padding: 10px; background: #4caf50; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                                Ajouter Effet
                            </button>
                        </div>
                    </div>

                    <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; margin-top: 20px;">
                        <strong>💡 Guide des Effets de Yunyun:</strong>
                        <div style="margin-top: 5px; font-size: 0.9em;">
                            • <strong>Ora Eyes:</strong> Bonus de dégâts magiques<br>
                            • <strong>Très Fatigué:</strong> Malus suite à l'utilisation de sorts puissants<br>
                            • <strong>Postures:</strong> Modes de combat (Focus, Offensif, Défensif)<br>
                            • <strong>Blessures:</strong> Réduction des caractéristiques
                        </div>
                    </div>
                </div>
            `;

            new Dialog({
                title: "Gestionnaire d'Effets - Yunyun",
                content: dialogContent,
                buttons: {
                    close: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Fermer",
                        callback: () => resolve(null)
                    }
                },
                render: (html) => {
                    // Enable/disable controls based on selection
                    const effectTypeSelect = html.find('#effectType');
                    const stackControls = html.find('#stackControls');
                    const stackValue = html.find('#stackValue');
                    const addEffectBtn = html.find('#addEffectBtn');

                    effectTypeSelect.change(function() {
                        const selectedValue = this.value;
                        const addBtn = html.find('#addEffectBtn');

                        if (selectedValue) {
                            addBtn.prop('disabled', false);

                            // Show stack controls for increasable effects
                            if (selectedValue.startsWith('injury:') ||
                                (selectedValue.startsWith('custom:') &&
                                 CUSTOM_EFFECTS[selectedValue.split(':')[1]]?.increasable)) {
                                stackControls.show();
                            } else {
                                stackControls.hide();
                            }
                        } else {
                            addBtn.prop('disabled', true);
                            stackControls.hide();
                        }
                    });

                    // Add effect button handler
                    addEffectBtn.click(async function() {
                        const selectedValue = effectTypeSelect.val();
                        if (!selectedValue) return;

                        const [type, effectName] = selectedValue.split(':');
                        const stackAmount = parseInt(stackValue.val()) || 1;

                        try {
                            let success = false;

                            if (type === 'custom') {
                                success = await addCustomEffect(effectName, stackAmount);
                            } else if (type === 'posture') {
                                success = await addPostureEffect(effectName);
                            } else if (type === 'injury') {
                                success = await addInjuryEffect(effectName, stackAmount);
                            }

                            if (success) {
                                ui.notifications.info(`✅ Effet "${effectName}" ajouté avec succès !`);
                                resolve('refresh'); // Signal to refresh the dialog
                            }
                        } catch (error) {
                            console.error("[DEBUG] Error adding effect:", error);
                            ui.notifications.error(`❌ Erreur lors de l'ajout de l'effet "${effectName}"`);
                        }
                    });

                    // Make removeEffect function globally available
                    window.removeEffect = async function(effectId) {
                        try {
                            const effect = actor.effects.get(effectId);
                            if (effect) {
                                await effect.delete();
                                ui.notifications.info(`✅ Effet "${effect.name}" supprimé !`);
                                resolve('refresh'); // Signal to refresh the dialog
                            }
                        } catch (error) {
                            console.error("[DEBUG] Error removing effect:", error);
                            ui.notifications.error("❌ Erreur lors de la suppression de l'effet");
                        }
                    };
                },
                close: () => {
                    // Clean up global function
                    if (window.removeEffect) {
                        delete window.removeEffect;
                    }
                }
            }, {
                width: 800,
                height: 600
            }).render(true);
        });
    }

    /**
     * Add a custom effect to the actor
     */
    async function addCustomEffect(effectName, stackValue = 1) {
        const config = CUSTOM_EFFECTS[effectName];
        if (!config) {
            console.error(`[DEBUG] Custom effect config not found: ${effectName}`);
            return false;
        }

        // Check if effect already exists
        const existingEffect = actor.effects.contents.find(e => e.name === effectName);
        if (existingEffect && !config.increasable) {
            ui.notifications.warn(`⚠️ L'effet "${effectName}" est déjà actif !`);
            return false;
        }

        // Prepare effect data
        const effectData = {
            name: config.name,
            icon: config.icon,
            description: config.description,
            flags: {
                world: {}
            }
        };

        // Add flags
        if (config.flags && Array.isArray(config.flags)) {
            config.flags.forEach(flag => {
                effectData.flags.world[flag.key] = flag.value;
            });
        }

        // Handle increasable effects
        if (config.increasable && existingEffect) {
            const currentStacks = existingEffect.flags?.statuscounter?.value || config.defaultValue || 1;
            const newStacks = Math.min(currentStacks + stackValue, config.maxValue || 10);

            await existingEffect.update({
                'flags.statuscounter.value': newStacks
            });

            console.log(`[DEBUG] Increased ${effectName} stacks to ${newStacks}`);
            return true;
        } else {
            // Add status counter for increasable effects
            if (config.increasable) {
                effectData.flags.statuscounter = {
                    value: stackValue,
                    max: config.maxValue || 10
                };
            }

            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            console.log(`[DEBUG] Added custom effect: ${effectName}`);
            return true;
        }
    }

    /**
     * Add a posture effect (removes other postures first)
     */
    async function addPostureEffect(postureName) {
        // Remove existing postures
        const existingPostures = actor.effects.contents.filter(e =>
            POSTURES.some(p => p.name.toLowerCase() === e.name.toLowerCase())
        );

        if (existingPostures.length > 0) {
            await actor.deleteEmbeddedDocuments("ActiveEffect", existingPostures.map(e => e.id));
        }

        // Add new posture
        const postureConfig = POSTURES.find(p => p.name === postureName);
        if (!postureConfig) {
            console.error(`[DEBUG] Posture config not found: ${postureName}`);
            return false;
        }

        const effectData = {
            name: postureConfig.name,
            icon: postureConfig.icon,
            description: `Position de combat: ${posttureName}`
        };

        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        console.log(`[DEBUG] Added posture effect: ${postureName}`);
        return true;
    }

    /**
     * Add an injury effect
     */
    async function addInjuryEffect(injuryName, stackValue = 1) {
        const existingInjury = actor.effects.contents.find(e => e.name === injuryName);

        if (existingInjury) {
            const currentStacks = existingInjury.flags?.statuscounter?.value || 1;
            const newStacks = currentStacks + stackValue;

            await existingInjury.update({
                'flags.statuscounter.value': newStacks
            });

            console.log(`[DEBUG] Increased ${injuryName} to ${newStacks} stacks`);
            return true;
        } else {
            const injuryConfig = INJURY_EFFECTS.find(i => i.name === injuryName);
            if (!injuryConfig) {
                console.error(`[DEBUG] Injury config not found: ${injuryName}`);
                return false;
            }

            const effectData = {
                name: injuryConfig.name,
                icon: injuryConfig.icon,
                description: `${injuryName}: Réduit les caractéristiques`,
                flags: {
                    statuscounter: {
                        value: stackValue,
                        max: 20
                    }
                }
            };

            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            console.log(`[DEBUG] Added injury effect: ${injuryName} with ${stackValue} stacks`);
            return true;
        }
    }

    // === MAIN EXECUTION ===
    let dialogResult;
    do {
        dialogResult = await showEffectDialog();
    } while (dialogResult === 'refresh');

    console.log(`[DEBUG] HandleYunYunEffect completed for ${actor.name}`);

})();
