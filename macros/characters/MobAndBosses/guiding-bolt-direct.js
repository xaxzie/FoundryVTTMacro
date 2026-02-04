/**
 * Guiding Bolt Direct - Animation directe de trait guidé
 *
 * Macro qui lance directement l'animation de guiding bolt depuis le token contrôlé vers une cible.
 * Basée sur l'Animation Player mais déclenchée directement sans menu.
 */

(async () => {
    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Aucun token sélectionné !");
        return;
    }

    const controlledToken = canvas.tokens.controlled[0];

    // ===== CONFIGURATION DE L'ANIMATION =====
    const animationConfig = {
        name: "🌟 Trait Guidé",
        description: "Projectile lumineux guidé vers la cible",
        mode: "projectile",
        sequence: [
            {
                file: "jb2a_patreon.guiding_bolt.02.dark_bluewhite",
                atLocation: true,
                stretchTo: "target",
                waitUntilFinished: -300,
            },
            {
                file: "jb2a.explosion.04.blue",
                atLocation: "target",
                scale: 1.2,
                tint: 0x87ceeb,
            },
        ],
    };

    // ===== SÉLECTION DE LA CIBLE =====
    let targetPosition;

    try {
        const portal = new Portal()
            .origin(controlledToken)
            .range(120)
            .color('#87ceeb')
            .texture('modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm');

        targetPosition = await portal.pick();
    } catch (error) {
        console.log("Animation annulée par l'utilisateur");
        return;
    }

    if (!targetPosition) {
        ui.notifications.warn("❌ Aucune cible sélectionnée");
        return;
    }

    // ===== EXÉCUTION DE L'ANIMATION =====
    console.log(`🎬 Lancement de l'animation: ${animationConfig.name}`);

    try {
        const sequence = new Sequence();

        // Configuration de chaque effet de la séquence
        for (const effectConfig of animationConfig.sequence) {
            let effect = sequence.effect().file(effectConfig.file);

            // Application des options communes
            if (effectConfig.atLocation === true) {
                effect = effect.atLocation(controlledToken);
            } else if (effectConfig.atLocation === "target") {
                effect = effect.atLocation(targetPosition);
            }

            if (effectConfig.stretchTo === "target") {
                effect = effect.stretchTo(targetPosition);
            }

            if (effectConfig.waitUntilFinished !== undefined) {
                effect = effect.waitUntilFinished(effectConfig.waitUntilFinished);
            }

            if (effectConfig.scale !== undefined) {
                effect = effect.scale(effectConfig.scale);
            }

            if (effectConfig.tint !== undefined) {
                effect = effect.tint(effectConfig.tint);
            }
        }

        // Exécution de la séquence
        await sequence.play();

        console.log("✅ Animation terminée avec succès");

    } catch (error) {
        console.error("❌ Erreur lors de l'exécution de l'animation:", error);
        ui.notifications.error(`Erreur d'animation: ${error.message}`);
    }
})();
