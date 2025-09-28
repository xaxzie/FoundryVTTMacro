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
**Mana Cost**: 4 mana (focusable - free in Focus stance, except Living Water)
**Range**: Crosshair targeting (unlimited range)

**Description**: Launches elemental projectiles that can be customized for different tactical effects or healing.

**Element Options**:
- **Water**: Reduces target movement by 1 square (2 projectiles)
- **Ice**: Increases vulnerability to electrical damage (+2 next electrical attack) (2 projectiles)
- **Oil**: Increases vulnerability to fire damage (+2 next fire attack) (2 projectiles)
- **Living Water**: Heals target for 1d6 + (Esprit + bonus)/2 (1 projectile, can target self, NOT focusable - always costs 4 mana)

**Damage**: Each damage projectile deals `1d6 + (Esprit + bonus)/2`
**Healing**: Living Water heals `1d6 + (Esprit + bonus)/2`

**Targeting**:
- **Damage variants**: 1 target (both projectiles) or 2 targets (one each)
- **Living Water**: Single target only, can target self by clicking near caster token

**Focus Mechanics**:
- **Water/Ice/Oil**: Focusable (free mana cost in Focus stance)
- **Living Water**: NOT focusable (always costs 4 mana regardless of stance)

**RPG Integration**:
- ✅ Proper damage/healing calculation display
- ✅ Four element options with distinct tactical effects
- ✅ Manual bonus damage input (Esprit is now automatically read from the character sheet)
- ✅ Attack resolution added: Esprit-based d7 roll with spell level bonus
- ✅ Focus stance mechanics (free cost for 3 variants, Living Water exception)
- ✅ Self-targeting capability for Living Water variant
- ✅ Chat message with complete spell results (including attack roll details)
- ✅ Visual effects synchronized with game mechanics
- ⚠️ Turn validation bypassed (as per spell requirements)
- 🔄 Mana cost integration (planned for character sheet integration)

**Required Modules**:
- Sequencer (core animation)
- JB2A (visual effects)
- Portal (crosshair/targeting - replaced previous Warp Gate usage)

**Usage Example**:
1. Select Ora's token
2. Activate the Bubbles macro
3. Choose element type (Water/Ice/Oil/Living Water)
4. Spell reads Esprit automatically from the selected token's character sheet; enter spell level and manual damage bonus when prompted
5. Target first location (can target self for Living Water)
6. For damage variants: Choose second target or same target
7. Watch animation and check chat for results (an attack-resolution message will appear for damage variants)

**Special Notes**:
- **Living Water**: Only healing variant, single projectile, can target self, not affected by Focus stance
- **Focus Stance**: Water/Ice/Oil variants become free in Focus stance
- **Self-Targeting**: For Living Water, click within 1 square of your token to heal yourself
- **Damage Formula**: Corrected to `1d6 + (Esprit + bonus)/2` for all variants

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

### Spell Ideas for Future Development
- **Water Shield**: Defensive barrier with damage reduction
- **Ice Shards**: Area effect with slowing properties
- **Oil Slick**: Ground effect creating fire vulnerability zone
- **Tidal Wave**: Line attack affecting multiple targets
- **Freezing Mist**: Area denial with movement restriction
- **Healing Spring**: Area healing over time (upgrade to Living Water concept)
- **Elemental Burst**: Combination spell using multiple elements

---

*Harness the power of water, ice, and oil to control the battlefield! 🌊*
