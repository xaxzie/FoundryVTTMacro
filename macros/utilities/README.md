# Spell Utility Functions Reference

This directory contains standalone utility functions extracted from the bubbles.js spell and designed for reuse in other spell macros. Each utility file contains functions that can be **copied** (not imported) into your spell macros to maintain the standalone requirement.

## 📁 Utility Files Overview

### 🔍 `actor-validation.js`

**Purpose**: Validates caster selection and actor requirements
**Functions**:

- `validateCaster()` - Basic caster and actor validation
- `validateSpellCaster()` - Enhanced spell caster validation
- `validateActorAttributes()` - Checks if actor has required attributes
- `validateSpellCasterWithAttributes()` - Complete validation with attributes

**Example Usage**:

```javascript
const validation = validateSpellCasterWithAttributes();
if (!validation) return;
const { caster, actor } = validation;
```

### ⚔️ `stance-detection.js`

**Purpose**: Detects and works with combat stances in the custom RPG system
**Functions**:

- `detectCombatStance(actor)` - Detects current stance ('focus', 'offensif', 'defensif')
- `formatStanceName(stance)` - Formats stance for display
- `calculateStanceManaCost(stance, baseCost, isFocusable)` - Calculates mana cost based on stance
- `getStanceDamageInfo(stance, isHealing)` - Gets damage description for stance
- `shouldMaximizeDamage(stance, isHealing)` - Checks if damage should be maximized
- `getStanceInfo(actor)` - Gets comprehensive stance information

**Example Usage**:

```javascript
const { stance, stanceName, stanceDisplay } = getStanceInfo(actor);
const manaCostInfo = calculateStanceManaCost(stance, 4, true);
```

### 📊 `character-stats.js`

**Purpose**: Retrieves character statistics with injury adjustments
**Functions**:

- `getCharacterStat(actor, statName)` - Gets single character stat
- `detectInjuryStacks(actor)` - Detects injury stacks on actor
- `getInjuryAdjustedStat(actor, statName)` - Gets stat adjusted for injuries
- `getEspritStat(actor)` - Gets Esprit stat with injury adjustment (most common)
- `validateEspritAttribute(actor)` - Validates Esprit attribute exists
- `getAllCharacterStats(actor)` - Gets all stats with injury adjustments
- `formatInjuryInfo(baseStat, adjustedStat, injuryStacks)` - Formats injury info for display

**Example Usage**:

```javascript
if (!validateEspritAttribute(actor)) return;
const { baseStat, injuryStacks, adjustedStat } = getEspritStat(actor);
const injuryDisplay = formatInjuryInfo(baseStat, adjustedStat, injuryStacks);
```

### 🎯 `portal-targeting.js`

**Purpose**: Uses Portal module for crosshair spell targeting
**Functions**:

- `createSpellPortal(casterToken, options)` - Creates basic Portal instance
- `selectSingleTarget(casterToken, options)` - Simple single-target selection
- `selectHealingTarget(casterToken, range)` - Green targeting for healing spells
- `selectOffensiveTarget(casterToken, range)` - Red targeting for offensive spells
- `selectMultipleTargets(casterToken, maxTargets, options)` - Multi-target selection
- `isTargetingSelf(casterToken, targetLocation, tolerance)` - Checks self-targeting
- `selectOptionalSecondTarget(casterToken, options)` - Portal with optional second target

**Example Usage**:

```javascript
const target = await selectSingleTarget(caster);
if (!target) return;

const healTarget = await selectHealingTarget(caster, 120);
const isSelfTarget = isTargetingSelf(caster, target);
```

### 🔎 `actor-detection.js`

**Purpose**: Detects actors at target locations with tolerance
**Functions**:

- `getActorAtLocation(targetX, targetY, tolerance)` - Finds actor at specific location
- `getActorsAtLocations(targetLocations, tolerance)` - Gets actors at multiple locations
- `hasActorAtLocation(targetX, targetY, tolerance)` - Boolean check for actor presence
- `getNearestActorToLocation(targetX, targetY, maxRange)` - Finds nearest actor
- `getTargetDisplayName(actorInfo, fallbackName)` - Gets display name for target
- `formatMultipleTargetNames(targetActors, separator, fallbackName)` - Formats multiple names

**Example Usage**:

```javascript
const actorInfo = getActorAtLocation(target.x, target.y);
const targetName = getTargetDisplayName(actorInfo, "unknown target");
const targetActors = getActorsAtLocations(targets);
```

### ⚔️ `damage-calculation.js`

**Purpose**: Calculates spell damage/healing with stance and stat considerations, includes active effect integration and precision mechanics
**Functions**:

- `getActiveEffectBonus(actor, flagKey)` - Gets active effect bonuses for specific flags
- `createStandardRoll(actor, espritStat, damageBonus, rollType)` - Creates 1d6 + bonus roll with active effects
- `createMaximizedRoll(actor, espritStat, damageBonus)` - Creates maximized damage (Offensive stance) with active effects
- `calculateStanceDamage(actor, stance, espritStat, damageBonus, isHealing)` - Damage based on stance with active effects
- `calculateMultipleProjectileDamage(actor, count, stance, espritStat, damageBonus, isHealing)` - Multiple projectiles with active effects
- `calculateTotalDamage(damageRolls)` - Sums damage from multiple rolls
- `calculateAttackResolution(actor, espritStat, attackBonus, spellLevel)` - Attack roll calculation with precision mechanics
- `formatDamageRoll(damageRoll, showFormula)` - Formats damage for display
- `getBonusDialog(actor, espritStat, spellLevel, stance, isHealing)` - Dialog for damage/attack bonuses with active effect display

**Example Usage**:

```javascript
const bonuses = await getBonusDialog(espritStat, 1, stance, false);
if (!bonuses) return;
const damage = await calculateStanceDamage(
  stance,
  espritStat,
  bonuses.damageBonus,
  false
);
const attackResolution = await calculateAttackResolution(
  espritStat,
  bonuses.attackBonus,
  1
);
```

### 🌟 `element-selection.js`

**Purpose**: Creates element selection dialogs for spells
**Functions**:

- `createElementSelectionDialog(stance, manaCostInfo, elements)` - Generic element dialog
- `createBubblesElementDialog(stance, manaCostInfo)` - Water/ice/oil/living water elements
- `createBasicElementDialog(stance, manaCostInfo)` - Fire/ice/lightning/water elements
- `createHealingDamageDialog(stance, manaCostInfo)` - Healing vs damage selection
- `getElementEffectProperties(element)` - Gets JB2A effect files for element
- `getElementGameEffect(element, allowSelfTarget)` - Gets game effect description
- `getElementDisplayName(element)` - Gets formatted element name

**Example Usage**:

```javascript
const element = await createBubblesElementDialog(
  stance,
  manaCostInfo.description
);
if (!element) return;
const elementProps = getElementEffectProperties(element);
const effectDescription = getElementGameEffect(element);
```

### 💬 `chat-formatting.js`

**Purpose**: Creates consistent chat messages for spell results
**Functions**:

- `formatDamageDisplay(damages, targetActors, stance, isHealing)` - Formats damage section
- `formatAttackResolution(attackResolution)` - Formats attack roll section
- `formatInjuryDisplay(baseStat, adjustedStat, injuryStacks)` - Formats injury info
- `createSpellResultMessage(messageData, caster)` - Creates complete chat message
- `createSpellNotification(notificationData)` - Creates UI notification
- `formatTargetText(targetActors, targets, isHealing, allowSelfTarget, casterName)` - Formats target names
- `getSpellIcon(element, isHealing)` - Gets appropriate emoji for spell

**Example Usage**:

```javascript
const messageData = {
  spellName: "🫧 Sort de Bulles",
  elementName: getElementDisplayName(element),
  manaCost: actualManaCost,
  damages: [damage1, damage2],
  targetActors: targetActors,
  stance: currentStance,
  isHealing: isLivingWater,
};
await createSpellResultMessage(messageData, caster);
```

### 🎭 `active-effect-helpers.js`

**Purpose**: Simple functions for adding and removing active effects from actors
**Functions**:

- `addActiveEffect(actor, effectName, iconPath, flags, durationSeconds)` - Adds an active effect to an actor
- `removeActiveEffectByName(actor, effectName)` - Removes an effect by name
- `hasActiveEffect(actor, effectName)` - Checks if an actor has a specific effect
- `getActiveEffectByName(actor, effectName)` - Gets an effect object by name
- `toggleActiveEffect(actor, effectName, iconPath, flags, durationSeconds)` - Adds or removes effect based on current state

**Example Usage**:

```javascript
// Add an effect with multiple bonuses
await addActiveEffect(actor, "Red Eyes", "icons/svg/eye.svg", [
  { key: "damage", value: 2 },
  { key: "agilite", value: 1 },
]);

// Remove effect by name
await removeActiveEffectByName(actor, "Red Eyes");

// Toggle effect (smart add/remove)
const result = await toggleActiveEffect(
  actor,
  "Serpent",
  "icons/svg/snake.svg",
  [{ key: "damage", value: 4 }]
);
```

## 🎯 Usage Guidelines

### Copy, Don't Import

All utility functions are designed to be **copied** into your spell macros, not imported. This maintains the standalone requirement for all macros in this repository.

### Typical Spell Structure Using Utilities

```javascript
/**
 * Your Spell Name - Custom RPG Spell Animation
 */

(async () => {
  // 1. VALIDATION
  // Copy functions from actor-validation.js
  function validateSpellCasterWithAttributes() {
    /* ... */
  }

  const validation = validateSpellCasterWithAttributes();
  if (!validation) return;
  const { caster, actor } = validation;

  // 2. STANCE DETECTION
  // Copy functions from stance-detection.js
  function getStanceInfo(actor) {
    /* ... */
  }
  function calculateStanceManaCost(stance, baseCost, isFocusable) {
    /* ... */
  }

  const { stance, stanceName, stanceDisplay } = getStanceInfo(actor);
  const manaCostInfo = calculateStanceManaCost(stance, 4, true);

  // 3. CHARACTER STATS
  // Copy functions from character-stats.js
  function getEspritStat(actor) {
    /* ... */
  }

  const { baseStat, injuryStacks, adjustedStat } = getEspritStat(actor);

  // 4. ELEMENT SELECTION
  // Copy functions from element-selection.js
  function createBasicElementDialog(stance, manaCostInfo) {
    /* ... */
  }

  const element = await createBasicElementDialog(
    stance,
    manaCostInfo.description
  );
  if (!element) return;

  // 5. TARGETING
  // Copy functions from portal-targeting.js
  function selectSingleTarget(casterToken, options) {
    /* ... */
  }

  const target = await selectSingleTarget(caster);
  if (!target) return;

  // 6. ACTOR DETECTION
  // Copy functions from actor-detection.js
  function getActorAtLocation(targetX, targetY, tolerance) {
    /* ... */
  }

  const actorInfo = getActorAtLocation(target.x, target.y);

  // 7. DAMAGE CALCULATION
  // Copy functions from damage-calculation.js
  function getBonusDialog(espritStat, spellLevel, stance, isHealing) {
    /* ... */
  }
  function calculateStanceDamage(stance, espritStat, damageBonus, isHealing) {
    /* ... */
  }

  const bonuses = await getBonusDialog(actor, adjustedStat, 1, stance, false);
  if (!bonuses) return;
  const damage = await calculateStanceDamage(
    actor,
    stance,
    adjustedStat,
    bonuses.damageBonus,
    false
  ); // 8. SPELL ANIMATION
  // Your Sequencer animation code here
  new Sequence()
    .effect()
    .file("jb2a.your_effect.webm")
    .atLocation(target)
    .play();

  // 9. CHAT MESSAGE
  // Copy functions from chat-formatting.js
  function createSpellResultMessage(messageData, caster) {
    /* ... */
  }

  const messageData = {
    spellName: "Your Spell",
    damages: [damage],
    targetActors: [actorInfo],
    stance: stance,
  };
  await createSpellResultMessage(messageData, caster);
})();
```

## 🔧 Customization Tips

### Modifying Functions

Feel free to modify copied functions to fit your specific spell needs:

- Change default values
- Add new element types
- Modify dialog text
- Adjust damage formulas
- Add new validation checks

### Common Patterns

- **Single Target Spell**: Use `selectSingleTarget` + `getActorAtLocation`
- **Multi-Target Spell**: Use `selectMultipleTargets` + `getActorsAtLocations`
- **Healing Spell**: Use `selectHealingTarget` + set `isHealing: true`
- **Element Variety**: Create custom element arrays for `createElementSelectionDialog`
- **Complex Damage**: Use `calculateMultipleProjectileDamage` for multi-hit spells

### Error Handling

All utilities include console logging and error messages. Enable debug mode to see detailed information:

```javascript
console.log("[DEBUG] Your debug message here");
```

## 📚 Related Documentation

- **[GAME-RULES.md](../GAME-RULES.md)** - Understanding the RPG mechanics these utilities support
- **[best-practices.md](../docs/best-practices.md)** - RPG-specific development guidelines
- **[sequencer-reference.md](../docs/sequencer-reference.md)** - Sequencer API for spell animations
- **[Bubbles.js](../macros/characters/ora/bubbles.js)** - Original implementation example

---

_These utilities enable consistent, professional spell creation while maintaining the standalone macro requirement. Copy what you need and adapt for your specific spell requirements!_
