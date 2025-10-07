/**
 * End Aloha Effects (Terminer Effets d'Aloha) - Aloha
 *
 * Macro pour terminer les effets qu'Aloha a appliqués sur d'autres tokens.
 * Similaire au gestionnaire endMissyEffect mais adapté pour les effets thermiques d'Aloha.
 *
 * Fonctionnalités :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détecte automatiquement tous les effets appliqués par Aloha sur le canvas
 * - Interface de sélection pour choisir quels effets supprimer
 * - Supprime les animations Sequencer associées si applicable
 * - Gestion par délégation GM pour les tokens non possédés
 * - Facilement extensible pour de nouveaux effets via EFFECT_CONFIG
 *
 * Pour ajouter un nouvel effet :
 * 1. Ajouter l'entrée dans EFFECT_CONFIG avec les paramètres appropriés
 * 2. Le système détectera automatiquement le nouvel effet
 *
 * Usage : Sélectionner le token d'Aloha et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DES EFFETS =====
    const EFFECT_CONFIG = {
        // Effet "Etreinte Chauffée" du sort "Contact Cuisant"
        "EtreinteChaufee": {
            displayName: "Etreinte Chauffée",
            icon: "icons/magic/fire/flame-burning-creature-orange.webp",
            description: "Maintenu dans l'étreinte chauffante d'Aloha",
            sectionTitle: "🔥 Effets Thermiques",
            sectionIcon: "🔥",
            cssClass: "burn-effect",
            borderColor: "#ff5722",
            bgColor: "#ffebee",
            // Détection des flags
            detectFlags: [
                { path: "flags.world.contactCuisantCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.spellName", matchValue: "Contact Cuisant" }
            ],
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => ({
                usageCount: effect.flags?.world?.contactCuisantUsageCount || 0
            }),
            getDynamicDescription: (effect) => {
                const usageCount = effect.flags?.world?.contactCuisantUsageCount || 0;
                return `Etreinte chauffante d'Aloha ${usageCount > 0 ? `(${usageCount} utilisation(s))` : ''}`;
            },
            // Animation de suppression
            removeAnimation: {
                file: "jb2a.cure_wounds.400px.orange",
                scale: 0.8,
                duration: 2000,
                fadeOut: 800,
                tint: "#ff5722"
            },
            // Nettoyage spécial pour l'animation persistante
            cleanup: {
                sequencerName: "flags.world.contactCuisantSequenceName"
            }
        }
    };

    /*
     * ===== EXEMPLE POUR AJOUTER UN NOUVEL EFFET =====
     *
     * Pour ajouter un nouvel effet "Poêle Chauffée" appliqué par un sort d'Aloha :
     *
     * "PoeleChauffee": {
     *     displayName: "Poêle Chauffée",
     *     icon: "icons/weapons/polearms/hammer-war-spiked.webp",
     *     description: "Marqué par la chaleur de la poêle d'Aloha",
     *     sectionTitle: "🔥 Effets de Chaleur",
     *     sectionIcon: "🔥",
     *     cssClass: "heat-effect",
     *     borderColor: "#ff9800",
     *     bgColor: "#fff3e0",
     *     detectFlags: [
     *         { path: "flags.world.heatCaster", matchValue: "CASTER_ID" }
     *     ],
     *     removeAnimation: {
     *         file: "jb2a.cure_wounds.400px.orange",
     *         scale: 0.8,
     *         duration: 2000,
     *         fadeOut: 800,
     *         tint: "#ff9800"
     *     }
     * }
     */

    // ===== FONCTIONS UTILITAIRES =====
    function checkEffectFlags(effect, config, casterId) {
        for (const flagCheck of config.detectFlags) {
            const flagValue = getProperty(effect, flagCheck.path);
            const expectedValue = flagCheck.matchValue === "CASTER_ID" ? casterId : flagCheck.matchValue;
            if (flagValue === expectedValue) {
                return true;
            }
        }
        return false;
    }

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton d'Aloha !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== DETECT ALL ALOHA'S EFFECTS ON CANVAS =====
    function findAlohaEffectsOnCanvas() {
        const alohaEffects = [];

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === caster.id) continue; // Skip Aloha himself

            // Chercher les effets appliqués par Aloha
            for (const effect of token.actor.effects.contents) {
                // Vérifier chaque type d'effet configuré
                for (const [effectType, config] of Object.entries(EFFECT_CONFIG)) {
                    let isMatch = false;

                    // Vérification par nom exact
                    if (effect.name === config.displayName) {
                        isMatch = true;
                    }

                    if (isMatch) {
                        // Vérifier les flags pour confirmer que c'est bien un effet d'Aloha
                        if (checkEffectFlags(effect, config, actor.id)) {
                            const extraData = config.getExtraData ? config.getExtraData(effect) : {};
                            const description = config.getDynamicDescription ?
                                config.getDynamicDescription(effect) : config.description;

                            alohaEffects.push({
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
        }

        return alohaEffects;
    }

    const alohaEffects = findAlohaEffectsOnCanvas();

    if (alohaEffects.length === 0) {
        ui.notifications.info("🍳 Pas d'effets thermiques détectés à supprimer !");
        return;
    }

    // ===== EFFECT SELECTION DIALOG =====
    async function showEffectSelectionDialog() {
        let dialogContent = `
            <h3>🍳 Terminer Effets d'Aloha</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p>Sélectionnez le(s) effet(s) thermique(s) à supprimer :</p>

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
                    color: #ff5722;
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
        for (const effectInfo of alohaEffects) {
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
                const extraInfo = extraData.stacks ? ` (${extraData.stacks} stacks)` : '';

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
                title: "🍳 Terminer Effets d'Aloha",
                content: dialogContent,
                buttons: {
                    removeSelected: {
                        icon: '<i class="fas fa-fire-extinguisher"></i>',
                        label: "🍳 Retirer Sélectionnés",
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
                        label: "🍳 Retirer Tous",
                        callback: () => {
                            const allIndices = alohaEffects.map((_, index) => index);
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
                width: 500,
                height: 600,
                resizable: true
            }).render(true);
        });
    }

    const selection = await showEffectSelectionDialog();
    if (!selection) {
        ui.notifications.info("Opération annulée.");
        return;
    }

    // ===== REMOVE SELECTED EFFECTS =====
    const { selectedIndices } = selection;
    const effectsToRemove = selectedIndices.map(index => alohaEffects[index]);
    const removedEffects = {
        thermalEffects: [], // For thermal/heat effects
        failed: []
    };

    for (const effectInfo of effectsToRemove) {
        try {
            const { token, effect, effectType, config } = effectInfo;

            console.log(`[DEBUG] Removing ${effectType} from ${token.name}`);

            // Remove the effect
            await effect.delete();

            // Clean up any sequencer animations if specified
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

            // Track removal by effect type
            if (effectType.includes("brulure") || effectType.includes("burn") || effectType.includes("heat") || effectType.includes("chaleur") || effectType.includes("poele")) {
                removedEffects.thermalEffects.push({
                    target: token.name,
                    effect: config.displayName,
                    type: effectType
                });
            } else {
                // For other future effect types
                if (!removedEffects[effectType]) {
                    removedEffects[effectType] = [];
                }
                removedEffects[effectType].push({
                    target: token.name,
                    effect: config.displayName
                });
            }

            console.log(`[DEBUG] Successfully removed ${effectType} from ${token.name}`);

        } catch (error) {
            console.error(`[DEBUG] Failed to remove effect from ${effectInfo.token.name}:`, error);
            removedEffects.failed.push({
                target: effectInfo.token.name,
                effect: effectInfo.config.displayName,
                error: error.message
            });
        }
    }

    // ===== RESULTS AND FEEDBACK =====
    const totalRemoved = Object.values(removedEffects).reduce((sum, arr) => {
        return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0) - removedEffects.failed.length;
    const totalFailed = removedEffects.failed.length;

    if (totalRemoved > 0) {
        // Animations de libération basées sur la configuration
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

        // Message dans le chat
        let chatContent = `
            <div style="background: linear-gradient(135deg, #fff3e0, #ffebee); padding: 12px; border-radius: 8px; border: 2px solid #ff5722; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #ff5722;">🍳 Effets d'Aloha Terminés</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name}
                    </div>
                </div>
        `;

        // Sections pour chaque type d'effet supprimé (basé sur la configuration)
        // Effets thermiques supprimés
        if (removedEffects.thermalEffects.length > 0) {
            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #ff5722; margin-bottom: 6px;"><strong>🔥 Effets Thermiques Supprimés</strong></div>
            `;
            for (const removed of removedEffects.thermalEffects) {
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
        let notificationText = "🍳 Effets thermiques supprimés : ";
        const parts = [];
        if (removedEffects.thermalEffects.length > 0) {
            parts.push(`${removedEffects.thermalEffects.length} effet(s) thermique(s)`);
        }
        notificationText += parts.join(', ');

        if (totalFailed > 0) {
            notificationText += ` (${totalFailed} échec(s))`;
        }

        ui.notifications.info(notificationText);

    } else {
        ui.notifications.error("❌ Aucun effet thermique n'a pu être supprimé !");

        // Show errors if any
        if (removedEffects.failed.length > 0) {
            let errorMsg = "Erreurs rencontrées:\n";
            for (const failed of removedEffects.failed) {
                errorMsg += `- ${failed.target}: ${failed.error}\n`;
            }
            ui.notifications.error(errorMsg);
        }
    }

})();
