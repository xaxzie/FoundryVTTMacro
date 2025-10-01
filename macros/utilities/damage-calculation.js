/**
 * Damage Calculation Utility
 *
 * Standalone functions for calculating spell damage and healing based on
 * character stats, stances, and custom RPG mechanics.
 *
 * Usage: Copy the needed damage function(s) into your spell macro
 */

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
            console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey} (total: ${totalBonus})`);
        }
    }

    return totalBonus;
}

/**
 * Creates a standard damage/healing roll
 * @param {Actor} actor - The actor performing the roll (for active effect bonuses)
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @param {string} rollType - Type of roll for display ("damage", "healing")
 * @returns {Promise<Roll>} Evaluated damage roll
 */
async function createStandardRoll(actor, espritStat, damageBonus = 0, rollType = "damage") {
    // Get active effect damage bonuses
    const effectDamageBonus = getActiveEffectBonus(actor, "damage");
    const totalDamageBonus = damageBonus + effectDamageBonus;

    const statBonus = Math.floor((espritStat + totalDamageBonus) / 2);
    const roll = new Roll("1d6 + @statBonus", { statBonus: statBonus });
    await roll.evaluate({ async: true });

    console.log(`[DEBUG] ${rollType} roll: ${roll.total} (formula: ${roll.formula}, manual bonus: ${damageBonus}, effect bonus: ${effectDamageBonus}, total bonus: ${totalDamageBonus})`);
    return roll;
}

/**
 * Creates a maximized damage roll (for Offensive stance)
 * @param {Actor} actor - The actor performing the roll (for active effect bonuses)
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @returns {Object} Fake roll object with maximized damage
 */
function createMaximizedRoll(actor, espritStat, damageBonus = 0) {
    // Get active effect damage bonuses
    const effectDamageBonus = getActiveEffectBonus(actor, "damage");
    const totalDamageBonus = damageBonus + effectDamageBonus;

    const statBonus = Math.floor((espritStat + totalDamageBonus) / 2);
    const maxDamage = 6 + statBonus;

    const fakeRoll = {
        total: maxDamage,
        formula: `6 + ${statBonus}`,
        result: `6 + ${statBonus}`,
        isMaximized: true
    };

    console.log(`[DEBUG] Maximized damage: ${maxDamage} (6 + ${statBonus}, manual bonus: ${damageBonus}, effect bonus: ${effectDamageBonus})`);
    return fakeRoll;
}

/**
 * Calculates damage/healing based on stance
 * @param {Actor} actor - The actor performing the roll (for active effect bonuses)
 * @param {string|null} stance - Current combat stance
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @param {boolean} isHealing - Whether this is a healing calculation
 * @returns {Promise<Roll|Object>} Damage roll (real Roll or fake maximized object)
 */
async function calculateStanceDamage(actor, stance, espritStat, damageBonus = 0, isHealing = false) {
    if (stance === 'offensif' && !isHealing) {
        // Offensive stance: maximize damage
        return createMaximizedRoll(actor, espritStat, damageBonus);
    } else {
        // Normal dice rolling for other stances or healing
        const rollType = isHealing ? "healing" : "damage";
        return await createStandardRoll(actor, espritStat, damageBonus, rollType);
    }
}

/**
 * Calculates multiple projectile damages
 * @param {Actor} actor - The actor performing the roll (for active effect bonuses)
 * @param {number} projectileCount - Number of projectiles/attacks
 * @param {string|null} stance - Current combat stance
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @param {boolean} isHealing - Whether this is healing calculation
 * @returns {Promise<Array>} Array of damage rolls
 */
async function calculateMultipleProjectileDamage(actor, projectileCount, stance, espritStat, damageBonus = 0, isHealing = false) {
    const damages = [];

    for (let i = 0; i < projectileCount; i++) {
        const damage = await calculateStanceDamage(actor, stance, espritStat, damageBonus, isHealing);
        damages.push(damage);
    }

    return damages;
}

/**
 * Calculates total damage from multiple rolls
 * @param {Array} damageRolls - Array of damage roll objects
 * @returns {number} Total damage across all rolls
 */
function calculateTotalDamage(damageRolls) {
    return damageRolls.reduce((total, roll) => total + roll.total, 0);
}

/**
 * Creates attack resolution roll
 * @param {Actor} actor - The actor performing the roll (for active effect bonuses)
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} attackBonus - Manual attack bonus (additional d7 dice)
 * @param {number} spellLevel - Spell level (default: 1)
 * @returns {Promise<Object>} Attack resolution info with roll details
 */
async function calculateAttackResolution(actor, espritStat, attackBonus = 0, spellLevel = 1) {
    // Get active effect bonuses for Esprit (which affects attack dice)
    const effectEspritBonus = getActiveEffectBonus(actor, "esprit");
    const totalEspritStat = espritStat + effectEspritBonus;

    // Get precision bonuses (additional d7 dice for attack only)
    const precisionBonus = getActiveEffectBonus(actor, "precision");
    const flatPrecisionBonus = getActiveEffectBonus(actor, "flatPrecision");

    // Calculate total attack dice: base esprit + esprit effects + precision effects + manual bonus
    const totalAttackDice = totalEspritStat + precisionBonus + attackBonus;
    const levelBonus = 2 * spellLevel;

    // Calculate total flat bonus: level bonus + flat precision bonus
    const totalFlatBonus = levelBonus + flatPrecisionBonus;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${totalFlatBonus}`);
    await attackRoll.evaluate({ async: true });

    const attackResolution = {
        roll: attackRoll,
        total: attackRoll.total,
        formula: attackRoll.formula,
        result: attackRoll.result,
        levelBonus: levelBonus,
        baseDice: espritStat,
        espritEffectBonus: effectEspritBonus,
        precisionBonus: precisionBonus,
        flatPrecisionBonus: flatPrecisionBonus,
        manualBonus: attackBonus,
        totalDice: totalAttackDice,
        totalFlatBonus: totalFlatBonus
    };

    console.log(`[DEBUG] Attack resolution: ${attackResolution.total} (${attackResolution.formula}, base esprit: ${espritStat}, esprit effects: ${effectEspritBonus}, precision: ${precisionBonus}, flat precision: ${flatPrecisionBonus}, manual bonus: ${attackBonus})`);
    return attackResolution;
}/**
 * Formats damage roll for display
 * @param {Roll|Object} damageRoll - Damage roll object
 * @param {boolean} showFormula - Whether to show the formula (default: true)
 * @returns {string} Formatted damage string
 */
function formatDamageRoll(damageRoll, showFormula = true) {
    if (!showFormula) {
        return damageRoll.total.toString();
    }

    if (damageRoll.isMaximized) {
        return `${damageRoll.total} <span style="font-size: 0.7em; color: #666;">(${damageRoll.formula})</span>`;
    }

    return `${damageRoll.total} <span style="font-size: 0.7em; color: #666;">(${damageRoll.formula}: ${damageRoll.result})</span>`;
}

/**
 * Gets bonus collection dialog for damage and attack
 * @param {Actor} actor - The actor performing the roll (for active effect bonuses)
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} spellLevel - Spell level
 * @param {string|null} stance - Current combat stance
 * @param {boolean} isHealing - Whether this is a healing spell
 * @returns {Promise<Object|null>} Bonus values or null if cancelled
 */
async function getBonusDialog(actor, espritStat, spellLevel = 1, stance = null, isHealing = false) {
    // Get active effect bonuses for display
    const effectEspritBonus = getActiveEffectBonus(actor, "esprit");
    const effectDamageBonus = getActiveEffectBonus(actor, "damage");
    const precisionBonus = getActiveEffectBonus(actor, "precision");
    const flatPrecisionBonus = getActiveEffectBonus(actor, "flatPrecision");

    const totalEspritStat = espritStat + effectEspritBonus;
    const totalAttackDice = totalEspritStat + precisionBonus;
    const totalFlatBonus = (2 * spellLevel) + flatPrecisionBonus;
    let damageInfo;
    if (isHealing) {
        damageInfo = "Soin : <strong>1d6 + (Esprit + bonus)/2</strong>";
    } else if (stance === 'offensif') {
        damageInfo = "Dégâts : <strong>6 dégâts (MAXIMISÉ en Position Offensive)</strong>";
    } else {
        damageInfo = "Dégâts : <strong>1d6 + (Esprit + bonus)/2</strong>";
    }

    const bonusValues = await new Promise((resolve) => {
        new Dialog({
            title: `Bonus de Combat${stance ? ` (Position: ${stance.charAt(0).toUpperCase() + stance.slice(1)})` : ''}`,
            content: `
                <h3>Statistiques du Sort</h3>
                <p><strong>Caractéristique Esprit :</strong> ${totalEspritStat}${effectEspritBonus !== 0 ? ` <em>(${espritStat} + ${effectEspritBonus} effets)</em>` : ''}</p>
                <p><strong>Niveau du Sort :</strong> ${spellLevel}</p>
                <p>${damageInfo}${effectDamageBonus !== 0 ? ` <em>(+${effectDamageBonus} bonus d'effets)</em>` : ''}</p>
                <p>Jet d'attaque de base : <strong>${totalAttackDice}d7 + ${totalFlatBonus}</strong>${precisionBonus !== 0 || flatPrecisionBonus !== 0 ? ` <em>(+${precisionBonus} précision, +${flatPrecisionBonus} précision fixe)</em>` : ''}</p>
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
                <p><strong>Jet d'attaque final :</strong> <span id="finalAttack">${totalAttackDice}d7 + ${totalFlatBonus}</span></p>
                <script>
                    document.getElementById('attackBonus').addEventListener('input', function() {
                        const base = ${totalAttackDice};
                        const bonus = parseInt(this.value) || 0;
                        const total = base + bonus;
                        const flatBonus = ${totalFlatBonus};
                        document.getElementById('finalAttack').textContent = total + 'd7 + ' + flatBonus;
                    });
                </script>
            `,
            buttons: {
                confirm: {
                    label: "Continuer",
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

    return bonusValues;
}

// Example usage in a spell macro:
/*
const { caster, actor } = validateSpellCaster();
const { stance } = getStanceInfo(actor);
const { adjustedStat: espritStat } = getEspritStat(actor);

// Get bonuses from user
const bonuses = await getBonusDialog(actor, espritStat, 1, stance, false);
if (!bonuses) return;

const { damageBonus, attackBonus } = bonuses;

// Calculate single damage (affected by "damage" effects, NOT by precision effects)
const damage = await calculateStanceDamage(actor, stance, espritStat, damageBonus, false);
console.log(`Damage: ${formatDamageRoll(damage)}`);

// Calculate multiple projectiles
const damages = await calculateMultipleProjectileDamage(actor, 2, stance, espritStat, damageBonus, false);
const totalDamage = calculateTotalDamage(damages);
console.log(`Total damage: ${totalDamage}`);

// Calculate attack resolution (affected by "esprit", "precision", and "flatPrecision" effects)
const attackResolution = await calculateAttackResolution(actor, espritStat, attackBonus, 1);
console.log(`Attack roll: ${attackResolution.total}`);

// Example with 10 Esprit, 1 precision bonus, 1 flatPrecision bonus:
// - Attack: (10 + 1)d7 + (2 + 1) = 11d7 + 3
// - Damage: 1d6 + Math.floor((10 + damageBonus + damageEffects) / 2)
*/
