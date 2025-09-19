/**
 * Macro: Effect with Sound
 * Description: Combines visual effect with sound for enhanced immersion
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token
 * - Sound file (update path as needed)
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

// Combine effect and sound
new Sequence()
    .sound()
        .file("sounds/magic-spell.wav") // Update this path
        .volume(0.6)
    .effect()
        .file("jb2a.cure_wounds.400px.blue")
        .atLocation(token)
        .scaleToObject(1.2)
        .fadeIn(500)
        .fadeOut(1000)
    .play();