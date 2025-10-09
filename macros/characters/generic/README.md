# Generic Character Macros

This folder contains macros that can be used by any player character, regardless of their specific role or class.

## Available Macros

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

## Installation

These macros are designed to work with the existing utility system. They automatically import the necessary validation and stat retrieval functions.

## Contributing

When adding new generic macros to this folder:

1. Ensure they work for any character type
2. Use the existing utility functions for consistency
3. Include proper error handling and user feedback
4. Update this README with macro descriptions
