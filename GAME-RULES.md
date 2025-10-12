# Custom RPG Game Rules

This document outlines the specific rules and mechanics of the custom RPG system that governs all spell animations in this FoundryVTT collection.

## 🎲 Core Philosophy

**MAIN FOCUS**: The rules are really free to interpretation from the GameMaster. In case of doubt when generating content, **always ask the GameMaster** how a rule would be handled.

> **GameMaster Authority**: All rules are subject to GameMaster interpretation and modification. When in doubt, defer to the GameMaster's ruling.

## ⚔️ Core Battle System

### Turn-Based Combat Flow

The RPG uses a **turn-based combat system** managed by the **Carousel Combat Track** module:

1. **Initiative Order**: Based on Agilité characteristic with automatic rolls
2. **Turn Structure**: Each fighter takes turns in order
3. **Actions per Turn**:
   - **1 Simple Action**: Cast a spell, attack, or interact with environment
   - **1 Movement Action**: Move up to 6 squares or perform movement-equivalent actions

### Turn Actions Breakdown

#### **Simple Action Options**

- **Spell Casting**: Launch any known spell
- **Physical Attack**: Melee or ranged combat
- **Environmental Interaction**: Manipulate objects, open doors, etc.
- **Other Actions**: GM discretion for creative actions

#### **Movement Action Options**

- **Standard Movement**: Up to 6 squares of movement
- **Item Management**: Draw/sheathe weapons, retrieve items from inventory
- **Ground Interaction**: Pick up objects from the ground
- **Other Physical Actions**: GM discretion for movement-equivalent actions

### Non-Turn Limitations

- **Passive Phase**: Cannot perform actions when it's not your turn
- **Exception**: Resistance/dodge rolls against incoming attacks
- **Reactive Spells**: Only available in Defensive stance

### Combat Communication Rules

#### **Player Communication Guidelines**

- **Personal Commentary**: Players can comment on combat between themselves
- **Strategic Limitation**: Cannot share specific action plans during others' turns
- **Character Communication**: Prefer in-character dialogue during your own turn
- **Allied Response**: Allies can respond briefly when addressed during your turn
- **No Action Cost**: Speaking doesn't consume actions but must be realistic

#### **Temporal Framework**

- **Turn Duration**: Approximately 6 seconds in game world
- **Simultaneous Actions**: All actions in a full round occur roughly simultaneously
- **Dialogue Realism**: Speech should fit within the 6-second timeframe

### Combat Grid System

- **Grid Type**: Square-organized battlemap
- **Movement Rules**:
  - **Straight Movement**: 1 square = 1 movement point
  - **Diagonal Movement**: 1 square = 1.5 movement points (rounded down)
  - **Maximum Movement**: 6 squares per turn
- **Movement Examples** (with 6 movement points):
  - 6 squares horizontally or vertically
  - 5 squares straight + 1 diagonal
  - 3 squares straight + 2 diagonal
  - 2 squares straight + 3 diagonal
  - 4 squares diagonal only

> **Spell Integration**: Some spells may interact with movement actions. Consider diagonal movement costs when designing area effects.

## 📊 Character Resources

### Health and Mana System

#### **Health Points (HP)**

- **Critical Threshold**: 0 HP = unconscious, life in danger
- **Starting Value**: 10 HP base
- **Additional Points**: From the 15 bonus points during character creation

#### **Mana Points (MP)**

- **Critical Threshold**: 0 MP = unconscious, life in danger
- **Starting Value**: 5 MP base
- **Additional Points**: From the 15 bonus points during character creation

#### **Character Creation Resources**

- **Base**: 10 HP + 5 MP
- **Bonus**: 15 additional points to distribute between HP and MP as desired
- **Storage**: Managed through FoundryVTT character sheet resources

## 📊 Character Statistics

### Seven Core Stats

Each character has seven primary statistics that govern their abilities:

1. **Physique** (Physical Strength)
2. **Dextérité** (Dexterity/Skill)
3. **Agilité** (Agility/Speed/Reflexes)
4. **Esprit** (Mind/Concentration)
5. **Sens** (Senses/Perception)
6. **Volonté** (Will/Determination)
7. **Charisme** (Charisma/Social Understanding)

### Stat Descriptions and Uses

#### **Physique** (Physical Strength)

- **Spell Casting**: Used for certain spells requiring physical power
- **Physical Actions**: Lifting heavy objects, breaking things
- **Combat**: Melee attacks with heavy weapons, unarmed combat

#### **Dextérité** (Dexterity/Skill)

- **Spell Casting**: Used for precision-based spells
- **Ranged Combat**: Aiming and shooting projectiles
- **Fine Motor Skills**: Precise object manipulation, light weapon combat (daggers)

#### **Agilité** (Agility/Speed/Reflexes)

- **Defense**: Primary stat for dodging and evasion
- **Stealth**: Hiding and moving quietly
- **Initiative**: Determines turn order in combat
- **Movement Speed**: Character's action speed

#### **Esprit** (Mind/Concentration)

- **Spell Casting**: Used for concentration-based spells
- **Magic Perception**: Sensing magical effects and energies
- **Intelligence**: Understanding complex concepts and problems

#### **Sens** (Senses/Perception)

- **Spell Casting**: Used for perception-based spells
- **Detection**: Spotting hidden objects, enemies, or clues
- **Awareness**: Environmental perception and alertness

#### **Volonté** (Will/Determination)

- **Spell Casting**: Used for will-based spells
- **Resistance**: Resisting physical, magical, mental, or emotional attacks
- **Determination**: Perseverance through difficult situations

#### **Charisme** (Charisma/Social Understanding)

- **Spell Casting**: Used for social or emotion-based spells
- **Social Interaction**: Persuasion, deception, negotiation
- **Empathy**: Understanding and reading other characters' emotions

### Character Creation Stats

#### **Point-Based System (New Rule)**

- **Base Values**: 2 points in each characteristic (configurable, default: 2)
- **Point Pool**: 20 points to distribute (configurable based on campaign needs)
- **Progressive Cost System**:
  - **Level 2→3**: 1 point
  - **Level 3→4**: 1 point
  - **Level 4→5**: 2 points
  - **Level 5→6**: 2 points
  - **Level 6→7**: 3 points
  - **Level 7→8**: 4 points
  - **Level 8→9**: 5 points
  - **Level 9→10**: 6 points
  - **Pattern**: Cost increases by +1 every level starting from level 7

#### **Point Cost Examples**

- **Characteristic at 3**: 1 point spent (base 2 + 1 point)
- **Characteristic at 4**: 2 points spent (base 2 + 1 + 1 points)
- **Characteristic at 5**: 4 points spent (base 2 + 1 + 1 + 2 points)
- **Characteristic at 6**: 6 points spent (base 2 + 1 + 1 + 2 + 2 points)
- **Characteristic at 7**: 9 points spent (base 2 + 1 + 1 + 2 + 2 + 3 points)
- **Characteristic at 8**: 13 points spent (base 2 + 1 + 1 + 2 + 2 + 3 + 4 points)
- **Characteristic at 9**: 18 points spent (base 2 + 1 + 1 + 2 + 2 + 3 + 4 + 5 points)

#### **Legacy System (Admin Tool)**

- **Starting Values**: 2 points in each characteristic
- **Bonus Points**: 14 additional points to distribute
- **Maximum Investment**: 4 additional points per characteristic (maximum 6 total)

### 🎲 **DICE SYSTEM FOR ALL ROLLS**

> **CRITICAL RULE**: All characteristic-based rolls use the **d7 dice system**
>
> **Formula**: `[Characteristic Value] × d7` (roll one d7 per stat point)
>
> **Examples**:
>
> - Physique 3 → Roll **3d7**
> - Dextérité 5 → Roll **5d7**
> - Esprit 6 → Roll **6d7**
>
> **This applies to**: Combat rolls, skill checks, spell casting, characteristic tests

### Stat Usage

- **Not Accessible**: Stats are not automatically accessible through macro tools
- **Manual Input**: When spell animations require stat checks, they must be provided manually in prompts
- **Storage**: Stats are stored in FoundryVTT character sheets as individual attributes
- **Point Tracking**: New system stores additional attributes:
  - `pointTotal`: Total points allocated to the character
  - `pointInutilise`: Unused points remaining
  - `baseValue`: Base value for all characteristics (usually 2)
- **Integration**: Future automation may allow direct stat access

### Character Setup Tools

#### **Point-Based Setup** (`character-stats-point-setup.js`)

- **Purpose**: Create balanced characters using the progressive point cost system
- **Features**:
  - Interactive stat modification with real-time cost calculation
  - Prevents over-spending points
  - Tracks unused points for future use
  - Configurable base values and total point pools
- **Best For**: Balanced campaign character creation

#### **Admin Setup** (`character-stats-setup.js`)

- **Purpose**: Unrestricted stat assignment for NPCs and special characters
- **Features**: Direct stat value entry with presets available
- **Best For**: GM tools, NPCs, testing scenarios

## ⚡ Combat Mechanics

### Spell Casting Process

#### 1. Mana Cost

- **Resource**: Spells consume "mana" stored as "power" in character sheets
- **Deduction**: Mana is automatically decremented from character resources
- **Tracking**: Use FoundryVTT's built-in resource management

#### 2. Attack Resolution

```
🎲 DICE SYSTEM: ALL ROLLS USE [STAT VALUE]d7

Attacker Process:
1. Spend mana for the spell
2. Roll dice based on spell's associated characteristic
3. Formula: [Stat Value]d7 (one d7 per stat point)
4. Example: Physique 4 = roll 4d7, Esprit 6 = roll 6d7

Target Process:
1. Choose counter characteristic (usually Agilité)
2. Roll defense: [Counter Stat]d7
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

- **Damage Bonus**: All damage dice are maximized (no damage rolls, all dice become maximum value)
- **Defense Penalty**: -2 dice when attempting to dodge attacks (Agilité -2)
- **Best For**: High-damage assault turns
- **Risk**: Vulnerable to counterattacks

### 🛡️ Defensive Stance

- **Counter Ability**: Can use spells reactively to defend against incoming attacks
- **Spell Defense**: Use the spell's associated stat instead of Agilité for defense
- **Examples**: Defensive spell casting, protective barriers, counter-magic
- **Best For**: Surviving enemy assault rounds and reactive spell casting

### 🎯 Focus Stance

- **Mana Benefit**: Most spell costs are completely removed
- **Agilité Penalty**: -1 dice to Agilité-based rolls
- **Exceptions**:
  - **Non-focusable spells**: No effect from Focus stance
  - **Half-focus spells**: Mana cost reduced by half instead of eliminated
- **Best For**: Casting expensive spells or sustained magical combat

### Stance Rules and Restrictions

- **Selection Timing**: Stance can only be chosen at the beginning of your turn
- **No Multi-Stancing**: Cannot benefit from multiple stances simultaneously
- **Combat Only**: Stances are only active during combat
- **Out of Combat**: No active stance, but stance abilities can be used for roleplay actions
- **Turn Commitment**: Cannot change stance after beginning actions or during others' turns

### Stance Impact on Animations

- **Current**: Stance detection is manual
- **Future**: Visual effects may vary based on active stance
- **Animation Notes**: Consider stance when designing spell visual intensity

## 🩸 Injury System

### Injury Mechanics

- **Effect**: Each injury reduces ALL dice rolls by -1 dice
- **Duration**: Until the injury is healed through medical treatment or magic
- **Stacking**: Multiple injuries stack their penalties
- **Maximum**: 3 injuries maximum per character
- **Incapacitation**: Beyond 3 injuries = character cannot act

### Injury Sources

- **Combat Damage**: Severe attacks or critical hits
- **Environmental Hazards**: Falls, traps, exposure
- **Magic Backlash**: Failed spell casting or magical accidents
- **Situational**: GM discretion based on narrative circumstances

## 🎯 Spell Level System

### Spell Level Bonuses

- **Hit Bonus Formula**: +2 × Spell Level to attack rolls
- **Example Applications**:
  - Level 1 spell with 6 Dexterity = 6d7 + 2
  - Level 2 spell with 6 Dexterity = 6d7 + 4
  - Level 3 spell with 6 Dexterity = 6d7 + 6

### Spell Progression

- **Starting Level**: All spells begin at Level 1
- **Evolution**: Spells can evolve and increase in level over time
- **Power Scaling**: Higher level spells are more reliable but may cost more resources

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
// Using Portal for spell targeting
let crosshairs = await portal.crosshairs.show({
  size: 2,
  icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
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

_Remember: These rules serve the story and fun. When in doubt, ask the GameMaster! 🎲_
