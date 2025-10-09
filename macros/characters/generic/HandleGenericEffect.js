/**
 * Complete Effect Manager - Generic Template for Character Effect Handlers
 *
 * This comprehensive manager handles:
 * - Custom active effects with flags
 * - The 3 postures (Focus, Offensif, Défensif) - mutually exclusive
 * - Injuries system with stackable counter
 * - Dynamic retrieval from CONFIG.statusEffects (FoundryVTT v13)
 * - Token transformations with Token Magic FX
 * - Token filters with Token Magic FX
 * - Persistent animations with Sequencer
 * - Increasable effects with counters
 * - Mana cost tracking (one-time or per-turn)
 * - Status counter values
 *
 * Features:
 * - Unified interface for all effect types
 * - Posture management (only one active at a time)
 * - Injury stacking with configurable amounts
 * - Integration with FoundryVTT's status effect system
 * - Token transformation system
 * - Token filter system with persistent effects
 * - Animation system (both one-time and persistent)
 * - Increasable effects with counters
 * - Mana cost display and tracking
 * - Status counter integration
 * - External effect detection and management
 */

(async () => {
    // === ACTOR VALIDATION ===
    const actor = canvas.tokens.controlled[0]?.actor;

    if (!actor) {
        ui.notifications.warn("⚠️ Sélectionnez un token !");
        return;
    }

    // === CONFIGURATION ===

    // Custom Active Effects with Flags - CUSTOMIZE THIS FOR EACH CHARACTER
    const CUSTOM_EFFECTS = {
        // Example for regular effect with flags:
        // "ExampleEffect": {
        //     name: "Example Effect",
        //     icon: "icons/svg/aura.svg",
        //     flags: [
        //         { key: "physique", value: 2 },
        //         { key: "damage", value: 1 }
        //     ],
        //     description: "Example effect (+2 Physique, +1 damage)",
        //     category: "custom",
        //     increasable: false,
        //     manaCost: 3 // Optional: mana cost (one-time)
        // },

        // Example for increasable effect:
        // "ExampleIncreaseableEffect": {
        //     name: "Example Book Effect",
        //     icon: "icons/sundries/books/book-embossed-blue.webp",
        //     description: "Increasable effect with counter",
        //     category: "custom",
        //     increasable: true,
        //     flags: [
        //         { key: "statuscounter", value: 0 }
        //     ]
        // },

        // Example for effect with transformation:
        // "ExampleTransformation": {
        //     name: "Example Transformation",
        //     icon: "icons/weapons/bows/shortbow-recurve-yellow.webp",
        //     flags: [
        //         { key: "agilite", value: -3 }
        //     ],
        //     description: "Effect with token transformation",
        //     category: "custom",
        //     increasable: false,
        //     hasTransformation: true,
        //     transformation: {
        //         targetImagePath: "path/to/transformed/token.png",
        //         transitionType: 4, // Water drop effect
        //         loopDuration: 1000,
        //         padding: 70,
        //         magnify: 1,
        //         filterId: "exampleTransformation"
        //     },
        //     hasAnimation: true,
        //     animation: {
        //         effectFile: "animated-spell-effects.air.shockwave.circle.02",
        //         scale: 0.5,
        //         duration: 2000
        //     }
        // },

        // Example for effect with filters only:
        // "ExampleFilters": {
        //     name: "Example Filters",
        //     icon: "icons/magic/unholy/strike-body-explode-disintegrate.webp",
        //     flags: [],
        //     description: "Effect with persistent filters and animation",
        //     category: "custom",
        //     increasable: false,
        //     hasFilters: true,
        //     filters: {
        //         filterId: "exampleFilters",
        //         filterConfigs: [
        //             {
        //                 filterType: "shadow",
        //                 blur: 1,
        //                 quality: 5,
        //                 distance: 0.2,
        //                 alpha: 1.0,
        //                 padding: 100,
        //                 color: 0xff0000,
        //                 animated: {
        //                     blur: {
        //                         active: true,
        //                         loopDuration: 500,
        //                         animType: "syncCosOscillation",
        //                         val1: 2,
        //                         val2: 4
        //                     }
        //                 }
        //             }
        //         ]
        //     },
        //     hasAnimation: true,
        //     animation: {
        //         effectFile: "jb2a_patreon.static_electricity.02.dark_red",
        //         scale: 2,
        //         fadeOut: 3000,
        //         persistent: true,
        //         sequencerName: "ExampleEffect"
        //     }
        // },

        // Example for effect with mana cost tracking:
        // "ExampleManaCost": {
        //     name: "Example Mana Effect",
        //     icon: "icons/equipment/shield/heater-steel-worn.webp",
        //     flags: [
        //         { key: "resistance", value: 5 }
        //     ],
        //     description: "Effect with mana cost per turn",
        //     category: "custom",
        //     increasable: false,
        //     manaCost: 2,
        //     isPerTurn: true, // Cost per turn
        //     statusCounterValue: 5 // Fixed status counter value
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

    // === TOKEN TRANSFORMATION FUNCTIONS ===

    /**
     * Apply or revert token transformation using Token Magic FX
     * @param {Token} token - The token to transform
     * @param {Object} transformConfig - Transformation configuration
     * @param {boolean} shouldTransform - True to transform, false to revert
     */
    async function applyTokenTransformation(token, transformConfig, shouldTransform) {
        if (!token || typeof TokenMagic === "undefined") {
            console.warn("[DEBUG] Generic Effect: Token Magic FX not available for transformation");
            return;
        }

        try {
            let filterParams;
            const { targetImagePath, transitionType, loopDuration, padding, magnify, filterId } = transformConfig;

            if (shouldTransform) {
                // Apply transformation with polymorph effect
                filterParams = [{
                    filterType: "polymorph",
                    filterId: filterId,
                    type: transitionType || 4,
                    padding: padding || 70,
                    magnify: magnify || 1,
                    imagePath: targetImagePath,
                    animated: {
                        progress: {
                            active: false,
                            animType: "halfCosOscillation",
                            val1: 0,
                            val2: 100,
                            loopDuration: loopDuration || 1000
                        }
                    }
                }];
            } else {
                // Revert transformation
                filterParams = [{
                    filterType: "polymorph",
                    filterId: filterId,
                    type: transitionType || 4,
                    padding: padding || 70,
                    magnify: magnify || 1,
                    imagePath: token.document.texture.src,
                    animated: {
                        progress: {
                            active: true,
                            animType: "halfCosOscillation",
                            val1: 100,
                            val2: 0,
                            loopDuration: loopDuration || 1000
                        }
                    }
                }];

                // Schedule filter removal after animation
                setTimeout(async () => {
                    try {
                        await TokenMagic.deleteFiltersOnSelected(filterId);
                    } catch (error) {
                        console.warn("[DEBUG] Generic Effect: Error removing transformation filter:", error);
                    }
                }, (loopDuration || 1000) + 100);
            }

            await token.TMFXaddUpdateFilters(filterParams);

        } catch (error) {
            console.error("[DEBUG] Generic Effect: Error in token transformation:", error);
        }
    }

    /**
     * Play transformation animation using Sequencer
     * @param {Token} token - The token to animate
     * @param {Object} animConfig - Animation configuration
     * @param {boolean} isActivating - True if activating effect, false if deactivating
     */
    async function playTransformationAnimation(token, animConfig, isActivating) {
        if (!token || typeof Sequence === "undefined") {
            console.warn("[DEBUG] Generic Effect: Sequencer not available for animation");
            return;
        }

        try {
            const { effectFile, scale } = animConfig;

            new Sequence()
                .effect()
                .file(effectFile)
                .atLocation(token)
                .scale(scale)
                .fadeOut(500)
                .belowTokens()
                .play();

            console.log(`[DEBUG] Generic Effect: Played transformation animation for ${token.name}`);

        } catch (error) {
            console.error("[DEBUG] Generic Effect: Error in transformation animation:", error);
        }
    }

    /**
     * Apply or remove Token Magic FX filters
     * @param {Token} token - The token to apply filters to
     * @param {Object} filterConfig - Filter configuration
     * @param {boolean} shouldApply - True to apply filters, false to remove
     */
    async function applyTokenFilters(token, filterConfig, shouldApply) {
        if (!token || typeof TokenMagic === "undefined") {
            console.warn("[DEBUG] Generic Effect: Token Magic FX not available for filters");
            return;
        }

        try {
            const { filterId, filterConfigs } = filterConfig;

            if (shouldApply) {
                // Remove any existing filters first
                const hasFilters = token.document.flags?.tokenmagic;
                if (hasFilters) {
                    await TokenMagic.deleteFiltersOnSelected(filterId);
                }

                // Apply new filters
                const filterParams = filterConfigs.map(config => ({
                    ...config,
                    filterId: filterId
                }));

                await TokenMagic.addFiltersOnSelected(filterParams);
            } else {
                // Remove filters
                const hasFilters = token.document.flags?.tokenmagic;
                if (!hasFilters) {
                    console.log("[DEBUG] Generic Effect: No filters to remove");
                    return;
                }

                await TokenMagic.deleteFiltersOnSelected(filterId);
            }

        } catch (error) {
            console.error("[DEBUG] Generic Effect: Error in token filters:", error);
        }
    }

    /**
     * Play persistent animation using Sequencer
     * @param {Token} token - The token to animate
     * @param {Object} animConfig - Animation configuration
     * @param {boolean} isActivating - True if activating effect, false if deactivating
     */
    async function playPersistentAnimation(token, animConfig, isActivating) {
        if (!token || typeof Sequence === "undefined") {
            console.warn("[DEBUG] Generic Effect: Sequencer not available for persistent animation");
            return;
        }

        try {
            const { effectFile, scale, fadeOut, persistent, sequencerName } = animConfig;

            if (isActivating) {
                // Remove any existing animation first
                if (Sequencer.EffectManager.getEffects({ name: sequencerName }).length > 0) {
                    await Sequencer.EffectManager.endEffects({ name: sequencerName });
                }

                // Play persistent animation
                new Sequence()
                    .effect()
                    .file(effectFile)
                    .attachTo(token)
                    .scale(scale)
                    .fadeOut(fadeOut)
                    .persist()
                    .name(sequencerName)
                    .play();
            } else {
                // Remove persistent animation
                if (Sequencer.EffectManager.getEffects({ name: sequencerName }).length > 0) {
                    await Sequencer.EffectManager.endEffects({ name: sequencerName });
                }
            }

        } catch (error) {
            console.error("[DEBUG] Generic Effect: Error in persistent animation:", error);
        }
    }

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
        <h3>🎭 Gestionnaire Complet d'Effets - Generic</h3>
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
    if (Object.keys(CUSTOM_EFFECTS).length > 0) {
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
                    return `+${flag.value} ${flag.key}`;
                }).join(', ');

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
    } else {
        dialogContent += `
            <div class="effect-section" style="border-color: #4caf50;">
                <h4>🎯 Effets Personnalisés</h4>
                <div class="effect-item" style="text-align: center; color: #666; font-style: italic;">
                    Aucun effet personnalisé configuré.
                    <br><small>Configurez les effets spécifiques du personnage dans CUSTOM_EFFECTS.</small>
                </div>
            </div>
        `;
    }

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
            title: "🎭 Gestionnaire d'Effets - Generic",
            content: dialogContent,
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: "💾 Sauvegarder",
                    callback: (html) => {
                        const injuryValues = {};
                        for (const key of Object.keys(INJURY_EFFECTS)) {
                            const input = html.find(`#injuryCount-${key}`);
                            if (input.length) {
                                injuryValues[key] = parseInt(input.val()) || 0;
                            }
                        }

                        const customCountValues = {};
                        for (const key of Object.keys(CUSTOM_EFFECTS)) {
                            if (CUSTOM_EFFECTS[key].increasable) {
                                const input = html.find(`#customCount-${key}`);
                                if (input.length) {
                                    customCountValues[key] = parseInt(input.val()) || 0;
                                }
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

                    if (action === 'removeExternal') {
                        // Handle external effect removal
                        pendingChanges[effectKey] = { action, category };
                        const $item = $(this).closest('.effect-item');
                        $item.addClass('pending-change');
                        const $status = $item.find('.status-indicator');
                        $status.html('🔄 SUPPRESSION').css('color', '#ff9800');
                        $(this).prop('disabled', true).addClass('btn-disabled');
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
                        $(this).addClass('pending-change');

                        // Update status display
                        const pendingText = action === 'add' || action === 'setPosture' ? '🔄 EN ATTENTE' : '🔄 SUPPRESSION';
                        statusDiv.html(`<strong style="color: #2196f3;">${pendingText}</strong>`);
                    }
                });
            }
        }, {
            width: 600,
            height: 800,
            resizable: true
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
            // Handle transformations and filters removal before deleting effects
            if (canvas.tokens.controlled.length > 0) {
                const token = canvas.tokens.controlled[0];

                // Handle special effects removal for each custom effect
                for (const [key, effectData] of Object.entries(CUSTOM_EFFECTS)) {
                    const existingEffect = actor.effects.find(e => e.name === effectData.name);
                    if (existingEffect) {
                        // Handle transformation removal
                        if (effectData.hasTransformation) {
                            if (effectData.hasAnimation) {
                                await playTransformationAnimation(token, effectData.animation, false);
                            }
                            // Small delay for animation
                            await new Promise(resolve => setTimeout(resolve, 200));
                            await applyTokenTransformation(token, effectData.transformation, false);
                        }

                        // Handle filters removal
                        if (effectData.hasFilters) {
                            if (effectData.hasAnimation) {
                                await playPersistentAnimation(token, effectData.animation, false);
                            }
                            // Small delay for animation cleanup
                            await new Promise(resolve => setTimeout(resolve, 200));
                            await applyTokenFilters(token, effectData.filters, false);
                        }
                    }
                }
            }

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
                // Remove existing injury if present
                if (currentInjuryEffect) {
                    effectsToRemove.push(currentInjuryEffect.id);
                }

                // Add new injury if value > 0
                if (newValue > 0) {
                    const injuryConfig = {
                        name: injuryData.name || injuryData.label,
                        icon: injuryData.icon || injuryData.img || 'icons/skills/wounds/blood-spurt-spray-red.webp',
                        description: injuryData.description,
                        duration: { seconds: 86400 },
                        statuses: [injuryData.id],
                        flags: {
                            statuscounter: { value: newValue }
                        }
                    };
                    effectsToAdd.push(injuryConfig);
                    operationLog.push(`🩸 ${injuryData.name || injuryData.label} (${newValue})`);
                } else if (currentValue > 0) {
                    operationLog.push(`❌ ${injuryData.name || injuryData.label} supprimé`);
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
                // Remove existing effect if present
                if (currentCustomEffect) {
                    // Handle special effects removal for increasable effects
                    if (canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];

                        if (customData.hasTransformation) {
                            if (customData.hasAnimation) {
                                await playTransformationAnimation(token, customData.animation, false);
                            }
                            await new Promise(resolve => setTimeout(resolve, 200));
                            await applyTokenTransformation(token, customData.transformation, false);
                        }

                        if (customData.hasFilters) {
                            if (customData.hasAnimation) {
                                await playPersistentAnimation(token, customData.animation, false);
                            }
                            await new Promise(resolve => setTimeout(resolve, 200));
                            await applyTokenFilters(token, customData.filters, false);
                        }
                    }

                    effectsToRemove.push(currentCustomEffect.id);
                }

                // Add new effect if value > 0
                if (newValue > 0) {
                    const effectConfig = {
                        name: customData.name,
                        icon: customData.icon,
                        description: customData.description,
                        duration: { seconds: 86400 },
                        flags: {
                            statuscounter: { value: newValue }
                        }
                    };

                    // Add custom flags
                    for (const flag of customData.flags) {
                        if (flag.key !== 'statuscounter') {
                            effectConfig.flags[flag.key] = { value: flag.value };
                        }
                    }

                    effectsToAdd.push(effectConfig);

                    // Handle special effects addition for increasable effects (only when creating new)
                    if (currentValue === 0 && canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];

                        // Small delay to let effect be created
                        setTimeout(async () => {
                            if (customData.hasTransformation) {
                                if (customData.hasAnimation) {
                                    await playTransformationAnimation(token, customData.animation, true);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenTransformation(token, customData.transformation, true);
                            }

                            if (customData.hasFilters) {
                                if (customData.hasAnimation) {
                                    await playPersistentAnimation(token, customData.animation, true);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenFilters(token, customData.filters, true);
                            }
                        }, 500);
                    }

                    operationLog.push(`📚 ${customData.name} (${newValue})`);
                } else if (currentValue > 0) {
                    operationLog.push(`❌ ${customData.name} supprimé`);
                }
            }
        }

        // Handle posture changes (remove current, add new)
        const hasPostureChange = Object.values(changes).some(c => c.action === 'setPosture' || c.action === 'removePostures');
        if (hasPostureChange) {
            // Remove all current postures
            for (const effect of actor.effects.contents) {
                for (const postureData of Object.values(POSTURES)) {
                    if (effect.statuses?.has(postureData.id) ||
                        effect.name.toLowerCase() === (postureData.name || postureData.label).toLowerCase()) {
                        effectsToRemove.push(effect.id);
                        break;
                    }
                }
            }
        }

        // Process other changes
        for (const [effectKey, changeData] of Object.entries(changes)) {
            const { action, category } = changeData;

            if (category === 'external') {
                if (action === 'removeExternal') {
                    const externalEffect = actor.effects.find(e => e.id === effectKey);
                    if (externalEffect) {
                        effectsToRemove.push(externalEffect.id);
                        operationLog.push(`🗑️ Effet externe ${externalEffect.name} supprimé`);
                    }
                }
            } else if (category === 'custom') {
                const customData = CUSTOM_EFFECTS[effectKey];
                if (!customData) continue;

                // Skip increasable effects - they're handled separately
                if (customData.increasable) break;

                if (action === 'add') {
                    const effectConfig = {
                        name: customData.name,
                        icon: customData.icon,
                        description: customData.description,
                        duration: { seconds: 86400 },
                        flags: {}
                    };

                    // Add custom flags
                    for (const flag of customData.flags) {
                        effectConfig.flags[flag.key] = { value: flag.value };
                    }

                    // Add status counter if defined
                    if (customData.statusCounterValue !== undefined) {
                        effectConfig.flags.statuscounter = { value: customData.statusCounterValue };
                    }

                    effectsToAdd.push(effectConfig);
                    operationLog.push(`✅ ${customData.name} ajouté`);

                    // Handle special effects (delayed to let effect be created)
                    if (canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];
                        setTimeout(async () => {
                            if (customData.hasTransformation) {
                                if (customData.hasAnimation) {
                                    await playTransformationAnimation(token, customData.animation, true);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenTransformation(token, customData.transformation, true);
                            }

                            if (customData.hasFilters) {
                                if (customData.hasAnimation) {
                                    await playPersistentAnimation(token, customData.animation, true);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenFilters(token, customData.filters, true);
                            }
                        }, 500);
                    }

                } else if (action === 'remove') {
                    const existingEffect = currentState.customEffects[effectKey];
                    if (existingEffect) {
                        // Handle special effects removal first
                        if (canvas.tokens.controlled.length > 0) {
                            const token = canvas.tokens.controlled[0];

                            if (customData.hasTransformation) {
                                if (customData.hasAnimation) {
                                    await playTransformationAnimation(token, customData.animation, false);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenTransformation(token, customData.transformation, false);
                            }

                            if (customData.hasFilters) {
                                if (customData.hasAnimation) {
                                    await playPersistentAnimation(token, customData.animation, false);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenFilters(token, customData.filters, false);
                            }
                        }

                        effectsToRemove.push(existingEffect.id);
                        operationLog.push(`❌ ${customData.name} supprimé`);
                    }
                }

            } else if (category === 'posture') {
                if (action === 'setPosture') {
                    const postureData = POSTURES[effectKey];
                    if (postureData) {
                        // Add the new posture (after removal handled above)
                        setTimeout(async () => {
                            await actor.toggleStatusEffect(postureData.id);
                        }, 100);
                        operationLog.push(`⚔️ ${postureData.name || postureData.label} activé`);
                    }
                }

            } else if (category === 'status') {
                const statusData = configStatusEffects.other[effectKey];
                if (!statusData) continue;

                if (action === 'add') {
                    setTimeout(async () => {
                        await actor.toggleStatusEffect(statusData.id);
                    }, 100);
                    operationLog.push(`✅ ${statusData.name || statusData.label} ajouté`);

                } else if (action === 'remove') {
                    setTimeout(async () => {
                        await actor.toggleStatusEffect(statusData.id);
                    }, 100);
                    operationLog.push(`❌ ${statusData.name || statusData.label} supprimé`);
                }
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
            const message = `🎭 Effets mis à jour !\n${operationLog.join('\n')}`;
            ui.notifications.info(message);
        } else {
            ui.notifications.info("Aucune modification apportée.");
        }

    } catch (error) {
        console.error("Erreur lors des modifications:", error);
        ui.notifications.error("❌ Erreur lors des modifications !");
    }
})();
