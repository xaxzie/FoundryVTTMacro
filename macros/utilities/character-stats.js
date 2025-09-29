/**
 * Character Statistics Utility
 *
 * Standalone functions for retrieving and working with character statistics,
 * including injury-adjusted values for the custom RPG system.
 *
 * Usage: Copy the needed stat function(s) into your spell macro
 */

/**
 * Retrieves a specific character statistic from the actor
 * @param {Actor} actor - The actor to get stats from
 * @param {string} statName - Name of the stat ('esprit', 'physique', 'agilite', etc.)
 * @returns {number} The stat value, defaults to 3 if not found
 */
function getCharacterStat(actor, statName) {
    const attribute = actor.system.attributes?.[statName];
    if (!attribute) {
        console.warn(`[WARNING] Characteristic ${statName} not found! Using default value of 3.`);
        return 3;
    }
    return attribute.value || 3;
}

/**
 * Detects injury stacks on an actor
 * @param {Actor} actor - The actor to check for injuries
 * @returns {number} Number of injury stacks (0 if none)
 */
function detectInjuryStacks(actor) {
    const injuryEffect = actor?.effects?.contents?.find(e =>
        e.name?.toLowerCase().includes('blessures')
    );
    const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

    console.log(`[DEBUG] Injury stacks detected: ${injuryStacks}`);
    return injuryStacks;
}

/**
 * Gets injury-adjusted character statistic
 * @param {Actor} actor - The actor to get stats from
 * @param {string} statName - Name of the stat ('esprit', 'physique', etc.)
 * @returns {Object} { baseStat, injuryStacks, adjustedStat }
 */
function getInjuryAdjustedStat(actor, statName) {
    const baseStat = getCharacterStat(actor, statName);
    const injuryStacks = detectInjuryStacks(actor);

    // Each injury reduces the stat by 1, minimum of 1
    const adjustedStat = Math.max(1, baseStat - injuryStacks);

    if (injuryStacks > 0) {
        console.log(`[DEBUG] ${statName} reduced from ${baseStat} to ${adjustedStat} due to ${injuryStacks} injuries`);
    }

    return {
        baseStat,
        injuryStacks,
        adjustedStat
    };
}

/**
 * Gets Esprit stat with injury adjustment (most common for spells)
 * @param {Actor} actor - The actor to get Esprit from
 * @returns {Object} { baseStat, injuryStacks, adjustedStat }
 */
function getEspritStat(actor) {
    return getInjuryAdjustedStat(actor, 'esprit');
}

/**
 * Validates that an actor has the Esprit attribute configured
 * @param {Actor} actor - The actor to validate
 * @returns {boolean} True if Esprit is found, false otherwise (shows error)
 */
function validateEspritAttribute(actor) {
    const espritAttribute = actor.system.attributes?.esprit;
    if (!espritAttribute) {
        ui.notifications.error("Caractéristique Esprit non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.");
        return false;
    }
    return true;
}

/**
 * Gets all character statistics with injury adjustments
 * @param {Actor} actor - The actor to get stats from
 * @returns {Object} Object with all stats (base and adjusted values)
 */
function getAllCharacterStats(actor) {
    const statNames = ['physique', 'dexterite', 'agilite', 'esprit', 'sens', 'volonte', 'charisme'];
    const stats = {};

    statNames.forEach(statName => {
        stats[statName] = getInjuryAdjustedStat(actor, statName);
    });

    return stats;
}

/**
 * Formats injury information for display
 * @param {number} baseStat - Original stat value
 * @param {number} adjustedStat - Injury-adjusted stat value
 * @param {number} injuryStacks - Number of injuries
 * @returns {string} Formatted injury info HTML or empty string
 */
function formatInjuryInfo(baseStat, adjustedStat, injuryStacks) {
    if (injuryStacks > 0) {
        return `<p><strong>⚠️ Blessures :</strong> ${injuryStacks} (Esprit réduit de ${baseStat} à ${adjustedStat})</p>`;
    }
    return '';
}

// Example usage in a spell macro:
/*
const { caster, actor } = validateSpellCaster();

// Validate Esprit exists
if (!validateEspritAttribute(actor)) return;

// Get injury-adjusted Esprit
const espritInfo = getEspritStat(actor);
const { baseStat, injuryStacks, adjustedStat } = espritInfo;

console.log(`Esprit: ${adjustedStat} (base: ${baseStat}, injuries: ${injuryStacks})`);

// Use adjustedStat for spell calculations
const spellPower = adjustedStat;

// Display injury info in dialogs
const injuryDisplay = formatInjuryInfo(baseStat, adjustedStat, injuryStacks);
*/
