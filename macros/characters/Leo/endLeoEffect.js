/**
 * End Leo Effects (Terminer Effets de Léo) - Léo
 *
 * Macro pour terminer les effets négatifs que Léo a appliqués sur d'autres tokens.
 * Similaire au gestionnaire AddEffect mais en mode "suppression uniquement".
 *
 * Fonctionnalités :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détecte automatiquement tous les effets appliqués par Léo sur le canvas
 * - Supporte "Ralentissement" (appliqué par Empalement) et "Chaîne d'Acier"
 * - Interface de sélection pour choisir quels effets supprimer
 * - Supprime les animations Sequencer associées si applicable
 * - Gestion par délégation GM pour les tokens non possédés
 * - Facilement extensible pour de nouveaux effets via EFFECT_CONFIG
 *
 * Pour ajouter un nouvel effet :
 * 1. Ajouter l'entrée dans EFFECT_CONFIG avec les paramètres appropriés
 * 2. Le système détectera automatiquement le nouvel effet
 *
 * Usage : Sélectionner le token de Léo et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DES EFFETS =====
    const EFFECT_CONFIG = {
        "Chaîne d'Acier": {
            displayName: "Chaîne d'Acier",
            icon: "icons/commodities/metal/chain-steel.webp",
            description: "Enchaîné par une chaîne d'acier magique",
            sectionTitle: "🔗 Chaînes d'Acier",
            sectionIcon: "🔗",
            cssClass: "chain-effect",
            borderColor: "#c0c0c0",
            bgColor: "#f9fff9",
            // Détection des flags
            detectFlags: [
                { path: "flags.world.chainCaster", matchValue: "CASTER_ID" }
            ],
            // Animation de suppression
            removeAnimation: {
                file: "animated-spell-effects-cartoon.energy.spark.01",
                scale: 0.6,
                duration: 1500,
                fadeOut: 500,
                tint: "#ffd700"
            },
            // Nettoyage spécial
            cleanup: {
                sequencerName: "flags.world.chainSequenceName"
            }
        },
        "Ralentissement": {
            displayName: "Ralentissement",
            icon: "icons/svg/downgrade.svg",
            description: "Vitesse réduite",
            sectionTitle: "🐌 Ralentissements",
            sectionIcon: "🐌",
            cssClass: "slow-effect",
            borderColor: "#ff5722",
            bgColor: "#fff3e0",
            // Détection des flags
            detectFlags: [
                { path: "flags.world.spellCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.appliedBy", matchValue: "CASTER_ID" }
            ],
            // Description dynamique basée sur les stacks
            getDynamicDescription: (effect) => {
                const stacks = effect.flags?.statuscounter?.value || 1;
                return `Vitesse réduite (-${stacks} cases)`;
            },
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => {
                return {
                    stacks: effect.flags?.statuscounter?.value || 1
                };
            }
        },
        "Royaume des Chaînes (Agilité)": {
            displayName: "Royaume des Chaînes (Agilité)",
            icon: "icons/tools/fasteners/chain-brass-yellow.webp",
            description: "Entravé par le royaume des chaînes de Léo",
            sectionTitle: "🔗 Royaume des Chaînes",
            sectionIcon: "🔗",
            cssClass: "kingdom-effect",
            borderColor: "#4a4a4a",
            bgColor: "#e8eaf6",
            // Détection des flags - seulement l'effet principal (Agilité -4)
            detectFlags: [
                { path: "flags.world.chainKingdomCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.spellName", matchValue: "Royaume des Chaînes" }
            ],
            // Description dynamique basée sur les malus
            getDynamicDescription: (effect) => {
                const agilityMalus = effect.flags?.statuscounter?.value || 4;
                return `Royaume des chaînes (-${agilityMalus} Agilité, -2 autres stats)`;
            },
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => {
                return {
                    agilityMalus: effect.flags?.statuscounter?.value || 4
                };
            },
            // Nettoyage spécial pour les animations et effets liés
            cleanup: {
                sequencerNames: [
                    "flags.world.chainKingdomSequenceName",
                    "flags.world.chainConnectionSequenceName"
                ],
                removeLinkedEffects: true, // Indique qu'il faut supprimer les effets liés
                linkedEffectNames: [
                    "Royaume des Chaînes (Général)", // Effet -2 sur les autres stats
                    "Royaume des Chaînes (Concentration)" // Effet sur Léo
                ]
            }
        }
    };

    /*
     * ===== EXEMPLE POUR AJOUTER UN NOUVEL EFFET =====
     *
     * Pour ajouter un nouvel effet "Paralysie" appliqué par un sort de Léo :
     *
     * "Paralysie": {
     *     displayName: "Paralysie",
     *     icon: "icons/svg/paralysis.svg",
     *     description: "Paralysé par la magie de Léo",
     *     sectionTitle: "⚡ Paralysies",
     *     sectionIcon: "⚡",
     *     cssClass: "paralysis-effect",
     *     borderColor: "#9c27b0",
     *     bgColor: "#f3e5f5",
     *     detectFlags: [
     *         { path: "flags.world.paralysisCreator", matchValue: "CASTER_ID" }
     *     ],
     *     removeAnimation: {
     *         file: "jb2a.cure_wounds.400px.blue",
     *         scale: 0.8,
     *         duration: 2000,
     *         fadeOut: 800,
     *         tint: "#ffffff"
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
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== DETECT ALL LEO'S EFFECTS ON CANVAS =====
    function findLeoEffectsOnCanvas() {
        const leoEffects = [];

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === caster.id) continue; // Skip Leo himself

            // Chercher les effets appliqués par Léo
            for (const effect of token.actor.effects.contents) {
                // Vérifier chaque type d'effet configuré
                for (const [effectName, config] of Object.entries(EFFECT_CONFIG)) {
                    if (effect.name === effectName && checkEffectFlags(effect, config, caster.id)) {
                        // Construire les informations de base
                        let effectInfo = {
                            token: token,
                            actor: token.actor,
                            effect: effect,
                            name: token.name,
                            effectType: effectName,
                            icon: config.icon,
                            description: config.description,
                            config: config
                        };

                        // Description dynamique si disponible
                        if (config.getDynamicDescription) {
                            effectInfo.description = config.getDynamicDescription(effect);
                        }

                        // Données supplémentaires si disponibles
                        if (config.getExtraData) {
                            const extraData = config.getExtraData(effect);
                            Object.assign(effectInfo, extraData);
                        }

                        // Cleanup spécial (ex: nom de séquence)
                        if (config.cleanup?.sequencerName) {
                            effectInfo.sequenceName = getProperty(effect, config.cleanup.sequencerName);
                        }

                        leoEffects.push(effectInfo);
                        break; // Une fois trouvé, pas besoin de vérifier les autres configs
                    }
                }
            }
        }

        return leoEffects;
    }

    const leoEffects = findLeoEffectsOnCanvas();

    if (leoEffects.length === 0) {
        ui.notifications.info("🎯 Pas de malus détecté à supprimer !");
        return;
    }

    // ===== EFFECT SELECTION DIALOG =====
    async function showEffectSelectionDialog() {
        let dialogContent = `
            <h3>🎯 Terminer Effets de Léo</h3>
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
                    color: #2e7d32;
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
        for (const effectInfo of leoEffects) {
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

            dialogContent += `<h4 style="margin: 15px 0 10px 0; color: #424242;">${config.sectionTitle} (${effects.length})</h4>`;

            for (const effectInfo of effects) {
                dialogContent += `
                    <label class="effect-item ${config.cssClass}" style="cursor: pointer;">
                        <input type="checkbox" name="selectedEffects" value="${effectIndex}" style="margin-right: 12px;">
                        <div class="effect-icon" style="background-image: url(${effectInfo.icon});"></div>
                        <div class="effect-content">
                            <div class="effect-type">${config.sectionIcon} ${effectInfo.effectType}</div>
                            <div class="effect-target">${effectInfo.name}</div>
                            <div class="effect-description">${effectInfo.description}</div>
                        </div>
                    </label>
                `;
                effectIndex++;
            }
        }

        dialogContent += `</div>`;

        return new Promise(resolve => {
            const buttons = {
                removeSelected: {
                    icon: '<i class="fas fa-eraser"></i>',
                    label: "�️ Supprimer Sélectionnés",
                    callback: (html) => {
                        const selected = [];
                        html.find('input[name="selectedEffects"]:checked').each((i, el) => {
                            selected.push(parseInt(el.value));
                        });
                        if (selected.length === 0) {
                            ui.notifications.warn("Aucun effet sélectionné !");
                            return;
                        }
                        resolve({ selectedIndices: selected });
                    }
                },
                removeAll: {
                    icon: '<i class="fas fa-trash-alt"></i>',
                    label: "�️ Supprimer Tous",
                    callback: () => {
                        const allIndices = leoEffects.map((_, index) => index);
                        resolve({ selectedIndices: allIndices });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            };

            new Dialog({
                title: "🎯 Terminer Effets de Léo",
                content: dialogContent,
                buttons: buttons,
                default: "removeSelected",
                render: (html) => {
                    // Add select all/none functionality
                    html.find('h4').each((i, header) => {
                        const $header = $(header);
                        $header.css('cursor', 'pointer');
                        $header.on('click', () => {
                            const $section = $header.nextUntil('h4, :last');
                            const $checkboxes = $section.find('input[type="checkbox"]');
                            const allChecked = $checkboxes.filter(':checked').length === $checkboxes.length;
                            $checkboxes.prop('checked', !allChecked);
                        });
                    });
                }
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
    const effectsToRemove = selectedIndices.map(index => leoEffects[index]);
    const removedEffects = {
        chains: [],
        slowdowns: [],
        kingdoms: [],
        failed: []
    };

    for (const effectInfo of effectsToRemove) {
        try {
            const config = effectInfo.config;

            // Nettoyage spécial pour Royaume des Chaînes
            if (effectInfo.effectType === "Royaume des Chaînes (Agilité)" && config.cleanup?.removeLinkedEffects) {
                console.log(`[DEBUG] Removing Kingdom of Chains complex effect from ${effectInfo.name}`);

                // 1. Nettoyer les animations Sequencer
                if (config.cleanup.sequencerNames) {
                    for (const sequencerPath of config.cleanup.sequencerNames) {
                        const sequenceName = getProperty(effectInfo.effect, sequencerPath);
                        if (sequenceName) {
                            try {
                                Sequencer.EffectManager.endEffects({ name: sequenceName });
                                console.log(`[DEBUG] Removed Kingdom animation: ${sequenceName}`);
                            } catch (seqError) {
                                console.warn(`[DEBUG] Could not remove animation ${sequenceName}:`, seqError);
                            }
                        }
                    }
                }

                // 2. Supprimer l'effet principal (Agilité -4) via GM delegation
                if (!globalThis.gmSocket) {
                    ui.notifications.error("GM Socket non disponible !");
                    removedEffects.failed.push({
                        name: effectInfo.name,
                        type: effectInfo.effectType,
                        error: "GM Socket non disponible"
                    });
                    continue;
                }

                const mainResult = await globalThis.gmSocket.executeAsGM("removeEffectFromActor", effectInfo.actor.id, effectInfo.effect.id);

                if (mainResult?.success) {
                    console.log(`[DEBUG] Removed main Kingdom effect from ${effectInfo.name}`);

                    // 3. Supprimer l'effet secondaire (autres stats -2) sur la même cible
                    const secondaryEffect = effectInfo.actor.effects.find(e =>
                        e.name === "Royaume des Chaînes (Général)" &&
                        e.flags?.world?.chainKingdomCaster === caster.id
                    );

                    if (secondaryEffect) {
                        const secondaryResult = await globalThis.gmSocket.executeAsGM("removeEffectFromActor", effectInfo.actor.id, secondaryEffect.id);
                        if (secondaryResult?.success) {
                            console.log(`[DEBUG] Removed secondary Kingdom effect from ${effectInfo.name}`);
                        } else {
                            console.warn(`[DEBUG] Failed to remove secondary Kingdom effect: ${secondaryResult?.error}`);
                        }
                    }

                    // 4. Supprimer l'effet sur Léo (concentration -3 Agilité)
                    const casterEffect = actor.effects.find(e =>
                        e.name === "Royaume des Chaînes (Concentration)" &&
                        e.flags?.world?.chainKingdomTarget === effectInfo.token.id
                    );

                    if (casterEffect) {
                        try {
                            await casterEffect.delete();
                            console.log(`[DEBUG] Removed Kingdom concentration effect from Leo`);
                        } catch (casterError) {
                            console.warn(`[DEBUG] Failed to remove concentration effect from Leo:`, casterError);
                        }
                    }

                    removedEffects.kingdoms.push({
                        name: effectInfo.name,
                        agilityMalus: effectInfo.agilityMalus
                    });

                } else {
                    console.error(`[DEBUG] Failed to remove Kingdom main effect: ${mainResult?.error}`);
                    removedEffects.failed.push({
                        name: effectInfo.name,
                        type: effectInfo.effectType,
                        error: mainResult?.error || "Erreur inconnue"
                    });
                }

            } else {
                // Gestion normale pour les autres effets (Chaîne d'Acier, Ralentissement)

                // Nettoyage d'animation simple
                if (config.cleanup?.sequencerName && effectInfo.sequenceName) {
                    Sequencer.EffectManager.endEffects({ name: effectInfo.sequenceName });
                    console.log(`[DEBUG] Removed ${effectInfo.effectType} animation: ${effectInfo.sequenceName}`);
                }

                // Supprimer l'effet actif via GM delegation
                if (!globalThis.gmSocket) {
                    ui.notifications.error("GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.");
                    console.error("[DEBUG] GM Socket not available for effect removal");
                    removedEffects.failed.push({
                        name: effectInfo.name,
                        type: effectInfo.effectType,
                        error: "GM Socket non disponible"
                    });
                    continue;
                }

                console.log(`[DEBUG] Removing ${effectInfo.effectType} effect from ${effectInfo.name} via GM socket`);
                const result = await globalThis.gmSocket.executeAsGM("removeEffectFromActor", effectInfo.actor.id, effectInfo.effect.id);

                if (result?.success) {
                    console.log(`[DEBUG] Successfully removed ${effectInfo.effectType} effect from ${effectInfo.name}`);

                    if (effectInfo.effectType === "Chaîne d'Acier") {
                        removedEffects.chains.push(effectInfo.name);
                    } else if (effectInfo.effectType === "Ralentissement") {
                        removedEffects.slowdowns.push({
                            name: effectInfo.name,
                            stacks: effectInfo.stacks
                        });
                    }
                } else {
                    console.error(`[DEBUG] Failed to remove ${effectInfo.effectType} effect: ${result?.error}`);
                    removedEffects.failed.push({
                        name: effectInfo.name,
                        type: effectInfo.effectType,
                        error: result?.error || "Erreur inconnue"
                    });
                }
            }

        } catch (error) {
            console.error(`Error removing ${effectInfo.effectType} from ${effectInfo.name}:`, error);
            removedEffects.failed.push({
                name: effectInfo.name,
                type: effectInfo.effectType,
                error: error.message
            });
        }
    }

    // ===== RESULTS AND FEEDBACK =====
    const totalRemoved = removedEffects.chains.length + removedEffects.slowdowns.length + removedEffects.kingdoms.length;
    const totalFailed = removedEffects.failed.length;

    if (totalRemoved > 0) {
        // Note: Pas d'animations de libération pour éviter les conflits avec les animations Sequencer

        // Message dans le chat
        let chatContent = `
            <div style="background: linear-gradient(135deg, #e8f5e8, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #4caf50; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #2e7d32;">🎯 Effets de Léo Terminés</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name}
                    </div>
                </div>
        `;

        // Sections pour chaque type d'effet supprimé (basé sur la configuration)
        // Chaînes supprimées
        if (removedEffects.chains.length > 0) {
            const config = EFFECT_CONFIG["Chaîne d'Acier"];
            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>${config.sectionTitle} Supprimées</strong></div>
                    <div style="font-size: 1.0em; font-weight: bold;">${removedEffects.chains.join(', ')}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Les chaînes magiques se dissolvent</div>
                </div>
            `;
        }

        // Ralentissements supprimés
        if (removedEffects.slowdowns.length > 0) {
            const config = EFFECT_CONFIG["Ralentissement"];
            const slowdownList = removedEffects.slowdowns.map(s =>
                `${s.name} (-${s.stacks} cases)`
            ).join(', ');

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #e65100; margin-bottom: 6px;"><strong>${config.sectionTitle} Supprimés</strong></div>
                    <div style="font-size: 1.0em; font-weight: bold;">${slowdownList}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">La vitesse normale est restaurée</div>
                </div>
            `;
        }

        // Royaumes des Chaînes supprimés
        if (removedEffects.kingdoms.length > 0) {
            const config = EFFECT_CONFIG["Royaume des Chaînes (Agilité)"];
            const kingdomList = removedEffects.kingdoms.map(k =>
                `${k.name} (-${k.agilityMalus} Agilité)`
            ).join(', ');

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #3f51b5; margin-bottom: 6px;"><strong>${config.sectionTitle} Dissous</strong></div>
                    <div style="font-size: 1.0em; font-weight: bold;">${kingdomList}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">
                        Le royaume de chaînes s'effondre - Tous les effets liés supprimés<br>
                        <em>Léo récupère sa concentration (-3 Agilité annulé)</em>
                    </div>
                </div>
            `;
        }

        // Erreurs s'il y en a
        if (removedEffects.failed.length > 0) {
            const failedList = removedEffects.failed.map(f =>
                `${f.name} (${f.type}): ${f.error}`
            ).join('<br>');

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px; border: 1px solid #f44336;">
                    <div style="font-size: 1.1em; color: #d32f2f; margin-bottom: 6px;"><strong>⚠️ Erreurs</strong></div>
                    <div style="font-size: 0.9em; color: #d32f2f;">${failedList}</div>
                </div>
            `;
        }

        chatContent += `</div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: chatContent,
            rollMode: game.settings.get("core", "rollMode")
        });

        // Notification de succès
        let notificationText = "🎯 Effets supprimés : ";
        const parts = [];
        if (removedEffects.chains.length > 0) {
            parts.push(`${removedEffects.chains.length} chaîne${removedEffects.chains.length > 1 ? 's' : ''}`);
        }
        if (removedEffects.slowdowns.length > 0) {
            parts.push(`${removedEffects.slowdowns.length} ralentissement${removedEffects.slowdowns.length > 1 ? 's' : ''}`);
        }
        if (removedEffects.kingdoms.length > 0) {
            parts.push(`${removedEffects.kingdoms.length} royaume${removedEffects.kingdoms.length > 1 ? 's' : ''} des chaînes`);
        }
        notificationText += parts.join(', ');

        if (totalFailed > 0) {
            notificationText += ` (${totalFailed} erreur${totalFailed > 1 ? 's' : ''})`;
        }

        ui.notifications.info(notificationText);

    } else {
        ui.notifications.error("❌ Aucun effet n'a pu être supprimé !");

        // Show errors if any
        if (removedEffects.failed.length > 0) {
            const errorDetails = removedEffects.failed.map(f =>
                `• ${f.name} (${f.type}): ${f.error}`
            ).join('\n');

            console.error("[DEBUG] Failed to remove effects:", errorDetails);
            ui.notifications.error(`Détails des erreurs :\n${errorDetails}`);
        }
    }

})();
