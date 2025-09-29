/**
 * Generic Roll Characteristic Macro
 *
 * A universal macro that allows any player to roll characteristic checks
 * for their selected character token.
 *
 * Features:
 * - Interactive characteristic selection dialog
 * - Automatic stat retrieval with injury adjustments
 * - Clear chat output with roll results
 * - Works with any character that has stats configured
 *
 * Usage:
 * 1. Select your character token
 * 2. Run this macro
 * 3. Choose which characteristic to roll
 * 4. View results in chat
 */

(async () => {
    // === TOKEN VALIDATION ===
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de votre personnage !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // === VALIDATE ACTOR HAS CHARACTERISTICS ===
    if (!actor.system.attributes) {
        ui.notifications.error("Les attributs de l'acteur ne sont pas configurés ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.");
        return;
    }

    // === CHARACTER STATS UTILITY FUNCTIONS ===
    /**
     * Retrieves a specific character statistic from the actor
     * @param {Actor} actor - The actor to get stats from
     * @param {string} statName - Name of the stat
     * @returns {number} The stat value, defaults to 3 if not found
     */
    function getCharacterStat(actor, statName) {
        const attribute = actor.system.attributes?.[statName];
        if (!attribute) {
            console.warn(`[WARNING] Characteristic ${statName} not found! Using default value of 3.`);
            return 3;
        }
        return attribute.value || 3;
    }

    /**
     * Detects injury stacks on an actor
     * @param {Actor} actor - The actor to check for injuries
     * @returns {number} Number of injury stacks (0 if none)
     */
    function detectInjuryStacks(actor) {
        if (!actor.effects) return 0;

        // Look for injury effects (assuming they have "injury" or "blessure" in the name)
        const injuryEffects = actor.effects.contents.filter(effect =>
            effect.name && (
                effect.name.toLowerCase().includes('injury') ||
                effect.name.toLowerCase().includes('blessure') ||
                effect.name.toLowerCase().includes('blessé')
            )
        );

        return injuryEffects.length;
    }

    /**
     * Gets injury-adjusted character statistic
     * @param {Actor} actor - The actor to get stats from
     * @param {string} statName - Name of the stat
     * @returns {Object} { baseStat, injuryStacks, adjustedStat }
     */
    function getInjuryAdjustedStat(actor, statName) {
        const baseStat = getCharacterStat(actor, statName);
        const injuryStacks = detectInjuryStacks(actor);

        // Each injury reduces the stat by 1, minimum of 1
        const adjustedStat = Math.max(1, baseStat - injuryStacks);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${statName} reduced from ${baseStat} to ${adjustedStat} due to ${injuryStacks} injuries`);
        }

        return {
            baseStat,
            injuryStacks,
            adjustedStat
        };
    }

    // === DEFINE CHARACTERISTICS ===
    const characteristics = {
        physique: "Physique (Force Physique)",
        dexterite: "Dextérité (Habileté/Précision)",
        agilite: "Agilité (Vitesse/Réflexes)",
        esprit: "Esprit (Mental/Concentration)",
        sens: "Sens (Perception/Intuition)",
        volonte: "Volonté (Détermination/Résistance)",
        charisme: "Charisme (Social/Commandement)"
    };

    // === CREATE CHARACTERISTIC SELECTION DIALOG ===
    const characteristicChoice = await new Promise((resolve) => {
        const content = `
            <div style="padding: 15px;">
                <h3>🎲 Test de Caractéristique</h3>
                <p><strong>Personnage:</strong> ${actor.name}</p>
                <hr>
                <p>Choisissez la caractéristique à tester :</p>
                <div style="display: grid; gap: 8px; margin: 15px 0;">
                    ${Object.entries(characteristics).map(([key, label]) => {
                        const statInfo = getInjuryAdjustedStat(actor, key);
                        const injuryDisplay = statInfo.injuryStacks > 0
                            ? ` <span style="color: #d32f2f;">(${statInfo.baseStat} - ${statInfo.injuryStacks} blessures = ${statInfo.adjustedStat})</span>`
                            : ` <span style="color: #388e3c;">(${statInfo.adjustedStat})</span>`;

                        return `
                            <button type="button" onclick="document.getElementById('characteristic-result').value='${key}'; this.closest('.dialog').querySelector('.dialog-button.ok').click();"
                                    style="padding: 8px 12px; text-align: left; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer; border-radius: 4px;">
                                <strong>${label}</strong>${injuryDisplay}
                            </button>
                        `;
                    }).join('')}
                </div>
                <input type="hidden" id="characteristic-result" value="">
            </div>
        `;

        new Dialog({
            title: "Sélection de Caractéristique",
            content: content,
            buttons: {
                ok: {
                    label: "Confirmer",
                    callback: (html) => {
                        const selected = html.find('#characteristic-result').val();
                        resolve(selected || null);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "ok",
            close: () => resolve(null)
        }, {
            width: 400
        }).render(true);
    });

    if (!characteristicChoice) {
        ui.notifications.info("Test de caractéristique annulé.");
        return;
    }

    // === PERFORM THE ROLL ===
    const selectedCharacteristic = characteristics[characteristicChoice];
    const statInfo = getInjuryAdjustedStat(actor, characteristicChoice);

    // Roll [stat]d7 (d7 dice system - one d7 per characteristic point)
    const roll = new Roll(`${statInfo.adjustedStat}d7`);
    await roll.evaluate({async: true});    // === CREATE CHAT MESSAGE ===
    const injuryInfo = statInfo.injuryStacks > 0
        ? `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
               <i>⚠️ Ajusté pour blessures: Base ${statInfo.baseStat} - ${statInfo.injuryStacks} = ${statInfo.adjustedStat}</i>
           </div>`
        : '';

    const chatContent = `
        <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">🎲 Test de Caractéristique</h3>
            <div style="margin-bottom: 8px;">
                <strong>Personnage:</strong> ${actor.name}<br>
                <strong>Caractéristique:</strong> ${selectedCharacteristic}
            </div>
            ${injuryInfo}
            <div style="background: white; padding: 8px; border-radius: 4px; margin: 8px 0; border-left: 4px solid #2196f3;">
                <strong>Formule:</strong> ${statInfo.adjustedStat}d7<br>
                <strong>Résultat:</strong> <span style="font-size: 1.2em; color: #1976d2; font-weight: bold;">${roll.total}</span>
            </div>
            <div style="font-size: 0.9em; color: #666;">
                <strong>Détail:</strong> ${roll.dice[0].results.map(r => r.result).join(' + ')} = ${roll.total}
            </div>
        </div>
    `;

    // Send the chat message
    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: roll,
        rollMode: game.settings.get("core", "rollMode")
    });

    // Show notification
    ui.notifications.info(`Test de ${selectedCharacteristic}: ${roll.total}`);

    console.log(`[DEBUG] Characteristic roll completed - ${selectedCharacteristic}: ${roll.total}`);
})();
