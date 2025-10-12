/**
 * Tourbillon Dévastateur - Ora's Devastating Vortex Attack
 *
 * Ora attaque une cible prise dans un de ses tourbillons, infligeant des dégâts dévastateurs.
 *
 * - Coût : 3 mana (non focalisable)
 * - Caractéristique d'attaque : Esprit (+ effets actifs sur 'esprit')
 * - Dégâts : 1d6 + Esprit + bonus
 * - Cible : Une cible affectée par l'effet "Tourbillon"
 * - Prérequis : La cible doit être dans un tourbillon d'Ora
 *
 * Mécaniques :
 * - Détecte automatiquement les cibles dans les tourbillons d'Ora
 * - Interface de sélection pour choisir la cible à attaquer
 * - Dégâts maximisés en Position Offensive
 * - Animation d'explosion sur la cible
 *
 * Animations :
 * - Explosion : jb2a_patreon.explosion.05.bluewhite (sur la cible)
 *
 * Usage : sélectionner le token d'Ora, lancer la macro et choisir la cible dans un tourbillon.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Tourbillon Dévastateur",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        manaCost: 3,
        spellLevel: 1,
        isDirect: true, // Sort direct - bénéficie des bonus d'effets actifs sur les dégâts
        isFocusable: false, // Non focalisable

        damage: {
            formula: "1d6",
            statMultiplier: 1.0, // Esprit complet
            displayFormula: "1d6 + Esprit"
        },

        animations: {
            explosion: "jb2a_patreon.explosion.05.bluewhite",
            explosionScale: 0.5
        },

        targeting: {
            requiresVortexEffect: true,
            vortexEffectName: "Tourbillon"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton d'Ora !");
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
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                total += flagValue;
            }
        }
        return total;
    }

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
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

    // ===== DÉTECTION DES CIBLES DANS LES TOURBILLONS =====
    function findTargetsInVortex() {
        const targets = [];

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === caster.id) continue; // Skip Ora elle-même

            // Chercher l'effet "Tourbillon" créé par Ora
            for (const effect of token.actor.effects.contents) {
                // Vérifier si c'est un effet de tourbillon d'Ora
                if (effect.name === SPELL_CONFIG.targeting.vortexEffectName &&
                    effect.flags?.world?.vortexCaster === caster.id) {

                    targets.push({
                        token: token,
                        actor: token.actor,
                        effect: effect,
                        vortexIndex: effect.flags?.world?.vortexIndex || 0,
                        createdAt: effect.flags?.world?.createdAt || "Inconnu"
                    });
                    break; // Un seul effet tourbillon par token normalement
                }
            }
        }

        return targets;
    }

    const vortexTargets = findTargetsInVortex();

    if (vortexTargets.length === 0) {
        ui.notifications.warn("🌊 Aucune cible dans un tourbillon d'Ora détectée ! Vous devez d'abord créer des tourbillons avec le sort Tourbillon.");
        return;
    }

    // ===== DIALOG DE SÉLECTION DE LA CIBLE =====
    async function showTargetSelectionDialog() {
        const manaInfo = `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana (non focalisable)`;

        const damageInfo = currentStance === 'offensif'
            ? `Dégâts : <strong>Maximisés en Position Offensive</strong>`
            : `Dégâts : <strong>Normaux (lancer de dés)</strong>`;

        return new Promise((resolve) => {
            let dialogContent = `
                <h3>Sort de ${SPELL_CONFIG.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}</h3>
                <p>${manaInfo}</p>
                <p><strong>Caractéristique ${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <h4>Cibles dans les Tourbillons</h4>
                    <p><strong>Sélectionnez la cible à attaquer :</strong></p>
            `;

            vortexTargets.forEach((target, index) => {
                const createdTime = target.createdAt !== "Inconnu"
                    ? new Date(target.createdAt).toLocaleTimeString()
                    : "Inconnu";

                dialogContent += `
                    <label style="display: block; margin: 8px 0; padding: 8px; border: 1px solid #2196f3; border-radius: 4px; background: #e3f2fd;">
                        <input type="radio" name="targetIndex" value="${index}" ${index === 0 ? 'checked' : ''}>
                        <strong>${target.token.name}</strong>
                        <em>(Tourbillon #${target.vortexIndex + 1}, créé à ${createdTime})</em>
                    </label>
                `;
            });

            dialogContent += `
                </div>

                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <h4>Bonus Manuels</h4>
                    <div style="margin: 5px 0;">
                        <label>Bonus de dégâts :
                            <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                        </label>
                        <small style="display: block; margin-left: 20px;">Objets, effets temporaires, etc.</small>
                    </div>
                    <div style="margin: 5px 0;">
                        <label>Bonus de résolution d'attaque :
                            <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                        </label>
                        <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                    </div>
                </div>

                <p>${damageInfo}</p>
                <p><strong>Jet d'attaque :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}</span></p>

                <script>
                    document.getElementById('attackBonus').addEventListener('input', function() {
                        const base = ${characteristicInfo.final};
                        const bonus = parseInt(this.value) || 0;
                        const total = base + bonus;
                        document.getElementById('finalAttack').textContent = total + 'd7 + ${2 * SPELL_CONFIG.spellLevel}';
                    });
                </script>
            `;

            new Dialog({
                title: `Sort de ${SPELL_CONFIG.name}`,
                content: dialogContent,
                buttons: {
                    confirm: {
                        label: "🌊 Attaquer dans le Tourbillon",
                        callback: (html) => {
                            const targetIndex = parseInt(html.find('input[name="targetIndex"]:checked').val());
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const target = vortexTargets[targetIndex];
                            resolve({ target, damageBonus, attackBonus });
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

    const spellConfig = await showTargetSelectionDialog();
    if (!spellConfig) return;

    const { target, damageBonus, attackBonus } = spellConfig;

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        // Pour un sort direct, inclure les bonus d'effets actifs sur les dégâts
        const activeEffectDamageBonus = SPELL_CONFIG.isDirect ? getActiveEffectBonus(actor, 'damage') : 0;
        const totalStatBonus = Math.floor(characteristicInfo.final * SPELL_CONFIG.damage.statMultiplier);
        const totalDamageBonus = damageBonus + activeEffectDamageBonus;
        const finalDamageBonus = totalStatBonus + totalDamageBonus;

        if (currentStance === 'offensif') {
            // Dégâts maximisés en position offensive
            const maxBaseDamage = 6; // 1d6 max
            const maxDamage = maxBaseDamage + finalDamageBonus;

            return {
                total: maxDamage,
                formula: `6 + ${finalDamageBonus}`,
                result: `6 + ${finalDamageBonus}`,
                isMaximized: true,
                breakdown: {
                    baseDice: "6 (maximisé)",
                    statBonus: totalStatBonus,
                    manualBonus: damageBonus,
                    activeEffectBonus: activeEffectDamageBonus,
                    total: maxDamage
                }
            };
        } else {
            // Lancer les dés normalement
            const roll = new Roll(`${SPELL_CONFIG.damage.formula} + @finalBonus`, {
                finalBonus: finalDamageBonus
            });
            await roll.evaluate({ async: true });

            roll.breakdown = {
                baseDice: `${SPELL_CONFIG.damage.formula}`,
                statBonus: totalStatBonus,
                manualBonus: damageBonus,
                activeEffectBonus: activeEffectDamageBonus,
                total: roll.total
            };

            return roll;
        }
    }

    const damage = await calculateDamage();

    // ===== ANIMATIONS (Sequencer) =====
    async function playExplosionAnimation() {
        if (!target.token) return;

        const sequence = new Sequence();

        // Explosion dévastatrice sur la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.explosion)
            .attachTo(target.token)
            .scale(SPELL_CONFIG.animations.explosionScale)

        await sequence.play();
    }

    await playExplosionAnimation();

    // ===== ATTACK + DAMAGE RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;
    let combinedParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    if (currentStance !== 'offensif') {
        // Ajouter les dés de dégâts si pas maximisé
        const activeEffectDamageBonus = SPELL_CONFIG.isDirect ? getActiveEffectBonus(actor, 'damage') : 0;
        const totalStatBonus = Math.floor(characteristicInfo.final * SPELL_CONFIG.damage.statMultiplier);
        const finalDamageBonus = totalStatBonus + damageBonus + activeEffectDamageBonus;

        combinedParts.push(`${SPELL_CONFIG.damage.formula} + ${finalDamageBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    const attackResult = combinedRoll.terms[0].results[0];

    // ===== CHAT MESSAGE =====
    const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
    const vortexInfo = `Tourbillon #${target.vortexIndex + 1}`;

    function createFlavor() {
        let damageBreakdown = "";
        if (damage.breakdown) {
            const parts = [];
            if (damage.breakdown.baseDice) parts.push(`Dés: ${damage.breakdown.baseDice}`);
            if (damage.breakdown.statBonus > 0) parts.push(`${SPELL_CONFIG.characteristicDisplay}: +${damage.breakdown.statBonus}`);
            if (damage.breakdown.manualBonus > 0) parts.push(`Bonus manuel: +${damage.breakdown.manualBonus}`);
            if (damage.breakdown.activeEffectBonus > 0) parts.push(`Effets actifs: +${damage.breakdown.activeEffectBonus}`);

            if (parts.length > 0) {
                damageBreakdown = `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${parts.join(', ')})</div>`;
            }
        }

        return `
            <div style="background: linear-gradient(135deg, #e3f2fd, #fff3e0); padding: 12px; border-radius: 8px; border: 2px solid #ff6f00; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #e65100;">💥 Sort de ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana
                    </div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e7f3ff; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #0066cc; margin-bottom: 6px;"><strong>🌊 Cible dans ${vortexInfo}${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${target.token.name}</div>
                    <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS DÉVASTATEURS: ${damage.total}</div>
                    ${damageBreakdown}
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>⚠️ Notes:</strong> Attaque directe dans le tourbillon. La cible subira des dégâts dévastateurs !</div>
                </div>
            </div>
        `;
    }

    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

    ui.notifications.info(`🌊 Sort de ${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${target.token.name} dans ${vortexInfo}${maximizedInfo}. Jet d'attaque : ${attackResult.result}.`);

})();
