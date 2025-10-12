/**
 * Nova de Givre - Ora
 *
 * Ora canalise sa magie de glace pour créer une explosion radiale de givre
 * qui s'étend autour d'elle, immobilisant temporairement Ora mais infligeant
 * des dégâts massifs dans une zone croissante selon la durée de canalisation.
 *
 * - Caractéristique d'attaque : Esprit (sans bonus d'effets actifs)
 * - Dégâts : 2d8 + ((Esprit/2) * Tours d'immobilité)
 * - Coût : 2 * Tours d'immobilité mana (focusable)
 * - Niveau de sort : 2
 * - Zone d'effet : Rayon = Tours d'immobilité (1-3 cases)
 * - Contrainte : Ora reste immobilisée pendant X tours
 * - Limitation : Aucun bonus d'effet actif (attaque ou dégâts)
 *
 * Usage : Sélectionner le token d'Ora, choisir la durée de canalisation (1-3 tours).
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Nova de Givre",
        description: "Explosion radiale de givre centrée sur Ora",
        baseMana: 2, // Multiplied by immobility turns
        spellLevel: 2,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        damageFormula: "2d8",
        isDirect: true,
        isFocusable: true,
        minImmobilityTurns: 1,
        maxImmobilityTurns: 3,
        noEffectBonuses: true, // Ne bénéficie pas des bonus d'effets actifs
        animations: {
            nova: "jb2a_patreon.ice_spikes.radial.burst.white",
            sound: null
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
     * Obtient et calcule la valeur finale de la caractéristique avec injuries (sans bonus d'effets)
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

        console.log(`[DEBUG] Base ${characteristic}: ${baseValue}, Injury stacks: ${injuryStacks}`);

        // Calculate final value: base - injuries, minimum of 1 (NO effect bonuses for this spell)
        const finalValue = Math.max(1, baseValue - injuryStacks);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${characteristic} reduced from ${baseValue} to ${finalValue} due to ${injuryStacks} injuries`);
        }

        return {
            base: baseValue,
            injuries: injuryStacks,
            final: finalValue
        };
    }

    /**
     * Calcule le coût en mana basé sur la stance et les tours d'immobilité
     */
    function calculateManaCost(baseCost, immobilityTurns, stance, isFocusable) {
        const totalCost = baseCost * immobilityTurns;
        if (isFocusable && stance === 'focus') {
            return 0; // Gratuit en focus
        }
        return totalCost;
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        return new Promise((resolve) => {
            new Dialog({
                title: `❄️ ${SPELL_CONFIG.name}`,
                content: `
                    <div style="padding: 15px; background: #f0f8ff; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #1e3a8a;">❄️ ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Position:</strong> ${currentStance || 'Aucune'} ${SPELL_CONFIG.isFocusable ? '(focalisable)' : ''}</p>
                        </div>

                        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 4px; border: 2px solid #3b82f6;">
                            <h4 style="margin-top: 0; color: #1e40af;">⏱️ Durée de Canalisation</h4>
                            <div style="margin: 15px 0; text-align: center;">
                                <label style="font-size: 1.1em; font-weight: bold; color: #374151;">Tours d'Immobilité d'Ora:</label>
                                <select id="immobilityTurns" style="width: 80px; padding: 6px; margin-left: 10px; border: 2px solid #3b82f6; border-radius: 4px; font-size: 1.1em;">
                                    <option value="1">1 tour</option>
                                    <option value="2">2 tours</option>
                                    <option value="3">3 tours</option>
                                </select>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #ecfdf5; border-radius: 4px; border: 1px solid #10b981;">
                            <h4 style="margin-top: 0; color: #047857;">📊 Calculs Dynamiques</h4>
                            <div id="calculations" style="font-family: monospace; font-size: 0.9em; color: #374151;">
                                <!-- Will be updated by JavaScript -->
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fef3c7; border-radius: 4px; border: 1px solid #f59e0b;">
                            <p style="font-size: 0.9em; margin: 0; color: #92400e;">
                                <strong>⚠️ Limitations:</strong><br>
                                • Ora sera immobilisée pendant la durée choisie<br>
                                • Aucun bonus d'effet actif ne s'applique<br>
                                • Zone d'effet = Tours d'immobilité en cases de rayon
                            </p>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-snowflake"></i>',
                        label: "Canaliser Nova",
                        callback: (html) => {
                            const immobilityTurns = parseInt(html.find("#immobilityTurns").val()) || 1;
                            resolve({ immobilityTurns });
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
                    // Function to update calculations display
                    function updateCalculations() {
                        const turns = parseInt(html.find("#immobilityTurns").val()) || 1;
                        const manaCost = calculateManaCost(SPELL_CONFIG.baseMana, turns, currentStance, SPELL_CONFIG.isFocusable);
                        const manaCostDisplay = manaCost === 0 ? 'GRATUIT (Focus)' : `${manaCost} mana`;
                        const damageBonus = Math.floor(characteristicInfo.final / 2) * turns;

                        const calcHtml = `
                            <strong>Coût:</strong> ${SPELL_CONFIG.baseMana} × ${turns} = ${manaCostDisplay}<br>
                            <strong>Zone:</strong> ${turns} case${turns > 1 ? 's' : ''} de rayon<br>
                            <strong>Dégâts:</strong> ${SPELL_CONFIG.damageFormula} + ${damageBonus}<br>
                            <strong>Formule:</strong> 2d8 + ((${characteristicInfo.final}/2) × ${turns})
                        `;
                        html.find("#calculations").html(calcHtml);
                    }

                    // Initial calculation
                    updateCalculations();

                    // Update on change
                    html.find("#immobilityTurns").change(updateCalculations);
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

    const { immobilityTurns } = spellConfig;
    const actualManaCost = calculateManaCost(SPELL_CONFIG.baseMana, immobilityTurns, currentStance, SPELL_CONFIG.isFocusable);
    const areaRadius = immobilityTurns; // Zone = tours d'immobilité

    // ===== AREA TARGET DETECTION =====
    /**
     * Finds targets in the spell area using grid-aware detection
     * @param {Token} centerToken - Center token (Ora)
     * @param {number} radius - Radius in grid squares
     * @returns {Array} Array of target objects
     */
    function findTargetsInArea(centerToken, radius) {
        const targets = [];
        const gridSize = canvas.grid.size;

        // Convert center token position to grid coordinates
        const centerGridX = Math.floor(centerToken.x / gridSize);
        const centerGridY = Math.floor(centerToken.y / gridSize);

        console.log(`[DEBUG] Searching for targets in ${radius}-square radius around Ora at grid (${centerGridX}, ${centerGridY})`);

        for (const token of canvas.tokens.placeables) {
            // Visibility filtering
            if (!(token.isVisible || token.isOwner || game.user.isGM)) {
                continue;
            }

            // Skip the caster (Ora)
            if (token === centerToken) {
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

                    // Use radius + 0.5 for slightly extended range
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

    const areaTargets = findTargetsInArea(caster, areaRadius);

    console.log(`[DEBUG] Area targets found: ${areaTargets.length}`);
    areaTargets.forEach((target, index) => {
        console.log(`[DEBUG] Target ${index + 1}: ${target.name}`);
    });

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        // Nova de Givre ne bénéficie d'aucun bonus d'effet actif
        const spiritBonus = Math.floor(characteristicInfo.final / 2) * immobilityTurns;

        let damageFormula = `${SPELL_CONFIG.damageFormula} + ${spiritBonus}`;

        // Stance offensive : maximiser les dégâts
        if (currentStance === 'offensif') {
            // 2d8 devient 16
            const maxDamage = 16 + spiritBonus;
            return {
                formula: `16 + ${spiritBonus}`,
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

        // Nova de givre centrée sur Ora
        sequence.effect()
            .file(SPELL_CONFIG.animations.nova)
            .attachTo(caster)
            .scale(areaRadius * 0.5) // Scale based on area radius
            .duration(2000)
            .belowTokens(false);

        if (SPELL_CONFIG.animations.sound) {
            sequence.sound().file(SPELL_CONFIG.animations.sound);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    // Nova de Givre ne fait pas de jet d'attaque, juste les dégâts
    // Mais nous garderons la structure pour la cohérence

    const totalAttackDice = characteristicInfo.final; // Pas de bonus d'effets
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula: attack roll + damage roll
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll to the combined formula (only if not maximized)
    if (currentStance !== 'offensif') {
        const spiritBonus = Math.floor(characteristicInfo.final / 2) * immobilityTurns;
        combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${spiritBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results from the combined roll
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        // Extract damage result from dice roll
        const damageRollResult = combinedRoll.terms[0].results[1];
        const spiritBonus = Math.floor(characteristicInfo.final / 2) * immobilityTurns;
        const displayFormula = `${SPELL_CONFIG.damageFormula} + ${spiritBonus}`;

        finalDamageResult = {
            total: damageRollResult.result,
            formula: displayFormula,
            result: damageRollResult.result
        };
    }

    // Build enhanced flavor for the final dice roll message
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? 'GRATUIT (Focus)' : `${actualManaCost} mana`;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #eff6ff; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #1d4ed8; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const targetNames = areaTargets.length > 0 ? areaTargets.map(t => t.name).join(', ') : 'Aucune cible';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f0f9ff; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #0f172a; margin-bottom: 6px;"><strong>❄️ ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Immobilité:</strong> ${immobilityTurns} tour${immobilityTurns > 1 ? 's' : ''} | <strong>Zone:</strong> ${areaRadius} case${areaRadius > 1 ? 's' : ''}</div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cibles:</strong> ${targetNames}</div>
                <div style="font-size: 1.4em; color: #0ea5e9; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(2d8 + ((Esprit/2) × ${immobilityTurns}))</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 12px; border-radius: 8px; border: 2px solid #0ea5e9; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #0f172a;">❄️ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${attackDisplay}
                ${damageDisplay}
                <div style="text-align: center; margin-top: 8px; padding: 8px; background: #fef3c7; border-radius: 4px; border: 1px solid #f59e0b;">
                    <div style="font-size: 0.9em; color: #92400e;"><strong>⚠️ Ora immobilisée pendant ${immobilityTurns} tour${immobilityTurns > 1 ? 's' : ''} !</strong></div>
                </div>
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
    const manaCostInfo = actualManaCost === 0 ? ' - GRATUIT (Focus)' : ` - ${actualManaCost} mana`;
    const targetCount = areaTargets.length;

    ui.notifications.info(`${SPELL_CONFIG.name} canalisé !${stanceInfo} ${targetCount} cible${targetCount > 1 ? 's' : ''} dans ${areaRadius} case${areaRadius > 1 ? 's' : ''} de rayon. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${manaCostInfo}. Ora immobilisée ${immobilityTurns} tour${immobilityTurns > 1 ? 's' : ''} !`);

    console.log(`[DEBUG] Nova de Givre cast complete - Caster: ${actor.name}, Immobility: ${immobilityTurns} turns, Targets: ${targetCount}, Damage: ${finalDamageResult.total}`);

})();
