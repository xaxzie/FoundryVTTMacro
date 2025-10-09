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
  - **Polymorph filter**: Transform token images with 9 different animation styles
  - Perfect for status effects and persistent animations
  - Can enhance existing animations with filters
  - **Key Features for Character Macros**:
    - Token transformation with animated transitions
    - Toggle transformations (original ↔ transformed)
    - Multiple animation types: Simple, Dreamy, Twist, Water drop, TV Noise, Morphing, Disguise, Wind, Hologram
    - Customizable timing and effects
    - Multiple token support with unique filter IDs

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

### Scene Management & Organization

- **Tagger** - [Documentation](https://github.com/fantasycalendar/foundry-tagger)
  - Tag-based object management for scenes
  - Retrieve objects programmatically by tags
  - Essential for macro automation and multi-target effects
  - Perfect for spell targeting and scene organization

### World Building Enhancement

- **Simple WorldBuilding Plus** - [Documentation](https://gitlab.com/asacolips-projects/foundry-mods/simple-worldbuilding-plus)
  - Enhanced world building features
  - Additional customization options
  - Extended system capabilities

### Special Mention

- **Portal** - [Documentation](https://github.com/theripper93/portal-lib)
  - Advanced token spawning and manipulation
  - Location picking with templates
  - Token transformation and teleportation
  - Built-in dialog system for complex interactions
  - Note: Free module by TheRipper93

## Tagger Module for Enhanced Macro Development

### What is Tagger?

Tagger is a powerful module that allows you to assign custom tags to any scene object (tokens, tiles, walls, lights, sounds, etc.) and retrieve them programmatically. This revolutionizes macro development by enabling smart, automated targeting and organization.

### How Tagger Enhances RPG Macros

#### 1. **Smart Spell Targeting**

Instead of manual token selection, use tags to target specific groups:

```javascript
// Tag setup: GM tags altar tokens with "fire-altar", "water-shrine", etc.
const fireAltars = Tagger.getByTag("fire-altar");
const waterShrines = Tagger.getByTag("water-shrine");

// Tourbillon spell enhanced with altar detection
if (waterShrines.length > 0) {
  // Boost effect near water shrines
  new Sequence()
    .effect("jb2a_patreon.whirlwind.blue")
    .atLocation(targetLocation)
    .scale(2.0) // Enhanced power near water shrine
    .fadeOut(3000);
}
```

#### 2. **Environmental Magic Systems**

Create reactive spell systems based on scene elements:

```javascript
// Environmental fire enhancement
const nearbyFire = Tagger.getByTag("fire-source", {
  withinDistance: 30,
  from: targetToken,
});

if (nearbyFire.length > 0) {
  // Fire spells get enhanced effects near fire sources
  effectScale *= 1.5;
  damageBonus += 10;
}
```

#### 3. **Multi-Target Area Spells**

Efficiently target multiple objects for area effects:

```javascript
// Mass healing at all healing circles
const healingCircles = Tagger.getByTag("healing-circle");
healingCircles.forEach((circle) => {
  new Sequence()
    .effect("jb2a.cure_wounds.400px.blue")
    .atLocation(circle)
    .play();
});
```

#### 4. **Dynamic Scene Interaction**

Create spells that interact with tagged scene elements:

```javascript
// Lightning chain between conductive objects
const conductors = Tagger.getByTag("metal", "conductor");
if (conductors.length >= 2) {
  // Chain lightning between all metal objects
  for (let i = 0; i < conductors.length - 1; i++) {
    new Sequence()
      .effect("jb2a.chain_lightning.primary.blue")
      .stretchTo(conductors[i], conductors[i + 1])
      .play();
  }
}
```

#### 5. **Combat Automation**

Tag enemies, allies, and neutrals for intelligent spell behavior:

```javascript
// Smart healing that only affects allies
const allies = Tagger.getByTag("ally", {
  withinDistance: 60,
  from: casterToken,
});

allies.forEach((ally) => {
  // Apply healing only to tagged allies
  healToken(ally, healAmount);
});
```

### Tagger API for Macro Development

#### Core Functions

```javascript
// Get objects by single tag
const fires = Tagger.getByTag("fire");

// Get objects by multiple tags (AND logic)
const magicFires = Tagger.getByTag(["fire", "magical"]);

// Get objects with distance filtering
const nearbyEnemies = Tagger.getByTag("enemy", {
  withinDistance: 30,
  from: playerToken,
});

// Check if object has specific tags
if (Tagger.hasTags(token, "boss")) {
  // Enhanced effect for boss encounters
}

// Add tags to objects (GM or macro)
Tagger.setTags(altarTile, ["water-shrine", "healing-source"]);

// Remove tags
Tagger.removeTags(token, ["burning"]);
```

#### Advanced Filtering

```javascript
// Complex scene queries
const magicalItems = Tagger.getByTag("magical-item", {
  matchAny: false, // Must have ALL tags
  caseInsensitive: true, // Ignore case
  allScenes: false, // Current scene only
  ignore: [excludeToken], // Exclude specific objects
});

// Scene-wide magical detection
const allMagicalObjects = Tagger.getByTag(["magical", "enchanted", "cursed"], {
  matchAny: true, // Has ANY of these tags
});
```

### RPG Implementation Examples

#### 1. **Elemental Affinity System**

```javascript
// Tag terrain for elemental bonuses
const waterTerrain = Tagger.getByTag("water-terrain");
const fireTerrain = Tagger.getByTag("fire-terrain");

// Ora's water spells get bonuses on water terrain
if (isNearTerrain(casterLocation, waterTerrain)) {
  spellPower *= 1.25;
  manaCost *= 0.8;
}
```

#### 2. **Interactive Spell Components**

```javascript
// Tag spell components in scenes
const crystals = Tagger.getByTag("mana-crystal");
const runes = Tagger.getByTag("power-rune");

// Spell requires nearby components
if (crystals.length > 0 && runes.length > 0) {
  // Enable powerful combination spell
  castEnhancedSpell();
} else {
  ui.notifications.warn("Requires mana crystal and power rune nearby!");
}
```

#### 3. **Dynamic Environmental Hazards**

```javascript
// Tag environmental hazards
const poisonAreas = Tagger.getByTag("poison-cloud");
const fireAreas = Tagger.getByTag("fire-hazard");

// Spells react to environmental conditions
if (isInHazardArea(targetLocation, fireAreas)) {
  // Fire spells explode in fire areas
  effectRadius *= 2;
  addExplosionEffect();
}
```

### Setup Workflow for RPG Sessions

#### 1. **GM Scene Preparation**

```javascript
// Tag important scene elements
Tagger.setTags(altarTile, ["altar", "holy", "healing-source"]);
Tagger.setTags(torchTile, ["fire-source", "light"]);
Tagger.setTags(waterTile, ["water-source", "cleansing"]);
Tagger.setTags(bossTile, ["boss", "powerful-enemy"]);
```

#### 2. **Player Character Tags**

```javascript
// Tag player tokens with roles/abilities
Tagger.setTags(oraToken, ["player", "water-mage", "healer"]);
Tagger.setTags(mocteiToken, ["player", "shadow-mage", "damage-dealer"]);
Tagger.setTags(alliedNpc, ["ally", "npc", "helper"]);
```

#### 3. **Dynamic Combat Tags**

```javascript
// Add temporary combat tags
Tagger.setTags(token, ["burning"]); // Status effects
Tagger.setTags(token, ["blessed"]); // Temporary buffs
Tagger.setTags(token, ["marked"]); // Targeting marks
```

### Integration with Existing Macros

#### Enhanced Tourbillon Spell

```javascript
// Original tourbillon with Tagger enhancement
const waterSources = Tagger.getByTag("water-source", {
  withinDistance: 50,
  from: targetLocation,
});

const baseScale = nearbyTokens.length > 0 ? 1.5 : 1.0;
const waterBonus = waterSources.length > 0 ? 1.3 : 1.0;
const finalScale = baseScale * waterBonus;

new Sequence()
  .effect("jb2a_patreon.whirlwind.blue")
  .atLocation(targetLocation)
  .scale(finalScale)
  .fadeOut(3000)
  .belowTokens();
```

#### Enhanced BubbleSpam with Targeting

```javascript
// Bubble spam that avoids allies
canvas.app.stage.addEventListener("click", (event) => {
  const clickedObjects = Tagger.getByTag("ally", {
    withinDistance: 20,
    from: clickLocation,
  });

  if (clickedObjects.length === 0) {
    // Safe to cast bubbles - no allies nearby
    castBubbleEffect(clickLocation);
  }
});
```

### Benefits for RPG Macro Development

1. **Reduced Manual Work**: No more manual token selection for multi-target spells
2. **Dynamic Scene Interaction**: Spells automatically adapt to scene elements
3. **Enhanced Immersion**: Environmental magic feels more realistic
4. **Combat Automation**: Smart targeting reduces GM workload
5. **Scalable Systems**: Easy to expand spell systems as campaign grows
6. **Error Prevention**: Automated checks prevent targeting mistakes

### Best Practices

1. **Consistent Tagging**: Use standardized tag names across scenes
2. **Documentation**: Keep a list of active tags and their meanings
3. **Performance**: Use distance filters to limit search scope
4. **Cleanup**: Remove temporary tags after effects end
5. **Player Communication**: Let players know what tags affect their abilities

This makes Tagger an essential tool for creating sophisticated, automated RPG magic systems that respond intelligently to the game environment.

## Module Usage Matrix for Macro Creation

| Module Category | Animation Creation           | Effect Enhancement | Technical Support | Audio Support   |
| --------------- | ---------------------------- | ------------------ | ----------------- | --------------- |
| Core Animation  | Sequencer                    | FXMaster           | libWrapper        | SoundFx Library |
| Visual Assets   | JB2A, Animated Spell Effects | Token Magic FX     | Advanced Macros   | -               |
| Automation      | Automated Animations         | Token Attacher     | Portal, Tagger    | -               |
| Enhancement     | Parallax Tiles               | Token Mold         | socketlib         | -               |

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
4. Utilize Portal for advanced token manipulation

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

_Last Updated: September 27, 2025_
_Note: All modules listed are tested and compatible with the current FoundryVTT version_

All required modules are **already installed and enabled** on the server:

### Core Animation System

- ✅ **Sequencer** - Essential animation framework (latest stable version)

### Visual Effects Libraries

- ✅ **JB2A - Jules&Ben's Animated Assets (Free)** - Comprehensive free effect library (~1.5GB, 2000+ effects)
- ✅ **JB2A - Jules&Ben's Animated Assets (Patreon)** - Extended premium effects (~8GB+, 5000+ effects)
- ✅ **Animated Spell Effects** - Additional spell effect animations
- ✅ **Animated Spell Effects - Cartoon** - Cartoon-style visual effects

### Targeting & Combat Systems

- ✅ **Portal** - Advanced crosshair targeting and token spawning for spell casting
- ✅ **Portal** - Primary targeting system for spell casting
- ✅ **Carousel Combat Track** - Turn order management for RPG system

## Available Effect Libraries

With all libraries pre-installed, macros can choose from multiple effect sources:

## Module Requirements by Macro Category

| Category            | File Count           | Sequencer | JB2A      | Portal              | Animated Effects            |
| ------------------- | -------------------- | --------- | --------- | ------------------- | --------------------------- |
| **Basic**           | 7 macros             | ✅ Always | ✅ Always | ❌ Not used         | Available                   |
| **Intermediate**    | 6 macros             | ✅ Always | ✅ Always | ❌ Not used         | Available (used in 1 macro) |
| **Advanced**        | 5 macros             | ✅ Always | ✅ Always | ✅ Optional         | Available                   |
| **Spells**          | 3 macros             | ✅ Always | ✅ Always | ✅ Optional         | Available                   |
| **Characters/Ora**  | 1 macro              | ✅ Always | ✅ Always | ✅ Always (Portal)  | Available                   |
| **Examples/Ora**    | 5 macros             | ✅ Always | ✅ Always | ✅ Always           | Available                   |
| **Examples/Moctei** | 5 macros             | ✅ Always | ✅ Always | ✅ Always           | Available                   |
| **Templates**       | 2 templates          | ✅ Always | ✅ Always | ✅ Optional         | Available                   |
| **Utilities**       | 9 utilities + README | ✅ Always | ✅ Always | ✅ Portal functions | Available                   |

**Total Macros**: 31+ files + examples + 8 new utility files
**Use Sequencer**: 100% (core animation system)
**Use JB2A**: 97% (primary effect library)
**Use Portal**: RPG-compliant character macros (advanced targeting and token manipulation)
**Use Portal**: Primary targeting system for spell casting
**Animated Effects**: Available as alternative/enhancement
**New Utilities**: 8 standalone utility files extracted from tested bubbles.js spell

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
- **Token Magic FX**: Polymorph filters and token transformations active

## Module Dependency Tree

```
All Macros
├── Sequencer (CORE - handles all animations)
├── JB2A (ASSETS - provides effect files)
│   ├── Free version: 1.5GB, 2000+ effects
│   └── Patreon version: 8GB+, 5000+ effects
├── Token Magic FX (EFFECTS - token filters and transformations)
│   ├── Polymorph filters with 9 animation types
│   └── Status effects and persistent visual filters
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
- **Portal**: ~1MB (utility functions)
- **Animated Spell Effects**: ~500MB (additional effects)
- **Animated Spell Effects Cartoon**: ~300MB (cartoon-style effects)

### Performance Optimization

All modules are:

- ✅ **Pre-configured** for optimal server performance
- ✅ **Load-balanced** to prevent lag during gameplay
- ✅ **Cache-optimized** for faster effect loading
- ✅ **Memory-managed** to handle multiple simultaneous effects

## Compatibility Matrix

| FoundryVTT Version | Sequencer        | JB2A             | Portal           | Status             |
| ------------------ | ---------------- | ---------------- | ---------------- | ------------------ |
| v12+               | ✅ Latest        | ✅ Latest        | ✅ Latest        | ✅ Fully Supported |
| v11                | ✅ Compatible    | ✅ Compatible    | ✅ Compatible    | ✅ Supported       |
| v10                | 🔹 Older version | ✅ Compatible    | ✅ Compatible    | 🔹 Limited Support |
| v9 and below       | ❌ Not supported | ❌ Not supported | ❌ Not supported | ❌ Incompatible    |

## Alternative Solutions

### Effect Library Flexibility

With multiple libraries available, you can:

- **Mix and Match**: Combine JB2A and Animated Spell Effects in same spell
- **Style Variation**: Choose realistic (JB2A) vs cartoon (Animated Cartoon) effects
- **Quality Options**: Use Patreon effects for premium visuals or Free for compatibility

### Targeting Alternatives

- **Primary**: `portal.crosshairs.show()` (recommended, pre-installed)
- **Alternative**: `Sequencer.Crosshair.show()` (fallback option)
- **Manual**: Direct coordinate specification for automated spells

### Development Testing

For spell development:

1. **Start Simple**: Use JB2A Free effects first
2. **Add Complexity**: Incorporate Portal targeting
3. **Enhance Visuals**: Upgrade to Patreon or Animated Effects
4. **Optimize**: Choose best-performing effect combinations

---

_Server Configuration: All modules pre-installed and optimized_
_Last updated: September 2025_
_Effect libraries: 7000+ combined effects available_

## Potential Enhancement Modules (Not Yet Installed)

_These modules are available for future installation to enhance animation capabilities:_

> ⚠️ **Contact Server Admin** - These modules are not currently installed. Contact your server administrator if you need any of these features for your animation projects.

### Free Modules for Animation Enhancement

#### **Token Attacher** (FREE)

- **Purpose**: Attach effects, tiles, and elements to tokens that move and rotate with them
- **Sequencer Benefits**: Create persistent spell effects that follow tokens, attach multiple animation elements for complex spells
- **Best For**: Persistent spell effects, token-attached auras, multi-part animations
- **Compatibility**: Works perfectly with Sequencer for token-attached effects

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
