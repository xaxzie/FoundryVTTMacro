/**
 * Livre Monstrueux - Urgen
 *
 * Urgen utilise son esprit pour créer et lancer un livre magique sur un adversaire.
 * Le livre peut s'accrocher à la cible pour infliger des dégâts persistants.
 *
 * - Caractéristique d'attaque : Esprit (+ effets actifs + bonus manuels)
 * - Dégâts : 1d4 + Esprit + bonus manuels + bonus d'effets actifs
 * - Coût de base : 3 mana (focalisable)
 * - Niveau de sort : 1
 * - Option d'accrochage : Peut attacher le livre à la cible
 * - Effet d'accrochage : Ajoute "Livre Monstrueux" avec statusCounter = Esprit/2
 * - Limite : Jusqu'à 2 livres par cible (stacking du counter)
 * - Coût maintenance : 1 mana/tour (non focalisable) si livre attaché
 *
 * Usage : Sélectionner le token de Urgen, lancer la macro et choisir la cible.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Livre Monstrueux",
        description: "Livre magique lancé avec précision, peut s'accrocher à la cible",
        manaCost: 3,
        spellLevel: 1,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        damageFormula: "1d4",
        isDirect: true,
        isFocusable: true,
        maxBooksPerTarget: 2,
        maintenanceCost: 1, // Coût par tour pour livre attaché (non focalisable)
        animations: {
            cast: "jb2a.condition.boon.01.007.green",
            projectile: "jb2a.throwable.launch.cannon_ball.01.black",
            impact: "jb2a_patreon.bite.200px.purple",
            attachment: "jb2a_patreon.markers.fear.orange.03",
            sound: null
        },
        targeting: {
            range: 180,
            color: "#4169e1",
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Urgen !");
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
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "physique")
     * @returns {number} Total bonus from all matching active effects
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
        // Get base characteristic from character sheet
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
        }
        const baseValue = charAttribute.value || 3;

        // Detect injury stacks and reduce characteristic accordingly
        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        // Get active effect bonuses for the characteristic
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        console.log(`[DEBUG] Base ${characteristic}: ${baseValue}, Injury stacks: ${injuryStacks}, Effect bonus: ${effectBonus}`);

        // Calculate final value: base - injuries + effects, minimum of 1
        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[DEBUG] ${characteristic} reduced from ${baseValue} to ${injuryAdjusted} due to ${injuryStacks} injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[DEBUG] ${characteristic} adjusted by ${effectBonus} from active effects (final: ${finalValue})`);
        }

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Calcule le coût en mana basé sur la stance
     */
    function calculateManaCost(baseCost, stance, isFocusable) {
        return stance === 'focus' && isFocusable ? 0 : baseCost;
    }

    /**
     * Applique un effet avec délégation GM
     */
    async function applyEffectWithGMDelegation(targetActor, effectData) {
        if (!globalThis.gmSocket) {
            const error = "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
            ui.notifications.error(error);
            console.error("[DEBUG] GM Socket not available for effect application");
            return { success: false, error };
        }

        try {
            console.log(`[DEBUG] Applying effect "${effectData.name}" to ${targetActor.name} via GM socket`);
            const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.id, effectData);

            if (result?.success) {
                console.log(`[DEBUG] Successfully applied effect "${effectData.name}" to ${targetActor.name}`);
                return { success: true, effects: result.effects };
            } else {
                console.error(`[DEBUG] Failed to apply effect: ${result?.error}`);
                return { success: false, error: result?.error || "Unknown error" };
            }
        } catch (error) {
            console.error("Error applying effect:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Met à jour un effet avec délégation GM
     */
    async function updateEffectWithGMDelegation(targetActor, effectId, updateData) {
        if (!globalThis.gmSocket) {
            const error = "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
            ui.notifications.error(error);
            console.error("[DEBUG] GM Socket not available for effect update");
            return { success: false, error };
        }

        try {
            console.log(`[DEBUG] Updating effect ${effectId} on ${targetActor.name} via GM socket`);
            const result = await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetActor.id, effectId, updateData);

            if (result?.success) {
                console.log(`[DEBUG] Successfully updated effect ${effectId} on ${targetActor.name}`);
                return { success: true };
            } else {
                console.error(`[DEBUG] Failed to update effect: ${result?.error}`);
                return { success: false, error: result?.error || "Unknown error" };
            }
        } catch (error) {
            console.error("Error updating effect:", error);
            return { success: false, error: error.message };
        }
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const actualManaCost = calculateManaCost(SPELL_CONFIG.manaCost, currentStance, SPELL_CONFIG.isFocusable);

    // ===== SPELL CONFIGURATION DIALOG =====
    async function showSpellConfigDialog() {
        // Calcul des bonus d'effets actifs
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const damageBonus = getActiveEffectBonus(actor, "damage");

        const stanceName = currentStance ?
            (currentStance === 'focus' ? 'Focus' :
                currentStance === 'offensif' ? 'Offensif' :
                    currentStance === 'defensif' ? 'Défensif' : 'Aucune') : 'Aucune';

        const injuryDisplay = characteristicInfo.injuries > 0 ?
            `<span style="color: #d32f2f;">-${characteristicInfo.injuries} (blessures)</span>` :
            '<span style="color: #2e7d32;">Aucune</span>';

        return new Promise((resolve) => {
            new Dialog({
                title: `📚 ${SPELL_CONFIG.name}`,
                content: `
                    <div style="padding: 15px; background: #f9f9f9; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #333;">📚 ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Coût:</strong> ${actualManaCost} mana (${currentStance || 'Aucune'} ${SPELL_CONFIG.isFocusable ? '- focalisable' : ''})</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">⚔️ Configuration</h4>
                            <div style="margin: 10px 0;">
                                <label><strong>Bonus d'Attaque:</strong></label>
                                <input type="number" id="attackBonus" value="0" min="-10" max="20"
                                       style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ccc; border-radius: 3px;"/>
                            </div>
                            <div style="margin: 10px 0;">
                                <label><strong>Bonus de Dégâts:</strong></label>
                                <input type="number" id="damageBonus" value="0" min="-10" max="20"
                                       style="width: 60px; padding: 4px; margin-left: 10px; border: 1px solid #ccc; border-radius: 3px;"/>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #fff8e1; border-radius: 4px; border: 1px solid #ffc107;">
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="attachBook" style="margin-right: 8px;"/>
                                <span><strong>📖 Accrocher le livre à la cible</strong></span>
                            </label>
                            <p style="font-size: 0.9em; margin: 8px 0 0 0; color: #666;">
                                Coût: ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)
                            </p>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find("#attackBonus").val()) || 0;
                            const damageBonus = parseInt(html.find("#damageBonus").val()) || 0;
                            const attachBook = html.find("#attachBook").prop("checked");
                            resolve({ attackBonus, damageBonus, attachBook });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                close: () => resolve(null)
            }, {
                width: 520,
                height: "auto"
            }).render(true);
        });
    }

    const spellConfig = await showSpellConfigDialog();
    if (!spellConfig) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { attackBonus, damageBonus, attachBook } = spellConfig;

    // ===== TARGETING SYSTEM =====
    /**
     * Selects a target using the Portal module
     * @returns {Object|null} Target coordinates or null if cancelled
     */
    async function selectTarget() {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const target = await portal.pick();
            return target;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info("❌ Ciblage annulé.");
        return;
    }

    // ===== ACTOR DETECTION =====
    /**
     * Finds an actor at a specific location using grid-aware detection and visibility filtering
     * @param {number} targetX - Target X coordinate
     * @param {number} targetY - Target Y coordinate
     * @returns {Object|null} Actor info object or null if none found
     */
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(targetX / gridSize);
            const targetGridY = Math.floor(targetY / gridSize);

            console.log(`[DEBUG] Grid detection - Target grid coords: (${targetGridX}, ${targetGridY})`);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Visibility filtering
                if (!(token.isVisible || token.isOwner || game.user.isGM)) {
                    return false;
                }

                // Convert token position to grid coordinates
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                // Check if target grid position is within token's grid area
                return targetGridX >= tokenGridX &&
                    targetGridX < tokenGridX + tokenWidth &&
                    targetGridY >= tokenGridY &&
                    targetGridY < tokenGridY + tokenHeight;
            });

            if (tokensAtLocation.length === 0) {
                console.log(`[DEBUG] No tokens found at grid position (${targetGridX}, ${targetGridY})`);
                return null;
            }

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection (original behavior with visibility filtering)
            const tolerance = gridSize;
            console.log(`[DEBUG] Circular detection - Tolerance: ${tolerance}`);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // Visibility filtering
                if (!(token.isVisible || token.isOwner || game.user.isGM)) {
                    return false;
                }

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const distance = Math.sqrt(
                    Math.pow(targetX - tokenCenterX, 2) +
                    Math.pow(targetY - tokenCenterY, 2)
                );

                return distance <= tolerance;
            });

            if (tokensAtLocation.length === 0) {
                console.log(`[DEBUG] No tokens found within tolerance ${tolerance} of position (${targetX}, ${targetY})`);
                return null;
            }

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : "position vide";

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");

        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus;

        let damageFormula = SPELL_CONFIG.damageFormula;
        if (totalCharacteristic > 0) {
            damageFormula += ` + ${totalCharacteristic}`;
        }
        if (totalDamageBonus > 0) {
            damageFormula += ` + ${totalDamageBonus}`;
        }

        // Stance offensive : maximiser les dégâts
        if (currentStance === 'offensif') {
            // 1d4 devient 4
            const maxDamage = 4 + totalCharacteristic + totalDamageBonus;
            return {
                formula: `4 + ${totalCharacteristic} + ${totalDamageBonus}`,
                total: maxDamage,
                isMaximized: true
            };
        } else {
            const roll = new Roll(damageFormula);
            await roll.evaluate({ async: true });
            return {
                formula: damageFormula,
                total: roll.total,
                isMaximized: false,
                roll: roll
            };
        }
    }

    const damageResult = await calculateDamage();

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Animation de cast sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.5)
            .belowTokens(true)

        // Projectile du livre vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.projectile)
            .attachTo(caster)
            .stretchTo(target)
            .scale(0.7)
            .waitUntilFinished(-500);

        // Impact sur la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.impact)
            .atLocation({ x: target.x, y: target.y })
            .scale(0.8)

        // Si livre attaché, animation d'accrochage
        if (attachBook && targetActor) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.attachment)
                .attachTo(targetActor.token)
                .scale(0.6)
                .duration(3000)
                .delay(500);
        }

        if (SPELL_CONFIG.animations.sound) {
            sequence.sound().file(SPELL_CONFIG.animations.sound);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== COMBINED ATTACK AND DAMAGE RESOLUTION =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Build combined roll formula: attack roll + damage roll
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll to the combined formula (only if not maximized)
    if (currentStance !== 'offensif') {
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = totalCharacteristic + totalDamageBonus;
        combinedRollParts.push(`${SPELL_CONFIG.damageFormula} + ${statBonus}`);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results from the combined roll
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        // Extract damage result from dice roll
        const damageRollResult = combinedRoll.terms[0].results[1];
        // Build the damage formula for display
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const totalCharacteristic = characteristicInfo.final + characteristicBonus;
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = totalCharacteristic + totalDamageBonus;
        const displayFormula = `${SPELL_CONFIG.damageFormula} + ${statBonus}`;

        finalDamageResult = {
            total: damageRollResult.result,
            formula: displayFormula,
            result: damageRollResult.result
        };
    }

    // Prepare result variables for final message
    let bookAttachmentResult = { success: false, message: "" };

    // ===== BOOK ATTACHMENT SYSTEM =====
    if (attachBook && targetActor) {
        bookAttachmentResult = await handleBookAttachment(targetActor.actor);
    }

    /**
     * Gère l'accrochage du livre à la cible et met à jour le compteur de Urgen
     */
    async function handleBookAttachment(targetActor) {
        const counterValue = Math.floor(characteristicInfo.final / 2);
        const effectName = "Livre Monstrueux";
        let attachmentSuccess = false;
        let attachmentMessage = "";

        // Vérifier si l'effet existe déjà sur la cible
        let existingEffect = null;
        for (const effect of targetActor.effects) {
            if (effect.name === effectName) {
                existingEffect = effect;
                break;
            }
        }

        if (existingEffect) {
            // Vérifier la limite de livres
            const currentCounter = existingEffect.flags?.statuscounter?.value || 0;
            const newCounter = currentCounter + counterValue;

            // Calculer combien de livres cela représente (approximativement)
            const currentBooks = Math.ceil(currentCounter / counterValue) || 1;

            // Removed book limit - infinite books allowed
            // if (currentBooks >= SPELL_CONFIG.maxBooksPerTarget) {
            //     ui.notifications.warn(`⚠️ ${targetActor.name} a déjà ${SPELL_CONFIG.maxBooksPerTarget} livres attachés (maximum atteint) !`);
            //     attachmentMessage = `❌ Limite atteinte (${SPELL_CONFIG.maxBooksPerTarget} livres max)`;
            //     return { success: false, message: attachmentMessage };
            // }

            // Mettre à jour le counter existant avec GM delegation
            const currentBookCount = existingEffect.flags?.BookCount.value || 0;
            const updateData = {
                "flags.statuscounter.value": newCounter,
                "flags.BookCount.value": currentBookCount + 1
            };

            const updateResult = await updateEffectWithGMDelegation(targetActor, existingEffect.id, updateData);
            if (updateResult.success) {
                attachmentSuccess = true;
                attachmentMessage = `📚 Livre supplémentaire attaché (${currentCounter} → ${newCounter})`;
                console.log(`[DEBUG] Updated existing effect on ${targetActor.name}: counter ${currentCounter} → ${newCounter}`);
            } else {
                console.error("Error updating existing effect:", updateResult.error);
                attachmentMessage = `❌ Erreur mise à jour: ${updateResult.error}`;
                return { success: false, message: attachmentMessage };
            }
        } else {
            // Créer un nouvel effet sur la cible
            const effectData = {
                name: effectName,
                icon: "icons/sundries/books/book-red-exclamation.webp",
                description: `Livre magique de Urgen attaché. Coût: ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)`,
                disabled: false,
                duration: { seconds: 84600 },
                flags: {
                    statuscounter: {
                        visible: true,
                        value: counterValue
                    },
                    BookCount: {
                        value: 1
                    },
                },
                changes: []
            };

            const result = await applyEffectWithGMDelegation(targetActor, effectData);
            if (result.success) {
                attachmentSuccess = true;
                attachmentMessage = `📖 Nouveau livre attaché (Counter: ${counterValue})`;
                console.log(`[DEBUG] Applied new effect to ${targetActor.name}: counter ${counterValue}`);
            } else {
                console.error(`[DEBUG] Failed to apply effect: ${result.error}`);
                attachmentMessage = `❌ Erreur application: ${result.error}`;
                return { success: false, message: attachmentMessage };
            }
        }

        // Si l'accrochage a réussi, ajouter/mettre à jour l'effet "Book" sur Urgen
        if (attachmentSuccess) {
            const bookEffectName = "Book";
            let urgenBookEffect = null;

            // Chercher l'effet "Book" existant sur Urgen
            for (const effect of actor.effects) {
                if (effect.name === bookEffectName) {
                    urgenBookEffect = effect;
                    break;
                }
            }

            if (urgenBookEffect) {
                // Incrementer le counter existant
                const currentUrgenCounter = urgenBookEffect.flags?.statuscounter?.value || 0;
                const newUrgenCounter = currentUrgenCounter + 1;

                const urgenUpdateData = {
                    "flags.statuscounter.value": newUrgenCounter,
                    "flags.statuscounter.visible": true
                };

                const urgenUpdateResult = await updateEffectWithGMDelegation(actor, urgenBookEffect.id, urgenUpdateData);
                if (urgenUpdateResult.success) {
                    console.log(`[DEBUG] Updated Urgen's Book effect: ${currentUrgenCounter} → ${newUrgenCounter}`);
                } else {
                    console.error(`[DEBUG] Failed to update Urgen's Book effect: ${urgenUpdateResult.error}`);
                }
            } else {
                // Créer un nouvel effet "Book" sur Urgen
                const urgenBookData = {
                    name: bookEffectName,
                    icon: "icons/sundries/books/book-embossed-blue.webp",
                    description: "Livres magiques créés et attachés aux ennemis",
                    disabled: false,
                    duration: { seconds: 84600 },
                    flags: {
                        statuscounter: {
                            visible: true,
                            value: 1
                        }
                    },
                    changes: []
                };

                const urgenResult = await applyEffectWithGMDelegation(actor, urgenBookData);
                if (urgenResult.success) {
                    console.log(`[DEBUG] Applied new Book effect to Urgen: counter 1`);
                } else {
                    console.error(`[DEBUG] Failed to apply Book effect to Urgen: ${urgenResult.error}`);
                }
            }
        }

        return { success: attachmentSuccess, message: attachmentMessage };
    }

    // Build enhanced flavor for the final dice roll message

    function createChatFlavor() {
        const actualManaCostDisplay = actualManaCost === 0 ? 'GRATUIT (Focus)' : `${actualManaCost} mana`;

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>📚 ${SPELL_CONFIG.name}${stanceNote}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${finalDamageResult.total}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay} + bonus)</div>
                ${attachBook ? `<div style="font-size: 0.8em; color: #666;">📖 Livre ${bookAttachmentResult.success ? 'attaché' : 'non attaché'}</div>` : ''}
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f5f5f5, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #3f51b5; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">📚 ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${attackDisplay}
                ${damageDisplay}
            </div>
        `;
    }

    const enhancedFlavor = createChatFlavor();

    // Add book attachment info if applicable
    if (attachBook) {
        const counterValue = Math.floor(characteristicInfo.final / 2);
        const attachmentColor = bookAttachmentResult.success ? "rgba(76,175,80,0.3)" : "rgba(244,67,54,0.3)";
        const attachmentBorder = bookAttachmentResult.success ? "#4caf50" : "#f44336";

        enhancedFlavor += `
            <div style="background: ${attachmentColor}; padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid ${attachmentBorder};">
                <p style="margin: 5px 0;"><strong>📖 Accrochage:</strong> ${bookAttachmentResult.message}</p>`;

        if (bookAttachmentResult.success) {
            enhancedFlavor += `<p style="margin: 5px 0; font-size: 0.9em;">💰 Coût: ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)</p>
                              <p style="margin: 5px 0; font-size: 0.9em;">� Cumul: Livres illimités par cible</p>`;
        }

        enhancedFlavor += `</div>`;
    }

    enhancedFlavor += `</div>`;

    // Send the unified dice roll message
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const manaCostInfo = actualManaCost === 0 ? ' GRATUIT (Focus)' : ` - ${actualManaCost} mana`;
    const bookInfo = attachBook ? ` Livre ${bookAttachmentResult.success ? 'attaché' : 'non attaché'}.` : '';

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} Cible: ${targetName}. Attaque: ${attackResult.result}, Dégâts: ${finalDamageResult.total}${manaCostInfo}.${bookInfo}`);

    console.log(`[DEBUG] Livre Monstrueux cast complete - Caster: ${actor.name}, Target: ${targetName}, Damage: ${finalDamageResult.total}, Book Attached: ${attachBook}`);

})();
