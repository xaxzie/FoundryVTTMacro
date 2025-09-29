/**
 * Macro: Environmental Trap
 * Description: Creates an interactive trap with detection and triggered effects
 * 
 * Requirements:
 * - JB2A module installed
 * - GM permissions (for creating tiles and managing trap state)
 * 
 * Usage:
 * 1. Execute this macro as GM
 * 2. Click to place the trap
 * 3. Players moving near the trap will trigger it
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Check GM permissions
if (!game.user.isGM) {
    ui.notifications.warn("This macro requires GM permissions!");
    return;
}

// Show crosshair for trap placement
ui.notifications.info("Place the fire trap...");
const position = await Sequencer.Crosshair.show({
    size: 1,
    gridHighlight: true,
    label: {
        text: "Fire Trap",
        backgroundColor: "#ff4500"
    }
});

if (!position) {
    return; // User cancelled
}

// Create hidden trap marker (tile)
const trapTileData = {
    texture: {
        src: "modules/jb2a_patreon/Library/Generic/Template/Circle/TemplateCircle_01_Regular_Orange_15ft_1500x1500.webm"
    },
    x: position.x - 75, // Center the 150px tile
    y: position.y - 75,
    width: 150,
    height: 150,
    alpha: 0.3, // Semi-transparent
    overhead: false,
    roof: false,
    hidden: true, // Hidden from players initially
    flags: {
        "fire-trap": {
            isArmed: true,
            damage: "2d6",
            triggered: false
        }
    }
};

// Create the trap tile
const trapTile = await canvas.scene.createEmbeddedDocuments("Tile", [trapTileData]);
const trap = trapTile[0];

ui.notifications.info("Fire trap placed! It will trigger when a token moves nearby.");

// Set up trap detection
const originalUpdatePosition = Token.prototype._onUpdate;
Token.prototype._onUpdate = function(data, options, userId) {
    // Call original method
    originalUpdatePosition.call(this, data, options, userId);
    
    // Check for trap trigger
    if (data.x !== undefined || data.y !== undefined) {
        checkTrapTrigger(this, trap);
    }
};

function checkTrapTrigger(token, trap) {
    // Skip if trap is not armed or already triggered
    if (!trap.flags["fire-trap"]?.isArmed || trap.flags["fire-trap"]?.triggered) {
        return;
    }
    
    // Calculate distance to trap center
    const trapCenter = {
        x: trap.x + trap.width / 2,
        y: trap.y + trap.height / 2
    };
    
    const distance = canvas.grid.measureDistance(token.center, trapCenter);
    
    // Trigger if within 1 grid square
    if (distance <= canvas.grid.size) {
        triggerFireTrap(token, trap);
    }
}

async function triggerFireTrap(token, trap) {
    // Mark trap as triggered
    await trap.update({
        "flags.fire-trap.triggered": true,
        "flags.fire-trap.isArmed": false,
        hidden: false // Reveal the trap
    });
    
    ui.notifications.warn(`${token.name} triggered a fire trap!`);
    
    // Create trap effects
    const trapCenter = {
        x: trap.x + trap.width / 2,
        y: trap.y + trap.height / 2
    };
    
    new Sequence()
        // Warning rumble
        .effect()
            .file("jb2a.impact.ground_crack.still_frame.02")
            .atLocation(trapCenter)
            .scale(2)
            .belowTokens()
            .fadeIn(200)
            .duration(500)
        
        .wait(300)
        
        // Fire explosion
        .effect()
            .file("jb2a.fireball.explosion.orange")
            .atLocation(trapCenter)
            .scale(2)
        
        // Sound effect
        .sound()
            .file("sounds/fire-explosion.wav") // Update path as needed
            .volume(0.8)
        
        // Fire effect on triggered token
        .effect()
            .file("jb2a.fire_jet.orange")
            .atLocation(token)
            .scaleToObject(2)
            .duration(2000)
            .fadeOut(500)
        
        // Damage notification
        .thenDo(() => {
            const damage = trap.flags["fire-trap"].damage;
            ui.notifications.error(`${token.name} takes ${damage} fire damage!`);
            
            // Optional: Apply actual damage if using a system with damage automation
            // token.actor?.applyDamage(rollDamage(damage));
        })
        
        .play();
}

// Utility function for damage rolling (system-dependent)
function rollDamage(formula) {
    const roll = new Roll(formula);
    roll.evaluate({ async: false });
    return roll.total;
}