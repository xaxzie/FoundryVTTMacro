# Assets & Effects Reference

This guide covers all available visual and audio assets for spell animations, including JB2A effects, Sequencer patterns, and sound files.

## 📚 Asset Libraries Overview

### JB2A - Jules&Ben's Animated Assets

**Free Module** (~2000+ effects)

- Path: `modules/JB2A_DnD5e/Library/`
- Format: Transparent WebM
- [GitHub Repository](https://github.com/Jules-Bens-Aa/JB2A_DnD5e)

**Patreon Module** (~5000+ premium effects)

- Path: `modules/jb2a_patreon/Library/`
- Higher quality variants
- Additional color options
- Exclusive animations
- [Patreon Page](https://www.patreon.com/JB2A)

### Additional Effect Libraries

**Animated Spell Effects** (~500MB)

- Cartoon-style and realistic effects
- Path: `modules/animated-spell-effects/`

**Jinker's Animated Art**

- Character animations and spell effects
- Path: `modules/jinker-animated-art/`

## 🎨 Effect Categories & Usage

### Fire & Explosion Effects

**Basic Fire:**

```javascript
// Simple fire explosion
.effect()
  .file("jb2a.explosion.01.orange")
  .atLocation(target)

// Fireball projectile + explosion
.effect()
  .file("jb2a.fireball")
  .atLocation(caster)
  .stretchTo(target)
.effect()
  .file("jb2a.fireball.explosion.orange")
  .atLocation(target)
  .delay(1000)
```

**Available Fire Effects:**

- `jb2a.explosion.01.orange` - Orange explosion
- `jb2a.explosion.01.blue` - Blue explosion
- `jb2a.fireball` - Fireball projectile
- `jb2a.fireball.explosion.orange` - Fireball explosion
- `jb2a.fire_jet.orange` - Fire stream/jet
- `jb2a.impact.fire.01.orange` - Fire impact

### Ice & Frost Effects

**Ice Projectiles:**

```javascript
// Ice shard projectile
.effect()
  .file("jb2a.ice_shard.01")
  .atLocation(caster)
  .stretchTo(target)
  .waitUntilFinished(-500)

// Frost impact
.effect()
  .file("jb2a.impact.frost.blue.01")
  .atLocation(target)
```

**Available Ice Effects:**

- `jb2a.ice_shard.01` - Ice projectile
- `jb2a.impact.frost.blue.01` - Frost impact
- `jb2a.wall_of_force.horizontal.blue` - Ice wall
- `jb2a.breath_weapons.cold.line.blue` - Frost breath

### Lightning & Energy Effects

**Chain Lightning:**

```javascript
// Multi-target chain lightning
.effect()
  .file("jb2a.chain_lightning.primary.blue")
  .atLocation(caster)
  .stretchTo(targets[0])
.effect()
  .file("jb2a.chain_lightning.secondary.blue")
  .atLocation(targets[0])
  .stretchTo(targets[1])
```

**Available Lightning Effects:**

- `jb2a.chain_lightning.primary.blue` - Primary chain
- `jb2a.chain_lightning.secondary.blue` - Secondary chain
- `jb2a.lightning_strike.no_ring.blue` - Lightning strike
- `jb2a.static_electricity.03.blue` - Static electricity
- `jb2a.energy_beam.normal.blue.03` - Energy beam

### Healing Effects

**Healing Spells:**

```javascript
// Healing burst
.effect()
  .file("jb2a.healing_generic.burst.yellowwhite")
  .atLocation(target)
  .scale(0.8)

// Healing beam
.effect()
  .file("jb2a.healing_generic.beam.yellowwhite")
  .atLocation(caster)
  .stretchTo(target)
```

**Available Healing Effects:**

- `jb2a.healing_generic.burst.yellowwhite` - Healing burst
- `jb2a.healing_generic.beam.yellowwhite` - Healing beam
- `jb2a.cure_wounds.400px.blue` - Cure wounds
- `jb2a.markers.healing.green.02` - Healing marker

### Combat & Melee Effects

**Melee Attacks:**

```javascript
// Slashing attack
.effect()
  .file("jb2a.melee_generic.slashing.one_handed")
  .atLocation(target)
  .scaleToObject(1.5)
  .randomRotation()
```

**Available Combat Effects:**

- `jb2a.melee_generic.slashing.one_handed` - One-handed slash
- `jb2a.melee_generic.slashing.two_handed` - Two-handed slash
- `jb2a.impact.ground_crack.orange.02` - Ground impact
- `jb2a.weapon_attacks.melee.spear.thrust.01` - Spear thrust

### Magic & Spell Effects

**Magic Circles:**

```javascript
// Spell preparation circle
.effect()
  .file("jb2a.magic_signs.circle.02.conjuration.intro.purple")
  .atLocation(caster)
  .scale(0.6)
  .fadeIn(500)
  .fadeOut(500)
```

**Available Magic Effects:**

- `jb2a.magic_signs.circle.02.conjuration.intro.purple` - Conjuration intro
- `jb2a.magic_signs.circle.02.conjuration.outro.purple` - Conjuration outro
- `jb2a.magic_missile` - Magic missile
- `jb2a.misty_step.01.blue` - Teleport departure
- `jb2a.misty_step.02.blue` - Teleport arrival
- `jb2a.shield.03.intro.blue` - Shield spell

## 🎵 Sound Effects

### Built-in Sound Categories

**Available Sound Paths:**

```
/sounds/combat/          # Combat sounds
/sounds/magic/           # Spell casting sounds
/sounds/environment/     # Ambient effects
/sounds/impacts/         # Hit and impact sounds
```

**Usage Example:**

```javascript
.sound()
  .file("sounds/magic/spell-cast.wav")
  .volume(0.5)
  .fadeInAudio(250)
```

## 🔧 Sequencer API Patterns

### Basic Structure

```javascript
new Sequence()
  .effect()
  .file("path/to/effect.webm")
  .atLocation(token)
  .sound()
  .file("path/to/sound.wav")
  .play();
```

### Common Effect Methods

**Positioning:**

- `.atLocation(token)` - Place effect at token
- `.stretchTo(target)` - Stretch from source to target
- `.moveTowards(target)` - Move effect toward target

**Timing:**

- `.delay(milliseconds)` - Delay before playing
- `.duration(milliseconds)` - Override effect duration
- `.waitUntilFinished()` - Wait for effect to complete
- `.waitUntilFinished(-500)` - Wait until 500ms before end

**Visual Properties:**

- `.scale(number)` - Scale effect size
- `.scaleToObject(multiplier)` - Scale relative to token size
- `.fadeIn(milliseconds)` - Fade in duration
- `.fadeOut(milliseconds)` - Fade out duration
- `.opacity(number)` - Set opacity (0-1)
- `.tint("#hex")` - Color tint

**Animation:**

- `.randomRotation()` - Random rotation
- `.rotate(degrees)` - Specific rotation
- `.belowTokens()` - Render below tokens
- `.aboveTokens()` - Render above tokens

### Advanced Patterns

**Projectile with Impact:**

```javascript
new Sequence()
  .effect()
  .file("projectile.webm")
  .atLocation(caster)
  .stretchTo(target)
  .waitUntilFinished(-200)
  .effect()
  .file("impact.webm")
  .atLocation(target)
  .scale(0.8)
  .play();
```

**Multi-Target Chain Effect:**

```javascript
let seq = new Sequence();

targets.forEach((target, index) => {
  seq
    .effect()
    .file("chain-effect.webm")
    .atLocation(index === 0 ? caster : targets[index - 1])
    .stretchTo(target)
    .delay(index * 200);
});

seq.play();
```

**Synchronized Audio-Visual:**

```javascript
new Sequence()
  .sound()
  .file("spell-charge.wav")
  .effect()
  .file("charge-up.webm")
  .atLocation(caster)
  .duration(1000)
  .waitUntilFinished()
  .sound()
  .file("spell-release.wav")
  .effect()
  .file("spell-projectile.webm")
  .atLocation(caster)
  .stretchTo(target)
  .play();
```

## 🎯 RPG-Specific Effect Patterns

### Stance-Based Color Variations

```javascript
// Color based on combat stance
const stanceColors = {
  offensive: "red",
  defensive: "blue",
  focus: "purple"
};

const color = stanceColors[stance] || "white";

.effect()
  .file(`jb2a.magic_missile.${color}`)
  .atLocation(caster)
  .stretchTo(target)
```

### Character-Specific Effects

```javascript
// Different effects per character
const characterEffects = {
  ora: "jb2a.ice_shard.01",
  moctei: "jb2a.eldritch_blast.purple"
};

.effect()
  .file(characterEffects[character.name] || "jb2a.magic_missile")
  .atLocation(caster)
  .stretchTo(target)
```

## 📋 Asset Inventory Files

For complete asset lists, see:

- [JB2A Complete Inventory](jb2a-inventory.md) - All JB2A effects
- [Jack Kerouac's Effects](kerouac-inventory.md) - Kerouac effect library
- [Jinker's Animated Art](jinker-inventory.md) - Jinker animation library
- [Asset Overview](asset-inventory.md) - Summary of all libraries

## 🔍 Finding Assets

**Sequencer Database Viewer:**

1. Install "Sequencer Database Viewer" module
2. Access via journal or macro
3. Browse effects by category
4. Copy file paths directly

**File Path Patterns:**

```
jb2a.[category].[variant].[color].[size]
// Examples:
jb2a.explosion.01.orange
jb2a.magic_missile.blue
jb2a.healing_generic.burst.yellowwhite
```

**Testing Effects:**

```javascript
// Quick effect test
new Sequence()
  .effect()
  .file("PASTE_EFFECT_PATH_HERE")
  .atLocation(canvas.tokens.controlled[0])
  .play();
```

---

> **Tip**: Always test effects in your development environment before committing. Use the Sequencer Database Viewer to preview effects and copy exact file paths.
