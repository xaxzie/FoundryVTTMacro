/**
 * Complete Effect Manager - Handle All Effects, Postures, and Injuries for Missy
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

    // Custom Active Effects with Flags for Missy
    const CUSTOM_EFFECTS = {
        "Cheveuxlerie": {
            name: "Cheveuxlerie",
            icon: "icons/equipment/shield/heater-steel-worn.webp",
            flags: [
                { key: "resistance", value: Math.floor((actor.system.attributes?.dexterite?.value || 3) / 2) }
            ],
            description: "Cheveux formant une protection magique - Coûte 2 mana par tour",
            category: "custom",
            increasable: false,
            manaCost: 2,
            isPerTurn: true, // Coût par tour
            statusCounterValue: Math.floor((actor.system.attributes?.dexterite?.value || 3) / 2) // Toujours dextérité/2
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
            console.warn("[DEBUG] Missy Effect: Token Magic FX not available for transformation");
            return;
        }

        try {
            let filterParams;
            const { targetImagePath, transitionType, loopDuration, padding, magnify, filterId } = transformConfig;

            if (shouldTransform) {
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

                setTimeout(async () => {
                    try {
                        await TokenMagic.deleteFiltersOnSelected(filterId);
                    } catch (error) {
                        console.warn("[DEBUG] Missy Effect: Error removing transformation filter:", error);
                    }
                }, (loopDuration || 1000) + 100);
            }

            await token.TMFXaddUpdateFilters(filterParams);

        } catch (error) {
            console.error("[DEBUG] Missy Effect: Error in token transformation:", error);
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
            console.warn("[DEBUG] Missy Effect: Sequencer not available for animation");
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

            console.log(`[DEBUG] Missy Effect: Played transformation animation for ${token.name}`);

        } catch (error) {
            console.error("[DEBUG] Missy Effect: Error in transformation animation:", error);
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
            console.warn("[DEBUG] Missy Effect: Token Magic FX not available for filters");
            return;
        }

        try {
            const { filterId, filterConfigs } = filterConfig;

            if (shouldApply) {
                const hasFilters = token.document.flags?.tokenmagic;
                if (hasFilters) {
                    await TokenMagic.deleteFiltersOnSelected(filterId);
                }

                const filterParams = filterConfigs.map(config => ({
                    ...config,
                    filterId: filterId
                }));

                await TokenMagic.addFiltersOnSelected(filterParams);
            } else {
                const hasFilters = token.document.flags?.tokenmagic;
                if (!hasFilters) {
                    console.log("[DEBUG] Missy Effect: No filters to remove");
                    return;
                }

                await TokenMagic.deleteFiltersOnSelected(filterId);
            }

        } catch (error) {
            console.error("[DEBUG] Missy Effect: Error in token filters:", error);
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
            console.warn("[DEBUG] Missy Effect: Sequencer not available for persistent animation");
            return;
        }

        try {
            const { effectFile, scale, fadeOut, persistent, sequencerName } = animConfig;

            if (isActivating) {
                if (Sequencer.EffectManager.getEffects({ name: sequencerName }).length > 0) {
                    await Sequencer.EffectManager.endEffects({ name: sequencerName });
                }

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
                if (Sequencer.EffectManager.getEffects({ name: sequencerName }).length > 0) {
                    await Sequencer.EffectManager.endEffects({ name: sequencerName });
                }
            }

        } catch (error) {
            console.error("[DEBUG] Missy Effect: Error in persistent animation:", error);
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
        <h3>💇‍♀️ Gestionnaire Complet d'Effets - Missy</h3>
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
    dialogContent += `
        <div class="effect-section" style="border-color: #9c27b0;">
            <h4>💇‍♀️ Effets Personnalisés de Missy</h4>
    `;

    if (Object.keys(CUSTOM_EFFECTS).length === 0) {
        dialogContent += `
            <div class="effect-item" style="text-align: center; color: #666; font-style: italic;">
                Aucun effet personnalisé configuré pour le moment.
                <br><small>Les effets capillaires de Missy seront ajoutés ici ultérieurement.</small>
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
            title: "💇‍♀️ Gestionnaire d'Effets - Missy",
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
                    } else if (action === 'setCustomCount') {
                        // Handle custom count setting directly - no pending change needed
                        return;
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
                    } else if (action === 'remove' || action === 'removePostures' || action === 'removeExternal') {
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
        const allEffects = actor.effects.contents;
        if (allEffects.length === 0) {
            ui.notifications.info("Aucun effet à supprimer.");
            return;
        }

        try {
            // Handle special effects removal before deleting effects
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
        let addedEffects = [];
        let removedEffects = [];
        let modifiedEffects = [];

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

                    await currentCustomEffect.delete();
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

                    await actor.createEmbeddedDocuments("ActiveEffect", [effectConfig]);

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

                    modifiedEffects.push(`${customData.name} (${newValue})`);
                } else if (currentValue > 0) {
                    modifiedEffects.push(`${customData.name} supprimé`);
                }
            }
        }

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
            } else if (category === 'external') {
                if (action === 'removeExternal') {
                    const externalEffect = actor.effects.find(e => e.id === effectKey);
                    if (externalEffect) {
                        await externalEffect.delete();
                        removedEffects.push(`Effet externe: ${externalEffect.name}`);
                    }
                }
            } else if (category === 'custom') {
                const effectData = CUSTOM_EFFECTS[effectKey];
                if (!effectData) continue;

                // Skip increasable effects - they're handled separately
                if (effectData.increasable) continue;

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

                    // Handle special effects (delayed to let effect be created)
                    if (canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];
                        setTimeout(async () => {
                            if (effectData.hasTransformation) {
                                if (effectData.hasAnimation) {
                                    await playTransformationAnimation(token, effectData.animation, true);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenTransformation(token, effectData.transformation, true);
                            }

                            if (effectData.hasFilters) {
                                if (effectData.hasAnimation) {
                                    await playPersistentAnimation(token, effectData.animation, true);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenFilters(token, effectData.filters, true);
                            }
                        }, 500);
                    }

                } else if (action === 'remove') {
                    const existingEffect = actor.effects.find(e => e.name === effectData.name);
                    if (existingEffect) {
                        // Handle special effects removal first
                        if (canvas.tokens.controlled.length > 0) {
                            const token = canvas.tokens.controlled[0];

                            if (effectData.hasTransformation) {
                                if (effectData.hasAnimation) {
                                    await playTransformationAnimation(token, effectData.animation, false);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenTransformation(token, effectData.transformation, false);
                            }

                            if (effectData.hasFilters) {
                                if (effectData.hasAnimation) {
                                    await playPersistentAnimation(token, effectData.animation, false);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                                await applyTokenFilters(token, effectData.filters, false);
                            }
                        }

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
        let message = "💇‍♀️ Effets de Missy mis à jour !\n";
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
