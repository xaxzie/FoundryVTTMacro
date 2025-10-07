/**
 * Livre Simple - Urgen
 *
 * Sort simple de niveau 0.5 - Urgen lance un petit livre avec dextérité.
 * Un sort basique et économique pour les situations où la précision compte plus que la puissance.
 *
 * - Caractéristique d'attaque : Dextérité (+ effets actifs + bonus manuels)
 * - Dégâts : 1d2 + Dextérité/2 + bonus manuels + bonus d'effets actifs
 * - Coût : 0 mana (toujours gratuit)
 * - Niveau de sort : 0.5
 * - Sort direct : Pas d'effet persistant
 *
 * Usage : Sélectionner le token de Urgen, lancer la macro et choisir la cible.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Livre Simple",
        description: "Petit livre lancé avec précision et agilité",
        manaCost: 0,
        spellLevel: 0.5,
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        damageFormula: "1d2",
        isDirect: true,
        isFocusable: false, // Toujours gratuit
        animations: {
            cast: "jb2a.condition.boon.01.007.blue",
            projectile: "jb2a.throwable.launch.dagger.01.white",
            impact: "jb2a.impact.ground_crack.blue.01",
            sound: null
        },
        targeting: {
            range: 120,
            color: "#87ceeb",
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Urgen !");
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
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "dexterite")
     * @returns {number} Total bonus from all matching active effects
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
        // Get base characteristic from character sheet
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
        }
        const baseValue = charAttribute.value || 3;

        // Detect injury stacks and reduce characteristic accordingly
        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        // Get active effect bonuses for the characteristic
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        console.log(`[DEBUG] Base ${characteristic}: ${baseValue}, Injury stacks: ${injuryStacks}, Effect bonus: ${effectBonus}`);

        // Calculate final value: base - injuries + effects, minimum of 1
        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${characteristic} reduced from ${baseValue} to ${injuryAdjusted} due to ${injuryStacks} injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[DEBUG] ${characteristic} adjusted by ${effectBonus} from active effects (final: ${finalValue})`);
        }

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        // Calcul des bonus d'effets actifs
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const damageBonus = getActiveEffectBonus(actor, "damage");

        const stanceName = currentStance ?
            (currentStance === 'focus' ? 'Focus' :
                currentStance === 'offensif' ? 'Offensif' :
                    currentStance === 'defensif' ? 'Défensif' : 'Aucune') : 'Aucune';

        const injuryDisplay = characteristicInfo.injuries > 0 ?
            `<span style="color: #d32f2f;">-${characteristicInfo.injuries} (blessures)</span>` :
            '<span style="color: #2e7d32;">Aucune</span>';

        return new Promise((resolve) => {
            new Dialog({
                title: `🎯 Configuration - ${SPELL_CONFIG.name}`,
                content: `
                    <div style="background: linear-gradient(135deg, #4fc3f7, #29b6f6); padding: 20px; border-radius: 12px; color: white; font-family: 'Roboto', sans-serif;">
                        <h2 style="text-align: center; margin-top: 0; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">📖 ${SPELL_CONFIG.name}</h2>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #e1f5fe;">🎭 État du Lanceur</h3>
                            <p><strong>Lanceur:</strong> ${actor.name}</p>
                            <p><strong>Stance:</strong> ${stanceName}</p>
                            <p><strong>Blessures:</strong> ${injuryDisplay}</p>
                            <p><strong>Coût Mana:</strong> ${SPELL_CONFIG.manaCost} (toujours gratuit)</p>
                        </div>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #e1f5fe;">⚔️ Statistiques d'Attaque</h3>
                            <p><strong>${SPELL_CONFIG.characteristicDisplay}:</strong> ${characteristicInfo.base} ${characteristicInfo.injuries > 0 ? `→ ${characteristicInfo.final}` : ''}</p>
                            <p><strong>Bonus d'Effets Actifs (${SPELL_CONFIG.characteristicDisplay}):</strong> +${characteristicBonus}</p>
                            <p><strong>Bonus d'Effets Actifs (Dégâts):</strong> +${damageBonus}</p>
                            <p><strong>Niveau de Sort:</strong> ${SPELL_CONFIG.spellLevel} (+${SPELL_CONFIG.spellLevel} à l'attaque)</p>
                        </div>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #e1f5fe;">🎯 Bonus Manuels</h3>
                            <p><label><strong>Bonus d'Attaque Supplémentaire:</strong></label></p>
                            <input type="number" id="attackBonus" value="0" min="-10" max="20"
                                   style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none;"/>
                            <p><label><strong>Bonus de Dégâts Supplémentaire:</strong></label></p>
                            <input type="number" id="damageBonus" value="0" min="-10" max="20"
                                   style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none;"/>
                        </div>

                        <div style="background: rgba(76,175,80,0.2); padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px solid #4caf50;">
                            <h3 style="margin-top: 0; color: #c8e6c9;">✨ Sort Simple</h3>
                            <p style="font-size: 0.9em; margin-top: 10px; color: #e8f5e8;">
                                📌 <strong>Niveau:</strong> 0.5 (Sort mineur)<br>
                                💰 <strong>Coût:</strong> Toujours gratuit<br>
                                🎯 <strong>Dégâts:</strong> 1d2 + Dextérité÷2 (${Math.floor(characteristicInfo.final / 2)})<br>
                                ⚡ <strong>Type:</strong> Attaque directe, pas d'effet persistant
                            </p>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find("#attackBonus").val()) || 0;
                            const damageBonus = parseInt(html.find("#damageBonus").val()) || 0;
                            resolve({ attackBonus, damageBonus });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                close: () => resolve(null)
            }, {
                width: 520,
                height: "auto"
            }).render(true);
        });
    }

    const spellConfig = await showSpellConfigDialog();
    if (!spellConfig) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { attackBonus, damageBonus } = spellConfig;

    // ===== TARGETING SYSTEM =====
    /**
     * Selects a target using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTarget() {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== ACTOR DETECTION =====
    /**
     * Finds an actor at a specific location using grid-aware detection and visibility filtering
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @returns {Object|null} Actor info object or null if none found
     */
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(targetX / gridSize);
            const targetGridY = Math.floor(targetY / gridSize);

            console.log(`[DEBUG] Grid detection - Target grid coords: (${targetGridX}, ${targetGridY})`);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Visibility filtering
                if (!(token.isVisible || token.isOwner || game.user.isGM)) {
                    return false;
                }

                // Convert token position to grid coordinates
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                // Check if target grid position is within token's grid area
                return targetGridX >= tokenGridX &&
                    targetGridX < tokenGridX + tokenWidth &&
                    targetGridY >= tokenGridY &&
                    targetGridY < tokenGridY + tokenHeight;
            });

            if (tokensAtLocation.length === 0) {
                console.log(`[DEBUG] No tokens found at grid position (${targetGridX}, ${targetGridY})`);
                return null;
            }

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection (original behavior with visibility filtering)
            const tolerance = gridSize;
            console.log(`[DEBUG] Circular detection - Tolerance: ${tolerance}`);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Visibility filtering
                if (!(token.isVisible || token.isOwner || game.user.isGM)) {
                    return false;
                }

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const distance = Math.sqrt(
                    Math.pow(targetX - tokenCenterX, 2) +
                    Math.pow(targetY - tokenCenterY, 2)
                );

                return distance <= tolerance;
            });

            if (tokensAtLocation.length === 0) {
                console.log(`[DEBUG] No tokens found within tolerance ${tolerance} of position (${targetX}, ${targetY})`);
                return null;
            }

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : "position vide";

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");

        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const dexterityDamageBonus = Math.floor(totalCharacteristic / 2);
        const totalDamageBonus = damageBonus + effectDamageBonus + dexterityDamageBonus;

        let damageFormula = SPELL_CONFIG.damageFormula;
        if (totalDamageBonus > 0) {
            damageFormula += ` + ${totalDamageBonus}`;
        }

        // Stance offensive : maximiser les dégâts
        if (currentStance === 'offensif') {
            // 1d2 devient 2
            const maxDamage = 2 + totalDamageBonus;
            return {
                formula: `2 + ${totalDamageBonus}`,
                total: maxDamage,
                isMaximized: true
            };
        } else {
            const roll = new Roll(damageFormula);
            await roll.evaluate({ async: true });
            return {
                formula: damageFormula,
                total: roll.total,
                isMaximized: false,
                roll: roll
            };
        }
    }

    const damageResult = await calculateDamage();

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Animation de cast sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.4)
            .belowTokens(true)

        // Projectile du livre vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.projectile)
            .attachTo(caster)
            .stretchTo(target)
            .scale(0.5)
            .waitUntilFinished(-500);

        // Impact sur la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.impact)
            .atLocation({ x: target.x, y: target.y })
            .scale(0.6)

        if (SPELL_CONFIG.animations.sound) {
            sequence.sound().file(SPELL_CONFIG.animations.sound);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus + attackBonus;
    const levelBonus = SPELL_CONFIG.spellLevel; // 0.5 level gives +0.5 to attack

    // Build combined roll formula: attack roll + damage roll
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll to the combined formula (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const dexterityDamageBonus = Math.floor(totalCharacteristic / 2);
        const totalDamageBonus = damageBonus + effectDamageBonus + dexterityDamageBonus;
        combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results from the combined roll
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        // Extract damage result from dice roll
        const damageRollResult = combinedRoll.terms[0].results[1];
        // Build the damage formula for display
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const dexterityDamageBonus = Math.floor(totalCharacteristic / 2);
        const totalDamageBonus = damageBonus + effectDamageBonus + dexterityDamageBonus;
        const displayFormula = `${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`;

        finalDamageResult = {
            total: damageRollResult.result,
            formula: displayFormula,
            result: damageRollResult.result
        };
    }

    // Build enhanced flavor for the final dice roll message
    const stanceName = currentStance ?
        (currentStance === 'focus' ? 'Focus' :
            currentStance === 'offensif' ? 'Offensif' :
                currentStance === 'defensif' ? 'Défensif' : 'Aucune') : 'Aucune';

    let enhancedFlavor = `
        <div style="background: linear-gradient(135deg, #4fc3f7, #29b6f6); padding: 15px; border-radius: 10px; color: white; border: 2px solid #03a9f4;">
            <h3 style="margin-top: 0; text-align: center; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">📖 ${SPELL_CONFIG.name}</h3>

            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>🧙 Lanceur:</strong> ${actor.name}</p>
                <p style="margin: 5px 0;"><strong>🎯 Cible:</strong> ${targetName}</p>
                <p style="margin: 5px 0;"><strong>🎭 Stance:</strong> ${stanceName} : ${SPELL_CONFIG.manaCost} mana</p>
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>⚔️ Attaque (${SPELL_CONFIG.characteristicDisplay}):</strong> ${totalAttackDice}d7 + ${levelBonus}</p>`;

    if (targetActor) {
        enhancedFlavor += `<p style="margin: 5px 0; font-style: italic;">🛡️ Défense requise : Agilité du défenseur</p>`;
    }

    enhancedFlavor += `</div>

            <div style="background: rgba(76,175,80,0.3); padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #4caf50;">`;

    if (damageResult.isMaximized) {
        enhancedFlavor += `<p style="margin: 5px 0;"><strong>💥 Dégâts (Stance Offensive - Maximisés):</strong> ${finalDamageResult.total}</p>
                          <p style="margin: 5px 0; font-style: italic;">Formule: ${finalDamageResult.formula}</p>`;
    } else {
        enhancedFlavor += `<p style="margin: 5px 0;"><strong>💥 Dégâts (si touche):</strong> ${finalDamageResult.total}</p>
                          <p style="margin: 5px 0; font-style: italic;">Formule: ${finalDamageResult.formula}</p>`;
    }

    enhancedFlavor += `</div>

            <div style="background: rgba(76,175,80,0.2); padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #4caf50;">
                <p style="margin: 5px 0;"><strong>✨ Sort Simple:</strong> Niveau 0.5 - Toujours gratuit</p>
                <p style="margin: 5px 0; font-size: 0.9em;">🎯 Attaque de précision avec dextérité</p>
            </div>
        </div>`;

    // Send the unified dice roll message
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total} - GRATUIT`);

    console.log(`[DEBUG] Livre Simple cast complete - Caster: ${actor.name}, Target: ${targetName}, Damage: ${finalDamageResult.total}, Cost: 0 mana`);

})();
