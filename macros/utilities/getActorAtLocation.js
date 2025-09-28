/**
 * getActorAtLocation.js
 *
 * Reference utility for FoundryVTT macros: a robust helper to detect a Token/Actor
 * near a canvas coordinate (typically obtained from a targeting tool like Portal).
 *
 * Purpose:
 * - Keep a single, well-documented reference implementation here for macro authors
 * - Do NOT import this automatically in macros (macros should remain independent)
 * - Copy & paste the function below into any macro that needs it, or use it as a
 *   starting point for a shared module if you later decide to centralize utilities
 *
 * Behavior:
 * - Searches through `canvas.tokens.placeables` and finds tokens whose center
 *   lies within a configurable tolerance of the target coordinates.
 * - Uses token.document.width/height (in grid units) and canvas.grid.size to compute
 *   accurate pixel centers. (token.x/y are the top-left corner in pixels.)
 * - Returns an object with { name, token, actor } or null if nothing found.
 * - Respects visibility/ownership: if the actor is not owned and token is not visible
 *   and the current user is not GM, the returned name will be the generic string
 *   "cible" to avoid leaking hidden actor names. Debug logging is in French to match
 *   the project's localization.
 *
 * Usage (recommended):
 * - Copy the function source into your macro (keeps macros independent).
 * - Example: const actorInfo = getActorAtLocation(x, y); if(actorInfo) console.log(actorInfo.name);
 *
 * NOTE: This file is a repository reference only. Foundry macros run in the browser
 * and can't reliably import local repository files without bundling or module setup.
 */

/**
 * Find an actor/token near the given canvas pixel coordinates.
 * @param {number} targetX - X coordinate in canvas pixels
 * @param {number} targetY - Y coordinate in canvas pixels
 * @param {object} [opts] - Optional settings
 * @param {number} [opts.tolerance] - Pixel tolerance radius (default: canvas.grid.size)
 * @returns {{name:string, token:Token, actor:Actor}|null}
 */
function getActorAtLocation(targetX, targetY, opts = {}) {
    console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);

    if (typeof canvas === 'undefined' || !canvas.tokens) {
        console.warn('[getActorAtLocation] Canvas non disponible. Exécution hors Foundry?');
        return null;
    }

    const tolerance = (typeof opts.tolerance === 'number') ? opts.tolerance : canvas.grid.size;
    console.log(`[DEBUG] Tolérance de détection: ${tolerance} (taille de grille: ${canvas.grid.size})`);

    // Find tokens at or near the target location
    const tokensAtLocation = canvas.tokens.placeables.filter(token => {
        try {
            // token.x and token.y are the top-left corner in pixels
            // token.document.width/height are in grid units -> convert to pixels
            const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
            const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;

            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
            );
            console.log(`[DEBUG] Token "${token.name}" à distance ${tokenDistance} (centre: x=${tokenCenterX}, y=${tokenCenterY}, coin: x=${token.x}, y=${token.y}, taille: ${token.document.width}x${token.document.height} grid)`);
            return tokenDistance <= tolerance;
        } catch (err) {
            console.warn('[getActorAtLocation] Erreur en évaluant un token:', err);
            return false;
        }
    });

    console.log(`[DEBUG] Nombre de tokens trouvés dans la zone: ${tokensAtLocation.length}`);

    if (tokensAtLocation.length === 0) {
        console.log(`[DEBUG] Aucun token trouvé à la position cible`);
        return null;
    }

    // If multiple tokens are found, pick the nearest one for predictability
    let nearest = null;
    let nearestDistance = Infinity;
    for (const token of tokensAtLocation) {
        const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
        const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;
        const d = Math.hypot(tokenCenterX - targetX, tokenCenterY - targetY);
        if (d < nearestDistance) {
            nearestDistance = d;
            nearest = token;
        }
    }

    const targetToken = nearest;
    const targetActor = targetToken?.actor || null;

    console.log(`[DEBUG] Token sélectionné: "${targetToken.name}" (ID: ${targetToken.id})`);
    console.log(`[DEBUG] Actor du token:`, targetActor ? `"${targetActor.name}" (ID: ${targetActor.id})` : "null");

    if (!targetActor) {
        console.log(`[DEBUG] Aucun acteur associé au token`);
        return null;
    }

    // Check if the actor is visible/owned by the current user
    const isOwner = !!targetActor.isOwner;
    const isVisible = !!targetToken.visible;
    const isGM = !!game.user?.isGM;

    console.log(`[DEBUG] Permissions - isOwner: ${isOwner}, isVisible: ${isVisible}, isGM: ${isGM}`);
    console.log(`[DEBUG] Utilisateur actuel: "${game.user?.name}" (ID: ${game.user?.id})`);

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

// Export for project-level usage/reference. Many macros in Foundry run as simple snippets
// and won't import this file; prefer copying the function into each macro when needed.
if (typeof module !== 'undefined' && module.exports) module.exports = { getActorAtLocation };
export { getActorAtLocation };

// End of file
