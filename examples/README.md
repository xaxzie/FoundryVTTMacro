# Example Spell Animations

This directory contains spell animation examples that demonstrate various Sequencer techniques but **do not comply with the custom RPG rules** outlined in [GAME-RULES.md](../GAME-RULES.md).

## ⚠️ Important Notice

**These are EXAMPLES only** - not for use in the actual RPG system!

The spell animations in this folder were created before the custom RPG rules were fully established and do not follow the proper game mechanics such as:

- ❌ **Missing turn validation** - No checking if it's the caster's turn
- ❌ **No mana cost integration** - Don't interact with character sheet resources  
- ❌ **Incorrect stat usage** - May reference wrong characteristics for spells
- ❌ **Missing stance awareness** - Don't account for Offensive/Defensive/Focus stances
- ❌ **No combat state checking** - Don't verify active combat status
- ❌ **Non-compliant targeting** - May not follow proper RPG targeting rules

## 📚 Educational Value

These examples are valuable for learning:

✅ **Sequencer animation techniques**  
✅ **JB2A effect combinations**  
✅ **Warp Gate targeting patterns**  
✅ **Multi-step spell sequences**  
✅ **Audio-visual synchronization**  

## 🎯 Usage Guidelines

### For Learning Purposes:
- Study the animation techniques and visual effects
- Understand how complex sequences are built
- Learn about timing and effect coordination
- See examples of crosshair targeting implementation

### For RPG Development:
- **DO NOT** copy these directly into the RPG system
- **DO** use them as inspiration for proper RPG-compliant spells
- **ALWAYS** add proper turn validation before adapting any techniques
- **REMEMBER** to integrate with character sheet resources and combat states

## 📁 Contents

### 🌊 **Ora Character Examples** (`/characters/ora/`)
Water and ice-themed spell animations that demonstrate:
- Multi-target area effects (Blizzard)
- Precise projectile targeting (Frost Bolt)  
- Defensive barrier creation (Ice Wall)
- Continuous healing effects (Healing Spring)
- Line attack patterns (Water Whip)

### 🌑 **Moctei Character Examples** (`/characters/moctei/`)
Shadow and darkness-themed spell animations that show:
- Life-draining projectiles (Shadow Bolt)
- Area denial effects (Darkness Cloud)
- Teleportation mechanics (Shadow Step)
- Enhanced melee attacks (Umbral Strike)
- Complex crowd control (Void Prison)

## 🔄 Converting Examples to RPG-Compliant Spells

To adapt these examples for the actual RPG system:

1. **Add Turn Validation**:
   ```javascript
   // Add this at the start of every spell
   if (!validateSpellCasting(token, "Spell Name")) return;
   ```

2. **Integrate Combat State Checking**:
   ```javascript
   // Verify combat is active for combat spells
   if (!game.combat?.started) {
       ui.notifications.warn("Combat must be active for this spell");
       return;
   }
   ```

3. **Add Mana Cost Integration**:
   ```javascript
   // Check and deduct mana from character sheet
   let actor = token.actor;
   let currentMana = actor.system.resources.power.value;
   let spellCost = 3; // Example cost
   
   if (currentMana < spellCost) {
       ui.notifications.warn("Insufficient mana");
       return;
   }
   ```

4. **Follow Stat Requirements**:
   - Ensure spells use the correct characteristic from the 7-stat system
   - Reference [GAME-RULES.md](../GAME-RULES.md) for proper stat associations

5. **Add Stance Awareness**:
   - Consider how the spell should behave in different combat stances
   - Plan for future stance detection automation

## 🤝 Contributing RPG-Compliant Versions

If you create RPG-compliant versions of these spells:

1. Place them in the appropriate `/macros/` category folder
2. Follow the [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
3. **Consult the GameMaster** for rule interpretation
4. Include proper documentation and RPG integration
5. Test with the full combat system and turn validation

---

*These examples show what's possible with Sequencer - now let's make them work with our custom RPG! 🎲*