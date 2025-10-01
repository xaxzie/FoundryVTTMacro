/**
 * Multi-Effect Manager - Add/Remove Multiple Effects with Selector
 *
 * Features:
 * - Add or remove multiple effects simultaneously
 * - Save button for batch operations
 * - Easily extensible for new effects
 * - Shows current status of each effect
 */

(async () => {
    // === CONFIGURATION ===
    const AVAILABLE_EFFECTS = {
        "Red Eyes": {
            name: "Red Eyes",
            icon: "icons/creatures/eyes/humanoid-single-red-brown.webp",
            flags: [
                { key: "agilite", value: 1 },
                { key: "damage", value: 2 }
            ],
            description: "Bonus de +2 aux dégâts, +1 Agilité"
        },
        "Serpent": {
            name: "Serpent",
            icon: "icons/creatures/reptiles/snake-fangs-bite-green.webp",
            flags: [
                { key: "damage", value: 4 }
            ],
            description: "Bonus de +4 aux dégâts"
        },
        "Ora Eyes": {
            name: "Ora Eyes",
            icon: "icons/svg/eye.svg",
            flags: [
                { key: "damage", value: 3 }
            ],
            description: "Bonus de +3 aux dégâts"
        },
        "Electrical Armor": {
            name: "Electrical Armor",
            icon: "icons/magic/lightning/bolt-strike-blue.webp",
            flags: [
                { key: "agilite", value: -3 },
                { key: "physique", value: 1 }
            ],
            description: "Agilité -3, Physique +1"
        },
        "Bow": {
            name: "Bow",
            icon: "icons/weapons/bows/shortbow-recurve-yellow.webp",
            flags: [
                { key: "agilite", value: -3 }
            ],
            description: "Agilité -3"
        }
    };

    const actor = canvas.tokens.controlled[0]?.actor;

    if (!actor) {
        ui.notifications.warn("⚠️ Sélectionnez un token !");
        return;
    }

    // Check current status of all effects
    const currentEffects = {};
    for (const [key, effectData] of Object.entries(AVAILABLE_EFFECTS)) {
        const existingEffect = actor.effects.find(e => e.name === effectData.name);
        currentEffects[key] = existingEffect ? existingEffect : null;
    }

    // Build dialog content
    let dialogContent = `
        <h3>🎭 Gestionnaire d'Effets</h3>
        <p><strong>Token:</strong> ${actor.name}</p>
        <div style="margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
            <h4>Gérez vos effets individuellement:</h4>
    `;

    for (const [key, effectData] of Object.entries(AVAILABLE_EFFECTS)) {
        const isActive = currentEffects[key] !== null;
        const statusIcon = isActive ? "✅" : "❌";
        const statusText = isActive ? "ACTIF" : "INACTIF";
        const statusColor = isActive ? "#2e7d32" : "#d32f2f";

        // Button styling based on current state
        const addButtonStyle = isActive ?
            "background: #e0e0e0; color: #999; cursor: not-allowed;" :
            "background: #4caf50; color: white; cursor: pointer;";
        const removeButtonStyle = !isActive ?
            "background: #e0e0e0; color: #999; cursor: not-allowed;" :
            "background: #f44336; color: white; cursor: pointer;";

        // Generate bonus display from flags
        const bonusDisplay = effectData.flags.map(flag => {
            const sign = flag.value >= 0 ? '+' : '';
            return `${sign}${flag.value}`;
        }).join(', ');

        dialogContent += `
            <div style="margin: 8px 0; padding: 12px; border: 1px solid #ccc; border-radius: 4px; background: #f5f5f5;">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div class="effect-icon" data-src="${effectData.icon}"
                    style="width: 24px; height: 24px; margin-right: 10px; background-size: cover; background-position: center; border-radius: 4px;">
                </div>
                    <div style="flex-grow: 1;">
                        <strong>${effectData.name}</strong> (${bonusDisplay})
                        <br><small style="color: #666;">${effectData.description}</small>
                    </div>
                    <div style="margin-left: 10px; font-weight: bold; color: ${statusColor};">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button type="button" data-action="add" data-effect="${key}"
                            style="padding: 6px 12px; border: none; border-radius: 4px; font-size: 0.9em; ${addButtonStyle}"
                            ${isActive ? 'disabled' : ''}>
                        ➕ Ajouter
                    </button>
                    <button type="button" data-action="remove" data-effect="${key}"
                            style="padding: 6px 12px; border: none; border-radius: 4px; font-size: 0.9em; ${removeButtonStyle}"
                            ${!isActive ? 'disabled' : ''}>
                        ➖ Supprimer
                    </button>
                </div>
            </div>
        `;
    }

    dialogContent += `
        </div>
    `;

    // Track pending changes
    let pendingChanges = {};

    // Create dialog
    const result = await new Promise((resolve) => {
        new Dialog({
            title: "🎭 Gestionnaire d'Effets",
            content: dialogContent,
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: "💾 Sauvegarder",
                    callback: () => {
                        resolve({ pendingChanges });
                    }
                },
                removeAll: {
                    icon: '<i class="fas fa-trash-alt"></i>',
                    label: "🗑️ Supprimer Tout",
                    callback: () => {
                        resolve({ action: "removeAll" });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "save",
            render: (html) => {
                // Add some styling
                html.find('.dialog-content').css({
                    'max-height': '600px',
                    'overflow-y': 'auto'
                });

                // Populate icons (use background-image to avoid SVG sanitization issues)
                html.find('.effect-icon').each(function() {
                    const src = $(this).data('src');
                    if (src) {
                        $(this).css('background-image', `url(${src})`);
                    }
                });

                // Handle individual effect button clicks
                html.find('button[data-action]').click(function() {
                    const action = $(this).data('action');
                    const effectKey = $(this).data('effect');
                    const effectData = AVAILABLE_EFFECTS[effectKey];
                    const isActive = currentEffects[effectKey] !== null;

                    // Update button visual feedback
                    const buttonContainer = $(this).parent();
                    const statusDiv = $(this).closest('.dialog-content').find(`button[data-effect="${effectKey}"]`).closest('div').find('div:last-child');

                    // Check if this button is already selected (pending change)
                    const isAlreadySelected = $(this).hasClass('pending-change');

                    if (isAlreadySelected) {
                        // Cancel the pending change
                        delete pendingChanges[effectKey];

                        // Reset visual feedback
                        buttonContainer.find('button').removeClass('pending-change');
                        buttonContainer.find('button').css('box-shadow', '');

                        // Restore original status
                        const originalStatusIcon = isActive ? "✅" : "❌";
                        const originalStatusText = isActive ? "ACTIF" : "INACTIF";
                        const originalStatusColor = isActive ? "#2e7d32" : "#d32f2f";
                        statusDiv.html(`<strong style="color: ${originalStatusColor};">${originalStatusIcon} ${originalStatusText}</strong>`);
                    } else {
                        // Track the pending change
                        pendingChanges[effectKey] = action;

                        // Reset all buttons for this effect
                        buttonContainer.find('button').removeClass('pending-change');
                        buttonContainer.find('button').css('box-shadow', '');

                        // Highlight the selected action
                        $(this).addClass('pending-change');
                        $(this).css('box-shadow', '0 0 5px #2196f3');

                        // Show pending status
                        if (action === 'add') {
                            statusDiv.html('<strong style="color: #2196f3;">📝 À AJOUTER</strong>');
                        } else if (action === 'remove') {
                            statusDiv.html('<strong style="color: #2196f3;">📝 À SUPPRIMER</strong>');
                        }
                    }
                });
            }
        }).render(true);
    });

    if (!result) {
        ui.notifications.info("Opération annulée.");
        return;
    }

    // Handle "Remove All" action separately (perform immediately without additional confirmation)
    if (result.action === "removeAll") {
        const activeEffects = Object.values(currentEffects).filter(effect => effect !== null);

        if (activeEffects.length === 0) {
            ui.notifications.info("Aucun effet actif à supprimer.");
            return;
        }

        // Remove all active effects immediately
        try {
            const effectIds = activeEffects.map(effect => effect.id);
            await actor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
            ui.notifications.info(`🗑️ Tous les effets supprimés ! (${activeEffects.length})`);
        } catch (error) {
            console.error("Erreur lors de la suppression des effets:", error);
            ui.notifications.error("❌ Erreur lors de la suppression des effets !");
        }

        return;
    }

    const { pendingChanges: selectedChanges } = result;

    if (!selectedChanges || Object.keys(selectedChanges).length === 0) {
        ui.notifications.info("Aucun changement sélectionné.");
        return;
    }

    // Process the pending changes
    const effectsToAdd = [];
    const effectsToRemove = [];
    const operationLog = [];

    for (const [effectKey, action] of Object.entries(selectedChanges)) {
        const effectData = AVAILABLE_EFFECTS[effectKey];
        const existingEffect = currentEffects[effectKey];

        switch (action) {
            case 'add':
                if (!existingEffect) {
                    // Build flags object from the flags array
                    const flagsObject = {};
                    effectData.flags.forEach(flag => {
                        flagsObject[flag.key] = { value: flag.value };
                    });

                    effectsToAdd.push({
                        name: effectData.name,
                        icon: effectData.icon,
                        origin: actor.uuid,
                        duration: { seconds: 86400 }, // 24 hours default
                        flags: flagsObject
                    });

                    // Generate bonus display for log
                    const bonusDisplay = effectData.flags.map(flag => {
                        const sign = flag.value >= 0 ? '+' : '';
                        return `${sign}${flag.value}`;
                    }).join(', ');
                    operationLog.push(`✅ ${effectData.name} activé (${bonusDisplay})`);
                } else {
                    operationLog.push(`⚠️ ${effectData.name} déjà actif`);
                }
                break;

            case 'remove':
                if (existingEffect) {
                    effectsToRemove.push(existingEffect.id);
                    operationLog.push(`❌ ${effectData.name} désactivé`);
                } else {
                    operationLog.push(`⚠️ ${effectData.name} déjà inactif`);
                }
                break;
        }
    }

    // Execute the operations
    try {
        if (effectsToAdd.length > 0) {
            await actor.createEmbeddedDocuments("ActiveEffect", effectsToAdd);
        }
        if (effectsToRemove.length > 0) {
            await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToRemove);
        }

        // Show results
        if (operationLog.length > 0) {
            const changeCount = Object.keys(selectedChanges).length;
            ui.notifications.info(`🎭 Modifications appliquées ! (${changeCount} changement${changeCount > 1 ? 's' : ''})`);
        } else {
            ui.notifications.info("Aucune modification nécessaire.");
        }

    } catch (error) {
        console.error("Erreur lors de la modification des effets:", error);
        ui.notifications.error("❌ Erreur lors de la modification des effets !");
    }
})();
