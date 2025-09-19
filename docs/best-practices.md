# Sequencer Macro Best Practices

This guide outlines best practices for developing effective, maintainable, and performant FoundryVTT macros using the Sequencer module.

## Code Organization

### File Naming Conventions
- Use descriptive names: `fireball-spell.js` instead of `spell1.js`
- Include effect type: `healing-light-effect.js`
- Use kebab-case for consistency: `chain-lightning-macro.js`

### Macro Structure
```javascript
// Macro: Fireball Spell
// Description: Creates explosion effect with sound
// Requirements: JB2A effects, selected token, targeted enemies
// Author: Your Name
// Version: 1.0

// Validation
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a token first!");
    return;
}

if (!game.user.targets.size) {
    ui.notifications.warn("Please target at least one enemy!");
    return;
}

// Main sequence
const caster = canvas.tokens.controlled[0];
const targets = Array.from(game.user.targets);

let sequence = new Sequence();

// Add effects here...

sequence.play();
```

## Error Handling and Validation

### Token Selection Validation
```javascript
// Check for selected token
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token!");
    return;
}

// Check for targeted tokens
if (!game.user.targets.size) {
    ui.notifications.warn("Please target enemies first!");
    return;
}

// Validate token permissions
const caster = canvas.tokens.controlled[0];
if (!caster.actor) {
    ui.notifications.error("Selected token has no associated actor!");
    return;
}
```

### File Path Validation
```javascript
// Use softFail for missing effects
new Sequence({ softFail: true })
    .effect()
        .file("might-not-exist.webm")
        .atLocation(token)
    .play();

// Or check existence first
const effectPath = "jb2a.fireball.explosion.orange";
if (!Sequencer.Database.entryExists(effectPath)) {
    ui.notifications.warn("Required effect not found. Please install JB2A module.");
    return;
}
```

### Crosshair Cancellation
```javascript
const position = await Sequencer.Crosshair.show({
    size: 2,
    label: { text: "Select target area" }
});

// Always check if user cancelled
if (!position) {
    return; // User cancelled, exit gracefully
}

// Continue with effect...
```

## Performance Optimization

### Limit Simultaneous Effects
```javascript
// Bad: Too many effects at once
for (let i = 0; i < 20; i++) {
    new Sequence()
        .effect()
            .file("jb2a.explosion.01.orange")
            .atLocation(randomPosition())
        .play();
}

// Good: Staggered effects
let sequence = new Sequence();
for (let i = 0; i < 20; i++) {
    sequence.effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(randomPosition())
        .wait(100); // Stagger timing
}
sequence.play();
```

### Use Appropriate Durations
```javascript
// Consider effect duration vs game pace
.effect()
    .file("long-spell-effect.webm")
    .duration(2000) // Don't make too long
    .fadeOut(500)   // Smooth transitions
```

### Preload Effects
```javascript
// Preload for smoother playback
new Sequence()
    .effect()
        .file("jb2a.fireball.explosion.orange")
        .atLocation(target)
    .play({ preload: true });
```

## User Experience

### Clear Feedback
```javascript
// Inform users of requirements
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Select a token to cast from!");
    return;
}

// Show progress for long operations
ui.notifications.info("Casting spell...");

// Confirm completion
new Sequence()
    .effect()
        .file("spell-effect.webm")
        .atLocation(target)
    .thenDo(() => {
        ui.notifications.info("Spell complete!");
    })
    .play();
```

### Intuitive Controls
```javascript
// Use descriptive crosshair labels
const position = await Sequencer.Crosshair.show({
    size: 3,
    gridHighlight: true,
    label: {
        text: "Fireball Target",
        backgroundColor: "#ff4500",
        fontSize: 24
    }
});
```

### Consistent Behavior
```javascript
// Always use the same token selection method
const getSelectedToken = () => {
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("Please select a token!");
        return null;
    }
    return canvas.tokens.controlled[0];
};

// Use in all macros
const caster = getSelectedToken();
if (!caster) return;
```

## Code Reusability

### Create Utility Functions
```javascript
// Save as utility macro or in a common file
function createExplosion(location, color = "orange", scale = 1) {
    return new Sequence()
        .effect()
            .file(`jb2a.explosion.01.${color}`)
            .atLocation(location)
            .scale(scale)
        .sound()
            .file("sounds/explosion.wav")
            .volume(0.7);
}

// Use in other macros
let sequence = new Sequence();
sequence.addSequence(createExplosion(target, "red", 1.5));
sequence.play();
```

### Template Patterns
```javascript
// Spell template
function createSpellEffect(config) {
    const {
        caster,
        targets,
        effectFile,
        soundFile,
        projectileSpeed = 1000,
        impactScale = 1
    } = config;
    
    let sequence = new Sequence();
    
    // Cast sound
    if (soundFile) {
        sequence.sound().file(soundFile).volume(0.8);
    }
    
    // Projectile to each target
    targets.forEach((target, index) => {
        sequence.effect()
            .file(effectFile)
            .atLocation(caster)
            .stretchTo(target)
            .duration(projectileSpeed)
            .wait(index * 200); // Stagger multiple targets
    });
    
    return sequence;
}
```

## Testing and Debugging

### Debug Mode
```javascript
// Enable debug logging
const DEBUG = true;

function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[Spell Macro] ${message}`, data);
    }
}

debugLog("Starting fireball macro", { caster, targets });
```

### Test Cases
```javascript
// Test different scenarios
function testMacro() {
    // Test 1: No selection
    canvas.tokens.controlled.length = 0;
    // Run macro - should show warning
    
    // Test 2: No targets
    // Select token but don't target anything
    // Run macro - should show warning
    
    // Test 3: Normal operation
    // Select caster, target enemy
    // Run macro - should work normally
}
```

### Error Recovery
```javascript
try {
    // Macro code here
    await sequence.play();
} catch (error) {
    console.error("Macro failed:", error);
    ui.notifications.error("Macro encountered an error. Check console for details.");
}
```

## Documentation Standards

### Macro Headers
```javascript
/**
 * Macro: Lightning Bolt
 * Description: Fires a lightning bolt from caster to target
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (caster)
 * - One or more targeted tokens
 * 
 * Usage:
 * 1. Select your character token
 * 2. Target enemy tokens
 * 3. Execute macro
 * 
 * @author Your Name
 * @version 1.2
 * @requires JB2A
 * @gameSystem dnd5e
 */
```

### Inline Comments
```javascript
// Validate inputs
const caster = getSelectedToken();
if (!caster) return;

// Calculate projectile path
const targets = Array.from(game.user.targets);
const distance = canvas.grid.measureDistance(caster, targets[0]);

// Create effect sequence
let sequence = new Sequence()
    .effect() // Lightning bolt projectile
        .file("jb2a.lightning_bolt.wide.blue")
        .atLocation(caster)
        .stretchTo(targets[0])
        .duration(distance * 10) // Scale duration to distance
    .sound() // Thunder sound effect
        .file("sounds/thunder.wav")
        .delay(distance * 5) // Delayed for realism
        .volume(0.8);
```

## Version Control

### Changelog
Keep track of changes in a comment:
```javascript
/**
 * Changelog:
 * v1.0 - Initial version
 * v1.1 - Added sound effects
 * v1.2 - Fixed timing issues, added error handling
 * v1.3 - Improved performance for multiple targets
 */
```

### Backwards Compatibility
```javascript
// Support both old and new JB2A paths
const effectPath = Sequencer.Database.entryExists("jb2a.fireball.explosion.orange") 
    ? "jb2a.fireball.explosion.orange"
    : "modules/jb2a_patreon/Library/Generic/Fire/FireballExplosion_01_Orange_400x400.webm";
```

## Security Considerations

### Input Sanitization
```javascript
// Be careful with user inputs
function createCustomEffect(userInput) {
    // Validate file path
    if (!userInput.match(/^[a-zA-Z0-9._/-]+$/)) {
        ui.notifications.error("Invalid file path!");
        return;
    }
    
    // Use only trusted sources
    if (!userInput.startsWith("modules/") && !userInput.startsWith("jb2a.")) {
        ui.notifications.error("Only module effects allowed!");
        return;
    }
}
```

### Permission Checks
```javascript
// Check if user can control token
if (!caster.isOwner) {
    ui.notifications.warn("You don't have permission to control this token!");
    return;
}

// Check GM permissions for powerful effects
if (spellLevel > 5 && !game.user.isGM) {
    ui.notifications.warn("High-level spells require GM permission!");
    return;
}
```

By following these best practices, your Sequencer macros will be more reliable, maintainable, and enjoyable for all players!