/**
 * Macro: Simple Explosion
 * Description: Creates a basic explosion effect on the selected token
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

// Create simple explosion effect
new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(token)
        .scale(0.8)
    .play();