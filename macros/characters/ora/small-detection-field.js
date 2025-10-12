/**
 * Small Detection Field - Ora
 *
 * Sort de détection et contre-attaque défensive qui crée un champ de détection
 * de 3 cases de rayon autour d'Ora, permettant de détecter et attaquer les ennemis proches.
 *
 * - Premier usage : Active le champ de détection (effet persistant + animation)
 * - Usage suivant : Détecte les cibles dans la zone et permet une contre-attaque
 * - Attaque : 1d3 + Sens/2 (gratuite), réduit les prochains dégâts de la cible
 * - Coût initial : 4 mana (focalisable), attaques gratuites ensuite
 * - Charges : 3 utilisations maximum (statusCounter)
 * - Compatible avec handleOraEffect (tag "increasable")
 *
 * Usage : Sélectionner le token d'Ora et lancer la macro.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Small Detection Field",
        shortName: "SDF",
        description: "Champ de détection défensif avec contre-attaques",
        manaCost: 4,
        spellLevel: 2,
        characteristic: "sens", // Utilise Sens au lieu d'Esprit
        characteristicDisplay: "Sens",
        attackDamageFormula: "1d3",
        detectionRadius: 3, // 3 cases de rayon
        maxCharges: 3,
        isDirect: true,
        isFocusable: true,

        animations: {
            cast: "jb2a.cast_generic.water.02.blue.0",
            persistentField: "jb2a.detect_magic.circle.blue", // Animation persistante
            attackHit: "jb2a.explosion.04.blue", // Petite explosion d'eau sur la cible
            sound: null
        },

        // Configuration de l'effet SDF pour Ora
        effectConfig: {
            name: "SDF",
            icon: "icons/magic/perception/eye-ringed-glow-angry-small-red.webp",
            description: "Champ de détection activé",
            duration: {
                seconds: 86400 // 24h - effet permanent jusqu'à suppression manuelle
            },
            flags: {
                world: {
                    oraCaster: "CASTER_ID", // Remplacé dynamiquement
                    spellName: "Small Detection Field",
                    effectType: "detection_field",
                    appliedAt: "TIMESTAMP", // Remplacé dynamiquement
                    increasable: true // Tag pour handleOraEffect
                },
                statuscounter: {
                    value: 3 // 3 charges maximum
                }
            },
            changes: [],
            tint: "#4169e1",
            // Configuration pour handleOraEffect avec tag "increasable"
            handleOraConfig: {
                displayName: "Small Detection Field",
                sectionTitle: "🔍 Champ de Détection",
                sectionIcon: "🔍",
                cssClass: "detection-field-effect",
                borderColor: "#4169e1",
                bgColor: "#f0f8ff",
                mechanicType: "detection",
                tags: ["increasable"], // Tag spécial pour manipulation
                detectFlags: [
                    { path: "name", matchValue: "SDF" },
                    { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
                ],
                getExtraData: (effect) => ({
                    charges: effect.flags?.statuscounter?.value || 0,
                    sourceSpell: effect.flags?.world?.spellName || "Small Detection Field"
                }),
                getDynamicDescription: (effect) => {
                    const charges = effect.flags?.statuscounter?.value || 0;
                    return `Champ de détection actif (${charges} charge${charges > 1 ? 's' : ''} restante${charges > 1 ? 's' : ''})`;
                },
                // Callback pour la suppression depuis handleOraEffect
                onRemoval: async (effect, actor) => {
                    // Arrêter l'animation persistante
                    await stopPersistentAnimation(actor.id);
                }
            }
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token d'Ora !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé pour le token sélectionné !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Détecte la stance actuelle de l'acteur
     */
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    /**
     * Gets active effect bonuses for a specific flag key
     */
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

    /**
     * Obtient et calcule la valeur finale de la caractéristique
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Vérifie si l'effet SDF est actif sur Ora
     */
    function getSdfEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === "SDF" &&
            e.flags?.world?.oraCaster === actor.id
        ) || null;
    }

    /**
     * Trouve les tokens dans le rayon de détection
     */
    function findTargetsInDetectionRange(centerToken, radius) {
        const targets = [];
        const gridSize = canvas.grid.size;

        const centerGridX = Math.floor(centerToken.x / gridSize);
        const centerGridY = Math.floor(centerToken.y / gridSize);

        for (const token of canvas.tokens.placeables) {
            if (!(token.isVisible || token.isOwner || game.user.isGM)) continue;
            if (token === centerToken) continue; // Skip Ora

            const tokenGridX = Math.floor(token.x / gridSize);
            const tokenGridY = Math.floor(token.y / gridSize);
            const tokenWidth = token.document.width;
            const tokenHeight = token.document.height;

            let tokenInRange = false;
            for (let tx = tokenGridX; tx < tokenGridX + tokenWidth; tx++) {
                for (let ty = tokenGridY; ty < tokenGridY + tokenHeight; ty++) {
                    const distance = Math.sqrt(
                        Math.pow(tx - centerGridX, 2) +
                        Math.pow(ty - centerGridY, 2)
                    );

                    if (distance <= radius + 0.5) {
                        tokenInRange = true;
                        break;
                    }
                }
                if (tokenInRange) break;
            }

            if (tokenInRange && token.actor) {
                targets.push({
                    name: token.name,
                    token: token,
                    actor: token.actor
                });
            }
        }

        return targets;
    }

    /**
     * Démarre l'animation persistante du champ de détection
     */
    async function startPersistentAnimation(actorId) {
        const sequence = new Sequence();

        sequence.effect()
            .file(SPELL_CONFIG.animations.persistentField)
            .attachTo(caster)
            .scale(SPELL_CONFIG.detectionRadius * 0.4)
            .fadeIn(1000)
            .fadeOut(1000)
            .persist(true)
            .name(`SDF_Field_${actorId}`) // Nom unique pour pouvoir l'arrêter
            .belowTokens(true)
            .opacity(0.6);

        await sequence.play();
    }

    /**
     * Arrête l'animation persistante du champ de détection
     */
    async function stopPersistentAnimation(actorId) {
        try {
            await Sequencer.EffectManager.endEffects({
                name: `SDF_Field_${actorId}`
            });
            console.log(`[SDF] Stopped persistent animation for actor ${actorId}`);
        } catch (error) {
            console.warn(`[SDF] Could not stop persistent animation: ${error.message}`);
        }
    }

    /**
     * Applique l'effet SDF sur Ora
     */
    async function applySdfEffect(actor) {
        const effectData = {
            name: SPELL_CONFIG.effectConfig.name,
            icon: SPELL_CONFIG.effectConfig.icon,
            description: SPELL_CONFIG.effectConfig.description,
            origin: actor.id,
            disabled: false,
            duration: { ...SPELL_CONFIG.effectConfig.duration },
            flags: JSON.parse(JSON.stringify(SPELL_CONFIG.effectConfig.flags)),
            changes: [...SPELL_CONFIG.effectConfig.changes],
            tint: SPELL_CONFIG.effectConfig.tint
        };

        // Remplacer les valeurs dynamiques
        effectData.flags.world.oraCaster = actor.id;
        effectData.flags.world.appliedAt = Date.now();

        try {
            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            console.log(`[SDF] Applied SDF effect to ${actor.name}`);
            return true;
        } catch (error) {
            console.error(`[SDF] Error applying SDF effect:`, error);
            return false;
        }
    }

    /**
     * Réduit les charges de l'effet SDF et le supprime si nécessaire
     */
    async function reduceChargesAndCleanup(sdfEffect, actor) {
        const currentCharges = sdfEffect.flags?.statuscounter?.value || 0;
        const newCharges = Math.max(0, currentCharges - 1);

        if (newCharges <= 0) {
            // Supprimer l'effet et arrêter l'animation
            await sdfEffect.delete();
            await stopPersistentAnimation(actor.id);
            ui.notifications.info("🔍 Small Detection Field épuisé et désactivé.");
            console.log(`[SDF] SDF effect removed from ${actor.name} - no charges remaining`);
        } else {
            // Mettre à jour les charges
            await sdfEffect.update({
                "flags.statuscounter.value": newCharges
            });
            ui.notifications.info(`🔍 Small Detection Field : ${newCharges} charge${newCharges > 1 ? 's' : ''} restante${newCharges > 1 ? 's' : ''}.`);
            console.log(`[SDF] SDF effect updated - ${newCharges} charges remaining`);
        }
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const sdfEffect = getSdfEffect(actor);

    // ===== LOGIQUE PRINCIPALE =====

    if (!sdfEffect) {
        // PREMIER USAGE : Activation du champ de détection

        const actualManaCost = (SPELL_CONFIG.isFocusable && currentStance === 'focus') ? 0 : SPELL_CONFIG.manaCost;

        // Dialog de confirmation pour l'activation
        const confirmed = await new Promise((resolve) => {
            new Dialog({
                title: `🔍 ${SPELL_CONFIG.name} - Activation`,
                content: `
                    <div style="padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #4169e1;">🔍 ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">⚙️ Configuration</h4>
                            <p><strong>Coût :</strong> ${actualManaCost === 0 ? 'GRATUIT (Focus)' : `${actualManaCost} mana`}</p>
                            <p><strong>Rayon :</strong> ${SPELL_CONFIG.detectionRadius} cases</p>
                            <p><strong>Charges :</strong> ${SPELL_CONFIG.maxCharges} attaques disponibles</p>
                            <p><strong>Caractéristique :</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #856404;">🎯 Effets</h4>
                            <p style="margin: 5px 0; font-size: 0.9em;">• Champ de détection persistant de ${SPELL_CONFIG.detectionRadius} cases</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• ${SPELL_CONFIG.maxCharges} contre-attaques gratuites disponibles</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• Attaques : ${SPELL_CONFIG.attackDamageFormula} + ${SPELL_CONFIG.characteristicDisplay}/2</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• Gérable via HandleOraEffect (tag "increasable")</p>
                        </div>
                    </div>
                `,
                buttons: {
                    activate: {
                        icon: '<i class="fas fa-eye"></i>',
                        label: "Activer le Champ",
                        callback: () => resolve(true)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(false)
                    }
                },
                default: "activate"
            }, { width: 500 }).render(true);
        });

        if (!confirmed) {
            ui.notifications.info("❌ Activation annulée.");
            return;
        }

        // Jouer l'animation de cast
        const castSequence = new Sequence();
        castSequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.8);
        await castSequence.play();

        // Appliquer l'effet SDF
        const effectApplied = await applySdfEffect(actor);
        if (!effectApplied) {
            ui.notifications.error("❌ Erreur lors de l'application de l'effet.");
            return;
        }

        // Démarrer l'animation persistante
        await startPersistentAnimation(actor.id);

        ui.notifications.info(`🔍 Small Detection Field activé ! ${SPELL_CONFIG.maxCharges} charges disponibles. Coût : ${actualManaCost === 0 ? 'GRATUIT (Focus)' : `${actualManaCost} mana`}`);

    } else {
        // USAGE SUIVANT : Détection et attaque

        const currentCharges = sdfEffect.flags?.statuscounter?.value || 0;

        if (currentCharges <= 0) {
            ui.notifications.warn("⚠️ Small Detection Field n'a plus de charges disponibles !");
            return;
        }

        // Trouver les cibles dans la zone
        const detectedTargets = findTargetsInDetectionRange(caster, SPELL_CONFIG.detectionRadius);

        if (detectedTargets.length === 0) {
            ui.notifications.info("🔍 Aucune cible détectée dans le champ de détection.");
            return;
        }

        // Dialog de sélection de cible
        const selectedTarget = await new Promise((resolve) => {
            const targetOptions = detectedTargets.map((target, index) =>
                `<label style="display: block; margin: 5px 0;">
                    <input type="radio" name="target" value="${index}" ${index === 0 ? 'checked' : ''}>
                    <strong>${target.name}</strong>
                </label>`
            ).join('');

            new Dialog({
                title: `🎯 Small Detection Field - Sélection de Cible`,
                content: `
                    <div style="padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #4169e1;">🎯 Contre-Attaque</h3>
                            <p style="margin: 5px 0; color: #666;">${detectedTargets.length} cible${detectedTargets.length > 1 ? 's' : ''} détectée${detectedTargets.length > 1 ? 's' : ''}</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0;">Sélectionnez une cible :</h4>
                            ${targetOptions}
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                            <p style="margin: 0; font-size: 0.9em; color: #2d5a2d;">
                                <strong>Attaque :</strong> ${SPELL_CONFIG.attackDamageFormula} + ${Math.floor(characteristicInfo.final / 2)} (GRATUITE)<br>
                                <strong>Charges restantes :</strong> ${currentCharges - 1} après cette attaque
                            </p>
                        </div>
                    </div>
                `,
                buttons: {
                    attack: {
                        icon: '<i class="fas fa-crosshairs"></i>',
                        label: "Attaquer",
                        callback: (html) => {
                            const targetIndex = parseInt(html.find('input[name="target"]:checked').val());
                            resolve(detectedTargets[targetIndex]);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "attack"
            }, { width: 450 }).render(true);
        });

        if (!selectedTarget) {
            ui.notifications.info("❌ Attaque annulée.");
            return;
        }

        // ===== CALCUL DE L'ATTAQUE ET DES DÉGÂTS =====
        const senseBonus = Math.floor(characteristicInfo.final / 2);
        let damageFormula = `${SPELL_CONFIG.attackDamageFormula} + ${senseBonus}`;

        // Stance offensive : maximiser les dégâts
        let damageResult;
        if (currentStance === 'offensif') {
            const maxDamage = 3 + senseBonus; // 1d3 -> 3
            damageResult = {
                total: maxDamage,
                formula: `3 + ${senseBonus}`,
                isMaximized: true
            };
        } else {
            const damageRoll = new Roll(damageFormula);
            await damageRoll.evaluate({ async: true });
            damageResult = {
                total: damageRoll.total,
                formula: damageFormula,
                isMaximized: false,
                roll: damageRoll
            };
        }

        // Jet d'attaque
        const attackDice = characteristicInfo.final;
        const levelBonus = 2 * SPELL_CONFIG.spellLevel;
        const attackRoll = new Roll(`${attackDice}d7 + ${levelBonus}`);
        await attackRoll.evaluate({ async: true });

        // ===== ANIMATION D'ATTAQUE =====
        const attackSequence = new Sequence();
        attackSequence.effect()
            .file(SPELL_CONFIG.animations.attackHit)
            .attachTo(selectedTarget.token)
            .scale(0.5);
        await attackSequence.play();

        // ===== MESSAGE DE CHAT =====
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const chatFlavor = `
            <div style="background: linear-gradient(135deg, #f0f8ff, #e8f5e8); padding: 12px; border-radius: 8px; border: 2px solid #4169e1; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #4169e1;">🔍 ${SPELL_CONFIG.name} - Contre-Attaque</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> GRATUIT
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f0f9ff; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #0f172a; margin-bottom: 6px;"><strong>🔍 Détection${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${selectedTarget.name}</div>
                    <div style="font-size: 1.4em; color: #0ea5e9; font-weight: bold;">💥 DÉGÂTS: ${damageResult.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${damageResult.formula})</div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 8px; background: #fef3c7; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #92400e;">
                        <strong>⚡ Effet Spécial:</strong> Les prochains dégâts subis par ${selectedTarget.name} ce tour sont réduits de ${damageResult.total}
                    </div>
                </div>
            </div>
        `;

        // Créer le jet combiné pour le message
        const combinedRoll = new Roll(`{${attackRoll.formula}, ${damageResult.formula}}`);
        await combinedRoll.evaluate({ async: true });

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: chatFlavor,
            rollMode: game.settings.get("core", "rollMode")
        });

        // ===== RÉDUCTION DES CHARGES =====
        await reduceChargesAndCleanup(sdfEffect, actor);

        // ===== NOTIFICATION FINALE =====
        const remainingCharges = Math.max(0, currentCharges - 1);
        const chargesInfo = remainingCharges > 0 ? ` (${remainingCharges} charge${remainingCharges > 1 ? 's' : ''} restante${remainingCharges > 1 ? 's' : ''})` : ' (épuisé)';

        ui.notifications.info(`🔍 Contre-attaque sur ${selectedTarget.name} ! Attaque: ${attackRoll.total}, Dégâts: ${damageResult.total}. Réduction de dégâts appliquée${chargesInfo}.`);
    }

    console.log(`[SDF] Small Detection Field operation completed for ${actor.name}`);

})();
