/**
 * Chat Message Formatting Utility
 *
 * Standalone functions for creating consistent chat messages for spell results.
 * Copy these functions into your spell macros for professional output.
 *
 * Usage: Copy the needed message function(s) into your spell macro
 */

/**
 * Formats damage display section for chat messages
 * @param {Array|Object} damages - Array of damage rolls or single damage roll
 * @param {Array} targetActors - Array of target actor info objects
 * @param {string|null} stance - Current combat stance
 * @param {boolean} isHealing - Whether this is healing damage
 * @returns {string} HTML formatted damage display
 */
function formatDamageDisplay(damages, targetActors, stance = null, isHealing = false) {
    const stanceNote = stance === 'offensif' && !isHealing ? ' <em>(MAXIMISÉ)</em>' : '';
    const damageType = isHealing ? 'Soin' : 'Dégâts';
    const bgColor = isHealing ? '#d4edda' : '#f8d7da';
    const textColor = isHealing ? '#155724' : '#721c24';
    const icon = isHealing ? '💚' : '⚔️';

    // Single damage roll
    if (!Array.isArray(damages)) {
        const targetName = targetActors[0] ? targetActors[0].name : "cible";
        return `
            <div style="text-align: center; margin: 15px 0; padding: 10px; background: ${bgColor}; border-radius: 5px;">
                <h2 style="margin: 5px 0; color: ${textColor};">${icon} ${damageType} : ${damages.total}${stanceNote} <span style="font-size: 0.6em; color: #666;">(${damages.formula}: ${damages.result})</span></h2>
                <p style="margin: 5px 0;"><strong>Cible :</strong> ${targetName}</p>
            </div>
        `;
    }

    // Multiple damage rolls
    if (damages.length === 1) {
        // Single target, single damage
        const targetName = targetActors[0] ? targetActors[0].name : "cible";
        return `
            <div style="text-align: center; margin: 15px 0; padding: 10px; background: ${bgColor}; border-radius: 5px;">
                <h2 style="margin: 5px 0; color: ${textColor};">${icon} ${damageType} : ${damages[0].total}${stanceNote} <span style="font-size: 0.6em; color: #666;">(${damages[0].formula}: ${damages[0].result})</span></h2>
                <p style="margin: 5px 0;"><strong>Cible :</strong> ${targetName}</p>
            </div>
        `;
    }

    if (targetActors.length > 1 && damages.length > 1) {
        // Multiple targets, individual damages
        const targetEntries = targetActors.map((actorInfo, index) => {
            const targetName = actorInfo ? actorInfo.name : "cible";
            const damage = damages[index];
            return `<p style="margin: 5px 0;"><strong>${targetName} :</strong> ${damage.total} <span style="font-size: 0.7em; color: #666;">(${damage.formula}: ${damage.result})</span></p>`;
        }).join('');

        return `
            <div style="text-align: center; margin: 15px 0; padding: 10px; background: ${bgColor}; border-radius: 5px;">
                <h2 style="margin: 5px 0; color: ${textColor};">${icon} ${damageType}${stanceNote}</h2>
                ${targetEntries}
            </div>
        `;
    }

    // Same target, multiple damages (total)
    const totalDamage = damages.reduce((sum, dmg) => sum + dmg.total, 0);
    const targetName = targetActors[0] ? targetActors[0].name : "cible";
    const damageBreakdown = damages.map((dmg, index) =>
        `Projectile ${index + 1}: ${dmg.total} <span style="font-size: 0.9em;">(${dmg.formula}: ${dmg.result})</span>`
    ).join(' +\\n                    ');

    return `
        <div style="text-align: center; margin: 15px 0; padding: 10px; background: ${bgColor}; border-radius: 5px;">
            <h2 style="margin: 5px 0; color: ${textColor};">${icon} ${damageType} Totaux : ${totalDamage}${stanceNote}</h2>
            <p style="margin: 5px 0;"><strong>Cible :</strong> ${targetName}</p>
            <p style="margin: 5px 0; font-size: 0.8em; color: #666;">
                ${damageBreakdown}
            </p>
        </div>
    `;
}

/**
 * Formats attack resolution display for chat messages
 * @param {Object|null} attackResolution - Attack resolution info object
 * @returns {string} HTML formatted attack resolution or empty string
 */
function formatAttackResolution(attackResolution) {
    if (!attackResolution) return '';

    return `
        <div style="text-align: center; margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 5px;">
            <p style="margin: 5px 0; font-size: 0.8em; color: #666;">(${attackResolution.formula} = ${attackResolution.result})</p>
            <h2 style="margin: 5px 0; color: #d9534f;">🎯 Jet d'Attaque : ${attackResolution.total}</h2>
        </div>
    `;
}

/**
 * Formats injury information for display
 * @param {number} baseStat - Original stat value
 * @param {number} adjustedStat - Injury-adjusted stat value
 * @param {number} injuryStacks - Number of injury stacks
 * @returns {string} HTML formatted injury info or empty string
 */
function formatInjuryDisplay(baseStat, adjustedStat, injuryStacks) {
    if (injuryStacks <= 0) return '';

    return `<p><strong>⚠️ Blessures :</strong> ${injuryStacks} (Esprit réduit de ${baseStat} à ${adjustedStat})</p>`;
}

/**
 * Creates a complete spell result chat message
 * @param {Object} messageData - All message data
 * @param {Token} caster - Caster token
 * @returns {Promise<ChatMessage>} Created chat message
 */
async function createSpellResultMessage(messageData, caster) {
    const {
        spellName,
        elementName,
        manaCost,
        injuryInfo = '',
        attackResolution = null,
        damages,
        targetActors,
        stance = null,
        isHealing = false,
        elementEffect = ''
    } = messageData;

    const damageDisplay = formatDamageDisplay(damages, targetActors, stance, isHealing);
    const attackDisplay = formatAttackResolution(attackResolution);

    const chatContent = `
        <div class="spell-result">
            <h3>${spellName}${elementName ? ` - ${elementName}` : ''}</h3>
            <p><strong>Coût en Mana :</strong> ${manaCost}</p>
            ${injuryInfo}
            ${attackDisplay}
            ${damageDisplay}
            <hr>
            ${elementEffect ? `<p><strong>Effet Élémentaire :</strong> ${elementEffect}</p>` : ''}
        </div>
    `;

    return await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: chatContent,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
}

/**
 * Creates a simple spell cast notification
 * @param {Object} notificationData - Notification data
 * @returns {void} Shows UI notification
 */
function createSpellNotification(notificationData) {
    const {
        spellName,
        elementName = '',
        stance = null,
        totalDamage = 0,
        attackTotal = null,
        isHealing = false,
        isMaximized = false
    } = notificationData;

    const stanceInfo = stance ? ` (Position ${stance.charAt(0).toUpperCase() + stance.slice(1)})` : '';
    const damageType = isHealing ? 'soin' : 'dégâts totaux';
    const maximizedInfo = isMaximized ? ' MAXIMISÉ' : '';
    const attackInfo = attackTotal ? ` Jet d'attaque : ${attackTotal}.` : '';
    const elementInfo = elementName ? ` - ${elementName}` : '';

    const message = `${spellName}${elementInfo} lancé !${stanceInfo} ${totalDamage} ${damageType}${maximizedInfo} prêt.${attackInfo}`;

    ui.notifications.info(message);
}

/**
 * Formats target text for display
 * @param {Array} targetActors - Array of target actor info objects
 * @param {Array} targets - Array of target location objects
 * @param {boolean} isHealing - Whether this is a healing spell
 * @param {boolean} allowSelfTarget - Whether self-targeting was detected
 * @param {string} casterName - Name of the caster (for self-targeting)
 * @returns {string} Formatted target text
 */
function formatTargetText(targetActors, targets, isHealing = false, allowSelfTarget = false, casterName = '') {
    if (isHealing && allowSelfTarget) {
        return "auto-soin";
    }

    if (targets.length > 1) {
        const target1Name = targetActors[0] ? targetActors[0].name : "cible";
        const target2Name = targetActors[1] ? targetActors[1].name : "cible";
        return `${target1Name} et ${target2Name}`;
    } else {
        const targetName = targetActors[0] ? targetActors[0].name : "cible";
        if (targets.length === 1 && !isHealing) {
            return `${targetName} (deux projectiles)`;
        }
        return targetName;
    }
}

/**
 * Gets standard spell emoji/icon
 * @param {string} element - Element type
 * @param {boolean} isHealing - Whether this is healing
 * @returns {string} Appropriate emoji
 */
function getSpellIcon(element, isHealing = false) {
    if (isHealing) return '💚';

    const icons = {
        fire: '🔥',
        ice: '❄️',
        water: '💧',
        lightning: '⚡',
        oil: '🛢️',
        living_water: '💚'
    };

    return icons[element] || '🔮';
}

// Example usage in a spell macro:
/*
// Format and send complete spell result
const messageData = {
    spellName: "🫧 Sort de Bulles",
    elementName: getElementDisplayName(elementChoice),
    manaCost: actualManaCost,
    injuryInfo: formatInjuryDisplay(baseStat, adjustedStat, injuryStacks),
    attackResolution: attackResolution,
    damages: [damage1, damage2],
    targetActors: targetActors,
    stance: currentStance,
    isHealing: isLivingWater,
    elementEffect: getElementGameEffect(elementChoice, allowSelfTarget)
};

await createSpellResultMessage(messageData, caster);

// Send simple notification
const notificationData = {
    spellName: "Sort de Bulles",
    elementName: getElementDisplayName(elementChoice),
    stance: currentStance,
    totalDamage: totalDamage,
    attackTotal: attackResolution?.total,
    isHealing: isLivingWater,
    isMaximized: currentStance === 'offensif' && !isLivingWater
};

createSpellNotification(notificationData);
*/
