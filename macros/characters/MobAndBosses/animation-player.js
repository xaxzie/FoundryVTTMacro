/**
 * Animation Player - Utilitaire d'Animation Sequencer
 *
 * Macro utilitaire permettant de lancer des animations Sequencer configurées.
 * Supporte toutes les méthodes et options de l'API Sequencer.
 *
 * Modes de ciblage :
 * - "self" : Animation sur le token contrôlé uniquement
 * - "target" : Animation nécessitant un Portal.pick() (à la position ciblée)
 * - "projectile" : Animation depuis le token contrôlé vers un Portal.pick()
 *
 * Documentation API Sequencer : https://fantasycomputer.works/FoundryVTT-Sequencer/#/api/effect
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
        // === ANIMATIONS SELF (sur le token) ===
        "divine_burst": {
            name: "🌟 Divine Burst",
            description: "Explosion divine avec onde de choc",
            mode: "self",
            sequence: [
                {
                    file: "jb2a.divine_smite.caster.blueyellow",
                    atLocation: true,
                    scale: 1.5,
                    waitUntilFinished: -1000
                },
                {
                    file: "jb2a_patreon.extras.tmfx.inpulse.circle.01.normal",
                    atLocation: true,
                    scale: 2,
                    fadeIn: 200,
                    fadeOut: 500
                }
            ]
        },
        "shadow_expulse": {
            name: "🌑 Expulsion d'Ombre",
            description: "Effet de téléportation sombre",
            mode: "self",
            sequence: [
                {
                    file: "jb2a_patreon.misty_step.01.purple",
                    atLocation: true,
                    scale: 0.8,
                    duration: 1500,
                    fadeIn: 300,
                    fadeOut: 500
                }
            ]
        },
        "healing_aura": {
            name: "💚 Aura de Soin",
            description: "Aura de guérison verte pulsante",
            mode: "self",
            sequence: [
                {
                    file: "jb2a.healing_generic.burst.greenorange",
                    atLocation: true,
                    scale: 1.2,
                    waitUntilFinished: -500
                },
                {
                    file: "jb2a.template_circle.aura.03.outward.001.loop.part02.blue",
                    atLocation: true,
                    scale: 1,
                    duration: 3000,
                    fadeIn: 500,
                    fadeOut: 1000,
                    opacity: 0.6
                }
            ]
        },
        "fire_explosion": {
            name: "🔥 Explosion de Feu",
            description: "Grande explosion enflammée",
            mode: "self",
            sequence: [
                {
                    file: "jb2a_patreon.explosion.orange.1",
                    atLocation: true,
                    scale: 2,
                    randomizeMirrorY: true
                },
                {
                    file: "jb2a.ground_cracks.orange.02",
                    atLocation: true,
                    scale: 1.5,
                    belowTokens: true,
                    fadeIn: 500,
                    duration: 5000,
                    fadeOut: 1000
                }
            ]
        },
        "lightning_strike": {
            name: "⚡ Frappe Éclair",
            description: "Éclair frappant depuis le ciel",
            mode: "self",
            sequence: [
                {
                    file: "jb2a.chain_lightning.primary.blue",
                    atLocation: true,
                    stretchTo: { x: controlledToken.x, y: controlledToken.y - 500 },
                    waitUntilFinished: -800
                },
                {
                    file: "jb2a.static_electricity.01.blue",
                    atLocation: true,
                    scale: 0.5,
                    fadeIn: 200,
                    fadeOut: 500
                }
            ]
        },
        "ice_prison": {
            name: "❄️ Prison de Glace",
            description: "Formation de glace emprisonnante",
            mode: "self",
            sequence: [
                {
                    file: "jb2a_patreon.ice_spikes.radial.burst.blue",
                    atLocation: true,
                    scale: 1,
                    waitUntilFinished: -500
                },
                {
                    file: "jb2a_patreon.wall_of_force.horizontal.blue",
                    atLocation: true,
                    scale: 0.8,
                    opacity: 0.7,
                    duration: 3000,
                    fadeIn: 300,
                    fadeOut: 500
                }
            ]
        },
        "mechanical_summon": {
            name: "⚙️ Invocation Mécanique",
            description: "Cercle mécanique avec impact",
            mode: "self",
            sequence: [
                {
                    file: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                    atLocation: true,
                    scaleToObject: 2.0,
                    belowTokens: true,
                    fadeIn: 300,
                    fadeOut: 500,
                    waitUntilFinished: -800
                },
                {
                    file: "jb2a_patreon.impact.ground_crack.03.blue",
                    atLocation: true,
                    scale: 1.5,
                    belowTokens: true
                }
            ]
        },
        "darkness_aura": {
            name: "🌑 Aura de Ténèbres",
            description: "Ténèbres enveloppantes persistantes",
            mode: "self",
            sequence: [
                {
                    file: "jb2a.darkness.black",
                    atLocation: true,
                    scale: 0.5,
                    fadeIn: 1000,
                    fadeOut: 1000,
                    opacity: 0.8,
                    persist: true
                },
                {
                    file: "jb2a_patreon.portals.horizontal.ring.dark_purple",
                    atLocation: true,
                    scale: 1,
                    belowTokens: true,
                    persist: true,
                    fadeIn: 500,
                    fadeOut: 500,
                    opacity: 0.5
                }
            ]
        },

        // === ANIMATIONS TARGET (à une position ciblée) ===
        "target_explosion": {
            name: "💥 Explosion Ciblée",
            description: "Explosion rouge à la position ciblée",
            mode: "target",
            sequence: [
                {
                    file: "jb2a_patreon.explosion.04.orange",
                    atLocation: "target",
                    scale: 2,
                    randomizeMirrorY: true
                },
                {
                    file: "jb2a.impact.ground_crack.02.orange",
                    atLocation: "target",
                    scale: 1.5,
                    belowTokens: true,
                    fadeIn: 300,
                    fadeOut: 1000,
                    duration: 3000
                }
            ]
        },
        "meteor_strike": {
            name: "☄️ Chute de Météore",
            description: "Météore tombant du ciel",
            mode: "target",
            sequence: [
                {
                    file: "jb2a.boulder.toss.02.01.stone.brown",
                    atLocation: { x: "target.x", y: "target.y - 800" },
                    stretchTo: "target",
                    waitUntilFinished: -500
                },
                {
                    file: "jb2a_patreon.explosion.orange.2",
                    atLocation: "target",
                    scale: 2.5,
                    waitUntilFinished: -800
                },
                {
                    file: "jb2a.ground_cracks.orange.02",
                    atLocation: "target",
                    scale: 2,
                    belowTokens: true,
                    fadeIn: 500,
                    duration: 5000,
                    fadeOut: 1000
                }
            ]
        },
        "healing_circle": {
            name: "🌿 Cercle de Guérison",
            description: "Zone de guérison au sol",
            mode: "target",
            sequence: [
                {
                    file: "jb2a.healing_generic.burst.greenorange",
                    atLocation: "target",
                    scale: 1.5
                },
                {
                    file: "jb2a.template_circle.aura.02.loop.large.bluepink",
                    atLocation: "target",
                    scale: 1.5,
                    belowTokens: true,
                    duration: 4000,
                    fadeIn: 500,
                    fadeOut: 1000,
                    opacity: 0.6
                }
            ]
        },
        "ice_field": {
            name: "🧊 Champ de Glace",
            description: "Zone gelée au sol",
            mode: "target",
            sequence: [
                {
                    file: "jb2a_patreon.impact.ground_crack.blue.02",
                    atLocation: "target",
                    scale: 2,
                    belowTokens: true,
                    waitUntilFinished: -500
                },
                {
                    file: "jb2a_patreon.ice_spikes.radial.burst.blue",
                    atLocation: "target",
                    scale: 1.5,
                    waitUntilFinished: -1000
                },
                {
                    file: "jb2a.template_circle.aura.01.loop.small.bluepurple",
                    atLocation: "target",
                    scale: 2,
                    belowTokens: true,
                    duration: 4000,
                    fadeIn: 500,
                    fadeOut: 1000,
                    opacity: 0.5
                }
            ]
        },
        "shadow_zone": {
            name: "👤 Zone d'Ombre",
            description: "Nuage d'ombre à une position",
            mode: "target",
            sequence: [
                {
                    file: "jb2a_patreon.misty_step.01.purple",
                    atLocation: "target",
                    scale: 0.4,
                    tint: "#000000",
                    fadeIn: 300,
                    fadeOut: 500
                },
                {
                    file: "jb2a_patreon.portals.horizontal.ring.dark_purple",
                    atLocation: "target",
                    scale: 1,
                    belowTokens: true,
                    duration: 5000,
                    fadeIn: 500,
                    fadeOut: 1000,
                    opacity: 0.6,
                    persist : true
                }
            ]
        },
        "rune_activation": {
            name: "🔮 Activation de Rune",
            description: "Rune magique apparaissant",
            mode: "target",
            sequence: [
                {
                    file: "jb2a.magic_signs.rune.illusion.intro.purple",
                    atLocation: "target",
                    scale: 0.5,
                    belowTokens: true,
                    waitUntilFinished: -1000
                },
                {
                    file: "jb2a.magic_signs.rune.illusion.loop.purple",
                    atLocation: "target",
                    scale: 0.5,
                    belowTokens: true,
                    duration: 5000,
                    fadeIn: 500,
                    fadeOut: 1000,
                    opacity: 0.7
                }
            ]
        },

        // === ANIMATIONS PROJECTILE (depuis token vers cible) ===
        "fire_bolt": {
            name: "🔥 Trait de Feu",
            description: "Projectile de feu classique",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a.fire_bolt.orange",
                    atLocation: true,
                    stretchTo: "target",
                    waitUntilFinished: -500
                },
                {
                    file: "jb2a.explosion.01.orange",
                    atLocation: "target",
                    scale: 1.5
                }
            ]
        },
        "magic_missile": {
            name: "✨ Projectile Magique",
            description: "Missile magique bleu classique",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a_patreon.magic_missile",
                    atLocation: true,
                    stretchTo: "target",
                    waitUntilFinished: -200
                },
                {
                    file: "jb2a.explosion.04.blue",
                    atLocation: "target",
                    scale: 0.8
                }
            ]
        },
        "lightning_beam": {
            name: "⚡ Rayon de Foudre",
            description: "Faisceau électrique continu",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a.chain_lightning.primary.blue",
                    atLocation: true,
                    stretchTo: "target",
                    waitUntilFinished: -800
                },
                {
                    file: "jb2a.static_electricity.01.blue",
                    atLocation: "target",
                    scale: 0.5
                }
            ]
        },
        "water_bubbles": {
            name: "💧 Bulles d'Eau",
            description: "Projectiles de bulles multiples",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a.cast_generic.water.02.blue.0",
                    atLocation: true,
                    scale: 0.8,
                    waitUntilFinished: -800
                },
                {
                    file: "jb2a.bullet.03.blue",
                    atLocation: true,
                    stretchTo: "target",
                    waitUntilFinished: -300
                },
                {
                    file: "jb2a.explosion.04.blue",
                    atLocation: "target",
                    scale: 1.2
                }
            ]
        },
        "shadow_dagger": {
            name: "🗡️ Dague d'Ombre",
            description: "Lancer de dague sombre",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a.darkness.black",
                    atLocation: true,
                    scale: 1,
                    duration: 500,
                    fadeIn: 100,
                    fadeOut: 300
                },
                {
                    file: "jb2a_patreon.dagger.throw.01.white",
                    atLocation: true,
                    stretchTo: "target",
                    tint: "#8A2BE2",
                    waitUntilFinished: -200
                },
                {
                    file: "jb2a_patreon.impact.009.white",
                    atLocation: "target",
                    tint: "#8A2BE2",
                    scale: 1.2
                }
            ]
        },
        "energy_beam": {
            name: "🌈 Faisceau Énergétique",
            description: "Rayon d'énergie arc-en-ciel",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a_patreon.energy_strands.range.standard.blue.01",
                    atLocation: true,
                    stretchTo: "target",
                    waitUntilFinished: -500
                },
                {
                    file: "jb2a_patreon.impact.001.blue",
                    atLocation: "target",
                    scale: 1.5,
                    fadeIn: 200,
                    fadeOut: 400
                }
            ]
        },
        "arrow_barrage": {
            name: "🏹 Volée de Flèches",
            description: "Plusieurs flèches tirées",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a.arrow.physical.white.01e",
                    atLocation: true,
                    stretchTo: "target",
                    missed: false,
                    delay: 0
                },
                {
                    file: "jb2a.arrow.physical.white.01",
                    atLocation: true,
                    stretchTo: "target",
                    missed: false,
                    delay: 200,
                    randomOffset: 0.5
                },
                {
                    file: "jb2a.arrow.physical.white.01",
                    atLocation: true,
                    stretchTo: "target",
                    missed: false,
                    delay: 400,
                    randomOffset: 0.5,
                    waitUntilFinished: -300
                },
                {
                    file: "jb2a_patreon.impact.010.orange",
                    atLocation: "target",
                    scale: 1.5
                }
            ]
        },
        "laser_blast": {
            name: "🔴 Rayon Laser",
            description: "Laser rouge concentré",
            mode: "projectile",
            sequence: [
                {
                    file: "jb2a.template_circle.aura.03.inward.003.complete.combined.blue",
                    atLocation: true,
                    scale: 0.2,
                    tint: 0xFF0000,
                    waitUntilFinished: -500
                },
                {
                    file: "jb2a.ray_of_frost.blue",
                    atLocation: true,
                    stretchTo: "target",
                    tint: 0xFF0000,
                    waitUntilFinished: -800
                },
                {
                    file: "jb2a_patreon.explosion.01.orange",
                    atLocation: "target",
                    scale: 1.2
                }
            ]
        },
        "complex_showcase": {
            name: "🎨 Démonstration Complète",
            description: "Animation utilisant toutes les fonctionnalités Sequencer",
            mode: "projectile",
            sequence: [
                // Cast avec rotation et scale
                {
                    file: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                    atLocation: true,
                    scaleToObject: 4,
                    center: true,
                    fadeIn: 300,
                    fadeOut: 1500,
                    scaleOut: { value: 0, duration: 2000 },
                    rotateOut: { angle: 150, duration: 2000, ease: "easeInSine" },
                    belowTokens: true,
                    waitUntilFinished: -1800
                },
                // Projectile avec effet glow
                {
                    file: "jb2a_patreon.energy_strands.range.standard.blue.04",
                    atLocation: true,
                    stretchTo: "target",
                    filter: { type: "Glow", config: { distance: 10, outerStrength: 3, color: 0x70d2ff } },
                    waitUntilFinished: -500
                },
                // Impact multi-couches
                {
                    file: "jb2a_patreon.explosion.orange.2",
                    atLocation: "target",
                    scale: 2,
                    randomizeMirrorY: true,
                    waitUntilFinished: -1000
                },
                {
                    file: "jb2a.ground_cracks.orange.02",
                    atLocation: "target",
                    scale: 1.5,
                    belowTokens: true,
                    fadeIn: 500,
                    duration: 5000,
                    fadeOut: 1000
                },
                // Effet persistant avec opacity
                {
                    file: "jb2a.template_circle.aura.01.loop.small.bluepurple",
                    atLocation: "target",
                    scale: 1.5,
                    opacity: 0.6,
                    fadeIn: 500,
                    fadeOut: 1000,
                    belowTokens: true,
                    persist : true
                }
            ]
        }
    };

    // ===== FONCTION DE LECTURE DE SÉQUENCE D'ANIMATION =====
    /**
     * Joue une séquence d'animations Sequencer configurée
     * @param {Object} token - Token depuis lequel jouer l'animation
     * @param {Array} animationSequence - Configuration de la séquence
     * @param {Object} targetLocation - Position de la cible (optionnel)
     */
    async function playAnimationSequence(token, animationSequence, targetLocation = null) {
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

        // Jouer la séquence
        await sequence.play();
        console.log("[Animation Player] Séquence d'animation terminée");
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

    await playAnimationSequence(controlledToken, selectedAnimation.sequence, targetLocation);

    ui.notifications.success(`✅ Animation terminée : ${selectedAnimation.name}`);

})();
