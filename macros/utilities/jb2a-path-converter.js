/**
 * Macro Path Converter
 * Description: Utility to convert JB2A database paths to local asset paths
 * 
 * This utility helps convert macros from using JB2A database notation
 * to local file paths when you have assets stored locally.
 * 
 * @author Sequencer Examples
 * @version 1.0
 */

// JB2A Database to Local Path Mapping
const JB2A_PATH_MAP = {
    // Explosions and Fire
    "jb2a.explosion.01.orange": "assets/jb2a/explosions/explosion_01_orange.webm",
    "jb2a.explosion.01.blue": "assets/jb2a/explosions/explosion_01_blue.webm",
    "jb2a.fireball": "assets/jb2a/explosions/fireball.webm",
    "jb2a.fireball.explosion.orange": "assets/jb2a/explosions/fireball_explosion_orange.webm",
    "jb2a.fire_jet.orange": "assets/jb2a/explosions/fire_jet_orange.webm",
    "jb2a.impact.fire.01.orange": "assets/jb2a/explosions/impact_fire_01_orange.webm",
    
    // Lightning and Energy
    "jb2a.chain_lightning.primary.blue": "assets/jb2a/lightning/chain_lightning_primary_blue.webm",
    "jb2a.chain_lightning.secondary.blue": "assets/jb2a/lightning/chain_lightning_secondary_blue.webm",
    "jb2a.static_electricity.03.blue": "assets/jb2a/lightning/static_electricity_03_blue.webm",
    "jb2a.lightning_strike.no_ring.blue": "assets/jb2a/lightning/lightning_strike_no_ring_blue.webm",
    "jb2a.energy_beam.normal.orange.03": "assets/jb2a/lightning/energy_beam_normal_orange_03.webm",
    "jb2a.energy_beam.normal.blue.03": "assets/jb2a/lightning/energy_beam_normal_blue_03.webm",
    "jb2a.energy_field.02.above.purple": "assets/jb2a/lightning/energy_field_02_above_purple.webm",
    "jb2a.energy_field.02.above.blue": "assets/jb2a/lightning/energy_field_02_above_blue.webm",
    
    // Healing
    "jb2a.healing_generic.burst.yellowwhite": "assets/jb2a/healing/healing_generic_burst_yellowwhite.webm",
    "jb2a.healing_generic.beam.yellowwhite": "assets/jb2a/healing/healing_generic_beam_yellowwhite.webm",
    "jb2a.cure_wounds.400px.blue": "assets/jb2a/healing/cure_wounds_400px_blue.webm",
    
    // Combat
    "jb2a.melee_generic.slashing.one_handed": "assets/jb2a/combat/melee_generic_slashing_one_handed.webm",
    "jb2a.melee_generic.slashing.two_handed": "assets/jb2a/combat/melee_generic_slashing_two_handed.webm",
    "jb2a.impact.ground_crack.orange.02": "assets/jb2a/combat/impact_ground_crack_orange_02.webm",
    "jb2a.impact.ground_crack.still_frame.02": "assets/jb2a/combat/impact_ground_crack_still_frame_02.webm",
    
    // Magic
    "jb2a.magic_missile": "assets/jb2a/magic/magic_missile.webm",
    "jb2a.magic_signs.circle.02.conjuration.intro.purple": "assets/jb2a/magic/magic_signs_circle_02_conjuration_intro_purple.webm",
    "jb2a.magic_signs.circle.02.conjuration.outro.purple": "assets/jb2a/magic/magic_signs_circle_02_conjuration_outro_purple.webm",
    "jb2a.magic_signs.circle.02.transmutation.intro.blue": "assets/jb2a/magic/magic_signs_circle_02_transmutation_intro_blue.webm",
    "jb2a.magic_signs.circle.02.transmutation.outro.blue": "assets/jb2a/magic/magic_signs_circle_02_transmutation_outro_blue.webm",
    "jb2a.misty_step.01.blue": "assets/jb2a/magic/misty_step_01_blue.webm",
    "jb2a.misty_step.02.blue": "assets/jb2a/magic/misty_step_02_blue.webm",
    "jb2a.misty_step.01.purple": "assets/jb2a/magic/misty_step_01_purple.webm",
    "jb2a.shield.03.intro.blue": "assets/jb2a/magic/shield_03_intro_blue.webm",
    "jb2a.markers.circle_of_stars.orange": "assets/jb2a/magic/markers_circle_of_stars_orange.webm",
    
    // Environmental
    "jb2a.wind_stream.default": "assets/jb2a/environmental/wind_stream_default.webm",
    "jb2a.smoke.puff.centered.grey.2": "assets/jb2a/environmental/smoke_puff_centered_grey_2.webm",
    "jb2a.breath_weapons02.burst.cone.fire.orange.02": "assets/jb2a/environmental/breath_weapons02_burst_cone_fire_orange_02.webm"
};

/**
 * Convert JB2A database path to local file path
 * @param {string} jb2aPath - JB2A database path (e.g., "jb2a.explosion.01.orange")
 * @returns {string} Local file path or original path if no mapping found
 */
function convertJB2APath(jb2aPath) {
    return JB2A_PATH_MAP[jb2aPath] || jb2aPath;
}

/**
 * Get effect file path with fallback options
 * @param {string} jb2aPath - JB2A database path
 * @returns {string} Best available path for the effect
 */
function getEffectPath(jb2aPath) {
    // Try JB2A database first (if module is installed)
    if (typeof Sequencer !== 'undefined' && Sequencer.Database && Sequencer.Database.entryExists(jb2aPath)) {
        return jb2aPath;
    }
    
    // Fall back to local file path
    return convertJB2APath(jb2aPath);
}

/**
 * Enhanced effect creation with automatic path resolution
 * @param {string} effectPath - JB2A path or local path
 * @returns {Object} Sequencer effect with resolved path
 */
function createEffect(effectPath) {
    const resolvedPath = getEffectPath(effectPath);
    return new Sequence().effect().file(resolvedPath);
}

// Example usage:
/*
// Instead of:
new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(token)
    .play();

// Use:
createEffect("jb2a.explosion.01.orange")
    .atLocation(token)
    .play();

// Or manually:
const effectPath = getEffectPath("jb2a.explosion.01.orange");
new Sequence()
    .effect()
        .file(effectPath)
        .atLocation(token)
    .play();
*/

// Display mapping information
console.log("🎭 JB2A Path Converter Loaded");
console.log("Available mappings:", Object.keys(JB2A_PATH_MAP).length);
console.log("Use getEffectPath(jb2aPath) to resolve effect paths");
console.log("Use createEffect(jb2aPath) for enhanced effect creation");

// Export functions for use in other macros
if (typeof window !== 'undefined') {
    window.JB2AConverter = {
        convertJB2APath,
        getEffectPath,
        createEffect,
        pathMap: JB2A_PATH_MAP
    };
}