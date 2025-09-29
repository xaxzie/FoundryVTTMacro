/**
 * Macro: Moving Token Animation
 * Description: Animates a token moving to a target location
 * 
 * Requirements:
 * - One selected token
 * - One targeted token (destination)
 * 
 * Usage:
 * 1. Select the token you want to move
 * 2. Target the destination token
 * 3. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 */

// Validate selections
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a token to move!");
    return;
}

if (!game.user.targets.size) {
    ui.notifications.warn("Please target a destination!");
    return;
}

const movingToken = canvas.tokens.controlled[0];
const destination = Array.from(game.user.targets)[0];

// Animate token movement
new Sequence()
    .animation()
        .on(movingToken)
        .moveTowards(destination)
        .snapToGrid()
        .waitUntilFinished()
    .play();