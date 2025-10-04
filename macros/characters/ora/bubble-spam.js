/**
 * Bubble Spam - Ora's Rapid Fire Utility
 *
 * Ora lance des bulles d'eau en continu avec un simple clic. Utilitaire pour tir rapide sans dialogs.
 *
 * - Coût : Aucun (mode utilitaire)
 * - Caractéristique : Aucune (mode visuel seulement)
 * - Dégâts : Aucun (effet visuel uniquement)
 * - Cible : Clic n'importe où sur la carte
 * - Contrôles : Clic pour tirer, ESC pour quitter
 *
 * Animations :
 * - Projectile : jb2a.bullet.03.blue (du lanceur vers le point cliqué)
 * - Impact : jb2a.explosion.04.blue
 * - Durée : Immédiate (non-bloquant pour tir rapide)
 *
 * Usage : sélectionner le token d'Ora, lancer la macro, cliquer pour tirer, ESC pour arrêter.
 */

(async () => {
    // ===== CONFIGURATION DE L'UTILITAIRE =====
    const SPAM_CONFIG = {
        name: "Bubble Spam",
        mode: "utility", // Mode utilitaire - pas de règles RPG

        animations: {
            projectile: "jb2a.bullet.03.blue",
            impact: "jb2a.explosion.04.blue",
            projectileScale: 0.8,
            impactScale: 0.6,
            projectileDuration: 1000,
            impactDuration: 800,
            impactDelay: -200 // Début de l'impact 200ms avant la fin du projectile
        },

        targeting: {
            mode: "click", // Mode clic direct
            range: null // Portée illimitée
        },

        controls: {
            fireKey: "click",
            exitKey: "Escape"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton d'Ora !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    if (!caster) {
        ui.notifications.error("Aucun token valide trouvé !");
        return;
    }

    // ===== FONCTIONS UTILITAIRES =====
    function convertCanvasToWorld(clientX, clientY) {
        // Convertir les coordonnées de l'écran vers les coordonnées du monde
        const rect = canvas.app.view.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        return canvas.stage.toLocal({ x, y });
    }

    function createBubbleAnimation(targetLocation) {
        // Créer l'animation de bulle non-bloquante pour le tir rapide
        let bubbleSequence = new Sequence();

        // Projectile de bulle du lanceur vers la cible
        bubbleSequence.effect()
            .file(SPAM_CONFIG.animations.projectile)
            .atLocation(caster)
            .stretchTo(targetLocation)
            .scale(SPAM_CONFIG.animations.projectileScale)
            .duration(SPAM_CONFIG.animations.projectileDuration)
            .waitUntilFinished(SPAM_CONFIG.animations.impactDelay);

        // Impact/explosion de bulle à la cible
        bubbleSequence.effect()
            .file(SPAM_CONFIG.animations.impact)
            .atLocation(targetLocation)
            .scale(SPAM_CONFIG.animations.impactScale)
            .duration(SPAM_CONFIG.animations.impactDuration);

        // Jouer l'animation (non-bloquant pour permettre le tir rapide)
        return bubbleSequence.play();
    }

    // ===== GESTIONNAIRES D'ÉVÉNEMENTS =====
    let isSpamActive = true;

    function handleBubbleShoot(event) {
        if (!isSpamActive) return;

        // Obtenir les coordonnées du clic
        const worldCoords = convertCanvasToWorld(event.clientX, event.clientY);

        // Créer et jouer l'animation de bulle
        createBubbleAnimation(worldCoords);
    }

    function handleSpamExit(event) {
        if (event.key === SPAM_CONFIG.controls.exitKey) {
            isSpamActive = false;

            // Nettoyer les gestionnaires d'événements
            canvas.app.view.removeEventListener('click', handleBubbleShoot);
            document.removeEventListener('keydown', handleSpamExit);

            ui.notifications.info(`${SPAM_CONFIG.name} désactivé.`);
        }
    }

    // ===== ACTIVATION DU MODE SPAM =====
    // Ajouter les gestionnaires d'événements
    canvas.app.view.addEventListener('click', handleBubbleShoot);
    document.addEventListener('keydown', handleSpamExit);

    // Notification d'activation
    ui.notifications.info(`${SPAM_CONFIG.name} activé ! Cliquez n'importe où pour tirer des bulles. ${SPAM_CONFIG.controls.exitKey} pour quitter.`);

    console.log(`[${SPAM_CONFIG.name}] Mode utilitaire activé pour ${caster.name}`);

})();
