/**
 * Katana - Léo
 *
 * Nom: Katana
 * Coût : 0 mana (focalisable)
 * Niveau : 0
 * Description : Donne un coup de katana.
 * Toucher : Physique (+ effets actifs + bonus manuels d'attaque)
 * Dégâts : 1d7 + 1 + Physique + bonus manuels + bonus d'effets actifs
 * Option spéciale (désactivée par défaut) : "Fourreau de la waifu" ajoute 1d6 de dégâts
 *
 * Usage : Sélectionnez le token de Léo et lancez cette macro.
 */

(async () => {
    // ===== CONFIGURATION =====
    const SPELL = {
        name: "Katana",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 0,
        spellLevel: 0,
        baseDamageFormula: "1d7",
        flatDamageBonus: 1, // +1 fixe
        isFocusable: true,
        animations: {
            // Small default Sequencer assets (adjust to your installed JB2A/patreon paths)
            sword: "jb2a_patreon.falchion.melee.01.orange.5",
            sound: null
        }
    };

    // ===== VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILITAIRES =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e => ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase()))?.name?.toLowerCase() || null;
    }

    // Somme des bonus donnés par des Active Effects pour une clé donnée
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') total += flagValue;
        }
        return total;
    }

    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system?.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée sur la fiche de l'acteur.`);
            return null;
        }
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    const currentStance = getCurrentStance(actor);
    const charInfo = getCharacteristicValue(actor, SPELL.characteristic);
    if (!charInfo) return;

    // Calculate mana cost (focusable spells can be free in Focus stance)
    function calculateManaCost(baseCost, stance, isFocusable) {
        if (!isFocusable) return baseCost;
        if (stance === 'focus') return 0;
        return baseCost;
    }
    const actualManaCost = calculateManaCost(SPELL.manaCost, currentStance, SPELL.isFocusable);

    // ===== DIALOGUE DE CONFIGURATION =====
    async function showConfigDialog() {
        return new Promise(resolve => {
            const html = `
                <div>
                    <h3>${SPELL.name}</h3>
                    <p><strong>Coût en mana :</strong> ${actualManaCost} mana ${SPELL.isFocusable ? '(focalisable)' : ''}</p>
                    <p><strong>Caractéristique :</strong> ${SPELL.characteristicDisplay}: ${charInfo.final} ${charInfo.injuries>0 || charInfo.effectBonus!==0 ? `(${charInfo.base}${charInfo.injuries>0?` - ${charInfo.injuries} blessures`:''}${charInfo.effectBonus?` + ${charInfo.effectBonus} effets`:''})` : ''}</p>

                    <div style="margin-top:10px; padding:8px; border:1px solid #ddd; border-radius:6px; background:#fafafa;">
                        <label style="display:block; margin-bottom:6px;">Bonus d'attaque (dés d7 additionnels):
                            <input type="number" id="attackBonus" value="0" min="0" style="width:60px; margin-left:6px;">
                        </label>
                        <label style="display:block; margin-bottom:6px;">Bonus de dégâts (valeur fixe):
                            <input type="number" id="damageBonus" value="0" style="width:60px; margin-left:6px;">
                        </label>
                        <label style="display:block; margin-top:8px;">
                            <input type="checkbox" id="foureau"> Activer le "Fourreau de la waifu" (+1d6 de dégâts)
                        </label>
                        <small style="color:#666; display:block; margin-top:6px;">(Fourreau désactivé par défaut)</small>
                    </div>
                </div>
            `;

            new Dialog({
                title: `${SPELL.name} — Configuration`,
                content: html,
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: 'Lancer',
                        callback: (dlg) => {
                            const attackBonus = parseInt(dlg.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(dlg.find('#damageBonus').val()) || 0;
                            const foureau = dlg.find('#foureau')[0].checked;
                            resolve({ attackBonus, damageBonus, foureau });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: 'Annuler',
                        callback: () => resolve(null)
                    }
                },
                default: 'ok'
            }).render(true);
        });
    }

    const config = await showConfigDialog();
    if (!config) {
        ui.notifications.info('Sort annulé.');
        return;
    }
    const { attackBonus, damageBonus, foureau } = config;

    // ===== TARGETING + ANIMATION =====
    async function selectTargetWithPortal() {
        if (typeof Portal === 'undefined') {
            ui.notifications.error('Le module Portal est requis pour le ciblage.');
            return null;
        }
        try {
            const portal = new Portal()
                .origin(caster)
                .range(120)
                .color('#ffffff')
                .texture('modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_White_400x400.webm');

            const picked = await portal.pick();
            return picked;
        } catch (err) {
            console.error('Portal selection error', err);
            ui.notifications.error('Ciblage annulé ou erreur de Portal.');
            return null;
        }
    }

    const targetPoint = await selectTargetWithPortal();
    if (!targetPoint) {
        ui.notifications.info('Sort annulé (aucune cible sélectionnée).');
        return;
    }

    // Play a short Sequencer animation: sword strike from caster to target
    try {
        if (typeof Sequence !== 'undefined') {
            const seq = new Sequence();
            // sword effect from caster to target
            if (SPELL.animations.sword) {
                seq.effect()
                    .file(SPELL.animations.sword)
                    .attachTo(caster)
                    .stretchTo(targetPoint)
            }
            await seq.play();
        }
    } catch (err) {
        console.warn('Sequencer play failed', err);
    }

    // ===== DAMAGE CALCULATION WITH STANCE SYSTEM =====
    async function calculateDamage() {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = SPELL.flatDamageBonus + charInfo.final + (damageBonus || 0) + effectDamageBonus;

        if (currentStance === 'offensif') {
            // Offensive stance: main damage is maximized
            const diceMax = 7; // 1d7 maximized
            const maxDamage = diceMax + totalDamageBonus;

            console.log(`[DEBUG] Maximized damage: ${maxDamage} (${diceMax} + ${totalDamageBonus})`);

            return {
                total: maxDamage,
                formula: `${diceMax} + ${totalDamageBonus}`,
                result: maxDamage,
                isMaximized: true
            };
        } else {
            // Normal dice rolling
            const damage = new Roll(`${SPELL.baseDamageFormula} + @totalBonus`, { totalBonus: totalDamageBonus });
            await damage.evaluate({ async: true });

            console.log(`[DEBUG] Rolled damage: ${damage.total} (formula: ${damage.formula})`);
            return damage;
        }
    }

    const damageResult = await calculateDamage();

    // ===== FOURREAU CALCULATION WITH STANCE SYSTEM =====
    function calculateFourreau() {
        if (!foureau) return null;

        if (currentStance === 'offensif') {
            // Offensive stance: fourreau is also maximized
            const foureauMax = 6; // 1d6 maximized
            console.log(`[DEBUG] Maximized fourreau: ${foureauMax}`);

            return {
                total: foureauMax,
                formula: `${foureauMax}`,
                result: foureauMax,
                isMaximized: true
            };
        } else {
            // Will be rolled normally in the combined roll
            return null;
        }
    }

    const maximizedFourreau = calculateFourreau();

    // ===== COMBINED ROLL SYSTEM WITH STANCE SUPPORT =====
    const totalAttackDice = charInfo.final + (attackBonus || 0);
    const levelBonus = 2 * SPELL.spellLevel; // level 0 -> 0

    // Build combined roll formula
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = SPELL.flatDamageBonus + charInfo.final + (damageBonus || 0) + effectDamageBonus;
        combinedRollParts.push(`${SPELL.baseDamageFormula} + ${totalDamageBonus}`);
    }

    // Add fourreau roll if enabled (never maximized)
    if (foureau) {
        combinedRollParts.push('1d6');
    }

    // Create and evaluate combined roll
    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;
    let foureauResult = null;

    if (currentStance !== 'offensif') {
        const damageRollResult = combinedRoll.terms[0].results[1];
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = SPELL.flatDamageBonus + charInfo.final + (damageBonus || 0) + effectDamageBonus;
        const damageFormulaString = `${SPELL.baseDamageFormula} + ${totalDamageBonus}`;
        finalDamageResult = {
            total: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null),
            formula: damageFormulaString,
            result: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null)
        };

        // Fourreau result extraction (if enabled)
        if (foureau) {
            foureauResult = combinedRoll.terms[0].results[2];
        }
    } else {
        // In offensive stance, fourreau is the second result (if enabled)
        if (foureau) {
            foureauResult = combinedRoll.terms[0].results[1];
        }
    }

    // Calculate total damage including maximized fourreau if applicable
    let foureauDamage = 0;
    if (foureau) {
        if (currentStance === 'offensif') {
            // Use maximized fourreau value
            foureauDamage = maximizedFourreau.total;
        } else {
            // Use rolled fourreau value
            foureauDamage = foureauResult ? foureauResult.result : 0;
        }
    }
    const totalDamage = finalDamageResult.total + foureauDamage;

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? '0 mana (Focus possible)' : `${actualManaCost} mana`;
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');

        const injuryInfo = charInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${charInfo.base} - ${charInfo.injuries} = ${charInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = (charInfo.effectBonus !== 0 || effectDamageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${charInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${SPELL.characteristicDisplay}: +${charInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 ? `<div>🗡️ Bonus de Dégâts: +${effectDamageBonus}</div>` : ''}
            </div>` : '';

        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` : '';

        const foureauInfo = foureau ?
            `<div style="color: #9c27b0; font-size: 0.9em; margin: 5px 0;">
                <div>💖 Fourreau de la waifu activé: +${foureauDamage} dégâts${currentStance === 'offensif' ? ' (MAXIMISÉ)' : ''}</div>
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>🗡️ ${SPELL.name}${stanceNote}</strong></div>
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${totalDamage}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                    (${SPELL.baseDamageFormula} + ${SPELL.flatDamageBonus} + ${SPELL.characteristicDisplay} + bonus${foureau ? ' + fourreau' : ''})
                </div>
                <div style="font-size: 0.8em; color: #666;">
                    Base: ${finalDamageResult.total}${foureau ? ` + Fourreau: ${foureauDamage}` : ''}
                </div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f5f5f5, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #8b4513; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">🗡️ ${SPELL.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${foureauInfo}
                ${attackDisplay}
                ${damageDisplay}
            </div>
        `;
    }

    // Send the combined roll to chat
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

    ui.notifications.info(`🗡️ ${SPELL.name} lancé !${stanceInfo} Attaque: ${attackResult.result}, Dégâts: ${totalDamage}${maximizedInfo}.`);

})();
