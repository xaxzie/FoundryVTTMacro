/**
 * Combat Sanglant - Ora
 *
 * Techniques de combat spéciales disponibles uniquement quand Blood Control est actif.
 * Deux options disponibles : Frappe Simple et Frappe Sanglante.
 *
 * PRÉREQUIS : Effet "Blood Control" actif sur Ora
 *
 * OPTION 1 - Frappe Simple :
 * - Coût : Gratuit
 * - Attaque : Esprit (+ bonus d'effets actifs)
 * - Dégâts : 1d8 + Esprit
 * - Animation : Coup de poing d'Ora vers la cible + impact
 *
 * OPTION 2 - Frappe Sanglante :
 * - Coût : Gratuit
 * - Phase 1 : Sélection case de saut + détection cibles adjacentes
 * - Phase 2 : Choix d'une cible adjacente
 * - Phase 3 : Saut vers la case (mouvement 'jump') + coup de pied
 * - Attaque : Esprit (+ bonus d'effets actifs)
 * - Dégâts : 2d8 + Esprit × 1.5 (arrondi inférieur)
 * - Jet de risque : Esprit vs difficulté 30 (+5 par utilisation précédente)
 * - Échec : Ora subit une blessure
 * - Réussite : +1 au compteur "Charge sanglante" (augmente difficulté future)
 * - Effet : Ora perd son action de mouvement au prochain tour
 *
 * Usage : Sélectionner le token d'Ora avec Blood Control actif, choisir l'option désirée.
 */

(async () => {
    // ===== CONFIGURATION =====
    const COMBAT_CONFIG = {
        name: "Combat Sanglant",
        prerequisiteEffect: "Blood Control",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",

        simple: {
            name: "Frappe Simple",
            description: "Coup de poing rapide",
            manaCost: 0,
            damageFormula: "1d8",
            animations: {
                punch: "jb2a_patreon.unarmed_strike.physical.01.dark_red",
                impact: "jb2a.impact.ground_crack.orange.02"
            }
        },

        bloody: {
            name: "Frappe Sanglante",
            description: "Saut + coup de pied puissant",
            manaCost: 0,
            damageFormula: "2d8",
            multiplier: 1.5,
            baseDifficulty: 30,
            difficultyIncrease: 5,
            chargeSanglanteEffect: "Charge sanglante",
            animations: {
                jump: "animated-spell-effects-cartoon.air.puff.01",
                kick: "jb2a_patreon.unarmed_strike.physical.02.dark_red",
                impact: "jb2a.impact.ground_crack.orange.02"
            }
        },

        targeting: {
            range: 120,
            color: "#8B0000",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token d'Ora !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé pour le token sélectionné !");
        return;
    }

    // ===== VÉRIFICATION DU PRÉREQUIS Blood Control =====
    const bloodControlEffect = actor.effects?.contents?.find(e =>
        e.name === COMBAT_CONFIG.prerequisiteEffect
    );

    if (!bloodControlEffect) {
        ui.notifications.error(`❌ Blood Control n'est pas actif ! Activez d'abord cet effet via HandleOraEffect.`);
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
     * Obtient les bonus d'effets actifs pour une caractéristique donnée
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
            }
        }
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Obtient l'effet Charge sanglante existant
     */
    function getChargeSanglanteEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === COMBAT_CONFIG.bloody.chargeSanglanteEffect
        ) || null;
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, COMBAT_CONFIG.characteristic);
    const chargeSanglanteEffect = getChargeSanglanteEffect(actor);
    const currentChargeStacks = chargeSanglanteEffect?.flags?.statuscounter?.value || 0;
    const currentDifficulty = COMBAT_CONFIG.bloody.baseDifficulty + (currentChargeStacks * COMBAT_CONFIG.bloody.difficultyIncrease);

    // ===== DIALOG DE CHOIX D'OPTION =====
    async function showOptionDialog() {
        return new Promise(resolve => {
            const dialogContent = `
                <div style="padding: 15px; background: linear-gradient(135deg, #2c0000, #1a0000); color: #ffffff; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: #FF6B6B;">🩸 ${COMBAT_CONFIG.name}</h3>
                        <p style="margin: 5px 0; color: #FFB3B3;"><strong>Lanceur:</strong> ${actor.name}</p>
                        <p style="margin: 5px 0; color: #FFB3B3;"><strong>Blood Control:</strong> ✅ Actif</p>
                        ${currentStance ? `<p style="margin: 5px 0; color: #FFB3B3;"><strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</p>` : ''}
                    </div>

                    <div style="margin: 15px 0; padding: 10px; background: rgba(139,0,0,0.3); border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #FFB3B3;">🥊 Options de Combat</h4>

                        <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                            <input type="radio" id="simple" name="option" value="simple" checked>
                            <label for="simple" style="color: #FFB3B3;">
                                <strong>Frappe Simple</strong> - Coup de poing rapide
                                <br><small>Coût: Gratuit | Dégâts: 1d8 + Esprit | Animation: Coup de poing</small>
                            </label>
                        </div>

                        <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                            <input type="radio" id="bloody" name="option" value="bloody">
                            <label for="bloody" style="color: #FFB3B3;">
                                <strong>Frappe Sanglante</strong> - Saut + coup de pied puissant
                                <br><small>Coût: Gratuit | Dégâts: 2d8 + Esprit×1.5 | Saut vers case + attaque adjacente</small>
                                <br><small style="color: #FFCCCC;">⚠️ Jet de risque: Esprit vs ${currentDifficulty} | Échec = blessure | Perd action mouvement au prochain tour</small>
                            </label>
                        </div>
                    </div>

                    <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #FFB3B3;">📊 Statistiques</h4>
                        <p style="margin: 5px 0;"><strong>${COMBAT_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>
                        ${currentChargeStacks > 0 ? `<p style="margin: 5px 0; color: #FFCCCC;"><strong>Charges sanglantes :</strong> ${currentChargeStacks} (Difficulté: ${currentDifficulty})</p>` : ''}
                    </div>
                </div>
            `;

            new Dialog({
                title: "🩸 Combat Sanglant - Choix d'Option",
                content: dialogContent,
                buttons: {
                    execute: {
                        icon: '<i class="fas fa-fist-raised"></i>',
                        label: "🥊 Exécuter",
                        callback: (html) => {
                            const option = html.find('input[name="option"]:checked').val();
                            resolve({ option });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "execute"
            }, { width: 500 }).render(true);
        });
    }

    const choiceResult = await showOptionDialog();
    if (!choiceResult) {
        ui.notifications.info("❌ Combat sanglant annulé.");
        return;
    }

    const { option } = choiceResult;

    // ===== FONCTIONS COMMUNES =====

    /**
     * Détecte l'acteur à une position donnée
     */
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        if (canvas.grid.type !== 0) {
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                if (!(token.isVisible || token.isOwner || game.user.isGM)) return false;

                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        if (tokenSquareX === targetGridX && tokenSquareY === targetGridY) {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            return targetToken.actor ? { name: targetToken.name, token: targetToken, actor: targetToken.actor } : null;
        } else {
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                if (!(token.isVisible || token.isOwner || game.user.isGM)) return false;

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const distance = Math.sqrt(Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2));
                return distance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            return targetToken.actor ? { name: targetToken.name, token: targetToken, actor: targetToken.actor } : null;
        }
    }

    /**
     * Applique une blessure à l'acteur
     */
    async function addInjury(actor) {
        try {
            // Chercher l'effet blessures existant
            const existingInjury = actor.effects.find(e =>
                e.name?.toLowerCase() === 'blessures'
            );

            if (existingInjury) {
                const currentValue = existingInjury.flags?.statuscounter?.value || 1;
                await existingInjury.update({
                    "flags.statuscounter.value": currentValue + 1,
                    "flags.statuscounter.visible": true
                });
            } else {
                // Créer un nouvel effet blessures
                const injuryEffect = {
                    name: "Blessures",
                    icon: "icons/svg/blood.svg",
                    origin: actor.uuid,
                    duration: { seconds: 86400 },
                    flags: {
                        statuscounter: { value: 1, visible: true }
                    }
                };
                await actor.createEmbeddedDocuments("ActiveEffect", [injuryEffect]);
            }
            return true;
        } catch (error) {
            console.error("[Combat Sanglant] Error adding injury:", error);
            return false;
        }
    }

    /**
     * Met à jour l'effet Charge sanglante
     */
    async function updateChargeSanglanteEffect(actor, newValue) {
        try {
            const existingEffect = getChargeSanglanteEffect(actor);

            if (existingEffect) {
                if (newValue > 0) {
                    await existingEffect.update({
                        "flags.statuscounter.value": newValue,
                        "flags.statuscounter.visible": true
                    });
                } else {
                    await existingEffect.delete();
                }
            } else if (newValue > 0) {
                const chargeEffect = {
                    name: COMBAT_CONFIG.bloody.chargeSanglanteEffect,
                    icon: "icons/magic/unholy/strike-beam-blood-small-red-blue.webp",
                    origin: actor.uuid,
                    duration: { seconds: 86400 },
                    flags: {
                        statuscounter: { value: newValue, visible: true }
                    }
                };
                await actor.createEmbeddedDocuments("ActiveEffect", [chargeEffect]);
            }
            return newValue;
        } catch (error) {
            console.error("[Combat Sanglant] Error updating Charge sanglante effect:", error);
            return 0;
        }
    }

    // ===== OPTION 1 : FRAPPE SIMPLE =====
    if (option === 'simple') {
        // Targeting simple
        let target;
        try {
            const portal = new Portal()
                .origin(caster)
                .range(COMBAT_CONFIG.targeting.range)
                .color(COMBAT_CONFIG.targeting.color)
                .texture(COMBAT_CONFIG.targeting.texture);

            target = await portal.pick();
            if (!target) {
                ui.notifications.info("❌ Ciblage annulé.");
                return;
            }
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return;
        }

        const targetActor = getActorAtLocation(target.x, target.y);
        const targetName = targetActor ? targetActor.name : "position";

        // Calcul des dégâts
        async function calculateSimpleDamage() {
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const totalDamageBonus = characteristicInfo.final + effectDamageBonus;

            if (currentStance === 'offensif') {
                // Dégâts maximisés en position offensive
                const maxDamage = 8 + totalDamageBonus;
                return {
                    total: maxDamage,
                    formula: `8 + ${totalDamageBonus}`,
                    isMaximized: true
                };
            } else {
                // Lancer les dés normalement
                const roll = new Roll(`1d8 + ${totalDamageBonus}`);
                await roll.evaluate({ async: true });
                return roll;
            }
        }

        const damageResult = await calculateSimpleDamage();

        // Animation
        async function playSimpleAnimation() {
            const sequence = new Sequence();
            const gridSize = canvas.grid.size;

            // Centrer les positions d'animation
            const targetCenter = {
                x: target.x + (gridSize / 2),
                y: target.y + (gridSize / 2)
            };

            // Animation de coup de poing d'Ora vers la cible
            sequence.effect()
                .file(COMBAT_CONFIG.simple.animations.punch)
                .atLocation(caster)
                .stretchTo(targetCenter)
                .scale(0.8)
                .delay(200);

            // Animation d'impact sur la cible
            sequence.effect()
                .file(COMBAT_CONFIG.simple.animations.impact)
                .atLocation(targetCenter)
                .scale(0.5)
                .delay(800);

            await sequence.play();
        }

        await playSimpleAnimation();

        // Résolution d'attaque
        const totalAttackDice = characteristicInfo.final;
        const levelBonus = 0; // Pas de niveau de sort

        // Combined roll
        let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

        if (currentStance !== 'offensif') {
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const totalDamageBonus = characteristicInfo.final + effectDamageBonus;
            combinedRollParts.push(`1d8 + ${totalDamageBonus}`);
        }

        const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        const attackResult = combinedRoll.terms[0].results[0];
        let finalDamageResult = damageResult;

        if (currentStance !== 'offensif') {
            const damageRollResult = combinedRoll.terms[0].results[1];
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const totalDamageBonus = characteristicInfo.final + effectDamageBonus;
            finalDamageResult = {
                total: damageRollResult.result,
                formula: `1d8 + ${totalDamageBonus}`
            };
        }

        // Chat Message
        function createSimpleChatFlavor() {
            const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';

            return `
                <div style="background: linear-gradient(135deg, #2c0000, #1a0000); padding: 12px; border-radius: 8px; border: 2px solid #8B0000; margin: 8px 0; color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #FF6B6B;">🩸 ${COMBAT_CONFIG.simple.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em; color: #FFB3B3;">
                            <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> Gratuit (Blood Control)
                            ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <div style="font-size: 1.4em; color: #FFD700; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(139,0,0,0.3); border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #FFB3B3; margin-bottom: 6px;"><strong>🥊 Coup de Poing${stanceNote}</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                        <div style="font-size: 1.4em; color: #FF6B6B; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                        <div style="font-size: 0.8em; color: #FFCCCC; margin-top: 2px;">(1d8 + Esprit)</div>
                    </div>
                </div>
            `;
        }

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: createSimpleChatFlavor(),
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`🩸 Frappe Simple lancée ! Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}.`);

    }

    // ===== OPTION 2 : FRAPPE SANGLANTE =====
    else if (option === 'bloody') {
        // Phase 1: Sélection de la case de saut
        let jumpTarget;
        try {
            const jumpPosition = await window.Sequencer.Crosshair.show({
                size: canvas.grid.size,
                icon: COMBAT_CONFIG.targeting.texture,
                label: "Case de saut",
                labelOffset: { y: -40 },
                drawIcon: true,
                drawOutline: true,
                interval: -1,
                fillAlpha: 0.25,
                tileTexture: false,
                lockSize: true,
                rememberControlledTokens: false,
                drawBoundingBox: false
            });

            const gridSize = canvas.grid.size;
            const targetGridX = Math.floor(jumpPosition.x / gridSize);
            const targetGridY = Math.floor(jumpPosition.y / gridSize);
            const snappedX = targetGridX * gridSize;
            const snappedY = targetGridY * gridSize;

            jumpTarget = { x: snappedX, y: snappedY };
        } catch (error) {
            ui.notifications.error("Erreur lors de la sélection de case de saut.");
            return;
        }

        // Phase 2: Détection des cibles adjacentes (basé sur feu-obscur.js)
        function getAdjacentTargets(centerX, centerY) {
            const gridSize = canvas.grid.size;
            const centerGridX = Math.floor(centerX / gridSize);
            const centerGridY = Math.floor(centerY / gridSize);

            const adjacent = [];

            // Vérifier les 8 cases adjacentes
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue; // Skip center

                    const adjGridX = centerGridX + dx;
                    const adjGridY = centerGridY + dy;
                    const adjX = adjGridX * gridSize;
                    const adjY = adjGridY * gridSize;

                    const actorAtAdj = getActorAtLocation(adjX, adjY);
                    if (actorAtAdj && actorAtAdj.token.id !== caster.id) {
                        adjacent.push({
                            ...actorAtAdj,
                            gridX: adjGridX,
                            gridY: adjGridY,
                            x: adjX,
                            y: adjY
                        });
                    }
                }
            }

            return adjacent;
        }

        const adjacentTargets = getAdjacentTargets(jumpTarget.x, jumpTarget.y);

        if (adjacentTargets.length === 0) {
            ui.notifications.warn("❌ Aucune cible adjacente à cette case pour la Frappe Sanglante !");
            return;
        }

        // Phase 3: Choix de la cible adjacente
        let selectedTarget;
        if (adjacentTargets.length === 1) {
            selectedTarget = adjacentTargets[0];
        } else {
            selectedTarget = await new Promise(resolve => {
                const targetOptions = adjacentTargets.map((target, index) =>
                    `<label><input type="radio" name="target" value="${index}" ${index === 0 ? 'checked' : ''}> ${target.name}</label>`
                ).join('<br>');

                new Dialog({
                    title: "🩸 Choix de la Cible Adjacente",
                    content: `
                        <div style="padding: 10px;">
                            <h4>Cibles adjacentes disponibles :</h4>
                            ${targetOptions}
                        </div>
                    `,
                    buttons: {
                        select: {
                            label: "Sélectionner",
                            callback: (html) => {
                                const selectedIndex = parseInt(html.find('input[name="target"]:checked').val());
                                resolve(adjacentTargets[selectedIndex]);
                            }
                        },
                        cancel: {
                            label: "Annuler",
                            callback: () => resolve(null)
                        }
                    },
                    default: "select"
                }).render(true);
            });
        }

        if (!selectedTarget) {
            ui.notifications.info("❌ Sélection de cible annulée.");
            return;
        }

        // Phase 4: Saut vers la case (mouvement 'jump' au lieu de 'blink')
        const originalPosition = {
            x: caster.document.x,
            y: caster.document.y
        };

        async function executeJump() {
            try {
                // Sauvegarder le mode de déplacement actuel
                const originalMovementType = caster.document.movementAction;

                // Activer le mode de déplacement "Jump"
                await caster.document.update({ movementAction: 'jump' });

                // Effectuer le déplacement avec le mode saut
                const updates = {
                    x: jumpTarget.x,
                    y: jumpTarget.y
                };

                await caster.document.update(updates);

                // Restaurer le mode de déplacement original
                await caster.document.update({ movementAction: originalMovementType });

                console.log(`[Combat Sanglant] Token jumped to (${jumpTarget.x}, ${jumpTarget.y})`);
                return true;
            } catch (error) {
                console.error("[Combat Sanglant] Error jumping:", error);
                ui.notifications.error("Échec du saut !");
                return false;
            }
        }

        // Phase 5: Calcul des dégâts de la Frappe Sanglante
        async function calculateBloodyDamage() {
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const spiritBonus = Math.floor(characteristicInfo.final * COMBAT_CONFIG.bloody.multiplier); // Esprit × 1.5 arrondi inférieur
            const totalDamageBonus = spiritBonus + effectDamageBonus;

            if (currentStance === 'offensif') {
                // Dégâts maximisés en position offensive
                const maxDamage = 16 + totalDamageBonus; // 2d8 max = 16
                return {
                    total: maxDamage,
                    formula: `16 + ${totalDamageBonus}`,
                    isMaximized: true
                };
            } else {
                const roll = new Roll(`2d8 + ${totalDamageBonus}`);
                await roll.evaluate({ async: true });
                return roll;
            }
        }

        // Phase 6: Jet de risque (Esprit vs difficulté)
        const riskRoll = new Roll(`${characteristicInfo.final}d7`);
        await riskRoll.evaluate({ async: true });
        const riskSuccess = riskRoll.total >= currentDifficulty;

        // Phase 7: Animation complète
        async function playBloodyAnimation() {
            const sequence = new Sequence();
            const gridSize = canvas.grid.size;

            // Centrer les positions d'animation
            const originalCenter = {
                x: originalPosition.x + (gridSize / 2),
                y: originalPosition.y + (gridSize / 2)
            };

            const jumpCenter = {
                x: jumpTarget.x + (gridSize / 2),
                y: jumpTarget.y + (gridSize / 2)
            };

            const selectedTargetCenter = {
                x: selectedTarget.x + (gridSize / 2),
                y: selectedTarget.y + (gridSize / 2)
            };

            // Animation de saut
            sequence.effect()
                .file(COMBAT_CONFIG.bloody.animations.jump)
                .atLocation(originalCenter)
                .scale(0.8)
                .delay(200);

            // Animation de coup de pied vers la cible
            sequence.effect()
                .file(COMBAT_CONFIG.bloody.animations.kick)
                .atLocation(jumpCenter)
                .stretchTo(selectedTargetCenter)
                .scale(0.9)
                .delay(800);

            // Animation d'impact sur la cible
            sequence.effect()
                .file(COMBAT_CONFIG.bloody.animations.impact)
                .atLocation(selectedTargetCenter)
                .scale(1)
                .delay(1200);

            return sequence.play();
        }

        // Exécuter le saut au début de l'animation
        const animationPromise = playBloodyAnimation();
        setTimeout(async () => {
            await executeJump();
        }, 400);

        const damageResult = await calculateBloodyDamage();
        await animationPromise;

        // Phase 8: Gestion des effets selon le résultat du jet de risque
        if (!riskSuccess) {
            await addInjury(actor);
            ui.notifications.warn(`🩸 Jet de risque échoué ! (${riskRoll.total} < ${currentDifficulty}) - Ora subit une blessure !`);
        } else {
            const newChargeStacks = await updateChargeSanglanteEffect(actor, currentChargeStacks + 1);
            ui.notifications.info(`🩸 Jet de risque réussi ! (${riskRoll.total} >= ${currentDifficulty}) - Difficulté future augmentée.`);
        }

        // Phase 9: Résolution d'attaque
        const totalAttackDice = characteristicInfo.final;
        const levelBonus = 0; // Pas de niveau de sort

        // Combined roll (attaque + dégâts + risque)
        let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

        if (currentStance !== 'offensif') {
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const spiritBonus = Math.floor(characteristicInfo.final * COMBAT_CONFIG.bloody.multiplier);
            const totalDamageBonus = spiritBonus + effectDamageBonus;
            combinedRollParts.push(`2d8 + ${totalDamageBonus}`);
        }

        // Ajouter le jet de risque au message combiné
        combinedRollParts.push(`${characteristicInfo.final}d7`);

        const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        const attackResult = combinedRoll.terms[0].results[0];
        let finalDamageResult = damageResult;

        if (currentStance !== 'offensif') {
            const damageRollResult = combinedRoll.terms[0].results[1];
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const spiritBonus = Math.floor(characteristicInfo.final * COMBAT_CONFIG.bloody.multiplier);
            const totalDamageBonus = spiritBonus + effectDamageBonus;
            finalDamageResult = {
                total: damageRollResult.result,
                formula: `2d8 + ${totalDamageBonus}`
            };
        }

        // Le jet de risque est le dernier dans le combined roll
        const riskRollFromCombined = combinedRoll.terms[0].results[combinedRoll.terms[0].results.length - 1];

        // Chat Message
        function createBloodyChatFlavor() {
            const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
            const riskStatusColor = riskSuccess ? '#4CAF50' : '#F44336';
            const riskStatusText = riskSuccess ? 'RÉUSSI' : 'ÉCHOUÉ';

            return `
                <div style="background: linear-gradient(135deg, #2c0000, #1a0000); padding: 12px; border-radius: 8px; border: 2px solid #8B0000; margin: 8px 0; color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #FF6B6B;">🩸 ${COMBAT_CONFIG.bloody.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em; color: #FFB3B3;">
                            <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> Gratuit (Blood Control)
                            ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 4px;">
                        <div style="font-size: 1.4em; color: #FFD700; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(139,0,0,0.3); border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #FFB3B3; margin-bottom: 6px;"><strong>🦵 Coup de Pied (Saut)${stanceNote}</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${selectedTarget.name}</div>
                        <div style="font-size: 1.4em; color: #FF6B6B; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                        <div style="font-size: 0.8em; color: #FFCCCC; margin-top: 2px;">(2d8 + Esprit×1.5)</div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 4px;">
                        <div style="font-size: 1.1em; color: ${riskStatusColor}; font-weight: bold;">🎲 JET DE RISQUE: ${riskRollFromCombined.result} vs ${currentDifficulty} - ${riskStatusText}</div>
                        <div style="font-size: 0.8em; color: #FFCCCC; margin-top: 2px;">
                            ${riskSuccess ? 'Charges sanglantes: +1 (difficulté future augmentée)' : 'Ora subit une blessure !'}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 8px; background: rgba(255,69,0,0.3); border-radius: 4px;">
                        <div style="font-size: 0.9em; color: #FFCCCC;"><strong>⚠️ Ora perd son action de mouvement au prochain tour</strong></div>
                    </div>
                </div>
            `;
        }

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: createBloodyChatFlavor(),
            rollMode: game.settings.get('core', 'rollMode')
        });

        const riskInfo = riskSuccess ? "Réussite (+1 charge)" : "Échec (blessure)";
        ui.notifications.info(`🩸 Frappe Sanglante exécutée ! Cible: ${selectedTarget.name}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}. Risque: ${riskInfo}. Action de mouvement perdue au prochain tour.`);
    }

    console.log(`[Combat Sanglant] Combat completed - Option: ${option}, Caster: ${actor.name}`);

})();
