# FoundryVTT Module Requirements

## Core System
- **Simple World Building System** - [Documentation](https://github.com/foundryvtt/worldbuilding)
  - Base system for world creation and management
  - Provides flexible framework for custom content
  - Perfect for custom macro development and testing

## Essential Animation Framework
- **The Sequencer** - [Documentation](https://github.com/fantasycalendar/FoundryVTT-Sequencer)
  - Core animation framework for all effects
  - Powerful API for creating complex animation sequences
  - Timeline-based effect management
  - Effect preloading and caching
  - Sound synchronization capabilities

## Visual Effect Libraries

### Primary Asset Collections
- **JB2A - Jules&Ben's Animated Assets**
  - [Free Version](https://github.com/Jules-Bens-Aa/JB2A_DnD5e)
  - [Premium Version](https://www.patreon.com/JB2A)
  - Extensive library of high-quality animations
  - Perfect for spell effects, weapon attacks, and environmental effects
  - Premium version includes additional variants and higher quality assets

### Additional Effect Collections
- **Jack Kerouac's Animated Spell Effects**
  - [Base Collection](https://github.com/jackkerouac/animated-spell-effects)
  - [Cartoon Collection](https://github.com/jackkerouac/animated-spell-effects-cartoon)
  - Alternative style for spell animations
  - Great for unique visual variations

- **Jinker's Animated Art Pack** - [Documentation](https://github.com/jinkergm/JAA)
  - Complementary animated assets
  - Additional visual styles and effects

### Visual Enhancement Tools
- **Token Magic FX** - [Documentation](https://github.com/Feu-Secret/Tokenmagic)
  - Token-specific visual effects and filters
  - Perfect for status effects and persistent animations
  - Can enhance existing animations with filters

- **Gambit FXMaster** - [Documentation](https://github.com/gambit07/fxmaster)
  - Weather effects and environmental animations
  - Scene-wide particle systems
  - Atmospheric effects for enhanced immersion

- **Parallax Tiles** - [Documentation](https://github.com/EndlesNights/parallax-tiles)
  - Depth effects for scenes
  - Moving backgrounds and environmental elements
  - Enhanced visual depth for animations

## Animation Automation & Control

### Animation Automation
- **Automated Animations** - [Documentation](https://github.com/theripper93/autoanimations)
  - Automatic triggering of animations based on actions
  - Integration with combat and item usage
  - Streamlined workflow for common effects

### Token Control & Enhancement
- **Token Attacher** - [Documentation](https://github.com/KayelGee/token-attacher)
  - Attach effects and elements to tokens
  - Create complex moving animations
  - Perfect for persistent effects that follow tokens

- **Token Mold** - [Documentation](https://github.com/Moerill/token-mold)
  - Token customization and automation
  - Can be used to enhance token-based animations
  - Useful for mass token modifications

## Combat & Interface Enhancement
- **Combat Tracker Dock** - [Documentation](https://github.com/theripper93/combat-tracker-dock)
  - Enhanced combat interface
  - Better visualization of turn order
  - Can be used to trigger combat-based animations

## Audio Enhancement
- **SoundFx Library** - [Documentation](https://github.com/MaterialFoundry/SoundFxLibrary)
  - Extensive collection of sound effects
  - Perfect for enhancing animations with audio
  - Can be synchronized with Sequencer animations

## Technical Utilities

### Core Utilities
- **Advanced Macros** - [Documentation](https://github.com/mclemente/fvtt-advanced-macros)
  - Enhanced macro capabilities
  - Better argument handling
  - Improved macro organization

- **libWrapper** - [Documentation](https://github.com/ruipin/fvtt-lib-wrapper)
  - Safe module patching
  - Essential for complex module interactions
  - Helps prevent conflicts between modules

- **socketlib** - [Documentation](https://github.com/farling42/foundryvtt-socketlib)
  - Simplified socket handling
  - Perfect for multi-user animations
  - Synchronization of effects across clients

### World Building Enhancement
- **Simple WorldBuilding Plus** - [Documentation](https://gitlab.com/asacolips-projects/foundry-mods/simple-worldbuilding-plus)
  - Enhanced world building features
  - Additional customization options
  - Extended system capabilities

### Special Mention
- **Portal** - [Documentation](https://wiki.theripper93.com/free/portal-lib)
  - Advanced token spawning and manipulation
  - Location picking with templates
  - Token transformation and teleportation
  - Built-in dialog system for complex interactions
  - Note: Free module by TheRipper93

## Module Usage Matrix for Macro Creation

| Module Category | Animation Creation | Effect Enhancement | Technical Support | Audio Support |
|----------------|-------------------|-------------------|-------------------|---------------|
| Core Animation | Sequencer         | FXMaster          | libWrapper        | SoundFx Library |
| Visual Assets  | JB2A, Animated Spell Effects | Token Magic FX | Advanced Macros | - |
| Automation     | Automated Animations | Token Attacher  | Portal          | - |
| Enhancement    | Parallax Tiles    | Token Mold        | socketlib        | - |

## Best Practices for Macro Creation

### Visual Effects
1. Start with Sequencer as your base animation framework
2. Use JB2A assets as primary effect source
3. Enhance with Token Magic FX for persistent effects
4. Add environmental effects using FXMaster
5. Implement parallax for depth when appropriate

### Audio Integration
1. Use SoundFx Library for effect audio
2. Synchronize with Sequencer's timeline
3. Layer multiple sounds for complex effects

### Automation
1. Implement Automated Animations for common effects
2. Use Token Attacher for moving effects
3. Enhance with Token Mold for mass applications
4. Utilize Warpgate for advanced token manipulation

### Technical Implementation
1. Use Advanced Macros for complex logic
2. Implement socketlib for multi-user synchronization
3. Use libWrapper for safe module integration
4. Leverage Simple WorldBuilding Plus features

## Performance Considerations

### High Impact Modules
- FXMaster with multiple particle effects
- Token Magic FX with multiple filters
- Automated Animations with many triggers

### Low Impact Modules
- libWrapper
- Advanced Macros
- socketlib
- Token Mold

### Medium Impact Modules
- Sequencer (depends on effect complexity)
- JB2A (depends on asset size)
- Token Attacher
- Parallax Tiles

---

*Last Updated: September 27, 2025*
*Note: All modules listed are tested and compatible with the current FoundryVTT version*

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

| Category | File Count | Sequencer | JB2A | Portal | Animated Effects |
|----------|------------|-----------|------|---------|------------------|
| **Basic** | 7 macros | ✅ Always | ✅ Always | ❌ Not used | Available |
| **Intermediate** | 6 macros | ✅ Always | ✅ Always | ❌ Not used | Available (used in 1 macro) |
| **Advanced** | 5 macros | ✅ Always | ✅ Always | ✅ Optional | Available |
| **Spells** | 3 macros | ✅ Always | ✅ Always | ✅ Optional | Available |
| **Characters/Ora** | 1 macro | ✅ Always | ✅ Always | ✅ Always | Available |
| **Examples/Ora** | 5 macros | ✅ Always | ✅ Always | ✅ Always | Available |
| **Examples/Moctei** | 5 macros | ✅ Always | ✅ Always | ✅ Always | Available |
| **Templates** | 2 templates | ✅ Always | ✅ Always | ✅ Optional | Available |
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
└── Advanced/Character Macros
    └── Portal (CORE - targeting and spawning)
        ├── Creature spawning and transformation
        ├── Location picking with templates
        └── Token teleportation
```

## Troubleshooting Module Issues

### Error: "Sequencer is not defined"
- **Cause**: Sequencer module disabled (all modules are pre-installed)
- **Solution**: Contact server administrator - module may need re-enabling

### Error: "Portal is not defined"
- **Cause**: Portal module disabled (module is pre-installed)
- **Solution**: Contact server administrator - module may need re-enabling

### Error: "Effect file not found"
- **Cause**: Incorrect file path or effect doesn't exist
- **Solutions**:
  1. Use **Sequencer Database Viewer** to browse available effects
  2. Check file path syntax for chosen effect library
  3. Try alternative effect from different library

### Error: "Cannot read property 'pick' or 'spawn'"
- **Cause**: Portal temporarily disabled or script error
- **Solution**: Contact server administrator or use alternative targeting method
- **Alternative**: Use `new Portal().pick()` or `Portal.spawn()` syntax

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
