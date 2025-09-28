/**
 * Character Statistics Setup Utility
 *
 * One-time utility macro to set up the seven core characteristics for selected characters.
 * Based on the Custom RPG Game Rules:
 * - Physique (Physical Strength)
 * - Dextérité (Dexterity/Skill)
 * - Agilité (Agility/Speed/Reflexes)
 * - Esprit (Mind/Concentration)
 * - Sens (Senses/Perception)
 * - Volonté (Will/Determination)
 * - Charisme (Charisma/Social Understanding)
 *
 * Admin Setup Tool:
 * - No point restrictions or limits
 * - Flexible stat assignment for any character type
 * - Values between 1-20 for maximum flexibility
 *
 * Storage: Saves characteristics as individual attributes (actor.system.attributes.physique, etc.)
 * Usage: Select a token and run this macro to set up characteristics (editable from character sheet)
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

    // Get existing characteristics from individual attributes or set defaults
    const defaultStats = {};
    for (let key of Object.keys(characteristics)) {
        const existingAttr = actor.system.attributes?.[key];
        defaultStats[key] = existingAttr?.value || 3;
    }

    // Create the setup dialog
    const setupDialog = await new Promise((resolve) => {
        const content = `
            <div style="padding: 10px;">
                <h3>Character Statistics Setup</h3>
                <p><strong>Character:</strong> ${actor.name}</p>
                <hr>
                <h4>Admin Character Setup:</h4>
                <p style="margin: 10px 0; font-style: italic;">Set characteristic values as needed for this character. No point restrictions apply.</p>
                <hr>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center;">
                    ${Object.entries(characteristics).map(([key, label]) => `
                        <label style="font-weight: bold;">${label}:</label>
                        <input type="number" id="${key}" value="${defaultStats[key]}" min="1" max="20" style="width: 60px; text-align: center;">
                    `).join('')}
                </div>
                <hr>
                <div id="validation-message" style="color: #cc0000; text-align: center; margin: 5px 0; font-weight: bold;"></div>
            </div>
        `;

        const dialog = new Dialog({
            title: "Character Statistics Setup",
            content: content,
            buttons: {
                save: {
                    label: "Save Characteristics",
                    callback: (html) => {
                        const stats = {};
                        let isValid = true;

                        for (let key of Object.keys(characteristics)) {
                            const value = parseInt(html.find(`#${key}`).val()) || 1;
                            stats[key] = Math.max(1, Math.min(20, value)); // Enforce reasonable limits

                            if (stats[key] < 1 || stats[key] > 20) {
                                isValid = false;
                            }
                        }

                        if (!isValid) {
                            ui.notifications.error("Invalid characteristic values! Must be between 1 and 20.");
                            return;
                        }

                        resolve({ stats });
                    }
                },
                cancel: {
                    label: "Cancel",
                    callback: () => resolve(null)
                },
                preset: {
                    label: "Use Preset",
                    callback: () => resolve("preset")
                }
            },
            render: (html) => {
                // Add basic validation
                const updateValidation = () => {
                    let isValid = true;

                    for (let key of Object.keys(characteristics)) {
                        const input = html.find(`#${key}`);
                        const value = parseInt(input.val()) || 1;

                        if (value < 1 || value > 20) {
                            isValid = false;
                            input.css('border', '2px solid #cc0000');
                        } else {
                            input.css('border', '1px solid #cccccc');
                        }
                    }

                    const validationDiv = html.find('#validation-message');

                    if (!isValid) {
                        validationDiv.text('⚠️ Values must be between 1 and 20!');
                    } else {
                        validationDiv.text('✅ Values are valid');
                    }
                };

                // Bind validation to input changes
                html.find('input[type="number"]').on('input change', updateValidation);

                // Initial validation
                updateValidation();
            }
        }, {
            width: 500,
            height: "auto"
        });

        dialog.render(true);
    });

    // Handle dialog result
    if (!setupDialog) {
        ui.notifications.info("Character setup cancelled.");
        return;
    }

    // Handle preset option
    if (setupDialog === "preset") {
        const presetChoice = await new Promise((resolve) => {
            new Dialog({
                title: "Choose Character Preset",
                content: `
                    <div style="padding: 10px;">
                        <h3>Character Presets</h3>
                        <p>Select a character archetype preset:</p>
                        <div style="margin: 10px 0;">
                            <label><input type="radio" name="preset" value="balanced" checked>
                                <strong>Balanced</strong> - All stats at 4</label><br>
                            <label><input type="radio" name="preset" value="warrior">
                                <strong>Warrior</strong> - High Physique, Agilité, moderate others</label><br>
                            <label><input type="radio" name="preset" value="mage">
                                <strong>Mage</strong> - High Esprit, Volonté, moderate others</label><br>
                            <label><input type="radio" name="preset" value="scout">
                                <strong>Scout</strong> - High Agilité, Sens, moderate others</label><br>
                            <label><input type="radio" name="preset" value="social">
                                <strong>Social</strong> - High Charisme, Esprit, moderate others</label>
                        </div>
                    </div>
                `,
                buttons: {
                    apply: {
                        label: "Apply Preset",
                        callback: (html) => {
                            const preset = html.find('input[name="preset"]:checked').val();
                            resolve(preset);
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => resolve(null)
                    }
                }
            }).render(true);
        });

        if (!presetChoice) {
            ui.notifications.info("Preset selection cancelled.");
            return;
        }

        // Apply preset
        let presetStats = {};
        switch (presetChoice) {
            case 'balanced':
                // All stats at 4
                Object.keys(characteristics).forEach(key => presetStats[key] = 4);
                break;
            case 'warrior':
                presetStats = { physique: 6, dexterite: 3, agilite: 5, esprit: 3, sens: 3, volonte: 4, charisme: 2 };
                break;
            case 'mage':
                presetStats = { physique: 2, dexterite: 3, agilite: 3, esprit: 6, sens: 4, volonte: 5, charisme: 3 };
                break;
            case 'scout':
                presetStats = { physique: 3, dexterite: 4, agilite: 6, esprit: 3, sens: 6, volonte: 2, charisme: 2 };
                break;
            case 'social':
                presetStats = { physique: 2, dexterite: 3, agilite: 3, esprit: 5, sens: 4, volonte: 3, charisme: 6 };
                break;
        }

        setupDialog.stats = presetStats;
    }

    // Save characteristics to actor as individual attributes
    try {
        const updateData = {};

        // Create individual attribute entries for each characteristic
        for (let [key, value] of Object.entries(setupDialog.stats)) {
            updateData[`system.attributes.${key}`] = {
                value: value,
                max: "",
                label: characteristics[key],
                dtype: "Number"
            };
        }

        await actor.update(updateData);

        // Create success message with summary
        const statsSummary = Object.entries(characteristics).map(([key, label]) =>
            `${label.split('(')[0].trim()}: ${setupDialog.stats[key]}`
        ).join('<br>');

        const successMessage = `
            <div style="background: #f0f8ff; padding: 10px; border-radius: 5px;">
                <h3>✅ Character Statistics Updated!</h3>
                <p><strong>Character:</strong> ${actor.name}</p>
                <hr>
                <div style="font-family: monospace; font-size: 0.9em;">
                    ${statsSummary}
                </div>
                <hr>
                <p><em>These characteristics are now available for spell macros and can be accessed via:</em></p>
                <code style="background: #eee; padding: 2px 4px;">actor.system.attributes.esprit.value</code> (example for Esprit)
                <br><em>Or they can be edited directly in the character sheet under "Attributes"!</em>
            </div>
        `;

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: successMessage,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });

        ui.notifications.info(`Character statistics saved for ${actor.name}!`);

    } catch (error) {
        console.error("Error saving character statistics:", error);
        ui.notifications.error("Failed to save character statistics. Check console for details.");
    }
})();
