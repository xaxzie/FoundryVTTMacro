/**
 * Dash Électrique - Leo (Maître de la Foudre)
 *
 * Leo se déplace instantanément avec la vitesse de l'éclair.
 * Déplacement rapide avec effet visuel électrique simple.
 *
 * - Effet : Téléportation du lanceur
 * - Portée : Portée visuelle via Portal
 *
 * MÉCANIQUES :
 * - Utilise Portal pour sélectionner la destination
 * - Déplace physiquement le token de Leo avec les outils FoundryVTT
 * - Animation d'éclair unique entre départ et arrivée
 *
 * UTILISATION :
 * 1. Sélectionner le token de Leo
 * 2. Lancer cette macro
 * 3. Utiliser Portal pour choisir la destination
 * 4. Leo se téléporte avec un éclair
 */

(async () => {
    // ===== CONFIGURATION DES ANIMATIONS =====
    const ANIMATION_CONFIG = {
        // Animation d'éclair électrique
        lightning: {
            file: "jb2a.chain_lightning.secondary.blue", // Éclair simple
            scale: 0.8,
            tint: "#00bfff" // Bleu électrique
        },

        // Configuration Portal pour le ciblage
        portal: {
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
            label: "Destination du Dash"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le token de Leo !");
        return;
    }

    const casterToken = canvas.tokens.controlled[0];
    const actor = casterToken.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== SÉLECTION DE DESTINATION AVEC PORTAL =====
    async function selectTeleportDestination() {
        try {
            const position = await window.Sequencer.Crosshair.show({
                size: canvas.grid.size,
                icon: ANIMATION_CONFIG.portal.texture,
                label: ANIMATION_CONFIG.portal.label,
                labelOffset: { y: -40 },
                drawIcon: true,
                drawOutline: true,
                interval: -1,
                fillAlpha: 0.25,
                tileTexture: false,
                lockSize: true,
                rememberControlledTokens: false,
                drawBoundingBox: false
            });

            // Aligner les coordonnées sur la grille pour un placement correct
            const gridSize = canvas.grid.size;
            const targetGridX = Math.floor(position.x / gridSize);
            const targetGridY = Math.floor(position.y / gridSize);
            const snappedX = targetGridX * gridSize;
            const snappedY = targetGridY * gridSize;

            console.log(`[Leo] Portal position: ${position.x}, ${position.y}`);
            console.log(`[Leo] Target grid: ${targetGridX}, ${targetGridY}`);
            console.log(`[Leo] Snapped to grid: ${snappedX}, ${snappedY}`);

            return { x: snappedX, y: snappedY };
        } catch (error) {
            console.error("Portal selection error:", error);
            return null;
        }
    }

    const destinationPosition = await selectTeleportDestination();
    if (!destinationPosition) {
        return;
    }

    // ===== VÉRIFICATION DE LA DESTINATION =====
    // Note: Dash électrique autorisé sur zone occupée (vitesse de l'éclair)
    const gridSize = canvas.grid.size;
    const tokensAtDestination = canvas.tokens.placeables.filter(token => {
        if (token.id === casterToken.id) return false; // Ignorer le lanceur

        // Vérifier si le token occupe la case de destination
        const tokenGridX = Math.floor(token.document.x / gridSize);
        const tokenGridY = Math.floor(token.document.y / gridSize);
        const destGridX = Math.floor(destinationPosition.x / gridSize);
        const destGridY = Math.floor(destinationPosition.y / gridSize);

        return tokenGridX === destGridX && tokenGridY === destGridY;
    });

    if (tokensAtDestination.length > 0) {
        console.log(`[Leo] Dash électrique sur zone occupée - ${tokensAtDestination.length} token(s) présent(s)`);
    }

    // ===== STOCKAGE DE LA POSITION ORIGINALE =====
    const originalPosition = {
        x: casterToken.document.x,
        y: casterToken.document.y
    };

    // Centrer les animations au milieu des cases
    const originalCenter = {
        x: originalPosition.x + (gridSize / 2),
        y: originalPosition.y + (gridSize / 2)
    };

    const destinationCenter = {
        x: destinationPosition.x + (gridSize / 2),
        y: destinationPosition.y + (gridSize / 2)
    };

    console.log(`[Leo] Electric dash from (${originalPosition.x}, ${originalPosition.y}) to (${destinationPosition.x}, ${destinationPosition.y})`);

    // ===== ANIMATION D'ÉCLAIR =====
    async function playLightningAnimation() {
        const seq = new Sequence();

        // Animation d'éclair unique entre les positions
        seq.effect()
            .file(ANIMATION_CONFIG.lightning.file)
            .atLocation(originalCenter)
            .stretchTo(destinationCenter, { onlyX: false })
            .scale(ANIMATION_CONFIG.lightning.scale)
            .tint(ANIMATION_CONFIG.lightning.tint)
            .duration(800); // Durée courte pour un effet rapide

        // Jouer l'animation
        await seq.play();
    }

    // ===== DÉPLACEMENT DU TOKEN =====
    async function teleportToken() {
        try {
            // Sauvegarder le mode de déplacement actuel
            const originalMovementType = casterToken.document.movementAction;

            // Activer le mode de déplacement "Teleportation" de FoundryVTT v13
            await casterToken.document.update({ movementAction: 'blink' });

            // Effectuer le déplacement avec le mode téléportation
            const updates = {
                x: destinationPosition.x,
                y: destinationPosition.y
            };

            // Mettre à jour la position du token via le document
            await casterToken.document.update(updates);

            // Restaurer le mode de déplacement original
            await casterToken.document.update({ movementAction: originalMovementType });

            console.log(`[Leo] Token successfully teleported to (${destinationPosition.x}, ${destinationPosition.y})`);
            return true;

        } catch (error) {
            console.error("[Leo] Error teleporting token:", error);
            ui.notifications.error("Échec du dash électrique !");
            return false;
        }
    }

    // ===== EXÉCUTION DU DASH ÉLECTRIQUE =====
    // 1. Lancer l'animation d'éclair
    const animationPromise = playLightningAnimation();

    // 2. Déplacer le token au milieu de l'animation d'éclair
    setTimeout(async () => {
        await teleportToken();
    }, 400); // 400ms après le début (milieu de l'animation de 800ms)

    // 3. Attendre la fin de l'animation
    await animationPromise;

    console.log(`[Leo] Electric dash completed successfully`);

})();
