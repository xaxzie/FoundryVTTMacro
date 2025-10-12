# Development Guide

This comprehensive guide covers installation, setup, contribution guidelines, and best practices for developing FoundryVTT spell animation macros for our custom RPG system.

## 🎯 Quick Start

**Essential Reading:**

1. [GAME-RULES.md](./GAME-RULES.md) - **Required** understanding of RPG mechanics
2. [MODULE-REQUIREMENTS.md](./MODULE-REQUIREMENTS.md) - Module dependencies and compatibility

**Key Files:**

- Reference implementation: `/macros/characters/ora/bubbles.js`
- Utility functions: `/macros/utilities/README.md`
- Working examples: `/macros/examples/README.md`

## 📦 Installation & Setup

### Prerequisites

- **FoundryVTT version 10+** (version 11+ recommended)
- **GM or Assistant GM privileges** to install modules
- **Understanding of custom RPG mechanics** (see GAME-RULES.md)

### Essential Modules

**Core Requirements:**

```
✅ Sequencer (core animation system)
✅ JB2A - Jules&Ben's Animated Assets (visual effects)
✅ Portal (spell targeting and token spawning)
✅ Carousel Combat Track (turn order management)
```

**Installation Methods:**

1. **Module Browser (Recommended)**

   - Go to **Settings** → **Manage Modules** → **Install Module**
   - Search for each module by name

2. **Direct Links**
   - Sequencer: `https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json`
   - JB2A Free: `https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases/latest/download/module.json`
   - Portal: Search "Portal" in module browser

### Configuration

**Portal Settings:**

- Go to **Settings** → **Module Settings** → **Portal**
- Enable crosshair permissions for players
- Configure targeting templates

**JB2A Settings:**

- Enable database integration for effect indexing
- Configure file path optimization

### Verification

Test basic functionality with this macro:

```javascript
// Test Portal crosshair targeting
async function testSpellTargeting() {
  if (typeof portal === "undefined") {
    ui.notifications.error("Portal module required for targeting.");
    return;
  }

  const crosshairs = await portal.crosshairs.show({
    size: 1,
    icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
    label: "Test Target",
  });

  if (crosshairs.cancelled) return;
  ui.notifications.info("Portal targeting working correctly!");
}

testSpellTargeting();
```

## 🎲 RPG Development Guidelines

### Understanding the RPG Context

**Required Knowledge:**

- **7-stat system**: Physique, Dextérité, Agilité, Esprit, Sens, Volonté, Charisme
- **Combat stances**: Offensive, Defensive, Focus modes with different effects
- **D7-based dice mechanics** for attack and defense rolls
- **Mana-based spell casting** with stance-dependent costs

### GameMaster Authority

> **CRITICAL**: All rules are subject to GameMaster interpretation.

**When to Consult GameMaster:**

- Rule interpretation questions
- New spell concepts
- Visual design decisions
- Balance concerns
- Automation scope decisions

**How to Consult:**

1. Create GitHub issue with `[GameMaster Review]` label
2. Provide clear context and questions
3. Wait for approval before implementing

## 📝 Code Standards & Best Practices

### File Naming Convention

```
frost-bolt.js           // Spell type prefix
ora-blizzard.js        // Character-specific spells
combat-combo.js        // Generic action type
healing-spring.js      // Use kebab-case
```

### Chat Messages with Dice Rolling

**For macros that need both animated dice and custom formatting, use the pattern from `/macros/utilities/messageWithDiceFormatting.js`:**

```javascript
// RECOMMENDED: Single message with native dice + custom formatting
const roll = new Roll("4d7+2");

const enhancedFlavor = `
    <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3;">
        <h3 style="margin: 0; color: #1976d2;">🎯 Test de Dextérité</h3>
        <div><strong>Personnage:</strong> ${actor.name}</div>
        <div style="color: #d32f2f;">⚠️ Ajusté pour blessures: Base 5 - 2 = 3</div>
    </div>
`;

await roll.toMessage({
  speaker: ChatMessage.getSpeaker({ token: caster }),
  flavor: enhancedFlavor,
  rollMode: game.settings.get("core", "rollMode"),
});
```

**Key Benefits:**

- ✅ Single unified message
- ✅ Native FoundryVTT dice animation
- ✅ Rich HTML formatting in flavor
- ✅ Hover effects and click-to-expand dice

**See `/macros/utilities/messageWithDiceFormatting.js` for complete examples and documentation.**

### Spell Macro Structure Template

```javascript
/**
 * [SPELL NAME] - Custom RPG Spell Animation
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Description: [Visual effect description and RPG context]
 * Associated Stat: [Which of 7 stats - Physique/Dextérité/Agilité/Esprit/Sens/Volonté/Charisme]
 * Stance Compatibility: [How stances affect this spell]
 * Target Type: [Single/Multiple/Area/Self]
 * Character: [Generic/Ora/Moctei/etc.]
 * Mana Cost: [Base cost and stance modifications]
 * Damage: [Formula with stance effects]
 *
 * Requirements:
 * - Sequencer module
 * - JB2A effects
 * - Portal module (for targeting)
 * - Carousel Combat Track (optional)
 *
 * RPG Integration:
 * - Full stance detection and mana cost calculation
 * - Character stat integration with injury adjustments
 * - Damage calculation and chat output
 * - Portal crosshair targeting system
 *
 * @author [Your Name]
 * @version 1.0
 * @gamemaster_approved [Date if required]
 */

(async () => {
  // 1. VALIDATION - Use utility functions
  const validation = validateSpellCasterWithAttributes();
  if (!validation) return;
  const { caster, actor } = validation;

  // 2. STANCE & STATS - Use utility functions
  const stanceInfo = getStanceInfo(actor);
  const stats = getCharacterStats(actor);

  // 3. TARGETING - Use Portal
  const target = await portal.crosshairs.show({
    size: 1,
    icon: "path/to/targeting/icon.webm",
    label: "Spell Target",
  });

  if (target.cancelled) return;

  // 4. ANIMATION SEQUENCE
  new Sequence()
    .effect()
    .file("path/to/effect.webm")
    .atLocation(caster)
    .stretchTo(target)
    .play();

  // 5. CHAT OUTPUT
  ChatMessage.create({
    content: `Spell cast with ${stanceInfo.name} stance.`,
    speaker: ChatMessage.getSpeaker({ actor: actor }),
  });
})();
```

### Required Utility Integration

**Always use these utility functions:**

- `validateSpellCasterWithAttributes()` - Actor validation
- `getStanceInfo(actor)` - Stance detection
- `getCharacterStats(actor)` - Stat retrieval with injury adjustments
- `calculateStanceManaCost()` - Mana cost calculation

### Code Quality Standards

**✅ Good Practices:**

```javascript
// Proper error handling
if (typeof portal === "undefined") {
  ui.notifications.error("Portal module required.");
  return;
}

// ✅ CRITICAL: Proper Sequencer animation (no .duration())
new Sequence()
  .effect()
  .file("jb2a.liquid.splash02.red")
  .attachTo(token)
  .scale(0.8)
  // ✅ No .duration() - prevents animation duplicates
  .play();

// Reusable helper functions
async function getSpellTarget() {
  const crosshairs = await portal.crosshairs.show({
    size: 1,
    icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
  });
  return crosshairs;
}

// Clear RPG context
const spellConfig = {
  name: "Frost Bolt",
  manaCost: 2,
  associatedStat: "Esprit",
  targetType: "single",
};
```

**❌ Bad Practices:**

```javascript
// ❌ CRITICAL ERROR: Using .duration() causes animation duplicates
new Sequence()
  .effect()
  .file("animation.webm")
  .duration(2000) // ❌ BAD: Causes multiple plays if file < 2000ms
  .play();

// Hard-coded values
const damage = 8; // Should calculate based on stats + stance

// No validation
actor.getFlag("world", "currentStance"); // Should use utility function

// Missing error handling
const target = await portal.crosshairs.show({}); // No fallback
```

## 🎨 Animation Guidelines

### Visual Standards

**Spell Effect Timing:**

- Cast time: 0.5-1s buildup
- Travel time: 1-2s for projectiles
- Impact duration: 0.5-1s
- Total spell: 2-4s maximum

**Color Conventions:**

- Fire spells: Red/Orange/Yellow
- Ice spells: Blue/Cyan/White
- Shadow spells: Purple/Black/Dark
- Healing spells: Green/Golden/White

### ⚠️ CRITICAL: Sequencer Duration Issues

**🚨 NEVER USE `.duration()` WITH SEQUENCER ANIMATIONS**

The `.duration()` property forces Sequencer to play animations multiple times when the configured duration is longer than the actual animation file duration. This causes:

- Duplicate animations playing simultaneously
- Visual glitches and performance issues
- Confusing user experience

**❌ INCORRECT - Causes Animation Duplicates:**

```javascript
new Sequence()
  .effect()
  .file("jb2a.liquid.splash02.red")
  .attachTo(token)
  .scale(0.8)
  .duration(2000) // ❌ BAD: Forces multiple plays if file is shorter
  .play();
```

**✅ CORRECT - Natural Duration:**

```javascript
new Sequence()
  .effect()
  .file("jb2a.liquid.splash02.red")
  .attachTo(token)
  .scale(0.8)
  // ✅ GOOD: Let animation play its natural duration
  .play();
```

**Exception for Persistent Animations:**

```javascript
// ✅ Only acceptable use: persistent animations with fadeOut
new Sequence()
  .effect()
  .file("persistent-effect.webm")
  .attachTo(token)
  .persist()
  .fadeOut(500) // Duration can be used with fadeOut for persistent effects
  .play();
```

### Performance Optimization

```javascript
// ✅ Good: Efficient animation with proper timing
new Sequence()
  .effect()
  .file("spell-projectile.webm")
  .atLocation(caster)
  .stretchTo(target)
  .scale(0.8) // Reasonable scale
  // ✅ No .duration() - let natural timing work
  .effect()
  .file("spell-impact.webm")
  .atLocation(target)
  .delay(1000) // Synced with projectile natural duration
  .play();

// ❌ Bad: Performance issues and animation problems
new Sequence()
  .effect()
  .file("huge-effect.webm")
  .scale(5.0) // Too large
  .duration(10000) // ❌ NEVER USE - causes duplicates
  .fadeIn(5000) // Excessive fade
  .play();
```

**Key Rules:**

1. **NEVER use `.duration()`** unless for persistent effects with fadeOut
2. **Always test animations** to verify single playback
3. **Use natural animation timing** for proper synchronization
4. **Check console logs** for animation completion messages

## 🧪 Testing & Quality Assurance

### Testing Checklist

**Before Submitting:**

- [ ] Spell works with all three stances (Offensive/Defensive/Focus)
- [ ] Proper mana cost calculation
- [ ] Error handling for missing modules
- [ ] Visual effects sync properly
- [ ] No console errors
- [ ] Chat output is clear and informative

**RPG Integration Tests:**

- [ ] Stance detection works correctly
- [ ] Stat-based calculations are accurate
- [ ] Injury system integration (if applicable)
- [ ] Turn order respect (if using Carousel Combat Track)

### Troubleshooting Common Issues

**🚨 Animation Playing Multiple Times:**

**Cause:** Using `.duration()` with Sequencer when duration > actual file duration
**Solution:** Remove `.duration()` and let animations play naturally
**Debug:** Check browser console for animation completion logs

```javascript
// ❌ Problem code
.duration(2000) // Remove this line

// ✅ Fixed code
// No duration property - natural timing
```

**Portal targeting not working:**

- Ensure Portal module is installed and enabled
- Check player permissions for targeting
- Verify module compatibility

**Animation effects not loading:**

- Check JB2A module installation
- Verify file paths are correct
- Test with Sequencer Database Viewer

**Animation synchronization issues:**

- Use `.delay()` instead of `.duration()` for timing
- Test actual animation file durations
- Check console logs for timing information

**RPG integration errors:**

- Ensure utility functions are available
- Check character sheet compatibility
- Verify stance detection setup

**Animation Performance Issues:**

- Remove unnecessary `.duration()` calls
- Use appropriate `.scale()` values (0.5-1.5 range)
- Limit simultaneous animations (max 3-4 effects)
- Test on lower-end hardware

## 🚀 Local Development Setup

### Development Environment

**Recommended Setup:**

1. **Local FoundryVTT installation** for testing
2. **VS Code** with extensions:
   - JavaScript (ES6) support
   - FoundryVTT syntax highlighting
3. **Git workflow** for version control

### FXMaster Integration

**FXMaster API Documentation:**

FXMaster provides two main types of effects:

1. **Particle Effects** (weather, ambient effects)
2. **Filter Effects** (visual filters, overlays)

**Particle Effects API:**

```javascript
// Enable particle effects using hooks
Hooks.call("fxmaster.updateParticleEffects", [
  {
    type: "rain",
    options: {
      scale: 1,
      direction: 75,
      speed: 1,
      lifetime: 1,
      density: 0.5,
      alpha: 1,
      tint: { apply: false, value: "#ffffff" },
    },
  },
]);
```

**Filter Effects API:**

```javascript
// Apply visual filters
FXMASTER.filters.setFilters([
  {
    type: "fog",
    options: {
      dimensions: 1,
      speed: 1,
      density: 0.2,
      color: { apply: false, value: "#000000" },
    },
  },
]);
```

**Available Particle Effects:**

- `rain`, `snow`, `fog`, `clouds`, `embers`, `bubbles`, `stars`
- `crows`, `bats`, `spiders`, `birds`, `eagles`, `rats`
- `leaves`, `snowstorm`, `rainsimple`, `raintop`

**Available Filter Effects:**

- `lightning`, `underwater`, `predator`, `color`, `bloom`, `oldfilm`

**Common Options:**

- `scale`: Size multiplier (number)
- `direction`: Direction in degrees (number)
- `speed`: Speed multiplier (number)
- `lifetime`: Particle lifetime multiplier (number)
- `density`: Particle density (number)
- `alpha`: Opacity 0-1 (number)
- `tint`: Color tint `{apply: boolean, value: "#hexcolor"}`

**Toggle Pattern:**

```javascript
// Check current state via scene flags
const currentEffects = canvas.scene.getFlag("fxmaster", "effects") || {};
const hasEffects = Object.keys(currentEffects).length > 0;

// Apply effects
await Hooks.call("fxmaster.updateParticleEffects", [particleConfig]);
await FXMASTER.filters.setFilters([filterConfig]);

// Clear effects (validated methods for FXMaster v6.0+ FoundryVTT v13)
await canvas.scene.unsetFlag("fxmaster", "effects"); // ✅ Clears particles
await FXMASTER.filters.setFilters([]); // ✅ Clears filters
```

**Validated Methods for FXMaster v6.0+ (FoundryVTT v13):**

✅ **Particle Effects:**

- **Apply:** `Hooks.call('fxmaster.updateParticleEffects', [config])`
- **Clear:** `canvas.scene.unsetFlag("fxmaster", "effects")`

✅ **Filter Effects:**

- **Apply:** `FXMASTER.filters.setFilters([config])`
- **Clear:** `FXMASTER.filters.setFilters([])` (empty array)

❌ **Methods that DON'T work reliably:**

- `Hooks.call('fxmaster.updateParticleEffects', [])` for clearing particles
- Multiple fallback methods - stick to the validated ones above

**State Detection:**

- FXMaster stores effects in `canvas.scene.getFlag("fxmaster", "effects")`
- Check `Object.keys(effects).length > 0` for active effects

### Development Workflow

1. **Create feature branch**: `git checkout -b feature/new-spell`
2. **Develop locally** using test world
3. **Test thoroughly** with all stances and scenarios
4. **Create pull request** with clear description
5. **Request GameMaster review** if needed

### File Organization

```
/macros/
  ├── characters/           # Character-specific spells
  │   ├── ora/             # Ora's spells
  │   └── moctei/          # Moctei's spells
  ├── examples/            # Learning examples
  │   ├── basic/           # Simple animations
  │   ├── intermediate/    # Multi-step spells
  │   └── advanced/        # Complex mechanics
  ├── utilities/           # Reusable functions
  └── templates/           # Starting templates
```

## 📚 Resources & References

**External Documentation:**

- [Official Sequencer Wiki](https://fantasycomputer.works/FoundryVTT-Sequencer)
- [Portal Documentation](https://wiki.theripper93.com/free/portal-lib)
- [Carousel Combat Track](https://wiki.theripper93.com/free/combat-tracker-dock)
- [FXMaster Official Repository](https://github.com/gambit07/fxmaster) - Weather and visual effects

**Internal References:**

- [Module Requirements](./MODULE-REQUIREMENTS.md) - Complete module information
- [Game Rules](./GAME-RULES.md) - RPG mechanics and rules
- [Assets Inventory](./assets/README.md) - Available effects and sounds

**Learning Path:**

1. Start with `/macros/examples/basic/` for fundamentals
2. Study `/macros/characters/ora/bubbles.js` for full RPG integration
3. Use `/macros/utilities/` functions for consistency
4. Reference `/templates/` for starting new spells

---

> **Remember**: This is a custom RPG system. Always consider the specific game context and consult the GameMaster when in doubt about rules or implementations.
