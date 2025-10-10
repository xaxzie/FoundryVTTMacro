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
        // Configuration de base - sera mise à jour selon le mode choisi
        name: "Téléportation dans l'ombre",
        manaCost: 5,
        spellLevel: 1,
        isFocusable: true, // Focalisable

        // Modes disponibles
        modes: {
            solo: {
                name: "Téléportation dans l'ombre",
                manaCost: 5,
                spellLevel: 1,
                isFocusable: true,
                description: "Moctei se téléporte seul",
                targets: "Personnel"
            },
            transport: {
                name: "Transport dans l'ombre",
                manaCost: 6,
                spellLevel: 2,
                isFocusable: false, // Demi-focalisable (on gérera manuellement)
                description: "Moctei prend quelqu'un dans ses bras et se téléporte avec",
                targets: "Personnel + 1 allié"
            }
        },

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
                file: "jb2a.energy_strands.range.standard.purple.03", // Projectile d'ombre entre les positions
                scale: 0.6,
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

    // ===== DIALOG DE SÉLECTION DE MODE =====
    async function showModeSelectionDialog() {
        return new Promise(resolve => {
            const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            new Dialog({
                title: "🌑 Magie des Ombres - Mode de Transport",
                content: `
                    <div style="margin-bottom: 15px;">
                        <h3 style="border-bottom: 2px solid #4a148c; color: #4a148c;">Choisissez le mode de transport</h3>
                        <p><strong>Lanceur:</strong> ${actor.name}${stanceInfo}</p>
                    </div>

                    <div style="margin: 15px 0;">
                        <input type="radio" id="mode-solo" name="teleport-mode" value="solo" checked style="margin-right: 8px;">
                        <label for="mode-solo" style="font-weight: bold; color: #4a148c;">
                            🌑 ${SPELL_CONFIG.modes.solo.name}
                        </label>
                        <div style="margin: 8px 0 15px 25px; font-size: 0.9em;">
                            <div><strong>Coût:</strong> ${SPELL_CONFIG.modes.solo.manaCost} mana ${SPELL_CONFIG.modes.solo.isFocusable ? '(focalisable)' : ''}</div>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.modes.solo.spellLevel}</div>
                            <div><strong>Cibles:</strong> ${SPELL_CONFIG.modes.solo.targets}</div>
                            <div style="color: #666; font-style: italic;">${SPELL_CONFIG.modes.solo.description}</div>
                        </div>
                    </div>

                    <div style="margin: 15px 0;">
                        <input type="radio" id="mode-transport" name="teleport-mode" value="transport" style="margin-right: 8px;">
                        <label for="mode-transport" style="font-weight: bold; color: #4a148c;">
                            🚶‍♂️ ${SPELL_CONFIG.modes.transport.name}
                        </label>
                        <div style="margin: 8px 0 15px 25px; font-size: 0.9em;">
                            <div><strong>Coût:</strong> ${SPELL_CONFIG.modes.transport.manaCost} mana (demi-focalisable)</div>
                            <div><strong>Niveau:</strong> ${SPELL_CONFIG.modes.transport.spellLevel}</div>
                            <div><strong>Cibles:</strong> ${SPELL_CONFIG.modes.transport.targets}</div>
                            <div style="color: #666; font-style: italic;">${SPELL_CONFIG.modes.transport.description}</div>
                            <div style="color: #d32f2f; font-size: 0.8em; margin-top: 5px;">
                                ⚠️ Requiert d'être adjacent à un allié
                            </div>
                        </div>
                    </div>
                `,
                buttons: {
                    select: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "🌑 Lancer",
                        callback: (html) => {
                            const selectedMode = html.find('input[name="teleport-mode"]:checked').val();
                            resolve(selectedMode);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "select"
            }, {
                width: 550,
                height: "auto"
            }).render(true);
        });
    }

    const selectedMode = await showModeSelectionDialog();
    if (!selectedMode) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    // Appliquer la configuration du mode sélectionné
    const modeConfig = SPELL_CONFIG.modes[selectedMode];
    SPELL_CONFIG.name = modeConfig.name;
    SPELL_CONFIG.manaCost = modeConfig.manaCost;
    SPELL_CONFIG.spellLevel = modeConfig.spellLevel;
    SPELL_CONFIG.isFocusable = modeConfig.isFocusable;

    // Modifier le coût selon la focalisation
    let actualManaCost = SPELL_CONFIG.manaCost;

    // Gestion spéciale pour le mode transport (demi-focalisable)
    if (selectedMode === 'transport' && currentStance === 'focus') {
        // Demi-focalisable : réduction de 50% seulement
        actualManaCost = Math.max(1, Math.floor(SPELL_CONFIG.manaCost * 0.5));
    } else if (SPELL_CONFIG.isFocusable && currentStance === 'focus') {
        // Focalisable normal : réduction de 25%
        actualManaCost = Math.max(1, Math.floor(SPELL_CONFIG.manaCost * 0.75));
    }

    // ===== GESTION DU MODE TRANSPORT (ALLIÉ) =====
    let allyToken = null;
    let allyDestination = null;

    if (selectedMode === 'transport') {
        // Détecter les alliés adjacents (code similaire à feu-obscur.js)
        function getAdjacentAllies(casterToken) {
            const gridSize = canvas.grid.size;
            const casterGridX = Math.floor(casterToken.x / gridSize);
            const casterGridY = Math.floor(casterToken.y / gridSize);

            const adjacentAllies = [];

            // Vérifier les 8 cases adjacentes
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue; // Skip la case du caster

                    const checkX = casterGridX + dx;
                    const checkY = casterGridY + dy;

                    const adjacentTokens = canvas.tokens.placeables.filter(token => {
                        if (token.id === casterToken.id) return false; // Skip le caster

                        const tokenGridX = Math.floor(token.x / gridSize);
                        const tokenGridY = Math.floor(token.y / gridSize);

                        return tokenGridX === checkX && tokenGridY === checkY && token.visible;
                    });

                    for (const adjToken of adjacentTokens) {
                        if (adjToken.actor && adjToken.document.disposition !== CONST.TOKEN_DISPOSITIONS.HOSTILE) {
                            adjacentAllies.push({
                                token: adjToken,
                                actor: adjToken.actor,
                                name: adjToken.name,
                                position: { x: adjToken.x, y: adjToken.y }
                            });
                        }
                    }
                }
            }

            return adjacentAllies;
        }

        const adjacentAllies = getAdjacentAllies(casterToken);

        if (adjacentAllies.length === 0) {
            ui.notifications.error("Aucun allié adjacent trouvé ! Vous devez être à côté d'un allié pour utiliser le Transport dans l'ombre.");
            return;
        }

        // Dialog de sélection d'allié
        async function selectAlly(allies) {
            return new Promise(resolve => {
                let dialogContent = `
                    <h3>🚶‍♂️ Sélection de l'Allié à Transporter</h3>
                    <p>Choisissez quel allié adjacent transporter avec vous :</p>
                    <div style="margin: 15px 0;">
                `;

                for (let i = 0; i < allies.length; i++) {
                    const ally = allies[i];
                    dialogContent += `
                        <div style="margin: 8px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <label>
                                <input type="radio" id="ally-${i}" name="ally-select" value="${i}" ${i === 0 ? 'checked' : ''} style="margin-right: 8px;">
                                <strong>${ally.name}</strong>
                            </label>
                        </div>
                    `;
                }

                dialogContent += `</div>`;

                new Dialog({
                    title: "🚶‍♂️ Transport dans l'ombre - Sélection d'Allié",
                    content: dialogContent,
                    buttons: {
                        select: {
                            icon: '<i class="fas fa-user-friends"></i>',
                            label: "🌑 Sélectionner",
                            callback: (html) => {
                                const selectedIndex = parseInt(html.find('input[name="ally-select"]:checked').val());
                                resolve(allies[selectedIndex]);
                            }
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: "Annuler",
                            callback: () => resolve(null)
                        }
                    },
                    default: "select"
                }, {
                    width: 400,
                    height: "auto"
                }).render(true);
            });
        }

        allyToken = await selectAlly(adjacentAllies);
        if (!allyToken) {
            ui.notifications.info('Transport annulé - aucun allié sélectionné.');
            return;
        }
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

    // Sélection de la destination de Moctei
    ui.notifications.info(`🌑 Sélectionnez la destination de ${actor.name}...`);
    const destinationPosition = await selectTeleportDestination();
    if (!destinationPosition) {
        ui.notifications.info('Téléportation annulée - aucune destination sélectionnée.');
        return;
    }

    // Si mode transport, sélection de la destination de l'allié
    if (selectedMode === 'transport') {
        ui.notifications.info(`🚶‍♂️ Sélectionnez maintenant la destination de ${allyToken.name}...`);
        allyDestination = await selectTeleportDestination();
        if (!allyDestination) {
            ui.notifications.info('Transport annulé - destination de l\'allié non sélectionnée.');
            return;
        }

        // Vérifier que les destinations ne sont pas occupées (pour l'allié aussi)
        const gridSize = canvas.grid.size;
        const tokensAtAllyDestination = canvas.tokens.placeables.filter(token => {
            if (token.id === casterToken.id || token.id === allyToken.token.id) return false;

            const tokenGridX = Math.floor(token.document.x / gridSize);
            const tokenGridY = Math.floor(token.document.y / gridSize);
            const destGridX = Math.floor(allyDestination.x / gridSize);
            const destGridY = Math.floor(allyDestination.y / gridSize);

            return tokenGridX === destGridX && tokenGridY === destGridY;
        });

        if (tokensAtAllyDestination.length > 0) {
            ui.notifications.warn("Impossible de transporter l'allié : sa destination est occupée !");
            return;
        }
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

        // 1. Animation de départ - Moctei
        seq.effect()
            .file(SPELL_CONFIG.teleportation.departure.file)
            .atLocation(originalCenter)
            .scale(SPELL_CONFIG.teleportation.departure.scale)
            .duration(SPELL_CONFIG.teleportation.departure.duration)
            .fadeIn(SPELL_CONFIG.teleportation.departure.fadeIn)
            .fadeOut(SPELL_CONFIG.teleportation.departure.fadeOut)
            .waitUntilFinished(-800); // Continue avant la fin pour enchaîner

        // Si mode transport, animation de départ sur l'allié aussi
        if (selectedMode === 'transport' && allyToken) {
            const allyOriginalCenter = {
                x: allyToken.position.x + (gridSize / 2),
                y: allyToken.position.y + (gridSize / 2)
            };

            seq.effect()
                .file(SPELL_CONFIG.teleportation.departure.file)
                .atLocation(allyOriginalCenter)
                .scale(SPELL_CONFIG.teleportation.departure.scale * 0.8) // Légèrement plus petit
                .duration(SPELL_CONFIG.teleportation.departure.duration)
                .fadeIn(SPELL_CONFIG.teleportation.departure.fadeIn)
                .fadeOut(SPELL_CONFIG.teleportation.departure.fadeOut);
        }

        // 2. Animation de projectile (énergie d'ombre entre les positions)
        seq.effect()
            .file(SPELL_CONFIG.teleportation.projectile.file)
            .atLocation(originalCenter)
            .stretchTo(destinationCenter, { onlyX: false })
            .scale(SPELL_CONFIG.teleportation.projectile.scale)
            .tint(SPELL_CONFIG.teleportation.projectile.tint)
            .duration(1200) // Durée fixe pour le projectile
            .waitUntilFinished(-600); // Continue avant la fin

        // Si mode transport, projectile de l'allié vers sa destination
        if (selectedMode === 'transport' && allyToken && allyDestination) {
            const allyOriginalCenter = {
                x: allyToken.position.x + (gridSize / 2),
                y: allyToken.position.y + (gridSize / 2)
            };
            const allyDestinationCenter = {
                x: allyDestination.x + (gridSize / 2),
                y: allyDestination.y + (gridSize / 2)
            };

            seq.effect()
                .file(SPELL_CONFIG.teleportation.projectile.file)
                .atLocation(allyOriginalCenter)
                .stretchTo(allyDestinationCenter, { onlyX: false })
                .scale(SPELL_CONFIG.teleportation.projectile.scale * 0.8)
                .tint(SPELL_CONFIG.teleportation.projectile.tint)
                .duration(1200);
        }

        // 3. Animation d'arrivée - Moctei
        seq.effect()
            .file(SPELL_CONFIG.teleportation.arrival.file)
            .atLocation(destinationCenter)
            .scale(SPELL_CONFIG.teleportation.arrival.scale)
            .duration(SPELL_CONFIG.teleportation.arrival.duration)
            .fadeIn(SPELL_CONFIG.teleportation.arrival.fadeIn)
            .fadeOut(SPELL_CONFIG.teleportation.arrival.fadeOut);

        // Si mode transport, animation d'arrivée sur l'allié
        if (selectedMode === 'transport' && allyToken && allyDestination) {
            const allyDestinationCenter = {
                x: allyDestination.x + (gridSize / 2),
                y: allyDestination.y + (gridSize / 2)
            };

            seq.effect()
                .file(SPELL_CONFIG.teleportation.arrival.file)
                .atLocation(allyDestinationCenter)
                .scale(SPELL_CONFIG.teleportation.arrival.scale * 0.8) // Légèrement plus petit
                .duration(SPELL_CONFIG.teleportation.arrival.duration)
                .fadeIn(SPELL_CONFIG.teleportation.arrival.fadeIn)
                .fadeOut(SPELL_CONFIG.teleportation.arrival.fadeOut);
        }

        // Jouer toute la séquence
        await seq.play();
    }

    // ===== FONCTION DE TÉLÉPORTATION AVEC ADVANCED MACROS =====
    async function teleportTokenWithAdvancedMacros(token, destination) {
        // Vérifier si Advanced Macros est disponible
        const advancedMacros = game.modules.get("advanced-macros");
        if (!advancedMacros || !advancedMacros.active) {
            // Fallback pour le token du joueur courant
            if (token.id === casterToken.id) {
                return await teleportOwnToken(token, destination);
            } else {
                ui.notifications.error("Advanced Macros requis pour téléporter les alliés !");
                return false;
            }
        }

        // Si le joueur possède le token, téléportation directe
        if (token.actor.isOwner) {
            return await teleportOwnToken(token, destination);
        }

        // Sinon, utiliser le système de macro Advanced Macros pour escalader les privilèges
        try {
            // Chercher une macro de téléportation configurée pour s'exécuter en tant que GM
            let teleportMacro = game.macros.getName("Moctei Teleport Helper");

            if (!teleportMacro) {
                // Créer dynamiquement la macro de téléportation (seulement si on est GM)
                if (game.user.isGM) {
                    const macroData = {
                        name: "Moctei Teleport Helper",
                        type: "script",
                        command: `
                            // Script de téléportation exécuté avec privilèges GM
                            const { tokenId, destinationX, destinationY } = args[0];

                            const targetToken = canvas.tokens.get(tokenId);
                            if (!targetToken) {
                                return { success: false, error: "Token non trouvé" };
                            }

                            try {
                                // Sauvegarder le mode de déplacement actuel
                                const originalMovementType = targetToken.document.movementAction;

                                // Activer le mode de déplacement "Teleportation"
                                await targetToken.document.update({ movementAction: 'blink' });

                                // Effectuer le déplacement
                                await targetToken.document.update({
                                    x: destinationX,
                                    y: destinationY
                                });

                                // Restaurer le mode de déplacement original
                                await targetToken.document.update({ movementAction: originalMovementType });

                                return {
                                    success: true,
                                    message: "Téléportation d'allié réussie",
                                    tokenName: targetToken.name,
                                    position: { x: destinationX, y: destinationY }
                                };
                            } catch (err) {
                                return { success: false, error: err.message };
                            }
                        `,
                        folder: null,
                        sort: 0,
                        ownership: {
                            default: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
                        },
                        flags: {
                            "advanced-macros": {
                                "runForSpecificUser": "GM"
                            }
                        }
                    };

                    teleportMacro = await Macro.create(macroData);
                    console.log("[Moctei] Created teleport helper macro for Advanced Macros");
                } else {
                    ui.notifications.error("Macro de téléportation manquante ! Le GM doit d'abord l'exécuter.");
                    return false;
                }
            }

            // Exécuter la macro avec les arguments nécessaires
            const result = await teleportMacro.execute({
                tokenId: token.id,
                destinationX: destination.x,
                destinationY: destination.y
            });

            if (result && result.success) {
                console.log(`[Moctei] ${result.message}: ${result.tokenName}`);
                return true;
            } else {
                const errorMsg = result ? result.error : "Erreur inconnue";
                console.error(`[Moctei] Échec téléportation: ${errorMsg}`);
                ui.notifications.error(`Échec téléportation: ${errorMsg}`);
                return false;
            }

        } catch (error) {
            console.error("[Moctei] Erreur Advanced Macros:", error);
            ui.notifications.error("Échec téléportation via Advanced Macros !");
            return false;
        }
    }

    // ===== DÉPLACEMENT DU TOKEN PERSONNEL =====
    async function teleportOwnToken(token, destination) {
        try {
            // Sauvegarder le mode de déplacement actuel
            const originalMovementType = token.document.movementAction;

            // Activer le mode de déplacement "Teleportation" de FoundryVTT v13
            await token.document.update({ movementAction: 'blink' });

            // Effectuer le déplacement avec le mode téléportation
            const updates = {
                x: destination.x,
                y: destination.y
            };

            // Mettre à jour la position du token via le document
            await token.document.update(updates);

            // Restaurer le mode de déplacement original
            await token.document.update({ movementAction: originalMovementType });

            console.log(`[Moctei] Token successfully teleported to (${destination.x}, ${destination.y})`);
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

    // 2. Déplacer le(s) token(s) au moment approprié (pendant l'animation de projectile)
    setTimeout(async () => {
        // Téléporter Moctei
        const mocteiSuccess = await teleportTokenWithAdvancedMacros(casterToken, destinationPosition);

        // Si mode transport, téléporter aussi l'allié
        if (selectedMode === 'transport' && allyToken) {
            const allySuccess = await teleportTokenWithAdvancedMacros(allyToken.token, allyDestination);
            if (!allySuccess) {
                ui.notifications.warn(`Échec de la téléportation de ${allyToken.name} !`);
            }
        }

        if (!mocteiSuccess) {
            ui.notifications.error("Échec de la téléportation de Moctei !");
        }
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

        // Informations spécifiques au mode
        const modeSpecificInfo = selectedMode === 'transport' && allyToken ? `
            <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px; margin: 10px 0;">
                <strong>🚶‍♂️ Transport d'Allié :</strong><br>
                <strong>Allié :</strong> ${allyToken.name}<br>
                <strong>Destination allié :</strong> (${Math.round(allyDestination.x)}, ${Math.round(allyDestination.y)})<br>
                <small style="color: #666;">Transportés ensemble par les ombres</small>
            </div>
        ` : '';

        const description = selectedMode === 'transport' ?
            "Moctei prend son allié dans ses bras et tous deux disparaissent dans les ombres..." :
            "Moctei disparaît dans les ombres pour réapparaître ailleurs...";

        const successMessage = selectedMode === 'transport' ?
            "🌑 Moctei et son allié ont traversé les ombres avec succès ! 🌑" :
            "🌑 Moctei a traversé les ombres avec succès ! 🌑";

        return `
            <div style="border: 2px solid #4a148c; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="color: #4a148c; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                        🌑 ${SPELL_CONFIG.name}
                    </h3>
                    <p style="margin: 5px 0; font-style: italic; color: #666;">
                        "${description}"
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
                    <strong>🌑 Téléportation de Moctei :</strong><br>
                    <strong>De :</strong> (${Math.round(originalPosition.x)}, ${Math.round(originalPosition.y)})<br>
                    <strong>Vers :</strong> (${Math.round(destinationPosition.x)}, ${Math.round(destinationPosition.y)})<br>
                    <small style="color: #666;">Distance parcourue : ${distanceInFeet} pieds</small>
                </div>

                ${modeSpecificInfo}

                <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 0.9em;">
                    <strong>⚡ Effet :</strong><br>
                    • <strong>Type :</strong> Téléportation instantanée<br>
                    • <strong>Méthode :</strong> Voyage par les ombres<br>
                    • <strong>Durée :</strong> Instantané<br>
                    • <strong>Portée :</strong> Visuelle<br>
                    • <strong>Cibles :</strong> ${selectedMode === 'transport' ? 'Personnel + 1 allié' : 'Personnel'}
                </div>

                <div style="text-align: center; margin-top: 10px; padding: 8px; background: rgba(46, 0, 84, 0.1); border-radius: 4px;">
                    <em style="color: #4a148c;">
                        ${successMessage}
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
    const focusInfo = (SPELL_CONFIG.isFocusable && currentStance === 'focus') ? ' ⚡ Focalisé' :
        (selectedMode === 'transport' && currentStance === 'focus') ? ' ⚡ Demi-focalisé' : '';

    const allyInfo = selectedMode === 'transport' && allyToken ?
        ` avec ${allyToken.name}` : '';

    const destinationInfo = selectedMode === 'transport' && allyToken ?
        ` Destinations: Moctei (${Math.round(destinationPosition.x)}, ${Math.round(destinationPosition.y)}), ${allyToken.name} (${Math.round(allyDestination.x)}, ${Math.round(allyDestination.y)}).` :
        ` vers (${Math.round(destinationPosition.x)}, ${Math.round(destinationPosition.y)}).`;

    ui.notifications.info(
        `🌑 ${SPELL_CONFIG.name} lancé !${stanceInfo}${focusInfo} ` +
        `Moctei s'est téléporté${allyInfo}${destinationInfo} ` +
        `Coût : ${actualManaCost} mana.`
    );

    console.log(`[Moctei] Shadow teleportation completed successfully`);

})();
