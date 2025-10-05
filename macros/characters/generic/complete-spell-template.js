/**
 * Complete Spell Template - Physical Attack Spell Example
 *
 * This template demonstrates all the components needed for a complete spell macro:
 * - Stance detection and UI summary
 * - Active effect integration (characteristic + damage bonuses)
 * - Injury system integration
 * - Manual bonus configuration
 * - Portal targeting with grid-aware actor detection
 * - Sequencer animation effects
 * - Combined dice rolling and chat formatting
 * - Security: Hidden token filtering (prevents targeting invisible tokens)
 *
 * Actor Detection Features:
 * - Grid-aware: Properly detects targets on grid-based maps including diagonal positions
 * - Multi-square token support: Handles large tokens (2x2, 3x3, etc.) correctly
 * - Visibility security: Only detects tokens visible to the current user (isOwner || isVisible || isGM)
 * - Backward compatibility: Falls back to circular detection for gridless maps
 *
 * Customization Guide:
 * 1. Update spell configuration (name, mana cost, damage formula, etc.)
 * 2. Modify the characteristic used (physique, esprit, etc.)
 * 3. Change animation effects and sounds
 * 4. Adjust damage type (direct vs indirect for active effect bonuses)
 * 5. Customize UI dialog content and styling
 *
 * Prerequisites:
 * - Sequencer module
 * - JB2A effects
 * - Portal module for targeting
 * - Character stats configured via Admin Tool
 *
 * Usage: Copy this template and modify for your specific spell needs
 */

(async () => {
    // ===== SPELL CONFIGURATION =====
    const SPELL_CONFIG = {
        name: "Frappe Puissante", // Spell name
        characteristic: "physique", // Characteristic used (physique, esprit, agilite, etc.)
        characteristicDisplay: "Physique", // Display name for characteristic
        manaCost: 3, // Base mana cost
        spellLevel: 1, // Spell level for attack bonus calculation
        damageFormula: "1d6", // Base damage dice
        isDirect: true, // true = direct spell (gets damage bonuses), false = indirect (no damage bonuses)

        // Animation configuration
        animations: {
            cast: "jb2a.cast_generic.fire.orange", // Casting animation
            projectile: "jb2a.fire_bolt.orange", // Projectile animation (if applicable)
            impact: "jb2a.explosion.02.orange", // Impact animation
            sound: null // Optional sound effect
        },

        // Targeting configuration
        targeting: {
            range: 120, // Targeting range in pixels
            color: "#ff6600", // Portal color
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm" // Portal texture
        }
    };

    // ===== BASIC VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de votre personnage !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== STANCE DETECTION UTILITY =====
    /**
     * Detects the current stance of the actor
     * @param {Actor} actor - The actor to check
     * @returns {string|null} Current stance or null
     */
    function getCurrentStance(actor) {
        const stance = actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;

        console.log(`[DEBUG] Current stance detected: ${stance || 'No stance'}`);
        return stance;
    }

    const currentStance = getCurrentStance(actor);

    // ===== ACTIVE EFFECT HELPER FUNCTIONS =====
    /**
     * Gets active effect bonuses for a specific flag key
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "physique")
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

    // ===== CHARACTER STATS UTILITY =====
    /**
     * Gets and calculates the final characteristic value with injuries and effects
     * @param {Actor} actor - The actor
     * @param {string} characteristic - The characteristic name
     * @returns {Object} Characteristic calculation details
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

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== SPELL CONFIGURATION DIALOG =====
    /**
     * Creates and displays the spell configuration dialog
     * @returns {Object|null} Configuration object or null if cancelled
     */
    async function showSpellConfigDialog() {
        // Get damage bonuses for display (only if direct spell)
        const effectDamageBonus = SPELL_CONFIG.isDirect ? getActiveEffectBonus(actor, "damage") : 0;

        // Calculate mana costs based on stance
        let manaCostInfo;
        if (currentStance === 'focus') {
            manaCostInfo = "<strong>Coût en Mana :</strong> GRATUIT (Position Focus)";
        } else {
            manaCostInfo = `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana`;
        }

        // Stance-specific damage info
        let damageInfo;
        const damageBonus = effectDamageBonus !== 0 && SPELL_CONFIG.isDirect ? ` <em>(+${effectDamageBonus} bonus d'effets)</em>` : '';
        if (currentStance === 'offensif') {
            damageInfo = `Dégâts : <strong>${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay} (MAXIMISÉ en Position Offensive)</strong>${damageBonus}`;
        } else {
            damageInfo = `Dégâts : <strong>${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay}</strong>${damageBonus}`;
        }

        return new Promise((resolve) => {
            new Dialog({
                title: `${SPELL_CONFIG.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>Configuration du Sort :</h3>
                    <p>${manaCostInfo}</p>
                    <p><strong>Caractéristique ${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                        <h4>Bonus Manuels</h4>
                        <div style="margin: 5px 0;">
                            <label>Bonus de dégâts :
                                <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Objets, effets temporaires, etc.</small>
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
                        label: "Lancer le Sort",
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
        ui.notifications.info("Sort annulé.");
        return;
    }

    // ===== ACTOR DETECTION UTILITY =====
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
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(targetX / gridSize);
            const targetGridY = Math.floor(targetY / gridSize);

            console.log(`[DEBUG] Grid detection - Target grid coords: (${targetGridX}, ${targetGridY})`);

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
                            console.log(`[DEBUG] Grid detection - Found token "${token.name}" at grid (${targetGridX}, ${targetGridY})`);
                            return true;
                        }
                    }
                }
                return false;
            });

            if (tokensAtLocation.length === 0) {
                console.log(`[DEBUG] Grid detection - No visible tokens found at target grid position`);
                return null;
            }

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection (original behavior with visibility filtering)
            const tolerance = gridSize;
            console.log(`[DEBUG] Circular detection - Tolerance: ${tolerance}`);

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

                console.log(`[DEBUG] Circular detection - Token "${token.name}" distance: ${tokenDistance}`);
                return tokenDistance <= tolerance;
            });

            if (tokensAtLocation.length === 0) {
                console.log(`[DEBUG] Circular detection - No visible tokens found at target position`);
                return null;
            }

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
    /**
     * Calculates damage based on stance and bonuses
     * @returns {Object} Damage calculation result
     */
    async function calculateDamage() {
        // Calculate total damage bonus (manual + effects if direct spell)
        const effectDamageBonus = SPELL_CONFIG.isDirect ? getActiveEffectBonus(actor, "damage") : 0;
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = characteristicInfo.final + totalDamageBonus;

        if (currentStance === 'offensif') {
            // Offensive stance: damage is maximized
            const diceMax = parseInt(SPELL_CONFIG.damageFormula.split('d')[1]) * parseInt(SPELL_CONFIG.damageFormula.split('d')[0]);
            const maxDamage = diceMax + statBonus;

            console.log(`[DEBUG] Maximized damage: ${maxDamage} (${diceMax} + ${statBonus}, manual bonus: ${damageBonus}${SPELL_CONFIG.isDirect ? `, effect bonus: ${effectDamageBonus}` : ''})`);

            return {
                total: maxDamage,
                formula: `${diceMax} + ${statBonus}`,
                result: `${diceMax} + ${statBonus}`,
                isMaximized: true
            };
        } else {
            // Normal dice rolling
            const damage = new Roll(`${SPELL_CONFIG.damageFormula} + @statBonus`, { statBonus: statBonus });
            await damage.evaluate({ async: true });

            console.log(`[DEBUG] Rolled damage: ${damage.total} (formula: ${damage.formula}, manual bonus: ${damageBonus}${SPELL_CONFIG.isDirect ? `, effect bonus: ${effectDamageBonus}` : ''})`);

            return damage;
        }
    }

    const damageResult = await calculateDamage();

    // ===== SEQUENCER EFFECTS =====
    /**
     * Plays the spell animation sequence
     */
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Casting effect on caster
        if (SPELL_CONFIG.animations.cast) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.cast)
                .atLocation(caster)
                .scale(0.9)
                .duration(2000);
        }

        // Projectile effect (if configured)
        if (SPELL_CONFIG.animations.projectile) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.projectile)
                .atLocation(caster)
                .stretchTo(target)
                .delay(500);
        }

        // Impact effect at target
        if (SPELL_CONFIG.animations.impact) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.impact)
                .atLocation(target)
                .scale(0.8)
                .delay(800);
        }

        // Sound effect (if configured)
        if (SPELL_CONFIG.animations.sound) {
            sequence.sound()
                .file(SPELL_CONFIG.animations.sound)
                .volume(0.5)
                .delay(800);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula: attack roll + damage roll
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll to the combined formula (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = SPELL_CONFIG.isDirect ? getActiveEffectBonus(actor, "damage") : 0;
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = characteristicInfo.final + totalDamageBonus;
        combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${statBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results from the combined roll
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        // Extract damage result from dice roll
        const damageRollResult = combinedRoll.terms[0].results[1];
        finalDamageResult = {
            total: damageRollResult.result,
            formula: damageRollResult.expression,
            result: damageRollResult.result
        };
    }

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    /**
     * Creates the enhanced flavor text for the chat message
     * @returns {string} HTML formatted flavor text
     */
    function createChatFlavor() {
        // Calculate actual mana cost
        const actualManaCost = currentStance === 'focus' ? 'GRATUIT (Position Focus)' : `${SPELL_CONFIG.manaCost} mana`;

        // Build injury info if present
        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` :
            '';

        // Build active effect info if present
        const effectDamageBonus = SPELL_CONFIG.isDirect ? getActiveEffectBonus(actor, "damage") : 0;
        const effectInfo = (characteristicInfo.effectBonus !== 0 || (effectDamageBonus !== 0 && SPELL_CONFIG.isDirect)) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${characteristicInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${SPELL_CONFIG.characteristicDisplay}: +${characteristicInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 && SPELL_CONFIG.isDirect ? `<div>✨ Bonus de Dégâts: +${effectDamageBonus}</div>` : ''}
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
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        // Build damage display
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>⚔️ ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #fff3e0, #ffebee); padding: 12px; border-radius: 8px; border: 2px solid #ff6600; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #e65100;">⚔️ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
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

    // Send the combined roll to chat with enhanced flavor
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName}. Jet d'attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${maximizedInfo}.`);

})();
