/**
 * Ora's Blizzard
 * A devastating area-of-effect ice storm that slows and damages enemies
 * Character: Ora (Water/Ice Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    spellName: "Blizzard",
    radius: 20, // Radius in feet
    damage: "3d8",
    damageType: "cold",
    duration: 10000, // 10 seconds
    slowDuration: 30000 // 30 seconds slow effect
};

// Get target location for blizzard center
const template = await new Portal().crosshairs.show({
    size: config.radius / canvas.grid.distance,
    icon: "icons/magic/air/wind-tornado-wall-blue.webp",
    label: "Blizzard Center",
    drawIcon: true,
    drawOutline: true,
    fillAlpha: 0.25,
    fillColor: "#87CEEB"
});

if (template.cancelled) return;

const targetLocation = { x: template.x, y: template.y };

// Find all tokens in the blizzard area
const tokensInArea = canvas.tokens.placeables.filter(t => {
    if (t === config.casterToken) return false;
    const distance = Math.sqrt(
        Math.pow(t.center.x - targetLocation.x, 2) +
        Math.pow(t.center.y - targetLocation.y, 2)
    );
    return distance <= (config.radius * canvas.grid.size / canvas.grid.distance);
});

// Create blizzard sequence
new Sequence()
    // Massive casting preparation
    .effect()
    .file("jb2a.template_circle.aura.01.complete.large.blue")
    .atLocation(config.casterToken)
    .scale(1.5)
    .duration(3000)
    .fadeIn(800)
    .fadeOut(1000)
    .opacity(0.8)
    .belowTokens()

    // Ice magic building up
    .effect()
    .file("jb2a.ice_spikes.radial.white")
    .atLocation(config.casterToken)
    .scale(1.2)
    .duration(2500)
    .fadeIn(400)
    .fadeOut(600)

    // Wind gathering sound
    .sound()
    .file("sounds/magic/wind-gather.wav")
    .volume(0.8)

    .wait(2000)

    // Blizzard formation at target location
    .effect()
    .file("jb2a.template_circle.symbol.normal.snowflake.blue")
    .atLocation(targetLocation)
    .scale(config.radius / 10)
    .duration(config.duration + 2000)
    .fadeIn(1000)
    .fadeOut(1500)
    .belowTokens()
    .persist()
    .name("blizzard-base")

    // Main blizzard effect
    .effect()
    .file("jb2a_patreon.whirlwind.white")
    .atLocation(targetLocation)
    .scale(config.radius / 15)
    .duration(config.duration)
    .fadeIn(1500)
    .fadeOut(2000)
    .persist()
    .name("blizzard-main")

    // Ice particles swirling
    .effect()
    .file("jb2a.particles.outward.white.01")
    .atLocation(targetLocation)
    .scale(config.radius / 12)
    .duration(config.duration)
    .fadeIn(1000)
    .fadeOut(1500)
    .persist()
    .name("blizzard-particles")

    // Blizzard ambient sound
    .sound()
    .file("sounds/magic/blizzard-ambient.wav")
    .volume(0.7)
    .duration(config.duration)
    .fadeInAudio(1000)
    .fadeOutAudio(2000)

    // Initial impact on all targets
    .macro()
    .macro(() => {
        tokensInArea.forEach((target, index) => {
            setTimeout(() => {
                new Sequence()
                    // Frost impact
                    .effect()
                    .file("jb2a.impact.frost.blue.01")
                    .atLocation(target)
                    .scale(0.8)
                    .duration(1500)
                    .fadeIn(200)

                    // Continuous ice effect on target
                    .effect()
                    .file("jb2a.template_circle.symbol.normal.snowflake.blue")
                    .atLocation(target)
                    .scale(0.5)
                    .duration(config.slowDuration)
                    .fadeIn(500)
                    .fadeOut(2000)
                    .belowTokens()
                    .persist()
                    .name(`frost-effect-${target.id}`)

                    .play();
            }, index * 150);
        });
    })

    // Periodic damage during blizzard
    .macro()
    .macro(() => {
        const damageInterval = setInterval(() => {
            tokensInArea.forEach(target => {
                // Check if target is still in area (they might have moved)
                const currentDistance = Math.sqrt(
                    Math.pow(target.center.x - targetLocation.x, 2) +
                    Math.pow(target.center.y - targetLocation.y, 2)
                );

                if (currentDistance <= (config.radius * canvas.grid.size / canvas.grid.distance)) {
                    // Apply cold damage
                    const roll = new Roll("1d6");
                    roll.toMessage({
                        speaker: ChatMessage.getSpeaker({ token: config.casterToken }),
                        flavor: `${config.spellName} (ongoing) - ${config.damageType} damage to ${target.name}`
                    });

                    // Visual effect for ongoing damage
                    new Sequence()
                        .effect()
                        .file("jb2a.impact.frost.blue.01")
                        .atLocation(target)
                        .scale(0.6)
                        .duration(800)
                        .opacity(0.7)
                        .play();
                }
            });
        }, 2000); // Damage every 2 seconds

        // Clear interval when blizzard ends
        setTimeout(() => {
            clearInterval(damageInterval);
        }, config.duration);
    })

    // Initial damage roll
    .thenDo(() => {
        if (tokensInArea.length > 0) {
            const roll = new Roll(config.damage);
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ token: config.casterToken }),
                flavor: `${config.spellName} (initial impact) - ${config.damageType} damage`
            });

            ChatMessage.create({
                content: `❄️ <b>Ora</b> unleashes a devastating <i>${config.spellName}</i>!
                <br>🎯 Targets caught in the storm: ${tokensInArea.map(t => t.name).join(", ")}
                <br>🧊 <i>Targets are slowed and take ongoing cold damage!</i>`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        } else {
            ChatMessage.create({
                content: `❄️ <b>Ora</b> unleashes a <i>${config.spellName}</i>, but no enemies are caught in the icy storm.`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        }
    })

    // Blizzard end sequence
    .wait(config.duration)

    .effect()
    .file("jb2a.impact.frost.blue.01")
    .atLocation(targetLocation)
    .scale(config.radius / 8)
    .duration(2000)
    .fadeIn(300)

    .sound()
    .file("sounds/magic/wind-fade.wav")
    .volume(0.6)

    .thenDo(() => {
        ChatMessage.create({
            content: `❄️ The blizzard subsides, leaving frost-covered ground in its wake...`,
            speaker: ChatMessage.getSpeaker({ token: config.casterToken })
        });

        // Clean up slow effects after duration
        setTimeout(() => {
            tokensInArea.forEach(target => {
                // Remove persistent frost effects
                Sequencer.EffectManager.endEffects({ name: `frost-effect-${target.id}` });
            });

            ChatMessage.create({
                content: `❄️ The lingering cold effects fade away.`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        }, config.slowDuration - config.duration);
    })

    .play();

// Casting announcement
ChatMessage.create({
    content: `❄️ <b>Ora</b> raises her arms to the sky and calls forth a <i>${config.spellName}</i>!
    <br><i>"Let the winter winds freeze your bones!"</i>`,
    speaker: ChatMessage.getSpeaker({ token: config.casterToken })
});
