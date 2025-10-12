/**
 * Weather Rain Toggle - Utility Macro
 *
 * Utilise FXMaster pour contrôler les effets de pluie et brouillard sur la scène.
 * - Premier usage : Active la pluie + brouillard sur la scène
 * - Second usage : Désactive les effets si ils sont déjà actifs
 *
 * Effets appliqués :
 * - Particules de pluie (rain particle effect)
 * - Filtre de brouillard (fog filter effect)
 *
 * Dépendances :
 * - FXMaster (module requis)
 *
 * Usage : Exécuter la macro pour basculer l'état de la pluie avec brouillard
 */

(async () => {
    // ===== CONFIGURATION DES EFFETS MÉTÉO =====
    const WEATHER_CONFIG = {
        // Configuration FXMaster pour les particules de pluie
        rainParticles: {
            type: "rain",
            options: {
                scale: 1,
                direction: 75,      // Direction légèrement inclinée
                speed: 1,
                lifetime: 1,
                density: 0.5,       // Pluie modérée
                alpha: 1,
                tint: {
                    apply: false,
                    value: "#ffffff"
                }
            }
        },

        // Configuration FXMaster pour le filtre de brouillard
        fogFilter: {
            type: "fog",
            options: {
                dimensions: 1,
                speed: 1,
                density: 0.2,       // Brouillard léger
                color: {
                    apply: false,
                    value: "#000000"
                }
            }
        },

        // Messages d'interface
        messages: {
            started: "🌧️ La pluie et le brouillard commencent...",
            stopped: "☀️ La pluie et le brouillard s'arrêtent.",
            noFxmaster: "❌ FXMaster n'est pas disponible ! Veuillez installer et activer le module FXMaster.",
            error: "⚠️ Erreur lors du contrôle météorologique."
        }
    };

    // ===== VALIDATION DE FXMASTER =====

    /**
     * Vérifie si FXMaster est disponible et actif
     */
    function isFXMasterAvailable() {
        return typeof FXMASTER !== 'undefined' &&
               FXMASTER.filters &&
               typeof Hooks !== 'undefined';
    }

    if (!isFXMasterAvailable()) {
        ui.notifications.error(WEATHER_CONFIG.messages.noFxmaster);
        console.error("[Weather Rain Toggle] FXMaster module not found or not active");
        return;
    }

    // ===== GESTION DE L'ÉTAT MÉTÉOROLOGIQUE =====

    /**
     * Vérifie si les effets météo sont actuellement actifs
     * Vérifie à la fois nos flags personnalisés et les flags FXMaster
     */
    function isWeatherActive() {
        // Vérifier notre flag personnalisé
        const customFlag = canvas.scene.getFlag("world", "weatherRainToggleActive") || false;

        // Vérifier les flags FXMaster pour plus de robustesse
        const fxmasterEffects = canvas.scene.getFlag("fxmaster", "effects") || {};
        const hasFXMasterEffects = Object.keys(fxmasterEffects).length > 0;

        console.log(`[Weather Rain Toggle] State check - Custom flag: ${customFlag}, FXMaster effects: ${hasFXMasterEffects}`);

        // Considérer actif si l'un des deux est présent
        return customFlag || hasFXMasterEffects;
    }

    /**
     * Active les effets météorologiques (pluie + brouillard)
     */
    async function startWeather() {
        try {
            console.log("[Weather Rain Toggle] Starting weather effects...");

            // 1. Activer les particules de pluie via Hook (méthode validée)
            await Hooks.call('fxmaster.updateParticleEffects', [WEATHER_CONFIG.rainParticles]);
            console.log("[Weather Rain Toggle] Rain particles activated");

            // 2. Activer le filtre de brouillard via API directe (méthode validée)
            await FXMASTER.filters.setFilters([WEATHER_CONFIG.fogFilter]);
            console.log("[Weather Rain Toggle] Fog filter activated");

            // 3. Marquer l'état comme actif dans les flags de la scène
            await canvas.scene.setFlag("world", "weatherRainToggleActive", true);
            await canvas.scene.setFlag("world", "weatherRainToggleConfig", {
                rainConfig: WEATHER_CONFIG.rainParticles,
                fogConfig: WEATHER_CONFIG.fogFilter,
                activatedAt: Date.now()
            });

            ui.notifications.info(WEATHER_CONFIG.messages.started);
            console.log("[Weather Rain Toggle] Weather effects started successfully");
            return true;

        } catch (error) {
            console.error("[Weather Rain Toggle] Error starting weather:", error);
            ui.notifications.error(WEATHER_CONFIG.messages.error);
            return false;
        }
    }

    /**
     * Désactive les effets météorologiques
     * Utilise les méthodes validées pour FXMaster v6.0+ FoundryVTT v13
     */
    async function stopWeather() {
        try {
            console.log("[Weather Rain Toggle] Stopping weather effects...");

            // 1. Effacer les effets de particules FXMaster (✅ méthode validée)
            await canvas.scene.unsetFlag("fxmaster", "effects");
            console.log("[Weather Rain Toggle] Particle effects cleared via unsetFlag");

            // 2. Effacer les filtres FXMaster (✅ méthode validée)
            await FXMASTER.filters.setFilters([]);
            console.log("[Weather Rain Toggle] Filter effects cleared via API");

            // 3. Supprimer nos flags personnalisés
            await canvas.scene.unsetFlag("world", "weatherRainToggleActive");
            await canvas.scene.unsetFlag("world", "weatherRainToggleConfig");

            ui.notifications.info(WEATHER_CONFIG.messages.stopped);
            console.log("[Weather Rain Toggle] Weather effects stopped successfully");
            return true;

        } catch (error) {
            console.error("[Weather Rain Toggle] Error stopping weather:", error);
            ui.notifications.error(WEATHER_CONFIG.messages.error);
            return false;
        }
    }

    // ===== LOGIQUE PRINCIPALE DE BASCULEMENT =====

    /**
     * Bascule l'état météorologique (marche/arrêt)
     */
    async function toggleWeather() {
        const weatherActive = isWeatherActive();

        console.log(`[Weather Rain Toggle] Current weather state: ${weatherActive ? 'ACTIVE' : 'INACTIVE'}`);

        if (weatherActive) {
            // Les effets météo sont actifs, les arrêter
            return await stopWeather();
        } else {
            // Les effets météo ne sont pas actifs, les démarrer
            return await startWeather();
        }
    }

    // ===== DIALOG DE CONFIRMATION (OPTIONNEL) =====

    /**
     * Affiche un dialog de confirmation pour les actions météo
     */
    async function showWeatherDialog() {
        const weatherActive = isWeatherActive();
        const action = weatherActive ? "arrêter" : "démarrer";
        const icon = weatherActive ? "☀️" : "🌧️";
        const actionText = weatherActive ? "Arrêter la Météo" : "Activer Pluie + Brouillard";

        return new Promise((resolve) => {
            new Dialog({
                title: "🌦️ Contrôle Météorologique",
                content: `
                    <div style="padding: 15px; text-align: center;">
                        <h3 style="margin-bottom: 15px;">${icon} ${actionText}</h3>
                        <p style="margin-bottom: 20px; color: #666;">
                            ${weatherActive
                        ? "Les effets météorologiques sont actifs sur cette scène. Voulez-vous les arrêter ?"
                        : "Aucun effet météorologique n'est actif. Voulez-vous activer la pluie avec brouillard ?"
                    }
                        </p>
                        ${!weatherActive ? `
                            <div style="margin: 15px 0; padding: 10px; background: #f0f8ff; border-radius: 4px;">
                                <h4 style="margin-top: 0;">Configuration des Effets :</h4>
                                <div style="text-align: left; font-size: 0.9em;">
                                    <p><strong>🌧️ Pluie :</strong> Densité ${WEATHER_CONFIG.rainParticles.options.density * 100}%, Direction ${WEATHER_CONFIG.rainParticles.options.direction}°</p>
                                    <p><strong>🌫️ Brouillard :</strong> Densité ${WEATHER_CONFIG.fogFilter.options.density * 100}%, Vitesse ${WEATHER_CONFIG.fogFilter.options.speed}x</p>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `,
                buttons: {
                    confirm: {
                        icon: `<i class="fas ${weatherActive ? 'fa-sun' : 'fa-cloud-rain'}"></i>`,
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
                width: 450
            }).render(true);
        });
    }

    // ===== EXÉCUTION PRINCIPALE =====

    try {
        // Option 1 : Exécution directe (recommandé pour usage fréquent)
        const success = await toggleWeather();

        // Option 2 : Avec dialog de confirmation (décommentez si souhaité)
        /*
        const confirmed = await showWeatherDialog();
        if (confirmed) {
            const success = await toggleWeather();
        } else {
            ui.notifications.info("❌ Action météorologique annulée.");
        }
        */

        if (success) {
            // Optionnel : déclencher des effets sonores
            /*
            if (isWeatherActive()) {
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
        isActive: isWeatherActive,
        start: startWeather,
        stop: stopWeather,
        toggle: toggleWeather,
        config: WEATHER_CONFIG,
        showDialog: showWeatherDialog
    };

    console.log("[Weather Rain Toggle] Utility functions exported to globalThis.WeatherRainToggle");

})();
