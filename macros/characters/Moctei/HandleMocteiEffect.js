/**
 * Complete Effect Manager - Moctei (Mage des Ombres) - Effect Handler
 *
 * This comprehensive manager handles:
 * - Custom active effects with flags for Moctei's shadow magic
 * - The 3 postures (Focus, Offensif, Défensif) - mutually exclusive
 * - Injuries system with stackable counter
 * - Dynamic retrieval from CONFIG.statusEffects (FoundryVTT v13)
 * - Token transformations with Token Magic FX
 * - Token filters with Token Magic FX (shadow effects)
 * - Persistent animations with Sequencer
 * - Increasable effects with counters
 * - Mana cost tracking (one-time or per-turn)
 * - Status counter values
 * - Shadow magic specific effects
 *
 * Features:
 * - Unified interface for all effect types
 * - Posture management (only one active at a time)
 * - Injury stacking with configurable amounts
 * - Integration with FoundryVTT's status effect system
 * - Token transformation system
 * - Token filter system with persistent shadow effects
 * - Animation system (both one-time and persistent)
 * - Increasable effects with counters
 * - Mana cost display and tracking
 * - Status counter integration
 * - External effect detection and management
 * - Shadow magic specialization
 */

(async () => {
    // === ACTOR VALIDATION ===
    const actor = canvas.tokens.controlled[0]?.actor;

    if (!actor) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Moctei !");
        return;
    }

    // === CONFIGURATION ===

    // Custom Active Effects with Flags - MOCTEI'S SHADOW MAGIC EFFECTS
    const CUSTOM_EFFECTS = {
        // Example: Dagues d'ombre effect (will be configured when implementing the spell)
        "Dagues d'ombre": {
            name: "Dagues d'ombre",
            icon: "icons/weapons/daggers/dagger-curved-purple.webp",
            flags: [],
            description: "Dagues d'ombre invoquées - Attaques gratuites disponibles",
            category: "custom",
            increasable: false,
            hasFilters: true,
            filters: {
                filterId: "shadowDaggers",
                filterConfigs: [
                    {
                        filterType: "shadow",
                        blur: 2,
                        quality: 5,
                        distance: 0.3,
                        alpha: 0.8,
                        padding: 100,
                        color: 0x4a148c,
                        animated: {
                            blur: {
                                active: true,
                                loopDuration: 1000,
                                animType: "syncCosOscillation",
                                val1: 1,
                                val2: 3
                            }
                        }
                    }
                ]
            },
            hasAnimation: true,
            animation: {
                effectFile: "jb2a.darkness.black",
                scale: 0.8,
                fadeOut: 2000,
                persistent: true,
                sequencerName: "MocteiShadowDaggers"
            }
        }

        // TODO: Add more Moctei-specific shadow magic effects here
        // Examples:
        // - Shadow stealth effects
        // - Darkness manipulation
        // - Shadow teleportation effects
        // - Shadow binding effects
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
                const effectName = effect.name || effect.label || effect.id;
                const effectKey = effectName.toLowerCase();

                // Categorize effects based on name patterns
                if (['focus', 'offensif', 'defensif'].includes(effectKey)) {
                    configEffects.postures[effectKey] = effect;
                } else if (['blessures', 'injuries', 'wounds'].includes(effectKey)) {
                    configEffects.injuries[effectKey] = effect;
                } else {
                    configEffects.other[effectKey] = effect;
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
            console.warn("[Moctei] Token Magic FX not available for transformation");
            return;
        }

        try {
            if (shouldTransform && transformConfig) {
                console.log(`[Moctei] Applying transformation to ${token.name}`);

                // Create polymorph filter configuration
                const params = [{
                    filterType: "polymorph",
                    filterId: transformConfig.filterId,
                    targetImagePath: transformConfig.targetImagePath,
                    transitionType: transformConfig.transitionType || 4,
                    loopDuration: transformConfig.loopDuration || 1000,
                    padding: transformConfig.padding || 70,
                    magnify: transformConfig.magnify || 1,
                    animated: {
                        progress: {
                            active: true,
                            animType: "halfCosOscillation",
                            val1: 0,
                            val2: 100,
                            loopDuration: transformConfig.loopDuration || 1000
                        }
                    }
                }];

                await TokenMagic.addUpdateFilters(token, params);
                console.log(`[Moctei] Transformation applied successfully`);

            } else {
                console.log(`[Moctei] Removing transformation from ${token.name}`);

                // Remove the specific transformation filter
                const filterId = transformConfig?.filterId || "shadowTransformation";
                await TokenMagic.deleteFilters(token, filterId);
                console.log(`[Moctei] Transformation removed successfully`);
            }
        } catch (error) {
            console.error(`[Moctei] Error with token transformation:`, error);
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
            console.warn("[Moctei] Sequencer not available for transformation animation");
            return;
        }

        try {
            const seq = new Sequence();
            seq.effect()
                .file(animConfig.effectFile)
                .attachTo(token)
                .scale(animConfig.scale || 0.8)
                .duration(animConfig.duration || 2000);

            await seq.play();
            console.log(`[Moctei] Transformation animation played`);
        } catch (error) {
            console.error(`[Moctei] Error playing transformation animation:`, error);
        }
    }

    /**
     * Apply or remove Token Magic FX filters (specialized for shadow effects)
     * @param {Token} token - The token to apply filters to
     * @param {Object} filterConfig - Filter configuration
     * @param {boolean} shouldApply - True to apply filters, false to remove
     */
    async function applyTokenFilters(token, filterConfig, shouldApply) {
        if (!token || typeof TokenMagic === "undefined") {
            console.warn("[Moctei] Token Magic FX not available for filters");
            return;
        }

        try {
            if (shouldApply && filterConfig.filterConfigs) {
                console.log(`[Moctei] Applying shadow filters to ${token.name}`);

                // Apply each configured filter
                for (const filterConf of filterConfig.filterConfigs) {
                    const params = [{
                        ...filterConf,
                        filterId: `${filterConfig.filterId}_${filterConf.filterType}`
                    }];
                    await TokenMagic.addUpdateFilters(token, params);
                }
                console.log(`[Moctei] Shadow filters applied successfully`);

            } else {
                console.log(`[Moctei] Removing shadow filters from ${token.name}`);

                // Remove all filters for this effect
                await TokenMagic.deleteFilters(token, filterConfig.filterId);
                console.log(`[Moctei] Shadow filters removed successfully`);
            }
        } catch (error) {
            console.error(`[Moctei] Error with token filters:`, error);
        }
    }

    /**
     * Play persistent animation using Sequencer (specialized for shadow effects)
     * @param {Token} token - The token to animate
     * @param {Object} animConfig - Animation configuration
     * @param {boolean} isActivating - True if activating effect, false if deactivating
     */
    async function playPersistentAnimation(token, animConfig, isActivating) {
        if (!token || typeof Sequence === "undefined") {
            console.warn("[Moctei] Sequencer not available for persistent animation");
            return;
        }

        try {
            if (isActivating && animConfig.persistent) {
                console.log(`[Moctei] Starting persistent shadow animation for ${token.name}`);

                const seq = new Sequence();
                seq.effect()
                    .file(animConfig.effectFile)
                    .attachTo(token)
                    .scale(animConfig.scale || 0.8)
                    .fadeOut(animConfig.fadeOut || 2000)
                    .persist()
                    .name(animConfig.sequencerName);

                await seq.play();
                console.log(`[Moctei] Persistent shadow animation started: ${animConfig.sequencerName}`);

            } else if (!isActivating && animConfig.sequencerName) {
                console.log(`[Moctei] Ending persistent shadow animation: ${animConfig.sequencerName}`);
                Sequencer.EffectManager.endEffects({ name: animConfig.sequencerName });
            }
        } catch (error) {
            console.error(`[Moctei] Error with persistent animation:`, error);
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
            state.customEffects[key] = actor.effects?.contents?.some(e => e.name === effectData.name) || false;
        }

        // Check postures (mutually exclusive)
        for (const [key, postureData] of Object.entries(POSTURES)) {
            const effectName = postureData.name || postureData.label;
            if (actor.effects?.contents?.some(e => e.name === effectName)) {
                state.currentPosture = key;
                break; // Only one posture can be active
            }
        }

        // Check injuries from CONFIG
        state.injuries = {};
        for (const [key, injuryData] of Object.entries(INJURY_EFFECTS)) {
            const effectName = injuryData.name || injuryData.label;
            const injuryEffect = actor.effects?.contents?.find(e => e.name === effectName);
            if (injuryEffect) {
                state.injuries[key] = injuryEffect.flags?.statuscounter?.value || 1;
                state.injuryCount += state.injuries[key];
            }
        }

        // Check other config status effects
        for (const [key, effectData] of Object.entries(configStatusEffects.other)) {
            const effectName = effectData.name || effectData.label;
            state.statusEffects[key] = actor.effects?.contents?.some(e => e.name === effectName) || false;
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
            if (!knownEffectNames.has(effect.name.toLowerCase())) {
                outsideEffects.push(effect);
            }
        }

        return outsideEffects;
    };

    const outsideEffects = getCustomOutsideEffects();

    // === BUILD DIALOG CONTENT ===
    let dialogContent = `
        <h3>🌑 Gestionnaire d'Effets - Moctei (Mage des Ombres)</h3>
        <p><strong>Token:</strong> ${actor.name}</p>
        <style>
            .effect-section { margin: 20px 0; padding: 15px; border: 2px solid #ccc; border-radius: 8px; }
            .effect-item { margin: 8px 0; padding: 12px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; }
            .effect-icon { width: 24px; height: 24px; margin-right: 10px; background-size: cover; background-position: center; border-radius: 4px; display: inline-block; }
            .effect-icon[data-is-svg="true"] { background-color: #444; border-radius: 4px; }
            .status-indicator { font-weight: bold; margin-left: 10px; }
            .button-group { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
            .btn { padding: 6px 12px; border: none; border-radius: 4px; font-size: 0.9em; cursor: pointer; }
            .btn-add { background: #4a148c; color: white; }
            .btn-remove { background: #7b1fa2; color: white; }
            .btn-disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
            .pending-change { box-shadow: 0 0 5px #4a148c !important; }
        </style>
    `;

    let pendingChanges = {};

    // === CUSTOM OUTSIDE EFFECTS SECTION ===
    if (outsideEffects.length > 0) {
        dialogContent += `
            <div class="effect-section" style="border-color: #ff5722;">
                <h4>🔍 Effets Externes Détectés</h4>
                <p style="margin: 8px 0; font-size: 0.9em; color: #666;">Effets présents sur Moctei mais non configurés dans ce gestionnaire</p>
        `;

        for (const effect of outsideEffects) {
            const effectIcon = effect.icon || "icons/svg/mystery-man.svg";
            const isSvg = effectIcon.toLowerCase().endsWith('.svg');

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${effectIcon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effect.name}</strong>
                            <br><small style="color: #666;">Effet externe non géré</small>
                        </div>
                        <div class="status-indicator" style="color: #ff9800;">
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
            <div class="effect-section" style="border-color: #4a148c;">
                <h4>🌑 Effets d'Ombre de Moctei</h4>
        `;

        for (const [key, effectData] of Object.entries(CUSTOM_EFFECTS)) {
            const isActive = currentState.customEffects[key];
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? "ACTIVE" : "INACTIVE";
            const statusColor = isActive ? "#2e7d32" : "#d32f2f";
            const effectIcon = effectData.icon || "icons/svg/aura.svg";
            const isSvg = effectIcon.toLowerCase().endsWith('.svg');

            const manaCostDisplay = effectData.manaCost ?
                `<div style="color: #3f51b5; font-size: 0.8em;">Coût: ${effectData.manaCost} mana${effectData.isPerTurn ? '/tour' : ''}</div>` : '';

            dialogContent += `
                <div class="effect-item" id="effect-${key}">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${effectIcon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effectData.name}</strong>
                            <br><small style="color: #666;">${effectData.description}</small>
                            ${manaCostDisplay}
                        </div>
                        <div class="status-indicator" style="color: ${statusColor};">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
            `;

            if (effectData.increasable) {
                const currentValue = actor.effects?.contents?.find(e => e.name === effectData.name)?.flags?.statuscounter?.value || 0;
                dialogContent += `
                    <div style="margin: 8px 0; padding: 8px; background: #f0f0f0; border-radius: 4px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>Valeur:</span>
                            <input type="number" id="customCount-${key}" value="${currentValue}" min="0" max="10" style="width: 80px;">
                        </label>
                    </div>
                `;
            }

            dialogContent += `
                    <div class="button-group">
                        <button type="button" class="btn ${isActive ? 'btn-disabled' : 'btn-add'}" data-action="add" data-effect="${key}" data-category="custom" ${isActive ? 'disabled' : ''}>
                            ➕ Activer
                        </button>
                        <button type="button" class="btn ${!isActive ? 'btn-disabled' : 'btn-remove'}" data-action="remove" data-effect="${key}" data-category="custom" ${!isActive ? 'disabled' : ''}>
                            ➖ Désactiver
                        </button>
                        ${effectData.increasable ? `
                        <button type="button" class="btn btn-add" data-action="setCustomCount" data-effect="${key}" data-category="custom">
                            📊 Définir Valeur
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }
        dialogContent += `</div>`;
    } else {
        dialogContent += `
            <div class="effect-section" style="border-color: #4a148c;">
                <h4>🌑 Effets d'Ombre de Moctei</h4>
                <div class="effect-item" style="text-align: center; color: #666; font-style: italic;">
                    Aucun effet d'ombre configuré.
                    <br><small>Les effets spécifiques de Moctei seront ajoutés ici.</small>
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
            <div class="effect-item" id="posture-${key}">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${postureIcon}');"></div>
                    <div style="flex-grow: 1;">
                        <strong>${postureData.name || postureData.label}</strong>
                        <br><small style="color: #666;">Posture de combat</small>
                    </div>
                    <div class="status-indicator" style="color: ${statusColor};">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="btn ${isActive ? 'btn-disabled' : 'btn-add'}" data-action="add" data-effect="${key}" data-category="posture" ${isActive ? 'disabled' : ''}>
                        ➕ Activer
                    </button>
                </div>
            </div>
        `;
    }
    dialogContent += `</div>`;

    // === INJURIES SECTION ===
    if (Object.keys(INJURY_EFFECTS).length > 0) {
        dialogContent += `
            <div class="effect-section" style="border-color: #d32f2f;">
                <h4>🩸 Blessures</h4>
        `;

        for (const [key, injuryData] of Object.entries(INJURY_EFFECTS)) {
            const currentCount = currentState.injuries[key] || 0;
            const isActive = currentCount > 0;
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? `ACTIVE (${currentCount})` : "INACTIVE";
            const statusColor = isActive ? "#d32f2f" : "#757575";
            const injuryIcon = injuryData.icon || injuryData.img;
            const isSvg = injuryIcon && injuryIcon.toLowerCase().endsWith('.svg');

            dialogContent += `
                <div class="effect-item" id="injury-${key}">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${injuryIcon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${injuryData.name || injuryData.label}</strong>
                            <br><small style="color: #666;">Blessures cumulatives</small>
                        </div>
                        <div class="status-indicator" style="color: ${statusColor};">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
                    <div style="margin: 8px 0; padding: 8px; background: #ffebee; border-radius: 4px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>Ajouter/Retirer:</span>
                            <input type="number" id="injuryValue-${key}" value="1" min="1" max="5" style="width: 80px;">
                            <span>blessure(s)</span>
                        </label>
                    </div>
                    <div class="button-group">
                        <button type="button" class="btn btn-add" data-action="add" data-effect="${key}" data-category="injury">
                            ➕ Ajouter
                        </button>
                        <button type="button" class="btn ${!isActive ? 'btn-disabled' : 'btn-remove'}" data-action="remove" data-effect="${key}" data-category="injury" ${!isActive ? 'disabled' : ''}>
                            ➖ Retirer
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
            const isActive = currentState.statusEffects[key];
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? "ACTIVE" : "INACTIVE";
            const statusColor = isActive ? "#2e7d32" : "#d32f2f";
            const effectIcon = effectData.icon || effectData.img;
            const isSvg = effectIcon && effectIcon.toLowerCase().endsWith('.svg');

            dialogContent += `
                <div class="effect-item" id="status-${key}">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${effectIcon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effectData.name || effectData.label}</strong>
                            <br><small style="color: #666;">Effet de statut</small>
                        </div>
                        <div class="status-indicator" style="color: ${statusColor};">
                            ${statusIcon} ${statusText}
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="button" class="btn ${isActive ? 'btn-disabled' : 'btn-add'}" data-action="add" data-effect="${key}" data-category="status" ${isActive ? 'disabled' : ''}>
                            ➕ Activer
                        </button>
                        <button type="button" class="btn ${!isActive ? 'btn-disabled' : 'btn-remove'}" data-action="remove" data-effect="${key}" data-category="status" ${!isActive ? 'disabled' : ''}>
                            ➖ Désactiver
                        </button>
                    </div>
                </div>
            `;
        }
        dialogContent += `</div>`;
    }

    // === DIALOG CREATION ===
    const result = await new Promise((resolve) => {
        const d = new Dialog({
            title: "🌑 Gestionnaire d'Effets - Moctei",
            content: dialogContent,
            buttons: {
                removeAll: {
                    icon: '<i class="fas fa-trash-alt"></i>',
                    label: "🗑️ Tout Supprimer",
                    callback: () => resolve({ action: "removeAll" })
                },
                apply: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "✅ Appliquer Changements",
                    callback: (html) => {
                        const injuryValues = {};
                        const customCountValues = {};

                        // Collect injury values
                        for (const key of Object.keys(INJURY_EFFECTS)) {
                            const input = html.find(`#injuryValue-${key}`)[0];
                            if (input) {
                                injuryValues[key] = parseInt(input.value) || 1;
                            }
                        }

                        // Collect custom count values
                        for (const key of Object.keys(CUSTOM_EFFECTS)) {
                            if (CUSTOM_EFFECTS[key].increasable) {
                                const input = html.find(`#customCount-${key}`)[0];
                                if (input) {
                                    customCountValues[key] = parseInt(input.value) || 0;
                                }
                            }
                        }

                        resolve({
                            pendingChanges,
                            injuryValues,
                            customCountValues
                        });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "apply",
            render: (html) => {
                // Add click handlers for all buttons
                html.find('button[data-action]').on('click', function(event) {
                    event.preventDefault();
                    const action = $(this).data('action');
                    const effect = $(this).data('effect');
                    const category = $(this).data('category');

                    if ($(this).prop('disabled')) return;

                    console.log(`[Moctei] Button clicked: ${action} ${effect} ${category}`);

                    // Store the change
                    pendingChanges[`${category}-${effect}`] = { action, effect, category };

                    // Visual feedback
                    const effectItem = $(this).closest('.effect-item');
                    effectItem.addClass('pending-change');

                    // Update button states
                    if (action === 'add') {
                        effectItem.find('[data-action="add"]').prop('disabled', true).addClass('btn-disabled');
                        effectItem.find('[data-action="remove"]').prop('disabled', false).removeClass('btn-disabled');
                    } else if (action === 'remove') {
                        effectItem.find('[data-action="remove"]').prop('disabled', true).addClass('btn-disabled');
                        effectItem.find('[data-action="add"]').prop('disabled', false).removeClass('btn-disabled');
                    }
                });
            }
        }, {
            width: 600,
            height: 800,
            resizable: true,
            top: window.innerHeight * 0.1
        });
        d.render(true);
    });

    if (!result) {
        ui.notifications.info("Opération annulée.");
        return;
    }

    // === HANDLE REMOVE ALL ===
    if (result.action === "removeAll") {
        try {
            const effectsToRemove = actor.effects.contents.slice();
            for (const effect of effectsToRemove) {
                await effect.delete();
            }
            ui.notifications.success(`🌑 Tous les effets de ${actor.name} ont été supprimés !`);
        } catch (error) {
            console.error("[Moctei] Error removing all effects:", error);
            ui.notifications.error("Erreur lors de la suppression des effets !");
        }
        return;
    }

    // === PROCESS CHANGES ===
    const { pendingChanges: changes, injuryValues, customCountValues } = result;

    try {
        let addedEffects = [];
        let removedEffects = [];
        let modifiedEffects = [];

        // Process each pending change
        for (const changeKey in changes) {
            const change = changes[changeKey];
            const { action, effect, category } = change;

            console.log(`[Moctei] Processing: ${action} ${effect} in ${category}`);

            if (category === 'custom') {
                const effectData = CUSTOM_EFFECTS[effect];
                if (!effectData) continue;

                if (action === 'add') {
                    // Create effect data
                    const newEffectData = {
                        name: effectData.name,
                        icon: effectData.icon,
                        description: effectData.description,
                        duration: { seconds: 86400 }, // 24 hours default
                        flags: {},
                        visible: true
                    };

                    // Add flags
                    if (effectData.flags) {
                        for (const flag of effectData.flags) {
                            newEffectData.flags[flag.key] = { value: flag.value };
                        }
                    }

                    // Add increasable support
                    if (effectData.increasable) {
                        newEffectData.flags.statuscounter = {
                            active: true,
                            value: customCountValues[effect] || 0
                        };
                    }

                    // Add mana cost tracking
                    if (effectData.manaCost) {
                        newEffectData.flags.manaCost = {
                            value: effectData.manaCost,
                            isPerTurn: effectData.isPerTurn || false
                        };
                    }

                    // Add status counter value
                    if (effectData.statusCounterValue) {
                        newEffectData.flags.statuscounter = {
                            ...newEffectData.flags.statuscounter,
                            value: effectData.statusCounterValue
                        };
                    }

                    // Create the effect
                    const createdEffect = await actor.createEmbeddedDocuments("ActiveEffect", [newEffectData]);
                    const effect = createdEffect[0];

                    console.log(`[Moctei] Created effect: ${effectData.name}`);

                    // Apply special effects after creation
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay

                    // Apply transformation
                    if (effectData.hasTransformation && effectData.transformation) {
                        const token = canvas.tokens.get(actor.token?.id) || canvas.tokens.controlled[0];
                        if (token) {
                            await applyTokenTransformation(token, effectData.transformation, true);
                        }
                    }

                    // Apply filters
                    if (effectData.hasFilters && effectData.filters) {
                        const token = canvas.tokens.get(actor.token?.id) || canvas.tokens.controlled[0];
                        if (token) {
                            await applyTokenFilters(token, effectData.filters, true);
                        }
                    }

                    // Play animation
                    if (effectData.hasAnimation && effectData.animation) {
                        const token = canvas.tokens.get(actor.token?.id) || canvas.tokens.controlled[0];
                        if (token) {
                            if (effectData.animation.persistent) {
                                await playPersistentAnimation(token, effectData.animation, true);
                            } else {
                                await playTransformationAnimation(token, effectData.animation, true);
                            }
                        }
                    }

                    addedEffects.push(effectData.name);

                } else if (action === 'remove') {
                    const existingEffect = actor.effects.contents.find(e => e.name === effectData.name);
                    if (existingEffect) {
                        // Clean up special effects before removal
                        const token = canvas.tokens.get(actor.token?.id) || canvas.tokens.controlled[0];

                        if (token && effectData.hasTransformation && effectData.transformation) {
                            await applyTokenTransformation(token, effectData.transformation, false);
                        }

                        if (token && effectData.hasFilters && effectData.filters) {
                            await applyTokenFilters(token, effectData.filters, false);
                        }

                        if (token && effectData.hasAnimation && effectData.animation && effectData.animation.persistent) {
                            await playPersistentAnimation(token, effectData.animation, false);
                        }

                        await existingEffect.delete();
                        removedEffects.push(effectData.name);
                        console.log(`[Moctei] Removed effect: ${effectData.name}`);
                    }

                } else if (action === 'setCustomCount') {
                    const existingEffect = actor.effects.contents.find(e => e.name === effectData.name);
                    if (existingEffect && effectData.increasable) {
                        const newValue = customCountValues[effect] || 0;
                        await existingEffect.update({
                            "flags.statuscounter.value": newValue
                        });
                        modifiedEffects.push(`${effectData.name} (${newValue})`);
                        console.log(`[Moctei] Updated counter for ${effectData.name}: ${newValue}`);
                    }
                }

            } else if (category === 'posture') {
                if (action === 'add') {
                    // Remove any existing posture first
                    const existingPostures = actor.effects.contents.filter(e =>
                        Object.values(POSTURES).some(p => (p.name || p.label) === e.name)
                    );
                    for (const existingPosture of existingPostures) {
                        await existingPosture.delete();
                        removedEffects.push(existingPosture.name);
                    }

                    // Add new posture
                    const postureData = POSTURES[effect];
                    if (postureData) {
                        const effectData = {
                            name: postureData.name || postureData.label,
                            icon: postureData.icon || postureData.img,
                            description: `Posture: ${postureData.name || postureData.label}`,
                            duration: { seconds: 86400 },
                            flags: postureData.flags || {},
                            visible: true
                        };

                        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                        addedEffects.push(postureData.name || postureData.label);
                        console.log(`[Moctei] Added posture: ${postureData.name || postureData.label}`);
                    }

                } else if (action === 'removePostures') {
                    const existingPostures = actor.effects.contents.filter(e =>
                        Object.values(POSTURES).some(p => (p.name || p.label) === e.name)
                    );
                    for (const existingPosture of existingPostures) {
                        await existingPosture.delete();
                        removedEffects.push(existingPosture.name);
                    }
                    console.log(`[Moctei] Removed all postures`);
                }

            } else if (category === 'injury') {
                const injuryData = INJURY_EFFECTS[effect];
                if (!injuryData) continue;

                const existingEffect = actor.effects.contents.find(e => e.name === (injuryData.name || injuryData.label));
                const changeAmount = injuryValues[effect] || 1;

                if (action === 'add') {
                    if (existingEffect) {
                        const currentValue = existingEffect.flags?.statuscounter?.value || 0;
                        const newValue = currentValue + changeAmount;
                        await existingEffect.update({
                            "flags.statuscounter.value": newValue
                        });
                        modifiedEffects.push(`${injuryData.name || injuryData.label} (+${changeAmount} = ${newValue})`);
                    } else {
                        // Create new injury effect
                        const effectData = {
                            name: injuryData.name || injuryData.label,
                            icon: injuryData.icon || injuryData.img,
                            description: `Blessures: ${changeAmount}`,
                            duration: { seconds: 86400 },
                            flags: {
                                ...injuryData.flags,
                                statuscounter: { active: true, value: changeAmount }
                            },
                            visible: true
                        };

                        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                        addedEffects.push(`${injuryData.name || injuryData.label} (${changeAmount})`);
                    }
                    console.log(`[Moctei] Added ${changeAmount} injuries`);

                } else if (action === 'remove') {
                    if (existingEffect) {
                        const currentValue = existingEffect.flags?.statuscounter?.value || 0;
                        const newValue = Math.max(0, currentValue - changeAmount);

                        if (newValue > 0) {
                            await existingEffect.update({
                                "flags.statuscounter.value": newValue
                            });
                            modifiedEffects.push(`${injuryData.name || injuryData.label} (-${changeAmount} = ${newValue})`);
                        } else {
                            await existingEffect.delete();
                            removedEffects.push(injuryData.name || injuryData.label);
                        }
                    }
                    console.log(`[Moctei] Removed ${changeAmount} injuries`);
                }

            } else if (category === 'status') {
                const statusData = configStatusEffects.other[effect];
                if (!statusData) continue;

                if (action === 'add') {
                    const effectData = {
                        name: statusData.name || statusData.label,
                        icon: statusData.icon || statusData.img,
                        description: `Effet: ${statusData.name || statusData.label}`,
                        duration: { seconds: 86400 },
                        flags: statusData.flags || {},
                        visible: true
                    };

                    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                    addedEffects.push(statusData.name || statusData.label);
                    console.log(`[Moctei] Added status effect: ${statusData.name || statusData.label}`);

                } else if (action === 'remove') {
                    const existingEffect = actor.effects.contents.find(e => e.name === (statusData.name || statusData.label));
                    if (existingEffect) {
                        await existingEffect.delete();
                        removedEffects.push(statusData.name || statusData.label);
                        console.log(`[Moctei] Removed status effect: ${statusData.name || statusData.label}`);
                    }
                }

            } else if (category === 'external') {
                if (action === 'removeExternal') {
                    const externalEffect = actor.effects.contents.find(e => e.id === effect);
                    if (externalEffect) {
                        await externalEffect.delete();
                        removedEffects.push(externalEffect.name);
                        console.log(`[Moctei] Removed external effect: ${externalEffect.name}`);
                    }
                }
            }
        }

        // Summary message
        let message = `🌑 Changements appliqués pour ${actor.name}:`;
        if (addedEffects.length > 0) {
            message += `\n✅ Ajoutés: ${addedEffects.join(', ')}`;
        }
        if (modifiedEffects.length > 0) {
            message += `\n📊 Modifiés: ${modifiedEffects.join(', ')}`;
        }
        if (removedEffects.length > 0) {
            message += `\n❌ Supprimés: ${removedEffects.join(', ')}`;
        }

        ui.notifications.success(message);

    } catch (error) {
        console.error("[Moctei] Error processing changes:", error);
        ui.notifications.error("Erreur lors de l'application des changements !");
    }
})();
