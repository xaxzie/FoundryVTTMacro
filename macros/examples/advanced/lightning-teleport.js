/**
 * Macro: Lightning Teleport
 * Description: Advanced teleportation with crosshair targeting and lightning effects
 * Based on the official Sequencer documentation example
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token
 * 
 * Usage:
 * 1. Select your character token
 * 2. Execute this macro
 * 3. Click on the map to choose teleport destination
 * 
 * @author Sequencer Examples (from official docs)
 * @version 1.0
 * @requires JB2A
 */

// Validate token selection
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a token to teleport!");
    return;
}

const token = canvas.tokens.controlled[0];

// Show crosshair for target selection
let position = await Sequencer.Crosshair.show({
    size: 1,
    gridHighlight: false,
    label: {
        text: "Teleport to",
    }
}, { 
    show: async (crosshair) => {
        // Preview effect at crosshair location
        new Sequence()
            .effect()
                .copySprite(token)
                .attachTo(crosshair)
                .persist()
                .opacity(0.5)
            .play();
    }
});

// Exit if user cancelled
if (!position) {
    return;
}

// Execute teleportation sequence
new Sequence()
    // Copy of token fading out at origin
    .effect()
        .copySprite(token)
        .fadeIn(50)
        .duration(550)
        .fadeOut(250)
        .filter("Blur")
        .elevation(0)
    
    // Lightning bolt from origin to destination
    .effect()
        .file("jb2a.chain_lightning.secondary.blue")
        .atLocation(token)
        .stretchTo(position)
        .elevation(0)
    
    // Wait briefly
    .wait(100)
    
    // Teleport the actual token
    .animation()
        .on(token)
        .teleportTo(position)
        .snapToGrid()
        .waitUntilFinished()
    
    // Static electricity effect at destination
    .effect()
        .file("jb2a.static_electricity.03.blue")
        .atLocation(token)
        .scaleToObject()
    
    .play();