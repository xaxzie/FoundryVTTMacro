/**
 * Animation Player - Utilitaire d'Animation Sequencer + TokenMagic
 *
 * Macro utilitaire permettant de lancer des animations Sequencer configurées avec support TokenMagic FX.
 * Supporte toutes les méthodes et options de l'API Sequencer et TokenMagic.
 *
 * Modes de ciblage :
 * - "self" : Animation sur le token contrôlé uniquement
 * - "target" : Animation nécessitant un Portal.pick() (à la position ciblée)
 * - "projectile" : Animation depuis le token contrôlé vers un Portal.pick()
 *
 * TokenMagic Integration :
 * - timing : "before" | "during" | "after" - Quand appliquer l'effet (par rapport à la séquence Sequencer)
 * - target : "caster" | "target" - Sur quel token appliquer l'effet
 * - params : Array de filtres TokenMagic (voir documentation TokenMagic)
 * - duration : Durée en ms avant suppression automatique (optionnel, si omis l'effet persiste)
 *
 * Documentation API Sequencer : https://fantasycomputer.works/FoundryVTT-Sequencer/#/api/effect
 * Documentation API TokenMagic : https://github.com/Feu-Secret/Tokenmagic
 *
 * Usage : Sélectionner un token et lancer la macro, choisir l'animation dans le menu
 */

(async () => {
    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Veuillez sélectionner un token !");
        return;
    }

    const controlledToken = canvas.tokens.controlled[0];

    // ===== BIBLIOTHÈQUE D'ANIMATIONS CONFIGURÉES =====
    const ANIMATION_LIBRARY = {
        // === ANIMATION 1 : Épée Spirituelle (Caster → Target) ===
        "spiritual_sword": {
            name: "⚔️ Épée Spirituelle",
            description: "Épée sombre projetée vers la cible",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a_patreon.spiritual_weapon.sword.dark.white",
                    atLocation: true,
                    stretchTo: "target",
                    waitUntilFinished: -500
                }
            ]
        },

        // === ANIMATION 2 : Bouclier Orange (Self uniquement) ===
        "shield_rampart": {
            name: "🛡️ Rempart Protecteur",
            description: "Bouclier orange sur le lanceur",
            mode: "self",
            sequence: [
                {
                    file: "jb2a.markers.shield_rampart.complete.01.orange",
                    atLocation: true,
                    scale: 1
                }
            ]
        },

        // === ANIMATION 3 : Bénédiction + Nuage de Dagues (Cast → Target) ===
        "blessed_daggers": {
            name: "🗡️ Nuage de Dagues Béni",
            description: "Cast violet puis nuage de dagues persistant sur la cible",
            mode: "projectile",
            sequence: [
                // Cast sur le lanceur
                {
                    file: "jb2a_patreon.bless.400px.intro.purple",
                    atLocation: true,
                    scale: 1,
                    waitUntilFinished: -500
                },
                // Nuage de dagues sur la cible
                {
                    file: "jb2a_patreon.cloud_of_daggers.daggers.dark_purple",
                    atLocation: "target",
                    scale: 1,
                    duration: 5000,
                    fadeIn: 300,
                    fadeOut: 300
                }
            ]
        }
    };

    // ===== FONCTION DE DÉTECTION DE TOKEN =====
    /**
     * Trouve un token à une position donnée (basé sur la logique de bubbles.js)
     * @param {number} x - Coordonnée X
     * @param {number} y - Coordonnée Y
     * @returns {Token|null} - Token trouvé ou null
     */
    function findTokenAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        // Vérifier si on a une grille
        if (canvas.grid.type !== 0) {
            // Détection basée sur la grille : convertir les coordonnées en grille
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Vérifier la visibilité du token
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Ignorer les tokens non visibles
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                // Obtenir la position en grille du token (coin supérieur gauche)
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Vérifier si une case occupée par le token correspond à la case cible
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        if (tokenSquareX === targetGridX && tokenSquareY === targetGridY) {
                            return true;
                        }
                    }
                }
                return false;
            });

            return tokensAtLocation.length > 0 ? tokensAtLocation[0] : null;
        } else {
            // Pas de grille : utiliser la détection par distance circulaire
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Vérifier la visibilité du token
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Ignorer les tokens non visibles
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const tokenDistance = Math.sqrt(
                    Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2)
                );
                return tokenDistance <= tolerance;
            });

            return tokensAtLocation.length > 0 ? tokensAtLocation[0] : null;
        }
    }

    // ===== FONCTION DE GESTION TOKENMAGIC =====
    /**
     * Applique des effets TokenMagic sur un token
     * @param {Object} tokenMagicConfig - Configuration TokenMagic
     * @param {Object} casterToken - Token du lanceur
     * @param {Object} targetLocation - Position de la cible (optionnel)
     * @returns {Promise<string|null>} - filterId si l'effet doit être supprimé plus tard, null sinon
     */
    async function applyTokenMagic(tokenMagicConfig, casterToken, targetLocation = null) {
        if (!tokenMagicConfig || !tokenMagicConfig.params) {
            return null;
        }

        // Déterminer le token cible
        let targetToken = null;
        if (tokenMagicConfig.target === "caster") {
            targetToken = casterToken;
        } else if (tokenMagicConfig.target === "target" && targetLocation) {
            // Trouver le token à la position ciblée avec détection robuste
            targetToken = findTokenAtLocation(targetLocation.x, targetLocation.y);

            if (!targetToken) {
                console.warn("[Animation Player] Aucun token trouvé à la position ciblée pour TokenMagic");
                return null;
            }
        } else {
            console.warn("[Animation Player] Configuration TokenMagic invalide ou cible manquante");
            return null;
        }

        // Générer un filterId unique si non fourni
        const filterId = tokenMagicConfig.filterId || `animation-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Ajouter le filterId aux params
        const paramsWithId = tokenMagicConfig.params.map(param => ({
            ...param,
            filterId: param.filterId || filterId
        }));

        console.log(`[Animation Player] Application TokenMagic sur ${targetToken.name} (filterId: ${filterId})`);

        // Appliquer les filtres TokenMagic
        try {
            await TokenMagic.addFilters(targetToken, paramsWithId);

            // Si une durée est spécifiée, programmer la suppression
            if (tokenMagicConfig.duration) {
                setTimeout(async () => {
                    try {
                        await TokenMagic.deleteFilters(targetToken, filterId);
                        console.log(`[Animation Player] Effet TokenMagic supprimé après ${tokenMagicConfig.duration}ms`);
                    } catch (error) {
                        console.error("[Animation Player] Erreur lors de la suppression TokenMagic:", error);
                    }
                }, tokenMagicConfig.duration);
            }

            return filterId;
        } catch (error) {
            console.error("[Animation Player] Erreur lors de l'application TokenMagic:", error);
            ui.notifications.warn("Erreur lors de l'application des effets TokenMagic");
            return null;
        }
    }

    // ===== FONCTION DE LECTURE DE SÉQUENCE D'ANIMATION =====
    /**
     * Joue une séquence d'animations Sequencer configurée avec support TokenMagic
     * @param {Object} token - Token depuis lequel jouer l'animation
     * @param {Array} animationSequence - Configuration de la séquence
     * @param {Object} targetLocation - Position de la cible (optionnel)
     * @param {Object} animationConfig - Configuration complète de l'animation (avec tokenMagic)
     */
    async function playAnimationSequence(token, animationSequence, targetLocation = null, animationConfig = null) {
        if (!animationSequence || animationSequence.length === 0) {
            console.warn("[Animation Player] Aucune séquence d'animation fournie");
            return;
        }

        let sequence = new Sequence();

        for (const animConfig of animationSequence) {
            // Créer un effet dans la séquence
            let effect = sequence.effect();

            // === FILE (REQUIS) ===
            if (animConfig.file) {
                effect.file(animConfig.file);
            } else {
                console.warn("[Animation Player] Configuration d'animation sans 'file' ignorée");
                continue;
            }

            // === LOCATION METHODS ===
            // atLocation - Position de base
            if (animConfig.atLocation !== undefined) {
                if (animConfig.atLocation === true) {
                    effect.atLocation(token);
                } else if (animConfig.atLocation === "target" && targetLocation) {
                    effect.atLocation(targetLocation);
                } else if (typeof animConfig.atLocation === "object") {
                    // Support pour expressions dynamiques comme { x: "target.x", y: "target.y - 800" }
                    let x = animConfig.atLocation.x;
                    let y = animConfig.atLocation.y;

                    // Évaluer les expressions si nécessaire
                    if (typeof x === "string" && targetLocation) {
                        x = x.replace("target.x", targetLocation.x);
                        try { x = eval(x); } catch (e) { x = targetLocation.x; }
                    }
                    if (typeof y === "string" && targetLocation) {
                        y = y.replace("target.y", targetLocation.y);
                        try { y = eval(y); } catch (e) { y = targetLocation.y; }
                    }

                    effect.atLocation({ x, y });
                }
            }

            // stretchTo - Étirer vers une cible
            if (animConfig.stretchTo !== undefined) {
                if (animConfig.stretchTo === "target" && targetLocation) {
                    effect.stretchTo(targetLocation);
                } else if (typeof animConfig.stretchTo === "object") {
                    effect.stretchTo(animConfig.stretchTo);
                }
            }

            // attachTo - Attacher à un token
            if (animConfig.attachTo === true) {
                effect.attachTo(token);
            } else if (animConfig.attachTo && typeof animConfig.attachTo === "object") {
                effect.attachTo(animConfig.attachTo);
            }

            // === POSITIONING & ANCHORING ===
            if (animConfig.center !== undefined) effect.center();
            if (animConfig.anchor) effect.anchor(animConfig.anchor);
            if (animConfig.spriteAnchor) effect.spriteAnchor(animConfig.spriteAnchor);
            if (animConfig.randomOffset !== undefined) effect.randomOffset(animConfig.randomOffset);
            if (animConfig.offset) effect.offset(animConfig.offset);
            if (animConfig.locally !== undefined) effect.locally(animConfig.locally);

            // === ROTATION ===
            if (animConfig.rotate !== undefined) effect.rotate(animConfig.rotate);
            if (animConfig.rotateIn) {
                const rotateInOptions = {};
                if (animConfig.rotateIn.ease) rotateInOptions.ease = animConfig.rotateIn.ease;
                effect.rotateIn(animConfig.rotateIn.angle, animConfig.rotateIn.duration, rotateInOptions);
            }
            if (animConfig.rotateOut) {
                const rotateOutOptions = {};
                if (animConfig.rotateOut.ease) rotateOutOptions.ease = animConfig.rotateOut.ease;
                effect.rotateOut(animConfig.rotateOut.angle, animConfig.rotateOut.duration, rotateOutOptions);
            }
            if (animConfig.rotateTowards && targetLocation) effect.rotateTowards(targetLocation);
            if (animConfig.randomRotation !== undefined) effect.randomRotation(animConfig.randomRotation);

            // === SCALING ===
            if (animConfig.scale !== undefined) effect.scale(animConfig.scale);
            if (animConfig.scaleToObject !== undefined) effect.scaleToObject(animConfig.scaleToObject);
            if (animConfig.scaleIn) {
                const scaleInOptions = {};
                if (animConfig.scaleIn.ease) scaleInOptions.ease = animConfig.scaleIn.ease;
                effect.scaleIn(animConfig.scaleIn.value, animConfig.scaleIn.duration, scaleInOptions);
            }
            if (animConfig.scaleOut) {
                const scaleOutOptions = {};
                if (animConfig.scaleOut.ease) scaleOutOptions.ease = animConfig.scaleOut.ease;
                effect.scaleOut(animConfig.scaleOut.value, animConfig.scaleOut.duration, scaleOutOptions);
            }
            if (animConfig.size) effect.size(animConfig.size);

            // === MIRRORING ===
            if (animConfig.mirrorX !== undefined) effect.mirrorX(animConfig.mirrorX);
            if (animConfig.mirrorY !== undefined) effect.mirrorY(animConfig.mirrorY);
            if (animConfig.randomizeMirrorX !== undefined) effect.randomizeMirrorX(animConfig.randomizeMirrorX);
            if (animConfig.randomizeMirrorY !== undefined) effect.randomizeMirrorY(animConfig.randomizeMirrorY);

            // === OPACITY & FADING ===
            if (animConfig.opacity !== undefined) effect.opacity(animConfig.opacity);
            if (animConfig.fadeIn !== undefined) effect.fadeIn(animConfig.fadeIn);
            if (animConfig.fadeOut !== undefined) effect.fadeOut(animConfig.fadeOut);
            if (animConfig.fadeInAudio !== undefined) effect.fadeInAudio(animConfig.fadeInAudio);
            if (animConfig.fadeOutAudio !== undefined) effect.fadeOutAudio(animConfig.fadeOutAudio);

            // === TINTING & FILTERS ===
            if (animConfig.tint !== undefined) effect.tint(animConfig.tint);
            if (animConfig.filter) {
                if (animConfig.filter.type && animConfig.filter.config) {
                    effect.filter(animConfig.filter.type, animConfig.filter.config);
                }
            }

            // === TIMING & DURATION ===
            if (animConfig.duration !== undefined) effect.duration(animConfig.duration);
            if (animConfig.delay !== undefined) effect.delay(animConfig.delay);
            if (animConfig.waitUntilFinished !== undefined) effect.waitUntilFinished(animConfig.waitUntilFinished);

            // === PLAYBACK ===
            if (animConfig.startTime !== undefined) effect.startTime(animConfig.startTime);
            if (animConfig.endTime !== undefined) effect.endTime(animConfig.endTime);
            if (animConfig.timeRange) effect.timeRange(animConfig.timeRange.start, animConfig.timeRange.end);
            if (animConfig.playbackRate !== undefined) effect.playbackRate(animConfig.playbackRate);
            if (animConfig.repeats) effect.repeats(animConfig.repeats.times, animConfig.repeats.delay, animConfig.repeats.delayMin);

            // === LAYER CONTROL ===
            if (animConfig.belowTokens !== undefined) effect.belowTokens(animConfig.belowTokens);
            if (animConfig.belowTiles !== undefined) effect.belowTiles(animConfig.belowTiles);
            if (animConfig.zIndex !== undefined) effect.zIndex(animConfig.zIndex);

            // === ADVANCED ===
            if (animConfig.loopProperty) effect.loopProperty(animConfig.loopProperty.target, animConfig.loopProperty.property, animConfig.loopProperty.options);
            if (animConfig.animateProperty) effect.animateProperty(animConfig.animateProperty.target, animConfig.animateProperty.property, animConfig.animateProperty.options);
            if (animConfig.persist !== undefined) effect.persist(animConfig.persist);
            if (animConfig.name) effect.name(animConfig.name);
            if (animConfig.missed !== undefined) effect.missed(animConfig.missed);
            if (animConfig.private !== undefined) effect.private(animConfig.private);

            // === MASKS ===
            if (animConfig.mask) effect.mask(animConfig.mask);
            if (animConfig.shape) effect.shape(animConfig.shape.type, animConfig.shape.options);

            // === TEXT ===
            if (animConfig.text) effect.text(animConfig.text.content, animConfig.text.options);

            // === SOUND ===
            if (animConfig.sound) {
                let soundEffect = sequence.sound();
                soundEffect.file(animConfig.sound.file);
                if (animConfig.sound.volume !== undefined) soundEffect.volume(animConfig.sound.volume);
                if (animConfig.sound.delay !== undefined) soundEffect.delay(animConfig.sound.delay);
                if (animConfig.sound.fadeIn !== undefined) soundEffect.fadeInAudio(animConfig.sound.fadeIn);
                if (animConfig.sound.fadeOut !== undefined) soundEffect.fadeOutAudio(animConfig.sound.fadeOut);
            }
        }

        // === GESTION TOKENMAGIC ===
        // TokenMagic BEFORE
        if (animationConfig?.tokenMagic) {
            const beforeEffects = animationConfig.tokenMagic.filter(tm => tm.timing === "before");
            for (const tmEffect of beforeEffects) {
                await applyTokenMagic(tmEffect, token, targetLocation);
            }
        }

        // TokenMagic DURING (appliqué juste avant de jouer la séquence)
        if (animationConfig?.tokenMagic) {
            const duringEffects = animationConfig.tokenMagic.filter(tm => tm.timing === "during");
            for (const tmEffect of duringEffects) {
                await applyTokenMagic(tmEffect, token, targetLocation);
            }
        }

        // Jouer la séquence
        await sequence.play();
        console.log("[Animation Player] Séquence d'animation terminée");

        // TokenMagic AFTER
        if (animationConfig?.tokenMagic) {
            const afterEffects = animationConfig.tokenMagic.filter(tm => tm.timing === "after");
            for (const tmEffect of afterEffects) {
                await applyTokenMagic(tmEffect, token, targetLocation);
            }
        }
    }

    // ===== SÉLECTION DE L'ANIMATION =====
    async function selectAnimation() {
        return new Promise((resolve) => {
            // Grouper les animations par mode
            const animationsBySelf = Object.entries(ANIMATION_LIBRARY)
                .filter(([key, anim]) => anim.mode === "self")
                .map(([key, anim]) => `<option value="${key}">${anim.name} - ${anim.description}</option>`)
                .join('');

            const animationsByTarget = Object.entries(ANIMATION_LIBRARY)
                .filter(([key, anim]) => anim.mode === "target")
                .map(([key, anim]) => `<option value="${key}">${anim.name} - ${anim.description}</option>`)
                .join('');

            const animationsByProjectile = Object.entries(ANIMATION_LIBRARY)
                .filter(([key, anim]) => anim.mode === "projectile")
                .map(([key, anim]) => `<option value="${key}">${anim.name} - ${anim.description}</option>`)
                .join('');

            const content = `
                <div style="font-family: Arial, sans-serif;">
                    <p style="margin-bottom: 15px; color: #444;">
                        <strong>Sélectionnez l'animation à jouer :</strong>
                    </p>

                    <div style="margin-bottom: 20px;">
                        <label for="animation-select" style="display: block; margin-bottom: 5px; font-weight: bold; color: #2c3e50;">
                            🎬 Animation
                        </label>
                        <select id="animation-select" size="15" style="width: 100%; padding: 8px; border: 2px solid #3498db; border-radius: 4px; font-size: 14px; height: 400px;">
                            <optgroup label="🎯 Sur le Token (Self)">
                                ${animationsBySelf}
                            </optgroup>
                            <optgroup label="📍 Position Ciblée (Target)">
                                ${animationsByTarget}
                            </optgroup>
                            <optgroup label="🎯 Projectile (Self → Target)">
                                ${animationsByProjectile}
                            </optgroup>
                        </select>
                    </div>

                    <div style="background: #ecf0f1; padding: 10px; border-radius: 4px; border-left: 4px solid #3498db;">
                        <p style="margin: 0; font-size: 12px; color: #555;">
                            <strong>ℹ️ Info :</strong> Selon le mode de l'animation, vous devrez peut-être sélectionner une cible avec Portal.
                        </p>
                    </div>
                </div>
            `;

            new Dialog({
                title: "🎨 Animation Player - Sélection",
                content: content,
                buttons: {
                    play: {
                        icon: '<i class="fas fa-play"></i>',
                        label: "Jouer l'Animation",
                        callback: (html) => {
                            const selectedKey = html.find("#animation-select").val();
                            const animation = ANIMATION_LIBRARY[selectedKey];
                            resolve(animation);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "play",
                render: (html) => {
                    html.find("#animation-select").focus();
                }
            }, {
                width: 600,
                height: "auto"
            }).render(true);
        });
    }

    const selectedAnimation = await selectAnimation();
    if (!selectedAnimation) {
        ui.notifications.info("Animation annulée");
        return;
    }

    console.log("[Animation Player] Animation sélectionnée:", selectedAnimation.name, "- Mode:", selectedAnimation.mode);

    // ===== GESTION DU CIBLAGE SELON LE MODE =====
    let targetLocation = null;

    if (selectedAnimation.mode === "target" || selectedAnimation.mode === "projectile") {
        // Utiliser Portal pour sélectionner une cible
        try {
            const crosshairs = await new Portal()
                .color("#3498db")
                .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm")
                .pick();

            if (!crosshairs || crosshairs.cancelled) {
                ui.notifications.warn("Ciblage annulé");
                return;
            }

            targetLocation = { x: crosshairs.x, y: crosshairs.y };
            console.log("[Animation Player] Cible sélectionnée:", targetLocation);

        } catch (error) {
            console.error("[Animation Player] Erreur Portal:", error);
            ui.notifications.error("Erreur lors du ciblage Portal");
            return;
        }
    }

    // ===== JOUER L'ANIMATION =====
    console.log("[Animation Player] Lecture de l'animation:", selectedAnimation.name);
    ui.notifications.info(`🎬 Lecture de l'animation : ${selectedAnimation.name}`);

    await playAnimationSequence(controlledToken, selectedAnimation.sequence, targetLocation, selectedAnimation);

    ui.notifications.success(`✅ Animation terminée : ${selectedAnimation.name}`);

})();
