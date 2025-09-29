/**
 * Macro: Acid Splash Spell
 * Description: Recreates the Acid Splash example from Sequencer documentation
 * 
 * Requirements:
 * - Animated Cartoon Spell Effects module
 * - Two selected tokens
 * 
 * Usage:
 * 1. Select exactly two tokens
 * 2. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires animated-spell-effects-cartoon
 */

// Validate token selection
if (canvas.tokens.controlled.length !== 2) {
    ui.notifications.warn("Please select exactly two tokens!");
    return;
}

const token1 = canvas.tokens.controlled[0];
const token2 = canvas.tokens.controlled[1];

// Create acid splash effect on both tokens
new Sequence()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/water/acid_splash_CIRCLE_01.webm")
        .atLocation(token1)
        .scale(0.3, 0.6)
        .randomRotation()
    .effect()
        .file("modules/animated-spell-effects-cartoon/spell-effects/cartoon/water/acid_splash_CIRCLE_01.webm")
        .atLocation(token2)
        .scale(0.3, 0.6)
        .randomRotation()
    .play();