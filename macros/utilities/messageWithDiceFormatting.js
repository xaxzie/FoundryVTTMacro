/**
 * Message with Dice Formatting Utility
 *
 * This utility demonstrates how to create beautifully formatted chat messages
 * while preserving FoundryVTT's native animated dice rolling functionality.
 *
 * Key Pattern: Use roll.toMessage() with custom HTML in the 'flavor' parameter
 * to combine native dice animation with rich formatting in a single message.
 *
 * @author FoundryVTT Macro Development
 * @version 1.0
 */

/**
 * Creates a formatted dice roll message with custom styling
 *
 * @param {Object} options - Configuration options
 * @param {string} options.formula - Dice formula (e.g., "3d7", "2d6+5")
 * @param {string} options.title - Main title for the roll
 * @param {string} options.characterName - Name of the character rolling
 * @param {string} options.icon - Emoji icon to display (optional)
 * @param {Array<string>} options.infoLines - Additional information lines (optional)
 * @param {Object} options.speaker - FoundryVTT speaker object (optional)
 * @param {string} options.rollMode - Roll mode (optional, defaults to user setting)
 *
 * @returns {Promise<Roll>} The executed roll
 *
 * @example
 * // Simple usage
 * await createFormattedDiceMessage({
 *     formula: "4d7",
 *     title: "Test de Physique",
 *     characterName: "Héros",
 *     icon: "💪"
 * });
 *
 * @example
 * // Advanced usage with additional info
 * await createFormattedDiceMessage({
 *     formula: "3d7+2",
 *     title: "Test de Dextérité",
 *     characterName: "Archer",
 *     icon: "🎯",
 *     infoLines: [
 *         "⚠️ Ajusté pour blessures: Base 5 - 2 = 3",
 *         "Bonus de Dés: +0, Bonus Fixe: +2"
 *     ],
 *     speaker: ChatMessage.getSpeaker({ token: selectedToken })
 * });
 */
async function createFormattedDiceMessage(options) {
    const {
        formula,
        title,
        characterName,
        icon = "🎲",
        infoLines = [],
        speaker = ChatMessage.getSpeaker(),
        rollMode = game.settings.get("core", "rollMode")
    } = options;

    // Validate required parameters
    if (!formula || !title || !characterName) {
        throw new Error("formula, title, and characterName are required parameters");
    }

    // Create the roll
    const roll = new Roll(formula);

    // Build additional info section
    const additionalInfo = infoLines.length > 0
        ? `<div style="background: #f0f4ff; padding: 8px; border-radius: 4px; margin: 8px 0; border-left: 4px solid #2196f3;">
               ${infoLines.map(line => `<div style="margin: 2px 0;">${line}</div>`).join('')}
           </div>`
        : '';

    // Create the enhanced flavor with beautiful formatting
    const enhancedFlavor = `
        <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
            <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #1976d2;">
                    ${icon} ${title}
                </h3>
                <div style="margin-top: 5px;">
                    <strong>Personnage:</strong> ${characterName}
                </div>
            </div>
            ${additionalInfo}
        </div>
    `;

    // Use FoundryVTT's native dice rolling with custom formatting
    // This preserves dice animation while adding beautiful styling
    await roll.toMessage({
        speaker: speaker,
        flavor: enhancedFlavor,
        rollMode: rollMode
    });

    return roll;
}

/**
 * USAGE EXAMPLES FOR COMMON SCENARIOS
 */

// Example 1: Basic characteristic roll
async function exampleBasicRoll() {
    const roll = await createFormattedDiceMessage({
        formula: "4d7",
        title: "Test de Physique",
        characterName: "Guerrier",
        icon: "💪"
    });

    console.log(`Roll result: ${roll.total}`);
}

// Example 2: Roll with injury adjustments and bonuses
async function exampleAdvancedRoll() {
    const roll = await createFormattedDiceMessage({
        formula: "3d7+2",
        title: "Test de Dextérité",
        characterName: "Archer",
        icon: "🎯",
        infoLines: [
            "⚠️ Ajusté pour blessures: Base 5 - 2 = 3",
            "<strong>Bonus de Dés:</strong> +0 (3 + 0 = 3d7)",
            "<strong>Bonus Fixe:</strong> +2"
        ]
    });

    ui.notifications.info(`Test de Dextérité: ${roll.total} (avec ajustements)`);
}

// Example 3: Spell damage roll
async function exampleSpellDamage() {
    const caster = canvas.tokens.controlled[0];

    const roll = await createFormattedDiceMessage({
        formula: "6d7+10",
        title: "Boule de Feu",
        characterName: caster?.actor?.name || "Mage",
        icon: "🔥",
        infoLines: [
            "<strong>Type:</strong> Dégâts de feu",
            "<strong>Zone:</strong> Explosion 3m de rayon",
            "<strong>Jet de Sauvegarde:</strong> Dextérité DD 15"
        ],
        speaker: ChatMessage.getSpeaker({ token: caster })
    });
}

/**
 * KEY TECHNICAL NOTES:
 *
 * 1. SINGLE MESSAGE: Uses roll.toMessage() with custom flavor to create one unified message
 * 2. DICE ANIMATION: Preserves FoundryVTT's native dice rolling and hover effects
 * 3. CUSTOM STYLING: Rich HTML formatting in the flavor parameter
 * 4. FLEXIBILITY: Supports any dice formula and additional information
 * 5. NATIVE INTEGRATION: Works with FoundryVTT's rollMode, speaker, and chat systems
 *
 * AVOID THESE PATTERNS:
 * - Creating separate ChatMessage.create() calls (results in multiple messages)
 * - Overriding FoundryVTT's native dice display (loses animation)
 * - Complex nested message structures (can break on some systems)
 */

// Export for use in other macros (if using modules)
// globalThis.createFormattedDiceMessage = createFormattedDiceMessage;
