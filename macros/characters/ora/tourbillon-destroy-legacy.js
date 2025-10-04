/**
 * Tourbillon Destroyer - Remove Vortex Effects
 *
 * UTILITY MACRO for Tourbillon Spell Management
 *
 * Description: Automatically destroys the closest vortex effect
 * - Uses Portal module for visual targeting
 * - Detects nearest vortex effect at selected position
 * - Removes persistent Sequencer effects instantly
 * - No prompts or chat messages - immediate destruction
 *
 * Usage:
 * 1. Run this macro
 * 2. Use Portal targeting to select vortex location
 * 3. Effect is automatically destroyed
 *
 * Prerequisites:
 * - Sequencer module
 * - Portal module for targeting
 * - Active vortex effects created by tourbillon.js
 */

(async () => {
    // === PORTAL TARGETING FOR VORTEX DESTRUCTION ===
    let selectedPosition;
    try {
        const portal = new Portal()
            .range(200) // Large range for destruction targeting
            .color("#ff4444") // Red color to indicate destruction
            .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm");

        const target = await portal.pick();

        if (!target) {
            return; // Silently cancel if no target selected
        }

        selectedPosition = { x: target.x, y: target.y };
    } catch (error) {
        // Fallback to notification if Portal module is not available
        ui.notifications.error("Erreur: Module Portal requis pour le ciblage.");
        return;
    }

    // Find all active Sequencer effects
    const activeEffects = Sequencer.EffectManager.effects;

    // Find vortex effects near the selected position
    const tolerance = canvas.grid.size * 1.5; // 1.5 grid squares tolerance
    let nearbyVortices = [];

    activeEffects.forEach((effect, id) => {
        // Check if this is a vortex effect
        if (effect.data.name && effect.data.name.includes('tourbillon')) {
            const effectPos = effect.position;
            if (effectPos) {
                const distance = Math.sqrt(
                    Math.pow(effectPos.x - selectedPosition.x, 2) +
                    Math.pow(effectPos.y - selectedPosition.y, 2)
                );

                if (distance <= tolerance) {
                    nearbyVortices.push({
                        id: id,
                        effect: effect,
                        distance: distance,
                        position: effectPos
                    });
                }
            }
        }
    });

    if (nearbyVortices.length === 0) {
        return;
    }

    // Sort by distance and take the closest
    nearbyVortices.sort((a, b) => a.distance - b.distance);
    const closestVortex = nearbyVortices[0];

    // Play destruction splash animation
    let destructionSequence = new Sequence();

    // Water splash effect (same as creation)
    destructionSequence.effect()
        .file("animated-spell-effects-cartoon.water.water splash.01")
        .atLocation(closestVortex.position)
        .scale(0.6)
        .belowTokens();

    // Play the destruction animation
    await destructionSequence.play();

    // Remove the persistent vortex effect (fadeOut configured at creation)
    try {
        await Sequencer.EffectManager.endEffects({ name: closestVortex.effect.data.name });
    } catch (error) {
        console.error(`[ERROR] Erreur lors de la suppression de l'effet:`, error);
    }
})();
