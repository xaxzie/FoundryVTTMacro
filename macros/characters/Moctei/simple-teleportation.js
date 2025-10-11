/**
 * Téléportation dans l'ombre - Moctei (Mage des Ombres)
 *
 * Moctei se téléporte dans le dos de son adversaire en utilisant les ombres.
 * Déplacement instantané avec effet visuel de téléportation sombre.
 *
 * - Coût : 5 points de mana (focalisable)
 * - Niveau de sort : 1
 * - Effet : Téléportation du lanceur
 * - Cible : Un seul adversaire (pour référence de positionnement)
 * - Portée : Portée visuelle via Portal
 *
 * MÉCANIQUES :
 * - Utilise Portal pour sélectionner la destination
 * - Déplace physiquement le token de Moctei avec les outils FoundryVTT
 * - Animation de départ (misty step purple)
 * - Animation de projectile entre départ et arrivée
 * - Animation d'arrivée (misty step purple)
 *
 * UTILISATION :
 * 1. Sélectionner le token de Moctei
 * 2. Lancer cette macro
 * 3. Utiliser Portal pour choisir la destination
 * 4. Moctei se téléporte avec les effets visuels appropriés
 */

(async () => {
    // ===== CONFIGURATION DES ANIMATIONS =====
    const ANIMATION_CONFIG = {
        // Animation de téléportation
        departure: {
            file: "jb2a_patreon.misty_step.01.purple",
            scale: 0.8,
            duration: 1500,
            fadeIn: 300,
            fadeOut: 500
        },
        projectile: {
            file: "jb2a.energy_strands.range.standard.purple.03",
            scale: 0.6,
            tint: "#2e0054"
        },
        arrival: {
            file: "jb2a_patreon.misty_step.01.purple",
            scale: 0.8,
            duration: 1500,
            fadeIn: 300,
            fadeOut: 500
        },

        // Configuration Portal pour le ciblage
        portal: {
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm",
            label: "Destination de la Téléportation"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le token de Moctei !");
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

            console.log(`[Moctei] Portal position: ${position.x}, ${position.y}`);
            console.log(`[Moctei] Target grid: ${targetGridX}, ${targetGridY}`);
            console.log(`[Moctei] Snapped to grid: ${snappedX}, ${snappedY}`);

            return { x: snappedX, y: snappedY };
        } catch (error) {
            console.error("Portal selection error:", error);
            return null;
        }
    }

    const destinationPosition = await selectTeleportDestination();
    if (!destinationPosition) {
        ui.notifications.info('Téléportation annulée - aucune destination sélectionnée.');
        return;
    }

    // ===== VÉRIFICATION DE LA DESTINATION =====
    // Vérifier si la destination est libre (pas d'autres tokens)
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
        ui.notifications.warn("Impossible de se téléporter : la destination est occupée !");
        return;
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

    console.log(`[Moctei] Teleporting from (${originalPosition.x}, ${originalPosition.y}) to (${destinationPosition.x}, ${destinationPosition.y})`);

    // ===== ANIMATION DE TÉLÉPORTATION COMPLÈTE =====
    async function playTeleportationAnimation() {
        const seq = new Sequence();

        // 1. Animation de départ
        seq.effect()
            .file(ANIMATION_CONFIG.departure.file)
            .atLocation(originalCenter)
            .scale(ANIMATION_CONFIG.departure.scale)
            .duration(ANIMATION_CONFIG.departure.duration)
            .fadeIn(ANIMATION_CONFIG.departure.fadeIn)
            .fadeOut(ANIMATION_CONFIG.departure.fadeOut)
            .waitUntilFinished(-800); // Continue avant la fin pour enchaîner

        // 2. Animation de projectile (énergie d'ombre entre les positions)
        seq.effect()
            .file(ANIMATION_CONFIG.projectile.file)
            .atLocation(originalCenter)
            .stretchTo(destinationCenter, { onlyX: false })
            .scale(ANIMATION_CONFIG.projectile.scale)
            .tint(ANIMATION_CONFIG.projectile.tint)
            .duration(1200) // Durée fixe pour le projectile
            .waitUntilFinished(-600); // Continue avant la fin

        // 3. Animation d'arrivée
        seq.effect()
            .file(ANIMATION_CONFIG.arrival.file)
            .atLocation(destinationCenter)
            .scale(ANIMATION_CONFIG.arrival.scale)
            .duration(ANIMATION_CONFIG.arrival.duration)
            .fadeIn(ANIMATION_CONFIG.arrival.fadeIn)
            .fadeOut(ANIMATION_CONFIG.arrival.fadeOut);

        // Jouer toute la séquence
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

            console.log(`[Moctei] Token successfully teleported to (${destinationPosition.x}, ${destinationPosition.y})`);
            return true;

        } catch (error) {
            console.error("[Moctei] Error teleporting token:", error);
            ui.notifications.error("Échec de la téléportation !");
            return false;
        }
    }

    // ===== EXÉCUTION DE LA TÉLÉPORTATION =====
    // 1. Lancer l'animation de téléportation (départ + projectile + arrivée)
    const animationPromise = playTeleportationAnimation();

    // 2. Déplacer le token au moment approprié (pendant l'animation de projectile)
    setTimeout(async () => {
        await teleportToken();
    }, 1000); // 1 seconde après le début (pendant l'animation de projectile)

    // 3. Attendre la fin de toutes les animations
    await animationPromise;

    console.log(`[Moctei] Shadow teleportation completed successfully`);

})();
