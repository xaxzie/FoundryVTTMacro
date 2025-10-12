/**
 * Weather Rain Toggle - Utility Macro
 *
 * Utilise FXMaster pour contrôler les effets de pluie sur la scène.
 * - Premier usage : Active la pluie sur la scène
 * - Second usage : Désactive la pluie si elle est déjà active
 *
 * Dépendances :
 * - FXMaster (module requis)
 *
 * Usage : Exécuter la macro pour basculer l'état de la pluie
 */

(async () => {
    // ===== CONFIGURATION DE LA PLUIE =====
    const RAIN_CONFIG = {
        // Identifiant unique pour l'effet de pluie
        effectId: "weather-rain-toggle",

        // Configuration FXMaster pour la pluie
        fxmasterConfig: {
            type: "rain",
            density: 0.3,        // Densité de la pluie (0.1 = légère, 0.5 = forte)
            speed: 1.2,          // Vitesse de chute des gouttes
            scale: 1.0,          // Taille des gouttes
            direction: 0,        // Direction (0 = vertical)
            tint: "#87CEEB",     // Teinte bleu ciel
            alpha: 0.8           // Transparence
        },

        // Messages d'interface
        messages: {
            started: "🌧️ La pluie commence à tomber...",
            stopped: "☀️ La pluie s'arrête.",
            noFxmaster: "❌ FXMaster n'est pas disponible ! Veuillez installer et activer le module FXMaster.",
            error: "⚠️ Erreur lors du contrôle de la pluie."
        }
    };

    // ===== VALIDATION DE FXMASTER =====

    /**
     * Vérifie si FXMaster est disponible et actif
     */
    function isFXMasterAvailable() {
        return typeof FXMASTER !== 'undefined' && FXMASTER.filters;
    }

    if (!isFXMasterAvailable()) {
        ui.notifications.error(RAIN_CONFIG.messages.noFxmaster);
        console.error("[Weather Rain Toggle] FXMaster module not found or not active");
        return;
    }

    // ===== GESTION DE L'ÉTAT DE LA PLUIE =====

    /**
     * Vérifie si l'effet de pluie est actuellement actif
     */
    function isRainActive() {
        // Vérifier si l'effet existe dans les filtres FXMaster de la scène
        const sceneFilters = canvas.scene.getFlag("fxmaster", "effects") || {};
        return !!sceneFilters[RAIN_CONFIG.effectId];
    }

    /**
     * Active l'effet de pluie sur la scène
     */
    async function startRain() {
        try {
            // Préparer les données d'effet pour FXMaster
            const effectData = {
                [RAIN_CONFIG.effectId]: {
                    type: "weather",
                    options: {
                        ...RAIN_CONFIG.fxmasterConfig,
                        enabled: true
                    }
                }
            };

            // Déclencher le hook FXMaster pour mettre à jour les effets de particules
            await Hooks.call("fxmaster.updateParticleEffects", {
                sceneId: canvas.scene.id,
                effects: effectData
            });

            // Alternative si le hook ne fonctionne pas : utiliser l'API directe
            if (FXMASTER && FXMASTER.addEffect) {
                await FXMASTER.addEffect({
                    scene: canvas.scene,
                    name: RAIN_CONFIG.effectId,
                    type: RAIN_CONFIG.fxmasterConfig.type,
                    options: RAIN_CONFIG.fxmasterConfig
                });
            }

            // Sauvegarder l'état dans les flags de la scène
            await canvas.scene.setFlag("fxmaster", `effects.${RAIN_CONFIG.effectId}`, {
                type: "weather",
                config: RAIN_CONFIG.fxmasterConfig,
                active: true,
                createdAt: Date.now()
            });

            ui.notifications.info(RAIN_CONFIG.messages.started);
            console.log("[Weather Rain Toggle] Rain effect started");
            return true;

        } catch (error) {
            console.error("[Weather Rain Toggle] Error starting rain:", error);
            ui.notifications.error(RAIN_CONFIG.messages.error);
            return false;
        }
    }

    /**
     * Désactive l'effet de pluie sur la scène
     */
    async function stopRain() {
        try {
            // Déclencher le hook FXMaster pour supprimer l'effet
            await Hooks.call("fxmaster.updateParticleEffects", {
                sceneId: canvas.scene.id,
                effects: {
                    [RAIN_CONFIG.effectId]: null // null = supprimer l'effet
                }
            });

            // Alternative si le hook ne fonctionne pas : utiliser l'API directe
            if (FXMASTER && FXMASTER.removeEffect) {
                await FXMASTER.removeEffect({
                    scene: canvas.scene,
                    name: RAIN_CONFIG.effectId
                });
            }

            // Supprimer le flag de la scène
            await canvas.scene.unsetFlag("fxmaster", `effects.${RAIN_CONFIG.effectId}`);

            ui.notifications.info(RAIN_CONFIG.messages.stopped);
            console.log("[Weather Rain Toggle] Rain effect stopped");
            return true;

        } catch (error) {
            console.error("[Weather Rain Toggle] Error stopping rain:", error);
            ui.notifications.error(RAIN_CONFIG.messages.error);
            return false;
        }
    }

    // ===== LOGIQUE PRINCIPALE DE BASCULEMENT =====

    /**
     * Bascule l'état de la pluie (marche/arrêt)
     */
    async function toggleRain() {
        const rainActive = isRainActive();

        console.log(`[Weather Rain Toggle] Current rain state: ${rainActive ? 'ACTIVE' : 'INACTIVE'}`);

        if (rainActive) {
            // La pluie est active, l'arrêter
            return await stopRain();
        } else {
            // La pluie n'est pas active, la démarrer
            return await startRain();
        }
    }

    // ===== DIALOG DE CONFIRMATION (OPTIONNEL) =====

    /**
     * Affiche un dialog de confirmation pour les actions météo
     */
    async function showWeatherDialog() {
        const rainActive = isRainActive();
        const action = rainActive ? "arrêter" : "démarrer";
        const icon = rainActive ? "☀️" : "🌧️";
        const actionText = rainActive ? "Arrêter la Pluie" : "Faire Pleuvoir";

        return new Promise((resolve) => {
            new Dialog({
                title: "🌦️ Contrôle Météorologique",
                content: `
                    <div style="padding: 15px; text-align: center;">
                        <h3 style="margin-bottom: 15px;">${icon} ${actionText}</h3>
                        <p style="margin-bottom: 20px; color: #666;">
                            ${rainActive
                        ? "La pluie tombe actuellement sur cette scène. Voulez-vous l'arrêter ?"
                        : "Aucune pluie n'est active. Voulez-vous faire pleuvoir ?"
                    }
                        </p>
                        ${!rainActive ? `
                            <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                                <h4 style="margin-top: 0;">Configuration de la Pluie :</h4>
                                <div style="text-align: left; font-size: 0.9em;">
                                    <p><strong>Densité :</strong> ${RAIN_CONFIG.fxmasterConfig.density * 100}%</p>
                                    <p><strong>Vitesse :</strong> ${RAIN_CONFIG.fxmasterConfig.speed}x</p>
                                    <p><strong>Teinte :</strong> ${RAIN_CONFIG.fxmasterConfig.tint}</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `,
                buttons: {
                    confirm: {
                        icon: `<i class="fas ${rainActive ? 'fa-sun' : 'fa-cloud-rain'}"></i>`,
                        label: actionText,
                        callback: () => resolve(true)
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(false)
                    }
                },
                default: "confirm",
                close: () => resolve(false)
            }, {
                width: 400
            }).render(true);
        });
    }

    // ===== EXÉCUTION PRINCIPALE =====

    try {
        // Option 1 : Exécution directe (recommandé pour usage fréquent)
        const success = await toggleRain();

        // Option 2 : Avec dialog de confirmation (décommentez si souhaité)
        /*
        const confirmed = await showWeatherDialog();
        if (confirmed) {
            const success = await toggleRain();
        } else {
            ui.notifications.info("❌ Action météorologique annulée.");
        }
        */

        if (success) {
            // Optionnel : déclencher des effets sonores
            /*
            if (isRainActive()) {
                // Jouer un son de pluie
                AudioHelper.play({src: "sounds/environment/rain-ambient.ogg", volume: 0.3, loop: true});
            }
            */
        }

    } catch (error) {
        console.error("[Weather Rain Toggle] Unexpected error:", error);
        ui.notifications.error("⚠️ Erreur inattendue lors du contrôle météorologique.");
    }

    // ===== FONCTIONS UTILITAIRES EXPORTÉES =====

    /**
     * Fonctions utilitaires disponibles pour d'autres macros
     */
    globalThis.WeatherRainToggle = {
        isActive: isRainActive,
        start: startRain,
        stop: stopRain,
        toggle: toggleRain,
        config: RAIN_CONFIG
    };

    console.log("[Weather Rain Toggle] Utility functions exported to globalThis.WeatherRainToggle");

})();
