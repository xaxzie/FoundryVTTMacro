/**
 * Manipulation des ombres - Moctei (Mage des Ombres)
 *
 * Moctei projette un trait d'ombre qui se dirige vers un adversaire pour l'immobiliser
 * et lui infliger des dégâts continus. La cible ne peut plus se déplacer mais peut
 * tenter de se libérer par un jet de Volonté.
 *
 * - Coût initial : 4 mana (focalisable) + 1 mana par tour maintenu
 * - Caractéristique d'attaque : Dextérité (+ effets actifs + bonus manuels)
 * - Dégâts initiaux : Dextérité/2 (dégâts fixes, pas de dés)
 * - Dégâts par tour : Dextérité/2 (dégâts fixes, pas de dés)
 * - Effet : La cible ne peut pas se déplacer (immobilisation totale)
 * - Jet de sauvegarde : Volonté de l'adversaire (mentionné dans le résumé)
 * - Spécialité : Moctei peut lancer plusieurs manipulations, une seule cible par lancement
 *
 * Animations :
 * - Cast : Animation d'invocation d'ombre
 * - Shadow Tendril : Trait d'ombre persistant vers la cible (inspiré du Royaume monocible)
 * - Immobilization : Effet d'immobilisation sur la cible
 *
 * Usage : sélectionner le token de Moctei, lancer la macro et choisir la cible.
 * Utiliser la macro "endMocteiEffect.js" pour terminer la manipulation.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Manipulation des ombres",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        manaCost: 4,
        maintenanceCost: 1, // Coût par tour pour maintenir
        spellLevel: 2,
        isDirect: true,
        isFocusable: true,
        hasNoDamage: false, // Ce sort fait des dégâts
        dexterityDivisor: 2, // Dextérité/2 pour dégâts fixes
        isMultipleAllowed: true, // Peut lancer plusieurs manipulations

        animations: {
            cast: "jb2a.eldritch_blast.dark_purple",
            shadowTendril: "jb2a.chain.02.complete.01.dark_purple", // Trait d'ombre persistant
            immobilization: "jb2a.markers.chain.standard.loop.01.dark_purple", // Effet d'immobilisation
            sound: null
        },

        targeting: {
            range: 250, // Portée du trait d'ombre
            color: "#2e0054", // Couleur violet très sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        },

        // Configuration de l'effet persistant sur la cible
        targetEffect: {
            name: "Manipulation des ombres",
            icon: "icons/magic/unholy/hand-glow-pink-purple.webp",
            description: "Immobilisé par les ombres de Moctei - Ne peut pas se déplacer"
        },

        // Configuration de l'effet sur Moctei pour tracker l'état
        casterEffect: {
            name: "Manipulation des ombres (Contrôle)",
            icon: "icons/magic/symbols/runes-star-purple.webp",
            description: "Contrôle une manipulation d'ombre active"
        },

        // Jet de sauvegarde de la cible
        willpowerSave: {
            characteristic: "volonte",
            difficulty: 15, // Difficulté de base pour se libérer
            description: "Jet de Volonté pour tenter de se libérer des ombres"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Moctei !");
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

    // Active effect bonuses
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            if (effect.flags && typeof effect.flags === 'object') {
                for (const [key, value] of Object.entries(effect.flags)) {
                    if (key === flagKey && typeof value === 'object' && value.value !== undefined) {
                        totalBonus += value.value;
                    }
                }
            }
        }
        return totalBonus;
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

    // ===== CHECK EXISTING MANIPULATIONS =====
    const existingManipulations = actor.effects?.contents?.filter(e =>
        e.name === SPELL_CONFIG.casterEffect.name
    ) || [];

    const manipulationCount = existingManipulations.length;

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
            `<strong>Coût en Mana :</strong> GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} par tour maintenu` :
            `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana initial + ${SPELL_CONFIG.maintenanceCost} par tour maintenu`;

        const manipulationInfo = manipulationCount > 0 ?
            `<div style="color: #4a148c; font-weight: bold; margin: 10px 0; padding: 8px; background: #f3e5f5; border-radius: 4px;">
                📊 Manipulations actives : ${manipulationCount}
                <br><small>Vous pouvez en lancer une nouvelle sur une autre cible</small>
            </div>` : '';

        return new Promise(resolve => {
            new Dialog({
                title: `🌑 ${SPELL_CONFIG.name}`,
                content: `
                    <div style="margin-bottom: 15px;">
                        <h3 style="border-bottom: 2px solid #4a148c; color: #4a148c;">${SPELL_CONFIG.name}</h3>
                        <p><strong>Lanceur:</strong> ${actor.name}</p>
                        <p><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})</p>
                        ${manaInfo}
                        ${manipulationInfo}

                        <div style="margin: 10px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                            <strong>📝 Effet du sort :</strong>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                <li>🎯 <strong>Toucher :</strong> Dextérité (${characteristicInfo.final})</li>
                                <li>⚔️ <strong>Dégâts initiaux :</strong> ${Math.floor(characteristicInfo.final / SPELL_CONFIG.dexterityDivisor)} (Dex/2, fixes)</li>
                                <li>🔄 <strong>Dégâts/tour :</strong> ${Math.floor(characteristicInfo.final / SPELL_CONFIG.dexterityDivisor)} (Dex/2, fixes)</li>
                                <li>🚫 <strong>Immobilisation :</strong> La cible ne peut pas se déplacer</li>
                                <li>🎲 <strong>Libération :</strong> Jet de Volonté (Difficulté ${SPELL_CONFIG.willpowerSave.difficulty})</li>
                            </ul>
                        </div>

                        <div style="margin: 10px 0;">
                            <label for="attackBonus" style="font-weight: bold;">Bonus d'Attaque Manuel :</label>
                            <input type="number" id="attackBonus" value="0" min="0" max="10" style="width: 60px; margin-left: 5px;">
                            <small style="color: #666; margin-left: 10px;">dés supplémentaires</small>
                        </div>

                        <div style="margin: 10px 0;">
                            <label for="damageBonus" style="font-weight: bold;">Bonus de Dégâts Manuel :</label>
                            <input type="number" id="damageBonus" value="0" min="0" max="20" style="width: 60px; margin-left: 5px;">
                            <small style="color: #666; margin-left: 10px;">points supplémentaires</small>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "🌑 Lancer",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({ attackBonus, damageBonus });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast"
            }, {
                width: 500,
                height: "auto"
            }).render(true);
        });
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }
    const { attackBonus, damageBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        try {
            const crosshairs = await warpgate.crosshairs.show({
                size: 1,
                icon: 'icons/magic/unholy/hand-glow-pink-purple.webp',
                label: 'Manipulation des ombres',
                tag: 'shadow-manipulation-crosshairs',
                drawIcon: true,
                drawOutline: true,
                interval: 2
            });
            return crosshairs;
        } catch (e) {
            console.log("Portal targeting cancelled or failed:", e);
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    // Get actor at target location (grid-aware detection)
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Get grid position
            const [gridX, gridY] = canvas.grid.getCenter(x, y);

            // Find tokens at this grid position (with some tolerance)
            const tolerance = gridSize * 0.3;
            const tokens = canvas.tokens.placeables.filter(token => {
                const tokenCenterX = token.x + (token.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.height * gridSize) / 2;

                const distance = Math.sqrt(
                    Math.pow(tokenCenterX - gridX, 2) +
                    Math.pow(tokenCenterY - gridY, 2)
                );

                return distance <= tolerance;
            });

            // Prefer visible tokens, then controlled tokens, then any token
            const visibleTokens = tokens.filter(t => t.visible);
            const controlledTokens = tokens.filter(t => t.controlled);

            let selectedToken = null;
            if (controlledTokens.length > 0) {
                selectedToken = controlledTokens[0];
            } else if (visibleTokens.length > 0) {
                selectedToken = visibleTokens[0];
            } else if (tokens.length > 0) {
                selectedToken = tokens[0];
            }

            return selectedToken;
        } else {
            // No grid - check exact position
            const tokens = canvas.tokens.placeables.filter(token => {
                const tokenBounds = {
                    left: token.x,
                    right: token.x + token.width * gridSize,
                    top: token.y,
                    bottom: token.y + token.height * gridSize
                };

                return x >= tokenBounds.left && x < tokenBounds.right &&
                    y >= tokenBounds.top && y < tokenBounds.bottom;
            });

            const visibleTokens = tokens.filter(t => t.visible);
            const controlledTokens = tokens.filter(t => t.controlled);

            if (controlledTokens.length > 0) {
                return controlledTokens[0];
            } else if (visibleTokens.length > 0) {
                return visibleTokens[0];
            } else if (tokens.length > 0) {
                return tokens[0];
            }

            return null;
        }
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : 'position';

    // Check if target already has a shadow manipulation
    if (targetActor?.actor) {
        const existingManipulation = targetActor.actor.effects.find(e => e.name === SPELL_CONFIG.targetEffect.name);
        if (existingManipulation) {
            ui.notifications.error(`${targetName} est déjà sous l'effet d'une Manipulation des ombres !`);
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
                .attachTo(caster)
                .scale(0.6)
                .duration(2000)
                .fadeOut(800)
                .belowTokens();
        }

        // Trait d'ombre persistant si on a une cible valide
        if (SPELL_CONFIG.animations.shadowTendril && targetActor?.token) {
            seq.effect()
                .file(SPELL_CONFIG.animations.shadowTendril)
                .attachTo(caster)
                .stretchTo(targetActor.token)
                .scale(0.8)
                .persist()
                .name(`shadow-manipulation-${caster.id}-${targetActor.token.id}`)
                .fadeIn(1000)
                .tint("#2e0054");

            // Effet d'immobilisation sur la cible
            if (SPELL_CONFIG.animations.immobilization) {
                seq.effect()
                    .file(SPELL_CONFIG.animations.immobilization)
                    .attachTo(targetActor.token)
                    .scale(1.2)
                    .persist()
                    .name(`shadow-immobilization-${targetActor.token.id}`)
                    .fadeIn(1000)
                    .tint("#2e0054")
                    .opacity(0.8);
            }
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== DAMAGE CALCULATION (FIXED, NO DICE) =====
    const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
    const baseDamage = Math.floor(characteristicInfo.final / SPELL_CONFIG.dexterityDivisor);
    const totalDamage = baseDamage + (damageBonus || 0) + effectDamageBonus;

    // ===== ADD ACTIVE EFFECTS =====
    if (targetActor?.actor) {
        // Effet sur la cible
        const targetEffectData = {
            name: SPELL_CONFIG.targetEffect.name,
            icon: SPELL_CONFIG.targetEffect.icon,
            description: SPELL_CONFIG.targetEffect.description,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    shadowManipulationCaster: caster.id,
                    shadowManipulationTarget: targetActor.token.id,
                    shadowManipulationSequenceName: `shadow-manipulation-${caster.id}-${targetActor.token.id}`,
                    immobilizationSequenceName: `shadow-immobilization-${targetActor.token.id}`,
                    spellName: SPELL_CONFIG.name,
                    maintenanceCost: SPELL_CONFIG.maintenanceCost,
                    damagePerTurn: totalDamage
                },
                // Immobilisation: empêche le mouvement
                immobilized: { value: true },
                // Pas de malus de stats, juste l'immobilisation
                statuscounter: { value: totalDamage }
            }
        };

        try {
            await targetActor.actor.createEmbeddedDocuments("ActiveEffect", [targetEffectData]);
            console.log(`[Moctei] Applied shadow manipulation to ${targetName}`);
        } catch (error) {
            console.error(`[Moctei] Error applying effect to ${targetName}:`, error);
            ui.notifications.error(`Erreur lors de l'application de l'effet sur ${targetName} !`);
        }

        // Effet sur le lanceur (pour tracker les manipulations actives)
        const casterEffectData = {
            name: SPELL_CONFIG.casterEffect.name,
            icon: SPELL_CONFIG.casterEffect.icon,
            description: `${SPELL_CONFIG.casterEffect.description} - Cible: ${targetName}`,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    shadowManipulationTarget: targetActor.token.id,
                    shadowManipulationSequenceName: `shadow-manipulation-${caster.id}-${targetActor.token.id}`,
                    targetName: targetName,
                    spellName: SPELL_CONFIG.name,
                    maintenanceCost: SPELL_CONFIG.maintenanceCost
                },
                statuscounter: { value: 1 } // Compte une manipulation active
            }
        };

        try {
            await actor.createEmbeddedDocuments("ActiveEffect", [casterEffectData]);
            console.log(`[Moctei] Applied shadow manipulation control effect`);
        } catch (error) {
            console.error(`[Moctei] Error applying control effect:`, error);
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const actualMana = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
            `GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} par tour` :
            `${SPELL_CONFIG.manaCost} mana + ${SPELL_CONFIG.maintenanceCost} par tour`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de Dextérité: +${characteristicInfo.effectBonus}</div>
            </div>` : '';

        const bonusInfo = (attackBonus > 0 || damageBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
                ${damageBonus > 0 ? `<div>💥 Bonus Manuel de Dégâts: +${damageBonus} points</div>` : ''}
            </div>` : '';

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                <div style="font-size: 1.2em; color: #4a148c; font-weight: bold;">💀 DÉGÂTS: ${totalDamage} (fixes)</div>
                <div style="font-size: 0.9em; color: #666;">Dextérité/2: ${baseDamage} + Bonus: ${(damageBonus || 0) + effectDamageBonus}</div>
            </div>
        `;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: "#fff8e1"; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
            </div>
        `;

        const effectsDisplay = targetActor?.actor ? `
            <div style="margin: 8px 0; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                <div style="font-weight: bold; color: #1976d2;">🌑 Effets appliqués :</div>
                <div style="font-size: 0.9em; margin: 5px 0;">
                    <div>🚫 <strong>Immobilisation totale</strong> - ${targetName} ne peut pas se déplacer</div>
                    <div>💜 <strong>Dégâts continus</strong> - ${totalDamage} points par tour (fixes)</div>
                    <div>🎲 <strong>Jet de sauvegarde</strong> - Volonté (Difficulté ${SPELL_CONFIG.willpowerSave.difficulty}) pour se libérer</div>
                </div>
            </div>
        ` : '';

        const manipulationInfo = manipulationCount > 0 ? `
            <div style="margin: 8px 0; padding: 8px; background: #fce4ec; border-radius: 4px;">
                <div style="font-size: 0.9em; color: #ad1457;">
                    📊 Manipulations totales actives : ${manipulationCount + 1}
                </div>
            </div>
        ` : '';

        return `
            <div style="border: 2px solid #4a148c; border-radius: 8px; padding: 10px; background: linear-gradient(135deg, #f8f4ff 0%, #f0e8ff 100%);">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #4a148c; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                        🌑 ${SPELL_CONFIG.name}
                    </h3>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        <strong>Cible:</strong> ${targetName} | <strong>Coût:</strong> ${actualMana}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-around; margin: 10px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">DEXTÉRITÉ</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #4a148c;">${characteristicInfo.final}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">NIVEAU</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #4a148c;">${SPELL_CONFIG.spellLevel}</div>
                    </div>
                </div>

                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${damageDisplay}
                ${effectsDisplay}
                ${manipulationInfo}
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
    const totalManipulations = manipulationCount + 1;

    ui.notifications.info(`🌑 ${SPELL_CONFIG.name} lancée !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}, Dégâts: ${totalDamage}. Immobilisé ! (${SPELL_CONFIG.maintenanceCost} mana/tour) [${totalManipulations} manipulation(s) active(s)]`);

})();
