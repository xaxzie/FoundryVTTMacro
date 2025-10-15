/**
 * Aiguille Contrôlée - Yunyun
 *
 * Yunyun lance une aiguille de mana téléguidée avec une précision redoutable.
 * Sort de précision qui garantit des dégâts constants basés sur le Charisme.
 *
 * Caractéristiques :
 * - Caractéristique d'attaque : Charisme (+ effets actifs + bonus manuels)
 * - Dégâts : Toujours la moitié du Charisme de Yunyun (arrondi au supérieur)
 * - Coût : 2 mana (non focalisable)
 * - Niveau : 1
 * - Restriction : Yunyun ne peut pas aider d'allié ce tour
 *
 * Usage : Sélectionner le token de Yunyun, puis cibler.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Aiguille Contrôlée",
        description: "Aiguille de mana téléguidée à dégâts fixes",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        isDirect: true,
        spellLevel: 1,
        manaCost: 2,
        isFocusable: false,
        appliesFatigue: false,
        restriction: "Yunyun ne peut pas aider d'allié ce tour",
        animations: {
            projectile: "jb2a_patreon.energy_strands.range.standard.blue.04",
            impact: "animated-spell-effects-cartoon.energy.12",
            sound: null
        },
        targeting: {
            range: 200,
            color: "#ff6b35",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
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
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "charisme")
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
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
            return { base: 3, injuries: 0, effectBonus: 0, injuryAdjusted: 3, final: 3 };
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

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== SPELL CONFIRMATION DIALOG =====
    async function confirmSpellCast() {
        return new Promise((resolve) => {
            // Calcul des dégâts fixes basés sur le Charisme + bonus d'effets actifs
            const baseDamage = Math.ceil(characteristicInfo.final / 2);
            const activeEffectDamageBonus = getActiveEffectBonus(actor, "damage");
            const fixedDamage = baseDamage + activeEffectDamageBonus;

            const stanceDisplay = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            const dialogContent = `
                <div style="background: linear-gradient(135deg, #fff3e0, #ffcc80); padding: 15px; border-radius: 10px; border: 2px solid #ff6b35; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #e65100; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            🎯 ${SPELL_CONFIG.name} 🎯
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">${SPELL_CONFIG.description}</p>
                        <div style="background: rgba(255, 107, 53, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                            <strong>Attaque: ${SPELL_CONFIG.characteristicDisplay}</strong> ${characteristicInfo.final}${stanceDisplay}
                        </div>
                    </div>

                    <div style="background: rgba(255, 107, 53, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #ff6b35; margin-bottom: 15px;">
                        <h3 style="color: #e65100; margin: 0 0 10px 0; text-align: center;">Caractéristiques du Sort</h3>
                        <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                        <div><strong>Dégâts Fixes:</strong> ${fixedDamage} (${baseDamage} base + ${activeEffectDamageBonus} bonus)</div>
                        <div><strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana (non focalisable)</div>
                        <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                        <div style="color: #d32f2f; font-weight: bold; margin-top: 8px;">
                            <strong>⚠️ Restriction:</strong> ${SPELL_CONFIG.restriction}
                        </div>
                    </div>

                    <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <strong>Bonus d'Attaque:</strong>
                        <div style="margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                            <div><label for="attackBonus">Bonus d'Attaque:</label></div>
                            <div><input type="number" id="attackBonus" name="attackBonus" value="0" style="width: 60px;"></div>
                        </div>
                        <p style="font-size: 0.85em; color: #666; margin: 8px 0 0 0;">
                            Note: Les dégâts sont fixes mais bénéficient des bonus "damage" des effets actifs.
                        </p>
                    </div>
                </div>
            `;

            new Dialog({
                title: `${SPELL_CONFIG.name} - Confirmation`,
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-crosshairs"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({
                                confirmed: true,
                                attackBonus: attackBonus,
                                fixedDamage: fixedDamage,
                                baseDamage: baseDamage,
                                activeEffectDamageBonus: activeEffectDamageBonus
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
                    console.log(`[DEBUG] Spell confirmation dialog rendered for ${SPELL_CONFIG.name}`);
                }
            }).render(true);
        });
    }

    const spellConfirmation = await confirmSpellCast();
    if (!spellConfirmation.confirmed) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { attackBonus, fixedDamage, baseDamage, activeEffectDamageBonus } = spellConfirmation;

    // ===== TARGETING SYSTEM =====
    /**
     * Selects a target using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTarget() {
        ui.notifications.info(`🎯 Sélectionnez la cible pour ${SPELL_CONFIG.name}...`);

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
            // With grid - convert to grid coordinates and check
            const gridX = Math.floor(targetX / gridSize);
            const gridY = Math.floor(targetY / gridSize);

            // Convert back to pixel coordinates (center of grid square)
            const centerX = (gridX * gridSize) + (gridSize / 2);
            const centerY = (gridY * gridSize) + (gridSize / 2);

            console.log(`[DEBUG] Grid coordinates: (${gridX}, ${gridY}), Center: (${centerX}, ${centerY})`);

            // Check for tokens in this grid square
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
            // Without grid - direct pixel checking with tolerance
            const tolerance = gridSize / 4; // 25% tolerance

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

    const targetActor = getActorAtLocation(target.x, target.y);

    if (!targetActor) {
        ui.notifications.warn("⚠️ Aucune cible trouvée à cette position !");
        return;
    }

    const targetName = targetActor.name;

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        try {
            // Pas d'animation de cast, seulement projectile + impact
            const sequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animations.projectile)
                    .attachTo(caster)
                    .stretchTo(targetActor.token)
                    .scale(0.6)
                    .waitUntilFinished(-1500)

                .effect()
                    .file(SPELL_CONFIG.animations.impact)
                    .attachTo(targetActor.token)
                    .scale(0.3);

            await sequence.play();
        } catch (error) {
            console.error("[DEBUG] Animation error:", error);
        }
    }

    await playSpellAnimation();

    // ===== ATTACK ROLL =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus;
    const levelBonus = SPELL_CONFIG.spellLevel * 2;

    // Roll d'attaque uniquement (dégâts fixes)
    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus} + ${attackBonus}`);
    await attackRoll.evaluate({ async: true });

    // Build enhanced flavor for the final dice roll message
    function createChatFlavor() {
        const stanceNote = currentStance === 'offensif' ? ' <em>(Position Offensive)</em>' : '';

        return `
            <div style="background: linear-gradient(135deg, #fff3e0, #ffcc80); padding: 12px; border-radius: 8px; border: 2px solid #ff6b35; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #e65100;">🎯 Sort d'${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana
                    </div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>🎯 Aiguille Contrôlée${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                    <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS FIXES: ${fixedDamage}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${baseDamage} base + ${activeEffectDamageBonus} bonus damage)</div>
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>✨ Niveau:</strong> ${SPELL_CONFIG.spellLevel} (+${levelBonus} bonus hit)</div>
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #ffebee; border-radius: 4px; border: 1px solid #f44336;">
                    <div style="font-size: 0.85em; color: #d32f2f; font-weight: bold;">⚠️ ${SPELL_CONFIG.restriction}</div>
                </div>
            </div>
        `;
    }

    const enhancedFlavor = createChatFlavor();

    // Send the attack roll message
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}, Dégâts fixes: ${fixedDamage} - ${SPELL_CONFIG.manaCost} mana`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Caster: ${actor.name}, Target: ${targetName}, Attack: ${attackRoll.total}, Fixed Damage: ${fixedDamage}`);

})();
