/**
 * Macro: Summon Creature
 * Description: Summons a creature with dramatic entrance effects
 * 
 * Requirements:
 * - JB2A module installed
 * - Actor to summon (update actor name in code)
 * 
 * Usage:
 * 1. Execute this macro
 * 2. Click where you want to summon the creature
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Configuration - Update these as needed
const ACTOR_NAME = "Wolf"; // Change to your actor name
const SUMMONING_CIRCLE_DURATION = 3000;

// Show crosshair for summoning location
ui.notifications.info("Choose summoning location...");
const position = await Sequencer.Crosshair.show({
    size: 2,
    gridHighlight: true,
    label: {
        text: "Summon Here",
        backgroundColor: "#9932cc"
    }
});

if (!position) {
    return; // User cancelled
}

// Find the actor to summon
const actor = game.actors.getName(ACTOR_NAME);
if (!actor) {
    ui.notifications.error(`Actor "${ACTOR_NAME}" not found! Update the ACTOR_NAME in the macro.`);
    return;
}

// Start summoning sequence
let sequence = new Sequence();

// Summoning circle appears
sequence.effect()
    .file("jb2a.magic_signs.circle.02.conjuration.intro.purple")
    .atLocation(position)
    .scale(2)
    .belowTokens()
    .waitUntilFinished();

// Mystical energy buildup
sequence.effect()
    .file("jb2a.energy_field.02.above.purple")
    .atLocation(position)
    .scale(1.5)
    .duration(SUMMONING_CIRCLE_DURATION)
    .fadeIn(500)
    .fadeOut(500);

// Swirling magic
sequence.effect()
    .file("jb2a.wind_stream.default")
    .atLocation(position)
    .scale(2)
    .duration(SUMMONING_CIRCLE_DURATION)
    .rotateIn(360, SUMMONING_CIRCLE_DURATION)
    .tint("#9932cc");

// Sound effect during buildup
sequence.sound()
    .file("sounds/summoning.wav") // Update path as needed
    .volume(0.7)
    .fadeInAudio(500);

// Wait for buildup
sequence.wait(SUMMONING_CIRCLE_DURATION);

// Flash of light
sequence.effect()
    .file("jb2a.explosion.01.blue")
    .atLocation(position)
    .scale(3)
    .tint("#ffffff");

// Summon the actual creature
sequence.thenDo(async () => {
    try {
        // Create token from actor
        const tokenData = await actor.getTokenDocument();
        await canvas.scene.createEmbeddedDocuments("Token", [{
            ...tokenData.toObject(),
            x: position.x - (tokenData.width * canvas.grid.size) / 2,
            y: position.y - (tokenData.height * canvas.grid.size) / 2
        }]);
        
        ui.notifications.info(`${actor.name} has been summoned!`);
    } catch (error) {
        console.error("Error summoning creature:", error);
        ui.notifications.error("Failed to summon creature!");
    }
});

// Entrance effect on summoned creature
sequence.effect()
    .file("jb2a.misty_step.01.purple")
    .atLocation(position)
    .scale(1.5)
    .delay(200);

// Fading summoning circle
sequence.effect()
    .file("jb2a.magic_signs.circle.02.conjuration.outro.purple")
    .atLocation(position)
    .scale(2)
    .belowTokens()
    .delay(500);

sequence.play();