/**
 * End Steel Chain (Terminer Chaîne d'Acier) - Léo
 *
 * Macro compagnon pour terminer l'effet "Chaîne d'Acier" sur une cible choisie.
 * Cette macro permet à Léo de libérer volontairement une cible enchaînée.
 *
 * Fonctionnalités :
 * - Liste toutes les cibles actuellement enchaînées par Léo
 * - Permet de choisir quelle chaîne terminer
 * - Supprime l'animation persistante et l'effet actif
 * - Peut terminer toutes les chaînes d'un coup
 *
 * Usage : Sélectionner le token de Léo et lancer cette macro
 */

(async () => {
    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== FIND ALL CHAINED TARGETS =====
    function findChainedTargets() {
        const chainedTargets = [];

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            // Chercher l'effet de chaîne
            const chainEffect = token.actor.effects.find(e =>
                e.name === "Chaîne d'Acier" &&
                e.flags?.world?.chainCaster === caster.id
            );

            if (chainEffect) {
                chainedTargets.push({
                    token: token,
                    actor: token.actor,
                    effect: chainEffect,
                    name: token.actor.name || token.name,
                    sequenceName: chainEffect.flags.world.chainSequenceName
                });
            }
        }

        return chainedTargets;
    }

    const chainedTargets = findChainedTargets();

    if (chainedTargets.length === 0) {
        ui.notifications.info("🔗 Aucune cible enchaînée trouvée !");
        return;
    }

    // ===== SELECTION DIALOG =====
    async function showSelectionDialog() {
        let dialogContent = `
            <h3>🔗 Terminer Chaîne d'Acier</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p>Sélectionnez la(les) chaîne(s) à terminer :</p>
            <div style="margin: 15px 0;">
        `;

        if (chainedTargets.length === 1) {
            // Une seule cible - confirmation simple
            const target = chainedTargets[0];
            dialogContent += `
                <div style="padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1;">
                            <strong>🔗 ${target.name}</strong>
                            <br><small style="color: #666;">Enchaîné par Chaîne d'Acier</small>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Plusieurs cibles - sélection multiple
            chainedTargets.forEach((target, index) => {
                dialogContent += `
                    <div style="margin: 8px 0; padding: 10px; border: 1px solid #ccc; border-radius: 4px; background: #f9f9f9;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" name="selectedTargets" value="${index}" style="margin-right: 10px;">
                            <div style="flex-grow: 1;">
                                <strong>🔗 ${target.name}</strong>
                                <br><small style="color: #666;">Enchaîné par Chaîne d'Acier</small>
                            </div>
                        </label>
                    </div>
                `;
            });
        }

        dialogContent += `
            </div>
        `;

        return new Promise(resolve => {
            const buttons = {};

            if (chainedTargets.length === 1) {
                // Une seule cible
                buttons.end = {
                    icon: '<i class="fas fa-unlock"></i>',
                    label: "🔓 Libérer",
                    callback: () => resolve({ selectedIndices: [0] })
                };
            } else {
                // Plusieurs cibles
                buttons.selected = {
                    icon: '<i class="fas fa-unlock"></i>',
                    label: "🔓 Libérer Sélectionnées",
                    callback: (html) => {
                        const selected = [];
                        html.find('input[name="selectedTargets"]:checked').each((i, el) => {
                            selected.push(parseInt(el.value));
                        });
                        if (selected.length === 0) {
                            ui.notifications.warn("Aucune cible sélectionnée !");
                            return;
                        }
                        resolve({ selectedIndices: selected });
                    }
                };

                buttons.all = {
                    icon: '<i class="fas fa-unlock-alt"></i>',
                    label: "🔓 Libérer Toutes",
                    callback: () => {
                        const allIndices = chainedTargets.map((_, index) => index);
                        resolve({ selectedIndices: allIndices });
                    }
                };
            }

            buttons.cancel = {
                icon: '<i class="fas fa-times"></i>',
                label: "❌ Annuler",
                callback: () => resolve(null)
            };

            new Dialog({
                title: "🔗 Terminer Chaîne d'Acier",
                content: dialogContent,
                buttons: buttons,
                default: chainedTargets.length === 1 ? "end" : "selected"
            }).render(true);
        });
    }

    const selection = await showSelectionDialog();
    if (!selection) {
        ui.notifications.info("Opération annulée.");
        return;
    }

    // ===== REMOVE CHAINS =====
    const { selectedIndices } = selection;
    const targetsToFree = selectedIndices.map(index => chainedTargets[index]);
    const freedNames = [];

    for (const target of targetsToFree) {
        try {
            // Supprimer l'animation Sequencer
            if (target.sequenceName) {
                Sequencer.EffectManager.endEffects({ name: target.sequenceName });
                console.log(`[DEBUG] Removed chain animation: ${target.sequenceName}`);
            }

            // Supprimer l'effet actif
            await target.effect.delete();
            console.log(`[DEBUG] Removed chain effect from ${target.name}`);

            freedNames.push(target.name);

        } catch (error) {
            console.error(`Error removing chain from ${target.name}:`, error);
            ui.notifications.error(`Erreur lors de la libération de ${target.name} !`);
        }
    }

    // ===== RESULTS =====
    if (freedNames.length > 0) {
        // Animation de libération
        const liberationSeq = new Sequence();

        for (const target of targetsToFree) {
            liberationSeq.effect()
                .file("jb2a.chain.03.complete.blue")
                .atLocation(target.token)
                .scale(0.6)
                .duration(1500)
                .fadeOut(500)
                .tint("#ffd700"); // Doré pour indiquer la libération
        }

        await liberationSeq.play();

        // Message dans le chat
        const liberationMessage = `
            <div style="background: linear-gradient(135deg, #e8f5e8, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #4caf50; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #2e7d32;">🔓 Chaînes d'Acier Terminées</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name}
                    </div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f9fff9; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #2e7d32; margin-bottom: 6px;"><strong>Cibles Libérées</strong></div>
                    <div style="font-size: 1.0em; font-weight: bold;">${freedNames.join(', ')}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Les chaînes magiques se dissolvent</div>
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: liberationMessage,
            rollMode: game.settings.get("core", "rollMode")
        });

        // Notification
        const targetText = freedNames.length === 1 ? freedNames[0] : `${freedNames.length} cibles`;
        ui.notifications.info(`🔓 Chaîne(s) d'acier terminée(s) ! ${targetText} libérée(s).`);

    } else {
        ui.notifications.error("Aucune chaîne n'a pu être terminée !");
    }

})();
