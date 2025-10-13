(async () => {
    // === ACTOR VALIDATION ===
    const actor = canvas.tokens.controlled[0]?.actor;

    if (!actor) {
        ui.notifications.warn("⚠️ Sélectionnez le token d'Ora !");
        return;
    }

    // === CONFIGURATION ===

    // Custom Active Effects with Flags - ORA'S WATER MAGIC EFFECTS
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
        },
        "SDF": {
            name: "SDF",
            icon: "icons/magic/perception/eye-ringed-glow-angry-small-red.webp",
            flags: [
                // SDF n'ajoute pas de bonus de stats, juste un effet de détection
            ],
            description: "Small Detection Field - Champ de détection actif",
            category: "custom",
            increasable: true,
            counterName: "Charges",
            defaultValue: 0,
            maxValue: 10,
            tags: ["increasable"], // Tag spécial pour manipulation avancée
            // Configuration spéciale pour la suppression
            hasSpecialRemoval: true,
            onRemoval: async (effect, actor) => {
                // Callback pour arrêter l'animation persistante lors de la suppression
                try {
                    if (typeof Sequencer !== "undefined") {
                        await Sequencer.EffectManager.endEffects({
                            name: `SDF_Field_${actor.id}`
                        });
                        console.log(`[HandleOraEffect] Stopped SDF persistent animation for ${actor.name}`);
                    }
                } catch (error) {
                    console.warn(`[HandleOraEffect] Could not stop SDF animation: ${error.message}`);
                }
            }
        },
        "Preparation Pilonnage": {
            name: "Preparation Pilonnage",
            icon: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp",
            flags: [
                // La préparation n'ajoute pas de bonus de stats
            ],
            description: "Préparation du sort Pilonnement - Interruptible par dégâts",
            category: "custom",
            increasable: false,
            counterName: "Niveau",
            defaultValue: 1,
            maxValue: 4,
            tags: [], // Tag spécial pour manipulation avancée
            // Configuration spéciale pour la suppression
            hasSpecialRemoval: true,
            onRemoval: async (effect, actor) => {
                // Callback pour arrêter l'animation persistante lors de la suppression
                try {
                    if (typeof Sequencer !== "undefined") {
                        await Sequencer.EffectManager.endEffects({
                            name: `Pilonnement_Preparation_${actor.id}`
                        });
                        console.log(`[HandleOraEffect] Stopped Pilonnement preparation animation for ${actor.name}`);
                    }
                } catch (error) {
                    console.warn(`[HandleOraEffect] Could not stop Pilonnement preparation animation: ${error.message}`);
                }
            }
        },
        "Cast DC": {
            name: "Cast DC",
            icon: "icons/magic/control/hypnosis-mesmerism-eye.webp",
            flags: [
                // La préparation Dead Calm n'ajoute pas de bonus de stats
            ],
            description: "Préparation du Dead Calm - Interruptible, ne peut pas esquiver",
            category: "custom",
            increasable: false,
            counterName: "Préparation",
            defaultValue: 1,
            maxValue: 1,
            tags: ["increasable"], // Tag spécial pour manipulation avancée
            // Configuration spéciale - pas d'animation persistante pour Cast DC
            hasSpecialRemoval: false
        },
        "Syphon": {
            name: "Syphon",
            icon: "icons/magic/water/projectile-water-rings.webp",
            flags: [
                // Le Syphon track ses phases et extensions
            ],
            description: "Syphon de Grêle - Sort ultime multi-phases",
            category: "custom",
            increasable: true,
            counterName: "Phase",
            defaultValue: 1,
            maxValue: 10, // Phase finale = 10
            tags: ["increasable", "multi-phase"],
            // Configuration spéciale pour la suppression
            hasSpecialRemoval: true,
            onRemoval: async (effect, actor) => {
                // Callback pour arrêter toutes les animations persistantes lors de la suppression
                try {
                    if (typeof Sequencer !== "undefined") {
                        // Arrêter toutes les animations possibles du Syphon
                        const animationsToStop = [
                            `SyphonGrele_Phase1_${actor.id}`,
                            `SyphonGrele_Phase2_Zone_${actor.id}`,
                            `SyphonGrele_Phase2_Particles_${actor.id}`,
                            `SyphonGrele_Phase3_Zone_${actor.id}`,
                            `SyphonGrele_Phase3_Particles_${actor.id}`,
                            `SyphonGrele_Final_Zone_${actor.id}`,
                            `SyphonGrele_Final_Particles_${actor.id}`,
                            `SyphonGrele_Final_Syphon_${actor.id}`
                        ];

                        for (const animName of animationsToStop) {
                            try {
                                await Sequencer.EffectManager.endEffects({ name: animName });
                            } catch (e) {
                                // Ignorer les erreurs d'animations non trouvées
                            }
                        }
                        console.log(`[HandleOraEffect] Stopped all Syphon de Grêle animations for ${actor.name}`);
                    }
                } catch (error) {
                    console.warn(`[HandleOraEffect] Could not stop Syphon animations: ${error.message}`);
                }
            },
            // Configuration spéciale pour affichage dynamique selon la phase
            getDynamicDescription: (effect) => {
                const phase = effect.flags?.world?.currentPhase || 1;
                const radius = effect.flags?.world?.currentRadius || 4;
                const extensions = effect.flags?.world?.extensions || 2;

                const phaseNames = {
                    1: "Initialisation",
                    2: "Première Extension",
                    3: "Extensions",
                    4: "Activation Finale",
                    "final": "Forme Finale"
                };

                const phaseName = phaseNames[phase] || `Phase ${phase}`;

                if (phase === "final") {
                    return `Syphon de Grêle - ${phaseName} (${radius} cases, ${extensions} extensions)`;
                } else {
                    return `Syphon de Grêle - ${phaseName} (${radius} cases)`;
                }
            },
            // Configuration pour les données supplémentaires
            getExtraData: (effect) => {
                return {
                    currentPhase: effect.flags?.world?.currentPhase || 1,
                    currentRadius: effect.flags?.world?.currentRadius || 4,
                    extensions: effect.flags?.world?.extensions || 2,
                    finalRadius: effect.flags?.world?.finalRadius || null
                };
            }
        },
        "DC": {
            name: "DC",
            icon: "icons/magic/control/voodoo-doll-pain-damage-red.webp",
            flags: [
                // L'effet DC n'ajoute pas directement de bonus de stats (géré par Ora Eyes - Supérieur)
            ],
            description: "Zone de contrôle Dead Calm active (6 cases de rayon)",
            category: "custom",
            increasable: false,
            counterName: "Contrôle",
            defaultValue: 1,
            maxValue: 1,
            tags: ["increasable"], // Tag spécial pour manipulation avancée
            // Configuration spéciale pour la suppression des animations persistantes
            hasSpecialRemoval: true,
            onRemoval: async (effect, actor) => {
                // Callback pour arrêter les animations persistantes lors de la suppression
                try {
                    if (typeof Sequencer !== "undefined") {
                        await Sequencer.EffectManager.endEffects({
                            name: `DeadCalm_Zone_${actor.id}`
                        });
                        await Sequencer.EffectManager.endEffects({
                            name: `DeadCalm_Particles_${actor.id}`
                        });
                        console.log(`[HandleOraEffect] Stopped Dead Calm zone animations for ${actor.name}`);
                    }
                } catch (error) {
                    console.warn(`[HandleOraEffect] Could not stop Dead Calm zone animations: ${error.message}`);
                }
            }
        },
        "Ora Eyes - Supérieur": {
            name: "Ora Eyes - Supérieur",
            icon: "icons/svg/eye.svg",
            flags: [
                { key: "damage", value: 6 },
                { key: "esprit", value: 2 }
            ],
            description: "Vision mystique supérieure d'Ora (+6 Dégâts, +2 Esprit)",
            category: "custom",
            increasable: false,
            tags: ["increasable"] // Tag spécial pour manipulation avancée même si non-increasable
        },
        "Blood Control": {
            name: "Blood Control",
            icon: "icons/skills/wounds/blood-cells-vessel-red.webp",
            flags: [
                // Blood Control peut ajouter des bonus selon les besoins du jeu
            ],
            description: "Contrôle du sang d'Ora - Force impressionnante",
            category: "custom",
            increasable: false,
            counterName: "Tours",
            defaultValue: 3,
            maxValue: 10,
            manaCost: 2,
            isPerTurn: true,
            tags: [],
            // Configuration spéciale pour afficher le statusCounter fixe
            hasFixedCounter: true,
            fixedCounterValue: 3,
            // Configuration spéciale pour les effets visuels
            hasTransformation: true,
            transformation: {
                filterId: "oraBloodTransformation",
                targetImagePath: "worlds/ft/TOKEN/Ora_token_NG.png",
                transitionType: 4,
                loopDuration: 1000,
                padding: 70,
                magnify: 1
            },
            hasAnimation: true,
            animation: {
                activationFile: "jb2a.liquid.splash02.red",
                deactivationFile: "animated-spell-effects-cartoon.misc.blood splatter",
                scale: 0.4,
                persistent: false
                // NOTE: duration property removed - causes animation duplicates when > actual file duration
            },
            // Configuration spéciale pour la suppression
            hasSpecialRemoval: true,
            onRemoval: async (effect, actor) => {
                // Callback pour nettoyer les effets visuels et envoyer message de fin
                try {
                    console.log(`[HandleOraEffect] Blood Control removal callback for ${actor.name}`);

                    // Envoyer message de fin dans le chat
                    const endMessage = `
                        <div style="border: 2px solid #8B0000; border-radius: 8px; padding: 12px; background: linear-gradient(135deg, #2c0000, #1a0000); color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                <img src="icons/skills/wounds/blood-cells-vessel-red.webp" style="width: 32px; height: 32px; margin-right: 12px; border-radius: 4px;">
                                <div>
                                    <h3 style="margin: 0; color: #FF6B6B; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">🩸 Blood Control - Fin</h3>
                                    <div style="font-size: 0.9em; color: #FFB3B3;">Contrôle du sang désactivé</div>
                                </div>
                            </div>
                            <div style="background: rgba(139,0,0,0.3); padding: 8px; border-radius: 4px; border-left: 4px solid #8B0000;">
                                <strong>${actor.name}</strong> met fin au Blood Control et retrouve son apparence normale.
                                <br><em style="color: #FFB3B3;">Les effets de force et régénération sont perdus.</em>
                            </div>
                        </div>
                    `;

                    await ChatMessage.create({
                        user: game.user.id,
                        content: endMessage
                    });

                } catch (error) {
                    console.warn(`[HandleOraEffect] Error in Blood Control removal callback: ${error.message}`);
                }
            },
            // Callback spécial pour l'activation
            onActivation: async (effect, actor) => {
                try {
                    console.log(`[HandleOraEffect] Blood Control activation callback for ${actor.name}`);

                    // Envoyer message d'activation dans le chat
                    const activationMessage = `
                        <div style="border: 2px solid #8B0000; border-radius: 8px; padding: 12px; background: linear-gradient(135deg, #4a0000, #2c0000); color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                                <img src="icons/skills/wounds/blood-cells-vessel-red.webp" style="width: 32px; height: 32px; margin-right: 12px; border-radius: 4px;">
                                <div>
                                    <h3 style="margin: 0; color: #FF6B6B; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">🩸 Blood Control - Activation</h3>
                                    <div style="font-size: 0.9em; color: #FFB3B3;">Coût: 2 Mana/Tour (Non focusable)</div>
                                </div>
                            </div>
                            <div style="background: rgba(139,0,0,0.3); padding: 8px; border-radius: 4px; border-left: 4px solid #8B0000;">
                                <strong>${actor.name}</strong> gagne une force impressionnante en manipulant son propre sang.
                                <br><br>
                                <strong>Effets :</strong>
                                <br>• Régénère 3 PV/tour
                                <br>• Peut augmenter sa vitesse de déplacement de 3 cases à la place de la régénération
                                <br><br>
                                <em style="color: #FFCCCC;">⚠️ Sans antidouleur : Jet de Volonté DD 20 (+5/tour) requis après 3 tours pour résister aux effets.</em>
                            </div>
                        </div>
                    `;

                    await ChatMessage.create({
                        user: game.user.id,
                        content: activationMessage
                    });

                } catch (error) {
                    console.warn(`[HandleOraEffect] Error in Blood Control activation callback: ${error.message}`);
                }
            }
        },
        "Charge sanglante": {
            name: "Charge sanglante",
            icon: "icons/magic/unholy/strike-beam-blood-small-red-blue.webp",
            flags: [
                // Charge sanglante n'ajoute pas de bonus de stats, juste un compteur de difficulté
            ],
            description: "Utilisations de Charge sanglante (augmente la difficulté des prochaines utilisations)",
            category: "custom",
            increasable: true,
            counterName: "Utilisations",
            defaultValue: 0,
            maxValue: 10,
            tags: [] // Tag spécial pour manipulation avancée
        },
        "224": {
            name: "224",
            icon: "icons/magic/water/heart-ice-freeze.webp",
            flags: [
                // L'effet 224 n'ajoute pas de bonus de stats, juste un indicateur de récupération
            ],
            description: "Récupération du sort 224 - Double utilisation cause perte de conscience",
            category: "custom",
            increasable: false,
            counterName: "Récupération",
            defaultValue: 1,
            maxValue: 1,
            tags: [] // Pas increasable, juste un flag de récupération
        }

        // TODO: Add more Ora-specific water magic effects here
        // Examples:
        // - Bubble effects
        // - Water manipulation
        // - Ice effects
        // - Healing water effects
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

    // === TOKEN TRANSFORMATION FUNCTIONS (For future use) ===

    /**
     * Apply or revert token transformation using Token Magic FX
     * @param {Token} token - The token to transform
     * @param {Object} transformConfig - Transformation configuration
     * @param {boolean} shouldTransform - True to transform, false to revert
     */
    async function applyTokenTransformation(token, transformConfig, shouldTransform) {
        if (!token || typeof TokenMagic === "undefined") {
            console.warn("[Ora] Token Magic FX not available for transformation");
            return;
        }

        try {
            let filterParams;
            const { targetImagePath, transitionType, loopDuration, padding, magnify, filterId } = transformConfig;

            if (shouldTransform) {
                // Check if filter already exists
                if (token.TMFXhasFilterId(filterId)) {
                    console.log(`[Ora] Token ${token.name} already has transformation ${filterId}`);
                    return;
                }

                // Create transformation filter
                filterParams = [{
                    filterType: "polymorph",
                    filterId: filterId,
                    type: transitionType,
                    padding: padding,
                    magnify: magnify,
                    imagePath: targetImagePath,
                    animated: {
                        progress: {
                            active: true,
                            animType: "halfCosOscillation",
                            val1: 0,
                            val2: 100,
                            loops: 1,
                            loopDuration: loopDuration
                        }
                    }
                }];

                await token.TMFXaddUpdateFilters(filterParams);
                console.log(`[Ora] Transformation applied successfully to ${token.name}`);

            } else {
                // Check if filter exists to revert
                if (!token.TMFXhasFilterId(filterId)) {
                    console.log(`[Ora] No transformation ${filterId} found on ${token.name} to revert`);
                    return;
                }

                // First trigger revert animation, then delete the filter
                filterParams = [{
                    filterType: "polymorph",
                    filterId: filterId,
                    type: transitionType,
                    animated: {
                        progress: {
                            active: true,
                            loops: 1
                        }
                    }
                }];

                // Apply the revert animation
                await token.TMFXaddUpdateFilters(filterParams);

                // Wait for animation to complete, then delete the filter completely
                setTimeout(async () => {
                    try {
                        if (token.TMFXhasFilterId(filterId)) {
                            await token.TMFXdeleteFilters(filterId);
                            console.log(`[Ora] Deleted transformation filter ${filterId} from ${token.name}`);
                        }
                    } catch (error) {
                        console.error(`[Ora] Error deleting filter ${filterId}:`, error);
                    }
                }, loopDuration + 100); // Wait for animation duration + small buffer

                console.log(`[Ora] Reverting transformation on ${token.name}`);
                return; // Exit early since we're handling the deletion asynchronously
            }

        } catch (error) {
            console.error("[Ora] Error in token transformation:", error);
        }
    }

    /**
     * Play transformation animation using Sequencer
     * @param {Token} token - The token to animate
     * @param {Object} animConfig - Animation configuration
     * @param {boolean} isActivating - True if activating effect, false if deactivating
     *
     * DEVELOPMENT NOTE:
     * ⚠️ NEVER USE .duration() with Sequencer animations! ⚠️
     * The duration property forces Sequencer to play animations multiple times
     * when the configured duration is longer than the actual animation file duration.
     * Always let animations play their natural duration to avoid duplicates.
     */
    async function playTransformationAnimation(token, animConfig, isActivating) {
        if (!token || typeof Sequence === "undefined") {
            console.warn("[Ora] Sequencer not available for transformation animation");
            return;
        }

        try {
            const seq = new Sequence();
            const effect = seq.effect()
                .file(animConfig.effectFile)
                .attachTo(token)
                .scale(animConfig.scale || 0.8)

            // Apply tint if specified
            if (animConfig.tint) {
                effect.tint(animConfig.tint);
            }

            // Apply opacity if specified
            if (animConfig.opacity !== undefined) {
                effect.opacity(animConfig.opacity);
            }

            await seq.play();
            console.log(`[Ora] Transformation animation played`);
        } catch (error) {
            console.error(`[Ora] Error playing transformation animation:`, error);
        }
    }

    /**
     * Apply or remove Token Magic FX filters (specialized for water effects)
     * @param {Token} token - The token to apply filters to
     * @param {Object} filterConfig - Filter configuration
     * @param {boolean} shouldApply - True to apply filters, false to remove
     */
    async function applyTokenFilters(token, filterConfig, shouldApply) {
        if (!token || typeof TokenMagic === "undefined") {
            console.warn("[Ora] Token Magic FX not available for filters");
            return;
        }

        try {
            const { filterId, filterConfigs } = filterConfig;

            if (shouldApply) {
                // Check if filters are already applied
                const hasFilters = token.document.flags?.tokenmagic;
                if (hasFilters) {
                    console.log(`[Ora] Token ${token.name} already has filters`);
                    return;
                }

                // Select the token and apply filters
                canvas.tokens.releaseAll();
                token.control({ releaseOthers: false });

                await TokenMagic.addFiltersOnSelected(filterConfigs);
                console.log(`[Ora] Applied ${filterConfigs.length} filter(s) to ${token.name}`);

            } else {
                // Remove filters
                const hasFilters = token.document.flags?.tokenmagic;
                if (!hasFilters) {
                    console.log(`[Ora] No filters found on ${token.name} to remove`);
                    return;
                }

                // Select the token and remove filters
                canvas.tokens.releaseAll();
                token.control({ releaseOthers: false });

                await TokenMagic.deleteFiltersOnSelected();
                console.log(`[Ora] Removed filters from ${token.name}`);
            }

        } catch (error) {
            console.error("[Ora] Error in token filters:", error);
        }
    }

    /**
     * Play persistent animation using Sequencer (specialized for water effects)
     * @param {Token} token - The token to animate
     * @param {Object} animConfig - Animation configuration
     * @param {boolean} isActivating - True if activating effect, false if deactivating
     *
     * DEVELOPMENT NOTE:
     * ⚠️ NEVER USE .duration() with Sequencer animations! ⚠️
     * Exception: For persistent animations, duration can be used with fadeOut
     * when duration !== 0, but avoid it for one-shot animations.
     */
    async function playPersistentAnimation(token, animConfig, isActivating) {
        if (!token || typeof Sequence === "undefined") {
            console.warn("[Ora] Sequencer not available for persistent animation");
            return;
        }

        try {
            if (isActivating && animConfig.persistent) {
                console.log(`[Ora] Starting persistent water animation for ${token.name}`);

                // End any existing animation with the same name first
                if (animConfig.sequencerName) {
                    Sequencer.EffectManager.endEffects({ name: animConfig.sequencerName });
                    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure cleanup
                }

                // Calculate offset if specified
                const offsetPixels = animConfig.offsetY !== undefined ? animConfig.offsetY * canvas.grid.size : 0;
                if (offsetPixels !== 0) {
                    console.log(`[Ora] Applying Y offset of ${offsetPixels} pixels to ${animConfig.sequencerName}`);
                }

                const seq = new Sequence();
                const effect = seq.effect()
                    .file(animConfig.effectFile)
                    .attachTo(token, { offset: { y: offsetPixels }, bindAlpha: false })
                    .scale(animConfig.scale || 0.8)
                    .persist()
                    .name(animConfig.sequencerName);

                // Apply fadeOut only if specified and not infinite duration
                if (animConfig.fadeOut && animConfig.duration !== 0) {
                    effect.fadeOut(animConfig.fadeOut);
                }

                // Apply tint if specified
                if (animConfig.tint) {
                    effect.tint(animConfig.tint);
                }

                // Apply opacity if specified
                if (animConfig.opacity !== undefined) {
                    effect.opacity(animConfig.opacity);
                }

                await seq.play();
                console.log(`[Ora] Persistent water animation started: ${animConfig.sequencerName}`);

            } else if (!isActivating && animConfig.sequencerName) {
                console.log(`[Ora] Ending persistent water animation: ${animConfig.sequencerName}`);
                Sequencer.EffectManager.endEffects({ name: animConfig.sequencerName });
            }
        } catch (error) {
            console.error(`[Ora] Error with persistent animation:`, error);
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
        <h3>💧 Gestionnaire d'Effets - Ora (Mage de l'Eau)</h3>
        <p><strong>Token:</strong> ${actor.name}</p>
        <style>
            .effect-section { margin: 20px 0; padding: 15px; border: 2px solid #ccc; border-radius: 8px; }
            .effect-item { margin: 8px 0; padding: 12px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; }
            .effect-icon { width: 24px; height: 24px; margin-right: 10px; background-size: cover; background-position: center; border-radius: 4px; display: inline-block; }
            .effect-icon[data-is-svg="true"] { background-color: #444; border-radius: 4px; }
            .status-indicator { font-weight: bold; margin-left: 10px; }
            .button-group { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
            .btn { padding: 6px 12px; border: none; border-radius: 4px; font-size: 0.9em; cursor: pointer; }
            .btn-add { background: #2196f3; color: white; }
            .btn-remove { background: #1976d2; color: white; }
            .btn-disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
            .pending-change { box-shadow: 0 0 5px #2196f3 !important; }
        </style>
    `;

    let pendingChanges = {};

    // === UTILITY FUNCTIONS ===
    // Generate safe ID for HTML elements (remove problematic characters)
    function getSafeId(key) {
        return key.replace(/[^a-zA-Z0-9-_]/g, '_');
    }

    // === CUSTOM OUTSIDE EFFECTS SECTION ===
    if (outsideEffects.length > 0) {
        dialogContent += `
            <div class="effect-section" style="border-color: #ff5722;">
                <h4>🔍 Effets Externes Détectés</h4>
                <p style="margin: 8px 0; font-size: 0.9em; color: #666;">Effets présents sur Ora mais non configurés dans ce gestionnaire</p>
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
            <div class="effect-section" style="border-color: #2196f3;">
                <h4>💧 Effets d'Eau d'Ora</h4>
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

            // Get current value for increasable effects or fixed counter effects
            const currentValue = effectData.increasable ?
                (existingEffect?.flags?.statuscounter?.value || effectData.defaultValue || 0) :
                (effectData.hasFixedCounter && existingEffect ? effectData.fixedCounterValue : 0);

            // Show counter value in status text if it has a fixed counter and is active
            const counterDisplay = (effectData.hasFixedCounter && isActive) ? ` (${effectData.fixedCounterValue})` : '';
            const finalStatusText = statusText + counterDisplay;

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
                            ${statusIcon} ${finalStatusText}
                        </div>
                    </div>
                    <div class="button-group">
                        ${effectData.increasable ? `
                        <label>${effectData.counterName || 'Valeur'}: <input type="number" id="customCount-${getSafeId(key)}" value="${currentValue}" min="0" max="${effectData.maxValue || 10}" style="width: 60px; margin: 0 8px;" data-original-key="${key}"></label>
                        <button type="button" class="btn btn-add" data-action="setCustomCount" data-effect="${key}" data-category="custom">
                            📊 Appliquer
                        </button>
                        ` : effectData.hasFixedCounter ? `
                        <span style="color: #666; margin: 0 8px;">${effectData.counterName || 'Valeur'}: ${effectData.fixedCounterValue} (Fixe)</span>
                        <button type="button" class="btn ${isActive ? 'btn-remove' : 'btn-add'}" data-action="${isActive ? 'remove' : 'add'}" data-effect="${key}" data-category="custom">
                            ${isActive ? '➖ Désactiver' : '➕ Activer'}
                        </button>
                        ` : `
                        <button type="button" class="btn ${isActive ? 'btn-remove' : 'btn-add'}" data-action="${isActive ? 'remove' : 'add'}" data-effect="${key}" data-category="custom">
                            ${isActive ? '➖ Désactiver' : '➕ Activer'}
                        </button>
                        `}
                    </div>
                </div>
            `;
        }
        dialogContent += `</div>`;
    } else {
        dialogContent += `
            <div class="effect-section" style="border-color: #2196f3;">
                <h4>💧 Effets d'Eau d'Ora</h4>
                <div class="effect-item" style="text-align: center; color: #666; font-style: italic;">
                    Aucun effet d'eau configuré.
                    <br><small>Les effets spécifiques d'Ora seront ajoutés ici.</small>
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
                        <label>Nombre: <input type="number" id="injuryCount-${getSafeId(key)}" value="${currentCount}" min="0" max="10" style="width: 60px; margin: 0 8px;" data-original-key="${key}"></label>
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
            title: "💧 Gestionnaire d'Effets - Ora",
            content: dialogContent,
            buttons: {
                save: {
                    icon: '<i class="fas fa-save"></i>',
                    label: "💾 Sauvegarder",
                    callback: (html) => {
                        const injuryValues = {};
                        for (const key of Object.keys(INJURY_EFFECTS)) {
                            const inputElement = html.find(`#injuryCount-${getSafeId(key)}`);
                            if (inputElement.length > 0) {
                                injuryValues[key] = parseInt(inputElement.val()) || 0;
                            }
                        }
                        const customCountValues = {};
                        for (const key of Object.keys(CUSTOM_EFFECTS)) {
                            if (CUSTOM_EFFECTS[key].increasable) {
                                const inputElement = html.find(`#customCount-${getSafeId(key)}`);
                                if (inputElement.length > 0) {
                                    customCountValues[key] = parseInt(inputElement.val()) || 0;
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
                    const action = $(this).data('action');
                    const effectKey = $(this).data('effect');
                    const category = $(this).data('category');

                    if (action === 'setInjuries' || action === 'setCustomCount') {
                        // Handle injury/custom count setting directly
                        return;
                    }

                    if (action === 'removeExternal') {
                        // Handle external effect removal immediately
                        const externalEffect = actor.effects.get(effectKey);
                        if (externalEffect) {
                            externalEffect.delete().then(() => {
                                ui.notifications.success(`🗑️ Effet externe "${externalEffect.name}" supprimé !`);
                                // Remove the effect item from the dialog
                                $(this).closest('.effect-item').fadeOut(300, function () {
                                    $(this).remove();
                                });
                                console.log(`[Ora] Removed external effect: ${externalEffect.name}`);
                            }).catch(error => {
                                console.error(`[Ora] Error removing external effect:`, error);
                                ui.notifications.error(`Erreur lors de la suppression de "${externalEffect.name}" !`);
                            });
                        } else {
                            ui.notifications.warn("Effet externe introuvable !");
                        }
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
            // Clean up visual effects first before removing the effect documents
            if (canvas.tokens.controlled.length > 0) {
                const token = canvas.tokens.controlled[0];

                // Clean up all custom effects visual elements
                for (const [effectKey, effectData] of Object.entries(CUSTOM_EFFECTS)) {
                    const existingEffect = currentState.customEffects[effectKey];
                    if (existingEffect) {
                        console.log(`[Ora] Cleaning up visual effects for: ${effectData.name}`);

                        // Handle transformation removal
                        if (effectData.hasTransformation) {
                            try {
                                await applyTokenTransformation(token, effectData.transformation, false);
                            } catch (error) {
                                console.warn(`[Ora] Error removing transformation for ${effectData.name}:`, error);
                            }
                        }

                        // Handle filter removal
                        if (effectData.hasFilters) {
                            try {
                                await applyTokenFilters(token, effectData.filters, false);
                            } catch (error) {
                                console.warn(`[Ora] Error removing filters for ${effectData.name}:`, error);
                            }
                        }

                        // Handle animation cleanup
                        if (effectData.hasAnimation && effectData.animation.persistent && effectData.animation.sequencerName) {
                            try {
                                Sequencer.EffectManager.endEffects({ name: effectData.animation.sequencerName });
                            } catch (error) {
                                console.warn(`[Ora] Error ending animation for ${effectData.name}:`, error);
                            }
                        }
                    }
                }

                // Clean up any remaining Token Magic FX filters on this token
                try {
                    if (typeof TokenMagic !== "undefined") {
                        // Select the token and remove all filters
                        canvas.tokens.releaseAll();
                        token.control({ releaseOthers: false });
                        await TokenMagic.deleteFiltersOnSelected();
                        console.log(`[Ora] Cleaned up all Token Magic FX filters`);
                    }
                } catch (error) {
                    console.warn(`[Ora] Error cleaning up all filters:`, error);
                }

                // Clean up any remaining Sequencer effects on this token
                try {
                    if (typeof Sequencer !== "undefined") {
                        Sequencer.EffectManager.endEffects({ object: token });
                        console.log(`[Ora] Cleaned up all Sequencer effects`);
                    }
                } catch (error) {
                    console.warn(`[Ora] Error cleaning up all animations:`, error);
                }
            }

            // Now remove all effect documents
            const effectsToRemove = actor.effects.contents.slice();
            for (const effect of effectsToRemove) {
                await effect.delete();
            }

            ui.notifications.success(`💧 Tous les effets et animations de ${actor.name} ont été supprimés !`);

        } catch (error) {
            console.error("[Ora] Error removing all effects:", error);
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
                    // Handle special removal callback for effects like SDF
                    if (customData.hasSpecialRemoval && customData.onRemoval) {
                        try {
                            await customData.onRemoval(currentCustomEffect, actor);
                            console.log(`[Ora] Executed special removal callback for increasable ${customData.name}`);
                        } catch (error) {
                            console.warn(`[Ora] Error in special removal callback for increasable ${customData.name}:`, error);
                        }
                    }

                    await currentCustomEffect.delete();
                    removedEffects.push(customData.name);
                    console.log(`[Ora] Removed increasable effect: ${customData.name}`);

                    // Handle special effects removal for increasable effects
                    if (canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];

                        // Handle transformation removal
                        if (customData.hasTransformation) {
                            // Prevent double animation execution with a temporary flag
                            const animationKey = `${customData.name}-deactivation-${token.id}`;

                            // Play deactivation animation ONCE before removing transformation
                            if (customData.hasAnimation && customData.animation.deactivationFile) {
                                // Check animation lock
                                if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                    console.log(`[Ora] Deactivation animation already in progress for ${customData.name}, skipping`);
                                } else {
                                    try {
                                        // Set animation lock
                                        if (!window.oraAnimationLock) window.oraAnimationLock = {};
                                        window.oraAnimationLock[animationKey] = true;

                                        console.log(`[Ora] Playing TRANSFORMATION deactivation animation for ${customData.name}`);
                                        const seq = new Sequence()
                                            .name(`${customData.name}-deactivation-${Date.now()}`); // Unique identifier
                                        await seq.effect()
                                            .file(customData.animation.deactivationFile)
                                            .attachTo(token)
                                            .scale(customData.animation.scale || 0.8)
                                            .play();
                                        console.log(`[Ora] TRANSFORMATION deactivation animation completed for ${customData.name}`);

                                        // Clear lock after animation
                                        setTimeout(() => {
                                            if (window.oraAnimationLock) {
                                                delete window.oraAnimationLock[animationKey];
                                            }
                                        }, 3000);

                                        await new Promise(resolve => setTimeout(resolve, 200));
                                    } catch (error) {
                                        console.warn(`[Ora] Error playing deactivation animation: ${error}`);
                                        // Clear lock on error
                                        if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                            delete window.oraAnimationLock[animationKey];
                                        }
                                    }
                                }
                            }
                            await applyTokenTransformation(token, customData.transformation, false);
                        }

                        // Handle filter removal
                        if (customData.hasFilters) {
                            if (customData.hasAnimation && customData.animation.persistent) {
                                await playPersistentAnimation(token, customData.animation, false);
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                            await applyTokenFilters(token, customData.filters, false);
                        }

                        // Handle standalone animations removal for increasable effects (NOT for transformation-based effects)
                        if (customData.hasAnimation && !customData.hasTransformation && !customData.hasFilters) {
                            if (customData.animation.persistent) {
                                await playPersistentAnimation(token, customData.animation, false);
                            }
                            console.log(`[Ora] Cleaned up standalone animation for increasable ${customData.name}`);
                        }
                    }

                } else if (newValue > 0) {
                    if (currentCustomEffect) {
                        // Update existing
                        await currentCustomEffect.update({
                            "flags.statuscounter.value": newValue,
                            "flags.statuscounter.visible": true
                        });
                        modifiedEffects.push(`${customData.name} (${newValue})`);
                        console.log(`[Ora] Updated increasable effect: ${customData.name} to ${newValue}`);
                    } else {
                        // Create new with statuscounter
                        const customEffect = {
                            name: customData.name,
                            icon: customData.icon,
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            flags: {
                                statuscounter: { value: newValue, visible: true }
                            }
                        };

                        await actor.createEmbeddedDocuments("ActiveEffect", [customEffect]);
                        addedEffects.push(`${customData.name} (${newValue})`);
                        console.log(`[Ora] Added increasable effect: ${customData.name} with ${newValue}`);

                        // Handle special effects addition for increasable effects (only when creating new)
                        if (canvas.tokens.controlled.length > 0) {
                            const token = canvas.tokens.controlled[0];

                            // Handle transformation addition
                            if (customData.hasTransformation) {
                                // Prevent double animation execution with a temporary flag
                                const animationKey = `${customData.name}-activation-${token.id}`;

                                // Play activation animation ONCE before transformation
                                if (customData.hasAnimation && customData.animation.activationFile) {
                                    // Check animation lock
                                    if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                        console.log(`[Ora] Animation already in progress for ${customData.name}, skipping`);
                                    } else {
                                        try {
                                            // Set animation lock
                                            if (!window.oraAnimationLock) window.oraAnimationLock = {};
                                            window.oraAnimationLock[animationKey] = true;

                                            console.log(`[Ora] Playing TRANSFORMATION activation animation for ${customData.name}`);
                                            const seq = new Sequence()
                                                .name(`${customData.name}-activation-${Date.now()}`); // Unique identifier
                                            await seq.effect()
                                                .file(customData.animation.activationFile)
                                                .attachTo(token)
                                                .scale(customData.animation.scale || 0.8)
                                                .play();
                                            console.log(`[Ora] TRANSFORMATION activation animation completed for ${customData.name}`);

                                            // Clear lock after animation
                                            setTimeout(() => {
                                                if (window.oraAnimationLock) {
                                                    delete window.oraAnimationLock[animationKey];
                                                }
                                            }, 3000);

                                            await new Promise(resolve => setTimeout(resolve, 200));
                                        } catch (error) {
                                            console.warn(`[Ora] Error playing activation animation: ${error}`);
                                            // Clear lock on error
                                            if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                                delete window.oraAnimationLock[animationKey];
                                            }
                                        }
                                    }
                                }
                                await applyTokenTransformation(token, customData.transformation, true);
                            }

                            // Handle filter addition
                            if (customData.hasFilters) {
                                if (customData.hasAnimation) {
                                    if (customData.animation.persistent) {
                                        await playPersistentAnimation(token, customData.animation, true);
                                    } else {
                                        // REMOVED: playTransformationAnimation to avoid double animations
                                        console.log(`[Ora] Skipping transformation animation for filter-based effect ${customData.name} (already played in transformation section)`);
                                    }
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }
                                await applyTokenFilters(token, customData.filters, true);
                            }

                            // Handle standalone animations for increasable effects (NOT for transformation-based effects)
                            if (customData.hasAnimation && !customData.hasTransformation && !customData.hasFilters) {
                                if (customData.animation.persistent) {
                                    await playPersistentAnimation(token, customData.animation, true);
                                } else {
                                    await playTransformationAnimation(token, customData.animation, true);
                                }
                                console.log(`[Ora] Played standalone animation for increasable ${customData.name}`);
                            }
                        }

                        // Execute activation callback if present
                        if (customData.onActivation) {
                            try {
                                const newEffect = actor.effects.find(e => e.name === customData.name);
                                if (newEffect) {
                                    await customData.onActivation(newEffect, actor);
                                }
                            } catch (error) {
                                console.warn(`[Ora] Error in activation callback for ${customData.name}:`, error);
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
                    console.log(`[Ora] Removed injury: ${injuryData.name || injuryData.label}`);
                } else if (newValue > 0) {
                    if (currentInjuryEffect) {
                        // Update existing
                        await currentInjuryEffect.update({
                            "flags.statuscounter.value": newValue,
                            "flags.statuscounter.visible": true
                        });
                        modifiedEffects.push(`${injuryData.name || injuryData.label} (${newValue})`);
                        console.log(`[Ora] Updated injury: ${injuryData.name || injuryData.label} to ${newValue}`);
                    } else {
                        // Create new using exact CONFIG object structure
                        const injuryEffect = {
                            ...injuryData,
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            flags: {
                                statuscounter: { value: newValue, visible: true }
                            },
                            statuses: [injuryData.id]
                        };
                        // Remove our custom properties that aren't part of the effect
                        delete injuryEffect.category;
                        delete injuryEffect.description;

                        await actor.createEmbeddedDocuments("ActiveEffect", [injuryEffect]);
                        addedEffects.push(`${injuryData.name || injuryData.label} (${newValue})`);
                        console.log(`[Ora] Added injury: ${injuryData.name || injuryData.label} with ${newValue}`);
                    }
                }
            }
        }

        // Process each pending change
        for (const [effectKey, changeData] of Object.entries(changes)) {
            const { action, category } = changeData;

            console.log(`[Ora] Processing: ${action} ${effectKey} in ${category}`);

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

                    // Add fixed counter for effects that need it (like Blood Control)
                    if (effectData.hasFixedCounter) {
                        newEffectData.flags.statuscounter = {
                            value: effectData.fixedCounterValue,
                            visible: true
                        };
                    }

                    await actor.createEmbeddedDocuments("ActiveEffect", [newEffectData]);
                    addedEffects.push(effectData.name);
                    console.log(`[Ora] Added effect: ${effectData.name}`);

                    // Handle special effects (transformations, filters, animations) - For future use
                    if (canvas.tokens.controlled.length > 0) {
                        const token = canvas.tokens.controlled[0];

                        // Handle transformation effects (for non-increasable effects)
                        if (effectData.hasTransformation) {
                            // Play activation animation ONCE before transformation (only for non-increasable)
                            if (effectData.hasAnimation && effectData.animation.activationFile) {
                                // Prevent double animation execution with a temporary flag
                                const animationKey = `${effectData.name}-activation-${token.id}`;

                                // Check animation lock
                                if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                    console.log(`[Ora] Activation animation already in progress for ${effectData.name}, skipping`);
                                } else {
                                    try {
                                        // Set animation lock
                                        if (!window.oraAnimationLock) window.oraAnimationLock = {};
                                        window.oraAnimationLock[animationKey] = true;

                                        console.log(`[Ora] Playing TRANSFORMATION activation animation for ${effectData.name}`);
                                        const seq = new Sequence();
                                        await seq.effect()
                                            .file(effectData.animation.activationFile)
                                            .attachTo(token)
                                            .scale(effectData.animation.scale || 0.8)
                                            .play();
                                        console.log(`[Ora] TRANSFORMATION activation animation completed for ${effectData.name}`);

                                        // Clear lock after animation
                                        setTimeout(() => {
                                            if (window.oraAnimationLock) {
                                                delete window.oraAnimationLock[animationKey];
                                            }
                                        }, 3000);

                                        await new Promise(resolve => setTimeout(resolve, 200));
                                    } catch (error) {
                                        console.warn(`[Ora] Error playing activation animation: ${error}`);
                                        // Clear lock on error
                                        if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                            delete window.oraAnimationLock[animationKey];
                                        }
                                    }
                                }
                            }
                            await applyTokenTransformation(token, effectData.transformation, true);
                            console.log(`[Ora] Applied transformation for ${effectData.name}`);
                        }

                        // Handle filter effects
                        if (effectData.hasFilters) {
                            if (effectData.hasAnimation) {
                                if (effectData.animation.persistent) {
                                    await playPersistentAnimation(token, effectData.animation, true);
                                } else {
                                    await playTransformationAnimation(token, effectData.animation, true);
                                }
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                            await applyTokenFilters(token, effectData.filters, true);
                            console.log(`[Ora] Applied filters for ${effectData.name}`);
                        }

                        // Handle standalone animations
                        if (effectData.hasAnimation && !effectData.hasTransformation && !effectData.hasFilters) {
                            if (effectData.animation.persistent) {
                                await playPersistentAnimation(token, effectData.animation, true);
                            } else {
                                await playTransformationAnimation(token, effectData.animation, true);
                            }
                            console.log(`[Ora] Played standalone animation for ${effectData.name}`);
                        }
                    }

                    // Execute activation callback if present
                    if (effectData.onActivation) {
                        try {
                            const newEffect = actor.effects.find(e => e.name === effectData.name);
                            if (newEffect) {
                                await effectData.onActivation(newEffect, actor);
                            }
                        } catch (error) {
                            console.warn(`[Ora] Error in activation callback for ${effectData.name}:`, error);
                        }
                    }

                } else if (action === 'remove') {
                    const existing = currentState.customEffects[effectKey];
                    if (existing) {
                        // Handle special removal callback for effects like SDF
                        if (effectData.hasSpecialRemoval && effectData.onRemoval) {
                            try {
                                await effectData.onRemoval(existing, actor);
                                console.log(`[Ora] Executed special removal callback for ${effectData.name}`);
                            } catch (error) {
                                console.warn(`[Ora] Error in special removal callback for ${effectData.name}:`, error);
                            }
                        }

                        // Handle special effects removal - For future use
                        if (canvas.tokens.controlled.length > 0) {
                            const token = canvas.tokens.controlled[0];

                            if (effectData.hasTransformation) {
                                // Play deactivation animation ONCE before removing transformation (only for non-increasable)
                                if (effectData.hasAnimation && effectData.animation.deactivationFile) {
                                    // Prevent double animation execution with a temporary flag
                                    const animationKey = `${effectData.name}-deactivation-${token.id}`;

                                    // Check animation lock
                                    if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                        console.log(`[Ora] Deactivation animation already in progress for ${effectData.name}, skipping`);
                                    } else {
                                        try {
                                            // Set animation lock
                                            if (!window.oraAnimationLock) window.oraAnimationLock = {};
                                            window.oraAnimationLock[animationKey] = true;

                                            console.log(`[Ora] Playing TRANSFORMATION deactivation animation for ${effectData.name}`);
                                            const seq = new Sequence();
                                            await seq.effect()
                                                .file(effectData.animation.deactivationFile)
                                                .attachTo(token)
                                                .scale(effectData.animation.scale || 0.8)
                                                .play();
                                            console.log(`[Ora] TRANSFORMATION deactivation animation completed for ${effectData.name}`);

                                            // Clear lock after animation
                                            setTimeout(() => {
                                                if (window.oraAnimationLock) {
                                                    delete window.oraAnimationLock[animationKey];
                                                }
                                            }, 3000);

                                            await new Promise(resolve => setTimeout(resolve, 200));
                                        } catch (error) {
                                            console.warn(`[Ora] Error playing deactivation animation: ${error}`);
                                            // Clear lock on error
                                            if (window.oraAnimationLock && window.oraAnimationLock[animationKey]) {
                                                delete window.oraAnimationLock[animationKey];
                                            }
                                        }
                                    }
                                }
                                await applyTokenTransformation(token, effectData.transformation, false);
                                console.log(`[Ora] Removed transformation for ${effectData.name}`);
                            }

                            if (effectData.hasFilters) {
                                if (effectData.hasAnimation && effectData.animation.persistent) {
                                    await playPersistentAnimation(token, effectData.animation, false);
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                }
                                await applyTokenFilters(token, effectData.filters, false);
                                console.log(`[Ora] Removed filters for ${effectData.name}`);
                            }

                            if (effectData.hasAnimation && !effectData.hasTransformation && !effectData.hasFilters) {
                                if (effectData.animation.persistent) {
                                    await playPersistentAnimation(token, effectData.animation, false);
                                }
                                console.log(`[Ora] Cleaned up standalone animation for ${effectData.name}`);
                            }
                        }

                        await existing.delete();
                        removedEffects.push(effectData.name);
                        console.log(`[Ora] Removed effect: ${effectData.name}`);
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
                        const postureEffect = {
                            ...postureData,
                            origin: actor.uuid,
                            duration: { seconds: 86400 },
                            statuses: [postureData.id]
                        };
                        delete postureEffect.category;
                        delete postureEffect.description;

                        await actor.createEmbeddedDocuments("ActiveEffect", [postureEffect]);
                        addedEffects.push(postureData.name || postureData.label);
                        console.log(`[Ora] Added posture: ${postureData.name || postureData.label}`);
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
                    console.log(`[Ora] Removed all postures`);
                }

            } else if (category === 'status') {
                const statusData = configStatusEffects.other[effectKey];
                if (!statusData) continue;

                if (action === 'add') {
                    const statusEffect = {
                        ...statusData,
                        origin: actor.uuid,
                        duration: { seconds: 86400 },
                        statuses: [statusData.id]
                    };
                    delete statusEffect.category;
                    delete statusEffect.description;

                    await actor.createEmbeddedDocuments("ActiveEffect", [statusEffect]);
                    addedEffects.push(statusData.name || statusData.label);
                    console.log(`[Ora] Added status effect: ${statusData.name || statusData.label}`);

                } else if (action === 'remove') {
                    const existing = currentState.statusEffects[effectKey];
                    if (existing) {
                        await existing.delete();
                        removedEffects.push(statusData.name || statusData.label);
                        console.log(`[Ora] Removed status effect: ${statusData.name || statusData.label}`);
                    }
                }
            }
        }

        // Summary message
        let message = `💧 Changements appliqués pour ${actor.name}:`;
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
        console.error("[Ora] Error processing changes:", error);
        ui.notifications.error("Erreur lors de l'application des changements !");
    }
})();
