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
            cast: "jb2a_patreon.divine_smite.caster.dark_red",
            portal: "jb2a.misty_step.02.blue",
            weaponProjectiles: [
                "jb2a_patreon.javelin.throw",
                "jb2a_patreon.dagger.throw.02.white",
                "jb2a_patreon.greatsword.throw",
                "jb2a_patreon.kunai.throw.01",
                "jb2a.throwable.launch.missile.01.blue"
            ],
            convergence: "jb2a.ground_cracks.orange.02",
            finalImpact: "jb2a_patreon.explosion.orange.1",
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
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    // Active effect bonuses (Ragnarok excludes ALL effect bonuses due to spell restriction)
    function getActiveEffectBonus(actor, flagKey) {
        // Ragnarok excludes all effect bonuses except stance effects
        console.log(`[DEBUG] Ragnarok excludes all effect bonuses for ${flagKey}`);
        return 0;
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
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                // Get token's grid position (top-left corner)
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Check if any grid square occupied by the token matches the target grid square
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        if (tokenSquareX === targetGridX && tokenSquareY === targetGridY) {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (tokensAtLocation.length === 0) return null;
            return tokensAtLocation[0];
        } else {
            // No grid: use circular tolerance detection (original behavior with visibility check)
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                if (!token.actor) return false;
                const distance = Math.sqrt(Math.pow(x - token.center.x, 2) + Math.pow(y - token.center.y, 2));
                return distance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;
            return tokensAtLocation[0];
        }
    }

    const targetToken = getActorAtLocation(target.x, target.y);
    const targetName = targetToken ? targetToken.name : 'position';

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        // Multiple dice for weapons + flat bonus from Physique*2
        const physiqueBonus = physiqueInfo.final * 2;
        const totalBonus = physiqueBonus + damageBonus;

        if (currentStance === 'offensif') {
            // Offensive stance: damage is maximized
            const diceMax = weaponCount * 6; // Each d6 maximized to 6
            const maxDamage = diceMax + totalBonus;

            console.log(`[DEBUG] Maximized damage: ${maxDamage} (${diceMax} + ${totalBonus})`);

            return {
                total: maxDamage,
                formula: `${diceMax} + ${totalBonus}`,
                result: maxDamage,
                halfDamage: Math.floor(maxDamage / 2),
                isMaximized: true
            };
        } else {
            // Normal dice rolling
            const weaponDamageFormula = `${weaponCount}d6`;
            const fullFormula = totalBonus > 0 ?
                `${weaponDamageFormula} + ${totalBonus}` :
                weaponDamageFormula;

            const damage = new Roll(fullFormula);
            await damage.evaluate({ async: true });

            console.log(`[DEBUG] Rolled damage: ${damage.total} (formula: ${damage.formula})`);

            return {
                roll: damage,
                total: damage.total,
                formula: fullFormula,
                halfDamage: Math.floor(damage.total / 2)
            };
        }
    }

    // ===== RAGNAROK ANIMATION =====
    async function playRagnarokAnimation() {
        const sequence = new Sequence();
        const gridSize = canvas.grid.size;

        // Cast effect on caster - starts immediately
        sequence
            .effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(1.2)

        // Generate weapon launch positions
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

            // Random weapon type
            const weaponAsset = SPELL_CONFIG.animations.weaponProjectiles[
                Math.floor(Math.random() * SPELL_CONFIG.animations.weaponProjectiles.length)
            ];

            weaponLaunches.push({
                weapon: weaponAsset,
                startX: launchX,
                startY: launchY,
                index: i
            });
        }

        // All weapon projectiles start after 3 seconds, with small random delays between them
        let cumulativeDelay = 3000; // Start after 3 seconds
        for (let i = 0; i < weaponLaunches.length; i++) {
            const launch = weaponLaunches[i];

            // Add random delay between 20ms and 100ms for each weapon after the first
            if (i > 0) {
                cumulativeDelay += Math.random() * 80 + 20; // 20-100ms
            }

            // Portal opening at launch position (starts slightly before the projectile)
            sequence
                .effect()
                .file(SPELL_CONFIG.animations.portal)
                .atLocation({ x: launch.startX, y: launch.startY })
                .scale(0.8)
                .delay(cumulativeDelay - 200) // Portal opens 200ms before projectile launch
                .duration(1000)
                .fadeOut(300)

            // Weapon projectile coming through the portal
            sequence
                .effect()
                .file(launch.weapon)
                .atLocation({ x: launch.startX, y: launch.startY })
                .stretchTo(target)
                .scale(1)
                .delay(cumulativeDelay)
        }

        // Convergence effect at target - starts after all weapons are launched
        const convergenceDelay = cumulativeDelay + 1000; // A bit after the last weapon
        sequence
            .effect()
            .file(SPELL_CONFIG.animations.convergence)
            .belowTokens()
            .atLocation(target)
            .scale(0.5)
            .delay(convergenceDelay)

        // Final massive impact - after convergence
        sequence
            .effect()
            .file(SPELL_CONFIG.animations.finalImpact)
            .atLocation(target)
            .scale(1.0)
            .delay(convergenceDelay)

        return sequence.play();
    }

    const damageResult = await calculateDamage();
    await playRagnarokAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = volonteInfo.final + attackBonus;
    const attackEffectBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic); // Always 0 for Ragnarok
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
        const damageFormulaString = combinedRollParts[1] ?? damageResult.formula;
        finalDamageResult = {
            total: damageRollResult?.result ?? damageRollResult?.total ?? damageResult.total,
            formula: damageFormulaString,
            result: damageRollResult?.result ?? damageRollResult?.total ?? damageResult.total,
            halfDamage: Math.floor((damageRollResult?.result ?? damageRollResult?.total ?? damageResult.total) / 2)
        };
    }

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceText = currentStance === 'offensif' ? ' (Position Offensive - Dégâts maximisés)' : '';

        const injuryInfo = (volonteInfo.injuries > 0 || physiqueInfo.injuries > 0) ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Volonté ${volonteInfo.base} - ${volonteInfo.injuries} = ${volonteInfo.injuryAdjusted}${physiqueInfo.injuries > 0 ? `, Physique ${physiqueInfo.base} - ${physiqueInfo.injuries} = ${physiqueInfo.injuryAdjusted}` : ''}</i>
            </div>` : '';

        const effectInfo = `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <div>🚫 <strong>Tous les bonus d'effets sont exclus par Ragnarok</strong></div>
                <div><em>Seules les positions de combat (Focus/Offensif/Défensif) fonctionnent</em></div>
            </div>`;

        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` : '';

        return `
            <div style="border: 3px solid #ff4500; border-radius: 15px; padding: 20px; background: linear-gradient(135deg, #2c1810, #8b0000); color: #ffffff;">
                <h3 style="margin-top: 0; color: #ff6347; text-shadow: 2px 2px 4px #000000;">
                    ⚔️ <strong>RAGNAROK</strong> ⚔️
                </h3>

                <div style="margin: 15px 0; padding: 10px; background: rgba(255, 69, 0, 0.2); border-radius: 8px;">
                    <p><strong>🧙‍♂️ Invocateur:</strong> ${actor.name}${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}</p>
                    <p><strong>🎯 Cible:</strong> ${targetName}</p>
                    <p><strong>⚔️ Armes projetées:</strong> ${weaponCount}</p>
                    <p><strong>💫 Coût:</strong> ${actualManaCost} mana ${currentStance === 'focus' ? '(Demi-focalisable)' : ''}</p>
                    <p><strong>🎲 Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${volonteInfo.final} + ${attackEffectBonus} effets)</p>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}

                <div style="margin: 15px 0; padding: 15px; background: rgba(139, 0, 0, 0.3); border-radius: 8px; border: 2px solid #ff4500;">
                    <h4 style="color: #ff6347; margin-top: 0; text-shadow: 1px 1px 2px #000000;">💥 RÉSULTATS DE L'APOCALYPSE</h4>
                    <p><strong>⚔️ Attaque:</strong> ${attackResult.result} (${finalAttackDice}d7 + ${levelBonus})</p>
                    <p><strong>💀 Dégâts totaux:</strong> ${finalDamageResult.total}${stanceText}</p>
                    <p><strong>🛡️ Dégâts si esquive:</strong> ${finalDamageResult.halfDamage} (La cible subit la moitié même en esquivant !)</p>

                    <div style="margin: 10px 0; padding: 8px; background: rgba(255, 215, 0, 0.1); border-radius: 5px;">
                        <strong>⚡ Mécaniques spéciales :</strong>
                        <br>• ${weaponCount} armes convergent depuis toutes les directions
                        <br>• Esquive = dégâts réduits de moitié (au lieu d'annulés)
                        <br>• <strong>TOUS les bonus d'effets sont exclus</strong> (seules les positions de combat fonctionnent)
                    </div>
                </div>

                <div style="margin-top: 15px; padding: 10px; background: rgba(0, 0, 0, 0.4); border-radius: 5px; font-size: 0.9em;">
                    <strong>🌟 Sort Ultime:</strong> Ragnarok - Déluge d'armes magiques
                    <br><strong>💥 Formule:</strong> ${weaponCount}d6 + Physique×2 + bonus manuels
                </div>
            </div>
        `;
    }

    // Send the combined roll to chat with visual dice
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
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
