/**
 * Invocation de dagues - Moctei (Mage des Ombres)
 *
 * Sort de création d'armes d'ombre permettant des attaques rapprochées et à distance.
 *
 * FONCTIONNALITÉS :
 *
 * MODE NORMAL (1 mana) :
 * - Coût : 1 point de mana (focalisable)
 * - Niveau de sort : 1
 * - Toucher : Dextérité
 * - Dégâts rapprochés : 2D4 + dextérité (≤ 2 cases)
 * - Dégâts à distance : 1D4 + dextérité (> 2 cases)
 * - Usage unique
 *
 * MODE LONGUE DURÉE (2 mana) :
 * - Coût : 2 points de mana (focalisable)
 * - Crée l'effet "Dagues d'ombre" sur Moctei
 * - Si l'effet est présent : attaques gratuites (0 mana)
 * - L'effet se dissipe après une attaque à distance
 *
 * MÉCANIQUES :
 * - Détection automatique de la distance cible
 * - Menu unifié de sélection (mode + cible)
 * - Animations différenciées selon la distance
 * - Gestion de l'effet longue durée
 * - Effets visuels d'ombre sur Moctei
 *
 * Usage : Sélectionner le token de Moctei et lancer la macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Invocation de dagues",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        spellLevel: 1,
        isDirect: true,
        isFocusable: true,
        hasNoDamage: false, // Ce sort fait des dégâts
        isMultiTarget: false,

        // Modes de lancement
        modes: {
            normal: {
                name: "Usage Normal",
                manaCost: 1,
                description: "Usage unique - 2D4+Dex (proche) ou 1D4+Dex (loin)",
                createsPersistentEffect: false
            },
            longDuration: {
                name: "Longue Durée",
                manaCost: 2,
                description: "Crée l'effet 'Dagues d'ombre' - Attaques gratuites jusqu'à usage à distance",
                createsPersistentEffect: true,
                effectName: "Dagues d'ombre"
            }
        },

        // Distance pour différencier proche/loin
        maxCloseRange: 1.9, // En cases de grille

        // Dégâts selon la distance
        damage: {
            close: {
                dice: "2d4",
                bonus: "dexterite",
                description: "Frappe rapprochée"
            },
            ranged: {
                dice: "1d4",
                bonus: "dexterite",
                description: "Dague lancée"
            }
        },

        // Animations selon le mode et la distance
        animations: {
            cast: {
                close: "jb2a.dagger.melee.02.white",
                ranged: "jb2a.dagger.throw.01.white",
                caster: "jb2a.smoke.puff.centered.grey.0" // Animation d'ombre sur Moctei
            },
            impact: {
                close: "jb2a_patreon.impact.001.dark_purple",
                ranged: "jb2a_patreon.impact.001.dark_purple"
            },
            longDurationEffect: {
                file: "jb2a_patreon.extras.tmfx.runes.circle.simple.conjuration",
                scale: 0.4,
                fadeOut: 2000,
                sequencerName: "MocteiShadowDaggers"
            }
        },

        targeting: {
            range: 300, // Portée maximale
            color: "#4a148c", // Couleur violette sombre
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        },

        // Configuration de l'effet longue durée
        persistentEffect: {
            name: "Dagues d'ombre",
            icon: "icons/weapons/daggers/dagger-curved-purple.webp",
            description: "Dagues d'ombre invoquées - Attaques gratuites disponibles",
            flags: {
                world: {
                    shadowDaggerCaster: null, // Sera remplacé par l'ID du lanceur
                    spellName: "Invocation de dagues",
                    shadowDaggerSequenceName: "MocteiShadowDaggers"
                }
            }
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
                description: "Brûlé par les flammes noires de Moctei - Dégâts continus (depuis Invocation de dagues)"
            }
        },

        // Configuration de la Marque de Lavi
        laviMarkOption: {
            name: "Marque de Lavi",
            manaCost: 4, // Coût additionnel
            isFocusable: true,
            description: "Ajoute 4d6 dégâts si la cible ne l'a pas remarqué",
            condition: "La cible ne doit pas avoir remarqué Moctei",
            bonusDamage: "4d6",
            animation: {
                file: "animated-spell-effects.misc.runes.wild.purple.circle",
                scale: 0.5,
                fadeOut: 800,
                tint: "#8e24aa"
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

    // ===== VÉRIFICATION DE L'EFFET DAGUES D'OMBRE =====
    const existingShadowDaggers = actor.effects?.contents?.find(e =>
        e.name === SPELL_CONFIG.persistentEffect.name
    );

    // ===== MENU UNIFIÉ DE CONFIGURATION =====
    async function showUnifiedDialog() {
        return new Promise(resolve => {
            // Déterminer les modes disponibles
            let modeOptions = '';
            let hasFreeCast = false;

            if (existingShadowDaggers) {
                // Si l'effet existe, proposer le lancement gratuit
                modeOptions += `
                    <div style="margin: 8px 0; padding: 12px; background: #e8f5e8; border: 2px solid #4caf50; border-radius: 4px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="mode" value="free" checked style="margin-right: 8px;">
                            <div>
                                <strong>🆓 Attaque Gratuite</strong>
                                <br><small style="color: #2e7d32;">Utilise l'effet "Dagues d'ombre" existant (0 mana)</small>
                            </div>
                        </label>
                    </div>
                `;
                hasFreeCast = true;
            }

            // Modes payants
            for (const [modeKey, modeData] of Object.entries(SPELL_CONFIG.modes)) {
                const isChecked = !hasFreeCast && modeKey === 'normal' ? 'checked' : '';
                const borderColor = modeData.createsPersistentEffect ? '#ff9800' : '#2196f3';

                modeOptions += `
                    <div style="margin: 8px 0; padding: 12px; background: #f9f9f9; border: 2px solid ${borderColor}; border-radius: 4px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="mode" value="${modeKey}" ${isChecked} style="margin-right: 8px;">
                            <div>
                                <strong>${modeData.name} (${modeData.manaCost} mana)</strong>
                                <br><small style="color: #666;">${modeData.description}</small>
                            </div>
                        </label>
                    </div>
                `;
            }

            const dialogContent = `
                <h3>🌑 ${SPELL_CONFIG.name}</h3>
                <div style="margin: 10px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                    <strong>Moctei (Mage des Ombres)</strong><br>
                    <small>Dextérité: ${characteristicInfo.final} (base: ${characteristicInfo.base}${characteristicInfo.injuries > 0 ? `, blessures: -${characteristicInfo.injuries}` : ''}${characteristicInfo.effectBonus !== 0 ? `, bonus: ${characteristicInfo.effectBonus > 0 ? '+' : ''}${characteristicInfo.effectBonus}` : ''})</small>
                    ${currentStance ? `<br><small>Posture: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</small>` : ''}
                </div>

                <h4>Mode de lancement :</h4>
                ${modeOptions}

                <div style="margin: 10px 0; padding: 10px; background: #fff3e0; border-radius: 4px; border: 2px solid #f57c00;">
                    <h4 style="margin: 0 0 10px 0; color: #e65100;">🔥 Options Combo</h4>
                    <label style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="darkFlameOption" style="margin-right: 8px;">
                        <span><strong>+ Feu Obscur</strong> (+2 mana, focalisable) - Applique aussi Flamme Noire</span>
                    </label>
                    <label style="display: flex; align-items: center; margin-bottom: 8px;">
                        <input type="checkbox" id="laviMarkOption" style="margin-right: 8px;">
                        <span><strong>+ Marque de Lavi</strong> (+4 mana, focalisable) - +4d6 dégâts si non remarqué</span>
                    </label>
                    <div style="margin-top: 8px; font-size: 0.9em; color: #bf360c; font-style: italic;">
                        💡 <strong>Feu Obscur:</strong> Applique les flammes noires (dégâts continus) sur la cible touchée<br>
                        🎯 <strong>Marque de Lavi:</strong> La cible ne doit pas avoir remarqué Moctei pour bénéficier du bonus<br>
                        ✨ <strong>Ces options sont cumulables !</strong>
                    </div>
                </div>

                <h4>Bonus manuels :</h4>
                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                    <div style="margin: 5px 0;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>Bonus de dégâts:</span>
                            <input type="number" id="damageBonus" value="0" min="0" max="20" style="width: 80px;">
                            <span>points</span>
                        </label>
                        <small style="display: block; margin-left: 20px; color: #666;">Objets, effets temporaires, etc.</small>
                    </div>
                    <div style="margin: 5px 0;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <span>Bonus d'attaque:</span>
                            <input type="number" id="attackBonus" value="0" min="-5" max="10" style="width: 80px;">
                            <span>dés</span>
                        </label>
                        <small style="display: block; margin-left: 20px; color: #666;">Dés d7 supplémentaires pour l'attaque</small>
                    </div>
                </div>

                <div style="margin: 15px 0; padding: 10px; background: #fff3e0; border-radius: 4px; font-size: 0.9em;">
                    <strong>💡 Mécaniques des dagues :</strong><br>
                    • <strong>Proche (≤2 cases)</strong> : 2D4 + Dextérité<br>
                    • <strong>Loin (>2 cases)</strong> : 1D4 + Dextérité<br>
                    • <strong>Longue durée</strong> : L'effet se dissipe après une attaque à distance
                </div>
            `;

            new Dialog({
                title: `🌑 ${SPELL_CONFIG.name} - Configuration`,
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: '🗡️ Cibler et Lancer',
                        callback: (html) => {
                            const selectedMode = html.find('input[name="mode"]:checked').val();
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const isDarkFlameActive = html.find('#darkFlameOption').is(':checked');
                            const isLaviMarkActive = html.find('#laviMarkOption').is(':checked');

                            resolve({
                                mode: selectedMode,
                                attackBonus: attackBonus,
                                damageBonus: damageBonus,
                                isDarkFlameActive: isDarkFlameActive,
                                isLaviMarkActive: isLaviMarkActive
                            });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: '❌ Annuler',
                        callback: () => resolve(null)
                    }
                },
                default: "cast"
            }, {
                width: 500,
                height: 800
            }).render(true);
        });
    }

    const userConfig = await showUnifiedDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    const { mode, attackBonus, damageBonus, isDarkFlameActive, isLaviMarkActive } = userConfig;

    // Déterminer le coût en mana et la configuration
    let actualManaCost = 0;
    let modeConfig = null;
    let modeDescription = "";

    if (mode === 'free') {
        actualManaCost = 0;
        modeDescription = "Attaque gratuite (Dagues d'ombre)";
    } else {
        modeConfig = SPELL_CONFIG.modes[mode];
        actualManaCost = modeConfig.manaCost;
        modeDescription = modeConfig.name;
    }

    // ===== COMBO CONFIGURATION =====
    // Les options sont maintenant des checkboxes indépendantes

    // Calcul du coût Feu Obscur
    const darkFlameManaCost = isDarkFlameActive ? SPELL_CONFIG.comboOption.manaCost : 0;
    const darkFlameManaCostReduced = (currentStance === 'focus' && SPELL_CONFIG.comboOption.isFocusable);
    const finalDarkFlameManaCost = isDarkFlameActive ? (darkFlameManaCostReduced ? 0 : darkFlameManaCost) : 0;

    // Calcul du coût Marque de Lavi
    const laviMarkManaCost = isLaviMarkActive ? SPELL_CONFIG.laviMarkOption.manaCost : 0;
    const laviMarkManaCostReduced = (currentStance === 'focus' && SPELL_CONFIG.laviMarkOption.isFocusable);
    const finalLaviMarkManaCost = isLaviMarkActive ? (laviMarkManaCostReduced ? 0 : laviMarkManaCost) : 0;

    // Mise à jour du coût total
    actualManaCost += finalDarkFlameManaCost + finalLaviMarkManaCost;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        ui.notifications.info(`🎯 Sélectionnez la cible pour ${SPELL_CONFIG.name}...`);

        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            console.error("[Moctei] Error with portal targeting:", error);
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info('Sort annulé - Aucune cible sélectionnée.');
        return;
    }

    // ===== CALCUL DE DISTANCE =====
    function calculateDistance(casterToken, targetPos) {
        const gridSize = canvas.grid.size;

        // Convert caster token position to grid coordinates (center of token)
        const casterGridX = Math.floor(casterToken.x / gridSize) + Math.floor(casterToken.document.width / 2);
        const casterGridY = Math.floor(casterToken.y / gridSize) + Math.floor(casterToken.document.height / 2);

        // Convert target position to grid coordinates
        const targetGridX = Math.floor(targetPos.x / gridSize);
        const targetGridY = Math.floor(targetPos.y / gridSize);

        // Calculate grid distance using Chebyshev distance (D&D style)
        const distanceInCells = Math.max(
            Math.abs(targetGridX - casterGridX),
            Math.abs(targetGridY - casterGridY)
        );

        return distanceInCells;
    }

    const distanceInCells = calculateDistance(caster, target);
    const isCloseRange = distanceInCells <= SPELL_CONFIG.maxCloseRange;

    // Get actor at target location (grid-aware detection with visibility filtering)
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

    const targetActorInfo = getActorAtLocation(target.x, target.y);
    const targetName = targetActorInfo ? targetActorInfo.name : `Position (${Math.round(target.x)}, ${Math.round(target.y)})`;

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Animation de cast sur Moctei (ombre)
        if (SPELL_CONFIG.animations.cast.caster) {
            seq.effect()
                .file(SPELL_CONFIG.animations.cast.caster)
                .attachTo(caster)
                .scale(0.6)
                .duration(1500)
                .fadeOut(500);
        }

        // Animation de l'attaque selon la distance
        const attackAnim = isCloseRange ?
            SPELL_CONFIG.animations.cast.close :
            SPELL_CONFIG.animations.cast.ranged;

        if (attackAnim) {
            if (isCloseRange) {
                // Animation de mêlée sur la cible
                seq.effect()
                    .file(attackAnim)
                    .attachTo(caster)
                    .stretchTo(target)
                    .scale(0.8)
                    .duration(2000);
            } else {
                // Animation de projectile du lanceur vers la cible
                seq.effect()
                    .file(attackAnim)
                    .attachTo(caster)
                    .stretchTo(target)
                    .scale(0.7);
            }
        }

        // Animation d'impact
        const impactAnim = isCloseRange ?
            SPELL_CONFIG.animations.impact.close :
            SPELL_CONFIG.animations.impact.ranged;

        if (impactAnim) {
            seq.effect()
                .file(impactAnim)
                .atLocation(target)
                .scale(0.6)
                .delay(isCloseRange ? 500 : 1000);
        }

        await seq.play();
    }

    await playAnimation();

    // ===== DAMAGE CALCULATION WITH STANCE SYSTEM =====
    async function calculateDamage() {
        const damageConfig = isCloseRange ? SPELL_CONFIG.damage.close : SPELL_CONFIG.damage.ranged;
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = characteristicInfo.final + (damageBonus || 0) + effectDamageBonus;

        // Construire la formule de base
        let baseDamageFormula = damageConfig.dice;

        // Ajouter la Marque de Lavi si active
        if (isLaviMarkActive) {
            baseDamageFormula += " + 4d6";
        }

        if (currentStance === 'offensif') {
            // Offensive stance: main damage is maximized
            const baseDiceMax = damageConfig.dice === '2d4' ? 8 : 4; // 2d4 max = 8, 1d4 max = 4
            const laviMarkMax = isLaviMarkActive ? 24 : 0; // 4d6 max = 24
            const maxDamage = baseDiceMax + laviMarkMax + totalDamageBonus;

            console.log(`[DEBUG] Maximized damage: ${maxDamage} (${baseDiceMax}${isLaviMarkActive ? ' + 24' : ''} + ${totalDamageBonus})`);

            return {
                total: maxDamage,
                formula: `${baseDiceMax}${isLaviMarkActive ? ' + 24' : ''} + ${totalDamageBonus}`,
                result: maxDamage,
                isMaximized: true,
                hasLaviMark: isLaviMarkActive
            };
        } else {
            // Normal dice rolling
            const damage = new Roll(`${baseDamageFormula} + @totalBonus`, { totalBonus: totalDamageBonus });
            await damage.evaluate({ async: true });

            console.log(`[DEBUG] Rolled damage: ${damage.total} (formula: ${damage.formula})`);
            return {
                ...damage,
                hasLaviMark: isLaviMarkActive
            };
        }
    }

    const damageResult = await calculateDamage();

    // ===== COMBINED ROLL SYSTEM WITH STANCE SUPPORT =====
    const totalAttackDice = characteristicInfo.final + (attackBonus || 0);
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll (only if not maximized)
    if (currentStance !== 'offensif') {
        const damageConfig = isCloseRange ? SPELL_CONFIG.damage.close : SPELL_CONFIG.damage.ranged;
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = characteristicInfo.final + (damageBonus || 0) + effectDamageBonus;

        // Construire la formule de dégâts avec Marque de Lavi si active
        let damageFormula = damageConfig.dice;
        if (isLaviMarkActive) {
            damageFormula += " + 4d6";
        }
        combinedRollParts.push(`${damageFormula} + ${totalDamageBonus}`);
    }

    // Create and evaluate combined roll
    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        const damageRollResult = combinedRoll.terms[0].results[1];
        const damageConfig = isCloseRange ? SPELL_CONFIG.damage.close : SPELL_CONFIG.damage.ranged;
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = characteristicInfo.final + (damageBonus || 0) + effectDamageBonus;

        // Construire la formule affichée avec Marque de Lavi si active
        let damageFormulaString = damageConfig.dice;
        if (isLaviMarkActive) {
            damageFormulaString += " + 4d6";
        }
        damageFormulaString += ` + ${totalDamageBonus}`;

        finalDamageResult = {
            total: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null),
            formula: damageFormulaString,
            result: damageRollResult?.result ?? damageRollResult?.total ?? (typeof damageResult === 'object' ? damageResult.total : null),
            hasLaviMark: isLaviMarkActive
        };
    }

    const totalDamage = finalDamageResult.total;

    // ===== MARQUE DE LAVI ANIMATION =====
    if (isLaviMarkActive && targetActorInfo?.token) {
        // Animation de la Marque de Lavi
        const laviMarkSeq = new Sequence();
        laviMarkSeq.effect()
            .file(SPELL_CONFIG.laviMarkOption.animation.file)
            .attachTo(targetActorInfo.token)
            .scale(SPELL_CONFIG.laviMarkOption.animation.scale)
            .fadeOut(SPELL_CONFIG.laviMarkOption.animation.fadeOut)
            .tint(SPELL_CONFIG.laviMarkOption.animation.tint); // Déclenché après les animations d'attaque

        await laviMarkSeq.play();
        console.log(`[Moctei] Applied Lavi Mark animation to ${targetName}`);
    }

    // ===== GM DELEGATION FUNCTIONS =====
    async function applyEffectWithGMDelegation(targetToken, effectData) {
        if (!targetToken?.actor) {
            console.error("[Moctei] No valid target token or actor");
            return false;
        }

        try {
            if (targetToken.actor.isOwner) {
                // User owns the token, apply directly
                await targetToken.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                console.log(`[Moctei] Applied effect directly to ${targetToken.name}`);
                return true;
            } else {
                // Use GM delegation for tokens the user doesn't own
                if (globalThis.gmSocket) {
                    await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetToken.id, effectData);
                    console.log(`[Moctei] Applied effect to ${targetToken.name} via GM delegation`);
                    return true;
                } else {
                    console.warn(`[Moctei] GM Socket not available and user doesn't own ${targetToken.name}`);
                    ui.notifications.warn(`Impossible d'appliquer l'effet à ${targetToken.name} - Contactez le MJ`);
                    return false;
                }
            }
        } catch (error) {
            console.error(`[Moctei] Error applying effect to ${targetToken.name}:`, error);
            return false;
        }
    }

    // ===== COMBO DARK FLAME APPLICATION =====
    if (isDarkFlameActive && targetActorInfo?.actor) {
        // Calculs pour le Feu Obscur combo (basé sur Dextérité comme dans feu-obscur.js)
        const darkFlameInitialDamage = Math.ceil(characteristicInfo.final / 2); // Dex/2 arrondi sup
        const darkFlameContinuousDamage = Math.ceil(characteristicInfo.final / 4); // Dex/4 arrondi sup

        // Animation du Feu Obscur combo (avec délai pour qu'elle soit après l'attaque)
        const comboSeq = new Sequence();
        comboSeq.effect()
            .file(SPELL_CONFIG.comboOption.flameAnimation)
            .attachTo(targetActorInfo.token)
            .scale(0.6)
            .name(`dark-flame-combo-${caster.id}-${targetActorInfo.token.id}`)
            .tint("#1a0033")
            .opacity(0.8)
            .delay(2000); // Déclenché après les animations d'attaque

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
                    darkFlameTarget: targetActorInfo.token.id,
                    darkFlameSequenceName: `dark-flame-combo-${caster.id}-${targetActorInfo.token.id}`,
                    darkFlameType: "source", // Considéré comme source pour le comptage
                    spellName: "Feu obscur (Combo)",
                    maintenanceCost: 1, // Même maintenance que Feu Obscur normal
                    damagePerTurn: darkFlameContinuousDamage,
                    isComboFlame: true // Flag pour identifier les flammes combo
                },
                statuscounter: { value: darkFlameContinuousDamage, visible: true }
            }
        };

        // Appliquer l'effet avec délégation GM si nécessaire
        const effectApplied = await applyEffectWithGMDelegation(targetActorInfo.token, darkFlameEffectData);

        if (effectApplied) {
            console.log(`[Moctei] Applied combo dark flame to ${targetName}`);

            // Gérer l'effet de contrôle Feu Obscur sur Moctei
            const existingDarkFlameControl = actor.effects.find(e => e.name === "Feu obscur (Contrôle)");

            if (existingDarkFlameControl) {
                // Mettre à jour l'effet de contrôle existant
                const currentSources = existingDarkFlameControl.flags?.world?.darkFlameInitialSources || [];
                const currentExtensions = existingDarkFlameControl.flags?.world?.darkFlameExtensions || [];
                const updatedSources = [...currentSources, targetActorInfo.token.id];
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
                console.log(`[Moctei] Updated existing dark flame control effect`);
            } else {
                // Créer un nouvel effet de contrôle Feu Obscur
                const darkFlameControlEffectData = {
                    name: "Feu obscur (Contrôle)",
                    icon: "icons/magic/fire/flame-burning-eye.webp",
                    description: `Contrôle des flammes noires actives - 1 source(s) active(s)`,
                    duration: { seconds: 86400 },
                    flags: {
                        world: {
                            darkFlameInitialSources: [targetActorInfo.token.id],
                            darkFlameExtensions: [],
                            darkFlameTargets: [targetActorInfo.token.id],
                            spellName: "Feu obscur (Combo)",
                            maintenanceCost: 1
                        },
                        statuscounter: { value: 1, visible: true }
                    }
                };

                await actor.createEmbeddedDocuments("ActiveEffect", [darkFlameControlEffectData]);
                console.log(`[Moctei] Created new dark flame control effect`);
            }
        } else {
            console.warn(`[Moctei] Could not apply dark flame effect to ${targetName}`);
        }
    }

    // ===== GESTION DE L'EFFET LONGUE DURÉE =====
    let effectMessage = "";

    if (mode === 'free' && existingShadowDaggers) {
        // Attaque gratuite - dissiper l'effet si attaque à distance
        if (!isCloseRange) {
            await existingShadowDaggers.delete();

            // Arrêter l'animation persistante
            if (SPELL_CONFIG.animations.longDurationEffect.sequencerName) {
                try {
                    Sequencer.EffectManager.endEffects({
                        name: SPELL_CONFIG.animations.longDurationEffect.sequencerName
                    });
                } catch (error) {
                    console.warn("[Moctei] Could not end persistent animation:", error);
                }
            }

            effectMessage = "🌑 L'effet 'Dagues d'ombre' se dissipe après l'attaque à distance";
        } else {
            effectMessage = "🌑 L'effet 'Dagues d'ombre' persiste (attaque rapprochée)";
        }

    } else if (modeConfig && modeConfig.createsPersistentEffect) {
        // Mode longue durée - créer l'effet SEULEMENT si attaque rapprochée
        if (isCloseRange) {
            try {
                const effectData = {
                    ...SPELL_CONFIG.persistentEffect,
                    duration: { seconds: 86400 }, // 24h
                    flags: {
                        ...SPELL_CONFIG.persistentEffect.flags,
                        world: {
                            ...SPELL_CONFIG.persistentEffect.flags.world,
                            shadowDaggerCaster: actor.id
                        }
                    }
                };

                await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);

                // Démarrer l'animation persistante
                if (SPELL_CONFIG.animations.longDurationEffect) {
                    const persistentSeq = new Sequence();
                    persistentSeq.effect()
                        .file(SPELL_CONFIG.animations.longDurationEffect.file)
                        .attachTo(caster)
                        .scale(SPELL_CONFIG.animations.longDurationEffect.scale)
                        .fadeOut(SPELL_CONFIG.animations.longDurationEffect.fadeOut)
                        .name(SPELL_CONFIG.animations.longDurationEffect.sequencerName);

                    await persistentSeq.play();
                }

                effectMessage = "🌑 Effet 'Dagues d'ombre' créé - Attaques gratuites disponibles !";

            } catch (error) {
                console.error("[Moctei] Error creating persistent effect:", error);
                effectMessage = "⚠️ Erreur lors de la création de l'effet persistant";
            }
        } else {
            // Attaque à distance avec mode longue durée - pas d'effet créé
            effectMessage = "⚠️ Attaque à distance : L'effet 'Dagues d'ombre' ne peut être créé qu'avec une attaque rapprochée";
        }
    }

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? '0 mana (Gratuit)' : `${actualManaCost} mana`;
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');

        const distanceInfo = isCloseRange ?
            `🗡️ Attaque Rapprochée (${distanceInCells} case${distanceInCells > 1 ? 's' : ''})` :
            `🎯 Attaque à Distance (${distanceInCells} case${distanceInCells > 1 ? 's' : ''})`;

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = (characteristicInfo.effectBonus !== 0 || effectDamageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${characteristicInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${SPELL_CONFIG.characteristicDisplay}: +${characteristicInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 ? `<div>🗡️ Bonus de Dégâts: +${effectDamageBonus}</div>` : ''}
            </div>` : '';

        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                <div style="font-size: 0.9em; color: #666; margin-top: 4px;">${distanceInfo}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const damageConfig = isCloseRange ? SPELL_CONFIG.damage.close : SPELL_CONFIG.damage.ranged;
        const totalDamageBonus = characteristicInfo.final + (damageBonus || 0) + effectDamageBonus;

        // Construction de la formule affichée
        let displayFormula = damageConfig.dice;
        if (isLaviMarkActive) {
            displayFormula += " + 4d6";
        }
        displayFormula += ` + ${SPELL_CONFIG.characteristicDisplay} + bonus`;

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>🌑 ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #4a148c; font-weight: bold;">💥 DÉGÂTS: ${totalDamage}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                    (${displayFormula})
                </div>
                <div style="font-size: 0.8em; color: #666;">
                    ${damageConfig.description}${isLaviMarkActive ? ' + Marque de Lavi' : ''}: ${totalDamage}
                </div>
            </div>
        `;

        // Combo displays (options cumulables)
        let comboDisplay = '';

        if (isDarkFlameActive) {
            comboDisplay += `
                <div style="margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px; border: 2px solid #f57c00;">
                    <div style="font-size: 1.1em; color: #e65100; font-weight: bold; margin-bottom: 6px;">🔥 FEU OBSCUR ACTIVÉ</div>
                    <div style="font-size: 0.9em; color: #bf360c;">
                        <div>💥 <strong>Dégâts initiaux Feu Obscur:</strong> ${Math.ceil(characteristicInfo.final / 2)} (Dex/2, arrondi sup.)</div>
                        <div>🔥 <strong>Dégâts continus Feu Obscur:</strong> ${Math.ceil(characteristicInfo.final / 4)} (Dex/4, arrondi sup.)</div>
                        <div>🔥 <strong>Maintenance:</strong> +1 mana par tour pour le Feu Obscur</div>
                    </div>
                </div>
            `;
        }

        if (isLaviMarkActive) {
            comboDisplay += `
                <div style="margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px; border: 2px solid #8e24aa;">
                    <div style="font-size: 1.1em; color: #6a1b9a; font-weight: bold; margin-bottom: 6px;">🎯 MARQUE DE LAVI ACTIVÉE</div>
                    <div style="font-size: 0.9em; color: #4a148c;">
                        <div>⚡ <strong>Bonus de dégâts:</strong> +4d6 (cible non remarquée)</div>
                        <div>✨ <strong>Condition:</strong> La cible ne doit pas avoir remarqué Moctei</div>
                        <div>🔮 <strong>Coût supplémentaire:</strong> ${finalLaviMarkManaCost > 0 ? `${finalLaviMarkManaCost} mana` : '0 mana (Focus)'}</div>
                    </div>
                </div>
            `;
        }

        if (isDarkFlameActive && isLaviMarkActive) {
            comboDisplay += `
                <div style="margin: 8px 0; padding: 8px; background: linear-gradient(45deg, #fff3e0, #f3e5f5); border-radius: 4px; border: 2px solid #6a1b9a; text-align: center;">
                    <div style="font-size: 1.0em; color: #4a148c; font-weight: bold;">⚡ COMBO COMPLET ACTIVÉ ⚡</div>
                    <div style="font-size: 0.8em; color: #8e24aa; margin-top: 2px;">Feu Obscur + Marque de Lavi</div>
                </div>
            `;
        }

        const effectDisplay = effectMessage ? `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f3e5f5; border-radius: 4px;">
                <div style="font-size: 1.0em; color: #4a148c; font-weight: bold;">${effectMessage}</div>
            </div>
        ` : '';

        return `
            <div style="background: linear-gradient(135deg, #f3e5f5, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #4a148c; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #4a148c;">🌑 ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${damageDisplay}
                ${comboDisplay}
                ${effectDisplay}
            </div>
        `;
    }

    // Send the combined roll to chat
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const rangeInfo = isCloseRange ? "rapprochée" : "à distance";
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

    // Construction des informations de combo (options cumulables)
    let comboInfo = '';
    if (isDarkFlameActive && isLaviMarkActive) {
        comboInfo += ` + Combo Complet (Feu Obscur: ${Math.ceil(characteristicInfo.final / 2)} initiaux, ${Math.ceil(characteristicInfo.final / 4)}/tour + Marque de Lavi: +4d6)`;
    } else if (isDarkFlameActive) {
        comboInfo += ` + Feu Obscur (${Math.ceil(characteristicInfo.final / 2)} initiaux, ${Math.ceil(characteristicInfo.final / 4)}/tour)`;
    } else if (isLaviMarkActive) {
        comboInfo += ` + Marque de Lavi (+4d6)`;
    }

    ui.notifications.info(`🌑 ${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName} (${rangeInfo}). Attaque: ${attackResult.result}, Dégâts: ${totalDamage}${maximizedInfo}.${comboInfo}`);

})();
