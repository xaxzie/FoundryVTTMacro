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
            cast: "jb2a.magic_signs.circle.02.enchantment.loop.blue",
            projectile: "jb2a.book.open.02.brown",
            impact: "jb2a.impact.010.blue",
            attachment: "jb2a.markers.rune.blue.03",
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
                title: `🎯 Configuration - ${SPELL_CONFIG.name}`,
                content: `
                    <div style="background: linear-gradient(135deg, #1a237e, #3949ab); padding: 20px; border-radius: 12px; color: white; font-family: 'Roboto', sans-serif;">
                        <h2 style="text-align: center; margin-top: 0; color: #fff; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">📚 ${SPELL_CONFIG.name}</h2>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #bbdefb;">🎭 État du Lanceur</h3>
                            <p><strong>Lanceur:</strong> ${actor.name}</p>
                            <p><strong>Stance:</strong> ${stanceName}</p>
                            <p><strong>Blessures:</strong> ${injuryDisplay}</p>
                            <p><strong>Coût Mana:</strong> ${actualManaCost} (${SPELL_CONFIG.isFocusable ? 'focalisable' : 'non focalisable'})</p>
                        </div>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #bbdefb;">⚔️ Statistiques d'Attaque</h3>
                            <p><strong>${SPELL_CONFIG.characteristicDisplay}:</strong> ${characteristicInfo.base} ${characteristicInfo.injuries > 0 ? `→ ${characteristicInfo.final}` : ''}</p>
                            <p><strong>Bonus d'Effets Actifs (${SPELL_CONFIG.characteristicDisplay}):</strong> +${characteristicBonus}</p>
                            <p><strong>Bonus d'Effets Actifs (Dégâts):</strong> +${damageBonus}</p>
                            <p><strong>Niveau de Sort:</strong> ${SPELL_CONFIG.spellLevel} (+${2 * SPELL_CONFIG.spellLevel} à l'attaque)</p>
                        </div>

                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <h3 style="margin-top: 0; color: #bbdefb;">🎯 Bonus Manuels</h3>
                            <p><label><strong>Bonus d'Attaque Supplémentaire:</strong></label></p>
                            <input type="number" id="attackBonus" value="0" min="-10" max="20"
                                   style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none;"/>
                            <p><label><strong>Bonus de Dégâts Supplémentaire:</strong></label></p>
                            <input type="number" id="damageBonus" value="0" min="-10" max="20"
                                   style="width: 100%; padding: 8px; margin-top: 5px; border-radius: 4px; border: none;"/>
                        </div>

                        <div style="background: rgba(255,193,7,0.2); padding: 15px; border-radius: 8px; margin: 15px 0; border: 2px solid #ffc107;">
                            <h3 style="margin-top: 0; color: #fff700;">📖 Option d'Accrochage du Livre</h3>
                            <label style="display: flex; align-items: center; cursor: pointer;">
                                <input type="checkbox" id="attachBook" style="margin-right: 10px; transform: scale(1.2);"/>
                                <span><strong>Accrocher le livre à la cible</strong></span>
                            </label>
                            <p style="font-size: 0.9em; margin-top: 10px; color: #ffe082;">
                                ⚠️ <strong>Coût:</strong> ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)<br>
                                📌 <strong>Effet:</strong> Ajoute "Livre Monstrueux" (Counter: Esprit÷2 = ${Math.floor(characteristicInfo.final / 2)})<br>
                                🔢 <strong>Limite:</strong> Max ${SPELL_CONFIG.maxBooksPerTarget} livres par cible (cumul possible)
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
            .duration(1500)
            .fadeIn(500)
            .fadeOut(500);

        // Projectile du livre vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.projectile)
            .attachTo(caster)
            .stretchTo(target)
            .scale(0.7)
            .duration(1000)
            .waitUntilFinished(-500);

        // Impact sur la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.impact)
            .atLocation({ x: target.x, y: target.y })
            .scale(0.8)
            .duration(800)
            .fadeIn(200)
            .fadeOut(400);

        // Si livre attaché, animation d'accrochage
        if (attachBook && targetActor) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.attachment)
                .attachTo(targetActor.token)
                .scale(0.6)
                .duration(2000)
                .fadeIn(500)
                .fadeOut(500)
                .delay(500);
        }

        if (SPELL_CONFIG.animations.sound) {
            sequence.sound().file(SPELL_CONFIG.animations.sound);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== ATTACK RESOLUTION =====
    const characteristicBonus = getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const totalAttackDice = characteristicInfo.final + characteristicBonus + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    // Construction de la formule de roll combinée
    const attackFormula = `${totalAttackDice}d7 + ${levelBonus}`;
    const attackRoll = new Roll(attackFormula);

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
            const currentCounter = existingEffect.flags?.statusCounter?.value || 0;
            const newCounter = currentCounter + counterValue;

            // Calculer combien de livres cela représente (approximativement)
            const currentBooks = Math.ceil(currentCounter / counterValue) || 1;

            if (currentBooks >= SPELL_CONFIG.maxBooksPerTarget) {
                ui.notifications.warn(`⚠️ ${targetActor.name} a déjà ${SPELL_CONFIG.maxBooksPerTarget} livres attachés (maximum atteint) !`);
                attachmentMessage = `❌ Limite atteinte (${SPELL_CONFIG.maxBooksPerTarget} livres max)`;
                return { success: false, message: attachmentMessage };
            }

            // Mettre à jour le counter existant avec GM delegation
            const currentBookCount = existingEffect.flags?.BookCount || 0;
            const updateData = {
                "flags.statusCounter.value": newCounter,
                "flags.BookCount": currentBookCount + 1
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
                    statusCounter: {
                        active: true,
                        value: counterValue
                    },
                    BookCount: 1
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
                const currentUrgenCounter = urgenBookEffect.flags?.statusCounter?.value || 0;
                const newUrgenCounter = currentUrgenCounter + 1;

                const urgenUpdateData = {
                    "flags.statusCounter.value": newUrgenCounter
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
                    icon: "icons/sundries/books/book-stack-blue.webp",
                    description: "Livres magiques créés et attachés aux ennemis",
                    disabled: false,
                    duration: { seconds: 84600 },
                    flags: {
                        statusCounter: {
                            active: true,
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
    const stanceName = currentStance ?
        (currentStance === 'focus' ? 'Focus' :
            currentStance === 'offensif' ? 'Offensif' :
                currentStance === 'defensif' ? 'Défensif' : 'Aucune') : 'Aucune';

    let enhancedFlavor = `
        <div style="background: linear-gradient(135deg, #1a237e, #3949ab); padding: 15px; border-radius: 10px; color: white; border: 2px solid #3f51b5;">
            <h3 style="margin-top: 0; text-align: center; color: #fff; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">📚 ${SPELL_CONFIG.name}</h3>

            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>🧙 Lanceur:</strong> ${actor.name}</p>
                <p style="margin: 5px 0;"><strong>🎯 Cible:</strong> ${targetName}</p>
                <p style="margin: 5px 0;"><strong>🎭 Stance:</strong> ${stanceName}</p>
            </div>

            <div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>⚔️ Attaque (${SPELL_CONFIG.characteristicDisplay}):</strong> ${totalAttackDice}d7 + ${levelBonus}</p>`;

    if (targetActor) {
        enhancedFlavor += `<p style="margin: 5px 0; font-style: italic;">🛡️ Défense requise : Agilité du défenseur</p>`;
    }

    enhancedFlavor += `</div>

            <div style="background: rgba(76,175,80,0.3); padding: 10px; border-radius: 5px; margin: 10px 0; border: 1px solid #4caf50;">`;

    if (damageResult.isMaximized) {
        enhancedFlavor += `<p style="margin: 5px 0;"><strong>💥 Dégâts (Stance Offensive - Maximisés):</strong> ${damageResult.total}</p>
                          <p style="margin: 5px 0; font-style: italic;">Formule: ${damageResult.formula}</p>`;
    } else {
        enhancedFlavor += `<p style="margin: 5px 0;"><strong>💥 Dégâts (si touche):</strong> ${damageResult.total}</p>
                          <p style="margin: 5px 0; font-style: italic;">Formule: ${damageResult.formula}</p>`;
    }

    enhancedFlavor += `</div>`;

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
                              <p style="margin: 5px 0; font-size: 0.9em;">📊 Max: ${SPELL_CONFIG.maxBooksPerTarget} livres par cible</p>`;
        }

        enhancedFlavor += `</div>`;
    }

    enhancedFlavor += `</div>`;

    // Send the unified dice roll message
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    console.log(`[DEBUG] Livre Monstrueux cast complete - Caster: ${actor.name}, Target: ${targetName}, Damage: ${damageResult.total}, Book Attached: ${attachBook}`);

})();
