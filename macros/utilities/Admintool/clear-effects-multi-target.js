/**
 * Clear All Effects - Multi-Target Admin Tool
 *
 * Admin tool that allows Portal selection of multiple targets and removes
 * all their active effects and statuses when selection is complete.
 *
 * Features:
 * - Portal crosshair targeting for multiple targets
 * - Selection continues until user presses Escape
 * - Detects all actors in selected areas
 * - Removes all Active Effects from selected targets
 * - Shows confirmation dialog before clearing
 * - Provides detailed feedback on operations
 * - GM-only tool for administrative purposes
 *
 * Usage: Run as GM, use crosshair to select targets, press Escape when done
 */

(async () => {
    // ===== GM VALIDATION =====
    if (!game.user.isGM) {
        ui.notifications.error("⚠️ Cette macro nécessite les privilèges de MJ !");
        return;
    }

    // ===== PORTAL MODULE CHECK =====
    if (typeof portal === "undefined") {
        ui.notifications.error("⚠️ Le module Portal est requis pour cette macro !");
        return;
    }

    // ===== CONFIGURATION =====
    const CONFIG = {
        targeting: {
            range: 500,
            color: "#ff4444",
            width: 2,
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
        },
        tolerance: 50, // Distance tolerance for detecting actors at target locations
        maxSelections: 20 // Safety limit to prevent infinite selections
    };

    // ===== UTILITY FUNCTIONS =====

    /**
     * Detects actors at a specific location with tolerance
     */
    function getActorAtLocation(targetX, targetY, tolerance = 50) {
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            const tokenX = token.center.x;
            const tokenY = token.center.y;
            const distance = Math.sqrt(Math.pow(targetX - tokenX, 2) + Math.pow(targetY - tokenY, 2));

            if (distance <= tolerance) {
                return token;
            }
        }
        return null;
    }

    /**
     * Creates Portal instance for target selection
     */
    function createTargetingPortal() {
        return new Portal()
            .color(CONFIG.targeting.color)
            .texture(CONFIG.targeting.texture)
            .width(CONFIG.targeting.width);
    }

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
            const effectIds = Array.from(actor.effects.keys());
            await actor.deleteEmbeddedDocuments("ActiveEffect", effectIds);
            return { success: true, count: effectIds.length };
        } catch (error) {
            console.error(`[ERROR] Failed to clear effects for ${actor.name}:`, error);
            return { success: false, count: 0, error: error.message };
        }
    }

    // ===== MULTI-TARGET SELECTION =====
    ui.notifications.info("🎯 Sélection multi-cibles activée ! Cliquez sur les cibles, Échap pour terminer.");

    const selectedTargets = [];
    const targetLocations = [];
    let selectionCount = 0;

    try {
        while (selectionCount < CONFIG.maxSelections) {
            const targetPortal = createTargetingPortal();
            const targetLocation = await targetPortal.pick();

            // User pressed Escape or cancelled
            if (!targetLocation) {
                console.log(`[DEBUG] Selection cancelled or completed. Total selections: ${selectionCount}`);
                break;
            }

            selectionCount++;
            targetLocations.push({ x: targetLocation.x, y: targetLocation.y });

            // Check for actor at this location
            const targetToken = getActorAtLocation(targetLocation.x, targetLocation.y, CONFIG.tolerance);

            if (targetToken && targetToken.actor) {
                // Avoid duplicates
                if (!selectedTargets.find(t => t.id === targetToken.id)) {
                    selectedTargets.push(targetToken);
                    console.log(`[DEBUG] Added target: ${targetToken.name}`);

                    // Visual feedback
                    ui.notifications.info(`🎯 Cible ajoutée: ${targetToken.name} (${selectedTargets.length} total)`);
                } else {
                    ui.notifications.warn(`⚠️ ${targetToken.name} déjà sélectionné !`);
                }
            } else {
                ui.notifications.warn("⚠️ Aucun token trouvé à cet emplacement !");
            }
        }

        if (selectionCount >= CONFIG.maxSelections) {
            ui.notifications.warn(`⚠️ Limite de sélections atteinte (${CONFIG.maxSelections}) !`);
        }

    } catch (error) {
        console.error("[ERROR] Portal selection failed:", error);
        ui.notifications.error("❌ Erreur lors de la sélection Portal !");
        return;
    }

    // ===== VALIDATION AND CONFIRMATION =====
    if (selectedTargets.length === 0) {
        ui.notifications.info("ℹ️ Aucune cible sélectionnée. Opération annulée.");
        return;
    }

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
                <strong>🎯 Outil Admin:</strong> Effacement multi-cibles
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
