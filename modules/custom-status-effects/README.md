# Custom Status Effects Override

This module enables persistent customization of Foundry VTT status effects by registering `core.statusEffects` as a world setting.

## What it does

- Registers `core.statusEffects` as a world-scoped setting during Foundry initialization
- Uses Foundry's built-in defaults as the initial value
- Applies saved status effects when the world loads
- Enables your Status Effects Manager macro to persistently save changes

## Installation

1. Place this folder in your `Data/modules/` directory
2. Enable the module in Foundry's module management
3. Use your existing Status Effects Manager macro to customize effects
4. Changes will now persist across server restarts

## How it works

- **On Initialization**: Registers the setting with current defaults
- **On World Ready**: Applies any saved custom status effects
- **On Changes**: Updates the runtime CONFIG and refreshes Token HUDs

## Compatibility

- Foundry VTT v12+ (tested on v13)
- Works with any game system
- Safe to use with other modules

## Usage

1. Enable this module
2. Run your Status Effects Manager macro
3. Add, edit, or delete status effects as needed
4. Changes are automatically saved to world settings
5. Status effects persist across server restarts

## Removal

To remove the module:
1. Disable it in Foundry's module management
2. Delete the module folder
3. Status effects will revert to Foundry defaults on next restart

## Technical Details

- Registers `core.statusEffects` with scope `world`, type `Array`
- Hidden from settings UI (`config: false`) - managed via macro
- Includes `onChange` callback to update CONFIG and refresh HUDs
- Console logging for debugging and verification
