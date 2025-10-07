/**
 * Contact Cuisant - Aloha
 *
 * Aloha utilise ses mains chauffées pour attraper et brûler une cible. Il peut ensuite
 * continuer à chauffer la cible attrapée, mais au risque de se brûler lui-même.
 *
 * - Coût initial : 2 mana si échoue, 3 mana si réussi
 * - Caractéristique d'attaque : Physique (+ effets actifs + bonus manuels)
 * - Dégâts initiaux : 1d6 + Physique/2 si touche
 * - Effet : Applique "Etreinte Chauffée" à la cible
 * - Chauffage : Si déjà actif, propose uniquement de "chauffer" (1 mana)
 *   - Dégâts de chauffage : 1d6 + Physique à la cible
 *   - Contre-coup : Aloha subit la moitié des dégâts infligés
 *   - Jet de Volonté : Difficulté 15 (+5 par utilisation réussie) pour éviter les dégâts
 *
 * Usage : Sélectionner le token d'Aloha et lancer la macro.
 * Utiliser "endAlohaEffect.js" pour terminer l'étreinte.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Contact Cuisant",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        initialManaCostFail: 2,
        initialManaCostSuccess: 3,
        heatingManaCost: 1,
        spellLevel: 1,
        isDirect: true,
        isFocusable: true,
        physiqueDivisor: 2, // Physique/2 pour dégâts initiaux

        animations: {
            cast: "jb2a.fire_bolt.orange",
            grappleHeat: "jb2a.melee_generic.creature_attack.01.orange",
            heating: "jb2a.burning_hands.01.orange",
            sound: null
        },

        targeting: {
            range: 100, // Portée du contact
            color: "#ff5722", // Couleur orange/rouge
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
        },

        // Configuration de l'effet persistant sur la cible
        grappledEffect: {
            name: "Etreinte Chauffée",
            icon: "icons/magic/fire/flame-burning-creature-orange.webp",
            description: "Attrapé par les mains brûlantes d'Aloha"
        },

        // Configuration de l'effet sur Aloha pour tracker l'état
        selfEffect: {
            name: "Contact Cuisant",
            icon: "icons/magic/fire/flame-burning-hand-orange.webp",
            description: "Maintient une étreinte chauffée sur une cible"
        },

        // Jet de volonté progressif
        willpowerSave: {
            baseDifficulty: 15,
            difficultyIncrease: 5,
            characteristic: "volonte"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton d'Aloha !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }
    const currentStance = getCurrentStance(actor);

    // Active effect bonuses
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey} (total: ${totalBonus})`);
            }
        }
        return totalBonus;
    }

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée !`);
            return null;
        }
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // Volonté pour le jet de sauvegarde
    const willpowerInfo = getCharacteristicValue(actor, SPELL_CONFIG.willpowerSave.characteristic);
    if (!willpowerInfo) return;

    // ===== CHECK EXISTING CONTACT CUISANT EFFECT =====
    const existingContactEffect = actor.effects.find(e => e.name === SPELL_CONFIG.selfEffect.name);
    const isHeatingMode = existingContactEffect !== null;

    let currentHeatCount = 0;
    let targetTokenId = null;

    if (isHeatingMode) {
        currentHeatCount = existingContactEffect.flags?.statuscounter?.value || 0;
        targetTokenId = existingContactEffect.flags?.world?.grappledTarget;
        console.log(`[DEBUG] Heating mode detected. Heat count: ${currentHeatCount}, Target: ${targetTokenId}`);
    }

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        if (isHeatingMode) {
            // Mode chauffage uniquement
            const currentDifficulty = SPELL_CONFIG.willpowerSave.baseDifficulty + (currentHeatCount * SPELL_CONFIG.willpowerSave.difficultyIncrease);

            return new Promise(resolve => {
                new Dialog({
                    title: `${SPELL_CONFIG.name} - Mode Chauffage`,
                    content: `
                        <h3>🔥 ${SPELL_CONFIG.name} - Chauffage</h3>
                        <p><strong>Coût en Mana :</strong> ${SPELL_CONFIG.heatingManaCost} mana</p>
                        <p><strong>Utilisations actuelles :</strong> ${currentHeatCount}</p>
                        <p><strong>Difficulté Volonté :</strong> ${currentDifficulty}</p>

                        <div style="margin: 10px 0; border: 1px solid #ff5722; padding: 10px; background: #fff3e0;">
                            <h4 style="color: #ff5722;">🔥 Mode Chauffage</h4>
                            <p><em>Vous maintenez déjà une étreinte chauffée. Vous pouvez intensifier la chaleur.</em></p>
                            <p style="color: #d32f2f;"><strong>⚠️ Risque :</strong> Vous subirez la moitié des dégâts infligés</p>
                            <p style="color: #1976d2;"><strong>🎲 Sauvegarde :</strong> Jet de Volonté (${currentDifficulty}) pour éviter les dégâts</p>
                            <p style="color: #ff9800;"><strong>💥 Dégâts :</strong> 1d6 + Physique (${characteristicInfo.final}) à la cible</p>
                        </div>

                        <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                            <h4>Bonus Manuels</h4>
                            <div style="margin: 5px 0;">
                                <label>Bonus de dégâts de chauffage :
                                    <input type="number" id="heatingDamageBonus" value="0" min="0" style="width: 60px;">
                                </label>
                            </div>
                        </div>
                    `,
                    buttons: {
                        heat: {
                            label: "🔥 Chauffer !",
                            callback: (html) => {
                                const heatingDamageBonus = parseInt(html.find('#heatingDamageBonus').val()) || 0;
                                resolve({ mode: "heating", heatingDamageBonus });
                            }
                        },
                        cancel: {
                            label: "Annuler",
                            callback: () => resolve(null)
                        }
                    }
                }, {
                    width: 500,
                    height: 400,
                    resizable: true
                }).render(true);
            });

        } else {
            // Mode initial
            const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
                `<strong>Coût en Mana :</strong> GRATUIT si échoue (Position Focus), ${SPELL_CONFIG.initialManaCostSuccess} si réussi` :
                `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.initialManaCostFail} si échoue, ${SPELL_CONFIG.initialManaCostSuccess} si réussi`;

            const physiqueBonus = Math.floor(characteristicInfo.final / SPELL_CONFIG.physiqueDivisor);

            return new Promise(resolve => {
                new Dialog({
                    title: `${SPELL_CONFIG.name} (Position: ${currentStance || 'Aucune'})`,
                    content: `
                        <h3>🔥 ${SPELL_CONFIG.name}</h3>
                        <p>${manaInfo}</p>
                        <p><strong>Caractéristique Physique :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>
                        <p><strong>Dégâts initiaux :</strong> 1d6 + ${physiqueBonus} (Physique/2)</p>

                        <div style="margin: 10px 0; border: 1px solid #ff5722; padding: 10px; background: #fff3e0;">
                            <h4 style="color: #ff5722;">🔥 Description</h4>
                            <p><em>Aloha chauffe ses mains et attrape sa cible, lui infligeant des brûlures continues.</em></p>
                            <p style="color: #d32f2f;"><strong>⚠️ Effet :</strong> Applique "Etreinte Chauffée" à la cible</p>
                            <p style="color: #1976d2;"><strong>ℹ️ Suite :</strong> Relancer pour chauffer davantage (avec risques)</p>
                        </div>

                        <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                            <h4>Bonus Manuels</h4>
                            <div style="margin: 5px 0;">
                                <label>Bonus de résolution d'attaque :
                                    <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                                </label>
                                <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                            </div>
                            <div style="margin: 5px 0;">
                                <label>Bonus de dégâts initiaux :
                                    <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                                </label>
                            </div>
                        </div>

                        <div style="margin: 10px 0; padding: 8px; background: #fff3e0; border-radius: 4px;">
                            <div><strong>Jet d'attaque final :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${SPELL_CONFIG.spellLevel * 2}</span></div>
                        </div>

                        <script>
                            document.getElementById('attackBonus').addEventListener('input', function() {
                                const base = ${characteristicInfo.final};
                                const bonus = parseInt(this.value) || 0;
                                const total = base + bonus;
                                document.getElementById('finalAttack').textContent = total + 'd7 + ${SPELL_CONFIG.spellLevel * 2}';
                            });
                        </script>
                    `,
                    buttons: {
                        cast: {
                            label: "🔥 Attraper et Chauffer !",
                            callback: (html) => {
                                const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                                const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                                resolve({ mode: "initial", attackBonus, damageBonus });
                            }
                        },
                        cancel: {
                            label: "Annuler",
                            callback: () => resolve(null)
                        }
                    }
                }, {
                    width: 500,
                    height: 600,
                    resizable: true
                }).render(true);
            });
        }
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    // ===== MODE CHAUFFAGE =====
    if (userConfig.mode === "heating") {
        if (!targetTokenId) {
            ui.notifications.error("Impossible de trouver la cible attrapée !");
            return;
        }

        const targetToken = canvas.tokens.get(targetTokenId);
        if (!targetToken) {
            ui.notifications.error("La cible attrapée n'est plus sur la scène !");
            return;
        }

        const { heatingDamageBonus } = userConfig;

        // Animation de chauffage
        try {
            if (typeof Sequence !== 'undefined' && SPELL_CONFIG.animations.heating) {
                const seq = new Sequence();
                seq.effect()
                    .file(SPELL_CONFIG.animations.heating)
                    .attachTo(caster)
                    .stretchTo(targetToken)
                    .tint("#ff5722");
                await seq.play();
            }
        } catch (err) {
            console.warn('Sequencer play failed', err);
        }

        // Calcul des dégâts de chauffage
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = characteristicInfo.final + (heatingDamageBonus || 0) + effectDamageBonus;

        const heatingDamage = new Roll(`1d6 + @totalBonus`, { totalBonus: totalDamageBonus });
        await heatingDamage.evaluate({ async: true });

        const targetDamage = heatingDamage.total;
        const alohaDamage = Math.floor(targetDamage / 2);

        // Jet de Volonté
        const currentDifficulty = SPELL_CONFIG.willpowerSave.baseDifficulty + (currentHeatCount * SPELL_CONFIG.willpowerSave.difficultyIncrease);
        const willpowerRoll = new Roll(`${willpowerInfo.final}d7`);
        await willpowerRoll.evaluate({ async: true });

        const willpowerSuccess = willpowerRoll.total >= currentDifficulty;
        const actualAlohaDamage = willpowerSuccess ? 0 : alohaDamage;

        // Mettre à jour le compteur d'utilisation
        const newHeatCount = currentHeatCount + 1;

        try {
            // Mettre à jour l'effet sur Aloha
            const updatedSelfEffectData = {
                name: SPELL_CONFIG.selfEffect.name,
                icon: SPELL_CONFIG.selfEffect.icon,
                description: `${SPELL_CONFIG.selfEffect.description} (${newHeatCount} utilisations)`,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        grappledTarget: targetTokenId,
                        spellName: SPELL_CONFIG.name
                    },
                    statuscounter: { value: newHeatCount }
                }
            };

            await existingContactEffect.update(updatedSelfEffectData);

        } catch (error) {
            console.error("Error updating heating effect:", error);
        }

        // Message de chat pour le chauffage
        function createHeatingFlavor() {
            const willpowerDisplay = willpowerSuccess ? "RÉUSSI" : "ÉCHOUÉ";
            const willpowerColor = willpowerSuccess ? "#2e7d32" : "#d32f2f";

            return `
                <div style="background: linear-gradient(135deg, #fff3e0, #ffebee); padding: 12px; border-radius: 8px; border: 2px solid #ff5722; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #ff5722;">🔥 ${SPELL_CONFIG.name} - Chauffage</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Chef:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.heatingManaCost} mana
                        </div>
                    </div>

                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #ff5722; margin-bottom: 6px;"><strong>🔥 Chauffage Intensifié</strong></div>
                        <div style="font-size: 1.2em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS CIBLE: ${targetDamage}</div>
                        <div style="font-size: 0.9em; color: #666; margin-top: 2px;">Cible: ${targetToken.name}</div>
                    </div>

                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: ${willpowerColor}; margin-bottom: 6px;"><strong>🎲 Jet de Volonté: ${willpowerDisplay}</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;">Jet: ${willpowerRoll.total} vs Difficulté: ${currentDifficulty}</div>
                        <div style="font-size: 1.2em; color: ${willpowerSuccess ? '#2e7d32' : '#d32f2f'}; font-weight: bold;">
                            💥 DÉGÂTS ALOHA: ${actualAlohaDamage}
                        </div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                            ${willpowerSuccess ? 'Résiste au contre-coup !' : 'Subit le contre-coup thermique'}
                        </div>
                    </div>

                    <div style="text-align: center; margin: 8px 0; padding: 8px; background: #fff8e1; border-radius: 4px;">
                        <div style="font-size: 0.9em; color: #f57f17;">
                            <strong>Utilisations:</strong> ${newHeatCount} | <strong>Prochaine difficulté:</strong> ${currentDifficulty + SPELL_CONFIG.willpowerSave.difficultyIncrease}
                        </div>
                    </div>
                </div>
            `;
        }

        // Envoyer les jets combinés au chat
        const combinedRoll = new Roll(`{${heatingDamage.formula}, ${willpowerRoll.formula}}`);
        await combinedRoll.evaluate({ async: true });

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: createHeatingFlavor(),
            rollMode: game.settings.get("core", "rollMode")
        });

        ui.notifications.info(`🔥 Chauffage intensifié ! Cible: ${targetDamage} dégâts, Aloha: ${actualAlohaDamage} dégâts. Volonté: ${willpowerSuccess ? 'Réussi' : 'Échoué'}`);
        return;
    }

    // ===== MODE INITIAL =====
    const { attackBonus, damageBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);
            return await portal.pick();
        } catch (e) {
            ui.notifications.error("Erreur lors du ciblage. Vérifiez que Portal est installé.");
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    // Get actor at target location
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                // Get token's grid position (top-left corner)
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Check if any grid square occupied by the token matches the target grid square
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        if (tokenSquareX === targetGridX && targetSquareY === targetGridY) {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection (original behavior)
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const tokenDistance = Math.sqrt(
                    Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2)
                );
                return tokenDistance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : 'position';

    // Check if target already has a heated grapple
    if (targetActor?.actor) {
        const existingGrapple = targetActor.actor.effects.find(e => e.name === SPELL_CONFIG.grappledEffect.name);
        if (existingGrapple) {
            ui.notifications.warn(`${targetName} est déjà attrapé par des mains chaudes !`);
            return;
        }
    }

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Cast animation sous le lanceur
        if (SPELL_CONFIG.animations.cast) {
            seq.effect()
                .file(SPELL_CONFIG.animations.cast)
                .atLocation(caster)
                .scale(0.7)
                .tint("#ff5722");
        }

        // Animation d'étreinte chauffée si on a une cible valide
        if (SPELL_CONFIG.animations.grappleHeat && targetActor?.token) {
            seq.effect()
                .file(SPELL_CONFIG.animations.grappleHeat)
                .attachTo(caster)
                .stretchTo(targetActor.token)
                .delay(500)
                .tint("#ff5722");
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== DAMAGE CALCULATION =====
    const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
    const physiqueBonus = Math.floor(characteristicInfo.final / SPELL_CONFIG.physiqueDivisor);
    const totalDamageBonus = physiqueBonus + (damageBonus || 0) + effectDamageBonus;

    const damageRoll = new Roll(`1d6 + @totalBonus`, { totalBonus: totalDamageBonus });
    await damageRoll.evaluate({ async: true });

    // ===== DETERMINE SUCCESS AND MANA COST =====
    // Assume success if attack hits (you may want to add additional logic here)
    const isSuccess = targetActor?.actor !== null; // Hit a valid target
    const actualManaCost = isSuccess ? SPELL_CONFIG.initialManaCostSuccess : SPELL_CONFIG.initialManaCostFail;

    // Apply mana cost reduction for Focus stance if applicable
    const finalManaCost = (currentStance === 'focus' && SPELL_CONFIG.isFocusable && !isSuccess) ?
        0 : actualManaCost;

    // ===== ADD ACTIVE EFFECTS =====
    if (isSuccess && targetActor?.actor) {
        try {
            // Effet sur la cible
            const targetEffectData = {
                name: SPELL_CONFIG.grappledEffect.name,
                icon: SPELL_CONFIG.grappledEffect.icon,
                description: SPELL_CONFIG.grappledEffect.description,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        grapplerCaster: caster.id, // ID du lanceur pour retrouver l'étreinte
                        grapplerTarget: targetActor.token.id, // ID de la cible
                        spellName: SPELL_CONFIG.name
                    }
                }
            };

            // Effet sur Aloha pour tracker l'état
            const selfEffectData = {
                name: SPELL_CONFIG.selfEffect.name,
                icon: SPELL_CONFIG.selfEffect.icon,
                description: `${SPELL_CONFIG.selfEffect.description} (${targetName})`,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        grappledTarget: targetActor.token.id,
                        spellName: SPELL_CONFIG.name
                    },
                    statuscounter: { value: 0 } // Compteur pour les chauffages
                }
            };

            // Use GM delegation for effect application if available
            if (globalThis.gmSocket) {
                console.log(`[DEBUG] Applying grapple effects via GM socket`);
                await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.actor.id, targetEffectData);
                await globalThis.gmSocket.executeAsGM("applyEffectToActor", actor.id, selfEffectData);
            } else {
                // Fallback: direct application if GM socket not available
                console.log(`[DEBUG] GM Socket not available, applying effects directly`);
                await targetActor.actor.createEmbeddedDocuments("ActiveEffect", [targetEffectData]);
                await actor.createEmbeddedDocuments("ActiveEffect", [selfEffectData]);
            }

            console.log(`[DEBUG] Successfully applied grapple effects`);
        } catch (error) {
            console.error("Error applying grapple effects:", error);
            ui.notifications.warn("Impossible d'appliquer l'effet d'étreinte chauffée !");
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const actualManaDisplay = finalManaCost === 0 ? 'GRATUIT (Position Focus - Échec)' : `${finalManaCost} mana`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de Physique: +${characteristicInfo.effectBonus}</div>
            </div>` : '';

        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
            </div>
        `;

        const resultDisplay = isSuccess ? `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #ff5722; margin-bottom: 6px;"><strong>🔥 Contact Cuisant Réussi</strong></div>
                <div style="font-size: 1.2em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${damageRoll.total}</div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 0.8em; color: #666;">1d6 + Physique/2 (${physiqueBonus}) + bonus</div>
                <div style="font-size: 0.8em; color: #ff9800; margin-top: 4px;">Etreinte Chauffée appliquée - Relancez pour chauffer !</div>
            </div>
        ` : `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffcdd2; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #d32f2f; margin-bottom: 6px;"><strong>🔥 Contact Cuisant Échoué</strong></div>
                <div style="font-size: 0.9em; color: #666;">Aucune cible attrapée</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #fff3e0, #ffebee); padding: 12px; border-radius: 8px; border: 2px solid #ff5722; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #ff5722;">🔥 ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Chef:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${resultDisplay}
            </div>
        `;
    }

    // Send combined roll to chat
    const combinedRoll = new Roll(`{${attackRoll.formula}, ${damageRoll.formula}}`);
    await combinedRoll.evaluate({ async: true });

    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createFlavor(),
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const successInfo = isSuccess ? `Étreint ${targetName} ! Dégâts: ${damageRoll.total}. Relancez pour chauffer !` : 'Échec - Aucune cible attrapée';

    ui.notifications.info(`🔥 ${SPELL_CONFIG.name} lancé !${stanceInfo} Attaque: ${attackRoll.total}. ${successInfo}`);

})();
