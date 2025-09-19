/**
 * Macro: Chain Lightning
 * Description: Lightning that chains between multiple targets
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (caster)
 * - Multiple targeted tokens (chain targets)
 * 
 * Usage:
 * 1. Select your caster token
 * 2. Target multiple enemies in the order you want the chain
 * 3. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate selections
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token!");
    return;
}

if (game.user.targets.size < 2) {
    ui.notifications.warn("Please target at least 2 enemies for chain lightning!");
    return;
}

const caster = canvas.tokens.controlled[0];
const targets = Array.from(game.user.targets);

let sequence = new Sequence();

// Initial casting sound
sequence.sound()
    .file("sounds/lightning-cast.wav") // Update path as needed
    .volume(0.8);

// Lightning from caster to first target
sequence.effect()
    .file("jb2a.chain_lightning.primary.blue")
    .atLocation(caster)
    .stretchTo(targets[0])
    .waitUntilFinished();

// Chain between targets
for (let i = 0; i < targets.length - 1; i++) {
    sequence.effect()
        .file("jb2a.chain_lightning.secondary.blue")
        .atLocation(targets[i])
        .stretchTo(targets[i + 1])
        .wait(150); // Small delay between chains
}

// Impact effects on all targets
targets.forEach((target, index) => {
    sequence.effect()
        .file("jb2a.static_electricity.03.blue")
        .atLocation(target)
        .scaleToObject()
        .delay(index * 150); // Stagger impact effects
});

sequence.play();