/**
 * Macro Template: Basic Spell
 * Description: Template for creating simple spell macros
 * 
 * Instructions:
 * 1. Copy this template
 * 2. Replace placeholder values with your spell details
 * 3. Update file paths to match your installed modules
 * 4. Test thoroughly before use
 * 
 * @author Your Name
 * @version 1.0
 * @requires JB2A (or other effect module)
 */

// ========================================
// CONFIGURATION - UPDATE THESE VALUES
// ========================================

const SPELL_NAME = "Your Spell Name";
const EFFECT_FILE = "jb2a.your.effect.file"; // Update with actual effect path
const SOUND_FILE = "sounds/your-sound.wav";  // Update with actual sound path
const REQUIRES_TARGET = true;                // true if spell needs a target
const REQUIRES_CASTER = true;                // true if spell needs a caster
const SPELL_RANGE = 6;                       // Range in grid squares (0 = touch, -1 = unlimited)
const EFFECT_SCALE = 1.0;                    // Scale multiplier for effect

// ========================================
// VALIDATION
// ========================================

// Check for caster
if (REQUIRES_CASTER && !canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token!");
    return;
}

// Check for target
if (REQUIRES_TARGET && !game.user.targets.size) {
    ui.notifications.warn("Please target a creature!");
    return;
}

// Get tokens
const caster = REQUIRES_CASTER ? canvas.tokens.controlled[0] : null;
const target = REQUIRES_TARGET ? Array.from(game.user.targets)[0] : null;

// Check range if needed
if (REQUIRES_CASTER && REQUIRES_TARGET && SPELL_RANGE > 0) {
    const distance = canvas.grid.measureDistance(caster.center, target.center);
    const maxRange = canvas.grid.size * SPELL_RANGE;
    
    if (distance > maxRange) {
        ui.notifications.warn(`Target is too far away! ${SPELL_NAME} has a range of ${SPELL_RANGE} squares.`);
        return;
    }
}

// ========================================
// SPELL SEQUENCE
// ========================================

let sequence = new Sequence();

// Add casting sound
if (SOUND_FILE) {
    sequence.sound()
        .file(SOUND_FILE)
        .volume(0.7);
}

// Add main effect
sequence.effect()
    .file(EFFECT_FILE)
    .atLocation(target || caster) // Use target if available, otherwise caster
    .scale(EFFECT_SCALE);

// Add projectile if ranged spell
if (REQUIRES_CASTER && REQUIRES_TARGET && caster !== target) {
    // Uncomment and modify if you want a projectile effect
    // sequence.effect()
    //     .file("jb2a.projectile.file")
    //     .atLocation(caster)
    //     .stretchTo(target)
    //     .waitUntilFinished();
}

// Add completion notification
sequence.thenDo(() => {
    const casterName = caster ? caster.name : "Someone";
    const targetName = target ? target.name : "the area";
    ui.notifications.info(`${casterName} casts ${SPELL_NAME} on ${targetName}!`);
});

// Execute the sequence
sequence.play();

// ========================================
// ADDITIONAL FEATURES TO CONSIDER
// ========================================

/*
// Area of Effect targeting with crosshair:
const position = await Sequencer.Crosshair.show({
    size: 2,
    label: { text: SPELL_NAME }
});
if (!position) return;

// Multiple targets:
const targets = Array.from(game.user.targets);
targets.forEach((target, index) => {
    sequence.effect()
        .file(EFFECT_FILE)
        .atLocation(target)
        .delay(index * 200); // Stagger effects
});

// Damage integration (system dependent):
if (target.actor) {
    const damage = new Roll("2d6").evaluate({async: false});
    // Apply damage based on your game system
}

// Duration effects:
sequence.effect()
    .file(EFFECT_FILE)
    .atLocation(target)
    .duration(5000) // 5 seconds
    .fadeOut(1000);

// Random variations:
const colors = ["red", "blue", "green"];
const randomColor = colors[Math.floor(Math.random() * colors.length)];
sequence.effect()
    .file(`jb2a.effect.${randomColor}`)
    .atLocation(target);
*/