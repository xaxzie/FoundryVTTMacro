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
 * Fe                        // Reset status display
                        const originalState = category === 'posture' ?
                            (currentState.currentPosture === effectKey) :
                            (category === 'custom' ? currentState.customEffects[effectKey] !== null : currentState.statusEffects[effectKey] !== null);

                        const originalIcon = originalState ? "✅" : "❌";
                        const originalText = originalState ? "ACTIVE" : "INACTIVE";
                        const originalColor = originalState ? "#2e7d32" : "#d32f2f"; * - Unified interface for all effect types
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
        // Dagues d'ombre effect
        "Dagues d'ombre": {
            name: "Dagues d'ombre",
            icon: "icons/weapons/daggers/dagger-curved-purple.webp",
            flags: [],
            description: "Dagues d'ombre invoquées - coute 2 Mana -  Attaques gratuites disponibles",
            category: "custom",
            increasable: false,
            hasFilters: false,
            hasAnimation: true,
            animation: {
                effectFile: "jb2a_patreon.extras.tmfx.runes.circle.simple.conjuration",
                scale: 0.4,
                fadeOut: 2000,
                persistent: false,
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

        // Check custom effects - Store the actual effect object or null
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
                break; // Only one posture can be active
            }
        }

        // Check injuries from CONFIG - Store the actual effect object or null
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

        // Check other config status effects - Store the actual effect object or null
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
            const existingEffect = currentState.customEffects[key];
            const isActive = existingEffect !== null;
            const statusIcon = isActive ? "✅" : "❌";
            const statusText = isActive ? "ACTIVE" : "INACTIVE";
            const statusColor = isActive ? "#2e7d32" : "#d32f2f";
            const effectIcon = effectData.icon || "icons/svg/aura.svg";
            const isSvg = effectIcon.toLowerCase().endsWith('.svg');

            const manaCostDisplay = effectData.manaCost ?
                `<div style="color: #3f51b5; font-size: 0.8em;">Coût: ${effectData.manaCost} mana${effectData.isPerTurn ? '/tour' : ''}</div>` : '';

            // Get current value for increasable effects
            const currentValue = effectData.increasable ?
                (existingEffect?.flags?.statuscounter?.value || 0) : 0;

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
                    <div class="button-group">
                        <button type="button" class="btn ${isActive ? 'btn-remove' : 'btn-add'}" data-action="${isActive ? 'remove' : 'add'}" data-effect="${key}" data-category="custom">
                            ${isActive ? '➖ Désactiver' : '➕ Activer'}
                        </button>
                        ${effectData.increasable ? `
                        <label>Valeur: <input type="number" id="customCount-${key}" value="${currentValue}" min="0" max="10" style="width: 60px; margin: 0 8px;"></label>
                        <button type="button" class="btn btn-add" data-action="setCustomCount" data-effect="${key}" data-category="custom">
                            📊 Appliquer
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
            <div class="effect-section" style="border-color: #d32f2f;">
                <h4>🩸 Blessures</h4>
        `;

        for (const [key, injuryData] of Object.entries(INJURY_EFFECTS)) {
            const existingInjury = currentState.injuries[key];
            const currentCount = existingInjury ? (existingInjury.flags?.statuscounter?.value || 1) : 0;
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
                    <div class="button-group">
                        <label>Nombre: <input type="number" id="injuryCount-${key}" value="${currentCount}" min="0" max="10" style="width: 60px; margin: 0 8px;"></label>
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
                <h4>🎭 Autres Effets de Statut</h4>
        `;

        for (const [key, effectData] of Object.entries(configStatusEffects.other)) {
            const isActive = currentState.statusEffects[key] !== null;
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
                        <button type="button" class="btn ${isActive ? 'btn-remove' : 'btn-add'}" data-action="${isActive ? 'remove' : 'add'}" data-effect="${key}" data-category="status">
                            ${isActive ? '➖ Désactiver' : '➕ Activer'}
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
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: "� Sauvegarder",
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

                    if (action === 'setInjuries' || action === 'setCustomCount' || action === 'removeExternal') {
                        // Handle injury/custom/external count setting directly
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
                            (category === 'custom' ? currentState.customEffects[effectKey] : currentState.statusEffects[effectKey]);

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
                        }
                        statusDiv.html(`<strong style="color: #2196f3;">${pendingText}</strong>`);
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

        // Handle custom count effects updates (increasable effects)
        for (const [customKey, newValue] of Object.entries(customCountValues || {})) {
            const customData = CUSTOM_EFFECTS[customKey];
            if (!customData || !customData.increasable) continue;

            const currentCustomEffect = currentState.customEffects[customKey];
            const currentValue = currentCustomEffect ? (currentCustomEffect.flags?.statuscounter?.value || 0) : 0;

            if (newValue !== currentValue) {
                if (newValue === 0 && currentCustomEffect) {
                    await currentCustomEffect.delete();
                    removedEffects.push(customData.name);
                    console.log(`[Moctei] Removed increasable effect: ${customData.name}`);

                    // Handle special effects removal for increasable effects
                    if (canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];

                        // Handle transformation removal
                        if (customData.hasTransformation) {
                            if (customData.hasAnimation) {
                                await playTransformationAnimation(token, customData.animation, false);
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                            await applyTokenTransformation(token, customData.transformation, false);
                        }

                        // Handle filter removal
                        if (customData.hasFilters) {
                            if (customData.hasAnimation) {
                                await playPersistentAnimation(token, customData.animation, false);
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                            await applyTokenFilters(token, customData.filters, false);
                        }

                        // Handle standalone animations removal for increasable effects
                        if (customData.hasAnimation && !customData.hasTransformation && !customData.hasFilters) {
                            if (customData.animation.persistent) {
                                await playPersistentAnimation(token, customData.animation, false);
                            }
                            // Note: Non-persistent animations don't need cleanup as they are already finished
                            console.log(`[Moctei] Cleaned up standalone animation for increasable ${customData.name}`);
                        }
                    }

                } else if (newValue > 0) {
                    if (currentCustomEffect) {
                        // Update existing
                        await currentCustomEffect.update({
                            "flags.statuscounter.value": newValue
                        });
                        modifiedEffects.push(`${customData.name} (${newValue})`);
                        console.log(`[Moctei] Updated increasable effect: ${customData.name} to ${newValue}`);
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

                        await actor.createEmbeddedDocuments("ActiveEffect", [customEffect]);
                        addedEffects.push(`${customData.name} (${newValue})`);
                        console.log(`[Moctei] Added increasable effect: ${customData.name} with ${newValue}`);

                        // Handle special effects addition for increasable effects (only when creating new)
                        if (canvas.tokens.controlled.length > 0) {
                            const token = canvas.tokens.controlled[0];

                            // Handle transformation addition
                            if (customData.hasTransformation) {
                                if (customData.hasAnimation) {
                                    await playTransformationAnimation(token, customData.animation, true);
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }
                                await applyTokenTransformation(token, customData.transformation, true);
                            }

                            // Handle filter addition
                            if (customData.hasFilters) {
                                if (customData.hasAnimation) {
                                    await playPersistentAnimation(token, customData.animation, true);
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }
                                await applyTokenFilters(token, customData.filters, true);
                            }

                            // Handle standalone animations for increasable effects
                            if (customData.hasAnimation && !customData.hasTransformation && !customData.hasFilters) {
                                if (customData.animation.persistent) {
                                    await playPersistentAnimation(token, customData.animation, true);
                                } else {
                                    await playTransformationAnimation(token, customData.animation, true);
                                }
                                console.log(`[Moctei] Played standalone animation for increasable ${customData.name}`);
                            }
                        }
                    }
                }
            }
        }

        // Handle injury updates
        for (const [injuryKey, newValue] of Object.entries(injuryValues)) {
            const injuryData = INJURY_EFFECTS[injuryKey];
            if (!injuryData) continue;

            const currentInjuryEffect = currentState.injuries[injuryKey];
            const currentValue = currentInjuryEffect ? (currentInjuryEffect.flags?.statuscounter?.value || 1) : 0;

            if (newValue !== currentValue) {
                if (newValue === 0 && currentInjuryEffect) {
                    await currentInjuryEffect.delete();
                    removedEffects.push(injuryData.name || injuryData.label);
                    console.log(`[Moctei] Removed injury: ${injuryData.name || injuryData.label}`);
                } else if (newValue > 0) {
                    if (currentInjuryEffect) {
                        // Update existing
                        await currentInjuryEffect.update({
                            "flags.statuscounter.value": newValue
                        });
                        modifiedEffects.push(`${injuryData.name || injuryData.label} (${newValue})`);
                        console.log(`[Moctei] Updated injury: ${injuryData.name || injuryData.label} to ${newValue}`);
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

                        await actor.createEmbeddedDocuments("ActiveEffect", [injuryEffect]);
                        addedEffects.push(`${injuryData.name || injuryData.label} (${newValue})`);
                        console.log(`[Moctei] Added injury: ${injuryData.name || injuryData.label} with ${newValue}`);
                    }
                }
            }
        }

        // Process each pending change
        for (const [effectKey, changeData] of Object.entries(changes)) {
            const { action, category } = changeData;

            console.log(`[Moctei] Processing: ${action} ${effectKey} in ${category}`);

            if (category === 'custom') {
                const effectData = CUSTOM_EFFECTS[effectKey];
                if (!effectData) continue;

                // Skip increasable effects - they're handled separately
                if (effectData.increasable) continue;

                if (action === 'add') {
                    const flagsObject = {};
                    if (effectData.flags) {
                        effectData.flags.forEach(flag => {
                            flagsObject[flag.key] = { value: flag.value };
                        });
                    }

                    const newEffectData = {
                        name: effectData.name,
                        icon: effectData.icon,
                        origin: actor.uuid,
                        duration: { seconds: 86400 },
                        flags: flagsObject
                    };

                    await actor.createEmbeddedDocuments("ActiveEffect", [newEffectData]);
                    addedEffects.push(effectData.name);
                    console.log(`[Moctei] Added effect: ${effectData.name}`);

                    // Handle special effects (transformations, filters, animations)
                    if (canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];

                        // Handle transformation effects
                        if (effectData.hasTransformation) {
                            // Play animation first
                            if (effectData.hasAnimation) {
                                await playTransformationAnimation(token, effectData.animation, true);
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }

                            // Apply transformation
                            await applyTokenTransformation(token, effectData.transformation, true);
                            console.log(`[Moctei] Applied transformation for ${effectData.name}`);
                        }

                        // Handle filter effects
                        if (effectData.hasFilters) {
                            // Play persistent animation first
                            if (effectData.hasAnimation) {
                                await playPersistentAnimation(token, effectData.animation, true);
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }

                            // Apply filters
                            await applyTokenFilters(token, effectData.filters, true);
                            console.log(`[Moctei] Applied filters for ${effectData.name}`);
                        }

                        // Handle standalone animations (no transformation or filters)
                        if (effectData.hasAnimation && !effectData.hasTransformation && !effectData.hasFilters) {
                            if (effectData.animation.persistent) {
                                await playPersistentAnimation(token, effectData.animation, true);
                            } else {
                                await playTransformationAnimation(token, effectData.animation, true);
                            }
                            console.log(`[Moctei] Played standalone animation for ${effectData.name}`);
                        }
                    }

                } else if (action === 'remove') {
                    const existing = currentState.customEffects[effectKey];
                    if (existing) {
                        // Handle special effects removal
                        if (canvas.tokens.controlled.length > 0) {
                            const token = canvas.tokens.controlled[0];

                            // Handle transformation removal
                            if (effectData.hasTransformation) {
                                // Play animation first
                                if (effectData.hasAnimation) {
                                    await playTransformationAnimation(token, effectData.animation, false);
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }

                                // Revert transformation
                                await applyTokenTransformation(token, effectData.transformation, false);
                                console.log(`[Moctei] Removed transformation for ${effectData.name}`);
                            }

                            // Handle filter removal
                            if (effectData.hasFilters) {
                                // End persistent animation first
                                if (effectData.hasAnimation) {
                                    await playPersistentAnimation(token, effectData.animation, false);
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }

                                // Remove filters
                                await applyTokenFilters(token, effectData.filters, false);
                                console.log(`[Moctei] Removed filters for ${effectData.name}`);
                            }

                            // Handle standalone animations removal (no transformation or filters)
                            if (effectData.hasAnimation && !effectData.hasTransformation && !effectData.hasFilters) {
                                if (effectData.animation.persistent) {
                                    await playPersistentAnimation(token, effectData.animation, false);
                                }
                                // Note: Non-persistent animations don't need cleanup as they are already finished
                                console.log(`[Moctei] Cleaned up standalone animation for ${effectData.name}`);
                            }
                        }

                        await existing.delete();
                        removedEffects.push(effectData.name);
                        console.log(`[Moctei] Removed effect: ${effectData.name}`);
                    }
                }

            } else if (category === 'posture') {
                if (action === 'setPosture') {
                    // Remove current posture first
                    if (currentState.currentPosture) {
                        const currentPostureEffect = actor.effects.find(e =>
                            e.name.toLowerCase() === (POSTURES[currentState.currentPosture].name || POSTURES[currentState.currentPosture].label).toLowerCase()
                        );
                        if (currentPostureEffect) {
                            await currentPostureEffect.delete();
                            removedEffects.push(currentPostureEffect.name);
                        }
                    }

                    // Add new posture
                    const postureData = POSTURES[effectKey];
                    if (postureData) {
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

                        await actor.createEmbeddedDocuments("ActiveEffect", [postureEffect]);
                        addedEffects.push(postureData.name || postureData.label);
                        console.log(`[Moctei] Added posture: ${postureData.name || postureData.label}`);
                    }

                } else if (action === 'removePostures') {
                    if (currentState.currentPosture) {
                        const currentPostureEffect = actor.effects.find(e =>
                            e.name.toLowerCase() === (POSTURES[currentState.currentPosture].name || POSTURES[currentState.currentPosture].label).toLowerCase()
                        );
                        if (currentPostureEffect) {
                            await currentPostureEffect.delete();
                            removedEffects.push(currentPostureEffect.name);
                        }
                    }
                    console.log(`[Moctei] Removed all postures`);
                }

            } else if (category === 'status') {
                const statusData = configStatusEffects.other[effectKey];
                if (!statusData) continue;

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

                    await actor.createEmbeddedDocuments("ActiveEffect", [statusEffect]);
                    addedEffects.push(statusData.name || statusData.label);
                    console.log(`[Moctei] Added status effect: ${statusData.name || statusData.label}`);

                } else if (action === 'remove') {
                    const existing = currentState.statusEffects[effectKey];
                    if (existing) {
                        await existing.delete();
                        removedEffects.push(statusData.name || statusData.label);
                        console.log(`[Moctei] Removed status effect: ${statusData.name || statusData.label}`);
                    }
                }

            } else if (category === 'external') {
                if (action === 'removeExternal') {
                    // Find the external effect by ID
                    const externalEffect = actor.effects.get(effectKey);
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
