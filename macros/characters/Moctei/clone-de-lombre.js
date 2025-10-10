/**
 * Clone de l'ombre - Moctei (Mage des Ombres)
 *
 * Moctei devient flou, et l'instant après, 2 Moctei vous font face.
 * Un clone de Moctei apparaît, permettant une action simple unique.
 *
 * - Coût : 5 points de mana (non focalisable)
 * - Niveau de sort : 2
 * - Effet : Crée un token clone de Moctei avec effet visuel d'ombre
 * - Le clone partage le même Actor (linkActorData = true)
 * - En combat : le clone disparaît après une action simple
 * - Hors combat : le clone reste ~5 minutes (gestion manuelle)
 * - Le clone dispose des mêmes capacités mais avec un filtre visuel distinctif
 *
 * UTILISATION :
 * 1. Sélectionner le token de Moctei original
 * 2. Lancer cette macro
 * 3. Choisir la position du clone via Portal
 * 4. Utiliser le clone normalement (sélectionner et lancer des macros)
 * 5. Supprimer manuellement le token clone quand nécessaire
 *
 * Les effets appliqués via le clone sont automatiquement synchronisés
 * sur l'Actor original grâce à linkActorData = true.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Clone de l'ombre",
        manaCost: 5,
        spellLevel: 2,
        isFocusable: false, // Non focalisable

        // Configuration du clone
        clone: {
            name: "Moctei (Clone d'Ombre)",
            flagKey: "isClone",
            flagValue: true,

            // Effet visuel du clone d'ombre
            visualFilter: {
                filterId: "MocteiShadowClone",
                filterType: "adjustment",
                brightness: 0.7,      // Plus sombre
                contrast: 1.2,        // Contraste augmenté
                saturate: 0.3,        // Désaturé (effet d'ombre)
                animated: {
                    alpha: {              // Oscillation d'opacité
                        active: true,
                        animType: "syncCosOscillation",
                        val1: 0.6,        // Opacité minimale
                        val2: 0.85,       // Opacité maximale
                        loopDuration: 3000 // 3 secondes par cycle
                    }
                }
            }
        },

        // Animation d'invocation
        animation: {
            cast: "jb2a_patreon.misty_step.01.purple", // Animation de téléportation sombre
            clone: "jb2a_patreon.misty_step.01.purple", // Effet de fumée lors de l'apparition
            sound: null
        },

        // Configuration Portal pour le positionnement
        portal: {
            range: 150, // Portée maximale pour placer le clone
            color: "#2e0054", // Couleur violet très sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le token de Moctei !");
        return;
    }

    const originalToken = canvas.tokens.controlled[0];
    const actor = originalToken.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // Vérifier que c'est bien Moctei et pas déjà un clone
    if (originalToken.document.flags?.world?.isClone) {
        ui.notifications.error("Impossible de créer un clone depuis un clone ! Sélectionnez le Moctei original.");
        return;
    }

    // ===== UTILS (stance, validation) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    const currentStance = getCurrentStance(actor);

    // ===== SÉLECTION DE POSITION AVEC PORTAL =====
    async function selectClonePosition() {
        try {
            const position = await window.Sequencer.Crosshair.show({
                size: canvas.grid.size,
                icon: SPELL_CONFIG.portal.texture,
                label: "Position du Clone d'Ombre",
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
            // Utiliser Math.floor comme dans les autres macros pour obtenir la case cliquée
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

    const clonePosition = await selectClonePosition();
    if (!clonePosition) {
        ui.notifications.info('Invocation annulée - aucune position sélectionnée.');
        return;
    }

    // ===== ANIMATION D'INVOCATION =====
    async function playInvocationAnimation() {
        const seq = new Sequence();

        // Animation d'invocation sur Moctei original
        if (SPELL_CONFIG.animation.cast) {
            seq.effect()
                .file(SPELL_CONFIG.animation.cast)
                .attachTo(originalToken)
                .scale(0.6)
                .duration(2000)
                .fadeIn(500)
                .fadeOut(500)
                .waitUntilFinished(-1000); // Continue pendant que l'effet se termine
        }

        // Animation d'apparition du clone
        if (SPELL_CONFIG.animation.clone) {
            // Centrer l'animation au milieu de la case (comme pour les autres sorts)
            const gridSize = canvas.grid.size;
            const centerX = clonePosition.x + (gridSize / 2);
            const centerY = clonePosition.y + (gridSize / 2);

            seq.effect()
                .file(SPELL_CONFIG.animation.clone)
                .atLocation({ x: centerX, y: centerY })
                .scale(0.8)
                .duration(1500)
                .fadeIn(300)
                .fadeOut(500);
        }

        await seq.play();
    }

    await playInvocationAnimation();

    // ===== CRÉATION DU TOKEN CLONE =====
    async function createCloneToken() {
        try {
            // Données du token clone basées sur l'original
            const originalTokenData = originalToken.document.toObject();

            const cloneTokenData = {
                ...originalTokenData,
                x: clonePosition.x,
                y: clonePosition.y,
                name: SPELL_CONFIG.clone.name,
                flags: {
                    ...originalTokenData.flags,
                    world: {
                        ...originalTokenData.flags?.world,
                        [SPELL_CONFIG.clone.flagKey]: SPELL_CONFIG.clone.flagValue,
                        originalTokenId: originalToken.id,
                        spellName: SPELL_CONFIG.name,
                        createdAt: Date.now()
                    }
                }
            };

            // Supprimer l'ID pour créer un nouveau token
            delete cloneTokenData._id;

            // Créer le token clone
            const [cloneTokenDoc] = await canvas.scene.createEmbeddedDocuments("Token", [cloneTokenData]);
            const cloneToken = cloneTokenDoc.object;

            console.log(`[Moctei] Clone token created: ${cloneToken.id}`);
            return cloneToken;

        } catch (error) {
            console.error("[Moctei] Error creating clone token:", error);
            ui.notifications.error("Échec de la création du clone !");
            return null;
        }
    }

    const cloneToken = await createCloneToken();
    if (!cloneToken) return;

    // ===== APPLICATION DU FILTRE VISUEL =====
    async function applyCloneVisualFilter(token) {
        try {
            // Attendre que le token soit bien créé et rendu
            await new Promise(resolve => setTimeout(resolve, 500));

            // Vérifier que le token et son document existent
            if (!token) {
                console.error("[Moctei] Token is null or undefined");
                return;
            }

            if (!token.document) {
                console.error("[Moctei] Token document is null or undefined");
                return;
            }

            console.log(`[Moctei] Applying filter to token: ${token.id}, document ID: ${token.document.id}`);

            const filterConfig = SPELL_CONFIG.clone.visualFilter;

            // Structure correcte pour Token Magic FX (doit être un tableau)
            const filterParams = [{
                filterType: filterConfig.filterType,
                filterId: filterConfig.filterId,
                brightness: filterConfig.brightness,
                contrast: filterConfig.contrast,
                saturate: filterConfig.saturate,
                animated: filterConfig.animated
            }];

            // Essayer plusieurs approches pour Token Magic FX
            let success = false;

            // Approche 1: Utiliser le document du token
            try {
                await TokenMagic.addFilters(token.document, filterParams);
                success = true;
                console.log(`[Moctei] Applied shadow clone filter to token document: ${token.document.id}`);
            } catch (docError) {
                console.warn("[Moctei] Document approach failed:", docError);
            }

            // Approche 2: Utiliser le token directement si l'approche document échoue
            if (!success) {
                try {
                    await TokenMagic.addFilters(token, filterParams);
                    success = true;
                    console.log(`[Moctei] Applied shadow clone filter to token object: ${token.id}`);
                } catch (tokenError) {
                    console.warn("[Moctei] Token object approach failed:", tokenError);
                }
            }

            // Approche 3: Récupérer le token depuis le canvas si les autres échouent
            if (!success) {
                try {
                    const canvasToken = canvas.tokens.get(token.id);
                    if (canvasToken) {
                        await TokenMagic.addFilters(canvasToken, filterParams);
                        success = true;
                        console.log(`[Moctei] Applied shadow clone filter to canvas token: ${token.id}`);
                    }
                } catch (canvasError) {
                    console.warn("[Moctei] Canvas token approach failed:", canvasError);
                }
            }

            if (!success) {
                throw new Error("All filter application approaches failed");
            }

        } catch (error) {
            console.error("[Moctei] Error applying clone visual filter:", error);
            console.error("[Moctei] Filter error details:", error);
            ui.notifications.warn("Le clone a été créé mais sans effet visuel (Token Magic FX requis).");
        }
    }

    await applyCloneVisualFilter(cloneToken);

    // ===== MESSAGE DE CHAT =====
    function createChatMessage() {
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

        return `
            <div style="border: 2px solid #4a148c; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="color: #4a148c; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                        🎭 ${SPELL_CONFIG.name}
                    </h3>
                    <p style="margin: 5px 0; font-style: italic; color: #666;">
                        "Moctei devient flou, et l'instant après, 2 Moctei vous font face."
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                    <div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
                        <strong>🎯 Lanceur :</strong><br>${actor.name}${stanceInfo}
                    </div>
                    <div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
                        <strong>💰 Coût :</strong><br>${SPELL_CONFIG.manaCost} mana
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong>🎭 Clone créé :</strong> ${SPELL_CONFIG.clone.name}<br>
                    <small style="color: #666;">Position : X:${Math.round(clonePosition.x)}, Y:${Math.round(clonePosition.y)}</small>
                </div>

                <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 0.9em;">
                    <strong>⚡ Conditions du Clone :</strong><br>
                    • <strong>En combat :</strong> Une action simple unique, puis disparaît<br>
                    • <strong>Hors combat :</strong> Reste environ 5 minutes<br>
                    • <strong>Capacités :</strong> Identiques à Moctei (effets synchronisés)<br>
                    • <strong>Suppression :</strong> Manuelle par le joueur
                </div>

                <div style="text-align: center; margin-top: 10px; padding: 8px; background: rgba(46, 0, 84, 0.1); border-radius: 4px;">
                    <em style="color: #4a148c;">
                        🌑 Le clone d'ombre est prêt à agir ! 🌑
                    </em>
                </div>
            </div>
        `;
    }

    // Envoyer le message de chat
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: originalToken }),
        content: createChatMessage(),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    // ===== NOTIFICATION FINALE =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    ui.notifications.info(
        `🎭 ${SPELL_CONFIG.name} lancé !${stanceInfo} Clone créé en (${Math.round(clonePosition.x)}, ${Math.round(clonePosition.y)}). ` +
        `Coût : ${SPELL_CONFIG.manaCost} mana. Le clone est prêt à agir !`
    );

    // Sélectionner automatiquement le clone pour faciliter l'utilisation
    cloneToken.control({ releaseOthers: true });
    console.log(`[Moctei] Shadow clone successfully created and selected`);

})();
