/**
 * Macro: Mass Teleport Party
 * Description: Teleports multiple selected tokens to a target location with effects
 * 
 * Requirements:
 * - JB2A module installed
 * - Multiple selected tokens
 * 
 * Usage:
 * 1. Select multiple party member tokens
 * 2. Execute this macro
 * 3. Click destination for group teleport
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate token selection
if (canvas.tokens.controlled.length === 0) {
    ui.notifications.warn("Please select one or more tokens to teleport!");
    return;
}

const selectedTokens = canvas.tokens.controlled;

// Show crosshair for destination
ui.notifications.info("Select destination for group teleport...");
const position = await Sequencer.Crosshair.show({
    size: 3,
    gridHighlight: true,
    label: {
        text: "Group Teleport",
        backgroundColor: "#9932cc"
    }
});

if (!position) {
    return; // User cancelled
}

// Calculate positions for each token around the destination
function calculateGroupPositions(centerPos, tokenCount) {
    const positions = [];
    const gridSize = canvas.grid.size;
    
    if (tokenCount === 1) {
        positions.push(centerPos);
    } else {
        const radius = Math.max(gridSize, gridSize * Math.ceil(tokenCount / 4));
        const angleStep = (2 * Math.PI) / tokenCount;
        
        for (let i = 0; i < tokenCount; i++) {
            const angle = i * angleStep;
            const x = centerPos.x + Math.cos(angle) * radius;
            const y = centerPos.y + Math.sin(angle) * radius;
            
            // Snap to grid
            const snappedX = Math.round(x / gridSize) * gridSize;
            const snappedY = Math.round(y / gridSize) * gridSize;
            
            positions.push({ x: snappedX, y: snappedY });
        }
    }
    
    return positions;
}

const destinationPositions = calculateGroupPositions(position, selectedTokens.length);

// Create teleportation sequence
let sequence = new Sequence();

// Portal opening at destination
sequence.effect()
    .file("jb2a.magic_signs.circle.02.transmutation.intro.blue")
    .atLocation(position)
    .scale(3)
    .belowTokens()
    .waitUntilFinished();

// Mystical energy swirl at destination
sequence.effect()
    .file("jb2a.energy_field.02.above.blue")
    .atLocation(position)
    .scale(2.5)
    .duration(2000)
    .fadeIn(300)
    .rotateIn(180, 1000);

// Teleport each token with staggered timing
selectedTokens.forEach((token, index) => {
    const tokenDestination = destinationPositions[index];
    
    // Departure effect
    sequence.effect()
        .file("jb2a.misty_step.01.blue")
        .atLocation(token)
        .scaleToObject(1.5)
        .delay(index * 200);
    
    // Copy sprite fading out at origin
    sequence.effect()
        .copySprite(token)
        .fadeIn(100)
        .duration(800)
        .fadeOut(200)
        .filter("Blur")
        .delay(index * 200);
    
    // Magical beam from origin to destination
    sequence.effect()
        .file("jb2a.energy_beam.normal.blue.03")
        .atLocation(token)
        .stretchTo(tokenDestination)
        .duration(1000)
        .delay(index * 200 + 300);
    
    // Teleport the actual token
    sequence.animation()
        .on(token)
        .delay(index * 200 + 600)
        .teleportTo(tokenDestination)
        .snapToGrid()
        .waitUntilFinished();
    
    // Arrival effect
    sequence.effect()
        .file("jb2a.misty_step.02.blue")
        .atLocation(tokenDestination)
        .scaleToObject(1.5)
        .delay(index * 200 + 800);
});

// Sound effects
sequence.sound()
    .file("sounds/teleport-group.wav") // Update path as needed
    .volume(0.8);

// Portal closing
sequence.effect()
    .file("jb2a.magic_signs.circle.02.transmutation.outro.blue")
    .atLocation(position)
    .scale(3)
    .belowTokens()
    .delay(2000);

// Completion notification
sequence.thenDo(() => {
    ui.notifications.info(`Successfully teleported ${selectedTokens.length} party members!`);
});

sequence.play();