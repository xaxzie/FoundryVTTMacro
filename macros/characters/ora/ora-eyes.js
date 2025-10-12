/**
 * Ora Eyes - Active Effects Management
 *
 * Ora active ses yeux mystiques pour donner des bonus à elle-même et à ses alliés.
 *
 * Effets pour Ora :
 * - +2 Sens (automatique)
 * - +3 Dégâts OU +1 Esprit (au choix)
 *
 * Effets pour les Alliés :
 * - +3 Dégâts (automatique)
 *
 * Alliés supportés :
 * - Raynart
 * - Moctei
 * - Yunyun
 * - Léo
 *
 * Usage : sélectionner le token d'Ora et lancer la macro
 */

(async () => {
    // ===== CONFIGURATION =====
    const EFFECT_CONFIG = {
        name: "Ora Eyes",

        allies: {
            "Raynart": "4bandVHr1d92RYuL",
            "Moctei": "RTwQuERFkkNPk4ni",
            "Yunyun": "E0B1mjYMdX1gqzvh",
            "Léo": "0w7rtAdrpd3lPkN2"
        },

        effects: {
            oraSens: {
                name: "Ora Eyes - Sens Accru",
                icon: "icons/svg/eye.svg",
                description: "Vision mystique d'Ora (+2 Sens)",
                duration: { seconds: 84600 }, // Permanent jusqu'à suppression manuelle
                flags: {
                    world: {
                        oraEyes: true,
                        effectType: "oraSens",
                        caster: "ORA_CASTER_ID"
                    },
                    sens: { value: 2 }
                },
                changes: [],
                tint: "#2000d3"
            },
            oraDamage: {
                name: "Ora Eyes",
                icon: "icons/svg/eye.svg",
                description: "Pouvoir destructeur d'Ora (+3 Dégâts)",
                duration: { seconds: 84600 },
                flags: {
                    world: {
                        oraEyes: true,
                        effectType: "oraDamage",
                        caster: "ORA_CASTER_ID"
                    },
                    damage: { value: 3 }
                },
                changes: [],
                tint: "#22bbf8"
            },
            oraEsprit: {
                name: "Ora Eyes - Concentration Mystique",
                icon: "icons/svg/eye.svg",
                description: "Concentration renforcée d'Ora (+1 Esprit)",
                duration: { seconds: 84600 },
                flags: {
                    world: {
                        oraEyes: true,
                        effectType: "oraEsprit",
                        caster: "ORA_CASTER_ID"
                    },
                    esprit: { value: 1 }
                },
                changes: [],
                tint: "#9370db"
            },
            allyDamage: {
                name: "Ora Eyes",
                icon: "icons/svg/eye.svg",
                description: "Bénéficie de la vision d'Ora (+3 Dégâts)",
                duration: { seconds: 84600 },
                flags: {
                    world: {
                        oraEyes: true,
                        effectType: "allyDamage",
                        caster: "ORA_CASTER_ID"
                    },
                    damage: { value: 3 }
                },
                changes: [],
                tint: "#22bbf8"
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

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Trouve un acteur par son ID
     */
    function findActorById(actorId) {
        return game.actors.get(actorId);
    }

    /**
     * Vérifie si un acteur a déjà les yeux d'Ora actifs
     */
    function hasOraEyes(targetActor) {
        if (!targetActor) return false;
        return targetActor.effects.contents.some(effect =>
            effect.flags?.world?.oraEyes === true
        );
    }

    /**
     * Récupère tous les effets "Ora Eyes" sur un acteur
     */
    function getOraEyesEffects(targetActor) {
        if (!targetActor) return [];
        return targetActor.effects.contents.filter(effect =>
            effect.flags?.world?.oraEyes === true
        );
    }

    /**
     * Applique un effet sur un acteur avec gestion GM Socket
     */
    async function applyEffectToActor(targetActor, effectConfig, casterId) {
        try {
            // Cloner la configuration et remplacer les placeholders
            const effectData = JSON.parse(JSON.stringify(effectConfig));
            effectData.flags.world.caster = casterId;

            if (targetActor.isOwner) {
                await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            } else {
                if (globalThis.gmSocket) {
                    await globalThis.gmSocket.executeAsGM("createEffectOnActor", targetActor.id, effectData);
                } else {
                    console.warn(`[Ora Eyes] Cannot apply effect to ${targetActor.name} - no GM socket`);
                    return false;
                }
            }

            console.log(`[Ora Eyes] Applied ${effectData.name} to ${targetActor.name}`);
            return true;
        } catch (error) {
            console.error(`[Ora Eyes] Error applying effect to ${targetActor.name}:`, error);
            return false;
        }
    }

    /**
     * Supprime tous les effets "Ora Eyes" d'un acteur
     */
    async function removeOraEyesFromActor(targetActor) {
        const effectsToRemove = getOraEyesEffects(targetActor);
        let removedCount = 0;

        for (const effect of effectsToRemove) {
            try {
                if (targetActor.isOwner) {
                    await effect.delete();
                } else {
                    if (globalThis.gmSocket) {
                        await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetActor.id, effect.id);
                    }
                }
                removedCount++;
                console.log(`[Ora Eyes] Removed ${effect.name} from ${targetActor.name}`);
            } catch (error) {
                console.error(`[Ora Eyes] Error removing effect from ${targetActor.name}:`, error);
            }
        }

        return removedCount;
    }

    /**
     * Désactive tous les yeux (Ora + alliés)
     */
    async function deactivateAllEyes() {
        const confirmDialog = await new Promise((resolve) => {
            new Dialog({
                title: "Désactiver Tous les Yeux",
                content: `<p>Êtes-vous sûr de vouloir désactiver tous les effets "Ora Eyes" ?</p>
                         <p><strong>Ceci supprimera les effets sur :</strong></p>
                         <ul>
                            <li>Ora (${actor.name})</li>
                            ${Object.keys(EFFECT_CONFIG.allies).map(name => {
                                const ally = findActorById(EFFECT_CONFIG.allies[name]);
                                return ally ? `<li>${name} (${ally.name})</li>` : '';
                            }).filter(Boolean).join('')}
                         </ul>`,
                buttons: {
                    confirm: {
                        label: "Confirmer",
                        callback: () => resolve(true)
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(false)
                    }
                }
            }).render(true);
        });

        if (!confirmDialog) return;

        let totalRemoved = 0;
        const results = [];

        // Supprimer les effets d'Ora
        const oraRemoved = await removeOraEyesFromActor(actor);
        if (oraRemoved > 0) {
            results.push(`${actor.name}: ${oraRemoved} effet(s)`);
            totalRemoved += oraRemoved;
        }

        // Supprimer les effets des alliés
        for (const [allyName, actorId] of Object.entries(EFFECT_CONFIG.allies)) {
            const allyActor = findActorById(actorId);
            if (allyActor) {
                const allyRemoved = await removeOraEyesFromActor(allyActor);
                if (allyRemoved > 0) {
                    results.push(`${allyName}: ${allyRemoved} effet(s)`);
                    totalRemoved += allyRemoved;
                }
            }
        }

        if (totalRemoved > 0) {
            ui.notifications.info(`👁️ Tous les yeux désactivés ! Effets supprimés: ${results.join(', ')}`);
        } else {
            ui.notifications.warn("Aucun effet 'Ora Eyes' trouvé à supprimer.");
        }
    }

    // ===== DÉTECTION DES EFFETS EXISTANTS =====
    const existingEffectsOra = hasOraEyes(actor);
    const existingAllies = {};

    for (const [allyName, actorId] of Object.entries(EFFECT_CONFIG.allies)) {
        const allyActor = findActorById(actorId);
        if (allyActor) {
            existingAllies[allyName] = {
                actor: allyActor,
                hasEffect: hasOraEyes(allyActor)
            };
        }
    }

    // ===== DIALOG DE CONFIGURATION =====
    async function showEyesConfigDialog() {
        return new Promise((resolve) => {
            // Construire les options pour les alliés
            const allyOptions = Object.keys(EFFECT_CONFIG.allies).map(allyName => {
                const allyData = existingAllies[allyName];
                if (!allyData) return ''; // Allié non trouvé

                const hasEffect = allyData.hasEffect;
                const checked = !hasEffect; // Par défaut sélectionné sauf s'il a déjà l'effet
                const statusText = hasEffect ? ' <em style="color: #ff6600;">(a déjà les yeux)</em>' : '';

                return `
                    <label>
                        <input type="checkbox" name="ally" value="${allyName}" ${checked ? 'checked' : ''}>
                        <strong>${allyName}</strong> (${allyData.actor.name})${statusText}
                    </label>
                `;
            }).filter(Boolean).join('<br>');

            const oraStatusText = existingEffectsOra ? ' <em style="color: #ff6600;">(a déjà les yeux)</em>' : '';
            const oraChecked = !existingEffectsOra; // Par défaut sélectionné sauf si elle a déjà l'effet

            new Dialog({
                title: "👁️ Activation des Yeux d'Ora",
                content: `
                    <div style="padding: 10px;">
                        <h3>Configuration des Yeux Mystiques</h3>

                        <div style="margin: 15px 0; padding: 10px; border: 1px solid #dc143c; background: #ffe4e1; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #dc143c;">👁️ Ora (${actor.name})</h4>
                            <label>
                                <input type="checkbox" id="oraActive" ${oraChecked ? 'checked' : ''}>
                                <strong>Activer les yeux pour Ora</strong>${oraStatusText}
                            </label>
                            <p style="font-size: 0.9em; margin: 10px 0 5px 20px;"><strong>Bonus automatique:</strong> +2 Sens</p>

                            <div id="oraChoiceDiv" style="margin: 10px 0 0 20px; ${oraChecked ? '' : 'display: none;'}">
                                <p style="font-size: 0.9em; margin: 5px 0;"><strong>Bonus supplémentaire (choisir un) :</strong></p>
                                <label style="margin-left: 20px;">
                                    <input type="radio" name="oraChoice" value="damage" checked>
                                    <strong>+3 Dégâts</strong> (Force destructrice)
                                </label><br>
                                <label style="margin-left: 20px;">
                                    <input type="radio" name="oraChoice" value="esprit">
                                    <strong>+1 Esprit</strong> (Concentration mystique)
                                </label>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; border: 1px solid #ff4500; background: #fff8dc; border-radius: 5px;">
                            <h4 style="margin: 0 0 10px 0; color: #ff4500;">👥 Alliés (+3 Dégâts automatique)</h4>
                            <div id="manaCostWarning" style="margin: 0 0 10px 0; padding: 8px; background: #ffe0b3; border: 1px solid #ff8c00; border-radius: 4px; color: #b8860b; display: none;">
                                <strong>⚡ Coût de Partage:</strong> 6 mana (uniquement si des alliés sont sélectionnés)
                            </div>
                            ${allyOptions || '<p><em>Aucun allié disponible</em></p>'}
                        </div>

                        <div style="margin: 15px 0; padding: 8px; background: #f0f0f0; border-radius: 4px; font-size: 0.9em;">
                            <strong>ℹ️ Note:</strong> Si un personnage a déjà les yeux, il sera désélectionné par défaut pour permettre la suppression.
                        </div>
                    </div>

                    <script>
                        document.getElementById('oraActive').addEventListener('change', function() {
                            const choiceDiv = document.getElementById('oraChoiceDiv');
                            choiceDiv.style.display = this.checked ? 'block' : 'none';
                        });

                        // Gestion de l'affichage du coût de mana pour le partage
                        function updateManaCostDisplay() {
                            const allyCheckboxes = document.querySelectorAll('input[name="ally"]');
                            const manaCostWarning = document.getElementById('manaCostWarning');
                            let hasSelectedAllies = false;

                            allyCheckboxes.forEach(checkbox => {
                                if (checkbox.checked) {
                                    hasSelectedAllies = true;
                                }
                            });

                            manaCostWarning.style.display = hasSelectedAllies ? 'block' : 'none';
                        }

                        // Surveiller les changements sur les checkboxes d'alliés
                        document.querySelectorAll('input[name="ally"]').forEach(checkbox => {
                            checkbox.addEventListener('change', updateManaCostDisplay);
                        });

                        // Affichage initial
                        updateManaCostDisplay();
                    </script>
                `,
                buttons: {
                    confirm: {
                        label: "👁️ Appliquer",
                        callback: (html) => {
                            const oraActive = html.find('#oraActive').prop('checked');
                            const oraChoice = html.find('input[name="oraChoice"]:checked').val() || 'damage';
                            const selectedAllies = [];

                            html.find('input[name="ally"]:checked').each(function() {
                                selectedAllies.push(this.value);
                            });

                            resolve({ oraActive, oraChoice, selectedAllies });
                        }
                    },
                    deactivateAll: {
                        label: "❌ Désactiver Tout",
                        callback: () => {
                            deactivateAllEyes();
                            resolve(null);
                        }
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                }
            }, { width: 500 }).render(true);
        });
    }

    const config = await showEyesConfigDialog();
    if (!config) return;

    const { oraActive, oraChoice, selectedAllies } = config;

    // ===== APPLICATION DES EFFETS =====
    const results = [];
    const errors = [];

    // Gestion d'Ora
    if (oraActive) {
        // Si Ora a déjà les yeux, les supprimer d'abord
        if (existingEffectsOra) {
            const removed = await removeOraEyesFromActor(actor);
            if (removed > 0) {
                results.push(`Ora: ${removed} ancien(s) effet(s) supprimé(s)`);
            }
        }

        // Appliquer les nouveaux effets pour Ora
        const sensSuccess = await applyEffectToActor(actor, EFFECT_CONFIG.effects.oraSens, actor.id);
        const choiceEffect = oraChoice === 'damage' ? EFFECT_CONFIG.effects.oraDamage : EFFECT_CONFIG.effects.oraEsprit;
        const choiceSuccess = await applyEffectToActor(actor, choiceEffect, actor.id);

        if (sensSuccess && choiceSuccess) {
            const bonusText = oraChoice === 'damage' ? '+3 Dégâts' : '+1 Esprit';
            results.push(`Ora: Yeux activés (+2 Sens, ${bonusText})`);
        } else {
            errors.push(`Ora: Erreur lors de l'application`);
        }
    } else if (existingEffectsOra) {
        // Supprimer les yeux d'Ora si elle en avait
        const removed = await removeOraEyesFromActor(actor);
        if (removed > 0) {
            results.push(`Ora: ${removed} effet(s) supprimé(s)`);
        }
    }

    // Gestion des alliés
    for (const [allyName, actorId] of Object.entries(EFFECT_CONFIG.allies)) {
        const allyActor = findActorById(actorId);
        if (!allyActor) continue;

        const isSelected = selectedAllies.includes(allyName);
        const hasEffect = existingAllies[allyName]?.hasEffect;

        if (isSelected) {
            // Si l'allié a déjà l'effet, le supprimer d'abord
            if (hasEffect) {
                const removed = await removeOraEyesFromActor(allyActor);
                if (removed > 0) {
                    results.push(`${allyName}: ${removed} ancien(s) effet(s) supprimé(s)`);
                }
            }

            // Appliquer le nouvel effet
            const success = await applyEffectToActor(allyActor, EFFECT_CONFIG.effects.allyDamage, actor.id);
            if (success) {
                results.push(`${allyName}: Yeux activés (+3 Dégâts)`);
            } else {
                errors.push(`${allyName}: Erreur lors de l'application`);
            }
        } else if (hasEffect) {
            // Supprimer l'effet si l'allié en avait un mais n'est pas sélectionné
            const removed = await removeOraEyesFromActor(allyActor);
            if (removed > 0) {
                results.push(`${allyName}: ${removed} effet(s) supprimé(s)`);
            }
        }
    }

    // ===== NOTIFICATIONS FINALES =====
    if (results.length > 0) {
        ui.notifications.info(`👁️ Yeux d'Ora mis à jour ! ${results.join(', ')}`);
    }

    if (errors.length > 0) {
        ui.notifications.error(`❌ Erreurs: ${errors.join(', ')}`);
    }

    if (results.length === 0 && errors.length === 0) {
        ui.notifications.warn("Aucun changement appliqué.");
    }

    // ===== CHAT MESSAGE =====
    const activeEffects = [];

    if (oraActive) {
        const bonusText = oraChoice === 'damage' ? '+3 Dégâts' : '+1 Esprit';
        activeEffects.push(`👁️ <strong>Ora</strong>: +2 Sens, ${bonusText}`);
    }

    for (const allyName of selectedAllies) {
        activeEffects.push(`👥 <strong>${allyName}</strong>: +3 Dégâts`);
    }

    if (activeEffects.length > 0) {
        // Vérifier si des alliés sont affectés pour afficher le coût de mana
        const hasAllies = selectedAllies.length > 0;
        const manaCostInfo = hasAllies ? ' | <strong>Coût:</strong> 6 mana (partage)' : '';

        const chatContent = `
            <div style="background: linear-gradient(135deg, #ffe4e1, #fff8dc); padding: 12px; border-radius: 8px; border: 2px solid #dc143c; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #dc143c;">👁️ Yeux d'Ora Activés</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name}${manaCostInfo}
                    </div>
                </div>
                <div style="text-align: left; margin: 8px 0; padding: 10px; background: #ffffff; border-radius: 4px; border-left: 4px solid #dc143c;">
                    <h4 style="margin: 0 0 8px 0; color: #dc143c;">Effets Actifs:</h4>
                    ${activeEffects.join('<br>')}
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f0f0; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #666;"><strong>ℹ️ Note:</strong> Les effets sont permanents jusqu'à désactivation manuelle</div>
                </div>
            </div>
        `;

        ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: chatContent,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }

})();
