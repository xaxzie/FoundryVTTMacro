/**
 * Feu obscur - Moctei (Mage des Ombres)
 *
 * Un feu qui n'émet aucune lumière et qui se répand sur toutes cibles adjacentes,
 * provoquant des brûlures continues, ne s'éteignant que sur la volonté du lanceur.
 *
 * - Coût initial : 2 mana (focalisable, niveau 2)
 * - Coût de maintenance : 1 mana par tour (NON focalisable)
 * - Coût d'extension : +2 mana (focalisable) pour étendre sur cibles adjacentes
 * - Cibles initiales : 1 ou 2 (choix dans le menu)
 * - Caractéristique d'attaque : Sens (+ effets actifs + bonus manuels)
 * - Dégâts : Dextérité/2 (arrondi supérieur)
 * - Dégâts par tour : Dextérité/4 (arrondi supérieur) - effet "Flamme Noire"
 * - Jet de sauvegarde : Volonté de l'adversaire
 * - Extension : Détecte automatiquement les cibles adjacentes et propose extension
 *
 * Animations :
 * - Cast : Animation d'invocation de feu noir
 * - Dark Flame : Flamme noire persistante sur chaque cible
 * - Extension : Animation d'extension du feu vers les cibles adjacentes
 *
 * Usage : sélectionner le token de Moctei, choisir le nombre de cibles initiales,
 * cibler, puis choisir les extensions si disponibles.
 * Utiliser la macro "endMocteiEffect.js" pour terminer le feu obscur.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Feu obscur",
        characteristic: "sens",
        characteristicDisplay: "Sens",
        damageCharacteristic: "dexterite", // Pour les dégâts
        damageCharacteristicDisplay: "Dextérité",
        initialManaCost: 2,
        maintenanceCost: 1, // NON focalisable
        extensionCost: 2, // Focalisable
        spellLevel: 2,
        isDirect: true,
        isFocusable: true, // Pour coût initial et extension seulement
        hasNoDamage: false,
        dexterityDivisorDamage: 2, // Dextérité/2 pour dégâts initiaux (arrondi supérieur)
        dexterityDivisorContinuous: 4, // Dextérité/4 pour dégâts continus (arrondi supérieur)
        maxInitialTargets: 2,

        animations: {
            cast: "jb2a.template_circle.aura.01.loop.small.bluepurple",
            darkFlame: "jb2a.markers.simple.001.complete.001.purple", // Flamme noire persistante
            extension: "animated-spell-effects.air.smoke.black_ray", // Animation d'extension
            sound: null
        },

        targeting: {
            range: 200, // Portée du feu obscur
            color: "#1a0033", // Couleur noir-violet
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        },

        // Configuration de l'effet persistant sur les cibles
        flameEffect: {
            name: "Flamme Noire",
            icon: "icons/magic/fire/flame-burning-skull-orange.webp",
            description: "Brûlé par les flammes noires de Moctei - Dégâts continus"
        },

        // Configuration de l'effet sur Moctei pour tracker l'état
        casterEffect: {
            name: "Feu obscur (Contrôle)",
            icon: "icons/magic/fire/flame-burning-eye.webp",
            description: "Contrôle des flammes noires actives"
        },

        // Jet de sauvegarde de la cible
        willpowerSave: {
            characteristic: "volonte",
            description: "Jet de Volonté pour résister au feu obscur"
        },

        // Configuration du combo avec Manipulation des ombres
        comboOption: {
            name: "Combo Manipulation des ombres",
            manaCost: 2, // Coût additionnel
            isFocusable: true,
            description: "Applique aussi Manipulation des ombres en cas de coup réussi",
            manipulationAnimations: {
                shadowTendril: "animated-spell-effects.air.smoke.black_ray",
                immobilization: "jb2a_patreon.black_tentacles.dark_purple"
            },
            manipulationEffect: {
                name: "Manipulation des ombres",
                icon: "icons/creatures/tentacles/tentacles-suctioncups-pink.webp",
                description: "Immobilisé par les ombres de Moctei - Ne peut pas se déplacer (depuis Feu obscur)"
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

    const attackCharacteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const damageCharacteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.damageCharacteristic);
    if (!attackCharacteristicInfo || !damageCharacteristicInfo) return;

    // ===== CHECK EXISTING DARK FLAMES =====
    const existingControlEffectCheck = actor.effects?.contents?.find(e =>
        e.name === SPELL_CONFIG.casterEffect.name
    );

    const flameCount = existingControlEffectCheck?.flags?.statuscounter?.value || 0;

    // ===== DIALOG DE CONFIGURATION INITIALE =====
    async function showInitialConfigDialog() {
        const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
            `<strong>Coût Initial :</strong> GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} par tour (NON focalisable)` :
            `<strong>Coût Initial :</strong> ${SPELL_CONFIG.initialManaCost} mana + ${SPELL_CONFIG.maintenanceCost} par tour (NON focalisable)`;

        const flameInfo = flameCount > 0 ?
            `<div style="color: #4a148c; font-weight: bold; margin: 10px 0; padding: 8px; background: #f3e5f5; border-radius: 4px;">
                🔥 Flammes noires actives : ${flameCount}
                <br><small>Vous pouvez en créer de nouvelles</small>
            </div>` : '';

        const initialDamage = Math.ceil(damageCharacteristicInfo.final / SPELL_CONFIG.dexterityDivisorDamage);
        const continuousDamage = Math.ceil(damageCharacteristicInfo.final / SPELL_CONFIG.dexterityDivisorContinuous);

        return new Promise(resolve => {
            new Dialog({
                title: `🔥 ${SPELL_CONFIG.name}`,
                content: `
                    <div style="margin-bottom: 15px;">
                        <h3 style="border-bottom: 2px solid #4a148c; color: #4a148c;">${SPELL_CONFIG.name}</h3>
                        <p><strong>Lanceur:</strong> ${actor.name}</p>
                        <p><strong>Attaque:</strong> ${SPELL_CONFIG.characteristicDisplay} (${attackCharacteristicInfo.final})</p>
                        <p><strong>Dégâts:</strong> ${SPELL_CONFIG.damageCharacteristicDisplay} (${damageCharacteristicInfo.final})</p>
                        ${manaInfo}
                        ${flameInfo}

                        <div style="margin: 10px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                            <strong>🔥 Effet du sort :</strong>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                <li>🎯 <strong>Toucher :</strong> Sens (${attackCharacteristicInfo.final})</li>
                                <li>⚔️ <strong>Dégâts initiaux :</strong> ${initialDamage} (Dex/2, arrondi sup.)</li>
                                <li>🔥 <strong>Dégâts/tour :</strong> ${continuousDamage} (Dex/4, arrondi sup.)</li>
                                <li>🌑 <strong>Flamme Noire :</strong> Brûlures continues sans lumière</li>
                                <li>🎲 <strong>Sauvegarde :</strong> Jet de Volonté</li>
                                <li>📈 <strong>Extension :</strong> +2 mana pour cibles adjacentes</li>
                            </ul>
                        </div>

                        <div style="margin: 10px 0; padding: 10px; background: #f3e5f5; border-radius: 4px; border: 2px solid #9c27b0;">
                            <h4 style="margin: 0 0 10px 0; color: #4a148c;">🌑 Options Combo (+2 mana, focalisable)</h4>
                            <label style="display: flex; align-items: center; margin-bottom: 8px;">
                                <input type="radio" name="comboOption" value="none" checked style="margin-right: 8px;">
                                <span><strong>Feu Obscur seul</strong> - Effet standard avec extensions possibles</span>
                            </label>
                            <label style="display: flex; align-items: center;">
                                <input type="radio" name="comboOption" value="shadowManipulation" style="margin-right: 8px;">
                                <span><strong>+ Manipulation des ombres</strong> - Applique aussi l'immobilisation en cas de coup réussi</span>
                            </label>
                            <div style="margin-top: 8px; font-size: 0.9em; color: #6a0dad; font-style: italic;">
                                ⚠️ Le combo annule la possibilité d'extensions adjacentes
                            </div>
                        </div>

                        <div style="margin: 10px 0;">
                            <label for="targetCount" style="font-weight: bold;">Nombre de cibles initiales :</label>
                            <select id="targetCount" style="margin-left: 5px;">
                                <option value="1" selected>1 cible</option>
                                <option value="2">2 cibles</option>
                            </select>
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
                        icon: '<i class="fas fa-fire"></i>',
                        label: "🔥 Lancer",
                        callback: (html) => {
                            const targetCount = parseInt(html.find('#targetCount').val()) || 1;
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const comboOption = html.find('input[name="comboOption"]:checked').val();
                            resolve({ targetCount, attackBonus, damageBonus, comboOption });
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
                width: 550,
                height: "auto"
            }).render(true);
        });
    }

    const initialConfig = await showInitialConfigDialog();
    if (!initialConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }
    const { targetCount, attackBonus, damageBonus, comboOption } = initialConfig;

    // ===== TARGETING INITIAL via Portal =====
    async function selectInitialTargets(count) {
        const targets = [];

        for (let i = 0; i < count; i++) {
            ui.notifications.info(`🎯 Sélectionnez la cible ${i + 1}/${count} pour ${SPELL_CONFIG.name}...`);

            try {
                const portal = new Portal()
                    .origin(caster)
                    .range(SPELL_CONFIG.targeting.range)
                    .color(SPELL_CONFIG.targeting.color)
                    .texture(SPELL_CONFIG.targeting.texture);

                const target = await portal.pick();
                if (!target) {
                    ui.notifications.info(`Ciblage annulé pour la cible ${i + 1}.`);
                    return null;
                }
                targets.push(target);
            } catch (error) {
                ui.notifications.error("Erreur lors du ciblage. Vérifiez que Portal est installé.");
                return null;
            }
        }

        return targets;
    }

    const initialTargets = await selectInitialTargets(targetCount);
    if (!initialTargets) {
        ui.notifications.info('Sort annulé - Ciblage incomplet.');
        return;
    }

    // ===== FONCTION DE DÉTECTION D'ACTEUR =====
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        if (canvas.grid.type !== 0) {
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);
                const tokenWidth = Math.ceil(token.document.width);
                const tokenHeight = Math.ceil(token.document.height);

                const intersects = targetGridX >= tokenGridX &&
                    targetGridX < tokenGridX + tokenWidth &&
                    targetGridY >= tokenGridY &&
                    targetGridY < tokenGridY + tokenHeight;

                return intersects && token.visible;
            });

            if (tokensAtLocation.length === 0) return null;
            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            return { name: targetToken.name, token: targetToken, actor: targetActor };
        } else {
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;

                const distance = Math.sqrt(
                    Math.pow(tokenCenterX - x, 2) +
                    Math.pow(tokenCenterY - y, 2)
                );

                return distance <= tolerance && token.visible;
            });

            if (tokensAtLocation.length === 0) return null;
            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    }

    // ===== TRAITEMENT DES CIBLES INITIALES =====
    const processedTargets = [];
    for (const target of initialTargets) {
        const targetActor = getActorAtLocation(target.x, target.y);
        if (targetActor) {
            // Vérifier si la cible a déjà une flamme noire
            const existingFlame = targetActor.actor.effects.find(e => e.name === SPELL_CONFIG.flameEffect.name);
            if (existingFlame) {
                ui.notifications.warn(`${targetActor.name} a déjà une Flamme Noire active !`);
                continue;
            }
            processedTargets.push({
                ...targetActor,
                position: { x: target.x, y: target.y }
            });
        } else {
            ui.notifications.warn(`Aucune cible trouvée à la position sélectionnée.`);
        }
    }

    if (processedTargets.length === 0) {
        ui.notifications.error("Aucune cible valide trouvée !");
        return;
    }

    // ===== DÉTECTION DES CIBLES ADJACENTES =====
    function getAdjacentTokens(targetToken) {
        const gridSize = canvas.grid.size;
        const targetGridX = Math.floor(targetToken.x / gridSize);
        const targetGridY = Math.floor(targetToken.y / gridSize);

        const adjacent = [];

        // Vérifier les 8 cases adjacentes
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Skip la case du token lui-même

                const checkX = targetGridX + dx;
                const checkY = targetGridY + dy;

                const adjacentTokens = canvas.tokens.placeables.filter(token => {
                    const tokenGridX = Math.floor(token.x / gridSize);
                    const tokenGridY = Math.floor(token.y / gridSize);
                    const tokenWidth = Math.ceil(token.document.width);
                    const tokenHeight = Math.ceil(token.document.height);

                    // Vérifier si le token occupe la case adjacente
                    const occupies = checkX >= tokenGridX &&
                        checkX < tokenGridX + tokenWidth &&
                        checkY >= tokenGridY &&
                        checkY < tokenGridY + tokenHeight;

                    return occupies && token.visible && token.id !== targetToken.id && token.id !== caster.id;
                });

                for (const adjToken of adjacentTokens) {
                    if (adjToken.actor && !adjacent.find(a => a.token.id === adjToken.id)) {
                        // Vérifier si ce token n'a pas déjà une flamme noire
                        const hasFlame = adjToken.actor.effects.find(e => e.name === SPELL_CONFIG.flameEffect.name);
                        if (!hasFlame) {
                            adjacent.push({
                                name: adjToken.name,
                                token: adjToken,
                                actor: adjToken.actor
                            });
                        }
                    }
                }
            }
        }

        return adjacent;
    }

    // Collecter toutes les cibles adjacentes possibles
    let allAdjacentTargets = [];
    for (const processedTarget of processedTargets) {
        const adjacents = getAdjacentTokens(processedTarget.token);
        for (const adj of adjacents) {
            if (!allAdjacentTargets.find(a => a.token.id === adj.token.id)) {
                allAdjacentTargets.push({
                    ...adj,
                    originTarget: processedTarget.name
                });
            }
        }
    }

    // ===== DIALOG D'EXTENSION (si cibles adjacentes disponibles) =====
    let extensionTargets = [];
    const isComboActive = comboOption === 'shadowManipulation';

    if (allAdjacentTargets.length > 0 && !isComboActive) { // Pas d'extension si combo actif
        const extensionCost = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
            "GRATUIT (Position Focus)" :
            `${SPELL_CONFIG.extensionCost} mana`;

        const extensionChoice = await new Promise(resolve => {
            let dialogContent = `
                <h3>🔥 Extension du Feu Obscur</h3>
                <p><strong>Coût d'extension :</strong> ${extensionCost}</p>
                <p>Cibles adjacentes détectées. Sélectionnez celles sur lesquelles étendre le feu :</p>

                <div style="margin: 15px 0; max-height: 300px; overflow-y: auto;">
            `;

            for (let i = 0; i < allAdjacentTargets.length; i++) {
                const target = allAdjacentTargets[i];
                dialogContent += `
                    <div style="margin: 8px 0; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        <label>
                            <input type="checkbox" id="extend-${i}" value="${i}" style="margin-right: 8px;">
                            <strong>${target.name}</strong> (adjacent à ${target.originTarget})
                        </label>
                    </div>
                `;
            }

            dialogContent += `</div>`;

            new Dialog({
                title: "🔥 Extension du Feu Obscur",
                content: dialogContent,
                buttons: {
                    extend: {
                        icon: '<i class="fas fa-expand"></i>',
                        label: "🔥 Étendre",
                        callback: (html) => {
                            const selectedIndices = [];
                            html.find('input[type="checkbox"]:checked').each(function () {
                                selectedIndices.push(parseInt($(this).val()));
                            });
                            resolve({ extend: true, targets: selectedIndices.map(i => allAdjacentTargets[i]) });
                        }
                    },
                    noExtend: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Pas d'extension",
                        callback: () => resolve({ extend: false, targets: [] })
                    }
                },
                default: "extend"
            }, {
                width: 450,
                height: "auto"
            }).render(true);
        });

        if (extensionChoice.extend) {
            extensionTargets = extensionChoice.targets;
        }
    }

    // ===== CALCUL DES COÛTS TOTAUX =====
    const initialCostReduced = (currentStance === 'focus' && SPELL_CONFIG.isFocusable);
    const extensionCostReduced = (currentStance === 'focus' && SPELL_CONFIG.isFocusable);

    const finalInitialCost = initialCostReduced ? 0 : SPELL_CONFIG.initialManaCost;
    const finalExtensionCost = (extensionTargets.length > 0) ?
        (extensionCostReduced ? 0 : SPELL_CONFIG.extensionCost) : 0;

    const totalManaCost = finalInitialCost + finalExtensionCost;

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Animation de cast sur Moctei
        if (SPELL_CONFIG.animations.cast) {
            seq.effect()
                .file(SPELL_CONFIG.animations.cast)
                .attachTo(caster)
                .scale(0.8)
                .duration(2000)
                .fadeOut(800)
                .belowTokens();
        }

        // Flammes noires sur cibles initiales
        for (const target of processedTargets) {
            if (SPELL_CONFIG.animations.darkFlame) {
                seq.effect()
                    .file(SPELL_CONFIG.animations.darkFlame)
                    .attachTo(target.token)
                    .scale(0.6)
                    .name(`dark-flame-${caster.id}-${target.token.id}`)
                    .tint("#1a0033")
                    .opacity(0.4);
            }
        }

        // Animations d'extension - de la cible initiale vers la cible d'extension
        for (const extTarget of extensionTargets) {
            if (SPELL_CONFIG.animations.extension) {
                // Trouver la cible initiale la plus proche pour cette extension
                const originTargetData = processedTargets.find(pt => pt.name === extTarget.originTarget);
                if (originTargetData) {
                    seq.effect()
                        .file(SPELL_CONFIG.animations.extension)
                        .attachTo(originTargetData.token)
                        .stretchTo(extTarget.token)
                        .scale(1)
                        .tint("#1a0033");
                }

                // Flamme persistante sur cible étendue
                if (SPELL_CONFIG.animations.darkFlame) {
                    seq.effect()
                        .file(SPELL_CONFIG.animations.darkFlame)
                        .attachTo(extTarget.token)
                        .scale(0.4)
                        .name(`dark-flame-${caster.id}-${extTarget.token.id}`)
                        .delay(1000)
                        .fadeIn(1000)
                        .tint("#1a0033")
                        .opacity(0.8);
                }
            }
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const totalAttackDice = attackCharacteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${totalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== DAMAGE CALCULATION =====
    const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
    const baseDamage = Math.ceil(damageCharacteristicInfo.final / SPELL_CONFIG.dexterityDivisorDamage);
    const continuousDamage = Math.ceil(damageCharacteristicInfo.final / SPELL_CONFIG.dexterityDivisorContinuous);

    // Dégâts initiaux (avec bonus)
    const initialDamage = baseDamage + (damageBonus || 0) + effectDamageBonus;

    // ===== COMBO CONFIGURATION =====
    const comboManaCost = isComboActive ? SPELL_CONFIG.comboOption.manaCost : 0;
    const comboManaCostReduced = (currentStance === 'focus' && SPELL_CONFIG.comboOption.isFocusable);
    const finalComboManaCost = isComboActive ? (comboManaCostReduced ? 0 : comboManaCost) : 0;

    // Calculs pour la Manipulation des ombres combo (basé sur Dextérité)
    let manipulationInitialDamage = 0;
    let manipulationContinuousDamage = 0;
    if (isComboActive) {
        manipulationInitialDamage = Math.floor(damageCharacteristicInfo.final / 2); // Dex/2 arrondi inf
        manipulationContinuousDamage = Math.floor(damageCharacteristicInfo.final / 2); // Dex/2 arrondi inf
    }

    // ===== ADD ACTIVE EFFECTS =====
    const allTargets = [...processedTargets, ...extensionTargets];

    // Calcul du nombre total de sources (existantes + nouvelles sources initiales)
    const finalTotalSources = flameCount + processedTargets.length;

    for (const target of allTargets) {
        // Déterminer si c'est une source initiale ou une extension
        const isInitialSource = processedTargets.some(pt => pt.token.id === target.token.id);
        const flameType = isInitialSource ? "source" : "extension";

        // Effet sur la cible
        const targetEffectData = {
            name: SPELL_CONFIG.flameEffect.name,
            icon: SPELL_CONFIG.flameEffect.icon,
            description: SPELL_CONFIG.flameEffect.description,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    darkFlameCaster: caster.id,
                    darkFlameTarget: target.token.id,
                    darkFlameSequenceName: `dark-flame-${caster.id}-${target.token.id}`,
                    darkFlameType: flameType, // "source" ou "extension"
                    spellName: SPELL_CONFIG.name,
                    maintenanceCost: SPELL_CONFIG.maintenanceCost,
                    damagePerTurn: continuousDamage
                },
                statuscounter: { value: continuousDamage, visible: true }
            }
        };

        try {
            await target.actor.createEmbeddedDocuments("ActiveEffect", [targetEffectData]);
            console.log(`[Moctei] Applied dark flame to ${target.name}`);
        } catch (error) {
            console.error(`[Moctei] Error applying effect to ${target.name}:`, error);
            ui.notifications.error(`Erreur lors de l'application de l'effet sur ${target.name} !`);
        }
    }

    // Gestion de l'effet sur le lanceur (pour tracker les flammes actives)
    const existingControlEffect = actor.effects.find(e => e.name === SPELL_CONFIG.casterEffect.name);

    if (existingControlEffect) {
        // Mettre à jour l'effet existant - ne compter que les sources initiales
        const currentSources = existingControlEffect.flags?.world?.darkFlameInitialSources || [];
        const currentExtensions = existingControlEffect.flags?.world?.darkFlameExtensions || [];
        const newInitialSources = processedTargets.map(t => t.token.id);
        const newExtensions = extensionTargets.map(t => t.token.id);

        const updatedSources = [...currentSources, ...newInitialSources];
        const updatedExtensions = [...currentExtensions, ...newExtensions];
        const allAffectedTargets = [...updatedSources, ...updatedExtensions];

        const updateData = {
            description: `${SPELL_CONFIG.casterEffect.description} - ${updatedSources.length} source(s) active(s)`,
            flags: {
                ...existingControlEffect.flags,
                world: {
                    ...existingControlEffect.flags.world,
                    darkFlameInitialSources: updatedSources,
                    darkFlameExtensions: updatedExtensions,
                    darkFlameTargets: allAffectedTargets, // Pour compatibilité avec endMocteiEffect
                    spellName: SPELL_CONFIG.name,
                    maintenanceCost: SPELL_CONFIG.maintenanceCost
                },
                statuscounter: { value: updatedSources.length, visible: true } // Ne compter que les sources
            }
        };

        try {
            await existingControlEffect.update(updateData);
            console.log(`[Moctei] Updated existing dark flame control effect: ${updatedSources.length} sources, ${updatedExtensions.length} extensions`);
        } catch (error) {
            console.error(`[Moctei] Error updating control effect:`, error);
        }
    } else {
        // Créer un nouvel effet de contrôle - ne compter que les sources initiales
        const initialSources = processedTargets.map(t => t.token.id);
        const extensions = extensionTargets.map(t => t.token.id);
        const allAffectedTargets = [...initialSources, ...extensions];

        const casterEffectData = {
            name: SPELL_CONFIG.casterEffect.name,
            icon: SPELL_CONFIG.casterEffect.icon,
            description: `${SPELL_CONFIG.casterEffect.description} - ${initialSources.length} source(s) active(s)`,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    darkFlameInitialSources: initialSources,
                    darkFlameExtensions: extensions,
                    darkFlameTargets: allAffectedTargets, // Pour compatibilité avec endMocteiEffect
                    spellName: SPELL_CONFIG.name,
                    maintenanceCost: SPELL_CONFIG.maintenanceCost
                },
                statuscounter: { value: initialSources.length, visible: true } // Ne compter que les sources
            }
        };

        try {
            await actor.createEmbeddedDocuments("ActiveEffect", [casterEffectData]);
            console.log(`[Moctei] Applied new dark flame control effect: ${initialSources.length} sources, ${extensions.length} extensions`);
        } catch (error) {
            console.error(`[Moctei] Error applying control effect:`, error);
        }
    }

    // ===== COMBO SHADOW MANIPULATION APPLICATION =====
    if (isComboActive) {
        for (const target of allTargets) {
            // Animation de Manipulation des ombres combo (après les flammes)
            const manipulationSeq = new Sequence();

            // Trait d'ombre persistant
            if (SPELL_CONFIG.comboOption.manipulationAnimations.shadowTendril) {
                manipulationSeq.effect()
                    .file(SPELL_CONFIG.comboOption.manipulationAnimations.shadowTendril)
                    .attachTo(caster)
                    .stretchTo(target.token, { attachTo: true })
                    .scale(0.8)
                    .persist()
                    .name(`shadow-manipulation-combo-${caster.id}-${target.token.id}`)
                    .fadeIn(1000)
                    .fadeOut(1000)
                    .tint("#2e0054")
                    .delay(2500); // Après les animations de feu obscur
            }

            // Effet d'immobilisation sur la cible
            if (SPELL_CONFIG.comboOption.manipulationAnimations.immobilization) {
                manipulationSeq.effect()
                    .file(SPELL_CONFIG.comboOption.manipulationAnimations.immobilization)
                    .attachTo(target.token)
                    .scale(0.2)
                    .persist()
                    .name(`shadow-immobilization-combo-${target.token.id}`)
                    .fadeIn(1000)
                    .fadeOut(1000)
                    .tint("#2e0054")
                    .opacity(0.8)
                    .delay(3000); // Légèrement après le trait d'ombre
            }

            await manipulationSeq.play();

            // Appliquer l'effet Manipulation des ombres combo
            const manipulationEffectData = {
                name: SPELL_CONFIG.comboOption.manipulationEffect.name,
                icon: SPELL_CONFIG.comboOption.manipulationEffect.icon,
                description: SPELL_CONFIG.comboOption.manipulationEffect.description,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        shadowManipulationCaster: caster.id,
                        shadowManipulationTarget: target.token.id,
                        shadowManipulationSequenceName: `shadow-manipulation-combo-${caster.id}-${target.token.id}`,
                        immobilizationSequenceName: `shadow-immobilization-combo-${target.token.id}`,
                        spellName: "Manipulation des ombres (Combo)",
                        maintenanceCost: 1, // Même maintenance que Manipulation des ombres normale
                        damagePerTurn: manipulationContinuousDamage,
                        isComboManipulation: true // Flag pour identifier les manipulations combo
                    },
                    immobilized: { value: true },
                    statuscounter: { value: manipulationContinuousDamage }
                }
            };

            try {
                await target.actor.createEmbeddedDocuments("ActiveEffect", [manipulationEffectData]);
                console.log(`[Moctei] Applied combo shadow manipulation to ${target.name}`);

                // Gérer l'effet de contrôle Manipulation des ombres sur Moctei
                const manipulationCasterEffectData = {
                    name: "Manipulation des ombres (Contrôle)",
                    icon: "icons/creatures/tentacles/tentacles-octopus-black-pink.webp",
                    description: `Contrôle une manipulation d'ombre active - Cible: ${target.name}`,
                    duration: { seconds: 86400 },
                    flags: {
                        world: {
                            shadowManipulationTarget: target.token.id,
                            shadowManipulationSequenceName: `shadow-manipulation-combo-${caster.id}-${target.token.id}`,
                            targetName: target.name,
                            spellName: "Manipulation des ombres",
                            maintenanceCost: 1
                        },
                        statuscounter: { value: 1 }
                    }
                };

                await actor.createEmbeddedDocuments("ActiveEffect", [manipulationCasterEffectData]);
                console.log(`[Moctei] Applied combo shadow manipulation control effect`);

            } catch (error) {
                console.error(`[Moctei] Error applying combo shadow manipulation:`, error);
                ui.notifications.error(`Erreur lors de l'application de la Manipulation des ombres combo !`);
            }
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        const costBreakdown = [];
        if (finalInitialCost > 0) costBreakdown.push(`${finalInitialCost} initial`);
        else if (initialCostReduced) costBreakdown.push("Initial GRATUIT");

        if (finalExtensionCost > 0) costBreakdown.push(`${finalExtensionCost} extension`);
        else if (extensionTargets.length > 0 && extensionCostReduced) costBreakdown.push("Extension GRATUIT");

        if (finalComboManaCost > 0) costBreakdown.push(`${finalComboManaCost} combo`);
        else if (isComboActive && comboManaCostReduced) costBreakdown.push("Combo GRATUIT");

        costBreakdown.push(`${SPELL_CONFIG.maintenanceCost}/tour`);
        if (isComboActive) costBreakdown.push("1/tour (Manipulation)");

        const actualMana = costBreakdown.join(" + ");

        const injuryInfo = attackCharacteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${attackCharacteristicInfo.base} - ${attackCharacteristicInfo.injuries} = ${attackCharacteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = (attackCharacteristicInfo.effectBonus !== 0 || damageCharacteristicInfo.effectBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${attackCharacteristicInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${SPELL_CONFIG.characteristicDisplay}: +${attackCharacteristicInfo.effectBonus}</div>` : ''}
                ${damageCharacteristicInfo.effectBonus !== 0 ? `<div>🔥 Bonus de ${SPELL_CONFIG.damageCharacteristicDisplay}: +${damageCharacteristicInfo.effectBonus}</div>` : ''}
            </div>` : '';

        const bonusInfo = (attackBonus > 0 || damageBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
                ${damageBonus > 0 ? `<div>💥 Bonus Manuel de Dégâts: +${damageBonus} points</div>` : ''}
            </div>` : '';

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                <div style="font-size: 1.2em; color: #4a148c; font-weight: bold;">🔥 DÉGÂTS INITIAUX: ${initialDamage}</div>
                <div style="font-size: 0.9em; color: #666;">Base: ${baseDamage} (Dex/2) + Bonus: ${(damageBonus || 0) + effectDamageBonus}</div>
            </div>
        `;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
            </div>
        `;

        const targetsDisplay = `
            <div style="margin: 8px 0; padding: 8px; background: #e3f2fd; border-radius: 4px;">
                <div style="font-weight: bold; color: #1976d2;">🔥 Cibles touchées :</div>
                <div style="font-size: 0.9em; margin: 5px 0;">
                    <div><strong>Initiales (${processedTargets.length}) :</strong> ${processedTargets.map(t => t.name).join(', ')}</div>
                    ${extensionTargets.length > 0 ? `<div><strong>Extensions (${extensionTargets.length}) :</strong> ${extensionTargets.map(t => t.name).join(', ')}</div>` : ''}
                    <div>🔥 <strong>Dégâts continus :</strong> ${continuousDamage} points/tour (Dex/4)</div>
                    <div>🎲 <strong>Sauvegarde :</strong> Jet de Volonté</div>
                </div>
            </div>
        `;

        const flameInfo = flameCount > 0 ? `
            <div style="margin: 8px 0; padding: 8px; background: #fce4ec; border-radius: 4px;">
                <div style="font-size: 0.9em; color: #ad1457;">
                    🔥 Sources de feu obscur actives : ${finalTotalSources}
                    <br><small>(${allTargets.length} cible(s) touchée(s) au total)</small>
                </div>
            </div>
        ` : '';

        const comboDisplay = isComboActive ? `
            <div style="margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px; border: 2px solid #9c27b0;">
                <div style="font-size: 1.1em; color: #4a148c; font-weight: bold; margin-bottom: 6px;">🌑 COMBO MANIPULATION DES OMBRES ACTIVÉ</div>
                <div style="font-size: 0.9em; color: #6a0dad;">
                    <div>💀 <strong>Dégâts initiaux Manipulation:</strong> ${manipulationInitialDamage} (Dex/2, fixes)</div>
                    <div>🔄 <strong>Dégâts continus Manipulation:</strong> ${manipulationContinuousDamage} (Dex/2, fixes)</div>
                    <div>🚫 <strong>Immobilisation:</strong> Les cibles ne peuvent pas se déplacer</div>
                    <div>🔄 <strong>Maintenance:</strong> +1 mana par tour pour la Manipulation</div>
                </div>
            </div>
        ` : '';

        return `
            <div style="border: 2px solid #4a148c; border-radius: 8px; padding: 10px; background: linear-gradient(135deg, #f8f4ff 0%, #f0e8ff 100%);">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #4a148c; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                        🔥 ${SPELL_CONFIG.name}
                    </h3>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        <strong>Cibles:</strong> ${allTargets.length} | <strong>Coût:</strong> ${actualMana}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-around; margin: 10px 0;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">SENS</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #4a148c;">${attackCharacteristicInfo.final}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.8em; color: #666;">DEXTÉRITÉ</div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #4a148c;">${damageCharacteristicInfo.final}</div>
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
                ${targetsDisplay}
                ${comboDisplay}
                ${flameInfo}
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
    const extensionInfo = extensionTargets.length > 0 ? ` + ${extensionTargets.length} extension(s)` : '';
    const comboInfo = isComboActive ? ` + Manipulation (${manipulationInitialDamage} initiaux, ${manipulationContinuousDamage}/tour, immobilisé)` : '';
    const totalMaintenanceCost = SPELL_CONFIG.maintenanceCost + (isComboActive ? 1 : 0);

    ui.notifications.info(`🔥 ${SPELL_CONFIG.name} lancé !${stanceInfo} ${processedTargets.length} source(s) initiale(s)${extensionInfo}. Attaque: ${attackRoll.total}, Dégâts: ${initialDamage}. Flammes actives: ${continuousDamage}/tour !${comboInfo} (${totalMaintenanceCost} mana/tour) [${finalTotalSources} source(s) active(s)]`);

})();
