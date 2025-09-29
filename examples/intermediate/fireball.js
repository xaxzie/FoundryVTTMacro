/**
 * Macro: Fireball Spell
 * Description: Complete fireball effect with projectile and explosion
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (caster)
 * - One targeted token or area
 * 
 * Usage:
 * 1. Select your caster token
 * 2. Target an enemy or area
 * 3. Execute this macro
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
let target;

// Get target (either targeted token or use crosshair)
if (game.user.targets.size) {
    target = Array.from(game.user.targets)[0];
    castFireball(caster, target);
} else {
    // Use crosshair if no target selected
    ui.notifications.info("Click to target fireball location...");
    const position = await Sequencer.Crosshair.show({
        size: 3,
        label: {
            text: "Fireball Target",
            backgroundColor: "#ff4500"
        }
    });
    
    if (!position) {
        return; // User cancelled
    }
    
    castFireball(caster, position);
}

function castFireball(caster, target) {
    new Sequence()
        // Casting sound
        .sound()
            .file("sounds/fire-cast.wav") // Update path as needed
            .volume(0.7)
        // Fireball projectile
        .effect()
            .file("jb2a.fireball")
            .atLocation(caster)
            .stretchTo(target)
            .waitUntilFinished()
        // Explosion
        .effect()
            .file("jb2a.fireball.explosion.orange")
            .atLocation(target)
            .scale(2)
        // Explosion sound
        .sound()
            .file("sounds/explosion.wav") // Update path as needed
            .volume(0.8)
        .play();
}