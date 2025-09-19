/**
 * Macro: Rotating Effect
 * Description: Creates an effect that rotates around a token
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

// Create rotating effect
new Sequence()
    .effect()
        .file("jb2a.shield.03.intro.blue")
        .atLocation(token)
        .scaleToObject(2)
        .rotateIn(180, 1000) // Rotate in over 1 second
        .fadeIn(500)
        .duration(3000)
        .fadeOut(500)
        .rotateOut(180, 1000) // Rotate out over 1 second
    .play();