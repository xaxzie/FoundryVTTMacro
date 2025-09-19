/**
 * Ora's Water Whip
 * A flexible water tendril that can strike multiple enemies in a line
 * Character: Ora (Water/Ice Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    spellName: "Water Whip",
    range: 30, // Range in feet
    damage: "2d6+3",
    damageType: "bludgeoning",
    width: 5 // Width of the whip in feet
};

// Get target direction using crosshairs
const template = await warpgate.crosshairs.show({
    size: config.range / canvas.grid.distance,
    icon: "icons/magic/water/wave-water-blue.webp",
    label: "Water Whip Direction",
    drawIcon: true,
    drawOutline: true,
    fillAlpha: 0.2,
    fillColor: "#0066cc"
});

if (template.cancelled) return;

// Calculate whip path
const ray = new Ray(config.casterToken.center, {x: template.x, y: template.y});
const endPoint = ray.project(config.range / canvas.grid.distance);

// Find tokens in the whip's path
const tokensInPath = canvas.tokens.placeables.filter(t => {
    if (t === config.casterToken) return false;
    
    // Check if token intersects with the whip line
    const distance = Math.abs(
        (endPoint.y - config.casterToken.center.y) * t.center.x - 
        (endPoint.x - config.casterToken.center.x) * t.center.y + 
        endPoint.x * config.casterToken.center.y - 
        endPoint.y * config.casterToken.center.x
    ) / Math.sqrt(
        Math.pow(endPoint.y - config.casterToken.center.y, 2) + 
        Math.pow(endPoint.x - config.casterToken.center.x, 2)
    );
    
    return distance <= (config.width * canvas.grid.size / canvas.grid.distance) / 2;
});

// Create water whip sequence
new Sequence()
    // Casting preparation - water gathering
    .effect()
        .file("jb2a.template_circle.aura.01.complete.medium.blue")
        .atLocation(config.casterToken)
        .scale(0.9)
        .duration(1500)
        .fadeIn(300)
        .fadeOut(400)
        .opacity(0.6)
        .belowTokens()
        
    // Water magic swirling around caster
    .effect()
        .file("jb2a.whirlpool.blue")
        .atLocation(config.casterToken)
        .scale(0.7)
        .duration(1200)
        .fadeIn(200)
        .fadeOut(300)
        .belowTokens()
        
    // Casting sound
    .sound()
        .file("sounds/magic/water-gather.wav")
        .volume(0.7)
        
    .wait(800)
    
    // Water whip formation and strike
    .effect()
        .file("jb2a.breath_weapons02.burst.line.blue")
        .atLocation(config.casterToken)
        .stretchTo(endPoint)
        .scale(0.8)
        .duration(1500)
        .fadeIn(200)
        .fadeOut(600)
        
    // Whip crack sound
    .sound()
        .file("sounds/magic/water-whip-crack.wav")
        .volume(0.8)
        
    // Impact effects on each target
    .macro()
        .macro(() => {
            tokensInPath.forEach((target, index) => {
                setTimeout(() => {
                    new Sequence()
                        // Water splash on target
                        .effect()
                            .file("jb2a.impact.water.01.blue")
                            .atLocation(target)
                            .scale(1.0)
                            .duration(1200)
                            .fadeIn(100)
                            
                        // Water droplets
                        .effect()
                            .file("jb2a.particles.inward.blue.01")
                            .atLocation(target)
                            .scale(0.6)
                            .duration(2000)
                            .fadeIn(300)
                            .fadeOut(800)
                            
                        // Knockback effect
                        .animation()
                            .on(target)
                            .moveTowards(endPoint, {ease: "easeOutBack"})
                            .duration(800)
                            .moveSpeed(200)
                            
                        // Impact sound
                        .sound()
                            .file("sounds/magic/water-impact.wav")
                            .volume(0.6)
                            
                        .play();
                }, index * 100); // Slight delay between targets
            });
        })
        
    // Damage calculation and application
    .thenDo(() => {
        if (tokensInPath.length > 0) {
            tokensInPath.forEach(target => {
                const roll = new Roll(config.damage);
                roll.toMessage({
                    speaker: ChatMessage.getSpeaker({token: config.casterToken}),
                    flavor: `${config.spellName} hits ${target.name} - ${config.damageType} damage`
                });
            });
            
            ChatMessage.create({
                content: `🌊 Ora's Water Whip strikes ${tokensInPath.length} target(s): ${tokensInPath.map(t => t.name).join(", ")}!`,
                speaker: ChatMessage.getSpeaker({token: config.casterToken})
            });
        } else {
            ChatMessage.create({
                content: `🌊 Ora's Water Whip cracks through the air but strikes no targets.`,
                speaker: ChatMessage.getSpeaker({token: config.casterToken})
            });
        }
    })
    
    // Residual water effects
    .effect()
        .file("jb2a.template_line_piercing.generic.01.blue")
        .atLocation(config.casterToken)
        .stretchTo(endPoint)
        .scale(0.6)
        .duration(3000)
        .fadeIn(500)
        .fadeOut(1500)
        .opacity(0.4)
        .belowTokens()
        
    .play();

// Initial casting message
ChatMessage.create({
    content: `🌊 <b>Ora</b> summons a <i>${config.spellName}</i> and lashes out with liquid fury!`,
    speaker: ChatMessage.getSpeaker({token: config.casterToken})
});