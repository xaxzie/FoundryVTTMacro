/**
 * Lien de Sang - Robby
 *
 * Robby crée un lien de sang mystique avec ses alliés présents sur le champ de bataille.
 * Ce lien lui permet de sacrifier ses propres Points de Vie pour soigner ses alliés liés.
 *
 * Effets :
 * - Crée un lien sanguin sur les alliés choisis
 * - Robby peut sacrifier jusqu'à [Esprit] PV par tour pour soigner ses alliés liés
 *
 * Alliés supportés (détectés automatiquement sur le canvas) :
 * - Missy
 * - Urgen
 * - Aloha
 *
 * Usage : Sélectionner le token de Robby et lancer la macro.
 *         Choisir d'activer ou désactiver le lien sur chaque allié détecté.
 */

(async () => {
    // ===== CONFIGURATION =====
    const SPELL_CONFIG = {
        name: "Lien de Sang",
        effectName: "Lien de Sang - Robby",
        effectIcon: "icons/magic/light/light-bolt-beam-yellow.webp",
        animation: {
            projectile: "jb2a_patreon.magic_missile.dark_red",
            impact: "jb2a_patreon.impact.001.dark_red"
        },
        allies: {
            "Missy": "L8lonBKAdvqtBs0t",
            "Urgen": "FbN8TV8fB36McnCh",
            "Aloha": "UsdjnjRd1ef71Ltj"
        }
    };

    // ===== VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Robby !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé pour le token sélectionné !");
        return;
    }

    // ===== GET ROBBY'S ESPRIT VALUE =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) return 3;

        const baseValue = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        return Math.max(1, baseValue - injuryStacks);
    }

    const espritValue = getCharacteristicValue(actor, "esprit");

    // ===== DETECT ALLIES ON CANVAS =====
    /**
     * Checks if an ally actor is currently represented by a token on the canvas
     * Returns { actor, token } if found, null otherwise
     */
    function findAllyOnCanvas(actorId) {
        const allyToken = canvas.tokens.placeables.find(t =>
            t.actor?.id === actorId && t.document.disposition !== -1 // Exclude hostile tokens (just in case)
        );
        if (!allyToken) return null;
        return {
            actor: allyToken.actor,
            token: allyToken
        };
    }

    // Build list of only allies currently on canvas
    const detectedAllies = {};
    for (const [name, actorId] of Object.entries(SPELL_CONFIG.allies)) {
        const found = findAllyOnCanvas(actorId);
        if (found) {
            detectedAllies[name] = found;
        }
    }

    if (Object.keys(detectedAllies).length === 0) {
        ui.notifications.warn("⚠️ Aucun allié de Robby n'est présent sur le champ de bataille !");
        return;
    }

    // ===== CHECK EXISTING BOND EFFECTS =====
    function hasBondEffect(targetActor) {
        return targetActor.effects.contents.some(e =>
            e.flags?.world?.lieSangRobby === true
        );
    }

    function getBondEffect(targetActor) {
        return targetActor.effects.contents.find(e =>
            e.flags?.world?.lieSangRobby === true
        );
    }

    // ===== BUILD DIALOG =====
    const allyRows = Object.entries(detectedAllies).map(([name, { actor: allyActor, token }]) => {
        const hasEffect = hasBondEffect(allyActor);
        const statusLabel = hasEffect
            ? `<span style="color:#2e7d32; font-weight:bold;">✅ Lié</span>`
            : `<span style="color:#999;">❌ Non lié</span>`;
        const tokenImg = token.document.texture.src;

        return `
            <div id="ally-row-${name}" style="display:flex; align-items:center; gap:12px; padding:10px 12px; margin:6px 0;
                background: ${hasEffect ? 'linear-gradient(135deg, #fce4ec, #f8bbd9)' : 'linear-gradient(135deg, #f5f5f5, #eeeeee)'};
                border:2px solid ${hasEffect ? '#e91e63' : '#ccc'}; border-radius:8px;">
                <img src="${tokenImg}" style="width:40px;height:40px;border-radius:50%;border:2px solid #8b0000;object-fit:cover;" />
                <div style="flex-grow:1;">
                    <strong style="font-size:1.05em;">${name}</strong><br>
                    <small style="color:#666;">Statut actuel : ${statusLabel}</small>
                </div>
                <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                        <input type="radio" name="ally-${name}" value="activate"
                            ${!hasEffect ? 'checked' : ''} style="accent-color:#8b0000;" />
                        <span style="color:#8b0000; font-weight:bold;">🩸 Activer</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                        <input type="radio" name="ally-${name}" value="deactivate"
                            ${hasEffect ? 'checked' : ''} style="accent-color:#555;" />
                        <span style="color:#555;">✂️ Désactiver</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                        <input type="radio" name="ally-${name}" value="nochange"
                            ${!hasEffect ? '' : ''} />
                        <span style="color:#999; font-size:0.9em;">Pas de changement</span>
                    </label>
                </div>
            </div>
        `;
    }).join('');

    const dialogContent = `
        <div style="padding:10px 5px;">
            <div style="text-align:center; margin-bottom:16px; padding:14px;
                background:linear-gradient(135deg, #1a0000, #3d0000); border-radius:10px;">
                <h3 style="margin:0; color:#ff6666; text-shadow:0 0 10px #ff0000;">🩸 Lien de Sang</h3>
                <div style="color:#ffaaaa; margin-top:6px; font-size:0.9em;">
                    <strong>Lanceur :</strong> ${actor.name} &nbsp;|&nbsp;
                    <strong>Esprit :</strong> ${espritValue}
                </div>
                <div style="color:#ff8888; margin-top:4px; font-size:0.85em; font-style:italic;">
                    Sacrifice jusqu'à ${espritValue} PV/tour pour soigner vos alliés liés
                </div>
            </div>

            <p style="color:#555; margin:0 0 10px 0; font-size:0.9em; text-align:center;">
                Alliés détectés sur le champ de bataille :
            </p>

            ${allyRows}
        </div>
    `;

    const choices = await new Promise((resolve) => {
        new Dialog({
            title: "🩸 Lien de Sang",
            content: dialogContent,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-heart"></i>',
                    label: "Confirmer",
                    callback: (html) => {
                        const result = {};
                        for (const name of Object.keys(detectedAllies)) {
                            const val = html.find(`input[name="ally-${name}"]:checked`).val();
                            result[name] = val || "nochange";
                        }
                        resolve(result);
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "confirm",
            close: () => resolve(null)
        }, { width: 480 }).render(true);
    });

    if (!choices) {
        ui.notifications.info("❌ Lien de Sang annulé.");
        return;
    }

    // ===== APPLY / REMOVE EFFECTS =====
    async function applyEffectToAlly(targetActor, targetToken) {
        const effectData = {
            name: SPELL_CONFIG.effectName,
            icon: SPELL_CONFIG.effectIcon,
            description: `Lié au sang de ${actor.name}. ${actor.name} peut sacrifier jusqu'à ${espritValue} PV par tour pour soigner cet allié.`,
            origin: actor.uuid,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    lieSangRobby: true,
                    casterId: actor.id,
                    casterEsprit: espritValue
                }
            }
        };

        if (targetActor.isOwner) {
            await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        } else if (game.modules.get("socketlib")?.active && globalThis.gmSocket) {
            await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetToken.id, effectData);
        } else {
            ui.notifications.warn(`⚠️ Impossible d'appliquer l'effet sur ${targetActor.name} – droits insuffisants.`);
        }
    }

    async function removeEffectFromAlly(targetActor, targetToken) {
        const effect = getBondEffect(targetActor);
        if (!effect) return;

        if (targetActor.isOwner) {
            await effect.delete();
        } else if (game.modules.get("socketlib")?.active && globalThis.gmSocket) {
            await globalThis.gmSocket.executeAsGM("deleteEffectOnActor", targetToken.id, effect.id);
        } else {
            ui.notifications.warn(`⚠️ Impossible de retirer l'effet sur ${targetActor.name} – droits insuffisants.`);
        }
    }

    // ===== ANIMATION: BLOOD PROJECTILE =====
    async function playBondAnimation(targetToken) {
        try {
            if (typeof Sequence === "undefined") {
                console.warn("[DEBUG] Lien de Sang: Sequencer non disponible.");
                return;
            }

            await new Sequence()
                .effect()
                .file(SPELL_CONFIG.animation.projectile)
                .atLocation(caster)
                .stretchTo(targetToken)
                .tint("#8b0000")
                .scale(0.6)
                .waitUntilFinished(-400)
                .effect()
                .file(SPELL_CONFIG.animation.impact)
                .atLocation(targetToken)
                .tint("#8b0000")
                .scale(0.7)
                .play();
        } catch (err) {
            console.warn("[DEBUG] Lien de Sang: Erreur animation :", err);
        }
    }

    // ===== PROCESS ALL CHOICES =====
    const activated = [];
    const deactivated = [];
    const unchanged = [];

    for (const [name, choice] of Object.entries(choices)) {
        const { actor: allyActor, token: allyToken } = detectedAllies[name];
        const alreadyBound = hasBondEffect(allyActor);

        if (choice === "activate") {
            if (alreadyBound) {
                unchanged.push(name); // Already has it, skip
            } else {
                await playBondAnimation(allyToken);
                await applyEffectToAlly(allyActor, allyToken);
                activated.push(name);
            }
        } else if (choice === "deactivate") {
            if (!alreadyBound) {
                unchanged.push(name); // Already unbound, skip
            } else {
                await removeEffectFromAlly(allyActor, allyToken);
                deactivated.push(name);
            }
        } else {
            unchanged.push(name);
        }
    }

    // ===== CHAT MESSAGE =====
    const activatedList = activated.length > 0
        ? `<div style="margin:8px 0;">
               <strong style="color:#8b0000;">🩸 Lien activé sur :</strong><br>
               ${activated.map(n => `• <strong>${n}</strong>`).join('<br>')}
           </div>`
        : '';

    const deactivatedList = deactivated.length > 0
        ? `<div style="margin:8px 0;">
               <strong style="color:#555;">✂️ Lien retiré de :</strong><br>
               ${deactivated.map(n => `• <strong>${n}</strong>`).join('<br>')}
           </div>`
        : '';

    const allCurrentlyBound = Object.entries(detectedAllies)
        .filter(([name, { actor: a }]) => hasBondEffect(a))
        .map(([name]) => name);

    const currentBondList = allCurrentlyBound.length > 0
        ? `<div style="margin-top:10px; padding:8px 12px; background:#fff0f0; border-radius:6px; border-left:4px solid #e91e63;">
               <strong style="color:#e91e63;">❤️ Alliés liés actuellement :</strong><br>
               ${allCurrentlyBound.map(n => `• <strong>${n}</strong>`).join('<br>')}
           </div>`
        : `<div style="margin-top:10px; padding:8px 12px; background:#f0f0f0; border-radius:6px; border-left:4px solid #999;">
               <em style="color:#999;">Aucun allié lié actuellement.</em>
           </div>`;

    if (activated.length > 0 || deactivated.length > 0) {
        const chatContent = `
            <div style="background:linear-gradient(135deg, #1a0000, #3d0000); padding:14px; border-radius:10px; border:2px solid #8b0000; margin:8px 0;">
                <div style="text-align:center; margin-bottom:12px;">
                    <h3 style="margin:0; color:#ff6666; text-shadow:0 0 8px #ff0000;">🩸 Lien de Sang</h3>
                    <div style="color:#ffaaaa; margin-top:4px; font-size:0.9em;">
                        <strong>Lanceur :</strong> ${actor.name}
                    </div>
                </div>

                <div style="background:rgba(255,255,255,0.08); padding:12px; border-radius:8px; margin:8px 0; color:#ffcccc;">
                    ${activatedList}
                    ${deactivatedList}
                    ${currentBondList}
                </div>

                <div style="margin-top:10px; padding:10px; background:rgba(139,0,0,0.4); border-radius:6px; border:1px solid #ff4444; text-align:center;">
                    <div style="color:#ffaaaa; font-size:0.9em;">
                        💉 <strong>${actor.name}</strong> peut sacrifier jusqu'à
                        <strong style="color:#ff6666; font-size:1.1em;">${espritValue} PV</strong>
                        par tour pour soigner ses alliés liés.
                    </div>
                    <div style="color:#ffccaa; font-size:0.85em; margin-top:6px;">
                        🔒 <strong>Coût :</strong> 1 mana réservé par cible liée
                        (actuellement : <strong>${allCurrentlyBound.length} mana réservé${allCurrentlyBound.length > 1 ? 's' : ''}</strong>)
                    </div>
                </div>
            </div>
        `;

        await ChatMessage.create({
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: chatContent,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }

    // ===== FINAL NOTIFICATION =====
    const parts = [];
    if (activated.length > 0) parts.push(`✅ Activé : ${activated.join(', ')}`);
    if (deactivated.length > 0) parts.push(`✂️ Retiré : ${deactivated.join(', ')}`);
    if (parts.length === 0) {
        ui.notifications.info("ℹ️ Lien de Sang : Aucun changement appliqué.");
    } else {
        ui.notifications.info(`🩸 Lien de Sang – ${parts.join(' | ')}`);
    }

    console.log(`[DEBUG] Lien de Sang complete – Activated: ${activated.join(', ')} | Deactivated: ${deactivated.join(', ')}`);
})();
