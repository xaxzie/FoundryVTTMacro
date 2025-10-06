/**
 * GM Socket Handlers for Effect Management
 *
 * This macro registers socketlib handlers that allow players to apply and update
 * Active Effects on tokens they don't own. Must be run by a GM on world startup
 * or when needed.
 *
 * Required module: socketlib
 *
 * Usage:
 * 1. GM runs this macro once per session (or set up as startup macro)
 * 2. Players can then use spells that apply effects to non-owned tokens
 *
 * Handlers registered:
 * - macro.applyEffectToActor: Creates new Active Effect on target actor
 * - macro.updateEffectOnActor: Updates existing Active Effect on target actor
 */

(async () => {
    // Verify GM permissions
    if (!game.user.isGM) {
        ui.notifications.error("This macro must be run by a GM!");
        return;
    }

    // Verify socketlib is available
    if (!game.modules.get("socketlib")?.active) {
        ui.notifications.error("Socketlib module is required but not active!");
        return;
    }

    try {
        // Handler for applying new effects to actors
        const applyEffectHandler = async (actorId, effectData) => {
            console.log(`[GM Socket] Applying effect to actor ${actorId}:`, effectData);

            const actor = game.actors.get(actorId);
            if (!actor) {
                console.error(`[GM Socket] Actor with ID ${actorId} not found`);
                return { success: false, error: "Actor not found" };
            }

            try {
                const createdEffects = await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                console.log(`[GM Socket] Successfully applied effect "${effectData.name}" to ${actor.name}`);
                return { success: true, effects: createdEffects };
            } catch (error) {
                console.error(`[GM Socket] Failed to apply effect to ${actor.name}:`, error);
                return { success: false, error: error.message };
            }
        };

        // Handler for updating existing effects on actors
        const updateEffectHandler = async (actorId, effectId, updateData) => {
            console.log(`[GM Socket] Updating effect ${effectId} on actor ${actorId}:`, updateData);

            const actor = game.actors.get(actorId);
            if (!actor) {
                console.error(`[GM Socket] Actor with ID ${actorId} not found`);
                return { success: false, error: "Actor not found" };
            }

            const effect = actor.effects.get(effectId);
            if (!effect) {
                console.error(`[GM Socket] Effect with ID ${effectId} not found on ${actor.name}`);
                return { success: false, error: "Effect not found" };
            }

            try {
                await effect.update(updateData);
                console.log(`[GM Socket] Successfully updated effect "${effect.name}" on ${actor.name}`);
                return { success: true };
            } catch (error) {
                console.error(`[GM Socket] Failed to update effect on ${actor.name}:`, error);
                return { success: false, error: error.message };
            }
        };

        // Register the handlers with socketlib
        game.socket.on("module.socketlib", async (data) => {
            if (data.type === "executeAsGM") {
                switch (data.function) {
                    case "macro.applyEffectToActor":
                        return await applyEffectHandler(...data.args);
                    case "macro.updateEffectOnActor":
                        return await updateEffectHandler(...data.args);
                    default:
                        console.warn(`[GM Socket] Unknown socket function: ${data.function}`);
                        return { success: false, error: "Unknown function" };
                }
            }
        });

        // Store handlers globally for direct access if needed
        globalThis.gmSocketHandlers = {
            applyEffectToActor: applyEffectHandler,
            updateEffectOnActor: updateEffectHandler
        };

        ui.notifications.info("✅ GM Socket Handlers registered successfully!");
        console.log("[GM Socket] Handlers registered:", {
            "macro.applyEffectToActor": "Creates new Active Effects",
            "macro.updateEffectOnActor": "Updates existing Active Effects"
        });

    } catch (error) {
        console.error("[GM Socket] Failed to register handlers:", error);
        ui.notifications.error("Failed to register GM socket handlers!");
    }
})();
