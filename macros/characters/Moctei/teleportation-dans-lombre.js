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
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Téléportation dans l'ombre",
        manaCost: 5,
        spellLevel: 1,
        isFocusable: true, // Focalisable

        // Animation de téléportation
        teleportation: {
            departure: {
                file: "jb2a_patreon.misty_step.01.purple", // Animation de départ
                scale: 0.8,
                duration: 1500,
                fadeIn: 300,
                fadeOut: 500
            },
            projectile: {
                file: "jb2a.energy_beam.normal.purple.03", // Projectile d'ombre entre les positions
                scale: 0.6,
                speed: 1500, // Vitesse du projectile
                tint: "#2e0054"
            },
            arrival: {
                file: "jb2a_patreon.misty_step.01.purple", // Animation d'arrivée
                scale: 0.8,
                duration: 1500,
                fadeIn: 300,
                fadeOut: 500
            }
        },

        // Configuration Portal pour le ciblage
        portal: {
            range: 300, // Portée maximale pour la téléportation
            color: "#2e0054", // Couleur violet sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm",
            label: "Destination de la Téléportation"
        },

        // Sons (optionnel)
        sounds: {
            departure: null, // Son de départ
            projectile: null, // Son du projectile d'ombre
            arrival: null // Son d'arrivée
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

    // ===== UTILS (stance, validation) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    const currentStance = getCurrentStance(actor);

    // Modifier le coût selon la focalisation (si applicable)
    let actualManaCost = SPELL_CONFIG.manaCost;
    if (SPELL_CONFIG.isFocusable && currentStance === 'focus') {
        actualManaCost = Math.max(1, Math.floor(SPELL_CONFIG.manaCost * 0.75)); // Réduction de 25%
    }

    // ===== SÉLECTION DE DESTINATION AVEC PORTAL =====
    async function selectTeleportDestination() {
        try {
            const position = await window.Sequencer.Crosshair.show({
                size: canvas.grid.size,
                icon: SPELL_CONFIG.portal.texture,
                label: SPELL_CONFIG.portal.label,
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
            .file(SPELL_CONFIG.teleportation.departure.file)
            .atLocation(originalCenter)
            .scale(SPELL_CONFIG.teleportation.departure.scale)
            .duration(SPELL_CONFIG.teleportation.departure.duration)
            .fadeIn(SPELL_CONFIG.teleportation.departure.fadeIn)
            .fadeOut(SPELL_CONFIG.teleportation.departure.fadeOut)
            .waitUntilFinished(-800); // Continue avant la fin pour enchaîner

        // 2. Animation de projectile (énergie d'ombre entre les positions)
        seq.effect()
            .file(SPELL_CONFIG.teleportation.projectile.file)
            .atLocation(originalCenter)
            .stretchTo(destinationCenter, { onlyX: false })
            .scale(SPELL_CONFIG.teleportation.projectile.scale)
            .tint(SPELL_CONFIG.teleportation.projectile.tint)
            .duration(1200) // Durée fixe pour le projectile
            .waitUntilFinished(-600); // Continue avant la fin

        // 3. Animation d'arrivée
        seq.effect()
            .file(SPELL_CONFIG.teleportation.arrival.file)
            .atLocation(destinationCenter)
            .scale(SPELL_CONFIG.teleportation.arrival.scale)
            .duration(SPELL_CONFIG.teleportation.arrival.duration)
            .fadeIn(SPELL_CONFIG.teleportation.arrival.fadeIn)
            .fadeOut(SPELL_CONFIG.teleportation.arrival.fadeOut);

        // Jouer toute la séquence
        await seq.play();
    }

    // ===== DÉPLACEMENT DU TOKEN =====
    async function teleportToken() {
        try {
            // Utiliser les outils natifs de FoundryVTT v13 pour déplacer le token
            const updates = {
                x: destinationPosition.x,
                y: destinationPosition.y
            };

            // Mettre à jour la position du token via le document
            await casterToken.document.update(updates);

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

    // ===== MESSAGE DE CHAT =====
    function createChatMessage() {
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const focusInfo = (SPELL_CONFIG.isFocusable && currentStance === 'focus') ?
            ` ⚡ Focalisé (${SPELL_CONFIG.manaCost} → ${actualManaCost} mana)` : '';

        const distance = Math.sqrt(
            Math.pow(destinationPosition.x - originalPosition.x, 2) +
            Math.pow(destinationPosition.y - originalPosition.y, 2)
        );
        const distanceInFeet = Math.round(distance / gridSize * 5); // Conversion en pieds (5 pieds par case)

        return `
            <div style="border: 2px solid #4a148c; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="color: #4a148c; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                        🌑 ${SPELL_CONFIG.name}
                    </h3>
                    <p style="margin: 5px 0; font-style: italic; color: #666;">
                        "Moctei disparaît dans les ombres pour réapparaître ailleurs..."
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                    <div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
                        <strong>🎯 Lanceur :</strong><br>${actor.name}${stanceInfo}
                    </div>
                    <div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
                        <strong>💰 Coût :</strong><br>${actualManaCost} mana${focusInfo}
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong>🌑 Téléportation :</strong><br>
                    <strong>De :</strong> (${Math.round(originalPosition.x)}, ${Math.round(originalPosition.y)})<br>
                    <strong>Vers :</strong> (${Math.round(destinationPosition.x)}, ${Math.round(destinationPosition.y)})<br>
                    <small style="color: #666;">Distance parcourue : ${distanceInFeet} pieds</small>
                </div>

                <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 0.9em;">
                    <strong>⚡ Effet :</strong><br>
                    • <strong>Type :</strong> Téléportation instantanée<br>
                    • <strong>Méthode :</strong> Voyage par les ombres<br>
                    • <strong>Durée :</strong> Instantané<br>
                    • <strong>Portée :</strong> Visuelle (Portal)
                </div>

                <div style="text-align: center; margin-top: 10px; padding: 8px; background: rgba(46, 0, 84, 0.1); border-radius: 4px;">
                    <em style="color: #4a148c;">
                        🌑 Moctei a traversé les ombres avec succès ! 🌑
                    </em>
                </div>
            </div>
        `;
    }

    // Envoyer le message de chat
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: casterToken }),
        content: createChatMessage(),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    // ===== NOTIFICATION FINALE =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const focusInfo = (SPELL_CONFIG.isFocusable && currentStance === 'focus') ? ' ⚡ Focalisé' : '';

    ui.notifications.info(
        `🌑 ${SPELL_CONFIG.name} lancé !${stanceInfo}${focusInfo} ` +
        `Moctei s'est téléporté vers (${Math.round(destinationPosition.x)}, ${Math.round(destinationPosition.y)}). ` +
        `Coût : ${actualManaCost} mana.`
    );

    console.log(`[Moctei] Shadow teleportation completed successfully`);

})();
