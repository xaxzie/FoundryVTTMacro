/**
 * Moctei's Umbral Strike
 * A devastating shadow-infused melee attack that weakens the target's defenses
 * Character: Moctei (Shadow Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    targetToken: null,
    spellName: "Umbral Strike",
    baseDamage: "3d8+5",
    bonusDamage: "2d6", // Shadow damage
    damageTypes: ["slashing", "necrotic"],
    debuffDuration: 60000, // 1 minute defense reduction
    reachBonus: 10 // Extended reach through shadows
};

// Get target token
const targets = Array.from(game.user.targets);
if (targets.length === 0) {
    ui.notifications.warn("Please target an enemy first!");
    return;
}
config.targetToken = targets[0];

// Check if target is within extended reach
const distance = Math.sqrt(
    Math.pow(config.targetToken.center.x - config.casterToken.center.x, 2) + 
    Math.pow(config.targetToken.center.y - config.casterToken.center.y, 2)
);
const distanceInFeet = (distance / canvas.grid.size) * canvas.grid.distance;

if (distanceInFeet > config.reachBonus) {
    ui.notifications.warn(`Target is too far! Umbral Strike has ${config.reachBonus} feet reach.`);
    return;
}

// Create umbral strike sequence
new Sequence()
    // Pre-strike shadow gathering
    .effect()
        .file("jb2a.template_circle.aura.01.complete.medium.purple")
        .atLocation(config.casterToken)
        .scale(1.2)
        .duration(2000)
        .fadeIn(400)
        .fadeOut(600)
        .tint("#1A0033")
        .belowTokens()
        
    // Shadow energy wrapping around weapon/hands
    .effect()
        .file("jb2a.energy_strands.in.purple.01")
        .atLocation(config.casterToken)
        .scale(0.9)
        .duration(1800)
        .fadeIn(300)
        .fadeOut(500)
        .tint("#2E0052")
        
    // Dark power building sound
    .sound()
        .file("sounds/magic/shadow-power-build.wav")
        .volume(0.8)
        
    .wait(1200)
    
    // Shadow tendrils extending toward target
    .effect()
        .file("jb2a.energy_strands.range.standard.purple.01")
        .atLocation(config.casterToken)
        .stretchTo(config.targetToken)
        .scale(1.0)
        .duration(1200)
        .fadeIn(300)
        .fadeOut(400)
        .tint("#0D0D0D")
        
    // Strike launch - shadow-wrapped attack
    .effect()
        .file("jb2a.melee_attack.04.trail.purple")
        .atLocation(config.casterToken)
        .stretchTo(config.targetToken)
        .scale(1.3)
        .duration(800)
        .waitUntilFinished(-200)
        
    // Strike sound - dark blade
    .sound()
        .file("sounds/magic/shadow-blade-strike.wav")
        .volume(0.9)
        
    // Massive impact - umbral explosion
    .effect()
        .file("jb2a.impact.023.dark_purple")
        .atLocation(config.targetToken)
        .scale(1.5)
        .duration(2000)
        .fadeIn(100)
        
    // Shadow energy eruption
    .effect()
        .file("jb2a.explosion.04.purplepink")
        .atLocation(config.targetToken)
        .scale(1.2)
        .duration(1800)
        .fadeIn(200)
        .fadeOut(800)
        .tint("#4B0082")
        
    // Shadow tendrils wrapping and draining target
    .effect()
        .file("jb2a.energy_strands.overlay.dark_purple.01")
        .atLocation(config.targetToken)
        .scale(1.0)
        .duration(4000)
        .fadeIn(500)
        .fadeOut(1500)
        .tint("#000000")
        
    // Weakness mark on target
    .effect()
        .file("jb2a.template_circle.symbol.normal.fear.dark_purple")
        .atLocation(config.targetToken)
        .scale(0.8)
        .duration(config.debuffDuration)
        .fadeIn(1000)
        .fadeOut(3000)
        .belowTokens()
        .tint("#1A0033")
        .persist()
        .name(`umbral-weakness-${config.targetToken.id}`)
        
    // Impact sound - devastating blow
    .sound()
        .file("sounds/magic/umbral-impact.wav")
        .volume(1.0)
        
    // Secondary shadow explosion
    .effect()
        .file("jb2a.impact.earth.02.browngreen.0")
        .atLocation(config.targetToken)
        .scale(1.0)
        .duration(1500)
        .fadeIn(400)
        .fadeOut(600)
        .tint("#2E0052")
        .delay(800)
        
    // Knockback effect
    .animation()
        .on(config.targetToken)
        .moveAwayFrom(config.casterToken, {ease: "easeOutQuart"})
        .duration(1000)
        .moveSpeed(150)
        
    // Apply damage and debuff
    .thenDo(() => {
        // Main physical damage
        const physicalRoll = new Roll(config.baseDamage);
        physicalRoll.toMessage({
            speaker: ChatMessage.getSpeaker({token: config.casterToken}),
            flavor: `${config.spellName} - ${config.damageTypes[0]} damage to ${config.targetToken.name}`
        });
        
        // Shadow damage
        const shadowRoll = new Roll(config.bonusDamage);
        shadowRoll.toMessage({
            speaker: ChatMessage.getSpeaker({token: config.casterToken}),
            flavor: `${config.spellName} - ${config.damageTypes[1]} damage to ${config.targetToken.name}`
        });
        
        // Status message with debuff information
        ChatMessage.create({
            content: `⚔️ <b>Moctei's</b> <i>${config.spellName}</i> tears through <b>${config.targetToken.name}</b>!
            <br>💀 The shadow-infused blow deals both physical and necrotic damage!
            <br>🛡️ <i>${config.targetToken.name}'s defenses are weakened by umbral energy for ${config.debuffDuration/1000} seconds!</i>`,
            speaker: ChatMessage.getSpeaker({token: config.casterToken})
        });
        
        // Schedule debuff removal
        setTimeout(() => {
            Sequencer.EffectManager.endEffects({name: `umbral-weakness-${config.targetToken.id}`});
            
            ChatMessage.create({
                content: `🌑 The umbral weakness fades from <b>${config.targetToken.name}</b>.`,
                speaker: ChatMessage.getSpeaker({token: config.casterToken})
            });
        }, config.debuffDuration);
    })
    
    // Caster empowerment effect
    .effect()
        .file("jb2a.energy_strands.overlay.dark_purple.01")
        .atLocation(config.casterToken)
        .scale(0.8)
        .duration(5000)
        .fadeIn(800)
        .fadeOut(2000)
        .tint("#4B0082")
        .opacity(0.6)
        
    // Power surge sound for caster
    .sound()
        .file("sounds/magic/shadow-empowerment.wav")
        .volume(0.6)
        .delay(1000)
        
    .play();

// Pre-attack ritual announcement
ChatMessage.create({
    content: `⚔️ <b>Moctei</b> channels umbral power into his weapon for an <i>${config.spellName}</i>!
    <br><i>"Feel the touch of the void!"</i>`,
    speaker: ChatMessage.getSpeaker({token: config.casterToken})
});