/**
 * Ora's Frost Bolt
 * A precise ice projectile that creates crystalline effects on impact
 * Character: Ora (Water/Ice Specialist)
 */

// Configuration
const config = {
    targetToken: null, // Will be selected via targeting
    sourceToken: token, // Ora's token
    spellName: "Frost Bolt",
    damage: "1d8+4",
    damageType: "cold"
};

// Get target token
if (!config.targetToken) {
    const targets = Array.from(game.user.targets);
    if (targets.length === 0) {
        ui.notifications.warn("Please target a token first!");
        return;
    }
    config.targetToken = targets[0];
}

// Calculate trajectory
const ray = new Ray(config.sourceToken.center, config.targetToken.center);
const distance = canvas.grid.measureDistances([{ray}], {gridSpaces: true})[0];

// Create frost bolt sequence
new Sequence()
    // Casting preparation - ice crystals forming
    .effect()
        .file("jb2a.ice_spikes.radial.white")
        .atLocation(config.sourceToken)
        .scale(0.6)
        .duration(1000)
        .fadeIn(200)
        .fadeOut(300)
        .belowTokens()
        
    // Frost aura around caster
    .effect()
        .file("jb2a.template_circle.aura.01.complete.small.blue")
        .atLocation(config.sourceToken)
        .scale(0.8)
        .duration(1200)
        .fadeIn(300)
        .fadeOut(400)
        .opacity(0.7)
        .belowTokens()
        
    // Projectile launch sound
    .sound()
        .file("sounds/magic/ice-crystal-launch.wav")
        .volume(0.7)
        
    // Frost bolt projectile
    .effect()
        .file("jb2a.ice_shard.01.blue")
        .atLocation(config.sourceToken)
        .stretchTo(config.targetToken)
        .scale(0.8)
        .duration(800)
        .waitUntilFinished(-200)
        
    // Impact effects
    .effect()
        .file("jb2a.impact.frost.blue.01")
        .atLocation(config.targetToken)
        .scale(1.2)
        .duration(1500)
        .fadeIn(100)
        
    // Ice crystal explosion at target
    .effect()
        .file("jb2a.ice_spikes.radial.white")
        .atLocation(config.targetToken)
        .scale(0.9)
        .duration(2000)
        .fadeIn(200)
        .fadeOut(600)
        
    // Frost damage indicator
    .effect()
        .file("jb2a.template_circle.symbol.normal.snowflake.blue")
        .atLocation(config.targetToken)
        .scale(0.6)
        .duration(3000)
        .fadeIn(500)
        .fadeOut(1000)
        .belowTokens()
        
    // Impact sound
    .sound()
        .file("sounds/magic/ice-impact.wav")
        .volume(0.8)
        
    // Optional: Apply damage and effects
    .thenDo(() => {
        // Damage roll
        const roll = new Roll(config.damage);
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({token: config.sourceToken}),
            flavor: `${config.spellName} - ${config.damageType} damage`
        });
        
        // Apply frost effect (slow condition)
        ChatMessage.create({
            content: `<b>${config.targetToken.name}</b> is struck by Ora's Frost Bolt and becomes slowed by the icy magic!`,
            speaker: ChatMessage.getSpeaker({token: config.sourceToken})
        });
    })
    
    .play();

// Macro completion message
ChatMessage.create({
    content: `🧊 <b>Ora</b> casts <i>${config.spellName}</i> at <b>${config.targetToken.name}</b>!`,
    speaker: ChatMessage.getSpeaker({token: config.sourceToken})
});