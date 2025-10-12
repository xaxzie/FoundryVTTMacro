/**
 * Déchainement - Ora
 *
 * Ora déchaîne sa puissance magique sur une cible unique, infligeant des dégâts
 * massifs avec la possibilité d'intensifier l'attaque en ajoutant des dés supplémentaires.
 *
 * - Caractéristique d'attaque : Esprit (+ effets actifs)
 * - Dégâts : 3d6 + Esprit + dés manuels supplémentaires
 * - Coût : 6 mana (3 mana en Position Focus - demi-focalisable)
 * - Niveau de sort : 2
 * - Cible : Une cible unique
 * - Spécificité : Permet l'ajout de dés d6 supplémentaires (configurables)
 *
 * Usage : Sélectionner le token d'Ora, configurer les dés supplémentaires, puis cibler.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Déchainement",
        description: "Attaque magique intense avec dégâts configurables",
        manaCost: 6,
        spellLevel: 2,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        baseDamageFormula: "3d6",
        isDirect: true,
        isFocusable: true,
        isHalfFocusable: true, // Demi-focalisable : coût divisé par 2 au lieu de gratuit
        animations: {
            cast: "jb2a.cast_generic.water.02.blue.0",
            projectile: "jb2a.ray_of_frost.blue",
            impact: "jb2a.particles.002.001.complete.many.blue",
            sound: null
        },
        targeting: {
            range: 120,
            color: "#4169e1",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
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
    function calculateManaCost(baseCost, stance, isHalfFocusable) {
        if (isHalfFocusable && stance === 'focus') {
            return Math.floor(baseCost / 2);
        }
        return baseCost;
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isHalfFocusable);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        // Calcul des bonus d'effets actifs
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const damageBonus = getActiveEffectBonus(actor, "damage");

        return new Promise((resolve) => {
            new Dialog({
                title: `⚡ ${SPELL_CONFIG.name}`,
                content: `
                    <div style="padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #4169e1;">⚡ ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Coût:</strong> ${actualManaCost} mana (${currentStance || 'Aucune'} ${SPELL_CONFIG.isHalfFocusable ? '- demi-focalisable' : ''})</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Cible:</strong> Une cible unique</p>
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
                            <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border-radius: 4px; border: 1px solid #ffc107;">
                                <label style="font-weight: bold; color: #856404;"><strong>⚡ Dés Supplémentaires (d6):</strong></label>
                                <input type="number" id="extraDice" value="0" min="0" max="10"
                                       style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ffc107; border-radius: 3px;"/>
                                <small style="display: block; margin-top: 5px; color: #856404;">Ajoute des d6 supplémentaires aux dégâts (spécificité du Déchainement)</small>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 4px; border: 1px solid #ff9800;">
                            <div id="damagePreview" style="font-size: 0.9em; color: #e65100;">
                                <strong>⚡ Dégâts de base:</strong> ${SPELL_CONFIG.baseDamageFormula} + Esprit (${characteristicInfo.final})<br>
                                ${currentStance === 'offensif' ? '<strong>Position Offensive:</strong> Dégâts maximisés<br>' : ''}
                                <strong>Formule finale:</strong> <span id="finalFormula">${SPELL_CONFIG.baseDamageFormula} + ${characteristicInfo.final}</span>
                            </div>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-bolt"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find("#attackBonus").val()) || 0;
                            const damageBonus = parseInt(html.find("#damageBonus").val()) || 0;
                            const extraDice = parseInt(html.find("#extraDice").val()) || 0;
                            resolve({ attackBonus, damageBonus, extraDice });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                render: (html) => {
                    // Update damage preview when extra dice change
                    function updateDamagePreview() {
                        const extraDice = parseInt(html.find("#extraDice").val()) || 0;
                        const totalDice = 3 + extraDice;
                        const newFormula = extraDice > 0
                            ? `${totalDice}d6 + ${characteristicInfo.final}`
                            : `${SPELL_CONFIG.baseDamageFormula} + ${characteristicInfo.final}`;
                        html.find("#finalFormula").text(newFormula);
                    }

                    html.find("#extraDice").on("input", updateDamagePreview);
                },
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

    const { attackBonus, damageBonus, extraDice } = spellConfig;

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

    // ===== TARGET DETECTION =====
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;
        const tolerance = gridSize;

        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            // Visibility filtering
            const isOwner = token.actor?.isOwner;
            const isVisible = token.visible;
            const isGM = game.user.isGM;

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

        return { name: targetToken.name, token: targetToken, actor: targetActor };
    }

    const targetInfo = getActorAtLocation(target.x, target.y);

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");

        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;

        // Calculate total dice (base + extra)
        const baseDice = 3;
        const totalDice = baseDice + extraDice;
        let damageFormula = `${totalDice}d6`;

        if (totalDamageBonus > 0) {
            damageFormula += ` + ${totalDamageBonus}`;
        }

        // Stance offensive : maximiser les dégâts
        if (currentStance === 'offensif') {
            // Tous les d6 deviennent 6
            const maxDamage = (totalDice * 6) + totalDamageBonus;
            return {
                formula: `${totalDice * 6} + ${totalDamageBonus}`,
                total: maxDamage,
                isMaximized: true,
                totalDice: totalDice
            };
        } else {
            const roll = new Roll(damageFormula);
            await roll.evaluate({ async: true });
            return {
                formula: damageFormula,
                total: roll.total,
                isMaximized: false,
                roll: roll,
                totalDice: totalDice
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

        // Projectile vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.projectile)
            .attachTo(caster)
            .stretchTo(target)
            .scale(0.8)
            .delay(300)
            .waitUntilFinished(-100);

        // Impact sur la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.impact)
            .atLocation(target)
            .scale(0.7)
            .delay(100);

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
        const totalDice = 3 + extraDice;
        combinedRollParts.push(`${totalDice}d6 + ${totalDamageBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results from the combined roll
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        // Extract damage result from dice roll
        const damageRollResult = combinedRoll.terms[0].results[1];
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus + totalCharacteristic;
        const totalDice = 3 + extraDice;
        const displayFormula = `${totalDice}d6 + ${totalDamageBonus}`;

        finalDamageResult = {
            total: damageRollResult.result,
            formula: displayFormula,
            result: damageRollResult.result,
            totalDice: totalDice
        };
    }

    // Build enhanced flavor for the final dice roll message
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === SPELL_CONFIG.manaCost ? `${actualManaCost} mana` : `${actualManaCost} mana (Focus - coût réduit)`;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const targetName = targetInfo?.name || 'Cible';
        const extraDiceNote = extraDice > 0 ? ` (+${extraDice}d6 supplémentaires)` : '';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>⚡ ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${finalDamageResult.totalDice}d6 + ${SPELL_CONFIG.characteristicDisplay} + bonus${extraDiceNote})</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f0f8ff, #e8f4fd); padding: 12px; border-radius: 8px; border: 2px solid #4169e1; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">⚡ ${SPELL_CONFIG.name}</h3>
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
    const manaCostInfo = actualManaCost === SPELL_CONFIG.manaCost ? ` - ${actualManaCost} mana` : ` - ${actualManaCost} mana (Focus)`;
    const targetName = targetInfo?.name || 'Cible';
    const extraDiceInfo = extraDice > 0 ? ` (+${extraDice}d6)` : '';

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${extraDiceInfo}${manaCostInfo}`);

    console.log(`[DEBUG] Déchainement cast complete - Caster: ${actor.name}, Target: ${targetName}, Damage: ${finalDamageResult.total}, Extra Dice: ${extraDice}`);

})();
