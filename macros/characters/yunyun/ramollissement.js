/**
 * Ramollissement - Yunyun
 *
 * Yunyun ramollit le sol dans une zone choisie, créant une zone de contrôle persistante.
 * Sort de terrain avec mécaniques de ralentissement et réactivation.
 *
 * Première Utilisation :
 * - Coût : 3 mana (focalisable - gratuit en focus)
 * - Zone : 4 cases de rayon à la position choisie
 * - Animation persistante de zone ramollie
 * - Applique "Sol Ramoli" aux cibles présentes (ralentissement Charisme/3 cases, arrondi supérieur)
 *
 * Réutilisation (si zone existe déjà) :
 * - Choix : Mettre fin au sort OU réappliquer les effets (gratuit)
 * - Réapplication : Retire tous les effets "Sol Ramoli" du canvas, puis les remet aux tokens dans la zone
 *
 * Mécaniques :
 * - Zone persistante avec animation continue
 * - Détection automatique des tokens dans la zone
 * - Ralentissement basé sur le Charisme de Yunyun
 * - Gestion des effets par endYunYunEffect.js
 *
 * Usage : Sélectionner le token de Yunyun, cibler la position souhaitée.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Ramollissement",
        description: "Ramollissement persistant du sol en zone",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        manaCost: 3,
        isDirect: true,
        isFocusable: true,
        radius: 4, // cases
        effectName: "Sol Ramoli",
        effectIcon: "icons/magic/earth/barrier-stone-brown.webp",
        sequencerIdentifier: "ramollissement_yunyun_zone",
        animations: {
            cast: "jb2a.cast_generic.02.brown.0",
            zone: "jb2a.template_circle.aura.01.complete.02.brown",
            impact: "jb2a.impact.earth.01.browngreen.0",
            sound: null
        },
        targeting: {
            color: "#8d6e63",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Brown_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Yunyun !");
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
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "charisme")
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            if (!effect.flags?.world) continue;

            for (const [key, value] of Object.entries(effect.flags.world)) {
                if (key === flagKey && typeof value === 'number') {
                    totalBonus += value;
                }
            }
        }

        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        // Get base characteristic from character sheet
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
            return { base: 3, injuries: 0, effectBonus: 0, injuryAdjusted: 3, final: 3 };
        }
        const baseValue = charAttribute.value || 3;

        // Detect injury stacks and reduce characteristic accordingly
        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        // Get active effect bonuses for the characteristic
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        console.log(`[DEBUG] Base ${characteristic}: ${baseValue}, Injury stacks: ${injuryStacks}, Effect bonus: ${effectBonus}`);

        // Calculate final value: base - injuries + effects, minimum of 1
        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${characteristic} reduced by ${injuryStacks} due to injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[DEBUG] ${characteristic} ${effectBonus > 0 ? 'increased' : 'decreased'} by ${effectBonus} due to active effects`);
        }

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Calcule le coût en mana basé sur la stance
     */
    function calculateManaCost(baseCost, stance, isFocusable) {
        return stance === 'focus' && isFocusable ? 0 : baseCost;
    }

    /**
     * Vérifie si une zone de ramollissement existe déjà
     */
    function checkExistingZone() {
        // Chercher les effets Sequencer avec l'identifiant du sort
        const existingEffects = Sequencer.EffectManager.getEffects();

        for (const effect of existingEffects) {
            if (effect.data?.name?.includes(SPELL_CONFIG.sequencerIdentifier)) {
                console.log(`[DEBUG] Existing ramollissement zone found:`, effect.data);
                return {
                    exists: true,
                    effect: effect,
                    position: {
                        x: effect.data.position?.x || 0,
                        y: effect.data.position?.y || 0
                    }
                };
            }
        }

        return { exists: false };
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);
    const slowdownAmount = Math.ceil(characteristicInfo.final / 3); // Charisme/3 arrondi supérieur

    // Vérifier si une zone existe déjà
    const existingZone = checkExistingZone();

    // ===== REACTIVATION DIALOG (si zone existe) =====
    if (existingZone.exists) {
        const reactivationChoice = await new Promise((resolve) => {
            const dialogContent = `
                <div style="background: linear-gradient(135deg, #efebe9, #d7ccc8); padding: 15px; border-radius: 10px; border: 2px solid #8d6e63; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #5d4037; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            🌍 ${SPELL_CONFIG.name} Actif 🌍
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">Une zone de ramollissement est déjà active</p>
                    </div>

                    <div style="background: rgba(141, 110, 99, 0.1); padding: 12px; border-radius: 8px; border: 1px solid #8d6e63; margin-bottom: 15px;">
                        <h3 style="color: #5d4037; margin: 0 0 10px 0;">Options disponibles :</h3>
                        <div style="margin: 10px 0; padding: 8px; background: rgba(76, 175, 80, 0.1); border-radius: 5px;">
                            <strong>🔄 Réappliquer les effets</strong> (Gratuit)<br>
                            <span style="font-size: 0.9em; color: #666;">
                                • Retire tous les effets "Sol Ramoli" actuels<br>
                                • Les remet aux tokens actuellement dans la zone<br>
                                • Ralentissement: ${slowdownAmount} case${slowdownAmount > 1 ? 's' : ''}
                            </span>
                        </div>
                        <div style="margin: 10px 0; padding: 8px; background: rgba(244, 67, 54, 0.1); border-radius: 5px;">
                            <strong>🛑 Mettre fin au sort</strong><br>
                            <span style="font-size: 0.9em; color: #666;">
                                • Supprime la zone de ramollissement<br>
                                • Retire tous les effets "Sol Ramoli"
                            </span>
                        </div>
                    </div>
                </div>
            `;

            new Dialog({
                title: `${SPELL_CONFIG.name} - Zone Existante`,
                content: dialogContent,
                buttons: {
                    reapply: {
                        icon: '<i class="fas fa-redo"></i>',
                        label: "Réappliquer les Effets",
                        callback: () => resolve('reapply')
                    },
                    end: {
                        icon: '<i class="fas fa-stop"></i>',
                        label: "Mettre Fin au Sort",
                        callback: () => resolve('end')
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "reapply",
                render: () => {
                    console.log(`[DEBUG] Reactivation dialog rendered for existing ${SPELL_CONFIG.name} zone`);
                }
            }).render(true);
        });

        if (!reactivationChoice) {
            ui.notifications.info("❌ Action annulée.");
            return;
        }

        if (reactivationChoice === 'end') {
            // Terminer le sort
            await endRamollissementSpell();
            ui.notifications.info("🛑 Zone de ramollissement terminée !");
            return;
        } else if (reactivationChoice === 'reapply') {
            // Réappliquer les effets
            await reapplyRamollissementEffects(existingZone.position);
            ui.notifications.info("🔄 Effets de ramollissement réappliqués (gratuit) !");
            return;
        }
    }

    // ===== TARGETING SYSTEM (nouveau sort uniquement) =====
    /**
     * Selects a target area using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTargetArea() {
        try {
            const crosshairs = await portal.crosshairs.show({
                size: canvas.grid.size * SPELL_CONFIG.radius * 2, // Diamètre = rayon * 2
                icon: SPELL_CONFIG.targeting.texture,
                label: `${SPELL_CONFIG.name} (${SPELL_CONFIG.radius} cases)`,
                borderColor: SPELL_CONFIG.targeting.color,
                fillAlpha: 0.25,
                interval: -1
            });
            return crosshairs;
        } catch (error) {
            console.error("[DEBUG] Portal targeting error:", error);
            ui.notifications.error("❌ Erreur lors du ciblage. Vérifiez que le module Portal est installé et actif.");
            return null;
        }
    }

    const target = await selectTargetArea();
    if (!target) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== AREA TARGET DETECTION =====
    /**
     * Finds targets in the ramollissement area
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Radius in grid squares
     * @returns {Array} Array of target objects
     */
    function findTargetsInArea(centerX, centerY, radius) {
        const targets = [];
        const gridSize = canvas.grid.size;

        // Convert center position to grid coordinates
        const centerGridX = Math.floor(centerX / gridSize);
        const centerGridY = Math.floor(centerY / gridSize);

        console.log(`[DEBUG] Searching for targets in ${radius}-square radius around (${centerGridX}, ${centerGridY})`);

        for (const token of canvas.tokens.placeables) {
            if (!token.visible) continue;

            // Get token center and convert to grid coordinates
            const tokenCenterX = token.x + (token.width / 2);
            const tokenCenterY = token.y + (token.height / 2);
            const tokenGridX = Math.floor(tokenCenterX / gridSize);
            const tokenGridY = Math.floor(tokenCenterY / gridSize);

            // Calculate grid distance from center
            const deltaX = Math.abs(tokenGridX - centerGridX);
            const deltaY = Math.abs(tokenGridY - centerGridY);

            // Use Chebyshev distance (max of deltaX, deltaY) for square grid
            const gridDistance = Math.max(deltaX, deltaY);

            if (gridDistance <= radius) {
                console.log(`[DEBUG] Target found: ${token.name} at grid distance ${gridDistance}`);
                targets.push({
                    token: token,
                    name: token.name,
                    actor: token.actor,
                    distance: gridDistance,
                    gridX: tokenGridX,
                    gridY: tokenGridY
                });
            }
        }

        return targets;
    }

    const areaTargets = findTargetsInArea(target.x, target.y, SPELL_CONFIG.radius);

    console.log(`[DEBUG] Area targets found: ${areaTargets.length}`);
    areaTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name} (distance: ${target.distance})`);
    });

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        try {
            const sequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animations.cast)
                    .attachTo(caster)
                    .scale(0.8)
                    .waitUntilFinished(-500)

                .effect()
                    .file(SPELL_CONFIG.animations.impact)
                    .atLocation({ x: target.x, y: target.y })
                    .scale(SPELL_CONFIG.radius * 0.3)
                    .waitUntilFinished(-1000)

                .effect()
                    .file(SPELL_CONFIG.animations.zone)
                    .atLocation({ x: target.x, y: target.y })
                    .scale(SPELL_CONFIG.radius * 0.5)
                    .fadeIn(1000)
                    .belowTokens()
                    .name(`${SPELL_CONFIG.sequencerIdentifier}_${randomID()}`)
                    .persist(); // Zone persistante

            await sequence.play();
        } catch (error) {
            console.error("[DEBUG] Animation error:", error);
        }
    }

    await playSpellAnimation();

    // ===== EFFECT APPLICATION =====
    /**
     * Applique l'effet "Sol Ramoli" aux cibles
     * @param {Array} targets - Liste des cibles
     * @param {number} slowdownAmount - Montant du ralentissement
     */
    async function applySolRamoliEffect(targets, slowdownAmount) {
        for (const target of targets) {
            if (!target.actor) continue;

            // Vérifier si l'effet existe déjà
            const existingEffect = target.actor.effects?.contents?.find(e =>
                e.name === SPELL_CONFIG.effectName
            );

            if (existingEffect) {
                console.log(`[DEBUG] ${target.name} already has Sol Ramoli effect, skipping`);
                continue;
            }

            const effectData = {
                name: SPELL_CONFIG.effectName,
                icon: SPELL_CONFIG.effectIcon,
                description: `Sol ramolli par Yunyun (-${slowdownAmount} case${slowdownAmount > 1 ? 's' : ''} de déplacement)`,
                flags: {
                    world: {
                        yunyunCaster: actor.id,
                        spellName: SPELL_CONFIG.name,
                        slowdownAmount: slowdownAmount
                    },
                    statuscounter: {
                        value: slowdownAmount,
                        max: slowdownAmount
                    }
                },
                duration: {
                    rounds: null // Permanent jusqu'à suppression manuelle
                }
            };

            try {
                await target.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                console.log(`[DEBUG] Applied Sol Ramoli effect to ${target.name} (slowdown: ${slowdownAmount})`);
            } catch (error) {
                console.error(`[DEBUG] Failed to apply effect to ${target.name}:`, error);
            }
        }
    }

    if (areaTargets.length > 0) {
        await applySolRamoliEffect(areaTargets, slowdownAmount);
    }

    // ===== UTILITY FUNCTIONS FOR REACTIVATION =====
    /**
     * Termine le sort de ramollissement
     */
    async function endRamollissementSpell() {
        // Supprimer les animations Sequencer
        const effects = Sequencer.EffectManager.getEffects();
        for (const effect of effects) {
            if (effect.data?.name?.includes(SPELL_CONFIG.sequencerIdentifier)) {
                await Sequencer.EffectManager.endEffects({ name: effect.data.name });
            }
        }

        // Supprimer tous les effets "Sol Ramoli" de Yunyun
        await removeAllSolRamoliEffects();
    }

    /**
     * Réapplique les effets dans la zone existante
     * @param {Object} zonePosition - Position de la zone existante
     */
    async function reapplyRamollissementEffects(zonePosition) {
        // Supprimer tous les effets "Sol Ramoli" actuels
        await removeAllSolRamoliEffects();

        // Trouver les nouvelles cibles dans la zone
        const newTargets = findTargetsInArea(zonePosition.x, zonePosition.y, SPELL_CONFIG.radius);

        console.log(`[DEBUG] Reapplying effects to ${newTargets.length} targets in existing zone`);

        // Appliquer les effets aux nouvelles cibles
        if (newTargets.length > 0) {
            await applySolRamoliEffect(newTargets, slowdownAmount);
        }

        // Message de chat pour la réactivation
        const reapplyFlavor = `
        <div style="background: linear-gradient(135deg, #efebe9, #d7ccc8); padding: 12px; border-radius: 8px; border: 2px solid #8d6e63;">
            <div style="text-align: center; margin-bottom: 10px;">
                <h3 style="color: #5d4037; margin: 0;">🔄 ${SPELL_CONFIG.name} - Réactivation 🔄</h3>
                <div style="color: #666; font-size: 0.9em;">Lanceur: <strong>${actor.name}</strong></div>
            </div>

            <div style="background: rgba(141, 110, 99, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                <div><strong>Effets Réappliqués:</strong> ${newTargets.length} cible${newTargets.length > 1 ? 's' : ''}</div>
                <div><strong>Ralentissement:</strong> ${slowdownAmount} case${slowdownAmount > 1 ? 's' : ''} de déplacement</div>
                <div><strong>Coût:</strong> <span style="color: #4caf50; font-weight: bold;">GRATUIT</span> (Réactivation)</div>
            </div>
        </div>`;

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: reapplyFlavor,
            rollMode: game.settings.get("core", "rollMode")
        });
    }

    /**
     * Supprime tous les effets "Sol Ramoli" de Yunyun
     */
    async function removeAllSolRamoliEffects() {
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            const solRamoliEffect = token.actor.effects?.contents?.find(e =>
                e.name === SPELL_CONFIG.effectName &&
                e.flags?.world?.yunyunCaster === actor.id
            );

            if (solRamoliEffect) {
                try {
                    await solRamoliEffect.delete();
                    console.log(`[DEBUG] Removed Sol Ramoli effect from ${token.name}`);
                } catch (error) {
                    console.error(`[DEBUG] Failed to remove effect from ${token.name}:`, error);
                }
            }
        }
    }

    // ===== CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const targetNames = areaTargets.map(t => t.name).join(', ');

        return `
        <div style="background: linear-gradient(135deg, #efebe9, #d7ccc8); padding: 12px; border-radius: 8px; border: 2px solid #8d6e63;">
            <div style="text-align: center; margin-bottom: 10px;">
                <h3 style="color: #5d4037; margin: 0;">🌍 ${SPELL_CONFIG.name} 🌍</h3>
                <div style="color: #666; font-size: 0.9em;">Lanceur: <strong>${actor.name}</strong>${stanceInfo}</div>
                ${areaTargets.length > 0 ? `<div style="color: #666; font-size: 0.85em; margin-top: 5px;">Cibles affectées (${areaTargets.length}): ${targetNames}</div>` : ''}
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 10px 0;">
                <div style="background: rgba(255, 152, 0, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
                    <strong>${actualManaCost} mana</strong><br>
                    <span style="font-size: 0.85em;">${actualManaCost === 0 ? 'Gratuit (Focus)' : 'Coût normal'}</span>
                </div>
                <div style="background: rgba(244, 67, 54, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
                    <strong>${SPELL_CONFIG.radius} cases</strong><br>
                    <span style="font-size: 0.85em;">Rayon d'effet</span>
                </div>
                <div style="background: rgba(76, 175, 80, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
                    <strong>-${slowdownAmount} cases</strong><br>
                    <span style="font-size: 0.85em;">Ralentissement</span>
                </div>
            </div>

            <div style="background: rgba(33, 150, 243, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                <div><strong>Zone Persistante:</strong> Le sol reste ramolli jusqu'à fin manuelle du sort</div>
                <div><strong>Effet "Sol Ramoli":</strong> ${slowdownAmount} case${slowdownAmount > 1 ? 's' : ''} de déplacement en moins</div>
                <div style="font-size: 0.85em; color: #666; margin-top: 5px;"><em>Relancer la macro pour réappliquer les effets ou terminer le sort</em></div>
            </div>
        </div>`;
    }

    const enhancedFlavor = createChatFlavor();

    // Send the chat message
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const manaCostInfo = actualManaCost === 0 ? ' - GRATUIT (Focus)' : ` - ${actualManaCost} mana`;
    const targetCount = areaTargets.length;

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Zone persistante créée (${SPELL_CONFIG.radius} cases). ${targetCount} cible${targetCount > 1 ? 's' : ''} affectée${targetCount > 1 ? 's' : ''} (ralentissement: ${slowdownAmount} case${slowdownAmount > 1 ? 's' : ''})${manaCostInfo}`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Caster: ${actor.name}, Targets: ${targetCount}, Slowdown: ${slowdownAmount} squares, Persistent zone created`);

    // ===== EXPOSE UTILITY FUNCTIONS GLOBALLY =====
    // Pour permettre à endYunYunEffect d'accéder aux fonctions de nettoyage
    if (!globalThis.YunyunRamollissementUtils) {
        globalThis.YunyunRamollissementUtils = {
            endSpell: endRamollissementSpell,
            removeAllEffects: removeAllSolRamoliEffects,
            spellConfig: SPELL_CONFIG
        };
    }

})();
