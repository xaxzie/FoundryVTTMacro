/**
 * Sequencer Utility Functions
 * Description: Reusable helper functions for common Sequencer patterns
 *
 * Usage: Copy these functions into your macros or save as a separate utility macro
 *
 * @author Sequencer Examples
 * @version 1.0
 */

// ========================================
// TOKEN SELECTION UTILITIES
// ========================================

/**
 * Get the first selected token with validation
 * @returns {Token|null} The selected token or null if none selected
 */
function getSelectedToken() {
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("Please select a token!");
        return null;
    }
    return canvas.tokens.controlled[0];
}

/**
 * Get all targeted tokens with validation
 * @param {number} minTargets - Minimum number of targets required
 * @returns {Token[]|null} Array of targeted tokens or null if insufficient
 */
function getTargetedTokens(minTargets = 1) {
    const targets = Array.from(game.user.targets);
    if (targets.length < minTargets) {
        ui.notifications.warn(`Please target at least ${minTargets} token(s)!`);
        return null;
    }
    return targets;
}

/**
 * Get tokens within a specified radius of a position
 * @param {Object} center - Center position {x, y}
 * @param {number} radius - Radius in pixels
 * @param {boolean} includeCenter - Whether to include tokens at the exact center
 * @returns {Token[]} Array of tokens within radius
 */
function getTokensInRadius(center, radius, includeCenter = true) {
    return canvas.tokens.placeables.filter(token => {
        const distance = canvas.grid.measureDistance(center, token.center);
        return includeCenter ? distance <= radius : distance > 0 && distance <= radius;
    });
}

// ========================================
// EFFECT CREATION UTILITIES
// ========================================

/**
 * Create a standard explosion effect
 * @param {Object} location - Position or token to place explosion
 * @param {string} color - Color variant (orange, blue, red, etc.)
 * @param {number} scale - Scale multiplier
 * @returns {Sequence} Sequence with explosion effect
 */
function createExplosion(location, color = "orange", scale = 1) {
    return new Sequence()
        .effect()
            .file(`jb2a.explosion.01.${color}`)
            .atLocation(location)
            .scale(scale)
        .sound()
            .file("sounds/explosion.wav") // Update path as needed
            .volume(0.7);
}

/**
 * Create a healing effect
 * @param {Object} location - Position or token to heal
 * @param {string} color - Color variant (yellowwhite, blue, green)
 * @param {number} scale - Scale multiplier
 * @returns {Sequence} Sequence with healing effect
 */
function createHealingEffect(location, color = "yellowwhite", scale = 1) {
    return new Sequence()
        .effect()
            .file(`jb2a.healing_generic.burst.${color}`)
            .atLocation(location)
            .scaleToObject(scale)
            .fadeIn(300)
            .fadeOut(800)
        .sound()
            .file("sounds/healing.wav") // Update path as needed
            .volume(0.6);
}

/**
 * Create a projectile effect between two points
 * @param {Object} origin - Starting position or token
 * @param {Object} target - Target position or token
 * @param {string} projectileType - Type of projectile (magic_missile, arrow, etc.)
 * @param {number} speed - Duration of projectile travel in ms
 * @returns {Sequence} Sequence with projectile effect
 */
function createProjectile(origin, target, projectileType = "magic_missile", speed = 1000) {
    return new Sequence()
        .effect()
            .file(`jb2a.${projectileType}`)
            .atLocation(origin)
            .stretchTo(target)
            .duration(speed);
}

/**
 * Create a widened chain/beam effect between two points.
 *
 * This demonstrates how to make an effect wider without increasing its
 * height by using Sequencer's non-uniform scaling API: `.scale({ x, y })`,
 * together with `.stretchTo()` to orient/stretch the effect along the line.
 *
 * Example usage:
 *   createWidenedChain(caster, targetPoint, { lineWidth: 5, extraCases: 4 }).play();
 *
 * Notes:
 * - `lineWidth` is the logical number of grid cases the spell covers.
 * - `extraCases` lets you add visual padding (e.g. 2 each side -> 4 total).
 * - The function returns a Sequencer `Sequence` so you can chain it with others.
 *
 * @param {Object} origin - Starting token or position
 * @param {Object} target - Target position or token
 * @param {Object} options - { file, lineWidth, extraCases, baseScale }
 * @returns {Sequence}
 */
function createWidenedChain(origin, target, options = {}) {
    const {
        file = 'jb2a.chain_lightning.primary.blue',
        lineWidth = 1,
        extraCases = 4,
        baseScale = 1.2
    } = options;

    // Compute an X-axis multiplier so the effect becomes wider while keeping
    // Y (height) close to the original `baseScale`.
    const baseCases = Math.max(1, lineWidth);
    const widthMultiplier = (baseCases + extraCases) / baseCases;
    const chainWidthScale = baseScale * widthMultiplier;

    // Return a Sequence so the caller can `.play()` or compose it.
    return new Sequence()
        .effect()
            .file(file)
            .atLocation(origin)
            .stretchTo(target)
            // Use non-uniform scaling: wider on X, keep original Y
            .scale({ x: chainWidthScale, y: baseScale })
            .fadeIn(120)
            .fadeOut(300)
            .waitUntilFinished();
}

// ========================================
// SOUND UTILITIES
// ========================================

/**
 * Play a spell casting sound
 * @param {string} spellType - Type of spell (fire, ice, healing, etc.)
 * @param {number} volume - Volume level (0-1)
 * @returns {Sequence} Sequence with sound effect
 */
function playSpellSound(spellType = "generic", volume = 0.7) {
    const soundMap = {
        fire: "sounds/fire-cast.wav",
        ice: "sounds/ice-cast.wav",
        healing: "sounds/healing-cast.wav",
        lightning: "sounds/lightning-cast.wav",
        generic: "sounds/spell-cast.wav"
    };

    return new Sequence()
        .sound()
            .file(soundMap[spellType] || soundMap.generic)
            .volume(volume);
}

// ========================================
// CROSSHAIR UTILITIES
// ========================================

/**
 * Show a crosshair for area targeting
 * @param {number} size - Size in grid squares
 * @param {string} label - Label text
 * @param {string} color - Label background color
 * @returns {Promise<Object|null>} Position object or null if cancelled
 */
async function showAreaCrosshair(size = 2, label = "Select Area", color = "#ff0000") {
    return await Sequencer.Crosshair.show({
        size: size,
        gridHighlight: true,
        label: {
            text: label,
            backgroundColor: color,
            fontSize: 20
        }
    });
}

/**
 * Show a crosshair for single target
 * @param {string} label - Label text
 * @param {string} color - Label background color
 * @returns {Promise<Object|null>} Position object or null if cancelled
 */
async function showTargetCrosshair(label = "Select Target", color = "#0066cc") {
    return await Sequencer.Crosshair.show({
        size: 1,
        gridHighlight: false,
        label: {
            text: label,
            backgroundColor: color
        }
    });
}

// ========================================
// ANIMATION UTILITIES
// ========================================

/**
 * Create a token movement animation
 * @param {Token} token - Token to move
 * @param {Object} destination - Destination position
 * @param {boolean} snapToGrid - Whether to snap to grid
 * @returns {Sequence} Sequence with movement animation
 */
function moveToken(token, destination, snapToGrid = true) {
    const sequence = new Sequence()
        .animation()
            .on(token)
            .moveTowards(destination);

    if (snapToGrid) {
        sequence.snapToGrid();
    }

    return sequence.waitUntilFinished();
}

/**
 * Create a teleportation effect
 * @param {Token} token - Token to teleport
 * @param {Object} destination - Destination position
 * @param {string} effectColor - Color of teleport effect
 * @returns {Sequence} Sequence with teleportation
 */
function teleportToken(token, destination, effectColor = "blue") {
    return new Sequence()
        // Departure effect
        .effect()
            .file(`jb2a.misty_step.01.${effectColor}`)
            .atLocation(token)
            .scaleToObject(1.5)

        // Copy sprite fading out
        .effect()
            .copySprite(token)
            .fadeIn(100)
            .duration(500)
            .fadeOut(200)
            .filter("Blur")

        // Teleport
        .animation()
            .on(token)
            .teleportTo(destination)
            .snapToGrid()
            .waitUntilFinished()

        // Arrival effect
        .effect()
            .file(`jb2a.misty_step.02.${effectColor}`)
            .atLocation(destination)
            .scaleToObject(1.5);
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Check if a file exists in the Sequencer database
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file exists
 */
function checkEffectExists(filePath) {
    return Sequencer.Database.entryExists(filePath);
}

/**
 * Validate spell requirements
 * @param {Object} requirements - Requirements object
 * @returns {boolean} True if all requirements met
 */
function validateSpellRequirements(requirements) {
    const {
        needsCaster = false,
        needsTargets = 0,
        needsSelection = false,
        minLevel = 1
    } = requirements;

    if (needsCaster && !getSelectedToken()) {
        return false;
    }

    if (needsTargets > 0 && !getTargetedTokens(needsTargets)) {
        return false;
    }

    if (needsSelection && canvas.tokens.controlled.length === 0) {
        ui.notifications.warn("Please select tokens first!");
        return false;
    }

    // Add level checking if your game system supports it
    // if (needsCaster && getSelectedToken().actor?.system?.details?.level < minLevel) {
    //     ui.notifications.warn(`Requires level ${minLevel}!`);
    //     return false;
    // }

    return true;
}

// ========================================
// COMBAT UTILITIES
// ========================================

/**
 * Create a combat impact effect
 * @param {Token} target - Target token
 * @param {string} damageType - Type of damage (slashing, piercing, etc.)
 * @param {boolean} isCritical - Whether this is a critical hit
 * @returns {Sequence} Sequence with combat effects
 */
function createCombatImpact(target, damageType = "slashing", isCritical = false) {
    const effectFile = isCritical
        ? `jb2a.melee_generic.${damageType}.two_handed`
        : `jb2a.melee_generic.${damageType}.one_handed`;

    const scale = isCritical ? 2 : 1.5;
    const soundFile = isCritical ? "sounds/critical-hit.wav" : "sounds/weapon-hit.wav";

    return new Sequence()
        .effect()
            .file(effectFile)
            .atLocation(target)
            .scaleToObject(scale)
            .randomRotation()
        .sound()
            .file(soundFile) // Update paths as needed
            .volume(isCritical ? 0.9 : 0.7);
}

// ========================================
// EXAMPLE USAGE
// ========================================

/*
// Example: Using utility functions in a macro

const caster = getSelectedToken();
if (!caster) return;

const targets = getTargetedTokens(1);
if (!targets) return;

let sequence = new Sequence();

// Add spell sound
sequence.addSequence(playSpellSound("fire"));

// Create projectile to each target
targets.forEach(target => {
    sequence.addSequence(createProjectile(caster, target, "fireball"));
    sequence.addSequence(createExplosion(target, "orange", 2));
});

sequence.play();
*/
