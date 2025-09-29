/**
 * Portal Targeting Utility
 *
 * Standalone functions for using Portal module to target spell locations.
 * Copy these functions into your spell macros for crosshair targeting.
 *
 * Usage: Copy the needed portal function(s) into your spell macro
 * Note: Requires Portal module to be installed and active
 */

/**
 * Creates a basic Portal instance for spell targeting
 * @param {Token} casterToken - The token casting the spell
 * @param {Object} options - Portal configuration options
 * @param {number} options.range - Spell range in pixels (default: 120)
 * @param {string} options.color - Targeting color (default: "#0000ff")
 * @param {string} options.texture - Portal texture path (optional)
 * @returns {Portal} Configured Portal instance
 */
function createSpellPortal(casterToken, options = {}) {
    const {
        range = 120,
        color = "#0000ff",
        texture = "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
    } = options;

    return new Portal()
        .origin(casterToken)
        .range(range)
        .color(color)
        .texture(texture);
}

/**
 * Simple single-target portal selection
 * @param {Token} casterToken - The token casting the spell
 * @param {Object} options - Portal configuration options
 * @returns {Object|null} Target location {x, y} or null if cancelled
 */
async function selectSingleTarget(casterToken, options = {}) {
    try {
        const portal = createSpellPortal(casterToken, options);
        const target = await portal.pick();

        if (!target) {
            ui.notifications.info("Ciblage annulé.");
            return null;
        }

        return { x: target.x, y: target.y };
    } catch (error) {
        ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
        console.error("Portal targeting error:", error);
        return null;
    }
}

/**
 * Portal selection for healing spells (green color)
 * @param {Token} casterToken - The token casting the spell
 * @param {number} range - Spell range in pixels (default: 120)
 * @returns {Object|null} Target location {x, y} or null if cancelled
 */
async function selectHealingTarget(casterToken, range = 120) {
    const options = {
        range,
        color: "#00ff00",
        texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm"
    };

    return await selectSingleTarget(casterToken, options);
}

/**
 * Portal selection for offensive spells (red color)
 * @param {Token} casterToken - The token casting the spell
 * @param {number} range - Spell range in pixels (default: 120)
 * @returns {Object|null} Target location {x, y} or null if cancelled
 */
async function selectOffensiveTarget(casterToken, range = 120) {
    const options = {
        range,
        color: "#ff0000",
        texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
    };

    return await selectSingleTarget(casterToken, options);
}

/**
 * Multi-target selection with portal
 * @param {Token} casterToken - The token casting the spell
 * @param {number} maxTargets - Maximum number of targets (default: 2)
 * @param {Object} options - Portal configuration options
 * @returns {Array} Array of target locations [{x, y}, ...] or empty array if cancelled
 */
async function selectMultipleTargets(casterToken, maxTargets = 2, options = {}) {
    const targets = [];

    for (let i = 0; i < maxTargets; i++) {
        const targetPrompt = `Cible ${i + 1}`;
        ui.notifications.info(targetPrompt);

        const target = await selectSingleTarget(casterToken, options);
        if (!target) {
            if (i === 0) {
                // First target cancelled, abort completely
                ui.notifications.info("Ciblage annulé.");
                return [];
            } else {
                // Subsequent target cancelled, use what we have
                break;
            }
        }

        targets.push(target);
    }

    return targets;
}

/**
 * Checks if a target location is close to the caster (for self-targeting)
 * @param {Token} casterToken - The caster token
 * @param {Object} targetLocation - Target location {x, y}
 * @param {number} tolerance - Distance tolerance (default: canvas.grid.size)
 * @returns {boolean} True if target is close enough for self-targeting
 */
function isTargetingSelf(casterToken, targetLocation, tolerance = null) {
    if (!tolerance) {
        tolerance = canvas.grid.size;
    }

    const distance = Math.sqrt(
        Math.pow(targetLocation.x - casterToken.x, 2) +
        Math.pow(targetLocation.y - casterToken.y, 2)
    );

    return distance <= tolerance;
}

/**
 * Portal selection with optional second target choice
 * @param {Token} casterToken - The token casting the spell
 * @param {Object} options - Portal and dialog options
 * @returns {Array} Array of 1-2 target locations
 */
async function selectOptionalSecondTarget(casterToken, options = {}) {
    // First target
    const target1 = await selectSingleTarget(casterToken, options);
    if (!target1) return [];

    const targets = [target1];

    // Ask for second target
    const secondTarget = await new Promise((resolve) => {
        new Dialog({
            title: "Deuxième Cible ?",
            content: `<p>Voulez-vous cibler un deuxième emplacement, ou utiliser la première cible ?</p>`,
            buttons: {
                second: {
                    label: "Deuxième Cible",
                    callback: () => resolve(true)
                },
                same: {
                    label: "Même Cible",
                    callback: () => resolve(false)
                }
            }
        }).render(true);
    });

    if (secondTarget) {
        const target2 = await selectSingleTarget(casterToken, {
            ...options,
            color: "#00ff00"  // Different color for second target
        });

        if (target2) {
            targets.push(target2);
        } else {
            ui.notifications.info("Deuxième cible annulée - utilisation de la première cible uniquement.");
        }
    }

    return targets;
}

// Example usage in a spell macro:
/*
const { caster, actor } = validateSpellCaster();

// Simple single target
const target = await selectSingleTarget(caster);
if (!target) return;

// Healing spell targeting
const healTarget = await selectHealingTarget(caster, 120);
if (!healTarget) return;

// Multiple targets
const targets = await selectMultipleTargets(caster, 2);
if (targets.length === 0) return;

// Check if targeting self
const isSelfTarget = isTargetingSelf(caster, target);
if (isSelfTarget) {
    console.log("Player is targeting themselves");
}

// Optional second target
const optionalTargets = await selectOptionalSecondTarget(caster);
if (optionalTargets.length === 0) return;
*/
