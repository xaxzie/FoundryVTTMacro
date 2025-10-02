/**
 * Leo's Steel Lance - Line Attack Spell
 *
 * Description: Leo creates a steel lance that pierces through enemies in a direction,
 * hitting all targets in a line 1 case wide. Can be enhanced with electricity.
 *
 * - Line attack piercing through multiple targets
 * - Uses Physical characteristic for attack resolution
 * - Standard: 1 case wide line, 2 mana cost
 * - Electric version: 5 cases wide line, 5 mana cost
 * - Damage: 1d4 + Physical + bonuses
 * - Cannot benefit from "Serpent" effect
 *
 * Cost: 2 mana (focusable, standard) / 5 mana (focusable, electric)
 * Level: 1
 * Type: Direct physical/electric attack
 *
 * Prerequisites:
 * - Sequencer module
 * - JB2A effects
 * - Portal module for targeting
 * - Character stats configured via Admin Tool
 *
 * Usage: Select Leo's token and run this macro
 */

(async () => {
    // ===== SPELL CONFIGURATION =====
    const SPELL_VARIANTS = {
        standard: {
            name: "Lance d'Acier",
            description: "Lance d'acier qui transperce les ennemis sur une ligne de 1 case de large",
            manaCost: 2,
            lineWidth: 1, // 1 case wide
            damageType: "physique",
            element: "steel",
            animations: {
                lance: "jb2a_patreon.javelin.throw", // Steel lance projectile
                impact: "jb2a.impact.010.orange", // Steel impact
                sound: null
            },
            targeting: {
                color: "#c0c0c0", // Steel silver
                texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            }
        },
        electric: {
            name: "Lance d'Acier Électrique",
            description: "Lance d'acier électrifiée qui touche aussi les cibles adjacentes (5 cases de large)",
            manaCost: 5,
            lineWidth: 5, // 5 cases wide (2 on each side + center)
            damageType: "électrique",
            element: "electric",
            // Keep the same javelin projectile as the standard version, but add
            // a chain-lightning overlay to visually show the wider electric area.
            animations: {
                // Primary projectile (same as standard)
                lance: "jb2a_patreon.javelin.throw",
                // Extra stretched overlay to show the electric width
                extraLance: "jb2a_patreon.chain_lightning.primary.red",
                impact: "animated-spell-effects-cartoon.electricity.18", // Electric impact
                sound: null
            },
            targeting: {
                color: "#00ffff", // Electric cyan
                texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            }
        }
    };

    const BASE_CONFIG = {
        characteristic: "physique",
        characteristicDisplay: "Physique",
        spellLevel: 1,
        damageFormula: "1d4",
        isDirect: true,
        isFocusable: true,
        serpentExclusion: true, // Special: Serpent effect doesn't work
        maxRange: 600 // Maximum range for the line
    };

    // ===== BASIC VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Leo !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====
    // Stance detection
    function getCurrentStance(actor) {
        const stance = actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
        console.log(`[DEBUG] Current stance detected: ${stance || 'No stance'}`);
        return stance;
    }

    // Active effect bonuses (excludes Serpent if spell has serpentExclusion)
    function getActiveEffectBonus(actor, flagKey, excludeSerpent = false) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            // Skip Serpent effect if excluded
            if (excludeSerpent && effect.name?.toLowerCase() === 'serpent') {
                console.log(`[DEBUG] Excluding Serpent effect from ${flagKey} bonus`);
                continue;
            }

            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey} (total: ${totalBonus})`);
            }
        }
        return totalBonus;
    }

    // Character stats with injury adjustment
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        console.log(`[DEBUG] ${characteristic}: base=${baseValue}, injuries=${injuryStacks}, effects=${effectBonus}, final=${finalValue}`);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    // Mana cost calculation with stance
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
                title: "Lance d'Acier - Sélection de Variante",
                content: `
                    <div style="margin: 10px 0;">
                        <h3>Choisissez la variante du sort :</h3>
                        <div style="margin: 10px 0; padding: 10px; border: 2px solid #c0c0c0; background: #f5f5f5;">
                            <h4>🔸 Lance d'Acier Standard</h4>
                            <p><strong>Coût :</strong> ${calculateManaCost(SPELL_VARIANTS.standard.manaCost, currentStance, BASE_CONFIG.isFocusable)} mana${currentStance === 'focus' ? ' (Gratuit en Focus)' : ''}</p>
                            <p><strong>Zone :</strong> Ligne de 1 case de large</p>
                            <p><em>${SPELL_VARIANTS.standard.description}</em></p>
                        </div>
                        <div style="margin: 10px 0; padding: 10px; border: 2px solid #00ffff; background: #f0f8ff;">
                            <h4>⚡ Lance d'Acier Électrique</h4>
                            <p><strong>Coût :</strong> ${calculateManaCost(SPELL_VARIANTS.electric.manaCost, currentStance, BASE_CONFIG.isFocusable)} mana${currentStance === 'focus' ? ' (Gratuit en Focus)' : ''}</p>
                            <p><strong>Zone :</strong> Ligne de 5 cases de large (2 de chaque côté)</p>
                            <p><em>${SPELL_VARIANTS.electric.description}</em></p>
                        </div>
                    </div>
                `,
                buttons: {
                    standard: {
                        label: "🔸 Standard",
                        callback: () => resolve('standard')
                    },
                    electric: {
                        label: "⚡ Électrique",
                        callback: () => resolve('electric')
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                }
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
        const effectDamageBonus = getActiveEffectBonus(actor, "damage", spellConfig.serpentExclusion);
        const manaCostInfo = actualManaCost === 0 ?
            `<strong>Coût en Mana :</strong> Gratuit <em>(Position Focus)</em>` :
            `<strong>Coût en Mana :</strong> ${actualManaCost} mana`;

        let damageInfo;
        const damageBonus = effectDamageBonus !== 0 ? ` <em>(+${effectDamageBonus} bonus d'effets${spellConfig.serpentExclusion ? ', Serpent exclu' : ''})</em>` : '';
        if (currentStance === 'offensif') {
            damageInfo = `Dégâts : <strong>${spellConfig.damageFormula} + ${spellConfig.characteristicDisplay} (MAXIMISÉ en Position Offensive)</strong>${damageBonus}`;
        } else {
            damageInfo = `Dégâts : <strong>${spellConfig.damageFormula} + ${spellConfig.characteristicDisplay}</strong>${damageBonus}`;
        }

        return new Promise((resolve) => {
            new Dialog({
                title: `${spellConfig.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>${spellConfig.name} :</h3>
                    <p>${manaCostInfo}</p>
                    <p><strong>Caractéristique ${spellConfig.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #fffbf0;">
                        <h4>Description</h4>
                        <p><em>${spellConfig.description}</em></p>
                        ${spellConfig.serpentExclusion ? '<p style="color: #d32f2f;"><strong>⚠️ Effet spécial :</strong> L\'effet "Serpent" ne fonctionne pas avec ce sort</p>' : ''}
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
                    <p><strong>Zone d'effet :</strong> Ligne de ${spellConfig.lineWidth} case${spellConfig.lineWidth > 1 ? 's' : ''} de large</p>

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
                        label: `${selectedVariant === 'electric' ? '⚡' : '🔸'} Lancer la Lance !`,
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

    // ===== PORTAL TARGETING - SELECT DIRECTION =====
    async function selectDirection() {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(spellConfig.maxRange)
                .color(spellConfig.targeting.color)
                .texture(spellConfig.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const targetPoint = await selectDirection();
    if (!targetPoint) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    // ===== LINE CALCULATION AND TARGET DETECTION =====
    function calculateLineTargets(origin, target, lineWidth) {
        const startX = origin.x + (origin.document.width * canvas.grid.size) / 2;
        const startY = origin.y + (origin.document.height * canvas.grid.size) / 2;
        const endX = target.x;
        const endY = target.y;

        // Calculate line direction
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / distance;
        const dirY = dy / distance;

        // Perpendicular direction for line width
        const perpX = -dirY;
        const perpY = dirX;

        const gridSize = canvas.grid.size;
        const halfWidth = Math.floor(lineWidth / 2);
        const targets = [];

        // Check each point along the line
        for (let dist = 0; dist <= distance; dist += gridSize / 2) {
            const centerX = startX + dirX * dist;
            const centerY = startY + dirY * dist;

            // Check each position across the line width
            for (let w = -halfWidth; w <= halfWidth; w++) {
                const checkX = centerX + perpX * w * gridSize;
                const checkY = centerY + perpY * w * gridSize;

                // Find tokens at this position
                const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                    if (token === origin) return false; // Don't hit the caster

                    const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                    const tokenCenterY = token.y + (token.document.height * gridSize) / 2;

                    const tokenDistance = Math.sqrt(
                        Math.pow(tokenCenterX - checkX, 2) + Math.pow(tokenCenterY - checkY, 2)
                    );

                    return tokenDistance <= gridSize * 0.7; // Tolerance
                });

                // Add unique targets
                tokensAtLocation.forEach(token => {
                    if (!targets.find(t => t.token.id === token.id)) {
                        const targetActor = token.actor;
                        if (targetActor) {
                            const isOwner = targetActor.isOwner;
                            const isVisible = token.visible;
                            const isGM = game.user.isGM;

                            targets.push({
                                name: (isOwner || isVisible || isGM) ? targetActor.name : "cible",
                                token: token,
                                actor: targetActor,
                                position: { x: checkX, y: checkY }
                            });
                        }
                    }
                });
            }
        }

        return targets;
    }

    const lineTargets = calculateLineTargets(caster, targetPoint, spellConfig.lineWidth);

    console.log(`[DEBUG] Line targets found: ${lineTargets.length}`);
    lineTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name} at (${Math.round(target.position.x)}, ${Math.round(target.position.y)})`);
    });

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage", spellConfig.serpentExclusion);
        const totalDamageBonus = characteristicInfo.final + damageBonus + effectDamageBonus;

        if (currentStance === 'offensif') {
            const diceMax = 4; // 1d4 maximized
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

        // Lance projectile from caster to target point
        if (spellConfig.animations.lance) {
            // Primary projectile (javelin) for both variants
            sequence.effect()
                .file(spellConfig.animations.lance)
                .atLocation(caster)
                .stretchTo(targetPoint)
                .scale(selectedVariant === 'electric' ? 1.2 : 1.5)
                .waitUntilFinished(-2000);


            // If the variant provides an extra lance (electric), play it as a
            // stretched overlay and make it wider to represent +2 cases each side.
            const extra = spellConfig.animations.extraLance;
            if (selectedVariant === 'electric' && extra) {
                // Compute a scale multiplier so the chain lightning covers the
                // spell's line width plus 4 extra cells (2 each side).
                const extraCases = 4; // 2 each side
                const baseCases = Math.max(1, spellConfig.lineWidth);
                const widthMultiplier = (baseCases + extraCases) / baseCases;
                const baseScale = 1.2; // baseline electric scale used previously
                const chainWidthScale = baseScale * widthMultiplier * 2;

                sequence.effect()
                    .file(extra)
                    .atLocation(caster)
                    .stretchTo(targetPoint)
                    .scale({ x: baseScale , y: chainWidthScale }) // Only scale width, keep original height
                    .delay(150) // slight delay so projectile is visible first
                    .waitUntilFinished(-300);
            }
        }

        // Impact effects on each target
        if (spellConfig.animations.impact && lineTargets.length > 0) {
            lineTargets.forEach((target, index) => {
                const impactEffect = sequence.effect()
                    .file(spellConfig.animations.impact)
                    .atLocation(target.position)
                    .scale(0.6)
                    .delay(index * 100); // Stagger impacts

                // If electric variant, tint the impact red
                if (selectedVariant === 'electric') {
                    impactEffect.tint('#ff5050');
                    impactEffect.scale(0.4)
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
        const effectDamageBonus = getActiveEffectBonus(actor, "damage", spellConfig.serpentExclusion);
        const totalDamageBonus = characteristicInfo.final + damageBonus + effectDamageBonus;
        combinedRollParts.push(`${spellConfig.damageFormula} + ${totalDamageBonus}`);
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
            result: damageRollResult.result
        };
    }

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? '0 mana (Focus)' : `${actualManaCost} mana`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectDamageBonus = getActiveEffectBonus(actor, "damage", spellConfig.serpentExclusion);
        const effectInfo = (characteristicInfo.effectBonus !== 0 || effectDamageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${characteristicInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${spellConfig.characteristicDisplay}: +${characteristicInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 ? `<div>${selectedVariant === 'electric' ? '⚡' : '🔸'} Bonus de Dégâts: +${effectDamageBonus}${spellConfig.serpentExclusion ? ' (Serpent exclu)' : ''}</div>` : ''}
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
        const targetSummary = lineTargets.length > 0 ?
            `<div style="font-size: 0.9em; margin: 4px 0;"><strong>Cibles touchées (${lineTargets.length}):</strong> ${lineTargets.map(t => t.name).join(', ')}</div>` :
            `<div style="font-size: 0.9em; margin: 4px 0; color: #666;"><em>Aucune cible dans la ligne</em></div>`;

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${selectedVariant === 'electric' ? '#e3f2fd' : '#f5f5f5'}; border-radius: 4px;">
                <div style="font-size: 1.1em; color: ${selectedVariant === 'electric' ? '#1565c0' : '#424242'}; margin-bottom: 6px;"><strong>${selectedVariant === 'electric' ? '⚡' : '🔸'} ${spellConfig.name}${stanceNote}</strong></div>
                ${targetSummary}
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${spellConfig.damageFormula} + Physique + bonus)</div>
                <div style="font-size: 0.8em; color: #666;">Ligne de ${spellConfig.lineWidth} case${spellConfig.lineWidth > 1 ? 's' : ''} de large</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, ${selectedVariant === 'electric' ? '#e3f2fd, #fff8e1' : '#f5f5f5, #fff8e1'}); padding: 12px; border-radius: 8px; border: 2px solid ${selectedVariant === 'electric' ? '#00ffff' : '#c0c0c0'}; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: ${selectedVariant === 'electric' ? '#1565c0' : '#424242'};">${selectedVariant === 'electric' ? '⚡' : '🔸'} ${spellConfig.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Guerrier:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${damageDisplay}
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
    const targetCount = lineTargets.length;

    ui.notifications.info(`${selectedVariant === 'electric' ? '⚡' : '🔸'} ${spellConfig.name} lancée !${stanceInfo} ${targetCount} cible${targetCount > 1 ? 's' : ''} touchée${targetCount > 1 ? 's' : ''}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${maximizedInfo}.`);

})();
