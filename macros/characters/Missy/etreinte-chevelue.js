/**
 * Etreinte Chevelue - Missy
 *
 * Missy utilise ses cheveux pour enlacer et affaiblir une cible. Les cheveux
 * s'enroulent autour de la cible et restent visibles tant que l'effet persiste.
 * Missy peut continuer à se déplacer mais doit maintenir la concentration.
 *
 * - Coût : 3 mana initial + 1 mana par tour maintenu (focalisable — gratuit en Position Focus)
 * - Caractéristique d'attaque : Dextérité (+ effets actifs + bonus manuels)
 * - PAS DE DÉGÂTS - Seule l'attaque de toucher compte
 * - Effet : Malus de -2 sur toutes les caractéristiques (7 caractéristiques)
 * - Cible : unique (Portal pour sélectionner la cible)
 * - Animation : Cheveux entrelacés permanents autour de la cible
 *
 * Animations :
 * - Cast : effet de lancement violet
 * - Hair Embrace : animation persistante de cheveux autour de la cible
 *
 * Usage : sélectionner le token de Missy, lancer la macro et choisir la cible.
 * Utiliser la macro "endMissyEffect.js" pour terminer l'étreinte.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Etreinte Chevelue",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        manaCost: 3,
        maintenanceCost: 1, // Coût par tour pour maintenir
        spellLevel: 1,
        isDirect: true,
        isFocusable: true,
        hasNoDamage: true, // Pas de dégâts, juste un test de toucher

        animations: {
            cast: "jb2a.markers.rune.purple.03",
            hairEmbrace: "jb2a.entangle.purple", // Animation persistante de cheveux
            sound: null
        },

        targeting: {
            range: 150, // Portée des cheveux
            color: "#9c27b0", // Couleur violette/magenta
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        },

        // Configuration de l'effet persistant
        embraceEffect: {
            name: "Etreinte Chevelue",
            icon: "icons/magic/symbols/runes-star-magenta.webp",
            description: "Enlacé par les cheveux magiques de Missy - Toutes caractéristiques réduites de 2"
        },

        // Les 7 caractéristiques du système
        characteristics: [
            "physique",
            "dexterite",
            "perception",
            "esprit",
            "parole",
            "savoir",
            "volonte"
        ]
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Missy !");
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
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey} (total: ${totalBonus})`);
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

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
            `<strong>Coût en Mana :</strong> GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} par tour maintenu` :
            `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana initial + ${SPELL_CONFIG.maintenanceCost} par tour maintenu`;

        return new Promise(resolve => {
            new Dialog({
                title: `${SPELL_CONFIG.name} (Position: ${currentStance || 'Aucune'})`,
                content: `
                    <h3>💇‍♀️ ${SPELL_CONFIG.name}</h3>
                    <p>${manaInfo}</p>
                    <p><strong>Caractéristique Dextérité :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #9c27b0; padding: 10px; background: #f3e5f5;">
                        <h4 style="color: #9c27b0;">💇‍♀️ Description</h4>
                        <p><em>Les cheveux magiques de Missy enlacent et affaiblissent la cible. L'étreinte persiste tant que Missy maintient sa concentration.</em></p>
                        <p style="color: #d32f2f;"><strong>⚠️ Effet :</strong> -2 sur toutes les caractéristiques de la cible</p>
                        <p style="color: #1976d2;"><strong>ℹ️ Note :</strong> Ce sort ne cause pas de dégâts, seul le test de toucher compte</p>
                        <p style="color: #ff9800;"><strong>💰 Maintenance :</strong> ${SPELL_CONFIG.maintenanceCost} mana par tour pour maintenir l'effet</p>
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

                    <div style="margin: 10px 0; padding: 8px; background: #f3e5f5; border-radius: 4px;">
                        <div><strong>Jet d'attaque final :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${SPELL_CONFIG.spellLevel * 2}</span></div>
                    </div>

                    <div style="margin: 10px 0; padding: 8px; background: #ffebee; border-radius: 4px;">
                        <h4 style="color: #d32f2f; margin-top: 0;">Effet sur la Cible</h4>
                        <p style="margin: 5px 0; font-size: 0.9em;">Malus de -2 appliqué sur :</p>
                        <ul style="margin: 5px 0; font-size: 0.8em;">
                            <li>Physique</li>
                            <li>Dextérité</li>
                            <li>Perception</li>
                            <li>Esprit</li>
                            <li>Parole</li>
                            <li>Savoir</li>
                            <li>Volonté</li>
                        </ul>
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
                        label: "💇‍♀️ Lancer l'Etreinte !",
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
            }, {
                width: 500,
                height: 650,
                resizable: true
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

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : 'position';

    // Check if target already has an embrace
    if (targetActor?.actor) {
        const existingEmbrace = targetActor.actor.effects.find(e => e.name === SPELL_CONFIG.embraceEffect.name);
        if (existingEmbrace) {
            ui.notifications.warn(`${targetName} est déjà enlacé par des cheveux magiques !`);
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
                .scale(0.7)
                .tint("#9c27b0");
        }

        // Animation d'étreinte persistante si on a une cible valide
        if (SPELL_CONFIG.animations.hairEmbrace && targetActor?.token) {
            seq.effect()
                .file(SPELL_CONFIG.animations.hairEmbrace)
                .attachTo(targetActor.token)
                .scale(0.8)
                .delay(1500)
                .persist() // Animation persistante !
                .name(`hair-embrace-${caster.id}-${targetActor.token.id}`) // Nom unique pour la retrouver
                .fadeIn(500)
                .fadeOut(500)
                .tint("#9c27b0");
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
        // Create effect data with malus on all characteristics
        const effectData = {
            name: SPELL_CONFIG.embraceEffect.name,
            icon: SPELL_CONFIG.embraceEffect.icon,
            description: SPELL_CONFIG.embraceEffect.description,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    embraceCaster: caster.id, // ID du lanceur pour retrouver l'étreinte
                    embraceTarget: targetActor.token.id, // ID de la cible
                    embraceSequenceName: `hair-embrace-${caster.id}-${targetActor.token.id}`, // Nom de l'animation
                    spellName: SPELL_CONFIG.name
                },
                // Ajout des malus sur les 7 caractéristiques
                ...Object.fromEntries(
                    SPELL_CONFIG.characteristics.map(char => [char, { value: -2 }])
                ),
                // Status counter pour affichage
                statuscounter: { value: 2 } // Malus de -2
            }
        };

        try {
            // Use GM delegation for effect application if available
            if (globalThis.gmSocket) {
                console.log(`[DEBUG] Applying embrace effect to ${targetName} via GM socket`);
                const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.actor.id, effectData);

                if (result?.success) {
                    console.log(`[DEBUG] Successfully applied embrace effect to ${targetName}`);
                } else {
                    console.error(`[DEBUG] Failed to apply embrace effect: ${result?.error}`);
                    ui.notifications.error(`Impossible d'appliquer l'effet d'étreinte : ${result?.error}`);
                }
            } else {
                // Fallback: direct application if GM socket not available
                console.log(`[DEBUG] GM Socket not available, applying effect directly`);
                await targetActor.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                console.log(`[DEBUG] Successfully applied embrace effect to ${targetName} directly`);
            }
        } catch (error) {
            console.error("Error applying embrace effect:", error);
            ui.notifications.warn("Impossible d'appliquer l'effet d'étreinte !");
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

        const bonusInfo = attackBonus > 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
            </div>
        `;

        const embraceDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #9c27b0; margin-bottom: 6px;"><strong>💇‍♀️ Etreinte Chevelue</strong></div>
                <div style="font-size: 1.2em; color: #9c27b0; font-weight: bold;">Cible: ${targetName}</div>
                <div style="font-size: 0.8em; color: #666;">Aucun dégât - Malus de -2 sur toutes caractéristiques</div>
                <div style="font-size: 0.8em; color: #ff9800; margin-top: 4px;">Maintenance: ${SPELL_CONFIG.maintenanceCost} mana/tour</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">Utilisez "Terminer Effets" pour libérer</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f3e5f5, #fff3e0); padding: 12px; border-radius: 8px; border: 2px solid #9c27b0; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #9c27b0;">💇‍♀️ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Mage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualMana}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${embraceDisplay}
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

    ui.notifications.info(`💇‍♀️ ${SPELL_CONFIG.name} lancée !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}. Etreinte active ! (${SPELL_CONFIG.maintenanceCost} mana/tour)`);

})();
