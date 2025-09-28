/**
 * Quick Console Command for Your Custom Status Effects
 * Copy and paste this into the browser console (F12) while in FoundryVTT
 *
 * Detects: offensif, defensif, focus, blessures (injuries)
 * Works with Actor Active Effects (where your status effects are actually stored)
 */

(() => {
    const selected = canvas.tokens.controlled;
    if (!selected.length) return console.log("❌ No token selected");

    selected.forEach(token => {
        const doc = token.document;
        const actor = doc.actor;

        console.group(`🎯 ${token.name || doc.name}`);

        // Find stance and injury status from Actor Active Effects
        let stance = null;
        let injuries = false;
        let foundEffects = [];

        // Check Actor Active Effects (this is where your status effects are stored)
        if (actor?.effects?.contents?.length) {
            const activeEffects = actor.effects.contents;

            for (const effect of activeEffects) {
                const effectLabel = (effect.label || effect.name || '').toLowerCase();

                // Check for stances
                if (effectLabel === 'focus') {
                    stance = 'FOCUS';
                    foundEffects.push({ label: 'Focus', type: 'stance' });
                }
                else if (effectLabel === 'offensif') {
                    stance = 'OFFENSIF';
                    foundEffects.push({ label: 'Offensif', type: 'stance' });
                }
                else if (effectLabel === 'defensif') {
                    stance = 'DEFENSIF';
                    foundEffects.push({ label: 'Defensif', type: 'stance' });
                }

                // Check for injuries (blessures) with stack count
                if (effectLabel === 'blessures' || effectLabel.includes('blessures')) {
                    injuries = true;

                    // Get stack count from Status Icon Counters (simplified)
                    let stackCount = effect.flags?.statuscounter?.value || 1;

                    foundEffects.push({
                        label: 'Blessures',
                        type: 'injury',
                        stackCount: stackCount,
                        dicePenalty: stackCount // Each injury = -1 dice
                    });
                }
            }
        }

        // Display results
        if (stance) {
            console.log(`⚔️ Combat Stance: ${stance}`);
        } else {
            console.log("❌ No combat stance detected");
        }

        if (injuries) {
            // Find the injury effect to get stack count
            const injuryEffect = foundEffects.find(e => e.type === 'injury');
            const stackCount = injuryEffect ? injuryEffect.stackCount : 1;
            const dicePenalty = injuryEffect ? injuryEffect.dicePenalty : 1;

            console.log(`🩸 Injuries: ${stackCount} STACK${stackCount > 1 ? 'S' : ''} (-${dicePenalty} to all dice rolls)`);
        } else {
            console.log("✅ No injuries");
        }

        console.log("📋 Detected effects:", foundEffects);

        if (actor?.effects?.contents?.length) {
            console.log("⚡ All Actor Active Effects:", actor.effects.contents.map(e => e.label || e.name));
        } else {
            console.log("❌ No Actor Active Effects found");
        }

        console.groupEnd();
    });

    // Return quick summary
    const summary = selected.map(token => {
        const actor = token.document.actor;
        let stance = null;
        let injuries = false;
        let injuryStacks = 0;

        if (actor?.effects?.contents?.length) {
            const activeEffects = actor.effects.contents;

            for (const effect of activeEffects) {
                const effectLabel = (effect.label || effect.name || '').toLowerCase();

                if (effectLabel === 'focus') stance = 'focus';
                else if (effectLabel === 'offensif') stance = 'offensif';
                else if (effectLabel === 'defensif') stance = 'defensif';

                if (effectLabel === 'blessures' || effectLabel.includes('blessures')) {
                    injuries = true;
                    // Get injury stack count (simplified)
                    injuryStacks = effect.flags?.statuscounter?.value || 1;
                }
            }
        }

        return {
            token: token.name || token.document.name,
            stance: stance,
            injuries: injuries,
            injuryStacks: injuryStacks,
            dicePenalty: injuryStacks, // Each injury stack = -1 dice penalty
            activeEffects: actor?.effects?.contents?.map(e => e.label || e.name) || []
        };
    });

    return summary;
})();
