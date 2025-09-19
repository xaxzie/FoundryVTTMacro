/**
 * Macro Template: Area of Effect Spell
 * Description: Template for creating AoE spell macros with crosshair targeting
 * 
 * Instructions:
 * 1. Copy this template
 * 2. Update the configuration section
 * 3. Modify effects and sounds as needed
 * 4. Test with different area sizes and token positions
 * 
 * @author Your Name
 * @version 1.0
 * @requires JB2A
 */

// ========================================
// CONFIGURATION
// ========================================

const SPELL_NAME = "Your AoE Spell";
const AREA_SIZE = 3;                         // Size in grid squares
const EFFECT_FILE = "jb2a.fireball.explosion.orange"; // Main AoE effect
const WARNING_EFFECT = "jb2a.markers.circle_of_stars.orange"; // Warning indicator
const IMPACT_EFFECT = "jb2a.impact.fire.01.orange"; // Individual token impacts
const CAST_SOUND = "sounds/spell-cast.wav";  // Casting sound
const IMPACT_SOUND = "sounds/explosion.wav"; // Impact sound
const WARNING_DURATION = 2000;              // Warning time in ms
const REQUIRES_CASTER = true;

// ========================================
// VALIDATION
// ========================================

if (REQUIRES_CASTER && !canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token!");
    return;
}

const caster = REQUIRES_CASTER ? canvas.tokens.controlled[0] : null;

// ========================================
// TARGET SELECTION
// ========================================

ui.notifications.info(`Select target area for ${SPELL_NAME}...`);
const position = await Sequencer.Crosshair.show({
    size: AREA_SIZE,
    gridHighlight: true,
    label: {
        text: SPELL_NAME,
        backgroundColor: "#ff4500",
        fontSize: 24
    }
});

if (!position) {
    return; // User cancelled
}

// ========================================
// CALCULATE AFFECTED AREA
// ========================================

const gridSize = canvas.grid.size;
const areaRadius = (AREA_SIZE * gridSize) / 2;

// Find tokens in the area
const affectedTokens = canvas.tokens.placeables.filter(token => {
    const distance = canvas.grid.measureDistance(position, token.center);
    return distance <= areaRadius;
});

// Exclude caster if desired
// const affectedTokens = allTokensInArea.filter(token => token !== caster);

ui.notifications.info(`${SPELL_NAME} will affect ${affectedTokens.length} creatures.`);

// ========================================
// SPELL SEQUENCE
// ========================================

let sequence = new Sequence();

// Casting phase
if (caster) {
    // Casting sound
    sequence.sound()
        .file(CAST_SOUND)
        .volume(0.7);
    
    // Beam to target area (optional)
    sequence.effect()
        .file("jb2a.energy_beam.normal.orange.03")
        .atLocation(caster)
        .stretchTo(position)
        .duration(WARNING_DURATION);
}

// Warning indicator
sequence.effect()
    .file(WARNING_EFFECT)
    .atLocation(position)
    .scale(AREA_SIZE)
    .belowTokens()
    .fadeIn(500)
    .duration(WARNING_DURATION - 500)
    .fadeOut(500);

// Wait for warning period
sequence.wait(WARNING_DURATION);

// Main effect
sequence.effect()
    .file(EFFECT_FILE)
    .atLocation(position)
    .scale(AREA_SIZE);

// Impact sound
sequence.sound()
    .file(IMPACT_SOUND)
    .volume(0.9);

// Individual effects on affected tokens
affectedTokens.forEach((token, index) => {
    sequence.effect()
        .file(IMPACT_EFFECT)
        .atLocation(token)
        .scaleToObject(1.5)
        .delay(index * 50) // Stagger impacts
        .randomRotation();
});

// Results notification
sequence.thenDo(() => {
    if (affectedTokens.length > 0) {
        const names = affectedTokens.map(t => t.name).join(", ");
        ui.notifications.warn(`${SPELL_NAME} affects: ${names}`);
        
        // Optional: Apply damage/effects here
        // affectedTokens.forEach(token => {
        //     if (token.actor) {
        //         // Apply spell effects based on your game system
        //     }
        // });
    } else {
        ui.notifications.info(`${SPELL_NAME} affects no creatures.`);
    }
});

// Execute sequence
sequence.play();

// ========================================
// ADDITIONAL FEATURES
// ========================================

/*
// Save for half damage area:
const saveRadius = areaRadius * 1.5;
const saveTokens = canvas.tokens.placeables.filter(token => {
    const distance = canvas.grid.measureDistance(position, token.center);
    return distance > areaRadius && distance <= saveRadius;
});

// Persistent area effects:
sequence.effect()
    .file("jb2a.wall_of_fire.100ft.orange")
    .atLocation(position)
    .scale(AREA_SIZE)
    .duration(30000) // 30 seconds
    .persist() // Effect stays on canvas
    .name("wall-of-fire-effect"); // Name for later removal

// Remove persistent effect later:
// Sequencer.EffectManager.endEffects({ name: "wall-of-fire-effect" });

// Distance-based damage:
affectedTokens.forEach(token => {
    const distance = canvas.grid.measureDistance(position, token.center);
    const damageMultiplier = Math.max(0.5, 1 - (distance / areaRadius));
    // Apply scaled damage based on distance
});
*/