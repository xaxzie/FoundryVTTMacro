/**
 * Royaume des Chaînes - Léo
 *
 * Léo invoque un complexe réseau de chaînes magiques qui entourent et affaiblissent sa cible,
 * mais lui demandent une concentration importante qui réduit sa propre agilité.
 *
 * - Coût : 3 mana initial (focalisable — gratuit en Position Focus) + 3 mana par tour maintenu (NON focalisable)
 * - Caractéristique d'attaque : Physique (+ effets actifs + bonus manuels)
 * - PAS DE DÉGÂTS - Seule l'attaque de toucher compte
 * - Effet sur la cible : -4 Agilité, -2 sur toutes les autres caractéristiques
 * - Effet sur Léo : -3 Agilité (concentration requise)
 * - Cible : unique (Portal pour sélectionner la cible)
 * - Animation : Chaînes multiples persistantes autour de la cible + lien vers Léo
 *
 * Animations :
 * - Cast : effet de lancement métallique
 * - Chain Kingdom : animation persistante de chaînes complexes autour de la cible
 * - Connection : chaîne de connexion entre Léo et la cible
 *
 * Usage : sélectionner le token de Léo, lancer la macro et choisir la cible.
 * Utiliser la macro "endLeoEffect.js" pour terminer le royaume des chaînes.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Royaume des Chaînes",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 3,
        maintenanceCost: 3, // Coût par tour pour maintenir (NON focalisable)
        spellLevel: 2,
        isDirect: true,
        isFocusable: true, // Seulement pour le coût initial
        hasNoDamage: true, // Pas de dégâts, juste un test de toucher

        animations: {
            cast: "jb2a.divine_smite.caster.reversed.blueyellow",
            chainKingdom: "jb2a.markers.chain.standard.loop.01.red", // Animation persistante de chaînes complexes
            connection: "jaamod.spells_effects.chain2", // Chaîne de connexion
            sound: null
        },

        targeting: {
            range: 200, // Plus longue portée que Steel Chain
            color: "#4a4a4a", // Couleur acier sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        },

        // Configuration des effets persistants
        targetEffects: {
            // Effet principal (Agilité -4) - celui qui sera détecté par endLeoEffect
            agility: {
                name: "Royaume des Chaînes (Agilité)",
                icon: "icons/commodities/metal/chains-steel.webp",
                description: "Entravé par le royaume des chaînes de Léo - Agilité fortement réduite"
            },
            // Effet secondaire (autres stats -2)
            other: {
                name: "Royaume des Chaînes (Général)",
                icon: "icons/commodities/metal/chain-steel.webp",
                description: "Affaibli par le royaume des chaînes de Léo - Toutes autres caractéristiques réduites"
            }
        },

        // Effet sur le lanceur
        casterEffect: {
            name: "Royaume des Chaînes (Concentration)",
            icon: "icons/magic/symbols/runes-star-blue.webp",
            description: "Maintient le royaume des chaînes - Agilité réduite par la concentration"
        },

        // Les 7 caractéristiques du système (pour l'effet -2)
        otherCharacteristics: [
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

    // Active effect bonuses
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
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
            `<strong>Coût en Mana :</strong> GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} mana par tour maintenu (non focalisable)` :
            `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana initial + ${SPELL_CONFIG.maintenanceCost} mana par tour maintenu (non focalisable)`;

        return new Promise(resolve => {
            new Dialog({
                title: `🔗 ${SPELL_CONFIG.name} - Configuration`,
                content: `
                    <h3>🔗 ${SPELL_CONFIG.name}</h3>
                    <p><strong>Lanceur:</strong> ${actor.name}</p>
                    <p>${manaInfo}</p>
                    <p><strong>Physique:</strong> ${characteristicInfo.final}</p>

                    <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                        <p><strong>📜 Effets du royaume :</strong></p>
                        <ul>
                            <li><strong>Sur la cible :</strong> -4 Agilité, -2 sur toutes autres caractéristiques</li>
                            <li><strong>Sur Léo :</strong> -3 Agilité (concentration requise)</li>
                            <li><strong>Maintenance :</strong> ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)</li>
                            <li><strong>Jets de libération :</strong> Aucun malus pour la cible</li>
                        </ul>
                    </div>

                    <div style="margin: 15px 0;">
                        <label for="attackBonus">Bonus d'attaque manuel:</label>
                        <input type="number" id="attackBonus" name="attackBonus" value="0" min="-5" max="10">
                    </div>
                `,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-chain"></i>',
                        label: "Invoquer le Royaume",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({ attackBonus });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null)
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
            return await new Portal()
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture)
                .pick();
        } catch (e) {
            console.warn("Portal targeting failed:", e);
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
            return tokensAtLocation[0];
        } else {
            // No grid: use circular tolerance detection (original behavior with visibility check)
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                if (!token.actor) return false;
                const distance = Math.sqrt(Math.pow(x - token.center.x, 2) + Math.pow(y - token.center.y, 2));
                return distance <= 50;
            });

            if (tokensAtLocation.length === 0) return null;
            return tokensAtLocation[0];
        }
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : 'position';

    // Check if target already has chain kingdom effects
    if (targetActor?.actor) {
        const existingChainKingdom = targetActor.actor.effects.find(e =>
            e.name === SPELL_CONFIG.targetEffects.agility.name ||
            e.name === SPELL_CONFIG.targetEffects.other.name
        );
        if (existingChainKingdom) {
            ui.notifications.warn(`${targetName} est déjà affecté par un Royaume des Chaînes !`);
            return;
        }
    }

    // Check if caster already maintains a Chain Kingdom
    const existingCasterEffect = actor.effects.find(e => e.name === SPELL_CONFIG.casterEffect.name);
    if (existingCasterEffect) {
        ui.notifications.warn("Vous maintenez déjà un Royaume des Chaînes !");
        return;
    }

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Cast animation sous le lanceur
        if (SPELL_CONFIG.animations.cast) {
            seq
                .effect()
                .file(SPELL_CONFIG.animations.cast)
                .belowTokens()
                .attachTo(caster)
                .scale(1.2);
        }

        // Animation de royaume de chaînes persistante si on a une cible valide
        if (SPELL_CONFIG.animations.chainKingdom && targetActor?.token) {
            seq
                .effect()
                .file(SPELL_CONFIG.animations.chainKingdom)
                .attachTo(targetActor.token)
                .scale(1.5)
                .persist()
                .name(`chain-kingdom-${caster.id}-${targetActor.token.id}`)
                .fadeIn(1000);
        }

        // Chaîne de connexion entre Léo et la cible
        if (SPELL_CONFIG.animations.connection && targetActor?.token) {
            seq
                .effect()
                .file(SPELL_CONFIG.animations.connection)
                .stretchTo(targetActor.token)
                .attachTo(caster)
                .persist()
                .name(`chain-connection-${caster.id}-${targetActor.token.id}`)
                .fadeIn(1000);
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== ADD ACTIVE EFFECTS =====
    if (targetActor?.actor) {
        // Effet principal sur la cible : Agilité -4
        console.log("[ROYAUME DES CHAINES] Application des effets sur la cible:", targetActor.token);
        const agilityEffectData = {
            name: SPELL_CONFIG.targetEffects.agility.name,
            icon: SPELL_CONFIG.targetEffects.agility.icon,
            description: SPELL_CONFIG.targetEffects.agility.description,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    chainKingdomCaster: caster.id,
                    chainKingdomTarget: targetActor.token.id,
                    chainKingdomSequenceName: `chain-kingdom-${caster.id}-${targetActor.token.id}`,
                    chainConnectionSequenceName: `chain-connection-${caster.id}-${targetActor.token.id}`,
                    spellName: SPELL_CONFIG.name
                },
                agilite: { value: -4 },
                statuscounter: { value: 4 }
            },
            visible: true
        };

        // Effet secondaire sur la cible : Autres stats -2
        const otherEffectData = {
            name: SPELL_CONFIG.targetEffects.other.name,
            icon: SPELL_CONFIG.targetEffects.other.icon,
            description: SPELL_CONFIG.targetEffects.other.description,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    chainKingdomCaster: caster.id,
                    chainKingdomTarget: targetActor.token.id,
                    spellName: SPELL_CONFIG.name
                },
                // Toutes les autres caractéristiques à -2
                ...Object.fromEntries(
                    SPELL_CONFIG.otherCharacteristics.map(char => [char, { value: -2 }])
                ),
                statuscounter: { value: 2 }
            },
            visible: true
        };

        try {
            // Utiliser socketlib pour déléguer au GM si nécessaire
            if (game.modules.get('socketlib')?.active && !game.user.isGM) {
                // Délégation GM pour les effets sur la cible
                await game.socket.executeAsGM('createActiveEffect', {
                    actorId: targetActor.actor.id,
                    effectData: agilityEffectData
                });
                await game.socket.executeAsGM('createActiveEffect', {
                    actorId: targetActor.actor.id,
                    effectData: otherEffectData
                });
            } else {
                // Application directe si on est GM ou si socketlib n'est pas disponible
                await targetActor.actor.createEmbeddedDocuments('ActiveEffect', [agilityEffectData, otherEffectData]);
            }
        } catch (error) {
            console.error('[ROYAUME DES CHAINES] Erreur lors de la création des effets sur la cible:', error);
            ui.notifications.error("Erreur lors de l'application des effets sur la cible !");
        }
    }

    // Effet sur le lanceur : Agilité -3
    const casterEffectData = {
        name: SPELL_CONFIG.casterEffect.name,
        icon: SPELL_CONFIG.casterEffect.icon,
        description: SPELL_CONFIG.casterEffect.description,
        duration: { seconds: 86400 },
        flags: {
            world: {
                chainKingdomTarget: targetActor?.token?.id || 'unknown',
                spellName: SPELL_CONFIG.name
            },
            agilite: { value: -3 },
            statuscounter: { value: 3 }
        },
        visible: true
    };

    try {
        await actor.createEmbeddedDocuments('ActiveEffect', [casterEffectData]);
    } catch (error) {
        console.error('[ROYAUME DES CHAINES] Erreur lors de la création de l\'effet sur le lanceur:', error);
        ui.notifications.error("Erreur lors de l'application de l'effet sur le lanceur !");
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const actualMana = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
            `GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)` :
            `${SPELL_CONFIG.manaCost} mana + ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de Physique: +${characteristicInfo.effectBonus}</div>
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

        const kingdomDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8eaf6; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #3f51b5; margin-bottom: 6px;"><strong>🔗 Royaume des Chaînes</strong></div>
                <div style="font-size: 1.2em; color: #4a4a4a; font-weight: bold;">Cible: ${targetName}</div>
                <div style="font-size: 0.8em; color: #666;">Aucun dégât - Affaiblissement massif</div>
                <div style="font-size: 0.8em; color: #ff9800; margin-top: 4px;">
                    <strong>Effets:</strong><br>
                    • Cible: -4 Agilité, -2 autres stats<br>
                    • Léo: -3 Agilité (concentration)<br>
                    • Maintenance: ${SPELL_CONFIG.maintenanceCost} mana/tour
                </div>
                <div style="font-size: 0.8em; color: #4caf50; margin-top: 2px;">✅ Jets de libération: Aucun malus pour la cible</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">Utilisez "Terminer Effets" pour libérer</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #e8eaf6, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #4a4a4a; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #3f51b5;">🔗 ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Maître des Chaînes:</strong> ${actor.name} | <strong>Coût:</strong> ${actualMana}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${kingdomDisplay}
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

    ui.notifications.info(`🔗 ${SPELL_CONFIG.name} invoqué !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}. Royaume actif ! (${SPELL_CONFIG.maintenanceCost} mana/tour)`);

})();
