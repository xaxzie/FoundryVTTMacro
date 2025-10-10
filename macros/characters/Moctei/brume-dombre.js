/**
 * Brume d'ombre - Moctei (Mage des Ombres)
 *
 * Une brume d'ombre entoure un ennemi, l'affaiblissant et lui infligeant des blessures.
 *
 * - Coût : 4 points de mana (focalisable)
 * - Niveau de sort : 1
 * - Caractéristique d'attaque : Sens (+ effets actifs + bonus manuels)
 * - Effet : Inflige une blessure à la cible
 * - Jet de sauvegarde : Volonté de l'adversaire
 * - Portée : Moyenne (200 cases)
 *
 * Animations :
 * - Projectile : Brume d'ombre qui se dirige vers la cible
 * - Impact : Explosion de brume au contact
 * - Persistant : Zone d'ombre autour de la cible
 *
 * Usage : Sélectionner le token de Moctei, lancer la macro et choisir la cible.
 * La cible subit une blessure si elle échoue à son jet de Volonté.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Brume d'ombre",
        characteristic: "sens",
        characteristicDisplay: "Sens",
        manaCost: 4,
        spellLevel: 1,
        isDirect: true,
        isFocusable: true,
        hasNoDamage: true, // Pas de dégâts directs, juste malus aux caractéristiques
        characteristicMalus: 1, // Malus de -1 appliqué à toutes les caractéristiques

        // Les 7 caractéristiques du système
        characteristics: [
            "physique",
            "dexterite",
            "perception",
            "esprit",
            "parole",
            "savoir",
            "volonte"
        ],

        animations: {
            projectile: "jb2a.ranged.01.projectile.01.dark_orange", // Projectile de brume
            impact: "jb2a_patreon.darkness.black", // Impact au sol
            persistent: "jb2a_patreon.portals.horizontal.ring.dark_purple", // Brume persistante sur la cible
            sound: null
        },

        targeting: {
            range: 200, // Portée du sort
            color: "#1a0a2a", // Couleur violet très sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        },

        // Configuration de l'effet persistant sur la cible
        targetEffect: {
            name: "Brume d'ombre",
            icon: "icons/magic/fire/projectile-fireball-smoke-blue.webp",
            description: "Entouré par une brume d'ombre affaiblissante de Moctei - Toutes caractéristiques réduites de 1"
        },

        // Jet de sauvegarde de la cible
        willpowerSave: {
            characteristic: "volonte",
            description: "Jet de Volonté pour résister à la brume d'ombre"
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
            const flagValue = effect.flags?.world?.[flagKey]?.value;
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

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const actualManaCost = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ? 0 : SPELL_CONFIG.manaCost;
        const manaInfo = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
            `<strong>Coût en Mana :</strong> GRATUIT (Position Focus)` :
            `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana`;

        return new Promise(resolve => {
            new Dialog({
                title: `🌑 ${SPELL_CONFIG.name}`,
                content: `
                    <div style="margin-bottom: 15px;">
                        <h3 style="color: #4a148c; margin-bottom: 10px;">
                            🌫️ ${SPELL_CONFIG.name}
                        </h3>
                        <p><strong>Lanceur :</strong> ${actor.name}</p>
                        ${currentStance ? `<p><strong>Position :</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</p>` : ''}

                        <div style="background: #f3e5f5; padding: 10px; border-radius: 5px; margin: 10px 0;">
                            ${manaInfo}<br>
                            <strong>📊 Niveau :</strong> ${SPELL_CONFIG.spellLevel}<br>
                            <strong>🎯 Caractéristique :</strong> ${SPELL_CONFIG.characteristicDisplay} (${characteristicInfo.final})
                        </div>

                        <div style="background: #fff3e0; padding: 10px; border-radius: 5px; margin: 10px 0;">
                            <strong>⚡ Effet :</strong><br>
                            • Applique <strong>-${SPELL_CONFIG.characteristicMalus} à toutes les caractéristiques</strong> (7 chars)<br>
                            • <strong>Jet de sauvegarde :</strong> Volonté de l'adversaire<br>
                            • <strong>Portée :</strong> ${SPELL_CONFIG.targeting.range} cases<br>
                            • <strong>Effet visuel :</strong> Brume persistante sur la cible
                        </div>

                        <div style="margin: 10px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa;">
                            <label style="display: block; margin-bottom: 6px;">
                                Bonus d'attaque (dés d7 additionnels):
                                <input type="number" id="attackBonus" value="0" min="0" style="width: 60px; margin-left: 6px;">
                            </label>
                        </div>

                        <p style="color: #666; font-style: italic;">
                            "Une brume d'ombre entoure un ennemi"
                        </p>
                    </div>
                `,
                buttons: {
                    cancel: {
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    },
                    cast: {
                        label: `🌫️ Lancer (${actualManaCost} mana)`,
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({ attackBonus, actualManaCost });
                        }
                    }
                },
                default: "cast",
                close: () => resolve(null)
            }).render(true);
        });
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    const { attackBonus, actualManaCost } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        ui.notifications.info(`🎯 Sélectionnez la cible pour ${SPELL_CONFIG.name}...`);

        try {
            const position = await window.Sequencer.Crosshair.show({
                size: canvas.grid.size,
                icon: SPELL_CONFIG.targeting.texture,
                label: "Cible de la Brume d'Ombre",
                labelOffset: { y: -40 },
                drawIcon: true,
                drawOutline: true,
                interval: -1,
                fillAlpha: 0.25,
                tileTexture: false,
                lockSize: true,
                rememberControlledTokens: false,
                drawBoundingBox: false
            });

            return { x: position.x, y: position.y };
        } catch (error) {
            console.error("Portal selection error:", error);
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info('Sort annulé - Aucune cible sélectionnée.');
        return;
    }

    // ===== ACTOR DETECTION =====
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

            return { name: targetToken.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Visibility check
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

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

            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActorInfo = getActorAtLocation(target.x, target.y);
    const targetName = targetActorInfo ? targetActorInfo.name : `Position (${Math.round(target.x)}, ${Math.round(target.y)})`;

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Projectile de brume d'ombre
        if (SPELL_CONFIG.animations.projectile) {
            seq.effect()
                .file(SPELL_CONFIG.animations.projectile)
                .attachTo(caster)
                .stretchTo(target)
                .scale(0.4)
                .fadeIn(200)
                .fadeOut(300)
                .tint("#2a1a3a")
                .waitUntilFinished(-500);
        }

        // Animation d'impact
        if (SPELL_CONFIG.animations.impact) {
            seq.effect()
                .file(SPELL_CONFIG.animations.impact)
                .atLocation(target)
                .scale(0.2)
                .opacity(0.9)
                .fadeIn(200)
                .fadeOut(400)
                .tint("#4a2a6a");
        }

        // Brume persistante si cible valide
        if (SPELL_CONFIG.animations.persistent && targetActorInfo?.token) {
            seq.effect()
                .file(SPELL_CONFIG.animations.persistent)
                .attachTo(targetActorInfo.token)
                .scale(0.5)
                .persist()
                .fadeIn(800)
                .fadeOut(2000)
                .tint("#1a0a2a")
                .belowTokens()
                .opacity(0.7)
                .name(`shadow-mist-${caster.id}-${targetActorInfo.token.id}`);
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + (attackBonus || 0);
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== APPLY SHADOW MIST EFFECT =====
    let effectApplied = false;
    let effectMessage = "";

    if (targetActorInfo?.actor) {
        try {
            // Check if target already has shadow mist effect
            const existingShadowMistEffect = targetActorInfo.actor.effects.find(e => e.name === SPELL_CONFIG.targetEffect.name);

            if (existingShadowMistEffect) {
                effectMessage = "Cible déjà affectée par la brume d'ombre";
                effectApplied = false;
            } else {
                // Create shadow mist effect with characteristic malus
                const shadowMistEffectData = {
                    name: SPELL_CONFIG.targetEffect.name,
                    icon: SPELL_CONFIG.targetEffect.icon,
                    description: SPELL_CONFIG.targetEffect.description,
                    duration: { seconds: 86400 },
                    flags: {
                        world: {
                            shadowMistCaster: caster.id,
                            shadowMistTarget: targetActorInfo.token.id,
                            shadowMistSequenceName: `shadow-mist-${caster.id}-${targetActorInfo.token.id}`,
                            spellName: SPELL_CONFIG.name
                        },
                        // Apply -1 malus to all characteristics (like Missy's embrace)
                        ...Object.fromEntries(
                            SPELL_CONFIG.characteristics.map(char => [char, { value: -SPELL_CONFIG.characteristicMalus }])
                        ),
                        // Status counter to show the malus value
                        statuscounter: { value: SPELL_CONFIG.characteristicMalus, visible: true }
                    }
                };

                // Use GM delegation for effect creation if available
                if (globalThis.gmSocket) {
                    console.log(`[Moctei] Creating shadow mist effect via GM socket`);
                    await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActorInfo.actor.id, shadowMistEffectData);
                } else {
                    // Fallback: direct creation if GM socket not available
                    console.log(`[Moctei] GM Socket not available, creating effect directly`);
                    await targetActorInfo.actor.createEmbeddedDocuments("ActiveEffect", [shadowMistEffectData]);
                }

                effectApplied = true;
                effectMessage = `Malus de -${SPELL_CONFIG.characteristicMalus} appliqué aux 7 caractéristiques`;
                console.log(`[Moctei] Applied shadow mist effect to ${targetName}`);
            }

        } catch (error) {
            console.error("[Moctei] Error applying shadow mist effect:", error);
            ui.notifications.warn("Erreur lors de l'application de l'effet de brume d'ombre !");
            effectMessage = "Erreur lors de l'application de l'effet";
        }
    } else {
        effectMessage = "Aucune cible valide trouvée";
    }

    // ===== CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de ${SPELL_CONFIG.characteristicDisplay}: +${characteristicInfo.effectBonus}</div>
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

        const effectDisplay = targetActorInfo?.actor ? `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                <div style="font-size: 1.2em; color: #4a148c; font-weight: bold;">🌫️ EFFET: ${effectMessage}</div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    Cible enveloppée par la brume d'ombre affaiblissante
                </div>
            </div>
        ` : `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #d32f2f;">❌ Aucune cible valide</div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%); padding: 12px; border-radius: 8px; border: 2px solid #4a148c; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #4a148c; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">🌫️ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name}${stanceInfo} | <strong>Coût:</strong> ${actualManaCost} mana
                    </div>
                    <div style="font-size: 0.9em; font-style: italic; color: #666; margin-top: 2px;">
                        "Une brume d'ombre entoure un ennemi"
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                <div style="text-align: center; margin: 8px 0; padding: 8px; background: rgba(255,255,255,0.7); border-radius: 4px;">
                    <strong>🎯 Cible :</strong> ${targetName}
                </div>
                ${effectDisplay}
            </div>
        `;
    }

    // Send attack roll to chat
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const effectInfo = effectApplied ? ` - ${effectMessage}` : " - Aucun effet appliqué";

    ui.notifications.info(`🌫️ ${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}${effectInfo}. Coût: ${actualManaCost} mana.`);

})();
