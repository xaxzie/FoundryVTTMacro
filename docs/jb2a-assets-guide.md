# JB2A Assets Used in Our Macros

This document lists all the JB2A (Jules&Ben's Animated Assets) effects used in our macro collection, including those used in the tested bubbles.js spell and available via utility functions.

## Asset Categories Used

### 🔥 Explosions and Fire Effects

- `jb2a.explosion.01.orange` - Orange explosion effect
- `jb2a.explosion.01.blue` - Blue explosion effect
- `jb2a.fireball` - Fireball projectile
- `jb2a.fireball.explosion.orange` - Fireball explosion
- `jb2a.fire_jet.orange` - Orange fire jet/stream
- `jb2a.impact.fire.01.orange` - Fire impact effect

### ⚡ Lightning and Energy Effects

- `jb2a.chain_lightning.primary.blue` - Primary chain lightning
- `jb2a.chain_lightning.secondary.blue` - Secondary chain lightning
- `jb2a.static_electricity.03.blue` - Static electricity effect
- `jb2a.lightning_strike.no_ring.blue` - Lightning strike without ring
- `jb2a.energy_beam.normal.orange.03` - Orange energy beam
- `jb2a.energy_beam.normal.blue.03` - Blue energy beam
- `jb2a.energy_field.02.above.purple` - Purple energy field
- `jb2a.energy_field.02.above.blue` - Blue energy field

### 💚 Healing Effects

- `jb2a.healing_generic.burst.yellowwhite` - Generic healing burst
- `jb2a.healing_generic.beam.yellowwhite` - Generic healing beam
- `jb2a.cure_wounds.400px.blue` - Cure wounds spell effect

### ⚔️ Combat and Melee Effects

- `jb2a.melee_generic.slashing.one_handed` - One-handed slashing attack
- `jb2a.melee_generic.slashing.two_handed` - Two-handed slashing attack
- `jb2a.impact.ground_crack.orange.02` - Ground crack impact (orange)
- `jb2a.impact.ground_crack.still_frame.02` - Static ground crack

### 🔮 Magic and Spells

- `jb2a.magic_missile` - Magic missile projectile
- `jb2a.magic_signs.circle.02.conjuration.intro.purple` - Conjuration circle intro
- `jb2a.magic_signs.circle.02.conjuration.outro.purple` - Conjuration circle outro
- `jb2a.magic_signs.circle.02.transmutation.intro.blue` - Transmutation circle intro
- `jb2a.magic_signs.circle.02.transmutation.outro.blue` - Transmutation circle outro
- `jb2a.misty_step.01.blue` - Misty step departure (blue)
- `jb2a.misty_step.02.blue` - Misty step arrival (blue)
- `jb2a.misty_step.01.purple` - Misty step departure (purple)
- `jb2a.shield.03.intro.blue` - Shield spell intro
- `jb2a.markers.circle_of_stars.orange` - Circle of stars marker

### 💧 Water and Projectile Effects (Used in bubbles.js and tourbillon.js)

- `jb2a.bullet.03.blue` - Blue projectile for water/ice elements
- `jb2a.explosion.04.blue` - Blue explosion for water impacts
- `jb2a.explosion.02.blue` - Blue explosion for ice impacts
- `jb2a.explosion.03.blueyellow` - Multi-color explosion for oil
- `jb2a.healing_generic.burst.greenorange` - Healing burst for living water
- `jb2a.cast_generic.02.blue.0` - Generic casting effect
- `jb2a.cast_generic.water.02.blue.0` - Water-specific casting effect
- `jb2a.impact.water.02.blue.0` - Water impact effect (used in tourbillon.js)
- `animated-spell-effects-cartoon.water.water splash.01` - Water splash effect (used in tourbillon.js)

### 🌬️ Environmental Effects

- `jb2a.wind_stream.default` - Wind stream effect
- `jb2a.smoke.puff.centered.grey.2` - Centered smoke puff
- `jb2a.breath_weapons02.burst.cone.fire.orange.02` - Cone fire breath weapon

### 🌪️ Vortex and Whirlwind Effects

- `jb2a_patreon.whirlwind.blue` - Blue water vortex/whirlwind (Patreon version)
- `jb2a_patreon.whirlwind.white` - White air vortex/whirlwind (Patreon version)
- `jb2a_patreon.whirlwind.grey` - Grey dust vortex/whirlwind (Patreon version)

## Download Information

### Official Sources

- **Free Version**: Available through FoundryVTT Module Browser
- **Patreon Version**: Available at [JB2A Patreon](https://www.patreon.com/JB2A)
- **GitHub Repository**: [Jules-Bens-Aa/JB2A_DnD5e](https://github.com/Jules-Bens-Aa/JB2A_DnD5e)

### Installation Options

#### Option 1: FoundryVTT Module (Recommended)

1. Install "JB2A - Jules&Ben's Animated Assets" through FoundryVTT
2. Enable the module in your world
3. Effects will be available through the Sequencer database

#### Option 2: Manual Asset Organization

If you want to organize assets locally:

1. Download the JB2A module
2. Extract the assets you need
3. Place them in the `assets/jb2a/` folder structure

## Asset File Structure

```
assets/
├── jb2a/
│   ├── explosions/
│   │   ├── explosion_01_orange.webm
│   │   ├── explosion_01_blue.webm
│   │   └── fireball_explosion_orange.webm
│   ├── lightning/
│   │   ├── chain_lightning_primary_blue.webm
│   │   ├── chain_lightning_secondary_blue.webm
│   │   └── static_electricity_03_blue.webm
│   ├── healing/
│   │   ├── healing_generic_burst_yellowwhite.webm
│   │   ├── healing_generic_beam_yellowwhite.webm
│   │   └── cure_wounds_400px_blue.webm
│   ├── combat/
│   │   ├── melee_generic_slashing_one_handed.webm
│   │   ├── melee_generic_slashing_two_handed.webm
│   │   └── impact_ground_crack_orange_02.webm
│   ├── magic/
│   │   ├── magic_missile.webm
│   │   ├── misty_step_01_blue.webm
│   │   ├── misty_step_02_blue.webm
│   │   └── shield_03_intro_blue.webm
│   └── environmental/
│       ├── wind_stream_default.webm
│       ├── smoke_puff_centered_grey_2.webm
│       └── breath_weapons02_burst_cone_fire_orange_02.webm
```

## Color Variants Available

Most JB2A effects come in multiple color variants:

- **Fire Effects**: orange, red, yellow
- **Lightning**: blue, purple, yellow
- **Magic**: blue, purple, green, red
- **Healing**: yellowwhite, blue, green

## File Sizes and Formats

- **Format**: WebM video files
- **Typical Size**: 100KB - 5MB per file
- **Resolution**: Various (400x400, 800x800, 1200x1200)
- **Duration**: 1-10 seconds depending on effect

## Usage in Macros

Effects are referenced using the JB2A database notation:

```javascript
.file("jb2a.explosion.01.orange")
```

### Important: Asset Path Corrections

**Whirlwind/Vortex Effects**: Use the correct Patreon asset paths:

- ✅ **Correct**: `"jb2a_patreon.whirlwind.blue"`
- ❌ **Incorrect**: `"jb2a.whirlwind.bluewhite"` (this path may not exist)

Always verify asset paths using the Sequencer Database Viewer or JB2A Asset Browser before implementing.

### Modern Usage with Utility Functions

The element-selection.js utility provides easy access to element-specific effects:

```javascript
// Copy from /macros/utilities/element-selection.js
function getElementEffectProperties(element) {
    const elementProperties = {
        water: {
            effectFile: "jb2a.bullet.03.blue",
            explosionFile: "jb2a.explosion.04.blue",
            effectColor: "blue"
        },
        ice: {
            effectFile: "jb2a.bullet.03.blue",
            explosionFile: "jb2a.explosion.02.blue",
            effectColor: "blue"
        }
        // ... more elements
    };
    return elementProperties[element];
}

// Usage in spells
const elementProps = getElementEffectProperties("water");
.file(elementProps.effectFile)
```

This notation works when:

1. JB2A module is installed and enabled
2. Sequencer module can access the database
3. The specific effect exists in your JB2A version
4. Use utility functions for consistent element-to-effect mapping

## Alternative Assets

If JB2A is not available, you can substitute with:

- Custom WebM files in the assets folder
- Free alternative effect packs
- Static images (less dynamic but functional)

## Troubleshooting Asset Issues

### Common Asset Path Problems

1. **"Effect file not found" errors**:

   - Check if the asset exists in your JB2A version (Free vs Patreon)
   - Verify the exact path using Sequencer Database Viewer
   - Some effects may have different naming conventions

2. **Whirlwind/Vortex Effects**:

   - Use `jb2a_patreon.whirlwind.blue` for water vortices
   - Use `jb2a_patreon.whirlwind.white` for air/ice effects
   - These are Patreon-exclusive assets

3. **Free vs Patreon Assets**:
   - Patreon assets use `jb2a_patreon.` prefix
   - Free assets use `jb2a.` prefix
   - Check your module version for availability

### Verification Methods

- Use the **Sequencer Database Viewer** in FoundryVTT
- Browse the [JB2A Asset Browser](https://library.jb2a.com/)
- Check the module's file structure directly

## Asset License

JB2A assets are created by Jules & Ben and are subject to their licensing terms:

- Free assets: Available for non-commercial use
- Patreon assets: Available to supporters with broader usage rights
- Always check current license terms on their Patreon page
