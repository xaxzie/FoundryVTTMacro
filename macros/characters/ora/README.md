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
**Type**: Dual projectile attack  
**Mana Cost**: Variable (to be integrated with character sheet)  
**Range**: Crosshair targeting (unlimited range)

**Description**: Launches two identical elemental projectiles that can be customized for different tactical effects.

**Element Options**:
- **Water**: Reduces target movement by 1 square
- **Ice**: Increases vulnerability to electrical damage (+2 next electrical attack)
- **Oil**: Increases vulnerability to fire damage (+2 next fire attack)

**Damage**: Each projectile deals `1d6 + Esprit + manual bonus`

**Targeting**:
- 1 target: Both projectiles hit the same target
- 2 targets: One projectile per target

**RPG Integration**:
- ✅ Proper damage calculation display
- ✅ Element selection with tactical effects
- ✅ Manual bonus damage input
- ✅ Chat message with full spell results
- ✅ Visual effects synchronized with game mechanics
- ⚠️ Turn validation bypassed (as per spell requirements)
- 🔄 Mana cost integration (planned for character sheet integration)

**Required Modules**:
- Sequencer (core animation)
- JB2A (visual effects)
- Warp Gate (crosshair targeting)

**Usage Example**:
1. Select Ora's token
2. Activate the Bubbles macro
3. Choose element type (Water/Ice/Oil)
4. Set manual damage bonus
5. Target first location
6. Choose second target or same target
7. Watch animation and check chat for results

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
- **Automatic Esprit Detection**: Read stat from character sheet
- **Mana Cost Integration**: Deduct spell cost from character resources  
- **Turn Validation**: Add combat state checking when needed
- **Stance Integration**: Modify effects based on active combat stance
- **Duration Tracking**: Track element effect durations

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

### Spell Ideas for Future Development
- **Water Shield**: Defensive barrier with damage reduction
- **Ice Shards**: Area effect with slowing properties
- **Oil Slick**: Ground effect creating fire vulnerability zone
- **Tidal Wave**: Line attack affecting multiple targets
- **Freezing Mist**: Area denial with movement restriction

---

*Harness the power of water, ice, and oil to control the battlefield! 🌊*