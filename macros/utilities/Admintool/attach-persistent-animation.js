/**
 * Attach Persistent Animation to Token
 *
 * Simple utility to attach a persistent animation to the selected token.
 * Configure the animation settings directly in the ANIMATION_CONFIG below.
 *
 * Usage: Select a token and run this macro.
 * The animation will persist until manually removed via Sequencer Effect Manager.
 */

(async () => {
    // ===== CONFIGURATION =====
    const ANIMATION_CONFIG = {
        // Animation file path (JB2A or other Sequencer-compatible animation)
        file: "jb2a.magic_signs.circle.02.evocation.loop.blue",

        // Animation name (must be unique per token, used for identification)
        // Leave empty to auto-generate based on token name
        name: "",

        // Scale of the animation (1.0 = normal size)
        scale: 1.0,

        // Opacity (0.0 to 1.0)
        opacity: 0.8,

        // Rotation in degrees (0-360)
        rotation: 0,

        // Tint color (hex color code, or null for no tint)
        tint: null, // Example: "#ff0000" for red

        // Animation offset from token center
        offset: {
            x: 0,  // Pixels offset horizontally
            y: 0   // Pixels offset vertically
        },

        // Z-index positioning
        belowTokens: false,  // true = below token, false = above token

        // Fade effects
        fadeIn: 500,   // Fade in duration in ms
        fadeOut: 500   // Fade out duration in ms
    };

    // ===== VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Select a token first!");
        return;
    }

    if (typeof Sequence === "undefined") {
        ui.notifications.error("❌ Sequencer module not available!");
        return;
    }

    const token = canvas.tokens.controlled[0];

    // Generate animation name if not provided
    const animationName = ANIMATION_CONFIG.name || `persistent_anim_${token.name}_${Date.now()}`;

    // ===== CREATE PERSISTENT ANIMATION =====
    try {
        const sequence = new Sequence();

        let effect = sequence
            .effect()
            .file(ANIMATION_CONFIG.file)
            .name(animationName)
            .attachTo(token)
            .scale(ANIMATION_CONFIG.scale)
            .opacity(ANIMATION_CONFIG.opacity)
            .persist(true)
            .fadeIn(ANIMATION_CONFIG.fadeIn)
            .fadeOut(ANIMATION_CONFIG.fadeOut);

        // Apply optional settings
        if (ANIMATION_CONFIG.rotation !== 0) {
            effect.rotate(ANIMATION_CONFIG.rotation);
        }

        if (ANIMATION_CONFIG.tint) {
            effect.tint(ANIMATION_CONFIG.tint);
        }

        if (ANIMATION_CONFIG.offset.x !== 0 || ANIMATION_CONFIG.offset.y !== 0) {
            effect.offset({
                x: ANIMATION_CONFIG.offset.x,
                y: ANIMATION_CONFIG.offset.y
            });
        }

        if (ANIMATION_CONFIG.belowTokens) {
            effect.belowTokens();
        }


        await sequence.play();

        console.log(`[Persistent Animation] Added animation "${animationName}" to token "${token.name}"`);
        ui.notifications.info(`✅ Animation attached to ${token.name}`);

    } catch (error) {
        console.error("[Persistent Animation] Error:", error);
        ui.notifications.error("❌ Failed to attach animation. Check console for details.");
    }
})();
