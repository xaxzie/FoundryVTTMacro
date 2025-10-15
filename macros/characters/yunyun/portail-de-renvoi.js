/**
 * Portail de Renvoi - Yunyun
 *
 * Yunyun tente d'intercepter et de renvoyer une attaque ennemie via un portail magique.
 * Sort défensif avec mécaniques de contre-attaque basées sur la réussite du jet.
 *
 * Caractéristiques :
 * - Caractéristique d'interception : Charisme (+ effets actifs + bonus manuels)
 * - Coût : 3 mana (non focalisable)
 * - Niveau : 1
 * - Mécaniques :
 *   • Réussite simple : Projectile renvoyé dans une case aléatoire (3 cases de rayon autour de l'attaquant)
 *   • Réussite critique (+10) : Projectile renvoyé directement sur l'attaquant
 *   • Échec : Projectile touche Yunyun, portail s'ouvre trop tard
 *
 * Usage : Sélectionner le token de Yunyun, entrer le jet adversaire, puis cibler l'attaquant.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Portail de Renvoi",
        description: "Interception et renvoi d'attaque ennemie via portail magique",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        isDirect: false,
        spellLevel: 1,
        manaCost: 3,
        isFocusable: false,
        appliesFatigue: false,
        animations: {
            portalOpen: "jb2a_patreon.portals.vertical.ring.blue",
            portalMaintain: "jb2a_patreon.portals.vertical.ring.blue",
            projectileIncoming: "jb2a.ranged.card.01.projectile.01.blue",
            projectileRedirect: "jb2a.ranged.card.01.projectile.01.blue",
            portalClose: "jb2a_patreon.portals.vertical.ring.blue"
        },
        targeting: {
            range: 150,
            color: "#4169e1",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Yunyun !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé pour le token sélectionné !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Détecte la stance actuelle de l'acteur
     */
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    /**
     * Gets active effect bonuses for a specific flag key
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" provides ${flagKey} bonus: ${flagValue}`);
            }
        }

        console.log(`[DEBUG] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
            return { base: 3, injuries: 0, effectBonus: 0, injuryAdjusted: 3, final: 3 };
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${characteristic} reduced by ${injuryStacks} due to injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[DEBUG] ${characteristic} ${effectBonus > 0 ? 'increased' : 'decreased'} by ${effectBonus} due to active effects`);
        }

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Calcule la position du portail (1 case devant Yunyun en direction de la cible)
     * Adapté du sort 224.js
     */
    function calculatePortalPosition(casterPos, targetPos) {
        const gridSize = canvas.grid.size;

        // Centrer les positions sur les cases
        const casterCenter = {
            x: casterPos.x + (gridSize / 2),
            y: casterPos.y + (gridSize / 2)
        };

        // Aligner targetPos sur la grille
        const targetActor = getActorAtLocation(targetPos.x, targetPos.y);
        let targetCenter;

        if (targetActor && targetActor.token) {
            const tokenGridSize = targetActor.token.document.width * gridSize;
            targetCenter = {
                x: targetActor.token.document.x + (tokenGridSize / 2),
                y: targetActor.token.document.y + (tokenGridSize / 2)
            };
        } else {
            const targetGridX = Math.floor(targetPos.x / gridSize) * gridSize;
            const targetGridY = Math.floor(targetPos.y / gridSize) * gridSize;
            targetCenter = {
                x: targetGridX + (gridSize / 2),
                y: targetGridY + (gridSize / 2)
            };
        }

        // Calculer le vecteur directionnel de Yunyun vers la cible
        const dx = targetCenter.x - casterCenter.x;
        const dy = targetCenter.y - casterCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Vecteurs unitaires
        const unitX = distance > 0 ? dx / distance : 1;
        const unitY = distance > 0 ? dy / distance : 0;

        // Position du portail : 1 case devant Yunyun en direction de la cible
        const portalX = casterCenter.x + (unitX * gridSize);
        const portalY = casterCenter.y + (unitY * gridSize);

        // Aligner sur la grille
        const portalGridX = Math.floor(portalX / gridSize) * gridSize;
        const portalGridY = Math.floor(portalY / gridSize) * gridSize;

        return {
            x: portalGridX,
            y: portalGridY,
            centerX: portalGridX + (gridSize / 2),
            centerY: portalGridY + (gridSize / 2)
        };
    }

    /**
     * Génère une position aléatoire dans un rayon de 3 cases autour de l'attaquant
     */
    function generateRandomPositionAroundAttacker(attackerPos) {
        const gridSize = canvas.grid.size;
        const radius = 3; // 3 cases de rayon

        // Position centrale de l'attaquant
        const attackerGridX = Math.floor(attackerPos.x / gridSize);
        const attackerGridY = Math.floor(attackerPos.y / gridSize);

        // Générer une position aléatoire dans le rayon
        const offsetX = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
        const offsetY = Math.floor(Math.random() * (radius * 2 + 1)) - radius;

        const randomGridX = attackerGridX + offsetX;
        const randomGridY = attackerGridY + offsetY;

        return {
            x: randomGridX * gridSize,
            y: randomGridY * gridSize,
            centerX: (randomGridX * gridSize) + (gridSize / 2),
            centerY: (randomGridY * gridSize) + (gridSize / 2),
            gridX: randomGridX,
            gridY: randomGridY
        };
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== CONFIGURATION DIALOG =====
    async function showConfigDialog() {
        return new Promise((resolve) => {
            const stanceDisplay = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            const dialogContent = `
                <div style="background: linear-gradient(135deg, #e8eaf6, #c5cae9); padding: 15px; border-radius: 10px; border: 2px solid #4169e1; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #3f51b5; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            🌀 ${SPELL_CONFIG.name} 🌀
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">${SPELL_CONFIG.description}</p>
                        <div style="background: rgba(65, 105, 225, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                            <strong>Interception: ${SPELL_CONFIG.characteristicDisplay}</strong> ${characteristicInfo.final}${stanceDisplay}
                        </div>
                    </div>

                    <div style="background: rgba(65, 105, 225, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #4169e1; margin-bottom: 15px;">
                        <h3 style="color: #3f51b5; margin: 0 0 10px 0; text-align: center;">Caractéristiques du Sort</h3>
                        <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                        <div><strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana (non focalisable)</div>
                        <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                        <div style="margin-top: 8px; padding: 8px; background: rgba(255, 255, 255, 0.3); border-radius: 4px;">
                            <strong>⚡ Mécaniques d'Interception :</strong>
                            <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
                                <li><strong>Réussite simple :</strong> Projectile renvoyé aléatoirement (3 cases de rayon)</li>
                                <li><strong>Réussite +10 :</strong> Projectile renvoyé directement sur l'attaquant</li>
                                <li><strong>Échec :</strong> Projectile touche Yunyun, portail trop tardif</li>
                            </ul>
                        </div>
                    </div>

                    <div style="background: rgba(255, 152, 0, 0.1); padding: 12px; border-radius: 8px; border: 2px solid #ff9800; margin-bottom: 15px;">
                        <h3 style="color: #f57c00; margin: 0 0 10px 0; text-align: center;">⚔️ Jet Adversaire</h3>
                        <div style="margin: 10px 0;">
                            <label for="enemyRoll" style="display: block; margin-bottom: 5px; font-weight: bold;">Résultat du jet d'attaque adversaire :</label>
                            <input type="number" id="enemyRoll" name="enemyRoll" value="10" min="1" max="100" style="width: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 3px;">
                        </div>
                        <p style="font-size: 0.85em; color: #e65100; margin: 8px 0 0 0;">
                            <strong>Important :</strong> Entrez le résultat total de l'attaque que vous tentez d'intercepter.
                        </p>
                    </div>

                    <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <strong>Bonus d'Interception:</strong>
                        <div style="margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div><label for="interceptBonus">Bonus d'Interception:</label></div>
                            <div><input type="number" id="interceptBonus" name="interceptBonus" value="0" style="width: 60px;"></div>
                        </div>
                    </div>
                </div>
            `;

            new Dialog({
                title: `${SPELL_CONFIG.name} - Configuration`,
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const enemyRoll = parseInt(html.find('#enemyRoll').val()) || 10;
                            const interceptBonus = parseInt(html.find('#interceptBonus').val()) || 0;
                            resolve({
                                confirmed: true,
                                enemyRoll: enemyRoll,
                                interceptBonus: interceptBonus
                            });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve({ confirmed: false })
                    }
                },
                default: "cast",
                render: () => {
                    console.log(`[DEBUG] Configuration dialog rendered for ${SPELL_CONFIG.name}`);
                }
            }).render(true);
        });
    }

    const spellConfig = await showConfigDialog();
    if (!spellConfig.confirmed) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { enemyRoll, interceptBonus } = spellConfig;

    // ===== TARGETING SYSTEM =====
    async function selectAttacker() {
        ui.notifications.info(`🎯 Sélectionnez l'attaquant à intercepter...`);

        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            console.error("[DEBUG] Portal targeting error:", error);
            ui.notifications.error("❌ Erreur lors du ciblage. Vérifiez que le module Portal est installé et actif.");
            return null;
        }
    }

    const attackerTarget = await selectAttacker();
    if (!attackerTarget) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== ACTOR DETECTION =====
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
        const gridSize = canvas.grid.size;

        if (canvas.grid.type !== 0) {
            const gridX = Math.floor(targetX / gridSize);
            const gridY = Math.floor(targetY / gridSize);

            for (const token of canvas.tokens.placeables) {
                if (!token.visible) continue;

                const tokenCenterX = token.x + (token.width / 2);
                const tokenCenterY = token.y + (token.height / 2);

                const tokenGridX = Math.floor(tokenCenterX / gridSize);
                const tokenGridY = Math.floor(tokenCenterY / gridSize);

                if (tokenGridX === gridX && tokenGridY === gridY) {
                    console.log(`[DEBUG] Found actor: ${token.name} at grid (${tokenGridX}, ${tokenGridY})`);
                    return { token: token, name: token.name, actor: token.actor };
                }
            }
        } else {
            const tolerance = gridSize / 4;

            for (const token of canvas.tokens.placeables) {
                if (!token.visible) continue;

                const tokenCenterX = token.x + (token.width / 2);
                const tokenCenterY = token.y + (token.height / 2);

                const distance = Math.sqrt(
                    Math.pow(targetX - tokenCenterX, 2) +
                    Math.pow(targetY - tokenCenterY, 2)
                );

                if (distance <= tolerance) {
                    console.log(`[DEBUG] Found actor: ${token.name} within ${distance}px tolerance`);
                    return { token: token, name: token.name, actor: token.actor };
                }
            }
        }

        console.log(`[DEBUG] No actor found at target location`);
        return null;
    }

    const attackerActor = getActorAtLocation(attackerTarget.x, attackerTarget.y);
    const attackerName = attackerActor ? attackerActor.name : "Attaquant Inconnu";

    // ===== INTERCEPTION ROLL =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalInterceptDice = characteristicInfo.final + characteristicBonus;
    const levelBonus = SPELL_CONFIG.spellLevel * 2;

    const interceptRoll = new Roll(`${totalInterceptDice}d7 + ${levelBonus} + ${interceptBonus}`);
    await interceptRoll.evaluate({ async: true });

    // ===== RESULT DETERMINATION =====
    const interceptResult = interceptRoll.total;
    const difference = interceptResult - enemyRoll;

    let outcome;
    let redirectTarget;
    let redirectPosition;

    if (difference >= 10) {
        // Réussite critique : renvoi direct sur l'attaquant
        outcome = "critical_success";
        redirectTarget = attackerActor;
        redirectPosition = {
            centerX: attackerActor.token.x + (attackerActor.token.width / 2),
            centerY: attackerActor.token.y + (attackerActor.token.height / 2)
        };
    } else if (difference > 0) {
        // Réussite simple : renvoi aléatoire dans un rayon de 3 cases
        outcome = "success";
        redirectPosition = generateRandomPositionAroundAttacker(attackerTarget);
        redirectTarget = null; // Pas de cible spécifique, juste une position
    } else {
        // Échec : le projectile touche Yunyun
        outcome = "failure";
        redirectTarget = null;
        redirectPosition = null;
    }

    // ===== ANIMATIONS =====
    async function playInterceptionAnimation() {
        try {
            const sequence = new Sequence();
            const gridSize = canvas.grid.size;

            // Positions importantes
            const casterPosition = { x: caster.document.x, y: caster.document.y };
            const portalPosition = calculatePortalPosition(casterPosition, attackerTarget);

            const casterCenter = {
                x: caster.document.x + (gridSize / 2),
                y: caster.document.y + (gridSize / 2)
            };

            const attackerCenter = attackerActor ? {
                x: attackerActor.token.x + (attackerActor.token.width / 2),
                y: attackerActor.token.y + (attackerActor.token.height / 2)
            } : {
                x: attackerTarget.x,
                y: attackerTarget.y
            };

            // Calcul de la rotation du portail selon la direction d'attaque
            const dx = attackerCenter.x - portalPosition.centerX;
            const dy = attackerCenter.y - portalPosition.centerY;
            const attackAngle = Math.atan2(dy, dx);
            const rotationDegrees = (attackAngle * 180 / Math.PI) + 90; // +90° pour ajuster l'orientation

            if (outcome === "failure") {
                // Échec : projectile vers Yunyun, puis portail tardif
                sequence.effect()
                    .file(SPELL_CONFIG.animations.projectileIncoming)
                    .atLocation({ x: attackerCenter.x, y: attackerCenter.y })
                    .stretchTo({ x: casterCenter.x, y: casterCenter.y })
                    .scale(0.8)
                    .waitUntilFinished(-500);

            } else {
                // Réussite : portail unique avec fade in/out et rotation
                sequence.effect()
                    .file(SPELL_CONFIG.animations.portalOpen)
                    .atLocation({ x: portalPosition.centerX, y: portalPosition.centerY })
                    .scale(0.8)
                    .rotate(-rotationDegrees)
                    .fadeIn(500)
                    .fadeOut(500)
                    .delay(0)
                    .duration(3000);

                // Projectile incoming vers le portail
                sequence.effect()
                    .file(SPELL_CONFIG.animations.projectileIncoming)
                    .atLocation({ x: attackerCenter.x, y: attackerCenter.y })
                    .stretchTo({ x: portalPosition.centerX, y: portalPosition.centerY })
                    .scale(0.8)
                    .delay(800)
                    .waitUntilFinished(-300);

                // Projectile sortant du portail
                sequence.effect()
                    .file(SPELL_CONFIG.animations.projectileRedirect)
                    .atLocation({ x: portalPosition.centerX, y: portalPosition.centerY })
                    .stretchTo({ x: redirectPosition.centerX, y: redirectPosition.centerY })
                    .scale(0.8)
                    .waitUntilFinished(-300);
            }

            await sequence.play();

        } catch (error) {
            console.error("[DEBUG] Animation error:", error);
        }
    }

    await playInterceptionAnimation();

    // ===== CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceNote = currentStance ? ` <em>(Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})</em>` : '';

        let outcomeColor, outcomeText, outcomeDescription;

        switch (outcome) {
            case "critical_success":
                outcomeColor = "#4CAF50";
                outcomeText = "RÉUSSITE CRITIQUE";
                outcomeDescription = `Projectile renvoyé directement sur ${attackerName} !`;
                break;
            case "success":
                outcomeColor = "#2196F3";
                outcomeText = "RÉUSSITE";
                outcomeDescription = `Projectile renvoyé dans une zone aléatoire (grid ${redirectPosition.gridX}, ${redirectPosition.gridY})`;
                break;
            case "failure":
                outcomeColor = "#f44336";
                outcomeText = "ÉCHEC";
                outcomeDescription = `Le projectile touche Yunyun ! Portail ouvert trop tard.`;
                break;
        }

        return `
            <div style="background: linear-gradient(135deg, #e8eaf6, #c5cae9); padding: 12px; border-radius: 8px; border: 2px solid #4169e1; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #3f51b5;">🌀 Sort de ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana
                    </div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(65, 105, 225, 0.1); border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #3f51b5; margin-bottom: 6px;"><strong>⚔️ Jet d'Adversaire:</strong> ${enemyRoll}</div>
                    <div style="font-size: 1.4em; color: #3f51b5; font-weight: bold;">🌀 INTERCEPTION: ${interceptResult}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${totalInterceptDice}d7 + ${levelBonus + interceptBonus})</div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.3); border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${outcomeColor}; font-weight: bold; margin-bottom: 6px;">
                        📊 RÉSULTAT: ${outcomeText} (${difference >= 0 ? '+' : ''}${difference})
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 4px;"><strong>Attaquant:</strong> ${attackerName}</div>
                    <div style="font-size: 0.9em; color: ${outcomeColor};">${outcomeDescription}</div>
                </div>

                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>✨ Niveau:</strong> ${SPELL_CONFIG.spellLevel} (+${levelBonus} bonus)${stanceNote}</div>
                </div>
            </div>
        `;
    }

    const enhancedFlavor = createChatFlavor();

    // Send the roll message
    await interceptRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    let outcomeNotification;
    switch (outcome) {
        case "critical_success":
            outcomeNotification = `RÉUSSITE CRITIQUE ! Projectile renvoyé sur ${attackerName}`;
            break;
        case "success":
            outcomeNotification = `RÉUSSITE ! Projectile renvoyé aléatoirement`;
            break;
        case "failure":
            outcomeNotification = `ÉCHEC ! Le projectile touche Yunyun`;
            break;
    }

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Interception: ${interceptResult} vs ${enemyRoll}. ${outcomeNotification} - ${SPELL_CONFIG.manaCost} mana`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Caster: ${actor.name}, Attacker: ${attackerName}, Intercept: ${interceptResult}, Enemy: ${enemyRoll}, Outcome: ${outcome}`);

})();
