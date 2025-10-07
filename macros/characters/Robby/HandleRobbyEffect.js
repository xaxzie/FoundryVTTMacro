/**
 * Complete Effect Manager - Handle All Effects, Postures, and Injuries for Robby
 *
 * This comprehensive manager handles:
 * - Custom active effects with flags
 * - The 3 postures (Focus, Offensif, Défensif) - mutually exclusive
 * - Injuries system with stackable counter
 * - Dynamic retrieval from CONFIG.statusEffects (FoundryVTT v13)
 *
 * Features:
 * - Unified interface for all effect types
 * - Posture management (only one active at a time)
 * - Injury stacking with configurable amounts
 * - Integration with FoundryVTT's status effect system
 */

(async () => {
    // === ACTOR VALIDATION ===
    const actor = canvas.tokens.controlled[0]?.actor;

    if (!actor) {
        ui.notifications.warn("⚠️ Sélectionnez un token !");
        return;
    }

    // === CONFIGURATION ===

    // Custom Active Effects with Flags for Robby
    const CUSTOM_EFFECTS = {
        "Excalibur": {
            name: "Excalibur",
            icon: "icons/weapons/daggers/knife-kitchen-red.webp",
            flags: [],
            description: "Épée légendaire invoquée (Coût: 3 mana)",
            category: "custom",
            increasable: false,
            manaCost: 3
        }
        // TODO: Add more Robby's specific effects here if needed
    };

    // === DYNAMIC STATUS EFFECTS FROM CONFIG ===
    const getConfigStatusEffects = () => {
        const configEffects = {
            postures: {},
            injuries: {},
            other: {}
        };

        // Get status effects from FoundryVTT CONFIG
        if (CONFIG.statusEffects && Array.isArray(CONFIG.statusEffects)) {
            for (const effect of CONFIG.statusEffects) {
                if (effect.id && (effect.name || effect.label)) {
                    const effectId = effect.id.toLowerCase();

                    // Categorize postures - store the EXACT CONFIG object
                    if (['focus', 'offensif', 'defensif'].includes(effectId)) {
                        configEffects.postures[effect.id] = {
                            ...effect, // Copy the exact CONFIG object
                            category: "posture",
                            description: `Position ${effect.name || effect.label || effect.id}`
                        };
                    }
                    // Categorize injuries - store the EXACT CONFIG object
                    else if (['blessures', 'blessure', 'injury', 'injuries'].includes(effectId)) {
                        configEffects.injuries[effect.id] = {
                            ...effect, // Copy the exact CONFIG object
                            category: "injury",
                            description: `Système de blessures: ${effect.name || effect.label || effect.id}`
                        };
                    }
                    // Other status effects - store the EXACT CONFIG object
                    else {
                        configEffects.other[effect.id] = {
                            ...effect, // Copy the exact CONFIG object
                            category: "status",
                            description: `Effet de statut: ${effect.name || effect.label || effect.id}`
                        };
                    }
                }
            }
        }

        return configEffects;
    };

    const configStatusEffects = getConfigStatusEffects();
    const POSTURES = configStatusEffects.postures;
    const INJURY_EFFECTS = configStatusEffects.injuries;

    // === CURRENT STATE DETECTION ===
    const getCurrentState = () => {
        const state = {
            customEffects: {},
            currentPosture: null,
            injuryCount: 0,
            statusEffects: {}
        };

        // Check custom effects
        for (const [key, effectData] of Object.entries(CUSTOM_EFFECTS)) {
            const existingEffect = actor.effects.find(e => e.name === effectData.name);
            state.customEffects[key] = existingEffect || null;
        }

        // Check postures (mutually exclusive)
        for (const [key, postureData] of Object.entries(POSTURES)) {
            const existingPosture = actor.effects.find(e =>
                e.statuses?.has(postureData.id) ||
                e.name.toLowerCase() === (postureData.name || postureData.label).toLowerCase()
            );
            if (existingPosture) {
                state.currentPosture = key;
                break;
            }
        }

        // Check injuries from CONFIG
        state.injuries = {};
        for (const [key, injuryData] of Object.entries(INJURY_EFFECTS)) {
            const existingInjury = actor.effects.find(e =>
                e.statuses?.has(injuryData.id) ||
                e.name.toLowerCase() === (injuryData.name || injuryData.label).toLowerCase()
            );
            if (existingInjury) {
                state.injuries[key] = existingInjury;
                state.injuryCount += existingInjury.flags?.statuscounter?.value || 1;
            } else {
                state.injuries[key] = null;
            }
        }

        // Check other config status effects
        for (const [key, effectData] of Object.entries(configStatusEffects.other)) {
            const existingEffect = actor.effects.find(e =>
                e.statuses?.has(effectData.id) ||
                e.name === (effectData.name || effectData.label)
            );
            state.statusEffects[key] = existingEffect || null;
        }

        return state;
    };

    const currentState = getCurrentState();

    // === DETECT CUSTOM OUTSIDE EFFECTS ===
    const getCustomOutsideEffects = () => {
        const outsideEffects = [];
        const knownEffectNames = new Set();

        // Collect all known effect names
        Object.values(CUSTOM_EFFECTS).forEach(effect => knownEffectNames.add(effect.name.toLowerCase()));
        Object.values(POSTURES).forEach(effect => knownEffectNames.add((effect.name || effect.label).toLowerCase()));
        Object.values(INJURY_EFFECTS).forEach(effect => knownEffectNames.add((effect.name || effect.label).toLowerCase()));
        Object.values(configStatusEffects.other).forEach(effect => knownEffectNames.add((effect.name || effect.label).toLowerCase()));

        // Find effects on actor that aren't in our known effects
        for (const effect of actor.effects.contents) {
            const effectName = effect.name.toLowerCase();
            if (!knownEffectNames.has(effectName)) {
                outsideEffects.push(effect);
            }
        }

        return outsideEffects;
    };

    const outsideEffects = getCustomOutsideEffects();

    // === BUILD DIALOG CONTENT ===
    let dialogContent = `
        <h3>🩸 Gestionnaire Complet d'Effets - Robby</h3>
        <p><strong>Token:</strong> ${actor.name}</p>
        <style>
            .effect-section { margin: 20px 0; padding: 15px; border: 2px solid #ccc; border-radius: 8px; }
            .effect-item { margin: 8px 0; padding: 12px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; }
            .effect-icon { width: 24px; height: 24px; margin-right: 10px; background-size: cover; background-position: center; border-radius: 4px; display: inline-block; }
            .effect-icon[data-is-svg="true"] { background-color: #444; border-radius: 4px; }
            .status-indicator { font-weight: bold; margin-left: 10px; }
            .button-group { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
            .btn { padding: 6px 12px; border: none; border-radius: 4px; font-size: 0.9em; cursor: pointer; }
            .btn-add { background: #4caf50; color: white; }
            .btn-remove { background: #f44336; color: white; }
            .btn-disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
            .pending-change { box-shadow: 0 0 5px #2196f3 !important; }
        </style>
    `;

    let pendingChanges = {};

    // === CUSTOM OUTSIDE EFFECTS SECTION ===
    if (outsideEffects.length > 0) {
        dialogContent += `
            <div class="effect-section" style="border-color: #ff5722;">
                <h4>🔍 Effets Externes Détectés</h4>
                <p style="margin: 8px 0; font-size: 0.9em; color: #666;">Effets présents sur le token mais non configurés dans ce gestionnaire</p>
        `;

        for (const effect of outsideEffects) {
            const effectIcon = effect.icon || effect.img || 'icons/svg/mystery-man.svg';
            const isSvg = effectIcon.toLowerCase().endsWith('.svg');

            // Try to get duration info
            let durationInfo = '';
            if (effect.duration?.seconds) {
                const remaining = effect.duration.remaining || effect.duration.seconds;
                const rounds = Math.ceil(remaining / 6); // Assuming 6 seconds per round
                durationInfo = ` (${rounds} rounds restants)`;
            } else if (effect.duration?.rounds) {
                durationInfo = ` (${effect.duration.rounds} rounds)`;
            }

            dialogContent += `
                <div class="effect-item" style="border-left: 4px solid #ff5722;">
                    <div style="display: flex; align-items: center;">
                        <div class="effect-icon" ${isSvg ? 'data-is-svg="true"' : ''} style="background-image: url('${effectIcon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effect.name}</strong>${durationInfo}
                            <br><small style="color: #666;">Effet externe non géré par ce système</small>
                        </div>
                        <div class="status-indicator" style="color: #ff5722;">
                            ⚠️ EXTERNE
                        </div>
                    </div>
                </div>
            `;
        }
        dialogContent += `</div>`;
    }

    // === CUSTOM EFFECTS SECTION ===
    dialogContent += `
        <div class="effect-section" style="border-color: #4caf50;">
            <h4>🩸 Effets Personnalisés de Robby</h4>
    `;

    if (Object.keys(CUSTOM_EFFECTS).length === 0) {
        dialogContent += `
            <div class="effect-item" style="text-align: center; color: #666; font-style: italic;">
                Aucun effet personnalisé configuré pour le moment.
                <br><small>Les effets de Robby seront ajoutés ici ultérieurement.</small>
            </div>
        `;
    } else {
        for (const [key, effectData] of Object.entries(CUSTOM_EFFECTS)) {
            const existingEffect = currentState.customEffects[key];
            const isActive = existingEffect !== null;
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? "ACTIF" : "INACTIF";
            const statusColor = isActive ? "#2e7d32" : "#d32f2f";
            const isSvg = effectData.icon.toLowerCase().endsWith('.svg');

            // Build bonus display like Leo's system
            const bonusDisplay = effectData.flags.length > 0 ?
                effectData.flags.map(flag => {
                    const sign = flag.value >= 0 ? '+' : '';
                    return `${sign}${flag.value}`;
                }).join(', ') : '';

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-src="${effectData.icon}" data-is-svg="${isSvg}" style="background-image: url(${effectData.icon});"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effectData.name}</strong>${bonusDisplay ? ` (${bonusDisplay})` : ''}
                            <br><small style="color: #666;">${effectData.description}</small>
                        </div>
                        <div class="status-indicator status-${key}" style="color: ${statusColor};">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
                    <div class="button-group">
                        ${isActive ?
                    `<button type="button" class="btn btn-remove" data-action="remove" data-effect="${key}" data-category="custom">
                                ➖ Supprimer
                            </button>` :
                    `<button type="button" class="btn btn-add" data-action="add" data-effect="${key}" data-category="custom">
                                ➕ Ajouter
                            </button>`
                }
                    </div>
                </div>
            `;
        }
    }
    dialogContent += `</div>`;

    // === POSTURES SECTION ===
    dialogContent += `
        <div class="effect-section" style="border-color: #ff9800;">
            <h4>⚔️ Postures (Une seule active)</h4>
    `;

    // Add "No Posture" option
    const hasAnyPosture = currentState.currentPosture !== null;
    const noPostureIcon = !hasAnyPosture ? "✅" : "❌";
    const noPostureText = !hasAnyPosture ? "ACTIVE" : "INACTIVE";
    const noPostureColor = !hasAnyPosture ? "#2e7d32" : "#d32f2f";

    dialogContent += `
        <div class="effect-item">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <div class="effect-icon" data-is-svg="true" style="background-image: url('icons/svg/cancel.svg');"></div>
                <div style="flex-grow: 1;">
                    <strong>Aucune Posture</strong>
                    <br><small style="color: #666;">Supprimer toutes les postures actives</small>
                </div>
                <div class="status-indicator status-noposture" style="color: ${noPostureColor};">
                    ${noPostureIcon} ${noPostureText}
                </div>
            </div>
            <div class="button-group">
                <button type="button" class="btn btn-remove" data-action="removePostures" data-effect="noposture" data-category="posture" ${!hasAnyPosture ? 'disabled' : ''}>
                    🚫 Supprimer Postures
                </button>
            </div>
        </div>
    `;

    for (const [key, postureData] of Object.entries(POSTURES)) {
        const isActive = currentState.currentPosture === key;
        const statusIcon = isActive ? "✅" : "❌";
        const statusText = isActive ? "ACTIVE" : "INACTIVE";
        const statusColor = isActive ? "#2e7d32" : "#d32f2f";
        const postureIcon = postureData.icon || postureData.img;
        const isSvg = postureIcon && postureIcon.toLowerCase().endsWith('.svg');

        dialogContent += `
            <div class="effect-item">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div class="effect-icon" data-src="${postureIcon}" data-is-svg="${isSvg}" style="background-image: url(${postureIcon});"></div>
                    <div style="flex-grow: 1;">
                        <strong>${postureData.name || postureData.label}</strong>
                        <br><small style="color: #666;">${postureData.description}</small>
                    </div>
                    <div class="status-indicator status-${key}" style="color: ${statusColor};">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="btn btn-add" data-action="setPosture" data-effect="${key}" data-category="posture" ${isActive ? 'disabled' : ''}>
                        ⚔️ Activer
                    </button>
                </div>
            </div>
        `;
    }
    dialogContent += `</div>`;

    // === INJURIES SECTION ===
    if (Object.keys(INJURY_EFFECTS).length > 0) {
        dialogContent += `
            <div class="effect-section" style="border-color: #f44336;">
                <h4>🩹 Système de Blessures</h4>
        `;

        for (const [key, injuryData] of Object.entries(INJURY_EFFECTS)) {
            const existingInjury = currentState.injuries[key];
            const isActive = existingInjury !== null;
            const currentStacks = existingInjury?.flags?.statuscounter?.value || 0;
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? `ACTIF (${currentStacks})` : "INACTIF";
            const statusColor = isActive ? "#d32f2f" : "#666";
            const injuryIcon = injuryData.icon || injuryData.img;
            const isSvg = injuryIcon && injuryIcon.toLowerCase().endsWith('.svg');

            dialogContent += `
                <div class="effect-item ${pendingChanges[key] ? 'pending-change' : ''}">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" ${isSvg ? 'data-is-svg="true"' : ''} style="background-image: url('${injuryIcon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${injuryData.name || injuryData.label}</strong>
                            <br><small style="color: #666;">${injuryData.description}</small>
                        </div>
                        <div class="status-indicator status-${key}" style="color: ${statusColor};">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
                    <div class="button-group">
                        <label style="margin-right: 10px;">Nombre:</label>
                        <input type="number" id="injury-${key}" min="0" max="20" value="${currentStacks}" style="width: 60px; margin-right: 10px;">
                        <button type="button" class="btn btn-add" data-action="setInjury" data-effect="${key}" data-category="injury">
                            🩹 Appliquer
                        </button>
                        <button type="button" class="btn btn-remove" data-action="remove" data-effect="${key}" data-category="injury" ${!isActive ? 'disabled' : ''}>
                            ➖ Supprimer
                        </button>
                    </div>
                </div>
            `;
        }

        dialogContent += `</div>`;
    }

    // === STATUS EFFECTS SECTION ===
    if (Object.keys(configStatusEffects.other).length > 0) {
        dialogContent += `
            <div class="effect-section" style="border-color: #9c27b0;">
                <h4>🎭 Autres Effets de Statut</h4>
        `;

        for (const [key, effectData] of Object.entries(configStatusEffects.other)) {
            const existingEffect = currentState.statusEffects[key];
            const isActive = existingEffect !== null;
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? "ACTIF" : "INACTIF";
            const statusColor = isActive ? "#2e7d32" : "#d32f2f";
            const effectIcon = effectData.icon || effectData.img;
            const isSvg = effectIcon && effectIcon.toLowerCase().endsWith('.svg');

            dialogContent += `
                <div class="effect-item ${pendingChanges[key] ? 'pending-change' : ''}">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" ${isSvg ? 'data-is-svg="true"' : ''} style="background-image: url('${effectIcon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effectData.name || effectData.label}</strong>
                            <br><small style="color: #666;">${effectData.description}</small>
                        </div>
                        <div class="status-indicator status-${key}" style="color: ${statusColor};">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="button" class="btn btn-add" data-action="add" data-effect="${key}" data-category="status" ${isActive ? 'disabled' : ''}>
                            ➕ Ajouter
                        </button>
                        <button type="button" class="btn btn-remove" data-action="remove" data-effect="${key}" data-category="status" ${!isActive ? 'disabled' : ''}>
                            ➖ Supprimer
                        </button>
                    </div>
                </div>
            `;
        }

        dialogContent += `</div>`;
    }

    // === DIALOG CREATION ===
    const result = await new Promise((resolve) => {
        new Dialog({
            title: "🩸 Gestionnaire d'Effets - Robby",
            content: dialogContent,
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: "💾 Sauvegarder",
                    callback: (html) => {
                        const injuryValues = {};
                        for (const key of Object.keys(INJURY_EFFECTS)) {
                            const input = html.find(`#injury-${key}`);
                            if (input.length) {
                                injuryValues[key] = parseInt(input.val()) || 0;
                            }
                        }
                        resolve({ pendingChanges, injuryValues });
                    }
                },
                removeAll: {
                    icon: '<i class="fas fa-trash-alt"></i>',
                    label: "🗑️ Supprimer Tout",
                    callback: () => resolve({ action: "removeAll" })
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "save",
            render: (html) => {
                // Styling
                html.find('.dialog-content').css({
                    'max-height': '80vh',
                    'overflow-y': 'auto',
                    'width': '600px'
                });

                // Button click handlers
                html.find('button[data-action]').click(function () {
                    const action = $(this).data('action');
                    const effectKey = $(this).data('effect');
                    const category = $(this).data('category');

                    if (action === 'setInjury') {
                        // Handle injury setting directly
                        return;
                    }

                    // Handle other effects
                    const isAlreadySelected = $(this).hasClass('pending-change');
                    const statusDiv = $(this).closest('.effect-item').find('.status-indicator');

                    if (isAlreadySelected) {
                        // Cancel pending change
                        delete pendingChanges[effectKey];
                        $(this).removeClass('pending-change');

                        // Reset status display
                        const originalState = category === 'posture' ?
                            (currentState.currentPosture === effectKey) :
                            (category === 'custom' ? currentState.customEffects[effectKey] !== null : currentState.statusEffects[effectKey] !== null);

                        const originalIcon = originalState ? "✅" : "❌";
                        const originalText = originalState ? "ACTIF" : "INACTIF";
                        const originalColor = originalState ? "#2e7d32" : "#d32f2f";
                        statusDiv.html(`${originalIcon} ${originalText}`).css('color', originalColor);
                    } else {
                        // Set pending change
                        pendingChanges[effectKey] = { action, category };

                        // Clear other buttons in this group
                        $(this).closest('.button-group').find('button').removeClass('pending-change');
                        $(this).addClass('pending-change');

                        // Update status display
                        let pendingText = '';
                        switch (action) {
                            case 'add': pendingText = '⏳ AJOUT EN ATTENTE'; break;
                            case 'remove': pendingText = '⏳ SUPPRESSION EN ATTENTE'; break;
                            case 'setPosture': pendingText = '⏳ ACTIVATION EN ATTENTE'; break;
                            case 'removePostures': pendingText = '⏳ SUPPRESSION EN ATTENTE'; break;
                            case 'removeExternal': pendingText = '⏳ SUPPRESSION EN ATTENTE'; break;
                        }
                        statusDiv.html(`<strong style="color: #2196f3;">${pendingText}</strong>`);
                    }
                });
            },
            close: () => resolve(null)
        }, {
            width: 600,
            height: 800,
            resizable: true
        }).render(true);
    });

    if (!result) {
        ui.notifications.info("❌ Opération annulée.");
        return;
    }

    // === HANDLE REMOVE ALL ===
    if (result.action === "removeAll") {
        console.log("[DEBUG] Removing all effects from actor");

        for (const effect of [...actor.effects.contents]) {
            try {
                await effect.delete();
                console.log(`[DEBUG] Removed effect: ${effect.name}`);
            } catch (error) {
                console.error(`[DEBUG] Failed to remove effect ${effect.name}:`, error);
            }
        }

        ui.notifications.info("🧹 Tous les effets ont été supprimés !");
        return;
    }

    // === PROCESS CHANGES ===
    const { pendingChanges: changes, injuryValues } = result;

    try {
        let addedEffects = [];
        let removedEffects = [];
        let modifiedEffects = [];

        // Process each pending change
        for (const [effectKey, changeData] of Object.entries(changes)) {
            const { action, category, value } = changeData;

            if (action === 'removePostures') {
                // Remove all postures
                for (const effect of actor.effects.contents) {
                    const isPosture = Object.values(POSTURES).some(p =>
                        effect.statuses?.has(p.id) ||
                        effect.name.toLowerCase() === (p.name || p.label).toLowerCase()
                    );
                    if (isPosture) {
                        await effect.delete();
                        removedEffects.push(effect.name);
                    }
                }
            } else if (action === 'add') {
                if (category === 'custom') {
                    const effectData = CUSTOM_EFFECTS[effectKey];
                    if (!effectData) continue;

                    const flagsObject = {};
                    effectData.flags.forEach(flag => {
                        flagsObject[`world.${flag.key}`] = flag.value;
                    });

                    const effectConfig = {
                        name: effectData.name,
                        icon: effectData.icon,
                        origin: actor.uuid,
                        duration: { seconds: 86400 }, // 24 hours default duration
                        flags: flagsObject
                    };

                    await actor.createEmbeddedDocuments("ActiveEffect", [effectConfig]);
                    addedEffects.push(effectData.name);



                } else if (category === 'status') {
                    const statusData = configStatusEffects.other[effectKey];
                    if (statusData) {
                        const effectConfig = {
                            name: statusData.name || statusData.label,
                            icon: statusData.icon || statusData.img,
                            origin: actor.uuid,
                            duration: { seconds: 86400 }, // 24 hours default duration
                            statuses: [statusData.id]
                        };

                        await actor.createEmbeddedDocuments("ActiveEffect", [effectConfig]);
                        addedEffects.push(statusData.name || statusData.label);
                    }
                }

            } else if (action === 'remove') {
                if (category === 'custom') {
                    const effectData = CUSTOM_EFFECTS[effectKey];
                    if (!effectData) continue;

                    const existingEffect = actor.effects.find(e => e.name === effectData.name);
                    if (existingEffect) {
                        await existingEffect.delete();
                        removedEffects.push(effectData.name);
                    }

                } else if (category === 'injury') {
                    const injuryData = INJURY_EFFECTS[effectKey];
                    if (!injuryData) continue;

                    const existingEffect = actor.effects.find(e =>
                        e.statuses?.has(injuryData.id) ||
                        e.name.toLowerCase() === (injuryData.name || injuryData.label).toLowerCase()
                    );
                    if (existingEffect) {
                        await existingEffect.delete();
                        removedEffects.push(injuryData.name || injuryData.label);
                    }

                } else if (category === 'status') {
                    const statusData = configStatusEffects.other[effectKey];
                    if (!statusData) continue;

                    const existingEffect = actor.effects.find(e =>
                        e.statuses?.has(statusData.id) ||
                        e.name === (statusData.name || statusData.label)
                    );
                    if (existingEffect) {
                        await existingEffect.delete();
                        removedEffects.push(statusData.name || statusData.label);
                    }
                }

            } else if (action === 'setPosture') {
                // Remove all existing postures first
                for (const effect of actor.effects.contents) {
                    const isPosture = Object.values(POSTURES).some(p =>
                        effect.statuses?.has(p.id) ||
                        effect.name.toLowerCase() === (p.name || p.label).toLowerCase()
                    );
                    if (isPosture) {
                        await effect.delete();
                    }
                }

                // Add the new posture
                const postureData = POSTURES[effectKey];
                if (postureData) {
                    const effectConfig = {
                        name: postureData.name || postureData.label,
                        icon: postureData.icon || postureData.img,
                        origin: actor.uuid,
                        duration: { seconds: 86400 }, // 24 hours default duration
                        statuses: [postureData.id]
                    };

                    await actor.createEmbeddedDocuments("ActiveEffect", [effectConfig]);
                    addedEffects.push(postureData.name || postureData.label);
                }

            } else if (action === 'setInjury') {
                const injuryData = INJURY_EFFECTS[effectKey];
                if (!injuryData) continue;

                const existingEffect = actor.effects.find(e =>
                    e.statuses?.has(injuryData.id) ||
                    e.name.toLowerCase() === (injuryData.name || injuryData.label).toLowerCase()
                );

                if (value > 0) {
                    if (existingEffect) {
                        // Update existing
                        await existingEffect.update({
                            "flags.statuscounter.value": value
                        });
                        modifiedEffects.push(`${injuryData.name || injuryData.label} (${value})`);
                    } else {
                        // Create new
                        const effectConfig = {
                            name: injuryData.name || injuryData.label,
                            icon: injuryData.icon || injuryData.img,
                            statuses: [injuryData.id],
                            flags: {
                                statuscounter: {
                                    value: value
                                }
                            }
                        };

                        await actor.createEmbeddedDocuments("ActiveEffect", [effectConfig]);
                        addedEffects.push(`${injuryData.name || injuryData.label} (${value})`);
                    }
                } else if (existingEffect) {
                    // Remove if value is 0
                    await existingEffect.delete();
                    removedEffects.push(injuryData.name || injuryData.label);
                }
            }
        }

        // Build success message
        let message = "🩸 Effets de Robby mis à jour !\n";
        if (addedEffects.length > 0) {
            message += `✅ Ajoutés: ${addedEffects.join(', ')}\n`;
        }
        if (modifiedEffects.length > 0) {
            message += `🔄 Modifiés: ${modifiedEffects.join(', ')}\n`;
        }
        if (removedEffects.length > 0) {
            message += `❌ Supprimés: ${removedEffects.join(', ')}`;
        }

        ui.notifications.info(message);

    } catch (error) {
        console.error("[DEBUG] Error processing effect changes:", error);
        ui.notifications.error("❌ Erreur lors de l'application des effets !");
    }
})();
