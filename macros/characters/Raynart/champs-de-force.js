/**
 * Champs de Force - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Raynart canalise la puissance de ses Velkoz pour créer un champ de force protecteur.
 * Chaque Velkoz participe à la défense, créant un bouclier énergétique autour de la cible.
 *
 * MÉCANIQUES :
 * - Coût : 4 mana (focusable)
 * - Détection automatique des Velkoz sur le terrain
 * - Sélection interactive des Velkoz participants
 * - Boost de mana optionnel :
 *   * +1 dé de défense : 4 mana (non-focusable, demi-focus avec Armure Infini)
 *   * +2 dés de défense : 8 mana (non-focusable, demi-focus avec Armure Infini)
 * - Animation simultanée depuis tous les Velkoz vers la cible
 * - Boucliers multiples visuels (un par Velkoz)
 *
 * JET DE DÉFENSE :
 * - Si cible = Raynart : Esprit + bonus manuel + bonus mana + (2 × Velkoz supplémentaires)
 * - Si cible ≠ Raynart : Dextérité + bonus manuel + bonus mana + (2 × Velkoz supplémentaires)
 * - Exemple : 9 Dex, 3 Velkoz, +4 mana = 9 + 1 (base) + 1 (boost) + 4 (2×2 extra Velkoz) = 15d7
 *
 * CAPACITÉ DE BLOCAGE :
 * - Chaque Velkoz peut bloquer jusqu'à 25 dégâts
 * - Total affiché = 25 × nombre de Velkoz utilisés
 *
 * Prerequisites:
 * - Portal module (ciblage)
 * - Sequencer (animations)
 * - JB2A & Animated Spell Effects (effets visuels)
 * - Velkoz invoqués sur le terrain
 *
 * Usage : Sélectionner le token de Raynart et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Champs de Force",
        manaCost: 4,
        isFocusable: true,
        raynartActorId: "4bandVHr1d92RYuL",
        velkozActorId: "DCUdL8S8N6t9eSMF",
        velkozBlockCapacity: 25, // Dégâts max bloqués par Velkoz

        manaBoost: {
            oneDie: {
                cost: 4,
                dice: 1,
                isFocusable: false // Devient demi-focus avec Armure Infini
            },
            twoDice: {
                cost: 8,
                dice: 2,
                isFocusable: false // Devient demi-focus avec Armure Infini
            }
        },

        animation: {
            beam: "animated-spell-effects.energy.beam.ray.02",
            shield: "jb2a_patreon.shield.03.loop.red",
            shieldBaseScale: 0.6,
            shieldRandomScale: 0.1, // Random entre 0 et 0.1
            shieldDuration: 3000
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Veuillez d'abord sélectionner le jeton de Raynart !");
        return;
    }

    const casterToken = canvas.tokens.controlled[0];
    const actor = casterToken.actor;

    if (!actor) {
        ui.notifications.error("❌ Impossible de trouver l'acteur du token sélectionné !");
        return;
    }

    // ===== VÉRIFICATION MODULE PORTAL =====
    if (typeof Portal === "undefined") {
        ui.notifications.error("❌ Le module Portal n'est pas disponible ! Veuillez l'activer.");
        return;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Gets active effect bonuses for a specific flag key
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            if (!effect.flags?.world?.[flagKey]) continue;
            const bonus = parseInt(effect.flags.world[flagKey]);
            if (!isNaN(bonus)) {
                totalBonus += bonus;
                console.log(`[Champs de Force] Active effect "${effect.name}" adds ${bonus} to ${flagKey}`);
            }
        }

        console.log(`[Champs de Force] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`Caractéristique "${characteristic}" introuvable !`);
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

        console.log(`[Champs de Force] ${characteristic}: base=${baseValue}, injuries=${injuryStacks}, effectBonus=${effectBonus}, final=${finalValue}`);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Détecte la stance actuelle de l'acteur
     */
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    /**
     * Check if Armure Infini is active
     */
    function hasArmureInfini(actor) {
        return actor?.effects?.contents?.some(e => e.name === "Armure du Fléau de l'Infini") || false;
    }

    /**
     * Calculate mana cost with Focus stance and Armure Infini
     */
    function calculateManaCost(baseCost, isFocusable, currentStance, hasArmure) {
        let costType = isFocusable ? "focusable" : "non-focusable";

        // Armure Infini modifies non-focusable to demi-focus
        if (hasArmure && !isFocusable) {
            costType = "demi-focus";
        }

        let realCost = baseCost;
        let savedMana = 0;

        if (currentStance === 'focus') {
            if (costType === "focusable") {
                savedMana = baseCost;
                realCost = 0;
            } else if (costType === "demi-focus") {
                savedMana = Math.floor(baseCost / 2);
                realCost = baseCost - savedMana;
            }
        }

        return { realCost, savedMana, costType };
    }

    /**
     * Update Armure Infini counter when mana is saved
     */
    async function updateArmureInfiniCounter(actor, savedMana) {
        if (savedMana <= 0) return;

        const armureEffect = actor.effects.contents.find(e => e.name === "Armure du Fléau de l'Infini");
        if (!armureEffect) return;

        const currentValue = armureEffect.flags?.statuscounter?.value || 0;
        const newValue = currentValue + savedMana;

        await armureEffect.update({
            "flags.statuscounter.value": newValue,
            "flags.statuscounter.visible": true
        });

        console.log(`[Champs de Force] Armure Infini counter updated: ${currentValue} → ${newValue} (+${savedMana})`);
    }

    /**
     * Détecte les Velkoz existants de Raynart sur le terrain
     */
    function getExistingVelkoz() {
        const velkozTokens = [];

        for (const token of canvas.tokens.placeables) {
            const tokenActor = token.actor;
            if (!tokenActor) continue;

            if (tokenActor.id === SPELL_CONFIG.velkozActorId) {
                velkozTokens.push({
                    token: token,
                    name: token.name,
                    id: token.id
                });
            }
        }

        return velkozTokens;
    }

    const currentStance = getCurrentStance(actor);
    const hasArmure = hasArmureInfini(actor);

    // ===== DÉTECTION DES VELKOZ =====
    const velkozTokens = getExistingVelkoz();

    if (velkozTokens.length === 0) {
        ui.notifications.warn("⚠️ Aucun Velkoz n'est actuellement invoqué ! Utilisez d'abord la macro d'invocations.");
        return;
    }

    console.log(`[Champs de Force] Found ${velkozTokens.length} Velkoz on the field`);

    // ===== DIALOGUE DE SÉLECTION DES VELKOZ =====
    async function selectVelkoz() {
        return new Promise((resolve) => {
            let selectedVelkoz = [];

            const velkozRows = velkozTokens.map((velkoz, index) => {
                const isSelected = false;
                const checkedAttr = isSelected ? 'checked' : '';
                const bgColor = isSelected ? '#e3f2fd' : 'white';

                return `
                    <div class="velkoz-row" data-index="${index}" style="
                        padding: 12px;
                        margin: 8px 0;
                        border: 2px solid #ddd;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: ${bgColor};
                    ">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                            <input type="checkbox" class="velkoz-checkbox" data-index="${index}" ${checkedAttr} style="
                                width: 20px;
                                height: 20px;
                                cursor: pointer;
                            " />
                            <span style="font-size: 1.1em; font-weight: bold;">
                                👁️ ${velkoz.name}
                            </span>
                        </label>
                    </div>
                `;
            }).join('');

            const dialogContent = `
                <style>
                    .velkoz-dialog {
                        font-family: "Signika", sans-serif;
                        max-height: 60vh;
                        overflow-y: auto;
                    }
                    .velkoz-row:hover {
                        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                        transform: translateY(-2px);
                    }
                    .velkoz-row.selected {
                        border-color: #e91e63 !important;
                        background: #fce4ec !important;
                    }
                    .stats-section {
                        margin-bottom: 15px;
                        padding: 10px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border-radius: 6px;
                        text-align: center;
                    }
                    .bonus-section {
                        margin-top: 20px;
                        padding: 15px;
                        background: #f5f5f5;
                        border-radius: 6px;
                    }
                    .bonus-input-group {
                        margin-top: 10px;
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    .bonus-input-group label {
                        font-weight: bold;
                        font-size: 13px;
                        color: #333;
                    }
                    .bonus-input-group input,
                    .bonus-input-group select {
                        width: 100%;
                        padding: 8px;
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        font-size: 14px;
                    }
                </style>
                <div class="velkoz-dialog">
                    <div class="stats-section">
                        <strong>🛡️ Champs de Force - Configuration</strong><br>
                        Coût de base : 4 mana (focusable)<br>
                        ${currentStance ? `Position : ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : 'Aucune posture'}
                        ${hasArmure ? '<br><span style="color: #4caf50;">⚡ Armure Infini Active ⚡</span>' : ''}
                    </div>

                    <div style="margin-bottom: 20px;">
                        <h3 style="margin: 0 0 10px 0; border-bottom: 2px solid #333; padding-bottom: 5px;">
                            Sélectionner les Velkoz participants :
                        </h3>
                        ${velkozRows}
                    </div>

                    <div class="bonus-section">
                        <h4 style="margin: 0 0 10px 0;">⚡ Boost de Mana (optionnel)</h4>
                        <p style="font-size: 12px; color: #666; margin-bottom: 10px;">
                            Augmente les dés de défense (non-focusable${hasArmure ? ', demi-focus avec Armure Infini' : ''})
                        </p>
                        <div class="bonus-input-group">
                            <label for="manaBoost">Boost de Mana :</label>
                            <select id="manaBoost">
                                <option value="none">Aucun (0 mana)</option>
                                <option value="one">+1 dé (4 mana)</option>
                                <option value="two">+2 dés (8 mana)</option>
                            </select>
                        </div>
                        <div class="bonus-input-group" style="margin-top: 15px;">
                            <label for="manualBonus">Bonus Manuel (autres sources) :</label>
                            <input type="number" id="manualBonus" value="0" min="0" />
                        </div>
                    </div>
                </div>
            `;

            const dialog = new Dialog({
                title: "🛡️ Champs de Force - Sélection des Velkoz",
                content: dialogContent,
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirmer",
                        callback: (html) => {
                            const selected = [];
                            html.find('.velkoz-checkbox:checked').each(function() {
                                const index = parseInt($(this).data('index'));
                                selected.push(velkozTokens[index]);
                            });

                            const manaBoostSelect = html.find('#manaBoost').val();
                            const manualBonus = parseInt(html.find('#manualBonus').val()) || 0;

                            resolve({
                                velkoz: selected,
                                manaBoost: manaBoostSelect,
                                manualBonus: manualBonus
                            });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "ok",
                render: (html) => {
                    // Interactive selection
                    html.find('.velkoz-row').on('click', function(e) {
                        if (e.target.type === 'checkbox') return;
                        const checkbox = $(this).find('.velkoz-checkbox');
                        checkbox.prop('checked', !checkbox.prop('checked')).trigger('change');
                    });

                    html.find('.velkoz-checkbox').on('change', function() {
                        const row = $(this).closest('.velkoz-row');
                        if ($(this).is(':checked')) {
                            row.addClass('selected');
                        } else {
                            row.removeClass('selected');
                        }
                    });
                },
                close: () => resolve(null)
            });

            dialog.render(true);
        });
    }

    const selectionResult = await selectVelkoz();
    if (!selectionResult || !selectionResult.velkoz || selectionResult.velkoz.length === 0) {
        ui.notifications.info("❌ Sort annulé - aucun Velkoz sélectionné.");
        return;
    }

    const selectedVelkoz = selectionResult.velkoz;
    const manaBoostOption = selectionResult.manaBoost;
    const manualBonus = selectionResult.manualBonus;

    console.log(`[Champs de Force] Selected ${selectedVelkoz.length} Velkoz, mana boost: ${manaBoostOption}, manual bonus: ${manualBonus}`);

    // ===== CALCUL DES COÛTS EN MANA =====
    const baseCostCalc = calculateManaCost(SPELL_CONFIG.manaCost, SPELL_CONFIG.isFocusable, currentStance, hasArmure);
    let totalManaCost = baseCostCalc.realCost;
    let totalSavedMana = baseCostCalc.savedMana;

    let manaBoostDice = 0;
    let manaBoostCost = 0;

    if (manaBoostOption === "one") {
        manaBoostDice = SPELL_CONFIG.manaBoost.oneDie.dice;
        const boostCalc = calculateManaCost(SPELL_CONFIG.manaBoost.oneDie.cost, SPELL_CONFIG.manaBoost.oneDie.isFocusable, currentStance, hasArmure);
        manaBoostCost = boostCalc.realCost;
        totalSavedMana += boostCalc.savedMana;
    } else if (manaBoostOption === "two") {
        manaBoostDice = SPELL_CONFIG.manaBoost.twoDice.dice;
        const boostCalc = calculateManaCost(SPELL_CONFIG.manaBoost.twoDice.cost, SPELL_CONFIG.manaBoost.twoDice.isFocusable, currentStance, hasArmure);
        manaBoostCost = boostCalc.realCost;
        totalSavedMana += boostCalc.savedMana;
    }

    totalManaCost += manaBoostCost;

    console.log(`[Champs de Force] Base cost: ${baseCostCalc.realCost}, Boost cost: ${manaBoostCost}, Total: ${totalManaCost}, Saved: ${totalSavedMana}`);

    // Update Armure Infini counter if mana was saved
    if (totalSavedMana > 0 && hasArmure) {
        await updateArmureInfiniCounter(actor, totalSavedMana);
    }

    // ===== CIBLAGE AVEC PORTAL =====
    console.log(`[Champs de Force] Initiating Portal targeting for protected target`);

    ui.notifications.info("🛡️ Sélectionnez la cible à protéger...");

    let targetLocation;
    try {
        const portalInstance = new Portal()
            .color("#4caf50")
            .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm");

        targetLocation = await portalInstance.pick();
    } catch (error) {
        console.warn(`[Champs de Force] Portal targeting cancelled or failed:`, error);
        ui.notifications.warn("❌ Ciblage annulé.");
        return;
    }

    if (!targetLocation) {
        ui.notifications.warn("❌ Aucune cible sélectionnée !");
        return;
    }

    // Trouver le token à cette position
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

    const targetToken = getTokenAtLocation(targetLocation.x, targetLocation.y);
    if (!targetToken) {
        ui.notifications.warn("⚠️ Aucun token trouvé à la position ciblée !");
        return;
    }

    console.log(`[Champs de Force] Target token identified: ${targetToken.name}`);

    // ===== DÉTERMINER LA CARACTÉRISTIQUE DE DÉFENSE =====
    const isRaynart = targetToken.actor?.id === SPELL_CONFIG.raynartActorId;
    const defensiveCharacteristic = isRaynart ? "esprit" : "dexterite";
    const characteristicInfo = getCharacteristicValue(actor, defensiveCharacteristic);

    if (!characteristicInfo) {
        ui.notifications.error("❌ Impossible de récupérer la caractéristique de défense !");
        return;
    }

    console.log(`[Champs de Force] Using ${defensiveCharacteristic} for defense (target ${isRaynart ? 'is' : 'is not'} Raynart)`);

    // ===== CALCUL DES DÉS DE DÉFENSE =====
    const baseDice = characteristicInfo.final; // Caractéristique (Esprit ou Dex)
    const extraVelkozDice = Math.max(0, (selectedVelkoz.length - 1) * 2); // 2 dés par Velkoz supplémentaire
    const totalDice = baseDice + manualBonus + manaBoostDice + extraVelkozDice;

    console.log(`[Champs de Force] Defense dice: ${baseDice} (char) + ${manualBonus} (manual) + ${manaBoostDice} (boost) + ${extraVelkozDice} (extra velkoz) = ${totalDice}d7`);

    // ===== ANIMATIONS SIMULTANÉES =====
    console.log(`[Champs de Force] Playing animations for ${selectedVelkoz.length} Velkoz beams`);

    const animationSequence = new Sequence();

    // Rayons depuis chaque Velkoz vers la cible (simultanés)
    for (let i = 0; i < selectedVelkoz.length; i++) {
        const velkoz = selectedVelkoz[i];
        const velkozAnimation = new Sequence();

        velkozAnimation
            .effect()
            .file(SPELL_CONFIG.animation.beam)
            .atLocation(velkoz.token)
            .stretchTo(targetToken)
            .play();
    }

    // Boucliers sur la cible (un par Velkoz)
    for (let i = 0; i < selectedVelkoz.length; i++) {
        const randomScale = Math.random() * SPELL_CONFIG.animation.shieldRandomScale;
        const shieldScale = SPELL_CONFIG.animation.shieldBaseScale + randomScale;

        animationSequence
            .effect()
            .file(SPELL_CONFIG.animation.shield)
            .attachTo(targetToken)
            .scale(shieldScale)
            .opacity(0.8)
            .duration(SPELL_CONFIG.animation.shieldDuration)
            .fadeIn(200)
            .fadeOut(500);
    }

    await animationSequence.play();

    // ===== JET DE DÉFENSE =====
    const defenseRoll = new Roll(`${totalDice}d7`);
    await defenseRoll.evaluate({ async: true });

    const totalBlockCapacity = selectedVelkoz.length * SPELL_CONFIG.velkozBlockCapacity;

    // ===== MESSAGE DANS LE CHAT =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const manaCostDisplay = totalManaCost === 0 && totalSavedMana > 0
        ? `GRATUIT (${totalSavedMana} mana économisée)`
        : totalSavedMana > 0
            ? `${totalManaCost} mana (${totalSavedMana} économisée)`
            : `${totalManaCost} mana`;

    const boostInfo = manaBoostDice > 0
        ? `<p><strong>Boost de Mana:</strong> +${manaBoostDice} dé${manaBoostDice > 1 ? 's' : ''} (${manaBoostCost} mana${hasArmure ? ' - demi-focus' : ''})</p>`
        : '';

    const manualBonusInfo = manualBonus > 0
        ? `<p><strong>Bonus Manuel:</strong> +${manualBonus}</p>`
        : '';

    const velkozList = selectedVelkoz.map(v => `👁️ ${v.name}`).join(', ');

    const chatContent = `
        <div class="spell-result" style="font-family: 'Signika', sans-serif;">
            <h3 style="border-bottom: 2px solid #e91e63; padding-bottom: 5px;">
                🛡️ ${SPELL_CONFIG.name}
            </h3>
            <p><strong>Lanceur:</strong> ${actor.name}${stanceInfo}</p>
            <p><strong>Cible Protégée:</strong> ${targetToken.name}</p>
            <p><strong>Coût:</strong> ${manaCostDisplay}</p>
            ${boostInfo}
            ${manualBonusInfo}
            <hr style="margin: 10px 0;" />
            <p><strong>Velkoz Utilisés:</strong> ${velkozList}</p>
            <p><strong>Caractéristique:</strong> ${defensiveCharacteristic === "esprit" ? "Esprit" : "Dextérité"} ${characteristicInfo.final}</p>
            <p><strong>Calcul des dés:</strong></p>
            <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
                <li>${defensiveCharacteristic === "esprit" ? "Esprit" : "Dextérité"}: ${baseDice} dés</li>
                ${manualBonus > 0 ? `<li>Bonus manuel: +${manualBonus} dé${manualBonus > 1 ? 's' : ''}</li>` : ''}
                ${manaBoostDice > 0 ? `<li>Boost de mana: +${manaBoostDice} dé${manaBoostDice > 1 ? 's' : ''}</li>` : ''}
                ${extraVelkozDice > 0 ? `<li>Velkoz supplémentaires: +${extraVelkozDice} dés (${selectedVelkoz.length - 1} × 2)</li>` : ''}
            </ul>
            <p><strong>Jet de Défense:</strong> ${totalDice}d7 = ${defenseRoll.total}</p>
            <hr style="margin: 10px 0;" />
            <p style="font-size: 1.1em; color: #e91e63;"><strong>🛡️ Capacité de Blocage: ${totalBlockCapacity} dégâts maximum</strong></p>
            <p style="font-size: 0.85em; color: #666;">(${SPELL_CONFIG.velkozBlockCapacity} dégâts/Velkoz × ${selectedVelkoz.length} Velkoz)</p>
        </div>
    `;

    await defenseRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: casterToken }),
        flavor: chatContent,
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== NOTIFICATION FINALE =====
    const notificationText = `🛡️ ${SPELL_CONFIG.name} : ${selectedVelkoz.length} Velkoz protègent ${targetToken.name} ! (${totalBlockCapacity} dégâts max)`;
    ui.notifications.info(notificationText);

    console.log(`[Champs de Force] Spell complete - ${selectedVelkoz.length} Velkoz, ${totalDice}d7 defense, ${totalBlockCapacity} block capacity`);

})();
