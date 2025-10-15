/**
 * Onde Sonore - Yunyun
 *
 * Yunyun projette une puissante onde sonore qui se propage en cercle autour d'une zone ciblée.
 * Sort d'attaque de zone avec dégâts variables selon la situation (déterminés par le MJ).
 *
 * Caractéristiques :
 * - Coût : 1 mana (focalisable)
 * - Niveau : 1
 * - Type : Zone circulaire
 * - Dégâts : Variables selon situation (déterminés par MJ)
 * - Animation : Cast sur Yunyun + onde circulaire sur la zone
 *
 * Usage : Sélectionner le token de Yunyun, puis cibler la position de l'onde.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Onde Sonore",
        description: "Projection d'une onde sonore circulaire dévastatrice",
        characteristic: "charisme",
        characteristicDisplay: "Charisme",
        isDirect: false,
        spellLevel: 1,
        manaCost: 1,
        isFocusable: true,
        appliesFatigue: false,
        animations: {
            cast: "jb2a.cast_generic.sound.01.pinkteal.0",
            waveEffect: "jb2a.soundwave.01.blue",
            sound: null
        },
        targeting: {
            range: 150,
            color: "#2196f3",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        },
        // Configuration pour endYunYunEffect si nécessaire dans le futur
        effectConfig: {
            endEffectConfig: {
                displayName: "Onde Sonore",
                icon: "icons/magic/sonic/explosion-shock-wave-teal.webp",
                description: "Zone d'onde sonore de Yunyun",
                sectionTitle: "🔊 Ondes Sonores",
                sectionIcon: "🔊",
                cssClass: "onde-sonore-effect",
                borderColor: "#2196f3",
                bgColor: "#e3f2fd",
                detectFlags: [
                    { path: "name", matchValue: "Onde Sonore" },
                    { path: "flags.world.yunyunCaster", matchValue: "CASTER_ID" }
                ],
                mechanicType: "instantZone"
            }
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Yunyun !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé pour le token sélectionné !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Détecte la stance actuelle de l'acteur
     */
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    /**
     * Gets active effect bonuses for a specific flag key
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" provides ${flagKey} bonus: ${flagValue}`);
            }
        }

        console.log(`[DEBUG] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
            return { base: 3, injuries: 0, effectBonus: 0, injuryAdjusted: 3, final: 3 };
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${characteristic} reduced by ${injuryStacks} due to injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[DEBUG] ${characteristic} ${effectBonus > 0 ? 'increased' : 'decreased'} by ${effectBonus} due to active effects`);
        }

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    // ===== SPELL CONFIRMATION DIALOG =====
    async function confirmSpellCast() {
        return new Promise((resolve) => {
            const stanceDisplay = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

            const dialogContent = `
                <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 15px; border-radius: 10px; border: 2px solid #2196f3; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #1565c0; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            🔊 ${SPELL_CONFIG.name} 🔊
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">${SPELL_CONFIG.description}</p>
                        <div style="background: rgba(33, 150, 243, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                            <strong>Invocation: ${SPELL_CONFIG.characteristicDisplay}</strong> ${characteristicInfo.final}${stanceDisplay}
                        </div>
                    </div>

                    <div style="background: rgba(33, 150, 243, 0.15); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin-bottom: 15px;">
                        <h3 style="color: #1565c0; margin: 0 0 10px 0; text-align: center;">Caractéristiques du Sort</h3>
                        <div><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</div>
                        <div><strong>Type:</strong> Zone circulaire instantanée</div>
                        <div><strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana (focalisable)</div>
                        <div><strong>Bonus Hit:</strong> +${SPELL_CONFIG.spellLevel * 2}</div>
                        <div><strong>Dégâts:</strong> Variables selon situation (déterminés par MJ)</div>
                    </div>

                    <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107;">
                        <strong>🎯 Instructions de Ciblage :</strong>
                        <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
                            <li>Cliquez sur la zone où l'onde sonore doit se déclencher</li>
                            <li>L'animation de cast sera jouée sur Yunyun</li>
                            <li>L'onde circulaire se propagera depuis le point ciblé</li>
                            <li>Les dégâts seront déterminés par le MJ selon la situation</li>
                        </ul>
                    </div>
                </div>
            `;

            new Dialog({
                title: `${SPELL_CONFIG.name} - Confirmation`,
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-volume-up"></i>',
                        label: "Lancer l'Onde",
                        callback: (html) => {
                            resolve({ confirmed: true });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve({ confirmed: false })
                    }
                },
                default: "cast",
                render: () => {
                    console.log(`[DEBUG] Sound wave confirmation dialog rendered for ${SPELL_CONFIG.name}`);
                }
            }).render(true);
        });
    }

    const spellConfirmation = await confirmSpellCast();
    if (!spellConfirmation.confirmed) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    // ===== TARGETING SYSTEM =====
    async function selectWavePosition() {
        ui.notifications.info(`🎯 Sélectionnez la position pour l'${SPELL_CONFIG.name}...`);

        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            console.error("[DEBUG] Portal targeting error:", error);
            ui.notifications.error("❌ Erreur lors du ciblage. Vérifiez que le module Portal est installé et actif.");
            return null;
        }
    }

    const waveTarget = await selectWavePosition();
    if (!waveTarget) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== SEQUENCER ANIMATIONS =====
    async function playSoundWaveAnimations() {
        try {
            // Animation de cast sur Yunyun (simultané avec l'onde)
            const castSequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animations.cast)
                    .attachTo(caster)
                    .scale(0.8)
                    .fadeIn(200)
                    .fadeOut(500);

            // Animation d'onde circulaire sur la zone ciblée
            const waveSequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animations.waveEffect)
                    .atLocation({ x: waveTarget.x, y: waveTarget.y })
                    .scale(1.5)
                    .fadeIn(100)
                    .fadeOut(1000);

            // Jouer les animations simultanément
            await Promise.all([
                castSequence.play(),
                waveSequence.play()
            ]);

            console.log(`[DEBUG] Sound wave animations complete - Cast on ${actor.name} + Wave at (${Math.floor(waveTarget.x / canvas.grid.size)}, ${Math.floor(waveTarget.y / canvas.grid.size)})`);
        } catch (error) {
            console.error("[DEBUG] Sound wave animation error:", error);
        }
    }

    await playSoundWaveAnimations();

    // ===== ATTACK ROLL (Jet de Touché uniquement) =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalInvocationDice = characteristicInfo.final + characteristicBonus;
    const levelBonus = SPELL_CONFIG.spellLevel * 2;

    const attackRoll = new Roll(`${totalInvocationDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceNote = currentStance ? ` <em>(Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})</em>` : '';
        const targetGridX = Math.floor(waveTarget.x / canvas.grid.size);
        const targetGridY = Math.floor(waveTarget.y / canvas.grid.size);

        return `
            <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1565c0;">🔊 Sort d'${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana
                    </div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(33, 150, 243, 0.1); border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">🎯 JET DE TOUCHÉ: ${attackRoll.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${totalInvocationDice}d7 + ${levelBonus})</div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.3); border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #1565c0; margin-bottom: 6px;"><strong>🔊 Onde Sonore Déclenchée${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Position:</strong> Grid (${targetGridX}, ${targetGridY})</div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Type:</strong> Zone circulaire</div>
                    <div style="font-size: 1.2em; color: #f57c00; font-weight: bold;">⚡ DÉGÂTS: Selon situation (MJ)</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">Les dégâts dépendent de la situation et sont déterminés par le MJ</div>
                </div>

                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>✨ Niveau:</strong> ${SPELL_CONFIG.spellLevel} (+${levelBonus} bonus)${stanceNote}</div>
                </div>
            </div>
        `;
    }

    const enhancedFlavor = createChatFlavor();

    // Send the roll message
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const targetGridX = Math.floor(waveTarget.x / canvas.grid.size);
    const targetGridY = Math.floor(waveTarget.y / canvas.grid.size);

    ui.notifications.info(`${SPELL_CONFIG.name} lancée !${stanceInfo} Position: (${targetGridX}, ${targetGridY}). Jet de touché: ${attackRoll.total} - ${SPELL_CONFIG.manaCost} mana`);

    console.log(`[DEBUG] ${SPELL_CONFIG.name} cast complete - Caster: ${actor.name}, Position: (${targetGridX}, ${targetGridY}), Attack Roll: ${attackRoll.total}, Damage: MJ determined`);

})();
