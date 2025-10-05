/**
 * Bubbles - Ora's Elemental Projectiles
 *
 * Ora lance des projectiles élémentaires qui peuvent être de l'eau, de la glace, de l'huile ou de l'eau vivante.
 *
 * - Coût : 4 mana (focalisable — gratuit en Position Focus, sauf Eau Vivante: 2 mana)
 * - Caractéristique d'attaque : Esprit (+ effets actifs sur 'esprit')
 * - Dégâts : 1d6 + (Esprit + bonus)/2 par projectile + bonus de dégâts provenant des Active Effects
 * - Soin : 1d6 + (Esprit + bonus)/2 (Eau Vivante uniquement)
 * - Cible : 1 cible (2 projectiles) ou 2 cibles (1 chacun) ; Eau Vivante = 1 cible seulement
 *
 * Éléments :
 * - Eau : +2 dégâts électriques futurs (2 projectiles)
 * - Glace : Vitesse -1 case (2 projectiles)
 * - Huile : +2 dégâts de feu futurs (2 projectiles)
 * - Eau Vivante : Soigne la cible (1 projectile, peut se cibler soi-même, NON focalisable)
 *
 * Animations :
 * - Cast : jb2a.cast_generic.water.02.blue.0
 * - Projectiles : jb2a.bullet.03.blue
 * - Impact : jb2a.explosion.04.blue / jb2a.explosion.02.blue / jb2a.healing_generic.burst.greenorange
 * - Sons : aucun
 *
 * Usage : sélectionner le token d'Ora, lancer la macro et choisir l'élément puis les cibles.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Bulles",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        manaCost: 4,
        spellLevel: 1,
        damageFormula: "1d6",
        isDirect: true,
        isFocusable: true,

        elements: {
            water: {
                name: "Eau",
                description: "Augmente les futurs dégâts électriques (+2 prochaine attaque électrique)",
                projectileCount: 2,
                manaCost: 4,
                isFocusable: true,
                effectFile: "jb2a.bullet.03.blue",
                explosionFile: "jb2a.explosion.04.blue",
                effectColor: "blue",
                tint: null,
                targeting: {
                    color: "#0080ff",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
                }
            },
            ice: {
                name: "Glace",
                description: "Diminue la vitesse de la cible de 1 case",
                projectileCount: 2,
                manaCost: 4,
                isFocusable: true,
                effectFile: "jb2a.bullet.03.blue",
                explosionFile: "jb2a.explosion.02.blue",
                effectColor: "blue",
                tint: null,
                targeting: {
                    color: "#87ceeb",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
                }
            },
            oil: {
                name: "Huile",
                description: "Augmente les futurs dégâts de feu (+2 prochaine attaque de feu)",
                projectileCount: 2,
                manaCost: 4,
                isFocusable: true,
                effectFile: "jb2a.bullet.03.blue",
                explosionFile: "jb2a.explosion.04.blue",
                effectColor: "orange",
                tint: "#FF8C00",
                targeting: {
                    color: "#ff8c00",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
                }
            },
            living_water: {
                name: "Eau Vivante",
                description: "Soigne la cible (peut se cibler soi-même, NON focalisable)",
                projectileCount: 1,
                manaCost: 4,
                isFocusable: false,
                effectFile: "jb2a.healing_generic.burst.greenorange",
                explosionFile: null,
                effectColor: "green",
                tint: null,
                targeting: {
                    color: "#00ff00",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm"
                }
            }
        },

        animations: {
            cast: "jb2a.cast_generic.water.02.blue.0",
            sound: null
        },

        targeting: {
            range: 120,
            selfTargetTolerance: 50 // Distance pour se cibler soi-même
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

    // ===== DIALOG DE SÉLECTION D'ÉLÉMENT =====
    async function showElementDialog() {
        const manaInfo = currentStance === 'focus'
            ? "<strong>Coût en Mana :</strong> GRATUIT (Position Focus) - sauf Eau Vivante: 2 mana"
            : "<strong>Coût en Mana :</strong> 4 mana";

        return new Promise((resolve) => {
            const elementOptions = Object.keys(SPELL_CONFIG.elements).map(key => {
                const element = SPELL_CONFIG.elements[key];
                return `<label><input type="radio" name="element" value="${key}" ${key === 'water' ? 'checked' : ''}>
                    <strong>${element.name}</strong> - ${element.description} (${element.projectileCount} projectile${element.projectileCount > 1 ? 's' : ''})</label>`;
            }).join('<br>');

            new Dialog({
                title: `Sort de ${SPELL_CONFIG.name} - Choisir un Élément${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>Sélectionnez l'élément pour vos bulles :</h3>
                    <p>${manaInfo}</p>
                    <div style="margin: 10px 0;">
                        ${elementOptions}
                    </div>
                `,
                buttons: {
                    confirm: {
                        label: "Confirmer",
                        callback: (html) => {
                            const element = html.find('input[name="element"]:checked').val();
                            resolve(element);
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

    const selectedElement = await showElementDialog();
    if (!selectedElement) return;

    const elementConfig = SPELL_CONFIG.elements[selectedElement];
    const isLivingWater = selectedElement === 'living_water';

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const actualManaCost = currentStance === 'focus' && elementConfig.isFocusable
            ? (isLivingWater ? '2 mana (Position Focus - coût réduit)' : 'GRATUIT (Position Focus)')
            : `${elementConfig.manaCost} mana`;

        const stanceNote = currentStance === 'offensif' && !isLivingWater ? ' (MAXIMISÉ en Position Offensive)' : '';
        const damageOrHeal = isLivingWater ? 'Soin' : 'Dégâts par projectile';

        return new Promise((resolve) => {
            new Dialog({
                title: `Sort de ${SPELL_CONFIG.name} - ${elementConfig.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>Statistiques du Sort</h3>
                    <p><strong>Position de Combat :</strong> ${currentStance ? currentStance.charAt(0).toUpperCase() + currentStance.slice(1) : 'Aucune'}</p>
                    <p><strong>Caractéristique ${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>
                    <p><strong>Niveau du Sort :</strong> ${SPELL_CONFIG.spellLevel}</p>
                    <p><strong>Coût en Mana :</strong> ${actualManaCost}</p>
                    <p><strong>${damageOrHeal} :</strong> ${SPELL_CONFIG.damageFormula} + (${SPELL_CONFIG.characteristicDisplay} + bonus)/2${stanceNote}${effectDamageBonus !== 0 ? ` <em>(+${effectDamageBonus} bonus d'effets)</em>` : ''}</p>
                    <p><strong>Projectiles :</strong> ${elementConfig.projectileCount}</p>
                    <p>Jet d'attaque de base : <strong>${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}</strong></p>
                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                        <h4>Bonus Manuels</h4>
                        <div style="margin: 5px 0;">
                            <label>Bonus de ${isLivingWater ? 'soin' : 'dégâts'} :
                                <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Objets, effets temporaires, etc.</small>
                        </div>
                        ${!isLivingWater ? `
                        <div style="margin: 5px 0;">
                            <label>Bonus de résolution d'attaque :
                                <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                        </div>
                        ` : ''}
                    </div>
                    ${!isLivingWater ? `<p><strong>Jet d'attaque final :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}</span></p>` : ''}
                    <script>
                        ${!isLivingWater ? `
                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const bonus = parseInt(this.value) || 0;
                            const total = base + bonus;
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${2 * SPELL_CONFIG.spellLevel}';
                        });` : ''}
                    </script>
                `,
                buttons: {
                    confirm: {
                        label: "Continuer",
                        callback: (html) => {
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const attackBonus = !isLivingWater ? parseInt(html.find('#attackBonus').val()) || 0 : 0;
                            resolve({ damageBonus, attackBonus });
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
    if (!userConfig) return;
    const { damageBonus, attackBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTargets() {
        let targets = [];

        try {
            // Premier ciblage
            const portal1 = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(elementConfig.targeting.color)
                .texture(elementConfig.targeting.texture);

            const target1 = await portal1.pick();
            if (!target1) return null;

            targets.push({ x: target1.x, y: target1.y });

            // Vérifier si on se cible soi-même pour Eau Vivante
            let allowSelfTarget = false;
            if (isLivingWater) {
                const distance = Math.sqrt(Math.pow(target1.x - caster.x, 2) + Math.pow(target1.y - caster.y, 2));
                if (distance <= SPELL_CONFIG.targeting.selfTargetTolerance) {
                    allowSelfTarget = true;
                }
            }

            // Deuxième ciblage (seulement pour les sorts à 2 projectiles)
            if (elementConfig.projectileCount > 1) {
                const secondTarget = await new Promise((resolve) => {
                    new Dialog({
                        title: "Deuxième Cible ?",
                        content: `<p>Voulez-vous cibler un deuxième emplacement, ou envoyer les deux projectiles sur la première cible ?</p>`,
                        buttons: {
                            second: {
                                label: "Deuxième Cible",
                                callback: () => resolve(true)
                            },
                            same: {
                                label: "Même Cible (Deux Projectiles)",
                                callback: () => resolve(false)
                            }
                        }
                    }).render(true);
                });

                if (secondTarget) {
                    const portal2 = new Portal()
                        .origin(caster)
                        .range(SPELL_CONFIG.targeting.range)
                        .color(elementConfig.targeting.color)
                        .texture(elementConfig.targeting.texture);

                    const target2 = await portal2.pick();
                    if (target2) {
                        targets.push({ x: target2.x, y: target2.y });
                    }
                }
            }

            return { targets, allowSelfTarget };
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const targetingResult = await selectTargets();
    if (!targetingResult) return;
    const { targets, allowSelfTarget } = targetingResult;

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

            const isOwner = targetActor.isOwner;
            const isVisible = targetToken.visible;
            const isGM = game.user.isGM;

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

            const isOwner = targetActor.isOwner;
            const isVisible = targetToken.visible;
            const isGM = game.user.isGM;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActors = targets.map(target => getActorAtLocation(target.x, target.y));

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = Math.floor((characteristicInfo.final + totalDamageBonus) / 2);

        if (currentStance === 'offensif' && !isLivingWater) {
            // Dégâts maximisés en position offensive
            const maxDamage = 6 + statBonus;
            return Array(elementConfig.projectileCount).fill({
                total: maxDamage,
                formula: `6 + ${statBonus}`,
                result: `6 + ${statBonus}`,
                isMaximized: true
            });
        } else {
            // Lancer les dés normalement
            const damages = [];
            for (let i = 0; i < elementConfig.projectileCount; i++) {
                const roll = new Roll("1d6 + @statBonus", { statBonus: statBonus });
                await roll.evaluate({ async: true });
                damages.push(roll);
            }
            return damages;
        }
    }

    const damages = await calculateDamage();

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        let sequence = new Sequence();

        // Effet de lancement sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .atLocation(caster)
            .scale(0.8)
            .duration(3000);

        for (let i = 0; i < elementConfig.projectileCount; i++) {
            const targetIndex = Math.min(i, targets.length - 1);
            const target = targets[targetIndex];

            if (isLivingWater) {
                // Eau Vivante : effet direct sur la cible
                let healEffect = sequence.effect()
                    .file(elementConfig.effectFile)
                    .atLocation(target)
                    .scale(0.8)
                    .delay(500 + i * 200);

                if (elementConfig.tint) {
                    healEffect.tint(elementConfig.tint);
                }
            } else {
                // Projectile de dégâts : voyage du lanceur vers la cible
                let projectileEffect = sequence.effect()
                    .file(elementConfig.effectFile)
                    .atLocation(caster)
                    .stretchTo(target)
                    .scale(0.6)
                    .delay(500 + i * 200)
                    .waitUntilFinished(-200);

                if (elementConfig.tint) {
                    projectileEffect.tint(elementConfig.tint);
                }

                // Effet d'impact
                if (elementConfig.explosionFile) {
                    let impactEffect = sequence.effect()
                        .file(elementConfig.explosionFile)
                        .atLocation(target)
                        .scale(0.5);

                    if (elementConfig.tint) {
                        impactEffect.tint(elementConfig.tint);
                    }
                }
            }
        }

        await sequence.play();
    }

    await playAnimation();

    // ===== ATTACK + DAMAGE RESOLUTION =====
    if (!isLivingWater) {
        // Pour les sorts d'attaque
        const totalAttackDice = characteristicInfo.final + attackBonus;
        const levelBonus = 2 * SPELL_CONFIG.spellLevel;
        let combinedParts = [`${totalAttackDice}d7 + ${levelBonus}`];

        if (currentStance !== 'offensif') {
            // Ajouter les dés de dégâts si pas maximisé
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const totalDamageBonus = damageBonus + effectDamageBonus;
            const statBonus = Math.floor((characteristicInfo.final + totalDamageBonus) / 2);

            for (let i = 0; i < elementConfig.projectileCount; i++) {
                combinedParts.push(`1d6 + ${statBonus}`);
            }
        }

        const combinedRoll = new Roll(`{${combinedParts.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        const attackResult = combinedRoll.terms[0].results[0];

        // ===== CHAT MESSAGE POUR ATTAQUE =====
        const targetText = targets.length > 1
            ? `${targetActors[0]?.name || 'cible'} et ${targetActors[1]?.name || 'cible'}`
            : targetActors[0]?.name || 'cible';

        const totalDamage = damages.reduce((sum, dmg) => sum + dmg.total, 0);
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';

        const actualManaCost = currentStance === 'focus' && elementConfig.isFocusable
            ? 'GRATUIT (Position Focus)'
            : `${elementConfig.manaCost} mana`;

        function createAttackFlavor() {
            return `
                <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #1976d2;">🫧 Sort de ${SPELL_CONFIG.name} - ${elementConfig.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                        <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>🫧 ${elementConfig.name}${stanceNote}</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible(s):</strong> ${targetText}</div>
                        <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${totalDamage}</div>
                        ${elementConfig.projectileCount > 1 ? `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${damages.map(d => d.total).join(' + ')})</div>` : ''}
                    </div>
                    <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                        <div style="font-size: 0.9em; color: #1976d2;"><strong>✨ Effet:</strong> ${elementConfig.description}</div>
                    </div>
                </div>
            `;
        }

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: createAttackFlavor(),
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`${SPELL_CONFIG.name} lancé ! Cible: ${targetText}. Attaque: ${attackResult.result}, Dégâts: ${totalDamage}.`);

    } else {
        // Pour l'Eau Vivante (soin)
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = Math.floor((characteristicInfo.final + totalDamageBonus) / 2);
        const healingRoll = new Roll("1d6 + @statBonus", { statBonus: statBonus });
        await healingRoll.evaluate({ async: true });

        const targetName = allowSelfTarget ? actor.name : (targetActors[0]?.name || "cible");
        const actualManaCost = currentStance === 'focus'
            ? '2 mana (Position Focus - coût réduit)'
            : `${elementConfig.manaCost} mana`;

        function createHealingFlavor() {
            return `
                <div style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); padding: 12px; border-radius: 8px; border: 2px solid #4caf50; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #2e7d32;">🫧 Sort de ${SPELL_CONFIG.name} - ${elementConfig.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #d4edda; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #155724; margin-bottom: 6px;"><strong>🫧 ${elementConfig.name}</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                        <div style="font-size: 1.4em; color: #2e7d32; font-weight: bold;">💚 SOIN: ${healingRoll.total}</div>
                    </div>
                    <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f1f8e9; border-radius: 4px;">
                        <div style="font-size: 0.9em; color: #2e7d32;"><strong>✨ Effet:</strong> ${elementConfig.description}</div>
                    </div>
                </div>
            `;
        }

        await healingRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: createHealingFlavor(),
            rollMode: game.settings.get("core", "rollMode")
        });

        ui.notifications.info(`${SPELL_CONFIG.name} lancé ! ${healingRoll.total} soin appliqué à ${targetName}.`);
    }

})();
