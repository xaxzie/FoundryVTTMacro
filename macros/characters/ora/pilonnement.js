/**
 * Pilonnement - Ora
 *
 * Sort de préparation et d'attaque de zone de niveau 3 avec système à deux phases.
 *
 * Phase 1 - Préparation :
 * - Coût : Aucun (préparation)
 * - Effet : Active "Preparation Pilonnage" + animation persistante
 * - Vulnérabilité : Interruptible par dégâts (jet de Volonté difficulté 3×dégâts)
 * - Gestion : Configurable via HandleOraEffect (increasable)
 *
 * Phase 2 - Lancement :
 * - Coût : (X + Y) × 3 mana (focus divise par 2)
 * - Caractéristique : Esprit (+ effets actifs)
 * - Dégâts : X × 2d6 + Esprit (demi-offensif)
 * - Zone : Y + 2 cases de rayon
 * - Paramètres : X et Y (1-4)
 * - Bonus : Visée et dégâts d'effets actifs
 *
 * Usage : Premier clic pour se préparer, second clic pour configurer et lancer.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Pilonnement",
        description: "Sort de zone avec préparation interruptible",
        spellLevel: 3,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        damageFormula: "2d6", // Multiplié par X
        isDirect: true,
        isFocusable: true,
        isHalfFocusable: true, // Focus divise par 2 au lieu de gratuit
        isHalfOffensive: true, // Position offensive ne maximise que la moitié des dés

        // Paramètres configurables
        minValue: 1,
        maxValue: 4,
        baseCostMultiplier: 3, // (X + Y) × 3

        animations: {
            preparation: "jb2a_patreon.shield_themed.above.ice.01.blue",
            cast: "jb2a.cast_generic.water.02.blue.0",
            impact: "jb2a_patreon.ice_spikes.radial.burst.white",
            sound: null
        },

        // Configuration de l'effet de préparation
        preparationEffect: {
            name: "Preparation Pilonnage",
            icon: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp",
            description: "Préparation du sort Pilonnement (interruptible)",
            duration: { seconds: 86400 }, // Permanent jusqu'à utilisation
            flags: {
                world: {
                    oraCaster: "CASTER_ID",
                    spellName: "Pilonnement",
                    effectType: "preparation",
                    appliedAt: "TIMESTAMP",
                    increasable: true
                },
                statuscounter: { value: 1 }
            },
            changes: [],
            tint: "#4169e1",
            // Configuration pour HandleOraEffect
            handleOraConfig: {
                displayName: "Preparation Pilonnage",
                sectionTitle: "⚡ Préparation de Sort",
                sectionIcon: "⚡",
                cssClass: "preparation-effect",
                borderColor: "#4169e1",
                bgColor: "#f0f8ff",
                mechanicType: "preparation",
                tags: ["increasable"],
                detectFlags: [
                    { path: "name", matchValue: "Preparation Pilonnage" },
                    { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
                ],
                getExtraData: (effect) => ({
                    preparationLevel: effect.flags?.statuscounter?.value || 1,
                    sourceSpell: "Pilonnement"
                }),
                getDynamicDescription: (effect) => {
                    const level = effect.flags?.statuscounter?.value || 1;
                    return `Préparation du Pilonnement (Niveau ${level}) - Interruptible par dégâts`;
                },
                onRemoval: async (effect, actor) => {
                    // Arrêter l'animation persistante lors de la suppression
                    try {
                        if (typeof Sequencer !== "undefined") {
                            await Sequencer.EffectManager.endEffects({
                                name: `Pilonnement_Preparation_${actor.id}`
                            });
                            console.log(`[Pilonnement] Stopped preparation animation for ${actor.name}`);
                        }
                    } catch (error) {
                        console.warn(`[Pilonnement] Could not stop preparation animation: ${error.message}`);
                    }
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
     * Vérifie si l'effet de préparation est actif
     */
    function getPreparationEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === "Preparation Pilonnage" &&
            e.flags?.world?.oraCaster === actor.id
        ) || null;
    }

    /**
     * Démarre l'animation persistante de préparation
     */
    async function startPreparationAnimation(actorId) {
        const sequence = new Sequence();

        sequence.effect()
            .file(SPELL_CONFIG.animations.preparation)
            .attachTo(caster)
            .scale(0.6)
            .fadeIn(1000)
            .fadeOut(1000)
            .persist(true)
            .name(`Pilonnement_Preparation_${actorId}`)
            .belowTokens(false)
            .opacity(0.8);

        await sequence.play();
    }

    /**
     * Arrête l'animation persistante de préparation
     */
    async function stopPreparationAnimation(actorId) {
        try {
            await Sequencer.EffectManager.endEffects({
                name: `Pilonnement_Preparation_${actorId}`
            });
            console.log(`[Pilonnement] Stopped preparation animation for actor ${actorId}`);
        } catch (error) {
            console.warn(`[Pilonnement] Could not stop preparation animation: ${error.message}`);
        }
    }

    /**
     * Applique l'effet de préparation sur Ora
     */
    async function applyPreparationEffect(actor) {
        const effectData = {
            name: SPELL_CONFIG.preparationEffect.name,
            icon: SPELL_CONFIG.preparationEffect.icon,
            description: SPELL_CONFIG.preparationEffect.description,
            origin: actor.id,
            disabled: false,
            duration: { ...SPELL_CONFIG.preparationEffect.duration },
            flags: JSON.parse(JSON.stringify(SPELL_CONFIG.preparationEffect.flags)),
            changes: [...SPELL_CONFIG.preparationEffect.changes],
            tint: SPELL_CONFIG.preparationEffect.tint
        };

        // Remplacer les valeurs dynamiques
        effectData.flags.world.oraCaster = actor.id;
        effectData.flags.world.appliedAt = Date.now();

        try {
            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            console.log(`[Pilonnement] Applied preparation effect to ${actor.name}`);
            return true;
        } catch (error) {
            console.error(`[Pilonnement] Error applying preparation effect:`, error);
            return false;
        }
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const preparationEffect = getPreparationEffect(actor);

    // ===== LOGIQUE PRINCIPALE =====

    if (!preparationEffect) {
        // PHASE 1 : PRÉPARATION

        // Dialog de confirmation pour la préparation
        const confirmed = await new Promise((resolve) => {
            new Dialog({
                title: `⚡ ${SPELL_CONFIG.name} - Préparation`,
                content: `
                    <div style="padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #4169e1;">⚡ ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Phase:</strong> Préparation</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">⚙️ Préparation du Sort</h4>
                            <p><strong>Niveau :</strong> ${SPELL_CONFIG.spellLevel}</p>
                            <p><strong>Coût de préparation :</strong> Aucun</p>
                            <p><strong>Animation :</strong> Bouclier de glace persistant</p>
                            <p><strong>Effet :</strong> "Preparation Pilonnage" appliqué</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #856404;">⚠️ Vulnérabilité</h4>
                            <p style="margin: 5px 0; font-size: 0.9em; color: #856404;">
                                <strong>Interruptible :</strong> Si Ora subit des dégâts pendant la préparation, elle doit réussir un jet de Volonté de difficulté <strong>3 × dégâts subis</strong> pour maintenir sa concentration.
                            </p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #2d5a2d;">📝 Prochaine Phase</h4>
                            <p style="margin: 5px 0; font-size: 0.9em;">Une fois préparé, relancez la macro pour configurer :</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• <strong>X :</strong> Multiplicateur de dégâts (1-4)</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• <strong>Y :</strong> Modificateur de zone (1-4)</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• <strong>Coût final :</strong> (X + Y) × 3 mana</p>
                        </div>
                    </div>
                `,
                buttons: {
                    prepare: {
                        icon: '<i class="fas fa-shield-alt"></i>',
                        label: "⚡ Commencer la Préparation",
                        callback: () => resolve(true)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(false)
                    }
                },
                default: "prepare"
            }, { width: 500 }).render(true);
        });

        if (!confirmed) {
            ui.notifications.info("❌ Préparation annulée.");
            return;
        }

        // Appliquer l'effet de préparation
        const effectApplied = await applyPreparationEffect(actor);
        if (!effectApplied) {
            ui.notifications.error("❌ Erreur lors de l'application de l'effet de préparation.");
            return;
        }

        // Démarrer l'animation persistante
        await startPreparationAnimation(actor.id);

        // Message dans le chat pour la préparation
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #f0f8ff, #e8f4fd); border-radius: 8px; border: 2px solid #4169e1; margin: 8px 0;">
                    <h3 style="margin: 0; color: #4169e1;">⚡ ${SPELL_CONFIG.name} - Préparation</h3>
                    <div style="margin: 5px 0;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Phase:</strong> Préparation
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 4px;">
                        <p style="margin: 0; font-size: 0.9em; color: #856404;">
                            <strong>⚠️ Ora se prépare à lancer un sort</strong><br>
                            Il est interruptible si elle subit des dégâts.<br>
                            Elle doit passer un jet de Volonté de difficulté <strong>3 fois les dégâts subis</strong> pour conserver sa concentration.
                        </p>
                    </div>
                </div>
            `,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`⚡ Préparation du ${SPELL_CONFIG.name} commencée ! Ora est maintenant vulnérable aux interruptions.`);

    } else {
        // PHASE 2 : CONFIGURATION ET LANCEMENT

        // Dialog de configuration X et Y
        const spellConfig = await new Promise((resolve) => {
            new Dialog({
                title: `⚡ ${SPELL_CONFIG.name} - Configuration`,
                content: `
                    <div style="padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #4169e1;">⚡ ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Phase:</strong> Lancement</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">⚙️ Configuration du Sort</h4>
                            <div style="margin: 10px 0;">
                                <label><strong>X (Multiplicateur de dégâts) :</strong></label>
                                <input type="number" id="valueX" value="1" min="${SPELL_CONFIG.minValue}" max="${SPELL_CONFIG.maxValue}"
                                       style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ccc; border-radius: 3px;" onchange="updateCalculations()"/>
                                <small style="display: block; margin-left: 20px; color: #666;">Dégâts = X × 2d6 + Esprit</small>
                            </div>
                            <div style="margin: 10px 0;">
                                <label><strong>Y (Modificateur de zone) :</strong></label>
                                <input type="number" id="valueY" value="1" min="${SPELL_CONFIG.minValue}" max="${SPELL_CONFIG.maxValue}"
                                       style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ccc; border-radius: 3px;" onchange="updateCalculations()"/>
                                <small style="display: block; margin-left: 20px; color: #666;">Zone = Y + 2 cases de rayon</small>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #e65100;">📊 Calculs Dynamiques</h4>
                            <div id="calculations" style="font-family: monospace; font-size: 0.9em; color: #374151;">
                                <!-- Will be updated by JavaScript -->
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #2d5a2d;">🎯 Bonus d'Effets</h4>
                            <p style="margin: 5px 0; font-size: 0.9em;">• Bonus de visée : ${getActiveEffectBonus(actor, 'esprit')}</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• Bonus de dégâts : ${getActiveEffectBonus(actor, 'damage')}</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">• Position : ${currentStance ? currentStance.charAt(0).toUpperCase() + currentStance.slice(1) : 'Aucune'}</p>
                            ${currentStance === 'offensif' ? '<p style="margin: 5px 0; font-size: 0.9em; color: #d32f2f;">• <strong>Demi-Offensif :</strong> Moitié des dés maximisés</p>' : ''}
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-bolt"></i>',
                        label: "⚡ Lancer le Sort",
                        callback: (html) => {
                            const valueX = parseInt(html.find("#valueX").val()) || 1;
                            const valueY = parseInt(html.find("#valueY").val()) || 1;
                            resolve({ valueX, valueY });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                render: (html) => {
                    // Function to update calculations display
                    function updateCalculations() {
                        const x = parseInt(html.find("#valueX").val()) || 1;
                        const y = parseInt(html.find("#valueY").val()) || 1;
                        const totalCost = (x + y) * SPELL_CONFIG.baseCostMultiplier;
                        const focusCost = currentStance === 'focus' ? Math.floor(totalCost / 2) : totalCost;
                        const focusCostDisplay = focusCost !== totalCost ? `${focusCost} mana (Focus - coût réduit)` : `${totalCost} mana`;
                        const zone = y + 2;

                        const calcHtml = `
                            <strong>Coût:</strong> (${x} + ${y}) × ${SPELL_CONFIG.baseCostMultiplier} = ${focusCostDisplay}<br>
                            <strong>Zone:</strong> ${y} + 2 = ${zone} case${zone > 1 ? 's' : ''} de rayon<br>
                            <strong>Dégâts:</strong> ${x} × 2d6 + Esprit (${characteristicInfo.final})<br>
                            <strong>Attaque:</strong> ${characteristicInfo.final + getActiveEffectBonus(actor, 'esprit')}d7 + ${2 * SPELL_CONFIG.spellLevel}
                        `;
                        html.find("#calculations").html(calcHtml);
                    }

                    // Make updateCalculations available globally for the onchange events
                    window.updateCalculations = updateCalculations;

                    // Initial calculation
                    updateCalculations();
                },
                close: () => resolve(null)
            }, {
                width: 520,
                height: "auto"
            }).render(true);
        });

        if (!spellConfig) {
            ui.notifications.info("❌ Lancement annulé.");
            return;
        }

        const { valueX, valueY } = spellConfig;
        const totalBaseCost = (valueX + valueY) * SPELL_CONFIG.baseCostMultiplier;
        const actualManaCost = currentStance === 'focus' ? Math.floor(totalBaseCost / 2) : totalBaseCost;
        const areaRadius = valueY + 2;

        // ===== TARGETING via Portal =====
        let target;
        try {
            const portal = new Portal()
                .origin(caster)
                .range(120)
                .color("#4169e1")
                .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm");

            target = await portal.pick();
            if (!target) {
                ui.notifications.info("❌ Ciblage annulé.");
                return;
            }
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return;
        }

        // ===== AREA TARGET DETECTION =====
        function findTargetsInArea(centerLocation, radius) {
            const targets = [];
            const gridSize = canvas.grid.size;

            const centerGridX = Math.floor(centerLocation.x / gridSize);
            const centerGridY = Math.floor(centerLocation.y / gridSize);

            for (const token of canvas.tokens.placeables) {
                if (!(token.isVisible || token.isOwner || game.user.isGM)) continue;

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

        const areaTargets = findTargetsInArea(target, areaRadius);

        // ===== DAMAGE CALCULATION =====
        async function calculateDamage() {
            const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
            const damageBonus = getActiveEffectBonus(actor, "damage");
            const totalCharacteristic = characteristicInfo.final + characteristicBonus + damageBonus;

            // Calcul des dégâts : X × 2d6 + Esprit
            const baseDiceCount = valueX * 2; // X × 2d6
            let damageFormula = `${baseDiceCount}d6 + ${totalCharacteristic}`;

            // Position Offensive : Demi-offensif (moitié des dés maximisés)
            if (currentStance === 'offensif') {
                const maximizedDice = Math.floor(baseDiceCount / 2);
                const normalDice = baseDiceCount - maximizedDice;

                if (normalDice > 0) {
                    // Partie normale + partie maximisée
                    const normalRoll = new Roll(`${normalDice}d6`);
                    await normalRoll.evaluate({ async: true });
                    const maximizedDamage = (maximizedDice * 6) + totalCharacteristic + normalRoll.total;

                    return {
                        total: maximizedDamage,
                        formula: `${normalDice}d6 + ${maximizedDice * 6} + ${totalCharacteristic}`,
                        isHalfMaximized: true,
                        normalDice: normalDice,
                        maximizedDice: maximizedDice,
                        roll: normalRoll
                    };
                } else {
                    // Tous les dés sont maximisés
                    const maxDamage = (maximizedDice * 6) + totalCharacteristic;
                    return {
                        total: maxDamage,
                        formula: `${maximizedDice * 6} + ${totalCharacteristic}`,
                        isHalfMaximized: true,
                        normalDice: 0,
                        maximizedDice: maximizedDice
                    };
                }
            } else {
                const roll = new Roll(damageFormula);
                await roll.evaluate({ async: true });
                return {
                    total: roll.total,
                    formula: damageFormula,
                    isHalfMaximized: false,
                    roll: roll
                };
            }
        }

        const damageResult = await calculateDamage();

        // ===== CLEANUP PREPARATION =====
        // Supprimer l'effet de préparation et arrêter l'animation
        await preparationEffect.delete();
        await stopPreparationAnimation(actor.id);

        // ===== SEQUENCER ANIMATION =====
        async function playSpellAnimation() {
            let sequence = new Sequence();

            // Animation de cast
            sequence.effect()
                .file(SPELL_CONFIG.animations.cast)
                .attachTo(caster)
                .scale(0.8)
                .delay(200);

            // Impact de zone
            sequence.effect()
                .file(SPELL_CONFIG.animations.impact)
                .atLocation(target)
                .scale(areaRadius * 0.3)
                .delay(800);

            if (SPELL_CONFIG.animations.sound) {
                sequence.sound().file(SPELL_CONFIG.animations.sound);
            }

            await sequence.play();
        }

        await playSpellAnimation();

        // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const totalAttackDice = characteristicInfo.final + characteristicBonus;
        const levelBonus = 2 * SPELL_CONFIG.spellLevel;

        // Build combined roll formula
        let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];
        let finalDamageResult = damageResult;

        if (currentStance === 'offensif') {
            // Position Offensive : Demi-offensif (moitié des dés maximisés, moitié jetés)
            const totalCharacteristic = characteristicInfo.final + characteristicBonus + getActiveEffectBonus(actor, "damage");
            const baseDiceCount = valueX * 2;
            const maximizedDice = Math.floor(baseDiceCount / 2);
            const normalDice = baseDiceCount - maximizedDice;

            if (normalDice > 0) {
                // Ajouter les dés normaux au jet combiné
                combinedRollParts.push(`${normalDice}d6 + ${maximizedDice * 6} + ${totalCharacteristic}`);
            } else {
                // Tous les dés sont maximisés - pas de jet de dés nécessaire
                const maxDamage = (maximizedDice * 6) + totalCharacteristic;
                finalDamageResult = {
                    total: maxDamage,
                    formula: `${maximizedDice * 6} + ${totalCharacteristic}`,
                    isHalfMaximized: true,
                    normalDice: 0,
                    maximizedDice: maximizedDice
                };
            }
        } else {
            // Position normale : tous les dés sont jetés
            const totalCharacteristic = characteristicInfo.final + characteristicBonus + getActiveEffectBonus(actor, "damage");
            const baseDiceCount = valueX * 2;
            combinedRollParts.push(`${baseDiceCount}d6 + ${totalCharacteristic}`);
        }

        const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        // Extract results from the combined roll
        const attackResult = combinedRoll.terms[0].results[0];

        // Traiter le résultat des dégâts selon la position
        if (currentStance === 'offensif' && combinedRoll.terms[0].results.length > 1) {
            // Position offensive avec dés jetés
            const damageRollResult = combinedRoll.terms[0].results[1];
            const totalCharacteristic = characteristicInfo.final + characteristicBonus + getActiveEffectBonus(actor, "damage");
            const baseDiceCount = valueX * 2;
            const maximizedDice = Math.floor(baseDiceCount / 2);
            const normalDice = baseDiceCount - maximizedDice;

            finalDamageResult = {
                total: damageRollResult.result,
                formula: `${normalDice}d6 + ${maximizedDice * 6} + ${totalCharacteristic}`,
                isHalfMaximized: true,
                normalDice: normalDice,
                maximizedDice: maximizedDice,
                result: damageRollResult.result
            };
        } else if (currentStance !== 'offensif') {
            // Position normale
            const damageRollResult = combinedRoll.terms[0].results[1];
            const totalCharacteristic = characteristicInfo.final + characteristicBonus + getActiveEffectBonus(actor, "damage");
            const baseDiceCount = valueX * 2;
            const displayFormula = `${baseDiceCount}d6 + ${totalCharacteristic}`;

            finalDamageResult = {
                total: damageRollResult.result,
                formula: displayFormula,
                result: damageRollResult.result
            };
        }

        // ===== CHAT MESSAGE =====
        function createChatFlavor() {
            const actualManaCostDisplay = actualManaCost === totalBaseCost ? `${actualManaCost} mana` : `${actualManaCost} mana (Focus - coût réduit)`;

            const attackDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                </div>
            `;

            const stanceNote = currentStance === 'offensif' ? ' <em>(DEMI-MAXIMISÉ)</em>' : '';
            const targetNames = areaTargets.length > 0 ? areaTargets.map(t => t.name).join(', ') : 'Aucune cible';
            const damageDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f0f9ff; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #0f172a; margin-bottom: 6px;"><strong>⚡ ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Configuration:</strong> X=${valueX}, Y=${valueY} | <strong>Zone:</strong> ${areaRadius} case${areaRadius > 1 ? 's' : ''}</div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cibles:</strong> ${targetNames}</div>
                    <div style="font-size: 1.4em; color: #0ea5e9; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${valueX} × 2d6 + Esprit + bonus)</div>
                </div>
            `;

            return `
                <div style="background: linear-gradient(135deg, #f0f8ff, #e8f4fd); padding: 12px; border-radius: 8px; border: 2px solid #4169e1; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #4169e1;">⚡ ${SPELL_CONFIG.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                            ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                        </div>
                    </div>
                    ${attackDisplay}
                    ${damageDisplay}
                </div>
            `;
        }

        const enhancedFlavor = createChatFlavor();

        // Send the unified dice roll message
        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: enhancedFlavor,
            rollMode: game.settings.get("core", "rollMode")
        });

        // ===== FINAL NOTIFICATION =====
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const manaCostInfo = actualManaCost === totalBaseCost ? ` - ${actualManaCost} mana` : ` - ${actualManaCost} mana (Focus)`;
        const targetCount = areaTargets.length;

        ui.notifications.info(`⚡ ${SPELL_CONFIG.name} lancé !${stanceInfo} Configuration: X=${valueX}, Y=${valueY}. ${targetCount} cible${targetCount > 1 ? 's' : ''} dans ${areaRadius} case${areaRadius > 1 ? 's' : ''} de rayon. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${manaCostInfo}`);

        console.log(`[DEBUG] Pilonnement cast complete - Caster: ${actor.name}, X: ${valueX}, Y: ${valueY}, Targets: ${targetCount}, Damage: ${finalDamageResult.total}`);
    }

})();
