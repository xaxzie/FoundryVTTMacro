/**
 * Clear All Effects - Multi-Target Admin Tool (Comprehensive)
 *
 * Enhanced admin tool that removes all effects and visual elements from selected tokens.
 *
 * Features:
 * - Works with currently controlled/selected tokens
 * - Removes all Active Effects from selected targets
 * - Clears all Sequencer animations attached to tokens
 * - Removes all Token Magic FX filters from tokens
 * - Shows detailed confirmation dialog before clearing
 * - Provides comprehensive feedback on all operations
 * - GM-only tool for administrative purposes
 * - Handles partial successes and detailed error reporting
 *
 * Visual Effects Supported:
 * - Sequencer persistent animations (God Speed, transformations, etc.)
 * - Token Magic FX filters (shadows, electricity, glows, etc.)
 * - All types of active effects with custom flags
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
     * Counts Sequencer animations on a token
     */
    function countSequencerAnimations(token) {
        if (!window.Sequencer || !window.Sequencer.EffectManager) {
            return 0;
        }

        try {
            // Get all running effects and filter by token
            const allEffects = window.Sequencer.EffectManager.getEffects();
            const tokenEffects = allEffects.filter(effect => {
                // Check if effect is attached to this token
                return effect.source && (
                    effect.source.uuid === token.uuid ||
                    effect.source.id === token.id ||
                    (effect.source.object && effect.source.object.id === token.id)
                );
            });
            return tokenEffects.length;
        } catch (error) {
            console.warn(`[DEBUG] Could not count Sequencer animations for ${token.name}:`, error);
            return 0;
        }
    }

    /**
     * Counts Token Magic FX filters on a token
     */
    function countTokenMagicFilters(token) {
        if (!window.TokenMagic || typeof token.TMFXhasFilterId !== 'function') {
            return 0;
        }

        try {
            // Check if token has any TMFX filters
            const tokenData = token.document || token;
            const filters = tokenData.getFlag('tokenmagic', 'filters') || [];
            return Array.isArray(filters) ? filters.length : 0;
        } catch (error) {
            console.warn(`[DEBUG] Could not count Token Magic filters for ${token.name}:`, error);
            return 0;
        }
    }

    /**
     * Removes all Sequencer animations from a token
     */
    async function clearSequencerAnimations(token) {
        if (!window.Sequencer || !window.Sequencer.EffectManager) {
            return { success: true, count: 0, reason: "Sequencer not available" };
        }

        try {
            let clearedCount = 0;

            // Method 1: Try to end effects by token UUID/ID
            try {
                await window.Sequencer.EffectManager.endEffects({ object: token });
                clearedCount += 1; // We can't easily count exact effects removed
            } catch (error) {
                console.warn(`[DEBUG] Method 1 failed for ${token.name}:`, error);
            }

            // Method 2: Try to find and end effects by checking all running effects
            try {
                const allEffects = window.Sequencer.EffectManager.getEffects();
                const tokenEffects = allEffects.filter(effect => {
                    return effect.source && (
                        effect.source.uuid === token.uuid ||
                        effect.source.id === token.id ||
                        (effect.source.object && effect.source.object.id === token.id)
                    );
                });

                for (const effect of tokenEffects) {
                    try {
                        if (effect.name) {
                            await window.Sequencer.EffectManager.endEffects({ name: effect.name });
                        } else if (effect.id) {
                            await window.Sequencer.EffectManager.endEffects({ effects: [effect] });
                        }
                        clearedCount++;
                    } catch (effectError) {
                        console.warn(`[DEBUG] Could not end individual effect:`, effectError);
                    }
                }
            } catch (error) {
                console.warn(`[DEBUG] Method 2 failed for ${token.name}:`, error);
            }

            return { success: true, count: clearedCount };
        } catch (error) {
            console.error(`[ERROR] Failed to clear Sequencer animations for ${token.name}:`, error);
            return { success: false, count: 0, error: error.message };
        }
    }

    /**
     * Removes all Token Magic FX filters from a token
     */
    async function clearTokenMagicFilters(token) {
        if (!window.TokenMagic || typeof token.TMFXdeleteFilters !== 'function') {
            return { success: true, count: 0, reason: "Token Magic FX not available" };
        }

        try {
            // Count existing filters before removal
            const initialCount = countTokenMagicFilters(token);

            // Remove all filters from the token
            await token.TMFXdeleteFilters();

            return { success: true, count: initialCount };
        } catch (error) {
            console.error(`[ERROR] Failed to clear Token Magic filters for ${token.name}:`, error);
            return { success: false, count: 0, error: error.message };
        }
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

    /**
     * Comprehensive cleanup function for a token (effects + visuals)
     */
    async function clearAllTokenEffects(token) {
        const results = {
            activeEffects: { success: false, count: 0 },
            sequencerAnimations: { success: false, count: 0 },
            tokenMagicFilters: { success: false, count: 0 },
            overallSuccess: false,
            totalCleared: 0
        };

        // Clear active effects from actor
        if (token.actor) {
            results.activeEffects = await clearAllEffects(token.actor);
            results.totalCleared += results.activeEffects.count || 0;
        }

        // Clear Sequencer animations
        results.sequencerAnimations = await clearSequencerAnimations(token);
        results.totalCleared += results.sequencerAnimations.count || 0;

        // Clear Token Magic FX filters
        results.tokenMagicFilters = await clearTokenMagicFilters(token);
        results.totalCleared += results.tokenMagicFilters.count || 0;

        // Determine overall success
        results.overallSuccess = results.activeEffects.success &&
                                results.sequencerAnimations.success &&
                                results.tokenMagicFilters.success;

        return results;
    }

    // ===== GET SELECTED TARGETS =====
    const selectedTargets = canvas.tokens.controlled.filter(token => token.actor);

    if (selectedTargets.length === 0) {
        ui.notifications.error("⚠️ Aucun token valide sélectionné ! Assurez-vous que les tokens ont des acteurs associés.");
        return;
    }

    ui.notifications.info(`🎯 ${selectedTargets.length} token(s) sélectionné(s) pour suppression des effets.`);

    // Count total effects to be removed (including visual effects)
    let totalEffects = 0;
    const targetSummary = [];

    for (const target of selectedTargets) {
        const effectCount = countActiveEffects(target.actor);
        const sequencerCount = countSequencerAnimations(target);
        const tmfxCount = countTokenMagicFilters(target);
        const totalCount = effectCount + sequencerCount + tmfxCount;

        totalEffects += totalCount;
        targetSummary.push({
            name: target.name,
            effectCount: effectCount,
            sequencerCount: sequencerCount,
            tmfxCount: tmfxCount,
            totalCount: totalCount
        });
    }

    // ===== CONFIRMATION DIALOG =====
    const confirmationContent = `
        <h3>🧹 Confirmation - Effacement Complet des Effets</h3>
        <p><strong>Cibles sélectionnées:</strong> ${selectedTargets.length}</p>
        <p><strong>Éléments à supprimer:</strong> ${totalEffects}</p>

        <div style="margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px; max-height: 250px; overflow-y: auto;">
            <h4>Détails des cibles:</h4>
            ${targetSummary.map(t => `
                <div style="margin: 5px 0; padding: 8px; background: white; border-radius: 3px; border-left: 4px solid #2196f3;">
                    <div style="font-weight: bold; margin-bottom: 4px;">${t.name}</div>
                    <div style="font-size: 0.9em; color: #666;">
                        🎭 ${t.effectCount} effet(s) actif(s) •
                        🎬 ${t.sequencerCount} animation(s) •
                        ✨ ${t.tmfxCount} filtre(s) TMFX
                        <br><strong>Total: ${t.totalCount} élément(s)</strong>
                    </div>
                </div>
            `).join('')}
        </div>

        <div style="margin: 15px 0; padding: 10px; background: #e3f2fd; border: 1px solid #2196f3; border-radius: 5px;">
            <h4 style="margin-top: 0; color: #1976d2;">🔧 Types d'effets supprimés:</h4>
            <ul style="margin: 5px 0; padding-left: 20px;">
                <li><strong>🎭 Effets Actifs:</strong> Tous les ActiveEffects du système</li>
                <li><strong>🎬 Animations Sequencer:</strong> Toutes les animations persistantes</li>
                <li><strong>✨ Filtres Token Magic FX:</strong> Tous les filtres visuels (ombres, éclairs, etc.)</li>
            </ul>
        </div>

        <div style="margin: 15px 0; padding: 10px; background: #ffebee; border: 1px solid #f44336; border-radius: 5px;">
            <strong>⚠️ Attention:</strong> Cette action supprimera TOUS les effets, animations et filtres visuels sur les cibles sélectionnées.
            <br><strong>Cette action ne peut pas être annulée !</strong>
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

    // ===== EXECUTE COMPREHENSIVE EFFECT CLEARING =====
    ui.notifications.info("🧹 Suppression complète des effets en cours...");

    const results = {
        success: [],
        failed: [],
        totalEffectsRemoved: 0,
        totalAnimationsRemoved: 0,
        totalFiltersRemoved: 0
    };

    for (const target of selectedTargets) {
        console.log(`[DEBUG] Processing comprehensive cleanup for ${target.name}`);
        const result = await clearAllTokenEffects(target);

        if (result.overallSuccess) {
            results.success.push({
                name: target.name,
                effectCount: result.activeEffects.count || 0,
                sequencerCount: result.sequencerAnimations.count || 0,
                tmfxCount: result.tokenMagicFilters.count || 0,
                totalCount: result.totalCleared
            });

            results.totalEffectsRemoved += result.activeEffects.count || 0;
            results.totalAnimationsRemoved += result.sequencerAnimations.count || 0;
            results.totalFiltersRemoved += result.tokenMagicFilters.count || 0;

            console.log(`[SUCCESS] Comprehensive cleanup for ${target.name}: ${result.totalCleared} items removed`);
            console.log(`  - Active Effects: ${result.activeEffects.count}`);
            console.log(`  - Sequencer Animations: ${result.sequencerAnimations.count}`);
            console.log(`  - TMFX Filters: ${result.tokenMagicFilters.count}`);
        } else {
            // Collect all error messages
            const errors = [];
            if (!result.activeEffects.success && result.activeEffects.error) {
                errors.push(`Effects: ${result.activeEffects.error}`);
            }
            if (!result.sequencerAnimations.success && result.sequencerAnimations.error) {
                errors.push(`Animations: ${result.sequencerAnimations.error}`);
            }
            if (!result.tokenMagicFilters.success && result.tokenMagicFilters.error) {
                errors.push(`Filters: ${result.tokenMagicFilters.error}`);
            }

            results.failed.push({
                name: target.name,
                error: errors.length > 0 ? errors.join('; ') : 'Unknown error',
                partialSuccess: result.totalCleared > 0,
                clearedCount: result.totalCleared
            });

            // Still count partial successes
            if (result.totalCleared > 0) {
                results.totalEffectsRemoved += result.activeEffects.count || 0;
                results.totalAnimationsRemoved += result.sequencerAnimations.count || 0;
                results.totalFiltersRemoved += result.tokenMagicFilters.count || 0;
            }

            console.error(`[FAILED] Comprehensive cleanup failed for ${target.name}:`, errors.join('; '));
        }
    }

    // ===== RESULTS CHAT MESSAGE =====
    const successCount = results.success.length;
    const failedCount = results.failed.length;
    const totalRemoved = results.totalEffectsRemoved + results.totalAnimationsRemoved + results.totalFiltersRemoved;

    const chatContent = `
        <div style="border: 2px solid #2196f3; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5);">
            <h3 style="margin-top: 0; color: #1976d2;">
                🧹 <strong>Effacement Complet des Effets - Résultats</strong>
            </h3>

            <div style="margin: 10px 0;">
                <p><strong>📊 Résumé:</strong></p>
                <ul>
                    <li>✅ <strong>Réussites:</strong> ${successCount}/${selectedTargets.length} cibles</li>
                    <li>🎭 <strong>Effets actifs supprimés:</strong> ${results.totalEffectsRemoved}</li>
                    <li>🎬 <strong>Animations supprimées:</strong> ${results.totalAnimationsRemoved}</li>
                    <li>✨ <strong>Filtres TMFX supprimés:</strong> ${results.totalFiltersRemoved}</li>
                    <li>🗑️ <strong>Total supprimé:</strong> ${totalRemoved} éléments</li>
                    ${failedCount > 0 ? `<li>❌ <strong>Échecs:</strong> ${failedCount} cible(s)</li>` : ''}
                </ul>
            </div>

            ${successCount > 0 ? `
                <div style="margin: 15px 0; padding: 10px; background: rgba(76, 175, 80, 0.1); border-radius: 5px;">
                    <h4 style="color: #388e3c; margin-top: 0;">✅ Nettoyage réussi:</h4>
                    ${results.success.map(r => `
                        <div style="margin: 3px 0; padding: 5px; background: rgba(255,255,255,0.5); border-radius: 3px;">
                            <strong>${r.name}</strong>: ${r.totalCount} éléments supprimés
                            <br><small style="color: #666;">
                                🎭 ${r.effectCount} effets • 🎬 ${r.sequencerCount} animations • ✨ ${r.tmfxCount} filtres
                            </small>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            ${failedCount > 0 ? `
                <div style="margin: 15px 0; padding: 10px; background: rgba(244, 67, 54, 0.1); border-radius: 5px;">
                    <h4 style="color: #d32f2f; margin-top: 0;">❌ Échecs${results.failed.some(f => f.partialSuccess) ? ' (avec succès partiels)' : ''}:</h4>
                    ${results.failed.map(r => `
                        <div style="margin: 3px 0;">
                            • <strong>${r.name}</strong>: ${r.error}
                            ${r.partialSuccess ? `<br><small style="color: #ff9800;">⚠️ Succès partiel: ${r.clearedCount} éléments supprimés</small>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div style="margin-top: 15px; padding: 10px; background: rgba(158, 158, 158, 0.1); border-radius: 5px; font-size: 0.9em;">
                <strong>🎯 Outil Admin:</strong> Effacement complet (effets + animations + filtres)
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
        ui.notifications.info(`✅ ${totalRemoved} éléments supprimés sur ${successCount} cible(s) ! (${results.totalEffectsRemoved} effets, ${results.totalAnimationsRemoved} animations, ${results.totalFiltersRemoved} filtres)`);
    }

    if (failedCount > 0) {
        const hasPartialSuccess = results.failed.some(f => f.partialSuccess);
        if (hasPartialSuccess) {
            ui.notifications.warn(`⚠️ Succès partiel pour ${failedCount} cible(s) - Voir les détails dans le chat.`);
        } else {
            ui.notifications.error(`❌ Échec pour ${failedCount} cible(s) - Voir les détails dans le chat.`);
        }
    }

    console.log("[ADMIN TOOL] Clear Effects Multi-Target (Comprehensive) completed:", {
        targets: selectedTargets.length,
        activeEffects: results.totalEffectsRemoved,
        sequencerAnimations: results.totalAnimationsRemoved,
        tmfxFilters: results.totalFiltersRemoved,
        totalRemoved: totalRemoved,
        success: successCount,
        failed: failedCount
    });

})();
