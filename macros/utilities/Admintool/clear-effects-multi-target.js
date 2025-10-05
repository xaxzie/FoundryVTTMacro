/**
 * Clear All Effects - Multi-Target Admin Tool
 *
 * Admin tool that removes all active effects and statuses from selected tokens.
 *
 * Features:
 * - Works with currently controlled/selected tokens
 * - Removes all Active Effects from selected targets
 * - Shows confirmation dialog before clearing
 * - Provides detailed feedback on operations
 * - GM-only tool for administrative purposes
 *
 * Usage: Run as GM, select tokens on the canvas, then run this macro
 */

(async () => {
    // ===== GM VALIDATION =====
    if (!game.user.isGM) {
        ui.notifications.error("⚠️ Cette macro nécessite les privilèges de MJ !");
        return;
    }

    // ===== TOKEN SELECTION CHECK =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Veuillez d'abord sélectionner les tokens dont vous voulez supprimer les effets !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Counts total active effects on an actor
     */
    function countActiveEffects(actor) {
        return actor.effects ? actor.effects.size : 0;
    }

    /**
     * Removes all active effects from an actor
     */
    async function clearAllEffects(actor) {
        if (!actor.effects || actor.effects.size === 0) {
            return { success: true, count: 0 };
        }

        try {
            const effectIds = actor.effects.contents.map(effect => effect.id);
            await actor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
            return { success: true, count: effectIds.length };
        } catch (error) {
            console.error(`[ERROR] Failed to clear effects for ${actor.name}:`, error);
            return { success: false, count: 0, error: error.message };
        }
    }

    // ===== GET SELECTED TARGETS =====
    const selectedTargets = canvas.tokens.controlled.filter(token => token.actor);

    if (selectedTargets.length === 0) {
        ui.notifications.error("⚠️ Aucun token valide sélectionné ! Assurez-vous que les tokens ont des acteurs associés.");
        return;
    }

    ui.notifications.info(`🎯 ${selectedTargets.length} token(s) sélectionné(s) pour suppression des effets.`);

    // Count total effects to be removed
    let totalEffects = 0;
    const targetSummary = [];

    for (const target of selectedTargets) {
        const effectCount = countActiveEffects(target.actor);
        totalEffects += effectCount;
        targetSummary.push({
            name: target.name,
            effectCount: effectCount
        });
    }

    // ===== CONFIRMATION DIALOG =====
    const confirmationContent = `
        <h3>🧹 Confirmation - Effacement des Effets</h3>
        <p><strong>Cibles sélectionnées:</strong> ${selectedTargets.length}</p>
        <p><strong>Effets à supprimer:</strong> ${totalEffects}</p>

        <div style="margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px; max-height: 200px; overflow-y: auto;">
            <h4>Détails des cibles:</h4>
            ${targetSummary.map(t => `
                <div style="margin: 5px 0; padding: 5px; background: white; border-radius: 3px;">
                    <strong>${t.name}</strong>: ${t.effectCount} effet(s)
                </div>
            `).join('')}
        </div>

        <div style="margin: 15px 0; padding: 10px; background: #ffebee; border: 1px solid #f44336; border-radius: 5px;">
            <strong>⚠️ Attention:</strong> Cette action supprimera TOUS les effets actifs sur les cibles sélectionnées.
            Cette action ne peut pas être annulée !
        </div>
    `;

    const confirmed = await new Promise(resolve => {
        new Dialog({
            title: "🧹 Confirmer l'effacement des effets",
            content: confirmationContent,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-trash"></i>',
                    label: "Supprimer tous les effets",
                    callback: () => resolve(true)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Annuler",
                    callback: () => resolve(false)
                }
            },
            default: "cancel",
            close: () => resolve(false)
        }).render(true);
    });

    if (!confirmed) {
        ui.notifications.info("ℹ️ Opération annulée par l'utilisateur.");
        return;
    }

    // ===== EXECUTE EFFECT CLEARING =====
    ui.notifications.info("🧹 Suppression des effets en cours...");

    const results = {
        success: [],
        failed: [],
        totalEffectsRemoved: 0
    };

    for (const target of selectedTargets) {
        const result = await clearAllEffects(target.actor);

        if (result.success) {
            results.success.push({
                name: target.name,
                effectCount: result.count
            });
            results.totalEffectsRemoved += result.count;
            console.log(`[SUCCESS] Cleared ${result.count} effects from ${target.name}`);
        } else {
            results.failed.push({
                name: target.name,
                error: result.error
            });
            console.error(`[FAILED] Could not clear effects from ${target.name}: ${result.error}`);
        }
    }

    // ===== RESULTS CHAT MESSAGE =====
    const successCount = results.success.length;
    const failedCount = results.failed.length;

    const chatContent = `
        <div style="border: 2px solid #2196f3; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5);">
            <h3 style="margin-top: 0; color: #1976d2;">
                🧹 <strong>Effacement des Effets - Résultats</strong>
            </h3>

            <div style="margin: 10px 0;">
                <p><strong>📊 Résumé:</strong></p>
                <ul>
                    <li>✅ <strong>Réussites:</strong> ${successCount}/${selectedTargets.length} cibles</li>
                    <li>🗑️ <strong>Effets supprimés:</strong> ${results.totalEffectsRemoved}</li>
                    ${failedCount > 0 ? `<li>❌ <strong>Échecs:</strong> ${failedCount} cible(s)</li>` : ''}
                </ul>
            </div>

            ${successCount > 0 ? `
                <div style="margin: 15px 0; padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 5px;">
                    <h4 style="color: #388e3c; margin-top: 0;">✅ Effets supprimés avec succès:</h4>
                    ${results.success.map(r => `
                        <div style="margin: 3px 0;">• <strong>${r.name}</strong>: ${r.effectCount} effet(s) supprimé(s)</div>
                    `).join('')}
                </div>
            ` : ''}

            ${failedCount > 0 ? `
                <div style="margin: 15px 0; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 5px;">
                    <h4 style="color: #d32f2f; margin-top: 0;">❌ Échecs:</h4>
                    ${results.failed.map(r => `
                        <div style="margin: 3px 0;">• <strong>${r.name}</strong>: ${r.error}</div>
                    `).join('')}
                </div>
            ` : ''}

            <div style="margin-top: 15px; padding: 10px; background: rgba(158, 158, 158, 0.1); border-radius: 5px; font-size: 0.9em;">
                <strong>🎯 Outil Admin:</strong> Effacement des effets sur tokens sélectionnés
                <br><strong>🕒 Exécuté:</strong> ${new Date().toLocaleString()}
                <br><strong>👤 Par:</strong> ${game.user.name}
            </div>
        </div>
    `;

    await ChatMessage.create({
        user: game.user.id,
        content: chatContent,
        whisper: game.users.filter(u => u.isGM).map(u => u.id) // GM-only message
    });

    // ===== FINAL NOTIFICATIONS =====
    if (successCount > 0) {
        ui.notifications.info(`✅ ${results.totalEffectsRemoved} effets supprimés sur ${successCount} cible(s) !`);
    }

    if (failedCount > 0) {
        ui.notifications.error(`❌ Échec pour ${failedCount} cible(s) - Voir les détails dans le chat.`);
    }

    console.log("[ADMIN TOOL] Clear Effects Multi-Target completed:", {
        targets: selectedTargets.length,
        effects: results.totalEffectsRemoved,
        success: successCount,
        failed: failedCount
    });

})();
