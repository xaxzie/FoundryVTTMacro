# Contributing to FoundryVTT Spell Animation Collection

Welcome to our custom RPG spell animation project! This guide will help you contribute effectively to our specialized FoundryVTT macro collection.

## 🎯 Project Scope and Focus

### What This Project Is
- **Spell Animation Collection**: Visual effects for spells in a custom RPG system
- **FoundryVTT Integration**: Macros using Sequencer, JB2A, and other modules
- **Custom RPG System**: Designed for specific turn-based combat mechanics
- **GameMaster-Driven**: All rules subject to GameMaster interpretation

### What This Project Is NOT
- ❌ Generic D&D 5e or Pathfinder spell collection
- ❌ Complete automation system (no dice rolling/damage calculation)
- ❌ Standalone RPG system implementation
- ❌ Tutorial collection for learning Sequencer basics

## 🎲 Understanding the RPG Context

### Required Reading
Before contributing, you **MUST** read and understand:
1. **[GAME-RULES.md](./GAME-RULES.md)**: Complete RPG mechanics and rules
2. **[README.md](./README.md)**: Project overview and technical requirements
3. **Character documentation** in `/macros/characters/` for specific spell contexts

### Key RPG Mechanics to Consider
- **Turn-based combat** with Carousel Combat Track integration
- **6-stat system**: Force, Dexterité, Agilité, Esprit, Sens, Volonté, Charisme
- **3-stance combat**: Offensive, Defensive, Focus modes
- **D7 dice system** for attack/defense resolution
- **Mana-based spellcasting** with stance-dependent costs

## 👨‍⚔️ GameMaster Authority

### The Golden Rule
> **When in doubt, ask the GameMaster.** All rules are subject to GameMaster interpretation.

### GameMaster Consultation Required For:
- 🆕 **New spell concepts** not yet defined in the system
- ❓ **Rule interpretation** questions or conflicts
- 🎨 **Visual design decisions** for spell effects
- ⚖️ **Balance concerns** about spell power or utility
- 🔧 **Automation level** decisions (how much should be automated)

### How to Consult the GameMaster
1. **Create an issue** with `[GameMaster Review]` tag
2. **Provide context**: Describe the spell, situation, or rule question
3. **Offer options**: Suggest 2-3 possible interpretations if applicable
4. **Wait for approval** before implementing major changes

## 🚀 Getting Started

### Prerequisites
1. **FoundryVTT Experience**: Familiar with basic macro creation
2. **Sequencer Knowledge**: Understanding of Sequencer API basics
3. **Module Setup**: All required modules installed and working
4. **RPG Understanding**: Read and understood the custom RPG rules

### Development Environment Setup
```bash
# 1. Fork the repository
git fork https://github.com/xaxzie/FoundryVTTMacro

# 2. Clone your fork
git clone https://github.com/yourusername/FoundryVTTMacro
cd FoundryVTTMacro

# 3. Create a feature branch
git checkout -b feature/new-spell-animation

# 4. Install FoundryVTT modules (see installation guide)
# - Sequencer
# - JB2A
# - Warp Gate  
# - Carousel Combat Track
```

## 📝 Contribution Types

### ✅ Welcome Contributions

#### **New Spell Animations**
- Spells that fit the custom RPG mechanics
- Effects that work with the 6-stat system
- Animations compatible with stance modes
- Spells that enhance tactical combat flow

#### **Improvements to Existing Spells**
- Performance optimizations
- Visual enhancements
- Better RPG integration
- Bug fixes and error handling

#### **Documentation Updates**
- Clarifications to spell descriptions
- Additional usage examples
- Character-specific spell guides
- Technical troubleshooting information

#### **Utility Functions**
- Helper functions for common spell patterns
- RPG integration utilities
- Targeting system improvements
- Turn validation helpers

### ❌ Contributions We Cannot Accept

#### **Off-System Content**
- Generic D&D 5e spells without RPG adaptation
- Pathfinder-specific mechanics
- Effects that contradict established RPG rules
- Non-spell animations (general effects, environmental, etc.)

#### **Automation Overreach**
- Dice rolling implementations
- Damage calculation systems
- Automatic mana deduction
- Turn order management (handled by Carousel Combat Track)

#### **Rule Changes**
- Modifications to core RPG mechanics
- New stats or characteristics
- Combat system changes
- Stance system modifications

## 📋 Contribution Process

### 1. Planning Phase

#### For New Spells:
1. **Check existing spells** to avoid duplication
2. **Consult [GAME-RULES.md](./GAME-RULES.md)** for mechanics compatibility
3. **Create an issue** describing the proposed spell:
   - Spell name and description
   - Associated characteristic (Force, Dexterité, etc.)
   - Intended stance interactions
   - Visual concept description
4. **Wait for GameMaster feedback** before implementation

#### For Improvements:
1. **Identify the specific issue** or enhancement opportunity
2. **Test current behavior** to understand the problem
3. **Propose solution** in an issue with clear before/after description

### 2. Development Phase

#### Code Standards
```javascript
// ✅ Good: Clear, commented spell animation
/**
 * Frost Bolt Spell Animation
 * Associated Stat: Esprit (mental focus for ice magic)
 * Stance Compatibility: All stances (visual intensity may vary)
 * Target Type: Single target with crosshair selection
 */
new Sequence()
    .effect()
        .file("jb2a.ice_shard.01.blue")
        .atLocation(token)
        .stretchTo(target)
        .scale(1.2)
        .waitUntilFinished(-200)
    .effect()
        .file("jb2a.impact.ice.blue")
        .atLocation(target)
        .scale(0.8)
    .sound()
        .file("assets/sounds/ice-spell.wav")
        .volume(0.4)
    .play();
```

```javascript
// ❌ Bad: No context, includes dice rolling
let damage = rollDice("2d6"); // DON'T DO THIS
target.actor.update({"system.health.value": newHealth}); // DON'T DO THIS
```

#### File Organization
```
macros/
├── basic/           # Simple, single-effect spells
├── intermediate/    # Multi-step spell sequences  
├── advanced/        # Complex targeting and interactions
├── spells/          # Generic spell effects
├── characters/      # Character-specific spell sets
│   ├── ora/         # Water/ice specialist
│   └── moctei/      # Shadow specialist
└── utilities/       # Helper functions
```

#### Naming Conventions
- **File names**: `kebab-case.js` (e.g., `frost-bolt.js`)
- **Function names**: `camelCase` (e.g., `castFrostBolt()`)
- **Comments**: Clear spell description and RPG context
- **Variables**: Descriptive names (`spellTarget` not `t`)

### 3. Testing Phase

#### Required Testing
- ✅ **Single target**: Test with one selected token
- ✅ **Multiple targets**: Test targeting system with several tokens
- ✅ **No targets**: Test error handling when no targets selected
- ✅ **Turn validation**: Test during and outside of combat turns
- ✅ **Module dependencies**: Test with minimal required modules only
- ✅ **Performance**: Test with multiple spell casts in sequence

#### Testing Checklist
```markdown
- [ ] Spell animation plays correctly
- [ ] Audio syncs with visual effects
- [ ] Targeting system works as expected
- [ ] No console errors or warnings
- [ ] Compatible with all required modules
- [ ] Performance acceptable with multiple casts
- [ ] Error handling graceful for edge cases
- [ ] Documentation clear and complete
```

### 4. Documentation Phase

#### Required Documentation
1. **File header comment**: Spell description and RPG context
2. **Inline comments**: Explain complex sequences or RPG-specific logic
3. **Character README**: Update if adding character-specific spells
4. **Usage examples**: Include in file or character documentation

#### Documentation Template
```javascript
/**
 * [SPELL NAME] - [CHARACTER/GENERIC]
 * 
 * Description: [What the spell does visually and in RPG context]
 * Associated Stat: [Which of the 6 stats this spell uses]
 * Stance Compatibility: [How different stances affect this spell]
 * Target Type: [Single, Multiple, Area, Self, etc.]
 * 
 * Requirements:
 * - Sequencer module
 * - JB2A effects
 * - [Any other specific requirements]
 * 
 * Usage:
 * 1. Select caster token
 * 2. Target enemy/area (if applicable)
 * 3. Execute macro
 * 
 * RPG Notes:
 * - [Any special interactions with RPG mechanics]
 * - [Stance-specific behaviors]
 * - [Integration notes]
 */
```

### 5. Review Process

#### Pull Request Requirements
1. **Clear title**: `Add [Spell Name] animation for [Character/Generic]`
2. **Description**: 
   - What spell is being added/modified
   - RPG context and mechanics
   - Testing performed
   - Screenshots/videos if applicable
3. **Linked issues**: Reference any related issues or GameMaster consultations
4. **Self-review**: Review your own code before submitting

#### Review Criteria
- ✅ **RPG Compatibility**: Fits established game mechanics
- ✅ **Code Quality**: Clean, commented, follows conventions
- ✅ **Performance**: Efficient and responsive
- ✅ **Documentation**: Clear and complete
- ✅ **Testing**: Thoroughly tested
- ✅ **GameMaster Approval**: If required, GameMaster has approved

### 6. Merge and Maintenance

#### After Merge
- 🎉 **Celebration**: Your spell is now part of the collection!
- 📝 **Update tracking**: Add spell to character guides or main documentation
- 🐛 **Bug monitoring**: Watch for issues and be ready to fix problems
- 💬 **Community feedback**: Respond to user questions or suggestions

## 🛠️ Development Best Practices

### Animation Design Guidelines

#### Visual Consistency
- **Style**: Match existing JB2A aesthetic
- **Scale**: Use consistent sizing (0.8-1.5 scale range typically)
- **Timing**: Coordinate with turn-based combat flow
- **Colors**: Consider character themes and spell schools

#### Performance Optimization
- **Asset Management**: Use efficient file formats and sizes
- **Effect Cleanup**: Remove persistent effects when appropriate
- **Memory Usage**: Avoid creating memory leaks with persistent sequences
- **Network Efficiency**: Consider multiplayer performance impact

#### RPG Integration
- **Turn Validation**: Check if it's the appropriate player's turn
- **Resource Awareness**: Display mana costs (even if not automated)
- **Stance Consideration**: Design for different combat stances
- **Character Context**: Fit character themes and specializations

### Code Quality Standards

#### Error Handling
```javascript
// ✅ Good error handling
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a token to cast from.");
    return;
}

if (!game.user.targets.size) {
    ui.notifications.warn("Please target an enemy for this spell.");
    return;
}

// Check if required modules are available
if (typeof Sequencer === "undefined") {
    ui.notifications.error("Sequencer module required for spell animations.");
    return;
}
```

#### Modularity and Reusability
```javascript
// ✅ Good: Reusable helper functions
async function getSpellTarget() {
    const crosshairs = await warpgate.crosshairs.show({
        size: 1,
        icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
    });
    
    if (crosshairs.cancelled) return null;
    return crosshairs;
}

// ✅ Good: Configurable spell effects
function playFireSpell(caster, target, intensity = 1.0) {
    new Sequence()
        .effect()
            .file("jb2a.fire_bolt.orange")
            .atLocation(caster)
            .stretchTo(target)
            .scale(intensity)
        .play();
}
```

## 🔍 Quality Assurance

### Code Review Checklist

#### Functionality
- [ ] Spell animation works as intended
- [ ] All dependencies are properly checked
- [ ] Error handling covers edge cases
- [ ] Performance is acceptable

#### RPG Integration
- [ ] Follows established game mechanics
- [ ] Appropriate for character/situation
- [ ] Compatible with combat flow
- [ ] Doesn't implement forbidden automation

#### Code Quality
- [ ] Clear, readable code structure
- [ ] Comprehensive comments and documentation
- [ ] Follows naming conventions
- [ ] No debugging code left in

#### Testing
- [ ] Tested in multiple scenarios
- [ ] Verified module compatibility
- [ ] Performance tested
- [ ] Error cases handled gracefully

## 📞 Getting Help

### Resources
- **[GAME-RULES.md](./GAME-RULES.md)**: Complete RPG mechanics reference
- **[docs/sequencer-reference.md](./docs/sequencer-reference.md)**: Sequencer API guide
- **[docs/best-practices.md](./docs/best-practices.md)**: RPG-specific animation guidelines
- **Character READMEs**: Detailed spell context for Ora and Moctei

### Communication Channels
1. **GitHub Issues**: For bugs, feature requests, and GameMaster consultations
2. **Pull Request Comments**: For code review discussions
3. **Documentation**: Check existing docs before asking questions

### Common Questions

#### "Can I add a spell that automatically rolls dice?"
No. This project focuses on visual animations only. Dice rolling should be handled externally.

#### "How do I know if my spell fits the RPG system?"
Read [GAME-RULES.md](./GAME-RULES.md) and consult the GameMaster if unsure.

#### "Can I port D&D 5e spells directly?"
Only if they're adapted to fit the custom RPG mechanics. Direct ports usually don't work.

#### "What if I want to change the core combat rules?"
Rule changes require GameMaster approval and are generally discouraged.

---

Thank you for contributing to our custom RPG spell animation collection! Together we'll create an amazing visual experience for our unique game system. 🎲⚡

*May your code be bug-free and your animations spectacular!*