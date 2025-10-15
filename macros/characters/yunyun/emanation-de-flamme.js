/**
 * Émanation de Flamme - Yunyun
 *
 * Yunyun projette des flammes magiques dans une direction choisie.
 * Sort directionnnel avec deux modes de projection.
 *
 * Mode Ligne :
 * - Caractéristique d'attaque : Charisme (+ effets actifs + bonus manuels)
 * - Dégâts : 1d6 + Charisme + bonus manuels + bonus d'effets actifs
 * - Coût : 4 mana (focalisable)
 * - Niveau : 2
 * - Zone : Ligne droite depuis Yunyun dans la direction choisie
 * - Détection automatique des cibles sur la trajectoire
 *
 * Mode Cône :
 * - Caractéristique d'attaque : Charisme (+ effets actifs + bonus manuels)
 * - Dégâts : 1d6 + Charisme + bonus manuels + bonus d'effets actifs
 * - Coût : 4 mana (focalisable)
 * - Niveau : 2
 * - Zone : Cône de 120° sur 4 cases de rayon depuis Yunyun
 * - Détection automatique des cibles dans le cône
 *
 * Usage : Sélectionner le token de Yunyun, choisir le mode, puis définir la direction.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Émanation de Flamme",
        description: "Projection de flammes magiques directionnelles",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        spellLevel: 2,
        manaCost: 4,
        isDirect: true,
        isFocusable: true,
        damageFormula: "1d6",
        modes: {
            ligne: {
                name: "Ligne",
                description: "Ligne droite depuis Yunyun dans la direction choisie",
                maxRange: 12, // cases
                width: 1 // largeur en cases
            },
            cone: {
                name: "Cône",
                description: "Cône de 120° sur 4 cases de rayon depuis Yunyun",
                maxRange: 4, // rayon en cases
                angle: 120 // degrés
            }
        },
        animations: {
            ligne: {
                flame: "jb2a_patreon.breath_weapons.fire.line.orange",
                cast: "jb2a.cast_generic.fire.01.orange.0"
            },
            cone: {
                flame: "jb2a_patreon.breath_weapons.fire.cone.orange.01",
                cast: "jb2a.cast_generic.fire.01.orange.0"
            },
            sound: null
        },
        targeting: {
            colorLigne: "#ff6b35",
            colorCone: "#ff4500",
            textureLigne: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm",
            textureCone: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
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

    /**
     * Calcule le coût en mana basé sur la stance
     */
    function calculateManaCost(baseCost, stance, isFocusable) {
        return stance === 'focus' && isFocusable ? 0 : baseCost;
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);

    // ===== MODE SELECTION DIALOG =====
    async function selectSpellMode() {
        return new Promise((resolve) => {
            const stanceDisplay = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            const dialogContent = `
                <div style="background: linear-gradient(135deg, #ffebee, #fff3e0); padding: 15px; border-radius: 10px; border: 2px solid #ff6b35; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #bf360c; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            🔥 ${SPELL_CONFIG.name} 🔥
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">${SPELL_CONFIG.description}</p>
                        <div style="background: rgba(255, 107, 53, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                            <strong>Attaque: ${SPELL_CONFIG.characteristicDisplay}</strong> ${characteristicInfo.final}${stanceDisplay}
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div style="background: rgba(255, 107, 53, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #ff6b35;">
                            <h3 style="color: #bf360c; margin: 0 0 10px 0; text-align: center;">Mode Ligne</h3>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                            <div><strong>Dégâts:</strong> ${SPELL_CONFIG.damageFormula} + Charisme</div>
                            <div><strong>Zone:</strong> Ligne droite (${SPELL_CONFIG.modes.ligne.maxRange} cases max)</div>
                            <div><strong>Coût:</strong> ${actualManaCost} mana ${actualManaCost === 0 ? '(Gratuit en Focus)' : ''}</div>
                            <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                            <p style="font-size: 0.9em; color: #666; margin: 10px 0 0 0;">${SPELL_CONFIG.modes.ligne.description}</p>
                        </div>

                        <div style="background: rgba(255, 69, 0, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #ff4500;">
                            <h3 style="color: #d84315; margin: 0 0 10px 0; text-align: center;">Mode Cône</h3>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                            <div><strong>Dégâts:</strong> ${SPELL_CONFIG.damageFormula} + Charisme</div>
                            <div><strong>Zone:</strong> Cône ${SPELL_CONFIG.modes.cone.angle}° (${SPELL_CONFIG.modes.cone.maxRange} cases)</div>
                            <div><strong>Coût:</strong> ${actualManaCost} mana ${actualManaCost === 0 ? '(Gratuit en Focus)' : ''}</div>
                            <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                            <p style="font-size: 0.9em; color: #666; margin: 10px 0 0 0;">${SPELL_CONFIG.modes.cone.description}</p>
                        </div>
                    </div>

                    <div style="background: rgba(33, 150, 243, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #2196f3; margin-bottom: 15px;">
                        <strong>📋 Mécaniques Directionnelles :</strong>
                        <div style="margin-top: 5px; font-size: 0.9em;">
                            • Ligne : Détection sur trajectoire directe<br>
                            • Cône : Détection dans l'angle depuis Yunyun<br>
                            • Direction définie par ciblage Portal
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
                    ligne: {
                        icon: '<i class="fas fa-arrows-alt-h"></i>',
                        label: "Mode Ligne",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({
                                mode: 'ligne',
                                modeConfig: SPELL_CONFIG.modes.ligne,
                                attackBonus: attackBonus,
                                damageBonus: damageBonus
                            });
                        }
                    },
                    cone: {
                        icon: '<i class="fas fa-expand-alt"></i>',
                        label: "Mode Cône",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({
                                mode: 'cone',
                                modeConfig: SPELL_CONFIG.modes.cone,
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
                default: "ligne",
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
     * Selects a direction using the Portal module
     * @returns {Object|null} Target coordinates for direction or null if cancelled
     */
    async function selectDirection() {
        ui.notifications.info(`🎯 Sélectionnez la direction pour ${SPELL_CONFIG.name} - ${modeConfig.name}...`);

        try {
            const targetColor = selectedMode === 'ligne' ? SPELL_CONFIG.targeting.colorLigne : SPELL_CONFIG.targeting.colorCone;
            const targetTexture = selectedMode === 'ligne' ? SPELL_CONFIG.targeting.textureLigne : SPELL_CONFIG.targeting.textureCone;

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

    const direction = await selectDirection();
    if (!direction) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // Calculate direction angle from caster to target point
    const casterCenter = {
        x: caster.x + (caster.width / 2),
        y: caster.y + (caster.height / 2)
    };

    const directionAngle = Math.atan2(direction.y - casterCenter.y, direction.x - casterCenter.x);
    const directionDegrees = (directionAngle * 180 / Math.PI + 360) % 360;

    console.log(`[DEBUG] Direction angle: ${directionDegrees}° from caster to target point`);

    // ===== DIRECTIONAL TARGET DETECTION =====
    /**
     * Finds targets in the flame area based on mode (line or cone)
     * @param {string} mode - 'ligne' or 'cone'
     * @param {Object} modeConfig - Configuration for the selected mode
     * @param {number} angle - Direction angle in degrees
     * @returns {Array} Array of target objects
     */
    function findTargetsInFlameArea(mode, modeConfig, angle) {
        const targets = [];
        const gridSize = canvas.grid.size;

        // Convert caster position to grid coordinates
        const casterGridX = Math.floor(casterCenter.x / gridSize);
        const casterGridY = Math.floor(casterCenter.y / gridSize);

        console.log(`[DEBUG] Searching for targets in ${mode} from caster at grid (${casterGridX}, ${casterGridY}), angle: ${angle}°`);

        for (const token of canvas.tokens.placeables) {
            if (!token.visible || token === caster) continue;

            // Get token center and convert to grid coordinates
            const tokenCenterX = token.x + (token.width / 2);
            const tokenCenterY = token.y + (token.height / 2);
            const tokenGridX = Math.floor(tokenCenterX / gridSize);
            const tokenGridY = Math.floor(tokenCenterY / gridSize);

            // Calculate distance and angle from caster to token
            const deltaX = tokenGridX - casterGridX;
            const deltaY = tokenGridY - casterGridY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const tokenAngle = (Math.atan2(deltaY, deltaX) * 180 / Math.PI + 360) % 360;

            if (mode === 'ligne') {
                // Line mode: check if token is on or near the line within range
                if (distance <= modeConfig.maxRange) {
                    // Calculate angular difference
                    let angleDiff = Math.abs(tokenAngle - angle);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;

                    // Allow some tolerance for line width (±22.5° for 1-square width)
                    if (angleDiff <= 22.5) {
                        console.log(`[DEBUG] Line target found: ${token.name} at distance ${distance.toFixed(1)}, angle diff: ${angleDiff.toFixed(1)}°`);
                        targets.push({
                            token: token,
                            name: token.name,
                            actor: token.actor,
                            distance: distance,
                            angle: tokenAngle,
                            gridX: tokenGridX,
                            gridY: tokenGridY
                        });
                    }
                }
            } else if (mode === 'cone') {
                // Cone mode: check if token is within cone angle and range
                if (distance <= modeConfig.maxRange) {
                    // Calculate angular difference
                    let angleDiff = Math.abs(tokenAngle - angle);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;

                    // Check if within cone angle (120° / 2 = 60° on each side)
                    const halfAngle = modeConfig.angle / 2;
                    if (angleDiff <= halfAngle) {
                        console.log(`[DEBUG] Cone target found: ${token.name} at distance ${distance.toFixed(1)}, angle diff: ${angleDiff.toFixed(1)}°`);
                        targets.push({
                            token: token,
                            name: token.name,
                            actor: token.actor,
                            distance: distance,
                            angle: tokenAngle,
                            gridX: tokenGridX,
                            gridY: tokenGridY
                        });
                    }
                }
            }
        }

        return targets;
    }

    const flameTargets = findTargetsInFlameArea(selectedMode, modeConfig, directionDegrees);

    console.log(`[DEBUG] Flame targets found: ${flameTargets.length}`);
    flameTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name} (distance: ${target.distance.toFixed(1)}, angle: ${target.angle.toFixed(1)}°)`);
    });

    if (flameTargets.length === 0) {
        ui.notifications.warn("⚠️ Aucune cible trouvée dans la zone de flamme !");
        return;
    }

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const damageRoll = new Roll(SPELL_CONFIG.damageFormula);
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

            let sequence = new Sequence()
                .effect()
                    .file(animations.cast)
                    .attachTo(caster)
                    .scale(0.8)

            if (selectedMode === 'ligne') {
                // Line animation from caster towards direction
                const endX = casterCenter.x + Math.cos(directionAngle) * (modeConfig.maxRange * canvas.grid.size);
                const endY = casterCenter.y + Math.sin(directionAngle) * (modeConfig.maxRange * canvas.grid.size);

                sequence.effect()
                    .file(animations.flame)
                    .attachTo(caster)
                    .stretchTo({ x: endX, y: endY })
                    .scale(0.8);
            } else {
                // Cone animation from caster in direction
                sequence.effect()
                    .file(animations.flame)
                    .attachTo(caster)
                    .rotateTowards({ x: direction.x, y: direction.y })
                    .scale(0.8);

                    sequence.effect()
                    .file(animations.flame)
                    .attachTo(caster)
                    .rotateTowards({ x: direction.x, y: direction.y })
                    .scale(0.8)
                    .rotate(-30);
                    sequence.effect()
                    .file(animations.flame)
                    .attachTo(caster)
                    .rotateTowards({ x: direction.x, y: direction.y })
                    .scale(0.8)
                    .rotate(30);
                     sequence.effect()
                    .file(animations.flame)
                    .attachTo(caster)
                    .rotateTowards({ x: direction.x, y: direction.y })
                    .scale(0.8)
                    .rotate(-15);
                    sequence.effect()
                    .file(animations.flame)
                    .attachTo(caster)
                    .rotateTowards({ x: direction.x, y: direction.y })
                    .scale(0.8)
                    .rotate(15);
            }

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
        combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${damageResult.totalBonus}`);
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
        const maxDamage = parseInt(SPELL_CONFIG.damageFormula.split('d')[0]) * parseInt(SPELL_CONFIG.damageFormula.split('d')[1]);
        finalDamageResult = {
            ...damageResult,
            total: maxDamage + damageResult.totalBonus
        };
    }

    // Build enhanced flavor for the final dice roll message
    function createChatFlavor() {
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const modeIcon = selectedMode === 'ligne' ? "🔥" : "🌋";
        const borderColor = selectedMode === 'ligne' ? '#ff6b35' : '#ff4500';
        const bgGradient = selectedMode === 'ligne'
            ? "linear-gradient(135deg, #ffebee, #fff3e0)"
            : "linear-gradient(135deg, #fff3e0, #ffcc80)";

        const targetNames = flameTargets.map(t => t.name).join(', ');
        const zoneDescription = selectedMode === 'ligne'
            ? `Ligne ${modeConfig.maxRange} cases`
            : `Cône ${modeConfig.angle}° sur ${modeConfig.maxRange} cases`;

        const actualManaCostDisplay = actualManaCost === 0
            ? 'GRATUIT (Position Focus)'
            : `${actualManaCost} mana`;

        return `
            <div style="background: ${bgGradient}; padding: 12px; border-radius: 8px; border: 2px solid ${borderColor}; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1976d2;">${modeIcon} Sort de ${SPELL_CONFIG.name} - ${modeConfig.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                    </div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>${modeIcon} ${modeConfig.name}${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cibles (${flameTargets.length}):</strong> ${targetNames}</div>
                    <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${SPELL_CONFIG.damageFormula} + ${damageResult.totalBonus})</div>
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>🎯 Zone:</strong> ${zoneDescription} • <strong>✨ Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                </div>
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
    const manaCostInfo = actualManaCost === 0 ? ' - GRATUIT (Focus)' : ` - ${actualManaCost} mana`;
    const targetCount = flameTargets.length;
    const zoneDescription = selectedMode === 'ligne'
        ? `ligne ${modeConfig.maxRange} cases`
        : `cône ${modeConfig.angle}° sur ${modeConfig.maxRange} cases`;

    ui.notifications.info(`${SPELL_CONFIG.name} - ${modeConfig.name} lancé !${stanceInfo} ${targetCount} cible${targetCount > 1 ? 's' : ''} en ${zoneDescription}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${manaCostInfo}`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Mode: ${selectedMode}, Caster: ${actor.name}, Targets: ${targetCount}, Damage: ${finalDamageResult.total}`);

})();
