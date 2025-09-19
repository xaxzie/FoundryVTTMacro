# FoundryVTT Sequencer Macro Collection

A comprehensive collection of FoundryVTT macros using the [Sequencer](https://fantasycomputer.works/FoundryVTT-Sequencer) module for creating stunning visual effects, animations, and immersive gameplay experiences.

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
│   └── utilities/              # Helper functions and reusable components
├── templates/                  # Macro templates for quick development
└── assets/                     # Custom sounds, images, and effects
```

## 🚀 Prerequisites

### Required Modules
1. **Sequencer** - Core module for effects and animations
   - Install from: `https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json`

### Recommended Effect Modules
1. **JB2A - Jules&Ben's Animated Assets** (Free version) ⭐ **Required**
   - Foundry Package: `JB2A_DnD5e`
   - Paid version available at: [JB2A Patreon](https://www.patreon.com/JB2A)
   - Free download: [GitHub Releases](https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases)
   - **Contains all effects used in our macros**

2. **Jack Kerouac's Animated Spell Effects** (Optional)
   - Foundry Package: `animated-spell-effects`
   - Used in: Acid Splash example

3. **Jack Kerouac's Animated Cartoon Spell Effects** (Optional)
   - Foundry Package: `animated-spell-effects-cartoon`
   - Used in: Some alternative spell effects

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

## 📖 Learning Resources

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

- Always test macros in a safe environment first
- Some effects require specific modules to be installed
- File paths may need adjustment based on your module versions
- Back up your world before testing complex macros

## 📄 License

This collection is provided as-is for the FoundryVTT community. Individual effect assets may have their own licenses - please check with the respective creators.

---

*Happy adventuring! 🎲*