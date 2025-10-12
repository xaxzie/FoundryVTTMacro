/**
 * End Ora Effects (Terminer Effets d'Ora) - Ora (Maîtresse de l'Eau)
 *
 * Macro pour terminer les effets qu'Ora a appliqués sur d'autres tokens.
 * Spécialisé pour les effets d'eau et de magie aquatique d'Ora.
 *
 * Fonctionnalités :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détecte automatiquement tous les effets appliqués par Ora sur le canvas
 * - Interface de sélection pour choisir quels effets supprimer
 * - Supprime les animations Sequencer associées si applicable
 * - Gestion par délégation GM pour les tokens non possédés
 * - Facilement extensible pour de nouveaux effets via EFFECT_CONFIG
 * - Spécialisé pour les mécaniques aquatiques d'Ora
 *
 * GUIDE D'EXTENSION POUR DE NOUVEAUX SORTS :
 *
 * 1. Configuration dans le nouveau sort :
 *    - Ajouter une section `effectConfig` ou `statusEffects` dans SPELL_CONFIG
 *    - Inclure une sous-section `endEffectConfig` avec les propriétés suivantes :
 *      * displayName, sectionTitle, sectionIcon, cssClass
 *      * borderColor, bgColor, mechanicType
 *      * detectFlags (pour identifier l'effet)
 *      * removeAnimation (animation de suppression)
 *      * cleanup (patterns Sequencer à nettoyer)
 *      * getExtraData, getDynamicDescription (optionnel)
 *
 * 2. Mise à jour d'endOraEffect.js :
 *    - Ajouter l'entrée dans EFFECT_CONFIG en important la config du sort
 *    - Le système détectera automatiquement le nouvel effet
 *
 * 3. Mécaniques supportées :
 *    - "simple" : Effet d'acteur standard avec animation de retrait
 *    - "vortex" : Effet de zone avec cleanup d'animations Sequencer
 *    - "orphanVortex" : Animation Sequencer sans effet d'acteur
 *    - "slowdown"/"weakness" : Effets avec Status Counter
 *
 * Usage : Sélectionner le token d'Ora et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DU PERSONNAGE =====
    const CHARACTER_CONFIG = {
        name: "Ora",
        displayName: "Ora (Maîtresse de l'Eau)",
        icon: "🌊",
        color: "#2196f3",
        noEffectsMessage: "Pas d'effets d'eau détectés à supprimer !",
        dialogTitle: "Terminer Effets d'Ora",
        chatTitle: "Effets d'Eau d'Ora Terminés"
    };

    // ===== CONFIGURATION CENTRALISÉE DES EFFETS =====
    /**
     * Configuration centralisée qui réunit toutes les configurations d'effets d'Ora
     * provenant des différents sorts (tourbillon.js, bubbles.js, etc.)
     */
    const EFFECT_CONFIG = {
        // Tourbillon - Configuration importée depuis tourbillon.js
        "Tourbillon": {
            displayName: "Tourbillon",
            icon: "icons/magic/water/vortex-water-whirlpool.webp",
            description: "Pris dans un tourbillon d'eau d'Ora",
            sectionTitle: "🌊 Tourbillons",
            sectionIcon: "🌊",
            cssClass: "vortex-effect",
            borderColor: "#2196f3",
            bgColor: "#e3f2fd",
            detectFlags: [
                { path: "name", matchValue: "Tourbillon" },
                { path: "flags.world.vortexCaster", matchValue: "CASTER_ID" }
            ],
            cleanup: {
                sequencerPatterns: ["tourbillon_*"] // Pattern pour nettoyer les animations
            },
            mechanicType: "vortex",
            removeAnimation: {
                file: "animated-spell-effects-cartoon.water.water splash.01",
                scale: 0.8,
                duration: 2000,
                fadeOut: 1000,
                tint: "#2196f3"
            }
        },

        // Dôme de Glace - Configuration importée depuis tourbillon.js (option dôme)
        "Dôme": {
            displayName: "Dôme de Glace",
            icon: "icons/magic/defensive/barrier-ice-crystal-wall-jagged-blue.webp",
            description: "Enfermé dans un dôme de glace d'Ora",
            sectionTitle: "🧊 Dômes de Glace",
            sectionIcon: "🧊",
            cssClass: "ice-dome-effect",
            borderColor: "#87ceeb",
            bgColor: "#f0f8ff",
            detectFlags: [
                { path: "name", matchValue: "Dôme" },
                { path: "flags.world.domeCaster", matchValue: "CASTER_ID" }
            ],
            cleanup: {
                sequencerPatterns: ["dome_*"] // Pattern pour nettoyer les animations
            },
            mechanicType: "dome",
            removeAnimation: {
                file: "jb2a.impact.frost.blue.02",
                scale: 1.0,
                duration: 2500,
                fadeOut: 1000,
                tint: "#87ceeb"
            },
            getExtraData: (effect) => ({
                currentHP: effect.flags?.statuscounter?.value || 0,
                maxHP: effect.flags?.world?.maxHP || 0
            }),
            getDynamicDescription: (effect) => {
                const currentHP = effect.flags?.statuscounter?.value || 0;
                return `Enfermé dans un dôme de glace d'Ora (${currentHP} PV)`;
            }
        },

        // Ora Ralentissement - Configuration importée depuis bubbles.js (ice)
        "Ora Ralentissement": {
            displayName: "Ora Ralentissement",
            icon: "icons/magic/water/snowflake-ice-snow-white.webp",
            description: "Ralenti par la glace d'Ora",
            sectionTitle: "❄️ Ralentissement",
            sectionIcon: "❄️",
            cssClass: "ice-slowdown-effect",
            borderColor: "#87ceeb",
            bgColor: "#f0f8ff",
            detectFlags: [
                { path: "name", matchValue: "Ora Ralentissement" },
                { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
            ],
            mechanicType: "slowdown",
            getExtraData: (effect) => ({
                slowdownAmount: effect.flags?.statuscounter?.value || 1,
                sourceSpell: effect.flags?.world?.spellName || "Bulles de glace"
            }),
            getDynamicDescription: (effect) => {
                const slowdown = effect.flags?.statuscounter?.value || 1;
                const sourceSpell = effect.flags?.world?.spellName || "Bulles de glace";
                return `Ralenti par ${sourceSpell} d'Ora (-${slowdown} case de vitesse)`;
            }

        },

        // Ora Faiblesse Électrique - Configuration importée depuis bubbles.js (water)
        "Ora Faiblesse Électrique": {
            displayName: "Ora Faiblesse Électrique",
            icon: "icons/magic/lightning/bolt-strike-blue.webp",
            description: "Vulnérable aux dégâts électriques (+2 prochaine attaque électrique)",
            sectionTitle: "⚡ Faiblesse Électrique",
            sectionIcon: "⚡",
            cssClass: "electric-weakness-effect",
            borderColor: "#0080ff",
            bgColor: "#e3f2fd",
            detectFlags: [
                { path: "name", matchValue: "Ora Faiblesse Électrique" },
                { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
            ],
            mechanicType: "weakness",
            getExtraData: (effect) => ({
                bonusDamage: effect.flags?.statuscounter?.value || 2,
                sourceSpell: effect.flags?.world?.spellName || "Bulles d'eau"
            }),
            getDynamicDescription: (effect) => {
                const bonus = effect.flags?.statuscounter?.value || 2;
                const sourceSpell = effect.flags?.world?.spellName || "Bulles d'eau";
                return `Vulnérable aux dégâts électriques par ${sourceSpell} d'Ora (+${bonus} prochaine attaque électrique)`;
            }
        },

        // Ora Faiblesse Feu - Configuration importée depuis bubbles.js (oil)
        "Ora Faiblesse Feu": {
            displayName: "Ora Faiblesse Feu",
            icon: "icons/magic/water/orb-water-bubbles-blue.webp",
            description: "Vulnérable aux dégâts de feu (+2 prochaine attaque de feu)",
            sectionTitle: "🔥 Faiblesse Feu",
            sectionIcon: "🔥",
            cssClass: "fire-weakness-effect",
            borderColor: "#ff8c00",
            bgColor: "#fff3e0",
            detectFlags: [
                { path: "name", matchValue: "Ora Faiblesse Feu" },
                { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
            ],
            mechanicType: "weakness",
            getExtraData: (effect) => ({
                bonusDamage: effect.flags?.statuscounter?.value || 2,
                sourceSpell: effect.flags?.world?.spellName || "Bulles d'huile"
            }),
            getDynamicDescription: (effect) => {
                const bonus = effect.flags?.statuscounter?.value || 2;
                const sourceSpell = effect.flags?.world?.spellName || "Bulles d'huile";
                return `Vulnérable aux dégâts de feu par ${sourceSpell} d'Ora (+${bonus} prochaine attaque de feu)`;
            }
        }

        // TODO: Les futurs sorts d'Ora peuvent étendre cette configuration
        // via la fonction registerOraEffect() ou en ajoutant directement ici
    };

    /**
     * Fonction utilitaire pour enregistrer de nouveaux effets d'Ora dynamiquement
     * Peut être appelée par d'autres macros pour étendre les configurations
     */
    function registerOraEffect(effectName, effectConfig) {
        if (validateEffectConfig(effectName, effectConfig)) {
            EFFECT_CONFIG[effectName] = effectConfig;
            console.log(`[Ora] Registered new effect configuration: ${effectName}`);
            return true;
        } else {
            console.error(`[Ora] Failed to register effect configuration: ${effectName}`);
            return false;
        }
    }

    // Exposer la fonction d'enregistrement globalement pour autres macros
    if (!globalThis.OraEffectRegistry) {
        globalThis.OraEffectRegistry = {
            register: registerOraEffect,
            getConfigs: () => ({ ...EFFECT_CONFIG }),
            validate: validateEffectConfig
        };
    }

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Valide la configuration d'un effet pour s'assurer qu'elle est complète
     */
    function validateEffectConfig(effectName, config) {
        const requiredFields = [
            'displayName', 'icon', 'description', 'sectionTitle',
            'cssClass', 'borderColor', 'bgColor', 'detectFlags', 'mechanicType'
        ];

        const missingFields = requiredFields.filter(field => !config[field]);

        if (missingFields.length > 0) {
            console.warn(`[Ora] Effect config for '${effectName}' is missing fields:`, missingFields);
            return false;
        }

        if (!Array.isArray(config.detectFlags) || config.detectFlags.length === 0) {
            console.warn(`[Ora] Effect config for '${effectName}' has invalid detectFlags`);
            return false;
        }

        return true;
    }

    /**
     * Initialise et valide toutes les configurations d'effets
     */
    function initializeEffectConfigs() {
        const validConfigs = {};
        let validCount = 0;
        let totalCount = 0;

        for (const [effectName, config] of Object.entries(EFFECT_CONFIG)) {
            totalCount++;
            if (validateEffectConfig(effectName, config)) {
                validConfigs[effectName] = config;
                validCount++;
            }
        }

        console.log(`[Ora] Initialized ${validCount}/${totalCount} valid effect configurations`);
        return validConfigs;
    }

    /**
     * Vérifie si un effet correspond aux flags de configuration
     * Tous les flags de détection doivent correspondre (AND logic, pas OR)
     */
    function checkEffectFlags(effect, config, casterId, targetId = null) {
        let matchedChecks = 0;
        let totalChecks = config.detectFlags.length;

        for (const flagCheck of config.detectFlags) {
            if (flagCheck.path === "name") {
                // Vérification spéciale par nom d'effet
                if (effect.name === flagCheck.matchValue) {
                    matchedChecks++;
                }
            } else {
                const flagValue = getProperty(effect, flagCheck.path);
                let expectedValue = flagCheck.matchValue;

                // Remplacements dynamiques
                if (expectedValue === "CASTER_ID") expectedValue = casterId;
                if (expectedValue === "TARGET_ID") expectedValue = targetId;

                if (flagValue === expectedValue) {
                    matchedChecks++;
                }
            }
        }

        // Tous les checks doivent correspondre pour considérer l'effet comme valide
        return matchedChecks === totalChecks;
    }

    /**
     * Fonction de délégation GM pour suppression d'effets
     */
    async function removeEffectWithGMDelegation(targetActor, effectId) {
        if (!globalThis.gmSocket) {
            return { success: false, error: "GM Socket non disponible" };
        }
        return await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetActor.id, effectId);
    }

    /**
     * Fonction de délégation GM pour mise à jour d'effets
     */
    async function updateEffectWithGMDelegation(targetActor, effectId, updateData) {
        if (!globalThis.gmSocket) {
            return { success: false, error: "GM Socket non disponible" };
        }
        return await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetActor.id, effectId, updateData);
    }

    /**
     * Nettoie les animations Sequencer
     */
    function cleanupSequencerAnimations(effect, config) {
        if (config.cleanup?.sequencerName) {
            const sequenceName = getProperty(effect, config.cleanup.sequencerName);
            if (sequenceName) {
                try {
                    Sequencer.EffectManager.endEffects({ name: sequenceName });
                    console.log(`[Ora] Cleaned up sequencer effect: ${sequenceName}`);
                } catch (seqError) {
                    console.warn(`[Ora] Could not clean up sequencer effect ${sequenceName}:`, seqError);
                }
            }
        }

        if (config.cleanup?.sequencerNames) {
            for (const sequencerPath of config.cleanup.sequencerNames) {
                const sequenceName = getProperty(effect, sequencerPath);
                if (sequenceName) {
                    try {
                        Sequencer.EffectManager.endEffects({ name: sequenceName });
                        console.log(`[Ora] Cleaned up sequencer effect: ${sequenceName}`);
                    } catch (seqError) {
                        console.warn(`[Ora] Could not clean up sequencer effect ${sequenceName}:`, seqError);
                    }
                }
            }
        }
    }

    /**
     * Nettoie les filtres Token Magic FX
     */
    async function cleanupTokenMagicFilters(token, config) {
        if (config.cleanup?.removeTokenMagicFilters && config.transformationConfig?.tokenMagicFilters) {
            for (const filterType of config.transformationConfig.tokenMagicFilters) {
                try {
                    await TokenMagic.deleteFilters(token, filterType);
                    console.log(`[Ora] Removed ${filterType} filter from ${token.name}`);
                } catch (tmfxError) {
                    console.warn(`[Ora] Could not remove ${filterType} filter:`, tmfxError);
                }
            }
        }
    }

    /**
     * Fonction générique unifiée pour traiter la suppression de tous types d'effets
     */
    async function handleGenericEffectRemoval(effectInfo, results) {
        const { config } = effectInfo;

        try {
            switch (config.mechanicType) {
                case "vortex":
                    await handleVortexRemoval(effectInfo, results);
                    break;
                case "dome":
                    await handleDomeRemoval(effectInfo, results);
                    break;
                case "orphanVortex":
                    await handleOrphanVortexRemoval(effectInfo, results);
                    break;
                case "slowdown":
                case "weakness":
                case "simple":
                default:
                    await handleSimpleEffectRemoval(effectInfo, results);
                    break;
            }
        } catch (error) {
            console.error(`[Ora] Error in generic effect removal:`, error);
            const targetName = effectInfo.token ? effectInfo.token.name :
                effectInfo.orphanSequencer ? "Animation orpheline" : "Cible inconnue";
            results.failed.push({
                target: targetName,
                effect: effectInfo.config.displayName,
                error: error.message
            });
        }
    }

    /**
     * Traite la suppression d'animations orphelines (Sequencer seulement)
     */
    async function handleOrphanVortexRemoval(effectInfo, results) {
        try {
            if (effectInfo.orphanSequencer) {
                Sequencer.EffectManager.endEffects({ name: effectInfo.extraData.sequencerName });
                results.orphanVortexes.push({
                    target: "Animation orpheline",
                    effect: effectInfo.effectType
                });
                console.log(`[Ora] Removed orphan vortex: ${effectInfo.extraData.sequencerName}`);
            }
        } catch (error) {
            console.error(`[Ora] Error removing orphan vortex:`, error);
            results.failed.push({
                target: "Animation orpheline",
                effect: effectInfo.effectType,
                error: error.message
            });
        }
    }

    /**
     * Traite la suppression d'un effet simple (générique)
     */
    async function handleSimpleEffectRemoval(effectInfo, results) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            // Cleanup des animations Sequencer si configuré
            if (config.cleanup?.sequencerNames) {
                for (const sequencerPath of config.cleanup.sequencerNames) {
                    const sequenceName = getProperty(effect, sequencerPath);
                    if (sequenceName) {
                        try {
                            Sequencer.EffectManager.endEffects({ name: sequenceName });
                            console.log(`[Ora] Cleaned up sequencer effect: ${sequenceName}`);
                        } catch (seqError) {
                            console.warn(`[Ora] Could not clean up sequencer effect ${sequenceName}:`, seqError);
                        }
                    }
                }
            }

            // Cleanup des filtres Token Magic FX si configuré
            if (config.cleanup?.removeTokenMagicFilters && config.transformationConfig?.tokenMagicFilters) {
                for (const filterType of config.transformationConfig.tokenMagicFilters) {
                    try {
                        await TokenMagic.deleteFilters(token, filterType);
                        console.log(`[Ora] Removed ${filterType} filter from ${token.name}`);
                    } catch (tmfxError) {
                        console.warn(`[Ora] Could not remove ${filterType} filter:`, tmfxError);
                    }
                }
            }

            // Animation de suppression généralisée
            if (config.removeAnimation && token) {
                const seq = new Sequence();
                let removeEffect = seq.effect()
                    .file(config.removeAnimation.file)
                    .attachTo(token)
                    .scale(config.removeAnimation.scale || 0.6)
                    .duration(config.removeAnimation.duration || 1500)
                    .fadeOut(config.removeAnimation.fadeOut || 500);

                if (config.removeAnimation.tint) {
                    removeEffect.tint(config.removeAnimation.tint);
                }

                await seq.play();
            }

            // Vérifier que l'effet existe toujours avant de le supprimer
            const currentEffect = token.actor.effects.get(effect.id);
            if (!currentEffect) {
                console.warn(`[Ora] Effect ${effect.name} no longer exists on ${token.name}, skipping deletion`);
                results.failed.push({
                    target: token.name,
                    effect: effectType,
                    error: "Effect no longer exists"
                });
                return;
            }

            // Suppression de l'effet
            if (token.actor.isOwner) {
                await currentEffect.delete();
            } else {
                await removeEffectWithGMDelegation(token.actor, currentEffect.id);
            }

            results.simple.push({
                target: token.name,
                effect: effectType
            });
            console.log(`[Ora] Removed ${effectType} from ${token.name}`);

        } catch (error) {
            console.error(`[Ora] Error removing ${effectType} from ${token.name}:`, error);
            results.failed.push({
                target: token.name,
                effect: effectType,
                error: error.message
            });
        }
    }

    /**
     * Traite la suppression d'un effet de tourbillon (spécialisé)
     */
    async function handleVortexRemoval(effectInfo, results) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            // Récupérer l'index du tourbillon pour supprimer l'animation correspondante
            const vortexIndex = effect.flags?.world?.vortexIndex || 0;
            const casterId = effect.flags?.world?.vortexCaster;

            // Cleanup des animations Sequencer avec patterns configurés
            if (config.cleanup?.sequencerPatterns) {
                for (const pattern of config.cleanup.sequencerPatterns) {
                    try {
                        // Remplacer les variables dans le pattern
                        let resolvedPattern = pattern
                            .replace("VORTEX_INDEX", vortexIndex + 1)
                            .replace("*", "*"); // Garder les wildcards

                        Sequencer.EffectManager.endEffects({ name: resolvedPattern });
                        console.log(`[Ora] Ended vortex animations with pattern: ${resolvedPattern}`);
                    } catch (seqError) {
                        console.warn(`[Ora] Could not end vortex animation with pattern ${pattern}:`, seqError);
                    }
                }
            }

            // Supprimer l'animation de tourbillon par pattern spécifique (fallback)
            try {
                const vortexPattern = `tourbillon_${vortexIndex + 1}_*`;
                Sequencer.EffectManager.endEffects({ name: vortexPattern });
                console.log(`[Ora] Ended vortex animation with fallback pattern: ${vortexPattern}`);
            } catch (seqError) {
                console.warn(`[Ora] Could not end vortex animation with fallback:`, seqError);
            }

            // Animation de dissipation configurée
            if (config.removeAnimation && token) {
                const dissipationSeq = new Sequence();
                let dissipationEffect = dissipationSeq.effect()
                    .file(config.removeAnimation.file)
                    .attachTo(token)
                    .scale(config.removeAnimation.scale || 0.8)
                    .duration(config.removeAnimation.duration || 2000)
                    .fadeOut(config.removeAnimation.fadeOut || 1000);

                if (config.removeAnimation.tint) {
                    dissipationEffect.tint(config.removeAnimation.tint);
                }

                await dissipationSeq.play();
            }

            // Vérifier que l'effet existe toujours avant de le supprimer
            const currentEffect = token.actor.effects.get(effect.id);
            if (!currentEffect) {
                console.warn(`[Ora] Vortex effect ${effect.name} no longer exists on ${token.name}, skipping deletion`);
                results.failed.push({
                    target: token.name,
                    effect: effectType,
                    error: "Vortex effect no longer exists"
                });
                return;
            }

            // Suppression de l'effet sur la cible
            if (token.actor.isOwner) {
                await currentEffect.delete();
            } else {
                await removeEffectWithGMDelegation(token.actor, currentEffect.id);
            }

            results.vortexEffects.push({
                target: token.name,
                effect: effectType
            });
            console.log(`[Ora] Removed vortex from ${token.name}`);

        } catch (error) {
            console.error(`[Ora] Error removing vortex from ${token.name}:`, error);
            results.failed.push({
                target: token.name,
                effect: effectType,
                error: error.message
            });
        }
    }

    /**
     * Traite la suppression d'un effet de dôme de glace (spécialisé)
     */
    async function handleDomeRemoval(effectInfo, results) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            // Récupérer l'index du dôme pour supprimer l'animation correspondante
            const domeIndex = effect.flags?.world?.domeIndex || 0;
            const casterId = effect.flags?.world?.domeCaster;

            // Cleanup des animations Sequencer avec patterns configurés
            if (config.cleanup?.sequencerPatterns) {
                for (const pattern of config.cleanup.sequencerPatterns) {
                    try {
                        // Remplacer les variables dans le pattern
                        let resolvedPattern = pattern
                            .replace("DOME_INDEX", domeIndex + 1)
                            .replace("*", "*"); // Garder les wildcards

                        Sequencer.EffectManager.endEffects({ name: resolvedPattern });
                        console.log(`[Ora] Ended dome animations with pattern: ${resolvedPattern}`);
                    } catch (seqError) {
                        console.warn(`[Ora] Could not end dome animation with pattern ${pattern}:`, seqError);
                    }
                }
            }

            // Supprimer l'animation de dôme par pattern spécifique (fallback)
            try {
                const domePattern = `dome_${domeIndex + 1}_*`;
                Sequencer.EffectManager.endEffects({ name: domePattern });
                console.log(`[Ora] Ended dome animation with fallback pattern: ${domePattern}`);
            } catch (seqError) {
                console.warn(`[Ora] Could not end dome animation with fallback:`, seqError);
            }

            // Animation de brisure de glace configurée
            if (config.removeAnimation && token) {
                const iceBreakSeq = new Sequence();
                let iceBreakEffect = iceBreakSeq.effect()
                    .file(config.removeAnimation.file)
                    .attachTo(token)
                    .scale(config.removeAnimation.scale || 1.0)
                    .duration(config.removeAnimation.duration || 2500)
                    .fadeOut(config.removeAnimation.fadeOut || 1000);

                if (config.removeAnimation.tint) {
                    iceBreakEffect.tint(config.removeAnimation.tint);
                }

                await iceBreakSeq.play();
            }

            // Vérifier que l'effet existe toujours avant de le supprimer
            const currentEffect = token.actor.effects.get(effect.id);
            if (!currentEffect) {
                console.warn(`[Ora] Dome effect ${effect.name} no longer exists on ${token.name}, skipping deletion`);
                results.failed.push({
                    target: token.name,
                    effect: effectType,
                    error: "Dome effect no longer exists"
                });
                return;
            }

            // Suppression de l'effet sur la cible
            if (token.actor.isOwner) {
                await currentEffect.delete();
            } else {
                await removeEffectWithGMDelegation(token.actor, currentEffect.id);
            }

            // Ajouter à la bonne catégorie de résultats (utiliser vortexEffects pour les dômes aussi)
            results.vortexEffects.push({
                target: token.name,
                effect: effectType
            });
            console.log(`[Ora] Removed dome from ${token.name}`);

        } catch (error) {
            console.error(`[Ora] Error removing dome from ${token.name}:`, error);
            results.failed.push({
                target: token.name,
                effect: effectType,
                error: error.message
            });
        }
    }

    // ===== VALIDATION ET INITIALISATION =====
    // Valider les configurations d'effets
    const validatedConfigs = initializeEffectConfigs();
    if (Object.keys(validatedConfigs).length === 0) {
        ui.notifications.error("Aucune configuration d'effet valide trouvée !");
        return;
    }

    if (!canvas.tokens.controlled.length) {
        ui.notifications.error(`Veuillez d'abord sélectionner le jeton de ${CHARACTER_CONFIG.displayName} !`);
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== DÉTECTION DES EFFETS SUR LE CANVAS =====
    function findCharacterEffectsOnCanvas() {
        const characterEffects = [];

        // Parcourir tous les tokens sur la scène pour les effets d'acteur
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === caster.id) continue; // Skip Ora elle-même

            // Chercher les effets appliqués par Ora
            for (const effect of token.actor.effects.contents) {
                let effectMatched = false;

                // Vérifier chaque type d'effet configuré (validé) - sortir dès qu'un match est trouvé
                for (const [effectType, config] of Object.entries(validatedConfigs)) {
                    // Skip les effets Sequencer-only qui n'ont pas d'effet d'acteur
                    if (config.isSequencerOnly) continue;

                    // Skip si déjà traité
                    if (effectMatched) break;

                    // Utiliser la logique de vérification des flags
                    if (checkEffectFlags(effect, config, actor.id, token.id)) {
                        const extraData = config.getExtraData ? config.getExtraData(effect) : {};
                        const description = config.getDynamicDescription ?
                            config.getDynamicDescription(effect) : config.description;

                        characterEffects.push({
                            token: token,
                            effect: effect,
                            effectType: effectType,
                            config: config,
                            description: description,
                            extraData: extraData
                        });

                        console.log(`[Ora] Found ${effectType} on ${token.name}:`, {
                            effectName: effect.name,
                            flags: effect.flags?.world,
                            statusCounter: effect.flags?.statuscounter,
                            extraData: extraData
                        });

                        effectMatched = true; // Empêche les doublons pour le même effet
                    }
                }
            }
        }

        // Détecter les tourbillons orphelins (animations sans token cible)
        try {
            // Rechercher les effets Sequencer actifs avec pattern de tourbillon
            const activeSequencerEffects = Sequencer.EffectManager.getEffects();
            for (const seqEffect of activeSequencerEffects) {
                if (seqEffect.data?.name?.startsWith('tourbillon_')) {
                    // Vérifier si le tourbillon a encore un token cible valide
                    const hasValidTarget = characterEffects.some(effect =>
                        effect.effectType === "Tourbillon" &&
                        effect.effect.flags?.world?.vortexIndex === parseInt(seqEffect.data.name.split('_')[1]) - 1
                    );

                    if (!hasValidTarget) {
                        // Tourbillon orphelin détecté
                        const config = EFFECT_CONFIG["Tourbillon"];
                        characterEffects.push({
                            token: null, // Pas de token
                            effect: null, // Pas d'effet d'acteur
                            effectType: "Tourbillon Orphelin",
                            config: { ...config, displayName: "Tourbillon Orphelin", mechanicType: "orphanVortex" },
                            description: "Tourbillon sans cible associée",
                            extraData: { sequencerName: seqEffect.data.name },
                            orphanSequencer: seqEffect
                        });

                        console.log(`[Ora] Found orphan vortex: ${seqEffect.data.name}`);
                    }
                }
            }
        } catch (error) {
            console.warn(`[Ora] Could not check for orphan vortexes:`, error);
        }

        return characterEffects;
    }

    const characterEffects = findCharacterEffectsOnCanvas();

    if (characterEffects.length === 0) {
        ui.notifications.info(`${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.noEffectsMessage}`);
        return;
    }

    // ===== DIALOG DE SÉLECTION DES EFFETS =====
    async function showEffectSelectionDialog() {
        let dialogContent = `
            <h3>${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.dialogTitle}</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p>Sélectionnez le(s) effet(s) d'eau à supprimer :</p>

            <style>
                .effect-item {
                    margin: 8px 0;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #f9f9f9;
                    display: flex;
                    align-items: center;
                }
                .effect-icon {
                    width: 32px;
                    height: 32px;
                    margin-right: 12px;
                    background-size: cover;
                    background-position: center;
                    border-radius: 4px;
                    flex-shrink: 0;
                }
                .effect-content {
                    flex-grow: 1;
                }
                .effect-type {
                    font-weight: bold;
                    color: ${CHARACTER_CONFIG.color};
                }
                .effect-target {
                    font-size: 1.1em;
                    font-weight: bold;
                    margin: 2px 0;
                }
                .effect-description {
                    font-size: 0.9em;
                    color: #666;
                }
                ${Object.entries(EFFECT_CONFIG).map(([effectType, config]) => `
                .${config.cssClass} {
                    border-left: 4px solid ${config.borderColor};
                }`).join('')}
            </style>

            <div style="margin: 15px 0; max-height: 400px; overflow-y: auto;">
        `;

        // Organiser les effets par type configuré
        const effectsByType = {};
        for (const effectInfo of characterEffects) {
            if (!effectsByType[effectInfo.effectType]) {
                effectsByType[effectInfo.effectType] = [];
            }
            effectsByType[effectInfo.effectType].push(effectInfo);
        }

        let effectIndex = 0;

        // Générer les sections pour chaque type d'effet
        for (const [effectType, effects] of Object.entries(effectsByType)) {
            const config = effects[0].config; // Prendre la config du premier effet
            if (!config) continue;

            dialogContent += `<h4 style="color: ${config.borderColor}; margin: 15px 0 10px 0;">${config.sectionTitle}</h4>`;

            for (const effectInfo of effects) {
                const { token, effect, description, extraData } = effectInfo;
                let extraInfo = '';
                let targetName = '';

                // Formatage des données supplémentaires selon le type
                if (extraData.stacks) extraInfo += ` (${extraData.stacks} stacks)`;
                if (extraData.counter) extraInfo += ` (${extraData.counter})`;
                if (extraData.power) extraInfo += ` (Puissance: ${extraData.power})`;
                if (extraData.usageCount) extraInfo += ` (${extraData.usageCount} utilisation(s))`;
                if (extraData.bonusDamage) extraInfo += ` (+${extraData.bonusDamage} dégâts)`;
                if (extraData.slowdownAmount) extraInfo += ` (-${extraData.slowdownAmount} vitesse)`;

                // Gestion du nom de la cible (token ou orphelin)
                if (token) {
                    targetName = token.name;
                } else if (effectInfo.orphanSequencer) {
                    targetName = `Animation orpheline`;
                } else {
                    targetName = "Position inconnue";
                }

                dialogContent += `
                    <div class="effect-item ${config.cssClass}">
                        <input type="checkbox" id="effect-${effectIndex}" value="${effectIndex}" style="margin-right: 12px;">
                        <div class="effect-icon" style="background-image: url('${config.icon}');"></div>
                        <div class="effect-content">
                            <div class="effect-type">${config.displayName}${extraInfo}</div>
                            <div class="effect-target">${targetName}</div>
                            <div class="effect-description">${description}</div>
                        </div>
                    </div>
                `;
                effectIndex++;
            }
        }

        dialogContent += `</div>`;

        return new Promise(resolve => {
            new Dialog({
                title: CHARACTER_CONFIG.dialogTitle,
                content: dialogContent,
                buttons: {
                    removeSelected: {
                        icon: '<i class="fas fa-eraser"></i>',
                        label: `${CHARACTER_CONFIG.icon} Retirer Sélectionnés`,
                        callback: (html) => {
                            const selectedIndices = [];
                            html.find('input[type="checkbox"]:checked').each(function () {
                                selectedIndices.push(parseInt($(this).val()));
                            });
                            if (selectedIndices.length === 0) {
                                ui.notifications.warn("Aucun effet sélectionné !");
                                return;
                            }
                            resolve({ selectedIndices });
                        }
                    },
                    removeAll: {
                        icon: '<i class="fas fa-ban"></i>',
                        label: `${CHARACTER_CONFIG.icon} Retirer Tous`,
                        callback: () => {
                            const allIndices = characterEffects.map((_, index) => index);
                            resolve({ selectedIndices: allIndices });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "removeSelected",
                close: () => resolve(null)
            }, {
                width: 600,
                height: 800,
                resizable: true,
                top: window.innerHeight * 0.1
            }).render(true);
        });
    }

    const selection = await showEffectSelectionDialog();
    if (!selection) {
        ui.notifications.info("Opération annulée.");
        return;
    }

    // ===== SUPPRESSION DES EFFETS SÉLECTIONNÉS =====
    const { selectedIndices } = selection;
    const effectsToRemove = selectedIndices.map(index => characterEffects[index]);
    const removedEffects = {
        simple: [],
        vortexEffects: [],
        orphanVortexes: [],
        casterEffects: [],
        failed: []
    };

    for (const effectInfo of effectsToRemove) {
        try {
            const { config } = effectInfo;

            // Utiliser la fonction de suppression générique selon le type de mécanique
            await handleGenericEffectRemoval(effectInfo, removedEffects);

        } catch (error) {
            console.error(`[Ora] Error processing effect removal:`, error);
            const targetName = effectInfo.token ? effectInfo.token.name :
                effectInfo.orphanSequencer ? "Animation orpheline" : "Cible inconnue";
            removedEffects.failed.push({
                target: targetName,
                effect: effectInfo.config.displayName,
                error: error.message
            });
        }
    }

    // ===== ANIMATIONS DE LIBÉRATION GROUPÉES =====
    // Note: Les animations individuelles sont gérées dans les fonctions de suppression spécialisées
    // Cette section peut être utilisée pour des animations globales ou de célébration

    const totalEffectsRemoved = Object.values(removedEffects).reduce((sum, arr) => {
        return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0) - removedEffects.failed.length;


    // ===== RÉSULTATS ET FEEDBACK =====
    const totalRemoved = Object.values(removedEffects).reduce((sum, arr) => {
        return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0) - removedEffects.failed.length;
    const totalFailed = removedEffects.failed.length;

    if (totalRemoved > 0) {
        // Message dans le chat
        let chatContent = `
            <div style="background: linear-gradient(135deg, #e3f2fd, #f9f9f9); padding: 12px; border-radius: 8px; border: 2px solid ${CHARACTER_CONFIG.color}; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: ${CHARACTER_CONFIG.color};">${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.chatTitle}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Maîtresse de l'Eau:</strong> ${actor.name}
                    </div>
                </div>
        `;

        // Sections pour chaque type d'effet supprimé
        for (const [categoryKey, effects] of Object.entries(removedEffects)) {
            if (categoryKey === 'failed' || categoryKey === 'casterEffects' || !Array.isArray(effects) || effects.length === 0) continue;

            let categoryTitle = "";
            let categoryColor = CHARACTER_CONFIG.color;
            let categoryBg = "#e3f2fd";

            switch (categoryKey) {
                case 'simple':
                    categoryTitle = "🌊 Effets d'Eau Simples Supprimés";
                    break;
                case 'vortexEffects':
                    categoryTitle = "🌊 Tourbillons Terminés";
                    categoryColor = "#2196f3";
                    categoryBg = "#e3f2fd";
                    break;
                case 'orphanVortexes':
                    categoryTitle = "🌀 Tourbillons Orphelins Supprimés";
                    categoryColor = "#1976d2";
                    categoryBg = "#e8f5e8";
                    break;
                default:
                    categoryTitle = `${categoryKey} Supprimés`;
                    break;
            }

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${categoryBg}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${categoryColor}; margin-bottom: 6px;"><strong>${categoryTitle}</strong></div>
            `;
            for (const removed of effects) {
                const extraInfo = removed.extraInfo ? ` - ${removed.extraInfo}` : '';
                chatContent += `<div style="font-size: 0.9em; margin: 2px 0;">${removed.target}: ${removed.effect}${extraInfo}</div>`;
            }
            chatContent += `</div>`;
        }

        // Effets de lanceur supprimés
        if (removedEffects.casterEffects && removedEffects.casterEffects.length > 0) {
            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #2e7d32; margin-bottom: 6px;"><strong>${CHARACTER_CONFIG.icon} Effets de Lanceur Supprimés</strong></div>
            `;
            for (const removed of removedEffects.casterEffects) {
                chatContent += `<div style="font-size: 0.9em; margin: 2px 0;">${removed.target}: ${removed.effect}</div>`;
            }
            chatContent += `</div>`;
        }

        // Erreurs s'il y en a
        if (removedEffects.failed.length > 0) {
            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffcdd2; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #d32f2f; margin-bottom: 6px;"><strong>❌ Erreurs</strong></div>
            `;
            for (const failed of removedEffects.failed) {
                chatContent += `<div style="font-size: 0.9em; margin: 2px 0;">${failed.target}: ${failed.effect} (${failed.error})</div>`;
            }
            chatContent += `</div>`;
        }

        chatContent += `</div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: chatContent,
            rollMode: game.settings.get("core", "rollMode")
        });

        // Notification de succès
        let notificationText = `${CHARACTER_CONFIG.icon} Effets d'eau supprimés : `;
        const parts = [];

        if (removedEffects.simple.length > 0) parts.push(`${removedEffects.simple.length} effet(s) simple(s)`);
        if (removedEffects.vortexEffects.length > 0) parts.push(`${removedEffects.vortexEffects.length} tourbillon(s)`);
        if (removedEffects.orphanVortexes.length > 0) parts.push(`${removedEffects.orphanVortexes.length} animation(s) orpheline(s)`);

        notificationText += parts.join(', ');

        if (totalFailed > 0) {
            notificationText += ` (${totalFailed} échec(s))`;
        }

        ui.notifications.info(notificationText);

    } else {
        ui.notifications.error(`❌ Aucun effet d'eau n'a pu être supprimé !`);

        // Afficher les erreurs si il y en a
        if (removedEffects.failed.length > 0) {
            let errorMsg = "Erreurs rencontrées:\n";
            for (const failed of removedEffects.failed) {
                errorMsg += `- ${failed.target}: ${failed.error}\n`;
            }
            ui.notifications.error(errorMsg);
        }
    }

})();
