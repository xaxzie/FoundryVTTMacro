/**
 * Token Transformation Utility
 *
 * This utility demonstrates how to use Token Magic FX polymorph filter
 * to transform token images with animated transitions.
 *
 * Required Module: Token Magic FX
 *
 * Features:
 * - Toggle transformation (click once to transform, again to revert)
 * - 9 different transformation types
 * - Customizable transition duration
 * - Automatic state management
 * - Multiple token support
 *
 * Usage:
 * 1. Select token(s) you want to transform
 * 2. Run this macro
 * 3. Token will transform to the target image
 * 4. Run again to revert to original image
 */

// ===== CONFIGURATION =====
const CONFIG = {
    // Target image path (change this to your desired transformation image)
    targetImagePath: "worlds/ft/TOKEN/transformed_token.png",

    // Transformation type (1-9)
    // 1 - Simple transition    6 - Morphing
    // 2 - Dreamy              7 - Take off/Put on disguise
    // 3 - Twist               8 - Wind
    // 4 - Water drop          9 - Hologram
    // 5 - TV Noise
    transitionType: 4,

    // Animation settings
    loopDuration: 1000, // Duration in milliseconds
    padding: 70,        // Extra padding around token
    magnify: 1,         // Scale multiplier

    // Unique filter ID (change for different macros to prevent conflicts)
    filterId: "tokenTransformation"
};

// ===== TRANSFORMATION TYPES REFERENCE =====
const TRANSFORMATION_TYPES = {
    1: "Simple transition",
    2: "Dreamy",
    3: "Twist",
    4: "Water drop",
    5: "TV Noise",
    6: "Morphing",
    7: "Take off/Put on disguise",
    8: "Wind",
    9: "Hologram"
};

// ===== MAIN TRANSFORMATION FUNCTION =====
async function transformTokens() {
    // Check if any tokens are selected
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.warn("Please select at least one token to transform.");
        return;
    }

    // Check if Token Magic FX is available
    if (typeof TokenMagic === "undefined") {
        ui.notifications.error("Token Magic FX module is required but not available.");
        return;
    }

    console.log(`[DEBUG] Token Transformation: Starting transformation with type ${CONFIG.transitionType} (${TRANSFORMATION_TYPES[CONFIG.transitionType]})`);

    // Process each selected token
    for (const token of canvas.tokens.controlled) {
        await processTokenTransformation(token);
    }
}

// ===== PROCESS INDIVIDUAL TOKEN =====
async function processTokenTransformation(token) {
    try {
        let filterParams;

        // Check if transformation filter is already active
        if (token.TMFXhasFilterId(CONFIG.filterId)) {
            console.log(`[DEBUG] Token Transformation: Reverting transformation for ${token.name}`);

            // Filter exists - trigger reversal animation
            filterParams = [{
                filterType: "polymorph",
                filterId: CONFIG.filterId,
                type: CONFIG.transitionType,
                animated: {
                    progress: {
                        active: true,
                        loops: 1 // One loop to revert back to original
                    }
                }
            }];

            await token.TMFXaddUpdateFilters(filterParams);

        } else {
            console.log(`[DEBUG] Token Transformation: Applying transformation to ${token.name}`);

            // Filter doesn't exist - create new transformation
            filterParams = [{
                filterType: "polymorph",
                filterId: CONFIG.filterId,
                type: CONFIG.transitionType,
                padding: CONFIG.padding,
                magnify: CONFIG.magnify,
                imagePath: CONFIG.targetImagePath,
                animated: {
                    progress: {
                        active: true,
                        animType: "halfCosOscillation", // Allows back-and-forth animation
                        val1: 0,   // Start value (original image)
                        val2: 100, // End value (transformed image)
                        loops: 1,  // One loop to transform
                        loopDuration: CONFIG.loopDuration
                    }
                }
            }];

            await token.TMFXaddUpdateFilters(filterParams);
        }

    } catch (error) {
        console.error(`[DEBUG] Token Transformation: Error processing ${token.name}:`, error);
        ui.notifications.error(`Failed to transform ${token.name}: ${error.message}`);
    }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Remove transformation from selected tokens
 */
async function removeTransformation() {
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.warn("Please select at least one token.");
        return;
    }

    for (const token of canvas.tokens.controlled) {
        if (token.TMFXhasFilterId(CONFIG.filterId)) {
            await token.TMFXdeleteFilters(CONFIG.filterId);
            console.log(`[DEBUG] Token Transformation: Removed transformation from ${token.name}`);
        }
    }

    ui.notifications.info("Transformation removed from selected tokens.");
}

/**
 * Check transformation status of selected tokens
 */
function checkTransformationStatus() {
    if (canvas.tokens.controlled.length === 0) {
        ui.notifications.warn("Please select at least one token.");
        return;
    }

    const status = [];
    for (const token of canvas.tokens.controlled) {
        const isTransformed = token.TMFXhasFilterId(CONFIG.filterId);
        status.push(`${token.name}: ${isTransformed ? "Transformed" : "Original"}`);
    }

    const message = `<h3>Transformation Status</h3><ul><li>${status.join("</li><li>")}</li></ul>`;
    ChatMessage.create({
        user: game.user.id,
        content: message,
        whisper: [game.user.id]
    });
}

/**
 * Transform with custom settings
 */
async function transformWithCustomSettings(imagePath, transitionType = 4, duration = 1000) {
    const originalPath = CONFIG.targetImagePath;
    const originalType = CONFIG.transitionType;
    const originalDuration = CONFIG.loopDuration;

    // Temporarily override settings
    CONFIG.targetImagePath = imagePath;
    CONFIG.transitionType = transitionType;
    CONFIG.loopDuration = duration;

    try {
        await transformTokens();
    } finally {
        // Restore original settings
        CONFIG.targetImagePath = originalPath;
        CONFIG.transitionType = originalType;
        CONFIG.loopDuration = originalDuration;
    }
}

// ===== EXAMPLE USAGE FUNCTIONS =====

/**
 * Example: Quick battle form transformation
 */
async function transformToBattleForm() {
    await transformWithCustomSettings(
        "worlds/ft/TOKEN/battle_form_token.png",
        6, // Morphing transition
        1500 // Longer duration for dramatic effect
    );
}

/**
 * Example: Stealth form transformation
 */
async function transformToStealthForm() {
    await transformWithCustomSettings(
        "worlds/ft/TOKEN/stealth_form_token.png",
        9, // Hologram transition
        800  // Quick transition
    );
}

// ===== MAIN EXECUTION =====
// Execute the main transformation function
await transformTokens();

// ===== ALTERNATIVE USAGE EXAMPLES =====
// Uncomment one of these lines instead of the main execution above:

// Remove transformation from selected tokens:
// await removeTransformation();

// Check status of selected tokens:
// checkTransformationStatus();

// Transform to battle form:
// await transformToBattleForm();

// Transform to stealth form:
// await transformToStealthForm();

// ===== INTEGRATION NOTES =====
/*
Token Magic FX Integration:
- token.TMFXhasFilterId(filterId): Check if filter exists
- token.TMFXaddUpdateFilters(params): Add or update filters
- token.TMFXdeleteFilters(filterId): Remove specific filter
- Available filter types: polymorph, glow, blur, etc.

halfCosOscillation Animation:
- Allows smooth back-and-forth transitions
- val1 → val2 on first loop, val2 → val1 on second loop
- Perfect for toggle transformations

Filter Parameters:
- filterType: "polymorph" for image transformation
- filterId: Unique identifier (prevent conflicts)
- type: 1-9 transformation animation styles
- imagePath: Target transformation image
- padding: Extra space around transformed image
- magnify: Scale multiplier for size changes
- loops: Number of animation cycles
- loopDuration: Time per cycle in milliseconds

Performance Notes:
- Always await TMFX functions in loops
- Use unique filterIds to prevent conflicts
- Clean up filters when no longer needed
- Test with different token sizes and images
*/
