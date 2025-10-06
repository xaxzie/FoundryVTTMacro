/**
 * Impulsion Divine - Léo
 *
 * Sort unique permettant une action supplémentaire avec un système de risque/récompense.
 *
 * - Coût : 0 mana (focalisable)
 * - Niveau : 2
 * - Effet : Permet une deuxième action si réussite d'un jet de Physique (difficulté 40 de base)
 * - Risque : En cas d'échec, pas de tour + blessure
 * - Option : Subir directement une blessure pour garantir l'action supplémentaire
 * - Difficulté progressive : +5 par utilisation précédente (effet "Impulsed")
 *
 * Effets appliqués :
 * - "Blessures" : Appliqué en cas d'échec ou choix volontaire
 * - "Impulsed" : Compteur d'utilisations (augmente la difficulté)
 *
 * Usage : Sélectionner le token de Léo et lancer la macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Impulsion Divine",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 0,
        spellLevel: 2,
        baseDifficulty: 40,
        difficultyIncrease: 5,
        isFocusable: true,

        animations: {
            success: {
                cast: "jb2a.divine_smite.caster.blueyellow",
                aura: "animated-spell-effects-cartoon.mix.electric ball.02",
                sound: null
            },
            failure: {
                cast: "jb2a.impact.ground_crack.orange.02",
                pain: "jb2a.extras.tmfx.border.circle.outpulse.02.normal",
                sound: null
            }
        },

        effects: {
            injuries: {
                name: "Blessures",
                icon: "icons/svg/blood.svg",
                description: "Blessures subies"
            },
            impulsed: {
                name: "Impulsed",
                icon: "icons/svg/clockwork.svg",
                description: "Utilisations d'Impulsion Divine (augmente la difficulté)"
            }
        }
    };

    // ===== GET CONFIG STATUS EFFECTS =====
    function getInjuryEffectFromConfig() {
        if (CONFIG.statusEffects && Array.isArray(CONFIG.statusEffects)) {
            for (const effect of CONFIG.statusEffects) {
                if (effect.id && (effect.name || effect.label)) {
                    const effectId = effect.id.toLowerCase();
                    if (['blessures', 'blessure', 'injury', 'injuries'].includes(effectId)) {
                        return effect;
                    }
                }
            }
        }
        // Fallback if not found in CONFIG
        return {
            id: "blessures",
            name: "Blessures",
            icon: "icons/svg/blood.svg"
        };
    }

    const INJURY_CONFIG = getInjuryEffectFromConfig();

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Veuillez d'abord sélectionner le token de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("⚠️ Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====
    function getCurrentStance(actor) {
        return actor.getFlag("world", "combatStance") || "normal";
    }

    function getCharacteristicValue(actor, characteristic) {
        // Use the standard character stats system (d7 system)
        const attr = actor.system?.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée sur la fiche de l'acteur.`);
            return null;
        }

        const base = attr.value || 3;

        // Detect injuries effect (compatible with HandleAllEffects.js approach)
        const injuryEffect = actor.effects.find(e =>
            e.statuses?.has(INJURY_CONFIG.id) ||
            e.name.toLowerCase() === (INJURY_CONFIG.name || INJURY_CONFIG.label).toLowerCase()
        );
        let injuryStacks = 0;
        if (injuryEffect?.flags?.statuscounter?.value) {
            injuryStacks = injuryEffect.flags.statuscounter.value;
        }

        const adjustedValue = Math.max(1, base - injuryStacks); // Minimum 1 like other systems

        return {
            base: base,
            injuries: injuryStacks,
            final: adjustedValue
        };
    }    /**
     * Adds or updates the injuries effect on an actor (like HandleAllEffects.js)
     * @param {Actor} actor - The actor to add injuries to
     * @returns {Promise<boolean>} Success status
     */
    async function addInjuries(actor) {
        try {
            // Find existing injury effect (compatible with HandleAllEffects.js approach)
            const existingEffect = actor.effects.find(e =>
                e.statuses?.has(INJURY_CONFIG.id) ||
                e.name.toLowerCase() === (INJURY_CONFIG.name || INJURY_CONFIG.label).toLowerCase()
            );

            if (existingEffect) {
                // Update existing effect
                const currentValue = existingEffect.flags?.statuscounter?.value || 1;
                await existingEffect.update({
                    "flags.statuscounter.value": currentValue + 1,
                    "flags.statuscounter.visible": true
                });

                console.log(`[DEBUG] Updated injuries effect: ${currentValue + 1} stacks`);
                return true;
            } else {
                // Create new effect using exact CONFIG object structure (like HandleAllEffects.js)
                const injuryEffect = {
                    ...INJURY_CONFIG, // Copy all CONFIG properties
                    origin: actor.uuid,
                    duration: { seconds: 86400 },
                    flags: {
                        statuscounter: {
                            value: 1,
                            visible: true
                        },
                        world: {
                            spellCaster: caster.id,
                            spellName: SPELL_CONFIG.name,
                            createdAt: Date.now()
                        }
                    },
                    statuses: [INJURY_CONFIG.id] // Add status ID to statuses array
                };

                await actor.createEmbeddedDocuments("ActiveEffect", [injuryEffect]);
                console.log("[DEBUG] Created new injuries effect with 1 stack");
                return true;
            }
        } catch (error) {
            console.error("[ERROR] Failed to add injuries:", error);
            return false;
        }
    }

    /**
     * Adds or updates the impulsed effect on an actor (only on success)
     */
    async function addImpulsedEffect(actor, onSuccess = true) {
        try {
            const existingEffect = actor.effects.find(e => e.name === SPELL_CONFIG.effects.impulsed.name);

            if (existingEffect) {
                // Only increment on success
                if (onSuccess) {
                    const currentValue = existingEffect.flags?.statuscounter?.value || 1;
                    await existingEffect.update({
                        "flags.statuscounter.value": currentValue + 1,
                        "flags.statuscounter.visible": true
                    });

                    console.log(`[DEBUG] Updated impulsed effect: ${currentValue + 1} stacks`);
                    return currentValue + 1;
                } else {
                    // Return current value without incrementing on failure
                    const currentValue = existingEffect.flags?.statuscounter?.value || 1;
                    console.log(`[DEBUG] Impulsed effect unchanged on failure: ${currentValue} stacks`);
                    return currentValue;
                }
            } else {
                // Create new effect (only on success)
                if (onSuccess) {
                    const impulsedEffect = {
                        name: SPELL_CONFIG.effects.impulsed.name,
                        icon: SPELL_CONFIG.effects.impulsed.icon,
                        description: SPELL_CONFIG.effects.impulsed.description,
                        duration: { seconds: 86400 },
                        flags: {
                            statuscounter: {
                                value: 1,
                                visible: true
                            },
                            world: {
                                spellCaster: caster.id,
                                spellName: SPELL_CONFIG.name,
                                createdAt: Date.now()
                            }
                        },
                        changes: [
                            {
                                key: "system.attributes.impulsionDifficulty",
                                mode: 2, // Add
                                value: SPELL_CONFIG.difficultyIncrease
                            }
                        ]
                    };

                    await actor.createEmbeddedDocuments("ActiveEffect", [impulsedEffect]);
                    console.log("[DEBUG] Created new impulsed effect with 1 stack");
                    return 1;
                } else {
                    console.log("[DEBUG] No impulsed effect created on failure");
                    return 0;
                }
            }
        } catch (error) {
            console.error("[ERROR] Failed to add impulsed effect:", error);
            return 0;
        }
    }

    // ===== GET CURRENT STATUS =====
    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return; // Exit if characteristic not found

    // Check for existing Impulsed effect and calculate difficulty
    const impulsedEffect = actor.effects.find(e => e.name === SPELL_CONFIG.effects.impulsed.name);
    let impulsedStacks = 0;
    if (impulsedEffect?.flags?.statuscounter?.value) {
        impulsedStacks = impulsedEffect.flags.statuscounter.value;
    }

    const currentDifficulty = SPELL_CONFIG.baseDifficulty + (impulsedStacks * SPELL_CONFIG.difficultyIncrease);

    // ===== CHOICE DIALOG =====
    async function showChoiceDialog() {
        const dialogContent = `
            <h3>⚡ Impulsion Divine</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` -${characteristicInfo.injuries} blessures = ${characteristicInfo.final}` : ''})</p>
            <p><strong>Difficulté actuelle:</strong> ${currentDifficulty} (base: ${SPELL_CONFIG.baseDifficulty} + utilisations: ${impulsedStacks}×${SPELL_CONFIG.difficultyIncrease})</p>

            <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 5px;">
                <h4>Options disponibles:</h4>

                <div style="margin: 10px 0;">
                    <input type="radio" id="attempt" name="choice" value="attempt" checked>
                    <label for="attempt">
                        <strong>🎲 Tenter le jet</strong><br>
                        <small>Jet de Physique vs ${currentDifficulty}. Réussite = action supplémentaire. Échec = pas de tour + blessure.</small>
                    </label>
                </div>

                <div style="margin: 10px 0;">
                    <input type="radio" id="sacrifice" name="choice" value="sacrifice">
                    <label for="sacrifice">
                        <strong>🩸 Sacrifice volontaire</strong><br>
                        <small>Subir une blessure directement pour garantir l'action supplémentaire.</small>
                    </label>
                </div>
            </div>

            <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                <strong>⚠️ Rappel:</strong> Chaque utilisation augmente la difficulté future de +${SPELL_CONFIG.difficultyIncrease}.
            </div>
        `;

        return new Promise(resolve => {
            new Dialog({
                title: "⚡ Impulsion Divine - Choix d'action",
                content: dialogContent,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-bolt"></i>',
                        label: "Exécuter",
                        callback: (html) => {
                            const choice = html.find('input[name="choice"]:checked').val();
                            resolve({ choice });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null)
            }).render(true);
        });
    }

    const choice = await showChoiceDialog();
    if (!choice) {
        ui.notifications.info("ℹ️ Impulsion Divine annulée.");
        return;
    }

    // ===== EXECUTE CHOICE =====
    let success = false;
    let rollResult = null;
    let actionGranted = false;

    if (choice.choice === "sacrifice") {
        // Voluntary sacrifice - guaranteed action
        success = false; // For animation purposes (sacrifice animation)
        actionGranted = true;

        // Add injury
        await addInjuries(actor);

        ui.notifications.info("🩸 Sacrifice volontaire - Action supplémentaire garantie !");

    } else {
        // Attempt the roll using d7 system (like all game resolution rolls)
        const roll = new Roll(`${characteristicInfo.final}d7`);
        await roll.evaluate({ async: true });

        rollResult = roll.total;
        success = rollResult >= currentDifficulty;
        actionGranted = success;

        if (success) {
            ui.notifications.info(`🎲 Réussite ! (${rollResult} >= ${currentDifficulty}) - Action supplémentaire accordée !`);
        } else {
            ui.notifications.warn(`🎲 Échec ! (${rollResult} < ${currentDifficulty}) - Pas de tour + blessure !`);
            // Add injury on failure
            await addInjuries(actor);
        }
    }    // ===== ANIMATIONS =====
    async function playAnimation(isSuccess) {
        const sequence = new Sequence();

        if (isSuccess || choice.choice === "sacrifice") {
            // Success/Sacrifice animation (divine energy)
            sequence
                .effect()
                .file(SPELL_CONFIG.animations.success.cast)
                .attachTo(caster)
                .scale(0.8)
                .tint("#fd6666")
                .effect()
                .file(SPELL_CONFIG.animations.success.aura)
                .attachTo(caster)
                .scale(1.2)
                .duration(1500)
                .delay(500)
                .tint("#d41717"); // Rouge léger en cas de réussite
        } else {
            // Failure animation (strain and damage)
            sequence
                .effect()
                .file(SPELL_CONFIG.animations.failure.cast)
                .atLocation(caster)
                .scale(0.6)
                .duration(1500)

                .effect()
                .file(SPELL_CONFIG.animations.failure.pain)
                .attachTo(caster)
                .scale(0.9)
                .duration(1000)
                .delay(750);
        }

        return sequence.play();
    }

    await playAnimation(success || choice.choice === "sacrifice");

    // ===== ADD IMPULSED EFFECT (only on success or sacrifice) =====
    const newImpulsedStacks = await addImpulsedEffect(actor, actionGranted);



    // ===== CREATE COMBINED ROLL AND MESSAGE (like katana.js) =====
    async function createCombinedMessage() {
        let combinedRoll = null;

        if (choice.choice === "attempt") {
            // Create the roll for the combined message (re-use the result)
            combinedRoll = new Roll(`${characteristicInfo.final}d7`);
            await combinedRoll.evaluate({ async: true });
            // Ensure we use the same result that was calculated earlier
            combinedRoll._total = rollResult;
        }

        // Create enhanced chat flavor (like katana.js)
        function createChatFlavor() {
            const injuryInfo = characteristicInfo.injuries > 0 ?
                `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                    <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.final}</i>
                </div>` : '';

            const rollDisplay = choice.choice === "attempt" ? `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎲 JET DE ${SPELL_CONFIG.characteristicDisplay.toUpperCase()}: ${rollResult}&nbsp;${success ? '≥' : '<'}&nbsp;${currentDifficulty}</div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 4px;">${characteristicInfo.final}d7 vs Difficulté ${currentDifficulty}</div>
                </div>
            ` : `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">🩸 SACRIFICE VOLONTAIRE</div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 4px;">Aucun jet - Action garantie contre blessure</div>
                </div>
            `;

            const resultDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>⚡ ${SPELL_CONFIG.name}</strong></div>
                    <div style="font-size: 1.4em; color: ${actionGranted ? '#2e7d32' : '#d32f2f'}; font-weight: bold;">
                        ${actionGranted ? '✅ ACTION SUPPLÉMENTAIRE ACCORDÉE' : '❌ PAS DE TOUR SUPPLÉMENTAIRE'}
                    </div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">
                        Difficulté: ${currentDifficulty} (base: ${SPELL_CONFIG.baseDifficulty} + ${impulsedStacks} utilisations)
                    </div>
                </div>
            `;

            const effectsDisplay = `
                <div style="margin: 15px 0; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 5px;">
                    <h4 style="color: #d32f2f; margin-top: 0;">🩸 Effets appliqués:</h4>
                    ${(!success || choice.choice === "sacrifice") ?
                        '<p style="margin: 5px 0;">• <strong>Blessures</strong> : Blessure ajoutée/augmentée</p>' : ''
                    }
                    ${actionGranted ?
                        `<p style="margin: 5px 0;">• <strong>Impulsed</strong> : ${newImpulsedStacks} utilisation(s) (prochaine difficulté: ${SPELL_CONFIG.baseDifficulty + (newImpulsedStacks * SPELL_CONFIG.difficultyIncrease)})</p>` :
                        '<p style="margin: 5px 0;">• <strong>Impulsed</strong> : Pas d\'augmentation en cas d\'échec</p>'
                    }
                </div>
            `;

            return `
                <div style="background: linear-gradient(135deg, #fff8dc, #f0f8ff); padding: 12px; border-radius: 8px; border: 2px solid #ffd700; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #b8860b;">⚡ ${SPELL_CONFIG.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Lanceur:</strong> ${actor.name} | <strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})
                        </div>
                    </div>
                    ${injuryInfo}
                    ${rollDisplay}
                    ${resultDisplay}
                    ${effectsDisplay}
                </div>
            `;
        }

        const chatFlavor = createChatFlavor();

        // Send combined message
        if (combinedRoll) {
            // Send roll with flavor (like katana.js)
            await combinedRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ token: caster }),
                flavor: chatFlavor,
                rollMode: game.settings.get('core', 'rollMode')
            });
        } else {
            // Send flavor-only message for sacrifice
            await ChatMessage.create({
                user: game.user.id,
                speaker: ChatMessage.getSpeaker({ token: caster }),
                content: chatFlavor,
                type: CONST.CHAT_MESSAGE_TYPES.OTHER
            });
        }
    }

    await createCombinedMessage();

    console.log("[IMPULSION DIVINE] Spell completed:", {
        caster: actor.name,
        choice: choice.choice,
        success: success,
        actionGranted: actionGranted,
        rollResult: rollResult,
        difficulty: currentDifficulty,
        impulsedStacks: newImpulsedStacks
    });

})();
