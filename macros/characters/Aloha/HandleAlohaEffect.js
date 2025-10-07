/**
 * Complete Effect Manager - Handle All Effects, Postures, and Injuries for Aloha
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

    // Custom Active Effects with Flags for Aloha
    const CUSTOM_EFFECTS = {
        // TODO: Add Aloha's specific effects here when spells are created
        // Example for future effects:
        // "PoeleChaude": {
        //     name: "Poêle Chaude",
        //     icon: "icons/weapons/polearms/hammer-war-spiked.webp",
        //     flags: [
        //         { key: "physique", value: 2 }
        //     ],
        //     description: "Poêle chauffée à blanc (+2 Physique)",
        //     category: "custom",
        //     increasable: false,
        //     manaCost: 2
        // }
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
                    const effectName = effect.name || effect.label;
                    const effectLower = effectName.toLowerCase();

                    // Categorize by type
                    if (['focus', 'offensif', 'defensif'].includes(effectLower)) {
                        configEffects.postures[effectLower] = effect;
                    } else if (['blessures', 'injury', 'injuries', 'wounded'].includes(effectLower)) {
                        configEffects.injuries[effectLower] = effect;
                    } else {
                        // Other status effects
                        configEffects.other[effect.id] = effect;
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
        <h3>🍳 Gestionnaire Complet d'Effets - Aloha</h3>
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
                durationInfo = ` (${hours}h ${minutes}m)`;
            } else if (effect.duration?.rounds) {
                durationInfo = ` (${effect.duration.rounds} tours)`;
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
        <div class="effect-section" style="border-color: #ff5722;">
            <h4>🍳 Effets Personnalisés d'Aloha</h4>
    `;

    if (Object.keys(CUSTOM_EFFECTS).length === 0) {
        dialogContent += `
            <div class="effect-item" style="text-align: center; color: #666; font-style: italic;">
                Aucun effet personnalisé configuré pour le moment.
                <br><small>Les effets thermiques d'Aloha seront ajoutés ici ultérieurement.</small>
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
                    return `+${flag.value} ${flag.key}`;
                }).join(', ') : '';

            // Add status counter display if present
            const counterDisplay = effectData.statusCounterValue !== undefined ?
                ` [${effectData.statusCounterValue}]` : '';

            // Add mana cost display
            const manaCostDisplay = effectData.manaCost ?
                (effectData.isPerTurn ? ` (${effectData.manaCost} mana/tour)` : ` (${effectData.manaCost} mana)`) : '';

            const statusDisplayText = isActive ?
                (existingEffect?.flags?.statuscounter?.value !== undefined ?
                    `ACTIF [${existingEffect.flags.statuscounter.value}]` : "ACTIF") : "INACTIF";

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-src="${effectData.icon}" data-is-svg="${isSvg}" style="background-image: url(${effectData.icon});"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effectData.name}</strong>${bonusDisplay ? ` (${bonusDisplay})` : ''}${counterDisplay}${manaCostDisplay}
                            <br><small style="color: #666;">${effectData.description}</small>
                        </div>
                        <div class="status-indicator status-${key}" style="color: ${statusColor};">
                            ${statusIcon} ${statusDisplayText}
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
            <div class="effect-section" style="border-color: #ff5722;">
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
            title: "🍳 Gestionnaire d'Effets - Aloha",
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
                    const $btn = $(this);
                    const action = $btn.data('action');
                    const effect = $btn.data('effect');
                    const category = $btn.data('category');

                    console.log(`[DEBUG] Button clicked: ${action} ${effect} ${category}`);

                    // Store the pending change
                    if (action === 'setInjury') {
                        const injuryValue = parseInt(html.find(`#injury-${effect}`).val()) || 0;
                        pendingChanges[effect] = { action, category, value: injuryValue };
                    } else {
                        pendingChanges[effect] = { action, category };
                    }

                    // Visual feedback
                    const $item = $btn.closest('.effect-item');
                    $item.addClass('pending-change');

                    // Update status display
                    const $status = $item.find('.status-indicator');
                    if (action === 'add' || action === 'setPosture') {
                        $status.html('🔄 EN ATTENTE').css('color', '#2196f3');
                    } else if (action === 'remove' || action === 'removePostures') {
                        $status.html('🔄 SUPPRESSION').css('color', '#ff9800');
                    } else if (action === 'setInjury') {
                        const injuryValue = parseInt(html.find(`#injury-${effect}`).val()) || 0;
                        $status.html(`🔄 MODIFICATION (${injuryValue})`).css('color', '#2196f3');
                    }

                    // Disable the button
                    $btn.prop('disabled', true).addClass('btn-disabled');
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
            } catch (error) {
                console.warn(`[DEBUG] Failed to remove effect ${effect.name}:`, error);
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
                    for (const postureData of Object.values(POSTURES)) {
                        if (effect.statuses?.has(postureData.id) ||
                            effect.name.toLowerCase() === (postureData.name || postureData.label).toLowerCase()) {
                            await effect.delete();
                            removedEffects.push(postureData.name || postureData.label);
                            break;
                        }
                    }
                }
            } else if (category === 'custom') {
                const effectData = CUSTOM_EFFECTS[effectKey];
                if (!effectData) continue;

                if (action === 'add') {
                    // Create custom effect with flags
                    const effectConfig = {
                        name: effectData.name,
                        icon: effectData.icon,
                        description: effectData.description,
                        duration: { seconds: 86400 }, // 24 hours default
                        flags: {}
                    };

                    // Add custom flags
                    for (const flag of effectData.flags) {
                        effectConfig.flags[flag.key] = { value: flag.value };
                    }

                    // Add status counter if defined
                    if (effectData.statusCounterValue !== undefined) {
                        effectConfig.flags.statuscounter = { value: effectData.statusCounterValue };
                    }

                    await actor.createEmbeddedDocuments("ActiveEffect", [effectConfig]);
                    addedEffects.push(effectData.name);

                } else if (action === 'remove') {
                    const existingEffect = actor.effects.find(e => e.name === effectData.name);
                    if (existingEffect) {
                        await existingEffect.delete();
                        removedEffects.push(effectData.name);
                    }
                }

            } else if (category === 'posture') {
                const postureData = POSTURES[effectKey];
                if (!postureData) continue;

                if (action === 'setPosture') {
                    // Remove all other postures first
                    for (const effect of actor.effects.contents) {
                        for (const otherPostureData of Object.values(POSTURES)) {
                            if (effect.statuses?.has(otherPostureData.id) ||
                                effect.name.toLowerCase() === (otherPostureData.name || otherPostureData.label).toLowerCase()) {
                                await effect.delete();
                                break;
                            }
                        }
                    }

                    // Add the new posture
                    await actor.toggleStatusEffect(postureData.id);
                    addedEffects.push(postureData.name || postureData.label);
                }

            } else if (category === 'injury') {
                const injuryData = INJURY_EFFECTS[effectKey];
                if (!injuryData) continue;

                const injuryValue = injuryValues[effectKey] || value || 0;

                if (action === 'setInjury') {
                    // Remove existing injury
                    const existingInjury = actor.effects.find(e =>
                        e.statuses?.has(injuryData.id) ||
                        e.name.toLowerCase() === (injuryData.name || injuryData.label).toLowerCase()
                    );
                    if (existingInjury) {
                        await existingInjury.delete();
                    }

                    if (injuryValue > 0) {
                        // Add new injury with counter
                        const injuryConfig = {
                            name: injuryData.name || injuryData.label,
                            icon: injuryData.icon || injuryData.img,
                            description: injuryData.description,
                            duration: { seconds: 86400 },
                            statuses: [injuryData.id],
                            flags: {
                                statuscounter: { value: injuryValue }
                            }
                        };

                        await actor.createEmbeddedDocuments("ActiveEffect", [injuryConfig]);
                        modifiedEffects.push(`${injuryData.name || injuryData.label} (${injuryValue})`);
                    }

                } else if (action === 'remove') {
                    const existingInjury = actor.effects.find(e =>
                        e.statuses?.has(injuryData.id) ||
                        e.name.toLowerCase() === (injuryData.name || injuryData.label).toLowerCase()
                    );
                    if (existingInjury) {
                        await existingInjury.delete();
                        removedEffects.push(injuryData.name || injuryData.label);
                    }
                }

            } else if (category === 'status') {
                const statusData = configStatusEffects.other[effectKey];
                if (!statusData) continue;

                if (action === 'add') {
                    await actor.toggleStatusEffect(statusData.id);
                    addedEffects.push(statusData.name || statusData.label);

                } else if (action === 'remove') {
                    await actor.toggleStatusEffect(statusData.id);
                    removedEffects.push(statusData.name || statusData.label);
                }
            }
        }

        // Build success message
        let message = "🍳 Effets d'Aloha mis à jour !\n";
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
