/**
 * Complete Effect Manager - Raynart (Le Mage de la Mécanique) - Effect Handler
 *
 * This comprehensive manager handles:
 * - Custom active effects with flags for Raynart's mechanical magic
 * - The 3 postures (Focus, Offensif, Défensif) - mutually exclusive
 * - Injuries system with stackable counter
 * - Dynamic retrieval from CONFIG.statusEffects (FoundryVTT v13)
 * - Token transformations with Token Magic FX
 * - Token filters with Token Magic FX (mechanical effects)
 * - Persistent animations with Sequencer
 * - Increasable effects with counters
 * - Mana cost tracking (one-time or per-turn)
 * - Status counter values
 * - Mechanical magic specific effects
 * - Special Armure Infini system that modifies all mana costs
 *
 * Features:
 * - Unified interface for all effect types
 * - Posture management (only one active at a time)
 * - Injury stacking with configurable amounts
 * - Integration with FoundryVTT's status effect system
 * - Token transformation system
 * - Token filter system with persistent mechanical effects
 * - Animation system (both one-time and persistent)
 * - Increasable effects with counters
 * - Mana cost display and tracking with dynamic calculation
 * - Status counter integration
 * - External effect detection and management
 * - Mechanical magic specialization
 * - Armure Infini: Special armor that modifies focusability of all effects
 */

(async () => {
    // === ACTOR VALIDATION ===
    const casterToken = canvas.tokens.controlled[0];
    if (!casterToken) {
        ui.notifications.warn("⚠️ Veuillez d'abord sélectionner le token de Raynart !");
        return;
    }

    const actor = casterToken.actor;
    if (!actor) {
        ui.notifications.error("❌ Impossible de trouver l'acteur du token sélectionné !");
        return;
    }

    // === CONFIGURATION ===

    // Custom Active Effects with Flags - RAYNART'S MECHANICAL MAGIC EFFECTS
    const CUSTOM_EFFECTS = {
        "Armure du Fléau de l'Infini": {
            name: "Armure du Fléau de l'Infini",
            icon: "icons/equipment/head/helm-barbute-horned-gold-red.webp",
            flags: [],
            description: "Armure légendaire du Fléau. Rend tous les effets non-focusables → demi-focusables, et demi-focusables → focusables. Force la posture Focus. Track la mana économisée.",
            category: "custom",
            increasable: false,
            manaCost: 0,
            costType: "special",
            isPerTurn: false,
            statusCounterValue: 0,
            hasStatusCounter: true,
            statusCounterVisible: true,
            forcesFocusPosture: true,
            modifiesCosts: true, // Special flag indicating this effect modifies all other costs
            hasAnimation: true,
            animation: {
                activationSequence: [
                    {
                        file: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                        atLocation: true,
                        scaleToObject: 4,
                        center: true,
                        waitUntilFinished: -800,
                        fadeOut: 1500,
                        scaleOut: { value: 0, duration: 2000 },
                        rotateOut: { angle: 150, duration: 6000, ease: "easeInSine" },
                        waitAfter: -1800
                    },
                    {
                        file: "jb2a.divine_smite.caster.blueyellow",
                        atLocation: true,
                        scale: 1.5,
                        waitUntilFinished: -1000
                    },
                    {
                        file: "jb2a.extras.tmfx.inpulse.circle.01.normal",
                        atLocation: true,
                        scale: 2,
                        waitUntilFinished: -500
                    },
                    {
                        file: "jb2a.impact.ground_crack.01.orange",
                        atLocation: true,
                        scale: 1,
                        waitUntilFinished: -5000,
                        belowTokens: true
                    },
                    {
                        file: "jb2a_patreon.ground_cracks.blue.01",
                        atLocation: true,
                        scale: 1,
                        fadeIn: 1000,
                        duration: 10000,
                        fadeOut: 500,
                        belowTokens: true
                    },
                    {
                        file: "jb2a.ground_cracks.orange.02",
                        atLocation: true,
                        scale: 1,
                        fadeIn: 1000,
                        duration: 10000,
                        fadeOut: 500,
                        belowTokens: true,
                        waitUntilFinished: -10000
                    },
                    {
                        file: "animated-spell-effects-cartoon.energy.01",
                        atLocation: true,
                        scale: 1,
                        waitUntilFinished: -500
                    },
                    {
                        file: "animated-spell-effects-cartoon.fire.15",
                        atLocation: true,
                        scale: 1,
                        waitUntilFinished: -500,
                        anchor: { x: 0.47, y: 0.5 },
                        filter: { type: "Glow", config: { distance: 10, outerStrength: 2, color: 0x70d2ff } }
                    },
                    {
                        file: "animated-spell-effects-cartoon.fire.49",
                        atLocation: true,
                        scale: 1,
                        waitUntilFinished: -1500,
                        filter: { type: "Glow", config: { distance: 10, outerStrength: 2, color: 0x70d2ff } }
                    },
                    {
                        file: "animated-spell-effects-cartoon.fire.33",
                        atLocation: true,
                        scale: 0.5,
                        anchor: { x: 0.47, y: 0.52 }
                    },
                    {
                        file: "jb2a_patreon.template_circle.out_pulse.02.burst.tealyellow",
                        atLocation: true,
                        scale: 0.6
                    }
                ],
                persistent: {
                    file: "worlds/ft/TOKEN/Token%20anim%20v18.1_VP9.webm",
                    scaleToObject: 1.3,
                    fadeIn: 200,
                    center: true,
                    attachTo: true,
                    fadeOut: 1000,
                    sequencerName: "RaynartArmureInfini"
                },
                deactivationAnimation: {
                    file: "jb2a_patreon.template_circle.out_pulse.02.burst.tealyellow",
                    atLocation: true,
                    scale: 0.6,
                    waitUntilFinished: -1000
                }
            }
        },
        "Expansion du Monde Intérieur": {
            name: "Expansion du Monde Intérieur",
            icon: "icons/magic/symbols/cog-orange-red.webp",
            flags: [],
            description: "Étend le monde intérieur de Raynart. Accorde Résistance = Esprit/2 (arrondi inf.) à TOUTES les invocations existantes.",
            category: "custom",
            increasable: false,
            manaCost: 5,
            costType: "non-focusable",
            isPerTurn: false,
            affectsInvocations: true,
            hasAnimation: true,
            animation: {
                castAnimation: {
                    file: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                    atLocation: true,
                    scaleToObject: 2.0,
                    belowTokens: true,
                    fadeIn: 300,
                    fadeOut: 500
                },
                pulseAnimation: {
                    file: "jb2a_patreon.extras.tmfx.outpulse.circle.02.slow",
                    atLocation: true,
                    scale: 1
                }
            }
        },
        "Mode Big Gun": {
            name: "Mode Big Gun",
            icon: "icons/weapons/guns/rifle-white.webp",
            flags: [
                { key: "damage", value: null }, // Calculated: Esprit/4 arrondi sup
                { key: "resistance", value: null } // Calculated: Esprit/2 arrondi sup (mentioned in description only)
            ],
            description: null, // Will be generated dynamically with calculated values
            category: "custom",
            increasable: false,
            manaCost: 4,
            costType: "focusable",
            isPerTurn: false,
            hasAnimation: true,
            animation: {
                castAnimation: {
                    file: "jb2a.template_circle.aura.03.inward.003.complete.combined.blue",
                    atLocation: true,
                    scale: 0.2,
                    tint: 0x8B0000 // Dark red tint
                },
                persistent: {
                    file: "jb2a_patreon.shield.03.loop.red",
                    attachTo: true,
                    scale: 0.6,
                    opacity: 0.8,
                    sequencerName: "RaynartBigGunShield"
                }
            }
        },
        "Mécanique Analytique": {
            name: "Mécanique Analytique",
            icon: "icons/magic/perception/eye-ringed-glow-angry-large-red.webp",
            flags: [],
            description: "Analyse mécanique du champ de bataille. Permet de prédire les événements à court terme. Coûte 6 mana + 2 mana par tour.",
            category: "custom",
            increasable: false,
            manaCost: 6,
            costType: "non-focusable",
            isPerTurn: true,
            manaPerTurn: 2,
            hasAnimation: true,
            animation: {
                activationSequence: [
                    {
                        file: "jb2a_patreon.extras.tmfx.outpulse.circle.02.slow",
                        atLocation: true,
                        scale: 10,
                        waitUntilFinished: -1000
                    },
                    {
                        file: "jb2a.divine_smite.caster.blueyellow",
                        atLocation: true,
                        scale: 2,
                        waitUntilFinished: -600
                    }
                ],
                persistent: {
                    file: "modules/Animation%20Custom/Raynart/cercle%20analytic_VP9.webm",
                    fadeIn: 3000,
                    fadeOut: 3000,
                    scaleToObject: 3,
                    scaleIn: { value: 0.3, duration: 4000, ease: "easeInOutCubic" },
                    scaleOut: { value: 2, duration: 3000, ease: "easeInCirc" },
                    atLocation: true,
                    belowTokens: true,
                    attachTo: true,
                    sequencerName: "RaynartAnalytique"
                },
                deactivationAnimation: {
                    file: "jb2a_patreon.template_circle.out_pulse.02.burst.tealyellow",
                    atLocation: true,
                    scale: 0.6
                }
            }
        },
        "Mode Eclipse": {
            name: "Mode Eclipse",
            icon: "icons/magic/light/explosion-star-small-blue-yellow.webp",
            flags: [],
            description: "Partage l'esprit avec ses créations, doublant sa capacité de création complexe. Ne peut plus esquiver. Jet Volonté DD 25 + PV manquants pour garder contrôle si dégâts subis. Interdit: explosions et magie stellaire. Force posture Focus.",
            category: "custom",
            increasable: false,
            manaCost: 6,
            costType: "non-focusable",
            isPerTurn: false,
            forcesFocusPosture: true,
            hasAnimation: true,
            animation: {
                castAnimation: {
                    file: "jb2a.template_circle.out_pulse.02.loop.bluewhite",
                    atLocation: true,
                    scale: 2
                },
                persistent: {
                    file: "jb2a.template_circle.aura.03.outward.003.loop.part01.blue",
                    attachTo: true,
                    scale: 0.8,
                    opacity: 0.2,
                    sequencerName: "RaynartEclipse"
                }
            }
        },
        "Mode Stellaire": {
            name: "Mode Stellaire",
            icon: "icons/magic/light/explosion-star-large-orange.webp",
            flags: [],
            description: "Déploie sa mana autour de lui. Ne peut utiliser qu'une création complexe max. Peut créer des explosions n'importe où. Coûte 3 mana par tour.",
            category: "custom",
            increasable: false,
            manaCost: 3,
            costType: "demi-focus",
            isPerTurn: true,
            hasAnimation: true,
            animation: {
                castAnimation: {
                    file: "animated-spell-effects.magic.shockwave.circle.07",
                    atLocation: true,
                    scale: 2
                },
                persistent: {
                    file: "jb2a.template_circle.aura.02.loop.large.bluepink",
                    attachTo: true,
                    scale: 1,
                    belowTokens: true,
                    opacity: 0.4,
                    sequencerName: "RaynartStellaire"
                }
            }
        }
    };

    // Calculate dynamic flag values based on stats
    const esprit = actor.system.attributes?.esprit?.value || 3;
    const bigGunDamage = Math.ceil(esprit / 4);
    const bigGunResistance = Math.ceil(esprit / 2);

    CUSTOM_EFFECTS["Mode Big Gun"].flags[0].value = bigGunDamage; // damage
    CUSTOM_EFFECTS["Mode Big Gun"].flags[1].value = bigGunResistance; // resistance
    CUSTOM_EFFECTS["Mode Big Gun"].description = `Augmente les dégâts des tirs de +${bigGunDamage}. Procure Résistance ${bigGunResistance} avec 3 utilisations (1 recharge/tour - gestion manuelle).`;

    // Also update Expansion description with calculated resistance
    const expansionResistance = Math.floor(esprit / 2);
    CUSTOM_EFFECTS["Expansion du Monde Intérieur"].description = `Étend le monde intérieur de Raynart. Accorde Résistance ${expansionResistance} à TOUTES les invocations existantes.`;

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

    // === UTILITY FUNCTIONS ===

    /**
     * Get characteristic value with injuries and active effect bonuses
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            return { base: 3, injuries: 0, effectBonus: 0, final: 3 };
        }
        const baseValue = charAttribute.value || 3;

        // Detect injury stacks
        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        // Get active effect bonuses
        let effectBonus = 0;
        for (const effect of actor.effects.contents || []) {
            const flagValue = effect.flags?.[characteristic]?.value;
            if (typeof flagValue === 'number') {
                effectBonus += flagValue;
            }
        }

        const finalValue = Math.max(1, baseValue - injuryStacks + effectBonus);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            final: finalValue
        };
    }

    /**
     * Get current stance (Focus, Offensif, Défensif)
     */
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    /**
     * Check if Armure Infini is active
     */
    function hasArmureInfini(actor) {
        return actor?.effects?.contents?.some(e => e.name === "Armure du Fléau de l'Infini") || false;
    }

    /**
     * Calculate real mana cost based on effect type, current stance, and Armure Infini
     * @returns {Object} { realCost, savedMana, displayMessage }
     */
    function calculateManaCost(effectConfig, actor) {
        const currentStance = getCurrentStance(actor);
        const hasArmure = hasArmureInfini(actor);
        const baseCost = effectConfig.manaCost || 0;
        let costType = effectConfig.costType || "focusable";

        // Armure Infini modifies focusability
        if (hasArmure && effectConfig.name !== "Armure du Fléau de l'Infini") {
            if (costType === "non-focusable") {
                costType = "demi-focus";
            } else if (costType === "demi-focus") {
                costType = "focusable";
            }
        }

        let realCost = baseCost;
        let savedMana = 0;

        // Calculate real cost based on stance and modified cost type
        if (currentStance === 'focus') {
            if (costType === "focusable") {
                realCost = 0;
                savedMana = baseCost;
            } else if (costType === "demi-focus") {
                realCost = Math.floor(baseCost / 2);
                savedMana = baseCost - realCost;
            }
        }

        // Build display message
        let displayMessage = "";
        if (hasArmure && effectConfig.name !== "Armure du Fléau de l'Infini") {
            const originalCostType = effectConfig.costType;
            displayMessage = `<span style="color: #ff9800;">[Armure: ${originalCostType} → ${costType}]</span> `;
        }

        if (currentStance === 'focus' && savedMana > 0) {
            displayMessage += `<span style="color: #4caf50;">GRATUIT (Focus économise ${savedMana} mana)</span>`;
        } else if (currentStance === 'focus' && costType === "non-focusable") {
            displayMessage += `${realCost} mana <em style="font-size: 0.85em;">(non-focusable)</em>`;
        } else if (realCost < baseCost) {
            displayMessage += `${realCost} mana <em style="font-size: 0.85em; color: #4caf50;">(économie: ${savedMana} mana)</em>`;
        } else {
            displayMessage += `${realCost} mana`;
        }

        return { realCost, savedMana, displayMessage, modifiedCostType: costType };
    }

    /**
     * Update Armure Infini counter when mana is saved
     */
    async function updateArmureInfiniCounter(actor, savedMana) {
        if (savedMana <= 0) return;

        const armureEffect = actor.effects.contents.find(e => e.name === "Armure du Fléau de l'Infini");
        if (!armureEffect) return;

        const currentValue = armureEffect.flags?.statuscounter?.value || 0;
        const newValue = currentValue + savedMana;

        await armureEffect.update({
            "flags.statuscounter.value": newValue,
            "flags.statuscounter.visible": true
        });

        console.log(`[Raynart] Armure Infini counter updated: ${currentValue} -> ${newValue} (+${savedMana} mana saved)`);
    }

    /**
     * Force actor into Focus posture
     */
    async function forceFocusPosture(actor) {
        // Remove any existing postures
        const existingPostures = actor.effects.contents.filter(e =>
            ['offensif', 'defensif'].includes(e.name?.toLowerCase())
        );

        for (const posture of existingPostures) {
            await posture.delete();
            console.log(`[Raynart] Removed posture: ${posture.name}`);
        }

        // Check if Focus already active
        const hasFocus = actor.effects.contents.some(e => e.name?.toLowerCase() === 'focus');

        if (!hasFocus) {
            // Add Focus posture with proper CONFIG parameters
            const focusConfig = POSTURES['focus'];
            if (focusConfig) {
                const postureEffect = {
                    ...focusConfig,
                    origin: actor.uuid,
                    duration: { seconds: 86400 },
                    statuses: [focusConfig.id]
                };
                delete postureEffect.category;
                delete postureEffect.description;

                await actor.createEmbeddedDocuments("ActiveEffect", [postureEffect]);
                console.log(`[Raynart] Forced Focus posture`);
            }
        }
    }

    /**
     * Apply Token Magic FX transformation
     */
    async function applyTokenTransformation(token, transformConfig, shouldTransform) {
        if (!game.modules.get("tokenmagic")?.active) {
            console.warn("[Raynart] Token Magic FX not available");
            return;
        }

        if (shouldTransform) {
            const params = [{
                filterType: "transform",
                filterId: transformConfig.filterId,
                ...transformConfig
            }];
            await TokenMagic.addUpdateFilters(token, params);
        } else {
            await TokenMagic.deleteFilters(token, transformConfig.filterId);
        }
    }

    /**
     * Apply Token Magic FX filters
     */
    async function applyTokenFilters(token, filterConfig, shouldApply) {
        if (!game.modules.get("tokenmagic")?.active) {
            console.warn("[Raynart] Token Magic FX not available");
            return;
        }

        if (shouldApply) {
            const params = filterConfig.filterConfigs.map(config => ({
                filterType: config.filterType,
                filterId: filterConfig.filterId,
                ...config
            }));
            await TokenMagic.addUpdateFilters(token, params);
        } else {
            await TokenMagic.deleteFilters(token, filterConfig.filterId);
        }
    }

    /**
     * Play animation sequence
     */
    async function playAnimationSequence(token, animationSequence) {
        let seq = new Sequence();

        for (const anim of animationSequence) {
            let effect = seq.effect().file(anim.file);

            if (anim.atLocation) effect = effect.atLocation(token);
            if (anim.attachTo) effect = effect.attachTo(token);
            if (anim.scaleToObject) effect = effect.scaleToObject(anim.scaleToObject);
            if (anim.scale) effect = effect.scale(anim.scale);
            if (anim.center) effect = effect.center();
            if (anim.belowTokens) effect = effect.belowTokens();
            if (anim.fadeIn) effect = effect.fadeIn(anim.fadeIn);
            if (anim.fadeOut) effect = effect.fadeOut(anim.fadeOut);
            if (anim.duration) effect = effect.duration(anim.duration);
            if (anim.opacity) effect = effect.opacity(anim.opacity);
            if (anim.tint) effect = effect.tint(anim.tint);
            if (anim.anchor) effect = effect.anchor(anim.anchor);
            if (anim.waitUntilFinished) effect = effect.waitUntilFinished(anim.waitUntilFinished);
            if (anim.scaleOut) effect = effect.scaleOut(anim.scaleOut.value, anim.scaleOut.duration);
            if (anim.rotateOut) effect = effect.rotateOut(anim.rotateOut.angle, anim.rotateOut.duration, { ease: anim.rotateOut.ease });
            if (anim.scaleIn) effect = effect.scaleIn(anim.scaleIn.value, anim.scaleIn.duration, { ease: anim.scaleIn.ease });
            if (anim.filter) effect = effect.filter(anim.filter.type, anim.filter.config);
        }

        await seq.play();
    }

    /**
     * Play persistent animation
     */
    async function playPersistentAnimation(token, animConfig, isActivating) {
        if (isActivating) {
            let seq = new Sequence().effect().file(animConfig.file);

            if (animConfig.attachTo) seq = seq.attachTo(token);
            if (animConfig.atLocation) seq = seq.atLocation(token);
            if (animConfig.scaleToObject) seq = seq.scaleToObject(animConfig.scaleToObject);
            if (animConfig.scale) seq = seq.scale(animConfig.scale);
            if (animConfig.center) seq = seq.center();
            if (animConfig.belowTokens) seq = seq.belowTokens();
            if (animConfig.fadeIn) seq = seq.fadeIn(animConfig.fadeIn);
            if (animConfig.fadeOut) seq = seq.fadeOut(animConfig.fadeOut);
            if (animConfig.opacity) seq = seq.opacity(animConfig.opacity);
            if (animConfig.sequencerName) seq = seq.name(animConfig.sequencerName);

            seq = seq.persist();
            await seq.play();
        } else {
            if (animConfig.sequencerName) {
                Sequencer.EffectManager.endEffects({ name: animConfig.sequencerName, object: token });
            }
        }
    }

    /**
     * Get all Raynart invocations on the map
     */
    function getRaynartInvocations() {
        return canvas.tokens.placeables.filter(token =>
            token.actor?.flags?.world?.RaynartInvocations === true
        );
    }

    /**
     * Apply Resistance effect to all invocations (for Expansion du Monde Intérieur)
     */
    async function applyResistanceToInvocations(resistanceValue) {
        const invocations = getRaynartInvocations();
        let successCount = 0;

        for (const invToken of invocations) {
            try {
                // Check if Resistance effect already exists
                const existingResistance = invToken.actor.effects.contents.find(e =>
                    e.name === "Résistance"
                );

                if (existingResistance) {
                    // Update existing
                    await existingResistance.update({
                        "flags.statuscounter.value": resistanceValue,
                         "flags.statuscounter.visible": true
                    });
                } else {
                    // Create new
                    await invToken.actor.createEmbeddedDocuments("ActiveEffect", [{
                        name: "Résistance",
                        icon: "icons/magic/defensive/shield-barrier-flaming-pentagon-blue.webp",
                        flags: {
                            statuscounter: {
                                value: resistanceValue,
                                visible: true
                            },
                            resistance: { value: resistanceValue }
                        },
                        duration: { seconds: 86400 },
                        origin: actor.uuid
                    }]);
                }

                successCount++;
                console.log(`[Raynart] Applied Résistance ${resistanceValue} to ${invToken.name}`);
            } catch (error) {
                console.error(`[Raynart] Error applying resistance to ${invToken.name}:`, error);
            }
        }

        return { total: invocations.length, success: successCount };
    }

    /**
     * Remove Resistance effect from all invocations (when Expansion ends)
     */
    async function removeResistanceFromInvocations() {
        const invocations = getRaynartInvocations();
        let successCount = 0;

        for (const invToken of invocations) {
            try {
                const existingResistance = invToken.actor.effects.contents.find(e =>
                    e.name === "Résistance" && e.origin === actor.uuid
                );

                if (existingResistance) {
                    await existingResistance.delete();
                    successCount++;
                    console.log(`[Raynart] Removed Résistance from ${invToken.name}`);
                }
            } catch (error) {
                console.error(`[Raynart] Error removing resistance from ${invToken.name}:`, error);
            }
        }

        return { total: invocations.length, success: successCount };
    }

    // === CURRENT STATE DETECTION ===
    const getCurrentState = () => {
        const state = {
            customEffects: {},
            currentPosture: null,
            injuryCount: 0,
            statusEffects: {},
            hasArmureInfini: false,
            armureInfiniCounter: 0
        };

        // Detect custom effects
        for (const key of Object.keys(CUSTOM_EFFECTS)) {
            const effect = actor.effects.contents.find(e => e.name === key);
            state.customEffects[key] = effect || null;

            if (key === "Armure du Fléau de l'Infini" && effect) {
                state.hasArmureInfini = true;
                state.armureInfiniCounter = effect.flags?.statuscounter?.value || 0;
            }
        }

        // Detect current posture
        for (const key of Object.keys(POSTURES)) {
            const postureName = (POSTURES[key].name || POSTURES[key].label).toLowerCase();
            const effect = actor.effects.contents.find(e => e.name?.toLowerCase() === postureName);
            if (effect) {
                state.currentPosture = key;
                break;
            }
        }

        // Detect injuries
        for (const key of Object.keys(INJURY_EFFECTS)) {
            const injuryName = (INJURY_EFFECTS[key].name || INJURY_EFFECTS[key].label).toLowerCase();
            const effect = actor.effects.contents.find(e => e.name?.toLowerCase() === injuryName);
            if (effect) {
                state.injuryCount = effect.flags?.statuscounter?.value || 0;
                break;
            }
        }

        // Detect other status effects
        for (const key of Object.keys(configStatusEffects.other)) {
            const statusName = (configStatusEffects.other[key].name || configStatusEffects.other[key].label).toLowerCase();
            const effect = actor.effects.contents.find(e => e.name?.toLowerCase() === statusName);
            state.statusEffects[key] = effect || null;
        }

        return state;
    };

    const currentState = getCurrentState();

    // === DETECT CUSTOM OUTSIDE EFFECTS ===
    const getCustomOutsideEffects = () => {
        const outsideEffects = [];
        const knownEffectNames = new Set([
            ...Object.keys(CUSTOM_EFFECTS),
            ...Object.keys(POSTURES).map(k => (POSTURES[k].name || POSTURES[k].label).toLowerCase()),
            ...Object.keys(INJURY_EFFECTS).map(k => (INJURY_EFFECTS[k].name || INJURY_EFFECTS[k].label).toLowerCase()),
            ...Object.keys(configStatusEffects.other).map(k => (configStatusEffects.other[k].name || configStatusEffects.other[k].label).toLowerCase())
        ]);

        for (const effect of actor.effects.contents) {
            if (!knownEffectNames.has(effect.name?.toLowerCase())) {
                outsideEffects.push({
                    id: effect.id,
                    name: effect.name,
                    icon: effect.icon || "icons/svg/mystery-man.svg"
                });
            }
        }

        return outsideEffects;
    };

    const outsideEffects = getCustomOutsideEffects();

    console.log("[Raynart] Current state:", currentState);
    console.log("[Raynart] Current stance:", getCurrentStance(actor));
    console.log("[Raynart] Has Armure Infini:", currentState.hasArmureInfini);

    // === BUILD DIALOG CONTENT ===
    let dialogContent = `
        <div class="raynart-dialog-body">
            <h3>🔧 Gestionnaire Complet d'Effets - Raynart (Mage de la Mécanique)</h3>
            <p><strong>Token:</strong> ${actor.name}</p>
            <p><strong>Posture actuelle:</strong> <span style="color: #ff9800; font-weight: bold;">${getCurrentStance(actor)?.toUpperCase() || 'AUCUNE'}</span></p>
            ${currentState.hasArmureInfini ? `<p><strong>⚡ Armure Infini active:</strong> <span style="color: #4caf50;">${currentState.armureInfiniCounter} mana économisée</span></p>` : ''}
        <style>
            .raynart-dialog-body { padding-bottom: 20px; max-height: 600px; overflow-y: auto; }
            .effect-section { margin: 20px 0; padding: 15px; border: 2px solid #ccc; border-radius: 8px; }
            .effect-item { margin: 8px 0; padding: 12px; border: 1px solid #ddd; border-radius: 4px; background: #f9f9f9; }
            .effect-icon { width: 24px; height: 24px; margin-right: 10px; background-size: cover; background-position: center; border-radius: 4px; display: inline-block; }
            .effect-icon[data-is-svg="true"] { background-color: #444; border-radius: 4px; }
            .status-indicator { font-weight: bold; margin-left: 10px; }
            .button-group { display: flex; gap: 8px; justify-content: center; margin-top: 8px; }
            .btn { padding: 6px 12px; border: none; border-radius: 4px; font-size: 0.9em; cursor: pointer; }
            .btn-toggle { padding: 8px 16px; border: none; border-radius: 4px; font-size: 0.9em; cursor: pointer; font-weight: bold; transition: all 0.2s; }
            .btn-toggle.inactive { background: #4caf50; color: white; }
            .btn-toggle.active { background: #f44336; color: white; }
            .btn-disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
            .pending-change { box-shadow: 0 0 5px #2196f3 !important; }
            .mana-cost { color: #2196f3; font-weight: bold; margin-top: 5px; }
            .armure-modifier { color: #ff9800; font-style: italic; font-size: 0.9em; }
        </style>
    `;

    let pendingChanges = {};

    // === CUSTOM OUTSIDE EFFECTS SECTION ===
    if (outsideEffects.length > 0) {
        dialogContent += `
            <div class="effect-section" style="border-color: #9e9e9e;">
                <h4>⚠️ Effets Externes Détectés</h4>
                <p style="font-size: 0.9em; color: #666;">Ces effets ne sont pas gérés par ce système.</p>
        `;

        for (const effect of outsideEffects) {
            const isSvg = effect.icon.endsWith('.svg');
            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${effect.icon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${effect.name}</strong>
                            <br><small style="color: #999;">Effet externe (non modifiable ici)</small>
                        </div>
                        <div class="status-indicator" style="color: #2e7d32;">
                            ✅ ACTIVE
                        </div>
                    </div>
                </div>
            `;
        }

        dialogContent += `</div>`;
    }

    // === CUSTOM EFFECTS SECTION ===
    dialogContent += `
        <div class="effect-section" style="border-color: #ff9800;">
            <h4>🔧 Effets Mécaniques de Raynart</h4>
    `;

    for (const [key, config] of Object.entries(CUSTOM_EFFECTS)) {
        const isActive = currentState.customEffects[key] !== null;
        const statusIcon = isActive ? "✅" : "❌";
        const statusText = isActive ? "ACTIVE" : "INACTIVE";
        const statusColor = isActive ? "#2e7d32" : "#d32f2f";
        const isSvg = config.icon.endsWith('.svg');

        // Calculate mana cost dynamically
        const costCalc = calculateManaCost(config, actor);

        dialogContent += `
            <div class="effect-item" id="effect-${key}">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${config.icon}');"></div>
                    <div style="flex-grow: 1;">
                        <strong>${config.name}</strong>
                        <br><small style="color: #666;">${config.description}</small>
                        ${config.isPerTurn ? `<br><small style="color: #f57c00;">⏱️ Coût par tour: ${config.manaPerTurn || config.manaCost} mana</small>` : ''}
                        ${config.forcesFocusPosture ? `<br><small style="color: #ff9800;">⚡ Force la posture Focus</small>` : ''}
                        <div class="mana-cost">💎 ${costCalc.displayMessage}</div>
                    </div>
                    <div class="status-indicator status-${key}" style="color: ${statusColor};">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="btn btn-toggle ${isActive ? 'active' : 'inactive'}" data-action="toggle" data-effect="${key}" data-category="custom" data-current-state="${isActive ? 'active' : 'inactive'}">
                        ${isActive ? '➖ Désactiver' : '➕ Activer'}
                    </button>
                </div>
            </div>
        `;
    }

    dialogContent += `</div>`;

    // === POSTURES SECTION ===
    dialogContent += `
        <div class="effect-section" style="border-color: #673ab7;">
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
        const postureName = postureData.name || postureData.label;
        const postureIcon = postureData.icon || "icons/svg/mystery-man.svg";
        const isSvg = postureIcon.endsWith('.svg');

        dialogContent += `
            <div class="effect-item" id="posture-${key}">
                <div style="display: flex; align-items: center; margin-bottom: 8px;">
                    <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${postureIcon}');"></div>
                    <div style="flex-grow: 1;">
                        <strong>${postureName}</strong>
                    </div>
                    <div class="status-indicator status-${key}" style="color: ${statusColor};">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" class="btn btn-toggle ${isActive ? 'active' : 'inactive'}" data-action="toggle" data-effect="${key}" data-category="posture" data-current-state="${isActive ? 'active' : 'inactive'}">
                        ${isActive ? '➖ Désactiver' : '➕ Activer'}
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
                <h4>🩸 Blessures</h4>
        `;

        for (const [key, injuryData] of Object.entries(INJURY_EFFECTS)) {
            const currentCount = currentState.injuryCount;
            const isSvg = injuryData.icon.endsWith('.svg');

            dialogContent += `
                <div class="effect-item">
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <div class="effect-icon" data-is-svg="${isSvg}" style="background-image: url('${injuryData.icon}');"></div>
                        <div style="flex-grow: 1;">
                            <strong>${injuryData.name}</strong>
                            <br><small style="color: #666;">Chaque blessure réduit toutes les caractéristiques de -1</small>
                        </div>
                        <div class="status-indicator" style="color: ${currentCount > 0 ? '#d32f2f' : '#2e7d32'};">
                            ${currentCount > 0 ? '🩸' : '✅'} ${currentCount} blessure(s)
                        </div>
                    </div>
                    <div class="button-group">
                        <button type="button" class="btn btn-add" data-action="addInjury" data-effect="${key}">
                            ➕ Ajouter
                        </button>
                        <button type="button" class="btn btn-remove" data-action="removeInjury" data-effect="${key}" ${currentCount === 0 ? 'disabled' : ''}>
                            ➖ Retirer
                        </button>
                        <label style="margin-left: 10px;">Quantité: <input type="number" id="injury-amount" min="1" max="10" value="1" style="width: 50px;"></label>
                    </div>
                </div>
            `;
        }

        dialogContent += `</div>`;
    }

    dialogContent += `</div>`; // Close raynart-dialog-body

    // === DIALOG CREATION ===
    const result = await new Promise((resolve) => {
        new Dialog({
            title: "🔧 Gestion des Effets - Raynart",
            content: dialogContent,
            buttons: {
                apply: {
                    label: "✅ Appliquer",
                    callback: (html) => {
                        resolve({
                            action: "apply",
                            pendingChanges: pendingChanges,
                            injuryAmount: parseInt(html.find("#injury-amount")[0]?.value || 1)
                        });
                    }
                },
                removeAll: {
                    label: "🗑️ Tout Retirer",
                    callback: () => resolve({ action: "removeAll" })
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve({ action: null })
                }
            },
            default: "apply",
            close: () => resolve({ action: null }),
            render: (html) => {
                // Event handlers for buttons
                html.find("button[data-action]").on("click", function(event) {
                    event.preventDefault();
                    const button = $(this);
                    const action = button.data("action");
                    const effectKey = button.data("effect");
                    const category = button.data("category");

                    console.log(`[Raynart] Button clicked: ${action} ${category} ${effectKey}`);

                    // Handle different actions
                    if (action === "addInjury" || action === "removeInjury") {
                        // Injury actions are immediate, not pending
                        return;
                    }

                    if (action === "removePostures") {
                        pendingChanges["removeAllPostures"] = true;
                    } else if (action === "toggle") {
                        // Handle toggle button
                        const currentState = button.data("current-state");
                        const newAction = currentState === "active" ? "remove" : "add";

                        if (!pendingChanges[category]) pendingChanges[category] = {};
                        pendingChanges[category][effectKey] = newAction;

                        // Update button appearance
                        if (currentState === "active") {
                            button.removeClass("active").addClass("inactive");
                            button.text("➕ Activer");
                            button.data("current-state", "inactive");
                        } else {
                            button.removeClass("inactive").addClass("active");
                            button.text("➖ Désactiver");
                            button.data("current-state", "active");
                        }
                    } else if (action === "add") {
                        if (!pendingChanges[category]) pendingChanges[category] = {};
                        pendingChanges[category][effectKey] = "add";
                    } else if (action === "remove") {
                        if (!pendingChanges[category]) pendingChanges[category] = {};
                        pendingChanges[category][effectKey] = "remove";
                    }

                    // Visual feedback
                    const effectItem = button.closest(".effect-item");
                    effectItem.toggleClass("pending-change");

                    console.log("[Raynart] Pending changes:", pendingChanges);
                });
            }
        }, {
            width: 700,
            height: 800
        }).render(true);
    });

    if (!result || !result.action) {
        console.log("[Raynart] Dialog cancelled");
        return;
    }

    console.log("[Raynart] User choice:", result);

    // === HANDLE REMOVE ALL ===
    if (result.action === "removeAll") {
        const effectsToRemove = actor.effects.contents.filter(e =>
            Object.keys(CUSTOM_EFFECTS).includes(e.name) ||
            Object.keys(POSTURES).some(k => POSTURES[k].name === e.name)
        );

        for (const effect of effectsToRemove) {
            // Special handling for Armure Infini - show end dialog
            if (effect.name === "Armure du Fléau de l'Infini") {
                await handleArmureInfiniEnd(actor, effect, casterToken);
            }

            //Clean up persistent animations
            const effectConfig = CUSTOM_EFFECTS[effect.name];
            if (effectConfig?.hasAnimation && effectConfig.animation.persistent) {
                const seqName = effectConfig.animation.persistent.sequencerName;
                if (seqName) {
                    Sequencer.EffectManager.endEffects({ name: seqName, object: casterToken });
                }
            }

            await effect.delete();
            console.log(`[Raynart] Removed effect: ${effect.name}`);
        }

        ui.notifications.info("🗑️ Tous les effets de Raynart ont été retirés !");
        return;
    }

    // === PROCESS CHANGES ===
    const { pendingChanges: changes, injuryAmount } = result;

    try {
        // Handle Remove All Postures
        if (changes.removeAllPostures) {
            const posturesToRemove = actor.effects.contents.filter(e =>
                Object.keys(POSTURES).some(k => POSTURES[k].name === e.name)
            );

            for (const posture of posturesToRemove) {
                await posture.delete();
                console.log(`[Raynart] Removed posture: ${posture.name}`);
            }
        }

        // Handle Posture Changes
        if (changes.posture) {
            for (const [key, action] of Object.entries(changes.posture)) {
                const postureConfig = POSTURES[key];
                if (!postureConfig) continue;

                if (action === "add") {
                    // Remove other postures first
                    const otherPostures = actor.effects.contents.filter(e =>
                        Object.keys(POSTURES).some(k => (POSTURES[k].name || POSTURES[k].label).toLowerCase() === e.name?.toLowerCase())
                    );

                    for (const other of otherPostures) {
                        await other.delete();
                    }

                    // Add new posture with proper CONFIG parameters
                    const postureEffect = {
                        ...postureConfig,
                        origin: actor.uuid,
                        duration: { seconds: 86400 },
                        statuses: [postureConfig.id]
                    };
                    delete postureEffect.category;
                    delete postureEffect.description;

                    await actor.createEmbeddedDocuments("ActiveEffect", [postureEffect]);

                    ui.notifications.info(`⚔️ Posture ${postureConfig.name || postureConfig.label} activée !`);
                } else if (action === "remove") {
                    const existingPosture = actor.effects.contents.find(e =>
                        e.name?.toLowerCase() === (postureConfig.name || postureConfig.label).toLowerCase()
                    );
                    if (existingPosture) {
                        await existingPosture.delete();
                        ui.notifications.info(`⚔️ Posture ${postureConfig.name || postureConfig.label} désactivée !`);
                    }
                }
            }
        }

        // Handle Custom Effects
        if (changes.custom) {
            for (const [key, action] of Object.entries(changes.custom)) {
                const effectConfig = CUSTOM_EFFECTS[key];
                if (!effectConfig) continue;

                if (action === "add") {
                    // Calculate mana cost for message
                    const costCalc = calculateManaCost(effectConfig, actor);

                    // Special handling based on effect type
                    if (key === "Armure du Fléau de l'Infini") {
                        await handleArmureInfiniActivation(actor, effectConfig, casterToken, costCalc);
                    } else if (key === "Expansion du Monde Intérieur") {
                        await handleExpansionActivation(actor, effectConfig, casterToken, costCalc);
                    } else if (key === "Mode Eclipse") {
                        await handleEclipseActivation(actor, effectConfig, casterToken, costCalc);
                    } else {
                        // Generic effect activation
                        await handleGenericEffectActivation(actor, effectConfig, casterToken, costCalc, key);
                    }

                } else if (action === "remove") {
                    // Special handling for Armure Infini - show end dialog
                    if (key === "Armure du Fléau de l'Infini") {
                        const existingEffect = actor.effects.contents.find(e => e.name === key);
                        if (existingEffect) {
                            await handleArmureInfiniEnd(actor, existingEffect, casterToken);
                        }
                    } else {
                        await handleGenericEffectDeactivation(actor, effectConfig, casterToken, key);
                    }
                }
            }
        }

        ui.notifications.info("✅ Changements appliqués avec succès !");

    } catch (error) {
        console.error("[Raynart] Error applying changes:", error);
        ui.notifications.error("❌ Erreur lors de l'application des changements !");
    }

    // === EFFECT HANDLERS ===

    /**
     * Handle Armure Infini activation
     */
    async function handleArmureInfiniActivation(actor, effectConfig, token, costCalc) {
        ui.notifications.info("⚡ Activation de l'Armure du Fléau de l'Infini...");

        // Force Focus posture
        await forceFocusPosture(actor);

        // Play activation animation sequence
        if (effectConfig.hasAnimation && effectConfig.animation.activationSequence) {
            await playAnimationSequence(token, effectConfig.animation.activationSequence);
        }

        // Create effect with status counter
        await actor.createEmbeddedDocuments("ActiveEffect", [{
            name: effectConfig.name,
            icon: effectConfig.icon,
            flags: {
                statuscounter: {
                    value: 0,
                    visible: true
                }
            },
            duration: { seconds: 86400 },
            origin: actor.uuid
        }]);

        // Play persistent animation
        if (effectConfig.animation.persistent) {
            await playPersistentAnimation(token, effectConfig.animation.persistent, true);
        }

        // Chat message
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: `
                <div style="border: 2px solid #ff9800; border-radius: 8px; padding: 12px; background: #fff3e0;">
                    <h3 style="margin: 0 0 10px 0; color: #ff9800;">⚡ Armure du Fléau de l'Infini</h3>
                    <p><strong>${actor.name}</strong> revêt l'armure légendaire !</p>
                    <hr>
                    <p>🔄 Modification des coûts:</p>
                    <ul>
                        <li>Effets non-focusables → demi-focusables</li>
                        <li>Effets demi-focusables → focusables</li>
                    </ul>
                    <p>⚡ Posture Focus forcée</p>
                    <p>📊 Compteur de mana économisée: 0</p>
                </div>
            `
        });

        console.log("[Raynart] Armure du Fléau de l'Infini activated");
    }

    /**
     * Handle Armure Infini end - ask for turns spent in various modes
     */
    async function handleArmureInfiniEnd(actor, effect, token) {
        const currentCounter = effect.flags?.statuscounter?.value || 0;

        // Ask for additional costs
        const endDialog = await new Promise((resolve) => {
            new Dialog({
                title: "🔚 Fin de l'Armure du Fléau de l'Infini",
                content: `
                    <h3>Calcul de la mana économisée totale</h3>
                    <p><strong>Mana économisée (compteur):</strong> ${currentCounter}</p>
                    <hr>
                    <p>Indiquez le nombre de tours passés dans ces modes:</p>
                    <div style="margin: 10px 0;">
                        <label>Tours en Extension d'Invocations (2 mana/tour):</label>
                        <input type="number" id="extension-turns" min="0" value="0" style="width: 60px;">
                    </div>
                    <div style="margin: 10px 0;">
                        <label>Tours en Mécanique Analytique (2 mana/tour):</label>
                        <input type="number" id="analytique-turns" min="0" value="0" style="width: 60px;">
                    </div>
                    <div style="margin: 10px 0;">
                        <label>Tours en Mode Stellaire (3 mana/tour, ×1.5):</label>
                        <input type="number" id="stellaire-turns" min="0" value="0" style="width: 60px;">
                    </div>
                `,
                buttons: {
                    confirm: {
                        label: "✅ Confirmer",
                        callback: (html) => {
                            const extensionTurns = parseInt(html.find("#extension-turns")[0]?.value || 0);
                            const analytiqueTurns = parseInt(html.find("#analytique-turns")[0]?.value || 0);
                            const stellaireTurns = parseInt(html.find("#stellaire-turns")[0]?.value || 0);

                            resolve({ extensionTurns, analytiqueTurns, stellaireTurns });
                        }
                    },
                    cancel: {
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm"
            }).render(true);
        });

        if (!endDialog) {
            ui.notifications.warn("⚠️ Désactivation de l'Armure annulée");
            return;
        }

        // Calculate total saved mana
        const extensionCost = endDialog.extensionTurns * 2;
        const analytiqueCost = endDialog.analytiqueTurns * 2;
        const stellaireCost = Math.floor(endDialog.stellaireTurns * 3 / 2); // 1.5 per turn, rounded down
        const totalSaved = currentCounter + extensionCost + analytiqueCost + stellaireCost;

        // Play deactivation animation
        const effectConfig = CUSTOM_EFFECTS["Armure du Fléau de l'Infini"];
        if (effectConfig.animation.persistent) {
            await playPersistentAnimation(token, effectConfig.animation.persistent, false);
        }

        if (effectConfig.animation.deactivationAnimation) {
            let seq = new Sequence().effect()
                .file(effectConfig.animation.deactivationAnimation.file)
                .atLocation(token)
                .scale(effectConfig.animation.deactivationAnimation.scale);

            if (effectConfig.animation.deactivationAnimation.waitUntilFinished) {
                seq = seq.waitUntilFinished(effectConfig.animation.deactivationAnimation.waitUntilFinished);
            }

            await seq.play();
        }

        // Remove effect
        await effect.delete();

        // Chat message
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: `
                <div style="border: 2px solid #f44336; border-radius: 8px; padding: 12px; background: #ffebee;">
                    <h3 style="margin: 0 0 10px 0; color: #f44336;">⚡ Fin de l'Armure du Fléau de l'Infini</h3>
                    <p><strong>${actor.name}</strong> retire l'armure légendaire.</p>
                    <hr>
                    <p><strong>💎 Mana économisée totale: ${totalSaved}</strong></p>
                    <ul>
                        <li>Compteur de base: ${currentCounter}</li>
                        ${endDialog.extensionTurns > 0 ? `<li>Extension Invocations: ${endDialog.extensionTurns} tour(s) × 2 = ${extensionCost}</li>` : ''}
                        ${endDialog.analytiqueTurns > 0 ? `<li>Mécanique Analytique: ${endDialog.analytiqueTurns} tour(s) × 2 = ${analytiqueCost}</li>` : ''}
                        ${endDialog.stellaireTurns > 0 ? `<li>Mode Stellaire: ${endDialog.stellaireTurns} tour(s) × 1.5 = ${stellaireCost}</li>` : ''}
                    </ul>
                    <p style="font-style: italic; color: #666;">Note: Gestion de mana à gérer manuellement</p>
                </div>
            `
        });

        ui.notifications.info(`⚡ Armure désactivée ! Total économisé: ${totalSaved} mana`);
    }

    /**
     * Handle Expansion du Monde Intérieur activation
     */
    async function handleExpansionActivation(actor, effectConfig, token, costCalc) {
        ui.notifications.info("🌍 Activation de l'Expansion du Monde Intérieur...");

        // Calculate resistance value
        const espritValue = getCharacteristicValue(actor, "esprit").final;
        const resistanceValue = Math.floor(espritValue / 2);

        // Play cast animation
        if (effectConfig.animation.castAnimation) {
            let seq = new Sequence().effect()
                .file(effectConfig.animation.castAnimation.file)
                .atLocation(token)
                .scaleToObject(effectConfig.animation.castAnimation.scaleToObject)
                .belowTokens(effectConfig.animation.castAnimation.belowTokens)
                .fadeIn(effectConfig.animation.castAnimation.fadeIn)
                .fadeOut(effectConfig.animation.castAnimation.fadeOut);

            await seq.play();
        }

        // Play pulse animation
        if (effectConfig.animation.pulseAnimation) {
            let seq = new Sequence().effect()
                .file(effectConfig.animation.pulseAnimation.file)
                .atLocation(token)
                .scale(effectConfig.animation.pulseAnimation.scale);

            await seq.play();
        }

        // Apply resistance to all invocations
        const result = await applyResistanceToInvocations(resistanceValue);

        // Create effect on Raynart
        await actor.createEmbeddedDocuments("ActiveEffect", [{
            name: effectConfig.name,
            icon: effectConfig.icon,
            duration: { seconds: 86400 },
            origin: actor.uuid
        }]);

        // Update Armure Infini counter if applicable
        if (costCalc.savedMana > 0) {
            await updateArmureInfiniCounter(actor, costCalc.savedMana);
        }

        // Chat message
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: `
                <div style="border: 2px solid #ff9800; border-radius: 8px; padding: 12px; background: #fff3e0;">
                    <h3 style="margin: 0 0 10px 0; color: #ff9800;">🌍 Expansion du Monde Intérieur</h3>
                    <p><strong>${actor.name}</strong> étend son monde intérieur !</p>
                    <hr>
                    <p><strong>💎 Coût:</strong> ${costCalc.displayMessage}</p>
                    <p><strong>🛡️ Résistance accordée:</strong> ${resistanceValue}</p>
                    <p><strong>📊 Invocations affectées:</strong> ${result.success}/${result.total}</p>
                    ${costCalc.savedMana > 0 ? `<p style="color: #4caf50;">⚡ +${costCalc.savedMana} mana ajoutée au compteur Armure Infini</p>` : ''}
                </div>
            `
        });

        console.log(`[Raynart] Expansion activated - ${result.success} invocations received Résistance ${resistanceValue}`);
    }

    /**
     * Handle Eclipse activation
     */
    async function handleEclipseActivation(actor, effectConfig, token, costCalc) {
        ui.notifications.info("🌑 Activation du Mode Eclipse...");

        // Force Focus posture
        await forceFocusPosture(actor);

        // Play cast animation
        if (effectConfig.animation.castAnimation) {
            let seq = new Sequence().effect()
                .file(effectConfig.animation.castAnimation.file)
                .atLocation(token)
                .scale(effectConfig.animation.castAnimation.scale);

            await seq.play();
        }

        // Create effect
        await actor.createEmbeddedDocuments("ActiveEffect", [{
            name: effectConfig.name,
            icon: effectConfig.icon,
            duration: { seconds: 86400 },
            origin: actor.uuid
        }]);

        // Play persistent animation
        if (effectConfig.animation.persistent) {
            await playPersistentAnimation(token, effectConfig.animation.persistent, true);
        }

        // Update Armure Infini counter if applicable
        if (costCalc.savedMana > 0) {
            await updateArmureInfiniCounter(actor, costCalc.savedMana);
        }

        // Chat message
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: `
                <div style="border: 2px solid #2196f3; border-radius: 8px; padding: 12px; background: #e3f2fd;">
                    <h3 style="margin: 0 0 10px 0; color: #2196f3;">🌑 Mode Eclipse</h3>
                    <p><strong>${actor.name}</strong> partage son esprit avec ses créations !</p>
                    <hr>
                    <p><strong>💎 Coût:</strong> ${costCalc.displayMessage}</p>
                    <p><strong>📈 Effets:</strong></p>
                    <ul>
                        <li>✅ Double capacité de création complexe</li>
                        <li>❌ Ne peut plus esquiver</li>
                        <li>⚠️ Jet Volonté DD 25 + PV manquants pour garder contrôle si dégâts</li>
                        <li>🚫 Interdit: explosions et magie stellaire</li>
                        <li>⚡ Posture Focus forcée</li>
                    </ul>
                    ${costCalc.savedMana > 0 ? `<p style="color: #4caf50;">⚡ +${costCalc.savedMana} mana ajoutée au compteur Armure Infini</p>` : ''}
                </div>
            `
        });

        console.log("[Raynart] Mode Eclipse activated");
    }

    /**
     * Handle generic effect activation
     */
    async function handleGenericEffectActivation(actor, effectConfig, token, costCalc, key) {
        ui.notifications.info(`🔧 Activation de ${effectConfig.name}...`);

        // Play cast animation if exists
        if (effectConfig.hasAnimation) {
            if (effectConfig.animation.activationSequence) {
                await playAnimationSequence(token, effectConfig.animation.activationSequence);
            } else if (effectConfig.animation.castAnimation) {
                let seq = new Sequence().effect()
                    .file(effectConfig.animation.castAnimation.file)
                    .atLocation(token);

                if (effectConfig.animation.castAnimation.scale) seq = seq.scale(effectConfig.animation.castAnimation.scale);
                if (effectConfig.animation.castAnimation.tint) seq = seq.tint(effectConfig.animation.castAnimation.tint);

                await seq.play();
            }
        }

        // Prepare effect data
        const effectData = {
            name: effectConfig.name,
            icon: effectConfig.icon,
            duration: { seconds: 86400 },
            origin: actor.uuid,
            flags: {}
        };

        // Add flags
        if (effectConfig.flags && effectConfig.flags.length > 0) {
            for (const flag of effectConfig.flags) {
                if (flag.value !== null) {
                    effectData.flags[flag.key] = { value: flag.value };
                }
            }
        }

        // Add status counter if applicable
        if (effectConfig.hasStatusCounter) {
            effectData.flags.statuscounter = {
                value: effectConfig.statusCounterValue || 0,
                visible: true
            };
        }

        // Create effect
        await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        // Play persistent animation
        if (effectConfig.animation?.persistent) {
            await playPersistentAnimation(token, effectConfig.animation.persistent, true);
        }

        // Update Armure Infini counter if applicable
        if (costCalc.savedMana > 0) {
            await updateArmureInfiniCounter(actor, costCalc.savedMana);
        }

        // Chat message
        let chatContent = `
            <div style="border: 2px solid #ff9800; border-radius: 8px; padding: 12px; background: #fff3e0;">
                <h3 style="margin: 0 0 10px 0; color: #ff9800;">🔧 ${effectConfig.name}</h3>
                <p><strong>${actor.name}</strong> active ${effectConfig.name} !</p>
                <hr>
                <p><strong>💎 Coût:</strong> ${costCalc.displayMessage}</p>
                <p>${effectConfig.description}</p>
        `;

        if (effectConfig.isPerTurn) {
            chatContent += `<p style="color: #f57c00;">⏱️ Coût par tour: ${effectConfig.manaPerTurn || effectConfig.manaCost} mana</p>`;
        }

        if (costCalc.savedMana > 0) {
            chatContent += `<p style="color: #4caf50;">⚡ +${costCalc.savedMana} mana ajoutée au compteur Armure Infini</p>`;
        }

        chatContent += `</div>`;

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: chatContent
        });

        console.log(`[Raynart] ${effectConfig.name} activated`);
    }

    /**
     * Handle generic effect deactivation
     */
    async function handleGenericEffectDeactivation(actor, effectConfig, token, key) {
        const existingEffect = actor.effects.contents.find(e => e.name === key);
        if (!existingEffect) return;

        ui.notifications.info(`🔧 Désactivation de ${effectConfig.name}...`);

        // Special handling for Expansion du Monde Intérieur - remove resistance from invocations
        if (key === "Expansion du Monde Intérieur") {
            const result = await removeResistanceFromInvocations();
            console.log(`[Raynart] Removed resistance from ${result.success}/${result.total} invocations`);
        }

        // Stop persistent animations
        if (effectConfig.animation?.persistent?.sequencerName) {
            Sequencer.EffectManager.endEffects({ name: effectConfig.animation.persistent.sequencerName, object: token });
        }

        // Play deactivation animation if exists
        if (effectConfig.animation?.deactivationAnimation) {
            let seq = new Sequence().effect()
                .file(effectConfig.animation.deactivationAnimation.file)
                .atLocation(token)
                .scale(effectConfig.animation.deactivationAnimation.scale);

            if (effectConfig.animation.deactivationAnimation.waitUntilFinished) {
                seq = seq.waitUntilFinished(effectConfig.animation.deactivationAnimation.waitUntilFinished);
            }

            await seq.play();
        }

        // Remove effect
        await existingEffect.delete();

        // Chat message
        let chatContent = `
            <div style="border: 2px solid #f44336; border-radius: 8px; padding: 12px; background: #ffebee;">
                <h3 style="margin: 0 0 10px 0; color: #f44336;">🔧 ${effectConfig.name}</h3>
                <p><strong>${actor.name}</strong> désactive ${effectConfig.name}.</p>
        `;

        if (key === "Expansion du Monde Intérieur") {
            const result = await removeResistanceFromInvocations();
            chatContent += `<p><strong>📊 Résistances retirées:</strong> ${result.success}/${result.total} invocations</p>`;
        }

        chatContent += `</div>`;

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: token }),
            content: chatContent
        });

        console.log(`[Raynart] ${effectConfig.name} deactivated`);
    }

})();
