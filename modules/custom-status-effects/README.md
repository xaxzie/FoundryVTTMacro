# Custom Status Effects Override

This module enables persistent customization of Foundry VTT status effects by registering `core.statusEffects` as a world setting and applying a saved array into `CONFIG.statusEffects` on world load.

## What it does

- Registers `core.statusEffects` as a world-scoped setting during Foundry initialization
- Uses Foundry's built-in defaults as the initial value
- Applies saved status effects when the world loads
- Updates `CONFIG.statusEffects` whenever the setting changes and refreshes the Token HUD

## Installation

1. Copy this folder into your Foundry `Data/modules/` directory (or commit and deploy from git)
2. Start Foundry and open **Game Settings → Manage Modules**
3. Enable **Custom Status Effects Override** and save
4. Reload the world (Foundry will apply the saved status-effects array on ready)

## Using with the Status Effects Manager macro

This repository includes a small macro that helps you inspect and edit status-effect entries:

- Macro location (in this repo): `macros/utilities/updateIcons.js`
- Purpose: list current status effects, add/edit/delete entries, and export the array to the console

Recommended workflow:

1. Enable this module as above so `core.statusEffects` is registered and persisted.
2. Run the Status Effects Manager macro (`updateIcons.js`) as a GM.
3. Use Add/Edit/Delete to customize entries. When the macro saves, the module will persist the changes to the world setting.
4. Restart Foundry to verify the changes persist.

Notes about the macro behavior

- If the module is disabled or `core.statusEffects` is not registered, the macro will update `CONFIG.statusEffects` in memory only (changes lost on restart).
- When the module is enabled the macro will save to the registered `core.statusEffects` world setting so changes persist across restarts.

## Troubleshooting

- If the module does not appear in the list, verify the folder is at `Data/modules/custom-status-effects` and that `module.json` is present and valid.
- If your changes do not persist after restart:
	- Ensure the module is enabled and you saved the world settings.
	- Check the browser console for messages from `Custom Status Effects Override | ...` (init/ready messages).
	- Confirm the macro reports "Saved status effects to world settings." when you save edits.
- If another module or system re-adds effects, inspect `CONFIG.statusEffects` on ready to determine the source and adjust load order or disable the conflicting package.

## Removal

To remove the module:

1. Disable it in Foundry's module management
2. Delete the `custom-status-effects` folder from `Data/modules`
3. Status effects will revert to Foundry defaults on next restart

## Technical Details

- Registers `core.statusEffects` with scope `world`, type `Array` and `config: false` (hidden in the Settings UI)
- Provides an `onChange` callback that sets `CONFIG.statusEffects` and calls `Hooks.callAll('renderTokenHUD')`
- The module is intentionally minimal so the `updateIcons.js` macro remains the manager UI for editing the array

## Where this repo stores the module

If you want to track the module in git, this repository contains a copy under `modules/custom-status-effects/`. Copy that folder into Foundry's `Data/modules/` or deploy from git to use the module in your local Foundry instance.

---

If you want, I can add a small Settings menu (FormApplication) to let you edit the array from within Foundry without using the macro, or I can add a sample exported JSON file to source-control your preferred default list. Which would you prefer?
