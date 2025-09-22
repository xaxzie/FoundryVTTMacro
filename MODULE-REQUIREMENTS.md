# FoundryVTT Module Requirements

## Quick Reference for All Macros

This document provides a comprehensive list of all FoundryVTT modules available for the macros in this collection.

## Pre-Installed Modules on Server ✅

All required modules are **already installed and enabled** on the server:

### Core Animation System
- ✅ **Sequencer** - Essential animation framework (latest stable version)

### Visual Effects Libraries  
- ✅ **JB2A - Jules&Ben's Animated Assets (Free)** - Comprehensive free effect library (~1.5GB, 2000+ effects)
- ✅ **JB2A - Jules&Ben's Animated Assets (Patreon)** - Extended premium effects (~8GB+, 5000+ effects)
- ✅ **Animated Spell Effects** - Additional spell effect animations
- ✅ **Animated Spell Effects - Cartoon** - Cartoon-style visual effects

### Targeting & Combat Systems
- ✅ **Warp Gate** - Advanced crosshair targeting for spell casting
- ✅ **Carousel Combat Track** - Turn order management for RPG system

## Available Effect Libraries

With all libraries pre-installed, macros can choose from multiple effect sources:

## Module Requirements by Macro Category

| Category | File Count | Sequencer | JB2A | Warp Gate | Animated Effects |
|----------|------------|-----------|------|-----------|------------------|
| **Basic** | 7 macros | ✅ Always | ✅ Always | ❌ Not used | Available |
| **Intermediate** | 6 macros | ✅ Always | ✅ Always | ❌ Not used | Available (used in 1 macro) |
| **Advanced** | 5 macros | ✅ Always | ✅ Always | ❌ Not used | Available |
| **Spells** | 3 macros | ✅ Always | ✅ Always | ❌ Not used | Available |
| **Characters/Ora** | 1 macro | ✅ Always | ✅ Always | ✅ Always | Available |
| **Examples/Ora** | 5 macros | ✅ Always | ✅ Always | ✅ Always | Available |
| **Examples/Moctei** | 5 macros | ✅ Always | ✅ Always | ✅ Always | Available |
| **Templates** | 2 templates | ✅ Always | ✅ Always | � Optional | Available |
| **Utilities** | 2 utilities | ✅ Always | ✅ Always | ❌ Not used | Available |

**Total Macros**: 31 files + examples  
**Use Sequencer**: 100% (core animation system)  
**Use JB2A**: 97% (primary effect library)  
**Use Warp Gate**: Character macros (advanced targeting)  
**Animated Effects**: Available as alternative/enhancement  

## Server Configuration ✅

### All Modules Pre-Enabled
No installation required! All modules are already:
- ✅ **Installed** on the server
- ✅ **Enabled** in the world settings  
- ✅ **Updated** to latest compatible versions
- ✅ **Configured** for optimal performance

### Ready to Use
- **Sequencer Database**: Browse all available effects
- **Effect Libraries**: Multiple sources for visual variety
- **Targeting System**: Crosshair functionality active
- **Combat Integration**: Turn order management ready

## Module Dependency Tree

```
All Macros
├── Sequencer (CORE - handles all animations)
├── JB2A (ASSETS - provides effect files)
│   ├── Free version: 1.5GB, 2000+ effects
│   └── Patreon version: 8GB+, 5000+ effects
└── Character Macros Only
    └── Warp Gate (TARGETING - crosshair system)
        └── Used for spell placement and targeting
```

## Troubleshooting Module Issues

### Error: "Sequencer is not defined"
- **Cause**: Sequencer module disabled (all modules are pre-installed)
- **Solution**: Contact server administrator - module may need re-enabling

### Error: "warpgate is not defined"
- **Cause**: Warp Gate module disabled (module is pre-installed)
- **Solution**: Contact server administrator - module may need re-enabling

### Error: "Effect file not found"
- **Cause**: Incorrect file path or effect doesn't exist
- **Solutions**:
  1. Use **Sequencer Database Viewer** to browse available effects
  2. Check file path syntax for chosen effect library
  3. Try alternative effect from different library

### Error: "Cannot read property 'crosshairs'"
- **Cause**: Warp Gate temporarily disabled or script error
- **Solution**: Contact server administrator or use alternative targeting method

## Module Resource Information

### Server Resource Usage
- **Sequencer**: ~2MB (lightweight core system)
- **JB2A Free**: ~1.5GB (2000+ effect files)
- **JB2A Patreon**: ~8GB+ (5000+ extended effects)
- **Warp Gate**: ~1MB (utility functions)
- **Animated Spell Effects**: ~500MB (additional effects)
- **Animated Spell Effects Cartoon**: ~300MB (cartoon-style effects)

### Performance Optimization
All modules are:
- ✅ **Pre-configured** for optimal server performance
- ✅ **Load-balanced** to prevent lag during gameplay
- ✅ **Cache-optimized** for faster effect loading
- ✅ **Memory-managed** to handle multiple simultaneous effects

## Compatibility Matrix

| FoundryVTT Version | Sequencer | JB2A | Warp Gate | Status |
|-------------------|-----------|------|-----------|--------|
| v12+ | ✅ Latest | ✅ Latest | ✅ Latest | ✅ Fully Supported |
| v11 | ✅ Compatible | ✅ Compatible | ✅ Compatible | ✅ Supported |
| v10 | 🔹 Older version | ✅ Compatible | ✅ Compatible | 🔹 Limited Support |
| v9 and below | ❌ Not supported | ❌ Not supported | ❌ Not supported | ❌ Incompatible |

## Alternative Solutions

### Effect Library Flexibility
With multiple libraries available, you can:
- **Mix and Match**: Combine JB2A and Animated Spell Effects in same spell
- **Style Variation**: Choose realistic (JB2A) vs cartoon (Animated Cartoon) effects
- **Quality Options**: Use Patreon effects for premium visuals or Free for compatibility

### Targeting Alternatives
- **Primary**: `warpgate.crosshairs.show()` (recommended, pre-installed)
- **Alternative**: `Sequencer.Crosshair.show()` (fallback option)
- **Manual**: Direct coordinate specification for automated spells

### Development Testing
For spell development:
1. **Start Simple**: Use JB2A Free effects first
2. **Add Complexity**: Incorporate Warp Gate targeting
3. **Enhance Visuals**: Upgrade to Patreon or Animated Effects
4. **Optimize**: Choose best-performing effect combinations

---

*Server Configuration: All modules pre-installed and optimized*  
*Last updated: September 2025*  
*Effect libraries: 7000+ combined effects available*

## Potential Enhancement Modules (Not Yet Installed)

*These modules are available for future installation to enhance animation capabilities:*

> ⚠️ **Contact Server Admin** - These modules are not currently installed. Contact your server administrator if you need any of these features for your animation projects.

### Free Modules for Animation Enhancement

#### **Token Attacher** (FREE)
- **Purpose**: Attach effects, tiles, and elements to tokens that move and rotate with them
- **Sequencer Benefits**: Create persistent spell effects that follow tokens, attach multiple animation elements for complex spells
- **Best For**: Persistent spell effects, token-attached auras, multi-part animations
- **Compatibility**: Works perfectly with Sequencer for token-attached effects

#### **Tagger** (FREE)  
- **Purpose**: Tag scene objects and retrieve them programmatically
- **Sequencer Benefits**: Target multiple objects by tags instead of manual selection, organize spell targets
- **Best For**: Area effect spells, multi-target animations, scene organization
- **Integration**: `Tagger.getByTag("fire-altar")` for Sequencer targeting

#### **Monk's Active Tile Triggers** (FREE)
- **Purpose**: Create interactive tiles that trigger actions when tokens enter/exit
- **Sequencer Benefits**: Trigger spell animations on movement, create animated traps and environmental effects
- **Best For**: Environmental magic, trap animations, location-based spell triggers
- **Features**: Execute macros, play sounds, trigger Sequencer effects on tile interaction

#### **Advanced Macros** (FREE)
- **Purpose**: Enhanced macro execution with user permissions and arguments
- **Sequencer Benefits**: Better macro organization, user-specific spell animations, parameterized effects
- **Best For**: Complex spell systems, user permission management, macro optimization
- **Features**: Run macros as different users, pass arguments to spell macros

#### **Token Animator** (FREE)
- **Purpose**: Animate token movement and transformations
- **Sequencer Benefits**: Coordinate token animations with Sequencer effects for complete spell sequences
- **Best For**: Teleportation spells, transformation effects, dramatic token movements
- **Integration**: Combine with Sequencer for synchronized token + effect animations

#### **Parallax Tiles** (FREE)
- **Purpose**: Create depth and parallax effects for tiles
- **Sequencer Benefits**: Enhanced environmental atmosphere for spell backgrounds
- **Best For**: Atmospheric effects, environmental spell enhancement, scene depth
- **Visual Impact**: Adds cinematic depth to magical environments

### Paid Modules Worth Considering

#### **Levels** by TheRipper93 (FREE/PAID Features)
- **Purpose**: Multi-level 3D scene management
- **Sequencer Benefits**: Vertical spell effects, 3D positioning for complex animations
- **Best For**: Multi-level dungeons, flying spells, vertical combat
- **3D Integration**: Enhance Sequencer with height-based targeting and effects

#### **FXMaster** by Gambit (FREE + Paid Add-ons)
- **Purpose**: Weather effects, particles, and scene filters
- **Sequencer Benefits**: Combine weather with spell effects, atmospheric enhancement
- **Best For**: Environmental magic, weather spells, scene atmosphere
- **Paid Features**: FXMaster+ adds more particle effects (Fireflies, Sakura effects)

#### **Times Up** (FREE)
- **Purpose**: Automatic expiration of active effects based on time/rounds
- **Sequencer Benefits**: Auto-cleanup for timed spell effects, combat duration management
- **Best For**: Buff/debuff spells, timed magical effects, combat automation
- **RPG Integration**: Perfect for spell duration tracking in custom RPG system

### Animation Library Expansions

#### **Battle Transitions** (FREE)
- **Purpose**: Animated scene transitions and combat start effects
- **Sequencer Benefits**: Dramatic scene changes, combat initiation animations
- **Best For**: Scene transitions, dramatic moments, combat start sequences

#### **PSFX - Peri's Sound Effects for JB2A** (FREE)
- **Purpose**: Curated sound effects specifically for JB2A animations  
- **Sequencer Benefits**: Professional audio pairing with visual effects
- **Best For**: Complete audio-visual spell experiences
- **Quality**: High-quality sounds designed for animation synchronization

### Installation Priority

1. **High Priority** (Free, High Impact): Token Attacher, Tagger, Monk's Active Tiles
2. **Medium Priority** (Enhanced Features): Advanced Macros, FXMaster, Times Up  
3. **Visual Enhancement**: Parallax Tiles, Token Animator, Battle Transitions
4. **Audio Enhancement**: PSFX Sound Effects
5. **Advanced Features**: Levels (if 3D effects needed)

### Performance Considerations
- Install gradually to test server performance impact
- Token Attacher and Tagger have minimal performance overhead
- FXMaster particle effects may impact performance on lower-end clients
- Levels significantly changes rendering and may affect performance