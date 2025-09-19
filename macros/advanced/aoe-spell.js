/**
 * Macro: Area of Effect Spell
 * Description: Crosshair-targeted AoE spell with multiple effects
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (caster)
 * 
 * Usage:
 * 1. Select your caster token
 * 2. Execute this macro
 * 3. Click to target the area of effect
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate token selection
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token!");
    return;
}

const caster = canvas.tokens.controlled[0];

// Show crosshair for area targeting
ui.notifications.info("Select area for spell effect...");
const position = await Sequencer.Crosshair.show({
    size: 4, // 4x4 grid area
    gridHighlight: true,
    label: {
        text: "Meteor Impact",
        backgroundColor: "#ff4500",
        fontSize: 24
    }
});

// Exit if user cancelled
if (!position) {
    return;
}

// Calculate affected tokens in the area
const gridSize = canvas.grid.size;
const areaRadius = 2 * gridSize; // 2 grid squares radius
const affectedTokens = canvas.tokens.placeables.filter(token => {
    const distance = canvas.grid.measureDistance(position, token.center);
    return distance <= areaRadius;
});

ui.notifications.info(`Spell affects ${affectedTokens.length} tokens in the area.`);

// Execute the area spell sequence
let sequence = new Sequence();

// Casting effect at caster
sequence.effect()
    .file("jb2a.energy_beam.normal.orange.03")
    .atLocation(caster)
    .stretchTo(position)
    .duration(1500);

// Warning circle at target area
sequence.effect()
    .file("jb2a.markers.circle_of_stars.orange")
    .atLocation(position)
    .scale(4)
    .belowTokens()
    .fadeIn(500)
    .duration(1000)
    .fadeOut(500);

// Wait for buildup
sequence.wait(1500);

// Main explosion
sequence.effect()
    .file("jb2a.fireball.explosion.orange")
    .atLocation(position)
    .scale(4);

// Sound effect
sequence.sound()
    .file("sounds/explosion.wav") // Update path as needed
    .volume(0.9);

// Individual effects on affected tokens
affectedTokens.forEach((token, index) => {
    sequence.effect()
        .file("jb2a.impact.fire.01.orange")
        .atLocation(token)
        .scaleToObject(1.5)
        .delay(index * 50) // Stagger individual impacts
        .randomRotation();
});

// Smoke aftermath
sequence.effect()
    .file("jb2a.smoke.puff.centered.grey.2")
    .atLocation(position)
    .scale(3)
    .delay(1000)
    .fadeIn(1000)
    .fadeOut(2000);

sequence.play();