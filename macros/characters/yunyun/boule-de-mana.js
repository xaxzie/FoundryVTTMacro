/**
 * Boule de Mana - Yunyun
 *
 * Yunyun lance des projectiles de mana pure qui s'adaptent à la situation.
 * Sort polyvalent avec deux modes d'utilisation.
 *
 * Mode Simple :
 * - Caractéristique d'attaque : Charisme (+ effets actifs + bonus manuels)
 * - Dégâts : 1d6 + Charisme + bonus manuels + bonus d'effets actifs
 * - Coût : 3 mana (focalisable - gratuit en focus)
 * - Niveau : 1
 *
 * Mode Lourde :
 * - Caractéristique d'attaque : Charisme (+ effets actifs + bonus manuels)
 * - Dégâts : 2d5 + Charisme + bonus manuels + bonus d'effets actifs
 * - Coût : 6 mana (coût divisé par 2 en focus = 3 mana)
 * - Niveau : 2
 * - Effet : Yunyun devient "Très Fatigué"
 *
 * Usage : Sélectionner le token de Yunyun, choisir le mode, puis cibler.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Boule de Mana",
        description: "Projectile de mana pure adaptatif",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        isDirect: true,
        modes: {
            simple: {
                name: "Simple",
                spellLevel: 1,
                manaCost: 3,
                isFocusable: true,
                damageFormula: "1d6",
                description: "Projectile de mana basique",
                appliesFatigue: false
            },
            lourde: {
                name: "Lourde",
                spellLevel: 2,
                manaCost: 6,
                isFocusable: true, // Coût divisé par 2 en focus
                focusReduction: 0.5, // Réduction spéciale: coût ÷ 2
                damageFormula: "2d5",
                description: "Projectile de mana concentré (Yunyun devient Très Fatigué)",
                appliesFatigue: true
            }
        },
        animations: {
            simple: {
                projectile: "jb2a.magic_missile.02.blue",
                impact: "jb2a.impact.010.blue",
                cast: "jb2a.cast_generic.02.blue.0"
            },
            lourde: {
                projectile: "jb2a.magic_missile.02.purple",
                impact: "jb2a.explosion.02.purple",
                cast: "jb2a.cast_generic.02.purple.0"
            },
            sound: null
        },
        targeting: {
            range: 200,
            colorSimple: "#4a90e2",
            colorLourde: "#8a2be2",
            textureSimple: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
            textureLourde: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
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
     * Calcule le coût en mana basé sur la stance et le mode
     */
    function calculateManaCost(modeConfig, stance) {
        let baseCost = modeConfig.manaCost;

        if (stance === 'focus' && modeConfig.isFocusable) {
            if (modeConfig.focusReduction) {
                // Réduction spéciale pour le mode lourde (÷2)
                return Math.floor(baseCost * modeConfig.focusReduction);
            } else {
                // Gratuit pour le mode simple
                return 0;
            }
        }

        return baseCost;
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== MODE SELECTION DIALOG =====
    async function selectSpellMode() {
        return new Promise((resolve) => {
            const simpleManaCost = calculateManaCost(SPELL_CONFIG.modes.simple, currentStance);
            const lourdeManaCost = calculateManaCost(SPELL_CONFIG.modes.lourde, currentStance);

            const stanceDisplay = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            const dialogContent = `
                <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 15px; border-radius: 10px; border: 2px solid #4a90e2; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #2c5aa0; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            ✨ ${SPELL_CONFIG.name} ✨
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">${SPELL_CONFIG.description}</p>
                        <div style="background: rgba(74, 144, 226, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                            <strong>Attaque: ${SPELL_CONFIG.characteristicDisplay}</strong> ${characteristicInfo.final}${stanceDisplay}
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: rgba(74, 144, 226, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #4a90e2;">
                            <h3 style="color: #2c5aa0; margin: 0 0 10px 0; text-align: center;">Mode Simple</h3>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.modes.simple.spellLevel}</div>
                            <div><strong>Dégâts:</strong> ${SPELL_CONFIG.modes.simple.damageFormula} + Charisme</div>
                            <div><strong>Coût:</strong> ${simpleManaCost} mana ${simpleManaCost === 0 ? '(Gratuit en Focus)' : ''}</div>
                            <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.modes.simple.spellLevel * 2}</div>
                            <p style="font-size: 0.9em; color: #666; margin: 10px 0 0 0;">${SPELL_CONFIG.modes.simple.description}</p>
                        </div>

                        <div style="background: rgba(138, 43, 226, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #8a2be2;">
                            <h3 style="color: #6a1b9a; margin: 0 0 10px 0; text-align: center;">Mode Lourde</h3>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.modes.lourde.spellLevel}</div>
                            <div><strong>Dégâts:</strong> ${SPELL_CONFIG.modes.lourde.damageFormula} + Charisme</div>
                            <div><strong>Coût:</strong> ${lourdeManaCost} mana ${lourdeManaCost < SPELL_CONFIG.modes.lourde.manaCost ? '(Réduit en Focus)' : ''}</div>
                            <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.modes.lourde.spellLevel * 2}</div>
                            <p style="font-size: 0.9em; color: #666; margin: 10px 0 0 0; color: #d32f2f;"><strong>${SPELL_CONFIG.modes.lourde.description}</strong></p>
                        </div>
                    </div>

                    <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <strong>Bonus d'Attaque et de Dégâts:</strong>
                        <div style="margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div><label for="attackBonus">Bonus d'Attaque:</label></div>
                            <div><input type="number" id="attackBonus" name="attackBonus" value="0" style="width: 60px;"></div>
                            <div><label for="damageBonus">Bonus de Dégâts:</label></div>
                            <div><input type="number" id="damageBonus" name="damageBonus" value="0" style="width: 60px;"></div>
                        </div>
                    </div>
                </div>
            `;

            new Dialog({
                title: `${SPELL_CONFIG.name} - Sélection du Mode`,
                content: dialogContent,
                buttons: {
                    simple: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Mode Simple",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({
                                mode: 'simple',
                                modeConfig: SPELL_CONFIG.modes.simple,
                                actualManaCost: simpleManaCost,
                                attackBonus: attackBonus,
                                damageBonus: damageBonus
                            });
                        }
                    },
                    lourde: {
                        icon: '<i class="fas fa-fire"></i>',
                        label: "Mode Lourde",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({
                                mode: 'lourde',
                                modeConfig: SPELL_CONFIG.modes.lourde,
                                actualManaCost: lourdeManaCost,
                                attackBonus: attackBonus,
                                damageBonus: damageBonus
                            });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "simple",
                render: () => {
                    console.log(`[DEBUG] Mode selection dialog rendered for ${SPELL_CONFIG.name}`);
                }
            }).render(true);
        });
    }

    const modeSelection = await selectSpellMode();
    if (!modeSelection) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { mode: selectedMode, modeConfig, actualManaCost, attackBonus, damageBonus } = modeSelection;

    // ===== TARGETING SYSTEM =====
    /**
     * Selects a target using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTarget() {
        try {
            const targetColor = selectedMode === 'simple' ? SPELL_CONFIG.targeting.colorSimple : SPELL_CONFIG.targeting.colorLourde;
            const targetTexture = selectedMode === 'simple' ? SPELL_CONFIG.targeting.textureSimple : SPELL_CONFIG.targeting.textureLourde;

            const crosshairs = await portal.crosshairs.show({
                size: canvas.grid.size / 2,
                icon: targetTexture,
                label: `${SPELL_CONFIG.name} - ${modeConfig.name}`,
                borderColor: targetColor,
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

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== ACTOR DETECTION =====
    /**
     * Finds an actor at a specific location using grid-aware detection and visibility filtering
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @returns {Object|null} Actor info object or null if none found
     */
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // With grid - convert to grid coordinates and check
            const gridX = Math.floor(targetX / gridSize);
            const gridY = Math.floor(targetY / gridSize);

            // Convert back to pixel coordinates (center of grid square)
            const centerX = (gridX * gridSize) + (gridSize / 2);
            const centerY = (gridY * gridSize) + (gridSize / 2);

            console.log(`[DEBUG] Grid coordinates: (${gridX}, ${gridY}), Center: (${centerX}, ${centerY})`);

            // Check for tokens in this grid square
            for (const token of canvas.tokens.placeables) {
                if (!token.visible) continue;

                const tokenCenterX = token.x + (token.width / 2);
                const tokenCenterY = token.y + (token.height / 2);

                const tokenGridX = Math.floor(tokenCenterX / gridSize);
                const tokenGridY = Math.floor(tokenCenterY / gridSize);

                if (tokenGridX === gridX && tokenGridY === gridY) {
                    console.log(`[DEBUG] Found actor: ${token.name} at grid (${tokenGridX}, ${tokenGridY})`);
                    return { token: token, name: token.name, actor: token.actor };
                }
            }
        } else {
            // Without grid - direct pixel checking with tolerance
            const tolerance = gridSize / 4; // 25% tolerance

            for (const token of canvas.tokens.placeables) {
                if (!token.visible) continue;

                const tokenCenterX = token.x + (token.width / 2);
                const tokenCenterY = token.y + (token.height / 2);

                const distance = Math.sqrt(
                    Math.pow(targetX - tokenCenterX, 2) +
                    Math.pow(targetY - tokenCenterY, 2)
                );

                if (distance <= tolerance) {
                    console.log(`[DEBUG] Found actor: ${token.name} within ${distance}px tolerance`);
                    return { token: token, name: token.name, actor: token.actor };
                }
            }
        }

        console.log(`[DEBUG] No actor found at target location`);
        return null;
    }

    const targetActor = getActorAtLocation(target.x, target.y);

    if (!targetActor) {
        ui.notifications.warn("⚠️ Aucune cible trouvée à cette position !");
        return;
    }

    const targetName = targetActor.name;

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const damageRoll = new Roll(modeConfig.damageFormula);
        await damageRoll.evaluate({ async: true });

        // Add characteristic bonus
        const characteristicBonus = characteristicInfo.final;

        // Add damage bonuses from active effects
        const activeEffectDamageBonus = getActiveEffectBonus(actor, "damage");

        // Add manual damage bonus
        const totalDamageBonus = characteristicBonus + activeEffectDamageBonus + damageBonus;
        const finalDamage = damageRoll.total + totalDamageBonus;

        console.log(`[DEBUG] Damage calculation:`);
        console.log(`[DEBUG] - Base roll: ${damageRoll.total}`);
        console.log(`[DEBUG] - Characteristic bonus: ${characteristicBonus}`);
        console.log(`[DEBUG] - Active effects bonus: ${activeEffectDamageBonus}`);
        console.log(`[DEBUG] - Manual bonus: ${damageBonus}`);
        console.log(`[DEBUG] - Final damage: ${finalDamage}`);

        return {
            roll: damageRoll,
            characteristicBonus: characteristicBonus,
            activeEffectBonus: activeEffectDamageBonus,
            manualBonus: damageBonus,
            totalBonus: totalDamageBonus,
            total: finalDamage
        };
    }

    const damageResult = await calculateDamage();

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        try {
            const animations = SPELL_CONFIG.animations[selectedMode];

            const sequence = new Sequence()
                .effect()
                    .file(animations.cast)
                    .attachTo(caster)
                    .scale(0.6)
                    .waitUntilFinished(-500)

                .effect()
                    .file(animations.projectile)
                    .attachTo(caster)
                    .stretchTo(targetActor.token)
                    .scale(0.8)
                    .waitUntilFinished(-200)

                .effect()
                    .file(animations.impact)
                    .attachTo(targetActor.token)
                    .scale(0.6);

            await sequence.play();
        } catch (error) {
            console.error("[DEBUG] Animation error:", error);
        }
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus;
    const levelBonus = modeConfig.spellLevel * 2;

    // Build combined roll formula: attack roll + damage roll
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus} + ${attackBonus}`];

    // Add damage roll to the combined formula (only if not maximized)
    if (currentStance !== 'offensif') {
        combinedRollParts.push(`${modeConfig.damageFormula} + ${damageResult.totalBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results from the combined roll
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        // Extract damage result from combined roll
        const damageRollResult = combinedRoll.terms[0].results[1];
        finalDamageResult = {
            ...damageResult,
            total: damageRollResult.result
        };
    } else {
        // In offensive stance, damage is maximized
        const maxDamage = parseInt(modeConfig.damageFormula.split('d')[0]) * parseInt(modeConfig.damageFormula.split('d')[1]);
        finalDamageResult = {
            ...damageResult,
            total: maxDamage + damageResult.totalBonus
        };
    }

    // Build enhanced flavor for the final dice roll message
    function createChatFlavor() {
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const fatigueWarning = modeConfig.appliesFatigue ? '<div style="color: #d32f2f; font-weight: bold; text-align: center; margin-top: 10px;">⚠️ Yunyun devient Très Fatigué ⚠️</div>' : '';

        return `
        <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid ${selectedMode === 'simple' ? '#4a90e2' : '#8a2be2'};">
            <div style="text-align: center; margin-bottom: 10px;">
                <h3 style="color: ${selectedMode === 'simple' ? '#2c5aa0' : '#6a1b9a'}; margin: 0;">✨ ${SPELL_CONFIG.name} - ${modeConfig.name} ✨</h3>
                <div style="color: #666; font-size: 0.9em;">Lanceur: <strong>${actor.name}</strong> → Cible: <strong>${targetName}</strong>${stanceInfo}</div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                <div style="background: rgba(76, 175, 80, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
                    <strong>Niveau ${modeConfig.spellLevel}</strong><br>
                    <span style="font-size: 0.85em;">Bonus Hit: +${levelBonus}</span>
                </div>
                <div style="background: rgba(255, 152, 0, 0.1); padding: 8px; border-radius: 5px; text-align: center;">
                    <strong>${actualManaCost} mana</strong><br>
                    <span style="font-size: 0.85em;">${actualManaCost === 0 ? 'Gratuit (Focus)' : actualManaCost < modeConfig.manaCost ? 'Réduit (Focus)' : 'Coût normal'}</span>
                </div>
            </div>

            <div style="background: rgba(33, 150, 243, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                <div><strong>Attaque:</strong> ${totalAttackDice}d7 + ${levelBonus}${attackBonus > 0 ? ` + ${attackBonus}` : ''} = <span style="color: #1976d2; font-weight: bold;">${attackResult.result}</span></div>
                <div><strong>Dégâts:</strong> ${modeConfig.damageFormula} + ${damageResult.totalBonus} = <span style="color: #d32f2f; font-weight: bold;">${finalDamageResult.total}</span></div>
            </div>
            ${fatigueWarning}
        </div>`;
    }

    const enhancedFlavor = createChatFlavor();

    // Send the unified dice roll message
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FATIGUE APPLICATION =====
    if (modeConfig.appliesFatigue) {
        // TODO: Implémenter l'application de l'état "Très Fatigué"
        // Cela sera géré par HandleYunYunEffect.js dans une prochaine itération
        console.log(`[DEBUG] ${SPELL_CONFIG.name} - ${modeConfig.name}: Yunyun should become Très Fatigué`);
        ui.notifications.info("⚠️ Yunyun devient Très Fatigué !");
    }

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const manaCostInfo = actualManaCost === 0 ? ' - GRATUIT (Focus)' : ` - ${actualManaCost} mana`;
    const fatigueInfo = modeConfig.appliesFatigue ? ' - Yunyun Très Fatigué' : '';

    ui.notifications.info(`${SPELL_CONFIG.name} - ${modeConfig.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${manaCostInfo}${fatigueInfo}`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Mode: ${selectedMode}, Caster: ${actor.name}, Target: ${targetName}, Damage: ${finalDamageResult.total}${fatigueInfo}`);

})();
