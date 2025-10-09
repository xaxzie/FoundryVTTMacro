/**
 * Royaume des Chaînes (Multicible) - Léo
 *
 * Version multicible du Royaume des Chaînes. Léo invoque plusieurs chaînes magiques
 * pour entraver plusieurs ennemis simultanément, mais avec moins de précision.
 *
 * - Coût : 5 mana (focalisable — gratuit en Position Focus)
 * - Caractéristique d'attaque : Physique -4 dés (malus multicible)
 * - PAS DE DÉGÂTS - Seule l'attaque de toucher compte
 * - Effet appliqué : "Chaîne d'Acier" (comme Steel Chain) sur chaque cible touchée
 * - Cibles : 1 à 4 cibles (Portal pour sélectionner chaque cible)
 * - Animations : Chaînes multiples persistantes de chaque cible vers Léo
 * - Bonus de libération : +2 pour les cibles (plus facile de se libérer)
 *
 * Animations :
 * - Cast : effet de lancement métallique
 * - Chains : chaîne persistante de chaque cible vers Léo
 *
 * Usage : sélectionner le token de Léo, lancer la macro et choisir le nombre de cibles puis les cibler.
 * Utiliser la macro "endLeoEffect.js" pour terminer les chaînes (détection "Chaîne d'Acier").
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Royaume des Chaînes (Multicible)",
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 5,
        spellLevel: 2,
        isDirect: true,
        isFocusable: true,
        hasNoDamage: true, // Pas de dégâts, juste un test de toucher
        multiTargetPenalty: -4, // Malus pour le multicible

        animations: {
            cast: "jb2a.divine_smite.caster.reversed.blueyellow",
            chain: "jaamod.spells_effects.chain2", // Chaîne persistante (même que Steel Chain)
            sound: null
        },

        targeting: {
            range: 200,
            color: "#4a4a4a", // Couleur acier sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        },

        // Configuration de l'effet appliqué (même que Steel Chain)
        chainEffect: {
            name: "Chaîne d'Acier",
            icon: "icons/commodities/metal/chain-steel.webp",
            description: "Enchaîné par une chaîne d'acier magique (Royaume Multicible)",
            liberationBonus: 2 // Bonus pour se libérer
        },

        // Limites de ciblage
        targetLimits: {
            min: 1,
            max: 4
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

    // ===== TARGET COUNT DIALOG =====
    async function getTargetCount() {
        const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
            `<strong>Coût en Mana :</strong> GRATUIT (Position Focus)` :
            `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana`;

        return new Promise(resolve => {
            new Dialog({
                title: `🔗 ${SPELL_CONFIG.name} - Sélection des Cibles`,
                content: `
                    <h3>🔗 ${SPELL_CONFIG.name}</h3>
                    <p><strong>Lanceur:</strong> ${actor.name}</p>
                    <p>${manaInfo}</p>
                    <p><strong>Physique:</strong> ${characteristicInfo.final} <span style="color: #d32f2f;">(-4 dés multicible)</span></p>

                    <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                        <p><strong>📜 Mécaniques multicibles :</strong></p>
                        <ul>
                            <li><strong>Malus d'attaque :</strong> -4 dés (difficulté du multicible)</li>
                            <li><strong>Effet appliqué :</strong> "Chaîne d'Acier" sur chaque cible touchée</li>
                            <li><strong>Bonus de libération :</strong> +2 pour les cibles (plus facile à briser)</li>
                            <li><strong>Animations :</strong> Chaînes persistantes vers chaque cible</li>
                        </ul>
                    </div>

                    <div style="margin: 15px 0;">
                        <label for="targetCount"><strong>Nombre de cibles à enchaîner :</strong></label>
                        <input type="number" id="targetCount" name="targetCount" value="2"
                               min="${SPELL_CONFIG.targetLimits.min}" max="${SPELL_CONFIG.targetLimits.max}"
                               style="width: 80px; margin-left: 10px;">
                        <small>(${SPELL_CONFIG.targetLimits.min}-${SPELL_CONFIG.targetLimits.max} cibles)</small>
                    </div>
                `,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-chain"></i>',
                        label: "Sélectionner les Cibles",
                        callback: (html) => {
                            const targetCount = parseInt(html.find('#targetCount').val()) || 2;
                            const clampedCount = Math.max(SPELL_CONFIG.targetLimits.min,
                                Math.min(SPELL_CONFIG.targetLimits.max, targetCount));
                            resolve({ targetCount: clampedCount });
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

    const targetConfig = await getTargetCount();
    if (!targetConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    const { targetCount } = targetConfig;

    // ===== CONFIGURATION DIALOG =====
    async function showConfigDialog() {
        return new Promise(resolve => {
            new Dialog({
                title: `🔗 ${SPELL_CONFIG.name} - Configuration`,
                content: `
                    <h3>🔗 ${SPELL_CONFIG.name}</h3>
                    <p><strong>Cibles à enchaîner:</strong> ${targetCount}</p>
                    <p><strong>Attaque finale:</strong> ${Math.max(1, characteristicInfo.final + SPELL_CONFIG.multiTargetPenalty)}d7 + ${2 * SPELL_CONFIG.spellLevel}</p>

                    <div style="margin: 15px 0;">
                        <label for="attackBonus">Bonus d'attaque manuel:</label>
                        <input type="number" id="attackBonus" name="attackBonus" value="0" min="-10" max="10">
                    </div>
                `,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirmer",
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
        ui.notifications.info('Configuration annulée.');
        return;
    }
    const { attackBonus } = userConfig;

    // ===== MULTI-TARGETING via Portal =====
    async function selectTargets() {
        const targets = [];

        for (let i = 0; i < targetCount; i++) {
            ui.notifications.info(`🎯 Sélectionnez la cible ${i + 1}/${targetCount}`);

            try {
                const target = await new Portal()
                    .color(SPELL_CONFIG.targeting.color)
                    .texture(SPELL_CONFIG.targeting.texture)
                    .pick();

                if (!target) {
                    ui.notifications.warn(`Ciblage annulé à la cible ${i + 1}.`);
                    return null;
                }

                targets.push(target);
            } catch (e) {
                console.warn("Portal targeting failed:", e);
                ui.notifications.error(`Erreur lors du ciblage de la cible ${i + 1}.`);
                return null;
            }
        }

        return targets;
    }

    const targets = await selectTargets();
    if (!targets) {
        ui.notifications.info('Ciblage annulé.');
        return;
    }

    // Get actors at target locations (same function as steel-chain)
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
            // No grid: use circular tolerance detection (original behavior with visibility check)
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

    // Process all targets
    const targetActors = [];
    for (const target of targets) {
        const targetActor = getActorAtLocation(target.x, target.y);
        if (targetActor) {
            // Check if target already has a chain
            const existingChain = targetActor.actor.effects.find(e => e.name === SPELL_CONFIG.chainEffect.name);
            if (existingChain) {
                ui.notifications.warn(`${targetActor.name} est déjà enchaîné ! (ignoré)`);
                continue;
            }
            targetActors.push(targetActor);
        } else {
            ui.notifications.warn(`Aucune cible trouvée à une position (ignorée)`);
        }
    }

    if (targetActors.length === 0) {
        ui.notifications.error("Aucune cible valide trouvée !");
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

        // Chaînes persistantes vers chaque cible
        if (SPELL_CONFIG.animations.chain) {
            for (let i = 0; i < targetActors.length; i++) {
                const targetActor = targetActors[i];
                seq
                    .effect()
                    .file(SPELL_CONFIG.animations.chain)
                    .attachTo(caster)
                    .stretchTo(targetActor.token, { attachTo: true })
                    .scale(0.2)
                    .delay(1500 + (i * 200)) // Délai progressif pour chaque chaîne
                    .persist()
                    .name(`multi-chain-${caster.id}-${targetActor.token.id}`)
                    .fadeIn(500)
                    .fadeOut(500);
            }
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const baseAttackDice = characteristicInfo.final + SPELL_CONFIG.multiTargetPenalty + attackBonus;
    const finalAttackDice = Math.max(1, baseAttackDice); // Au minimum 1 dé
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${finalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== ADD ACTIVE EFFECTS TO TARGETS =====
    const successfulChains = [];
    const failedChains = [];

    for (const targetActor of targetActors) {
        const effectData = {
            name: SPELL_CONFIG.chainEffect.name,
            icon: SPELL_CONFIG.chainEffect.icon,
            description: SPELL_CONFIG.chainEffect.description,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    chainCaster: caster.id,
                    chainTarget: targetActor.token.id,
                    chainSequenceName: `multi-chain-${caster.id}-${targetActor.token.id}`,
                    spellName: SPELL_CONFIG.name,
                    liberationBonus: SPELL_CONFIG.chainEffect.liberationBonus
                }
            }
        };

        try {
            // Use GM delegation for effect application (same as steel-chain)
            if (!globalThis.gmSocket) {
                ui.notifications.error("GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.");
                failedChains.push(targetActor.name);
                continue;
            }

            console.log(`[DEBUG] Applying multi-chain effect to ${targetActor.name} via GM socket`);
            const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.actor.id, effectData);

            if (result?.success) {
                console.log(`[DEBUG] Successfully applied multi-chain effect to ${targetActor.name}`);
                successfulChains.push(targetActor.name);
            } else {
                console.error(`[DEBUG] Failed to apply multi-chain effect to ${targetActor.name}: ${result?.error}`);
                failedChains.push(targetActor.name);
            }
        } catch (error) {
            console.error(`Error applying multi-chain effect to ${targetActor.name}:`, error);
            failedChains.push(targetActor.name);
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
                <div>✨ Bonus de Physique: +${characteristicInfo.effectBonus}</div>
            </div>` : '';

        const bonusInfo = attackBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>⚡ Bonus Manuel d'Attaque: ${attackBonus > 0 ? '+' : ''}${attackBonus} dés</div>
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
                <div style="font-size: 0.9em; color: #d32f2f; margin-top: 4px;">Malus multicible: -4 dés appliqué</div>
            </div>
        `;

        const chainsDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8eaf6; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #3f51b5; margin-bottom: 6px;"><strong>🔗 ${SPELL_CONFIG.name}</strong></div>
                <div style="font-size: 1.0em; color: #4a4a4a; font-weight: bold;">Cibles visées: ${targetCount} | Chaînes créées: ${successfulChains.length}</div>
                <div style="font-size: 0.8em; color: #666;">Aucun dégât - Enchaînement magique multicible</div>
                <div style="font-size: 0.8em; color: #ff9800; margin-top: 4px;">
                    <strong>Effets:</strong><br>
                    • Effet "Chaîne d'Acier" sur les cibles touchées<br>
                    • Bonus de libération: +2 pour les cibles<br>
                    • Attaque: ${characteristicInfo.final} - 4 (multicible) ${attackBonus !== 0 ? (attackBonus > 0 ? '+ ' + attackBonus : '- ' + Math.abs(attackBonus)) : ''} = ${finalAttackDice}d7
                </div>
                ${successfulChains.length > 0 ? `<div style="font-size: 0.8em; color: #4caf50; margin-top: 2px;">✅ Enchaînés: ${successfulChains.join(', ')}</div>` : ''}
                ${failedChains.length > 0 ? `<div style="font-size: 0.8em; color: #f44336; margin-top: 2px;">❌ Échecs: ${failedChains.join(', ')}</div>` : ''}
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
                ${chainsDisplay}
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

    if (successfulChains.length > 0) {
        ui.notifications.info(`🔗 ${SPELL_CONFIG.name} lancé !${stanceInfo} ${successfulChains.length}/${targetCount} cibles enchaînées. Attaque: ${attackRoll.total}.`);
    } else {
        ui.notifications.warn(`🔗 ${SPELL_CONFIG.name} lancé${stanceInfo} mais aucune chaîne créée ! Attaque: ${attackRoll.total}.`);
    }

})();
