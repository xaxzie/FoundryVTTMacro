/**
 * Incarnation Sanglante - Robby
 *
 * Robby utilise son esprit pour créer un petit rongeur de sang qui se propulse vers une cible.
 * La cible peut résister partiellement aux dégâts avec un jet de physique.
 *
 * - Caractéristique d'attaque : Esprit (+ effets actifs + bonus manuels)
 * - Dégâts : 1d6 + Esprit + bonus manuels + bonus d'effets actifs
 * - Coût de base : 4 mana (focalisable)
 * - Niveau de sort : 1
 * - Résistance : La cible peut faire un jet de Physique pour résister à la moitié des dégâts
 *
 * Usage : Sélectionner le token de Robby, lancer la macro et choisir la cible.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Incarnation Sanglante",
        description: "Petit rongeur de sang qui se propulse sur une cible",
        manaCost: 4,
        spellLevel: 1,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        damageFormula: "1d6",
        isDirect: true,
        isFocusable: true,
        hasResistance: true,
        resistanceCharacteristic: "physique",
        resistanceCharacteristicDisplay: "Physique",
        animations: {
            cast: "jb2a.cast_generic.01.red",
            projectile: "jb2a.magic_missile.red",
            impact: "jb2a.impact.red",
            blood: "animated-spell-effects.blood.splatter.red.01",
            sound: null
        },
        targeting: {
            range: 150,
            color: "#8b0000",
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
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
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "esprit")
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.world?.[flagKey];
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
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
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        // Calcul des bonus d'effets actifs
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const damageBonus = getActiveEffectBonus(actor, "damage");

        const stanceName = currentStance ?
            (currentStance === 'focus' ? 'Focus' :
                currentStance === 'offensif' ? 'Offensif' :
                    currentStance === 'defensif' ? 'Défensif' : 'Aucune') : 'Aucune';

        const injuryDisplay = characteristicInfo.injuries > 0 ?
            `<span style="color: #d32f2f;">-${characteristicInfo.injuries} (blessures)</span>` :
            '<span style="color: #2e7d32;">Aucune</span>';

        return new Promise((resolve) => {
            new Dialog({
                title: `🩸 ${SPELL_CONFIG.name}`,
                content: `
                    <div style="padding: 15px; background: #f9f9f9; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #333;">🩸 ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Coût:</strong> ${actualManaCost} mana (${currentStance || 'Aucune'} ${SPELL_CONFIG.isFocusable ? '- focalisable' : ''})</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">⚔️ Configuration</h4>
                            <div style="margin: 10px 0;">
                                <label for="attackBonus" style="display: block; margin-bottom: 5px; color: #333;">Bonus d'attaque:</label>
                                <input type="number" id="attackBonus" value="0" min="-10" max="10" style="width: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                            <div style="margin: 10px 0;">
                                <label for="damageBonus" style="display: block; margin-bottom: 5px; color: #333;">Bonus de dégâts:</label>
                                <input type="number" id="damageBonus" value="0" min="-10" max="10" style="width: 80px; padding: 5px; border: 1px solid #ddd; border-radius: 4px;">
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">📊 Statistiques</h4>
                            <p style="margin: 5px 0; color: #333;"><strong>${SPELL_CONFIG.characteristicDisplay}:</strong> ${characteristicInfo.final} ${characteristicBonus !== 0 ? `(+${characteristicBonus} effets)` : ''}</p>
                            <p style="margin: 5px 0; color: #333;"><strong>Blessures:</strong> ${injuryDisplay}</p>
                            <p style="margin: 5px 0; color: #333;"><strong>Dégâts estimés:</strong> ${SPELL_CONFIG.damageFormula} + ${characteristicInfo.final + characteristicBonus + damageBonus}</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #d32f2f;">🛡️ Résistance</h4>
                            <p style="margin: 5px 0; color: #333; font-size: 0.9em;">La cible peut faire un jet de <strong>${SPELL_CONFIG.resistanceCharacteristicDisplay}</strong> pour résister à la moitié des dégâts.</p>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find("#attackBonus").val()) || 0;
                            const damageBonus = parseInt(html.find("#damageBonus").val()) || 0;
                            resolve({ attackBonus, damageBonus });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                close: () => resolve(null)
            }, {
                width: 450,
                height: 600,
                resizable: true
            }).render(true);
        });
    }

    const spellConfig = await showSpellConfigDialog();
    if (!spellConfig) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { attackBonus, damageBonus } = spellConfig;

    // ===== TARGETING SYSTEM =====
    /**
     * Selects a target using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTarget() {
        try {
            const crosshairs = await new window.portalLib.Crosshairs()
                .range(SPELL_CONFIG.targeting.range)
                .icon(SPELL_CONFIG.targeting.texture)
                .borderColor(SPELL_CONFIG.targeting.color)
                .fillColor(SPELL_CONFIG.targeting.color)
                .size(1)
                .drawOutline()
                .drawIcon()
                .show();

            return crosshairs.cancelled ? null : { x: crosshairs.x, y: crosshairs.y };
        } catch (error) {
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

                    console.log(`[DEBUG] Found actor in grid: ${token.actor.name} at grid (${tokenGridX}, ${tokenGridY}) with size ${tokenWidth}x${tokenHeight}`);
                    return {
                        actor: token.actor,
                        token: token,
                        name: token.actor.name,
                        gridX: tokenGridX,
                        gridY: tokenGridY
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
                    console.log(`[DEBUG] Found actor without grid: ${token.actor.name} at distance ${distance.toFixed(2)} pixels`);
                    return {
                        actor: token.actor,
                        token: token,
                        name: token.actor.name,
                        pixelDistance: distance
                    };
                }
            }
        }

        console.log(`[DEBUG] No actor found at target location`);
        return null;
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : "position vide";

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

    // ===== RESISTANCE CHECK =====
    let resistanceResult = null;
    if (targetActor && SPELL_CONFIG.hasResistance) {
        const targetCharacteristicInfo = getCharacteristicValue(targetActor.actor, SPELL_CONFIG.resistanceCharacteristic);
        if (targetCharacteristicInfo) {
            const targetCharacteristicBonus = getActiveEffectBonus(targetActor.actor, SPELL_CONFIG.resistanceCharacteristic);
            const totalResistanceDice = targetCharacteristicInfo.final + targetCharacteristicBonus;

            const resistanceRoll = new Roll(`${totalResistanceDice}d7`);
            await resistanceRoll.evaluate({ async: true });

            resistanceResult = {
                roll: resistanceRoll,
                result: resistanceRoll.total,
                characteristic: targetCharacteristicInfo.final,
                bonus: targetCharacteristicBonus,
                dice: totalResistanceDice
            };
        }
    }

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Animation de cast sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.6)
            .belowTokens(true);

        // Projectile (rongeur de sang) vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.projectile)
            .attachTo(caster)
            .stretchTo(target)
            .scale(0.7)
            .delay(300)
            .waitUntilFinished(-100);

        // Impact et effet de sang au point d'impact
        sequence.effect()
            .file(SPELL_CONFIG.animations.impact)
            .atLocation(target)
            .scale(0.8)
            .delay(50);

        sequence.effect()
            .file(SPELL_CONFIG.animations.blood)
            .atLocation(target)
            .scale(0.6)
            .delay(200);

        if (SPELL_CONFIG.animations.sound) {
            sequence.sound().file(SPELL_CONFIG.animations.sound);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula: attack roll + damage roll + resistance roll
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll to the combined formula (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;
        combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`);
    }

    // Add resistance roll if applicable
    if (resistanceResult) {
        combinedRollParts.push(`${resistanceResult.dice}d7`);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results from the combined roll
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;
    let finalResistanceResult = resistanceResult;

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

    if (resistanceResult) {
        // Extract resistance result from dice roll
        const resistanceRollResult = combinedRoll.terms[0].results[combinedRollParts.length - 1];
        finalResistanceResult = {
            ...resistanceResult,
            result: resistanceRollResult.result
        };
    }

    // Calculate final damage after resistance
    let appliedDamage = finalDamageResult.total;
    let damageReduced = false;

    if (finalResistanceResult && targetActor) {
        // Compare attack vs resistance - if resistance succeeds, halve damage
        if (finalResistanceResult.result >= attackResult.result) {
            appliedDamage = Math.floor(finalDamageResult.total / 2);
            damageReduced = true;
        }
    }

    // Build enhanced flavor for the final dice roll message
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? 'GRATUIT (Focus)' : `${actualManaCost} mana`;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const resistanceNote = finalResistanceResult ?
            (damageReduced ? ' <em>(RÉDUIT DE MOITIÉ)</em>' : ' <em>(RÉSISTANCE ÉCHOUÉE)</em>') : '';

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>🩸 ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${appliedDamage}${resistanceNote}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay} + bonus)</div>
                ${finalResistanceResult ? `<div style="font-size: 0.8em; color: #666;">🛡️ Résistance (${SPELL_CONFIG.resistanceCharacteristicDisplay}): ${finalResistanceResult.result}</div>` : ''}
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f5f5f5, #ffebee); padding: 12px; border-radius: 8px; border: 2px solid #d32f2f; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">🩸 ${SPELL_CONFIG.name}</h3>
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
    const manaCostInfo = actualManaCost === 0 ? ' GRATUIT (Focus)' : ` - ${actualManaCost} mana`;
    const resistanceInfo = finalResistanceResult ?
        (damageReduced ? ` (résisté: ${finalDamageResult.total} → ${appliedDamage})` : ' (résistance échouée)') : '';

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${appliedDamage}${manaCostInfo}${resistanceInfo}`);

    console.log(`[DEBUG] Incarnation Sanglante cast complete - Caster: ${actor.name}, Target: ${targetName}, Damage: ${appliedDamage}, Resistance: ${finalResistanceResult?.result || 'N/A'}`);

})();
