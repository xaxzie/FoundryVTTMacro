/**
 * Macro: Token Flash Effect
 * Description: Creates a glowing flash effect on the selected token
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token
 * 
 * Usage:
 * 1. Select a token on the canvas
 * 2. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate token selection
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a token first!");
    return;
}

const token = canvas.tokens.controlled[0];

// Create flash effect
new Sequence()
    .effect()
        .file("jb2a.impact.ground_crack.orange.02")
        .atLocation(token)
        .scaleToObject(1.5)
        .fadeIn(200)
        .fadeOut(800)
        .belowTokens()
    .play();