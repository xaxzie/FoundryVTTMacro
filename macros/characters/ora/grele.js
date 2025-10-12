/**
 * Grêle - Sort d'Ora (Zone Attack Weather Effect)
 *
 * Ora déclenche une tempête de grêle sur tout le terrain, infligeant des dégâts à tous les tokens.
 *
 * - Coût : 4 mana (demi-focusable - coût réduit en Position Focus)
 * - Caractéristique : Esprit
 * - Zone : Toute la scène
 * - Dégâts : Esprit/2 (arrondi supérieur) à tous les tokens
 * - Évitement : Jet d'Agilité difficulté Esprit×4 d'Ora
 * - Protection : Ora n'est pas touchée
 *
 * Options de Protection des Alliés :
 * - Gratuit : Protéger 1 allié spécifique
 * - 3 mana (focusable) : Protéger tous les alliés (max Esprit/2 alliés)
 *
 * Alliés supportés :
 * - Raynart, Moctei, Yunyun, Léo
 *
 * Usage : sélectionner le token d'Ora, lancer la macro et choisir les protections.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Grêle",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        manaCost: 4,
        spellLevel: 2,
        isDirect: true,
        isFocusable: true, // Demi-focusable
        isHalfFocusable: true, // Coût réduit mais pas gratuit en Focus

        // Alliés supportés (même liste que ora-eyes)
        allies: {
            "Raynart": "4bandVHr1d92RYuL",
            "Moctei": "RTwQuERFkkNPk4ni",
            "Yunyun": "E0B1mjYMdX1gqzvh",
            "Léo": "0w7rtAdrpd3lPkN2"
        },

        // Configuration FXMaster pour la tempête de grêle
        fxmasterConfig: {
            type: "snowstorm",
            options: {
                scale: 1.4,
                direction: 90,
                speed: 5,
                lifetime: 1,
                density: 0.65,
                alpha: 0.3,
                tint: {
                    apply: false,
                    value: "#ffffff"
                }
            }
        },

        // Messages
        messages: {
            started: "🌨️ Une violente tempête de grêle s'abat sur le terrain !",
            stopped: "☀️ La tempête de grêle se calme.",
            noFxmaster: "❌ FXMaster n'est pas disponible ! Veuillez installer et activer le module FXMaster.",
            error: "⚠️ Erreur lors du contrôle de la tempête."
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
        ui.notifications.error(SPELL_CONFIG.messages.noFxmaster);
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

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
            return null;
        }
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // ===== GESTION DE L'ÉTAT DE LA GRÊLE =====
    function getCurrentHailState() {
        const hailFlag = canvas.scene.getFlag("world", "oraHailActive");
        const fxmasterEffects = canvas.scene.getFlag("fxmaster", "effects") || {};
        const hasFXMasterHail = Object.keys(fxmasterEffects).some(key =>
            fxmasterEffects[key]?.type === "snowstorm"
        );

        return {
            isActive: !!(hailFlag || hasFXMasterHail),
            config: hailFlag || null
        };
    }

    async function stopHail() {
        try {
            console.log("[Ora Hail] Stopping hail effects...");

            // Arrêter l'animation de grêle
            await canvas.scene.unsetFlag("fxmaster", "effects");
            await canvas.scene.unsetFlag("world", "oraHailActive");

            console.log("[Ora Hail] Hail effects stopped");
            return { success: true };
        } catch (error) {
            console.error("[Ora Hail] Error stopping hail:", error);
            return { success: false };
        }
    }

    async function startHail() {
        try {
            console.log("[Ora Hail] Starting hail storm...");

            // Activer les particules de grêle
            await Hooks.call('fxmaster.updateParticleEffects', [SPELL_CONFIG.fxmasterConfig]);
            console.log("[Ora Hail] Hail particles activated");

            // Marquer l'état dans les flags de la scène
            await canvas.scene.setFlag("world", "oraHailActive", {
                caster: caster.id,
                activatedAt: Date.now()
            });

            return { success: true };
        } catch (error) {
            console.error("[Ora Hail] Error starting hail:", error);
            return { success: false };
        }
    }

    // ===== FONCTIONS UTILITAIRES =====
    function findActorById(actorId) {
        return game.actors.get(actorId);
    }

    // ===== DIALOG DE CONFIGURATION =====
    async function showHailConfigDialog() {
        return new Promise((resolve) => {
            // Construire les options pour les alliés
            const allyOptions = Object.keys(SPELL_CONFIG.allies).map(allyName => {
                const allyActor = findActorById(SPELL_CONFIG.allies[allyName]);
                if (!allyActor) return '';

                return `
                    <label style="display: block; margin: 4px 0;">
                        <input type="checkbox" name="protectedAlly" value="${allyName}">
                        <strong>${allyName}</strong> (${allyActor.name})
                    </label>
                `;
            }).filter(Boolean).join('');

            const damage = Math.ceil(characteristicInfo.final / 2);
            const avoidDifficulty = characteristicInfo.final * 4;
            const maxProtectedAllies = Math.ceil(characteristicInfo.final / 2);

            const baseCost = SPELL_CONFIG.manaCost;
            const focusReduction = currentStance === 'focus' ? Math.floor(baseCost / 2) : 0;
            const finalBaseCost = baseCost - focusReduction;

            const protectionCost = 3;
            const protectionFocusCost = currentStance === 'focus' ? 0 : protectionCost;

            new Dialog({
                title: "🌨️ Sort de Grêle d'Ora",
                content: `
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 15px 0; color: #87ceeb;">🌨️ Tempête de Grêle</h3>

                        <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                            <p><strong>Coût de base :</strong> ${finalBaseCost} mana ${focusReduction > 0 ? `<em>(${baseCost} - ${focusReduction} réduction Focus)</em>` : ''}</p>
                            <p><strong>Zone :</strong> Toute la scène</p>
                            <p><strong>Dégâts :</strong> ${damage} (Esprit/2 arrondi supérieur)</p>
                            <p><strong>Évitement :</strong> Jet d'Agilité difficulté ${avoidDifficulty}</p>
                            <p><strong>Ora :</strong> Automatiquement protégée</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; border: 1px solid #ffa500; background: #fff8dc; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #ff8c00;">🛡️ Protection des Alliés</h4>

                            <div style="margin: 10px 0;">
                                <label style="font-weight: bold;">
                                    <input type="radio" name="protection" value="none" checked>
                                    Aucune protection supplémentaire
                                </label>
                            </div>

                            <div style="margin: 10px 0;">
                                <label style="font-weight: bold;">
                                    <input type="radio" name="protection" value="specific">
                                    Protéger 1 allié spécifique (gratuit)
                                </label>
                                <div id="specificAllyDiv" style="margin-left: 20px; display: none;">
                                    ${allyOptions}
                                </div>
                            </div>

                            <div style="margin: 10px 0;">
                                <label style="font-weight: bold;">
                                    <input type="radio" name="protection" value="all">
                                    Protéger tous les alliés (+${protectionFocusCost} mana${currentStance === 'focus' && protectionCost > 0 ? ' - gratuit en Focus' : ''})
                                </label>
                                <p style="margin: 5px 0 0 20px; font-size: 0.9em; color: #666;">
                                    Maximum ${maxProtectedAllies} alliés protégés (Esprit/2)
                                </p>
                            </div>
                        </div>

                        <div style="margin-top: 15px; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 0.9em;">
                            <strong>ℹ️ Note :</strong> Les alliés protégés évitent automatiquement les dégâts de grêle.
                        </div>
                    </div>

                    <script>
                        // Gestion des options de protection
                        function updateProtectionOptions() {
                            const protectionRadios = document.querySelectorAll('input[name="protection"]');
                            const specificDiv = document.getElementById('specificAllyDiv');

                            protectionRadios.forEach(radio => {
                                radio.addEventListener('change', function() {
                                    specificDiv.style.display = this.value === 'specific' ? 'block' : 'none';

                                    // Décocher les alliés si on change d'option
                                    if (this.value !== 'specific') {
                                        document.querySelectorAll('input[name="protectedAlly"]').forEach(cb => {
                                            cb.checked = false;
                                        });
                                    }
                                });
                            });
                        }

                        updateProtectionOptions();
                    </script>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-snowflake"></i>',
                        label: '🌨️ Déclencher la Grêle',
                        callback: (html) => {
                            const protection = html.find('input[name="protection"]:checked').val();
                            const protectedAllies = [];

                            if (protection === 'specific') {
                                html.find('input[name="protectedAlly"]:checked').each(function() {
                                    protectedAllies.push(this.value);
                                });
                            }

                            resolve({ protection, protectedAllies });
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
                width: 550
            }).render(true);
        });
    }

    async function showHailManagementDialog() {
        return new Promise((resolve) => {
            new Dialog({
                title: "🌨️ Gestion de la Tempête Active",
                content: `
                    <div style="padding: 15px; text-align: center;">
                        <h3 style="margin: 0 0 15px 0; color: #87ceeb;">🌨️ Tempête de Grêle Active</h3>
                        <p style="margin-bottom: 20px;">Une tempête de grêle fait rage sur la scène.</p>

                        <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                            <p><strong>Que voulez-vous faire ?</strong></p>
                        </div>
                    </div>
                `,
                buttons: {
                    stop: {
                        icon: '<i class="fas fa-sun"></i>',
                        label: '☀️ Arrêter la Tempête',
                        callback: () => resolve({ action: 'stop' })
                    },
                    recast: {
                        icon: '<i class="fas fa-snowflake"></i>',
                        label: '🌨️ Nouvelle Tempête',
                        callback: () => resolve({ action: 'recast' })
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
    const currentHail = getCurrentHailState();

    if (currentHail.isActive) {
        // Une tempête est déjà active
        const management = await showHailManagementDialog();
        if (!management) return;

        if (management.action === 'stop') {
            const result = await stopHail();
            if (result.success) {
                ui.notifications.info(SPELL_CONFIG.messages.stopped);

                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: caster }),
                    content: `
                        <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #fff3e0, #ffffff); border-radius: 8px; border: 2px solid #ff6f00;">
                            <h3 style="margin: 0; color: #e65100;">☀️ Fin de la Tempête</h3>
                            <p style="margin: 5px 0;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0;">La tempête de grêle se calme et disparaît.</p>
                        </div>
                    `,
                    rollMode: game.settings.get('core', 'rollMode')
                });
            } else {
                ui.notifications.error(SPELL_CONFIG.messages.error);
            }
            return;
        } else if (management.action === 'recast') {
            // Arrêter l'ancienne tempête et continuer vers une nouvelle
            await stopHail();
        }
    }

    // Nouvelle tempête - Dialog de configuration
    const spellConfig = await showHailConfigDialog();
    if (!spellConfig) return;

    const { protection, protectedAllies } = spellConfig;

    // ===== CALCULS DES COÛTS ET DÉGÂTS =====
    const damage = Math.ceil(characteristicInfo.final / 2);
    const avoidDifficulty = characteristicInfo.final * 4;
    const maxProtectedAllies = Math.ceil(characteristicInfo.final / 2);

    const baseCost = SPELL_CONFIG.manaCost;
    const focusReduction = currentStance === 'focus' ? Math.floor(baseCost / 2) : 0;
    let totalCost = baseCost - focusReduction;

    const protectionCost = 3;
    if (protection === 'all') {
        const additionalCost = currentStance === 'focus' ? 0 : protectionCost;
        totalCost += additionalCost;
    }

    // ===== LANCEMENT DE LA TEMPÊTE =====
    const hailResult = await startHail();
    if (!hailResult.success) {
        ui.notifications.error("⚠️ Erreur lors du démarrage de la tempête de grêle.");
        return;
    }

    ui.notifications.info(SPELL_CONFIG.messages.started);

    // ===== PRÉPARATION DU MESSAGE DE CHAT =====
    const protectedActorIds = new Set();

    // Ajouter Ora (toujours protégée)
    protectedActorIds.add(caster.actor.id);

    // Gestion de la protection des alliés
    let protectionInfo = "";
    if (protection === 'specific' && protectedAllies.length > 0) {
        const protectedAllyNames = [];
        for (const allyName of protectedAllies) {
            const allyActor = findActorById(SPELL_CONFIG.allies[allyName]);
            if (allyActor) {
                protectedActorIds.add(allyActor.id);
                protectedAllyNames.push(allyName);
            }
        }
        if (protectedAllyNames.length > 0) {
            protectionInfo = `<p><strong>🛡️ Alliés protégés :</strong> ${protectedAllyNames.join(', ')}</p>`;
        }
    } else if (protection === 'all') {
        const allProtectedAllies = [];
        let protectedCount = 0;
        for (const [allyName, actorId] of Object.entries(SPELL_CONFIG.allies)) {
            if (protectedCount < maxProtectedAllies) {
                const allyActor = findActorById(actorId);
                if (allyActor) {
                    protectedActorIds.add(allyActor.id);
                    allProtectedAllies.push(allyName);
                    protectedCount++;
                }
            }
        }
        if (allProtectedAllies.length > 0) {
            protectionInfo = `<p><strong>🛡️ Tous les alliés protégés :</strong> ${allProtectedAllies.join(', ')} (max ${maxProtectedAllies})</p>`;
        }
    } else {
        protectionInfo = `<p><strong>🛡️ Protection :</strong> Ora uniquement</p>`;
    }

    // ===== COMPTER LES TOKENS AFFECTÉS =====
    const allTokens = canvas.tokens.placeables.filter(token => token.actor);
    const affectedTokens = allTokens.filter(token => !protectedActorIds.has(token.actor.id));
    const protectedTokens = allTokens.filter(token => protectedActorIds.has(token.actor.id));

    // ===== MESSAGE DANS LE CHAT =====
    const costInfo = totalCost > 0 ?
        `<strong>Coût:</strong> ${totalCost} mana${currentStance === 'focus' && focusReduction > 0 ? ` (${baseCost} - ${focusReduction} Focus${protection === 'all' ? ', protection gratuite' : ''})` : ''}` :
        `<strong>Coût:</strong> GRATUIT (Position Focus)`;

    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: `
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e0f6ff, #ffffff); border-radius: 8px; border: 2px solid #87ceeb; margin: 8px 0;">
                <h3 style="margin: 0; color: #4682b4;">🌨️ Tempête de Grêle</h3>
                <div style="margin: 5px 0;">
                    <strong>Lanceur:</strong> ${actor.name} | ${costInfo}
                </div>
                <div style="margin: 10px 0; padding: 10px; background: #87ceeb22; border-radius: 4px;">
                    <div style="font-size: 1.1em; font-weight: bold; color: #4682b4;">
                        🌨️ Une violente tempête de grêle s'abat sur le terrain !
                    </div>
                    <div style="margin-top: 8px; font-size: 0.95em;">
                        <p><strong>⚡ Dégâts :</strong> ${damage} points</p>
                        <p><strong>🎯 Évitement :</strong> Jet d'Agilité difficulté ${avoidDifficulty}</p>
                        ${protectionInfo}
                        <p><strong>📊 Tokens :</strong> ${affectedTokens.length} affectés, ${protectedTokens.length} protégés</p>
                    </div>
                </div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    Zone: Toute la scène | Les tokens protégés évitent automatiquement les dégâts
                </div>
            </div>
        `,
        rollMode: game.settings.get('core', 'rollMode')
    });

})();
