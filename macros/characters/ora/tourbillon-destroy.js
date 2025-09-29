/**
 * Tourbillon Destroyer - Remove Vortex Effects
 *
 * UTILITY MACRO for Tourbillon Spell Management
 *
 * Description: Allows destruction/traversal of vortex effects created by tourbillon.js
 * - Detects nearest vortex effect at selected canvas position
 * - Removes persistent Sequencer effects
 * - Handles traversal mechanics (Agility roll option)
 * - Professional chat output for resolution
 *
 * Usage:
 * 1. Run this macro
 * 2. Click on canvas near a vortex effect
 * 3. Choose destruction method (automatic or with Agility roll)
 *
 * Prerequisites:
 * - Sequencer module
 * - Active vortex effects created by tourbillon.js
 */

(async () => {
    // Check if user has permissions
    if (!game.user.isGM && !canvas.tokens.controlled.length) {
        ui.notifications.warn("Sélectionnez votre personnage ou demandez au MJ de gérer la destruction du tourbillon.");
        return;
    }

    // Get current character for traversal mechanics
    let currentCharacter = null;
    if (canvas.tokens.controlled.length > 0) {
        currentCharacter = canvas.tokens.controlled[0];
    }

    ui.notifications.info("Cliquez sur la position du tourbillon à détruire...");

    // Wait for canvas click to select vortex position
    const selectedPosition = await new Promise((resolve) => {
        const handler = (event) => {
            // Get canvas coordinates
            const rect = canvas.app.view.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            // Convert to world coordinates
            const worldPos = canvas.stage.toLocal({ x, y });

            // Clean up event listener
            canvas.app.view.removeEventListener('click', handler);

            resolve({ x: worldPos.x, y: worldPos.y });
        };

        canvas.app.view.addEventListener('click', handler);

        // Timeout after 30 seconds
        setTimeout(() => {
            canvas.app.view.removeEventListener('click', handler);
            resolve(null);
        }, 30000);
    });

    if (!selectedPosition) {
        ui.notifications.info("Sélection annulée ou expirée.");
        return;
    }

    console.log(`[DEBUG] Position sélectionnée: x=${selectedPosition.x}, y=${selectedPosition.y}`);

    // Find all active Sequencer effects
    const activeEffects = Sequencer.EffectManager.effects;
    console.log(`[DEBUG] Effets Sequencer actifs: ${activeEffects.size}`);

    // Find vortex effects near the selected position
    const tolerance = canvas.grid.size * 1.5; // 1.5 grid squares tolerance
    let nearbyVortices = [];

    activeEffects.forEach((effect, id) => {
        // Check if this is a vortex effect
        if (effect.data.name && effect.data.name.includes('tourbillon')) {
            const effectPos = effect.position;
            if (effectPos) {
                const distance = Math.sqrt(
                    Math.pow(effectPos.x - selectedPosition.x, 2) +
                    Math.pow(effectPos.y - selectedPosition.y, 2)
                );

                console.log(`[DEBUG] Tourbillon trouvé à distance ${distance} (tolérance: ${tolerance})`);

                if (distance <= tolerance) {
                    nearbyVortices.push({
                        id: id,
                        effect: effect,
                        distance: distance,
                        position: effectPos
                    });
                }
            }
        }
    });

    if (nearbyVortices.length === 0) {
        ui.notifications.warn("Aucun tourbillon trouvé à cette position. Assurez-vous de cliquer près d'un effet de tourbillon actif.");
        return;
    }

    // Sort by distance and take the closest
    nearbyVortices.sort((a, b) => a.distance - b.distance);
    const closestVortex = nearbyVortices[0];

    console.log(`[DEBUG] Tourbillon le plus proche sélectionné: ${closestVortex.id} à distance ${closestVortex.distance}`);

    // === ACTOR DETECTION AT VORTEX POSITION ===
    function getActorAtLocation(targetX, targetY) {
        const tolerance = canvas.grid.size;
        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
            const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;

            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - targetX, 2) + Math.pow(tokenCenterY - targetY, 2)
            );
            return tokenDistance <= tolerance;
        });

        if (tokensAtLocation.length === 0) {
            return null;
        }

        const targetToken = tokensAtLocation[0];
        const targetActor = targetToken.actor;

        if (!targetActor) {
            return null;
        }

        const isOwner = targetActor.isOwner;
        const isVisible = targetToken.visible;
        const isGM = game.user.isGM;

        if (isOwner || isVisible || isGM) {
            return {
                name: targetActor.name,
                token: targetToken,
                actor: targetActor
            };
        } else {
            return {
                name: "cible",
                token: targetToken,
                actor: targetActor
            };
        }
    }

    // Check if there's a character in the vortex
    const trappedActor = getActorAtLocation(closestVortex.position.x, closestVortex.position.y);
    const isCharacterTrapped = trappedActor !== null;

    // Destruction method dialog
    const destructionMethod = await new Promise((resolve) => {
        let dialogContent = `
            <h3>Destruction du Tourbillon</h3>
            <p><strong>Position :</strong> x=${Math.round(closestVortex.position.x)}, y=${Math.round(closestVortex.position.y)}</p>
        `;

        if (isCharacterTrapped) {
            dialogContent += `
                <p><strong>⚠️ Personnage dans le tourbillon :</strong> ${trappedActor.name}</p>
                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <h4>Méthode de Traversée :</h4>
                    <label><input type="radio" name="method" value="automatic" checked>
                        <strong>Destruction Automatique</strong> - Le tourbillon se dissipe</label><br>
                    <label><input type="radio" name="method" value="agility">
                        <strong>Traversée par Agilité</strong> - Jet d'Agilité pour traverser sans dégât</label><br>
                    <label><input type="radio" name="method" value="damage">
                        <strong>Traversée Forcée</strong> - Subir les dégâts et traverser</label>
                </div>
            `;
        } else {
            dialogContent += `
                <p><em>Aucun personnage détecté dans le tourbillon.</em></p>
                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <h4>Méthode de Destruction :</h4>
                    <label><input type="radio" name="method" value="automatic" checked>
                        <strong>Destruction Automatique</strong> - Le tourbillon se dissipe naturellement</label><br>
                    <label><input type="radio" name="method" value="dispel">
                        <strong>Dissipation Magique</strong> - Annulation par magie</label>
                </div>
            `;
        }

        new Dialog({
            title: "Gestion du Tourbillon",
            content: dialogContent,
            buttons: {
                confirm: {
                    label: "Confirmer",
                    callback: (html) => {
                        const method = html.find('input[name="method"]:checked').val();
                        resolve(method);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    if (!destructionMethod) {
        ui.notifications.info("Destruction annulée.");
        return;
    }

    let resolutionMessage = "";
    let agilityRollResult = null;

    // Handle traversal mechanics
    if (destructionMethod === 'agility' && isCharacterTrapped && trappedActor.actor) {
        // Get Agilité stat
        const agiliteAttribute = trappedActor.actor.system.attributes?.agilite;
        if (!agiliteAttribute) {
            ui.notifications.error(`Caractéristique Agilité non trouvée pour ${trappedActor.name} !`);
            return;
        }

        const agiliteValue = agiliteAttribute.value || 3;

        // Handle injuries
        const injuryEffect = trappedActor.actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const adjustedAgilite = Math.max(1, agiliteValue - injuryStacks);

        // Roll Agilité test
        const agilityRoll = new Roll(`${adjustedAgilite}d7 + 2`);
        await agilityRoll.evaluate({ async: true });

        agilityRollResult = {
            roll: agilityRoll,
            total: agilityRoll.total,
            success: agilityRoll.total >= 10, // Assuming difficulty 10
            originalStat: agiliteValue,
            adjustedStat: adjustedAgilite,
            injuries: injuryStacks
        };

        if (agilityRollResult.success) {
            resolutionMessage = `
                <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 10px; margin: 10px 0;">
                    <h4 style="color: #155724; margin: 5px 0;">✅ Traversée Réussie !</h4>
                    <p><strong>${trappedActor.name}</strong> traverse le tourbillon sans subir de dégât.</p>
                    <p><strong>Jet d'Agilité :</strong> ${agilityRollResult.total} <em>(${agilityRollResult.roll.formula} = ${agilityRollResult.roll.result})</em></p>
                    ${injuryStacks > 0 ? `<p><em>Agilité ajustée : ${adjustedAgilite} (${agiliteValue} - ${injuryStacks} blessures)</em></p>` : ''}
                    <p><em>⚠️ Coûte l'action de mouvement du personnage</em></p>
                </div>
            `;
        } else {
            resolutionMessage = `
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin: 10px 0;">
                    <h4 style="color: #721c24; margin: 5px 0;">❌ Traversée Échouée !</h4>
                    <p><strong>${trappedActor.name}</strong> ne parvient pas à traverser et subit les dégâts du tourbillon.</p>
                    <p><strong>Jet d'Agilité :</strong> ${agilityRollResult.total} <em>(${agilityRollResult.roll.formula} = ${agilityRollResult.roll.result})</em></p>
                    ${injuryStacks > 0 ? `<p><em>Agilité ajustée : ${adjustedAgilite} (${agiliteValue} - ${injuryStacks} blessures)</em></p>` : ''}
                    <p><em>💥 Dégâts : Consultez le sort original pour les dégâts applicables</em></p>
                </div>
            `;
        }
    } else if (destructionMethod === 'damage' && isCharacterTrapped) {
        resolutionMessage = `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 10px; margin: 10px 0;">
                <h4 style="color: #721c24; margin: 5px 0;">💥 Traversée Forcée</h4>
                <p><strong>${trappedActor.name}</strong> force le passage à travers le tourbillon.</p>
                <p><em>Dégâts : Consultez le sort original pour les dégâts applicables</em></p>
            </div>
        `;
    } else if (destructionMethod === 'automatic') {
        resolutionMessage = `
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 10px; margin: 10px 0;">
                <h4 style="color: #0c5460; margin: 5px 0;">🌊 Dissipation Naturelle</h4>
                <p>Le tourbillon se dissipe naturellement sans conséquences.</p>
                ${isCharacterTrapped ? `<p><strong>${trappedActor.name}</strong> est libéré de l'effet.</p>` : ''}
            </div>
        `;
    } else if (destructionMethod === 'dispel') {
        resolutionMessage = `
            <div style="background: #e2e3e5; border: 1px solid #d6d8db; border-radius: 5px; padding: 10px; margin: 10px 0;">
                <h4 style="color: #383d41; margin: 5px 0;">✨ Dissipation Magique</h4>
                <p>Le tourbillon est annulé par intervention magique.</p>
            </div>
        `;
    }

    // Create destruction effect
    let destructionSequence = new Sequence();

    // Destruction visual effect
    destructionSequence.effect()
        .file("jb2a.impact.water.01.blue.0")
        .atLocation(closestVortex.position)
        .scale(1.2)
        .duration(2000);

    // Water splash as vortex dissipates
    destructionSequence.effect()
        .file("jb2a.explosion.water.1.blue.600x600")
        .atLocation(closestVortex.position)
        .scale(0.8)
        .delay(500);

    // Play destruction sequence
    await destructionSequence.play();

    // Remove the persistent vortex effect
    try {
        await Sequencer.EffectManager.endEffects({ name: closestVortex.effect.data.name });
        console.log(`[DEBUG] Effet de tourbillon supprimé: ${closestVortex.id}`);
    } catch (error) {
        console.error(`[ERROR] Erreur lors de la suppression de l'effet:`, error);
        ui.notifications.warn("Erreur lors de la suppression de l'effet visuel. L'effet peut persister visuellement.");
    }

    // Create chat message
    const chatContent = `
        <div class="spell-result">
            <h3>🌊 Destruction de Tourbillon</h3>
            <p><strong>Position :</strong> x=${Math.round(closestVortex.position.x)}, y=${Math.round(closestVortex.position.y)}</p>
            ${isCharacterTrapped ? `<p><strong>Personnage affecté :</strong> ${trappedActor.name}</p>` : ''}
            ${resolutionMessage}
            <hr>
            <p><em>L'effet de tourbillon a été supprimé du jeu.</em></p>
        </div>
    `;

    // Determine speaker
    let speaker;
    if (currentCharacter) {
        speaker = ChatMessage.getSpeaker({ token: currentCharacter });
    } else {
        speaker = ChatMessage.getSpeaker();
    }

    await ChatMessage.create({
        user: game.user.id,
        speaker: speaker,
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    // Notification
    const successInfo = agilityRollResult ?
        (agilityRollResult.success ? " (Traversée réussie)" : " (Traversée échouée)") :
        "";

    ui.notifications.info(`Tourbillon détruit !${isCharacterTrapped ? ` ${trappedActor.name} affecté.` : ''}${successInfo}`);
})();
