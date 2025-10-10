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

    // ===== DIAGNOSTIC DES PRIVILÈGES =====
    console.log(`[Moctei Helper] Diagnostic des privilèges:`);
    console.log(`[Moctei Helper] - Utilisateur actuel: ${game.user.name}`);
    console.log(`[Moctei Helper] - Est GM: ${game.user.isGM}`);
    console.log(`[Moctei Helper] - Peut modifier scene: ${game.user.can("TOKEN_UPDATE")}`);
    console.log(`[Moctei Helper] - Token ownership:`, targetToken.document.ownership);
    console.log(`[Moctei Helper] - Scene ownership:`, canvas.scene.ownership);
    console.log(`[Moctei Helper] - User permissions:`, game.user.permissions);

    // Vérifier si le token peut être modifié
    const canUpdate = targetToken.document.canUserModify(game.user, "update");
    console.log(`[Moctei Helper] - Peut modifier le token: ${canUpdate}`);

    if (!canUpdate && !game.user.isGM) {
        console.error(`[Moctei Helper] Privilèges insuffisants pour modifier le token`);
        return {
            success: false,
            error: `Privilèges insuffisants: utilisateur ${game.user.name} ne peut pas modifier le token ${targetToken.name}`
        };
    }

    // ===== EXÉCUTION DE LA TÉLÉPORTATION =====
    try {
        // Si on n'est pas GM et qu'on ne peut pas modifier le token, essayer une approche alternative
        if (!game.user.isGM && !canUpdate) {
            console.warn(`[Moctei Helper] Pas de privilèges GM, tentative via GM Socket ou Alternative`);

            // Essayer de trouver un GM actif et lui envoyer une demande
            const activeGM = game.users.activeGM;
            if (activeGM && !activeGM.isSelf) {
                console.log(`[Moctei Helper] Envoi de requête au GM actif: ${activeGM.name}`);
                // Cette approche ne fonctionnera que si Advanced Macros traite correctement les queries
                return {
                    success: false,
                    error: `Macro non exécutée en tant que GM. GM actif: ${activeGM.name}, utilisateur actuel: ${game.user.name}`
                };
            }
        }

        // Sauvegarder le mode de déplacement actuel
        const originalMovementType = targetToken.document.movementAction || 'walk';

        console.log(`[Moctei Helper] Tentative de téléportation avec privilèges ${game.user.isGM ? 'GM' : 'joueur'}`);

        // Approche 1: Mise à jour standard du token
        try {
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

        } catch (updateError) {
            console.warn(`[Moctei Helper] Échec mise à jour standard, tentative alternative:`, updateError.message);

            // Approche 2: Mise à jour via la Scene si on a les permissions
            if (game.user.can("TOKEN_UPDATE")) {
                await canvas.scene.updateEmbeddedDocuments("Token", [{
                    _id: targetToken.id,
                    x: destinationX,
                    y: destinationY,
                    movementAction: CONST.TOKEN_MOVEMENT_TYPES.TELEPORT || 'blink'
                }]);

                // Restaurer le mode de déplacement
                setTimeout(async () => {
                    await canvas.scene.updateEmbeddedDocuments("Token", [{
                        _id: targetToken.id,
                        movementAction: originalMovementType
                    }]);
                }, 100);
            } else {
                throw updateError; // Re-lancer l'erreur originale
            }
        }

        const result = {
            success: true,
            message: "Téléportation d'allié réussie",
            tokenName: targetToken.name,
            tokenId: tokenId,
            position: { x: destinationX, y: destinationY },
            executedBy: game.user.name,
            executedAsGM: game.user.isGM,
            method: game.user.isGM ? "GM privileges" : "Alternative approach"
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
