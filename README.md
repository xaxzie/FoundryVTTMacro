# FoundryVTT Sequencer Macro Collection

A comprehensive collection of FoundryVTT macros using the [Sequencer](https://fantasycomputer.works/FoundryVTT-Sequencer) module for creating stunning visual effects, animations, and immersive gameplay experien**📁 Location**: `/macros/characters/[character-name]/`  
**📚 Documentation**: Each character has detailed README with tactics and lore

## 📋 Module Requirements Summary

**📄 Complete Module Guide**: See [MODULE-REQUIREMENTS.md](./MODULE-REQUIREMENTS.md) for detailed analysis

### At a Glance:
- **35 total macros** in this collection
- **3 essential modules**: Sequencer + JB2A + Warp Gate
- **100% require Sequencer** (core animation system)
- **97% require JB2A** (visual effects)
- **29% require Warp Gate** (character macros only)

### Quick Install:
```bash
# Essential modules for all macros
✅ Sequencer (core)
✅ JB2A - Jules&Ben's Animated Assets (effects)
✅ Warp Gate (for character spells)
```

## 📖 Learning Resources

## 📁 Project Structure

```
TestFoundry/
├── README.md                   # This file
├── docs/                       # Documentation and guides
│   ├── sequencer-reference.md  # Sequencer API reference
│   ├── installation-guide.md   # Setup instructions
│   └── best-practices.md       # Macro development guidelines
├── macros/                     # All macro files organized by complexity
│   ├── basic/                  # Simple effects and sounds
│   ├── intermediate/           # Multi-step sequences and spell effects
│   ├── advanced/               # Complex macros with crosshairs and animations
│   ├── spells/                 # Spell-specific macros
│   ├── characters/             # Character-specific spell collections
│   │   ├── ora/                # Water and ice specialist spells
│   │   └── moctei/             # Shadow specialist spells
│   └── utilities/              # Helper functions and reusable components
├── templates/                  # Macro templates for quick development
└── assets/                     # Custom sounds, images, and effects
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

#### 3. **Warp Gate** ⭐ **REQUIRED for Character Macros**
- **Description**: Provides crosshair targeting and advanced token manipulation
- **Package**: `warpgate`
- **Usage**: Required for ALL character-specific spells (Ora & Moctei)
- **Features**: `warpgate.crosshairs.show()` for spell targeting

### Optional Enhancement Modules

#### 4. **Animated Spell Effects** (Optional)
- **Package**: `animated-spell-effects`
- **Usage**: Used in `acid-splash.js` macro only
- **Alternative**: Can be replaced with JB2A effects

#### 5. **Animated Spell Effects - Cartoon** (Optional)
- **Package**: `animated-spell-effects-cartoon`
- **Usage**: Used in `acid-splash.js` macro only
- **Alternative**: Can be replaced with JB2A effects

### Module Installation Priority

```
Priority 1 (Essential):
✅ Sequencer
✅ JB2A - Jules&Ben's Animated Assets  
✅ Warp Gate

Priority 2 (Recommended):
🔸 JB2A Patreon (for enhanced effects)

Priority 3 (Optional):
🔹 Animated Spell Effects
🔹 Animated Spell Effects - Cartoon
```

### Module Dependencies by Macro Category

| Macro Category | Sequencer | JB2A | Warp Gate | Other |
|----------------|-----------|------|-----------|-------|
| **Basic** | ✅ | ✅ | ❌ | ❌ |
| **Intermediate** | ✅ | ✅ | ❌ | Animated Effects (1 macro) |
| **Advanced** | ✅ | ✅ | ❌ | ❌ |
| **Spells** | ✅ | ✅ | ❌ | ❌ |
| **Characters** | ✅ | ✅ | ✅ | ❌ |
| **Templates** | ✅ | ✅ | ❌ | ❌ |

### Quick Installation Guide

1. **Install Sequencer**:
   - FoundryVTT → Add-on Modules → Install Module
   - Paste: `https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json`

2. **Install JB2A**:
   - Search "JB2A" in module browser
   - Install "JB2A - Jules&Ben's Animated Assets"

3. **Install Warp Gate**:
   - Search "Warp Gate" in module browser
   - Install for character-specific macros

4. **Enable Modules**:
   - Go to World Settings → Manage Modules
   - Enable: Sequencer, JB2A, Warp Gate
   - Restart world

## 📋 Quick Start Guide

### Creating Your First Macro

1. Click on an empty hotbar slot in FoundryVTT
2. Set the macro type to **Script**
3. Copy and paste one of the example macros from the `macros/basic/` folder
4. Save and execute!

### Basic Sequencer Structure

```javascript
new Sequence()
    .effect()
        .file("path/to/effect.webm")
        .atLocation(token)
    .sound()
        .file("path/to/sound.wav")
    .play();
```

## 📚 Macro Categories

### 🔰 Basic Macros
Simple single-effect macros perfect for learning Sequencer basics:
- Simple effects on tokens
- Basic sound playback
- Token animations

### 🎯 Intermediate Macros
Multi-step sequences and spell effects:
- Spell casting effects
- Combat animations
- Chain effects

### ⚡ Advanced Macros
Complex interactions and system integration:
- Crosshair targeting
- Teleportation effects
- Multi-target spells
- Integration with other modules

### 🔮 Spell Macros
Ready-to-use spell effects for various systems:
- D&D 5e spells
- Pathfinder spells
- Generic fantasy effects

### 🛠️ Utilities
Helper functions and reusable components:
- Common effect patterns
- Token selection utilities
- Effect management tools

## 🎮 Usage Examples

### Playing an Effect on Selected Token
```javascript
new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(canvas.tokens.controlled[0])
    .play();
```

### Multi-Target Spell Effect
```javascript
let mySequence = new Sequence();

for(let target of game.user.targets) {
    mySequence.effect()
        .file("jb2a.magic_missile")
        .atLocation(token)
        .stretchTo(target)
        .wait(200);
}

mySequence.play();
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
Add your sound files to `/assets/sounds/`:
- `explosion.wav` - Explosion effects
- `spell-cast.wav` - Generic spell casting
- `healing.wav` - Healing spells
- `lightning-cast.wav` - Lightning spells
- And more (see `assets/sounds/README.md`)

## 🔧 Customization

### File Paths
Most macros use placeholder paths. Update these to match your installed effect modules:
- **JB2A Free**: `modules/jb2a_patreon/Library/...`
- **JB2A Patreon**: `modules/JB2A_DnD5e/Library/...`
- **Animated Spell Effects**: `modules/animated-spell-effects/...`

### Token Selection
Macros use different token selection methods:
- `canvas.tokens.controlled[0]` - First selected token
- `game.user.targets` - All targeted tokens
- `token` - Current token (in character sheets)

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
**📚 Documentation**: Each character has detailed README with tactics and lore

## �📖 Learning Resources

- [Official Sequencer Wiki](https://fantasycomputer.works/FoundryVTT-Sequencer)
- [Sequencer API Reference](./docs/sequencer-reference.md)
- [JB2A Assets Guide](./docs/jb2a-assets-guide.md) ⭐ **Asset Information**
- [Best Practices Guide](./docs/best-practices.md)
- [Installation Guide](./docs/installation-guide.md)

## 🤝 Contributing

Feel free to add your own macros and effects! Follow the existing structure:
1. Place macros in appropriate category folders
2. Include clear comments explaining the effect
3. Note any required modules or assets
4. Test with multiple tokens/scenarios

## ⚠️ Important Notes

### Module Requirements & Troubleshooting

#### **Missing Module Errors**
If you encounter errors like:
- `"Sequencer is not defined"` → Install and enable Sequencer module
- `"warpgate is not defined"` → Install Warp Gate for character macros
- `"Cannot find effect file"` → Install JB2A module

#### **Effect File Not Found**
- **JB2A Free vs Patreon**: Some macros reference Patreon effects
- **Solution**: Update file paths to use available effects
- **Use**: Sequencer Database Viewer to find available effects

#### **Crosshair Issues**
- **Problem**: `warpgate.crosshairs.show()` not working
- **Solution**: Ensure Warp Gate module is installed and enabled
- **Alternative**: Replace with `Sequencer.Crosshair.show()` (older syntax)

#### **Performance Issues**
- **Large effects**: Reduce `.scale()` values
- **Multiple macros**: Add delays between executions
- **Persistent effects**: Use cleanup functions to remove old effects

### General Safety
- Always test macros in a safe environment first
- Some effects require specific modules to be installed
- File paths may need adjustment based on your module versions
- Back up your world before testing complex macros

### Compatibility
- **FoundryVTT Version**: v10+ recommended
- **Game Systems**: D&D 5e, Pathfinder 2e, system-agnostic
- **Module Conflicts**: Test with minimal module setup first

## 📄 License

This collection is provided as-is for the FoundryVTT community. Individual effect assets may have their own licenses - please check with the respective creators.

---

*Happy adventuring! 🎲*