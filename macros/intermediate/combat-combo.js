/**
 * Macro: Combat Combo Attack
 * Description: Multi-hit combat sequence with effects
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (attacker)
 * - One targeted token (defender)
 * 
 * Usage:
 * 1. Select your attacking token
 * 2. Target the defender
 * 3. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate selections
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select an attacking token!");
    return;
}

if (!game.user.targets.size) {
    ui.notifications.warn("Please target a defender!");
    return;
}

const attacker = canvas.tokens.controlled[0];
const defender = Array.from(game.user.targets)[0];

// Create combo attack sequence
new Sequence()
    // First strike
    .effect()
        .file("jb2a.melee_generic.slashing.one_handed")
        .atLocation(defender)
        .scaleToObject(1.5)
        .randomRotation()
    .sound()
        .file("sounds/sword-hit.wav") // Update path as needed
        .volume(0.7)
    
    // Brief pause
    .wait(400)
    
    // Second strike
    .effect()
        .file("jb2a.melee_generic.slashing.one_handed")
        .atLocation(defender)
        .scaleToObject(1.5)
        .randomRotation()
    .sound()
        .file("sounds/sword-hit.wav") // Update path as needed
        .volume(0.7)
    
    // Brief pause
    .wait(400)
    
    // Final devastating blow
    .effect()
        .file("jb2a.impact.ground_crack.orange.02")
        .atLocation(defender)
        .scaleToObject(2)
        .belowTokens()
    .effect()
        .file("jb2a.melee_generic.slashing.two_handed")
        .atLocation(defender)
        .scaleToObject(2)
        .randomRotation()
    .sound()
        .file("sounds/critical-hit.wav") // Update path as needed
        .volume(0.9)
    
    .play();