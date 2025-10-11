/**
 * Fléchettes Sanguines - Robby
 *
 * Robby lance des fléchettes de sang magique qui peuvent soit blesser les ennemis
 * soit renforcer les alliés selon le mode choisi.
 *
 * Mode Agressif (Ennemi) :
 * - Caractéristique d'attaque : Dextérité (+ effets actifs + bonus manuels)
 * - Dégâts : 1d4 + Dextérité + bonus manuels + bonus d'effets actifs
 * - Effet : Ralentissement (-2 cases de vitesse, résistance possible)
 * - Coût : 4 mana (focalisable)
 *
 * Mode Défensif (Allié) :
 * - Pas de jet d'attaque (application automatique)
 * - Effet : Résistance (Esprit de Robby/2 en statuscounter)
 * - Durée : 3 utilisations maximum, durée limitée
 * - Coût : 4 mana (focalisable)
 *
 * Usage : Sélectionner le token de Robby, choisir le mode, puis cibler.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Fléchettes Sanguines",
        description: "Projectiles de sang magique offensifs ou défensifs",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        resistanceCharacteristic: "esprit",
        resistanceCharacteristicDisplay: "Esprit",
        manaCost: 4,
        spellLevel: 1,
        damageFormula: "1d4",
        isDirect: true,
        isFocusable: true,
        speedReduction: 2,
        animations: {
            projectile: "jb2a_patreon.magic_missile.dark_red",
            impact: "jb2a_patreon.impact.001.dark_red",
            sound: null
        },
        targeting: {
            range: 200,
            colorAggressive: "#8b0000",
            colorDefensive: "#228b22",
            textureAggressive: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm",
            textureDefensive: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Robby !");
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
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "dexterite")
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey} (total: ${totalBonus})`);
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
            return null;
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
            console.log(`[DEBUG] ${characteristic} modified by ${effectBonus} from active effects`);
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
    const spiritInfo = getCharacteristicValue(actor, SPELL_CONFIG.resistanceCharacteristic);
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);

    // ===== MODE SELECTION DIALOG =====
    async function selectSpellMode() {
        return new Promise((resolve) => {
            new Dialog({
                title: `🩸 ${SPELL_CONFIG.name} - Sélection du Mode`,
                content: `
                    <div style="padding: 15px; background: #f9f9f9; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #333;">🩸 ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Coût:</strong> ${actualManaCost} mana ${currentStance === 'focus' ? '(Focus - GRATUIT)' : ''}</p>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                            <div style="border: 2px solid #8b0000; padding: 15px; border-radius: 8px; background: #ffebee;">
                                <h4 style="margin-top: 0; color: #8b0000; text-align: center;">⚔️ Mode Agressif</h4>
                                <p style="margin: 8px 0; font-size: 0.9em;"><strong>Cible:</strong> Ennemi</p>
                                <p style="margin: 8px 0; font-size: 0.9em;"><strong>Effet:</strong> ${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay} dégâts</p>
                                <p style="margin: 8px 0; font-size: 0.9em;"><strong>Ralentissement:</strong> -${SPELL_CONFIG.speedReduction} cases de vitesse</p>
                                <p style="margin: 8px 0; font-size: 0.8em; color: #666;"><em>La cible peut résister chaque tour (Volonté vs Esprit)</em></p>

                                <div style="margin: 10px 0; padding: 8px; background: #fff; border-radius: 4px;">
                                    <div style="display: flex; gap: 10px; align-items: center;">
                                        <label style="font-size: 0.8em;">Bonus attaque:</label>
                                        <input type="number" id="aggressiveAttackBonus" value="0" min="-5" max="5" style="width: 50px; padding: 2px;">
                                        <label style="font-size: 0.8em;">Bonus dégâts:</label>
                                        <input type="number" id="aggressiveDamageBonus" value="0" min="-5" max="5" style="width: 50px; padding: 2px;">
                                    </div>
                                </div>

                            </div>

                            <div style="border: 2px solid #228b22; padding: 15px; border-radius: 8px; background: #f0fff0;">
                                <h4 style="margin-top: 0; color: #228b22; text-align: center;">🛡️ Mode Défensif</h4>
                                <p style="margin: 8px 0; font-size: 0.9em;"><strong>Cible:</strong> Allié</p>
                                <p style="margin: 8px 0; font-size: 0.9em;"><strong>Effet:</strong> Résistance (+${Math.floor(spiritInfo.final / 2)} bonus)</p>
                                <p style="margin: 8px 0; font-size: 0.9em;"><strong>Utilisations:</strong> 3 maximum</p>
                                <p style="margin: 8px 0; font-size: 0.9em;"><strong>Durée:</strong> ${Math.floor(spiritInfo.final / 2)} tours maximum</p>
                                <p style="margin: 8px 0; font-size: 0.8em; color: #666;"><em>Application automatique (pas de jet d'attaque)</em></p>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">📊 Statistiques</h4>
                            <p style="margin: 5px 0; color: #333;"><strong>${SPELL_CONFIG.characteristicDisplay}:</strong> ${characteristicInfo.final}</p>
                            <p style="margin: 5px 0; color: #333;"><strong>${SPELL_CONFIG.resistanceCharacteristicDisplay}:</strong> ${spiritInfo.final}</p>
                        </div>
                    </div>
                `,
                buttons: {
                    aggressive: {
                        icon: '<i class="fas fa-sword"></i>',
                        label: "⚔️ Mode Agressif",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find("#aggressiveAttackBonus").val()) || 0;
                            const damageBonus = parseInt(html.find("#aggressiveDamageBonus").val()) || 0;
                            resolve({ mode: "aggressive", attackBonus, damageBonus });
                        }
                    },
                    defensive: {
                        icon: '<i class="fas fa-shield"></i>',
                        label: "🛡️ Mode Défensif",
                        callback: () => {
                            resolve({ mode: "defensive", attackBonus: 0, damageBonus: 0 });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "aggressive",
                close: () => resolve(null)
            }, {
                width: 600,
                height: 550,
                resizable: true
            }).render(true);
        });
    }

    const modeSelection = await selectSpellMode();
    if (!modeSelection) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { mode: selectedMode, attackBonus, damageBonus } = modeSelection;

    // ===== TARGETING SYSTEM =====
    /**
     * Selects a target using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTarget() {
        try {
            const isAggressive = selectedMode === 'aggressive';
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(isAggressive ? SPELL_CONFIG.targeting.colorAggressive : SPELL_CONFIG.targeting.colorDefensive)
                .texture(isAggressive ? SPELL_CONFIG.targeting.textureAggressive : SPELL_CONFIG.targeting.textureDefensive);

            const target = await portal.pick();
            return target;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            console.error("[DEBUG] Portal targeting error:", error);
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
            // We have a grid - use grid-based detection
            const targetGridX = Math.floor(targetX / gridSize);
            const targetGridY = Math.floor(targetY / gridSize);

            console.log(`[DEBUG] Grid position: (${targetGridX}, ${targetGridY})`);

            for (const token of canvas.tokens.placeables) {
                if (!token.actor) continue;
                if (!token.visible) continue;

                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Check if target position overlaps with token's occupied grid squares
                const tokenWidth = Math.max(1, Math.floor(token.w / gridSize));
                const tokenHeight = Math.max(1, Math.floor(token.h / gridSize));

                if (targetGridX >= tokenGridX &&
                    targetGridX < tokenGridX + tokenWidth &&
                    targetGridY >= tokenGridY &&
                    targetGridY < tokenGridY + tokenHeight) {

                    console.log(`[DEBUG] Found actor in grid: ${token.name} at grid (${tokenGridX}, ${tokenGridY}) with size ${tokenWidth}x${tokenHeight}`);
                    return {
                        actor: token.actor,
                        token: token,
                        name: token.name,
                        gridX: tokenGridX,
                        gridY: targetGridY
                    };
                }
            }
        } else {
            // No grid - use pixel-based detection with tolerance
            const tolerance = 25; // pixels

            for (const token of canvas.tokens.placeables) {
                if (!token.actor) continue;
                if (!token.visible) continue;

                const tokenCenterX = token.x + token.w / 2;
                const tokenCenterY = token.y + token.h / 2;
                const distance = Math.sqrt(
                    Math.pow(targetX - tokenCenterX, 2) +
                    Math.pow(targetY - tokenCenterY, 2)
                );

                if (distance <= tolerance + Math.max(token.w, token.h) / 2) {
                    console.log(`[DEBUG] Found actor without grid: ${token.name} at distance ${distance.toFixed(2)} pixels`);
                    return {
                        actor: token.actor,
                        token: token,
                        name: token.name,
                        pixelDistance: distance
                    };
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

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        try {
            let sequence = new Sequence();

            // Projectile from caster to target
            if (SPELL_CONFIG.animations.projectile) {
                sequence.effect()
                    .file(SPELL_CONFIG.animations.projectile)
                    .atLocation(caster)
                    .stretchTo(targetActor.token)
                    .tint(selectedMode === 'aggressive' ? "#8b0000" : "#228b22")
                    .scale(0.6)
                    .waitUntilFinished(-500);
            }

            // Impact effect at target
            if (SPELL_CONFIG.animations.impact) {
                sequence.effect()
                    .file(SPELL_CONFIG.animations.impact)
                    .atLocation(targetActor.token)
                    .tint(selectedMode === 'aggressive' ? "#8b0000" : "#228b22")
                    .scale(0.8);
            }

            // Sound effect
            if (SPELL_CONFIG.animations.sound) {
                sequence.sound()
                    .file(SPELL_CONFIG.animations.sound)
                    .volume(0.6);
            }

            await sequence.play();
        } catch (error) {
            console.warn("[DEBUG] Animation failed:", error);
            // Continue without animation if Sequencer fails
        }
    }

    await playSpellAnimation();

    // ===== MODE-SPECIFIC LOGIC =====
    if (selectedMode === 'aggressive') {
        // ===== AGGRESSIVE MODE - DAMAGE AND SLOWDOWN =====

        // ===== DAMAGE CALCULATION =====
        async function calculateDamage() {
            const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
            const effectDamageBonus = getActiveEffectBonus(actor, "damage");

            const totalCharacteristic = characteristicInfo.final + characteristicBonus;
            const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;

            let damageFormula = SPELL_CONFIG.damageFormula;
            if (totalDamageBonus > 0) {
                damageFormula += ` + ${totalDamageBonus}`;
            }

            // Stance offensive : maximiser les dégâts
            if (currentStance === 'offensif') {
                const diceMatch = SPELL_CONFIG.damageFormula.match(/(\d+)d(\d+)/);
                if (diceMatch) {
                    const numDice = parseInt(diceMatch[1]);
                    const diceSize = parseInt(diceMatch[2]);
                    const maxDiceValue = numDice * diceSize;
                    const maxDamage = maxDiceValue + totalDamageBonus;

                    return {
                        roll: null,
                        total: maxDamage,
                        formula: `${maxDiceValue} (max) + ${totalDamageBonus}`,
                        isMaximized: true
                    };
                }
            } else {
                const damageRoll = new Roll(damageFormula);
                await damageRoll.evaluate({ async: true });

                return {
                    roll: damageRoll,
                    total: damageRoll.total,
                    formula: damageFormula,
                    isMaximized: false
                };
            }
        }

        const damageResult = await calculateDamage();

        // ===== ATTACK AND DAMAGE RESOLUTION =====
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const totalAttackDice = characteristicInfo.final + characteristicBonus + attackBonus;
        const levelBonus = 2 * SPELL_CONFIG.spellLevel;

        // Build combined roll formula: attack roll + damage roll
        let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

        // Add damage roll to the combined formula (only if not maximized)
        if (currentStance !== 'offensif') {
            const effectDamageBonus = getActiveEffectBonus(actor, "damage");
            const totalCharacteristic = characteristicInfo.final + characteristicBonus;
            const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;
            combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`);
        }

        const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        // Extract results from the combined roll
        const attackResult = combinedRoll.terms[0].results[0];
        let finalDamageResult = damageResult;

        if (currentStance !== 'offensif') {
            // Extract damage result from dice roll
            const damageRollResult = combinedRoll.terms[0].results[1];
            const effectDamageBonus = getActiveEffectBonus(actor, "damage");
            const totalCharacteristic = characteristicInfo.final + characteristicBonus;
            const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;
            const displayFormula = `${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`;

            finalDamageResult = {
                roll: null,
                total: damageRollResult.result,
                formula: displayFormula,
                isMaximized: false
            };
        }

        // ===== APPLY SLOWDOWN EFFECT =====
        async function applyEffectWithGMDelegation(targetToken, effectData) {
            if (!targetToken || !effectData) return;
            if (targetToken.actor.isOwner) {
                await targetToken.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            } else {
                if (!game.modules.get("socketlib")?.active) {
                    ui.notifications.error("Socketlib module is required for GM delegation.");
                    return;
                }

                if (!globalThis.gmSocket) {
                    ui.notifications.error("GM Socket not available. Make sure a GM is connected.");
                    return;
                }

                console.log("[DEBUG] Requesting GM to apply effect to token", targetToken.name, effectData);

                try {
                    const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetToken.id, effectData);
                    console.log("[DEBUG] GM delegation result:", result);
                } catch (err) {
                    console.error("[DEBUG] GM delegation failed:", err);
                    ui.notifications.error("Failed to apply effect via GM delegation");
                }
            }
        }

        async function updateEffectWithGMDelegation(targetToken, effectId, updateData) {
            if (!targetToken || !effectId || !updateData) return;
            if (targetToken.actor.isOwner) {
                const effect = targetToken.actor.effects.get(effectId);
                if (effect) await effect.update(updateData);
            } else {
                if (!game.modules.get("socketlib")?.active) {
                    ui.notifications.error("Socketlib module is required for GM delegation.");
                    return;
                }

                if (!globalThis.gmSocket) {
                    ui.notifications.error("GM Socket not available. Make sure a GM is connected.");
                    return;
                }

                console.log("[DEBUG] Requesting GM to update effect", effectId, "on token", targetToken.name, updateData);

                try {
                    const result = await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetToken.id, effectId, updateData);
                    console.log("[DEBUG] GM delegation result:", result);
                } catch (err) {
                    console.error("[DEBUG] GM delegation failed:", err);
                    ui.notifications.error("Failed to update effect via GM delegation");
                }
            }
        }

        // Track whether we applied or found an existing effect
        let slowdownWasAlreadyPresent = false;
        let slowdownApplied = false;
        let appliedSlowdownValue = SPELL_CONFIG.speedReduction;

        try {
            // Check if target already has a slowdown effect
            const existingSlowdown = targetActor.actor.effects.find(e =>
                e.name === "Ralentissement Sanguin" ||
                e.name === "Ralentissement" ||
                e.name.toLowerCase().includes("ralentissement")
            );
            if (existingSlowdown) {
                // Do not increase the slowdown if it's already present.
                slowdownWasAlreadyPresent = true;
                appliedSlowdownValue = existingSlowdown.flags?.statuscounter?.value || SPELL_CONFIG.speedReduction;
                console.log(`[DEBUG] Slowdown already present on ${targetName}, no change applied (value ${appliedSlowdownValue})`);
            } else {
                // Create new slowdown effect
                const slowdownEffect = {
                    name: "Ralentissement Sanguin",
                    icon: "icons/svg/downgrade.svg",
                    description: `Ralentissement par Fléchettes Sanguines (-${SPELL_CONFIG.speedReduction} cases de vitesse). La cible peut essayer de résister chaque tour avec un jet de Volonté contre l'Esprit du lanceur (${spiritInfo.final}), gagnant +1 dé bonus à chaque tentative.`,
                    duration: { seconds: 86400 },
                    flags: {
                        statuscounter: {
                            value: SPELL_CONFIG.speedReduction
                        },
                        world: {
                            spellCaster: caster.id,
                            spellName: SPELL_CONFIG.name,
                            casterSpirit: spiritInfo.final
                        }
                    }
                };

                await applyEffectWithGMDelegation(targetActor.token, slowdownEffect);
                slowdownApplied = true;
                console.log(`[DEBUG] Applied new slowdown effect to ${targetName}: -${SPELL_CONFIG.speedReduction} speed`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to apply/update slowdown effect to ${targetName}:`, error);
        }

        // ===== CREATE CHAT MESSAGE FOR AGGRESSIVE MODE =====
        function createAggressiveChatFlavor() {
            const actualManaCostDisplay = actualManaCost === 0 ? 'GRATUIT' : `${actualManaCost} mana`;

            const attackDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                </div>
            `;

            const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
            const damageDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #8b0000; margin-bottom: 6px;"><strong>🩸 ${SPELL_CONFIG.name} - Agressif${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                    <div style="font-size: 1.4em; color: #8b0000; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay})</div>
                </div>
            `;

            // Show whether the slow was newly applied or already present (réinitialisé)
            const slowdownDisplay = slowdownWasAlreadyPresent
                ? `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #7b1fa2; font-weight: bold;">🐌 RALENTISSEMENT: réinitialisé</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">Valeur actuelle: -${appliedSlowdownValue} cases • Résistance possible (Volonté vs Esprit ${spiritInfo.final})</div>
                </div>
            `
                : `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #7b1fa2; font-weight: bold;">🐌 RALENTISSEMENT: -${SPELL_CONFIG.speedReduction} cases</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">Résistance possible (Volonté vs Esprit ${spiritInfo.final})</div>
                </div>
            `;

            return `
                <div style="background: linear-gradient(135deg, #ffebee, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #8b0000; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #424242;">🩸 ${SPELL_CONFIG.name} - ⚔️ Agressif</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                            ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                        </div>
                    </div>
                    ${attackDisplay}
                    ${damageDisplay}
                    ${slowdownDisplay}
                </div>
            `;
        }

        const enhancedFlavor = createAggressiveChatFlavor();

        // Send the unified dice roll message
        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: enhancedFlavor,
            rollMode: game.settings.get("core", "rollMode")
        });

        // ===== FINAL NOTIFICATION FOR AGGRESSIVE MODE =====
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const manaCostInfo = actualManaCost === 0 ? ' GRATUIT' : ` - ${actualManaCost} mana`;

        ui.notifications.info(`🩸 ${SPELL_CONFIG.name} (Agressif) lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}, Ralentissement: -${SPELL_CONFIG.speedReduction} cases${manaCostInfo}`);

    } else {
        // ===== DEFENSIVE MODE - RESISTANCE EFFECT =====

        async function applyEffectWithGMDelegation(targetToken, effectData) {
            if (!targetToken || !effectData) return;
            if (targetToken.actor.isOwner) {
                await targetToken.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            } else {
                if (!game.modules.get("socketlib")?.active) {
                    ui.notifications.error("Socketlib module is required for GM delegation.");
                    return;
                }

                if (!globalThis.gmSocket) {
                    ui.notifications.error("GM Socket not available. Make sure a GM is connected.");
                    return;
                }

                console.log("[DEBUG] Requesting GM to apply effect to token", targetToken.name, effectData);

                try {
                    const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetToken.id, effectData);
                    console.log("[DEBUG] GM delegation result:", result);
                } catch (err) {
                    console.error("[DEBUG] GM delegation failed:", err);
                    ui.notifications.error("Failed to apply effect via GM delegation");
                }
            }
        }

        // Track whether resistance was applied or already present
        let resistanceWasAlreadyPresent = false;
        let resistanceApplied = false;
        let appliedResistanceValue = 0;

        try {
            const resistanceValue = Math.floor(spiritInfo.final / 2);
            const maxDuration = Math.floor(spiritInfo.final / 2);

            // Check if target already has the resistance effect
            const existingResistance = targetActor.actor.effects.find(e =>
                e.name === "Résistance Sanguine" || e.name.toLowerCase().includes("résistance")
            );

            if (existingResistance) {
                resistanceWasAlreadyPresent = true;
                appliedResistanceValue = existingResistance.flags?.statuscounter?.value || resistanceValue;
                console.log(`[DEBUG] Resistance already present on ${targetName}, no change applied (value ${appliedResistanceValue})`);
            } else {
                // Create resistance effect
                const resistanceEffect = {
                    name: "Résistance Sanguine",
                    icon: "icons/svg/upgrade.svg",
                    description: `Résistance par Fléchettes Sanguines. L'effet a 3 utilisations et dure maximum ${maxDuration} tours.`,
                    duration: {
                        seconds: 86400
                    },
                    flags: {
                        statuscounter: {
                            value: resistanceValue
                        },
                        world: {
                            spellCaster: caster.id,
                            spellName: SPELL_CONFIG.name
                        }
                    }
                };

                await applyEffectWithGMDelegation(targetActor.token, resistanceEffect);
                resistanceApplied = true;
                appliedResistanceValue = resistanceValue;
                console.log(`[DEBUG] Applied resistance effect to ${targetName}: +${resistanceValue} bonus, 3 uses, ${maxDuration} rounds max`);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to apply resistance effect to ${targetName}:`, error);
        }

        // ===== CREATE CHAT MESSAGE FOR DEFENSIVE MODE =====
        function createDefensiveChatMessage() {
            const actualManaCostDisplay = actualManaCost === 0 ? 'GRATUIT' : `${actualManaCost} mana`;
            const resistanceValue = Math.floor(spiritInfo.final / 2);
            const maxDuration = Math.floor(spiritInfo.final / 2);

            // Show réinitialisé if the resistance was already present
            const resistanceDisplay = resistanceWasAlreadyPresent
                ? `<div style="text-align: center; margin: 8px 0; padding: 10px; background: #f0fff0; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #228b22; margin-bottom: 6px; font-weight: bold;">🛡️ RÉSISTANCE: réinitialisé</div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;">Cible: ${targetName}</div>
                        <div style="font-size: 1.4em; color: #228b22; font-weight: bold;">✨ RÉSISTANCE: +${appliedResistanceValue}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 2px;">3 utilisations • ${maxDuration} tours maximum</div>
                    </div>`
                : `
                <div style="background: linear-gradient(135deg, #f0fff0, #e8f5e8); padding: 12px; border-radius: 8px; border: 2px solid #228b22; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #424242;">🩸 ${SPELL_CONFIG.name} - 🛡️ Défensif</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                            ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                        </div>
                    </div>

                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f0fff0; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #228b22; margin-bottom: 6px;"><strong>🛡️ Application Automatique</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                        <div style="font-size: 1.4em; color: #228b22; font-weight: bold;">✨ RÉSISTANCE: +${appliedResistanceValue}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 2px;">3 utilisations • ${maxDuration} tours maximum</div>
                    </div>
                </div>
            `;

            return resistanceDisplay;
        }

        // Send chat message for defensive mode
        const chatContent = createDefensiveChatMessage();
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: chatContent,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });

        // ===== FINAL NOTIFICATION FOR DEFENSIVE MODE =====
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const manaCostInfo = actualManaCost === 0 ? ' GRATUIT' : ` - ${actualManaCost} mana`;
        const resistanceValue = Math.floor(spiritInfo.final / 2);
        const maxDuration = Math.floor(spiritInfo.final / 2);

        ui.notifications.info(`🩸 ${SPELL_CONFIG.name} (Défensif) lancé !${stanceInfo} Cible: ${targetName}. Résistance: +${resistanceValue} (3 utilisations, ${maxDuration} tours max)${manaCostInfo}`);
    }

    console.log(`[DEBUG] Fléchettes Sanguines cast complete - Mode: ${selectedMode}, Caster: ${actor.name}, Target: ${targetName}`);

})();
