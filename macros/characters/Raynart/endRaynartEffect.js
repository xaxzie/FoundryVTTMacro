/**
 * End Raynart Effects (Terminer Effets de Raynart) - Raynart
 *
 * Macro pour terminer les effets que Raynart a appliqués sur d'autres tokens.
 * Similaire aux gestionnaires endLeoEffect et endMissyEffect.
 *
 * Fonctionnalités :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détecte automatiquement tous les effets appliqués par Raynart sur le canvas
 * - Interface de sélection pour choisir quels effets supprimer
 * - Supprime les animations Sequencer associées si applicable
 * - Gestion par délégation GM pour les tokens non possédés
 * - Facilement extensible pour de nouveaux effets via EFFECT_CONFIG
 *
 * Pour ajouter un nouvel effet :
 * 1. Ajouter l'entrée dans EFFECT_CONFIG avec les paramètres appropriés
 * 2. Le système détectera automatiquement le nouvel effet
 *
 * Usage : Sélectionner le token de Raynart et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DES EFFETS =====
    const EFFECT_CONFIG = {
        "AllongeMecanique": {
            displayName: "Allonge Mécanique",
            icon: "icons/weapons/polearms/spear-flared-blue.webp",
            description: "Allonge augmentée par la mécanique de Raynart",
            sectionTitle: "🔧 Allonges Mécaniques",
            sectionIcon: "🔧",
            cssClass: "allonge-effect",
            borderColor: "#2196f3",
            bgColor: "#e3f2fd",
            // Détection des flags
            detectFlags: [
                { path: "flags.world.mechanicArmorCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.mechanicArmorType", matchValue: "allonge" }
            ],
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => ({
                allongeBonus: effect.flags?.world?.allongeBonus || 1,
                toucherMalus: effect.flags?.world?.toucherMalus || -1
            }),
            getDynamicDescription: (effect) => {
                const allongeBonus = effect.flags?.world?.allongeBonus || 1;
                const toucherMalus = effect.flags?.world?.toucherMalus || -1;
                return `+${allongeBonus} Allonge, ${toucherMalus}d7 au Toucher`;
            },
            // Animation de suppression
            removeAnimation: {
                file: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
                scale: 0.5,
                duration: 1500,
                fadeOut: 500,
                tint: "#2196f3"
            }
        },
        "BoosterDegats": {
            displayName: "Booster de Dégâts",
            icon: "icons/weapons/swords/sword-broad-serrated-blue.webp",
            description: "Dégâts augmentés par la mécanique de Raynart",
            sectionTitle: "⚡ Boosters de Dégâts",
            sectionIcon: "⚡",
            cssClass: "booster-effect",
            borderColor: "#ff9800",
            bgColor: "#fff3e0",
            // Détection des flags
            detectFlags: [
                { path: "flags.world.mechanicArmorCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.mechanicArmorType", matchValue: "booster" }
            ],
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => ({
                damageBonus: effect.flags?.world?.damage || 3
            }),
            getDynamicDescription: (effect) => {
                const damageBonus = effect.flags?.world?.damage || 3;
                return `+${damageBonus} Dégâts`;
            },
            // Animation de suppression
            removeAnimation: {
                file: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
                scale: 0.5,
                duration: 1500,
                fadeOut: 500,
                tint: "#ff9800"
            }
        },
        "BondProjectile": {
            displayName: "Bond Projectile",
            icon: "icons/magic/movement/trail-streak-zigzag-teal.webp",
            description: "Permet de changer la trajectoire des projectiles",
            sectionTitle: "🎯 Bonds Projectiles",
            sectionIcon: "🎯",
            cssClass: "bond-effect",
            borderColor: "#00bcd4",
            bgColor: "#e0f7fa",
            // Détection des flags
            detectFlags: [
                { path: "flags.world.mechanicArmorCaster", matchValue: "CASTER_ID" },
                { path: "flags.world.mechanicArmorType", matchValue: "bond" }
            ],
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => ({
                bondActive: effect.flags?.world?.bondActive || true
            }),
            getDynamicDescription: (effect) => {
                return "Trajectoire modifiable (1 mana/utilisation pour Raynart)";
            },
            // Animation de suppression
            removeAnimation: {
                file: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
                scale: 0.5,
                duration: 1500,
                fadeOut: 500,
                tint: "#00bcd4"
            }
        }
    };

    /*
     * ===== EXEMPLE POUR AJOUTER UN NOUVEL EFFET =====
     *
     * Pour ajouter un nouvel effet "Bouclier Mécanique" appliqué par un sort de Raynart :
     *
     * "BouclierMecanique": {
     *     displayName: "Bouclier Mécanique",
     *     icon: "icons/equipment/shield/heater-steel-boss-purple.webp",
     *     description: "Protégé par un bouclier mécanique de Raynart",
     *     sectionTitle: "🛡️ Boucliers Mécaniques",
     *     sectionIcon: "🛡️",
     *     cssClass: "shield-effect",
     *     borderColor: "#9c27b0",
     *     bgColor: "#f3e5f5",
     *     detectFlags: [
     *         { path: "flags.world.mechanicShieldCaster", matchValue: "CASTER_ID" }
     *     ],
     *     removeAnimation: {
     *         file: "jb2a.shield.03.complete.purple",
     *         scale: 0.8,
     *         duration: 2000,
     *         fadeOut: 800,
     *         tint: "#9c27b0"
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

    // ===== FONCTIONS GM DELEGATION =====
    /**
     * Fonction de délégation GM pour suppression d'effets
     */
    async function removeEffectWithGMDelegation(targetToken, effectId) {
        if (!globalThis.gmSocket) {
            return { success: false, error: "GM Socket non disponible" };
        }
        return await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetToken.id, effectId);
    }

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Raynart !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== DETECT ALL RAYNART'S EFFECTS ON CANVAS =====
    function findRaynartEffectsOnCanvas() {
        const raynartEffects = [];

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === caster.id) continue; // Skip Raynart himself

            // Chercher les effets appliqués par Raynart
            for (const effect of token.actor.effects.contents) {
                // Vérifier chaque type d'effet configuré
                for (const [effectType, config] of Object.entries(EFFECT_CONFIG)) {
                    let isMatch = false;

                    // Vérification par nom exact
                    if (effect.name === config.displayName) {
                        isMatch = true;
                    }

                    if (isMatch) {
                        // Vérifier les flags pour confirmer que c'est bien un effet de Raynart
                        if (checkEffectFlags(effect, config, actor.id)) {
                            const extraData = config.getExtraData ? config.getExtraData(effect) : {};
                            const description = config.getDynamicDescription ?
                                config.getDynamicDescription(effect) : config.description;

                            raynartEffects.push({
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

        return raynartEffects;
    }

    const raynartEffects = findRaynartEffectsOnCanvas();

    if (raynartEffects.length === 0) {
        ui.notifications.info("🔧 Pas d'effets mécaniques détectés à supprimer !");
        return;
    }

    // ===== EFFECT SELECTION DIALOG =====
    async function showEffectSelectionDialog() {
        let dialogContent = `
            <h3>🔧 Terminer Effets de Raynart</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p>Sélectionnez le(s) effet(s) mécanique(s) à supprimer :</p>

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
                    color: #2196f3;
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
        for (const effectInfo of raynartEffects) {
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

                dialogContent += `
                    <div class="effect-item ${config.cssClass}">
                        <input type="checkbox" id="effect-${effectIndex}" value="${effectIndex}" style="margin-right: 12px;">
                        <div class="effect-icon" style="background-image: url('${config.icon}');"></div>
                        <div class="effect-content">
                            <div class="effect-type">${config.displayName}</div>
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
                title: "🔧 Terminer Effets de Raynart",
                content: dialogContent,
                buttons: {
                    removeSelected: {
                        icon: '<i class="fas fa-wrench"></i>',
                        label: "🔧 Retirer Sélectionnés",
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
                        label: "🔧 Retirer Tous",
                        callback: () => {
                            const allIndices = raynartEffects.map((_, index) => index);
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
    const effectsToRemove = selectedIndices.map(index => raynartEffects[index]);
    const removedEffects = {
        allonges: [],
        boosters: [],
        bonds: [],
        failed: []
    };

    for (const effectInfo of effectsToRemove) {
        try {
            const { token, effect, effectType, config, extraData } = effectInfo;

            console.log(`[DEBUG] Removing ${effectType} from ${token.name}`);

            // Remove the effect via GM delegation
            if (token.actor.isOwner) {
                await effect.delete();
            } else {
                const result = await removeEffectWithGMDelegation(token, effect.id);
                if (!result.success) {
                    throw new Error(result.error || "Failed to remove effect via GM socket");
                }
            }

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
            if (effectType === "AllongeMecanique") {
                removedEffects.allonges.push({
                    target: token.name,
                    ...extraData
                });
            } else if (effectType === "BoosterDegats") {
                removedEffects.boosters.push({
                    target: token.name,
                    ...extraData
                });
            } else if (effectType === "BondProjectile") {
                removedEffects.bonds.push({
                    target: token.name
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
    const totalRemoved = removedEffects.allonges.length + removedEffects.boosters.length + removedEffects.bonds.length;
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
                    .scale(config.removeAnimation.scale || 0.5)
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
            <div style="background: linear-gradient(135deg, #e3f2fd, #fff3e0); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #2196f3;">🔧 Effets de Raynart Terminés</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name}
                    </div>
                </div>
        `;

        // Allonges supprimées
        if (removedEffects.allonges.length > 0) {
            const config = EFFECT_CONFIG["AllongeMecanique"];
            const allongeList = removedEffects.allonges.map(a =>
                `${a.target} (+${a.allongeBonus} allonge)`
            ).join(', ');

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${config.borderColor}; margin-bottom: 6px;"><strong>${config.sectionTitle} Supprimées</strong></div>
                    <div style="font-size: 1.0em; font-weight: bold;">${allongeList}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">L'allonge mécanique se rétracte</div>
                </div>
            `;
        }

        // Boosters supprimés
        if (removedEffects.boosters.length > 0) {
            const config = EFFECT_CONFIG["BoosterDegats"];
            const boosterList = removedEffects.boosters.map(b =>
                `${b.target} (+${b.damageBonus} dégâts)`
            ).join(', ');

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${config.borderColor}; margin-bottom: 6px;"><strong>${config.sectionTitle} Supprimés</strong></div>
                    <div style="font-size: 1.0em; font-weight: bold;">${boosterList}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Le booster mécanique s'éteint</div>
                </div>
            `;
        }

        // Bonds supprimés
        if (removedEffects.bonds.length > 0) {
            const config = EFFECT_CONFIG["BondProjectile"];
            const bondList = removedEffects.bonds.map(b => b.target).join(', ');

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${config.borderColor}; margin-bottom: 6px;"><strong>${config.sectionTitle} Supprimés</strong></div>
                    <div style="font-size: 1.0em; font-weight: bold;">${bondList}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Le système de trajectoire se désactive</div>
                </div>
            `;
        }

        // Erreurs s'il y en a
        if (removedEffects.failed.length > 0) {
            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px; border: 1px solid #f44336;">
                    <div style="font-size: 1.1em; color: #d32f2f; margin-bottom: 6px;"><strong>⚠️ Erreurs</strong></div>
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
        let notificationText = "🔧 Effets mécaniques supprimés : ";
        const parts = [];
        if (removedEffects.allonges.length > 0) {
            parts.push(`${removedEffects.allonges.length} allonge(s)`);
        }
        if (removedEffects.boosters.length > 0) {
            parts.push(`${removedEffects.boosters.length} booster(s)`);
        }
        if (removedEffects.bonds.length > 0) {
            parts.push(`${removedEffects.bonds.length} bond(s)`);
        }
        notificationText += parts.join(', ');

        if (totalFailed > 0) {
            notificationText += ` (${totalFailed} échec(s))`;
        }

        ui.notifications.info(notificationText);

    } else {
        ui.notifications.error("❌ Aucun effet mécanique n'a pu être supprimé !");

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
