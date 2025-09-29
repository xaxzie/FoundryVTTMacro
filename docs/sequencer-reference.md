# Sequencer API Reference

This reference guide covers the most commonly used Sequencer methods and patterns for FoundryVTT macro development, with RPG-specific patterns used in our tested spells.

## Basic Structure

Every Sequencer macro starts with:

```javascript
new Sequence();
```

And ends with:

```javascript
.play();
```

## Core Sections

### Effect Section

Create visual effects on the canvas:

```javascript
.effect()
    .file("path/to/effect.webm")
    .atLocation(token)
```

### Sound Section

Play audio effects:

```javascript
.sound()
    .file("path/to/sound.wav")
```

### Animation Section

Animate tokens and objects:

```javascript
.animation()
    .on(token)
    .moveTowards(position)
```

## Common Effect Methods

### Positioning

- `.atLocation(token)` - Place effect at token position
- `.attachTo(token)` - Attach effect to token (follows movement)
- `.stretchTo(target)` - Stretch effect from origin to target
- `.rotateTowards(target)` - Rotate effect to face target

### Scaling and Rotation

- `.scale(0.5)` - Scale to 50% size
- `.scale(0.5, 1.5)` - Scale between 50% and 150%
- `.scaleToObject()` - Scale to match token size
- `.scaleToObject(2)` - Scale to 2x token size
- `.randomRotation()` - Random rotation
- `.rotate(90)` - Rotate 90 degrees

### Timing and Animation

- `.fadeIn(1000)` - Fade in over 1 second
- `.fadeOut(1000)` - Fade out over 1 second
- `.duration(2000)` - Effect duration in milliseconds
- `.delay(500)` - Delay before effect starts
- `.repeats(3, 200, 300)` - Repeat 3 times with 200-300ms delay

### Layering

- `.belowTokens()` - Place effect below tokens
- `.aboveInterface()` - Place effect above UI
- `.elevation(100)` - Set elevation level

### Visual Effects

- `.opacity(0.5)` - Set opacity to 50%
- `.tint("#ff0000")` - Tint effect red
- `.randomizeMirrorX()` - Randomly mirror horizontally
- `.randomizeMirrorY()` - Randomly mirror vertically

## Sound Methods

### Basic Playback

- `.volume(0.8)` - Set volume (0-1)
- `.fadeInAudio(1000)` - Fade in audio over 1 second
- `.fadeOutAudio(1000)` - Fade out audio over 1 second

### Targeting

- `.forUsers([user1, user2])` - Play for specific users
- `.locally()` - Play only for current user

## Animation Methods

### Movement

- `.moveTowards(position)` - Move token towards position
- `.teleportTo(position)` - Instantly move token
- `.snapToGrid()` - Snap movement to grid
- `.closestSquare()` - Move to closest valid square

### Token Properties

- `.hide()` - Hide token
- `.show()` - Show token
- `.rotate(90)` - Rotate token

## Sequence Control

### Timing

- `.wait(1000)` - Wait 1 second before next section
- `.waitUntilFinished()` - Wait until current section completes

### Execution

- `.thenDo(function() { /* code */ })` - Execute function
- `.macro("MacroName")` - Execute another macro

### Advanced

- `.addNamedLocation("name", position)` - Store position for later use
- `.preset("presetName")` - Apply predefined preset

## Crosshair Targeting

### Legacy Sequencer Targeting

```javascript
let position = await Sequencer.Crosshair.show({
  size: 1,
  label: { text: "Select target" },
});

if (!position) return; // User cancelled

new Sequence().effect().atLocation(position).file("effect.webm").play();
```

### Modern Portal Targeting (Recommended for RPG Spells)

```javascript
// Copy from /macros/utilities/portal-targeting.js
function selectSingleTarget(casterToken, options = {}) {
    const portal = new Portal()
        .origin(casterToken)
        .range(options.range || 120)
        .color(options.color || "#0000ff");
    return await portal.pick();
}

// Usage in spells
const target = await selectSingleTarget(caster);
if (!target) return;

new Sequence()
    .effect()
        .atLocation(target)
        .file("effect.webm")
    .play();
```

## Common Patterns

### Multi-Target Effect (Legacy)

```javascript
let mySequence = new Sequence();

for (let target of game.user.targets) {
  mySequence.effect().file("effect.webm").atLocation(target).wait(200);
}

mySequence.play();
```

### RPG Multi-Projectile Pattern (From bubbles.js)

```javascript
// Copy utility functions for RPG-compliant multi-projectile spells
const targets = await selectMultipleTargets(caster, 2);
const targetActors = getActorsAtLocations(targets);
const damages = await calculateMultipleProjectileDamage(
  2,
  stance,
  espritStat,
  damageBonus
);

let sequence = new Sequence();

// Casting effect
sequence
  .effect()
  .file("jb2a.cast_generic.02.blue.0")
  .atLocation(caster)
  .scale(0.8);

// First projectile
sequence
  .effect()
  .file("jb2a.bullet.03.blue")
  .atLocation(caster)
  .stretchTo(targets[0])
  .delay(500);

// Second projectile (if different target or same target)
const target2Location = targets.length > 1 ? targets[1] : targets[0];
sequence
  .effect()
  .file("jb2a.bullet.03.blue")
  .atLocation(caster)
  .stretchTo(target2Location)
  .delay(200);

sequence.play();
```

### Spell with Sound and Effect

```javascript
new Sequence()
  .sound()
  .file("sounds/spell-cast.wav")
  .effect()
  .file("effects/magic-missile.webm")
  .atLocation(token)
  .stretchTo(target)
  .play();
```

### Chain Lightning Effect

```javascript
let targets = Array.from(game.user.targets);
let sequence = new Sequence();

for (let i = 0; i < targets.length - 1; i++) {
  sequence
    .effect()
    .file("jb2a.chain_lightning.secondary.blue")
    .atLocation(targets[i])
    .stretchTo(targets[i + 1])
    .wait(100);
}

sequence.play();
```

## Error Handling

### Soft Fail

```javascript
new Sequence({ softFail: true })
  .effect()
  .file("might-not-exist.webm")
  .atLocation(token)
  .play();
```

### Module Identification

```javascript
new Sequence({ moduleName: "my-module" })
  .effect()
  .file("effect.webm")
  .atLocation(token)
  .play();
```

## File Path Examples

### JB2A Paths

```javascript
// Free version
"modules/jb2a_patreon/Library/Generic/Explosion/Explosion_01_Orange_400x400.webm";

// Patreon version
"modules/JB2A_DnD5e/Library/Generic/Explosion/Explosion_01_Orange_400x400.webm";
```

### Animated Spell Effects

```javascript
"modules/animated-spell-effects/spell-effects/fire/fire-bolt.webm";
```

## Best Practices

### Core Sequencer Practices

1. **Always test file paths** - Use the Sequencer Database Viewer to find correct paths
2. **Use descriptive variable names** - `mySequence` instead of `seq`
3. **Add comments** - Explain complex effect chains
4. **Handle user cancellation** - Check if crosshair selections return valid positions
5. **Consider performance** - Avoid too many simultaneous effects
6. **Use appropriate timing** - Don't make effects too fast or slow
7. **Test with multiple tokens** - Ensure macros work with different selections

### RPG-Specific Best Practices (2025)

1. **Use utility functions** - Copy from `/macros/utilities/` for consistent RPG integration
2. **Follow bubbles.js pattern** - Use tested structure for RPG-compliant spells
3. **Integrate stance system** - Use stance detection for mana costs and damage maximization
4. **Handle injuries** - Use character stats utilities for injury-adjusted values
5. **Professional output** - Use chat formatting utilities for consistent messages
6. **Portal targeting** - Use Portal utilities instead of legacy crosshair methods
7. **Test comprehensively** - Validate stance changes, injury effects, and multi-target scenarios

### Modern Development Workflow

1. **Start with bubbles.js** - Study the tested implementation
2. **Copy needed utilities** - Select functions from `/macros/utilities/`
3. **Adapt for your spell** - Modify element types, damage formulas, targeting
4. **Test all stances** - Verify Offensive (maximized), Defensive, and Focus behaviors
5. **Validate injury system** - Test with different injury counts
6. **Professional polish** - Use formatting utilities for consistent user experience

## Debugging Tips

- Use `console.log()` to check variable values
- Test effects one section at a time
- Check the console for Sequencer errors
- Verify file paths in the Database Viewer
- Test with different token selections
