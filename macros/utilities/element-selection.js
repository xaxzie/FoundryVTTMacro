/**
 * Element Selection Dialog Utility
 *
 * Standalone functions for creating element selection dialogs in spells.
 * Copy these functions into your spell macros for consistent element selection.
 *
 * Usage: Copy the needed dialog function(s) into your spell macro
 */

/**
 * Creates a basic element selection dialog
 * @param {string|null} stance - Current combat stance for display
 * @param {string} manaCostInfo - Mana cost information string
 * @param {Array} elements - Array of element objects with value, name, and description
 * @returns {Promise<string|null>} Selected element value or null if cancelled
 */
async function createElementSelectionDialog(stance, manaCostInfo, elements) {
    const stanceDisplay = stance ? ` (Position: ${stance.charAt(0).toUpperCase() + stance.slice(1)})` : '';

    // Generate radio button HTML
    const elementRadios = elements.map((element, index) => {
        const checked = index === 0 ? 'checked' : '';
        return `<label><input type="radio" name="element" value="${element.value}" ${checked}>
                    <strong>${element.name}</strong> - ${element.description}</label><br>`;
    }).join('');

    const elementChoice = await new Promise((resolve) => {
        new Dialog({
            title: `Choisir un Élément${stanceDisplay}`,
            content: `
                <h3>Sélectionnez l'élément :</h3>
                <p>${manaCostInfo}</p>
                <div style="margin: 10px 0;">
                    ${elementRadios}
                </div>
            `,
            buttons: {
                confirm: {
                    label: "Confirmer",
                    callback: (html) => {
                        const element = html.find('input[name="element"]:checked').val();
                        resolve(element);
                    }
                },
                cancel: {
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            }
        }).render(true);
    });

    return elementChoice;
}

/**
 * Creates element selection for bubbles-style spells
 * @param {string|null} stance - Current combat stance
 * @param {string} manaCostInfo - Mana cost information string
 * @returns {Promise<string|null>} Selected element or null if cancelled
 */
async function createBubblesElementDialog(stance, manaCostInfo) {
    const elements = [
        {
            value: "water",
            name: "Eau",
            description: "Augmente les futurs dégâts électriques (2 projectiles)"
        },
        {
            value: "ice",
            name: "Glace",
            description: "Diminue la vitesse de la cible de 1 case (2 projectiles)"
        },
        {
            value: "oil",
            name: "Huile",
            description: "Augmente les futurs dégâts de feu (2 projectiles)"
        },
        {
            value: "living_water",
            name: "Eau Vivante",
            description: "Soigne la cible (1 projectile, peut se cibler soi-même, NON focalisable)"
        }
    ];

    return await createElementSelectionDialog(stance, manaCostInfo, elements);
}

/**
 * Creates element selection for basic elemental spells
 * @param {string|null} stance - Current combat stance
 * @param {string} manaCostInfo - Mana cost information string
 * @returns {Promise<string|null>} Selected element or null if cancelled
 */
async function createBasicElementDialog(stance, manaCostInfo) {
    const elements = [
        {
            value: "fire",
            name: "Feu",
            description: "Dégâts élémentaires de feu"
        },
        {
            value: "ice",
            name: "Glace",
            description: "Dégâts élémentaires de glace"
        },
        {
            value: "lightning",
            name: "Foudre",
            description: "Dégâts élémentaires de foudre"
        },
        {
            value: "water",
            name: "Eau",
            description: "Dégâts élémentaires d'eau"
        }
    ];

    return await createElementSelectionDialog(stance, manaCostInfo, elements);
}

/**
 * Creates a healing vs damage type selection
 * @param {string|null} stance - Current combat stance
 * @param {string} manaCostInfo - Mana cost information string
 * @returns {Promise<string|null>} Selected type or null if cancelled
 */
async function createHealingDamageDialog(stance, manaCostInfo) {
    const types = [
        {
            value: "damage",
            name: "Dégâts",
            description: "Inflige des dégâts à la cible"
        },
        {
            value: "healing",
            name: "Soin",
            description: "Restaure les points de vie de la cible"
        }
    ];

    return await createElementSelectionDialog(stance, manaCostInfo, types);
}

/**
 * Gets element-specific effect properties
 * @param {string} element - The selected element
 * @returns {Object} Effect properties for the element
 */
function getElementEffectProperties(element) {
    const elementProperties = {
        water: {
            effectFile: "jb2a.bullet.03.blue",
            explosionFile: "jb2a.explosion.04.blue",
            effectColor: "blue",
            description: "Eau (+Dégâts électriques)"
        },
        ice: {
            effectFile: "jb2a.bullet.03.blue",
            explosionFile: "jb2a.explosion.02.blue",
            effectColor: "blue",
            description: "Glace (Vitesse -1 case)"
        },
        oil: {
            effectFile: "jb2a.explosion.03.blueyellow",
            explosionFile: "jb2a.explosion.03.orange",
            effectColor: "orange",
            description: "Huile (+Dégâts de feu)"
        },
        living_water: {
            effectFile: "jb2a.healing_generic.burst.greenorange",
            explosionFile: null,
            effectColor: "green",
            description: "Eau Vivante (Soin)"
        },
        fire: {
            effectFile: "jb2a.fire_bolt.orange",
            explosionFile: "jb2a.fireball.explosion.orange",
            effectColor: "orange",
            description: "Feu"
        },
        lightning: {
            effectFile: "jb2a.lightning_bolt.narrow.blue",
            explosionFile: "jb2a.static_electricity.03.blue",
            effectColor: "blue",
            description: "Foudre"
        }
    };

    return elementProperties[element] || {
        effectFile: "jb2a.explosion.01.blue",
        explosionFile: "jb2a.explosion.01.blue",
        effectColor: "blue",
        description: "Élément Inconnu"
    };
}

/**
 * Gets element-specific game effect description
 * @param {string} element - The selected element
 * @param {boolean} allowSelfTarget - Whether self-targeting was allowed
 * @returns {string} Game effect description
 */
function getElementGameEffect(element, allowSelfTarget = false) {
    const effects = {
        water: "La cible prend +2 dégâts de la prochaine attaque électrique",
        ice: "Vitesse de la cible réduite de 1 case pour le prochain mouvement",
        oil: "La cible prend +2 dégâts de la prochaine attaque de feu",
        living_water: allowSelfTarget ? "Auto-soin a restauré la vitalité" : "Cible soignée et restaurée",
        fire: "La cible subit des dégâts de feu",
        lightning: "La cible subit des dégâts de foudre",
        damage: "La cible subit des dégâts",
        healing: "La cible récupère des points de vie"
    };

    return effects[element] || "Effet élémentaire inconnu";
}

/**
 * Gets display name for element
 * @param {string} element - The element value
 * @returns {string} Formatted element name
 */
function getElementDisplayName(element) {
    const names = {
        water: "Eau",
        ice: "Glace",
        oil: "Huile",
        living_water: "Eau Vivante",
        fire: "Feu",
        lightning: "Foudre",
        damage: "Dégâts",
        healing: "Soin"
    };

    return names[element] || "Élément";
}

// Example usage in a spell macro:
/*
const { caster, actor } = validateSpellCaster();
const { stance } = getStanceInfo(actor);
const manaCostInfo = calculateStanceManaCost(stance, 4, true);

// Bubbles-style element selection
const element = await createBubblesElementDialog(stance, manaCostInfo.description);
if (!element) {
    ui.notifications.info("Sort annulé.");
    return;
}

// Get element properties for animation
const elementProps = getElementEffectProperties(element);
console.log(`Using effect: ${elementProps.effectFile}`);

// Get game effect description
const effectDescription = getElementGameEffect(element);
console.log(`Effect: ${effectDescription}`);

// Get display name
const elementName = getElementDisplayName(element);
console.log(`Element: ${elementName}`);
*/
