# GitHub Copilot Instructions for FoundryVTT Macro Development

## Project Context

This is a FoundryVTT spell animation collection for a custom RPG system with:

- Turn-based combat using Carousel Combat Track
- Three combat stances: Offensif, Defensif, Focus
- Injury system with stacking penalties (-1 dice per injury stack)
- Seven-stat character system
- Status Icon Counters module for effect stacking

## Essential Development Utilities

### Combat Status Detection

When creating or modifying macros that need to detect combat status, use these pre-built utilities:

#### Quick Console Commands (for testing/debugging):

```javascript
// Get current stance
canvas.tokens.controlled[0]?.document?.actor?.effects?.contents?.find((e) =>
  ["focus", "offensif", "defensif"].includes(e.name?.toLowerCase())
)?.name || "No stance";

// Get injury stacks
canvas.tokens.controlled[0]?.document?.actor?.effects?.contents?.find((e) =>
  e.name?.toLowerCase().includes("blessures")
)?.flags?.statuscounter?.value || 0;
```

#### Utility Files:

- **`macros/utilities/oneLineStanceCheck.js`** - Ultra-simple one-line console commands
- **`macros/utilities/quickStanceCheck.js`** - Comprehensive stance/injury analysis
- **`macros/utilities/getStanceStatus.js`** - Full stance detection with multiple methods
- **`macros/utilities/getTokenStatus.js`** - Complete token status inspection

### RPG Integration Requirements

#### Status Effects Structure:

- **Stances**: Stored as Active Effects on actor with `name` property
  - `"Focus"` - Reduced mana costs, -1 Agilité dice
  - `"Offensif"` - Damage maximized, -2 dodge dice
  - `"Defensif"` - Reactive spell defense allowed
- **Injuries**: `"Blessures"` with stack count in `flags.statuscounter.value`

#### Stance-Dependent Spell Design:

```javascript
// Example: Scale spell effects based on stance
const caster = canvas.tokens.controlled[0];
const stance = caster?.document?.actor?.effects?.contents
  ?.find((e) =>
    ["focus", "offensif", "defensif"].includes(e.name?.toLowerCase())
  )
  ?.name?.toLowerCase();

let spellIntensity = 1.0;
if (stance === "offensif") spellIntensity = 1.3; // More dramatic
else if (stance === "focus") spellIntensity = 0.8; // Subtler
else if (stance === "defensif") spellIntensity = 0.9; // Controlled
```

## Development Guidelines

### Always Use:

1. **Sequencer** for all animations
2. **JB2A** effects as primary visual library
3. **Portal** for advanced targeting
4. **Status detection utilities** for RPG integration

### Never Implement:

- Dice rolling or damage calculation
- Mana cost deduction
- Turn order management
- Automatic stat modifications

### Required Documentation References:

- **GAME-RULES.md** - Complete RPG system mechanics
- **CONTRIBUTING.md** - Development standards and RPG integration
- **MODULE-REQUIREMENTS.md** - Available modules and dependencies

### Testing Pattern:

1. Use quick console commands for rapid testing
2. Run comprehensive utilities for detailed analysis
3. Test with multiple stances and injury levels
4. Verify module compatibility

## Code Standards

### Status Detection Pattern:

```javascript
// ✅ Correct: Use name property for Active Effects
const stance = actor?.effects?.contents?.find((e) =>
  ["focus", "offensif", "defensif"].includes(e.name?.toLowerCase())
)?.name;

// ❌ Wrong: Using label property
const stance = actor?.effects?.contents?.find((e) =>
  ["focus", "offensif", "defensif"].includes(e.label?.toLowerCase())
)?.label;
```

### Injury Stack Detection:

```javascript
// ✅ Correct: Access Status Icon Counters flag
const injuries =
  actor?.effects?.contents?.find((e) =>
    e.name?.toLowerCase().includes("blessures")
  )?.flags?.statuscounter?.value || 0;
```

### Error Handling:

```javascript
// ✅ Always check for selected tokens
if (!canvas.tokens.controlled.length) {
  ui.notifications.warn("Please select a token to cast from.");
  return;
}

// ✅ Verify module availability
if (typeof Sequencer === "undefined") {
  ui.notifications.error("Sequencer module required for spell animations.");
  return;
}
```

## Remember:

- GameMaster has final authority on all rule interpretations
- Focus on visual effects only, not game mechanics
- Use provided utilities instead of recreating status detection
- Test with actual RPG scenarios (different stances, injury levels)
- Reference existing macros in `/examples/` for patterns
