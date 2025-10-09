/**
 * Substitution d'ombre - Moctei (Mage des Ombres)
 *
 * Un clone d'ombre apparaît et prends le coup à la place de Moctei.
 * Sort d'esquive avec coûts croissants non focusables.
 *
 * - Coûts : 1ère: 3 mana, 2ème: 5 mana, 3ème: 8 mana, 4ème: 12 mana (non focusable)
 * - Caractéristique : Dextérité + 5 dés, garde les Dextérité meilleurs
 * - Formule : {Dextérité+5}d7kh{Dextérité} (keep highest)
 * - Timing : Avant attaque = coût actuel, Après attaque = coût suivant mais +1 utilisation seulement
 * - Effet visuel : Clone de Moctei avec tinte violette et opacité, décalé de 0.5 case
 * - Gestion : Effet "Substitution d'ombre" avec compteur d'utilisations (statusCounter visible)
 *
 * Usage : Sélectionner le token de Moctei et lancer la macro.
 * L'effet persistant suit automatiquement les utilisations suivantes.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Substitution d'ombre",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        spellLevel: 2,
        isDirect: true,
        isFocusable: false, // Non focusable
        hasNoDamage: true, // Sort d'esquive, pas de dégâts

        // Coûts croissants
        manaCosts: [3, 5, 8, 12], // 1ère, 2ème, 3ème, 4ème utilisation

        // Bonus de dés d'esquive
        dodgeBonusDice: 5,

        // Configuration de l'effet de suivi
        trackingEffect: {
            name: "Substitution d'ombre",
            icon: "icons/creatures/unholy/shadow-spirit-purple.webp",
            description: "Compteur d'utilisations pour Substitution d'ombre"
        },

        // Animation du clone
        cloneAnimation: {
            duration: 3000,
            fadeIn: 500,
            fadeOut: 500,
            offsetDistance: 0.5, // Cases de décalage
            tint: "#8A2BE2", // Tinte violette
            opacity: 0.9,
            scale: 0.15
        },

        animations: {
            cast: "jb2a_patreon.misty_step.01.purple", // Animation d'invocation
            sound: null
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le token de Moctei !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }
    const currentStance = getCurrentStance(actor);

    // Active effect bonuses
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            if (effect.flags && typeof effect.flags === 'object') {
                for (const [key, value] of Object.entries(effect.flags)) {
                    if (key === flagKey && typeof value === 'object' && value.value !== undefined) {
                        totalBonus += value.value;
                    }
                }
            }
        }
        return totalBonus;
    }

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée !`);
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

    // ===== CHECK EXISTING SUBSTITUTION EFFECT =====
    const existingSubstitution = actor.effects.find(e => e.name === SPELL_CONFIG.trackingEffect.name);
    const currentUsageLevel = existingSubstitution ? (existingSubstitution.flags?.statuscounter?.value || 1) : 1;

    // Vérifier si on a atteint la limite
    if (currentUsageLevel > SPELL_CONFIG.manaCosts.length) {
        ui.notifications.error(`Vous avez déjà utilisé ${SPELL_CONFIG.name} ${SPELL_CONFIG.manaCosts.length} fois ! Impossible de l'utiliser à nouveau.`);
        return;
    }

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const currentCost = SPELL_CONFIG.manaCosts[currentUsageLevel - 1];
        const nextCost = currentUsageLevel < SPELL_CONFIG.manaCosts.length ?
            SPELL_CONFIG.manaCosts[currentUsageLevel] : "Aucune";

        const usageInfo = existingSubstitution ?
            `<div style="color: #4a148c; font-weight: bold; margin: 10px 0; padding: 8px; background: #f3e5f5; border-radius: 4px;">
                📊 Utilisations précédentes : ${currentUsageLevel - 1}
                <br><small>Cette utilisation sera la ${currentUsageLevel}ème</small>
            </div>` :
            `<div style="color: #2e7d32; font-weight: bold; margin: 10px 0; padding: 8px; background: #e8f5e8; border-radius: 4px;">
                ✨ Première utilisation du sort !
            </div>`;

        const costInfo = `
            <div style="margin: 10px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                <strong>💰 Coûts du sort :</strong>
                <div style="font-size: 0.9em; margin-top: 5px;">
                    <div style="color: ${currentUsageLevel === 1 ? '#d32f2f' : '#666'}; ${currentUsageLevel === 1 ? 'font-weight: bold;' : ''}">1ère utilisation : 3 mana</div>
                    <div style="color: ${currentUsageLevel === 2 ? '#d32f2f' : '#666'}; ${currentUsageLevel === 2 ? 'font-weight: bold;' : ''}">2ème utilisation : 5 mana</div>
                    <div style="color: ${currentUsageLevel === 3 ? '#d32f2f' : '#666'}; ${currentUsageLevel === 3 ? 'font-weight: bold;' : ''}">3ème utilisation : 8 mana</div>
                    <div style="color: ${currentUsageLevel === 4 ? '#d32f2f' : '#666'}; ${currentUsageLevel === 4 ? 'font-weight: bold;' : ''}">4ème utilisation : 12 mana</div>
                </div>
            </div>
        `;

        return new Promise(resolve => {
            new Dialog({
                title: `🌑 ${SPELL_CONFIG.name}`,
                content: `
                    <div style="margin-bottom: 15px;">
                        <h3 style="border-bottom: 2px solid #4a148c; color: #4a148c;">${SPELL_CONFIG.name}</h3>
                        <p><strong>Lanceur:</strong> ${actor.name}</p>
                        <p><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})</p>
                        ${usageInfo}
                        ${costInfo}

                        <div style="margin: 10px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                            <strong>📝 Effet du sort :</strong>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                <li>🎲 <strong>Jet d'esquive :</strong> {${characteristicInfo.final}+${SPELL_CONFIG.dodgeBonusDice}}d7kh${characteristicInfo.final}</li>
                                <li>👤 <strong>Clone d'ombre :</strong> Apparaît pour prendre le coup</li>
                                <li>⏰ <strong>Timing :</strong> Avant/Après l'attaque adversaire</li>
                                <li>📈 <strong>Coûts croissants :</strong> Non focusable</li>
                            </ul>
                        </div>

                        <div style="margin: 15px 0; padding: 12px; background: #fff8e1; border-radius: 4px; border: 2px solid #ff9800;">
                            <h4 style="margin: 0 0 10px 0; color: #f57c00;">⏰ Timing du sort</h4>
                            <label style="display: flex; align-items: center; margin-bottom: 8px;">
                                <input type="radio" name="timing" value="before" checked style="margin-right: 8px;">
                                <span><strong>Avant l'attaque adversaire</strong> - Coût : ${currentCost} mana</span>
                            </label>
                            <label style="display: flex; align-items: center;">
                                <input type="radio" name="timing" value="after" style="margin-right: 8px;">
                                <span><strong>Après l'attaque adversaire</strong> - Coût : ${nextCost !== "Aucune" ? nextCost + " mana" : "Impossible"}</span>
                            </label>
                            <div style="margin-top: 8px; font-size: 0.9em; color: #e65100; font-style: italic;">
                                ⚠️ Si lancé après l'attaque, coûte plus cher mais ne compte que +1 utilisation
                            </div>
                        </div>

                        <div style="margin: 10px 0;">
                            <label for="dodgeBonus" style="font-weight: bold;">Bonus d'Esquive Manuel :</label>
                            <input type="number" id="dodgeBonus" value="0" min="0" max="10" style="width: 60px; margin-left: 5px;">
                            <small style="color: #666; margin-left: 10px;">dés supplémentaires</small>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "🌑 Lancer",
                        callback: (html) => {
                            const dodgeBonus = parseInt(html.find('#dodgeBonus').val()) || 0;
                            const timing = html.find('input[name="timing"]:checked').val();

                            // Vérifier si le timing "after" est possible
                            if (timing === "after" && nextCost === "Aucune") {
                                ui.notifications.error("Impossible de lancer le sort après l'attaque : nombre maximum d'utilisations atteint !");
                                resolve(null);
                                return;
                            }

                            resolve({ dodgeBonus, timing });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast"
            }, {
                width: 520,
                height: "auto"
            }).render(true);
        });
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }
    const { dodgeBonus, timing } = userConfig;

    // ===== CALCULATE FINAL COST AND USAGE LEVEL =====
    let finalCost, finalUsageLevel;

    if (timing === "before") {
        finalCost = SPELL_CONFIG.manaCosts[currentUsageLevel - 1];
        finalUsageLevel = currentUsageLevel + 1;
    } else { // after
        finalCost = SPELL_CONFIG.manaCosts[currentUsageLevel]; // Coût suivant
        finalUsageLevel = currentUsageLevel + 1; // Mais ne compte que +1
    }

    // ===== ANIMATIONS (Clone d'ombre) =====
    async function playCloneAnimation() {
        if (!caster.document?.texture?.src) {
            console.warn("[Moctei] No token texture found for clone animation");
            return;
        }

        const seq = new Sequence();

        // Animation d'invocation
        if (SPELL_CONFIG.animations.cast) {
            seq.effect()
                .file(SPELL_CONFIG.animations.cast)
                .attachTo(caster)
                .scale(0.8)
                .duration(1500)
                .fadeOut(500)
                .belowTokens();
        }

        // Clone d'ombre
        const gridSize = canvas.grid.size;
        const offsetX = SPELL_CONFIG.cloneAnimation.offsetDistance * gridSize;
        const offsetY = 0;

        seq.effect()
            .file(caster.document.texture.src)
            .attachTo(caster, { offset: { x: offsetX, y: offsetY } })
            .scale(SPELL_CONFIG.cloneAnimation.scale)
            .opacity(SPELL_CONFIG.cloneAnimation.opacity)
            .tint(SPELL_CONFIG.cloneAnimation.tint)
            .duration(SPELL_CONFIG.cloneAnimation.duration)
            .fadeIn(SPELL_CONFIG.cloneAnimation.fadeIn)
            .fadeOut(SPELL_CONFIG.cloneAnimation.fadeOut)
            .name(`shadow-clone-${caster.id}`)
            .zIndex(1000); // Au-dessus des autres effets

        await seq.play();
    }

    await playCloneAnimation();

    // ===== DODGE ROLL =====
    const totalDodgeDice = characteristicInfo.final + SPELL_CONFIG.dodgeBonusDice + dodgeBonus;
    const keepHighest = characteristicInfo.final;

    // Formule Foundry : {total}d7kh{keep}
    const dodgeRoll = new Roll(`${totalDodgeDice}d7kh${keepHighest}`);
    await dodgeRoll.evaluate({ async: true });

    // ===== UPDATE/CREATE TRACKING EFFECT =====
    if (existingSubstitution) {
        // Mettre à jour l'effet existant
        const updateData = {
            flags: {
                ...existingSubstitution.flags,
                statuscounter: { value: finalUsageLevel, visible: true }
            },
            description: `${SPELL_CONFIG.trackingEffect.description} - Prochaine utilisation : ${finalUsageLevel}/${SPELL_CONFIG.manaCosts.length}`
        };

        await existingSubstitution.update(updateData);
        console.log(`[Moctei] Updated substitution tracking effect to level ${finalUsageLevel}`);
    } else {
        // Créer un nouvel effet de suivi
        const trackingEffectData = {
            name: SPELL_CONFIG.trackingEffect.name,
            icon: SPELL_CONFIG.trackingEffect.icon,
            description: `${SPELL_CONFIG.trackingEffect.description} - Prochaine utilisation : ${finalUsageLevel}/${SPELL_CONFIG.manaCosts.length}`,
            duration: { seconds: 86400 }, // 24h
            flags: {
                world: {
                    shadowSubstitutionLevel: finalUsageLevel,
                    spellName: SPELL_CONFIG.name
                },
                statuscounter: { value: finalUsageLevel, visible: true }
            }
        };

        try {
            await actor.createEmbeddedDocuments("ActiveEffect", [trackingEffectData]);
            console.log(`[Moctei] Created substitution tracking effect at level ${finalUsageLevel}`);
        } catch (error) {
            console.error(`[Moctei] Error creating tracking effect:`, error);
            ui.notifications.error("Erreur lors de la création de l'effet de suivi !");
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const timingText = timing === "before" ? "Avant l'attaque adversaire" : "Après l'attaque adversaire";
        const timingColor = timing === "before" ? "#2e7d32" : "#f57c00";

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de Dextérité: +${characteristicInfo.effectBonus}</div>
            </div>` : '';

        const bonusInfo = dodgeBonus > 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>⚡ Bonus Manuel d'Esquive: +${dodgeBonus} dés</div>
            </div>` : '';

        const dodgeDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #4a148c; font-weight: bold;">🎲 ESQUIVE: ${dodgeRoll.total}</div>
                <div style="font-size: 0.9em; color: #666;">Formule: ${totalDodgeDice}d7kh${keepHighest} (${totalDodgeDice} dés, garde les ${keepHighest} meilleurs)</div>
            </div>
        `;

        const timingDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 8px; background: ${timing === "before" ? "#e8f5e8" : "#fff3e0"}; border-radius: 4px;">
                <div style="font-size: 1.1em; color: ${timingColor}; font-weight: bold;">⏰ ${timingText}</div>
                <div style="font-size: 0.9em; color: #666;">Coût: ${finalCost} mana (non focusable)</div>
            </div>
        `;

        const usageDisplay = `
            <div style="margin: 8px 0; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                <div style="font-weight: bold; color: #1976d2;">📊 Suivi des utilisations :</div>
                <div style="font-size: 0.9em; margin: 5px 0;">
                    <div>👤 <strong>Clone d'ombre invoqué</strong> - Prend le coup à la place de Moctei</div>
                    <div>📈 <strong>Prochaine utilisation :</strong> ${finalUsageLevel}/${SPELL_CONFIG.manaCosts.length} (${finalUsageLevel <= SPELL_CONFIG.manaCosts.length ? SPELL_CONFIG.manaCosts[finalUsageLevel - 1] + " mana" : "Aucune"})</div>
                </div>
            </div>
        `;

        return `
            <div style="border: 2px solid #4a148c; border-radius: 8px; padding: 10px; background: linear-gradient(135deg, #f8f4ff 0%, #f0e8ff 100%);">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #4a148c; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                        🌑 ${SPELL_CONFIG.name}
                    </h3>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Utilisation:</strong> ${currentUsageLevel}/${SPELL_CONFIG.manaCosts.length}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-around; margin: 10px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">DEXTÉRITÉ</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #4a148c;">${characteristicInfo.final}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">DÉS BONUS</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #4a148c;">+${SPELL_CONFIG.dodgeBonusDice}</div>
                    </div>
                </div>

                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${timingDisplay}
                ${dodgeDisplay}
                ${usageDisplay}
            </div>
        `;
    }

    // Send dodge roll to chat
    await dodgeRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createFlavor(),
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const timingText = timing === "before" ? "avant" : "après";
    const nextUsageText = finalUsageLevel <= SPELL_CONFIG.manaCosts.length ?
        ` Prochaine: ${SPELL_CONFIG.manaCosts[finalUsageLevel - 1]} mana` : " (Dernière utilisation)";

    ui.notifications.info(`🌑 ${SPELL_CONFIG.name} lancée !${stanceInfo} Clone d'ombre invoqué ${timingText} l'attaque. Esquive: ${dodgeRoll.total}. Coût: ${finalCost} mana.${nextUsageText}`);

})();
