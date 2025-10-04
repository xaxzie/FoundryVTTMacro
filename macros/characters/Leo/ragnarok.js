/**
 * Ragnarok - Léo
 *
 * Sort ultime de Léo qui projette toutes les armes créées sur le terrain vers une cible unique.
 * Un véritable déluge d'armes magiques convergeant depuis toutes les directions.
 *
 * - Coût : 10 mana (demi-focalisable), niveau 3
 * - Caractéristique d'attaque : Volonté (+ effets actifs + bonus manuels)
 * - Dégâts : Nombre d'armes × 1d6 + Physique×2
 * - Effet spécial : Les bonus d'effet ne fonctionnent pas pour les dégâts
 * - Mécanique spéciale : La cible subit la moitié des dégâts si elle esquive (au lieu de rien)
 * - Cible : unique (Portal pour sélectionner la cible)
 *
 * Animations :
 * - Multiples projectiles d'armes depuis des directions aléatoires (360°)
 * - Distances aléatoires (2-4 cases du point d'impact)
 * - Délais aléatoires répartis sur 2 secondes
 * - Convergence spectaculaire vers la cible
 *
 * Usage : Sélectionner le token de Léo, lancer la macro et indiquer le nombre d'armes créées.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Ragnarok",
        characteristic: "volonte",
        characteristicDisplay: "Volonté",
        manaCost: 10,
        spellLevel: 3,
        damageFormula: "1d6", // Per weapon
        isDirect: true,
        isFocusable: false, // Demi-focalisable (not fully focusable)
        effectBonusExclusion: true, // No effect bonuses for damage
        halfDamageOnDodge: true, // Special mechanic

        animations: {
            cast: "jb2a.cast_generic.01.orange.0",
            weaponProjectiles: [
                "jb2a.sword.melee.01.white.4",
                "jb2a.dagger.melee.01.white.4",
                "jb2a.handaxe.melee.01.white.4",
                "jb2a.spear.melee.01.white.4",
                "jb2a.mace.melee.01.white.4"
            ],
            convergence: "jb2a.impact.ground_crack.orange.02",
            finalImpact: "jb2a.explosion.07.orange",
            sound: null
        },

        targeting: {
            range: 500,
            color: "#ff4500",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
        },

        weaponLimits: {
            min: 1,
            max: 20,
            animationDuration: 2000, // 2 seconds for all weapons
            minDistance: 2, // cases
            maxDistance: 4  // cases
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Veuillez d'abord sélectionner le token de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("⚠️ Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====
    function getCurrentStance(actor) {
        return actor.getFlag("world", "combatStance") || "normal";
    }

    // Active effect bonuses (only for attack, not damage due to spell restriction)
    function getActiveEffectBonus(actor, flagKey) {
        let total = 0;
        for (const effect of actor.effects) {
            if (effect.flags?.[flagKey]?.value) {
                total += effect.flags[flagKey].value;
            }
        }
        return total;
    }

    function getCharacteristicValue(actor, characteristic) {
        const baseValue = actor.system?.abilities?.[characteristic]?.value ||
                         actor.system?.[characteristic] || 0;

        // Detect injuries effect
        const injuryEffect = actor.effects.find(e => e.name === "Blessures");
        let injuryStacks = 0;
        if (injuryEffect?.flags?.statuscounter?.value) {
            injuryStacks = injuryEffect.flags.statuscounter.value;
        }

        const adjustedValue = Math.max(0, baseValue - injuryStacks);

        return {
            base: baseValue,
            injuries: injuryStacks,
            final: adjustedValue
        };
    }

    function calculateManaCost(baseCost, stance, isFocusable) {
        // Demi-focalisable: half cost in focus stance, not free
        if (stance === 'focus') return Math.ceil(baseCost / 2);
        return baseCost;
    }

    const currentStance = getCurrentStance(actor);
    const volonteInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const physiqueInfo = getCharacteristicValue(actor, "physique");
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);

    // ===== WEAPON COUNT DIALOG =====
    async function getWeaponCount() {
        const dialogContent = `
            <h3>⚔️ Ragnarok - Nombre d'Armes</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p><strong>Coût:</strong> ${actualManaCost} mana ${currentStance === 'focus' ? '(Demi-focalisable)' : ''}</p>
            <p><strong>Volonté:</strong> ${volonteInfo.final} | <strong>Physique:</strong> ${physiqueInfo.final}</p>

            <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                <p><strong>📜 Mécaniques spéciales :</strong></p>
                <ul>
                    <li>🎯 <strong>Esquive partielle :</strong> La cible subit la moitié des dégâts même si elle esquive</li>
                    <li>⚡ <strong>Bonus d'effet :</strong> N'affectent pas les dégâts (uniquement l'attaque)</li>
                    <li>💥 <strong>Dégâts :</strong> ${SPELL_CONFIG.damageFormula} par arme + Physique×2</li>
                </ul>
            </div>

            <div style="margin: 15px 0;">
                <label for="weaponCount"><strong>Nombre d'armes créées sur le terrain :</strong></label>
                <input type="number" id="weaponCount" name="weaponCount" value="5"
                       min="${SPELL_CONFIG.weaponLimits.min}" max="${SPELL_CONFIG.weaponLimits.max}"
                       style="width: 80px; margin-left: 10px;">
                <small>(${SPELL_CONFIG.weaponLimits.min}-${SPELL_CONFIG.weaponLimits.max} armes)</small>
            </div>
        `;

        return new Promise(resolve => {
            new Dialog({
                title: "⚔️ Ragnarok - Configuration",
                content: dialogContent,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-meteor"></i>',
                        label: "Déchaîner Ragnarok",
                        callback: (html) => {
                            const weaponCount = parseInt(html.find('#weaponCount').val()) || 5;
                            const clampedCount = Math.max(SPELL_CONFIG.weaponLimits.min,
                                                Math.min(SPELL_CONFIG.weaponLimits.max, weaponCount));
                            resolve({ weaponCount: clampedCount });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null)
            }).render(true);
        });
    }

    const weaponConfig = await getWeaponCount();
    if (!weaponConfig) {
        ui.notifications.info("ℹ️ Ragnarok annulé.");
        return;
    }

    const { weaponCount } = weaponConfig;

    // ===== CONFIGURATION DIALOG =====
    async function showConfigDialog() {
        const dialogContent = `
            <h3>⚔️ Ragnarok - Configuration d'Attaque</h3>
            <p><strong>Armes à projeter:</strong> ${weaponCount}</p>
            <p><strong>Dégâts estimés:</strong> ${weaponCount}d6 + ${physiqueInfo.final * 2} (${weaponCount * 3.5 + physiqueInfo.final * 2} en moyenne)</p>

            <div style="margin: 15px 0;">
                <label for="attackBonus">Bonus d'attaque manuel:</label>
                <input type="number" id="attackBonus" name="attackBonus" value="0" min="-10" max="10">
            </div>

            <div style="margin: 15px 0;">
                <label for="damageBonus">Bonus de dégâts manuel:</label>
                <input type="number" id="damageBonus" name="damageBonus" value="0" min="-10" max="20">
                <small>(Note: Les bonus d'effet sont exclus pour ce sort)</small>
            </div>
        `;

        return new Promise(resolve => {
            new Dialog({
                title: "⚔️ Ragnarok - Bonus Finaux",
                content: dialogContent,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirmer",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({ attackBonus, damageBonus });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null)
            }).render(true);
        });
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) {
        ui.notifications.info("ℹ️ Configuration annulée.");
        return;
    }

    const { attackBonus, damageBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        return new Portal()
            .color(SPELL_CONFIG.targeting.color)
            .texture(SPELL_CONFIG.targeting.texture)
            .pick();
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info("ℹ️ Ciblage annulé.");
        return;
    }

    // Find target actor
    function getActorAtLocation(x, y, tolerance = 50) {
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            const distance = Math.sqrt(Math.pow(x - token.center.x, 2) + Math.pow(y - token.center.y, 2));
            if (distance <= tolerance) return token;
        }
        return null;
    }

    const targetToken = getActorAtLocation(target.x, target.y);
    const targetName = targetToken ? targetToken.name : 'position';

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        // Multiple dice for weapons + flat bonus from Physique*2
        const weaponDamageFormula = `${weaponCount}d6`;
        const physiqueBonus = physiqueInfo.final * 2;
        const totalBonus = physiqueBonus + damageBonus;

        const fullFormula = totalBonus > 0 ?
            `${weaponDamageFormula} + ${totalBonus}` :
            weaponDamageFormula;

        const roll = new Roll(fullFormula);
        await roll.evaluate({ async: true });

        return {
            roll: roll,
            total: roll.total,
            formula: fullFormula,
            halfDamage: Math.floor(roll.total / 2)
        };
    }

    // ===== RAGNAROK ANIMATION =====
    async function playRagnarokAnimation() {
        const sequence = new Sequence();
        const gridSize = canvas.grid.size;

        // Cast effect on caster
        sequence
            .effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(1.2)
            .duration(1500);

        // Generate weapon launch positions and timings
        const weaponLaunches = [];
        for (let i = 0; i < weaponCount; i++) {
            // Random angle (360 degrees)
            const angle = Math.random() * 2 * Math.PI;

            // Random distance (2-4 cases)
            const distance = (SPELL_CONFIG.weaponLimits.minDistance +
                            Math.random() * (SPELL_CONFIG.weaponLimits.maxDistance - SPELL_CONFIG.weaponLimits.minDistance)) * gridSize;

            // Calculate launch position
            const launchX = target.x + Math.cos(angle) * distance;
            const launchY = target.y + Math.sin(angle) * distance;

            // Random timing within 2 seconds
            const delay = Math.random() * SPELL_CONFIG.weaponLimits.animationDuration;

            // Random weapon type
            const weaponAsset = SPELL_CONFIG.animations.weaponProjectiles[
                Math.floor(Math.random() * SPELL_CONFIG.animations.weaponProjectiles.length)
            ];

            weaponLaunches.push({
                weapon: weaponAsset,
                startX: launchX,
                startY: launchY,
                delay: delay,
                index: i
            });
        }

        // Sort by delay to ensure proper sequencing
        weaponLaunches.sort((a, b) => a.delay - b.delay);

        // Add each weapon projectile
        for (const launch of weaponLaunches) {
            sequence
                .effect()
                .file(launch.weapon)
                .atLocation({ x: launch.startX, y: launch.startY })
                .stretchTo(target)
                .scale(0.7)
                .delay(launch.delay)
                .duration(800)
                .waitUntilFinished(-600); // Overlap for dramatic effect
        }

        // Convergence effect at target
        sequence
            .effect()
            .file(SPELL_CONFIG.animations.convergence)
            .atLocation(target)
            .scale(1.5)
            .duration(1000)
            .delay(SPELL_CONFIG.weaponLimits.animationDuration);

        // Final massive impact
        sequence
            .effect()
            .file(SPELL_CONFIG.animations.finalImpact)
            .atLocation(target)
            .scale(2.0)
            .duration(2000)
            .delay(SPELL_CONFIG.weaponLimits.animationDuration + 500);

        return sequence.play();
    }

    const damageResult = await calculateDamage();
    await playRagnarokAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = volonteInfo.final + attackBonus;
    const attackEffectBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const finalAttackDice = totalAttackDice + attackEffectBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula
    let combinedRollParts = [`${finalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll (only if not maximized)
    if (currentStance !== 'offensif') {
        combinedRollParts.push(damageResult.formula);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        const damageRollResult = combinedRoll.terms[0].results[1];
        finalDamageResult = {
            total: damageRollResult.result,
            formula: damageRollResult.expression,
            result: damageRollResult.result,
            halfDamage: Math.floor(damageRollResult.result / 2)
        };
    } else {
        // Recalculate half damage for offensive stance
        finalDamageResult.halfDamage = Math.floor(finalDamageResult.total / 2);
    }

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceText = currentStance === 'offensif' ? ' (Position Offensive - Dégâts maximisés)' : '';

        return `
            <div style="border: 3px solid #ff4500; border-radius: 15px; padding: 20px; background: linear-gradient(135deg, #2c1810, #8b0000); color: #ffffff;">
                <h3 style="margin-top: 0; color: #ff6347; text-shadow: 2px 2px 4px #000000;">
                    ⚔️ <strong>RAGNAROK</strong> ⚔️
                </h3>

                <div style="margin: 15px 0; padding: 10px; background: rgba(255, 69, 0, 0.2); border-radius: 8px;">
                    <p><strong>🧙‍♂️ Invocateur:</strong> ${actor.name}</p>
                    <p><strong>🎯 Cible:</strong> ${targetName}</p>
                    <p><strong>⚔️ Armes projetées:</strong> ${weaponCount}</p>
                    <p><strong>💫 Coût:</strong> ${actualManaCost} mana ${currentStance === 'focus' ? '(Demi-focalisable)' : ''}</p>
                    <p><strong>🎲 Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${volonteInfo.final} + ${attackEffectBonus} effets)</p>
                </div>

                <div style="margin: 15px 0; padding: 15px; background: rgba(139, 0, 0, 0.3); border-radius: 8px; border: 2px solid #ff4500;">
                    <h4 style="color: #ff6347; margin-top: 0; text-shadow: 1px 1px 2px #000000;">💥 RÉSULTATS DE L'APOCALYPSE</h4>
                    <p><strong>⚔️ Attaque:</strong> ${attackResult.result} (${finalAttackDice}d7 + ${levelBonus})</p>
                    <p><strong>💀 Dégâts totaux:</strong> ${finalDamageResult.total}${stanceText}</p>
                    <p><strong>🛡️ Dégâts si esquive:</strong> ${finalDamageResult.halfDamage} (La cible subit la moitié même en esquivant !)</p>

                    <div style="margin: 10px 0; padding: 8px; background: rgba(255, 215, 0, 0.1); border-radius: 5px;">
                        <strong>⚡ Mécaniques spéciales :</strong>
                        <br>• ${weaponCount} armes convergent depuis toutes les directions
                        <br>• Esquive = dégâts réduits de moitié (au lieu d'annulés)
                        <br>• Bonus d'effet exclus des dégâts (Volonté uniquement pour l'attaque)
                    </div>
                </div>

                <div style="margin-top: 15px; padding: 10px; background: rgba(0, 0, 0, 0.4); border-radius: 5px; font-size: 0.9em;">
                    <strong>🌟 Sort Ultime:</strong> Ragnarok - Déluge d'armes magiques
                    <br><strong>🕒 Déchaîné:</strong> ${new Date().toLocaleString()}
                    <br><strong>💥 Formule:</strong> ${weaponCount}d6 + Physique×2 + bonus manuels
                </div>
            </div>
        `;
    }

    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: createChatFlavor(),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        rollMode: game.settings.get("core", "rollMode")
    });

    console.log("[RAGNAROK] Ultimate spell completed:", {
        caster: actor.name,
        target: targetName,
        weaponCount: weaponCount,
        attack: attackResult.result,
        damage: finalDamageResult.total,
        halfDamage: finalDamageResult.halfDamage,
        manaCost: actualManaCost
    });

})();
