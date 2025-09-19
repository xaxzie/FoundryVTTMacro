# Custom RPG Game Rules

This document outlines the specific rules and mechanics of the custom RPG system that governs all spell animations in this FoundryVTT collection.

## 🎲 Core Philosophy

**MAIN FOCUS**: The rules are really free to interpretation from the GameMaster. In case of doubt when generating content, **always ask the GameMaster** how a rule would be handled.

> **GameMaster Authority**: All rules are subject to GameMaster interpretation and modification. When in doubt, defer to the GameMaster's ruling.

## ⚔️ Core Battle System

### Turn-Based Combat Flow

The RPG uses a **turn-based combat system** managed by the **Carousel Combat Track** module:

1. **Initiative Order**: Determined by external script (not accessible through macros)
2. **Turn Structure**: Each fighter takes turns in order
3. **Actions per Turn**: 
   - **1 Action**: Cast a spell or make an attack
   - **1 Movement**: Move up to 6 squares maximum

### Combat Grid System

- **Grid Type**: Square-organized battlemap
- **Movement Rules**:
  - **Straight Movement**: 1 square = 1 movement point
  - **Diagonal Movement**: 1 square = 1.5 movement points (rounded down)
  - **Maximum Movement**: 6 squares per turn

> **Spell Integration**: Some spells may interact with movement actions. Consider diagonal movement costs when designing area effects.

## 📊 Character Statistics

### Seven Core Stats

Each character has Seven primary statistics that govern their abilities:

1. **Force** (Strength/Power)
2. **Dexterité** (Dexterity/Agility) 
3. **Agilité** (Speed/Reflexes)
4. **Esprit** (Mind/Intelligence)
5. **Sens** (Senses/Perception)
6. **Volonté** (Will/Determination)
7. **Charisme** (Charisma/Leadership)

### Stat Usage
- **Not Accessible**: Stats are not automatically accessible through macro tools
- **Manual Input**: When spell animations require stat checks, they must be provided manually in prompts
- **Storage**: Stats are stored in FoundryVTT character sheets
- **Integration**: Future automation may allow direct stat access

## ⚡ Combat Mechanics

### Spell Casting Process

#### 1. Mana Cost
- **Resource**: Spells consume "mana" stored as "power" in character sheets
- **Deduction**: Mana is automatically decremented from character resources
- **Tracking**: Use FoundryVTT's built-in resource management

#### 2. Attack Resolution
```
Attacker Process:
1. Spend mana for the spell
2. Roll dice based on spell's associated characteristic
3. Formula: [Stat Value] × d7 (one d7 per stat point)
4. Example: Force 9 = roll 9d7

Target Process:
1. Choose counter characteristic (usually Agility)
2. Roll defense: [Counter Stat] × d7
3. Can use spells for countering (costs mana)

Hit Resolution:
- Hit if: Attacker Total > Defender Total
- Miss if: Attacker Total ≤ Defender Total
```

#### 3. D7 Dice System
- **Dice Type**: Custom d7 (not standard d6 or d8)
- **Median Value**: 4 (for balanced gameplay)
- **Purpose**: Each stat point = one d7 rolled

### Damage and Effects
- **Damage Calculation**: Always spell-specific
- **Health Reduction**: Damages "health" resource in character sheet
- **Spell Effects**: Trigger only on successful hits
- **Animation Scope**: Macros handle **visual effects only**, not calculations

## 🛡️ Combat Stances

At the start of each turn, players choose one of three combat stances:

### 🗡️ Offensive Stance
- **Damage Bonus**: All damage dice are maximized (rolled at maximum value)
- **Defense Penalty**: -3 dice when attempting to dodge attacks
- **Best For**: High-damage assault turns
- **Risk**: Vulnerable to counterattacks

### 🛡️ Defensive Stance  
- **Dodge Bonus**: No dodging penalties
- **Counter Ability**: Can use spells to counter incoming attacks
- **Mana Cost**: Counter-spells still cost mana
- **Best For**: Surviving enemy assault rounds

### 🎯 Focus Stance
- **Mana Benefit**: Most spell costs are completely removed
- **Exceptions**: Some spells cannot be focused
- **Partial Focus**: Some spells have costs reduced by half instead of eliminated
- **Best For**: Casting expensive spells or sustained casting

### Stance Impact on Animations
- **Current**: Stance detection is manual
- **Future**: Visual effects may vary based on active stance
- **Animation Notes**: Consider stance when designing spell visual intensity

## 📋 Spell Animation Guidelines

### What Animations Should Handle
✅ **Visual spell effects and sequences**  
✅ **Audio feedback for spell casting**  
✅ **Token targeting and positioning**  
✅ **Visual storytelling and immersion**  

### What Animations Should NOT Handle
❌ **Dice rolling mechanics** (handled externally)  
❌ **Damage calculations** (manual or external scripts)  
❌ **Mana cost deduction** (character sheet management)  
❌ **Stat checks and validation** (manual input required)  
❌ **Turn order enforcement** (Carousel Combat Track handles this)  

### RPG Integration Points

#### Character Sheet Integration
```javascript
// Accessing character resources (mana/health)
let actor = canvas.tokens.controlled[0]?.actor;
let currentMana = actor.system.resources.power.value;
let currentHealth = actor.system.resources.health.value;

// Note: Automatic deduction should be handled separately
```

#### Turn Order Integration
```javascript
// Checking current turn (requires Carousel Combat Track)
let currentCombatant = game.combat?.current;
let activeToken = currentCombatant?.token;

// Validate spell caster is active player
if (activeToken?.id === token.id) {
    // Proceed with spell animation
} else {
    ui.notifications.warn("It's not your turn!");
}
```

#### Targeting System
```javascript
// Using Warp Gate for spell targeting
let crosshairs = await warpgate.crosshairs.show({
    size: 2,
    icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
});

if (crosshairs.cancelled) return;
// Proceed with targeted spell
```

## 🎯 Spell Design Principles

### Spell Categories by RPG Mechanics

#### **Single-Target Spells**
- Use crosshair targeting system
- Consider line-of-sight and range
- May trigger counter-spell opportunities

#### **Area-of-Effect Spells**
- Account for movement grid system
- Consider diagonal movement costs
- May affect multiple stances differently

#### **Buff/Debuff Spells**
- Visual duration indicators
- Stance-dependent visual intensity
- Clear start/end animations

#### **Counter Spells**
- Reactive animations triggered by incoming spells
- Must work within defensive stance mechanics
- Quick execution to fit turn timing

### Animation Timing Considerations

- **Turn Duration**: Keep animations concise for turn-based flow
- **Counter-Spell Timing**: Leave room for defensive reactions
- **Stance Changes**: Allow time for stance selection at turn start
- **Movement Integration**: Consider movement action timing

## 🔮 Future Development

### Planned Enhancements
- **Automatic Stance Detection**: Visual effects that adapt to current stance
- **Stat Integration**: Direct access to character statistics for spell validation
- **Turn Validation**: Automatic turn order checking before spell execution
- **Resource Management**: Integrated mana cost handling

### GameMaster Requests
When these features are needed:
1. **Consult GameMaster** for implementation priorities
2. **Discuss rule interpretation** for edge cases
3. **Validate mechanics** before coding automation
4. **Test thoroughly** with actual gameplay scenarios

## 📞 GameMaster Communication

### When to Consult GameMaster

- ❓ **Rule Interpretation**: Unclear how a mechanic should work
- 🆕 **New Spell Concepts**: Creating spells not yet defined
- ⚖️ **Rule Conflicts**: When rules seem to contradict
- 🔧 **Automation Decisions**: How much automation is desired
- 🎮 **Gameplay Balance**: Whether a spell effect is appropriate

### Preferred Communication Format

When asking the GameMaster:
1. **Context**: Describe the specific spell or situation
2. **Question**: Clearly state what needs clarification  
3. **Options**: Provide potential interpretations if applicable
4. **Impact**: Explain how the decision affects animations

---

*Remember: These rules serve the story and fun. When in doubt, ask the GameMaster! 🎲*