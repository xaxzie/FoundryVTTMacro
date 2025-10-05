/**
 * Lightning Chain - Léo
 *
 * Léo libère une chaîne d'éclairs entrecoupée depuis sa hache. C'est un sort direct
 * basé sur la caractéristique Physique.
 *
 * - Coût : 4 mana (focalisable — gratuit en Position Focus)
 * - Caractéristique d'attaque : Physique (+ effets actifs sur 'physique')
 * - Dégâts : 1d6 + 3 + Physique + bonus manuels + bonus de dégâts provenant des Active Effects
 *           sauf les bonus fournis par l'effet nommé "Serpent"
 * - Cible : unique (Portal pour sélectionner la zone)
 *
 * Animations :
 * - Cast : jb2a.markers.chain.spectral_standard.loop.02.blue
 * - Transition (arme) : jaamod.misc.chain_figure8 (x2 speed)
 * - Finish : jb2a_patreon.chain_lightning.primary.red (se joue 750ms avant la fin de la transition)
 *
 * Usage : sélectionner le token de Léo, lancer la macro et choisir la zone/cible.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Chaîne d'Éclairs",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 4,
        spellLevel: 2,
        damageFormula: "1d6",
        fixedDamageBonus: 3,
        isDirect: true,
        isFocusable: true,

        animations: {
            cast: "jb2a.markers.chain.spectral_standard.loop.02.blue",
            transition: "jaamod.misc.chain_figure8",
            finish: "jb2a_patreon.chain_lightning.primary.red",
            sound: null
        },

        targeting: {
            range: 300,
            color: "#66ccff",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
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

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e => ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase()))?.name?.toLowerCase() || null;
    }
    const currentStance = getCurrentStance(actor);

    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            const v = effect.flags?.[flagKey]?.value;
            if (typeof v === 'number') total += v;
        }
        return total;
    }

    // Special: sum all damage bonuses but exclude effects named "Serpent" (case-insensitive)
    function getActiveDamageBonusExcluding(actor, excludeName) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            if (!effect || !effect.name) continue;
            if (effect.name.toLowerCase() === String(excludeName).toLowerCase()) continue;
            const v = effect.flags?.['damage']?.value;
            if (typeof v === 'number') {
                total += v;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${v} to damage (total: ${total})`);
            }
        }
        return total;
    }

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) throw new Error(`Caractéristique ${characteristic} non trouvée.`);
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const effectDamageBonus = getActiveDamageBonusExcluding(actor, 'Serpent');
        const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ? `<strong>Coût en Mana :</strong> GRATUIT (Position Focus)` : `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana`;
        const damageBonusNote = effectDamageBonus ? ` <em>(+${effectDamageBonus} bonus d'effets)</em>` : '';

        return new Promise(resolve => {
            new Dialog({
                title: `${SPELL_CONFIG.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase()+currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>${SPELL_CONFIG.name} :</h3>
                    <p>${manaInfo}</p>
                    <p><strong>Caractéristique ${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries>0||characteristicInfo.effectBonus?` <em>(${characteristicInfo.base}${characteristicInfo.injuries>0?` - ${characteristicInfo.injuries} blessures`:''}${characteristicInfo.effectBonus?` + ${characteristicInfo.effectBonus} effets`:''})</em>`:''}</p>

                    <div style="margin:10px 0;padding:10px;border:1px solid #ccc;background:#f0f8ff;">
                        <h4>Bonus Manuels</h4>
                        <label>Bonus de dégâts : <input type="number" id="damageBonus" value="0" style="width:60px"></label><br>
                        <label>Bonus d'attaque : <input type="number" id="attackBonus" value="0" style="width:60px"></label>
                        <p style="font-size:0.8em;color:#666;margin-top:6px;">Remarque: les bonus de dégâts provenant de l'effet nommé "Serpent" sont exclus pour ce sort.</p>
                    </div>

                    <p>Dégâts : <strong>${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.fixedDamageBonus} + ${SPELL_CONFIG.characteristicDisplay}</strong>${damageBonusNote}</p>
                `,
                buttons: {
                    confirm: { label: "Lancer", callback: html => {
                        const dmg = parseInt(html.find('#damageBonus').val())||0;
                        const atk = parseInt(html.find('#attackBonus').val())||0;
                        resolve({ damageBonus: dmg, attackBonus: atk });
                    }},
                    cancel: { label: "Annuler", callback: ()=> resolve(null) }
                }
            }).render(true);
        });
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) { ui.notifications.info('Sort annulé.'); return; }
    const { damageBonus, attackBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        try {
            const portal = new Portal().origin(caster).range(SPELL_CONFIG.targeting.range).color(SPELL_CONFIG.targeting.color).texture(SPELL_CONFIG.targeting.texture);
            const t = await portal.pick();
            return t;
        } catch (e) { ui.notifications.error('Erreur lors du ciblage (Portal requis).'); return null; }
    }

    const target = await selectTarget();
    if (!target) { ui.notifications.info('Sort annulé.'); return; }

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
            return { name: targetActor.name, token: targetToken, actor: targetActor };
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
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : 'position';

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const effectDamageBonus = getActiveDamageBonusExcluding(actor, 'Serpent');
        const totalDamageBonus = SPELL_CONFIG.fixedDamageBonus + characteristicInfo.final + damageBonus + effectDamageBonus;

        if (currentStance === 'offensif') {
            const diceMax = 6; // 1d6 maximized
            const maxDamage = diceMax + totalDamageBonus;
            return { total: maxDamage, formula: `${diceMax} + ${totalDamageBonus}`, isMaximized:true };
        }
        const damage = new Roll(`${SPELL_CONFIG.damageFormula} + @total`, { total: totalDamageBonus });
        await damage.evaluate({ async: true });
        return damage;
    }

    const damageResult = await calculateDamage();

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();
        // Cast marker under caster loop
        if (SPELL_CONFIG.animations.cast) {
            seq.effect().file(SPELL_CONFIG.animations.cast).atLocation(caster).belowTokens().scale(0.8).opacity(0.6).duration(1200);
        }
        // Transition - attach to caster and stretch to target, accelerated x2
        if (SPELL_CONFIG.animations.transition) {
            // We'll set a duration and try to accelerate via playbackRate if supported; keep a safe duration
            // Increase opacity and apply a ColorMatrix filter to compensate for low native opacity
            seq.effect()
                .file(SPELL_CONFIG.animations.transition)
                .attachTo(caster)
                .stretchTo(target)
                .scale(2.0)
                .opacity(2.0)
                .filter("ColorMatrix", { brightness: 1.15, contrast: 1.25, saturate: 1.4 })
                .duration(3000)
                .delay(200)
                .playbackRate(3)
                .waitUntilFinished(-1900);
        }
        // Finish effect (will be triggered by waitUntilFinished)
        if (SPELL_CONFIG.animations.finish) {
            seq.effect()
                .file(SPELL_CONFIG.animations.finish)
                .attachTo(caster)
                .stretchTo(target)
                .scale(1.0);
        }
        // Optional sound
        if (SPELL_CONFIG.animations.sound) seq.sound().file(SPELL_CONFIG.animations.sound).volume(0.6).delay(300);
        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK + DAMAGE RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;
    let combinedParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveDamageBonusExcluding(actor, 'Serpent');
        const totalDamageBonus = SPELL_CONFIG.fixedDamageBonus + characteristicInfo.final + damageBonus + effectDamageBonus;
        combinedParts.push(`${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamage = damageResult;
    if (currentStance !== 'offensif') {
        const dr = combinedRoll.terms[0].results[1];
        finalDamage = { total: dr.result, formula: dr.expression, result: dr.result };
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const actualMana = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ? 'GRATUIT (Position Focus)' : `${SPELL_CONFIG.manaCost} mana`;
        const injuryInfo = characteristicInfo.injuries>0 ? `<div style="color:#d32f2f;font-size:0.9em">⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</div>` : '';
        const effectDamageBonus = getActiveDamageBonusExcluding(actor,'Serpent');
        const effectInfo = (characteristicInfo.effectBonus!==0 || effectDamageBonus!==0) ? `<div style="color:#2e7d32;font-size:0.9em">${characteristicInfo.effectBonus?`<div>✨ Bonus ${SPELL_CONFIG.characteristicDisplay}: +${characteristicInfo.effectBonus}</div>`:''}${effectDamageBonus?`<div>✨ Bonus de Dégâts (excl. Serpent): +${effectDamageBonus}</div>`:''}</div>` : '';
        const bonusInfo = (damageBonus>0 || attackBonus>0) ? `<div style="color:#2e7d32;font-size:0.9em">${damageBonus?`<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>`:''}${attackBonus?`<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>`:''}</div>` : '';

        const attackDisplay = `<div style="text-align:center;margin:8px 0;padding:10px;background:#fff3e0;border-radius:4px;"><div style="font-size:1.4em;color:#e65100;font-weight:bold">🎯 ATTAQUE: ${attackResult.result}</div></div>`;
        const damageDisplay = `<div style="text-align:center;margin:8px 0;padding:10px;background:#e8f5e8;border-radius:4px;"><div style="font-size:1.1em;color:#2e7d32;margin-bottom:6px"><strong>⚡ ${SPELL_CONFIG.name}</strong></div><div style="font-size:0.9em;margin-bottom:4px"><strong>Cible:</strong> ${targetName}</div><div style="font-size:1.4em;color:#1565c0;font-weight:bold">💥 DÉGÂTS: ${finalDamage.total}</div><div style="font-size:0.8em;color:#666;margin-top:2px">(${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.fixedDamageBonus} + Physique + bonus)</div></div>`;

        return `<div style="background:linear-gradient(135deg,#e3f2fd,#f3e5f5);padding:12px;border-radius:8px;border:2px solid #2196f3;margin:8px 0"><div style="text-align:center;margin-bottom:8px"><h3 style="margin:0;color:#1976d2">⚡ ${SPELL_CONFIG.name}</h3><div style="margin-top:3px;font-size:0.9em"><strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualMana}</div></div>${injuryInfo}${effectInfo}${bonusInfo}${attackDisplay}${damageDisplay}</div>`;
    }

    await combinedRoll.toMessage({ speaker: ChatMessage.getSpeaker({ token: caster }), flavor: createFlavor(), rollMode: game.settings.get('core','rollMode') });

    ui.notifications.info(`${SPELL_CONFIG.name} lancé ! Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamage.total}.`);

})();
