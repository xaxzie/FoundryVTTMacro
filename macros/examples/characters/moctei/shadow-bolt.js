/**
 * Moctei's Shadow Bolt
 * A dark projectile that phases through armor and drains life energy
 * Character: Moctei (Shadow Specialist)
 */

// Configuration
const config = {
    targetToken: null, // Will be selected via targeting
    sourceToken: token, // Moctei's token
    spellName: "Shadow Bolt",
    damage: "2d6+4",
    damageType: "necrotic",
    drainEffect: true
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

// Create shadow bolt sequence
new Sequence()
    // Casting preparation - shadows gathering
    .effect()
        .file("jb2a.template_circle.aura.01.complete.small.purple")
        .atLocation(config.sourceToken)
        .scale(0.8)
        .duration(1200)
        .fadeIn(300)
        .fadeOut(400)
        .opacity(0.8)
        .belowTokens()
        .tint("#4B0082")
        
    // Dark energy swirling around caster
    .effect()
        .file("jb2a.energy_strands.in.purple.01")
        .atLocation(config.sourceToken)
        .scale(0.7)
        .duration(1000)
        .fadeIn(200)
        .fadeOut(300)
        .tint("#2E0052")
        
    // Casting sound - ominous whisper
    .sound()
        .file("sounds/magic/shadow-whisper.wav")
        .volume(0.7)
        
    .wait(600)
    
    // Shadow bolt projectile
    .effect()
        .file("jb2a.eldritch_blast.dark_purple")
        .atLocation(config.sourceToken)
        .stretchTo(config.targetToken)
        .scale(0.9)
        .duration(1000)
        .waitUntilFinished(-300)
        
    // Projectile sound - dark whoosh
    .sound()
        .file("sounds/magic/shadow-bolt-whoosh.wav")
        .volume(0.8)
        
    // Impact effects - dark explosion
    .effect()
        .file("jb2a.impact.023.dark_purple")
        .atLocation(config.targetToken)
        .scale(1.1)
        .duration(1500)
        .fadeIn(100)
        
    // Shadow tendrils wrapping target
    .effect()
        .file("jb2a.energy_strands.overlay.dark_purple.01")
        .atLocation(config.targetToken)
        .scale(0.8)
        .duration(3000)
        .fadeIn(400)
        .fadeOut(1200)
        .tint("#1A0033")
        
    // Life drain visual
    .effect()
        .file("jb2a.energy_strands.range.standard.purple.01")
        .atLocation(config.targetToken)
        .stretchTo(config.sourceToken)
        .scale(0.6)
        .duration(2000)
        .fadeIn(500)
        .fadeOut(800)
        .tint("#8B008B")
        
    // Dark mark on target
    .effect()
        .file("jb2a.template_circle.symbol.normal.skull.purple")
        .atLocation(config.targetToken)
        .scale(0.5)
        .duration(5000)
        .fadeIn(800)
        .fadeOut(1500)
        .belowTokens()
        .tint("#4B0082")
        
    // Impact sound - dark energy
    .sound()
        .file("sounds/magic/shadow-impact.wav")
        .volume(0.8)
        
    // Life drain sound
    .sound()
        .file("sounds/magic/life-drain.wav")
        .volume(0.6)
        .delay(800)
        
    // Apply damage and drain effect
    .thenDo(() => {
        // Main damage roll
        const damageRoll = new Roll(config.damage);
        damageRoll.toMessage({
            speaker: ChatMessage.getSpeaker({token: config.sourceToken}),
            flavor: `${config.spellName} - ${config.damageType} damage to ${config.targetToken.name}`
        });
        
        if (config.drainEffect) {
            // Life drain healing for caster
            const drainRoll = new Roll("1d4+1");
            drainRoll.toMessage({
                speaker: ChatMessage.getSpeaker({token: config.sourceToken}),
                flavor: `${config.spellName} - Life drained, Moctei heals`
            });
            
            // Healing visual on caster
            new Sequence()
                .effect()
                    .file("jb2a.healing_generic.400x400.purple")
                    .atLocation(config.sourceToken)
                    .scale(0.6)
                    .duration(1500)
                    .fadeIn(300)
                    .fadeOut(600)
                    .tint("#8B008B")
                    
                .sound()
                    .file("sounds/magic/dark-healing.wav")
                    .volume(0.5)
                    
                .play();
        }
        
        // Status message
        ChatMessage.create({
            content: `🌑 <b>Moctei's</b> <i>${config.spellName}</i> pierces through <b>${config.targetToken.name}</b>, draining life essence!
            <br>💀 <i>The target feels their vitality being sapped away...</i>`,
            speaker: ChatMessage.getSpeaker({token: config.sourceToken})
        });
    })
    
    .play();

// Casting announcement
ChatMessage.create({
    content: `🌑 <b>Moctei</b> channels dark energy and launches a <i>${config.spellName}</i>!
    <br><i>"Embrace the void..."</i>`,
    speaker: ChatMessage.getSpeaker({token: config.sourceToken})
});