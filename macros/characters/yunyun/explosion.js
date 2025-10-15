/**
 * Explosion - Yunyun
 *
 * Yunyun déclenche une explosion magique dévastatrice dans une zone choisie.
 * Sort de zone destructeur avec deux modes de concentration.
 *
 * Mode Simple :
 * - Caractéristique d'attaque : Charisme (+ effets actifs + bonus manuels)
 * - Dégâts : 2d6 + (Charisme × 1.5) + bonus manuels + bonus d'effets actifs
 * - Coût : 6 mana (NON focalisable)
 * - Niveau : 2
 * - Zone : 3 cases de rayon
 * - Esquive : Permet de réduire les dégâts de moitié
 *
 * Mode Concentré :
 * - Caractéristique d'attaque : Charisme (+ effets actifs + bonus manuels)
 * - Dégâts : 3d6 + (Charisme × 1.5) + bonus manuels + bonus d'effets actifs
 * - Coût : 6 mana (NON focalisable)
 * - Niveau : 2
 * - Zone : 2 cases de rayon
 * - Esquive : Permet de réduire les dégâts de moitié
 * - Effet : Yunyun devient "Très Fatigué"
 *
 * Usage : Sélectionner le token de Yunyun, choisir le mode, puis cibler la zone.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Explosion",
        description: "Explosion magique dévastatrice de zone",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        spellLevel: 2,
        manaCost: 6,
        isDirect: true,
        isFocusable: false, // NON focalisable
        modes: {
            simple: {
                name: "Simple",
                damageFormula: "2d6",
                charismaMultiplier: 1.5,
                radius: 3,
                description: "Explosion standard sur grande zone",
                appliesFatigue: false
            },
            concentre: {
                name: "Concentré",
                damageFormula: "3d6",
                charismaMultiplier: 1.5,
                radius: 2,
                description: "Explosion concentrée sur zone réduite (Yunyun devient Très Fatigué)",
                appliesFatigue: true
            }
        },
        animations: {
            simple: {
                explosion: "jb2a.explosion.01.orange",
                cast: "jb2a.cast_generic.fire.01.orange.0",
                template: "jb2a.explosion.08.orange"
            },
            concentre: {
                explosion: "jb2a.explosion.01.orange",
                cast: "jb2a.cast_generic.fire.01.orange.0",
                template: "jb2a.explosion.08.orange"
            },
            sound: null
        },
        targeting: {
            colorSimple: "#ff8c00",
            colorConcentre: "#ff4500",
            textureSimple: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm",
            textureConcentre: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
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

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== MODE SELECTION DIALOG =====
    async function selectSpellMode() {
        return new Promise((resolve) => {
            const stanceDisplay = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            const dialogContent = `
                <div style="background: linear-gradient(135deg, #fff3e0, #ffecb3); padding: 15px; border-radius: 10px; border: 2px solid #ff8c00; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #e65100; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            💥 ${SPELL_CONFIG.name} 💥
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">${SPELL_CONFIG.description}</p>
                        <div style="background: rgba(255, 140, 0, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                            <strong>Attaque: ${SPELL_CONFIG.characteristicDisplay}</strong> ${characteristicInfo.final}${stanceDisplay}
                        </div>
                        <div style="background: rgba(244, 67, 54, 0.1); padding: 8px; border-radius: 5px; border: 1px solid #f44336; color: #d32f2f;">
                            <strong>⚠️ Sort NON FOCALISABLE - ${SPELL_CONFIG.manaCost} mana obligatoire ⚠️</strong>
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: rgba(255, 140, 0, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #ff8c00;">
                            <h3 style="color: #e65100; margin: 0 0 10px 0; text-align: center;">Mode Simple</h3>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                            <div><strong>Dégâts:</strong> ${SPELL_CONFIG.modes.simple.damageFormula} + Charisme×${SPELL_CONFIG.modes.simple.charismaMultiplier}</div>
                            <div><strong>Zone:</strong> ${SPELL_CONFIG.modes.simple.radius} cases de rayon</div>
                            <div><strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana</div>
                            <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                            <p style="font-size: 0.9em; color: #666; margin: 10px 0 0 0;">${SPELL_CONFIG.modes.simple.description}</p>
                        </div>

                        <div style="background: rgba(255, 69, 0, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #ff4500;">
                            <h3 style="color: #bf360c; margin: 0 0 10px 0; text-align: center;">Mode Concentré</h3>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                            <div><strong>Dégâts:</strong> ${SPELL_CONFIG.modes.concentre.damageFormula} + Charisme×${SPELL_CONFIG.modes.concentre.charismaMultiplier}</div>
                            <div><strong>Zone:</strong> ${SPELL_CONFIG.modes.concentre.radius} cases de rayon</div>
                            <div><strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana</div>
                            <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                            <p style="font-size: 0.9em; color: #d32f2f; margin: 10px 0 0 0; font-weight: bold;">${SPELL_CONFIG.modes.concentre.description}</p>
                        </div>
                    </div>

                    <div style="background: rgba(33, 150, 243, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #2196f3; margin-bottom: 15px;">
                        <strong>📋 Mécaniques de Zone :</strong>
                        <div style="margin-top: 5px; font-size: 0.9em;">
                            • Esquive réussie = dégâts réduits de moitié<br>
                            • Détection automatique des cibles dans la zone<br>
                            • Tous les tokens visibles sont affectés
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
                        icon: '<i class="fas fa-explosion"></i>',
                        label: "Mode Simple",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({
                                mode: 'simple',
                                modeConfig: SPELL_CONFIG.modes.simple,
                                attackBonus: attackBonus,
                                damageBonus: damageBonus
                            });
                        }
                    },
                    concentre: {
                        icon: '<i class="fas fa-bomb"></i>',
                        label: "Mode Concentré",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({
                                mode: 'concentre',
                                modeConfig: SPELL_CONFIG.modes.concentre,
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

    const { mode: selectedMode, modeConfig, attackBonus, damageBonus } = modeSelection;

    // ===== TARGETING SYSTEM =====
    /**
     * Selects a target area using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTargetArea() {
        ui.notifications.info(`🎯 Sélectionnez la zone pour ${SPELL_CONFIG.name} - ${modeConfig.name} (${modeConfig.radius} cases)...`);

        try {
            const targetColor = selectedMode === 'simple' ? SPELL_CONFIG.targeting.colorSimple : SPELL_CONFIG.targeting.colorConcentre;
            const targetTexture = selectedMode === 'simple' ? SPELL_CONFIG.targeting.textureSimple : SPELL_CONFIG.targeting.textureConcentre;
            const radius = modeConfig.radius;

            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(targetColor)
                .texture(targetTexture);

            const target = await portal.pick();
            return target;
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
     * Finds targets in the spell area using circular radius detection
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

        console.log(`[DEBUG] Searching for targets in ${radius}-case radius (circular) around (${centerGridX}, ${centerGridY})`);

        for (const token of canvas.tokens.placeables) {
            // Visibility filtering
            if (!(token.isVisible || token.isOwner || game.user.isGM)) {
                continue;
            }

            // Skip the caster
            if (token === caster) {
                continue;
            }

            // Convert token position to grid coordinates
            const tokenGridX = Math.floor(token.x / gridSize);
            const tokenGridY = Math.floor(token.y / gridSize);
            const tokenWidth = token.document.width;
            const tokenHeight = token.document.height;

            // Check if any part of the token overlaps with the circular spell area
            let tokenInRange = false;
            let minDistance = Infinity;

            for (let tx = tokenGridX; tx < tokenGridX + tokenWidth; tx++) {
                for (let ty = tokenGridY; ty < tokenGridY + tokenHeight; ty++) {
                    const distance = Math.sqrt(
                        Math.pow(tx - centerGridX, 2) +
                        Math.pow(ty - centerGridY, 2)
                    );

                    // Use radius + 0.5 for slightly extended range
                    if (distance <= radius + 0.5) {
                        tokenInRange = true;
                        minDistance = Math.min(minDistance, distance);
                    }
                }
            }

            if (tokenInRange) {
                console.log(`[DEBUG] Target found: ${token.name} at circular distance ${minDistance.toFixed(2)}`);
                targets.push({
                    token: token,
                    name: token.name,
                    actor: token.actor,
                    distance: minDistance,
                    gridX: tokenGridX,
                    gridY: tokenGridY
                });
            }
        }

        return targets;
    }

    const areaTargets = findTargetsInArea(target.x, target.y, modeConfig.radius);

    console.log(`[DEBUG] Area targets found: ${areaTargets.length}`);
    areaTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name} (distance: ${target.distance})`);
    });

    if (areaTargets.length === 0) {
        ui.notifications.warn("⚠️ Aucune cible trouvée dans la zone d'explosion !");
        return;
    }

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const damageRoll = new Roll(modeConfig.damageFormula);
        await damageRoll.evaluate({ async: true });

        // Add characteristic bonus with multiplier
        const characteristicBonus = Math.floor(characteristicInfo.final * modeConfig.charismaMultiplier);

        // Add damage bonuses from active effects
        const activeEffectDamageBonus = getActiveEffectBonus(actor, "damage");

        // Add manual damage bonus
        const totalDamageBonus = characteristicBonus + activeEffectDamageBonus + damageBonus;
        const finalDamage = damageRoll.total + totalDamageBonus;

        console.log(`[DEBUG] Damage calculation:`);
        console.log(`[DEBUG] - Base roll: ${damageRoll.total}`);
        console.log(`[DEBUG] - Characteristic bonus (${characteristicInfo.final} × ${modeConfig.charismaMultiplier}): ${characteristicBonus}`);
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
                    .scale(0.8)
                    .waitUntilFinished(-500)

                .effect()
                    .file(animations.template)
                    .atLocation({ x: target.x, y: target.y })
                    .scale(modeConfig.radius * 0.75)

                .effect()
                    .file(animations.explosion)
                    .atLocation({ x: target.x, y: target.y })
                    .scale(modeConfig.radius * 1.2);

            await sequence.play();
        } catch (error) {
            console.error("[DEBUG] Animation error:", error);
        }
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus;
    const levelBonus = SPELL_CONFIG.spellLevel * 2;

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
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const modeIcon = selectedMode === 'simple' ? "💥" : "💢";
        const borderColor = selectedMode === 'simple' ? '#ff8c00' : '#ff4500';
        const bgGradient = selectedMode === 'simple'
            ? "linear-gradient(135deg, #fff3e0, #ffecb3)"
            : "linear-gradient(135deg, #ffecb3, #ffcc80)";

        const targetNames = areaTargets.map(t => t.name).join(', ');

        const fatigueWarning = modeConfig.appliesFatigue
            ? `<div style="text-align: center; margin: 6px 0; padding: 6px; background: #ffebee; border-radius: 4px; border: 1px solid #f44336;">
                 <div style="font-size: 0.9em; color: #d32f2f; font-weight: bold;">⚠️ Yunyun devient Très Fatigué</div>
               </div>`
            : '';

        return `
            <div style="background: ${bgGradient}; padding: 12px; border-radius: 8px; border: 2px solid ${borderColor}; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1976d2;">${modeIcon} Sort de ${SPELL_CONFIG.name} - ${modeConfig.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana (Non focalisable)
                    </div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>${modeIcon} ${modeConfig.name}${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cibles (${areaTargets.length}):</strong> ${targetNames}</div>
                    <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${modeConfig.damageFormula} + ${damageResult.totalBonus})</div>
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>🎯 Zone:</strong> ${modeConfig.radius} cases de rayon • <strong>Esquive:</strong> Dégâts ÷ 2</div>
                </div>
                ${fatigueWarning}
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

    // ===== FATIGUE APPLICATION =====
    if (modeConfig.appliesFatigue) {
        // TODO: Implémenter l'application de l'état "Très Fatigué"
        // Cela sera géré par HandleYunYunEffect.js dans une prochaine itération
        console.log(`[DEBUG] ${SPELL_CONFIG.name} - ${modeConfig.name}: Yunyun should become Très Fatigué`);
        ui.notifications.info("⚠️ Yunyun devient Très Fatigué !");
    }

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const targetCount = areaTargets.length;
    const fatigueInfo = modeConfig.appliesFatigue ? ' - Yunyun Très Fatigué' : '';

    ui.notifications.info(`${SPELL_CONFIG.name} - ${modeConfig.name} lancé !${stanceInfo} ${targetCount} cible${targetCount > 1 ? 's' : ''} dans ${modeConfig.radius} case${modeConfig.radius > 1 ? 's' : ''} de rayon. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total} - ${SPELL_CONFIG.manaCost} mana${fatigueInfo}`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Mode: ${selectedMode}, Caster: ${actor.name}, Targets: ${targetCount}, Damage: ${finalDamageResult.total}${fatigueInfo}`);

})();
