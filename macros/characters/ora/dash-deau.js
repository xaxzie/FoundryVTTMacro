/**
 * Dash d'Eau - Ora (Maîtresse de l'Eau)
 *
 * Ora se déplace instantanément avec la fluidité de l'eau.
 * Déplacement rapide avec effet visuel aquatique simple.
 *
 * - Effet : Téléportation du lanceur
 * - Portée : Portée visuelle via Portal
 *
 * MÉCANIQUES :
 * - Utilise Portal pour sélectionner la destination
 * - Déplace physiquement le token d'Ora avec les outils FoundryVTT
 * - Animation d'eau unique entre départ et arrivée
 *
 * UTILISATION :
 * 1. Sélectionner le token d'Ora
 * 2. Lancer cette macro
 * 3. Utiliser Portal pour choisir la destination
 * 4. Ora se téléporte avec un jet d'eau
 */

(async () => {
    // ===== CONFIGURATION DES ANIMATIONS =====
    const ANIMATION_CONFIG = {
        // Animation de jet d'eau
        water: {
            file: "jb2a.water_bolt.blue", // Jet d'eau simple
            scale: 0.8,
            tint: "#00bfff" // Bleu aquatique
        },

        // Configuration Portal pour le ciblage
        portal: {
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
            label: "Destination du Dash"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le token d'Ora !");
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

            console.log(`[Ora] Portal position: ${position.x}, ${position.y}`);
            console.log(`[Ora] Target grid: ${targetGridX}, ${targetGridY}`);
            console.log(`[Ora] Snapped to grid: ${snappedX}, ${snappedY}`);

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
    // Note: Dash d'eau autorisé sur zone occupée (fluidité de l'eau)
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
        console.log(`[Ora] Dash d'eau sur zone occupée - ${tokensAtDestination.length} token(s) présent(s)`);
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

    console.log(`[Ora] Water dash from (${originalPosition.x}, ${originalPosition.y}) to (${destinationPosition.x}, ${destinationPosition.y})`);

    // ===== ANIMATION D'EAU =====
    async function playWaterAnimation() {
        const seq = new Sequence();

        // Animation de jet d'eau unique entre les positions
        seq.effect()
            .file(ANIMATION_CONFIG.water.file)
            .atLocation(originalCenter)
            .stretchTo(destinationCenter, { onlyX: false })
            .scale(ANIMATION_CONFIG.water.scale)
            .tint(ANIMATION_CONFIG.water.tint)
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

            console.log(`[Ora] Token successfully teleported to (${destinationPosition.x}, ${destinationPosition.y})`);
            return true;

        } catch (error) {
            console.error("[Ora] Error teleporting token:", error);
            ui.notifications.error("Échec du dash d'eau !");
            return false;
        }
    }

    // ===== EXÉCUTION DU DASH D'EAU =====
    // 1. Lancer l'animation d'eau
    const animationPromise = playWaterAnimation();

    // 2. Déplacer le token au milieu de l'animation d'eau
    setTimeout(async () => {
        await teleportToken();
    }, 400); // 400ms après le début (milieu de l'animation de 800ms)

    // 3. Attendre la fin de l'animation
    await animationPromise;

    console.log(`[Ora] Water dash completed successfully`);

})();