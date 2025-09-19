/**
 * Macro: Cure Wounds (D&D 5e)
 * Description: Healing spell with soothing light effect
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (caster)
 * - One targeted token (target to heal)
 * 
 * Usage:
 * 1. Select your caster token
 * 2. Target the creature to heal
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

if (!game.user.targets.size) {
    ui.notifications.warn("Please target a creature to heal!");
    return;
}

const caster = canvas.tokens.controlled[0];
const target = Array.from(game.user.targets)[0];

// Check if target is within range (Touch spell = adjacent)
const distance = canvas.grid.measureDistance(caster.center, target.center);
const maxRange = canvas.grid.size * 1.5; // Allow diagonal touch

if (distance > maxRange) {
    ui.notifications.warn("Target is too far away! Cure Wounds requires touch range.");
    return;
}

// Create healing sequence
new Sequence()
    // Gentle casting sound
    .sound()
        .file("sounds/healing-gentle.wav") // Update path as needed
        .volume(0.5)
    
    // Soft light emanating from caster's hands
    .effect()
        .file("jb2a.healing_generic.burst.yellowwhite")
        .atLocation(caster)
        .scaleToObject(0.8)
        .fadeIn(500)
        .duration(1000)
        .fadeOut(500)
    
    // Healing beam from caster to target (if not self-cast)
    .effect()
        .file("jb2a.healing_generic.beam.yellowwhite")
        .atLocation(caster)
        .stretchTo(target)
        .duration(1500)
        .delay(300)
        .opacity(0.8)
        .condition(() => caster !== target) // Only show beam if not self-cast
    
    // Main healing effect on target
    .effect()
        .file("jb2a.cure_wounds.400px.blue")
        .atLocation(target)
        .scaleToObject(1.8)
        .delay(500)
        .fadeIn(800)
        .duration(2000)
        .fadeOut(800)
    
    // Golden sparkles around target
    .effect()
        .file("jb2a.healing_generic.burst.yellowwhite")
        .atLocation(target)
        .scaleToObject(1.2)
        .delay(800)
        .fadeIn(300)
        .fadeOut(700)
    
    // Completion sound
    .sound()
        .file("sounds/healing-complete.wav") // Update path as needed
        .volume(0.6)
        .delay(1500)
    
    // Notification
    .thenDo(() => {
        ui.notifications.info(`${caster.name} heals ${target.name} with Cure Wounds!`);
        
        // Optional: Roll healing dice if using a compatible system
        // const healingRoll = new Roll("1d8 + 3"); // Level 1 + modifier
        // healingRoll.evaluate({ async: false });
        // ui.notifications.info(`Healed for ${healingRoll.total} hit points!`);
    })
    
    .play();