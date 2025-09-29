/**
 * Macro: Magic Missile
 * Description: Fires multiple magic missiles from caster to target
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token (caster)
 * - One targeted token
 * 
 * Usage:
 * 1. Select your caster token
 * 2. Target an enemy
 * 3. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 * @requires JB2A
 */

// Validate selections
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token!");
    return;
}

if (!game.user.targets.size) {
    ui.notifications.warn("Please target an enemy!");
    return;
}

const caster = canvas.tokens.controlled[0];
const target = Array.from(game.user.targets)[0];

// Fire three magic missiles with staggered timing
new Sequence()
    .effect()
        .atLocation(caster)
        .stretchTo(target)
        .file("jb2a.magic_missile")
        .repeats(3, 200, 300) // 3 missiles, 200-300ms apart
        .randomizeMirrorY()
    .play();