/**
 * Mecanique Atomique - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Raynart crée des explosions mécaniques pures à distance, sans nécessiter d'invocations.
 * Il peut placer jusqu'à Esprit/2 zones d'explosion n'importe où sur le terrain.
 *
 * MÉCANIQUES :
 * - Coût : 4 mana (focusable)
 * - Cooldown : 1 tour
 * - Jet d'attaque : 1 jet unique pour TOUTES les explosions (Esprit, Sort niveau 3)
 * - Dégâts : 1d6 + Esprit/2 par explosion
 * - Les cibles subissent la moitié des dégâts même sur esquive réussie
 * - Pas de bonus de dégâts des effets actifs (seuls bonus de stats)
 * - Zone d'effet : 2.5 cases de rayon autour de chaque point d'explosion
 * - Limite : Maximum 3 explosions par cible (3 meilleurs résultats)
 * - Nombre d'explosions : Jusqu'à Esprit/2 (arrondi inférieur)
 *
 * WORKFLOW :
 * 1. Détection de Raynart (ActorID: 4bandVHr1d92RYuL)
 * 2. Calcul du nombre maximum d'explosions (Esprit/2)
 * 3. Dialogue pour choisir le nombre d'explosions
 * 4. Ciblage Portal pour chaque point d'explosion
 * 5. Calcul des cibles dans le rayon de chaque explosion
 * 6. Jet d'attaque unique pour toutes les explosions
 * 7. Jets de dégâts individuels par explosion
 * 8. Animations simultanées avec délai aléatoire 0-200ms
 * 9. Affichage des résultats avec rappel du cooldown
 *
 * Prerequisites:
 * - Portal module (ciblage)
 * - Sequencer (animations)
 * - JB2A (effets visuels)
 *
 * Usage : Lancer la macro (Raynart sera détecté automatiquement)
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Mecanique Atomique",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        baseMana: 4,
        costType: "focusable",
        spellLevel: 3,
        damageFormula: "1d6",
        damageBonus: "esprit / 2", // Arrondi inférieur automatique
        effectRadius: 2.5, // En cases
        maxExplosionsPerTarget: 3,
        cooldown: "1 tour",
        raynartActorId: "4bandVHr1d92RYuL",

        animation: {
            cast: "modules/jb2a_patreon/Library/1st_Level/Cure_Wounds/CureWounds_01_Red_200x200.webm",
            pulse: "modules/jb2a_patreon/Library/TMFX/InPulse/Circle/InPulse_02_Circle_Fast_500.webm",
            shatter: "modules/jb2a_patreon/Library/2nd_Level/Shatter/Shatter_01_Red_400x400.webm",
            explosion1: "modules/jb2a_patreon/Library/Generic/Explosion/Explosion_02_Orange_400x400.webm",
            explosion2: "jb2a.fireball.explosion.orange",
            sound: "modules/Animation Custom/Boomv2.ogg"
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

    console.log(`[MecaniqueAtomique] Raynart detected: ${raynartActor.name} at (${raynartToken.x}, ${raynartToken.y})`);

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
            if (!effect.flags?.world) continue;

            const flagValue = effect.flags.world[flagKey];
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
            }
        }

        console.log(`[MecaniqueAtomique] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`Caractéristique ${characteristic} introuvable !`);
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

        console.log(`[MecaniqueAtomique] ${characteristic}: base=${baseValue}, injuries=${injuryStacks}, effectBonus=${effectBonus}, final=${finalValue}`);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Calcule le coût en mana avec stance Focus
     */
    function calculateManaCost(baseCost, costType, currentStance) {
        let realCost = baseCost;
        let savedMana = 0;
        let displayMessage = "";

        if (currentStance === "focus" && costType === "focusable") {
            savedMana = baseCost;
            realCost = 0;
            displayMessage = `GRATUIT (Focusable, Position Focus)`;
        } else if (costType === "focusable") {
            displayMessage = `${realCost} mana (Focusable, hors Focus)`;
        } else {
            displayMessage = `${realCost} mana`;
        }

        return {
            realCost,
            savedMana,
            displayMessage
        };
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

            // Calculer le centre réel du token cible en utilisant sa taille en cases
            const tokenWidthInPixels = token.document.width * gridSize;
            const tokenHeightInPixels = token.document.height * gridSize;
            const tokenCenterX = token.x + (tokenWidthInPixels / 2);
            const tokenCenterY = token.y + (tokenHeightInPixels / 2);

            // Calculer la distance entre les deux centres
            const distance = Math.sqrt(
                Math.pow(tokenCenterX - centerX, 2) +
                Math.pow(tokenCenterY - centerY, 2)
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

    // ===== GET CHARACTERISTICS =====
    const currentStance = getCurrentStance(raynartActor);
    const characteristicInfo = getCharacteristicValue(raynartActor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // ===== CALCULATE MAX EXPLOSIONS =====
    const maxExplosions = Math.floor(characteristicInfo.final / 2);

    if (maxExplosions <= 0) {
        ui.notifications.warn("⚠️ Esprit trop faible pour lancer Mecanique Atomique !");
        return;
    }

    console.log(`[MecaniqueAtomique] Max explosions: ${maxExplosions} (Esprit: ${characteristicInfo.final})`);

    // ===== DIALOG: SELECT NUMBER OF EXPLOSIONS =====
    const explosionCount = await new Promise((resolve) => {
        const dialogContent = `
            <style>
                .mecanique-atomique-dialog { font-family: 'Signika', sans-serif; }
                .info-box {
                    background: linear-gradient(135deg, #fff3e0, #ffebee);
                    padding: 15px;
                    border-radius: 8px;
                    border: 2px solid #ff6600;
                    margin-bottom: 15px;
                }
                .input-box {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    border: 2px solid #2196f3;
                }
                .input-box label {
                    display: block;
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #333;
                    font-size: 14px;
                }
                .input-box input {
                    width: 100%;
                    padding: 12px;
                    font-size: 24px;
                    font-weight: bold;
                    border: 2px solid #ff6600;
                    border-radius: 6px;
                    background: white;
                    color: #ff6600;
                    text-align: center;
                    box-sizing: border-box;
                }
                .input-box input:focus {
                    outline: none;
                    border-color: #d84315;
                    box-shadow: 0 0 8px rgba(255, 102, 0, 0.3);
                }
                .hint-text {
                    margin-top: 8px;
                    font-size: 12px;
                    color: #666;
                    font-style: italic;
                    text-align: center;
                }
            </style>
            <div class="mecanique-atomique-dialog">
                <div class="info-box">
                    <h3 style="color: #ff6600; margin: 0 0 10px 0;">💥 Mecanique Atomique</h3>
                    <p style="margin: 5px 0;"><strong>Mage:</strong> ${raynartActor.name}</p>
                    <p style="margin: 5px 0;"><strong>Esprit:</strong> ${characteristicInfo.final}</p>
                    <p style="margin: 5px 0;"><strong>Maximum recommandé:</strong> ${maxExplosions} explosion${maxExplosions > 1 ? 's' : ''}</p>
                    <p style="margin: 5px 0; color: #d32f2f;"><strong>Cooldown:</strong> ${SPELL_CONFIG.cooldown}</p>
                </div>
                <div class="input-box">
                    <label for="explosion-count">💥 Nombre d'explosions à lancer :</label>
                    <input type="number" id="explosion-count" value="${maxExplosions}" min="1" />
                    <div class="hint-text">
                        Vous pouvez entrer n'importe quel nombre, mais ${maxExplosions} est le maximum recommandé.
                    </div>
                </div>
            </div>
        `;

        const dialog = new Dialog({
            title: "💥 Mecanique Atomique",
            content: dialogContent,
            buttons: {
                cast: {
                    label: "💥 Lancer le Sort",
                    callback: (html) => {
                        const count = parseInt(html.find('#explosion-count').val());
                        if (isNaN(count) || count < 1) {
                            ui.notifications.warn("⚠️ Nombre d'explosions invalide !");
                            resolve(null);
                        } else {
                            resolve(count);
                        }
                    }
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "cast",
            close: () => resolve(null),
            render: (html) => {
                // Sélectionner le contenu quand on clique sur l'input
                html.find('#explosion-count').on('focus', function() {
                    this.select();
                });
            }
        }, {
            width: 500
        }).render(true);
    });

    if (!explosionCount) {
        ui.notifications.info("❌ Mecanique Atomique annulé.");
        return;
    }

    console.log(`[MecaniqueAtomique] Player selected ${explosionCount} explosions`);

    // ===== VÉRIFICATION MODULE PORTAL =====
    if (typeof Portal === "undefined") {
        ui.notifications.error("❌ Le module Portal n'est pas disponible ! Veuillez l'activer.");
        return;
    }

    // ===== TARGETING: PORTAL.PICK FOR EACH EXPLOSION =====
    ui.notifications.info(`🎯 Sélectionnez ${explosionCount} point${explosionCount > 1 ? 's' : ''} d'explosion...`);

    const explosionPoints = [];

    for (let i = 0; i < explosionCount; i++) {
        const portalInstance = new Portal()
            .origin(raynartToken)
            .color("#ff6600")
            .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm");

        const portalResult = await portalInstance.pick();

        if (!portalResult || portalResult.cancelled) {
            ui.notifications.warn("❌ Ciblage annulé.");
            return;
        }

        const centerX = portalResult.x;
        const centerY = portalResult.y;

        console.log(`[MecaniqueAtomique] Explosion ${i + 1} at (${centerX}, ${centerY})`);

        explosionPoints.push({
            index: i + 1,
            x: centerX,
            y: centerY
        });
    }

    console.log(`[MecaniqueAtomique] All ${explosionPoints.length} explosion points selected`);

    // ===== CALCULATE TARGETS FOR EACH EXPLOSION =====
    const targetExplosionMap = new Map(); // tokenId -> { token, actor, name, explosions: [damageRolls] }

    for (const point of explosionPoints) {
        const targets = findTargetsInRadius(point.x, point.y, SPELL_CONFIG.effectRadius);

        console.log(`[MecaniqueAtomique] Explosion ${point.index}: ${targets.length} targets`);

        for (const target of targets) {
            if (!targetExplosionMap.has(target.token.id)) {
                targetExplosionMap.set(target.token.id, {
                    token: target.token,
                    actor: target.actor,
                    name: target.name,
                    explosions: []
                });
            }

            // Ajouter cette explosion pour cette cible
            targetExplosionMap.get(target.token.id).explosions.push({
                point: point,
                damageRoll: null // Sera rempli après les jets de dés
            });
        }
    }

    console.log(`[MecaniqueAtomique] ${targetExplosionMap.size} unique targets will be affected`);

    // ===== CALCULATE MANA COST =====
    const costCalc = calculateManaCost(
        SPELL_CONFIG.baseMana,
        SPELL_CONFIG.costType,
        currentStance
    );

    console.log(`[MecaniqueAtomique] Mana cost: ${costCalc.realCost} (${costCalc.displayMessage})`);

    // ===== SINGLE ATTACK ROLL FOR ALL EXPLOSIONS =====
    const spellLevelBonus = SPELL_CONFIG.spellLevel * 2;
    const totalAttackDice = characteristicInfo.final;
    const attackFormula = `${totalAttackDice}d7 + ${spellLevelBonus}`;
    const attackRoll = new Roll(attackFormula);
    await attackRoll.evaluate({ async: true });

    console.log(`[MecaniqueAtomique] Attack roll: ${attackRoll.formula} = ${attackRoll.total}`);

    // ===== PREPARE DAMAGE FORMULA =====
    const espritBonus = Math.floor(characteristicInfo.final / 2);
    const damageFormula = `${SPELL_CONFIG.damageFormula} + ${espritBonus}`;

    // Maximiser les dés en stance offensive
    const isOffensive = currentStance === 'offensif';

    // ===== ANIMATIONS SIMULTANÉES =====
    async function playAllExplosions() {
        const allSequences = [];

        for (const point of explosionPoints) {
            // Délai aléatoire entre 0 et 200ms
            const sequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animation.cast)
                    .atLocation({ x: point.x, y: point.y })
                    .scale({ x: 0.5, y: 0.5 })
                    .anchor({ x: 0.5, y: 0.5 })
                    .delay(0, 200)
                .wait(1000)
                .effect()
                    .file(SPELL_CONFIG.animation.pulse)
                    .atLocation({ x: point.x, y: point.y })
                    .scale({ x: 1, y: 1 })
                    .anchor({ x: 0.5, y: 0.5 })
                .wait(300)
                .effect()
                    .file(SPELL_CONFIG.animation.shatter)
                    .atLocation({ x: point.x, y: point.y })
                    .scale({ x: 1, y: 1 })
                    .anchor({ x: 0.5, y: 0.5 })
                .wait(1300)
                .effect()
                    .file(SPELL_CONFIG.animation.explosion1)
                    .atLocation({ x: point.x, y: point.y })
                    .scale({ x: 1.5, y: 1.5 })
                    .anchor({ x: 0.5, y: 0.5 })
                .effect()
                    .file(SPELL_CONFIG.animation.explosion2)
                    .atLocation({ x: point.x, y: point.y })
                    .scale(0.8)
                    .anchor({ x: 0.5, y: 0.5 });

            allSequences.push(sequence);
        }

        // Lancer toutes les séquences en parallèle
        await Promise.all(allSequences.map(seq => seq.play()));

        // Son global après les explosions
        await new Sequence()
            .sound(SPELL_CONFIG.animation.sound)
            .play();
    }

    await playAllExplosions();

    // ===== COMBINED ROLL FOR CHAT MESSAGE =====
    // Créer un roll combiné avec l'attaque et tous les jets de dégâts
    const allRollFormulas = [attackFormula];

    // Ajouter tous les jets de dégâts au roll combiné
    for (const point of explosionPoints) {
        allRollFormulas.push(damageFormula);
    }

    const combinedRoll = new Roll(`{${allRollFormulas.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extraire le résultat d'attaque
    const attackResult = combinedRoll.terms[0].results[0].result;

    // Extraire les résultats de dégâts et les assigner aux explosions
    for (let i = 0; i < explosionPoints.length; i++) {
        const point = explosionPoints[i];
        const damageResult = combinedRoll.terms[0].results[i + 1].result;

        let finalDamage = damageResult;

        if (isOffensive) {
            // Maximiser le dé: 1d6 = 6
            finalDamage = 6 + espritBonus;
        }

        // Associer le jet de dégâts à toutes les cibles touchées par cette explosion
        for (const [tokenId, targetData] of targetExplosionMap.entries()) {
            const explosionIndex = targetData.explosions.findIndex(e =>
                e.point.index === point.index && e.damageRoll === null
            );
            if (explosionIndex !== -1) {
                targetData.explosions[explosionIndex].damageRoll = {
                    formula: damageFormula,
                    result: damageResult,
                    finalDamage: finalDamage,
                    maximized: isOffensive
                };
            }
        }

        console.log(`[MecaniqueAtomique] Damage for explosion ${point.index}: ${damageFormula} = ${finalDamage}${isOffensive ? ' (maximized)' : ''}`);
    }

    // ===== APPLY MAX 3 EXPLOSIONS PER TARGET =====
    for (const [tokenId, targetData] of targetExplosionMap.entries()) {
        if (targetData.explosions.length > SPELL_CONFIG.maxExplosionsPerTarget) {
            // Trier par dégâts décroissants et garder les 3 meilleurs
            targetData.explosions.sort((a, b) =>
                b.damageRoll.finalDamage - a.damageRoll.finalDamage
            );
            targetData.explosions = targetData.explosions.slice(0, SPELL_CONFIG.maxExplosionsPerTarget);

            console.log(`[MecaniqueAtomique] ${targetData.name} hit by multiple explosions, capped to top 3`);
        }
    }

    // ===== CHAT MESSAGE =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    // Trier les cibles par nombre d'explosions (décroissant)
    const sortedTargets = Array.from(targetExplosionMap.values())
        .sort((a, b) => b.explosions.length - a.explosions.length);

    let targetSummaries = '';
    for (const targetData of sortedTargets) {
        const explosionCount = targetData.explosions.length;
        const totalDamage = targetData.explosions.reduce((sum, exp) => sum + exp.damageRoll.finalDamage, 0);

        const damageDetails = targetData.explosions
            .map(exp => `${exp.damageRoll.finalDamage}`)
            .join(' + ');

        const bgColor = explosionCount > 1 ? '#ffebee' : '#ffffff';
        const borderColor = explosionCount > 1 ? '#f44336' : '#e0e0e0';

        targetSummaries += `
            <div style="padding: 10px; margin: 8px 0; background: ${bgColor}; border: 2px solid ${borderColor}; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-size: 1.1em; font-weight: bold; color: #333; margin-bottom: 6px;">
                    🎯 ${targetData.name}
                </div>
                <div style="font-size: 0.95em; color: #666; margin-bottom: 4px;">
                    ${explosionCount} explosion${explosionCount > 1 ? 's' : ''}${explosionCount > SPELL_CONFIG.maxExplosionsPerTarget ? ' (limité à 3)' : ''}
                </div>
                <div style="background: white; padding: 8px; border-radius: 4px; border-left: 4px solid #ff6600;">
                    <div style="font-size: 0.9em; color: #666;">Dégâts: ${damageDetails}</div>
                    <div style="font-size: 1.3em; color: #d32f2f; font-weight: bold; margin-top: 4px;">
                        💥 TOTAL: ${totalDamage}
                    </div>
                    <div style="font-size: 0.85em; color: #999; margin-top: 4px; font-style: italic;">
                        (moitié sur esquive réussie)
                    </div>
                </div>
            </div>
        `;
    }

    const chatContent = `
        <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, #fff3e0, #ffebee); padding: 15px; border-radius: 10px; border: 3px solid #ff6600;">
            <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="margin: 0; color: #ff6600; font-size: 1.5em; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                    ⚛️ ${SPELL_CONFIG.name}
                </h3>
                <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                    <strong>Mage Mécanique:</strong> ${raynartActor.name}${stanceInfo}
                </div>
            </div>

            <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #2196f3;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                    <div><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} ${characteristicInfo.final}</div>
                    <div><strong>Explosions:</strong> ${explosionPoints.length}</div>
                    <div style="grid-column: 1 / -1;"><strong>Coût:</strong> ${costCalc.displayMessage}</div>
                    <div style="grid-column: 1 / -1; color: #d32f2f;"><strong>⏱️ Cooldown:</strong> ${SPELL_CONFIG.cooldown}</div>
                </div>
            </div>

            <div style="background: #fff8e1; padding: 12px; border-radius: 8px; margin-bottom: 12px; border: 2px solid #ffc107;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h4 style="margin: 0; color: #f57f17; font-size: 1.1em;">🎯 Jet d'Attaque Unique</h4>
                    <div style="font-size: 0.85em; color: #666; margin-top: 4px;">
                        (Pour toutes les explosions)
                    </div>
                </div>
                <div style="background: white; padding: 10px; border-radius: 6px; text-align: center;">
                    <div style="font-size: 0.9em; color: #666; margin-bottom: 4px;">
                        Formule: ${attackFormula}
                    </div>
                    <div style="font-size: 1.5em; color: #f57f17; font-weight: bold;">
                        ⚔️ ${attackResult}
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 10px;">
                <h4 style="margin: 0; color: #ff6600; font-size: 1.1em;">💥 Dégâts par Cible</h4>
                <div style="font-size: 0.85em; color: #666; margin-top: 6px;">
                    <div>📐 Formule: ${damageFormula}${isOffensive ? ' <strong>(MAXIMISÉ)</strong>' : ''}</div>
                    <div style="margin-top: 4px; color: #d32f2f;">⚠️ Les cibles subissent la moitié des dégâts même sur esquive réussie</div>
                    <div style="margin-top: 2px;">📊 Maximum 3 explosions par cible (3 meilleurs résultats)</div>
                </div>
            </div>
            ${targetSummaries}
        </div>
    `;

    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: raynartToken }),
        flavor: chatContent,
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== FINAL NOTIFICATION =====
    const totalTargets = targetExplosionMap.size;
    ui.notifications.info(`⚛️ Mecanique Atomique : ${explosionPoints.length} explosion${explosionPoints.length > 1 ? 's' : ''}, ${totalTargets} cible${totalTargets > 1 ? 's' : ''} touchée${totalTargets > 1 ? 's' : ''} ! (Cooldown: ${SPELL_CONFIG.cooldown})`);

    console.log(`[MecaniqueAtomique] Spell complete - ${explosionPoints.length} explosions, ${totalTargets} targets hit`);

})();
