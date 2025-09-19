/**
 * Moctei's Shadow Step
 * Teleports through the shadow realm to appear behind an enemy for a surprise attack
 * Character: Moctei (Shadow Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    spellName: "Shadow Step",
    maxRange: 60, // Maximum teleport range in feet
    bonusDamage: "2d6",
    damageType: "psychic",
    stealthBonus: true
};

// Get target location or enemy
const template = await warpgate.crosshairs.show({
    size: 1,
    icon: "icons/magic/unholy/strike-body-explode-disintegrate.webp",
    label: "Shadow Step Destination",
    drawIcon: true,
    drawOutline: true,
    fillAlpha: 0.3,
    fillColor: "#4B0082"
});

if (template.cancelled) return;

const destination = {x: template.x, y: template.y};

// Calculate distance
const distance = Math.sqrt(
    Math.pow(destination.x - config.casterToken.center.x, 2) + 
    Math.pow(destination.y - config.casterToken.center.y, 2)
);
const distanceInFeet = (distance / canvas.grid.size) * canvas.grid.distance;

if (distanceInFeet > config.maxRange) {
    ui.notifications.warn(`Target location is too far! Maximum range is ${config.maxRange} feet.`);
    return;
}

// Check for enemies near destination for sneak attack
const nearbyEnemies = canvas.tokens.placeables.filter(t => {
    if (t === config.casterToken) return false;
    const enemyDistance = Math.sqrt(
        Math.pow(t.center.x - destination.x, 2) + 
        Math.pow(t.center.y - destination.y, 2)
    );
    const enemyDistanceFeet = (enemyDistance / canvas.grid.size) * canvas.grid.distance;
    const isEnemy = t.document.disposition <= 0; // Hostile or neutral
    return enemyDistanceFeet <= 10 && isEnemy; // Within 10 feet
});

// Create shadow step sequence
new Sequence()
    // Pre-teleport shadow gathering
    .effect()
        .file("jb2a.template_circle.aura.01.complete.small.purple")
        .atLocation(config.casterToken)
        .scale(0.9)
        .duration(1500)
        .fadeIn(300)
        .fadeOut(500)
        .tint("#1A0033")
        .belowTokens()
        
    // Shadow energy building
    .effect()
        .file("jb2a.energy_strands.in.purple.01")
        .atLocation(config.casterToken)
        .scale(0.8)
        .duration(1200)
        .fadeIn(200)
        .fadeOut(400)
        .tint("#2E0052")
        
    // Whispered incantation
    .sound()
        .file("sounds/magic/shadow-whisper.wav")
        .volume(0.6)
        
    .wait(800)
    
    // Vanishing effect - caster disappears
    .effect()
        .file("jb2a.misty_step.02.dark_black")
        .atLocation(config.casterToken)
        .scale(1.0)
        .duration(1000)
        .fadeIn(200)
        .fadeOut(400)
        
    // Shadow portal at origin
    .effect()
        .file("jb2a.template_circle.symbol.normal.skull.purple")
        .atLocation(config.casterToken)
        .scale(0.8)
        .duration(2000)
        .fadeIn(300)
        .fadeOut(1200)
        .tint("#1A0033")
        .belowTokens()
        
    // Teleportation sound - void whisper
    .sound()
        .file("sounds/magic/void-teleport.wav")
        .volume(0.8)
        
    // Hide the caster token temporarily
    .animation()
        .on(config.casterToken)
        .opacity(0)
        .duration(800)
        .waitUntilFinished()
        
    // Shadow travel effect - path through shadow realm
    .effect()
        .file("jb2a.energy_strands.range.standard.purple.01")
        .atLocation(config.casterToken)
        .stretchTo(destination)
        .scale(0.8)
        .duration(1500)
        .fadeIn(400)
        .fadeOut(800)
        .tint("#0D0D0D")
        
    .wait(400)
    
    // Reappearance - shadow portal at destination
    .effect()
        .file("jb2a.template_circle.symbol.normal.skull.purple")
        .atLocation(destination)
        .scale(0.8)
        .duration(2000)
        .fadeIn(300)
        .fadeOut(1200)
        .tint("#4B0082")
        .belowTokens()
        
    // Emerging from shadows
    .effect()
        .file("jb2a.misty_step.02.dark_black")
        .atLocation(destination)
        .scale(1.0)
        .duration(1000)
        .fadeIn(200)
        .fadeOut(600)
        
    // Move caster token to destination
    .animation()
        .on(config.casterToken)
        .teleportTo(destination)
        .snapToGrid()
        .waitUntilFinished()
        
    // Restore caster visibility
    .animation()
        .on(config.casterToken)
        .opacity(1)
        .duration(600)
        .fadeIn(300)
        
    // Reappearance sound
    .sound()
        .file("sounds/magic/shadow-emerge.wav")
        .volume(0.7)
        
    // Shadow aura around caster after teleport
    .effect()
        .file("jb2a.energy_strands.overlay.dark_purple.01")
        .atLocation(config.casterToken)
        .scale(0.7)
        .duration(3000)
        .fadeIn(500)
        .fadeOut(1500)
        .tint("#1A0033")
        
    // Check for sneak attack opportunity
    .macro()
        .macro(() => {
            if (nearbyEnemies.length > 0) {
                // Apply sneak attack to nearest enemy
                const target = nearbyEnemies[0];
                
                setTimeout(() => {
                    new Sequence()
                        // Surprise attack visual
                        .effect()
                            .file("jb2a.impact.023.dark_purple")
                            .atLocation(target)
                            .scale(1.2)
                            .duration(1500)
                            .fadeIn(100)
                            
                        // Shadow strike tendrils
                        .effect()
                            .file("jb2a.energy_strands.overlay.dark_purple.01")
                            .atLocation(target)
                            .scale(0.8)
                            .duration(2500)
                            .fadeIn(300)
                            .fadeOut(1000)
                            .tint("#000000")
                            
                        // Fear effect
                        .effect()
                            .file("jb2a.template_circle.symbol.normal.fear.dark_purple")
                            .atLocation(target)
                            .scale(0.6)
                            .duration(4000)
                            .fadeIn(600)
                            .fadeOut(1500)
                            .belowTokens()
                            
                        .sound()
                            .file("sounds/magic/shadow-strike.wav")
                            .volume(0.8)
                            
                        .play();
                        
                    // Sneak attack damage
                    const sneak = new Roll(config.bonusDamage);
                    sneak.toMessage({
                        speaker: ChatMessage.getSpeaker({token: config.casterToken}),
                        flavor: `${config.spellName} - Sneak Attack (${config.damageType}) on ${target.name}`
                    });
                    
                    ChatMessage.create({
                        content: `🗡️ <b>Moctei</b> strikes from the shadows! <b>${target.name}</b> is caught completely off-guard!
                        <br>💀 <i>Sneak attack deals additional ${config.damageType} damage!</i>`,
                        speaker: ChatMessage.getSpeaker({token: config.casterToken})
                    });
                }, 800);
            }
        })
        
    .thenDo(() => {
        const distanceTraveled = Math.round(distanceInFeet);
        
        if (nearbyEnemies.length > 0) {
            ChatMessage.create({
                content: `🌑 <b>Moctei</b> vanishes into shadow and reappears ${distanceTraveled} feet away!
                <br>👁️ <i>Enemies nearby: ${nearbyEnemies.map(t => t.name).join(", ")} - perfect for a sneak attack!</i>`,
                speaker: ChatMessage.getSpeaker({token: config.casterToken})
            });
        } else {
            ChatMessage.create({
                content: `🌑 <b>Moctei</b> steps through the shadow realm, traveling ${distanceTraveled} feet instantly.
                <br>🕳️ <i>The shadows briefly part to reveal his new position...</i>`,
                speaker: ChatMessage.getSpeaker({token: config.casterToken})
            });
        }
        
        // Grant advantage on next attack if stealthBonus is enabled
        if (config.stealthBonus) {
            ChatMessage.create({
                content: `🎭 <i>Moctei gains advantage on his next attack from the element of surprise!</i>`,
                speaker: ChatMessage.getSpeaker({token: config.casterToken})
            });
        }
    })
    
    .play();

// Casting announcement
ChatMessage.create({
    content: `🌑 <b>Moctei</b> prepares to traverse the shadow realm with <i>${config.spellName}</i>!
    <br><i>"Through darkness, I walk unseen..."</i>`,
    speaker: ChatMessage.getSpeaker({token: config.casterToken})
});