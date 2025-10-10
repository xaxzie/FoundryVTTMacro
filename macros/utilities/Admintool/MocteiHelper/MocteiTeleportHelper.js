/**
 * Moctei Teleport Helper - Macro GM pour téléportation d'alliés
 *
 * Cette macro est configurée pour s'exécuter avec privilèges GM via Advanced Macros.
 * Elle permet à Moctei de téléporter des tokens d'alliés qu'il ne possède pas.
 *
 * CONFIGURATION REQUISE DANS FOUNDRY :
 * - Type: Script
 * - Flags: advanced-macros.runForSpecificUser = "GM"
 * - Permissions: LIMITED pour les joueurs
 *
 * UTILISATION :
 * - Appelée automatiquement par la macro transport-dans-lombre.js
 * - Reçoit les arguments via l'objet scope de la macro execute()
 */

(async () => {
    // ===== RÉCUPÉRATION DES ARGUMENTS =====
    // Dans Advanced Macros, les arguments sont passés via l'objet scope
    // fourni lors de l'appel à macro.execute(scope)

    let tokenId, destinationX, destinationY;

    // Vérifier plusieurs sources possibles pour les arguments
    if (typeof args !== 'undefined' && args && args.length > 0) {
        // Si args est défini (mode standard)
        ({ tokenId, destinationX, destinationY } = args[0]);
    } else if (typeof scope !== 'undefined' && scope) {
        // Si scope est défini (Advanced Macros)
        ({ tokenId, destinationX, destinationY } = scope);
    } else {
        // Derniers recours : variables globales ou arguments directs
        if (typeof tokenId === 'undefined') {
            console.error("[Moctei Helper] Aucun argument fourni pour la téléportation");
            return {
                success: false,
                error: "Arguments manquants (tokenId, destinationX, destinationY)"
            };
        }
    }

    // ===== VALIDATION DES ARGUMENTS =====
    if (!tokenId || destinationX === undefined || destinationY === undefined) {
        console.error("[Moctei Helper] Arguments invalides:", { tokenId, destinationX, destinationY });
        return {
            success: false,
            error: `Arguments invalides: tokenId=${tokenId}, destX=${destinationX}, destY=${destinationY}`
        };
    }

    // ===== RÉCUPÉRATION DU TOKEN =====
    const targetToken = canvas.tokens.get(tokenId);
    if (!targetToken) {
        console.error(`[Moctei Helper] Token non trouvé: ${tokenId}`);
        return {
            success: false,
            error: `Token non trouvé: ${tokenId}`
        };
    }

    console.log(`[Moctei Helper] Téléportation de ${targetToken.name} vers (${destinationX}, ${destinationY})`);

    // ===== EXÉCUTION DE LA TÉLÉPORTATION =====
    try {
        // Sauvegarder le mode de déplacement actuel
        const originalMovementType = targetToken.document.movementAction || 'walk';

        // Activer le mode de déplacement "Teleportation" (FoundryVTT v13)
        await targetToken.document.update({
            movementAction: CONST.TOKEN_MOVEMENT_TYPES.TELEPORT || 'blink'
        });

        // Effectuer le déplacement
        await targetToken.document.update({
            x: destinationX,
            y: destinationY
        });

        // Restaurer le mode de déplacement original
        await targetToken.document.update({
            movementAction: originalMovementType
        });

        const result = {
            success: true,
            message: "Téléportation d'allié réussie",
            tokenName: targetToken.name,
            tokenId: tokenId,
            position: { x: destinationX, y: destinationY },
            executedBy: game.user.name,
            executedAsGM: game.user.isGM
        };

        console.log("[Moctei Helper] Téléportation réussie:", result);
        return result;

    } catch (err) {
        const errorResult = {
            success: false,
            error: err.message,
            tokenName: targetToken.name,
            tokenId: tokenId
        };

        console.error("[Moctei Helper] Erreur téléportation:", errorResult);
        return errorResult;
    }

})();
