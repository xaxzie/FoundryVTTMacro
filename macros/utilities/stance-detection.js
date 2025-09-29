/**
 * Combat Stance Detection Utility
 *
 * Standalone functions for detecting and working with combat stances in the custom RPG system.
 * Copy these functions into your spell macros for stance-aware spell mechanics.
 *
 * Usage: Copy the needed stance function(s) into your spell macro
 */

/**
 * Detects the current combat stance of an actor
 * @param {Actor} actor - The actor to check
 * @returns {string|null} The stance name ('focus', 'offensif', 'defensif') or null if no stance
 */
function detectCombatStance(actor) {
    const currentStance = actor?.effects?.contents?.find(e =>
        ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
    )?.name?.toLowerCase() || null;

    console.log(`[DEBUG] Current stance detected: ${currentStance || 'No stance'}`);
    return currentStance;
}

/**
 * Gets formatted stance name for display
 * @param {string|null} stance - The stance string ('focus', 'offensif', 'defensif')
 * @returns {string} Formatted stance name or 'Aucune'
 */
function formatStanceName(stance) {
    if (!stance) return 'Aucune';
    return stance.charAt(0).toUpperCase() + stance.slice(1);
}

/**
 * Calculates mana cost based on stance and base cost
 * @param {string|null} stance - Current combat stance
 * @param {number} baseCost - Base mana cost of the spell
 * @param {boolean} isFocusable - Whether the spell can be made free in Focus stance (default: true)
 * @returns {Object} { cost: number, description: string }
 */
function calculateStanceManaCost(stance, baseCost, isFocusable = true) {
    if (stance === 'focus' && isFocusable) {
        return {
            cost: 0,
            description: 'GRATUIT (Position Focus)'
        };
    }

    return {
        cost: baseCost,
        description: `${baseCost} mana`
    };
}

/**
 * Gets stance-specific damage information for display
 * @param {string|null} stance - Current combat stance
 * @param {boolean} isHealing - Whether this is a healing spell (default: false)
 * @returns {string} Damage description text
 */
function getStanceDamageInfo(stance, isHealing = false) {
    if (isHealing) {
        return "Soin : <strong>1d6 + (Esprit + bonus)/2</strong>";
    }

    if (stance === 'offensif') {
        return "Dégâts : <strong>6 dégâts (MAXIMISÉ en Position Offensive)</strong>";
    } else {
        return "Dégâts : <strong>1d6 + (Esprit + bonus)/2</strong>";
    }
}

/**
 * Checks if damage should be maximized based on stance
 * @param {string|null} stance - Current combat stance
 * @param {boolean} isHealing - Whether this is a healing spell
 * @returns {boolean} True if damage should be maximized
 */
function shouldMaximizeDamage(stance, isHealing = false) {
    return stance === 'offensif' && !isHealing;
}

/**
 * Gets stance information for dialog display
 * @param {Actor} actor - The actor to check
 * @returns {Object} { stance, stanceName, stanceDisplay }
 */
function getStanceInfo(actor) {
    const stance = detectCombatStance(actor);
    const stanceName = formatStanceName(stance);
    const stanceDisplay = stance ? ` (Position: ${stanceName})` : '';

    return {
        stance,
        stanceName,
        stanceDisplay
    };
}

// Example usage in a spell macro:
/*
const { caster, actor } = validateSpellCaster();
const { stance, stanceName, stanceDisplay } = getStanceInfo(actor);

const manaCostInfo = calculateStanceManaCost(stance, 4, true);
console.log(`Mana cost: ${manaCostInfo.cost} (${manaCostInfo.description})`);

const damageInfo = getStanceDamageInfo(stance, false);
console.log(`Damage info: ${damageInfo}`);

if (shouldMaximizeDamage(stance, false)) {
    // Use maximized damage calculation
} else {
    // Use normal dice rolling
}
*/
