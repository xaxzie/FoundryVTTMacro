# Asset Inventory

> **Note**: This is an overview of available animation assets. For detailed inventories, see:
> - [JB2A Complete Inventory](jb2a-inventory.md)
> - [Jack Kerouac's Effects Inventory](kerouac-inventory.md)
> - [Jinker's Animated Art Inventory](jinker-inventory.md)

## JB2A - Jules&Ben's Animated Assets

### Primary Libraries
- **Free Module** ([Documentation](https://github.com/Jules-Bens-Aa/JB2A_DnD5e))
  - ~2000+ free effects
  - File format: Transparent WebM
  - Path: `modules/JB2A_DnD5e/Library/`

- **Patreon Module** ([Premium Content](https://www.patreon.com/JB2A))
  - ~5000+ premium effects
  - Higher quality variants
  - Additional color options
  - Exclusive animations

### Effect Categories

#### 🔥 Fire and Explosions
- **Explosions**
  - Multiple sizes and colors
  - Various impact types
  - Customizable durations
  - Examples:
    - `jb2a.explosion.01.orange`
    - `jb2a.explosion.01.blue`
    - `jb2a.fireball.explosion.orange`

- **Fire Effects**
  - Fire jets and streams
  - Persistent flames
  - Fire walls
  - Spell impacts
  - Examples:
    - `jb2a.fireball`
    - `jb2a.fire_jet.orange`
    - `jb2a.impact.fire.01.orange`

#### ⚡ Lightning and Energy
- **Chain Lightning**
  - Primary and secondary arcs
  - Multiple color variants
  - Examples:
    - `jb2a.chain_lightning.primary.blue`
    - `jb2a.chain_lightning.secondary.blue`
    - `jb2a.lightning_strike.no_ring.blue`

- **Energy Effects**
  - Beams and rays
  - Energy fields
  - Static electricity
  - Examples:
    - `jb2a.energy_beam.normal.orange.03`
    - `jb2a.energy_beam.normal.blue.03`
    - `jb2a.energy_field.02.above.purple`
    - `jb2a.static_electricity.03.blue`

#### 💚 Healing and Restoration
- **Healing Effects**
  - Generic healing bursts
  - Healing beams
  - Cure wounds
  - Examples:
    - `jb2a.healing_generic.burst.yellowwhite`
    - `jb2a.healing_generic.beam.yellowwhite`
    - `jb2a.cure_wounds.400px.blue`

#### ⚔️ Combat and Weapons
- **Melee Attacks**
  - Slashing animations (one and two-handed)
  - Impact effects
  - Ground cracks
  - Examples:
    - `jb2a.melee_generic.slashing.one_handed`
    - `jb2a.melee_generic.slashing.two_handed`
    - `jb2a.impact.ground_crack.orange.02`
    - `jb2a.impact.ground_crack.still_frame.02`

#### 🔮 Magic and Spells
- **Core Spells**
  - Magic missile
  - Shield effects
  - Teleportation
  - Examples:
    - `jb2a.magic_missile`
    - `jb2a.shield.03.intro.blue`
    - `jb2a.misty_step.01.blue`

- **Magic Signs**
  - Conjuration circles
  - Transmutation effects
  - Markers and indicators
  - Examples:
    - `jb2a.magic_signs.circle.02.conjuration.intro.purple`
    - `jb2a.magic_signs.circle.02.transmutation.intro.blue`
    - `jb2a.markers.circle_of_stars.orange`

#### 🌬️ Environmental
- **Weather and Environment**
  - Wind effects
  - Smoke effects
  - Breath weapons
  - Examples:
    - `jb2a.wind_stream.default`
    - `jb2a.smoke.puff.centered.grey.2`
    - `jb2a.breath_weapons02.burst.cone.fire.orange.02`

### Asset Browser
- Access via JB2A Asset Viewer: [https://library.jb2a.com/](https://library.jb2a.com/)
- Browse all effects by category
- Preview animations before use
- Get exact file paths

## Jack Kerouac's Animated Spell Effects

### Standard Collection
- **Base Module** ([Documentation](https://github.com/jackkerouac/animated-spell-effects))
  - 350+ realistic spell effects
  - Top-down perspective
  - Transparent WebM format
  - Path: `modules/animated-spell-effects/spell-effects/`

### Cartoon Collection
- **Cartoon Module** ([Documentation](https://github.com/jackkerouac/animated-spell-effects-cartoon))
  - 350+ cartoon-style effects
  - Stylized animations
  - Perfect for lighter themes
  - Path: `modules/animated-spell-effects-cartoon/spell-effects/`

### Effect Categories
- Area Effect Spells
- Single Target Spells
- Utility Effects
- Environmental Effects
- Combat Animations

## Jinker's Animated Art Pack

### Main Collection
- **Base Module** ([Documentation](https://github.com/jinkergm/JAA))
  - Specialized animated effects
  - Top-down perspective
  - Path: `modules/jaamod/AnimatedArt/`

### Premium Content
- Additional effects available via [Patreon](https://www.patreon.com/jinker)
- Preview available at [jinker.org](http://www.jinker.org/patreon)

## Usage in Macros

### Accessing Assets
```javascript
// JB2A Assets
await Sequencer.play("jb2a.explosion.01.orange");
await Sequencer.play("jb2a.magic_missile");

// Jack Kerouac's Effects
await Sequencer.play("modules/animated-spell-effects/spell-effects/fire_ball.webm");

// Jinker's Art
await Sequencer.play("modules/jaamod/AnimatedArt/effect_name.webm");
```

### Best Practices
1. Use JB2A for core D&D spell effects
2. Use Kerouac's effects for alternative styles
3. Use Jinker's pack for specialized animations
4. Mix and match for unique combinations

### Performance Tips
1. Preload frequently used effects
2. Use appropriate size variants
3. Consider file sizes for slower connections
4. Cache animations when possible

## Sound Effects Library

### Required Sounds
- [ ] explosion.wav
- [ ] fire-cast.wav
- [ ] healing.wav
- [ ] lightning-cast.wav
- [ ] spell-cast.wav
- [ ] sword-hit.wav
- [ ] critical-hit.wav

*Check off items as you acquire them!*

## Documentation Links
- [JB2A Wiki](https://jules-bens-aa.github.io/jb2a-wiki/)
- [JB2A Asset Browser](https://library.jb2a.com/)
- [Kerouac's Installation Guide](https://github.com/jackkerouac/animated-spell-effects#instructions)
- [Jinker's Setup Guide](https://github.com/jinkergm/JAA#installation)
