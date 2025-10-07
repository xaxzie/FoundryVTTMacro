/**
 * Coup de Poêle - Aloha
 *
 * Nom: Coup de Poêle
 * Coût : 0 mana (focalisable)
 * Niveau : 0
 * Description : Aloha donne un coup de sa poêle chaude.
 * Toucher : Physique (+ effets actifs + bonus manuels d'attaque)
 * Dégâts : 1d4 + Physique/2 + bonus manuels + bonus d'effets actifs
 *
 * Usage : Sélectionnez le token d'Aloha et lancez cette macro.
 */

(async () => {
    // ===== CONFIGURATION =====
    const SPELL = {
        name: "Coup de Poêle",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 0,
        spellLevel: 0,
        baseDamageFormula: "1d4",
        physiqueDivisor: 2, // Physique/2 pour les dégâts
        isFocusable: true,
        animations: {
            // Pan/hammer strike animation - adjust to your installed JB2A paths
            pan: "jb2a.melee_generic.blunt.one_handed.01.orange",
            sound: null
        }
    };

    // ===== VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton d'Aloha !");
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

    // Calculate Physique/2 bonus for damage
    const physiqueBonus = Math.floor(charInfo.final / SPELL.physiqueDivisor);

    // ===== DIALOGUE DE CONFIGURATION =====
    async function showConfigDialog() {
        return new Promise(resolve => {
            const html = `
                <div>
                    <h3>${SPELL.name}</h3>
                    <p><strong>Coût en mana :</strong> ${actualManaCost} mana ${SPELL.isFocusable ? '(focalisable)' : ''}</p>
                    <p><strong>Caractéristique :</strong> ${SPELL.characteristicDisplay}: ${charInfo.final} ${charInfo.injuries > 0 || charInfo.effectBonus !== 0 ? `(${charInfo.base}${charInfo.injuries > 0 ? ` - ${charInfo.injuries} blessures` : ''}${charInfo.effectBonus ? ` + ${charInfo.effectBonus} effets` : ''})` : ''}</p>
                    <p><strong>Bonus de dégâts (Physique/2) :</strong> +${physiqueBonus}</p>

                    <div style="margin-top:10px; padding:8px; border:1px solid #ddd; border-radius:6px; background:#fafafa;">
                        <label style="display:block; margin-bottom:6px;">Bonus d'attaque (dés d7 additionnels):
                            <input type="number" id="attackBonus" value="0" min="0" style="width:60px; margin-left:6px;">
                        </label>
                        <label style="display:block; margin-bottom:6px;">Bonus de dégâts (valeur fixe):
                            <input type="number" id="damageBonus" value="0" style="width:60px; margin-left:6px;">
                        </label>
                    </div>

                    <div style="margin-top:10px; padding:8px; border:1px solid #ff5722; border-radius:6px; background:#fff3e0;">
                        <p><strong>🍳 Description :</strong> Aloha frappe avec sa poêle chaude, utilisant sa force physique pour infliger des dégâts contondants.</p>
                        <p><strong>🔥 Effet thermique :</strong> La poêle chaude peut causer des brûlures supplémentaires selon la situation.</p>
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
                            resolve({ attackBonus, damageBonus });
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
    const { attackBonus, damageBonus } = config;

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
                .color('#ff5722')
                .texture('modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm');

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

    // ===== ACTOR DETECTION UTILITY =====
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                // Get token's grid position (top-left corner)
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Check if any grid square occupied by the token matches the target grid square
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        if (tokenSquareX === targetGridX && tokenSquareY === targetGridY) {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection (original behavior)
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const tokenDistance = Math.sqrt(
                    Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2)
                );
                return tokenDistance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActor = getActorAtLocation(targetPoint.x, targetPoint.y);
    const targetName = targetActor ? targetActor.name : "position";

    // Play a short Sequencer animation: pan strike from caster to target
    try {
        if (typeof Sequence !== 'undefined') {
            const seq = new Sequence();
            // pan strike effect from caster to target
            if (SPELL.animations.pan) {
                seq.effect()
                    .file(SPELL.animations.pan)
                    .attachTo(caster)
                    .stretchTo(targetPoint)
                    .tint("#ff5722"); // Orange/red tint for heated pan
            }
            await seq.play();
        }
    } catch (err) {
        console.warn('Sequencer play failed', err);
    }

    // ===== DAMAGE CALCULATION WITH STANCE SYSTEM =====
    async function calculateDamage() {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = physiqueBonus + (damageBonus || 0) + effectDamageBonus;

        if (currentStance === 'offensif') {
            // Offensive stance: main damage is maximized
            const diceMax = 4; // 1d4 maximized
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

    // ===== COMBINED ROLL SYSTEM WITH STANCE SUPPORT =====
    const totalAttackDice = charInfo.final + (attackBonus || 0);
    const levelBonus = 2 * SPELL.spellLevel; // level 0 -> 0

    // Build combined roll formula
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = physiqueBonus + (damageBonus || 0) + effectDamageBonus;
        combinedRollParts.push(`${SPELL.baseDamageFormula} + ${totalDamageBonus}`);
    }

    // Create and evaluate combined roll
    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        const damageRollResult = combinedRoll.terms[0].results[1];
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = physiqueBonus + (damageBonus || 0) + effectDamageBonus;
        const damageFormulaString = `${SPELL.baseDamageFormula} + ${totalDamageBonus}`;
        finalDamageResult = {
            total: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null),
            formula: damageFormulaString,
            result: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null)
        };
    }

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
                ${effectDamageBonus !== 0 ? `<div>🍳 Bonus de Dégâts: +${effectDamageBonus}</div>` : ''}
            </div>` : '';

        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` : '';

        const physiqueInfo = `
            <div style="color: #ff5722; font-size: 0.9em; margin: 5px 0;">
                <div>🍳 Bonus Physique/2 : +${physiqueBonus} dégâts</div>
            </div>
        `;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #ff5722; margin-bottom: 6px;"><strong>🍳 ${SPELL.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                    (${SPELL.baseDamageFormula} + ${SPELL.characteristicDisplay}/2 + bonus)
                </div>
                <div style="font-size: 0.8em; color: #666;">
                    Base: ${finalDamageResult.total} (incluant +${physiqueBonus} du Physique)
                </div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #fff3e0, #ffebee); padding: 12px; border-radius: 8px; border: 2px solid #ff5722; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #ff5722;">🍳 ${SPELL.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${physiqueInfo}
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

    ui.notifications.info(`🍳 ${SPELL.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${maximizedInfo}.`);

})();
