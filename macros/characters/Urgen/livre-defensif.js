/**
 * Livre Défensif - Urgen
 *
 * Urgen invoque 1 ou 2 livres défensifs autour d'alliés (peut se sélectionner lui-même).
 * Les livres fournissent une protection magique aux cibles.
 *
 * - Caractéristique : Esprit (pour calcul de force défensive)
 * - Coût : 2 mana par livre (focalisable)
 * - Niveau de sort : 1
 * - Options : 1 ou 2 livres maximum
 * - Effet : Ajoute "Livre Défensif" avec statusCounter = Esprit × nombre de         // Pour chaque position de livre
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const targetActor = getActorAtLocation(target.x, target.y);

            // Skip projectile animation if target is the caster (Urgen targeting himself)
            const isSelfTarget = targetActor && targetActor.actor.id === actor.id;

            if (!isSelfTarget) {
                // Projectile vers chaque position (only if not self-targeting)
                sequence.effect()
                    .file(SPELL_CONFIG.animations.projectile)
                    .attachTo(caster)
                    .stretchTo(target)
                    .scale(0.4)
                    .delay(500 + i * 200);
            }

            // Impact à chaque position
            sequence.effect()
                .file(SPELL_CONFIG.animations.impact)
                .atLocation(target)
                .scale(0.4)
                .delay(isSelfTarget ? 500 + i * 200 : 800 + i * 200); // Adjust delay for self-target
        }ble
 * - Cumul : Plusieurs livres possibles sur la même cible
 * - Compteur Urgen : Ajoute/augmente l'effet "Book" sur Urgen avec le nombre total de livres créés
 *
 * Usage : Sélectionner le token de Urgen, choisir le nombre de livres, puis cibler les alliés
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Livre Défensif",
        description: "Invoque des livres défensifs autour d'alliés pour les protéger",
        manaCostPerBook: 2,
        spellLevel: 1,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        maxBooks: 2,
        isFocusable: true,
        animations: {
            cast: "jb2a.cast_shape.square.01.blue",
            projectile: "jb2a_patreon.magic_missile.blue",
            impact: "jb2a.shield.01.complete.01.blue",
            attachment: "jb2a_patreon.markers.shield.green.03",
            sound: null
        },
        targeting: {
            range: 150,
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
     * Applique un effet avec délégation GM (token-based)
     */
    async function applyEffectWithGMDelegation(targetToken, effectData) {
        if (!globalThis.gmSocket) {
            const error = "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
            ui.notifications.error(error);
            console.error("[DEBUG] GM Socket not available for effect application");
            return { success: false, error };
        }

        try {
            console.log(`[DEBUG] Applying effect "${effectData.name}" to token ${targetToken.name} via GM socket`);
            const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetToken.id, effectData);

            if (result?.success) {
                console.log(`[DEBUG] Successfully applied effect "${effectData.name}" to token ${targetToken.name}`);
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
     * Met à jour un effet avec délégation GM (token-based)
     */
    async function updateEffectWithGMDelegation(targetToken, effectId, updateData) {
        if (!globalThis.gmSocket) {
            const error = "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
            ui.notifications.error(error);
            console.error("[DEBUG] GM Socket not available for effect update");
            return { success: false, error };
        }

        try {
            console.log(`[DEBUG] Updating effect ${effectId} on token ${targetToken.name} via GM socket`);
            const result = await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetToken.id, effectId, updateData);

            if (result?.success) {
                console.log(`[DEBUG] Successfully updated effect ${effectId} on token ${targetToken.name}`);
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

    // ===== BOOK COUNT SELECTION DIALOG =====
    async function showBookCountDialog() {
        const baseCostPerBook = SPELL_CONFIG.manaCostPerBook;
        const actualCostPerBook = calculateManaCost(baseCostPerBook, currentStance, SPELL_CONFIG.isFocusable);

        const stanceName = currentStance ?
            (currentStance === 'focus' ? 'Focus' :
                currentStance === 'offensif' ? 'Offensif' :
                    currentStance === 'defensif' ? 'Défensif' : 'Aucune') : 'Aucune';

        const injuryDisplay = characteristicInfo.injuries > 0 ?
            `<span style="color: #d32f2f;">-${characteristicInfo.injuries} (blessures)</span>` :
            '<span style="color: #2e7d32;">Aucune</span>';

        return new Promise((resolve) => {
            new Dialog({
                title: `🛡️ ${SPELL_CONFIG.name}`,
                content: `
                    <div style="padding: 15px; background: #f9f9f9; border-radius: 8px;">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h3 style="margin: 0; color: #333;">🛡️ ${SPELL_CONFIG.name}</h3>
                            <p style="margin: 5px 0; color: #666;"><strong>Lanceur:</strong> ${actor.name}</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Coût par livre:</strong> ${actualCostPerBook} mana (${currentStance || 'Aucune'} ${SPELL_CONFIG.isFocusable ? '- focalisable' : ''})</p>
                            <p style="margin: 5px 0; color: #666;"><strong>Protection par livre:</strong> ${characteristicInfo.final} (Esprit)</p>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: white; border-radius: 4px;">
                            <h4 style="margin-top: 0; color: #555;">📚 Nombre de Livres</h4>
                            <div style="margin: 10px 0;">
                                <label style="display: block; margin-bottom: 8px; cursor: pointer;">
                                    <input type="radio" name="bookCount" value="1" checked style="margin-right: 8px;">
                                    <strong>1 Livre</strong> (${actualCostPerBook} mana)
                                </label>
                                <label style="display: block; cursor: pointer;">
                                    <input type="radio" name="bookCount" value="2" style="margin-right: 8px;">
                                    <strong>2 Livres</strong> (${actualCostPerBook * 2} mana)
                                </label>
                            </div>
                        </div>

                        <div style="margin: 15px 0; padding: 10px; background: #e8f5e8; border-radius: 4px; border: 1px solid #4caf50;">
                            <p style="font-size: 0.9em; margin: 0; color: #2e7d32;">
                                <strong>ℹ️ Effet:</strong> Protection = Esprit × livres sur la cible<br>
                                Cibles multiples possibles, cumul autorisé
                            </p>
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-shield-alt"></i>',
                        label: "Invoquer les Livres",
                        callback: (html) => {
                            const bookCount = parseInt(html.find('input[name="bookCount"]:checked').val());
                            resolve({ bookCount });
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

    const bookSelection = await showBookCountDialog();
    if (!bookSelection) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { bookCount } = bookSelection;
    const totalManaCost = calculateManaCost(SPELL_CONFIG.manaCostPerBook * bookCount, currentStance, SPELL_CONFIG.isFocusable);

    // ===== TARGETING SYSTEM =====
    async function selectTarget(targetNumber) {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            ui.notifications.info(`🎯 Sélectionnez la cible pour le livre ${targetNumber}/${bookCount}`);
            const target = await portal.pick();
            return target;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    // Sélectionner les cibles selon le nombre de livres demandés
    const targets = [];
    for (let i = 1; i <= bookCount; i++) {
        const target = await selectTarget(i);
        if (!target) {
            ui.notifications.info("❌ Ciblage annulé.");
            return;
        }
        targets.push(target);
    }

    // ===== ACTOR DETECTION =====
    function getActorAtLocation(targetX, targetY) {
        console.log(`[DEBUG] Recherche d'acteur à la position: x=${targetX}, y=${targetY}`);
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection
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

            return { name: targetToken.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection
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

            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActors = targets.map(target => getActorAtLocation(target.x, target.y));

    // Analyser les cibles pour déterminer les livres par cible
    const targetAnalysis = {};
    targetActors.forEach((targetActor, index) => {
        if (targetActor) {
            const key = targetActor.actor.id;
            if (!targetAnalysis[key]) {
                targetAnalysis[key] = {
                    actor: targetActor.actor,
                    name: targetActor.name,
                    token: targetActor.token,
                    bookCount: 0,
                    positions: []
                };
            }
            targetAnalysis[key].bookCount++;
            targetAnalysis[key].positions.push(targets[index]);
        }
    });

    const validTargets = Object.values(targetAnalysis).filter(t => t.actor);

    if (validTargets.length === 0) {
        ui.notifications.warn("⚠️ Aucune cible valide trouvée !");
        return;
    }

    // ===== SEQUENCER ANIMATION =====
    async function playSpellAnimation() {
        let sequence = new Sequence();

        // Animation de cast sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.4)

        // Analyser si nous avons 2 livres vers la même cible
        const twoBooksSameTarget = bookCount === 2 &&
            targetActors[0] && targetActors[1] &&
            targetActors[0].actor.id === targetActors[1].actor.id;

        // Pour chaque position de livre
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const targetActor = targetActors[i];
            const isSelfTarget = targetActor && targetActor.actor.id === actor.id;

            // Projectile vers chaque position (sauf si c'est Urgen lui-même)
            if (!isSelfTarget) {
                sequence.effect()
                    .file(SPELL_CONFIG.animations.projectile)
                    .attachTo(caster)
                    .stretchTo(target)
                    .scale(1)
                    .delay(500 + i * 300);
            }

            // Impact à chaque position - mais seulement une fois si même cible
            const shouldPlayImpact = twoBooksSameTarget ? (i === 0) : true;

            if (shouldPlayImpact) {
                sequence.effect()
                    .file(SPELL_CONFIG.animations.impact)
                    .atLocation(target)
                    .scale(0.4)
                    .delay(isSelfTarget ? 500 + i * 200 : 1100);
            }
        }

        // Animation d'attachement sur chaque cible avec un livre
        for (const targetInfo of validTargets) {
            sequence.effect()
                .file(SPELL_CONFIG.animations.attachment)
                .attachTo(targetInfo.token)
                .scale(0.5)
                .duration(6042)
                .delay(1200);
        }

        if (SPELL_CONFIG.animations.sound) {
            sequence.sound()
                .file(SPELL_CONFIG.animations.sound)
                .volume(0.5);
        }

        await sequence.play();
    }

    await playSpellAnimation();

    // ===== DEFENSIVE BOOK ATTACHMENT SYSTEM =====
    const attachmentResults = [];

    for (const targetInfo of validTargets) {
        const result = await handleDefensiveBookAttachment(targetInfo);
        attachmentResults.push(result);
    }

    /**
     * Gère l'attachement des livres défensifs à une cible
     */
    async function handleDefensiveBookAttachment(targetInfo) {
        const booksOnTarget = targetInfo.bookCount;
        const counterValue = characteristicInfo.final * booksOnTarget;
        const effectName = "Livre Défensif";

        console.log(`[DEBUG] Attaching ${booksOnTarget} defensive book(s) to ${targetInfo.name} with counter value ${counterValue}`);

        // Vérifier si l'effet existe déjà sur la cible
        let existingEffect = null;
        for (const effect of targetInfo.actor.effects) {
            if (effect.name === effectName) {
                existingEffect = effect;
                break;
            }
        }

        if (existingEffect) {
            // Mettre à jour l'effet existant
            const currentCounter = existingEffect.flags?.statuscounter?.value || 0;
            const currentBookCount = existingEffect.flags?.BookCount?.value || 0;
            const newCounter = currentCounter + counterValue;
            const newBookCount = currentBookCount + booksOnTarget;

            const updateData = {
                "flags.statuscounter.value": newCounter,
                "flags.BookCount.value": newBookCount
            };

            const updateResult = await updateEffectWithGMDelegation(targetInfo.token, existingEffect.id, updateData);
            if (updateResult.success) {
                console.log(`[DEBUG] Updated existing defensive effect on ${targetInfo.name}: counter ${currentCounter} → ${newCounter}, books ${currentBookCount} → ${newBookCount}`);
                return {
                    success: true,
                    target: targetInfo.name,
                    booksAdded: booksOnTarget,
                    previousCounter: currentCounter,
                    newCounter: newCounter,
                    message: `📚 Livres supplémentaires attachés (${currentCounter} → ${newCounter})`
                };
            } else {
                console.error("Error updating existing defensive effect:", updateResult.error);
                return {
                    success: false,
                    target: targetInfo.name,
                    error: updateResult.error,
                    message: `❌ Erreur mise à jour: ${updateResult.error}`
                };
            }
        } else {
            // Créer un nouvel effet sur la cible
            const effectData = {
                name: effectName,
                icon: "icons/sundries/books/book-symbol-cross-blue.webp",
                description: `Livres défensifs de Urgen. Protection magique active.`,
                disabled: false,
                duration: { seconds: 86400 },
                flags: {
                    statuscounter: {
                        visible: true,
                        value: counterValue
                    },
                    BookCount: {
                        value: booksOnTarget
                    }
                },
                changes: []
            };

            const result = await applyEffectWithGMDelegation(targetInfo.token, effectData);
            if (result.success) {
                console.log(`[DEBUG] Applied new defensive effect to ${targetInfo.name}: counter ${counterValue}, books ${booksOnTarget}`);
                return {
                    success: true,
                    target: targetInfo.name,
                    booksAdded: booksOnTarget,
                    newCounter: counterValue,
                    message: `🛡️ Nouveaux livres défensifs attachés (Protection: ${counterValue})`
                };
            } else {
                console.error(`[DEBUG] Failed to apply defensive effect: ${result.error}`);
                return {
                    success: false,
                    target: targetInfo.name,
                    error: result.error,
                    message: `❌ Erreur application: ${result.error}`
                };
            }
        }
    }

    // ===== UPDATE URGEN'S BOOK COUNTER =====
    const totalBooksCreated = bookCount;
    let urgenBookUpdateResult = { success: false, message: "" };

    // Chercher l'effet "Book" existant sur Urgen
    let urgenBookEffect = null;
    for (const effect of actor.effects) {
        if (effect.name === "Book") {
            urgenBookEffect = effect;
            break;
        }
    }

    if (urgenBookEffect) {
        // Incrementer le counter existant
        const currentCounter = urgenBookEffect.flags?.statuscounter?.value || 0;
        const newCounter = currentCounter + totalBooksCreated;

        const updateData = {
            "flags.statuscounter.value": newCounter
        };

        const result = await updateEffectWithGMDelegation(caster, urgenBookEffect.id, updateData);
        if (result.success) {
            urgenBookUpdateResult = {
                success: true,
                action: "updated",
                previousCount: currentCounter,
                newCount: newCounter,
                message: `📘 Compteur Urgen mis à jour: ${currentCounter} → ${newCounter}`
            };
            console.log(`[DEBUG] Updated Urgen's Book counter: ${currentCounter} → ${newCounter}`);
        } else {
            console.error(`[DEBUG] Failed to update Urgen's Book counter: ${result.error}`);
            urgenBookUpdateResult = {
                success: false,
                error: result.error,
                message: `❌ Erreur mise à jour compteur Urgen: ${result.error}`
            };
        }
    } else {
        // Créer un nouvel effet Book sur Urgen
        const bookEffectData = {
            name: "Book",
            icon: "icons/sundries/books/book-embossed-blue.webp",
            description: "Livres magiques créés et attachés aux alliés",
            disabled: false,
            duration: { seconds: 86400 },
            flags: {
                statuscounter: {
                    visible: true,
                    value: totalBooksCreated
                }
            },
            changes: []
        };

        const result = await applyEffectWithGMDelegation(caster, bookEffectData);
        if (result.success) {
            urgenBookUpdateResult = {
                success: true,
                action: "created",
                newCount: totalBooksCreated,
                message: `📘 Nouveau compteur Urgen créé: ${totalBooksCreated}`
            };
            console.log(`[DEBUG] Created new Book effect on Urgen with counter: ${totalBooksCreated}`);
        } else {
            console.error(`[DEBUG] Failed to create Book effect on Urgen: ${result.error}`);
            urgenBookUpdateResult = {
                success: false,
                error: result.error,
                message: `❌ Erreur création compteur Urgen: ${result.error}`
            };
        }
    }

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const actualManaCostDisplay = totalManaCost === 0 ? 'GRATUIT (Focus)' : `${totalManaCost} mana`;

        // Résultats d'attachement
        const successfulAttachments = attachmentResults.filter(r => r.success);

        const protectionDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>🛡️ ${SPELL_CONFIG.name}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Livres invoqués:</strong> ${bookCount}</div>
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💪 PROTECTION: ${characteristicInfo.final} par livre</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(Basé sur Esprit: ${characteristicInfo.final})</div>
            </div>
        `;

        let targetsDisplay = '';
        if (successfulAttachments.length > 0) {
            const targetList = successfulAttachments.map(r =>
                `${r.target} (+${r.booksAdded} livre${r.booksAdded > 1 ? 's' : ''}: ${r.newCounter} protection)`
            ).join(', ');
            targetsDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #2e7d32; font-weight: bold;">✅ CIBLES PROTÉGÉES</div>
                    <div style="font-size: 0.9em; color: #2e7d32; margin-top: 4px;">${targetList}</div>
                </div>
            `;
        }

        return `
            <div style="background: linear-gradient(135deg, #f5f5f5, #e8f5e8); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">🛡️ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCostDisplay}
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${protectionDisplay}
                ${targetsDisplay}
            </div>
        `;
    }

    const enhancedFlavor = createChatFlavor();



    // Send chat message
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: enhancedFlavor,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const manaCostInfo = totalManaCost === 0 ? ' GRATUIT (Focus)' : ` - ${totalManaCost} mana`;
    const targetInfo = successfulAttachments.length > 0 ?
        ` Cibles protégées: ${successfulAttachments.map(r => r.target).join(', ')}.` : '';

    ui.notifications.info(`${SPELL_CONFIG.name} lancé !${stanceInfo} ${bookCount} livre${bookCount > 1 ? 's' : ''} invoqué${bookCount > 1 ? 's' : ''}${manaCostInfo}.${targetInfo}`);

    console.log(`[DEBUG] Livre Défensif cast complete - Caster: ${actor.name}, Books: ${bookCount}, Targets: ${successfulAttachments.length}, Total Mana: ${totalManaCost}`);

})();
