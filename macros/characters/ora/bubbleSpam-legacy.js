/**
 * Bubble Spam - Rapid Fire Water Bubbles
 *
 * UTILITY MACRO for Continuous Bubble Shooting
 *
 * Description: Allows rapid-fire bubble shooting with Portal targeting
 * - No prompts or dialogs - immediate action
 * - Continuous Portal targeting until ESC is pressed
 * - Water bubble projectile from caster to target
 * - Simple spam-click interface for rapid shooting
 *
 * Usage:
 * 1. Select your character token
 * 2. Run this macro
 * 3. Click anywhere to shoot bubbles
 * 4. Press ESC to exit
 *
 * Prerequisites:
 * - Sequencer module
 * - JB2A effects
 */

(async () => {
    // Validate basic requirements
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de votre personnage !");
        return;
    }

    const caster = canvas.tokens.controlled[0];

    if (!caster) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    ui.notifications.info("Mode Bubble Spam activé ! Cliquez n'importe où pour tirer des bulles. ESC pour quitter.");

    // Set up canvas click handler for bubble shooting
    let isActive = true;

    const shootBubble = (event) => {
        if (!isActive) return;

        // Get canvas coordinates
        const rect = canvas.app.view.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Convert to world coordinates
        const target = canvas.stage.toLocal({ x, y });

        // Create bubble projectile animation
        let bubbleSequence = new Sequence();

        // Bubble projectile from caster to target
        bubbleSequence.effect()
            .file("jb2a.bullet.03.blue")
            .atLocation(caster)
            .stretchTo(target)
            .scale(0.8)
            .duration(1000)
            .waitUntilFinished(-200); // Start next effect 200ms before this ends

        // Bubble impact/splash at target
        bubbleSequence.effect()
            .file("jb2a.explosion.04.blue")
            .atLocation(target)
            .scale(0.6)
            .duration(800);

        // Play the bubble animation (non-blocking for rapid fire)
        bubbleSequence.play();
    };

    const exitSpam = (event) => {
        if (event.key === "Escape") {
            isActive = false;
            canvas.app.view.removeEventListener('click', shootBubble);
            document.removeEventListener('keydown', exitSpam);
            ui.notifications.info("Mode Bubble Spam désactivé.");
        }
    };

    // Add event listeners
    canvas.app.view.addEventListener('click', shootBubble);
    document.addEventListener('keydown', exitSpam);
})();
