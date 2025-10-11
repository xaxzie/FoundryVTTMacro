/**
 * Custom Status Effects Override Module
 * Registers core.statusEffects as a world setting to enable persistent customization
 * Compatible with Foundry VTT V13
 */

// Register the core.statusEffects setting during Foundry initialization
// Wait for CONFIG to be fully initialized before registering
Hooks.once('init', () => {
    console.log('Custom Status Effects Override | Registering core.statusEffects setting');

    // Don't register if it already exists (avoid conflicts)
    if (game.settings.settings.has('core.statusEffects')) {
        console.log('Custom Status Effects Override | core.statusEffects already registered, skipping');
        return;
    }

    // Get current CONFIG.statusEffects as the default, but validate it first
    let defaultStatusEffects;
    try {
        const current = CONFIG.statusEffects;
        if (Array.isArray(current) && current.every(effect =>
            effect && (effect.id || effect.statusId) && typeof effect === 'object'
        )) {
            defaultStatusEffects = foundry.utils.deepClone(current);
        } else {
            console.warn('Custom Status Effects Override | Invalid CONFIG.statusEffects, using empty array');
            defaultStatusEffects = [];
        }
    } catch (error) {
        console.warn('Custom Status Effects Override | Error reading CONFIG.statusEffects:', error);
        defaultStatusEffects = [];
    }

    // Register the setting that makes status effects persistent
    try {
        game.settings.register('core', 'statusEffects', {
            name: 'CUSTOM_STATUS_EFFECTS.SettingName',
            hint: 'CUSTOM_STATUS_EFFECTS.SettingHint',
            scope: 'world',
            config: false, // Hidden from the settings UI - use your macro to manage
            type: Array,
            default: defaultStatusEffects,
            onChange: (value) => {
                console.log('Custom Status Effects Override | Status effects changed, updating CONFIG');
                // Validate the incoming value more strictly
                if (Array.isArray(value) && value.every(effect =>
                    effect &&
                    typeof effect === 'object' &&
                    (effect.id || effect.statusId)
                )) {
                    // Don't update CONFIG immediately during init to avoid sorting conflicts
                    if (game.ready) {
                        CONFIG.statusEffects = foundry.utils.deepClone(value);
                        // Delay the HUD refresh to avoid timing issues
                        setTimeout(() => {
                            Hooks.callAll('renderTokenHUD');
                        }, 50);
                    }
                } else {
                    console.warn('Custom Status Effects Override | Invalid status effects value received:', value);
                }
            }
        });
        console.log('Custom Status Effects Override | Successfully registered core.statusEffects setting');
    } catch (error) {
        console.error('Custom Status Effects Override | Failed to register setting:', error);
    }

    if (!game.modules.get("socketlib")?.active) return;

    registerGMSocket();
});

// Apply the saved status effects after everything is fully loaded
// Use a later hook to avoid interfering with Foundry's status effects sorting
Hooks.once('ready', () => {
    console.log('Custom Status Effects Override | Applying saved status effects');

    // Wait a bit longer to ensure all other modules have finished their initialization
    setTimeout(() => {
        try {
            // Only proceed if the setting was successfully registered
            if (!game.settings.settings.has('core.statusEffects')) {
                console.warn('Custom Status Effects Override | Setting not registered, skipping application');
                return;
            }

            // Get the saved status effects from world settings
            const savedEffects = game.settings.get('core', 'statusEffects');

            // Validate the saved effects more thoroughly
            if (Array.isArray(savedEffects) && savedEffects.length > 0) {
                const validEffects = savedEffects.filter(effect =>
                    effect &&
                    typeof effect === 'object' &&
                    (effect.id || effect.statusId) &&
                    typeof (effect.id || effect.statusId) === 'string'
                );

                if (validEffects.length > 0) {
                    CONFIG.statusEffects = foundry.utils.deepClone(validEffects);
                    console.log(`Custom Status Effects Override | Applied ${validEffects.length} valid saved status effects`);

                    if (validEffects.length !== savedEffects.length) {
                        console.warn(`Custom Status Effects Override | Filtered out ${savedEffects.length - validEffects.length} invalid effects`);
                    }
                } else {
                    console.warn('Custom Status Effects Override | No valid effects found in saved data');
                }
            } else {
                console.log('Custom Status Effects Override | No saved effects found, using defaults');
            }
        } catch (error) {
            console.warn('Custom Status Effects Override | Error loading saved effects:', error);
        }

        // Final HUD refresh with a longer delay
        setTimeout(() => {
            Hooks.callAll('renderTokenHUD');
            console.log('Custom Status Effects Override | Final Token HUD refresh triggered');
        }, 200);
    }, 500); // Wait 500ms after ready to let other systems settle
});

// ===== GM SOCKET HANDLERS FOR EFFECT MANAGEMENT =====

// Socket instance variable
let gmSocketDone = false;

// Register socket handlers following Sequencer pattern
function registerGMSocket() {
    console.log("[DEBUG] Custom Status Effects | gmSocketDone:", gmSocketDone);

    if (gmSocketDone) return;
    console.log("[DEBUG] Custom Status Effects | socketlib :", socketlib?.registerModule); // Already registered
    if (!socketlib?.registerModule) return; // SocketLib not available

    console.log("[DEBUG] Custom Status Effects | Initializing GM Socket Handlers for effect delegation");

    try {
        // Register module with socketlib (following Sequencer pattern)
        const gmSocket = socketlib.registerModule("custom-status-effects");
        console.log("[DEBUG] Custom Status Effects | GM Socket registered:", gmSocket);
        // Handler for applying new effects to tokens
        const applyEffectHandler = async (tokenId, effectData) => {
            console.log(`[GM Socket] Applying effect to token ${tokenId}:`, effectData);

            const token = canvas.tokens.get(tokenId);
            if (!token) {
                console.error(`[GM Socket] Token with ID ${tokenId} not found`);
                return { success: false, error: "Token not found" };
            }

            try {
                const createdEffects = await token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                console.log(`[GM Socket] Successfully applied effect "${effectData.name}" to ${token.name} (token actor)`);
                return { success: true, effects: createdEffects };
            } catch (error) {
                console.error(`[GM Socket] Failed to apply effect to ${token.name}:`, error);
                return { success: false, error: error.message };
            }
        };

        // Handler for updating existing effects on tokens
        const updateEffectHandler = async (tokenId, effectId, updateData) => {
            console.log(`[GM Socket] Updating effect ${effectId} on token ${tokenId}:`, updateData);

            const token = canvas.tokens.get(tokenId);
            if (!token) {
                console.error(`[GM Socket] Token with ID ${tokenId} not found`);
                return { success: false, error: "Token not found" };
            }

            const effect = token.actor.effects.get(effectId);
            if (!effect) {
                console.error(`[GM Socket] Effect with ID ${effectId} not found on ${token.name}`);
                return { success: false, error: "Effect not found" };
            }

            try {
                await effect.update(updateData);
                console.log(`[GM Socket] Successfully updated effect "${effect.name}" on ${token.name} (token actor)`);
                return { success: true };
            } catch (error) {
                console.error(`[GM Socket] Failed to update effect on ${token.name}:`, error);
                return { success: false, error: error.message };
            }
        };

        // Handler for removing effects from tokens
        const removeEffectHandler = async (tokenId, effectId) => {
            console.log(`[GM Socket] Removing effect ${effectId} from token ${tokenId}`);

            const token = canvas.tokens.get(tokenId);
            if (!token) {
                console.error(`[GM Socket] Token with ID ${tokenId} not found`);
                return { success: false, error: "Token not found" };
            }

            const effect = token.actor.effects.get(effectId);
            if (!effect) {
                console.error(`[GM Socket] Effect with ID ${effectId} not found on ${token.name}`);
                return { success: false, error: "Effect not found" };
            }

            try {
                await effect.delete();
                console.log(`[GM Socket] Successfully removed effect "${effect.name}" from ${token.name} (token actor)`);
                return { success: true };
            } catch (error) {
                console.error(`[GM Socket] Failed to remove effect from ${token.name}:`, error);
                return { success: false, error: error.message };
            }
        };
        console.log("[DEBUG] Custom Status Effects | GM Socket Handlers registered:", updateEffectHandler);
        console.log("[DEBUG] Custom Status Effects | GM Socket Handlers registered:", applyEffectHandler);

        // Register the handlers with socketlib
        gmSocket.register("applyEffectToActor", applyEffectHandler);
        gmSocket.register("updateEffectOnActor", updateEffectHandler);
        gmSocket.register("removeEffectFromActor", removeEffectHandler);
        console.log("[DEBUG] Custom Status Effects | GM Socket registered:", gmSocket);
        // Store socket globally for access from macros
        globalThis.gmSocket = gmSocket;

        console.log("[DEBUG] Custom Status Effects | GM Socket Handlers registered successfully");
        console.log("[GM Socket] Handlers registered:", {
            "applyEffectToActor": "Creates new Active Effects on token actor (tokenId)",
            "updateEffectOnActor": "Updates existing Active Effects on token actor (tokenId)",
            "removeEffectFromActor": "Removes Active Effects from token actor (tokenId)"
        });
        gmSocketDone = true;

    } catch (error) {
        console.error("[DEBUG] Custom Status Effects | Failed to register GM socket handlers:", error);
    }
}

// Register socket handlers following Sequencer pattern
Hooks.once("socketlib.ready", registerGMSocket);
