/**
 * Ora's Healing Spring
 * Creates a magical spring that continuously heals allies in the area
 * Character: Ora (Water/Ice Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    spellName: "Healing Spring",
    radius: 15, // Radius in feet
    healing: "1d6+2",
    duration: 60000, // 1 minute
    healInterval: 6000 // Heal every 6 seconds (1 round)
};

// Get placement location
const template = await new Portal().crosshairs.show({
    size: config.radius / canvas.grid.distance,
    icon: "icons/magic/water/orb-water-blue.webp",
    label: "Healing Spring Location",
    drawIcon: true,
    drawOutline: true,
    fillAlpha: 0.2,
    fillColor: "#00CED1"
});

if (template.cancelled) return;

const springLocation = { x: template.x, y: template.y };

// Create healing spring sequence
new Sequence()
    // Casting preparation
    .effect()
    .file("jb2a.template_circle.aura.01.complete.medium.blue")
    .atLocation(config.casterToken)
    .scale(1.0)
    .duration(2500)
    .fadeIn(500)
    .fadeOut(800)
    .opacity(0.7)
    .belowTokens()

    // Water magic gathering
    .effect()
    .file("jb2a.whirlpool.blue")
    .atLocation(config.casterToken)
    .scale(0.8)
    .duration(2000)
    .fadeIn(300)
    .fadeOut(500)
    .belowTokens()

    // Casting sound
    .sound()
    .file("sounds/magic/water-spring-cast.wav")
    .volume(0.7)

    .wait(1500)

    // Spring formation at target location
    .effect()
    .file("jb2a.template_circle.symbol.normal.drop.blue")
    .atLocation(springLocation)
    .scale(config.radius / 8)
    .duration(config.duration + 3000)
    .fadeIn(1500)
    .fadeOut(2000)
    .belowTokens()
    .persist()
    .name("healing-spring-base")

    // Water fountain effect
    .effect()
    .file("jb2a.water_sphere.blue")
    .atLocation(springLocation)
    .scale(0.6)
    .duration(config.duration)
    .fadeIn(1000)
    .fadeOut(1500)
    .persist()
    .name("healing-spring-fountain")

    // Gentle water particles
    .effect()
    .file("jb2a.particles.inward.blue.01")
    .atLocation(springLocation)
    .scale(config.radius / 10)
    .duration(config.duration)
    .fadeIn(800)
    .fadeOut(1200)
    .persist()
    .name("healing-spring-particles")

    // Gentle spring sound
    .sound()
    .file("sounds/magic/water-spring-ambient.wav")
    .volume(0.4)
    .duration(config.duration)
    .fadeInAudio(1000)
    .fadeOutAudio(2000)

    // Setup healing interval
    .macro()
    .macro(() => {
        let healingCount = 0;
        const maxHeals = Math.floor(config.duration / config.healInterval);

        const healingInterval = setInterval(() => {
            healingCount++;

            // Find allies in spring area
            const alliesInRange = canvas.tokens.placeables.filter(t => {
                // Calculate distance to spring
                const distance = Math.sqrt(
                    Math.pow(t.center.x - springLocation.x, 2) +
                    Math.pow(t.center.y - springLocation.y, 2)
                );

                // Check if in range and is an ally (you may want to adjust this condition)
                const inRange = distance <= (config.radius * canvas.grid.size / canvas.grid.distance);
                const isAlly = t.document.disposition >= 1 || t === config.casterToken; // Friendly or neutral

                return inRange && isAlly;
            });

            // Heal each ally
            alliesInRange.forEach((ally, index) => {
                setTimeout(() => {
                    // Healing visual effect
                    new Sequence()
                        .effect()
                        .file("jb2a.healing_generic.400x400.blue")
                        .atLocation(ally)
                        .scale(0.8)
                        .duration(1500)
                        .fadeIn(300)
                        .fadeOut(600)

                        .effect()
                        .file("jb2a.particles.inward.blue.01")
                        .atLocation(ally)
                        .scale(0.4)
                        .duration(2000)
                        .fadeIn(400)
                        .fadeOut(1000)

                        .sound()
                        .file("sounds/magic/healing-chime.wav")
                        .volume(0.5)

                        .play();

                    // Healing roll
                    const healRoll = new Roll(config.healing);
                    healRoll.toMessage({
                        speaker: ChatMessage.getSpeaker({ token: config.casterToken }),
                        flavor: `${config.spellName} heals ${ally.name}`
                    });

                }, index * 200); // Slight delay between each ally
            });

            if (alliesInRange.length > 0) {
                ChatMessage.create({
                    content: `💧 The Healing Spring restores ${alliesInRange.length} ally/allies: ${alliesInRange.map(t => t.name).join(", ")}`,
                    speaker: ChatMessage.getSpeaker({ token: config.casterToken })
                });
            }

            // Clear interval when duration is reached
            if (healingCount >= maxHeals) {
                clearInterval(healingInterval);
            }
        }, config.healInterval);
    })

    // Initial healing effect for anyone already in range
    .thenDo(() => {
        const initialAllies = canvas.tokens.placeables.filter(t => {
            const distance = Math.sqrt(
                Math.pow(t.center.x - springLocation.x, 2) +
                Math.pow(t.center.y - springLocation.y, 2)
            );
            const inRange = distance <= (config.radius * canvas.grid.size / canvas.grid.distance);
            const isAlly = t.document.disposition >= 1 || t === config.casterToken;
            return inRange && isAlly;
        });

        if (initialAllies.length > 0) {
            ChatMessage.create({
                content: `💧 <b>Ora</b> creates a <i>${config.spellName}</i>! The magical waters begin healing nearby allies.
                <br>🎯 Initial healing affects: ${initialAllies.map(t => t.name).join(", ")}
                <br>💚 <i>Allies in the spring will be healed every ${config.healInterval / 1000} seconds!</i>`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        } else {
            ChatMessage.create({
                content: `💧 <b>Ora</b> creates a <i>${config.spellName}</i>! The magical waters await allies to enter and be healed.`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        }
    })

    // Spring end sequence
    .wait(config.duration)

    .effect()
    .file("jb2a.water_sphere.blue")
    .atLocation(springLocation)
    .scale(1.2)
    .duration(2000)
    .fadeIn(500)
    .fadeOut(1000)
    .opacity(0.6)

    .sound()
    .file("sounds/magic/water-spring-end.wav")
    .volume(0.6)

    .thenDo(() => {
        ChatMessage.create({
            content: `💧 Ora's Healing Spring gradually fades away, its magical waters returning to the earth.`,
            speaker: ChatMessage.getSpeaker({ token: config.casterToken })
        });
    })

    .play();

// Casting announcement
ChatMessage.create({
    content: `💧 <b>Ora</b> calls upon the ancient waters and creates a <i>${config.spellName}</i>!
    <br><i>"Let these blessed waters mend your wounds..."</i>`,
    speaker: ChatMessage.getSpeaker({ token: config.casterToken })
});
