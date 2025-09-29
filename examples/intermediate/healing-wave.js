/**
 * Macro: Healing Wave
 * Description: Healing effect that spreads to nearby allies
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (healer)
 * - Targeted tokens (those to be healed)
 * 
 * Usage:
 * 1. Select your healer token
 * 2. Target allies to heal
 * 3. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate selections
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a healer token!");
    return;
}

if (!game.user.targets.size) {
    ui.notifications.warn("Please target allies to heal!");
    return;
}

const healer = canvas.tokens.controlled[0];
const targets = Array.from(game.user.targets);

let sequence = new Sequence();

// Healing sound
sequence.sound()
    .file("sounds/healing.wav") // Update path as needed
    .volume(0.6);

// Central healing burst on healer
sequence.effect()
    .file("jb2a.healing_generic.burst.yellowwhite")
    .atLocation(healer)
    .scaleToObject(2)
    .fadeIn(300)
    .fadeOut(800);

// Healing beams to each target
targets.forEach((target, index) => {
    sequence.effect()
        .file("jb2a.healing_generic.beam.yellowwhite")
        .atLocation(healer)
        .stretchTo(target)
        .delay(200 + index * 100) // Stagger the beams
        .duration(1000);
    
    // Healing effect on each target
    sequence.effect()
        .file("jb2a.healing_generic.burst.yellowwhite")
        .atLocation(target)
        .scaleToObject(1.5)
        .delay(700 + index * 100) // Arrive after beam
        .fadeIn(200)
        .fadeOut(600);
});

sequence.play();