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
 * - Jet de libération : Volonté opposé contre Moctei (jet manuel chaque tour)
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
        dexterityDivisor: 3, // Dextérité/2 pour dégâts fixes
        isMultipleAllowed: true, // Peut lancer plusieurs manipulations

        animations: {
            cast: "jaamod.spells_effects.black_tentacle2",
            shadowTendril: "animated-spell-effects.air.smoke.black_ray", // Trait d'ombre persistant
            immobilization: "jb2a_patreon.black_tentacles.dark_purple", // Effet d'immobilisation
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
            icon: "icons/creatures/tentacles/tentacles-suctioncups-pink.webp",
            description: "Immobilisé par les ombres de Moctei - Ne peut pas se déplacer"
        },

        // Configuration de l'effet sur Moctei pour tracker l'état
        casterEffect: {
            name: "Manipulation des ombres (Contrôle)",
            icon: "icons/creatures/tentacles/tentacles-octopus-black-pink.webp",
            description: "Contrôle une manipulation d'ombre active"
        },

        // Jet de libération de la cible (opposé)
        willpowerSave: {
            characteristic: "volonte",
            description: "Jet de Volonté opposé pour tenter de se libérer des ombres"
        },

        // Configuration du combo avec Feu Obscur
        comboOption: {
            name: "Combo Feu Obscur",
            manaCost: 2, // Coût additionnel
            isFocusable: true,
            description: "Applique aussi Feu Obscur en cas de coup réussi",
            flameAnimation: "jb2a.markers.simple.001.complete.001.purple",
            flameEffect: {
                name: "Flamme Noire",
                icon: "icons/magic/fire/flame-burning-skull-orange.webp",
                description: "Brûlé par les flammes noires de Moctei - Dégâts continus (depuis Manipulation des ombres)"
            }
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
                                <li>⚔️ <strong>Dégâts initiaux :</strong> ${Math.ceil(characteristicInfo.final / SPELL_CONFIG.dexterityDivisor)} (Dex/2, fixes)</li>
                                <li>🔄 <strong>Dégâts/tour :</strong> ${Math.ceil(characteristicInfo.final / SPELL_CONFIG.dexterityDivisor)} (Dex/2, fixes)</li>
                                <li>🚫 <strong>Immobilisation :</strong> La cible ne peut pas se déplacer</li>
                                <li>🎲 <strong>Libération :</strong> Jet de Volonté opposé (manuel chaque tour)</li>
                            </ul>
                        </div>

                        <div style="margin: 10px 0; padding: 10px; background: #fff3e0; border-radius: 4px; border: 2px solid #f57c00;">
                            <h4 style="margin: 0 0 10px 0; color: #e65100;">🔥 Options Combo (+2 mana, focalisable)</h4>
                            <label style="display: flex; align-items: center; margin-bottom: 8px;">
                                <input type="radio" name="comboOption" value="none" checked style="margin-right: 8px;">
                                <span><strong>Manipulation seule</strong> - Effet standard</span>
                            </label>
                            <label style="display: flex; align-items: center;">
                                <input type="radio" name="comboOption" value="darkFlame" style="margin-right: 8px;">
                                <span><strong>+ Feu Obscur</strong> - Applique aussi Flamme Noire en cas de coup réussi</span>
                            </label>
                            <div style="margin-top: 8px; font-size: 0.9em; color: #bf360c; font-style: italic;">
                                ⚠️ Le Feu Obscur combo ne peut pas être étendu aux cibles adjacentes
                            </div>
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
                            const comboOption = html.find('input[name="comboOption"]:checked').val();
                            resolve({ attackBonus, damageBonus, comboOption });
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
    const { attackBonus, damageBonus, comboOption } = userConfig;

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

    // Get actor at target location (grid-aware detection with visibility filtering)
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Calculate token's grid position
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Handle multi-grid tokens (width/height > 1)
                const tokenWidth = Math.ceil(token.document.width);
                const tokenHeight = Math.ceil(token.document.height);

                // Check if target grid position intersects with token's grid area
                const intersects = targetGridX >= tokenGridX &&
                    targetGridX < tokenGridX + tokenWidth &&
                    targetGridY >= tokenGridY &&
                    targetGridY < tokenGridY + tokenHeight;

                // Only include visible tokens to avoid targeting hidden enemies
                return intersects && token.visible;
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
                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;

                const distance = Math.sqrt(
                    Math.pow(tokenCenterX - x, 2) +
                    Math.pow(tokenCenterY - y, 2)
                );

                // Only include visible tokens to avoid targeting hidden enemies
                return distance <= tolerance && token.visible;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    } const targetActor = getActorAtLocation(target.x, target.y);
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
                .stretchTo(targetActor.token, { attachTo: true })
                .scale(0.8)
                .persist()
                .name(`shadow-manipulation-${caster.id}-${targetActor.token.id}`)
                .fadeIn(1000)
                .fadeOut(1000)
                .tint("#2e0054");

            // Effet d'immobilisation sur la cible
            if (SPELL_CONFIG.animations.immobilization) {
                seq.effect()
                    .file(SPELL_CONFIG.animations.immobilization)
                    .attachTo(targetActor.token)
                    .scale(0.2)
                    .persist()
                    .name(`shadow-immobilization-${targetActor.token.id}`)
                    .fadeIn(1000)
                    .fadeOut(1000)
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
    const baseDamage = Math.ceil(characteristicInfo.final / SPELL_CONFIG.dexterityDivisor);

    // Dégâts initiaux (avec bonus d'effets)
    const initialDamage = baseDamage + (damageBonus || 0) + effectDamageBonus;

    // Dégâts continus (SANS bonus d'effets, uniquement base + bonus manuel)
    const continuousDamage = baseDamage + (damageBonus || 0);

    // ===== COMBO CONFIGURATION =====
    const isComboActive = comboOption === 'darkFlame';
    const comboManaCost = isComboActive ? SPELL_CONFIG.comboOption.manaCost : 0;
    const comboManaCostReduced = (currentStance === 'focus' && SPELL_CONFIG.comboOption.isFocusable);
    const finalComboManaCost = isComboActive ? (comboManaCostReduced ? 0 : comboManaCost) : 0;

    // Calculs pour le Feu Obscur combo (basé sur Dextérité comme dans feu-obscur.js)
    let darkFlameInitialDamage = 0;
    let darkFlameContinuousDamage = 0;
    if (isComboActive) {
        darkFlameInitialDamage = Math.ceil(characteristicInfo.final / 2); // Dex/2 arrondi sup
        darkFlameContinuousDamage = Math.ceil(characteristicInfo.final / 4); // Dex/4 arrondi sup
    }

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
                    damagePerTurn: continuousDamage
                },
                // Immobilisation: empêche le mouvement
                immobilized: { value: true },
                // Pas de malus de stats, juste l'immobilisation
                statuscounter: { value: continuousDamage }
            }
        };

        try {
            // Use GM delegation for effect application if available
            if (globalThis.gmSocket) {
                console.log(`[Moctei] Applying shadow manipulation to ${targetName} via GM socket`);
                await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.token.id, targetEffectData);
            } else {
                // Fallback: direct application if GM socket not available
                console.log(`[Moctei] GM Socket not available, applying effect directly to ${targetName}`);
                await targetActor.token.actor.createEmbeddedDocuments("ActiveEffect", [targetEffectData]);
            }
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

        // ===== COMBO DARK FLAME APPLICATION =====
        if (isComboActive) {
            // Animation du Feu Obscur combo (après toutes les autres)
            const comboSeq = new Sequence();
            comboSeq.effect()
                .file(SPELL_CONFIG.comboOption.flameAnimation)
                .attachTo(targetActor.token)
                .scale(0.6)
                .name(`dark-flame-combo-${caster.id}-${targetActor.token.id}`)
                .tint("#1a0033")
                .opacity(0.8)
                .delay(2000); // Déclenché après les autres animations

            await comboSeq.play();

            // Appliquer l'effet Flamme Noire combo
            const darkFlameEffectData = {
                name: SPELL_CONFIG.comboOption.flameEffect.name,
                icon: SPELL_CONFIG.comboOption.flameEffect.icon,
                description: SPELL_CONFIG.comboOption.flameEffect.description,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        darkFlameCaster: caster.id,
                        darkFlameTarget: targetActor.token.id,
                        darkFlameSequenceName: `dark-flame-combo-${caster.id}-${targetActor.token.id}`,
                        darkFlameType: "source", // Considéré comme source pour le comptage
                        spellName: "Feu obscur (Combo)",
                        maintenanceCost: 1, // Même maintenance que Feu Obscur normal
                        damagePerTurn: darkFlameContinuousDamage,
                        isComboFlame: true // Flag pour identifier les flammes combo
                    },
                    statuscounter: { value: darkFlameContinuousDamage, visible: true }
                }
            };

            try {
                // Use GM delegation for effect application if available
                if (globalThis.gmSocket) {
                    console.log(`[Moctei] Applying combo dark flame to ${targetName} via GM socket`);
                    await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.token.id, darkFlameEffectData);
                } else {
                    // Fallback: direct application if GM socket not available
                    console.log(`[Moctei] GM Socket not available, applying effect directly to ${targetName}`);
                    await targetActor.token.actor.createEmbeddedDocuments("ActiveEffect", [darkFlameEffectData]);
                }
                console.log(`[Moctei] Applied combo dark flame to ${targetName}`);

                // Gérer l'effet de contrôle Feu Obscur sur Moctei
                const existingDarkFlameControl = actor.effects.find(e => e.name === "Feu obscur (Contrôle)");

                if (existingDarkFlameControl) {
                    // Mettre à jour l'effet de contrôle existant
                    const currentSources = existingDarkFlameControl.flags?.world?.darkFlameInitialSources || [];
                    const currentExtensions = existingDarkFlameControl.flags?.world?.darkFlameExtensions || [];
                    const updatedSources = [...currentSources, targetActor.token.id];
                    const allAffectedTargets = [...updatedSources, ...currentExtensions];

                    const updateData = {
                        description: `Contrôle des flammes noires actives - ${updatedSources.length} source(s) active(s)`,
                        flags: {
                            ...existingDarkFlameControl.flags,
                            world: {
                                ...existingDarkFlameControl.flags.world,
                                darkFlameInitialSources: updatedSources,
                                darkFlameExtensions: currentExtensions,
                                darkFlameTargets: allAffectedTargets
                            },
                            statuscounter: { value: updatedSources.length, visible: true }
                        }
                    };

                    await existingDarkFlameControl.update(updateData);
                    console.log(`[Moctei] Updated existing dark flame control for combo`);
                } else {
                    // Créer un nouvel effet de contrôle Feu Obscur
                    const darkFlameControlData = {
                        name: "Feu obscur (Contrôle)",
                        icon: "icons/magic/fire/flame-burning-eye.webp",
                        description: `Contrôle des flammes noires actives - 1 source(s) active(s)`,
                        duration: { seconds: 86400 },
                        flags: {
                            world: {
                                darkFlameInitialSources: [targetActor.token.id],
                                darkFlameExtensions: [],
                                darkFlameTargets: [targetActor.token.id],
                                spellName: "Feu obscur",
                                maintenanceCost: 1
                            },
                            statuscounter: { value: 1, visible: true }
                        }
                    };

                    await actor.createEmbeddedDocuments("ActiveEffect", [darkFlameControlData]);
                    console.log(`[Moctei] Created new dark flame control for combo`);
                }

            } catch (error) {
                console.error(`[Moctei] Error applying combo dark flame:`, error);
                ui.notifications.error(`Erreur lors de l'application du Feu Obscur combo !`);
            }
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        let actualMana = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
            `GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} par tour` :
            `${SPELL_CONFIG.manaCost} mana + ${SPELL_CONFIG.maintenanceCost} par tour`;

        if (isComboActive) {
            const comboText = finalComboManaCost === 0 ? "GRATUIT (Position Focus)" : `${finalComboManaCost} mana`;
            actualMana += ` + ${comboText} (Combo Feu Obscur) + 1 mana/tour`;
        }

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
                <div style="font-size: 1.2em; color: #4a148c; font-weight: bold;">💀 DÉGÂTS INITIAUX: ${initialDamage} (fixes)</div>
                <div style="font-size: 0.9em; color: #666;">Base: ${baseDamage} + Bonus Manuel: ${damageBonus || 0} + Bonus Effets: ${effectDamageBonus}</div>
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
                    <div>💜 <strong>Dégâts continus Manipulation</strong> - ${continuousDamage} points par tour (fixes, sans bonus d'effets)</div>
                    <div>🎲 <strong>Jet de libération</strong> - Volonté opposé (manuel chaque tour)</div>
                    ${isComboActive ? `<div>🔥 <strong>Flamme Noire Combo</strong> - ${darkFlameContinuousDamage} points par tour supplémentaires</div>` : ''}
                </div>
            </div>
        ` : '';

        const comboDisplay = isComboActive ? `
            <div style="margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px; border: 2px solid #f57c00;">
                <div style="font-size: 1.1em; color: #e65100; font-weight: bold; margin-bottom: 6px;">🔥 COMBO FEU OBSCUR ACTIVÉ</div>
                <div style="font-size: 0.9em; color: #bf360c;">
                    <div>💥 <strong>Dégâts initiaux Feu Obscur:</strong> ${darkFlameInitialDamage} (Dex/2, arrondi sup.)</div>
                    <div>🔥 <strong>Dégâts continus Feu Obscur:</strong> ${darkFlameContinuousDamage} (Dex/4, arrondi sup.)</div>
                    <div>🔥 <strong>Maintenance:</strong> +1 mana par tour pour le Feu Obscur</div>
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
                ${comboDisplay}
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

    const comboInfo = isComboActive ? ` + Feu Obscur (${darkFlameInitialDamage} initiaux, ${darkFlameContinuousDamage}/tour)` : '';
    const totalMaintenanceCost = SPELL_CONFIG.maintenanceCost + (isComboActive ? 1 : 0);

    ui.notifications.info(`🌑 ${SPELL_CONFIG.name} lancée !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}, Dégâts initiaux: ${initialDamage}, Continus: ${continuousDamage}/tour. Immobilisé !${comboInfo} (${totalMaintenanceCost} mana/tour) [${totalManipulations} manipulation(s) active(s)]`);

})();
