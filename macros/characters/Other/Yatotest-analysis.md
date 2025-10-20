# Deep Analysis: Yatotest.js Script Issues and Fixes

## Original Problems Identified

### 1. **Direct Actor Updates (Permission Issues)**

#### Problem:

```javascript
await actor.setFlag("world", flagKey, true);
await actor.unsetFlag("world", flagKey);
```

**Why this fails:**

- `actor.setFlag()` and `actor.unsetFlag()` perform direct database updates on the actor document
- Players typically don't have permission to update actor documents they don't own
- This causes permission errors when non-GM users run the macro
- Even if permissions allow it, this bypasses the Active Effects system entirely

### 2. **Misunderstanding of Active Effects vs Direct Updates**

#### Problem:

The original approach tried to:

1. Save the original dodge value in a flag
2. Manually update the dodge attribute with `actor.update()`
3. Track state with flags instead of using the Active Effect system

**Why this is wrong:**

- The Custom Status Effects Override module is designed to work with **Active Effects**
- Active Effects have a `changes` array that automatically applies modifications to actor properties
- When an effect is removed, Foundry automatically reverts the changes
- Manual updates don't integrate with Foundry's effect system and require manual cleanup

### 3. **Inefficient Effect Detection**

#### Problem:

```javascript
const saved = actor.getFlag("world", flagKey);
const existingEffects = actor.effects.filter(e => e.label === "Buff Dodge Kawaii");
for (const eff of existingEffects) { ... }
```

**Why this is problematic:**

- Uses flags to track state instead of simply checking for the effect's existence
- Filters all effects and loops through matches (assuming multiple might exist)
- More complex than needed

## The Correct Solution

### Key Concept: Active Effects with Changes Array

Active Effects in Foundry VTT use a `changes` array to automatically modify actor properties:

```javascript
changes: [
  {
    key: "system.attributes.Combat.Dodge.value", // Property to modify
    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, // How to apply it
    value: "2d6+1d6", // New value
    priority: 20, // Application order
  },
];
```

**Effect Modes Available:**

- `CUSTOM (0)`: No automatic application
- `MULTIPLY (1)`: Multiply the property
- `ADD (2)`: Add to the property (numeric only)
- `DOWNGRADE (3)`: Keep the lowest value
- `UPGRADE (4)`: Keep the highest value
- `OVERRIDE (5)`: Replace the value entirely

### Fixed Implementation

#### 1. Effect Detection (No Flags Needed)

```javascript
const existingEffect = actor.effects.find(
  (e) => e.label === "Buff Dodge Kawaii"
);
```

- Simple existence check using the effect label
- No need for separate flag tracking

#### 2. Effect Creation with Changes Array

```javascript
const currentDodge = foundry.utils.getProperty(actor, dodgePath) || "2d6";

const effectData = {
  label: "Buff Dodge Kawaii",
  icon: buffIcon,
  origin: `Actor.${actor.id}`,
  duration: { seconds: 3600 },
  changes: [
    {
      key: dodgePath,
      mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
      value: `${currentDodge}+1d6`,
      priority: 20,
    },
  ],
  flags: {
    statuscounter: { value: 1, visible: true },
    world: { [flagKey]: currentDodge }, // Optional: store original for reference
  },
};
```

**What this does:**

- Reads the current dodge value (e.g., "2d6")
- Creates an effect that overrides it with "2d6+1d6"
- When the effect is removed, Foundry automatically reverts to the original value
- No manual cleanup needed!

#### 3. Effect Application via GM Socket

```javascript
const result = await globalThis.gmSocket.executeAsGM(
  "applyEffectToToken",
  token.id,
  effectData
);
```

- Uses the GM socket handler from Custom Status Effects Override module
- GM client creates the effect, avoiding permission issues
- Returns success/failure feedback

#### 4. Effect Removal via GM Socket

```javascript
const result = await globalThis.gmSocket.executeAsGM(
  "removeEffectFromToken",
  token.id,
  existingEffect.id
);
```

- GM client removes the effect
- Foundry automatically reverts the dodge value
- No manual restoration needed!

## Why This Approach is Better

### 1. **No Permission Issues**

- All document updates go through GM socket handlers
- Players can run the macro without actor update permissions

### 2. **Automatic Cleanup**

- Foundry's Active Effect system handles value restoration
- No manual tracking of original values needed
- Effects can be removed by any standard method (duration expiry, manual removal, etc.)

### 3. **Integration with Foundry Systems**

- Effects show in the token HUD
- Effects show in the actor's effects tab
- Compatible with other modules that interact with effects
- Duration tracking works automatically

### 4. **Simpler State Management**

- Effect existence = buff active
- No effect = buff inactive
- Single source of truth

### 5. **Better User Experience**

- Visual feedback through status icon
- Counter display with `statuscounter` flag
- Persistent aura animation tied to effect lifecycle
- Standard Foundry effect UI available

## Testing Checklist

- [ ] Non-GM player can apply effect to owned token
- [ ] Non-GM player can apply effect to unowned token (with GM online)
- [ ] Effect appears in token HUD with pink shield icon
- [ ] Effect shows counter value "1"
- [ ] Dodge value changes when effect is applied
- [ ] Dodge value reverts when effect is removed
- [ ] Pink aura animation appears and persists
- [ ] Pink aura animation stops when effect is removed
- [ ] Effect can be toggled on/off multiple times
- [ ] Multiple targets can be affected simultaneously
- [ ] Chat message displays correctly with all target names

## Additional Notes

### About Effect Flags

The effect now stores data in its own flags instead of actor flags:

```javascript
flags: {
  statuscounter: { value: 1, visible: true },  // For token counter display
  world: { [flagKey]: currentDodge }           // For reference (optional)
}
```

This is cleaner because:

- Data is contained within the effect itself
- Automatically cleaned up when effect is removed
- No orphaned flags left on the actor

### About OVERRIDE Mode

We use `CONST.ACTIVE_EFFECT_MODES.OVERRIDE` because:

- Dodge value is a dice formula string (e.g., "2d6")
- Can't use ADD mode with strings
- OVERRIDE replaces the entire formula
- Allows us to append "+1d6" to the existing formula

### Alternative: If Dodge Were Numeric

If the dodge value were a number instead of a formula, you could use:

```javascript
mode: CONST.ACTIVE_EFFECT_MODES.ADD,
value: "1",  // Add 1 to current value
```

This would be cleaner but doesn't work with dice formulas.

## Conclusion

The fixed script now properly leverages Foundry VTT's Active Effects system through the Custom Status Effects Override module's GM socket handlers. It eliminates permission issues, simplifies state management, and provides better integration with Foundry's built-in systems.
