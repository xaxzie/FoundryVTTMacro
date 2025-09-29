/**
 * Macro: Multi-Target Effect
 * Description: Applies an effect to all targeted tokens
 * 
 * Requirements:
 * - JB2A module installed
 * - One or more targeted tokens
 * 
 * Usage:
 * 1. Target one or more tokens
 * 2. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate targets
if (!game.user.targets.size) {
    ui.notifications.warn("Please target at least one token!");
    return;
}

const targets = Array.from(game.user.targets);

// Create sequence for multiple targets
let sequence = new Sequence();

// Add effect for each target
targets.forEach((target, index) => {
    sequence.effect()
        .file("jb2a.healing_generic.burst.yellowwhite")
        .atLocation(target)
        .scaleToObject(0.8)
        .wait(300); // Stagger effects by 300ms
});

sequence.play();