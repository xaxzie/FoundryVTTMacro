/**
 * Macro: Basic Sound Effect
 * Description: Plays a sound effect at specified volume
 * 
 * Requirements:
 * - Sound file in your world's sounds directory
 * 
 * Usage:
 * 1. Update the file path to match your sound file
 * 2. Execute this macro
 * 
 * @author Sequencer Examples
 * @version 1.0
 */

// Play a simple sound effect
new Sequence()
    .sound()
        .file("sounds/spell-cast.wav") // Update this path to your sound file
        .volume(0.7)
    .play();

// Alternative: Play system sounds (if available)
// new Sequence()
//     .sound()
//         .file("sounds/notify.wav")
//         .volume(0.5)
//     .play();