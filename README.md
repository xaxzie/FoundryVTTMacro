# FoundryVTT Spell Animation Collection

A specialized collection of FoundryVTT macros using the [Sequencer](https://fantasycomputer.works/FoundryVTT-Sequencer) module designed specifically for a custom tabletop RPG system. This repository focuses exclusively on **spell animation effects** for spells used by both NPCs and players in a turn-based combat system.

## 🎯 Quick Overview

- **35 total spell animation macros** (including examples)
- **Custom RPG focus**: Designed for specific combat mechanics
- **3 essential modules**: Sequencer + JB2A + Portal
- **Advanced targeting**: Portal crosshair system ready
- **Combat integration**: Carousel Combat Track for turn order management

## 📚 Essential Documentation

- **[GAME-RULES.md](./GAME-RULES.md)** - ⭐ **Required** understanding of RPG mechanics
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Installation, setup, contribution guidelines
- **[MODULE-REQUIREMENTS.md](./MODULE-REQUIREMENTS.md)** - Complete module information
- **[assets/README.md](./assets/README.md)** - Visual effects and assets reference

## 📁 Repository Structure

```
FoundryVTTMacro/
├── README.md                    # Project overview
├── GAME-RULES.md               # ⭐ Custom RPG rules and mechanics
├── DEVELOPMENT.md              # ⭐ Installation, setup, and contribution guide
├── MODULE-REQUIREMENTS.md      # Complete module dependencies
├── macros/                     # Spell animation macros
│   ├── characters/             # Character-specific spells
│   │   ├── ora/               # Ora's spells with bubbles.js reference
│   │   └── moctei/            # Moctei's spells
│   ├── examples/              # Learning examples (basic/intermediate/advanced)
│   ├── utilities/             # Reusable helper functions
│   └── templates/             # Starting templates for new spells
├── assets/                     # Effects and sounds reference
│   ├── README.md              # ⭐ Complete assets and Sequencer guide
│   ├── jb2a-inventory.md      # JB2A effects catalog
│   ├── *-inventory.md         # Other effect libraries
│   ├── jb2a/                  # JB2A assets
│   └── sounds/                # Audio files
└── modules/                    # Custom modules (status effects)
```

## 🎲 Custom RPG Focus

> **⚠️ Important**: This is NOT a generic spell collection. All animations are tailored for specific RPG mechanics.

**Key Features:**

- **7-stat system**: Physique, Dextérité, Agilité, Esprit, Sens, Volonté, Charisme
- **Combat stances**: Offensive, Defensive, Focus modes with different effects
- **Mana-based casting** with stance-dependent costs
- **GameMaster authority** - All rules subject to GM interpretation

**Project Scope:**

- ✅ Spell visual animations and targeting
- ✅ Audio feedback and synchronization
- ✅ RPG mechanics integration
- ❌ Dice rolling or damage calculation
- ❌ Character sheet management
- ❌ Turn order management (handled by Carousel Combat Track)

## � Quick Start

1. **Read Required Documentation:**

   - [GAME-RULES.md](./GAME-RULES.md) - Understand the RPG system
   - [DEVELOPMENT.md](./DEVELOPMENT.md) - Setup and installation

2. **Install Essential Modules:**

   ```
   ✅ Sequencer
   ✅ JB2A - Jules&Ben's Animated Assets
   ✅ Portal
   ✅ Carousel Combat Track
   ```

3. **Explore Examples:**

   - Study `/macros/characters/ora/bubbles.js` for full RPG integration
   - Check `/macros/examples/` for learning patterns
   - Use `/macros/utilities/` functions for consistency

4. **Reference Assets:**
   - Browse [assets/README.md](./assets/README.md) for available effects
   - Use Sequencer Database Viewer to preview animations

## 🤝 Contributing

All contributions must align with our custom RPG system. See [DEVELOPMENT.md](./DEVELOPMENT.md) for:

- Installation and setup instructions
- Code standards and best practices
- GameMaster approval workflow
- Testing requirements

**GameMaster Authority**: When in doubt about rules or implementations, consult the GameMaster before proceeding.

---

> **Get Started**: Begin with [GAME-RULES.md](./GAME-RULES.md) to understand the RPG context, then follow [DEVELOPMENT.md](./DEVELOPMENT.md) for technical setup.
> │ └── characters/ # Character-specific examples (Ora, Moctei)
> ├── templates/ # Spell macro templates for quick development
> └── modules/ # Custom modules (status effects)

```

```

## 🚀 Server Setup

### Pre-Installed Modules ✅

All required modules are **already installed and enabled** on the server:

#### Core Animation System

- ✅ **Sequencer** - Essential animation framework (latest stable version)

#### Visual Effects Libraries

- ✅ **JB2A - Jules&Ben's Animated Assets (Free)** - Comprehensive free effect library
- ✅ **JB2A - Jules&Ben's Animated Assets (Patreon)** - Extended premium effects
- ✅ **Animated Spell Effects** - Additional spell effect options
- ✅ **Animated Spell Effects - Cartoon** - Cartoon-style visual effects

#### Targeting & Combat Systems

- ✅ **Portal** - Advanced crosshair targeting and token spawning for spell casting
- ✅ **Carousel Combat Track** - Turn order management for RPG system

### Effect Library Access

With multiple effect libraries installed, spells can choose from:

```javascript
// JB2A Free effects
"jb2a.magic_missile.01.blue";

// JB2A Patreon effects
"jb2a.healing_generic.burst.greenorange";

// Animated Spell Effects
"modules/animated-spell-effects/spell-effects/ice-spear.webm";

// Animated Spell Effects Cartoon
"modules/animated-spell-effects-cartoon/spell-effects/fireball-cartoon.webm";
```

### Module Dependencies by Macro Category

| Macro Category   | Sequencer | JB2A | Portal | Carousel Combat | Animated Effects |
| ---------------- | --------- | ---- | ------ | --------------- | ---------------- |
| **Basic**        | ✅        | ✅   | ❌     | 🔸              | ❌               |
| **Intermediate** | ✅        | ✅   | ❌     | 🔸              | Available        |
| **Advanced**     | ✅        | ✅   | ✅     | ✅              | Available        |
| **Spells**       | ✅        | ✅   | ✅     | ✅              | Available        |
| **Utilities**    | ✅        | ✅   | ✅     | ✅              | Available        |
| **Templates**    | ✅        | ✅   | ✅     | ✅              | Available        |
| **Examples**     | ✅        | ✅   | ✅     | ❌              | Available        |

> ✅ = Always used | 🔸 = Optional for RPG integration | Available = Can be used as alternative or enhancement

## 🔗 Combat Integration API

### Verified Combat Tracker Capabilities

The Carousel Combat Track module provides comprehensive API access for RPG spell validation:

**✅ Turn Validation**: `game.combat.combatant` provides active combatant data
**✅ Combat State**: `game.combat.started` confirms combat is active
**✅ Initiative Access**: Full access to `game.combat.combatants` and turn order
**✅ Round Tracking**: `game.combat.round` for duration spells
**✅ Combatant Status**: Access to defeated status and initiative values

### Combat Integration Examples

```javascript
// Complete spell validation function
function validateSpellCasting(casterToken, spellName) {
  const combat = game.combat;

  // Check combat state
  if (!combat) {
    ui.notifications.warn(`${spellName} requires combat to be initiated`);
    return false;
  }

  if (!combat.started) {
    ui.notifications.warn(`${spellName} requires active combat`);
    return false;
  }

  // Check turn order
  const activeCombatant = combat.combatant;
  if (!activeCombatant) {
    ui.notifications.warn("No active combatant found");
    return false;
  }

  // Validate caster's turn
  if (activeCombatant.token?.id !== casterToken.id) {
    ui.notifications.warn(`${spellName}: Wait for your turn!`);
    return false;
  }

  return true;
}

// Accessing combat information for spell effects
function getCombatInfo() {
  const combat = game.combat;
  if (!combat) return null;

  return {
    round: combat.round,
    turn: combat.turn,
    activeCombatant: combat.combatant,
    allCombatants: Array.from(combat.combatants.contents),
    isActive: combat.started,
    totalCombatants: combat.combatants.size,
  };
}
```

## 📋 Quick Start Guide

### Creating Your First Spell Animation

1. Click on an empty hotbar slot in FoundryVTT
2. Set the macro type to **Script**
3. Copy and paste one of the example macros from the `macros/basic/` folder
4. Save and execute on a selected token!

> **Note**: Spell animations are designed to show visual effects only. Dice rolling, damage calculation, and mana cost management should be handled separately according to the custom RPG rules.

### Basic Sequencer Structure for Spells

```javascript
// Basic spell animation structure
new Sequence()
  .effect()
  .file("jb2a.spell_effect.webm")
  .atLocation(token)
  .scale(1.5)
  .sound()
  .file("assets/sounds/spell-cast.wav")
  .volume(0.3)
  .play();
```

## 📚 Spell Animation Categories

### 🔰 Basic Spell Animations

Simple single-effect spell macros perfect for learning Sequencer basics:

- Basic spell effects on tokens
- Spell sound playback
- Simple token animations
- Single-target spell effects

### 🎯 Intermediate Spell Animations

Multi-step spell sequences and complex effects:

- Multi-phase spell casting
- Spell combat animations
- Chain spell effects
- Area-of-effect spells

### ⚡ Advanced Spell Animations

Complex spell interactions and system integration:

- Crosshair spell targeting
- Teleportation spell effects
- Multi-target spell sequences
- Integration with RPG turn system

### 🔮 Generic Spell Animations

Ready-to-use spell effects adaptable to various situations:

- Elemental spell effects
- Healing and restoration spells
- Offensive spell animations
- Defensive and protection spells

### 🛠️ Spell Utilities

Helper functions and reusable spell components:

- **NEW: 8 Comprehensive Utility Files** - Extracted from tested bubbles.js spell
- **Actor Validation** - Token and caster validation functions
- **Stance Detection** - Combat stance detection and mana cost calculation
- **Character Stats** - Statistics with injury adjustment for RPG system
- **Portal Targeting** - Crosshair targeting using Portal module
- **Actor Detection** - Finding actors at target locations with tolerance
- **Damage Calculation** - Damage/healing rolls with stance mechanics
- **Element Selection** - Element selection dialogs and properties
- **Chat Formatting** - Professional chat message formatting
- **RPG integration helpers** - Combat stance and injury detection
- **Quick status detection** - One-line console commands for development

#### Combat Status Detection

Essential utilities for integrating with the custom RPG system:

**Quick Stance Check** (`macros/utilities/oneLineStanceCheck.js`):

```javascript
// Get current combat stance (console command)
canvas.tokens.controlled[0]?.document?.actor?.effects?.contents?.find((e) =>
  ["focus", "offensif", "defensif"].includes(e.name?.toLowerCase())
)?.name || "No stance";

// Get injury count (console command)
canvas.tokens.controlled[0]?.document?.actor?.effects?.contents?.find((e) =>
  e.name?.toLowerCase().includes("blessures")
)?.flags?.statuscounter?.value || 0;
```

**Comprehensive Status Check** (`macros/utilities/quickStanceCheck.js`):

- Detailed stance and injury analysis
- Debug information for development
- Multi-token support

These utilities integrate with:

- **Status Icon Counters** module for injury stacking
- **Custom Status Effects** module for stance management
- **Carousel Combat Track** for turn-based combat

## 🎮 Usage Examples

### Playing a Spell Effect on Selected Token

```javascript
// Simple spell animation on selected token
new Sequence()
  .effect()
  .file("jb2a.explosion.01.orange")
  .atLocation(canvas.tokens.controlled[0])
  .scale(1.0)
  .play();
```

### Multi-Target Spell Effect

```javascript
// Spell targeting multiple enemies
let mySequence = new Sequence();

for (let target of game.user.targets) {
  mySequence
    .effect()
    .file("jb2a.magic_missile")
    .atLocation(token)
    .stretchTo(target)
    .waitUntilFinished(-200); // Stagger the missiles
}

mySequence.play();
```

### RPG Turn-Based Spell Integration

```javascript
// Verified API: Check if it's player's turn before casting spell
function validateTurnAndCastSpell(casterToken) {
  const combat = game.combat;

  // Check if combat is active
  if (!combat?.started) {
    ui.notifications.warn("Combat must be active to cast spells");
    return false;
  }

  // Get current combatant
  const activeCombatant = combat.combatant;

  // Validate it's the caster's turn
  if (activeCombatant?.token?.id !== casterToken.id) {
    ui.notifications.warn("It's not your turn!");
    return false;
  }

  // Proceed with spell animation
  new Sequence()
    .effect()
    .file("jb2a.healing_generic.400px.blue")
    .atLocation(casterToken)
    .scale(0.8)
    .sound()
    .file("assets/sounds/healing.wav")
    .play();

  return true;
}

// Usage: validateTurnAndCastSpell(canvas.tokens.controlled[0]);
```

## 🎬 Asset Management

### JB2A Effects

All macros use JB2A (Jules&Ben's Animated Assets) for visual effects. You have several options:

#### Option 1: FoundryVTT Module (Recommended)

1. Install "JB2A - Jules&Ben's Animated Assets" through FoundryVTT
2. Enable the module in your world
3. Effects automatically work through Sequencer database

#### Option 2: Local Assets

1. Run `./download-jb2a-assets.sh` to download and organize assets
2. Assets will be placed in `/assets/jb2a/` with organized folder structure
3. Use the path converter utility for flexible path resolution

#### Option 3: Manual Setup

1. Download JB2A from [GitHub](https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases)
2. Extract specific assets to `/assets/jb2a/` folders
3. See `docs/jb2a-assets-guide.md` for detailed asset list

### Sound Effects

Add your spell sound files to `/assets/sounds/`:

- `spell-cast.wav` - Generic spell casting
- `explosion.wav` - Explosive spell effects
- `healing.wav` - Healing and restoration spells
- `lightning-cast.wav` - Lightning-based spells
- `ice-spell.wav` - Ice and frost spells
- `fire-spell.wav` - Fire and flame spells
- And more (see `assets/sounds/README.md`)

## 🔧 Customization

### File Paths

Effect macros can use any of the pre-installed libraries:

**JB2A Free Effects**:

```javascript
"jb2a.magic_missile.01.blue";
"jb2a.explosion.01.orange";
```

**JB2A Patreon Effects**:

```javascript
"jb2a.healing_generic.burst.greenorange";
"jb2a.cast_generic.01.blue.0";
```

**Animated Spell Effects**:

```javascript
"modules/animated-spell-effects/spell-effects/ice-spear.webm";
"modules/animated-spell-effects/spell-effects/fireball.webm";
```

**Animated Spell Effects Cartoon**:

```javascript
"modules/animated-spell-effects-cartoon/spell-effects/explosion-cartoon.webm";
```

Use the **Sequencer Database Viewer** to browse all available effects from installed libraries.

### Token Selection for Spells

Spell macros use different token selection methods:

- `canvas.tokens.controlled[0]` - First selected token (spell caster)
- `game.user.targets` - All targeted tokens (spell targets)
- `token` - Current token (in character sheets)

### Character Statistics Access

All character statistics are now stored as individual attributes in the FoundryVTT character sheet and can be accessed programmatically:

```javascript
// MODERN APPROACH: Use utility functions (recommended)
// Copy functions from /macros/utilities/character-stats.js
function getEspritStat(actor) {
  /* utility function */
}
const { baseStat, injuryStacks, adjustedStat } = getEspritStat(actor);

// LEGACY APPROACH: Direct access
const esprit = actor.system.attributes.esprit?.value || 3;
const physique = actor.system.attributes.physique?.value || 3;
const agilite = actor.system.attributes.agilite?.value || 3;
const dexterite = actor.system.attributes.dexterite?.value || 3;
const sens = actor.system.attributes.sens?.value || 3;
const volonte = actor.system.attributes.volonte?.value || 3;
const charisme = actor.system.attributes.charisme?.value || 3;

// Example usage in spell macros
const spellPower = adjustedStat; // With injury adjustments
ui.notifications.info(
  `Casting with ${spellPower} Esprit power (${injuryStacks} injuries)!`
);
```

**Available Characteristics**:

- `physique` - Physical Strength
- `dexterite` - Dexterity/Skill
- `agilite` - Agility/Speed/Reflexes
- `esprit` - Mind/Concentration
- `sens` - Senses/Perception
- `volonte` - Will/Determination
- `charisme` - Charisma/Social Understanding

**Setup**: Use the character statistics setup utility in `/macros/utilities/character-stats-setup.js` to configure character stats, then edit them directly in the character sheet under "Attributes".

### RPG Integration Notes

- **Character Stats**: Use utility functions from `/macros/utilities/character-stats.js` for injury-adjusted values
- **Stance Detection**: Use utility functions from `/macros/utilities/stance-detection.js` for combat stance management
- **Portal Targeting**: Use utility functions from `/macros/utilities/portal-targeting.js` for crosshair targeting
- **Mana/Power costs**: Calculated via stance utilities, manage deduction via character sheets
- **Turn validation**: Some macros may check current turn before executing
- **Stance effects**: Visual effects vary based on character stance (implemented in bubbles.js)
- **Utility Pattern**: Copy utility functions into your spells for consistent RPG integration

## 📚 RPG-Compliant Spells & Examples

### ✅ **RPG-Compliant Spells (READY FOR USE)**

- **`/macros/characters/ora/bubbles.js`** - **TESTED ON SERVER** - First fully RPG-compliant spell with all features:
  - Combat stance detection and mana cost calculation
  - Character stat integration with injury adjustments
  - Portal crosshair targeting system
  - Professional damage calculation and chat output
  - Element selection with game effects

### 📖 **Learning Resources**

- **`/macros/utilities/README.md`** - **Complete utility function reference**
- **All utility files in `/macros/utilities/`** - Copy these functions for new spells

### ⚠️ **Example Animations (For Learning Purposes Only - Not RPG Compliant)**

The `/examples/` directory contains spell animations that demonstrate Sequencer techniques but do **not comply** with the custom RPG rules:

### 🌊 **Ora Examples** - Water & Ice Techniques

- **Frost Bolt**: Projectile animation patterns
- **Ice Wall**: Barrier creation sequences
- **Water Whip**: Line attack demonstrations
- **Blizzard**: Area effect timing examples
- **Healing Spring**: Continuous effect loops

### 🌑 **Moctei Examples** - Shadow & Darkness Techniques

- **Shadow Bolt**: Life-drain visual effects
- **Darkness Cloud**: Area denial animations
- **Shadow Step**: Teleportation mechanics
- **Umbral Strike**: Enhanced melee sequences
- **Void Prison**: Complex crowd control timing

**📁 Location**: `/examples/characters/[character-name]/`
**📚 Usage**: Study for animation techniques, but convert to RPG-compliant versions before use
**⚠️ Missing**: Turn validation, mana integration, combat state checking, stance awareness
**✅ Upgrade Path**: Use **bubbles.js** as template and copy utility functions from `/macros/utilities/`

## �📖 Learning Resources

- [Official Sequencer Wiki](https://fantasycomputer.works/FoundryVTT-Sequencer)
- [Sequencer API Reference](./docs/sequencer-reference.md)
- [JB2A Assets Guide](./docs/jb2a-assets-guide.md) ⭐ **Asset Information**
- [Best Practices Guide](./docs/best-practices.md)
- [Installation Guide](./docs/installation-guide.md)

## 🤝 Contributing

We welcome spell animation contributions that fit our custom RPG system! Please follow our guidelines:

### Before Contributing:

1. **Read [GAME-RULES.md](./GAME-RULES.md)** to understand the RPG context
2. **Check [CONTRIBUTING.md](./CONTRIBUTING.md)** for detailed workflow
3. **Consult with GameMaster** for new spell concepts or rule interpretations

### Contribution Process:

1. Place spell animations in appropriate category folders
2. Include clear comments explaining the spell effect and RPG context
3. Note any required modules, assets, or character stats
4. Test with multiple tokens and combat scenarios
5. **Get GameMaster approval** before submitting large changes

### What We're Looking For:

- ✅ Spell animations that fit the custom RPG mechanics
- ✅ Effects that work with the 7-stat system and stance modes
- ✅ Animations compatible with turn-based combat flow
- ✅ Clear documentation and comments
- ✅ Turn validation and combat state integration

### What We're Not Looking For:

- ❌ Generic D&D 5e spell ports without RPG adaptation
- ❌ Animations that include dice rolling or damage calculation
- ❌ Effects that contradict established RPG rules
- ❌ Non-compliant spells (these belong in `/examples/` for reference)

## ⚠️ Important Notes

### Module Requirements & Troubleshooting

#### **Missing Module Errors**

All required modules are pre-installed on the server. If you encounter errors:

- `"Sequencer is not defined"` → Contact server admin (module may be disabled)
- `"portal is not defined"` → Contact server admin (module may be disabled)
- `"Cannot find effect file"` → Check file path or use Sequencer Database Viewer
- `"Carousel Combat Track not found"` → Contact server admin (module may be disabled)

#### **Spell Effect File Not Found**

- **Multiple Libraries**: Choose from JB2A Free, JB2A Patreon, Animated Spell Effects, or Cartoon variants
- **Solution**: Use Sequencer Database Viewer to find available spell effects
- **Path Examples**: See [File Paths](#file-paths) section for correct syntax

#### **Spell Targeting Issues**

- **Problem**: `portal.crosshairs.show()` not working
- **Solution**: Portal is pre-installed - contact server admin if issues persist
- **Alternative**: Use `Sequencer.Crosshair.show()` (older syntax) if needed

#### **Turn Order Integration**

- **Verified API**: Carousel Combat Track provides full combat state access
- **Turn Validation**: Use `game.combat.combatant` to get active combatant
- **Combat Status**: Check `game.combat.started` before spell execution
- **Initiative Access**: Available through `game.combat.combatants` collection
- **Implementation**: See [Combat Integration API](#-combat-integration-api) section above

#### **RPG Integration Status**

- **Character Stats**: Access stats from FoundryVTT character sheets manually
- **Mana/Power**: Use character sheet resources, not automation
- **Stance Detection**: Currently manual - future automation planned
- **✅ Turn Validation**: Fully implemented with verified API access
- **✅ Combat State**: Complete combat status and round tracking available
- **✅ Initiative Order**: Full access to combatant turn order and status

#### **Performance Issues**

- **Large spell effects**: Reduce `.scale()` values
- **Multiple spell macros**: Add delays between executions
- **Persistent spell effects**: Use cleanup functions to remove old effects

### General Safety

- Always test spell macros in a safe environment first
- Some spell effects require specific modules to be installed
- File paths may need adjustment based on your module versions
- Back up your world before testing complex spell animations
- **RPG Integration**: Test spells with different character stances and stats

### Compatibility

- **FoundryVTT Version**: v10+ recommended
- **Game Systems**: Custom RPG system (not D&D 5e/Pathfinder specific)
- **Module Conflicts**: Test with minimal module setup first
- **Custom RPG**: Designed specifically for the GameMaster's rule system

## 📄 License

This spell animation collection is provided as-is for the custom RPG system and FoundryVTT community. Individual effect assets may have their own licenses - please check with the respective creators.

**Note**: This collection is specifically designed for a custom RPG system. While others may use these animations, they are optimized for specific game mechanics and may not translate directly to other systems.

---

_May your spells light up the battlefield! ⚡🎲_
