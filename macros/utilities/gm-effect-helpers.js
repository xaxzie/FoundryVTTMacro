/**
 * GM Effect Helpers
 *
 * Utility functions for managing Active Effects through GM delegation
 * Requires the custom-status-effects module to be active
 *
 * Usage: Copy these functions into your spell macros for GM-delegated effect management
 */

/**
 * Apply an effect to an actor using GM delegation
 * @param {Actor} targetActor - The actor to apply the effect to
 * @param {Object} effectData - The effect data to apply
 * @returns {Promise<Object>} Result object with success boolean and optional error message
 */
async function applyEffectWithGMDelegation(targetActor, effectData) {
    if (!globalThis.gmSocket) {
        const error = "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
        ui.notifications.error(error);
        console.error("[DEBUG] GM Socket not available for effect application");
        return { success: false, error };
    }

    try {
        console.log(`[DEBUG] Applying effect "${effectData.name}" to ${targetActor.name} via GM socket`);
        const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.id, effectData);

        if (result?.success) {
            console.log(`[DEBUG] Successfully applied effect "${effectData.name}" to ${targetActor.name}`);
            return { success: true, effects: result.effects };
        } else {
            console.error(`[DEBUG] Failed to apply effect: ${result?.error}`);
            return { success: false, error: result?.error || "Unknown error" };
        }
    } catch (error) {
        console.error("Error applying effect:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Update an effect on an actor using GM delegation
 * @param {Actor} targetActor - The actor whose effect to update
 * @param {string} effectId - The ID of the effect to update
 * @param {Object} updateData - The update data for the effect
 * @returns {Promise<Object>} Result object with success boolean and optional error message
 */
async function updateEffectWithGMDelegation(targetActor, effectId, updateData) {
    if (!globalThis.gmSocket) {
        const error = "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
        ui.notifications.error(error);
        console.error("[DEBUG] GM Socket not available for effect update");
        return { success: false, error };
    }

    try {
        console.log(`[DEBUG] Updating effect ${effectId} on ${targetActor.name} via GM socket`);
        const result = await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetActor.id, effectId, updateData);

        if (result?.success) {
            console.log(`[DEBUG] Successfully updated effect ${effectId} on ${targetActor.name}`);
            return { success: true };
        } else {
            console.error(`[DEBUG] Failed to update effect: ${result?.error}`);
            return { success: false, error: result?.error || "Unknown error" };
        }
    } catch (error) {
        console.error("Error updating effect:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Remove an effect from an actor using GM delegation
 * @param {Actor} targetActor - The actor to remove the effect from
 * @param {string} effectId - The ID of the effect to remove
 * @returns {Promise<Object>} Result object with success boolean and optional error message
 */
async function removeEffectWithGMDelegation(targetActor, effectId) {
    if (!globalThis.gmSocket) {
        const error = "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
        ui.notifications.error(error);
        console.error("[DEBUG] GM Socket not available for effect removal");
        return { success: false, error };
    }

    try {
        console.log(`[DEBUG] Removing effect ${effectId} from ${targetActor.name} via GM socket`);
        const result = await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetActor.id, effectId);

        if (result?.success) {
            console.log(`[DEBUG] Successfully removed effect ${effectId} from ${targetActor.name}`);
            return { success: true };
        } else {
            console.error(`[DEBUG] Failed to remove effect: ${result?.error}`);
            return { success: false, error: result?.error || "Unknown error" };
        }
    } catch (error) {
        console.error("Error removing effect:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Check if GM socket is available
 * @returns {boolean} True if GM socket is available, false otherwise
 */
function isGMSocketAvailable() {
    return !!globalThis.gmSocket;
}

/**
 * Apply an effect to an actor with automatic GM delegation fallback
 * Will try direct application first (if user owns the actor), then fallback to GM delegation
 * @param {Actor} targetActor - The actor to apply the effect to
 * @param {Object} effectData - The effect data to apply
 * @returns {Promise<Object>} Result object with success boolean and optional error message
 */
async function applyEffectSmart(targetActor, effectData) {
    // Try direct application first if user owns the actor
    if (targetActor.isOwner) {
        try {
            console.log(`[DEBUG] Applying effect "${effectData.name}" to ${targetActor.name} directly (user owns actor)`);
            const createdEffects = await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            console.log(`[DEBUG] Successfully applied effect "${effectData.name}" to ${targetActor.name} directly`);
            return { success: true, effects: createdEffects };
        } catch (error) {
            console.error("Error applying effect directly:", error);
            // Fallback to GM delegation
        }
    }

    // Use GM delegation
    return await applyEffectWithGMDelegation(targetActor, effectData);
}

/**
 * Remove an effect from an actor with automatic GM delegation fallback
 * Will try direct removal first (if user owns the actor), then fallback to GM delegation
 * @param {Actor} targetActor - The actor to remove the effect from
 * @param {string} effectId - The ID of the effect to remove
 * @returns {Promise<Object>} Result object with success boolean and optional error message
 */
async function removeEffectSmart(targetActor, effectId) {
    const effect = targetActor.effects.get(effectId);
    if (!effect) {
        return { success: false, error: "Effect not found" };
    }

    // Try direct removal first if user owns the actor
    if (targetActor.isOwner) {
        try {
            console.log(`[DEBUG] Removing effect ${effectId} from ${targetActor.name} directly (user owns actor)`);
            await effect.delete();
            console.log(`[DEBUG] Successfully removed effect ${effectId} from ${targetActor.name} directly`);
            return { success: true };
        } catch (error) {
            console.error("Error removing effect directly:", error);
            // Fallback to GM delegation
        }
    }

    // Use GM delegation
    return await removeEffectWithGMDelegation(targetActor, effectId);
}

// Example usage in a macro:
/*
// Copy the functions you need into your macro, then use like this:

// Apply an effect with GM delegation
const effectData = {
    name: "My Effect",
    icon: "icons/magic/symbols/question-stone-yellow.webp",
    description: "A magical effect"
};

const result = await applyEffectWithGMDelegation(targetActor, effectData);
if (!result.success) {
    ui.notifications.error(`Failed to apply effect: ${result.error}`);
    return;
}

// Remove an effect with GM delegation
const removeResult = await removeEffectWithGMDelegation(targetActor, effectId);
if (!removeResult.success) {
    ui.notifications.error(`Failed to remove effect: ${removeResult.error}`);
}

// Smart apply (tries direct first, then GM delegation)
const smartResult = await applyEffectSmart(targetActor, effectData);
*/
