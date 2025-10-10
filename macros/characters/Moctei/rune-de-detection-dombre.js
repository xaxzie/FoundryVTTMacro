/**
 * Rune de détection d'ombre - Moctei (Mage des Ombres)
 *
 * Une marque magique dissimulée dans l'ombre, offrant à Moctei une détection.
 * Permet de savoir si quelque chose est passé, ainsi que son caractère (à discrétion du MJ).
 *
 * - Coût : 2 points de mana réservés par rune
 * - Niveau de sort : 2
 * - Durée : Persistante jusqu'à récupération de la mana ou nettoyage
 * - Effet : Zone de détection fixe au sol
 * - Contrainte : Besoin d'être à côté de la rune pour récupérer la mana réservée
 *
 * MÉCANIQUES :
 * - Pas d'effet sur acteur/token (ciblage terrain uniquement)
 * - Animation de projectile (caillou qui disparaît au contact du sol)
 * - Marque persistante au sol pour la détection
 * - Gestion de la mana réservée (informatif uniquement)
 * - Suppression via endMocteiEffect.js par détection d'animation Sequencer
 *
 * UTILISATION :
 * 1. Sélectionner le token de Moctei
 * 2. Lancer cette macro
 * 3. Utiliser Portal pour cibler la position souhaitée
 * 4. La rune est placée et active la détection
 * 5. Récupération manuelle de la mana en étant à côté de la rune
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Rune de détection d'ombre",
        manaCost: 2,
        spellLevel: 2,
        isFocusable: true,
        isReservedMana: true, // Mana réservée jusqu'à récupération

        // Configuration de la rune
        rune: {
            name: "Rune d'Ombre (Détection)",
            flagKey: "shadowDetectionRune",
            duration: "Persistant", // Jusqu'à récupération de mana
            detectionRadius: 30, // Rayon de détection (informatif pour le MJ)

            // Marque visuelle persistante
            visualMarker: {
                file: "jb2a.magic_signs.rune.illusion.loop.purple",
                scale: 0.5,
                opacity: 0.6,
                tint: "#2e0054",
                persistent: true
            }
        },

        // Animation du projectile (caillou)
        projectile: {
            file: "jb2a.throwable.launch.cannon_ball.01.black", // Animation de caillou lancé
            scale: 0.8,
            tint: "#2e0054",
            impact: {
                file: "jb2a.magic_signs.rune.illusion.intro.purple", // Impact au sol
                scale: 0.5,
                duration: 2167,
                fadeOut: 800
            }
        },

        // Configuration Portal pour le ciblage
        portal: {
            range: 200, // Portée maximale pour placer la rune
            color: "#2e0054", // Couleur violet sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm",
            label: "Position de la Rune d'Ombre"
        },

        // Sons (optionnel)
        sounds: {
            cast: null, // Pas de son de cast
            projectile: null, // Son de projectile si souhaité
            impact: null, // Son d'impact au sol
            runeActivation: null // Son d'activation de la rune
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

    // ===== SÉLECTION DE POSITION AVEC PORTAL =====
    async function selectRunePosition() {
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
            // Utiliser Math.floor comme dans clone-de-lombre.js pour obtenir la case cliquée
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

    const runePosition = await selectRunePosition();
    if (!runePosition) {
        ui.notifications.info('Placement de rune annulé - aucune position sélectionnée.');
        return;
    }

    // ===== CALCUL DE LA POSITION CENTRÉE =====
    // Centrer l'animation au milieu de la case (comme pour les autres sorts)
    const gridSize = canvas.grid.size;
    const centerX = runePosition.x + (gridSize / 2);
    const centerY = runePosition.y + (gridSize / 2);
    const centeredPosition = { x: centerX, y: centerY };

    console.log(`[Moctei] Rune will be placed at centered position: ${centerX}, ${centerY}`);

    // ===== ANIMATION DE PROJECTILE ET PLACEMENT =====
    async function playProjectileAndPlaceRune() {
        const seq = new Sequence();

        // 1. Animation de projectile (caillou lancé)
        seq.effect()
            .file(SPELL_CONFIG.projectile.file)
            .attachTo(casterToken, { offset: { y: -10 } }) // Légèrement au-dessus du token
            .stretchTo(centeredPosition, { onlyX: false })
            .scale(SPELL_CONFIG.projectile.scale)
            .tint(SPELL_CONFIG.projectile.tint)
            .waitUntilFinished(-200); // Continue avant la fin pour enchaîner

        // 2. Animation d'impact au sol
        if (SPELL_CONFIG.projectile.impact) {
            seq.effect()
                .file(SPELL_CONFIG.projectile.impact.file)
                .atLocation(centeredPosition)
                .scale(SPELL_CONFIG.projectile.impact.scale)
                .duration(SPELL_CONFIG.projectile.impact.duration)
                .fadeOut(SPELL_CONFIG.projectile.impact.fadeOut)
                .waitUntilFinished(-500); // Continue pendant que l'effet se termine
        }

        // 3. Marque persistante de la rune (effet principal)
        const runeSequenceName = `MocteiShadowDetectionRune_${Date.now()}_${randomID()}`;

        seq.effect()
            .file(SPELL_CONFIG.rune.visualMarker.file)
            .atLocation(centeredPosition)
            .scale(SPELL_CONFIG.rune.visualMarker.scale)
            .opacity(SPELL_CONFIG.rune.visualMarker.opacity)
            .tint(SPELL_CONFIG.rune.visualMarker.tint)
            .persist(true) // Effet persistant
            .name(runeSequenceName) // Nom unique pour le nettoyage
            .fadeIn(1000);

        // Jouer la séquence
        await seq.play();

        return runeSequenceName;
    }

    const runeSequenceName = await playProjectileAndPlaceRune();

    // ===== STOCKAGE DES INFORMATIONS DE LA RUNE =====
    // Comme il n'y a pas d'effet d'acteur, on stocke les informations dans les flags du monde ou du token
    const runeData = {
        id: runeSequenceName,
        spellName: SPELL_CONFIG.name,
        casterName: actor.name,
        casterId: casterToken.id,
        position: centeredPosition,
        gridPosition: runePosition,
        manaCost: SPELL_CONFIG.manaCost,
        spellLevel: SPELL_CONFIG.spellLevel,
        createdAt: Date.now(),
        detectionRadius: SPELL_CONFIG.rune.detectionRadius,
        isActive: true
    };

    // Stocker dans les flags du caster pour pouvoir les récupérer plus tard
    const currentRunes = casterToken.document.flags?.world?.shadowDetectionRunes || [];
    currentRunes.push(runeData);

    await casterToken.document.setFlag('world', 'shadowDetectionRunes', currentRunes);

    console.log(`[Moctei] Shadow detection rune created with ID: ${runeSequenceName}`);
    console.log(`[Moctei] Rune data stored:`, runeData);

    // ===== MESSAGE DE CHAT =====
    function createChatMessage() {
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

        return `
            <div style="border: 2px solid #4a148c; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="color: #4a148c; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                        🔮 ${SPELL_CONFIG.name}
                    </h3>
                    <p style="margin: 5px 0; font-style: italic; color: #666;">
                        "Moctei dissimule une marque magique dans l'ombre..."
                    </p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0;">
                    <div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
                        <strong>🎯 Lanceur :</strong><br>${actor.name}${stanceInfo}
                    </div>
                    <div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px;">
                        <strong>💰 Coût :</strong><br>${SPELL_CONFIG.manaCost} mana (réservé)
                    </div>
                </div>

                <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong>🔮 Rune placée :</strong> ${SPELL_CONFIG.rune.name}<br>
                    <small style="color: #666;">Position : X:${Math.round(centeredPosition.x)}, Y:${Math.round(centeredPosition.y)}</small><br>
                    <small style="color: #666;">Rayon de détection : ${SPELL_CONFIG.rune.detectionRadius} pieds</small>
                </div>

                <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 0.9em;">
                    <strong>👁️ Capacités de Détection :</strong><br>
                    • <strong>Détection :</strong> Permet de savoir si quelque chose est passé<br>
                    • <strong>Caractère :</strong> Nature du passage (à discrétion du MJ)<br>
                    • <strong>Durée :</strong> Persistante jusqu'à récupération de mana<br>
                    • <strong>Mana :</strong> ${SPELL_CONFIG.manaCost} mana réservés - récupération en étant à côté
                </div>

                <div style="text-align: center; margin-top: 10px; padding: 8px; background: rgba(46, 0, 84, 0.1); border-radius: 4px;">
                    <em style="color: #4a148c;">
                        🌑 La rune d'ombre surveille désormais cette zone... 🌑
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

    ui.notifications.info(
        `🔮 ${SPELL_CONFIG.name} lancé !${stanceInfo} Rune placée en (${Math.round(centeredPosition.x)}, ${Math.round(centeredPosition.y)}). ` +
        `Coût : ${SPELL_CONFIG.manaCost} mana réservés. La rune surveille maintenant cette zone !`
    );

    console.log(`[Moctei] Shadow detection rune successfully placed and activated`);

})();
