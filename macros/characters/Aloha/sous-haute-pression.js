/**
 * Sous Haute Pression - Aloha (Niveau 2)
 *
 * Aloha relâche d'un coup toute la chaleur accumulée en une explosion thermique
 * rayonnant sur 2 cases autour de lui.
 *
 * MÉCANIQUES :
 * - Zone : 2 cases de rayon, centré sur Aloha (aucun ciblage manuel)
 * - Animation : jb2a_patreon.fireball.explosion.orange, centralée sur Aloha
 * - Jet de touché : Physiqued7 + 4 (niv.2) + bonus manuel
 * - Dégâts : 2d6 + Physique + Résistance Thermique actuelle
 * - Coût : 8 mana NON FOCUSABLE − Résistance Thermique (minimum 0)
 * - Projection : 1d(RT/2) cases indiquée dans le chat (cibles non déplacées)
 * - Esquive (demi-dégâts) : uniquement pour les cibles à exactement 2 cases
 *   (les cibles à 1 case ou moins ne peuvent PAS esquiver)
 * - Après le sort : la Résistance Thermique est ineffective pendant 2 tours
 *   (l'effet n'est PAS retiré — simplement indiqué en message)
 *
 * Usage : Sélectionner le token d'Aloha et lancer la macro.
 */

(async () => {
    // ===== CONFIGURATION =====
    const SPELL_CONFIG = {
        name: "Sous Haute Pression",
        spellLevel: 2,                     // → +4 au jet de touché
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCostBase: 8,
        isFocusable: false,                // Jamais réductible par Focus
        aoeRadius: 2,                      // cases de rayon
        resistanceEffectName: "Résistance Thermique",
        animation: "jb2a_patreon.fireball.explosion.orange"
    };

    // ===== VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token d'Aloha !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            const v = effect.flags?.[flagKey]?.value;
            if (typeof v === 'number') total += v;
        }
        return total;
    }

    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
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

    // ===== READ RÉSISTANCE THERMIQUE =====
    function getThermalResistance(actor) {
        const rtEffect = actor?.effects?.contents?.find(
            e => e.name === SPELL_CONFIG.resistanceEffectName
        );
        if (!rtEffect) return 0;
        return rtEffect.flags?.statuscounter?.value || 0;
    }

    // ===== STATS =====
    const currentStance = getCurrentStance(actor);
    const charInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!charInfo) return;

    const thermalResistance = getThermalResistance(actor);
    const levelBonus = SPELL_CONFIG.spellLevel * 2; // +4

    // Mana cost: 8 - RT (minimum 0), never focusable
    const actualManaCost = Math.max(0, SPELL_CONFIG.manaCostBase - thermalResistance);

    // Knockback dice sides: floor(RT / 2). If 0, no knockback roll.
    const knockbackDiceSides = Math.floor(thermalResistance / 2);

    // ===== CONFIG DIALOG =====
    const bonusAttack = await new Promise(resolve => {
        const rtNote = thermalResistance > 0
            ? `<div style="padding:8px 12px; background:rgba(255,152,0,0.2); border-radius:6px;
                border-left:4px solid #ff9800; margin:8px 0; color:#fff; font-size:0.9em;">
                🔥 <strong>Résistance Thermique active :</strong> ${thermalResistance}
                <br><span style="font-size:0.85em; color:#ffcc80;">
                → Coût réduit à <strong>${actualManaCost} mana</strong> (8 − ${thermalResistance})
                &nbsp;|&nbsp; Bonus dégâts : <strong>+${thermalResistance}</strong>
                &nbsp;|&nbsp; Projection : <strong>1d${knockbackDiceSides > 0 ? knockbackDiceSides : '—'}</strong> cases
                </span>
               </div>`
            : `<div style="padding:8px 12px; background:rgba(255,255,255,0.1); border-radius:6px;
                margin:8px 0; color:#ffab91; font-size:0.9em;">
                ❄️ Aucune Résistance Thermique active — coût plein : <strong>8 mana</strong>
               </div>`;

        new Dialog({
            title: "💥 Sous Haute Pression",
            content: `
                <div style="padding:12px; background:linear-gradient(135deg,#4a0000,#c62828); border-radius:8px;">
                    <div style="text-align:center; margin-bottom:12px;">
                        <h3 style="margin:0; color:#ffccbc; text-shadow:0 0 8px #ff7043;">
                            💥 Sous Haute Pression
                        </h3>
                        <div style="color:#ffab91; margin-top:4px; font-size:0.9em;">
                            <strong>${actor.name}</strong> &nbsp;|&nbsp;
                            Niveau <strong>${SPELL_CONFIG.spellLevel}</strong> &nbsp;|&nbsp;
                            NON FOCUSABLE
                            ${currentStance ? ` &nbsp;|&nbsp; Position : <strong>${currentStance}</strong>` : ''}
                        </div>
                    </div>

                    ${rtNote}

                    <div style="background:rgba(255,255,255,0.1); border-radius:6px; padding:10px; margin:8px 0; color:#fff; font-size:0.9em;">
                        <div>🎯 <strong>Touché :</strong> ${charInfo.final}d7 + ${levelBonus} (niv.${SPELL_CONFIG.spellLevel}) + bonus</div>
                        <div style="margin-top:4px;">💥 <strong>Dégâts :</strong> 2d6 + ${charInfo.final} (Physique) + ${thermalResistance} (RT) = 2d6 + ${charInfo.final + thermalResistance}</div>
                        <div style="margin-top:4px;">📐 <strong>Zone :</strong> ${SPELL_CONFIG.aoeRadius} cases de rayon autour d'Aloha</div>
                        <div style="margin-top:4px;">🛡️ <strong>Esquive :</strong> Demi-dégâts uniquement à 2 cases (impossible à 1 case ou moins)</div>
                        <div style="margin-top:4px;">🌪️ <strong>Projection :</strong> ${knockbackDiceSides > 0 ? `1d${knockbackDiceSides} cases` : 'Aucune (RT insuffisante)'} <em style="font-size:0.85em;color:#ffcc80;">(indicatif — cibles non déplacées)</em></div>
                    </div>

                    <div style="padding:8px; background:rgba(255,87,34,0.25); border-radius:6px;
                        border:1px solid #ff5722; color:#ffccbc; font-size:0.85em; margin:8px 0;">
                        ⚠️ <strong>Note :</strong> Après le sort, la Résistance Thermique est
                        <strong>ineffective pendant 2 tours</strong>.
                    </div>

                    <div style="margin-top:10px;">
                        <label style="color:#fff; font-size:0.9em;"><strong>Bonus d'attaque manuel :</strong></label>
                        <input type="number" id="bonusAtk" value="0" min="-10" max="20"
                            style="width:70px; margin-left:8px; padding:4px; border-radius:4px; border:none;">
                    </div>
                </div>
            `,
            buttons: {
                cast: {
                    icon: '<i class="fas fa-fire"></i>',
                    label: "EXPLOSER !",
                    callback: html => resolve(parseInt(html.find('#bonusAtk').val()) || 0)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "cast"
        }, { width: 450 }).render(true);
    });

    if (bonusAttack === null) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    // ===== AUTO-DETECT TARGETS IN AOE =====
    const gridSize = canvas.grid.size;
    const casterCenterX = caster.x + caster.w / 2;
    const casterCenterY = caster.y + caster.h / 2;
    const aoeRadiusPx = SPELL_CONFIG.aoeRadius * gridSize;

    const targetsData = [];

    for (const token of canvas.tokens.placeables) {
        if (token === caster) continue;
        if (!token.visible) continue;

        const tokenCenterX = token.x + token.w / 2;
        const tokenCenterY = token.y + token.h / 2;

        const dx = tokenCenterX - casterCenterX;
        const dy = tokenCenterY - casterCenterY;
        const distPx = Math.sqrt(dx * dx + dy * dy);
        const distCases = distPx / gridSize;

        if (distPx <= aoeRadiusPx) {
            // Dodge eligibility: only if strictly > 1 case away (i.e. between 1 and 2 cases)
            const canDodge = distCases > 1.0;

            targetsData.push({
                token,
                name: token.name,
                actor: token.actor,
                distPx,
                distCases,
                canDodge
            });
        }
    }

    // Sort by distance (closest first)
    targetsData.sort((a, b) => a.distPx - b.distPx);

    console.log(`[DEBUG] Sous Haute Pression — ${targetsData.length} cible(s) dans la zone, RT=${thermalResistance}`);

    // ===== ANIMATION =====
    async function playExplosionAnimation() {
        if (typeof Sequence === "undefined") {
            console.warn("[DEBUG] Sous Haute Pression: Sequencer not available.");
            return;
        }
        try {
            await new Sequence()
                .effect()
                .file(SPELL_CONFIG.animation)
                .atLocation(caster)
                .scale(1.5)
                .fadeIn(200)
                .fadeOut(500)
                .duration(1800)
                .play();
        } catch (err) {
            console.warn("[DEBUG] Animation error:", err);
        }
    }

    await playExplosionAnimation();

    // ===== ROLLS =====
    // Attack roll
    const physiqueDice = charInfo.final + getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const attackFormula = `${physiqueDice}d7 + ${levelBonus}${bonusAttack !== 0 ? ` + ${bonusAttack}` : ''}`;
    const attackRoll = new Roll(attackFormula);
    await attackRoll.evaluate({ async: true });

    // Damage roll: 2d6 + Physique + RT
    const damageBonus = charInfo.final + thermalResistance;
    const damageFormula = `2d6 + ${damageBonus}`;
    const damageRoll = new Roll(damageFormula);
    await damageRoll.evaluate({ async: true });

    const baseDamage = damageRoll.total;
    const halfDamage = Math.floor(baseDamage / 2);

    // Knockback roll (per target) — stored for display only, targets NOT moved
    async function rollKnockback() {
        if (knockbackDiceSides <= 0) return null;
        const kbRoll = new Roll(`1d${knockbackDiceSides}`);
        await kbRoll.evaluate({ async: true });
        return kbRoll.total;
    }

    // Roll knockback for each target
    for (const t of targetsData) {
        t.knockback = await rollKnockback();
    }

    // ===== BUILD CHAT =====
    const manaCostDisplay = `${actualManaCost} mana${thermalResistance > 0 ? ` (8 − ${thermalResistance} RT)` : ''}`;
    const stanceLabel = currentStance
        ? ` · Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}`
        : '';

    // Target rows
    const targetRows = targetsData.length > 0
        ? targetsData.map(t => {
            const distLabel = t.distCases <= 1.0
                ? `<span style="color:#ef9a9a;">≤ 1 case</span>`
                : `<span style="color:#a5d6a7;">~${t.distCases.toFixed(1)} cases</span>`;

            const dodgeNote = t.canDodge
                ? `<span style="color:#80cbc4; font-size:0.8em;">🛡️ Esquive possible → demi-dégâts (${halfDamage})</span>`
                : `<span style="color:#ef9a9a; font-size:0.8em;">🚫 Trop proche — pas d'esquive</span>`;

            const kbNote = t.knockback !== null
                ? `<span style="color:#ffe082; font-size:0.8em;">🌪️ Projection : <strong>${t.knockback}</strong> case${t.knockback > 1 ? 's' : ''} (indicatif)</span>`
                : `<span style="color:#bdbdbd; font-size:0.8em;">🌪️ Pas de projection (RT insuffisante)</span>`;

            const tokenImg = t.token.document.texture.src;

            return `
                <div style="display:flex; align-items:flex-start; gap:10px; padding:8px 10px; margin:4px 0;
                    background:rgba(255,87,34,0.15); border-left:4px solid #ff5722; border-radius:6px;">
                    <img src="${tokenImg}" style="width:32px;height:32px;border-radius:50%;border:2px solid #ff5722;object-fit:cover;flex-shrink:0;margin-top:2px;">
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <strong style="color:#ffccbc;">${t.name}</strong>
                            <span style="font-size:1.25em; font-weight:bold; color:#ff7043;">💥 ${baseDamage}</span>
                        </div>
                        <div style="font-size:0.8em; color:#bbb; margin-top:2px;">Distance : ${distLabel}</div>
                        <div style="margin-top:3px;">${dodgeNote}</div>
                        <div style="margin-top:2px;">${kbNote}</div>
                    </div>
                </div>`;
        }).join('')
        : `<div style="color:#999; font-style:italic; padding:8px; text-align:center;">Aucune cible dans la zone (${SPELL_CONFIG.aoeRadius} cases).</div>`;

    const chatContent = `
        <div style="background:linear-gradient(135deg,#3e0000,#b71c1c); padding:14px; border-radius:10px;
            border:2px solid #ff5722; margin:8px 0;">
            <div style="text-align:center; margin-bottom:12px;">
                <h3 style="margin:0; color:#ffccbc; text-shadow:0 0 10px #ff7043;">💥 Sous Haute Pression</h3>
                <div style="color:#ffab91; margin-top:4px; font-size:0.9em;">
                    <strong>${actor.name}</strong>${stanceLabel} &nbsp;|&nbsp;
                    Coût : <strong>${manaCostDisplay}</strong> &nbsp;|&nbsp;
                    Niv. <strong>${SPELL_CONFIG.spellLevel}</strong> (+${levelBonus} touché)
                </div>
            </div>

            <!-- Attack + Damage summary -->
            <div style="background:rgba(255,255,255,0.1); padding:8px 12px; border-radius:6px; margin:8px 0;">
                <div style="color:#ffccbc; margin-bottom:4px;">
                    <strong>🎯 Jet de touché :</strong>
                    <span style="font-size:1.3em; font-weight:bold; color:#fff; margin-left:6px;">${attackRoll.total}</span>
                    <small style="color:#ffab91; margin-left:6px;">(${attackFormula})</small>
                </div>
                <div style="color:#ffccbc;">
                    <strong>💥 Dégâts :</strong>
                    <span style="font-size:1.25em; font-weight:bold; color:#fff; margin-left:6px;">${baseDamage}</span>
                    <small style="color:#ffab91; margin-left:6px;">(${damageFormula}) · Demi : ${halfDamage}</small>
                </div>
                <div style="color:#ffccbc; margin-top:4px; font-size:0.9em;">
                    <strong>📐 Zone :</strong> ${SPELL_CONFIG.aoeRadius} cases de rayon
                    &nbsp;|&nbsp; <strong>Cibles :</strong> ${targetsData.length}
                    &nbsp;|&nbsp; <strong>RT incluse :</strong> +${thermalResistance} dégâts
                </div>
            </div>

            <!-- Targets -->
            <div style="color:#ffccbc; font-size:0.9em; font-weight:bold; margin:8px 0 4px 0;">
                🔥 Cibles touchées (${targetsData.length}) :
            </div>
            ${targetRows}

            <!-- RT lockout warning -->
            <div style="margin-top:12px; padding:10px 12px; background:rgba(255,152,0,0.2);
                border-radius:6px; border:1px solid #ff9800; color:#ffe082; font-size:0.9em;">
                ⚠️ <strong>Résistance Thermique ineffective pendant 2 tours</strong> après ce sort.
                <br><small style="color:#ffcc80; font-size:0.85em;">
                    L'effet "Résistance Thermique" reste en place mais n'est plus comptabilisé
                    pour le coût ou les dégâts jusqu'à la fin du tour 2.
                </small>
            </div>

            <!-- Stats footer -->
            <div style="margin-top:10px; padding:6px 10px; background:rgba(255,87,34,0.2); border-radius:6px;
                font-size:0.82em; color:#ffab91; text-align:center;">
                🔥 <strong>Physique :</strong> ${charInfo.final}
                &nbsp;|&nbsp; <strong>RT :</strong> ${thermalResistance}
                &nbsp;|&nbsp; <strong>Total bonus dégâts :</strong> +${damageBonus}
                ${knockbackDiceSides > 0 ? `&nbsp;|&nbsp; <strong>Projection :</strong> 1d${knockbackDiceSides} cases (indicatif)` : ''}
                ${bonusAttack !== 0 ? `&nbsp;|&nbsp; <strong>Bonus manuel :</strong> +${bonusAttack}` : ''}
            </div>
        </div>
    `;

    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: chatContent,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== NOTIFICATION =====
    const targetSummary = targetsData.length > 0
        ? targetsData.map(t => `${t.name} (${baseDamage}${t.canDodge ? ` ou ${halfDamage}` : ''})`).join(', ')
        : 'aucune cible';

    ui.notifications.info(
        `💥 Sous Haute Pression ! Touché: ${attackRoll.total} | Dégâts: ${baseDamage} | ${targetSummary} | ${manaCostDisplay} | ⚠️ RT ineffective 2 tours`
    );

    console.log(`[DEBUG] Sous Haute Pression — atk: ${attackRoll.total}, dmg: ${baseDamage}, RT: ${thermalResistance}, targets: ${targetsData.length}, manaCost: ${actualManaCost}`);

})();
