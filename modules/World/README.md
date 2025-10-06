World module README

## Purpose

This folder contains a small world script (`world.js`) that runs at Foundry's "ready" hook. It provides:

1. Default door sound initialization (sets a world setting and applies a default door sound on new doors).

**Note:** GM socket handlers for effect delegation are now managed by the `custom-status-effects` module, not this world script.

## Why this matters

Some macros need the GM to create or update Active Effects on tokens that players do not own. These effects are now handled automatically by the `custom-status-effects` module through socketlib handlers.

## Files

- `world.js` - The startup script that sets up default door sounds.
- `gm-socket-handlers.js` - (Legacy) An optional GM macro located at `macros/utilities/Admintool/gm-socket-handlers.js`. **No longer needed** - GM socket handlers are now automatically registered by the `custom-status-effects` module.

## Prerequisites

- Foundry VTT (this code was developed against the repository layout in this workspace).
- socketlib module installed and enabled.
- `custom-status-effects` module active (handles GM socket registration automatically).

## How GM socket handlers work now

GM socket handlers are automatically registered by the `custom-status-effects` module on the `socketlib.ready` hook. The handlers are:

- `applyEffectToActor` — creates a new Active Effect on a target Actor.
- `updateEffectOnActor` — updates an existing Active Effect on a target Actor.

The handlers are accessible via `globalThis.gmSocket.executeAsGM()` from player macros.

## Manual fallback (Legacy)

The old manual registration macro at `macros/utilities/Admintool/gm-socket-handlers.js` is no longer needed. GM socket handlers are now automatically registered by the `custom-status-effects` module.

## How to test

1. Start Foundry and open the world.
2. Open the browser console (F12) and look for the following lines on ready:
   - `[DEBUG]FT World | Initializing default door sounds` (from world.js)
   - `[DEBUG] Custom Status Effects | GM Socket Handlers registered successfully` (from custom-status-effects module)
3. As a non-GM player, cast a macro that delegates effect creation (for example `empalement.js`). The player macro will send a socket request; the GM-side handler will create/update the ActiveEffect.
4. If something fails, check the console for errors prefixed with `[GM Socket]` or `[DEBUG] Custom Status Effects`.

## Notes & Troubleshooting

- If the handlers are not registering, ensure the `socketlib` module and `custom-status-effects` module are both installed and enabled.
- You can inspect `globalThis.gmSocket` in the console to verify the socket is available.
- The old macro-based registration (`gm-socket-handlers.js`) is no longer needed as registration is now automatic.

## Security

Only the GM client executes the Active Effect create/update operations. Player macros only send requests; they do not receive direct permissions to modify actors or tokens.

## Contact / Notes

This README is intentionally concise. If you want a more detailed guide (installation instructions for socketlib, adding this to a packaged module, or making the registration persistent across updates), tell me which option you prefer and I'll add it.
