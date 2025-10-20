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

## GM Socket helpers (apply/update/remove effects)

This module registers a small set of GM-side socket handlers (via SocketLib) to let player-run macros request that a GM create, update, or remove Active Effects on tokens. The handlers now require `tokenId` instead of `actorId` for better precision and compatibility.

Handlers registered by the module (available after `Hooks.once("socketlib.ready", registerGMSocket)` runs):

- `applyEffectToToken(tokenId, effectData)`

  - **Purpose:** Create a new ActiveEffect on the token with id `tokenId`.
  - **Returns:** `{ success: true, effects: [createdEffect] }` on success, or `{ success: false, error: "..." }`.
  - **Example (player macro):**
    ```js
    if (!globalThis.gmSocket) throw new Error("GM socket not available");
    const result = await globalThis.gmSocket.executeAsGM(
      "applyEffectToToken",
      targetTokenId,
      effectData
    );
    if (!result.success)
      ui.notifications.error(result.error || "Failed to apply effect");
    ```

- `updateEffectOnToken(tokenId, effectId, updateData)`

  - **Purpose:** Update an existing ActiveEffect (identified by `effectId`) on the given token.
  - **Returns:** `{ success: true }` on success or `{ success: false, error: '...' }` on failure.
  - **Example (player macro):**
    ```js
    const res = await globalThis.gmSocket.executeAsGM(
      "updateEffectOnToken",
      targetTokenId,
      effectId,
      { "flags.statuscounter.value": 2 }
    );
    if (!res.success) console.error(res.error);
    ```

- `removeEffectFromToken(tokenId, effectId)`
  - **Purpose:** Delete an ActiveEffect from a token.
  - **Returns:** `{ success: true }` or `{ success: false, error: '...' }`.
  - **Example (player macro):**
    ```js
    await globalThis.gmSocket.executeAsGM(
      "removeEffectFromToken",
      targetTokenId,
      effectId
    );
    ```

### Notes and Best Practices

- The module exposes the SocketLib `gmSocket` object as `globalThis.gmSocket` for convenience. Always guard your macros with `if (!globalThis.gmSocket) { ui.notifications.error('GM socket not available'); return; }`.
- All handlers run on the GM client and therefore require at least one GM to be online and SocketLib to be active.
- The handlers perform basic validation (token existence, effect existence). They return structured objects so your macro can present friendly errors to players.
- When creating effects intended to show a status counter on tokens, include a `flags.statuscounter` object with `value` and `visible: true` properties (for example: `flags: { statuscounter: { value: 1, visible: true } }`). This ensures the token HUD shows the stack number.

Packaging / manifest notes

- The `module.json` in this folder now includes `url`, `manifest` and `download` fields pointing to this repository's main branch. If you publish a separate release (recommended for distribution), update `manifest` to point to the release `module.json` and `download` to the release ZIP or module package URL.
- Foundry's install-from-manifest UI installs by manifest URL, which must point to a `module.json` that names only this module. If you want the manifest to reference only this module, publish the `modules/custom-status-effects/module.json` file on its own (for example, using GitHub Releases or a dedicated repo) — otherwise the `download` link will fetch the whole repository archive.

---
