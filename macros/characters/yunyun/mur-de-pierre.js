/**
 * Mur de Pierre - Yunyun
 *
 * Yunyun invoque un mur de pierre solide pour bloquer les passages ou se protéger.
 * Sort de création d'obstacle avec animation de rochers tombants.
 *
 * Caractéristiques :
 * - Coût : 3 mana (non focalisable)
 * - Niveau : 1
 * - Taille : 2x1 cases sur la position ciblée
 * - Points de Vie : 3 × Charisme de Yunyun
 * - Animation : Rochers tombants (grès)
 *
 * Usage : Sélectionner le token de Yunyun, puis cibler la position pour le mur.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Mur de Pierre",
        description: "Invocation d'un mur de pierre solide (2x1 cases)",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        isDirect: false,
        spellLevel: 1,
        manaCost: 3,
        isFocusable: false,
        appliesFatigue: false,
        wallSize: {
            width: 2,
            height: 1
        },
        animations: {
            wallIntro: "jb2a_patreon.falling_rocks.side.2x1.sandstone.1",
            wallCreation: "jb2a_patreon.falling_rocks.endframe.side.2x1.sandstone.1",
            sound: null
        },
        // Configuration pour endYunYunEffect
        effectConfig: {
            endEffectConfig: {
                displayName: "Mur de Pierre",
                icon: "icons/magic/earth/projectile-stone-landslide.webp",
                description: "Mur de pierre créé par Yunyun",
                sectionTitle: "🧱 Murs de Pierre",
                sectionIcon: "🧱",
                cssClass: "mur-de-pierre-effect",
                borderColor: "#8d6e63",
                bgColor: "#efebe9",
                detectFlags: [
                    { path: "name", matchValue: "Mur de Pierre" },
                    { path: "flags.world.yunyunCaster", matchValue: "CASTER_ID" }
                ],
                mechanicType: "persistentWall",
                cleanup: {
                    sequencerPatterns: ["mur_de_pierre_yunyun_wall"]
                },
                getExtraData: (effect) => ({
                    wallHitPoints: effect.flags?.world?.wallHitPoints || 0,
                    sourceSpell: "Mur de Pierre",
                    position: effect.flags?.world?.wallPosition || { gridX: 0, gridY: 0 }
                }),
                getDynamicDescription: (effect) => {
                    const hitPoints = effect.flags?.world?.wallHitPoints || 0;
                    const pos = effect.flags?.world?.wallPosition || { gridX: 0, gridY: 0 };
                    return `PV: ${hitPoints} | Position: (${pos.gridX}, ${pos.gridY})`;
                }
            }
        },
        targeting: {
            range: 100,
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
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" provides ${flagKey} bonus: ${flagValue}`);
            }
        }

        console.log(`[DEBUG] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
            return { base: 3, injuries: 0, effectBonus: 0, injuryAdjusted: 3, final: 3 };
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);

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

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== SPELL CONFIRMATION DIALOG =====
    async function confirmSpellCast() {
        return new Promise((resolve) => {
            // Calcul des PV du mur basés sur le Charisme
            const wallHitPoints = characteristicInfo.final * 3;

            const stanceDisplay = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            const dialogContent = `
                <div style="background: linear-gradient(135deg, #efebe9, #d7ccc8); padding: 15px; border-radius: 10px; border: 2px solid #8d6e63; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #5d4037; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            🧱 ${SPELL_CONFIG.name} 🧱
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">${SPELL_CONFIG.description}</p>
                        <div style="background: rgba(141, 110, 99, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                            <strong>Invocation: ${SPELL_CONFIG.characteristicDisplay}</strong> ${characteristicInfo.final}${stanceDisplay}
                        </div>
                    </div>

                    <div style="background: rgba(141, 110, 99, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #8d6e63; margin-bottom: 15px;">
                        <h3 style="color: #5d4037; margin: 0 0 10px 0; text-align: center;">Configuration du Mur</h3>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div style="background: rgba(255,255,255,0.3); padding: 8px; border-radius: 5px;">
                                <h4 style="color: #5d4037; margin: 0 0 8px 0;">📐 Taille du Mur</h4>
                                <div style="margin-bottom: 8px;">
                                    <label><strong>Longueur:</strong> <input type="number" id="wallLength" value="2" min="1" max="6" style="width: 50px; margin-left: 5px;"> cases</label>
                                </div>
                                <div>
                                    <label><strong>Largeur:</strong> <input type="number" id="wallWidth" value="1" min="1" max="3" style="width: 50px; margin-left: 5px;"> cases</label>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.3); padding: 8px; border-radius: 5px;">
                                <h4 style="color: #5d4037; margin: 0 0 8px 0;">🔄 Orientation</h4>
                                <div style="margin-bottom: 8px;">
                                    <label><strong>Rotation:</strong> <input type="number" id="wallRotation" value="0" min="0" max="360" step="15" style="width: 60px; margin-left: 5px;">°</label>
                                </div>
                                <div>
                                    <button type="button" id="setVertical" style="padding: 4px 8px; border: 1px solid #8d6e63; background: #fff; border-radius: 3px; cursor: pointer; font-size: 0.9em;">
                                        📏 Vertical (90°)
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style="background: rgba(76, 175, 80, 0.1); padding: 8px; border-radius: 5px; border-left: 3px solid #4caf50;">
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                            <div><strong>Points de Vie:</strong> <span id="displayWallHP">${wallHitPoints}</span> PV (${characteristicInfo.final} × 3)</div>
                            <div><strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana (non focalisable)</div>
                            <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                        </div>
                    </div>

                    <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <strong>🏗️ Instructions de Placement :</strong>
                        <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
                            <li>Configurez la taille et l'orientation du mur ci-dessus</li>
                            <li>Cliquez sur la case où vous voulez placer le mur</li>
                            <li>L'animation sera adaptée à la taille et rotation choisies</li>
                        </ul>
                    </div>
                </div>
            `;

            new Dialog({
                title: `${SPELL_CONFIG.name} - Configuration`,
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-hammer"></i>',
                        label: "Créer le Mur",
                        callback: (html) => {
                            const wallLength = parseInt(html.find('#wallLength').val()) || 2;
                            const wallWidth = parseInt(html.find('#wallWidth').val()) || 1;
                            const wallRotation = parseInt(html.find('#wallRotation').val()) || 0;

                            // Calcul des PV basé sur la taille (longueur × largeur × charisme)
                            const adjustedWallHP = wallLength * wallWidth * characteristicInfo.final;

                            resolve({
                                confirmed: true,
                                wallHitPoints: adjustedWallHP,
                                wallDimensions: {
                                    length: wallLength,
                                    width: wallWidth
                                },
                                wallRotation: wallRotation
                            });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve({ confirmed: false })
                    }
                },
                default: "cast",
                render: (html) => {
                    console.log(`[DEBUG] Wall configuration dialog rendered for ${SPELL_CONFIG.name}`);

                    // Gestion du bouton vertical
                    html.find('#setVertical').click(() => {
                        html.find('#wallRotation').val(90);
                    });

                    // Mise à jour dynamique des PV selon la taille
                    function updateWallHP() {
                        const length = parseInt(html.find('#wallLength').val()) || 2;
                        const width = parseInt(html.find('#wallWidth').val()) || 1;
                        const newHP = length * width * characteristicInfo.final;
                        html.find('#displayWallHP').text(newHP);
                    }

                    html.find('#wallLength, #wallWidth').on('input change', updateWallHP);
                }
            }).render(true);
        });
    }

    const spellConfirmation = await confirmSpellCast();
    if (!spellConfirmation.confirmed) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { wallHitPoints, wallDimensions, wallRotation } = spellConfirmation;

    // ===== TARGETING SYSTEM =====
    async function selectWallPosition() {
        ui.notifications.info(`🎯 Sélectionnez la position pour le ${SPELL_CONFIG.name}...`);

        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            console.error("[DEBUG] Portal targeting error:", error);
            ui.notifications.error("❌ Erreur lors du ciblage. Vérifiez que le module Portal est installé et actif.");
            return null;
        }
    }

    const wallTarget = await selectWallPosition();
    if (!wallTarget) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== WALL POSITION CALCULATION =====
    /**
     * Calcule la position exacte du mur basée sur le ciblage et les dimensions configurées
     */
    function calculateWallPosition(targetPos, dimensions) {
        const gridSize = canvas.grid.size;

        // Aligner la position ciblée sur la grille
        const wallGridX = Math.floor(targetPos.x / gridSize);
        const wallGridY = Math.floor(targetPos.y / gridSize);

        // Position en pixels (coin supérieur gauche)
        const wallPixelX = wallGridX * gridSize;
        const wallPixelY = wallGridY * gridSize;

        // Position centrale pour l'animation (utilise les dimensions configurées)
        const wallCenterX = wallPixelX + (dimensions.length * gridSize / 2);
        const wallCenterY = wallPixelY + (dimensions.width * gridSize / 2);

        return {
            gridX: wallGridX,
            gridY: wallGridY,
            pixelX: wallPixelX,
            pixelY: wallPixelY,
            centerX: wallCenterX,
            centerY: wallCenterY,
            length: dimensions.length,
            width: dimensions.width
        };
    }

    const wallPosition = calculateWallPosition(wallTarget, wallDimensions);

    // ===== SEQUENCER ANIMATION =====
    async function playWallCreationAnimation() {
        try {
            // Calcul de la scale basée sur la longueur (divise par 2 car l'animation fait déjà 2 de long)
            const animationScale = (wallPosition.length / 2) * 0.4;

            console.log(`[DEBUG] Wall animation config - Length: ${wallPosition.length}, Scale: ${animationScale}, Rotation: ${wallRotation}°`);

            // Animation d'intro (rochers tombant du dessus)
            const introSequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animations.wallIntro)
                    .atLocation({ x: wallPosition.centerX, y: wallPosition.centerY })
                    .scale(animationScale)
                    .rotate(wallRotation)
                    .waitUntilFinished(-100);

            await introSequence.play();

            // Animation persistante du mur (reste en place)
            const wallSequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animations.wallCreation)
                    .atLocation({ x: wallPosition.centerX, y: wallPosition.centerY })
                    .scale(animationScale)
                    .rotate(wallRotation)
                    .persist()
                    .name(`mur_de_pierre_yunyun_wall_${wallPosition.gridX}_${wallPosition.gridY}_${actor.id}`);

            await wallSequence.play();

            console.log(`[DEBUG] Wall animations complete - Intro + Persistent wall at (${wallPosition.gridX}, ${wallPosition.gridY}) with scale ${animationScale} and rotation ${wallRotation}°`);
        } catch (error) {
            console.error("[DEBUG] Wall animation error:", error);
        }
    }

    await playWallCreationAnimation();

    // ===== CREATION DE L'EFFET DETECTABLE =====
    async function createDetectableWallEffect() {
        try {
            // Créer un effet sur l'acteur pour le tracking par endYunYunEffect
            const wallEffect = {
                name: "Mur de Pierre",
                icon: "icons/magic/earth/projectile-stone-landslide.webp",
                origin: actor.uuid,
                duration: { seconds: 86400 }, // 24h (permanent jusqu'à destruction)
                flags: {
                    world: {
                        yunyunCaster: actor.id,
                        spellName: "Mur de Pierre",
                        wallHitPoints: wallHitPoints,
                        wallPosition: {
                            gridX: wallPosition.gridX,
                            gridY: wallPosition.gridY,
                            centerX: wallPosition.centerX,
                            centerY: wallPosition.centerY
                        },
                        wallDimensions: {
                            length: wallPosition.length,
                            width: wallPosition.width
                        },
                        wallRotation: wallRotation,
                        sequencerName: `mur_de_pierre_yunyun_wall_${wallPosition.gridX}_${wallPosition.gridY}_${actor.id}`,
                        isYunyunWall: true
                    }
                }
            };

            await actor.createEmbeddedDocuments("ActiveEffect", [wallEffect]);
            console.log(`[DEBUG] Created detectable wall effect for endYunYunEffect tracking`);
        } catch (error) {
            console.error("[DEBUG] Failed to create wall effect:", error);
        }
    }

    await createDetectableWallEffect();

    // ===== ATTACK ROLL (pour le niveau du sort) =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalInvocationDice = characteristicInfo.final + characteristicBonus;
    const levelBonus = SPELL_CONFIG.spellLevel * 2;

    const invocationRoll = new Roll(`${totalInvocationDice}d7 + ${levelBonus}`);
    await invocationRoll.evaluate({ async: true });

    // ===== CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceNote = currentStance ? ` <em>(Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})</em>` : '';

        return `
            <div style="background: linear-gradient(135deg, #efebe9, #d7ccc8); padding: 12px; border-radius: 8px; border: 2px solid #8d6e63; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #5d4037;">🧱 Sort de ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana
                    </div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(141, 110, 99, 0.1); border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #5d4037; font-weight: bold;">🏗️ INVOCATION: ${invocationRoll.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${totalInvocationDice}d7 + ${levelBonus})</div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.3); border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #5d4037; margin-bottom: 6px;"><strong>🧱 Mur de Pierre Créé${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Position:</strong> Grid (${wallPosition.gridX}, ${wallPosition.gridY})</div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Taille:</strong> ${wallPosition.length} × ${wallPosition.width} cases</div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Rotation:</strong> ${wallRotation}° ${wallRotation === 90 ? '(Vertical)' : wallRotation === 0 ? '(Horizontal)' : ''}</div>
                    <div style="font-size: 1.4em; color: #2e7d32; font-weight: bold;">💚 PV DU MUR: ${wallHitPoints}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${wallPosition.length}×${wallPosition.width}×${characteristicInfo.final} Charisme)</div>
                </div>

                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>✨ Niveau:</strong> ${SPELL_CONFIG.spellLevel} (+${levelBonus} bonus)${stanceNote}</div>
                </div>
            </div>
        `;
    }

    const enhancedFlavor = createChatFlavor();

    // Send the roll message
    await invocationRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const rotationInfo = wallRotation === 90 ? ' Vertical' : wallRotation === 0 ? ' Horizontal' : ` ${wallRotation}°`;

    ui.notifications.info(`${SPELL_CONFIG.name} créé !${stanceInfo} Taille: ${wallPosition.length}×${wallPosition.width}${rotationInfo}. Position: (${wallPosition.gridX}, ${wallPosition.gridY}). Le mur a ${wallHitPoints} PV - ${SPELL_CONFIG.manaCost} mana`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Caster: ${actor.name}, Position: (${wallPosition.gridX}, ${wallPosition.gridY}), Size: ${wallPosition.length}x${wallPosition.width}, Rotation: ${wallRotation}°, Wall HP: ${wallHitPoints}, Invocation: ${invocationRoll.total}`);

})();
