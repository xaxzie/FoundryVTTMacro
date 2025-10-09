/**
 * Token Magic FX Filters Utility
 *
 * This utility demonstrates how to use Token Magic FX filters for persistent
 * visual effects on tokens, including shadow, electric, and other filter types.
 *
 * Required Module: Token Magic FX
 *
 * Features:
 * - Apply/remove filters to selected tokens
 * - Multiple filter types (shadow, electric, blur, etc.)
 * - Animated filter properties
 * - Persistent effects management
 * - Toggle functionality for easy on/off
 *
 * Usage:
 * 1. Select token(s) you want to apply filters to
 * 2. Configure filter parameters
 * 3. Run the utility functions
 * 4. Filters persist until manually removed
 */

// ===== FILTER CONFIGURATIONS =====

/**
 * Shadow Filter Configuration
 * Creates an animated shadow effect with blur oscillation
 */
const SHADOW_FILTER_CONFIG = {
    filterType: "shadow",
    blur: 1,
    quality: 5,
    distance: 0.2,
    alpha: 1.0,
    padding: 100,
    color: 0xff0000, // Red shadow
    animated: {
        blur: {
            active: true,
            loopDuration: 500,
            animType: "syncCosOscillation",
            val1: 2,
            val2: 4
        }
    }
};

/**
 * Electric Filter Configuration
 * Creates an animated electric effect with moving time
 */
const ELECTRIC_FILTER_CONFIG = {
    filterType: "electric",
    color: 0xff0000, // Red electricity
    time: 0,
    blend: 2,
    intensity: 8,
    animated: {
        time: {
            active: true,
            speed: 0.0015,
            animType: "move"
        }
    }
};

/**
 * Glow Filter Configuration
 * Creates a pulsing glow effect
 */
const GLOW_FILTER_CONFIG = {
    filterType: "glow",
    outerStrength: 4,
    innerStrength: 0,
    color: 0xff0000,
    quality: 0.5,
    padding: 10,
    animated: {
        outerStrength: {
            active: true,
            loopDuration: 1000,
            animType: "syncCosOscillation",
            val1: 2,
            val2: 6
        }
    }
};

/**
 * Blur Filter Configuration
 * Creates an animated blur effect
 */
const BLUR_FILTER_CONFIG = {
    filterType: "blur",
    blur: 2,
    quality: 4,
    animated: {
        blur: {
            active: true,
            loopDuration: 800,
            animType: "syncCosOscillation",
            val1: 1,
            val2: 3
        }
    }
};

// ===== FILTER MANAGEMENT FUNCTIONS =====

/**
 * Apply filters to selected tokens
 * @param {Array} filterConfigs - Array of filter configuration objects
 * @param {Array} tokens - Optional array of tokens (uses selected if not provided)
 */
async function applyFiltersToTokens(filterConfigs, tokens = null) {
    const targetTokens = tokens || canvas.tokens.controlled;

    if (!targetTokens || targetTokens.length === 0) {
        ui.notifications.warn("Please select at least one token to apply filters.");
        return false;
    }

    if (typeof TokenMagic === "undefined") {
        ui.notifications.error("Token Magic FX module is required but not available.");
        return false;
    }

    try {
        // Select the target tokens
        if (tokens) {
            canvas.tokens.releaseAll();
            tokens.forEach(token => token.control({ releaseOthers: false }));
        }

        await TokenMagic.addFiltersOnSelected(filterConfigs);

        console.log(`[DEBUG] Token Magic Filters: Applied ${filterConfigs.length} filter(s) to ${targetTokens.length} token(s)`);
        ui.notifications.info(`Applied ${filterConfigs.length} filter(s) to ${targetTokens.length} token(s)`);
        return true;

    } catch (error) {
        console.error("[DEBUG] Token Magic Filters: Error applying filters:", error);
        ui.notifications.error("Failed to apply filters: " + error.message);
        return false;
    }
}

/**
 * Remove all filters from selected tokens
 * @param {Array} tokens - Optional array of tokens (uses selected if not provided)
 */
async function removeFiltersFromTokens(tokens = null) {
    const targetTokens = tokens || canvas.tokens.controlled;

    if (!targetTokens || targetTokens.length === 0) {
        ui.notifications.warn("Please select at least one token to remove filters.");
        return false;
    }

    if (typeof TokenMagic === "undefined") {
        ui.notifications.error("Token Magic FX module is required but not available.");
        return false;
    }

    try {
        // Select the target tokens
        if (tokens) {
            canvas.tokens.releaseAll();
            tokens.forEach(token => token.control({ releaseOthers: false }));
        }

        await TokenMagic.deleteFiltersOnSelected();

        console.log(`[DEBUG] Token Magic Filters: Removed filters from ${targetTokens.length} token(s)`);
        ui.notifications.info(`Removed filters from ${targetTokens.length} token(s)`);
        return true;

    } catch (error) {
        console.error("[DEBUG] Token Magic Filters: Error removing filters:", error);
        ui.notifications.error("Failed to remove filters: " + error.message);
        return false;
    }
}

/**
 * Toggle filters on selected tokens (apply if none, remove if present)
 * @param {Array} filterConfigs - Array of filter configuration objects
 * @param {string} effectName - Name to identify the effect
 * @param {Array} tokens - Optional array of tokens (uses selected if not provided)
 */
async function toggleFiltersOnTokens(filterConfigs, effectName, tokens = null) {
    const targetTokens = tokens || canvas.tokens.controlled;

    if (!targetTokens || targetTokens.length === 0) {
        ui.notifications.warn("Please select at least one token to toggle filters.");
        return false;
    }

    try {
        // Check if any token has filters (simplified check)
        let hasFilters = false;
        for (const token of targetTokens) {
            if (token.document.flags?.tokenmagic) {
                hasFilters = true;
                break;
            }
        }

        if (hasFilters) {
            await removeFiltersFromTokens(tokens);
            console.log(`[DEBUG] Token Magic Filters: Toggled OFF ${effectName}`);
        } else {
            await applyFiltersToTokens(filterConfigs, tokens);
            console.log(`[DEBUG] Token Magic Filters: Toggled ON ${effectName}`);
        }

        return true;

    } catch (error) {
        console.error("[DEBUG] Token Magic Filters: Error toggling filters:", error);
        ui.notifications.error("Failed to toggle filters: " + error.message);
        return false;
    }
}

// ===== PRESET EFFECT FUNCTIONS =====

/**
 * Apply God Speed effect (shadow + electric filters)
 */
async function applyGodSpeedEffect(tokens = null) {
    const godSpeedFilters = [SHADOW_FILTER_CONFIG, ELECTRIC_FILTER_CONFIG];
    return await applyFiltersToTokens(godSpeedFilters, tokens);
}

/**
 * Apply power aura effect (glow + blur filters)
 */
async function applyPowerAuraEffect(tokens = null) {
    const powerAuraFilters = [GLOW_FILTER_CONFIG, BLUR_FILTER_CONFIG];
    return await applyFiltersToTokens(powerAuraFilters, tokens);
}

/**
 * Apply electric surge effect (just electric filter)
 */
async function applyElectricSurgeEffect(tokens = null) {
    const electricFilters = [ELECTRIC_FILTER_CONFIG];
    return await applyFiltersToTokens(electricFilters, tokens);
}

/**
 * Apply shadow stealth effect (just shadow filter)
 */
async function applyShadowStealthEffect(tokens = null) {
    const shadowFilters = [SHADOW_FILTER_CONFIG];
    return await applyFiltersToTokens(shadowFilters, tokens);
}

// ===== CUSTOM FILTER CREATION =====

/**
 * Create a custom electric filter with specified color
 * @param {number} color - Hex color value (e.g., 0xff0000 for red)
 * @param {number} intensity - Electric intensity (1-10)
 */
function createElectricFilter(color = 0xff0000, intensity = 8) {
    return {
        filterType: "electric",
        color: color,
        time: 0,
        blend: 2,
        intensity: intensity,
        animated: {
            time: {
                active: true,
                speed: 0.0015,
                animType: "move"
            }
        }
    };
}

/**
 * Create a custom shadow filter with specified color and animation
 * @param {number} color - Hex color value (e.g., 0xff0000 for red)
 * @param {number} duration - Animation loop duration in milliseconds
 */
function createShadowFilter(color = 0xff0000, duration = 500) {
    return {
        filterType: "shadow",
        blur: 1,
        quality: 5,
        distance: 0.2,
        alpha: 1.0,
        padding: 100,
        color: color,
        animated: {
            blur: {
                active: true,
                loopDuration: duration,
                animType: "syncCosOscillation",
                val1: 2,
                val2: 4
            }
        }
    };
}

/**
 * Create a custom glow filter with specified color and strength
 * @param {number} color - Hex color value (e.g., 0x00ff00 for green)
 * @param {number} strength - Glow strength (1-10)
 */
function createGlowFilter(color = 0x00ff00, strength = 4) {
    return {
        filterType: "glow",
        outerStrength: strength,
        innerStrength: 0,
        color: color,
        quality: 0.5,
        padding: 10,
        animated: {
            outerStrength: {
                active: true,
                loopDuration: 1000,
                animType: "syncCosOscillation",
                val1: strength / 2,
                val2: strength * 1.5
            }
        }
    };
}

// ===== MAIN EXECUTION EXAMPLE =====
// Uncomment one of these lines to execute:

// Apply God Speed effect to selected tokens:
// await applyGodSpeedEffect();

// Apply power aura effect to selected tokens:
// await applyPowerAuraEffect();

// Remove all filters from selected tokens:
// await removeFiltersFromTokens();

// Toggle God Speed effect:
// await toggleFiltersOnTokens([SHADOW_FILTER_CONFIG, ELECTRIC_FILTER_CONFIG], "God Speed");

// Apply custom colored electric effect:
// const blueElectric = createElectricFilter(0x0066ff, 6);
// await applyFiltersToTokens([blueElectric]);

// ===== FILTER TYPES REFERENCE =====
/*
Available Token Magic FX Filter Types:

1. **shadow** - Drop shadow effect
   - Properties: blur, quality, distance, alpha, padding, color
   - Animated: blur, distance, alpha

2. **electric** - Electric/lightning effect
   - Properties: color, time, blend, intensity
   - Animated: time, intensity

3. **glow** - Outer/inner glow effect
   - Properties: outerStrength, innerStrength, color, quality, padding
   - Animated: outerStrength, innerStrength

4. **blur** - Blur effect
   - Properties: blur, quality
   - Animated: blur

5. **adjustment** - Color adjustment
   - Properties: gamma, saturation, contrast, brightness, red, green, blue, alpha
   - Animated: All properties

6. **oldfilm** - Old film effect
   - Properties: sepia, noise, noiseSize, scratch, scratchDensity, scratchWidth, vignetting, vignettingAlpha, vignettingBlur
   - Animated: Most properties

7. **godray** - God ray/light shaft effect
   - Properties: angle, gain, lacunarity, parallel, time
   - Animated: angle, gain, time

8. **colormatrix** - Color matrix transformation
   - Properties: matrix (4x4 array)
   - Animated: matrix values

9. **wave** - Wave distortion
   - Properties: amplitude, wavelength, brightness, speed, animated
   - Animated: amplitude, wavelength, speed

10. **shockwave** - Shockwave effect
    - Properties: amplitude, wavelength, brightness, speed, time
    - Animated: All properties

Animation Types:
- "move": Continuous movement
- "syncCosOscillation": Synchronized cosine oscillation
- "cosOscillation": Cosine oscillation
- "sinOscillation": Sine oscillation
- "halfCosOscillation": Half cosine oscillation (for toggle effects)
- "chaoticOscillation": Chaotic/random oscillation

Color Values:
- Use hexadecimal values: 0xff0000 (red), 0x00ff00 (green), 0x0000ff (blue)
- Can also use decimal: 16711680 (red), 65280 (green), 255 (blue)
*/

// ===== PERFORMANCE NOTES =====
/*
Performance Considerations:

1. **Filter Complexity**: More complex filters (like electric, godray) use more GPU resources
2. **Number of Tokens**: Each token with filters adds to rendering cost
3. **Animation Count**: Multiple animated properties per filter increase load
4. **Update Frequency**: Lower loopDuration values mean more frequent updates

Best Practices:
- Use simpler filters (glow, shadow) for multiple tokens
- Reserve complex filters (electric, wave) for single important tokens
- Consider disabling filters during combat if performance drops
- Use reasonable loopDuration values (>= 500ms recommended)
- Clean up filters when no longer needed

Debugging:
- Check browser console for Token Magic FX errors
- Use TokenMagic.getPresets() to see available presets
- Monitor FPS when testing multiple filtered tokens
*/
