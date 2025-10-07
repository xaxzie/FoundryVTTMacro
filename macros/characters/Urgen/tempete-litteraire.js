/**
 * Tempête Littéraire - Urgen
 *
 * Urgen lance un livre magique qui explose en une tempête de pages et de mots
 * dans une zone de 2 cases de rayon, infligeant des dégâts à tous les ennemis.
 *
 * - Caractéristique d'attaque : Esprit (+ effets actifs + bonus manuels)
 * - Dégâts : 1d6 + Esprit + bonus manuels + bonus d'effets actifs
 * - Coût : 6 mana (demi-focalisable : 3 mana en Focus)
 * - Niveau de sort : 2
 * - Zone d'effet : Cercle de 2 cases de rayon
 * - Effet spécial : L'esquive ne permet d'esquiver que la moitié des dégâts
 *
 * Usage : Sélectionner le token de Urgen, lancer la macro et choisir le point central.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Tempête Littéraire",
        description: "Livre magique explosant en tempête de pages (2 cases de rayon)",
        manaCost: 6,
        spellLevel: 2,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        damageFormula: "1d6",
        isDirect: true,
        isFocusable: false, // Demi-focalisable (not fully focusable)
        halfDamageOnDodge: true, // Special mechanic: dodge only reduces damage by half
        areaRadius: 2, // 2 cases de rayon
        maxRange: 400,
        animations: {
            cast: "jb2a.condition.boon.01.007.green",
            projectile: "jb2a.throwable.launch.cannon_ball.01.black",
            explosion: "jb2a_patreon.explosion.side_effects.orange.1400x933",
            area: "jb2a_patreon.template_circle.aura.01.dark_purple.1800x1800",
            pages: "jb2a_patreon.swirling_leaves.outward.orange.01",
            sound: null
        },
        targeting: {
            range: 400,
            color: "#9932cc",
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Urgen !");
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
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
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
            console.log(`[DEBUG] ${characteristic} reduced from ${baseValue} to ${injuryAdjusted} due to ${injuryStacks} injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[DEBUG] ${characteristic} adjusted by ${effectBonus} from active effects (final: ${finalValue})`);
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
     * Calcule le coût en mana basé sur la stance (demi-focalisable)
     */
    function calculateManaCost(baseCost, stance, isFocusable) {
        // Demi-focalisable: half cost in focus stance, not free
        if (stance === 'focus') {
            return Math.floor(baseCost / 2);
        }
        return baseCost;
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

        const manaCostDisplay = currentStance === 'focus' ? `${actualManaCost} mana (Demi-focalisable)` : `${actualManaCost} mana`;

        return new Promise((resolve) => {
            new Dialog({
                title: `🎯 Configuration - ${SPELL_CONFIG.name}`,
                content: `
                    <div style="background: linear-gradient(135deg, #9932cc, #8a2be2); padding: 20px; border-radius: 12px; color: white; font-family: 'Roboto', sans-serif;">
                        <h2 style="text-align: center; margin-top: 0; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">📚 ${SPELL_CONFIG.name}</h2>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #e1bee7;">🎭 État du Lanceur</h3>
                            <p><strong>Lanceur:</strong> ${actor.name}</p>
                            <p><strong>Stance:</strong> ${stanceName}</p>
                            <p><strong>Blessures:</strong> ${injuryDisplay}</p>
                            <p><strong>Coût Mana:</strong> ${manaCostDisplay}</p>
                        </div>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #e1bee7;">⚔️ Statistiques d'Attaque</h3>
                            <p><strong>${SPELL_CONFIG.characteristicDisplay}:</strong> ${characteristicInfo.base} ${characteristicInfo.injuries > 0 ? `→ ${characteristicInfo.final}` : ''}</p>
                            <p><strong>Bonus d'Effets Actifs (${SPELL_CONFIG.characteristicDisplay}):</strong> +${characteristicBonus}</p>
                            <p><strong>Bonus d'Effets Actifs (Dégâts):</strong> +${damageBonus}</p>
                            <p><strong>Niveau de Sort:</strong> ${SPELL_CONFIG.spellLevel} (+${2 * SPELL_CONFIG.spellLevel} à l'attaque)</p>
                        </div>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #e1bee7;">🎯 Bonus Manuels</h3>
                            <p><label><strong>Bonus d'Attaque Supplémentaire:</strong></label></p>
                            <input type="number" id="attackBonus" value="0" min="-10" max="20"
                                   style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none;"/>
                            <p><label><strong>Bonus de Dégâts Supplémentaire:</strong></label></p>
                            <input type="number" id="damageBonus" value="0" min="-10" max="20"
                                   style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none;"/>
                        </div>

                        <div style="background: rgba(255,193,7,0.2); padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px solid #ffc107;">
                            <h3 style="margin-top: 0; color: #fff700;">📖 Tempête Littéraire</h3>
                            <p style="font-size: 0.9em; margin-top: 10px; color: #ffe082;">
                                📌 <strong>Zone:</strong> Cercle de ${SPELL_CONFIG.areaRadius} cases de rayon<br>
                                💥 <strong>Dégâts:</strong> ${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})<br>
                                🛡️ <strong>Esquive:</strong> Ne réduit les dégâts que de moitié<br>
                                ⚡ <strong>Type:</strong> Zone d'effet magique
                            </p>
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
                width: 520,
                height: "auto"
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
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== AREA TARGET DETECTION =====
    /**
     * Finds targets in the spell area using grid-aware detection
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Radius in grid squares
     * @returns {Array} Array of target objects
     */
    function findTargetsInArea(centerX, centerY, radius) {
        const targets = [];
        const gridSize = canvas.grid.size;

        // Convert center point to grid coordinates
        const centerGridX = Math.floor(centerX / gridSize);
        const centerGridY = Math.floor(centerY / gridSize);

        console.log(`[DEBUG] Searching for targets in ${radius}-square radius around grid (${centerGridX}, ${centerGridY})`);

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

            // Check if any part of the token overlaps with the spell area
            let tokenInRange = false;

            for (let tx = tokenGridX; tx < tokenGridX + tokenWidth; tx++) {
                for (let ty = tokenGridY; ty < tokenGridY + tokenHeight; ty++) {
                    const distance = Math.sqrt(
                        Math.pow(tx - centerGridX, 2) +
                        Math.pow(ty - centerGridY, 2)
                    );

                    // Use radius + 0.5 for slightly extended range like empalement
                    if (distance <= radius + 0.5) {
                        tokenInRange = true;
                        break;
                    }
                }
                if (tokenInRange) break;
            }

            if (tokenInRange) {
                const targetActor = token.actor;
                if (targetActor) {
                    const distance = Math.sqrt(
                        Math.pow(tokenGridX + tokenWidth / 2 - centerGridX, 2) +
                        Math.pow(tokenGridY + tokenHeight / 2 - centerGridY, 2)
                    );

                    targets.push({
                        name: targetActor.name,
                        token: token,
                        actor: targetActor,
                        distance: distance
                    });

                    console.log(`[DEBUG] Target found: ${targetActor.name} at distance ${distance.toFixed(2)}`);
                }
            }
        }

        return targets;
    }

    const areaTargets = findTargetsInArea(target.x, target.y, SPELL_CONFIG.areaRadius);

    console.log(`[DEBUG] Area targets found: ${areaTargets.length}`);
    areaTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name}`);
    });

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
            // 1d6 devient 6
            const maxDamage = 6 + totalDamageBonus;
            return {
                formula: `6 + ${totalDamageBonus}`,
                total: maxDamage,
                halfDamage: Math.floor(maxDamage / 2),
                isMaximized: true
            };
        } else {
            const roll = new Roll(damageFormula);
            await roll.evaluate({ async: true });
            return {
                formula: damageFormula,
                total: roll.total,
                halfDamage: Math.floor(roll.total / 2),
                isMaximized: false,
                roll: roll
            };
        }
    }

    const damageResult = await calculateDamage();

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Animation de cast sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.6)
            .belowTokens(true)

        // Projectile du livre vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.projectile)
            .attachTo(caster)
            .stretchTo(target)
            .scale(0.8)
            .waitUntilFinished(-500);

        // Zone d'effet au point d'impact
        sequence.effect()
            .file(SPELL_CONFIG.animations.area)
            .atLocation(target)
            .scale(SPELL_CONFIG.areaRadius * 0.4)
            .duration(1000)
            .belowTokens(true)

        // Explosion principale
        sequence.effect()
            .file(SPELL_CONFIG.animations.explosion)
            .atLocation(target)
            .scale(SPELL_CONFIG.areaRadius * 0.6)

        // Effet de pages tourbillonnantes
        sequence.effect()
            .file(SPELL_CONFIG.animations.pages)
            .atLocation(target)
            .scale(SPELL_CONFIG.areaRadius * 0.8)
            .duration(2000)
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
        // Build the damage formula for display
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;
        const displayFormula = `${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`;

        finalDamageResult = {
            total: damageRollResult.result,
            formula: displayFormula,
            result: damageRollResult.result,
            halfDamage: Math.floor(damageRollResult.result / 2)
        };
    }

    // Build enhanced flavor for the final dice roll message
    const stanceName = currentStance ?
        (currentStance === 'focus' ? 'Focus' :
            currentStance === 'offensif' ? 'Offensif' :
                currentStance === 'defensif' ? 'Défensif' : 'Aucune') : 'Aucune';

    const targetSummary = areaTargets.length > 0 ?
        `<div style="font-size: 0.9em; margin: 4px 0;"><strong>Cibles dans la zone (${areaTargets.length}):</strong> ${areaTargets.map(t => t.name).join(', ')}</div>` :
        `<div style="font-size: 0.9em; margin: 4px 0; color: #666;"><em>Aucune cible dans la zone</em></div>`;

    let enhancedFlavor = `
        <div style="background: linear-gradient(135deg, #9932cc, #8a2be2); padding: 15px; border-radius: 10px; color: white; border: 2px solid #9932cc;">
            <h3 style="margin-top: 0; text-align: center; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">📚 ${SPELL_CONFIG.name}</h3>

            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>🧙 Lanceur:</strong> ${actor.name}</p>
                <p style="margin: 5px 0;"><strong>🎯 Zone:</strong> Cercle de ${SPELL_CONFIG.areaRadius} cases de rayon</p>
                <p style="margin: 5px 0;"><strong>🎭 Stance:</strong> ${stanceName} : ${actualManaCost} mana</p>
                ${targetSummary}
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>⚔️ Attaque (${SPELL_CONFIG.characteristicDisplay}):</strong> ${totalAttackDice}d7 + ${levelBonus}</p>`;

    if (areaTargets.length > 0) {
        enhancedFlavor += `<p style="margin: 5px 0; font-style: italic;">🛡️ Défense requise : Agilité des défenseurs</p>`;
    }

    enhancedFlavor += `</div>

            <div style="background: rgba(76,175,80,0.3); padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #4caf50;">`;

    if (damageResult.isMaximized) {
        enhancedFlavor += `<p style="margin: 5px 0;"><strong>💥 Dégâts (Stance Offensive - Maximisés):</strong> ${finalDamageResult.total}</p>
                          <p style="margin: 5px 0; font-style: italic;">Formule: ${finalDamageResult.formula}</p>`;
    } else {
        enhancedFlavor += `<p style="margin: 5px 0;"><strong>💥 Dégâts (si touche):</strong> ${finalDamageResult.total}</p>
                          <p style="margin: 5px 0; font-style: italic;">Formule: ${finalDamageResult.formula}</p>`;
    }

    enhancedFlavor += `<p style="margin: 5px 0; color: #fff700;"><strong>🛡️ Esquive partielle:</strong> ${finalDamageResult.halfDamage} dégâts (moitié)</p>`;

    enhancedFlavor += `</div>

            <div style="background: rgba(255,193,7,0.2); padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #ffc107;">
                <p style="margin: 5px 0;"><strong>📖 Tempête Littéraire:</strong> Niveau ${SPELL_CONFIG.spellLevel} - Zone d'effet</p>
                <p style="margin: 5px 0; font-size: 0.9em; color: #fff700;">⚠️ L'esquive ne permet d'éviter que la moitié des dégâts</p>
            </div>
        </div>`;

    // Send the unified dice roll message
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const manaCostInfo = currentStance === 'focus' ? ` - ${actualManaCost} mana (Demi-focalisable)` : ` - ${actualManaCost} mana`;
    const targetCount = areaTargets.length;

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} ${targetCount} cible${targetCount > 1 ? 's' : ''} dans la zone. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${manaCostInfo}. Esquive = moitié des dégâts.`);

    console.log(`[DEBUG] Tempête Littéraire cast complete - Caster: ${actor.name}, Targets: ${targetCount}, Damage: ${finalDamageResult.total}, Half Damage: ${finalDamageResult.halfDamage}`);

})();
