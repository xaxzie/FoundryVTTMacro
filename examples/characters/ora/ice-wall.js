/**
 * Ora's Ice Wall
 * Creates a protective barrier of ice that blocks movement and provides cover
 * Character: Ora (Water/Ice Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    spellName: "Ice Wall",
    wallLength: 6, // Number of grid squares
    duration: 60000, // 1 minute in milliseconds
    hp: 15 // Wall HP per section
};

// Get placement location from user
const template = await warpgate.crosshairs.show({
    size: 1,
    icon: "icons/magic/water/barrier-ice-crystal-wall-blue.webp",
    label: "Place Ice Wall",
    drawIcon: true,
    drawOutline: true
});

if (template.cancelled) return;

// Calculate wall positions
const wallPositions = [];
const startX = template.x;
const startY = template.y;
const gridSize = canvas.grid.size;

// Create horizontal wall positions
for (let i = 0; i < config.wallLength; i++) {
    wallPositions.push({
        x: startX + (i * gridSize),
        y: startY
    });
}

// Create ice wall sequence
new Sequence()
    // Casting preparation
    .effect()
        .file("jb2a.template_circle.aura.01.complete.medium.blue")
        .atLocation(config.casterToken)
        .scale(1.2)
        .duration(2000)
        .fadeIn(400)
        .fadeOut(600)
        .opacity(0.8)
        .belowTokens()
        
    // Frost magic gathering
    .effect()
        .file("jb2a.ice_spikes.radial.white")
        .atLocation(config.casterToken)
        .scale(0.8)
        .duration(1500)
        .fadeIn(300)
        .fadeOut(400)
        
    // Casting sound
    .sound()
        .file("sounds/magic/ice-wall-cast.wav")
        .volume(0.8)
        
    // Wait for casting
    .wait(1000)
    
    // Create each wall section
    .macro()
        .macro(async () => {
            for (let i = 0; i < wallPositions.length; i++) {
                const position = wallPositions[i];
                
                // Delay each section slightly for cascading effect
                setTimeout(() => {
                    new Sequence()
                        // Ground frost effect
                        .effect()
                            .file("jb2a.template_circle.symbol.normal.snowflake.blue")
                            .atLocation(position)
                            .scale(0.8)
                            .duration(config.duration + 2000)
                            .fadeIn(300)
                            .fadeOut(1000)
                            .belowTokens()
                            .persist()
                            .name(`ice-wall-base-${i}`)
                            
                        // Ice wall rising
                        .effect()
                            .file("jb2a.wall_of_force.vertical.blue")
                            .atLocation(position)
                            .scale(1.0)
                            .duration(config.duration)
                            .fadeIn(800)
                            .fadeOut(1500)
                            .persist()
                            .name(`ice-wall-${i}`)
                            
                        // Ice spikes emerging
                        .effect()
                            .file("jb2a.ice_spikes.radial.white")
                            .atLocation(position)
                            .scale(0.6)
                            .duration(1500)
                            .fadeIn(200)
                            .fadeOut(600)
                            
                        // Creation sound
                        .sound()
                            .file("sounds/magic/ice-formation.wav")
                            .volume(0.6)
                            
                        .play();
                }, i * 200); // 200ms delay between each section
            }
        })
        
    // Wall completion effects
    .wait(config.wallLength * 200 + 1000)
    
    .effect()
        .file("jb2a.impact.frost.blue.01")
        .atLocation({x: startX + (config.wallLength * gridSize / 2), y: startY})
        .scale(2.0)
        .duration(2000)
        .fadeIn(300)
        
    // Completion sound
    .sound()
        .file("sounds/magic/ice-wall-complete.wav")
        .volume(0.7)
        
    // Set up wall destruction after duration
    .thenDo(() => {
        setTimeout(() => {
            // Destroy wall effects
            for (let i = 0; i < config.wallLength; i++) {
                new Sequence()
                    .effect()
                        .file("jb2a.impact.frost.blue.01")
                        .atLocation(wallPositions[i])
                        .scale(0.8)
                        .duration(1000)
                        
                    .sound()
                        .file("sounds/magic/ice-shatter.wav")
                        .volume(0.5)
                        
                    .animation()
                        .on(Sequencer.EffectManager.getEffects({name: `ice-wall-${i}`})[0])
                        .fadeOut(1000)
                        
                    .animation()
                        .on(Sequencer.EffectManager.getEffects({name: `ice-wall-base-${i}`})[0])
                        .fadeOut(1500)
                        
                    .play();
            }
            
            ChatMessage.create({
                content: `🧊 Ora's Ice Wall crumbles and melts away...`,
                speaker: ChatMessage.getSpeaker({token: config.casterToken})
            });
        }, config.duration);
    })
    
    .play();

// Create wall status message
ChatMessage.create({
    content: `🧊 <b>Ora</b> raises an <i>${config.spellName}</i>! A barrier of ice ${config.wallLength} squares long blocks the way.
    <br><i>Wall HP: ${config.hp} per section | Duration: ${config.duration/1000} seconds</i>`,
    speaker: ChatMessage.getSpeaker({token: config.casterToken})
});