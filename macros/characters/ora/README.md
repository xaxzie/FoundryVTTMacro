# Ora - Water Elementalist (RPG-Compliant Spells)

RPG-compliant spell animations for Ora, designed to work with the custom RPG system outlined in [GAME-RULES.md](../../../GAME-RULES.md).

## 🌊 Character Overview

**Ora** is a water elementalist specializing in versatile projectile attacks and battlefield control through elemental effects.

### Combat Characteristics

- **Primary Stat**: Esprit (used for most spell calculations)
- **Secondary Stats**: Dextérité (precision), Sens (targeting)
- **Preferred Stances**: Focus (for mana efficiency), Defensive (reactive casting)
- **Combat Role**: Ranged damage dealer with battlefield control

## 🫧 Available Spells

### Bubbles

**File**: `bubbles.js`
**Type**: Dual projectile attack / Single healing
**Mana Cost**: Stance-dependent (see Combat Stance Integration below)
**Range**: Crosshair targeting (unlimited range)

**Description**: Launches elemental projectiles that can be customized for different tactical effects or healing. **Now features automatic stance detection and stance-specific mechanics.**

**Element Options**:

- **Water**: Increases vulnerability to electrical damage (+2 next electrical attack) (2 projectiles)
- **Ice**: Reduces target movement by 1 square (2 projectiles)
- **Oil**: Increases vulnerability to fire damage (+2 next fire attack) (2 projectiles)
- **Living Water**: Heals target for 1d6 + (Esprit + bonus)/2 (1 projectile, can target self, special mana cost)

**Damage**: Each damage projectile deals `1d6 + (Esprit + bonus)/2` OR **maximized in Offensive stance**
**Healing**: Living Water heals `1d6 + (Esprit + bonus)/2` (unaffected by stance)

**Targeting**:

- **Damage variants**: 1 target (both projectiles) or 2 targets (one each)
- **Living Water**: Single target only, can target self by clicking near caster token

**Combat Stance Integration** ⚔️:

- **Focus Stance**:
  - Water/Ice/Oil variants: **FREE** (0 mana)
  - Living Water: **2 mana** (reduced cost)
  - Normal dice rolling for damage/healing
- **Offensive Stance**:
  - All variants: **4 mana**
  - Damage dice **MAXIMIZED** (6 + stat bonus per projectile)
  - Living Water unaffected (normal dice rolling)
- **Defensive Stance**:
  - All variants: **4 mana**
  - Normal dice rolling
- **No Stance**:
  - All variants: **4 mana**
  - Normal dice rolling

**RPG Integration**:

- ✅ **Automatic stance detection** from Active Effects
- ✅ **Stance-specific damage mechanics** (Offensive = maximized dice)
- ✅ **Stance-specific mana costs** (Focus = free/reduced, others = 4 mana)
- ✅ Proper damage/healing calculation display with stance indicators
- ✅ Four element options with distinct tactical effects
- ✅ Manual bonus damage input (Esprit automatically read from character sheet)
- ✅ Attack resolution: Esprit-based d7 roll with spell level bonus
- ✅ Self-targeting capability for Living Water variant
- ✅ Chat message with complete spell results and stance information
- ✅ Visual effects synchronized with game mechanics
- ✅ UI shows current stance in dialog titles and descriptions
- ⚠️ Turn validation bypassed (as per spell requirements)
- 🔄 Mana resource deduction (planned for character sheet integration)

**Required Modules**:

- Sequencer (core animation)
- JB2A (visual effects)
- Portal (crosshair/targeting - replaced previous Warp Gate usage)

**Usage Example**:

1. Select Ora's token (stance will be automatically detected)
2. Activate the Bubbles macro
3. **Stance information displayed** in dialog titles and mana cost descriptions
4. Choose element type (Water/Ice/Oil/Living Water)
5. Review stance-specific damage information (maximized in Offensive stance)
6. Enter manual damage bonus when prompted
7. Target first location (can target self for Living Water)
8. For damage variants: Choose second target or same target
9. Watch animation and check chat for results with stance information

**Special Notes**:

- **Stance Detection**: Automatically detects Focus/Offensif/Defensif from Active Effects
- **Offensive Stance**: Damage dice are maximized (6 + stat bonus), shown as "MAXIMISÉ" in results
- **Focus Stance**: Water/Ice/Oil become free, Living Water costs only 2 mana
- **Living Water**: Only healing variant, single projectile, can target self
- **Stance Display**: Current stance shown in dialog titles and chat output
- **Self-Targeting**: For Living Water, click within 1 square of your token to heal yourself
- **Damage Formula**: `1d6 + (Esprit + bonus)/2` or maximized in Offensive stance

## 🎯 RPG Compliance Features

### Turn-Based Integration

- **Combat State**: Can be adapted to check active combat
- **Turn Validation**: Framework ready (currently bypassed per requirements)
- **Initiative Order**: Compatible with Carousel Combat Track

### Character Sheet Integration

- **Damage Calculation**: Uses proper 1d6 + Esprit formula
- **Stat Dependencies**: References Esprit characteristic
- **Resource Management**: Ready for mana cost integration
- **Effect Tracking**: Element effects clearly displayed

### Game Mechanics Compliance

- **Targeting System**: Uses proper crosshair selection
- **Damage Display**: Shows formula and results in chat
- **Element Effects**: Follows RPG tactical combat rules
- **Visual Feedback**: Clear spell casting and impact animations

## 🔮 Development Notes

### Future Enhancements

- **Mana Cost Integration**: Deduct spell cost from character resources with focus stance detection
- **Turn Validation**: Add combat state checking when needed
- **Stance Integration**: Modify effects based on active combat stance
- **Duration Tracking**: Track element effect durations
- **Living Water Enhancements**: Potential over-healing mechanics or additional effects

### Technical Implementation

- **Async/Await Pattern**: Proper handling of user input and targeting
- **Error Handling**: Validates requirements and provides clear feedback
- **Sequencer Integration**: Uses proper effect timing and synchronization
- **Warp Gate Targeting**: Implements crosshair system for precise targeting

### Testing Guidelines

1. Test with different element choices
2. Verify single vs dual targeting
3. Check damage calculation accuracy
4. Validate visual effect timing
5. Confirm chat message formatting

## 🤝 Contributing Additional Spells

When adding new spells for Ora:

1. **Follow RPG Rules**: Reference [GAME-RULES.md](../../../GAME-RULES.md)
2. **Use Esprit Stat**: Primary characteristic for water magic
3. **Include Element Variations**: Water, ice, oil themes
4. **Add Chat Output**: Display damage and effects clearly
5. **Test Thoroughly**: Verify all targeting scenarios
6. **Document Effects**: Clear descriptions of tactical benefits

### Tourbillon (Vortex)

**Files**: `tourbillon.js` + `tourbillon-destroy.js`
**Type**: Area control / Battlefield manipulation
**Mana Cost**: Stance-dependent (4 mana standard, FREE in Focus stance)
**Range**: Portal targeting (150 units)

**Description**: Creates persistent water vortices that trap and damage targets while providing tactical battlefield control options.

**Vortex Configuration**:

- **Single Vortex**: 2d6 + Esprit damage when traversed (one powerful vortex)
- **Divided Vortices**: 1d6 + Esprit/2 damage each (two smaller vortices)

**Tactical Effects**:

- **Protection**: Can block piercing damage (optional choice except in Focus stance)
- **Vision Blocking**: Cuts line of sight (managed manually)
- **Escape Mechanism**: Agility roll to traverse without damage (costs movement action)
- **Persistent Duration**: Remains until destroyed or traversed

**Combat Stance Integration** ⚔️:

- **Focus Stance**: FREE mana cost, protection ALWAYS active (no choice)
- **Offensive Stance**: 4 mana, damage dice MAXIMIZED
- **Defensive/No Stance**: 4 mana, normal mechanics, protection optional

**Damage Application**:
Applied immediately on cast (simulates movement through vortex). Use `tourbillon-destroy.js` to handle traversal/destruction mechanics.

**Management System**:

- **Creation**: `tourbillon.js` - Creates persistent vortex effects
- **Destruction**: `tourbillon-destroy.js` - Handles traversal, destruction, and Agility rolls
- **Visual Persistence**: Effects remain active until manually removed

**RPG Integration**:

- ✅ **Automatic stance detection** with stance-specific mechanics
- ✅ **Portal targeting system** for precise placement
- ✅ **Persistent Sequencer effects** with unique identifiers
- ✅ **Comprehensive destruction mechanics** with Agility roll system
- ✅ **Professional chat output** with tactical information
- ✅ **Stance-specific protection rules** (Focus always blocks, others optional)
- ✅ **Injury-adjusted stat calculations** for Esprit and Agility

**Required Modules**:

- Sequencer (persistent effects)
- JB2A (vortex visuals)
- Portal (targeting system)

**Usage Workflow**:

1. **Creation**: Run `tourbillon.js`, configure vortex type and protection, target positions
2. **Management**: Vortices persist and provide tactical effects as described
3. **Destruction**: Run `tourbillon-destroy.js`, click near vortex, choose destruction method
4. **Traversal**: Use Agility rolls through destruction macro for escape attempts

### Spell Ideas for Future Development

- **Water Shield**: Defensive barrier with damage reduction
- **Ice Shards**: Area effect with slowing properties
- **Oil Slick**: Ground effect creating fire vulnerability zone
- **Tidal Wave**: Line attack affecting multiple targets
- **Freezing Mist**: Area denial with movement restriction
- **Healing Spring**: Area healing over time (upgrade to Living Water concept)
- **Elemental Burst**: Combination spell using multiple elements

---

_Harness the power of water, ice, and oil to control the battlefield! 🌊_
