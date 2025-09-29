/**
 * Moctei's Darkness Cloud
 * Creates an area of magical darkness that blinds enemies and provides concealment
 * Character: Moctei (Shadow Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    spellName: "Darkness Cloud",
    radius: 20, // Radius in feet
    duration: 30000, // 30 seconds
    blindDuration: 60000, // 1 minute blind effect for those caught inside
    obscurement: "heavily obscured"
};

// Get placement location
const template = await new Portal().crosshairs.show({
    size: config.radius / canvas.grid.distance,
    icon: "icons/magic/unholy/barrier-shield-glowing-purple.webp",
    label: "Darkness Cloud Center",
    drawIcon: true,
    drawOutline: true,
    fillAlpha: 0.4,
    fillColor: "#1a1a1a"
});

if (template.cancelled) return;

const cloudLocation = { x: template.x, y: template.y };

// Find tokens initially in the area
const tokensInArea = canvas.tokens.placeables.filter(t => {
    if (t === config.casterToken) return false;
    const distance = Math.sqrt(
        Math.pow(t.center.x - cloudLocation.x, 2) +
        Math.pow(t.center.y - cloudLocation.y, 2)
    );
    return distance <= (config.radius * canvas.grid.size / canvas.grid.distance);
});

// Create darkness cloud sequence
new Sequence()
    // Casting preparation - shadow magic gathering
    .effect()
    .file("jb2a.template_circle.aura.01.complete.medium.purple")
    .atLocation(config.casterToken)
    .scale(1.1)
    .duration(2000)
    .fadeIn(400)
    .fadeOut(600)
    .opacity(0.9)
    .belowTokens()
    .tint("#2E0052")

    // Dark energy building up
    .effect()
    .file("jb2a.energy_strands.in.purple.01")
    .atLocation(config.casterToken)
    .scale(1.0)
    .duration(1800)
    .fadeIn(300)
    .fadeOut(500)
    .tint("#1A0033")

    // Ominous casting sound
    .sound()
    .file("sounds/magic/darkness-gather.wav")
    .volume(0.8)

    .wait(1200)

    // Cloud formation - base darkness
    .effect()
    .file("jb2a.template_circle.out_pulse.02.purplepink")
    .atLocation(cloudLocation)
    .scale(config.radius / 12)
    .duration(config.duration + 2000)
    .fadeIn(1500)
    .fadeOut(2000)
    .belowTokens()
    .tint("#000000")
    .opacity(0.8)
    .persist()
    .name("darkness-base")

    // Main darkness cloud effect
    .effect()
    .file("jb2a.fog_cloud.2.purple02")
    .atLocation(cloudLocation)
    .scale(config.radius / 10)
    .duration(config.duration)
    .fadeIn(2000)
    .fadeOut(3000)
    .tint("#0D0D0D")
    .opacity(0.9)
    .persist()
    .name("darkness-cloud")

    // Swirling dark energy
    .effect()
    .file("jb2a.energy_strands.overlay.dark_purple.01")
    .atLocation(cloudLocation)
    .scale(config.radius / 8)
    .duration(config.duration)
    .fadeIn(1500)
    .fadeOut(2000)
    .tint("#1A0033")
    .persist()
    .name("darkness-energy")

    // Whispers and dark ambient sound
    .sound()
    .file("sounds/magic/darkness-ambient.wav")
    .volume(0.6)
    .duration(config.duration)
    .fadeInAudio(2000)
    .fadeOutAudio(3000)

    // Apply initial effects to tokens in area
    .macro()
    .macro(() => {
        tokensInArea.forEach((target, index) => {
            setTimeout(() => {
                // Visual effect of being engulfed in darkness
                new Sequence()
                    .effect()
                    .file("jb2a.template_circle.symbol.normal.fear.dark_purple")
                    .atLocation(target)
                    .scale(0.7)
                    .duration(config.blindDuration)
                    .fadeIn(1000)
                    .fadeOut(2000)
                    .belowTokens()
                    .tint("#1A0033")
                    .persist()
                    .name(`blind-effect-${target.id}`)

                    // Shadow tendrils around blinded target
                    .effect()
                    .file("jb2a.energy_strands.overlay.dark_purple.01")
                    .atLocation(target)
                    .scale(0.6)
                    .duration(5000)
                    .fadeIn(800)
                    .fadeOut(1500)
                    .tint("#000000")
                    .opacity(0.7)

                    .sound()
                    .file("sounds/magic/shadow-engulf.wav")
                    .volume(0.6)

                    .play();

            }, index * 300);
        });
    })

    // Monitor for tokens entering/leaving the cloud
    .macro()
    .macro(() => {
        const monitorInterval = setInterval(() => {
            const currentTokensInArea = canvas.tokens.placeables.filter(t => {
                if (t === config.casterToken) return false;
                const distance = Math.sqrt(
                    Math.pow(t.center.x - cloudLocation.x, 2) +
                    Math.pow(t.center.y - cloudLocation.y, 2)
                );
                return distance <= (config.radius * canvas.grid.size / canvas.grid.distance);
            });

            // Check for new tokens entering
            currentTokensInArea.forEach(token => {
                if (!tokensInArea.includes(token)) {
                    tokensInArea.push(token);

                    // Apply blind effect to newly entered token
                    new Sequence()
                        .effect()
                        .file("jb2a.template_circle.symbol.normal.fear.dark_purple")
                        .atLocation(token)
                        .scale(0.7)
                        .duration(config.blindDuration)
                        .fadeIn(1000)
                        .fadeOut(2000)
                        .belowTokens()
                        .tint("#1A0033")
                        .persist()
                        .name(`blind-effect-${token.id}`)

                        .sound()
                        .file("sounds/magic/shadow-engulf.wav")
                        .volume(0.5)

                        .play();

                    ChatMessage.create({
                        content: `🌑 <b>${token.name}</b> enters the darkness cloud and becomes blinded!`,
                        speaker: ChatMessage.getSpeaker({ token: config.casterToken })
                    });
                }
            });

        }, 1000); // Check every second

        // Clear monitoring when cloud ends
        setTimeout(() => {
            clearInterval(monitorInterval);
        }, config.duration);
    })

    .thenDo(() => {
        if (tokensInArea.length > 0) {
            ChatMessage.create({
                content: `🌑 <b>Moctei</b> conjures a <i>${config.spellName}</i>!
                <br>👁️ Creatures engulfed in darkness: ${tokensInArea.map(t => t.name).join(", ")}
                <br>🕳️ <i>The area is ${config.obscurement} and creatures inside are blinded!</i>`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        } else {
            ChatMessage.create({
                content: `🌑 <b>Moctei</b> conjures a <i>${config.spellName}</i>! An area of magical darkness blocks all sight.`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        }
    })

    // Cloud dissipation
    .wait(config.duration)

    .effect()
    .file("jb2a.template_circle.out_pulse.02.purplepink")
    .atLocation(cloudLocation)
    .scale(config.radius / 10)
    .duration(2000)
    .fadeIn(400)
    .fadeOut(1000)
    .tint("#4B0082")
    .opacity(0.6)

    .sound()
    .file("sounds/magic/darkness-fade.wav")
    .volume(0.6)

    .thenDo(() => {
        ChatMessage.create({
            content: `🌑 The darkness cloud slowly dissipates, shadows retreating into the void...`,
            speaker: ChatMessage.getSpeaker({ token: config.casterToken })
        });

        // Clean up blind effects after their duration
        setTimeout(() => {
            tokensInArea.forEach(target => {
                Sequencer.EffectManager.endEffects({ name: `blind-effect-${target.id}` });
            });

            ChatMessage.create({
                content: `👁️ The magical blindness effect fades from affected creatures.`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        }, config.blindDuration - config.duration);
    })

    .play();

// Casting announcement
ChatMessage.create({
    content: `🌑 <b>Moctei</b> weaves shadows into reality, creating a <i>${config.spellName}</i>!
    <br><i>"Let darkness be your shroud..."</i>`,
    speaker: ChatMessage.getSpeaker({ token: config.casterToken })
});
