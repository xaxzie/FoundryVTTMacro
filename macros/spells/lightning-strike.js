/**
 * Macro: Lightning Strike (Random)
 * Description: Random lightning strikes with dynamic effects
 * Based on official Sequencer documentation example
 * 
 * Requirements:
 * - JB2A module installed
 * - One selected token
 * 
 * Usage:
 * 1. Select target token
 * 2. Execute this macro
 * 
 * @author Sequencer Examples (from official docs)
 * @version 1.0
 * @requires JB2A
 */

// Validate token selection
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a target token!");
    return;
}

const target = canvas.tokens.controlled[0];

// Random lightning strike effect
new Sequence()
    .effect()
        .atLocation(target)
        .file('jb2a.lightning_strike.no_ring.blue')
        .setMustache({
            // Random letter between a to f for variation
            "letter": () => {
                const letters = ['a', 'b', 'c', 'd', 'e', 'f']; 
                return letters[Math.floor(Math.random() * letters.length)];
            }
        })
        .scale(2)
        .randomizeMirrorX()
    .play();