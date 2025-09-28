/**
 * Moctei's Void Prison
 * Creates a prison of pure shadow that traps and slowly drains enemies
 * Character: Moctei (Shadow Specialist)
 */

// Configuration
const config = {
    casterToken: token,
    spellName: "Void Prison",
    radius: 10, // Prison radius in feet
    duration: 45000, // 45 seconds
    drainDamage: "2d4",
    damageType: "necrotic",
    drainInterval: 6000, // Drain every 6 seconds
    escapeCheck: "Strength or Acrobatics DC 16"
};

// Get target location for prison center
const template = await new Portal().crosshairs.show({
    size: config.radius / canvas.grid.distance,
    icon: "icons/magic/unholy/barrier-shield-glowing-purple.webp",
    label: "Void Prison Center",
    drawIcon: true,
    drawOutline: true,
    fillAlpha: 0.5,
    fillColor: "#000000"
});

if (template.cancelled) return;

const prisonLocation = { x: template.x, y: template.y };

// Find tokens in the prison area
const trappedTokens = canvas.tokens.placeables.filter(t => {
    if (t === config.casterToken) return false; // Caster is immune
    const distance = Math.sqrt(
        Math.pow(t.center.x - prisonLocation.x, 2) +
        Math.pow(t.center.y - prisonLocation.y, 2)
    );
    return distance <= (config.radius * canvas.grid.size / canvas.grid.distance);
});

// Create void prison sequence
new Sequence()
    // Massive casting preparation - reality bending
    .effect()
    .file("jb2a.template_circle.aura.01.complete.large.purple")
    .atLocation(config.casterToken)
    .scale(1.8)
    .duration(3500)
    .fadeIn(800)
    .fadeOut(1200)
    .tint("#1A0033")
    .belowTokens()

    // Void energy swirling around caster
    .effect()
    .file("jb2a.energy_strands.in.purple.01")
    .atLocation(config.casterToken)
    .scale(1.5)
    .duration(3000)
    .fadeIn(500)
    .fadeOut(800)
    .tint("#000000")

    // Reality tear sound - ominous and powerful
    .sound()
    .file("sounds/magic/void-tear.wav")
    .volume(0.9)

    .wait(2500)

    // Prison foundation - void circle
    .effect()
    .file("jb2a.template_circle.symbol.normal.skull.purple")
    .atLocation(prisonLocation)
    .scale(config.radius / 6)
    .duration(config.duration + 3000)
    .fadeIn(2000)
    .fadeOut(2500)
    .belowTokens()
    .tint("#000000")
    .persist()
    .name("void-prison-base")

    // Prison walls - void barriers
    .effect()
    .file("jb2a.wall_of_force.sphere.purple")
    .atLocation(prisonLocation)
    .scale(config.radius / 8)
    .duration(config.duration)
    .fadeIn(2500)
    .fadeOut(3000)
    .tint("#0D0D0D")
    .opacity(0.8)
    .persist()
    .name("void-prison-walls")

    // Swirling void energy inside
    .effect()
    .file("jb2a.energy_strands.overlay.dark_purple.01")
    .atLocation(prisonLocation)
    .scale(config.radius / 6)
    .duration(config.duration)
    .fadeIn(2000)
    .fadeOut(2500)
    .tint("#1A0033")
    .persist()
    .name("void-prison-energy")

    // Void whispers and ambient sound
    .sound()
    .file("sounds/magic/void-prison-ambient.wav")
    .volume(0.7)
    .duration(config.duration)
    .fadeInAudio(2000)
    .fadeOutAudio(3000)

    // Prison formation sound
    .sound()
    .file("sounds/magic/void-prison-form.wav")
    .volume(0.8)
    .delay(1000)

    // Apply initial trap effects to caught tokens
    .macro()
    .macro(() => {
        trappedTokens.forEach((target, index) => {
            setTimeout(() => {
                // Void chains wrapping around trapped target
                new Sequence()
                    .effect()
                    .file("jb2a.energy_strands.overlay.dark_purple.01")
                    .atLocation(target)
                    .scale(0.9)
                    .duration(config.duration)
                    .fadeIn(1500)
                    .fadeOut(2000)
                    .tint("#000000")
                    .persist()
                    .name(`void-chains-${target.id}`)

                    // Trapped marker
                    .effect()
                    .file("jb2a.template_circle.symbol.normal.fear.dark_purple")
                    .atLocation(target)
                    .scale(0.6)
                    .duration(config.duration)
                    .fadeIn(1000)
                    .fadeOut(2000)
                    .belowTokens()
                    .tint("#4B0082")
                    .persist()
                    .name(`void-trapped-${target.id}`)

                    .sound()
                    .file("sounds/magic/void-trap.wav")
                    .volume(0.7)

                    .play();

            }, index * 400);
        });
    })

    // Setup periodic void drain
    .macro()
    .macro(() => {
        let drainCount = 0;
        const maxDrains = Math.floor(config.duration / config.drainInterval);

        const drainInterval = setInterval(() => {
            drainCount++;

            // Check which tokens are still in prison
            const currentlyTrapped = canvas.tokens.placeables.filter(t => {
                if (t === config.casterToken) return false;

                const distance = Math.sqrt(
                    Math.pow(t.center.x - prisonLocation.x, 2) +
                    Math.pow(t.center.y - prisonLocation.y, 2)
                );
                return distance <= (config.radius * canvas.grid.size / canvas.grid.distance);
            });

            // Apply void drain to trapped tokens
            currentlyTrapped.forEach((target, index) => {
                setTimeout(() => {
                    // Void drain visual
                    new Sequence()
                        .effect()
                        .file("jb2a.energy_strands.range.standard.purple.01")
                        .atLocation(target)
                        .stretchTo(prisonLocation)
                        .scale(0.7)
                        .duration(2000)
                        .fadeIn(400)
                        .fadeOut(800)
                        .tint("#8B008B")

                        .effect()
                        .file("jb2a.impact.023.dark_purple")
                        .atLocation(target)
                        .scale(0.8)
                        .duration(1200)
                        .fadeIn(200)
                        .opacity(0.7)

                        .sound()
                        .file("sounds/magic/void-drain.wav")
                        .volume(0.6)

                        .play();

                    // Drain damage
                    const drainRoll = new Roll(config.drainDamage);
                    drainRoll.toMessage({
                        speaker: ChatMessage.getSpeaker({ token: config.casterToken }),
                        flavor: `${config.spellName} - Void drain (${config.damageType}) on ${target.name}`
                    });

                }, index * 300);
            });

            if (currentlyTrapped.length > 0) {
                ChatMessage.create({
                    content: `🕳️ The void prison drains life from ${currentlyTrapped.length} trapped creature(s): ${currentlyTrapped.map(t => t.name).join(", ")}`,
                    speaker: ChatMessage.getSpeaker({ token: config.casterToken })
                });
            }

            // Clear interval when duration is reached
            if (drainCount >= maxDrains) {
                clearInterval(drainInterval);
            }
        }, config.drainInterval);
    })

    .thenDo(() => {
        if (trappedTokens.length > 0) {
            ChatMessage.create({
                content: `🕳️ <b>Moctei</b> tears open reality and creates a <i>${config.spellName}</i>!
                <br>⛓️ Creatures trapped in the void: ${trappedTokens.map(t => t.name).join(", ")}
                <br>💀 <i>Escape requires ${config.escapeCheck}. Trapped creatures take void damage every ${config.drainInterval / 1000} seconds!</i>`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        } else {
            ChatMessage.create({
                content: `🕳️ <b>Moctei</b> creates a <i>${config.spellName}</i>! A spherical prison of pure void awaits victims.`,
                speaker: ChatMessage.getSpeaker({ token: config.casterToken })
            });
        }
    })

    // Prison collapse sequence
    .wait(config.duration)

    .effect()
    .file("jb2a.explosion.04.purplepink")
    .atLocation(prisonLocation)
    .scale(config.radius / 6)
    .duration(2500)
    .fadeIn(500)
    .fadeOut(1000)
    .tint("#4B0082")

    .effect()
    .file("jb2a.impact.023.dark_purple")
    .atLocation(prisonLocation)
    .scale(config.radius / 4)
    .duration(2000)
    .fadeIn(300)
    .fadeOut(800)

    .sound()
    .file("sounds/magic/void-prison-collapse.wav")
    .volume(0.8)

    .thenDo(() => {
        // Clean up all prison effects
        trappedTokens.forEach(target => {
            Sequencer.EffectManager.endEffects({ name: `void-chains-${target.id}` });
            Sequencer.EffectManager.endEffects({ name: `void-trapped-${target.id}` });
        });

        ChatMessage.create({
            content: `🕳️ The void prison collapses in on itself, reality slowly mending the tear...`,
            speaker: ChatMessage.getSpeaker({ token: config.casterToken })
        });
    })

    .play();

// Epic casting announcement
ChatMessage.create({
    content: `🕳️ <b>Moctei</b> begins tearing at the fabric of reality itself to create a <i>${config.spellName}</i>!
    <br><i>"Let the void claim you... there is no escape from nothingness!"</i>`,
    speaker: ChatMessage.getSpeaker({ token: config.casterToken })
});
