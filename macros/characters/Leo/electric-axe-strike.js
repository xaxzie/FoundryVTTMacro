/**
 * Leo's Electric Axe Strike - Enhanced Weapon Attack
 *
 * Description: Leo channels electricity through his great axe, enhancing his strike
 * with crackling electrical energy for devastating damage.
 *
 * - Single target melee attack
 * - Uses Physical characteristic for attack resolution
 * - Enhanced damage: 1d9 + 4 + Physical + bonuses
 * - Cannot be cast for free in Focus stance (unfocusable)
 * - Direct spell: benefits from damage bonuses from active effects
 *
 * Cost: 1 mana (always, regardless of stance)
 * Level: 1
 * Type: Direct physical attack
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
    const SPELL_CONFIG = {
        name: "Frappe Électrique", // Spell name
        characteristic: "physique", // Uses Physical characteristic
        characteristicDisplay: "Physique", // Display name
        manaCost: 1, // Fixed mana cost
        spellLevel: 1, // Level 1 spell
        damageFormula: "1d9", // Base damage dice
        fixedDamageBonus: 4, // Fixed +4 damage bonus
        isDirect: true, // Direct spell - gets damage bonuses from effects
        isFocusable: false, // Cannot be cast for free in Focus stance

        // Animation configuration - Electric/Steel theme
        animations: {
            cast: "jb2a.lightning_ball.blue", // Electric casting
            weapon: "jb2a_patreon.greataxe.melee.fire.red", // Weapon enhancement
            impact: "jb2a.lightning_strike.blue", // Electric impact
            sound: null, // Optional sound effect

            // Aftermath / ground effect shown after the impact. Configurable so you can
            // change file, scale, tint and timing from the top of the macro.
            aftermath: {
                file: "jb2a_patreon.ground_cracks.orange.03",
                scale: 0.4,
                belowTokens: true,
                // Simple tint (hex string or number) applied via Sequencer's .tint()
                // If you want more control use a ColorMatrix filter, but tint is faster and
                // more predictable for shifting orange -> red.
                tint: "#ff3333",
                fadeIn: 500,
                fadeOut: 10000,
                duration: 12000
            }
        },

        // Targeting configuration
        targeting: {
            range: 80, // Melee range (close combat)
            color: "#ffff00", // Electric yellow
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Yellow_400x400.webm"
        }
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

    // ===== STANCE DETECTION UTILITY =====
    function getCurrentStance(actor) {
        const stance = actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;

        console.log(`[DEBUG] Current stance detected: ${stance || 'No stance'}`);
        return stance;
    }

    const currentStance = getCurrentStance(actor);

    // ===== ACTIVE EFFECT HELPER FUNCTIONS =====
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

    // ===== CHARACTER STATS UTILITY =====
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

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        // Get damage bonuses for display
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");

        // Calculate mana costs - always fixed cost for Leo's spell
        const manaCostInfo = `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana <em>(Non focalisable)</em>`;

        // Stance-specific damage info
        let damageInfo;
        const damageBonus = effectDamageBonus !== 0 ? ` <em>(+${effectDamageBonus} bonus d'effets)</em>` : '';
        if (currentStance === 'offensif') {
            damageInfo = `Dégâts : <strong>${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.fixedDamageBonus} + ${SPELL_CONFIG.characteristicDisplay} (MAXIMISÉ en Position Offensive)</strong>${damageBonus}`;
        } else {
            damageInfo = `Dégâts : <strong>${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.fixedDamageBonus} + ${SPELL_CONFIG.characteristicDisplay}</strong>${damageBonus}`;
        }

        return new Promise((resolve) => {
            new Dialog({
                title: `${SPELL_CONFIG.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>Frappe Électrique de Leo :</h3>
                    <p>${manaCostInfo}</p>
                    <p><strong>Caractéristique ${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #fffbf0;">
                        <h4>Description</h4>
                        <p><em>Leo charge son imposante hache de guerre d'électricité crépitante, amplifiant la puissance de sa frappe. L'énergie électrique court le long de la lame d'acier, prête à décharger toute sa puissance sur l'ennemi.</em></p>
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
                    <p><strong>Jet d'attaque :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${SPELL_CONFIG.spellLevel * 2}</span></p>

                    <script>
                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const bonus = parseInt(this.value) || 0;
                            const total = base + bonus;
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${SPELL_CONFIG.spellLevel * 2}';
                        });
                    </script>
                `,
                buttons: {
                    confirm: {
                        label: "⚡ Charger la Hache !",
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

    const spellConfig = await showSpellConfigDialog();
    if (!spellConfig) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    const { damageBonus, attackBonus } = spellConfig;

    // ===== PORTAL TARGETING UTILITY =====
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
        ui.notifications.info("Sort annulé.");
        return;
    }

    // ===== ACTOR DETECTION UTILITY =====
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(targetX / gridSize);
            const targetGridY = Math.floor(targetY / gridSize);

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

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection (original behavior)
            const tolerance = gridSize;
            console.log(`[DEBUG] Tolérance de détection: ${tolerance}`);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const tokenDistance = Math.sqrt(
                    Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
                );
                return tokenDistance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : "position";

    // ===== DAMAGE CALCULATION UTILITY =====
    async function calculateDamage() {
        // Calculate total damage bonus: fixed + characteristic + manual + effects
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalDamageBonus = SPELL_CONFIG.fixedDamageBonus + characteristicInfo.final + damageBonus + effectDamageBonus;

        if (currentStance === 'offensif') {
            // Offensive stance: damage is maximized
            const diceMax = 9; // 1d9 maximized
            const maxDamage = diceMax + totalDamageBonus;

            console.log(`[DEBUG] Maximized damage: ${maxDamage} (${diceMax} + ${totalDamageBonus}: fixed+${SPELL_CONFIG.fixedDamageBonus} + physique+${characteristicInfo.final} + manual+${damageBonus} + effects+${effectDamageBonus})`);

            return {
                total: maxDamage,
                formula: `${diceMax} + ${totalDamageBonus}`,
                result: `${diceMax} + ${totalDamageBonus}`,
                isMaximized: true
            };
        } else {
            // Normal dice rolling
            const damage = new Roll(`${SPELL_CONFIG.damageFormula} + @totalBonus`, { totalBonus: totalDamageBonus });
            await damage.evaluate({ async: true });

            console.log(`[DEBUG] Rolled damage: ${damage.total} (formula: ${damage.formula}, total bonus: ${totalDamageBonus} = fixed+${SPELL_CONFIG.fixedDamageBonus} + physique+${characteristicInfo.final} + manual+${damageBonus} + effects+${effectDamageBonus})`);

            return damage;
        }
    }

    const damageResult = await calculateDamage();

    // ===== SEQUENCER EFFECTS =====
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Weapon charging effect on caster - low opacity, below token
        if (SPELL_CONFIG.animations.cast) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.cast)
                .atLocation(caster)
                .scale(0.7)
                .opacity(0.3)
                .belowTokens()
                .duration(1500);
        }

        // Weapon enhancement effect - attached to caster and stretching to target
        if (SPELL_CONFIG.animations.weapon) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.weapon)
                .attachTo(caster)
                .stretchTo(target)
                .scale(0.84) // 30% smaller: 1.2 * 0.7 = 0.84
                .delay(200)
                .waitUntilFinished(-1000); // Wait until 300ms before the weapon animation ends
        }

        // Electric strike at target - triggers automatically after weapon animation
        if (SPELL_CONFIG.animations.impact) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.impact)
                .atLocation(target)
                .scale(1.0);
        }

        // Aftermath / ground effect (configurable)
        const aftermath = SPELL_CONFIG.animations?.aftermath;
        if (aftermath) {
            const file = aftermath.file || "jb2a_patreon.ground_cracks.orange.03";
            const scale = typeof aftermath.scale === 'number' ? aftermath.scale : 0.8;
            const fadeIn = typeof aftermath.fadeIn === 'number' ? aftermath.fadeIn : 500;
            const fadeOut = typeof aftermath.fadeOut === 'number' ? aftermath.fadeOut : 10000;
            const duration = typeof aftermath.duration === 'number' ? aftermath.duration : (fadeIn + fadeOut + 1500);

            let afterEffect = sequence.effect()
                .file(file)
                .atLocation(target)
                .scale(scale)
                .fadeIn(fadeIn)
                .fadeOut(fadeOut)
                .duration(duration);

            if (aftermath.belowTokens) afterEffect.belowTokens();
            // Apply a simple tint if provided (accepts hex string like "#ff3333" or numeric 0xff3333)
            afterEffect.tint(aftermath.tint);
        }

        // Sound effect (if configured)
        if (SPELL_CONFIG.animations.sound) {
            sequence.sound()
                .file(SPELL_CONFIG.animations.sound)
                .volume(0.6)
                .delay(1000);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalDamageBonus = SPELL_CONFIG.fixedDamageBonus + characteristicInfo.final + damageBonus + effectDamageBonus;
        combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`);
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
        // Always costs mana (unfocusable)
        const actualManaCost = `${SPELL_CONFIG.manaCost} mana`;

        // Build injury info if present
        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` :
            '';

        // Build active effect info if present
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const effectInfo = (characteristicInfo.effectBonus !== 0 || effectDamageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${characteristicInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${SPELL_CONFIG.characteristicDisplay}: +${characteristicInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 ? `<div>⚡ Bonus de Dégâts Électriques: +${effectDamageBonus}</div>` : ''}
            </div>` :
            '';

        // Build manual bonus info if present
        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` :
            '';

        // Build attack result display
        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        // Build damage display
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #2e7d32; margin-bottom: 6px;"><strong>⚡ ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.fixedDamageBonus} + Physique + bonus)</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #fff8e1, #e8f5e8); padding: 12px; border-radius: 8px; border: 2px solid #ffeb3b; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #f57f17;">⚡ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Guerrier:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
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

    ui.notifications.info(`⚡ Frappe Électrique lancée !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${maximizedInfo}.`);

})();
