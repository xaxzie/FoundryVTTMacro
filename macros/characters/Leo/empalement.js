/**
 * Empalement (Impalement) - Léo
 *
 * Léo crée un cercle magique qui invoque des armes sortant du sol pour transpercer
 * les ennemis dans une zone de 1 case de rayon et réduire leur vitesse.
 *
 * Variantes :
 * - Standard : Coût 3 mana (focalisable), niveau 2, réduit vitesse 1d3 cases
 * - Électrique : Coût 5 mana (focalisable), niveau 2, réduit vitesse 2d3 cases
 *
 * - Caractéristique d'attaque : Dextérité (+ effets actifs + bonus manuels)
 * - Dégâts : 1d6 + Dextérité + bonus manuels + bonus d'effets actifs
 * - Effet spécial : L'effet "Serpent" ne fonctionne pas avec ce sort
 * - Zone d'effet : Cercle de 1 case de rayon
 * - Effet de ralentissement : Applique un effet "Ralentissement" avec statusCounter
 *
 * Usage : Sélectionner le token de Léo, lancer la macro et choisir le point central.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_VARIANTS = {
        "standard": {
            name: "Empalement",
            description: "Cercle magique invoquant des armes du sol (1 case de rayon, -1d3 vitesse)",
            manaCost: 3,
            spellLevel: 2,
            element: "physical",
            speedReduction: "1d3",
            speedReductionDice: 1,
            animations: {
                cast: "jb2a.aura_themed.01.outward.loop.metal.01.grey",
                impact: "jb2a_patreon.impact.006.yellow",
                area: "jaamod.traps.spikes_trap_d",
                sound: null
            },
            targeting: {
                color: "#8b4513",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Brown_400x400.webm"
            }
        },
        "electric": {
            name: "Empalement Électrique",
            description: "Cercle magique électrifié invoquant des armes du sol (1 case de rayon, -2d3 vitesse)",
            manaCost: 5,
            spellLevel: 2,
            element: "electric",
            speedReduction: "2d3",
            speedReductionDice: 2,
            animations: {
                cast: "jb2a.aura_themed.01.outward.loop.metal.01.grey",
                impact: "jb2a_patreon.impact.006.yellow",
                electric: "animated-spell-effects-cartoon.electricity.35",
                area: "jaamod.traps.spikes_trap_d",
                sound: null
            },
            targeting: {
                color: "#ffff00",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Yellow_400x400.webm"
            }
        }
    };

    const BASE_CONFIG = {
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        damageFormula: "1d6",
        isDirect: true,
        isFocusable: true,
        serpentExclusion: true, // L'effet Serpent ne fonctionne pas
        areaRadius: 1, // 1 case de rayon
        maxRange: 300
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    // Active effect bonuses (excludes Serpent for this spell)
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            // Skip Serpent effect
            if (effect.name?.toLowerCase() === 'serpent') {
                console.log(`[DEBUG] Excluding Serpent effect from ${flagKey} bonus`);
                continue;
            }
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                total += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey}`);
            }
        }
        return total;
    }

    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system?.attributes?.[characteristic];
        if (!attr) {
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
        }
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    function calculateManaCost(baseCost, stance, isFocusable) {
        if (!isFocusable) return baseCost;
        if (stance === 'focus') return 0;
        return baseCost;
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, BASE_CONFIG.characteristic);

    // ===== SPELL VARIANT SELECTION =====
    async function selectSpellVariant() {
        return new Promise((resolve) => {
            new Dialog({
                title: "🗡️ Sélection du Sort - Empalement",
                content: `
                    <div style="margin-bottom: 15px;">
                        <h3>Type d'Empalement :</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">

                            <div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px;">
                                <h4>🗡️ Standard</h4>
                                <label style="display: block; margin: 5px 0;">
                                    <input type="radio" name="variant" value="standard" checked>
                                    Empalement (3 mana, -1d3 vitesse)
                                </label>
                                <small>Armes physiques du sol</small>
                            </div>

                            <div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px; background: #fff8e1;">
                                <h4>⚡ Électrique</h4>
                                <label style="display: block; margin: 5px 0;">
                                    <input type="radio" name="variant" value="electric">
                                    Empalement Électrique (5 mana, -2d3 vitesse)
                                </label>
                                <small>Armes électrifiées plus puissantes</small>
                            </div>

                        </div>
                    </div>

                    <div style="background: #e8f4f8; padding: 10px; border-radius: 5px; margin-top: 15px;">
                        <p><strong>Note :</strong> L'effet "Serpent" ne fonctionne pas avec ce sort. La réduction de vitesse n'est pas maximisée en Position Offensive.</p>
                    </div>
                `,
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirmer",
                        callback: (html) => {
                            const selected = html.find('input[name="variant"]:checked').val();
                            resolve(selected);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "ok"
            }).render(true);
        });
    }

    const selectedVariant = await selectSpellVariant();
    if (!selectedVariant) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    const spellConfig = { ...BASE_CONFIG, ...SPELL_VARIANTS[selectedVariant] };
    const actualManaCost = calculateManaCost(spellConfig.manaCost, currentStance, spellConfig.isFocusable);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const manaCostInfo = actualManaCost === 0 ?
            `<strong>Coût en Mana :</strong> Gratuit <em>(Position Focus)</em>` :
            `<strong>Coût en Mana :</strong> ${actualManaCost} mana`;

        let damageInfo;
        const damageBonus = effectDamageBonus !== 0 ? ` <em>(+${effectDamageBonus} bonus d'effets, Serpent exclu)</em>` : '';

        if (currentStance === 'offensif') {
            damageInfo = `Dégâts : <strong>${spellConfig.damageFormula} + ${BASE_CONFIG.characteristicDisplay} (MAXIMISÉ en Position Offensive)</strong>${damageBonus}`;
        } else {
            damageInfo = `Dégâts : <strong>${spellConfig.damageFormula} + ${BASE_CONFIG.characteristicDisplay}</strong>${damageBonus}`;
        }

        return new Promise((resolve) => {
            new Dialog({
                title: `${spellConfig.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>${spellConfig.name} :</h3>
                    <p>${manaCostInfo}</p>
                    <p><strong>Caractéristique ${BASE_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #fffbf0;">
                        <h4>Description</h4>
                        <p><em>${spellConfig.description}</em></p>
                        <p style="color: #d32f2f;"><strong>⚠️ Effet spécial :</strong> L'effet "Serpent" ne fonctionne pas avec ce sort</p>
                        <p><strong>Zone :</strong> Cercle de ${BASE_CONFIG.areaRadius} case de rayon</p>
                        <p><strong>Ralentissement :</strong> ${spellConfig.speedReduction} cases (non maximisé)</p>
                    </div>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                        <h4>Bonus Manuels</h4>
                        <div style="margin: 5px 0;">
                            <label>Bonus de dégâts :
                                <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Objets, enchantements temporaires, etc.</small>
                        </div>
                        <div style="margin: 5px 0;">
                            <label>Bonus de résolution d'attaque :
                                <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                        </div>
                    </div>

                    <p>${damageInfo}</p>
                    <p><strong>Jet d'attaque :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${spellConfig.spellLevel * 2}</span></p>

                    <script>
                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const bonus = parseInt(this.value) || 0;
                            const total = base + bonus;
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${spellConfig.spellLevel * 2}';
                        });
                    </script>
                `,
                buttons: {
                    confirm: {
                        label: `${selectedVariant === 'electric' ? '⚡' : '🗡️'} Lancer l'Empalement !`,
                        callback: (html) => {
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({ damageBonus, attackBonus });
                        }
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                }
            }).render(true);
        });
    }

    const bonusConfig = await showSpellConfigDialog();
    if (!bonusConfig) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    const { damageBonus, attackBonus } = bonusConfig;

    // ===== TARGETING SYSTEM =====
    async function selectTargeting() {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(spellConfig.maxRange || BASE_CONFIG.maxRange)
                .color(spellConfig.targeting.color)
                .texture(spellConfig.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            console.error("Portal targeting error:", error);
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const targetPoint = await selectTargeting();
    if (!targetPoint) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    // ===== AREA TARGET DETECTION =====
    function findTargetsInArea(centerX, centerY, radius) {
        const targets = [];
        const gridSize = canvas.grid.size;

        // Convert center point to grid coordinates
        const centerGridX = Math.floor(centerX / gridSize);
        const centerGridY = Math.floor(centerY / gridSize);

        for (const token of canvas.tokens.placeables) {
            if (token === caster) continue; // Don't hit the caster

            // Get token's grid position (top-left corner)
            const tokenGridX = Math.floor(token.x / gridSize);
            const tokenGridY = Math.floor(token.y / gridSize);

            // For tokens larger than 1x1, check all grid squares they occupy
            const tokenWidth = token.document.width;
            const tokenHeight = token.document.height;

            let tokenInRange = false;

            // Check each grid square occupied by the token
            for (let dx = 0; dx < tokenWidth; dx++) {
                for (let dy = 0; dy < tokenHeight; dy++) {
                    const tokenSquareX = tokenGridX + dx;
                    const tokenSquareY = tokenGridY + dy;

                    // Calculate grid distance (Chebyshev distance for D&D-style grids)
                    // This treats diagonal movement as distance 1 (like D&D 5e)
                    const gridDistance = Math.max(
                        Math.abs(tokenSquareX - centerGridX),
                        Math.abs(tokenSquareY - centerGridY)
                    );

                    if (gridDistance <= radius) {
                        tokenInRange = true;
                        break;
                    }
                }
                if (tokenInRange) break;
            }

            if (tokenInRange) {
                const targetActor = token.actor;
                if (targetActor) {
                    const isOwner = targetActor.isOwner;
                    const isVisible = token.visible;
                    const isGM = game.user.isGM;

                    // Only add targets that are visible to the current user
                    if (isOwner || isVisible || isGM) {
                        targets.push({
                            name: targetActor.name,
                            token: token,
                            actor: targetActor
                        });
                    }
                }
            }
        }

        return targets;
    }

    const areaTargets = findTargetsInArea(targetPoint.x, targetPoint.y, BASE_CONFIG.areaRadius);

    console.log(`[DEBUG] Area targets found: ${areaTargets.length}`);
    areaTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name}`);
    });

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalDamageBonus = characteristicInfo.final + damageBonus + effectDamageBonus;

        if (currentStance === 'offensif') {
            const diceMax = 6; // 1d6 maximized
            const maxDamage = diceMax + totalDamageBonus;

            console.log(`[DEBUG] Maximized damage: ${maxDamage} (${diceMax} + ${totalDamageBonus})`);

            return {
                total: maxDamage,
                formula: `${diceMax} + ${totalDamageBonus}`,
                result: `${diceMax} + ${totalDamageBonus}`,
                isMaximized: true
            };
        } else {
            const damage = new Roll(`${spellConfig.damageFormula} + @totalBonus`, { totalBonus: totalDamageBonus });
            await damage.evaluate({ async: true });

            console.log(`[DEBUG] Rolled damage: ${damage.total} (formula: ${damage.formula})`);
            return damage;
        }
    }

    const damageResult = await calculateDamage();

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Cast effect at caster
        if (spellConfig.animations.cast) {
            sequence.effect()
                .file(spellConfig.animations.cast)
                .atLocation(caster)
                .scale(0.4)
                .duration(1000)
                .fadeOut(300);
        }

        // Area effect at target point
        if (spellConfig.animations.area) {
            sequence.effect()
                .file(spellConfig.animations.area)
                .atLocation(targetPoint)
                .scale(BASE_CONFIG.areaRadius*0.8)
                .delay(500)
                .duration(2000)
                .fadeOut(500);
        }

        // Impact effects for each target
        if (spellConfig.animations.impact && areaTargets.length > 0) {
            areaTargets.forEach((target, index) => {
                const impactEffect = sequence.effect()
                    .file(spellConfig.animations.impact)
                    .atLocation(target.token)
                    .scale(0.6)
                    .delay(800 + index * 100);

                // Electric variant gets additional electric effect
                if (selectedVariant === 'electric' && spellConfig.animations.electric) {
                    sequence.effect()
                        .file(spellConfig.animations.electric)
                        .atLocation(target.token)
                        .scale(0.4)
                        .delay(800 + index * 100);
                }
            });
        }

        // Sound effect
        if (spellConfig.animations.sound) {
            sequence.sound()
                .file(spellConfig.animations.sound)
                .volume(0.6);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * spellConfig.spellLevel;

    // Build combined roll formula
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalDamageBonus = characteristicInfo.final + damageBonus + effectDamageBonus;
        combinedRollParts.push(`${spellConfig.damageFormula} + ${totalDamageBonus}`);
    }

    // Add speed reduction roll (always rolled separately, never maximized)
    combinedRollParts.push(spellConfig.speedReduction);

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results (robustly). Grouped roll results may not expose a consistent
    // `expression` property across Foundry versions/term types, so derive the
    // human-readable formula from the original composed parts instead of
    // relying on the term's `expression` to avoid "undefined" in the chat.
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        const damageRollResult = combinedRoll.terms[0].results[1];
        // Use the composed formula string from combinedRollParts[1] (the damage part)
        const damageFormulaString = combinedRollParts[1] ?? `${spellConfig.damageFormula} + ${characteristicInfo.final + damageBonus + getActiveEffectBonus(actor, "damage")}`;
        finalDamageResult = {
            total: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null),
            formula: damageFormulaString,
            result: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null)
        };
    }

    const speedIndex = currentStance !== 'offensif' ? 2 : 1;
    const speedRollResult = combinedRoll.terms[0].results[speedIndex];
    const speedFormulaString = combinedRollParts[speedIndex] ?? spellConfig.speedReduction;
    const speedTotal = speedRollResult?.result ?? speedRollResult?.total ?? 0;
    const finalSpeedReduction = {
        total: speedTotal,
        formula: speedFormulaString,
        result: speedTotal
    };

    // ===== APPLY SPEED REDUCTION EFFECT =====
    // Helper for GM delegation (copied from actor-detection.js)

async function applyEffectWithGMDelegation(targetActor, effectData) {
    if (!targetActor || !effectData) return;
    if (targetActor.isOwner) {
        await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    } else {
        if (!game.modules.get("socketlib")?.active) {
            ui.notifications.error("Socketlib module is required for GM delegation.");
            return;
        }

        // Check if GM socket is available
        if (!globalThis.gmSocket) {
            ui.notifications.error("GM Socket not available. Make sure a GM is connected.");
            return;
        }

        // Log the attempt
        console.log("[DEBUG] Requesting GM to apply effect to", targetActor.name, effectData);

        // CORRECT: Execute the function as GM using socketlib API
        try {
            const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.id, effectData);
            console.log("[DEBUG] GM delegation result:", result);
        } catch (err) {
            console.error("[DEBUG] GM delegation failed:", err);
            ui.notifications.error("Failed to apply effect via GM delegation");
        }
    }
}

// Similarly update updateEffectWithGMDelegation:
async function updateEffectWithGMDelegation(targetActor, effectId, updateData) {
    if (!targetActor || !effectId || !updateData) return;
    if (targetActor.isOwner) {
        const effect = targetActor.effects.get(effectId);
        if (effect) await effect.update(updateData);
    } else {
        if (!game.modules.get("socketlib")?.active) {
            ui.notifications.error("Socketlib module is required for GM delegation.");
            return;
        }

        // Check if GM socket is available
        if (!globalThis.gmSocket) {
            ui.notifications.error("GM Socket not available. Make sure a GM is connected.");
            return;
        }

        // Log the attempt
        console.log("[DEBUG] Requesting GM to update effect", effectId, "on", targetActor.name, updateData);

        // CORRECT: Execute the function as GM using socketlib API
        try {
            const result = await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetActor.id, effectId, updateData);
            console.log("[DEBUG] GM delegation result:", result);
        } catch (err) {
            console.error("[DEBUG] GM delegation failed:", err);
            ui.notifications.error("Failed to update effect via GM delegation");
        }
    }
}

    for (const target of areaTargets) {
        try {
            // Check if target already has a slowdown effect
            const existingEffect = target.actor.effects.find(e => e.name === "Ralentissement");
            if (existingEffect) {
                const currentSlowdown = existingEffect.flags?.statuscounter?.value || 0;
                const newSlowdown = currentSlowdown + finalSpeedReduction.total;
                const updateData = {
                    "flags.statuscounter.value": newSlowdown,
                    "description": `Ralentissement par Empalement (-${newSlowdown} cases de vitesse)`
                };
                await updateEffectWithGMDelegation(target.actor, existingEffect.id, updateData);
                console.log(`[DEBUG] Increased slowdown effect on ${target.name}: ${currentSlowdown} + ${finalSpeedReduction.total} = ${newSlowdown} speed reduction`);
                continue;
            }
            // Create slowdown effect
            const slowdownEffect = {
                name: "Ralentissement",
                icon: "icons/svg/downgrade.svg",
                description: `Ralentissement par Empalement (-${finalSpeedReduction.total} cases de vitesse)`,
                duration: { seconds: 86400 },
                flags: {
                    statuscounter: {
                        value: finalSpeedReduction.total
                    },
                    world: {
                        spellCaster: caster.id,
                        spellName: spellConfig.name,
                        createdAt: Date.now()
                    }
                }
            };
            await applyEffectWithGMDelegation(target.actor, slowdownEffect);
            console.log(`[DEBUG] Applied slowdown effect to ${target.name}: -${finalSpeedReduction.total} speed`);
        } catch (error) {
            console.error(`[ERROR] Failed to apply slowdown effect to ${target.name}:`, error);
        }
    }    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? '0 mana (Focus)' : `${actualManaCost} mana`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectDamageBonus = getActiveEffectBonus(actor, "damage");

        const effectInfo = (characteristicInfo.effectBonus !== 0 || effectDamageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${characteristicInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${BASE_CONFIG.characteristicDisplay}: +${characteristicInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 ? `<div>${selectedVariant === 'electric' ? '⚡' : '🗡️'} Bonus de Dégâts: +${effectDamageBonus} (Serpent exclu)</div>` : ''}
            </div>` : '';

        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const targetSummary = areaTargets.length > 0 ?
            `<div style="font-size: 0.9em; margin: 4px 0;"><strong>Cibles touchées (${areaTargets.length}):</strong> ${areaTargets.map(t => t.name).join(', ')}</div>` :
            `<div style="font-size: 0.9em; margin: 4px 0; color: #666;"><em>Aucune cible dans la zone</em></div>`;

        const slowdownInfo = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #2e7d32; margin-bottom: 6px;"><strong>🐌 RALENTISSEMENT: -${finalSpeedReduction.total} cases</strong></div>
                <div style="font-size: 0.8em; color: #666;">(${finalSpeedReduction.formula} - jamais maximisé)</div>
            </div>
        `;

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${selectedVariant === 'electric' ? '#e3f2fd' : '#f5f5f5'}; border-radius: 4px;">
                <div style="font-size: 1.1em; color: ${selectedVariant === 'electric' ? '#1565c0' : '#424242'}; margin-bottom: 6px;"><strong>${selectedVariant === 'electric' ? '⚡' : '🗡️'} ${spellConfig.name}${stanceNote}</strong></div>
                ${targetSummary}
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${spellConfig.damageFormula} + ${BASE_CONFIG.characteristicDisplay} + bonus)</div>
                <div style="font-size: 0.8em; color: #666;">Zone: Cercle de ${BASE_CONFIG.areaRadius} case de rayon</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, ${selectedVariant === 'electric' ? '#e3f2fd, #fff8e1' : '#f5f5f5, #fff8e1'}); padding: 12px; border-radius: 8px; border: 2px solid ${selectedVariant === 'electric' ? '#ffff00' : '#8b4513'}; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: ${selectedVariant === 'electric' ? '#1565c0' : '#424242'};">${selectedVariant === 'electric' ? '⚡' : '🗡️'} ${spellConfig.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${damageDisplay}
                ${slowdownInfo}
            </div>
        `;
    }

    // Send the combined roll to chat
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';
    const targetCount = areaTargets.length;

    ui.notifications.info(`${selectedVariant === 'electric' ? '⚡' : '🗡️'} ${spellConfig.name} lancé !${stanceInfo} ${targetCount} cible${targetCount > 1 ? 's' : ''} touchée${targetCount > 1 ? 's' : ''}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${maximizedInfo}, Ralentissement: -${finalSpeedReduction.total} cases.`);

})();
