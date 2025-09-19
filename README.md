# FoundryVTT Spell Animation Collection for Custom RPG

A specialized collection of FoundryVTT macros using the [Sequencer](https://fantasycomputer.works/FoundryVTT-Sequencer) module designed specifically for a custom tabletop RPG system. This repository focuses exclusively on **spell animation effects** for spells used by both NPCs and players in a turn-based, ta## 📖 Learning Resources

- [Official Sequencer Wiki](https://fantasycomputer.works/FoundryVTT-Sequencer)
- [Sequencer API Reference](./docs/sequencer-reference.md)
- [JB2A Assets Guide](./docs/jb2a-assets-guide.md) ⭐ **Asset Information**
- [Best Practices Guide](./docs/best-practices.md) ⭐ **RPG-Specific Guidelines**
- [Installation Guide](./docs/installation-guide.md) ⭐ **Custom RPG Setup**
- [Custom Game Rules](./GAME-RULES.md) ⭐ **Essential RPG Context**
- [Carousel Combat Track Documentation](https://wiki.theripper93.com/free/combat-tracker-dock) (External)
- [FoundryVTT Character Sheets Guide](https://foundryvtt.com/article/actors/) (External)combat system.

## 🎲 RPG Context

This collection is built for a custom RPG with unique combat mechanics and rules. All spell animations are designed to work within this specific game context:

- **Custom turn-based combat** using carousel Combat Track module
- **6-stat system**: Force, Dexterité, Agilité, Esprit, Sens, Volonté, Charisme
- **Tactical stance system**: Offensive, Defensive, and Focus modes
- **D7-based dice mechanics** for attack and defense rolls
- **Mana-based spell casting** with stance-dependent costs

> **⚠️ Important**: This is NOT a generic spell collection. All animations are tailored for specific RPG mechanics detailed in [GAME-RULES.md](./GAME-RULES.md).

## 🎯 Project Scope

**What this repository handles:**
- ✅ Spell visual animations and effects
- ✅ Audio feedback for spell casting
- ✅ Token-based targeting and positioning
- ✅ Sequencer-based visual storytelling

**What this repository does NOT handle:**
- ❌ Dice rolling mechanics (handled externally)
- ❌ Damage calculations (manual or external scripts)
- ❌ Character stat management (use FoundryVTT character sheets)
- ❌ Turn order management (handled by carousel Combat Track)

## 👨‍⚔️ GameMaster Authority

**IMPORTANT**: All rules in this custom RPG are subject to GameMaster interpretation. When contributing or modifying animations:
- 🤔 **If in doubt about rule interpretation**: Ask the GameMaster
- 📝 **For new spell effects**: Consult GameMaster for appropriate visual style
- ⚖️ **For rule conflicts**: GameMaster decision is final

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on working with GameMaster approval.

## 📋 Module Requirements Summary

**📄 Complete Module Guide**: See [MODULE-REQUIREMENTS.md](./MODULE-REQUIREMENTS.md) for detailed analysis

### At a Glance:
- **35 total spell animation macros** in this collection
- **Custom RPG focus**: Designed for specific combat mechanics
- **3 essential modules**: Sequencer + JB2A + Warp Gate
- **100% require Sequencer** (core animation system)
- **97% require JB2A** (visual effects)
- **29% require Warp Gate** (character macros only)
- **Requires carousel Combat Track** (turn order management)

### Quick Install:
```bash
# Essential modules for all macros
✅ Sequencer (core animation system)
✅ JB2A - Jules&Ben's Animated Assets (visual effects)
✅ Warp Gate (for spell targeting)
✅ Carousel Combat Track (turn order management)
```

## 📖 Learning Resources

## 📁 Project Structure

```
TestFoundry/
├── README.md                   # This file - Project overview and RPG context
├── GAME-RULES.md              # Custom RPG rules and mechanics
├── CONTRIBUTING.md            # Contribution guidelines with GameMaster workflow
├── docs/                      # Documentation and guides
│   ├── sequencer-reference.md # Sequencer API reference
│   ├── installation-guide.md  # Setup instructions for custom RPG
│   └── best-practices.md      # RPG-specific animation guidelines
├── macros/                    # All spell animation macros organized by complexity
│   ├── basic/                 # Simple spell effects and sounds
│   ├── intermediate/          # Multi-step spell sequences
│   ├── advanced/              # Complex spells with targeting and interactions
│   ├── spells/                # Generic spell animations
│   ├── characters/            # Character-specific spell collections
│   │   ├── ora/               # Water and ice specialist spells
│   │   └── moctei/            # Shadow specialist spells
│   └── utilities/             # Helper functions and reusable components
├── templates/                 # Spell macro templates for quick development
└── assets/                    # Custom sounds, images, and effects
```

## 🚀 Prerequisites

### Core Required Modules

#### 1. **Sequencer** ⭐ **ESSENTIAL**
- **Description**: Core module for all visual effects and animations
- **Install URL**: `https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json`
- **Usage**: Required for ALL macros in this collection
- **Version**: Latest stable version recommended

#### 2. **JB2A - Jules&Ben's Animated Assets** ⭐ **ESSENTIAL**
- **Description**: Provides visual effects used in 95% of macros
- **Free Package**: `jb2a_dnd5e` 
- **Patreon Package**: `jb2a_patreon` (extended effects)
- **GitHub**: [Free Version Downloads](https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases)
- **Usage**: Required for ALL macros except basic sound-only effects

#### 3. **Warp Gate** ⭐ **REQUIRED for Spell Targeting**
- **Description**: Provides crosshair targeting and advanced token manipulation for spell casting
- **Package**: `warpgate`
- **Usage**: Required for ALL character-specific spells and targeted effects
- **Features**: `warpgate.crosshairs.show()` for spell targeting system

#### 4. **Carousel Combat Track** ⭐ **REQUIRED for RPG System**
- **Description**: Turn order management for the custom RPG combat system
- **Package**: Search "carousel" or "combat track" in FoundryVTT modules
- **Usage**: Required for turn-based combat mechanics and initiative tracking
- **Documentation**: [Carousel Combat Track Documentation](https://wiki.theripper93.com/free/combat-tracker-dock)
- **API Integration**: Full combat state access with verified turn validation capabilities

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
    
    // Additional checks can be added here:
    // - Combatant not defeated: !activeCombatant.defeated
    // - Specific round requirements: combat.round >= requiredRound
    // - Initiative-based effects: activeCombatant.initiative
    
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
        totalCombatants: combat.combatants.size
    };
}
```

### Optional Enhancement Modules

#### 5. **Animated Spell Effects** (Optional)
- **Package**: `animated-spell-effects`
- **Usage**: Used in `acid-splash.js` macro only
- **Alternative**: Can be replaced with JB2A effects

#### 6. **Animated Spell Effects - Cartoon** (Optional)
- **Package**: `animated-spell-effects-cartoon`
- **Usage**: Used in `acid-splash.js` macro only
- **Alternative**: Can be replaced with JB2A effects

### Module Installation Priority

```
Priority 1 (Essential for RPG System):
✅ Sequencer
✅ JB2A - Jules&Ben's Animated Assets  
✅ Warp Gate
✅ Carousel Combat Track

Priority 2 (Recommended):
🔸 JB2A Patreon (for enhanced effects)

Priority 3 (Optional):
🔹 Animated Spell Effects
🔹 Animated Spell Effects - Cartoon
```

### Module Dependencies by Macro Category

| Macro Category | Sequencer | JB2A | Warp Gate | Carousel Combat | Other |
|----------------|-----------|------|-----------|-----------------|-------|
| **Basic** | ✅ | ✅ | ❌ | 🔸 | ❌ |
| **Intermediate** | ✅ | ✅ | ❌ | 🔸 | Animated Effects (1 macro) |
| **Advanced** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Spells** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Characters** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Templates** | ✅ | ✅ | ✅ | ✅ | ❌ |

> 🔸 = Optional but recommended for RPG integration

### Quick Installation Guide

1. **Install Sequencer**:
   - FoundryVTT → Add-on Modules → Install Module
   - Paste: `https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json`

2. **Install JB2A**:
   - Search "JB2A" in module browser
   - Install "JB2A - Jules&Ben's Animated Assets"

3. **Install Warp Gate**:
   - Search "Warp Gate" in module browser
   - Install for spell targeting and character macros

4. **Install Carousel Combat Track**:
   - Search "carousel" or "combat track" in module browser
   - Install for turn order management in RPG system

5. **Enable Modules**:
   - Go to World Settings → Manage Modules
   - Enable: Sequencer, JB2A, Warp Gate, Carousel Combat Track
   - Restart world

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
- Common spell effect patterns
- Token targeting utilities
- Spell effect management tools
- RPG integration helpers

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

for(let target of game.user.targets) {
    mySequence.effect()
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
Most spell macros use placeholder paths. Update these to match your installed effect modules:
- **JB2A Free**: `modules/jb2a_patreon/Library/...`
- **JB2A Patreon**: `modules/JB2A_DnD5e/Library/...`
- **Animated Spell Effects**: `modules/animated-spell-effects/...`

### Token Selection for Spells
Spell macros use different token selection methods:
- `canvas.tokens.controlled[0]` - First selected token (spell caster)
- `game.user.targets` - All targeted tokens (spell targets)
- `token` - Current token (in character sheets)

### RPG Integration Notes
- **Mana/Power costs**: Not handled by animations - manage via character sheets
- **Turn validation**: Some macros may check current turn before executing
- **Stance effects**: Visual effects may vary based on character stance (future feature)

## � Character-Specific Macros

The collection includes complete spell sets for two specialized characters:

### 🌊 **Ora - Water & Ice Specialist**
- **Frost Bolt**: Precise ice projectile with slowing effects
- **Ice Wall**: Defensive barrier creation with cascading formation
- **Water Whip**: Line attack striking multiple enemies
- **Blizzard**: Devastating area ice storm with ongoing damage
- **Healing Spring**: Continuous area healing for allies

*Perfect for support roles and battlefield control*

### 🌑 **Moctei - Shadow Specialist**  
- **Shadow Bolt**: Life-draining dark projectile
- **Darkness Cloud**: Area denial with blindness effects
- **Shadow Step**: Stealth teleportation with sneak attack bonus
- **Umbral Strike**: Shadow-enhanced melee with debuff
- **Void Prison**: Ultimate crowd control with continuous drain

*Ideal for tactical positioning and debuff strategies*

**📁 Location**: `/macros/characters/[character-name]/`  
**📚 Documentation**: Each character has detailed README with tactics, lore, and RPG-specific spell interactions

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
- ✅ Effects that work with the 6-stat system and stance modes
- ✅ Animations compatible with turn-based combat flow
- ✅ Clear documentation and comments

### What We're Not Looking For:
- ❌ Generic D&D 5e spell ports without RPG adaptation
- ❌ Animations that include dice rolling or damage calculation
- ❌ Effects that contradict established RPG rules

## ⚠️ Important Notes

### Module Requirements & Troubleshooting

#### **Missing Module Errors**
If you encounter errors like:
- `"Sequencer is not defined"` → Install and enable Sequencer module
- `"warpgate is not defined"` → Install Warp Gate for spell targeting
- `"Cannot find effect file"` → Install JB2A module
- `"Carousel Combat Track not found"` → Install carousel combat module

#### **Spell Effect File Not Found**
- **JB2A Free vs Patreon**: Some spell macros reference Patreon effects
- **Solution**: Update file paths to use available effects
- **Use**: Sequencer Database Viewer to find available spell effects

#### **Spell Targeting Issues**
- **Problem**: `warpgate.crosshairs.show()` not working
- **Solution**: Ensure Warp Gate module is installed and enabled
- **Alternative**: Replace with `Sequencer.Crosshair.show()` (older syntax)

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

*May your spells light up the battlefield! ⚡🎲*