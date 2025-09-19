# Macro Index

This file provides a quick reference to all available macros in this collection.

## 🔰 Basic Macros (`/macros/basic/`)

| Macro | Description | Requirements |
|-------|-------------|--------------|
| `simple-explosion.js` | Basic explosion effect on selected token | JB2A, 1 selected token |
| `basic-sound.js` | Simple sound effect playback | Sound file |
| `token-flash.js` | Glowing flash effect on token | JB2A, 1 selected token |
| `move-token.js` | Animate token movement to target | 1 selected token, 1 target |
| `multi-target-effect.js` | Apply effect to multiple targets | JB2A, 1+ targets |
| `effect-with-sound.js` | Combined visual and audio effect | JB2A, sound file, 1 selected token |
| `rotating-effect.js` | Rotating shield effect around token | JB2A, 1 selected token |

## 🎯 Intermediate Macros (`/macros/intermediate/`)

| Macro | Description | Requirements |
|-------|-------------|--------------|
| `acid-splash.js` | Acid splash on two tokens | Animated Cartoon Effects, 2 selected tokens |
| `magic-missile.js` | Multiple missiles from caster to target | JB2A, 1 caster, 1 target |
| `fireball.js` | Complete fireball with projectile and explosion | JB2A, 1 caster, crosshair or target |
| `chain-lightning.js` | Lightning chaining between multiple targets | JB2A, 1 caster, 2+ targets |
| `healing-wave.js` | Healing effect spreading to allies | JB2A, 1 healer, 1+ targets |
| `combat-combo.js` | Multi-hit combat sequence | JB2A, 1 attacker, 1 defender |

## ⚡ Advanced Macros (`/macros/advanced/`)

| Macro | Description | Requirements |
|-------|-------------|--------------|
| `lightning-teleport.js` | Teleportation with crosshair and effects | JB2A, 1 selected token |
| `aoe-spell.js` | Area of effect spell with crosshair | JB2A, 1 caster (optional) |
| `summon-creature.js` | Summon creature with dramatic entrance | JB2A, Actor to summon |
| `environmental-trap.js` | Interactive fire trap system | JB2A, GM permissions |
| `mass-teleport.js` | Group teleportation with effects | JB2A, multiple selected tokens |

## 🔮 Spell Macros (`/macros/spells/`)

| Macro | Description | System | Requirements |
|-------|-------------|---------|--------------|
| `burning-hands.js` | D&D 5e Burning Hands spell | D&D 5e | JB2A, 1 caster, crosshair targeting |
| `cure-wounds.js` | D&D 5e Cure Wounds spell | D&D 5e | JB2A, 1 caster, 1 target |
| `lightning-strike.js` | Random lightning strike effect | Any | JB2A, 1 selected token |

## � Character-Specific Macros (`/macros/characters/`)

### 🌊 Ora - Water/Ice Specialist

| Macro | Description | Requirements |
|-------|-------------|--------------|
| `frost-bolt.js` | Precise ice projectile with slowing effect | JB2A, 1 target |
| `ice-wall.js` | Creates protective barrier of ice | JB2A, crosshair placement |
| `water-whip.js` | Flexible water tendril striking multiple enemies | JB2A, crosshair direction |
| `blizzard.js` | Devastating area ice storm with ongoing damage | JB2A, crosshair targeting |
| `healing-spring.js` | Magical spring providing continuous healing | JB2A, crosshair placement |

### 🌑 Moctei - Shadow Specialist

| Macro | Description | Requirements |
|-------|-------------|--------------|
| `shadow-bolt.js` | Dark projectile that drains life energy | JB2A, 1 target |
| `darkness-cloud.js` | Area of magical darkness that blinds enemies | JB2A, crosshair targeting |
| `shadow-step.js` | Teleport through shadows for sneak attacks | JB2A, crosshair destination |
| `umbral-strike.js` | Shadow-infused melee attack with debuff | JB2A, 1 target |
| `void-prison.js` | Prison of shadow that traps and drains enemies | JB2A, crosshair targeting |

## �🛠️ Utilities (`/macros/utilities/`)

| File | Description | Usage |
|------|-------------|-------|
| `sequencer-helpers.js` | Reusable utility functions | Copy functions into your macros |

## 📋 Templates (`/templates/`)

| Template | Description | Use Case |
|----------|-------------|----------|
| `basic-spell-template.js` | Template for simple spells | Creating new single-target spells |
| `aoe-spell-template.js` | Template for area effect spells | Creating new AoE spells |

## Quick Reference

### Most Popular Macros
1. **lightning-teleport.js** - Spectacular teleportation effect
2. **fireball.js** - Classic D&D fireball spell
3. **chain-lightning.js** - Multi-target lightning
4. **ora/blizzard.js** - Devastating ice storm effect
5. **moctei/void-prison.js** - Epic shadow prison

### Best for Learning
1. **simple-explosion.js** - Basic Sequencer concepts
2. **magic-missile.js** - Projectile effects
3. **token-flash.js** - Simple visual effects
4. **ora/frost-bolt.js** - Character-specific spell basics

### Most Advanced
1. **environmental-trap.js** - Interactive systems
2. **mass-teleport.js** - Complex multi-token operations
3. **moctei/void-prison.js** - Reality-bending effects
4. **ora/blizzard.js** - Persistent area effects with ongoing damage

### Character Showcases
1. **Ora's Combo**: frost-bolt.js → ice-wall.js → blizzard.js
2. **Moctei's Combo**: shadow-step.js → umbral-strike.js → void-prison.js

## File Path Updates Needed

Most macros include placeholder paths that need updating:

### Sound Files
- Update `sounds/` paths to match your audio files
- Common sounds needed: explosion, spell-cast, healing, lightning

### Effect Files
- JB2A paths may vary between free and Patreon versions
- Use Sequencer Database Viewer to find correct paths
- Update paths in macros to match your installed modules

### Actor Names
- `summon-creature.js` requires updating the `ACTOR_NAME` variable
- Use actors that exist in your world

## Usage Tips

1. **Always test in a safe environment first**
2. **Back up your world before using complex macros**
3. **Check file paths in Sequencer Database Viewer**
4. **Start with basic macros before advanced ones**
5. **Read the macro headers for specific requirements**

## Customization Guide

### Colors
Most effects support color variants:
- `orange`, `blue`, `red`, `green`, `purple`, `yellow`
- Example: `jb2a.explosion.01.blue` instead of `jb2a.explosion.01.orange`

### Scale
Adjust effect sizes with `.scale()`:
- `0.5` = Half size
- `2.0` = Double size
- `scaleToObject()` = Match token size

### Timing
Control effect timing:
- `.duration(2000)` = 2 seconds
- `.delay(500)` = 0.5 second delay
- `.wait(1000)` = 1 second pause between effects

### Positioning
Different positioning options:
- `.atLocation(token)` = At token center
- `.attachTo(token)` = Follows token movement
- `.stretchTo(target)` = From origin to target
- `.belowTokens()` = Under tokens
- `.aboveInterface()` = Above everything