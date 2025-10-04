/**
 * Tourbillon Destroyer - Ora's Vortex Removal Utility
 *
 * Ora détruit le tourbillon le plus proche de la position ciblée. Utilitaire pour gérer les tourbillons persistants.
 *
 * - Coût : Aucun (mode utilitaire)
 * - Caractéristique : Aucune (mode utilitaire)
 * - Dégâts : Aucun (destruction d'effet)
 * - Cible : Tourbillon existant via Portal
 * - Effet : Supprime l'effet Sequencer persistant le plus proche
 *
 * Détection :
 * - Recherche les effets nommés 'tourbillon_*' dans un rayon de 1.5 cases
 * - Sélectionne automatiquement le plus proche
 * - Suppression immédiate avec animation de destruction
 *
 * Animations :
 * - Destruction : animated-spell-effects-cartoon.water.water splash.01
 * - Suppression : Utilise le fadeOut configuré lors de la création (3s)
 *
 * Usage : lancer la macro, cibler près d'un tourbillon existant.
 */

(async () => {
    // ===== CONFIGURATION DE L'UTILITAIRE =====
    const DESTROY_CONFIG = {
        name: "Tourbillon Destroyer",
        mode: "utility", // Mode utilitaire - pas de règles RPG

        detection: {
            tolerance: canvas.grid.size * 1.5, // 1.5 cases de tolérance
            effectNamePattern: "tourbillon", // Motif pour détecter les tourbillons
            maxSearchResults: 10 // Limite de recherche pour performance
        },

        animations: {
            destruction: "animated-spell-effects-cartoon.water.water splash.01",
            destructionScale: 0.6,
            destructionPlacement: "belowTokens"
        },

        targeting: {
            range: 200, // Large portée pour faciliter la destruction
            color: "#ff4444", // Rouge pour indiquer destruction
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
        },

        feedback: {
            showNotifications: false, // Pas de notifications (silencieux)
            logToConsole: true // Log pour debug
        }
    };

    // ===== FONCTIONS UTILITAIRES =====
    function findNearbyVortexEffects(selectedPosition) {
        // Trouver tous les effets actifs de Sequencer
        const activeEffects = Sequencer.EffectManager.effects;
        let nearbyVortices = [];

        activeEffects.forEach((effect, id) => {
            // Vérifier si c'est un effet de tourbillon
            if (effect.data.name && effect.data.name.includes(DESTROY_CONFIG.detection.effectNamePattern)) {
                const effectPos = effect.position;
                if (effectPos) {
                    const distance = Math.sqrt(
                        Math.pow(effectPos.x - selectedPosition.x, 2) +
                        Math.pow(effectPos.y - selectedPosition.y, 2)
                    );

                    if (distance <= DESTROY_CONFIG.detection.tolerance) {
                        nearbyVortices.push({
                            id: id,
                            effect: effect,
                            distance: distance,
                            position: effectPos,
                            name: effect.data.name
                        });
                    }
                }
            }
        });

        // Trier par distance et limiter les résultats
        nearbyVortices.sort((a, b) => a.distance - b.distance);
        return nearbyVortices.slice(0, DESTROY_CONFIG.detection.maxSearchResults);
    }

    async function playDestructionAnimation(position) {
        // Créer et jouer l'animation de destruction
        let destructionSequence = new Sequence();

        destructionSequence.effect()
            .file(DESTROY_CONFIG.animations.destruction)
            .atLocation(position)
            .scale(DESTROY_CONFIG.animations.destructionScale)
            .belowTokens();

        return destructionSequence.play();
    }

    async function destroyVortexEffect(vortexData) {
        try {
            // Jouer l'animation de destruction d'abord
            await playDestructionAnimation(vortexData.position);

            // Supprimer l'effet persistant (utilise le fadeOut configuré à la création)
            await Sequencer.EffectManager.endEffects({ name: vortexData.name });

            if (DESTROY_CONFIG.feedback.logToConsole) {
                console.log(`[${DESTROY_CONFIG.name}] Tourbillon détruit: ${vortexData.name} à distance ${vortexData.distance.toFixed(1)}`);
            }

            return true;
        } catch (error) {
            if (DESTROY_CONFIG.feedback.logToConsole) {
                console.error(`[${DESTROY_CONFIG.name}] Erreur lors de la suppression:`, error);
            }
            return false;
        }
    }

    // ===== TARGETING via Portal =====
    async function selectVortexTarget() {
        try {
            const portal = new Portal()
                .range(DESTROY_CONFIG.targeting.range)
                .color(DESTROY_CONFIG.targeting.color)
                .texture(DESTROY_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target ? { x: target.x, y: target.y } : null;
        } catch (error) {
            if (DESTROY_CONFIG.feedback.showNotifications) {
                ui.notifications.error("Erreur: Module Portal requis pour le ciblage.");
            }
            if (DESTROY_CONFIG.feedback.logToConsole) {
                console.error(`[${DESTROY_CONFIG.name}] Erreur Portal:`, error);
            }
            return null;
        }
    }

    // ===== PROCESSUS PRINCIPAL =====
    // Ciblage de la position
    const selectedPosition = await selectVortexTarget();
    if (!selectedPosition) {
        // Annulation silencieuse si pas de cible
        return;
    }

    if (DESTROY_CONFIG.feedback.logToConsole) {
        console.log(`[${DESTROY_CONFIG.name}] Position sélectionnée: x=${selectedPosition.x}, y=${selectedPosition.y}`);
    }

    // Recherche des tourbillons à proximité
    const nearbyVortices = findNearbyVortexEffects(selectedPosition);

    if (nearbyVortices.length === 0) {
        if (DESTROY_CONFIG.feedback.logToConsole) {
            console.log(`[${DESTROY_CONFIG.name}] Aucun tourbillon trouvé dans la zone de tolérance`);
        }
        // Échec silencieux si pas de tourbillon
        return;
    }

    if (DESTROY_CONFIG.feedback.logToConsole) {
        console.log(`[${DESTROY_CONFIG.name}] ${nearbyVortices.length} tourbillon(s) trouvé(s) à proximité`);
    }

    // Sélectionner le tourbillon le plus proche
    const closestVortex = nearbyVortices[0];

    if (DESTROY_CONFIG.feedback.logToConsole) {
        console.log(`[${DESTROY_CONFIG.name}] Destruction du tourbillon le plus proche: ${closestVortex.name} (distance: ${closestVortex.distance.toFixed(1)})`);
    }

    // Détruire le tourbillon
    const success = await destroyVortexEffect(closestVortex);

    if (success && DESTROY_CONFIG.feedback.showNotifications) {
        ui.notifications.info(`${DESTROY_CONFIG.name}: Tourbillon détruit.`);
    }

})();
