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
            cast: "jb2a.melee.attack.forward.white",
            hit: "jb2a.impact.010.orange",
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

    // Play a short Sequencer animation: cast on caster, hit on target
    try {
        if (typeof Sequence !== 'undefined') {
            const seq = new Sequence();
            // cast effect on caster
            if (SPELL.animations.cast) {
                seq.effect()
                    .file(SPELL.animations.cast)
                    .atLocation(caster)
                    .scale(0.6)
                    .duration(500)
                    .fadeOut(150);
            }
            // hit effect at target
            if (SPELL.animations.hit) {
                seq.effect()
                    .file(SPELL.animations.hit)
                    .atLocation({ x: targetPoint.x, y: targetPoint.y })
                    .scale(0.6)
                    .delay(400)
                    .duration(600)
                    .fadeOut(150);
            }
            await seq.play();
        }
    } catch (err) {
        console.warn('Sequencer play failed', err);
    }

    // ===== ROLLS =====
    // Attack
    const totalAttackDice = charInfo.final + (attackBonus || 0);
    const levelBonus = 2 * SPELL.spellLevel; // level 0 -> 0
    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // Damage: 1d7 + flat + Physique(final) + manual damage bonus + active effect damage bonuses
    const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
    const damageStatic = SPELL.flatDamageBonus + charInfo.final + (damageBonus || 0) + effectDamageBonus;

    const baseDamageRoll = new Roll(`${SPELL.baseDamageFormula} + ${damageStatic}`);
    await baseDamageRoll.evaluate({ async: true });

    let foureauRoll = { total: 0, formula: '' };
    if (foureau) {
        foureauRoll = new Roll('1d6');
        await foureauRoll.evaluate({ async: true });
    }

    const totalDamage = baseDamageRoll.total + (foureauRoll.total || 0);

    // ===== CHAT MESSAGE =====
    const manaText = actualManaCost === 0 ? '0 mana (Focus possible)' : `${actualManaCost} mana`;

    const flavor = `
        <div style="padding:10px; border-radius:8px; background: linear-gradient(135deg,#fff,#f7f7ff); border:1px solid #ddd;">
            <h3 style="margin:0;">🗡️ ${SPELL.name}</h3>
            <div style="font-size:0.9em; color:#444; margin-top:6px;">Lanceur: <strong>${actor.name}</strong> | Coût: <strong>${manaText}</strong></div>
            <div style="margin-top:8px; font-size:0.95em;">
                <div><strong>Attaque:</strong> ${attackRoll.total} (${attackRoll.formula})</div>
                <div style="margin-top:6px;"><strong>Dégâts:</strong> ${totalDamage} <small style="color:#666;">(${baseDamageRoll.formula}${foureau ? ` + ${foureauRoll.formula}` : ''})</small></div>
                <div style="margin-top:6px; color:#666; font-size:0.85em;">Dégâts détaillés: 1d7 + ${SPELL.flatDamageBonus} + Physique(${charInfo.final}) + bonus manuel(${damageBonus || 0}) + effets(${effectDamageBonus})${foureau ? ` + fourreau(${foureauRoll.total})` : ''}</div>
            </div>
        </div>
    `;

    // Post rolls to chat as a grouped message (attack roll with flavor and damage as separate message could be implemented but here we present both in one flavor)
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: flavor,
        rollMode: game.settings.get('core', 'rollMode')
    });

    // Also post damage roll as a separate message for visibility
    await baseDamageRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: `<div><strong>${SPELL.name} — Dégâts</strong>${foureau ? ` + Fourreau(${foureauRoll.formula})` : ''}</div>`,
        rollMode: game.settings.get('core', 'rollMode')
    });

    if (foureau) {
        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `<div><strong>Fourreau de la waifu</strong> activé: ${foureauRoll.total} (${foureauRoll.formula})</div>`,
            rollMode: game.settings.get('core', 'rollMode')
        });
    }

    ui.notifications.info(`🗡️ ${SPELL.name} lancé ! Attaque: ${attackRoll.total}, Dégâts: ${totalDamage}.`);

})();
