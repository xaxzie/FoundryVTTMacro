/**
 * Dead Calm - Sort d'Ora (Zone Control Ultimate)
 *
 * Sort de contrôle de zone avancé avec préparation obligatoire en Position Focus.
 *
 * Phase 1 - Cast :
 * - Coût : 8 mana (NON focusable)
 * - Pré-requis : OBLIGATOIREMENT en Position Focus
 * - Effet : "Cast DC" + animation de cast + message de préparation
 * - Vulnérabilité : Ora ne peut pas esquiver, tout dégât interrompt
 * - Action : Retire la Position Focus lors du lancement
 *
 * Phase 2 - Activation :
 * - Effet : "DC" + "Ora Eyes - Supérieur" (+6 Dégâts, +2 Esprit)
 * - Zone : 6 cases de rayon avec double animation permanente
 * - Capacités : Attaques rapides (Esprit/4 fois par tour), sorts demi-focus forcés
 * - Limitations : Ciblage uniquement dans la zone, jet Volonté si dégâts (3×dégâts)
 *
 * Phase 3 - Utilisation :
 * - Option 1 : Lancer 1d6 (réduction de dégâts)
 * - Option 2 : Terminer Dead Calm (retire tous les effets et animations)
 *
 * Usage : Sélectionner le token d'Ora en Position Focus et lancer la macro.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Dead Calm",
        description: "Zone de contrôle ultime avec préparation Focus",
        manaCost: 8,
        spellLevel: 4,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        controlRadius: 6, // 6 cases de rayon
        isDirect: false,
        isFocusable: false, // NON focusable

        animations: {
            cast: "jb2a.cast_generic.water.02.blue.0",
            zoneControl: "jb2a.detect_magic.circle.blue", // Animation de zone
            particleControl: "jb2a.moonbeam.01.blue", // Animation de particules
            damageReduction: "jb2a.shield.02.intro.blue"
        },

        // Configuration de l'effet Cast DC (préparation)
        castEffect: {
            name: "Cast DC",
            icon: "icons/magic/control/hypnosis-mesmerism-eye.webp",
            description: "Préparation du Dead Calm (interruptible, ne peut pas esquiver)",
            duration: { seconds: 86400 },
            flags: {
                world: {
                    oraCaster: "CASTER_ID",
                    spellName: "Dead Calm",
                    effectType: "preparation_dc",
                    appliedAt: "TIMESTAMP",
                    increasable: false,
                    noEvasion: true // Ora ne peut pas esquiver
                },
                statuscounter: { value: 1 }
            },
            changes: [],
            tint: "#4169e1",
            // Configuration pour handleOraEffect
            handleOraConfig: {
                displayName: "Cast Dead Calm",
                sectionTitle: "🌀 Préparation Zone de Contrôle",
                sectionIcon: "🌀",
                cssClass: "cast-dc-effect",
                borderColor: "#4169e1",
                bgColor: "#f0f8ff",
                mechanicType: "preparation",
                tags: [],
                detectFlags: [
                    { path: "name", matchValue: "Cast DC" },
                    { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
                ],
                getExtraData: (effect) => ({
                    preparationLevel: effect.flags?.statuscounter?.value || 1,
                    sourceSpell: "Dead Calm",
                    noEvasion: true
                }),
                getDynamicDescription: (effect) => "Préparation Dead Calm - Interruptible, ne peut pas esquiver"
            }
        },

        // Configuration de l'effet DC (zone active)
        dcEffect: {
            name: "DC",
            icon: "icons/magic/control/voodoo-doll-pain-damage-red.webp",
            description: "Zone de contrôle Dead Calm active",
            duration: { seconds: 86400 },
            flags: {
                world: {
                    oraCaster: "CASTER_ID",
                    spellName: "Dead Calm",
                    effectType: "zone_control",
                    appliedAt: "TIMESTAMP",
                    increasable: false,
                    controlRadius: 6
                },
                statuscounter: { value: 1 }
            },
            changes: [],
            tint: "#8b0000",
            // Configuration pour handleOraEffect
            handleOraConfig: {
                displayName: "Dead Calm - Zone Control",
                sectionTitle: "🌀 Contrôle de Zone Actif",
                sectionIcon: "🌀",
                cssClass: "dc-control-effect",
                borderColor: "#8b0000",
                bgColor: "#ffe4e1",
                mechanicType: "zone_control",
                tags: [],
                detectFlags: [
                    { path: "name", matchValue: "DC" },
                    { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
                ],
                getExtraData: (effect) => ({
                    controlLevel: effect.flags?.statuscounter?.value || 1,
                    sourceSpell: "Dead Calm",
                    radius: 6
                }),
                getDynamicDescription: (effect) => "Zone de contrôle Dead Calm active (6 cases de rayon)",
                onRemoval: async (effect, actor) => {
                    // Arrêter les animations persistantes lors de la suppression
                    await stopControlAnimations(actor.id);
                }
            }
        },

        // Configuration de l'effet Ora Eyes - Supérieur
        oraEyesSuperior: {
            name: "Ora Eyes - Supérieur",
            icon: "icons/svg/eye.svg",
            description: "Vision mystique supérieure d'Ora (+6 Dégâts, +2 Esprit)",
            duration: { seconds: 86400 },
            flags: {
                world: {
                    oraEyes: true,
                    effectType: "oraSuperior",
                    caster: "ORA_CASTER_ID",
                    increasable: false
                },
                damage: { value: 6 },
                esprit: { value: 2 }
            },
            changes: [],
            tint: "#dc143c",
            // Configuration pour handleOraEffect
            handleOraConfig: {
                displayName: "Ora Eyes - Supérieur",
                sectionTitle: "👁️ Vision Mystique Supérieure",
                sectionIcon: "👁️",
                cssClass: "ora-eyes-superior-effect",
                borderColor: "#dc143c",
                bgColor: "#ffe4e1",
                mechanicType: "enhancement",
                tags: [],
                detectFlags: [
                    { path: "name", matchValue: "Ora Eyes - Supérieur" },
                    { path: "flags.world.caster", matchValue: "ORA_CASTER_ID" }
                ],
                getExtraData: (effect) => ({
                    damageBonus: effect.flags?.damage?.value || 6,
                    espritBonus: effect.flags?.esprit?.value || 2
                }),
                getDynamicDescription: (effect) => {
                    const damageBonus = effect.flags?.damage?.value || 6;
                    const espritBonus = effect.flags?.esprit?.value || 2;
                    return `Vision mystique supérieure (+${damageBonus} Dégâts, +${espritBonus} Esprit)`;
                }
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

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

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

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // ===== GESTION DES EFFETS =====
    function getCastDCEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === "Cast DC" && e.flags?.world?.oraCaster === actor.id
        ) || null;
    }

    function getDCEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === "DC" && e.flags?.world?.oraCaster === actor.id
        ) || null;
    }

    async function removeFocusStance(actor) {
        const focusEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'focus');
        if (focusEffect) {
            try {
                await focusEffect.delete();
                console.log("[Dead Calm] Removed Focus stance");
                return true;
            } catch (error) {
                console.error("[Dead Calm] Error removing Focus stance:", error);
                return false;
            }
        }
        return false;
    }

    // ===== ANIMATIONS PERSISTANTES =====
    async function startControlAnimations(actorId) {
        const sequence = new Sequence();

        // Animation de zone (6 cases de rayon)
        sequence.effect()
            .file(SPELL_CONFIG.animations.zoneControl)
            .attachTo(caster)
            .scale(SPELL_CONFIG.controlRadius * 0.25)
            .fadeIn(2000)
            .fadeOut(2000)
            .persist(true)
            .name(`DeadCalm_Zone_${actorId}`)
            .belowTokens(true)
            .opacity(0.1);

        // Animation de particules
        sequence.effect()
            .file(SPELL_CONFIG.animations.particleControl)
            .attachTo(caster)
            .scale(SPELL_CONFIG.controlRadius * 0.2)
            .fadeIn(2000)
            .fadeOut(2000)
            .persist(true)
            .name(`DeadCalm_Particles_${actorId}`)
            .belowTokens(false)
            .opacity(0.1);

        await sequence.play();
    }

    async function stopControlAnimations(actorId) {
        try {
            await Sequencer.EffectManager.endEffects({
                name: [`DeadCalm_Zone_${actorId}`, `DeadCalm_Particles_${actorId}`]
            });
            console.log("[Dead Calm] Stopped control animations");
        } catch (error) {
            console.warn("[Dead Calm] Could not stop control animations:", error);
        }
    }

    // ===== APPLICATION D'EFFETS =====
    async function applyEffect(actor, effectConfig, replacements = {}) {
        const effectData = {
            ...effectConfig,
            flags: JSON.parse(JSON.stringify(effectConfig.flags))
        };

        // Remplacer les valeurs dynamiques
        if (effectData.flags.world) {
            effectData.flags.world.oraCaster = replacements.CASTER_ID || actor.id;
            effectData.flags.world.appliedAt = replacements.TIMESTAMP || Date.now();
        }
        if (effectData.flags.world && replacements.ORA_CASTER_ID) {
            effectData.flags.world.caster = replacements.ORA_CASTER_ID;
        }

        try {
            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            return true;
        } catch (error) {
            console.error("[Dead Calm] Error applying effect:", error);
            return false;
        }
    }

    // ===== LOGIQUE PRINCIPALE =====
    const castEffect = getCastDCEffect(actor);
    const dcEffect = getDCEffect(actor);

    if (!castEffect && !dcEffect) {
        // PHASE 1 : CAST - Vérification Focus obligatoire

        if (currentStance !== 'focus') {
            ui.notifications.error("❌ Dead Calm ne peut être lancé qu'en Position Focus !");
            return;
        }

        // Dialog de confirmation
        const confirmed = await new Promise((resolve) => {
            new Dialog({
                title: "🌀 Dead Calm - Phase Cast",
                content: `
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 15px 0; color: #4169e1;">🌀 Préparation Zone de Contrôle</h3>

                        <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                            <p><strong>Coût :</strong> ${SPELL_CONFIG.manaCost} mana (NON focusable)</p>
                            <p><strong>Pré-requis :</strong> Position Focus (sera retiré)</p>
                            <p><strong>Zone future :</strong> ${SPELL_CONFIG.controlRadius} cases de rayon</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                            <h4 style="margin: 0 0 8px 0; color: #856404;">⚠️ Risques de la Préparation :</h4>
                            <ul style="margin: 5px 0; padding-left: 20px; color: #856404;">
                                <li><strong>Ne peut pas esquiver</strong> pendant la préparation</li>
                                <li><strong>Tout dégât interrompt</strong> le processus</li>
                                <li>Position Focus sera <strong>perdue</strong> lors du lancement</li>
                            </ul>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: '🌀 Commencer la Préparation',
                        callback: () => resolve(true)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: '❌ Annuler',
                        callback: () => resolve(false)
                    }
                },
                default: "cast"
            }, { width: 500 }).render(true);
        });

        if (!confirmed) return;

        // Animation de cast
        const castSequence = new Sequence();
        castSequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.8)
            .belowTokens(true);
        await castSequence.play();

        // Retirer la Position Focus
        await removeFocusStance(actor);

        // Appliquer l'effet Cast DC
        const effectApplied = await applyEffect(actor, SPELL_CONFIG.castEffect, { CASTER_ID: actor.id, TIMESTAMP: Date.now() });
        if (!effectApplied) {
            ui.notifications.error("❌ Erreur lors de l'application de l'effet Cast DC !");
            return;
        }

        // Message dans le chat
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #f0f8ff, #e8f4fd); border-radius: 8px; border: 2px solid #4169e1; margin: 8px 0;">
                    <h3 style="margin: 0; color: #4169e1;">🌀 Dead Calm - Préparation</h3>
                    <div style="margin: 5px 0;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 4px;">
                        <p style="margin: 0; font-size: 1em; color: #856404;">
                            <strong>🌀 Ora prépare une zone de contrôle</strong><br>
                            Elle ne peut pas esquiver et tout dégât l'interrompra.<br>
                            Position Focus perdue lors de la préparation.
                        </p>
                    </div>
                </div>
            `,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info("🌀 Préparation Dead Calm commencée ! Ora est vulnérable aux interruptions.");

    } else if (castEffect && !dcEffect) {
        // PHASE 2 : ACTIVATION - Lancement du Dead Calm

        // Dialog de confirmation
        const confirmed = await new Promise((resolve) => {
            const attacksPerTurn = Math.round(characteristicInfo.final / 4);

            new Dialog({
                title: "🌀 Dead Calm - Activation",
                content: `
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 15px 0; color: #8b0000;">🌀 Activation Zone de Contrôle</h3>

                        <div style="margin: 10px 0; padding: 10px; background: #ffe4e1; border-radius: 4px;">
                            <p><strong>Zone :</strong> ${SPELL_CONFIG.controlRadius} cases de rayon</p>
                            <p><strong>Bonus :</strong> +6 Dégâts, +2 Esprit</p>
                            <p><strong>Attaques rapides :</strong> ${attacksPerTurn} fois par tour maximum</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
                            <h4 style="margin: 0 0 8px 0; color: #856404;">📋 Capacités de la Zone :</h4>
                            <ul style="margin: 5px 0; padding-left: 20px; color: #856404;">
                                <li>Tous les sorts sont <strong>forcés demi-focus</strong></li>
                                <li>Ciblage <strong>uniquement dans la zone</strong></li>
                                <li>Si dégâts : jet Volonté difficulté <strong>3×dégâts</strong></li>
                                <li>Contrôle total des déplacements dans la zone</li>
                            </ul>
                        </div>
                    </div>
                `,
                buttons: {
                    activate: {
                        icon: '<i class="fas fa-bolt"></i>',
                        label: '🌀 Activer Dead Calm',
                        callback: () => resolve(true)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: '❌ Annuler',
                        callback: () => resolve(false)
                    }
                },
                default: "activate"
            }, { width: 550 }).render(true);
        });

        if (!confirmed) return;

        // Supprimer l'effet Cast DC
        await castEffect.delete();

        // Appliquer l'effet DC
        const dcApplied = await applyEffect(actor, SPELL_CONFIG.dcEffect, { CASTER_ID: actor.id, TIMESTAMP: Date.now() });

        // Appliquer l'effet Ora Eyes - Supérieur
        const eyesApplied = await applyEffect(actor, SPELL_CONFIG.oraEyesSuperior, { ORA_CASTER_ID: actor.id });

        if (!dcApplied || !eyesApplied) {
            ui.notifications.error("❌ Erreur lors de l'activation de Dead Calm !");
            return;
        }

        // Démarrer les animations persistantes
        await startControlAnimations(actor.id);

        // Message dans le chat
        const attacksPerTurn = Math.round(characteristicInfo.final / 4);

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #ffe4e1, #ffffff); border-radius: 8px; border: 2px solid #8b0000; margin: 8px 0;">
                    <h3 style="margin: 0; color: #8b0000;">🌀 Dead Calm - Zone Activée</h3>
                    <div style="margin: 5px 0;">
                        <strong>Contrôleur:</strong> ${actor.name} | <strong>Rayon:</strong> ${SPELL_CONFIG.controlRadius} cases
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: #8b000022; border-radius: 4px;">
                        <div style="font-size: 1.1em; font-weight: bold; color: #8b0000;">
                            🌀 Ora contrôle maintenant la zone !
                        </div>
                        <div style="margin-top: 8px; font-size: 0.95em;">
                            <p><strong>👁️ Vision Supérieure:</strong> +6 Dégâts, +2 Esprit</p>
                            <p><strong>⚡ Attaques rapides:</strong> ${attacksPerTurn} fois par tour maximum</p>
                            <p><strong>🎯 Sorts:</strong> Forcés demi-focus, ciblage zone uniquement</p>
                            <p><strong>🛡️ Vulnérabilité:</strong> Jet Volonté (3×dégâts) si blessée</p>
                        </div>
                    </div>
                </div>
            `,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info("🌀 Dead Calm activé ! Ora contrôle maintenant la zone !");

    } else if (dcEffect) {
        // PHASE 3 : UTILISATION - Options d'action

        const actionChoice = await new Promise((resolve) => {
            new Dialog({
                title: "🌀 Dead Calm - Actions",
                content: `
                    <div style="padding: 15px; text-align: center;">
                        <h3 style="margin: 0 0 15px 0; color: #8b0000;">🌀 Zone de Contrôle Active</h3>
                        <p style="margin-bottom: 20px;">Ora contrôle actuellement une zone de ${SPELL_CONFIG.controlRadius} cases.</p>

                        <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                            <p><strong>Que voulez-vous faire ?</strong></p>
                        </div>
                    </div>
                `,
                buttons: {
                    damage_reduction: {
                        icon: '<i class="fas fa-shield-alt"></i>',
                        label: '🛡️ Réduction de Dégâts (1d6)',
                        callback: () => resolve({ action: 'damage_reduction' })
                    },
                    end_control: {
                        icon: '<i class="fas fa-stop"></i>',
                        label: '🌀 Terminer Dead Calm',
                        callback: () => resolve({ action: 'end_control' })
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: '❌ Annuler',
                        callback: () => resolve(null)
                    }
                },
                default: "damage_reduction"
            }, {
                width: 400
            }).render(true);
        });

        if (!actionChoice) return;

        if (actionChoice.action === 'damage_reduction') {
            // Lancer 1d6 pour réduction de dégâts
            const reductionRoll = new Roll("1d6");
            await reductionRoll.evaluate({ async: true });

            // Animation courte
            const reductionSequence = new Sequence();
            reductionSequence.effect()
                .file(SPELL_CONFIG.animations.damageReduction)
                .attachTo(caster)
                .scale(0.6)
                .duration(1500);
            await reductionSequence.play();

            // Message de chat rapide
            await reductionRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ token: caster }),
                flavor: `
                    <div style="text-align: center; padding: 8px; background: linear-gradient(135deg, #e3f2fd, #ffffff); border-radius: 6px; border: 2px solid #2196f3;">
                        <h4 style="margin: 0; color: #1976d2;">🛡️ Réduction de Dégâts</h4>
                        <p style="margin: 5px 0; font-size: 0.9em;"><strong>Dead Calm:</strong> Protection active</p>
                    </div>
                `,
                rollMode: game.settings.get('core', 'rollMode')
            });

            ui.notifications.info(`🛡️ Réduction de dégâts : ${reductionRoll.total} points`);

        } else if (actionChoice.action === 'end_control') {
            // Terminer Dead Calm

            // Supprimer les effets
            await dcEffect.delete();
            const oraEyesSuperior = actor?.effects?.contents?.find(e => e.name === "Ora Eyes - Supérieur");
            if (oraEyesSuperior) {
                await oraEyesSuperior.delete();
            }

            // Arrêter les animations persistantes
            await stopControlAnimations(actor.id);

            // Message dans le chat
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: caster }),
                content: `
                    <div style="text-align: center; padding: 10px; background: linear-gradient(135deg, #fff3e0, #ffffff); border-radius: 8px; border: 2px solid #ff6f00;">
                        <h3 style="margin: 0; color: #e65100;">🌀 Fin du Dead Calm</h3>
                        <p style="margin: 5px 0;"><strong>Contrôleur:</strong> ${actor.name}</p>
                        <p style="margin: 5px 0;">La zone de contrôle se dissipe. Ora retrouve sa liberté de mouvement.</p>
                    </div>
                `,
                rollMode: game.settings.get('core', 'rollMode')
            });

            ui.notifications.info("🌀 Dead Calm terminé. La zone de contrôle se dissipe.");
        }
    }

})();
