/**
 * Active Effect Helper Functions
 *
 * Simple utility functions for adding and removing active effects from actors.
 * These functions can be copied into spell macros or other scripts for easy effect management.
 *
 * Usage: Copy the needed functions into your macro and call them with the appropriate parameters.
 */

/**
 * Adds an active effect to an actor
 * @param {Actor} actor - The actor to add the effect to
 * @param {string} effectName - Name of the effect
 * @param {string} iconPath - Path to the effect icon
 * @param {Array} flags - Array of flag objects with key and value properties
 * @param {number} durationSeconds - Duration in seconds (default: 86400 = 24 hours)
 * @returns {Promise<ActiveEffect|null>} The created effect or null if failed
 */
async function addActiveEffect(actor, effectName, iconPath, flags = [], durationSeconds = 86400) {
    try {
        // Build flags object from the flags array
        const flagsObject = {};
        flags.forEach(flag => {
            flagsObject[flag.key] = { value: flag.value };
        });

        const effectData = {
            name: effectName,
            icon: iconPath,
            origin: actor.uuid,
            duration: { seconds: durationSeconds },
            flags: flagsObject
        };

        const createdEffects = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        if (createdEffects && createdEffects.length > 0) {
            console.log(`[DEBUG] Effect "${effectName}" added to ${actor.name}`);
            return createdEffects[0];
        }

        return null;
    } catch (error) {
        console.error(`Error adding effect "${effectName}" to ${actor.name}:`, error);
        return null;
    }
}

/**
 * Removes an active effect from an actor by name
 * @param {Actor} actor - The actor to remove the effect from
 * @param {string} effectName - Name of the effect to remove
 * @returns {Promise<boolean>} True if effect was found and removed, false otherwise
 */
async function removeActiveEffectByName(actor, effectName) {
    try {
        const existingEffect = actor.effects.find(e => e.name === effectName);

        if (!existingEffect) {
            console.log(`[DEBUG] Effect "${effectName}" not found on ${actor.name}`);
            return false;
        }

        await actor.deleteEmbeddedDocuments("ActiveEffect", [existingEffect.id]);
        console.log(`[DEBUG] Effect "${effectName}" removed from ${actor.name}`);
        return true;
    } catch (error) {
        console.error(`Error removing effect "${effectName}" from ${actor.name}:`, error);
        return false;
    }
}

/**
 * Checks if an actor has a specific active effect
 * @param {Actor} actor - The actor to check
 * @param {string} effectName - Name of the effect to check for
 * @returns {boolean} True if the effect exists on the actor
 */
function hasActiveEffect(actor, effectName) {
    return actor.effects.some(e => e.name === effectName);
}

/**
 * Gets an active effect from an actor by name
 * @param {Actor} actor - The actor to search
 * @param {string} effectName - Name of the effect to find
 * @returns {ActiveEffect|null} The effect if found, null otherwise
 */
function getActiveEffectByName(actor, effectName) {
    return actor.effects.find(e => e.name === effectName) || null;
}

/**
 * Toggles an active effect (adds if not present, removes if present)
 * @param {Actor} actor - The actor to toggle the effect on
 * @param {string} effectName - Name of the effect
 * @param {string} iconPath - Path to the effect icon (used when adding)
 * @param {Array} flags - Array of flag objects (used when adding)
 * @param {number} durationSeconds - Duration in seconds (used when adding)
 * @returns {Promise<string>} "added", "removed", or "error"
 */
async function toggleActiveEffect(actor, effectName, iconPath, flags = [], durationSeconds = 86400) {
    try {
        if (hasActiveEffect(actor, effectName)) {
            const removed = await removeActiveEffectByName(actor, effectName);
            return removed ? "removed" : "error";
        } else {
            const added = await addActiveEffect(actor, effectName, iconPath, flags, durationSeconds);
            return added ? "added" : "error";
        }
    } catch (error) {
        console.error(`Error toggling effect "${effectName}" on ${actor.name}:`, error);
        return "error";
    }
}

/**
 * Adds or updates the injuries effect on an actor
 * Specifically handles the "Blessures" effect with statusCounter for injury stacking
 * @param {Actor} actor - The actor to add injuries to
 * @param {string} injuryName - Name of the injury effect (default: "Blessures")
 * @param {string} iconPath - Icon path for the effect (default: "icons/svg/blood.svg")
 * @returns {Promise<boolean>} Success status
 */
async function addInjuries(actor, injuryName = "Blessures", iconPath = "icons/svg/blood.svg") {
    try {
        const existingEffect = actor.effects.find(e => e.name === injuryName);

        if (existingEffect) {
            // Update existing effect
            let currentValue = existingEffect.flags?.statuscounter?.value || 0;

            // If no statusCounter exists, initialize to 2 (1 existing + 1 new)
            if (!existingEffect.flags?.statuscounter?.value) {
                currentValue = 1; // Will be incremented to 2
            }

            await existingEffect.update({
                "flags.statuscounter.value": currentValue + 1
            });

            console.log(`[DEBUG] Updated ${injuryName} effect: ${currentValue + 1} stacks`);
            return true;
        } else {
            // Create new effect with statusCounter
            const injuryEffect = {
                name: injuryName,
                icon: iconPath,
                description: `Blessures subies (stack: 1)`,
                flags: {
                    statuscounter: {
                        value: 1
                    },
                    world: {
                        effectType: "injury",
                        createdAt: Date.now()
                    }
                }
            };

            await actor.createEmbeddedDocuments("ActiveEffect", [injuryEffect]);
            console.log(`[DEBUG] Created new ${injuryName} effect with 1 stack`);
            return true;
        }
    } catch (error) {
        console.error(`[ERROR] Failed to add ${injuryName} to ${actor.name}:`, error);
        return false;
    }
}

// === EXAMPLE USAGE ===

/*
// Example 1: Add a simple damage bonus effect
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
    await addActiveEffect(
        actor,
        "Red Eyes",
        "icons/creatures/eyes/humanoid-single-red-brown.webp",
        [
            { key: "damage", value: 2 },
            { key: "agilite", value: 1 }
        ],
        86400 // 24 hours
    );
    ui.notifications.info("Red Eyes effect added!");
}

// Example 2: Remove an effect by name
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
    const removed = await removeActiveEffectByName(actor, "Red Eyes");
    if (removed) {
        ui.notifications.info("Red Eyes effect removed!");
    } else {
        ui.notifications.warn("Red Eyes effect not found!");
    }
}

// Example 3: Check if effect exists
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
    if (hasActiveEffect(actor, "Red Eyes")) {
        console.log("Actor has Red Eyes effect");
    } else {
        console.log("Actor does not have Red Eyes effect");
    }
}

// Example 4: Toggle an effect
const actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
    const result = await toggleActiveEffect(
        actor,
        "Serpent",
        "icons/creatures/reptiles/snake-fangs-bite-green.webp",
        [{ key: "damage", value: 4 }]
    );

    if (result === "added") {
        ui.notifications.info("Serpent effect activated!");
    } else if (result === "removed") {
        ui.notifications.info("Serpent effect deactivated!");
    } else {
        ui.notifications.error("Error toggling Serpent effect!");
    }
}

// Example 5: Use in a spell macro
async function castEnhancementSpell() {
    const actor = canvas.tokens.controlled[0]?.actor;
    if (!actor) {
        ui.notifications.error("Select a token first!");
        return;
    }

    // Add multiple enhancement effects
    await addActiveEffect(actor, "Magical Enhancement", "icons/svg/aura.svg", [
        { key: "esprit", value: 2 },
        { key: "damage", value: 1 }
    ], 3600); // 1 hour

    await addActiveEffect(actor, "Agility Boost", "icons/svg/wing.svg", [
        { key: "agilite", value: 3 }
    ], 1800); // 30 minutes

    ui.notifications.info("Enhancement spells cast!");
}
*/
