/**
 * Tempête Littéraire - Urgen
 *
 * Urgen lance un livre magique qui explose en une tempête de pages et de mots
 * dans une zone de 2 cases de rayon, infligeant des dégâts à tous les ennemis.
 *
 * - Caractéristique d'attaque : Esprit (+ effets actifs + bonus manuels)
 * - Dégâts : 1d6 + Esprit + bonus manuels + bonus d'effets actifs
 * - Coût : 6 mana (demi-focalisable : 3 mana en Focus)
 * - Niveau de sort : 2
 * - Zone d'effet : Cercle de 2 cases de rayon
 * - Effet spécial : L'esquive ne permet d'esquiver que la moitié des dégâts
 *
 * Usage : Sélectionner le token de Urgen, lancer la macro et choisir le point central.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Tempête Littéraire",
        description: "Livre magique explosant en tempête de pages (2 cases de rayon)",
        manaCost: 6,
        spellLevel: 2,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        damageFormula: "1d6",
        isDirect: true,
        isFocusable: false, // Demi-focalisable (not fully focusable)
        halfDamageOnDodge: true, // Special mechanic: dodge only reduces damage by half
        areaRadius: 2, // 2 cases de rayon
        maxRange: 400,
        animations: {
            cast: "jb2a.cast_generic.03.blue.0",
            projectile: "jb2a.throwable.launch.cannon_ball.01.black",
            area: "jb2a.whirlwind.bluegrey",
            pages: "animated-spell-effects.magic.shockwave.circle.08",
            sound: null
        },
        targeting: {
            range: 400,
            color: "#9932cc",
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
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
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "esprit")
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

    /**
     * Calcule le coût en mana basé sur la stance (demi-focalisable)
     */
    function calculateManaCost(baseCost, stance, isFocusable) {
        // Demi-focalisable: half cost in focus stance, not free
        if (stance === 'focus') {
            return Math.floor(baseCost / 2);
        }
        return baseCost;
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        // Calcul des bonus d'effets actifs
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const damageBonus = getActiveEffectBonus(actor, "damage");



        return new Promise((resolve) => {
            new Dialog({
                title: `�️ ${SPELL_CONFIG.name}`,
                content: `
                    <div style="padding: 15px; background: #f9f9f9; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #333;">🌪️ ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Coût:</strong> ${actualManaCost} mana (${currentStance || 'Aucune'} ${SPELL_CONFIG.isFocusable ? '- demi-focalisable' : ''})</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Zone:</strong> Rayon ${SPELL_CONFIG.areaRadius} cases</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">⚔️ Configuration</h4>
                            <div style="margin: 10px 0;">
                                <label><strong>Bonus d'Attaque:</strong></label>
                                <input type="number" id="attackBonus" value="0" min="-10" max="20"
                                       style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ccc; border-radius: 3px;"/>
                            </div>
                            <div style="margin: 10px 0;">
                                <label><strong>Bonus de Dégâts:</strong></label>
                                <input type="number" id="damageBonus" value="0" min="-10" max="20"
                                       style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ccc; border-radius: 3px;"/>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 4px; border: 1px solid #ff9800;">
                            <p style="font-size: 0.9em; margin: 0; color: #e65100;">
                                <strong>⚠️ Zone d'effet:</strong> ${SPELL_CONFIG.damageFormula} + Esprit (${characteristicInfo.final})<br>
                                L'esquive ne réduit les dégâts que de moitié
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

    // ===== AREA TARGET DETECTION =====
    /**
     * Finds targets in the spell area using grid-aware detection
     * @param {number} centerX - Center X coordinate
     * @param {number} centerY - Center Y coordinate
     * @param {number} radius - Radius in grid squares
     * @returns {Array} Array of target objects
     */
    function findTargetsInArea(centerX, centerY, radius) {
        const targets = [];
        const gridSize = canvas.grid.size;

        // Convert center point to grid coordinates
        const centerGridX = Math.floor(centerX / gridSize);
        const centerGridY = Math.floor(centerY / gridSize);

        console.log(`[DEBUG] Searching for targets in ${radius}-square radius around grid (${centerGridX}, ${centerGridY})`);

        for (const token of canvas.tokens.placeables) {
            // Visibility filtering
            if (!(token.isVisible || token.isOwner || game.user.isGM)) {
                continue;
            }

            // Skip the caster
            if (token === caster) {
                continue;
            }

            // Convert token position to grid coordinates
            const tokenGridX = Math.floor(token.x / gridSize);
            const tokenGridY = Math.floor(token.y / gridSize);
            const tokenWidth = token.document.width;
            const tokenHeight = token.document.height;

            // Check if any part of the token overlaps with the spell area
            let tokenInRange = false;

            for (let tx = tokenGridX; tx < tokenGridX + tokenWidth; tx++) {
                for (let ty = tokenGridY; ty < tokenGridY + tokenHeight; ty++) {
                    const distance = Math.sqrt(
                        Math.pow(tx - centerGridX, 2) +
                        Math.pow(ty - centerGridY, 2)
                    );

                    // Use radius + 0.5 for slightly extended range like empalement
                    if (distance <= radius + 0.5) {
                        tokenInRange = true;
                        break;
                    }
                }
                if (tokenInRange) break;
            }

            if (tokenInRange) {
                const targetActor = token.actor;
                if (targetActor) {
                    const distance = Math.sqrt(
                        Math.pow(tokenGridX + tokenWidth / 2 - centerGridX, 2) +
                        Math.pow(tokenGridY + tokenHeight / 2 - centerGridY, 2)
                    );

                    targets.push({
                        name: token.name,
                        token: token,
                        actor: targetActor,
                        distance: distance
                    });

                    console.log(`[DEBUG] Target found: ${token.name} at distance ${distance.toFixed(2)}`);
                }
            }
        }

        return targets;
    }

    const areaTargets = findTargetsInArea(target.x, target.y, SPELL_CONFIG.areaRadius);

    console.log(`[DEBUG] Area targets found: ${areaTargets.length}`);
    areaTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name}`);
    });

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");

        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;

        let damageFormula = SPELL_CONFIG.damageFormula;
        if (totalDamageBonus > 0) {
            damageFormula += ` + ${totalDamageBonus}`;
        }

        // Stance offensive : maximiser les dégâts
        if (currentStance === 'offensif') {
            // 1d6 devient 6
            const maxDamage = 6 + totalDamageBonus;
            return {
                formula: `6 + ${totalDamageBonus}`,
                total: maxDamage,
                halfDamage: Math.floor(maxDamage / 2),
                isMaximized: true
            };
        } else {
            const roll = new Roll(damageFormula);
            await roll.evaluate({ async: true });
            return {
                formula: damageFormula,
                total: roll.total,
                halfDamage: Math.floor(roll.total / 2),
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
            .scale(0.6)
            .belowTokens(true);

        // Projectile du livre vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.projectile)
            .attachTo(caster)
            .stretchTo(target)
            .scale(0.8)
            .delay(300)
            .waitUntilFinished(-100);


        // Zone d'effet au point d'impact
        sequence.effect()
            .file(SPELL_CONFIG.animations.area)
            .atLocation(target)
            .scale(SPELL_CONFIG.areaRadius * 0.4)
            .duration(3000)
            .belowTokens(true)
        // Effet de pages tourbillonnantes
        sequence.effect()
            .file(SPELL_CONFIG.animations.pages)
            .atLocation(target)
            .scale(SPELL_CONFIG.areaRadius * 0.4)
            .delay(200);

        if (SPELL_CONFIG.animations.sound) {
            sequence.sound().file(SPELL_CONFIG.animations.sound);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula: attack roll + damage roll
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll to the combined formula (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;
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
        const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;
        const displayFormula = `${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`;

        finalDamageResult = {
            total: damageRollResult.result,
            formula: displayFormula,
            result: damageRollResult.result,
            halfDamage: Math.floor(damageRollResult.result / 2)
        };
    }

    // Build enhanced flavor for the final dice roll message
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? 'GRATUIT (Focus)' : `${actualManaCost} mana`;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const targetNames = areaTargets.length > 0 ? areaTargets.map(t => t.name).join(', ') : 'Aucune cible';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>🌪️ ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Zone:</strong> Rayon ${SPELL_CONFIG.areaRadius} cases (${areaTargets.length} cible${areaTargets.length > 1 ? 's' : ''})</div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cibles:</strong> ${targetNames}</div>
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 1.2em; color: #ff9800; font-weight: bold;">🛡️ ESQUIVE: ${finalDamageResult.halfDamage} (moitié)</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay} + bonus)</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f5f5f5, #fff3e0); padding: 12px; border-radius: 8px; border: 2px solid #9932cc; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">🌪️ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${attackDisplay}
                ${damageDisplay}
            </div>
        `;
    }

    const enhancedFlavor = createChatFlavor();

    // Send the unified dice roll message
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const manaCostInfo = currentStance === 'focus' ? ` - ${actualManaCost} mana (Demi-focalisable)` : ` - ${actualManaCost} mana`;
    const targetCount = areaTargets.length;

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} ${targetCount} cible${targetCount > 1 ? 's' : ''} dans la zone. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${manaCostInfo}. Esquive = moitié des dégâts.`);

    console.log(`[DEBUG] Tempête Littéraire cast complete - Caster: ${actor.name}, Targets: ${targetCount}, Damage: ${finalDamageResult.total}, Half Damage: ${finalDamageResult.halfDamage}`);

})();
