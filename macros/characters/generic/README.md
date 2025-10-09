# Generic Character Macros

This folder contains macros and templates that can be used by any player character, regardless of their specific role or class. It includes both ready-to-use macros and comprehensive templates for creating character-specific systems.

## 🎮 Ready-to-Use Macros

### 🎲 `roll-characteristic.js`

**Purpose**: Allows any player to roll a characteristic check for their selected token.

**Features**:

- Interactive characteristic selection dialog with visual layout
- Automatic token validation
- Retrieves character stats from the selected token
- Shows base stat, injury adjustments, and active effect bonuses
- Bonus system for extra dice and flat modifiers
- Uses the proper d7 dice system from game rules
- Enhanced chat display with detailed breakdown

**Requirements**:

- Character must have characteristics set up (use the Character Stats Setup utility if needed)
- Token must be selected before running the macro

**Characteristics Available**:

- **Physique** (Physical Strength)
- **Dextérité** (Dexterity/Skill)
- **Agilité** (Agility/Speed/Reflexes)
- **Esprit** (Mind/Concentration)
- **Sens** (Senses/Perception)
- **Volonté** (Will/Determination)
- **Charisme** (Charisma/Social Understanding)

### ⚡ `complete-spell-template.js`

**Purpose**: Complete spell casting system template with all advanced mechanics.

**Features**:

- **Comprehensive spell system** with mana cost management
- **Advanced targeting** (single, multiple, area of effect)
- **Token Magic FX integration** (transformations, filters, persistent effects)
- **Sequencer animations** (casting, impact, persistent effects)
- **Active Effect management** with CONFIG.statusEffects integration
- **Damage calculation system** with resistance/vulnerability
- **Status counter integration** for stackable effects
- **Spell enhancement system** (power levels, metamagic)
- **Template targeting** with distance validation
- **Interactive UI** with spell selection and configuration
- **Chat integration** with detailed spell results
- **Error handling** and validation systems

**Advanced Mechanics**:

- Mana cost (fixed or per-turn)
- Effect stacking and counters
- Token transformations with polymorph filters
- Persistent animations with cleanup
- Multi-target processing
- Resistance/immunity checking
- Template-based area targeting
- Dynamic damage scaling

## 🛠️ Character Development Templates

### 🎯 `HandleGenericEffect.js`

**Purpose**: Comprehensive template for character-specific effect handlers.

**Key Features**:

- **All advanced mechanics** from existing character handlers
- **Token Magic FX integration** (transformations, filters, animations)
- **Sequencer support** (persistent effects, cleanup, attachments)
- **Increasable effects** with counter management
- **External effect detection** and removal
- **Mana cost system** (one-time and per-turn)
- **Dynamic status counters** with custom values
- **Advanced UI** with resizable dialogs and consistent styling
- **Effect categories** and organization
- **Comprehensive error handling**

**Advanced Effect Types**:

- **Transformations**: Polymorph filters with transition effects
- **Persistent Animations**: Sequencer effects with name-based management
- **Token Filters**: Shadow, electric, and custom visual effects
- **Increasable Effects**: Counter-based effects with UI controls
- **Mana Effects**: Cost tracking and validation
- **Status Counters**: Dynamic and fixed counter values

**Usage**: Copy to character folder, rename to `Handle[Character]Effect.js`, and configure EFFECT_CONFIG with character-specific effects.

### 🔚 `EndGenericEffect.js`

**Purpose**: Comprehensive template for ending character effects with advanced cleanup.

**Key Features**:

- **Multiple effect mechanics** (simple, linked, bidirectional, counter, transformation)
- **Cascade removal** for complex linked effects
- **Bidirectional cleanup** (target ↔ caster effect pairs)
- **Counter management** (decreasing main counters when effects are removed)
- **Token Magic FX cleanup** for transformation effects
- **Sequencer animation cleanup** with persistent effect management
- **GM delegation** for effect removal permissions
- **Custom liberation animations** per effect type
- **Comprehensive UI** with effect categorization
- **Detailed feedback** with chat messages and notifications

**Effect Mechanics Supported**:

1. **Simple Effects**: Direct removal
2. **Linked Effects**: 1 effect → removes multiple linked effects (cascade)
3. **Bidirectional Effects**: Effect on target ↔ corresponding effect on caster
4. **Counter Effects**: Removal decreases main counter on caster
5. **Transformation Effects**: Token Magic FX filter cleanup + reversal animations

**Advanced Cleanup**:

- Sequencer persistent animations by name
- Token Magic FX polymorph/filter removal
- Complex flag-based effect detection
- Multi-target effect management
- Error handling with detailed feedback

**Usage**: Copy to character folder, rename to `end[Character]Effect.js`, and configure EFFECT_CONFIG with character's effects and their specific mechanics.

## 📋 Template Usage Guide

### For Character Effect Handlers

1. **Copy HandleGenericEffect.js** to your character folder
2. **Rename** to `Handle[Character]Effect.js`
3. **Configure CHARACTER_CONFIG** with character details
4. **Set up EFFECT_CONFIG** with your character's specific effects
5. **Test and adjust** animations, mana costs, and mechanics

### For End Effect Handlers

1. **Copy EndGenericEffect.js** to your character folder
2. **Rename** to `end[Character]Effect.js`
3. **Configure CHARACTER_CONFIG** with character branding
4. **Set up EFFECT_CONFIG** with effect types and cleanup mechanics
5. **Define mechanicType** for each effect (simple, linked, bidirectional, counter, transformation)
6. **Test cascade removal** and cleanup systems

### Character Integration

Both templates are designed to work together:

- **HandleGenericEffect.js** creates and manages effects
- **EndGenericEffect.js** provides comprehensive cleanup
- **Shared configuration patterns** for consistency
- **Compatible flag systems** for effect detection

## 🔧 Technical Requirements

- **FoundryVTT v13+**: ActiveEffect system, CONFIG.statusEffects integration
- **Token Magic FX**: Visual effects, transformations, filters
- **Sequencer**: Animations, persistent effects, cleanup
- **GM Socket**: Effect management delegation (via custom-status-effects module)
- **JB2A Assets**: Animation files (recommended)

## 🎨 Customization

All templates are highly customizable:

- **Visual styling** through CSS classes and colors
- **Animation systems** with custom file paths and configurations
- **UI layouts** with resizable dialogs and organized sections
- **Effect mechanics** through modular configuration systems
- **Chat messaging** with character-specific branding

## 📚 Integration with Existing Systems

These templates integrate with:

- **Utility macros** in `../utilities/` folder
- **Asset management** systems for animations and sounds
- **Character stat systems** for damage and effect calculations
- **Status effect management** through CONFIG integration
- **Permission systems** via GM delegation

## 🚀 Installation and Setup

1. **Generic macros** (roll-characteristic, complete-spell-template) can be used directly
2. **Template files** should be copied and customized per character
3. **Dependencies** should be installed and configured
4. **Asset paths** should be verified for animations and effects
5. **Test thoroughly** with your specific character configurations

## 🤝 Contributing

When adding new generic macros or improving templates:

1. **Ensure compatibility** with all character types
2. **Use existing utility functions** for consistency
3. **Include comprehensive error handling** and user feedback
4. **Document all configuration options** and mechanics
5. **Test with multiple characters** and edge cases
6. **Update this README** with new features and macros
7. **Follow established patterns** for UI, animations, and chat integration

## 📖 Documentation

- Inline documentation in all template files
- Configuration examples within each template
- Error handling guides and debugging information
- Integration examples with existing character systems
