/**
 * Rayon Explosif - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Sort de chargement et tir d'énergie explosive avec deux phases :
 * - Phase 1 (Chargement) : Raynart se prépare à tirer (coût : 6 mana demi-focusable)
 * - Phase 2 (Tir) : Raynart libère l'énergie accumulée
 *
 * MODES DE TIR :
 * - Normal : Xd4 + Esprit sur 2.5 cases de rayon (X = nombre de tours de chargement)
 * - Fléau : 3d6 + Esprit sur une seule cible (tir concentré)
 * - Radiance Stellaire (Mode Stellaire actif) : 3 rayons simultanés (2d6 + Esprit chacun)
 *   * Perce-armure : Esprit/2 (arrondi supérieur)
 *   * Dégâts réduits sur cible répétée : 1d6 + Esprit/2
 *
 * MÉCANIQUES :
 * - Coût : 6 mana (demi-focusable, focusable sous Armure de l'Infini)
 * - Chargement : Effet "ChargementTir" avec animation persistante
 * - Mode Stellaire : 3 débris orbitaux + 3 tirs simultanés
 * - Jets d'attaque : Esprit (Sort niveau 2)
 * - Bonus de dégâts des effets actifs inclus
 *
 * Prerequisites:
 * - Portal module (ciblage)
 * - Sequencer (animations)
 * - JB2A (effets visuels)
 *
 * Usage : Sélectionner le token de Raynart et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Rayon Explosif",
        raynartActorId: "4bandVHr1d92RYuL",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        baseMana: 6,
        costType: "demi-focus", // Demi-focusable
        spellLevel: 2,

        chargementEffect: {
            name: "ChargementTir",
            icon: "icons/magic/movement/portal-vortex-orange.webp",
            description: "Raynart charge son Rayon Explosif"
        },

        stellaire: {
            effectName: "Mode Stellaire",
            debrisCount: 3,
            debrisDistance: 0.8, // En cases
            pierceArmor: "esprit / 2", // Arrondi supérieur
            damageFormula: "2d6",
            reducedDamageFormula: "1d6"
        },

        normal: {
            damageFormula: "1d4", // Par tour de chargement
            damageBonus: "esprit",
            areaRadius: 2.5 // En cases
        },

        fleau: {
            damageFormula: "3d6",
            damageBonus: "esprit"
        },

        animation: {
            charging: "jb2a.zoning.inward.circle.once.bluegreen.01.01",
            debris: "jb2a_patreon.fireball.loop_debris.orange",
            cast: "jb2a.cast_generic.fire.01.orange.0",
            projectile: "jb2a_patreon.fireball.beam.orange",
            impact: "jb2a_patreon.explosion.02.orange",
            groundCrack: "jb2a_patreon.impact.ground_crack.orange.02"
        },

        targeting: {
            color: "#ff6600",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
        }
    };

    // ===== DETECT RAYNART =====
    let raynartToken = null;
    let raynartActor = null;

    for (const token of canvas.tokens.placeables) {
        if (token.actor?.id === SPELL_CONFIG.raynartActorId) {
            raynartToken = token;
            raynartActor = token.actor;
            break;
        }
    }

    if (!raynartToken || !raynartActor) {
        ui.notifications.error("❌ Impossible de trouver Raynart sur la scène !");
        return;
    }

    console.log(`[RayonExplosif] Raynart detected: ${raynartActor.name}`);

    // ===== UTILITY FUNCTIONS =====

    /**
     * Détecte la stance actuelle de l'acteur
     */
    function detectCombatStance(actor) {
        const currentStance = actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;

        console.log(`[RayonExplosif] Current stance detected: ${currentStance || 'No stance'}`);
        return currentStance;
    }

    /**
     * Gets active effect bonuses for a specific flag key
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.world?.[flagKey];
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[RayonExplosif] Found ${flagKey} bonus from ${effect.name}: ${flagValue}`);
            }
        }
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée !`);
            return null;
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Calcule le coût en mana avec stance Focus et Armure Infini
     * Adapté de HandleRaynartEffect.js et IronMegumin.js
     */
    function calculateManaCost(baseCost, costType, actor, currentStance) {
        const armureInfiniEffect = actor?.effects?.contents?.find(e =>
            e.name === "Armure de l'Infini"
        );
        const armureCounter = armureInfiniEffect?.flags?.statuscounter?.value || 0;

        let isFocusable = false;
        let realCost = baseCost;
        let displayMessage = `${baseCost} mana`;
        let savedByArmure = 0;

        // Déterminer la focusabilité
        if (costType === "focusable") {
            isFocusable = true;
        } else if (costType === "demi-focus") {
            const halfCost = Math.floor(baseCost / 2);
            if (armureCounter >= halfCost) {
                isFocusable = true;
                savedByArmure = halfCost;
                displayMessage = `${baseCost} mana (focusable grâce à Armure de l'Infini)`;
            } else {
                realCost = halfCost;
                displayMessage = `${halfCost} mana (demi-focusable)`;
            }
        }

        // Appliquer la stance Focus si focusable
        if (isFocusable && currentStance === 'focus') {
            realCost = 0;
            displayMessage = 'GRATUIT (Position Focus)';
        }

        return {
            realCost,
            isFocusable,
            displayMessage,
            savedByArmure
        };
    }

    /**
     * Met à jour le compteur Armure Infini
     */
    async function updateArmureInfiniCounter(actor, manaToAdd) {
        const armureEffect = actor?.effects?.contents?.find(e =>
            e.name === "Armure de l'Infini"
        );
        if (!armureEffect) return;

        const currentCounter = armureEffect.flags?.statuscounter?.value || 0;
        const newCounter = currentCounter + manaToAdd;

        await armureEffect.update({
            'flags.statuscounter.value': newCounter
        });

        console.log(`[RayonExplosif] Armure Infini updated: ${currentCounter} -> ${newCounter}`);
    }

    /**
     * Vérifie si l'effet ChargementTir est actif
     */
    function checkChargementEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === SPELL_CONFIG.chargementEffect.name
        ) || null;
    }

    /**
     * Vérifie si le Mode Stellaire est actif
     */
    function checkModeStellaireEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === SPELL_CONFIG.stellaire.effectName
        ) || null;
    }

    /**
     * Calcule les positions des débris orbitaux autour de Raynart
     * Basé sur le code de 224.js
     */
    function calculateDebrisPositions(tokenPosition) {
        const gridSize = canvas.grid.size;
        const debrisDistance = SPELL_CONFIG.stellaire.debrisDistance * gridSize;

        // 3 positions : bas-gauche, bas-droite, au-dessus
        const positions = [
            { // Bas-gauche
                x: tokenPosition.x - debrisDistance * 0.707, // -45° en diagonale
                y: tokenPosition.y + debrisDistance * 0.707
            },
            { // Bas-droite
                x: tokenPosition.x + debrisDistance * 0.707, // +45° en diagonale
                y: tokenPosition.y + debrisDistance * 0.707
            },
            { // Au-dessus
                x: tokenPosition.x,
                y: tokenPosition.y - debrisDistance
            }
        ];

        return positions;
    }

    /**
     * Trouve toutes les cibles dans un rayon donné (en cases) autour d'une position
     */
    function findTargetsInRadius(centerX, centerY, radiusCases) {
        const gridSize = canvas.grid.size;
        const radiusPixels = radiusCases * gridSize;
        const targets = [];

        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === raynartToken.id) continue; // Exclure Raynart

            const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
            const tokenCenterY = token.y + (token.document.height * gridSize) / 2;

            const distance = Math.sqrt(
                Math.pow(tokenCenterX - centerX, 2) + Math.pow(tokenCenterY - centerY, 2)
            );

            if (distance <= radiusPixels) {
                targets.push({
                    token: token,
                    actor: token.actor,
                    name: token.name,
                    distance: distance
                });
            }
        }

        return targets;
    }

    /**
     * Trouve le token à une position donnée
     */
    function getTokenAtLocation(x, y) {
        const gridSize = canvas.grid.size;
        const tolerance = gridSize / 2;

        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
            const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2)
            );
            return tokenDistance <= tolerance;
        });

        if (tokensAtLocation.length === 0) return null;
        return tokensAtLocation[0];
    }

    // ===== DETECT CURRENT STATE =====
    const currentStance = detectCombatStance(raynartActor);
    const characteristicInfo = getCharacteristicValue(raynartActor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    const chargementEffect = checkChargementEffect(raynartActor);
    const modeStellaireEffect = checkModeStellaireEffect(raynartActor);
    const isCharging = !!chargementEffect;
    const isStellaireActive = !!modeStellaireEffect;

    console.log(`[RayonExplosif] State - Charging: ${isCharging}, Stellaire: ${isStellaireActive}`);

    // ===== VÉRIFICATION MODULE PORTAL =====
    if (typeof Portal === "undefined") {
        ui.notifications.error("❌ Le module Portal n'est pas disponible ! Veuillez l'activer.");
        return;
    }

    // ===== PHASE 1: CHARGEMENT =====
    if (!isCharging) {
        console.log(`[RayonExplosif] Starting charging phase...`);

        // Calculer le coût en mana
        const costCalc = calculateManaCost(
            SPELL_CONFIG.baseMana,
            SPELL_CONFIG.costType,
            raynartActor,
            currentStance
        );

        console.log(`[RayonExplosif] Mana cost: ${costCalc.realCost} (${costCalc.displayMessage})`);

        // Mettre à jour Armure Infini si nécessaire
        if (costCalc.savedByArmure > 0) {
            await updateArmureInfiniCounter(raynartActor, costCalc.savedByArmure);
        }

        // Animation de chargement persistante
        const chargingSequence = new Sequence()
            .effect()
                .file(SPELL_CONFIG.animation.charging)
                .attachTo(raynartToken)
                .scaleToObject(1.5)
                .tint("#ff0000")
                .opacity(0.4)
                .persist()
                .fadeOut(500)
                .name(`rayon-explosif-charging-${raynartToken.id}`);

        // Si Mode Stellaire actif, ajouter les 3 débris orbitaux
        if (isStellaireActive) {
            const tokenCenter = {
                x: raynartToken.x + (raynartToken.document.width * canvas.grid.size) / 2,
                y: raynartToken.y + (raynartToken.document.height * canvas.grid.size) / 2
            };
            const debrisPositions = calculateDebrisPositions(tokenCenter);

            for (let i = 0; i < debrisPositions.length; i++) {
                // Calculer l'offset relatif au token
                const offsetX = debrisPositions[i].x - tokenCenter.x;
                const offsetY = debrisPositions[i].y - tokenCenter.y;

                chargingSequence
                    .effect()
                        .file(SPELL_CONFIG.animation.debris)
                        .attachTo(raynartToken, { offset: { x: offsetX, y: offsetY } })
                        .scale(0.1)
                        .persist()
                        .fadeOut(500)
                        .name(`rayon-explosif-debris-${i}-${raynartToken.id}`);
            }
        }

        await chargingSequence.play();

        // Appliquer l'effet ChargementTir
        const effectData = {
            name: SPELL_CONFIG.chargementEffect.name,
            icon: SPELL_CONFIG.chargementEffect.icon,
            description: SPELL_CONFIG.chargementEffect.description,
            duration: { seconds: 86400 }, // 24h (jusqu'à tir ou annulation manuelle)
            flags: {
                world: {
                    rayonExplosifCharging: true
                }
            }
        };

        await raynartActor.createEmbeddedDocuments("ActiveEffect", [effectData]);

        // Message dans le chat
        const chatContent = `
            <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, #fff3e0, #ffccbc); padding: 15px; border-radius: 10px; border: 3px solid #ff6600;">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: #ff6600; font-size: 1.5em;">
                        🔥 ${SPELL_CONFIG.name} - CHARGEMENT
                    </h3>
                    <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                        <strong>Mage:</strong> ${raynartActor.name}
                    </div>
                </div>

                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #ff6600;">
                    <p style="margin: 4px 0; font-size: 1.1em; color: #ff6600; font-weight: bold;">
                        ⚡ Raynart se prépare à tirer !
                    </p>
                    <p style="margin: 4px 0;"><strong>Coût:</strong> ${costCalc.displayMessage}</p>
                    ${isStellaireActive ? '<p style="margin: 4px 0; color: #9c27b0; font-weight: bold;">✨ Mode Stellaire actif - 3 débris orbitaux générés</p>' : ''}
                </div>

                <div style="background: #e3f2fd; padding: 10px; border-radius: 6px; font-size: 0.85em; color: #666; text-align: center;">
                    ℹ️ Lancez à nouveau pour déclencher le tir chargé
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: raynartToken }),
            content: chatContent,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`🔥 Raynart charge son Rayon Explosif ! (${costCalc.displayMessage})`);
        return;
    }

    // ===== PHASE 2: TIR =====
    console.log(`[RayonExplosif] Starting firing phase...`);

    // Pas de coût en mana pour cette phase (déjà payé)

    // ===== MODE STELLAIRE (RADIANCE STELLAIRE) =====
    if (isStellaireActive) {
        console.log(`[RayonExplosif] Executing Radiance Stellaire (3 beams)...`);

        // Calculer les positions des débris pour le tir
        const tokenCenter = {
            x: raynartToken.x + (raynartToken.document.width * canvas.grid.size) / 2,
            y: raynartToken.y + (raynartToken.document.height * canvas.grid.size) / 2
        };
        const debrisPositions = calculateDebrisPositions(tokenCenter);

        // Ciblage des 3 rayons
        const targets = [];

        for (let i = 0; i < 3; i++) {
            ui.notifications.info(`🎯 Cible du tir ${i + 1}...`);

            const portalInstance = new Portal()
                .origin(raynartToken)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const portalResult = await portalInstance.pick();

            if (!portalResult || portalResult.cancelled) {
                ui.notifications.warn(`❌ Ciblage du tir ${i + 1} annulé.`);

                // Nettoyer les animations persistantes
                Sequencer.EffectManager.endEffects({ name: `rayon-explosif-charging-${raynartToken.id}` });
                for (let j = 0; j < 3; j++) {
                    Sequencer.EffectManager.endEffects({ name: `rayon-explosif-debris-${j}-${raynartToken.id}` });
                }

                // Retirer l'effet ChargementTir
                if (chargementEffect) {
                    await chargementEffect.delete();
                }

                return;
            }

            const targetToken = getTokenAtLocation(portalResult.x, portalResult.y);
            targets.push({
                index: i,
                token: targetToken,
                name: targetToken?.name || "Position vide",
                position: { x: portalResult.x, y: portalResult.y }
            });
        }

        // Compter les cibles répétées
        const targetCounts = new Map();
        for (const target of targets) {
            if (!target.token) continue;
            const count = targetCounts.get(target.token.id) || 0;
            targetCounts.set(target.token.id, count + 1);
        }

        // Préparer les rolls d'attaque et de dégâts
        const damageBonus = getActiveEffectBonus(raynartActor, 'damage');
        const levelBonus = SPELL_CONFIG.spellLevel * 2;
        const pierceArmor = Math.ceil(characteristicInfo.final / 2);

        const allRolls = [];
        const targetHitCount = new Map(); // Compte combien de fois chaque cible a déjà été touchée

        for (const target of targets) {
            const attackFormula = `${characteristicInfo.final}d7 + ${levelBonus}`;

            let damageFormula;
            if (target.token) {
                const hitCount = targetHitCount.get(target.token.id) || 0;
                targetHitCount.set(target.token.id, hitCount + 1);

                if (hitCount === 0) {
                    // Premier tir sur cette cible : dégâts pleins
                    const espritBonus = characteristicInfo.final + damageBonus;
                    damageFormula = `${SPELL_CONFIG.stellaire.damageFormula} + ${espritBonus}`;
                } else {
                    // Tir répété : dégâts réduits
                    const reducedEspritBonus = Math.floor(characteristicInfo.final / 2) + damageBonus;
                    damageFormula = `${SPELL_CONFIG.stellaire.reducedDamageFormula} + ${reducedEspritBonus}`;
                }
            } else {
                // Pas de cible valide, mais on fait quand même les rolls pour l'affichage
                const espritBonus = characteristicInfo.final + damageBonus;
                damageFormula = `${SPELL_CONFIG.stellaire.damageFormula} + ${espritBonus}`;
            }

            allRolls.push({
                target: target,
                attackFormula: attackFormula,
                damageFormula: damageFormula,
                isRepeated: target.token && (targetHitCount.get(target.token.id) || 0) > 1
            });
        }


        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const debrisPos = debrisPositions[i];
            const delay = i * 200; // 200ms de décalage entre chaque tir
            const fireSequence = new Sequence();

            fireSequence
                .effect()
                    .file(SPELL_CONFIG.animation.cast)
                    .atLocation({ x: debrisPos.x, y: debrisPos.y })
                    .scale(0.5)
                    .delay(delay)
                    .waitUntilFinished(-2000)
                .effect()
                    .file(SPELL_CONFIG.animation.projectile)
                    .atLocation({ x: debrisPos.x, y: debrisPos.y })
                    .stretchTo(target.position)
                    .waitUntilFinished(-1000)
                .effect()
                    .file(SPELL_CONFIG.animation.impact)
                    .atLocation(target.position)
                    .scale(0.8);

            if( i === 2) await fireSequence.play();
            else fireSequence.play();
        }



        // Nettoyer les animations persistantes
        Sequencer.EffectManager.endEffects({ name: `rayon-explosif-charging-${raynartToken.id}` });
        for (let j = 0; j < 3; j++) {
            Sequencer.EffectManager.endEffects({ name: `rayon-explosif-debris-${j}-${raynartToken.id}` });
        }

        // Combined roll pour le chat
        const rollFormulas = [];
        for (const roll of allRolls) {
            rollFormulas.push(roll.attackFormula);
            if (currentStance !== 'offensif') {
                rollFormulas.push(roll.damageFormula);
            }
        }

        const combinedRoll = new Roll(`{${rollFormulas.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        // Extraire les résultats
        let resultIndex = 0;
        for (const roll of allRolls) {
            roll.attackResult = combinedRoll.terms[0].results[resultIndex++].result;

            if (currentStance === 'offensif') {
                // Maximiser les dégâts
                const damageRoll = new Roll(roll.damageFormula);
                await damageRoll.evaluate({ async: true });

                let maxDamage = 0;
                for (const term of damageRoll.terms) {
                    if (term instanceof Die) {
                        maxDamage += term.number * term.faces;
                    } else if (typeof term === 'number') {
                        maxDamage += term;
                    }
                }
                roll.damageResult = maxDamage;
            } else {
                roll.damageResult = combinedRoll.terms[0].results[resultIndex++].result;
            }
        }

        // Message de chat
        const targetSummaries = allRolls.map((roll, index) => {
            const repeatedInfo = roll.isRepeated ? ' <span style="color: #ff9800;">(Dégâts Réduits)</span>' : '';
            return `
                <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #ff6600;">
                    <strong>Rayon ${index + 1}:</strong> ${roll.target.name}${repeatedInfo}<br>
                    <small>Attaque: ${roll.attackResult} | Dégâts: ${roll.damageResult}</small>
                </div>
            `;
        }).join('');

        const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
        const chatContent = `
            <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, #e1bee7, #ffccbc); padding: 15px; border-radius: 10px; border: 3px solid #9c27b0;">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: #9c27b0; font-size: 1.5em;">
                        ✨ Radiance Stellaire
                    </h3>
                    <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                        <strong>Mage:</strong> ${raynartActor.name}${stanceInfo}
                    </div>
                </div>

                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                    <p style="margin: 4px 0;"><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} ${characteristicInfo.final}</p>
                    <p style="margin: 4px 0;"><strong>Perce-Armure:</strong> ${pierceArmor}</p>
                    ${damageBonus > 0 ? `<p style="margin: 4px 0;"><strong>Bonus Dégâts:</strong> +${damageBonus}</p>` : ''}
                </div>

                <div style="background: #f3e5f5; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                    <h4 style="margin: 0 0 8px 0; color: #9c27b0;">Résultats des Tirs :</h4>
                    ${targetSummaries}
                </div>
            </div>
        `;

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: raynartToken }),
            flavor: chatContent,
            rollMode: game.settings.get('core', 'rollMode')
        });

        // Retirer l'effet ChargementTir
        if (chargementEffect) {
            await chargementEffect.delete();
        }

        ui.notifications.info(`✨ Radiance Stellaire déclenchée ! (3 rayons, Perce-Armure ${pierceArmor})`);
        return;
    }

    // ===== MODE NORMAL OU FLÉAU =====
    console.log(`[RayonExplosif] Selecting firing mode (Normal/Fléau)...`);

    // Dialog de sélection du mode
    const modeSelection = await new Promise((resolve) => {
        const dialogContent = `
            <style>
                .rayon-explosif-dialog { font-family: 'Signika', sans-serif; }
                .mode-option {
                    margin: 10px 0;
                    padding: 15px;
                    border: 2px solid #ff6600;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .mode-option:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    transform: scale(1.02);
                }
                .mode-normal {
                    background: #fff3e0;
                    border-color: #ff9800;
                }
                .mode-fleau {
                    background: #ffebee;
                    border-color: #f44336;
                }
            </style>
            <div class="rayon-explosif-dialog">
                <h3 style="color: #ff6600; margin-bottom: 15px;">🔥 Rayon Explosif - Mode de Tir</h3>
                <p style="margin-bottom: 15px;"><strong>Mage:</strong> ${raynartActor.name}</p>

                <div class="mode-option mode-normal" data-mode="normal">
                    <h4 style="margin: 0; color: #ff9800;">⚡ Mode Normal</h4>
                    <p style="margin: 4px 0; font-size: 0.9em; color: #666;">Xd4 + Esprit sur 2.5 cases de rayon</p>
                    <div style="margin-top: 8px;">
                        <label style="display: block; margin-bottom: 4px;"><strong>Nombre de tours de chargement (X):</strong></label>
                        <input type="number" id="turnCount" value="5" min="1" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>
                </div>

                <div class="mode-option mode-fleau" data-mode="fleau">
                    <h4 style="margin: 0; color: #f44336;">💥 Mode Fléau</h4>
                    <p style="margin: 4px 0; font-size: 0.9em; color: #666;">3d6 + Esprit sur une seule cible</p>
                </div>

                <div style="margin-top: 15px; padding: 10px; background: #e3f2fd; border-radius: 6px;">
                    <label style="display: block; margin-bottom: 4px;"><strong>Bonus manuels (attaque / dégâts):</strong></label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="font-size: 0.85em;">Attaque:</label>
                            <input type="number" id="manualAttackBonus" value="0" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="font-size: 0.85em;">Dégâts:</label>
                            <input type="number" id="manualDamageBonus" value="0" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                    </div>
                </div>
            </div>
        `;

        let selectedMode = null;

        const dialog = new Dialog({
            title: "🔥 Rayon Explosif - Mode de Tir",
            content: dialogContent,
            buttons: {
                confirm: {
                    label: "✅ Confirmer",
                    callback: (html) => {
                        if (!selectedMode) {
                            ui.notifications.warn("⚠️ Veuillez sélectionner un mode de tir !");
                            return;
                        }

                        const turnCount = parseInt(html.find('#turnCount').val()) || 5;
                        const manualAttackBonus = parseInt(html.find('#manualAttackBonus').val()) || 0;
                        const manualDamageBonus = parseInt(html.find('#manualDamageBonus').val()) || 0;

                        resolve({
                            mode: selectedMode,
                            turnCount: turnCount,
                            manualAttackBonus: manualAttackBonus,
                            manualDamageBonus: manualDamageBonus
                        });
                    }
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "confirm",
            close: () => resolve(null),
            render: (html) => {
                html.find('.mode-option').click(function() {
                    html.find('.mode-option').css('border-width', '2px');
                    $(this).css('border-width', '4px');
                    selectedMode = $(this).data('mode');
                });
            }
        }, {
            width: 500
        });

        dialog.render(true);
    });

    if (!modeSelection) {
        ui.notifications.info("❌ Tir annulé.");

        // Nettoyer l'animation persistante
        Sequencer.EffectManager.endEffects({ name: `rayon-explosif-charging-${raynartToken.id}` });

        // Retirer l'effet ChargementTir
        if (chargementEffect) {
            await chargementEffect.delete();
        }

        return;
    }

    const { mode, turnCount, manualAttackBonus, manualDamageBonus } = modeSelection;
    console.log(`[RayonExplosif] Mode selected: ${mode}, turnCount: ${turnCount}, bonuses: +${manualAttackBonus} atk / +${manualDamageBonus} dmg`);

    // Ciblage unique
    ui.notifications.info(`🎯 Sélectionnez la cible...`);

    const portalInstance = new Portal()
        .origin(raynartToken)
        .color(SPELL_CONFIG.targeting.color)
        .texture(SPELL_CONFIG.targeting.texture);

    const portalResult = await portalInstance.pick();

    if (!portalResult || portalResult.cancelled) {
        ui.notifications.warn("❌ Ciblage annulé.");

        // Nettoyer l'animation persistante
        Sequencer.EffectManager.endEffects({ name: `rayon-explosif-charging-${raynartToken.id}` });

        // Retirer l'effet ChargementTir
        if (chargementEffect) {
            await chargementEffect.delete();
        }

        return;
    }

    const primaryTarget = getTokenAtLocation(portalResult.x, portalResult.y);
    const primaryTargetName = primaryTarget?.name || "Position vide";

    // Calcul des bonus
    const levelBonus = SPELL_CONFIG.spellLevel * 2;
    const effectDamageBonus = getActiveEffectBonus(raynartActor, 'damage');
    const totalDamageBonus = characteristicInfo.final + effectDamageBonus + manualDamageBonus;
    const totalAttackBonus = levelBonus + manualAttackBonus;

    let targets = [];
    let damageFormula = "";
    let attackFormula = `${characteristicInfo.final}d7 + ${totalAttackBonus}`;

    if (mode === 'normal') {
        // Mode Normal : Xd4 + Esprit sur rayon
        damageFormula = `${turnCount}d4 + ${totalDamageBonus}`;

        // Trouver les cibles dans le rayon
        const gridSize = canvas.grid.size;
        const targetCenterX = portalResult.x;
        const targetCenterY = portalResult.y;

        targets = findTargetsInRadius(targetCenterX, targetCenterY, SPELL_CONFIG.normal.areaRadius);

        console.log(`[RayonExplosif] Normal mode - ${targets.length} targets in ${SPELL_CONFIG.normal.areaRadius} cases radius`);

        // Animation
        const normalSequence = new Sequence()
            .effect()
                .file(SPELL_CONFIG.animation.cast)
                .atLocation(raynartToken)
                .scale(0.8)
                .waitUntilFinished(-2000)
            .effect()
                .file(SPELL_CONFIG.animation.projectile)
                .atLocation(raynartToken)
                .stretchTo(portalResult)
                .waitUntilFinished(-1000)
            .effect()
                .file(SPELL_CONFIG.animation.impact)
                .atLocation(portalResult)
                .scale(1.2)
            .effect()
                .file(SPELL_CONFIG.animation.groundCrack)
                .atLocation(portalResult)
                .scale(1.5);

        await normalSequence.play();

    } else if (mode === 'fleau') {
        // Mode Fléau : 3d6 + Esprit sur cible unique
        damageFormula = `${SPELL_CONFIG.fleau.damageFormula} + ${totalDamageBonus}`;

        if (primaryTarget) {
            targets = [{
                token: primaryTarget,
                actor: primaryTarget.actor,
                name: primaryTarget.name,
                distance: 0
            }];
        }

        console.log(`[RayonExplosif] Fléau mode - single target: ${primaryTargetName}`);

        // Animation avec tinte rouge
        const fleauSequence = new Sequence()
            .effect()
                .file(SPELL_CONFIG.animation.cast)
                .atLocation(raynartToken)
                .scale(0.8)
                .tint("#ff0000")
                .waitUntilFinished(-2000)
            .effect()
                .file(SPELL_CONFIG.animation.projectile)
                .atLocation(raynartToken)
                .stretchTo(portalResult)
                .tint("#ff0000")
                .waitUntilFinished(-1000)
            .effect()
                .file(SPELL_CONFIG.animation.impact)
                .atLocation(portalResult)
                .scale(1.2)
                .tint("#ff0000");

        await fleauSequence.play();
    }

    // Nettoyer l'animation persistante
    Sequencer.EffectManager.endEffects({ name: `rayon-explosif-charging-${raynartToken.id}` });

    // Combined roll
    const rollFormulas = [attackFormula];
    if (currentStance !== 'offensif') {
        rollFormulas.push(damageFormula);
    }

    const combinedRoll = new Roll(`{${rollFormulas.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extraire les résultats
    const attackResult = combinedRoll.terms[0].results[0].result;
    let damageResult;

    if (currentStance === 'offensif') {
        // Maximiser les dégâts
        const damageRoll = new Roll(damageFormula);
        await damageRoll.evaluate({ async: true });

        let maxDamage = 0;
        for (const term of damageRoll.terms) {
            if (term instanceof Die) {
                maxDamage += term.number * term.faces;
            } else if (typeof term === 'number') {
                maxDamage += term;
            }
        }
        damageResult = maxDamage;
    } else {
        damageResult = combinedRoll.terms[0].results[1].result;
    }

    // Message de chat
    const targetsList = targets.length > 0
        ? targets.map(t => t.name).join(', ')
        : primaryTargetName;

    const modeInfo = mode === 'normal'
        ? `Mode Normal (${turnCount} tours, ${SPELL_CONFIG.normal.areaRadius} cases)`
        : `Mode Fléau (cible unique)`;

    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const bonusInfo = (manualAttackBonus !== 0 || manualDamageBonus !== 0)
        ? `<p style="margin: 4px 0;"><strong>Bonus Manuels:</strong> Attaque +${manualAttackBonus}, Dégâts +${manualDamageBonus}</p>`
        : '';

    const chatContent = `
        <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, ${mode === 'normal' ? '#fff3e0' : '#ffebee'}, #ffccbc); padding: 15px; border-radius: 10px; border: 3px solid ${mode === 'normal' ? '#ff9800' : '#f44336'};">
            <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="margin: 0; color: ${mode === 'normal' ? '#ff9800' : '#f44336'}; font-size: 1.5em;">
                    ${mode === 'normal' ? '⚡' : '💥'} ${SPELL_CONFIG.name}
                </h3>
                <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                    <strong>Mage:</strong> ${raynartActor.name}${stanceInfo}
                </div>
            </div>

            <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                <p style="margin: 4px 0;"><strong>Mode:</strong> ${modeInfo}</p>
                <p style="margin: 4px 0;"><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} ${characteristicInfo.final}</p>
                <p style="margin: 4px 0;"><strong>Cible${targets.length > 1 ? 's' : ''}:</strong> ${targetsList}</p>
                ${effectDamageBonus > 0 ? `<p style="margin: 4px 0;"><strong>Bonus Dégâts (Effets):</strong> +${effectDamageBonus}</p>` : ''}
                ${bonusInfo}
            </div>

            <div style="background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                <p style="margin: 4px 0;"><strong>Attaque:</strong> ${attackResult}</p>
                <p style="margin: 4px 0;"><strong>Dégâts:</strong> ${damageResult}</p>
            </div>
        </div>
    `;

    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: raynartToken }),
        flavor: chatContent,
        rollMode: game.settings.get('core', 'rollMode')
    });

    // Retirer l'effet ChargementTir
    if (chargementEffect) {
        await chargementEffect.delete();
    }

    const targetCount = targets.length || 1;
    ui.notifications.info(`🔥 Rayon Explosif ${mode === 'normal' ? 'Normal' : 'Fléau'} déclenché ! (${targetCount} cible${targetCount > 1 ? 's' : ''})`);

    console.log(`[RayonExplosif] Spell complete - mode: ${mode}, targets: ${targetCount}`);

})();
