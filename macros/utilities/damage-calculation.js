/**
 * Damage Calculation Utility
 *
 * Standalone functions for calculating spell damage and healing based on
 * character stats, stances, and custom RPG mechanics.
 *
 * Usage: Copy the needed damage function(s) into your spell macro
 */

/**
 * Creates a standard damage/healing roll
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @param {string} rollType - Type of roll for display ("damage", "healing")
 * @returns {Promise<Roll>} Evaluated damage roll
 */
async function createStandardRoll(espritStat, damageBonus = 0, rollType = "damage") {
    const statBonus = Math.floor((espritStat + damageBonus) / 2);
    const roll = new Roll("1d6 + @statBonus", { statBonus: statBonus });
    await roll.evaluate({ async: true });

    console.log(`[DEBUG] ${rollType} roll: ${roll.total} (formula: ${roll.formula}, result: ${roll.result})`);
    return roll;
}

/**
 * Creates a maximized damage roll (for Offensive stance)
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @returns {Object} Fake roll object with maximized damage
 */
function createMaximizedRoll(espritStat, damageBonus = 0) {
    const statBonus = Math.floor((espritStat + damageBonus) / 2);
    const maxDamage = 6 + statBonus;

    const fakeRoll = {
        total: maxDamage,
        formula: `6 + ${statBonus}`,
        result: `6 + ${statBonus}`,
        isMaximized: true
    };

    console.log(`[DEBUG] Maximized damage: ${maxDamage} (6 + ${statBonus})`);
    return fakeRoll;
}

/**
 * Calculates damage/healing based on stance
 * @param {string|null} stance - Current combat stance
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @param {boolean} isHealing - Whether this is a healing calculation
 * @returns {Promise<Roll|Object>} Damage roll (real Roll or fake maximized object)
 */
async function calculateStanceDamage(stance, espritStat, damageBonus = 0, isHealing = false) {
    if (stance === 'offensif' && !isHealing) {
        // Offensive stance: maximize damage
        return createMaximizedRoll(espritStat, damageBonus);
    } else {
        // Normal dice rolling for other stances or healing
        const rollType = isHealing ? "healing" : "damage";
        return await createStandardRoll(espritStat, damageBonus, rollType);
    }
}

/**
 * Calculates multiple projectile damages
 * @param {number} projectileCount - Number of projectiles/attacks
 * @param {string|null} stance - Current combat stance
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} damageBonus - Manual damage bonus from items/effects
 * @param {boolean} isHealing - Whether this is healing calculation
 * @returns {Promise<Array>} Array of damage rolls
 */
async function calculateMultipleProjectileDamage(projectileCount, stance, espritStat, damageBonus = 0, isHealing = false) {
    const damages = [];

    for (let i = 0; i < projectileCount; i++) {
        const damage = await calculateStanceDamage(stance, espritStat, damageBonus, isHealing);
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
 * @param {number} espritStat - Character's Esprit statistic (injury-adjusted)
 * @param {number} attackBonus - Manual attack bonus (additional d7 dice)
 * @param {number} spellLevel - Spell level (default: 1)
 * @returns {Promise<Object>} Attack resolution info with roll details
 */
async function calculateAttackResolution(espritStat, attackBonus = 0, spellLevel = 1) {
    const totalAttackDice = espritStat + attackBonus;
    const levelBonus = 2 * spellLevel;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    const attackResolution = {
        roll: attackRoll,
        total: attackRoll.total,
        formula: attackRoll.formula,
        result: attackRoll.result,
        levelBonus: levelBonus,
        baseDice: espritStat,
        bonusDice: attackBonus,
        totalDice: totalAttackDice
    };

    console.log(`[DEBUG] Attack resolution: ${attackResolution.total} (${attackResolution.formula})`);
    return attackResolution;
}

/**
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
 * @param {number} espritStat - Character's Esprit statistic
 * @param {number} spellLevel - Spell level
 * @param {string|null} stance - Current combat stance
 * @param {boolean} isHealing - Whether this is a healing spell
 * @returns {Promise<Object|null>} Bonus values or null if cancelled
 */
async function getBonusDialog(espritStat, spellLevel = 1, stance = null, isHealing = false) {
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
                <p><strong>Caractéristique Esprit :</strong> ${espritStat}</p>
                <p><strong>Niveau du Sort :</strong> ${spellLevel}</p>
                <p>${damageInfo}</p>
                <p>Jet d'attaque de base : <strong>${espritStat}d7 + ${2 * spellLevel}</strong></p>
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
                <p><strong>Jet d'attaque final :</strong> <span id="finalAttack">${espritStat}d7 + ${2 * spellLevel}</span></p>
                <script>
                    document.getElementById('attackBonus').addEventListener('input', function() {
                        const base = ${espritStat};
                        const bonus = parseInt(this.value) || 0;
                        const total = base + bonus;
                        const levelBonus = ${2 * spellLevel};
                        document.getElementById('finalAttack').textContent = total + 'd7 + ' + levelBonus;
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
const bonuses = await getBonusDialog(espritStat, 1, stance, false);
if (!bonuses) return;

const { damageBonus, attackBonus } = bonuses;

// Calculate single damage
const damage = await calculateStanceDamage(stance, espritStat, damageBonus, false);
console.log(`Damage: ${formatDamageRoll(damage)}`);

// Calculate multiple projectiles
const damages = await calculateMultipleProjectileDamage(2, stance, espritStat, damageBonus, false);
const totalDamage = calculateTotalDamage(damages);
console.log(`Total damage: ${totalDamage}`);

// Calculate attack resolution
const attackResolution = await calculateAttackResolution(espritStat, attackBonus, 1);
console.log(`Attack roll: ${attackResolution.total}`);
*/
