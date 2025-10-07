/**
 * Complete Effect Manager - Handle All Effects, Postures, and Injuries
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

    // Custom Active Effects with Flags
    const CUSTOM_EFFECTS = {
        "Red Eyes": {
            name: "Red Eyes",
            icon: "icons/creatures/eyes/humanoid-single-red-brown.webp",
            flags: [
                { key: "agilite", value: 1 },
                { key: "damage", value: 2 }
            ],
            description: "Bonus de +2 aux dégâts, +1 Agilité",
            category: "custom",
            increasable: false
        },
        "Serpent": {
            name: "Serpent",
            icon: "icons/creatures/reptiles/snake-fangs-bite-green.webp",
            flags: [
                { key: "damage", value: 4 }
            ],
            description: "Bonus de +4 aux dégâts",
            category: "custom",
            increasable: false
        },
        "Ora Eyes": {
            name: "Ora Eyes",
            icon: "icons/svg/eye.svg",
            flags: [
                { key: "damage", value: 3 }
            ],
            description: "Bonus de +3 aux dégâts",
            category: "custom",
            increasable: false
        },
        "Electrical Armor": {
            name: "Electrical Armor",
            icon: "icons/magic/lightning/bolt-strike-blue.webp",
            flags: [
                { key: "agilite", value: -3 },
                { key: "physique", value: 1 }
            ],
            description: "Agilité -3, Physique +1",
            category: "custom",
            increasable: false
        },
        "Bow": {
            name: "Bow",
            icon: "icons/weapons/bows/shortbow-recurve-yellow.webp",
            flags: [
                { key: "agilite", value: -3 }
            ],
            description: "Agilité -3",
            category: "custom",
            increasable: false
        }
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
    const INJURY_EFFECTS = configStatusEffects.injuries;    // === CURRENT STATE DETECTION ===
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
        }        // Check other config status effects
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
        <h3>🎭 Gestionnaire Complet d'Effets</h3>
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
                const hours = Math.floor(effect.duration.seconds / 3600);
                const minutes = Math.floor((effect.duration.seconds % 3600) / 60);
                if (hours > 0) durationInfo = ` (${hours}h${minutes > 0 ? ` ${minutes}m` : ''})`;
                else if (minutes > 0) durationInfo = ` (${minutes}m)`;
                else durationInfo = ` (${effect.duration.seconds}s)`;
            } else if (effect.duration?.rounds) {
                durationInfo = ` (${effect.duration.rounds} rounds)`;
            }

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url(${effectIcon});"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effect.name}</strong>${durationInfo}
                            <br><small style="color: #666;">Origine: ${effect.origin || 'Inconnue'}</small>
                        </div>
                        <div class="status-indicator" style="color: #ff5722;">
                            🔍 EXTERNE
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="button" class="btn btn-remove" data-action="removeExternal" data-effect="${effect.id}" data-category="external">
                            🗑️ Supprimer
                        </button>
                    </div>
                </div>
            `;
        }
        dialogContent += `</div>`;
    }

    // === CUSTOM EFFECTS SECTION ===
    dialogContent += `
        <div class="effect-section" style="border-color: #4caf50;">
            <h4>🎯 Effets Personnalisés</h4>
    `;

    for (const [key, effectData] of Object.entries(CUSTOM_EFFECTS)) {
        const existingEffect = currentState.customEffects[key];
        const isActive = existingEffect !== null;
        const statusIcon = isActive ? "✅" : "❌";
        const statusText = isActive ? "ACTIF" : "INACTIF";
        const statusColor = isActive ? "#2e7d32" : "#d32f2f";
        const isSvg = effectData.icon.toLowerCase().endsWith('.svg');

        // Check if this is an increasable effect
        if (effectData.increasable) {
            // Display increasable effect with counter
            const effectCount = existingEffect ? (existingEffect.flags?.statuscounter?.value || 0) : 0;

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url(${effectData.icon});"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effectData.name}</strong>
                            <br><small style="color: #666;">${effectData.description}</small>
                        </div>
                        <div class="status-indicator status-${key}" style="color: ${effectCount > 0 ? '#673ab7' : '#666'};">
                            📚 ${effectCount} ${effectData.name.toLowerCase()}${effectCount > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="button-group">
                        <label>Nombre: <input type="number" id="customCount-${key}" value="${effectCount}" min="0" max="20" style="width: 60px; margin: 0 8px;"></label>
                        <button type="button" class="btn btn-add" data-action="setCustomCount" data-effect="${key}" data-category="custom">
                            📚 Appliquer
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Display regular effect with flags
            const bonusDisplay = effectData.flags.map(flag => {
                const sign = flag.value >= 0 ? '+' : '';
                return `${sign}${flag.value}`;
            }).join(', ');

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-src="${effectData.icon}" data-is-svg="${isSvg}" style="background-image: url(${effectData.icon});"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effectData.name}</strong> (${bonusDisplay})
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
                <h4>🩸 Système de Blessures</h4>
        `;

        for (const [key, injuryData] of Object.entries(INJURY_EFFECTS)) {
            const existingInjury = currentState.injuries[key];
            const injuryCount = existingInjury ? (existingInjury.flags?.statuscounter?.value || 1) : 0;
            const isActive = existingInjury !== null;
            const injuryIcon = injuryData.icon || injuryData.img || 'icons/skills/wounds/blood-spurt-spray-red.webp';
            const isSvg = injuryIcon.toLowerCase().endsWith('.svg');

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url(${injuryIcon});"></div>
                        <div style="flex-grow: 1;">
                            <strong>${injuryData.name || injuryData.label}</strong>
                            <br><small style="color: #666;">${injuryData.description}</small>
                        </div>
                        <div class="status-indicator status-injury-${key}" style="color: ${injuryCount > 0 ? '#d32f2f' : '#666'};">
                            🩸 ${injuryCount} ${(injuryData.name || injuryData.label).toLowerCase()}${injuryCount > 1 ? 's' : ''}
                        </div>
                    </div>
                    <div class="button-group">
                        <label>Nombre: <input type="number" id="injuryCount-${key}" value="${injuryCount}" min="0" max="10" style="width: 60px; margin: 0 8px;"></label>
                        <button type="button" class="btn btn-add" data-action="setInjuries" data-effect="${key}" data-category="injury">
                            🩸 Appliquer
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
                <h4>📊 Effets de Statut (CONFIG)</h4>
        `;

        for (const [key, effectData] of Object.entries(configStatusEffects.other)) {
            const isActive = currentState.statusEffects[key] !== null;
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? "ACTIF" : "INACTIF";
            const statusColor = isActive ? "#2e7d32" : "#d32f2f";
            const effectIcon = effectData.icon || effectData.img || 'icons/svg/aura.svg';
            const isSvg = effectIcon.toLowerCase().endsWith('.svg');

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url(${effectIcon});"></div>
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
            title: "🎭 Gestionnaire Complet d'Effets",
            content: dialogContent,
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: "💾 Sauvegarder",
                    callback: (html) => {
                        const injuryValues = {};
                        for (const key of Object.keys(INJURY_EFFECTS)) {
                            injuryValues[key] = parseInt(html.find(`#injuryCount-${key}`).val()) || 0;
                        }
                        const customCountValues = {};
                        for (const key of Object.keys(CUSTOM_EFFECTS)) {
                            if (CUSTOM_EFFECTS[key].increasable) {
                                customCountValues[key] = parseInt(html.find(`#customCount-${key}`).val()) || 0;
                            }
                        }
                        resolve({ pendingChanges, injuryValues, customCountValues });
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

                    if (action === 'setInjuries' || action === 'setCustomCount') {
                        // Handle injury/custom count setting directly
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
                            case 'add': pendingText = '📝 À AJOUTER'; break;
                            case 'remove': pendingText = '📝 À SUPPRIMER'; break;
                            case 'setPosture': pendingText = '📝 À ACTIVER'; break;
                            case 'removePostures': pendingText = '📝 À SUPPRIMER'; break;
                            case 'removeExternal': pendingText = '📝 À SUPPRIMER'; break;
                        }
                        statusDiv.html(`<strong style="color: #2196f3;">${pendingText}</strong>`);
                    }
                });
            }
        }).render(true);
    });

    if (!result) {
        ui.notifications.info("Opération annulée.");
        return;
    }

    // === HANDLE REMOVE ALL ===
    if (result.action === "removeAll") {
        const allEffects = actor.effects.contents;
        if (allEffects.length === 0) {
            ui.notifications.info("Aucun effet à supprimer.");
            return;
        }

        try {
            await actor.deleteEmbeddedDocuments("ActiveEffect", allEffects.map(e => e.id));
            ui.notifications.info(`🗑️ Tous les effets supprimés ! (${allEffects.length})`);
        } catch (error) {
            console.error("Erreur lors de la suppression:", error);
            ui.notifications.error("❌ Erreur lors de la suppression !");
        }
        return;
    }

    // === PROCESS CHANGES ===
    const { pendingChanges: changes, injuryValues, customCountValues } = result;

    try {
        const effectsToAdd = [];
        const effectsToRemove = [];
        const operationLog = [];

        // Handle injury updates
        for (const [injuryKey, newValue] of Object.entries(injuryValues)) {
            const injuryData = INJURY_EFFECTS[injuryKey];
            const currentInjuryEffect = currentState.injuries[injuryKey];
            const currentValue = currentInjuryEffect ? (currentInjuryEffect.flags?.statuscounter?.value || 1) : 0;

            if (newValue !== currentValue) {
                if (newValue === 0 && currentInjuryEffect) {
                    effectsToRemove.push(currentInjuryEffect.id);
                    operationLog.push(`🩸 ${injuryData.name} supprimées`);
                } else if (newValue > 0) {
                    if (currentInjuryEffect) {
                        // Update existing
                        await currentInjuryEffect.update({
                            "flags.statuscounter.value": newValue
                        });
                        operationLog.push(`🩸 ${injuryData.name} mises à jour: ${newValue}`);
                    } else {
                        // Create new using exact CONFIG object structure
                        const injuryEffect = {
                            ...injuryData, // Copy all CONFIG properties
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            flags: {
                                statuscounter: { value: newValue }
                            },
                            statuses: [injuryData.id] // Add status ID to statuses array
                        };
                        // Remove our custom properties that aren't part of the effect
                        delete injuryEffect.category;
                        delete injuryEffect.description;

                        effectsToAdd.push(injuryEffect);
                        operationLog.push(`🩸 ${injuryData.name || injuryData.label} ajoutées: ${newValue}`);
                    }
                }
            }
        }

        // Handle custom count effects updates (increasable effects)
        for (const [customKey, newValue] of Object.entries(customCountValues || {})) {
            const customData = CUSTOM_EFFECTS[customKey];
            if (!customData || !customData.increasable) continue;

            const currentCustomEffect = currentState.customEffects[customKey];
            const currentValue = currentCustomEffect ? (currentCustomEffect.flags?.statuscounter?.value || 0) : 0;

            if (newValue !== currentValue) {
                if (newValue === 0 && currentCustomEffect) {
                    effectsToRemove.push(currentCustomEffect.id);
                    operationLog.push(`📚 ${customData.name} supprimé(s)`);
                } else if (newValue > 0) {
                    if (currentCustomEffect) {
                        // Update existing
                        await currentCustomEffect.update({
                            "flags.statuscounter.value": newValue
                        });
                        operationLog.push(`📚 ${customData.name} mis à jour: ${newValue}`);
                    } else {
                        // Create new with statuscounter
                        const customEffect = {
                            name: customData.name,
                            icon: customData.icon,
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            flags: {
                                statuscounter: { value: newValue }
                            }
                        };

                        effectsToAdd.push(customEffect);
                        operationLog.push(`📚 ${customData.name} ajouté(s): ${newValue}`);
                    }
                }
            }
        }

        // Handle posture changes (remove current, add new)
        const hasPostureChange = Object.values(changes).some(c => c.action === 'setPosture' || c.action === 'removePostures');
        if (hasPostureChange) {
            // Remove current posture
            if (currentState.currentPosture) {
                const currentPostureEffect = actor.effects.find(e =>
                    e.name.toLowerCase() === (POSTURES[currentState.currentPosture].name || POSTURES[currentState.currentPosture].label).toLowerCase()
                );
                if (currentPostureEffect) {
                    effectsToRemove.push(currentPostureEffect.id);
                }
            }
        }

        // Process other changes
        for (const [effectKey, changeData] of Object.entries(changes)) {
            const { action, category } = changeData;

            switch (category) {
                case 'custom':
                    const customData = CUSTOM_EFFECTS[effectKey];
                    // Skip increasable effects - they're handled separately
                    if (customData.increasable) break;

                    if (action === 'add') {
                        const flagsObject = {};
                        customData.flags.forEach(flag => {
                            flagsObject[flag.key] = { value: flag.value };
                        });

                        effectsToAdd.push({
                            name: customData.name,
                            icon: customData.icon,
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            flags: flagsObject
                        });
                        operationLog.push(`✅ ${customData.name} activé`);
                    } else if (action === 'remove') {
                        const existing = currentState.customEffects[effectKey];
                        if (existing) {
                            effectsToRemove.push(existing.id);
                            operationLog.push(`❌ ${customData.name} désactivé`);
                        }
                    }
                    break;

                case 'posture':
                    if (action === 'setPosture') {
                        const postureData = POSTURES[effectKey];
                        // Create effect using exact CONFIG object structure
                        const postureEffect = {
                            ...postureData, // Copy all CONFIG properties
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            statuses: [postureData.id] // Add status ID to statuses array
                        };
                        // Remove our custom properties that aren't part of the effect
                        delete postureEffect.category;
                        delete postureEffect.description;

                        effectsToAdd.push(postureEffect);
                        operationLog.push(`⚔️ Posture ${postureData.name || postureData.label} activée`);
                    } else if (action === 'removePostures') {
                        operationLog.push(`🚫 Toutes les postures supprimées`);
                    }
                    break;

                case 'status':
                    const statusData = configStatusEffects.other[effectKey];
                    if (action === 'add') {
                        // Create effect using exact CONFIG object structure
                        const statusEffect = {
                            ...statusData, // Copy all CONFIG properties
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            statuses: [statusData.id] // Add status ID to statuses array
                        };
                        // Remove our custom properties that aren't part of the effect
                        delete statusEffect.category;
                        delete statusEffect.description;

                        effectsToAdd.push(statusEffect);
                        operationLog.push(`📊 ${statusData.name || statusData.label} activé`);
                    } else if (action === 'remove') {
                        const existing = currentState.statusEffects[effectKey];
                        if (existing) {
                            effectsToRemove.push(existing.id);
                            operationLog.push(`📊 ${statusData.name || statusData.label} désactivé`);
                        }
                    }
                    break;

                case 'external':
                    if (action === 'removeExternal') {
                        // Find the external effect by ID
                        const externalEffect = actor.effects.get(effectKey);
                        if (externalEffect) {
                            effectsToRemove.push(externalEffect.id);
                            operationLog.push(`🗑️ Effet externe "${externalEffect.name}" supprimé`);
                        }
                    }
                    break;
            }
        }

        // Execute changes
        if (effectsToAdd.length > 0) {
            await actor.createEmbeddedDocuments("ActiveEffect", effectsToAdd);
        }
        if (effectsToRemove.length > 0) {
            await actor.deleteEmbeddedDocuments("ActiveEffect", effectsToRemove);
        }

        if (operationLog.length > 0) {
            ui.notifications.info(`🎭 Modifications appliquées ! (${operationLog.length} changement${operationLog.length > 1 ? 's' : ''})`);
            console.log("Changements appliqués:", operationLog);
        } else {
            ui.notifications.info("Aucune modification nécessaire.");
        }

    } catch (error) {
        console.error("Erreur lors des modifications:", error);
        ui.notifications.error("❌ Erreur lors des modifications !");
    }
})();
