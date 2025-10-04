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
                aura: "jb2a.template_circle.aura.01.complete.blue",
                sound: null
            },
            failure: {
                cast: "jb2a.impact.ground_crack.orange.02",
                pain: "jb2a.extras.tmfx.border.circle.outpulse.01.fast",
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
        const baseValue = actor.system?.abilities?.[characteristic]?.value ||
                         actor.system?.[characteristic] || 0;

        // Detect injuries effect
        const injuryEffect = actor.effects.find(e => e.name === "Blessures");
        let injuryStacks = 0;
        if (injuryEffect?.flags?.statuscounter?.value) {
            injuryStacks = injuryEffect.flags.statuscounter.value;
        }

        const adjustedValue = Math.max(0, baseValue - injuryStacks);

        return {
            base: baseValue,
            injuries: injuryStacks,
            final: adjustedValue
        };
    }

    function calculateManaCost(baseCost, stance, isFocusable) {
        if (isFocusable && stance === 'focus') return 0;
        return baseCost;
    }

    /**
     * Adds or updates the injuries effect on an actor
     * @param {Actor} actor - The actor to add injuries to
     * @returns {Promise<boolean>} Success status
     */
    async function addInjuries(actor) {
        try {
            const existingEffect = actor.effects.find(e => e.name === SPELL_CONFIG.effects.injuries.name);

            if (existingEffect) {
                // Update existing effect
                let currentValue = existingEffect.flags?.statuscounter?.value || 0;

                // If no statusCounter exists, initialize to 2 (1 existing + 1 new)
                if (!existingEffect.flags?.statuscounter?.value) {
                    currentValue = 1; // Will be incremented to 2
                }

                await existingEffect.update({
                    "flags.statuscounter.value": currentValue + 1
                });

                console.log(`[DEBUG] Updated injuries effect: ${currentValue + 1} stacks`);
                return true;
            } else {
                // Create new effect
                const injuryEffect = {
                    name: SPELL_CONFIG.effects.injuries.name,
                    icon: SPELL_CONFIG.effects.injuries.icon,
                    description: SPELL_CONFIG.effects.injuries.description,
                    flags: {
                        statuscounter: {
                            value: 1
                        },
                        world: {
                            spellCaster: caster.id,
                            spellName: SPELL_CONFIG.name,
                            createdAt: Date.now()
                        }
                    }
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
     * Adds or updates the impulsed effect on an actor
     */
    async function addImpulsedEffect(actor) {
        try {
            const existingEffect = actor.effects.find(e => e.name === SPELL_CONFIG.effects.impulsed.name);

            if (existingEffect) {
                // Update existing effect
                const currentValue = existingEffect.flags?.statuscounter?.value || 1;
                await existingEffect.update({
                    "flags.statuscounter.value": currentValue + 1
                });

                console.log(`[DEBUG] Updated impulsed effect: ${currentValue + 1} stacks`);
                return currentValue + 1;
            } else {
                // Create new effect
                const impulsedEffect = {
                    name: SPELL_CONFIG.effects.impulsed.name,
                    icon: SPELL_CONFIG.effects.impulsed.icon,
                    description: SPELL_CONFIG.effects.impulsed.description,
                    flags: {
                        statuscounter: {
                            value: 1
                        },
                        world: {
                            spellCaster: caster.id,
                            spellName: SPELL_CONFIG.name,
                            createdAt: Date.now()
                        }
                    }
                };

                await actor.createEmbeddedDocuments("ActiveEffect", [impulsedEffect]);
                console.log("[DEBUG] Created new impulsed effect with 1 stack");
                return 1;
            }
        } catch (error) {
            console.error("[ERROR] Failed to add impulsed effect:", error);
            return 0;
        }
    }

    // ===== GET CURRENT STATUS =====
    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);

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
            <p><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})</p>
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
        // Attempt the roll
        const roll = new Roll(`1d100`);
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
    }

    // ===== ANIMATIONS =====
    async function playAnimation(isSuccess) {
        const sequence = new Sequence();

        if (isSuccess || choice.choice === "sacrifice") {
            // Success/Sacrifice animation (divine energy)
            sequence
                .effect()
                .file(SPELL_CONFIG.animations.success.cast)
                .attachTo(caster)
                .scale(0.8)
                .duration(2000)

                .effect()
                .file(SPELL_CONFIG.animations.success.aura)
                .attachTo(caster)
                .scale(1.2)
                .duration(1500)
                .delay(500);
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

    // ===== ADD IMPULSED EFFECT =====
    const newImpulsedStacks = await addImpulsedEffect(actor);

    // ===== CREATE CHAT MESSAGE =====
    const chatContent = `
        <div style="border: 2px solid #ffd700; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #fff8dc, #f0f8ff);">
            <h3 style="margin-top: 0; color: #b8860b;">
                ⚡ <strong>Impulsion Divine</strong>
            </h3>

            <div style="margin: 10px 0;">
                <p><strong>🧙‍♂️ Lanceur:</strong> ${actor.name}</p>
                <p><strong>💫 Coût:</strong> ${actualManaCost === 0 ? '0 mana (Focus possible)' : `${actualManaCost} mana`}</p>
                <p><strong>🎯 Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})</p>
            </div>

            <div style="margin: 15px 0; padding: 10px; background: rgba(255, 215, 0, 0.1); border-radius: 5px;">
                <h4 style="color: #b8860b; margin-top: 0;">📊 Détails du jet:</h4>
                <p><strong>🎲 Action choisie:</strong> ${choice.choice === "sacrifice" ? "Sacrifice volontaire" : "Tentative de jet"}</p>
                <p><strong>🎯 Difficulté:</strong> ${currentDifficulty} (base: ${SPELL_CONFIG.baseDifficulty} + ${impulsedStacks} utilisations)</p>
                ${rollResult ? `<p><strong>🎲 Résultat:</strong> ${rollResult}</p>` : ''}
                <p><strong>✨ Résultat:</strong> ${actionGranted ?
                    '<span style="color: #2e7d32; font-weight: bold;">Action supplémentaire accordée !</span>' :
                    '<span style="color: #d32f2f; font-weight: bold;">Pas de tour supplémentaire</span>'
                }</p>
            </div>

            <div style="margin: 15px 0; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 5px;">
                <h4 style="color: #d32f2f; margin-top: 0;">🩸 Effets appliqués:</h4>
                ${(!success || choice.choice === "sacrifice") ?
                    '<p>• <strong>Blessures</strong> : Blessure ajoutée/augmentée</p>' : ''
                }
                <p>• <strong>Impulsed</strong> : ${newImpulsedStacks} utilisation(s) (prochaine difficulté: ${SPELL_CONFIG.baseDifficulty + (newImpulsedStacks * SPELL_CONFIG.difficultyIncrease)})</p>
            </div>

            <div style="margin-top: 15px; padding: 10px; background: rgba(158, 158, 158, 0.1); border-radius: 5px; font-size: 0.9em;">
                <strong>🎮 Sort spécial:</strong> Impulsion Divine permet une action supplémentaire au risque de blessures
                <br><strong>🕒 Lancé:</strong> ${new Date().toLocaleString()}
            </div>
        </div>
    `;

    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

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
