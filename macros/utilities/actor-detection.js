/**
 * Actor Detection Utility
 *
 * Standalone functions for detecting actors at target locations.
 * Copy these functions into your spell macros for finding targets.
 *
 * Usage: Copy the needed detection function(s) into your spell macro
 */

/**
 * Finds an actor at a specific location with tolerance
 * @param {number} targetX - Target X coordinate
 * @param {number} targetY - Target Y coordinate
 * @param {number} tolerance - Detection tolerance in pixels (default: canvas.grid.size)
 * @returns {Object|null} Actor info object or null if none found
 */
function getActorAtLocation(targetX, targetY, tolerance = null) {
    const gridSize = canvas.grid.size;
    if (!tolerance) {
        tolerance = gridSize; // Full grid size tolerance
    }

    console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
    console.log(`[DEBUG] Tolérance de détection: ${tolerance} (taille de grille: ${gridSize})`);

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
                        console.log(`[DEBUG] Token "${token.name}" trouvé en grid (${targetGridX}, ${targetGridY})`);
                        return true;
                    }
                }
            }
            return false;
        });

        console.log(`[DEBUG] Nombre de tokens trouvés dans la zone (grid): ${tokensAtLocation.length}`);

        if (tokensAtLocation.length === 0) {
            console.log(`[DEBUG] Aucun token trouvé à la position cible (grid)`);
            return null;
        }

        const targetToken = tokensAtLocation[0];
        const targetActor = targetToken.actor;

        console.log(`[DEBUG] Token sélectionné: "${targetToken.name}" (ID: ${targetToken.id})`);
        console.log(`[DEBUG] Actor du token:`, targetActor ? `"${targetActor.name}" (ID: ${targetActor.id})` : "null");

        if (!targetActor) {
            console.log(`[DEBUG] Aucun acteur associé au token`);
            return null;
        }

        // Tokens are already filtered for visibility
        console.log(`[DEBUG] Retour de l'acteur visible: "${targetActor.name}"`);
        return { name: targetActor.name, token: targetToken, actor: targetActor };
    } else {
        // No grid: use circular tolerance detection (original behavior)
        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            // First check if the token is visible to the current user
            const isOwner = token.actor?.isOwner;
            const isVisible = token.visible;
            const isGM = game.user.isGM;

            // Skip tokens that aren't visible to the current user
            if (!isOwner && !isVisible && !isGM) {
                return false;
            }

            // Calculate token center coordinates (token.x and token.y are top-left corner)
            const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
            const tokenCenterY = token.y + (token.document.height * gridSize) / 2;

            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
            );

            console.log(`[DEBUG] Token "${token.name}" à distance ${tokenDistance} (centre: x=${tokenCenterX}, y=${tokenCenterY})`);
            return tokenDistance <= tolerance;
        });

        console.log(`[DEBUG] Nombre de tokens trouvés dans la zone: ${tokensAtLocation.length}`);

        if (tokensAtLocation.length === 0) {
            console.log(`[DEBUG] Aucun token trouvé à la position cible`);
            return null;
        }

        const targetToken = tokensAtLocation[0];
        const targetActor = targetToken.actor;

        console.log(`[DEBUG] Token sélectionné: "${targetToken.name}" (ID: ${targetToken.id})`);
        console.log(`[DEBUG] Actor du token:`, targetActor ? `"${targetActor.name}" (ID: ${targetActor.id})` : "null");

        if (!targetActor) {
            console.log(`[DEBUG] Aucun acteur associé au token`);
            return null;
        }

        // Tokens are already filtered for visibility
        console.log(`[DEBUG] Retour de l'acteur visible: "${targetActor.name}"`);
        return { name: targetActor.name, token: targetToken, actor: targetActor };
    }
}

/**
 * Gets actors at multiple target locations
 * @param {Array} targetLocations - Array of {x, y} target locations
 * @param {number} tolerance - Detection tolerance in pixels (default: canvas.grid.size)
 * @returns {Array} Array of actor info objects (null entries for locations with no actors)
 */
function getActorsAtLocations(targetLocations, tolerance = null) {
    const targetActors = [];

    for (let i = 0; i < targetLocations.length; i++) {
        console.log(`[DEBUG] Analyse de la cible ${i + 1}: x=${targetLocations[i].x}, y=${targetLocations[i].y}`);
        const actorInfo = getActorAtLocation(targetLocations[i].x, targetLocations[i].y, tolerance);
        console.log(`[DEBUG] Résultat pour cible ${i + 1}:`, actorInfo);
        targetActors.push(actorInfo);
    }

    console.log(`[DEBUG] Liste finale des acteurs cibles:`, targetActors);
    return targetActors;
}

/**
 * Checks if there's an actor at the target location (simple boolean check)
 * @param {number} targetX - Target X coordinate
 * @param {number} targetY - Target Y coordinate
 * @param {number} tolerance - Detection tolerance in pixels (default: canvas.grid.size)
 * @returns {boolean} True if actor found, false otherwise
 */
function hasActorAtLocation(targetX, targetY, tolerance = null) {
    const actorInfo = getActorAtLocation(targetX, targetY, tolerance);
    return actorInfo !== null;
}

/**
 * Gets the nearest actor to a target location
 * @param {number} targetX - Target X coordinate
 * @param {number} targetY - Target Y coordinate
 * @param {number} maxRange - Maximum search range in pixels (default: canvas.grid.size * 2)
 * @returns {Object|null} Nearest actor info with distance, or null if none found
 */
function getNearestActorToLocation(targetX, targetY, maxRange = null) {
    if (!maxRange) {
        maxRange = canvas.grid.size * 2; // Search within 2 grid squares
    }

    let nearestActor = null;
    let nearestDistance = Infinity;

    canvas.tokens.placeables.forEach(token => {
        const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
        const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;

        const distance = Math.sqrt(
            Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
        );

        if (distance <= maxRange && distance < nearestDistance && token.actor) {
            nearestDistance = distance;
            nearestActor = {
                name: token.actor.name,
                token: token,
                actor: token.actor,
                distance: distance
            };
        }
    });

    return nearestActor;
}

/**
 * Gets display name for target (handles visibility permissions)
 * @param {Object|null} actorInfo - Actor info object from getActorAtLocation
 * @param {string} fallbackName - Name to use if no actor found (default: "cible")
 * @returns {string} Display name for the target
 */
function getTargetDisplayName(actorInfo, fallbackName = "cible") {
    if (!actorInfo) {
        return fallbackName;
    }
    return actorInfo.name;
}

/**
 * Formats multiple target names for display
 * @param {Array} targetActors - Array of actor info objects
 * @param {string} separator - Separator between names (default: " et ")
 * @param {string} fallbackName - Name to use for empty targets (default: "cible")
 * @returns {string} Formatted target names string
 */
function formatMultipleTargetNames(targetActors, separator = " et ", fallbackName = "cible") {
    const names = targetActors.map(actorInfo => getTargetDisplayName(actorInfo, fallbackName));
    return names.join(separator);
}

// Example usage in a spell macro:
/*
// Single target detection
const target = await selectSingleTarget(caster);
if (!target) return;

const actorInfo = getActorAtLocation(target.x, target.y);
const targetName = getTargetDisplayName(actorInfo, "unknown target");
console.log(`Targeting: ${targetName}`);

// Multiple targets
const targets = await selectMultipleTargets(caster, 2);
if (targets.length === 0) return;

const targetActors = getActorsAtLocations(targets);
const targetNames = formatMultipleTargetNames(targetActors);
console.log(`Targeting: ${targetNames}`);

// Check if location has an actor before casting
if (!hasActorAtLocation(target.x, target.y)) {
    ui.notifications.warn("No target found at that location!");
    return;
}
*/

/**
 * Example: Apply an Active Effect to a targeted actor using GM delegation (socketlib)
 *
 * This function uses socketlib to request the GM to apply an Active Effect to a token/actor
 * when the player does not have permission. Requires socketlib and GM socket handlers.
 *
 * Usage in macro:
 *   await applyEffectWithGMDelegation(targetActor, effectData);
 *
 * @param {Actor} targetActor - The actor to apply the effect to
 * @param {Object} effectData - The Active Effect data object
 * @returns {Promise}
 */
async function applyEffectWithGMDelegation(targetActor, effectData) {
    if (!targetActor || !effectData) return;
    if (targetActor.isOwner) {
        // Directly apply if user has permission
        await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    } else {
        // Use socketlib to request GM to apply effect
        if (!game.modules.get("socketlib")?.active) {
            ui.notifications.error("Socketlib module is required for GM delegation.");
            return;
        }
        await game.socket.emit("module.socketlib", {
            type: "executeAsGM",
            function: "macro.applyEffectToActor",
            args: [targetActor.id, effectData]
        });
    }
}

/**
 * Example: Update an existing Active Effect using GM delegation (socketlib)
 *
 * This function uses socketlib to request the GM to update an Active Effect on a token/actor
 * when the player does not have permission. Requires socketlib and GM socket handlers.
 *
 * Usage in macro:
 *   await updateEffectWithGMDelegation(targetActor, effectId, updateData);
 *
 * @param {Actor} targetActor - The actor whose effect should be updated
 * @param {string} effectId - The ID of the effect to update
 * @param {Object} updateData - The update data for the effect
 * @returns {Promise}
 */
async function updateEffectWithGMDelegation(targetActor, effectId, updateData) {
    if (!targetActor || !effectId || !updateData) return;
    if (targetActor.isOwner) {
        // Directly update if user has permission
        const effect = targetActor.effects.get(effectId);
        if (effect) await effect.update(updateData);
    } else {
        // Use socketlib to request GM to update effect
        if (!game.modules.get("socketlib")?.active) {
            ui.notifications.error("Socketlib module is required for GM delegation.");
            return;
        }
        await game.socket.emit("module.socketlib", {
            type: "executeAsGM",
            function: "macro.updateEffectOnActor",
            args: [targetActor.id, effectId, updateData]
        });
    }
}

/*
// GM Socket Handlers Setup:
// Socket handlers are automatically registered by the custom-status-effects module
// when a GM loads the world. The handlers are:
// - applyEffectToActor: Creates new Active Effects
// - updateEffectOnActor: Updates existing Active Effects
// - removeEffectFromActor: Removes Active Effects
//
// No manual setup required - just ensure custom-status-effects module is enabled.
*/
