/**
 * Invocation de dagues - Moctei (Mage des Ombres)
 *
 * Sort de création d'armes d'ombre permettant des attaques rapprochées et à distance.
 *
 * FONCTIONNALITÉS :
 *
 * MODE NORMAL (1 mana) :
 * - Coût : 1 point de mana (focalisable)
 * - Niveau de sort : 1
 * - Toucher : Dextérité
 * - Dégâts rapprochés : 2D4 + dextérité (≤ 2 cases)
 * - Dégâts à distance : 1D4 + dextérité (> 2 cases)
 * - Usage unique
 *
 * MODE LONGUE DURÉE (2 mana) :
 * - Coût : 2 points de mana (focalisable)
 * - Crée l'effet "Dagues d'ombre" sur Moctei
 * - Si l'effet est présent : attaques gratuites (0 mana)
 * - L'effet se dissipe après une attaque à distance
 *
 * MÉCANIQUES :
 * - Détection automatique de la distance cible
 * - Menu unifié de sélection (mode + cible)
 * - Animations différenciées selon la distance
 * - Gestion de l'effet longue durée
 * - Effets visuels d'ombre sur Moctei
 *
 * Usage : Sélectionner le token de Moctei et lancer la macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Invocation de dagues",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        spellLevel: 1,
        isDirect: true,
        isFocusable: true,
        hasNoDamage: false, // Ce sort fait des dégâts
        isMultiTarget: false,

        // Modes de lancement
        modes: {
            normal: {
                name: "Usage Normal",
                manaCost: 1,
                description: "Usage unique - 2D4+Dex (proche) ou 1D4+Dex (loin)",
                createsPersistentEffect: false
            },
            longDuration: {
                name: "Longue Durée",
                manaCost: 2,
                description: "Crée l'effet 'Dagues d'ombre' - Attaques gratuites jusqu'à usage à distance",
                createsPersistentEffect: false,
                effectName: "Dagues d'ombre"
            }
        },

        // Distance pour différencier proche/loin
        maxCloseRange: 2, // En cases de grille

        // Dégâts selon la distance
        damage: {
            close: {
                dice: "2d4",
                bonus: "dexterite",
                description: "Frappe rapprochée"
            },
            ranged: {
                dice: "1d4",
                bonus: "dexterite",
                description: "Dague lancée"
            }
        },

        // Animations selon le mode et la distance
        animations: {
            cast: {
                close: "jb2a.dagger.melee.02.white",
                ranged: "jb2a.dagger.throw.01.white",
                caster: "jb2a.smoke.puff.centered.grey.0" // Animation d'ombre sur Moctei
            },
            impact: {
                close: "jb2a_patreon.impact.001.dark_purple",
                ranged: "jb2a_patreon.impact.001.dark_purple"
            },
            longDurationEffect: {
                file: "jb2a_patreon.extras.tmfx.runes.circle.simple.conjuration",
                scale: 0.4,
                fadeOut: 2000,
                persistent: true,
                sequencerName: "MocteiShadowDaggers"
            }
        },

        targeting: {
            range: 300, // Portée maximale
            color: "#4a148c", // Couleur violette sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        },

        // Configuration de l'effet longue durée
        persistentEffect: {
            name: "Dagues d'ombre",
            icon: "icons/weapons/daggers/dagger-curved-purple.webp",
            description: "Dagues d'ombre invoquées - Attaques gratuites disponibles",
            flags: {
                world: {
                    shadowDaggerCaster: null, // Sera remplacé par l'ID du lanceur
                    spellName: "Invocation de dagues",
                    shadowDaggerSequenceName: "MocteiShadowDaggers"
                }
            }
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Moctei !");
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
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
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

    // ===== VÉRIFICATION DE L'EFFET DAGUES D'OMBRE =====
    const existingShadowDaggers = actor.effects?.contents?.find(e =>
        e.name === SPELL_CONFIG.persistentEffect.name
    );

    // ===== MENU UNIFIÉ DE CONFIGURATION =====
    async function showUnifiedDialog() {
        return new Promise(resolve => {
            // Déterminer les modes disponibles
            let modeOptions = '';
            let hasFreeCast = false;

            if (existingShadowDaggers) {
                // Si l'effet existe, proposer le lancement gratuit
                modeOptions += `
                    <div style="margin: 8px 0; padding: 12px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 4px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="mode" value="free" checked style="margin-right: 8px;">
                            <div>
                                <strong>🆓 Attaque Gratuite</strong>
                                <br><small style="color: #2e7d32;">Utilise l'effet "Dagues d'ombre" existant (0 mana)</small>
                            </div>
                        </label>
                    </div>
                `;
                hasFreeCast = true;
            }

            // Modes payants
            for (const [modeKey, modeData] of Object.entries(SPELL_CONFIG.modes)) {
                const isChecked = !hasFreeCast && modeKey === 'normal' ? 'checked' : '';
                const borderColor = modeData.createsPersistentEffect ? '#ff9800' : '#2196f3';

                modeOptions += `
                    <div style="margin: 8px 0; padding: 12px; background: #f9f9f9; border: 2px solid ${borderColor}; border-radius: 4px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="mode" value="${modeKey}" ${isChecked} style="margin-right: 8px;">
                            <div>
                                <strong>${modeData.name} (${modeData.manaCost} mana)</strong>
                                <br><small style="color: #666;">${modeData.description}</small>
                            </div>
                        </label>
                    </div>
                `;
            }

            const dialogContent = `
                <h3>🌑 ${SPELL_CONFIG.name}</h3>
                <div style="margin: 10px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                    <strong>Moctei (Mage des Ombres)</strong><br>
                    <small>Dextérité: ${characteristicInfo.final} (base: ${characteristicInfo.base}${characteristicInfo.injuries > 0 ? `, blessures: -${characteristicInfo.injuries}` : ''}${characteristicInfo.effectBonus !== 0 ? `, bonus: ${characteristicInfo.effectBonus > 0 ? '+' : ''}${characteristicInfo.effectBonus}` : ''})</small>
                    ${currentStance ? `<br><small>Posture: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</small>` : ''}
                </div>

                <h4>Mode de lancement :</h4>
                ${modeOptions}

                <h4>Bonus manuels :</h4>
                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <div style="margin: 5px 0;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>Bonus de dégâts:</span>
                            <input type="number" id="damageBonus" value="0" min="0" max="20" style="width: 80px;">
                            <span>points</span>
                        </label>
                        <small style="display: block; margin-left: 20px; color: #666;">Objets, effets temporaires, etc.</small>
                    </div>
                    <div style="margin: 5px 0;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>Bonus d'attaque:</span>
                            <input type="number" id="attackBonus" value="0" min="-5" max="10" style="width: 80px;">
                            <span>dés</span>
                        </label>
                        <small style="display: block; margin-left: 20px; color: #666;">Dés d7 supplémentaires pour l'attaque</small>
                    </div>
                </div>

                <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 4px; font-size: 0.9em;">
                    <strong>💡 Mécaniques des dagues :</strong><br>
                    • <strong>Proche (≤2 cases)</strong> : 2D4 + Dextérité<br>
                    • <strong>Loin (>2 cases)</strong> : 1D4 + Dextérité<br>
                    • <strong>Longue durée</strong> : L'effet se dissipe après une attaque à distance
                </div>
            `;

            new Dialog({
                title: `🌑 ${SPELL_CONFIG.name} - Configuration`,
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: '🗡️ Cibler et Lancer',
                        callback: (html) => {
                            const selectedMode = html.find('input[name="mode"]:checked').val();
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;

                            resolve({
                                mode: selectedMode,
                                attackBonus: attackBonus,
                                damageBonus: damageBonus
                            });
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
                width: 500,
                height: 600
            }).render(true);
        });
    }

    const userConfig = await showUnifiedDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    const { mode, attackBonus, damageBonus } = userConfig;

    // Déterminer le coût en mana et la configuration
    let actualManaCost = 0;
    let modeConfig = null;
    let modeDescription = "";

    if (mode === 'free') {
        actualManaCost = 0;
        modeDescription = "Attaque gratuite (Dagues d'ombre)";
    } else {
        modeConfig = SPELL_CONFIG.modes[mode];
        actualManaCost = modeConfig.manaCost;
        modeDescription = modeConfig.name;
    }

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        ui.notifications.info(`🎯 Sélectionnez la cible pour ${SPELL_CONFIG.name}...`);

        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            console.error("[Moctei] Error with portal targeting:", error);
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info('Sort annulé - Aucune cible sélectionnée.');
        return;
    }

    // ===== CALCUL DE DISTANCE =====
    function calculateDistance(casterToken, targetPos) {
        const casterX = casterToken.x + (casterToken.width * canvas.grid.size) / 2;
        const casterY = casterToken.y + (casterToken.height * canvas.grid.size) / 2;

        const deltaX = Math.abs(targetPos.x - casterX);
        const deltaY = Math.abs(targetPos.y - casterY);

        // Distance en cases de grille
        const distanceInCells = Math.max(
            Math.floor(deltaX / canvas.grid.size),
            Math.floor(deltaY / canvas.grid.size)
        );

        return distanceInCells;
    }

    const distanceInCells = calculateDistance(caster, target);
    const isCloseRange = distanceInCells <= SPELL_CONFIG.maxCloseRange;

    // Get actor at target location
    function getActorAtLocation(x, y) {
        const tokens = canvas.tokens.placeables.filter(token => {
            const tokenBounds = {
                left: token.x,
                right: token.x + (token.width * canvas.grid.size),
                top: token.y,
                bottom: token.y + (token.height * canvas.grid.size)
            };

            return x >= tokenBounds.left && x < tokenBounds.right &&
                   y >= tokenBounds.top && y < tokenBounds.bottom;
        });

        return tokens.length > 0 ? tokens[0] : null;
    }

    const targetToken = getActorAtLocation(target.x, target.y);
    const targetName = targetToken ? targetToken.name : `Position (${Math.round(target.x)}, ${Math.round(target.y)})`;

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Animation de cast sur Moctei (ombre)
        if (SPELL_CONFIG.animations.cast.caster) {
            seq.effect()
                .file(SPELL_CONFIG.animations.cast.caster)
                .attachTo(caster)
                .scale(0.6)
                .duration(1500)
                .fadeOut(500);
        }

        // Animation de l'attaque selon la distance
        const attackAnim = isCloseRange ?
            SPELL_CONFIG.animations.cast.close :
            SPELL_CONFIG.animations.cast.ranged;

        if (attackAnim) {
            if (isCloseRange) {
                // Animation de mêlée sur la cible
                seq.effect()
                    .file(attackAnim)
                    .atLocation(target)
                    .scale(0.8)
                    .duration(2000);
            } else {
                // Animation de projectile du lanceur vers la cible
                seq.effect()
                    .file(attackAnim)
                    .attachTo(caster)
                    .stretchTo(target)
                    .scale(0.7);
            }
        }

        // Animation d'impact
        const impactAnim = isCloseRange ?
            SPELL_CONFIG.animations.impact.close :
            SPELL_CONFIG.animations.impact.ranged;

        if (impactAnim) {
            seq.effect()
                .file(impactAnim)
                .atLocation(target)
                .scale(0.6)
                .delay(isCloseRange ? 500 : 1000);
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const baseAttackDice = characteristicInfo.final + attackBonus;
    const finalAttackDice = Math.max(1, baseAttackDice);
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${finalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== DAMAGE CALCULATION =====
    const damageConfig = isCloseRange ? SPELL_CONFIG.damage.close : SPELL_CONFIG.damage.ranged;
    const dexterityBonus = characteristicInfo.final; // Bonus de dextérité aux dégâts
    const totalDamageBonus = dexterityBonus + damageBonus; // Dextérité + bonus manuel

    const damageRoll = new Roll(`${damageConfig.dice} + ${totalDamageBonus}`);
    await damageRoll.evaluate({ async: true });

    // ===== GESTION DE L'EFFET LONGUE DURÉE =====
    let effectMessage = "";

    if (mode === 'free' && existingShadowDaggers) {
        // Attaque gratuite - dissiper l'effet si attaque à distance
        if (!isCloseRange) {
            await existingShadowDaggers.delete();

            // Arrêter l'animation persistante
            if (SPELL_CONFIG.animations.longDurationEffect.sequencerName) {
                try {
                    Sequencer.EffectManager.endEffects({
                        name: SPELL_CONFIG.animations.longDurationEffect.sequencerName
                    });
                } catch (error) {
                    console.warn("[Moctei] Could not end persistent animation:", error);
                }
            }

            effectMessage = "🌑 L'effet 'Dagues d'ombre' se dissipe après l'attaque à distance";
        } else {
            effectMessage = "🌑 L'effet 'Dagues d'ombre' persiste (attaque rapprochée)";
        }

    } else if (modeConfig && modeConfig.createsPersistentEffect) {
        // Mode longue durée - créer l'effet
        try {
            const effectData = {
                ...SPELL_CONFIG.persistentEffect,
                duration: { seconds: 86400 }, // 24h
                flags: {
                    ...SPELL_CONFIG.persistentEffect.flags,
                    world: {
                        ...SPELL_CONFIG.persistentEffect.flags.world,
                        shadowDaggerCaster: actor.id
                    }
                }
            };

            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

            // Démarrer l'animation persistante
            if (SPELL_CONFIG.animations.longDurationEffect) {
                const persistentSeq = new Sequence();
                persistentSeq.effect()
                    .file(SPELL_CONFIG.animations.longDurationEffect.file)
                    .attachTo(caster)
                    .scale(SPELL_CONFIG.animations.longDurationEffect.scale)
                    .fadeOut(SPELL_CONFIG.animations.longDurationEffect.fadeOut)
                    .name(SPELL_CONFIG.animations.longDurationEffect.sequencerName);

                await persistentSeq.play();
            }

            effectMessage = "🌑 Effet 'Dagues d'ombre' créé - Attaques gratuites disponibles !";

        } catch (error) {
            console.error("[Moctei] Error creating persistent effect:", error);
            effectMessage = "⚠️ Erreur lors de la création de l'effet persistant";
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const distanceInfo = isCloseRange ?
            `🗡️ Attaque Rapprochée (${distanceInCells} case${distanceInCells > 1 ? 's' : ''})` :
            `🎯 Attaque à Distance (${distanceInCells} case${distanceInCells > 1 ? 's' : ''})`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de Dextérité: +${characteristicInfo.effectBonus}</div>
            </div>` : '';

        const bonusInfo = (attackBonus !== 0 || damageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${attackBonus !== 0 ? `<div>⚡ Bonus Manuel d'Attaque: ${attackBonus > 0 ? '+' : ''}${attackBonus} dés</div>` : ''}
                ${damageBonus !== 0 ? `<div>🔧 Bonus Manuel de Dégâts: ${damageBonus > 0 ? '+' : ''}${damageBonus} points</div>` : ''}
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
                <div style="font-size: 0.9em; color: #666; margin-top: 4px;">${distanceInfo}</div>
            </div>
        `;

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #c62828; font-weight: bold;">⚔️ DÉGÂTS: ${damageRoll.total}</div>
                <div style="font-size: 0.9em; color: #666; margin-top: 4px;">${damageConfig.description} (${damageConfig.dice} + ${totalDamageBonus})</div>
            </div>
        `;

        const effectDisplay = effectMessage ? `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                <div style="font-size: 1.0em; color: #4a148c; font-weight: bold;">${effectMessage}</div>
            </div>
        ` : '';

        return `
            <div style="background: linear-gradient(135deg, #f3e5f5, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #4a148c; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #4a148c;">🌑 ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Moctei:</strong> ${actor.name} | <strong>Mode:</strong> ${modeDescription} | <strong>Coût:</strong> ${actualManaCost} mana
                    </div>
                    <div style="font-size: 0.9em; color: #666;">
                        <strong>Cible:</strong> ${targetName}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${damageDisplay}
                ${effectDisplay}
            </div>
        `;
    }

    // Send attack roll to chat with damage
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createFlavor(),
        rollMode: game.settings.get("core", "rollMode")
    });

    // Send damage roll to chat
    await damageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: `<div style="text-align: center; color: #4a148c;"><strong>🗡️ Dégâts des Dagues d'Ombre</strong></div>`,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const rangeInfo = isCloseRange ? "rapprochée" : "à distance";

    ui.notifications.info(
        `🌑 ${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName} (${rangeInfo}). ` +
        `Attaque: ${attackRoll.total}, Dégâts: ${damageRoll.total}. ${actualManaCost} mana utilisé.`
    );

})();
