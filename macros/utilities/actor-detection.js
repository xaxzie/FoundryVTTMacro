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
    if (!tolerance) {
        tolerance = canvas.grid.size; // Full grid size tolerance
    }

    console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
    console.log(`[DEBUG] Tolérance de détection: ${tolerance} (taille de grille: ${canvas.grid.size})`);

    // Find tokens at or near the target location
    const tokensAtLocation = canvas.tokens.placeables.filter(token => {
        // Calculate token center coordinates (token.x and token.y are top-left corner)
        // Most tokens are 1x1 grid unit, so center is at +50 pixels (half grid size)
        const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
        const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;

        const tokenDistance = Math.sqrt(
            Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
        );

        console.log(`[DEBUG] Token "${token.name}" à distance ${tokenDistance} (centre: x=${tokenCenterX}, y=${tokenCenterY}, coin: x=${token.x}, y=${token.y}, taille: ${token.document.width}x${token.document.height} grid)`);
        return tokenDistance <= tolerance;
    });

    console.log(`[DEBUG] Nombre de tokens trouvés dans la zone: ${tokensAtLocation.length}`);

    if (tokensAtLocation.length === 0) {
        console.log(`[DEBUG] Aucun token trouvé à la position cible`);
        return null;
    }

    // Get the first token found
    const targetToken = tokensAtLocation[0];
    const targetActor = targetToken.actor;

    console.log(`[DEBUG] Token sélectionné: "${targetToken.name}" (ID: ${targetToken.id})`);
    console.log(`[DEBUG] Actor du token:`, targetActor ? `"${targetActor.name}" (ID: ${targetActor.id})` : "null");

    if (!targetActor) {
        console.log(`[DEBUG] Aucun acteur associé au token`);
        return null;
    }

    // Check if the actor is visible/owned by the current user
    const isOwner = targetActor.isOwner;
    const isVisible = targetToken.visible;
    const isGM = game.user.isGM;

    console.log(`[DEBUG] Permissions - isOwner: ${isOwner}, isVisible: ${isVisible}, isGM: ${isGM}`);
    console.log(`[DEBUG] Utilisateur actuel: "${game.user.name}" (ID: ${game.user.id})`);

    if (isOwner || isVisible || isGM) {
        console.log(`[DEBUG] Accès autorisé - retour du nom réel: "${targetActor.name}"`);
        return {
            name: targetActor.name,
            token: targetToken,
            actor: targetActor
        };
    } else {
        console.log(`[DEBUG] Accès refusé - retour de "cible"`);
        return {
            name: "cible",
            token: targetToken,
            actor: targetActor
        };
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
