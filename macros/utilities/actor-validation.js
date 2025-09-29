/**
 * Actor Validation Utility
 *
 * Standalone utility functions for validating caster selection and actor requirements.
 * Copy these functions into your spell macros for consistent validation.
 *
 * Usage: Copy the needed validation function(s) into your spell macro
 */

/**
 * Validates basic caster requirements
 * @returns {Object|null} Returns { caster, actor } if valid, null if invalid
 */
function validateCaster() {
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de votre personnage !");
        return null;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return null;
    }

    return { caster, actor };
}

/**
 * Simple validation for spell casting requirements
 * @returns {Object|null} Returns caster and actor if valid, shows error and returns null if invalid
 */
function validateSpellCaster() {
    // Check token selection
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de votre personnage !");
        return null;
    }

    const caster = canvas.tokens.controlled[0];

    // Check if token has an associated actor
    if (!caster.actor) {
        ui.notifications.error("Le jeton sélectionné n'a pas d'acteur associé !");
        return null;
    }

    return {
        caster: caster,
        actor: caster.actor
    };
}

/**
 * Validates that the actor has required attributes (Esprit, etc.)
 * @param {Actor} actor - The actor to validate
 * @returns {boolean} True if actor has required attributes, false otherwise
 */
function validateActorAttributes(actor) {
    if (!actor.system.attributes) {
        ui.notifications.error("Les attributs de l'acteur ne sont pas configurés ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.");
        return false;
    }

    return true;
}

/**
 * Complete validation for spell casting with attribute check
 * @returns {Object|null} Returns { caster, actor } if all validations pass, null otherwise
 */
function validateSpellCasterWithAttributes() {
    const validation = validateSpellCaster();
    if (!validation) return null;

    const { caster, actor } = validation;

    if (!validateActorAttributes(actor)) {
        return null;
    }

    return { caster, actor };
}

// Example usage in a spell macro:
/*
const validation = validateSpellCasterWithAttributes();
if (!validation) return;

const { caster, actor } = validation;
// Continue with spell logic...
*/
