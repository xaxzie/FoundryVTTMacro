/**
 * End Generic Effects (Terminer Effets Génériques) - Template
 *
 * Macro template générique pour terminer les effets qu'un personnage a appliqués sur d'autres tokens.
 * Ce template inclut toutes les mécaniques avancées détectées dans les différents gestionnaires existants.
 *
 * Fonctionnalités avancées incluses :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détection automatique de tous les effets appliqués sur le canvas
 * - Interface de sélection pour choisir quels effets supprimer
 * - Gestion des effets liés (cascade removal, bi-directional removal)
 * - Système de compteurs complexes (BookCount, statuscounter)
 * - Suppression des animations Sequencer associées
 * - Gestion par délégation GM pour les tokens non possédés
 * - Animations de libération personnalisées
 * - Support pour les effets avec données dynamiques
 * - Système de nettoyage spécialisé par type d'effet
 *
 * Mécaniques spécialisées supportées :
 * 1. Effets simples : 1 effet → suppression directe
 * 2. Effets liés : 1 effet → suppression de multiples effets liés
 * 3. Effets bi-directionnels : effet sur cible ↔ effet correspondant sur lanceur
 * 4. Effets avec compteurs : suppression diminue compteur principal
 * 5. Effets avec animations persistantes : nettoyage Sequencer
 * 6. Effets avec transformations : nettoyage Token Magic FX
 *
 * Usage :
 * 1. Copier ce template vers le dossier du personnage
 * 2. Renommer en "end[Character]Effect.js"
 * 3. Configurer EFFECT_CONFIG avec les effets du personnage
 * 4. Adapter CHARACTER_CONFIG pour le personnage
 * 5. Sélectionner le token du personnage et lancer la macro
 */

(async () => {
    // ===== CONFIGURATION DU PERSONNAGE =====
    const CHARACTER_CONFIG = {
        name: "Personnage", // À adapter selon le personnage
        displayName: "Personnage", // Nom affiché dans l'interface
        icon: "🎭", // Icône du personnage pour les messages
        color: "#2196f3", // Couleur principale du personnage
        noEffectsMessage: "Pas d'effets détectés à supprimer !", // Message si aucun effet
        dialogTitle: "Terminer Effets du Personnage", // Titre du dialog
        chatTitle: "Effets du Personnage Terminés" // Titre du message de chat
    };

    // ===== CONFIGURATION DES EFFETS =====
    const EFFECT_CONFIG = {
        // ===== EXEMPLE D'EFFET SIMPLE =====
        "Effet Simple": {
            displayName: "Effet Simple",
            icon: "icons/svg/aura.svg",
            description: "Effet basique sans complications",
            sectionTitle: "🎯 Effets Simples",
            sectionIcon: "🎯",
            cssClass: "simple-effect",
            borderColor: "#2196f3",
            bgColor: "#e3f2fd",
            // Détection des flags
            detectFlags: [
                { path: "flags.world.effectCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.spellName", matchValue: "Effet Simple" }
            ],
            // Animation de suppression
            removeAnimation: {
                file: "jb2a.cure_wounds.400px.blue",
                scale: 0.8,
                duration: 2000,
                fadeOut: 800,
                tint: "#2196f3"
            },
            // Type de mécanique : 'simple', 'linked', 'bidirectional', 'counter'
            mechanicType: "simple"
        },

        // ===== EXEMPLE D'EFFET AVEC COMPTEURS =====
        "Effet Compteur": {
            displayName: "Effet Compteur",
            icon: "icons/svg/upgrade.svg",
            description: "Effet basé sur un système de compteurs",
            sectionTitle: "📊 Effets à Compteurs",
            sectionIcon: "📊",
            cssClass: "counter-effect",
            borderColor: "#4caf50",
            bgColor: "#e8f5e8",
            detectFlags: [
                { path: "flags.statuscounter.active", matchValue: true },
                { path: "name", matchValue: "Effet Compteur" }
            ],
            // Description dynamique basée sur les compteurs
            getDynamicDescription: (effect) => {
                const counter = effect.flags?.statuscounter?.value || 1;
                return `Effet compteur (Valeur: ${counter})`;
            },
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => ({
                counter: effect.flags?.statuscounter?.value || 1
            }),
            mechanicType: "counter",
            // Configuration pour les compteurs
            counterConfig: {
                // Si true, chaque effet retiré diminue le compteur principal sur le lanceur
                decreaseMainCounter: true,
                // Nom de l'effet compteur principal sur le lanceur
                mainCounterEffectName: "Compteur Principal",
                // Propriété du flag contenant la valeur à décrémenter
                counterValuePath: "flags.statuscounter.value",
                // Valeur à soustraire par effet retiré (par défaut 1)
                decreaseAmount: 1
            }
        },

        // ===== EXEMPLE D'EFFET LIEN (CASCADE REMOVAL) =====
        "Effet Maître": {
            displayName: "Effet Maître",
            icon: "icons/magic/control/hypnosis-mesmerism-eye.webp",
            description: "Effet complexe avec effets liés",
            sectionTitle: "🔗 Effets Complexes",
            sectionIcon: "🔗",
            cssClass: "master-effect",
            borderColor: "#9c27b0",
            bgColor: "#f3e5f5",
            detectFlags: [
                { path: "flags.world.masterCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.spellName", matchValue: "Effet Maître" }
            ],
            getDynamicDescription: (effect) => {
                const power = effect.flags?.statuscounter?.value || 4;
                return `Effet maître (Puissance: ${power}, +2 effets liés)`;
            },
            getExtraData: (effect) => ({
                power: effect.flags?.statuscounter?.value || 4
            }),
            mechanicType: "linked",
            // Configuration pour les effets liés
            cleanup: {
                // Animations Sequencer à nettoyer
                sequencerNames: [
                    "flags.world.masterSequenceName",
                    "flags.world.connectionSequenceName"
                ],
                // Indique qu'il faut supprimer les effets liés
                removeLinkedEffects: true,
                // Noms des effets liés à supprimer
                linkedEffectNames: [
                    "Effet Secondaire", // Effet -2 sur les autres stats
                    "Effet Concentration" // Effet sur le lanceur
                ],
                // Flags pour identifier les effets liés
                linkedEffectFlags: [
                    { name: "Effet Secondaire", path: "flags.world.masterCaster", matchValue: "CASTER_ID" },
                    { name: "Effet Concentration", path: "flags.world.masterTarget", matchValue: "TARGET_ID" }
                ]
            }
        },

        // ===== EXEMPLE D'EFFET BI-DIRECTIONNEL =====
        "Effet Échange": {
            displayName: "Effet Échange",
            icon: "icons/magic/symbols/runes-triangle-orange.webp",
            description: "Effet liant deux entités",
            sectionTitle: "🔄 Effets Bi-directionnels",
            sectionIcon: "🔄",
            cssClass: "exchange-effect",
            borderColor: "#ff9800",
            bgColor: "#fff8e1",
            detectFlags: [
                { path: "flags.world.exchangeCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.spellName", matchValue: "Effet Échange" }
            ],
            getExtraData: (effect) => ({
                usageCount: effect.flags?.world?.exchangeUsageCount || 0
            }),
            getDynamicDescription: (effect) => {
                const usageCount = effect.flags?.world?.exchangeUsageCount || 0;
                return `Effet d'échange ${usageCount > 0 ? `(${usageCount} utilisation(s))` : ''}`;
            },
            mechanicType: "bidirectional",
            // Configuration pour les effets bi-directionnels
            bidirectionalConfig: {
                // Nom de l'effet correspondant sur le lanceur
                casterEffectName: "Effet Échange",
                // Flag liant l'effet du lanceur à la cible
                casterEffectTargetFlag: "flags.world.exchangeTarget",
                // Message pour le nettoyage de l'effet lanceur
                casterRemovalMessage: "Effet d'échange sur le lanceur supprimé"
            },
            // Nettoyage spécial pour l'animation persistante
            cleanup: {
                sequencerName: "flags.world.exchangeSequenceName"
            }
        },

        // ===== EXEMPLE D'EFFET AVEC TRANSFORMATIONS =====
        "Effet Transformation": {
            displayName: "Effet Transformation",
            icon: "icons/creatures/abilities/bear-roar-bite-brown.webp",
            description: "Effet modifiant l'apparence du token",
            sectionTitle: "🎭 Effets de Transformation",
            sectionIcon: "🎭",
            cssClass: "transformation-effect",
            borderColor: "#795548",
            bgColor: "#efebe9",
            detectFlags: [
                { path: "flags.world.transformationCaster", matchValue: "CASTER_ID" }
            ],
            getDynamicDescription: (effect) => {
                const form = effect.flags?.world?.transformationForm || "Inconnu";
                return `Transformé en ${form}`;
            },
            getExtraData: (effect) => ({
                form: effect.flags?.world?.transformationForm || "Inconnu"
            }),
            mechanicType: "transformation",
            // Configuration pour les transformations
            transformationConfig: {
                // Nettoyage Token Magic FX
                hasTokenMagicCleanup: true,
                // Filtres Token Magic FX à nettoyer
                tokenMagicFilters: ["polymorph", "shadow", "electric"],
                // Animation de retour à la normale
                reverseAnimation: {
                    file: "jb2a.misty_step.02.grey",
                    scale: 0.8,
                    duration: 1500
                }
            },
            // Nettoyage spécialisé
            cleanup: {
                sequencerName: "flags.world.transformationSequenceName",
                removeTokenMagicFilters: true
            }
        }

        /*
         * ===== EXEMPLE POUR AJOUTER UN NOUVEL EFFET =====
         *
         * Pour ajouter un nouvel effet "Malédiction" :
         *
         * "Malédiction": {
         *     displayName: "Malédiction",
         *     icon: "icons/svg/skull.svg",
         *     description: "Malédiction sombre appliquée",
         *     sectionTitle: "💀 Malédictions",
         *     sectionIcon: "💀",
         *     cssClass: "curse-effect",
         *     borderColor: "#8e24aa",
         *     bgColor: "#f3e5f5",
         *     detectFlags: [
         *         { path: "flags.world.curseCaster", matchValue: "CASTER_ID" }
         *     ],
         *     removeAnimation: {
         *         file: "jb2a.cure_wounds.400px.purple",
         *         scale: 0.8,
         *         duration: 2000,
         *         fadeOut: 800,
         *         tint: "#8e24aa"
         *     },
         *     mechanicType: "simple"
         * }
         */
    };

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Vérifie si un effet correspond aux flags de configuration
     */
    function checkEffectFlags(effect, config, casterId, targetId = null) {
        for (const flagCheck of config.detectFlags) {
            const flagValue = getProperty(effect, flagCheck.path);
            let expectedValue = flagCheck.matchValue;

            // Remplacements dynamiques
            if (expectedValue === "CASTER_ID") expectedValue = casterId;
            if (expectedValue === "TARGET_ID") expectedValue = targetId;

            if (flagValue === expectedValue) {
                return true;
            }
        }
        return false;
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
                    console.log(`[DEBUG] Cleaned up sequencer effect: ${sequenceName}`);
                } catch (seqError) {
                    console.warn(`[DEBUG] Could not clean up sequencer effect ${sequenceName}:`, seqError);
                }
            }
        }

        if (config.cleanup?.sequencerNames) {
            for (const sequencerPath of config.cleanup.sequencerNames) {
                const sequenceName = getProperty(effect, sequencerPath);
                if (sequenceName) {
                    try {
                        Sequencer.EffectManager.endEffects({ name: sequenceName });
                        console.log(`[DEBUG] Cleaned up sequencer effect: ${sequenceName}`);
                    } catch (seqError) {
                        console.warn(`[DEBUG] Could not clean up sequencer effect ${sequenceName}:`, seqError);
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
                    console.log(`[DEBUG] Removed ${filterType} filter from ${token.name}`);
                } catch (tmfxError) {
                    console.warn(`[DEBUG] Could not remove ${filterType} filter:`, tmfxError);
                }
            }
        }
    }

    /**
     * Traite la suppression d'un effet simple
     */
    async function handleSimpleEffectRemoval(effectInfo, results) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            // Nettoyer les animations
            cleanupSequencerAnimations(effect, config);

            // Nettoyer les filtres Token Magic FX si applicable
            if (config.mechanicType === "transformation") {
                await cleanupTokenMagicFilters(token, config);
            }

            // Supprimer l'effet
            const result = await removeEffectWithGMDelegation(token.actor, effect.id);

            if (result?.success) {
                console.log(`[DEBUG] Successfully removed ${effectType} from ${token.name}`);

                // Organiser par type pour les résultats
                const category = config.mechanicType || 'simple';
                if (!results[category]) results[category] = [];
                results[category].push({
                    target: token.name,
                    effect: config.displayName,
                    type: effectType,
                    extraData: effectInfo.extraData || {}
                });

                return true;
            } else {
                throw new Error(result?.error || "Erreur inconnue");
            }
        } catch (error) {
            results.failed.push({
                target: token.name,
                effect: config.displayName,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Traite la suppression d'un effet avec effets liés (cascade removal)
     */
    async function handleLinkedEffectRemoval(effectInfo, results, actor) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            console.log(`[DEBUG] Removing linked effect ${effectType} from ${token.name}`);

            // 1. Nettoyer les animations Sequencer
            cleanupSequencerAnimations(effect, config);

            // 2. Supprimer l'effet principal
            const mainResult = await removeEffectWithGMDelegation(token.actor, effect.id);

            if (mainResult?.success) {
                console.log(`[DEBUG] Removed main linked effect from ${token.name}`);

                // 3. Supprimer les effets liés si configuré
                if (config.cleanup?.removeLinkedEffects && config.cleanup?.linkedEffectNames) {
                    for (const linkedEffectName of config.cleanup.linkedEffectNames) {
                        // Chercher l'effet lié sur la même cible
                        const linkedEffect = token.actor.effects.find(e =>
                            e.name === linkedEffectName &&
                            checkEffectFlags(e, config, actor.id, token.id)
                        );

                        if (linkedEffect) {
                            const linkedResult = await removeEffectWithGMDelegation(token.actor, linkedEffect.id);
                            if (linkedResult?.success) {
                                console.log(`[DEBUG] Removed linked effect ${linkedEffectName} from ${token.name}`);
                            }
                        }

                        // Chercher l'effet lié sur le lanceur
                        const casterLinkedEffect = actor.effects.find(e =>
                            e.name === linkedEffectName &&
                            (e.flags?.world?.masterTarget === token.id ||
                             checkEffectFlags(e, config, actor.id, token.id))
                        );

                        if (casterLinkedEffect) {
                            try {
                                await casterLinkedEffect.delete();
                                console.log(`[DEBUG] Removed linked effect ${linkedEffectName} from caster`);
                            } catch (casterError) {
                                console.warn(`[DEBUG] Failed to remove linked effect from caster:`, casterError);
                            }
                        }
                    }
                }

                // Ajouter aux résultats
                if (!results.linked) results.linked = [];
                results.linked.push({
                    target: token.name,
                    effect: config.displayName,
                    type: effectType,
                    extraData: effectInfo.extraData || {}
                });

                return true;
            } else {
                throw new Error(mainResult?.error || "Erreur inconnue");
            }
        } catch (error) {
            results.failed.push({
                target: token.name,
                effect: config.displayName,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Traite la suppression d'un effet bi-directionnel
     */
    async function handleBidirectionalEffectRemoval(effectInfo, results, actor) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            console.log(`[DEBUG] Removing bidirectional effect ${effectType} from ${token.name}`);

            // Nettoyer les animations
            cleanupSequencerAnimations(effect, config);

            // Supprimer l'effet sur la cible
            const result = await removeEffectWithGMDelegation(token.actor, effect.id);

            if (result?.success) {
                console.log(`[DEBUG] Removed bidirectional effect from ${token.name}`);

                // Chercher et supprimer l'effet correspondant sur le lanceur
                if (config.bidirectionalConfig) {
                    const casterEffectName = config.bidirectionalConfig.casterEffectName;
                    const targetFlag = config.bidirectionalConfig.casterEffectTargetFlag;

                    const casterEffect = actor.effects?.contents?.find(e =>
                        e.name === casterEffectName &&
                        getProperty(e, targetFlag) === token.id
                    );

                    if (casterEffect) {
                        await casterEffect.delete();
                        console.log(`[DEBUG] Also removed corresponding "${casterEffectName}" effect from ${actor.name}`);

                        // Ajouter aux résultats de lanceur
                        if (!results.casterEffects) results.casterEffects = [];
                        results.casterEffects.push({
                            target: actor.name,
                            effect: casterEffectName
                        });
                    }
                }

                // Ajouter aux résultats
                if (!results.bidirectional) results.bidirectional = [];
                results.bidirectional.push({
                    target: token.name,
                    effect: config.displayName,
                    type: effectType,
                    extraData: effectInfo.extraData || {}
                });

                return true;
            } else {
                throw new Error(result?.error || "Erreur inconnue");
            }
        } catch (error) {
            results.failed.push({
                target: token.name,
                effect: config.displayName,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Traite la suppression d'un effet avec compteurs
     */
    async function handleCounterEffectRemoval(effectInfo, results, actor) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            console.log(`[DEBUG] Removing counter effect ${effectType} from ${token.name}`);

            // Nettoyer les animations
            cleanupSequencerAnimations(effect, config);

            // Supprimer l'effet
            const result = await removeEffectWithGMDelegation(token.actor, effect.id);

            if (result?.success) {
                console.log(`[DEBUG] Removed counter effect from ${token.name}`);

                // Gestion du compteur principal si configuré
                if (config.counterConfig?.decreaseMainCounter) {
                    const mainCounterEffectName = config.counterConfig.mainCounterEffectName;
                    const decreaseAmount = config.counterConfig.decreaseAmount || 1;

                    const mainCounterEffect = actor.effects?.contents?.find(e => e.name === mainCounterEffectName);
                    if (mainCounterEffect) {
                        const currentValue = getProperty(mainCounterEffect, config.counterConfig.counterValuePath) || 0;
                        const newValue = Math.max(0, currentValue - decreaseAmount);

                        const updateData = {};
                        setProperty(updateData, config.counterConfig.counterValuePath, newValue);

                        const updateResult = await updateEffectWithGMDelegation(actor, mainCounterEffect.id, updateData);
                        if (updateResult?.success) {
                            console.log(`[DEBUG] Updated main counter from ${currentValue} to ${newValue}`);
                        }
                    }
                }

                // Ajouter aux résultats
                if (!results.counter) results.counter = [];
                results.counter.push({
                    target: token.name,
                    effect: config.displayName,
                    type: effectType,
                    extraData: effectInfo.extraData || {}
                });

                return true;
            } else {
                throw new Error(result?.error || "Erreur inconnue");
            }
        } catch (error) {
            results.failed.push({
                target: token.name,
                effect: config.displayName,
                error: error.message
            });
            return false;
        }
    }

    // ===== VALIDATION INITIALE =====
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

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === caster.id) continue; // Skip le personnage lui-même

            // Chercher les effets appliqués par le personnage
            for (const effect of token.actor.effects.contents) {
                // Vérifier chaque type d'effet configuré
                for (const [effectType, config] of Object.entries(EFFECT_CONFIG)) {
                    let isMatch = false;

                    // Vérification par nom exact
                    if (effect.name === config.displayName || effect.name === effectType) {
                        isMatch = true;
                    }

                    if (isMatch && checkEffectFlags(effect, config, actor.id, token.id)) {
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

                        console.log(`[DEBUG] Found ${effectType} on ${token.name}:`, {
                            effectName: effect.name,
                            flags: effect.flags,
                            extraData: extraData
                        });
                    }
                }
            }
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
            <p>Sélectionnez le(s) effet(s) à supprimer :</p>

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
            const config = EFFECT_CONFIG[effectType];
            if (!config) continue;

            dialogContent += `<h4 style="color: ${config.borderColor}; margin: 15px 0 10px 0;">${config.sectionTitle}</h4>`;

            for (const effectInfo of effects) {
                const { token, effect, description, extraData } = effectInfo;
                let extraInfo = '';

                // Formatage des données supplémentaires selon le type
                if (extraData.stacks) extraInfo += ` (${extraData.stacks} stacks)`;
                if (extraData.counter) extraInfo += ` (${extraData.counter})`;
                if (extraData.power) extraInfo += ` (Puissance: ${extraData.power})`;
                if (extraData.usageCount) extraInfo += ` (${extraData.usageCount} utilisation(s))`;

                dialogContent += `
                    <div class="effect-item ${config.cssClass}">
                        <input type="checkbox" id="effect-${effectIndex}" value="${effectIndex}" style="margin-right: 12px;">
                        <div class="effect-icon" style="background-image: url('${config.icon}');"></div>
                        <div class="effect-content">
                            <div class="effect-type">${config.displayName}${extraInfo}</div>
                            <div class="effect-target">${token.name}</div>
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
        linked: [],
        bidirectional: [],
        counter: [],
        transformation: [],
        casterEffects: [],
        failed: []
    };

    for (const effectInfo of effectsToRemove) {
        try {
            const config = effectInfo.config;
            let success = false;

            // Traitement selon le type de mécanique
            switch (config.mechanicType) {
                case "linked":
                    success = await handleLinkedEffectRemoval(effectInfo, removedEffects, actor);
                    break;
                case "bidirectional":
                    success = await handleBidirectionalEffectRemoval(effectInfo, removedEffects, actor);
                    break;
                case "counter":
                    success = await handleCounterEffectRemoval(effectInfo, removedEffects, actor);
                    break;
                case "transformation":
                case "simple":
                default:
                    success = await handleSimpleEffectRemoval(effectInfo, removedEffects);
                    break;
            }

            if (success) {
                console.log(`[DEBUG] Successfully processed ${effectInfo.effectType} from ${effectInfo.token.name}`);
            }

        } catch (error) {
            console.error(`Error removing ${effectInfo.effectType} from ${effectInfo.token.name}:`, error);
            removedEffects.failed.push({
                target: effectInfo.token.name,
                effect: effectInfo.config.displayName,
                error: error.message
            });
        }
    }

    // ===== ANIMATIONS DE LIBÉRATION =====
    const liberationSeq = new Sequence();
    let hasAnimations = false;

    for (const effectInfo of effectsToRemove) {
        const { token, config } = effectInfo;

        if (config.removeAnimation && !removedEffects.failed.some(f => f.target === token.name)) {
            liberationSeq.effect()
                .file(config.removeAnimation.file)
                .attachTo(token)
                .scale(config.removeAnimation.scale || 0.6)
                .duration(config.removeAnimation.duration || 1500)
                .fadeOut(config.removeAnimation.fadeOut || 500);

            if (config.removeAnimation.tint) {
                liberationSeq.tint(config.removeAnimation.tint);
            }

            hasAnimations = true;
        }
    }

    if (hasAnimations) {
        await liberationSeq.play();
    }

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
                        <strong>Lanceur:</strong> ${actor.name}
                    </div>
                </div>
        `;

        // Sections pour chaque type d'effet supprimé
        for (const [categoryKey, effects] of Object.entries(removedEffects)) {
            if (categoryKey === 'failed' || categoryKey === 'casterEffects' || !Array.isArray(effects) || effects.length === 0) continue;

            // Trouver une configuration d'exemple pour le style
            const exampleConfig = Object.values(EFFECT_CONFIG).find(c => c.mechanicType === categoryKey) ||
                                Object.values(EFFECT_CONFIG)[0];

            let categoryTitle = "";
            switch (categoryKey) {
                case 'simple': categoryTitle = "🎯 Effets Simples Supprimés"; break;
                case 'linked': categoryTitle = "🔗 Effets Complexes Dissous"; break;
                case 'bidirectional': categoryTitle = "🔄 Effets Bi-directionnels Supprimés"; break;
                case 'counter': categoryTitle = "📊 Effets à Compteurs Retirés"; break;
                case 'transformation': categoryTitle = "🎭 Transformations Annulées"; break;
                default: categoryTitle = `${categoryKey} Supprimés`; break;
            }

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${exampleConfig.bgColor}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${exampleConfig.borderColor}; margin-bottom: 6px;"><strong>${categoryTitle}</strong></div>
            `;
            for (const removed of effects) {
                chatContent += `<div style="font-size: 0.9em; margin: 2px 0;">${removed.target}: ${removed.effect}</div>`;
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
        let notificationText = `${CHARACTER_CONFIG.icon} Effets supprimés : `;
        const parts = [];

        if (removedEffects.simple.length > 0) parts.push(`${removedEffects.simple.length} simple(s)`);
        if (removedEffects.linked.length > 0) parts.push(`${removedEffects.linked.length} complexe(s)`);
        if (removedEffects.bidirectional.length > 0) parts.push(`${removedEffects.bidirectional.length} bi-directionnel(s)`);
        if (removedEffects.counter.length > 0) parts.push(`${removedEffects.counter.length} compteur(s)`);
        if (removedEffects.transformation.length > 0) parts.push(`${removedEffects.transformation.length} transformation(s)`);

        notificationText += parts.join(', ');

        if (totalFailed > 0) {
            notificationText += ` (${totalFailed} échec(s))`;
        }

        ui.notifications.info(notificationText);

    } else {
        ui.notifications.error(`❌ Aucun effet n'a pu être supprimé !`);

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
