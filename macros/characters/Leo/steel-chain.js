/**
 * Steel Chain (Chaîne d'Acier) - Léo
 *
 * Léo crée une chaîne magique d'acier qui enchaine une cible. La chaîne reste
 * visible tant que l'effet persiste et Léo peut continuer à se déplacer.
 *
 * - Coût : 2 mana (focalisable — gratuit en Position Focus)
 * - Caractéristique d'attaque : Physique (+ effets actifs sur 'physique' + bonus manuels)
 * - PAS DE DÉGÂTS - Seule l'attaque de toucher compte
 * - Effet spécial : L'effet "Serpent" ne fonctionne pas avec ce sort
 * - Cible : unique (Portal pour sélectionner la cible)
 * - Animation : Chaîne permanente entre Léo et la cible
 *
 * Animations :
 * - Cast : jb2a.chain.03.complete.blue (effet de lancement)
 * - Chain : jb2a.chain.02.complete.blue (chaîne persistante)
 * - Sound : optionnel
 *
 * Usage : sélectionner le token de Léo, lancer la macro et choisir la cible.
 * Utiliser la macro "steel-chain-end.js" pour terminer l'enchainement.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Chaîne d'Acier",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 2,
        spellLevel: 2,
        isDirect: true,
        isFocusable: true,
        serpentExclusion: true, // L'effet Serpent ne fonctionne pas
        hasNoDamage: true, // Pas de dégâts, juste un test de toucher

        animations: {
            cast: "jb2a.chain.03.complete.blue",
            chain: "jb2a.chain.02.complete.blue", // Chaîne persistante
            sound: null
        },

        targeting: {
            range: 300,
            color: "#c0c0c0", // Couleur acier
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        },

        // Configuration de l'effet persistant
        chainEffect: {
            name: "Chaîne d'Acier",
            icon: "icons/svg/chain.svg",
            description: "Enchaîné par une chaîne d'acier magique"
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
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }
    const currentStance = getCurrentStance(actor);

    // Active effect bonuses (excludes Serpent for this spell)
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            // Skip Serpent effect for this spell
            if (effect.name?.toLowerCase() === 'serpent') {
                console.log(`[DEBUG] Excluding Serpent effect from ${flagKey} bonus`);
                continue;
            }

            const flagValue = effect.flags?.world?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                total += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey} (total: ${total})`);
            }
        }
        return total;
    }

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée !`);
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

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
            `<strong>Coût en Mana :</strong> GRATUIT (Position Focus)` :
            `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana`;

        return new Promise(resolve => {
            new Dialog({
                title: `${SPELL_CONFIG.name} (Position: ${currentStance || 'Aucune'})`,
                content: `
                    <h3>${SPELL_CONFIG.name}</h3>
                    <p>${manaInfo}</p>
                    <p><strong>Caractéristique Physique :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #fffbf0;">
                        <h4>Description</h4>
                        <p><em>Crée une chaîne magique d'acier qui enchaine la cible. Léo peut continuer à se déplacer.</em></p>
                        <p style="color: #d32f2f;"><strong>⚠️ Effet spécial :</strong> L'effet "Serpent" ne fonctionne pas avec ce sort</p>
                        <p style="color: #1976d2;"><strong>ℹ️ Note :</strong> Ce sort ne cause pas de dégâts, seul le test de toucher compte</p>
                    </div>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                        <h4>Bonus Manuels</h4>
                        <div style="margin: 5px 0;">
                            <label>Bonus de résolution d'attaque :
                                <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                        </div>
                    </div>

                    <div style="margin: 10px 0; padding: 8px; background: #e8f5e8; border-radius: 4px;">
                        <div><strong>Jet d'attaque final :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${SPELL_CONFIG.spellLevel * 2}</span></div>
                    </div>

                    <script>
                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const bonus = parseInt(this.value) || 0;
                            const total = base + bonus;
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${SPELL_CONFIG.spellLevel * 2}';
                        });
                    </script>
                `,
                buttons: {
                    cast: {
                        label: "🔗 Lancer la Chaîne !",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({ attackBonus });
                        }
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                }
            }).render(true);
        });
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }
    const { attackBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);
            return await portal.pick();
        } catch (e) {
            ui.notifications.error("Erreur lors du ciblage. Vérifiez que Portal est installé.");
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    // Get actor at target location
    function getActorAtLocation(x, y) {
        const tolerance = canvas.grid.size;
        const tokens = canvas.tokens.placeables.filter(token => {
            const tokenX = token.x + (token.document.width * canvas.grid.size) / 2;
            const tokenY = token.y + (token.document.height * canvas.grid.size) / 2;
            return Math.abs(tokenX - x) <= tolerance && Math.abs(tokenY - y) <= tolerance;
        });

        if (!tokens.length) return null;
        const tk = tokens[0];
        const act = tk.actor;
        if (!act) return null;

        const isOwner = act.isOwner;
        const isVisible = tk.visible;
        const isGM = game.user.isGM;
        return (isOwner || isVisible || isGM) ?
            { name: act.name, token: tk, actor: act } :
            { name: 'cible', token: tk, actor: act };
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : 'position';

    // Check if target already has a chain
    if (targetActor?.actor) {
        const existingChain = targetActor.actor.effects.find(e => e.name === SPELL_CONFIG.chainEffect.name);
        if (existingChain) {
            ui.notifications.warn(`${targetName} est déjà enchaîné !`);
            return;
        }
    }

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Cast animation sous le lanceur
        if (SPELL_CONFIG.animations.cast) {
            seq.effect()
                .file(SPELL_CONFIG.animations.cast)
                .atLocation(caster)
                .scale(0.8)
                .duration(2000)
                .fadeOut(300);
        }

        // Chaîne persistante si on a une cible valide
        if (SPELL_CONFIG.animations.chain && targetActor?.token) {
            seq.effect()
                .file(SPELL_CONFIG.animations.chain)
                .attachTo(caster)
                .stretchTo(targetActor.token)
                .scale(0.6)
                .delay(1500)
                .persist() // Animation persistante !
                .name(`steel-chain-${caster.id}-${targetActor.token.id}`) // Nom unique pour la retrouver
                .fadeIn(500);
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== ADD ACTIVE EFFECT TO TARGET =====
    if (targetActor?.actor) {
        try {
            await targetActor.actor.createEmbeddedDocuments("ActiveEffect", [{
                name: SPELL_CONFIG.chainEffect.name,
                icon: SPELL_CONFIG.chainEffect.icon,
                description: SPELL_CONFIG.chainEffect.description,
                flags: {
                    world: {
                        chainCaster: caster.id, // ID du lanceur pour retrouver la chaîne
                        chainTarget: targetActor.token.id, // ID de la cible
                        chainSequenceName: `steel-chain-${caster.id}-${targetActor.token.id}` // Nom de l'animation
                    }
                }
            }]);

            console.log(`[DEBUG] Applied chain effect to ${targetName}`);
        } catch (error) {
            console.error("Error applying chain effect:", error);
            ui.notifications.warn("Impossible d'appliquer l'effet d'enchaînement !");
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const actualMana = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
            'GRATUIT (Position Focus)' : `${SPELL_CONFIG.manaCost} mana`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de Physique: +${characteristicInfo.effectBonus} (Serpent exclu)</div>
            </div>` : '';

        const bonusInfo = attackBonus > 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
            </div>
        `;

        const chainDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>🔗 Chaîne d'Acier</strong></div>
                <div style="font-size: 1.2em; color: #c0c0c0; font-weight: bold;">Cible: ${targetName}</div>
                <div style="font-size: 0.8em; color: #666;">Aucun dégât - Enchaînement magique</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Utilisez "Terminer Chaîne" pour libérer</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f5f5f5, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #c0c0c0; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">🔗 ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Guerrier:</strong> ${actor.name} | <strong>Coût:</strong> ${actualMana}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${chainDisplay}
            </div>
        `;
    }

    // Send attack roll to chat
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createFlavor(),
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    ui.notifications.info(`🔗 ${SPELL_CONFIG.name} lancée !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}. Chaîne active !`);

})();
