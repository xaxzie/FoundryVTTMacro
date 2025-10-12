/**
 * Pluie - Sort d'Ora (Zone Weather Effect)
 *
 * Ora fait pleuvoir sur tout le terrain, appliquant des faiblesses élémentaires à tous les tokens présents.
 *
 * - Coût : 3 mana (affiché même en position Focus, mais reste gratuit en Focus)
 * - Caractéristique : Esprit (pas de jet, effet automatique)
 * - Zone : Toute la scène
 * - Durée : Permanent jusqu'à annulation
 *
 * Types de pluie :
 * - Eau : Pluie bleue, applique "Ora Faiblesse Électrique" (+2 dégâts électriques futurs)
 * - Huile : Pluie marron clair, applique "Ora Faiblesse Feu" (+2 dégâts de feu futurs)
 *
 * Mécaniques :
 * - Remplace automatiquement les anciens effets d'Ora (Faiblesse Feu, Faiblesse Électrique, Ralentissement)
 * - Si une pluie est active : propose d'arrêter ou de réappliquer les effets
 * - Animation via FXMaster (rainsimple particle effect)
 * - Pas de jet d'attaque/dégâts, application automatique sur tous les tokens
 *
 * Usage : sélectionner le token d'Ora, lancer la macro et choisir le type de pluie.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Pluie",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        manaCost: 3,
        spellLevel: 1,
        isDirect: false, // Pas de dégâts directs, juste application d'effets
        isFocusable: true,

        // Types de pluie disponibles
        rainTypes: {
            water: {
                name: "Eau",
                description: "Pluie d'eau - Applique Faiblesse Électrique sur tous les tokens",
                color: "#0080ff",
                tint: "#ffffff", // Pluie blanche/bleue
                effectType: "Ora Faiblesse Électrique",
                chatMessage: "🌧️💧 Une pluie d'eau commence à tomber sur le terrain..."
            },
            oil: {
                name: "Huile",
                description: "Pluie d'huile - Applique Faiblesse Feu sur tous les tokens",
                color: "#8B4513",
                tint: "#D2691E", // Marron clair
                effectType: "Ora Faiblesse Feu",
                chatMessage: "🌧️🔥 Une pluie d'huile visqueuse commence à tomber sur le terrain..."
            }
        },

        // Configuration FXMaster pour la pluie
        fxmasterConfig: {
            type: "rainsimple",
            baseOptions: {
                scale: 1,
                direction: 75,
                speed: 1,
                lifetime: 1,
                density: 0.5,
                alpha: 1,
                tint: {
                    apply: true,
                    value: "#ffffff" // Sera remplacé selon le type
                }
            }
        },

        // Réutilise les configurations des effets de bubbles.js
        statusEffects: {
            "Ora Faiblesse Électrique": {
                name: "Ora Faiblesse Électrique",
                icon: "icons/magic/lightning/bolt-strike-blue.webp",
                description: "Vulnérable aux dégâts électriques (+2 prochaine attaque électrique)",
                duration: { seconds: 84600 },
                flags: {
                    world: {
                        oraCaster: "CASTER_ID",
                        spellName: "Pluie d'Eau",
                        effectType: "weakness",
                        appliedAt: "TIMESTAMP",
                        damageType: "electric"
                    },
                    statuscounter: { value: 3 }
                },
                changes: [],
                tint: "#0080ff"
            },
            "Ora Faiblesse Feu": {
                name: "Ora Faiblesse Feu",
                icon: "icons/magic/water/orb-water-bubbles-blue.webp",
                description: "Vulnérable aux dégâts de feu (+2 prochaine attaque de feu)",
                duration: { seconds: 84600 },
                flags: {
                    world: {
                        oraCaster: "CASTER_ID",
                        spellName: "Pluie d'Huile",
                        effectType: "weakness",
                        appliedAt: "TIMESTAMP",
                        damageType: "fire"
                    },
                    statuscounter: { value: 2 }
                },
                changes: [],
                tint: "#ff8c00"
            }
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton d'Ora !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== VALIDATION DE FXMASTER =====
    function isFXMasterAvailable() {
        return typeof FXMASTER !== 'undefined' &&
               FXMASTER.filters &&
               typeof Hooks !== 'undefined';
    }

    if (!isFXMasterAvailable()) {
        ui.notifications.error("❌ FXMaster n'est pas disponible ! Veuillez installer et activer le module FXMaster.");
        return;
    }

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }
    const currentStance = getCurrentStance(actor);

    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                total += flagValue;
            }
        }
        return total;
    }

    // ===== GESTION DE L'ÉTAT DE LA PLUIE =====
    function getCurrentRainState() {
        // Vérifier si une pluie d'Ora est active
        const rainFlag = canvas.scene.getFlag("world", "oraRainActive");
        const fxmasterEffects = canvas.scene.getFlag("fxmaster", "effects") || {};
        const hasFXMasterRain = Object.keys(fxmasterEffects).some(key =>
            fxmasterEffects[key]?.type === "rainsimple"
        );

        return {
            isActive: !!(rainFlag || hasFXMasterRain),
            type: rainFlag?.type || null,
            config: rainFlag || null
        };
    }

    async function stopRain() {
        try {
            console.log("[Ora Rain] Stopping rain effects...");

            const currentRain = getCurrentRainState();
            if (!currentRain.isActive) return { success: true, removed: 0 };

            // 1. Arrêter l'animation de pluie (méthode validée)
            await canvas.scene.unsetFlag("fxmaster", "effects");
            console.log("[Ora Rain] Rain particles cleared");

            // 2. Supprimer tous les effets du type de pluie actuel sur tous les tokens
            const rainType = currentRain.config?.type;
            const effectToRemove = rainType ? SPELL_CONFIG.rainTypes[rainType]?.effectType : null;
            let removedCount = 0;

            if (effectToRemove) {
                for (const token of canvas.tokens.placeables) {
                    if (!token.actor) continue;

                    const effectsToRemove = token.actor.effects.contents.filter(effect =>
                        effect.name === effectToRemove
                        // Ne pas vérifier le casterId - supprimer tous les effets de ce type
                    );

                    for (const effect of effectsToRemove) {
                        try {
                            if (token.actor.isOwner) {
                                await effect.delete();
                            } else if (globalThis.gmSocket) {
                                await globalThis.gmSocket.executeAsGM("removeEffectFromActor", token.actor.id, effect.id);
                            }
                            removedCount++;
                        } catch (error) {
                            console.warn(`[Ora Rain] Could not remove effect from ${token.name}:`, error);
                        }
                    }
                }
            }

            // 3. Supprimer les flags de la scène
            await canvas.scene.unsetFlag("world", "oraRainActive");

            console.log(`[Ora Rain] Rain stopped, removed ${removedCount} effects`);
            return { success: true, removed: removedCount };

        } catch (error) {
            console.error("[Ora Rain] Error stopping rain:", error);
            return { success: false, removed: 0 };
        }
    }

    async function startRain(rainType) {
        try {
            console.log(`[Ora Rain] Starting ${rainType} rain...`);

            const rainConfig = SPELL_CONFIG.rainTypes[rainType];
            if (!rainConfig) {
                throw new Error(`Invalid rain type: ${rainType}`);
            }

            // 1. Configuration FXMaster avec la teinte appropriée
            const fxConfig = {
                ...SPELL_CONFIG.fxmasterConfig.baseOptions,
                tint: {
                    apply: true,
                    value: rainConfig.tint
                }
            };

            const rainParticles = {
                type: SPELL_CONFIG.fxmasterConfig.type,
                options: fxConfig
            };

            // 2. Activer les particules de pluie (méthode validée)
            await Hooks.call('fxmaster.updateParticleEffects', [rainParticles]);
            console.log("[Ora Rain] Rain particles activated");

            // 3. Marquer l'état dans les flags de la scène
            await canvas.scene.setFlag("world", "oraRainActive", {
                type: rainType,
                caster: caster.id,
                effectType: rainConfig.effectType,
                activatedAt: Date.now()
            });

            console.log("[Ora Rain] Rain started successfully");
            return { success: true };

        } catch (error) {
            console.error("[Ora Rain] Error starting rain:", error);
            return { success: false };
        }
    }

    // ===== GESTION DES EFFETS SUR TOKENS =====
    async function removeExistingOraEffects(targetActor, casterId) {
        const oraEffectsToRemove = [];

        // Chercher tous les effets d'Ora sur la cible (même logique que bubbles.js)
        for (const effect of targetActor.effects.contents) {
            const isOraEffect = (
                effect.name === "Ora Ralentissement" ||
                effect.name === "Ora Faiblesse Électrique" ||
                effect.name === "Ora Faiblesse Feu"
            );

            if (isOraEffect) {
                // Ne pas vérifier le casterId - remplacer tous les effets d'Ora peu importe qui les a lancés
                oraEffectsToRemove.push(effect);
            }
        }

        for (const effect of oraEffectsToRemove) {
            try {
                if (targetActor.isOwner) {
                    await effect.delete();
                } else if (globalThis.gmSocket) {
                    await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetActor.id, effect.id);
                }
            } catch (error) {
                console.warn(`[Ora Rain] Could not remove existing effect:`, error);
            }
        }

        return oraEffectsToRemove.length;
    }

    async function applyRainEffects(rainType) {
        const rainConfig = SPELL_CONFIG.rainTypes[rainType];
        const effectConfig = SPELL_CONFIG.statusEffects[rainConfig.effectType];
        let appliedCount = 0;

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            try {
                // Supprimer les anciens effets d'Ora d'abord
                await removeExistingOraEffects(token.actor, caster.id);

                // Préparer l'effet avec les bonnes données
                const effectData = {
                    ...effectConfig,
                    flags: {
                        ...effectConfig.flags,
                        world: {
                            ...effectConfig.flags.world,
                            oraCaster: caster.id,
                            spellName: `Pluie ${rainConfig.name}`,
                            appliedAt: Date.now()
                        }
                    }
                };

                // Appliquer le nouvel effet
                if (token.actor.isOwner) {
                    await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                } else if (globalThis.gmSocket) {
                    await globalThis.gmSocket.executeAsGM("createEffectOnActor", token.actor.id, effectData);
                }

                appliedCount++;
                console.log(`[Ora Rain] Applied ${rainConfig.effectType} to ${token.name}`);

            } catch (error) {
                console.warn(`[Ora Rain] Could not apply effect to ${token.name}:`, error);
            }
        }

        return appliedCount;
    }

    // ===== DIALOGS =====
    async function showRainTypeDialog() {
        return new Promise((resolve) => {
            const rainOptions = Object.keys(SPELL_CONFIG.rainTypes).map(key => {
                const rain = SPELL_CONFIG.rainTypes[key];
                return `
                    <label style="display: block; margin: 8px 0; padding: 12px; border: 2px solid ${rain.color}; border-radius: 4px; background: linear-gradient(135deg, #f9f9f9, #ffffff); cursor: pointer;">
                        <input type="radio" name="rainType" value="${key}" ${key === 'water' ? 'checked' : ''} style="margin-right: 8px;">
                        <strong>${rain.name}</strong> - ${rain.description}
                    </label>
                `;
            }).join('');

            const manaCostInfo = currentStance === 'focus'
                ? `<strong>Coût :</strong> ${SPELL_CONFIG.manaCost} mana <em>(gratuit en Position Focus)</em>`
                : `<strong>Coût :</strong> ${SPELL_CONFIG.manaCost} mana`;

            new Dialog({
                title: "🌧️ Sort de Pluie d'Ora",
                content: `
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 15px 0; color: #2196f3;">🌧️ Pluie Élémentaire</h3>
                        <p>${manaCostInfo}</p>
                        <p><strong>Zone :</strong> Toute la scène</p>
                        <p><strong>Effet :</strong> Applique automatiquement des faiblesses élémentaires sur tous les tokens</p>

                        <h4 style="margin: 15px 0 10px 0;">Type de pluie :</h4>
                        ${rainOptions}

                        <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 4px; font-size: 0.9em;">
                            <strong>💡 Note :</strong> La pluie remplacera automatiquement tous les anciens effets d'Ora
                            (Faiblesse Feu, Faiblesse Électrique, Ralentissement) sur tous les tokens de la scène.
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-cloud-rain"></i>',
                        label: '🌧️ Faire Pleuvoir',
                        callback: (html) => {
                            const rainType = html.find('input[name="rainType"]:checked').val();
                            resolve({ rainType });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: '❌ Annuler',
                        callback: () => resolve(null)
                    }
                },
                default: "cast"
            }, {
                width: 500
            }).render(true);
        });
    }

    async function showRainManagementDialog(currentRain) {
        return new Promise((resolve) => {
            const rainConfig = SPELL_CONFIG.rainTypes[currentRain.type];
            const rainName = rainConfig ? rainConfig.name : currentRain.type;

            new Dialog({
                title: "🌧️ Gestion de la Pluie Active",
                content: `
                    <div style="padding: 15px; text-align: center;">
                        <h3 style="margin: 0 0 15px 0; color: #2196f3;">🌧️ Pluie de ${rainName} Active</h3>
                        <p style="margin-bottom: 20px;">Une pluie de <strong>${rainName}</strong> tombe actuellement sur la scène.</p>

                        <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                            <p><strong>Que voulez-vous faire ?</strong></p>
                        </div>
                    </div>
                `,
                buttons: {
                    stop: {
                        icon: '<i class="fas fa-sun"></i>',
                        label: '☀️ Arrêter la Pluie',
                        callback: () => resolve({ action: 'stop' })
                    },
                    reapply: {
                        icon: '<i class="fas fa-sync"></i>',
                        label: '🔄 Réappliquer les Effets',
                        callback: () => resolve({ action: 'reapply' })
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: '❌ Annuler',
                        callback: () => resolve(null)
                    }
                },
                default: "stop"
            }, {
                width: 400
            }).render(true);
        });
    }

    // ===== LOGIQUE PRINCIPALE =====
    const currentRain = getCurrentRainState();

    if (currentRain.isActive) {
        // Une pluie est déjà active
        const management = await showRainManagementDialog(currentRain);
        if (!management) return;

        if (management.action === 'stop') {
            // Arrêter la pluie
            const result = await stopRain();
            if (result.success) {
                ui.notifications.info("☀️ La pluie s'arrête...");

                // Message dans le chat
                const rainTypeName = currentRain.config?.type ?
                    SPELL_CONFIG.rainTypes[currentRain.config.type]?.name : "inconnue";

                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: caster }),
                    content: `
                        <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #fff3e0, #ffffff); border-radius: 8px; border: 2px solid #ff6f00;">
                            <h3 style="margin: 0; color: #e65100;">☀️ Fin de la Pluie</h3>
                            <p style="margin: 5px 0;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0;">La pluie de ${rainTypeName} s'arrête. Les effets élémentaires persistent sur les cibles touchées.</p>
                        </div>
                    `,
                    rollMode: game.settings.get('core', 'rollMode')
                });
            } else {
                ui.notifications.error("⚠️ Erreur lors de l'arrêt de la pluie.");
            }

        } else if (management.action === 'reapply') {
            // Réappliquer les effets sans message
            const appliedCount = await applyRainEffects(currentRain.config.type);
            ui.notifications.info(`🔄 Effets de pluie réappliqués sur ${appliedCount} tokens.`);
        }

    } else {
        // Aucune pluie active, proposer de créer une nouvelle pluie
        const spellConfig = await showRainTypeDialog();
        if (!spellConfig) return;

        const { rainType } = spellConfig;
        const rainConfig = SPELL_CONFIG.rainTypes[rainType];

        // Démarrer la pluie
        const rainResult = await startRain(rainType);
        if (!rainResult.success) {
            ui.notifications.error("⚠️ Erreur lors du démarrage de la pluie.");
            return;
        }

        // Appliquer les effets sur tous les tokens
        const appliedCount = await applyRainEffects(rainType);

        // Message de réussite
        ui.notifications.info(`🌧️ Pluie de ${rainConfig.name} commencée ! Effets appliqués sur ${appliedCount} tokens.`);

        // Message dans le chat
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e3f2fd, #ffffff); border-radius: 8px; border: 2px solid ${rainConfig.color}; margin: 8px 0;">
                    <h3 style="margin: 0; color: #1976d2;">🌧️ Sort de Pluie</h3>
                    <div style="margin: 5px 0;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana
                        ${currentStance === 'focus' ? ' <em>(gratuit en Focus)</em>' : ''}
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: ${rainConfig.color}22; border-radius: 4px;">
                        <div style="font-size: 1.1em; font-weight: bold; color: ${rainConfig.color};">
                            ${rainConfig.chatMessage}
                        </div>
                        <div style="margin-top: 5px; font-size: 0.9em;">
                            Tous les tokens sur le terrain sont maintenant affectés par <strong>${rainConfig.effectType}</strong>.
                        </div>
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        Tokens affectés: ${appliedCount} | Zone: Toute la scène
                    </div>
                </div>
            `,
            rollMode: game.settings.get('core', 'rollMode')
        });
    }

})();
