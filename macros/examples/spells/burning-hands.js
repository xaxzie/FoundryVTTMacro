/**
 * Macro: Burning Hands (D&D 5e)
 * Description: Creates a cone of fire from the caster
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (caster)
 * 
 * Usage:
 * 1. Select your caster token
 * 2. Execute this macro
 * 3. Click to aim the cone direction
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate caster selection
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token!");
    return;
}

const caster = canvas.tokens.controlled[0];

// Show crosshair for cone direction
ui.notifications.info("Click to aim the burning hands cone...");
const targetPosition = await Sequencer.Crosshair.show({
    size: 1,
    gridHighlight: false,
    label: {
        text: "Cone Direction",
        backgroundColor: "#ff4500"
    }
});

if (!targetPosition) {
    return; // User cancelled
}

// Calculate cone area (15-foot cone)
const gridSize = canvas.grid.size;
const coneLength = gridSize * 3; // 15 feet = 3 squares
const coneWidth = gridSize * 3;   // 15 feet wide at end

// Calculate angle from caster to target
const dx = targetPosition.x - caster.center.x;
const dy = targetPosition.y - caster.center.y;
const angle = Math.atan2(dy, dx) * (180 / Math.PI);

// Find tokens in cone area
function isTokenInCone(token, casterPos, targetPos, coneLength, coneWidth) {
    const tokenPos = token.center;
    
    // Vector from caster to token
    const dx = tokenPos.x - casterPos.x;
    const dy = tokenPos.y - casterPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Skip if token is too far
    if (distance > coneLength) return false;
    
    // Vector from caster to target (cone direction)
    const targetDx = targetPos.x - casterPos.x;
    const targetDy = targetPos.y - casterPos.y;
    const targetDistance = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
    
    // Normalize vectors
    const tokenAngle = Math.atan2(dy, dx);
    const coneAngle = Math.atan2(targetDy, targetDx);
    
    // Calculate angle difference
    let angleDiff = Math.abs(tokenAngle - coneAngle);
    if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
    
    // Cone gets wider as it goes out (15-degree spread on each side)
    const maxAngle = Math.PI / 6; // 30 degrees total (15 each side)
    
    return angleDiff <= maxAngle;
}

// Find affected tokens
const affectedTokens = canvas.tokens.placeables.filter(token => 
    token !== caster && isTokenInCone(token, caster.center, targetPosition, coneLength, coneWidth)
);

// Create burning hands sequence
let sequence = new Sequence();

// Casting sound
sequence.sound()
    .file("sounds/fire-whoosh.wav") // Update path as needed
    .volume(0.8);

// Main cone effect
sequence.effect()
    .file("jb2a.breath_weapons02.burst.cone.fire.orange.02")
    .atLocation(caster)
    .rotateTowards(targetPosition)
    .scale(1.5)
    .duration(2000);

// Hand gesture effect on caster
sequence.effect()
    .file("jb2a.fire_jet.orange")
    .atLocation(caster)
    .rotateTowards(targetPosition)
    .scale(0.8)
    .duration(1500);

// Individual burn effects on affected tokens
affectedTokens.forEach((token, index) => {
    sequence.effect()
        .file("jb2a.impact.fire.01.orange")
        .atLocation(token)
        .scaleToObject(1.2)
        .delay(300 + index * 100) // Stagger impacts
        .randomRotation();
    
    // Burning effect
    sequence.effect()
        .file("jb2a.fire_jet.orange")
        .atLocation(token)
        .scaleToObject(0.6)
        .delay(500 + index * 100)
        .duration(1500)
        .fadeOut(500);
});

// Results notification
sequence.thenDo(() => {
    if (affectedTokens.length > 0) {
        ui.notifications.info(`Burning Hands affects ${affectedTokens.length} creatures!`);
        
        // List affected tokens
        const names = affectedTokens.map(t => t.name).join(", ");
        ui.notifications.warn(`Affected: ${names}`);
    } else {
        ui.notifications.info("Burning Hands affects no creatures.");
    }
});

sequence.play();