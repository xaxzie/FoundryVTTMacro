/**
 * IronMegumin - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Raynart fait exploser simultanément ses invocations mécaniques, créant des explosions dévastatrices.
 * Chaque invocation devient une bombe qui inflige des dégâts à toutes les cibles dans un rayon de 2 cases.
 *
 * MÉCANIQUES :
 * - Coût : 7 mana (demi-focalisable, arrondi inférieur)
 * - Armure Infini compatible : Peut devenir focalisable
 * - Jet d'attaque : 1 jet unique pour TOUTES les explosions (Esprit, Sort niveau 2)
 * - Dégâts : 1d6 + Esprit/2 par explosion
 * - Les cibles subissent la moitié des dégâts même sur esquive réussie
 * - Pas de bonus de dégâts des effets actifs (seuls bonus de stats)
 * - Zone d'effet : 2 cases de rayon autour de chaque invocation
 * - Limite : Maximum 3 explosions par cible (3 meilleurs résultats)
 *
 * INVOCATIONS EXPLOSIVES :
 * - Mur Mécanique (Complexité 0)
 * - Balliste (Complexité 1)
 * - Gatling (Complexité 2)
 * - Araignée Mécanique (Complexité 0)
 * - ParaTonnerre (Complexité 1)
 * - Velkoz (Complexité 1)
 *
 * WORKFLOW :
 * 1. Détection de Raynart (ActorID: 4bandVHr1d92RYuL)
 * 2. Détection de toutes les invocations sur le canvas
 * 3. Pré-sélection des tokens contrôlés qui sont des invocations
 * 4. Dialogue de sélection avec aperçu des cibles (2 cases de rayon)
 * 5. Résumé des cibles touchées et nombre d'explosions par cible
 * 6. Jet d'attaque unique pour toutes les explosions
 * 7. Jets de dégâts individuels par explosion
 * 8. Animations simultanées avec délai aléatoire 0-200ms
 * 9. Destruction des invocations et mise à jour InvocationsComplexe
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
        name: "IronMegumin",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        baseMana: 7,
        costType: "demi-focus", // demi-focalisable
        spellLevel: 2,
        damageFormula: "1d6",
        damageBonus: "esprit / 2", // Arrondi inférieur automatique
        effectRadius: 2.5, // En cases
        maxExplosionsPerTarget: 3,
        raynartActorId: "4bandVHr1d92RYuL",

        // Configuration des invocations (depuis HandleRaynartInvocations)
        invocationTypes: {
            murMecanique: {
                name: "Mur Mécanique",
                displayName: "🛡️ Mur Mécanique",
                actorId: "9NXEFMzzBF3nmByB",
                complexityValue: 0,
                color: "#757575"
            },
            balliste: {
                name: "Balliste",
                displayName: "🎯 Balliste",
                actorId: "FQzsrD4o20avg7co",
                complexityValue: 1,
                color: "#f44336"
            },
            gatling: {
                name: "Gatling",
                displayName: "⚔️ Gatling",
                actorId: "M7oAyZmgzi5XEYNE",
                complexityValue: 2,
                color: "#9c27b0"
            },
            araignee: {
                name: "Araignée Mécanique",
                displayName: "🕷️ Araignée Mécanique",
                actorId: "P0NlGCJh7r6K5yuc",
                complexityValue: 0,
                color: "#795548"
            },
            paratonnerre: {
                name: "ParaTonnerre",
                displayName: "⚡ ParaTonnerre",
                actorId: "pJuR9WIyouueE6Kv",
                complexityValue: 1,
                color: "#ffc107"
            },
            velkoz: {
                name: "Velkoz",
                displayName: "👁️ Velkoz",
                actorId: "DCUdL8S8N6t9eSMF",
                complexityValue: 1,
                color: "#e91e63"
            }
        },

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

    console.log(`[IronMegumin] Raynart detected: ${raynartActor.name} at (${raynartToken.x}, ${raynartToken.y})`);

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

        console.log(`[IronMegumin] Total ${flagKey} bonus from active effects: ${totalBonus}`);
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

        console.log(`[IronMegumin] ${characteristic}: base=${baseValue}, injuries=${injuryStacks}, effectBonus=${effectBonus}, final=${finalValue}`);

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
     * Adapté de HandleRaynartEffect.js
     */
    function calculateManaCost(baseCost, costType, actor, currentStance) {
        const hasArmureInfini = actor.effects.contents.some(e =>
            e.name === "Armure du Fléau de l'Infini"
        );

        let realCost = baseCost;
        let savedMana = 0;
        let savedByArmure = 0;
        let displayMessage = "";
        let modifiedCostType = costType;

        // Préserver le type de coût original pour déterminer si l'armure aide
        const originalCostType = costType;

        // Armure Infini modifie le type de coût
        if (hasArmureInfini) {
            if (costType === "non-focusable") {
                modifiedCostType = "demi-focus";
            } else if (costType === "demi-focus") {
                modifiedCostType = "focusable";
            }
        }

        // Appliquer la stance Focus selon le type (modifié ou non)
        if (currentStance === "focus") {
            if (modifiedCostType === "focusable") {
                savedMana = baseCost;
                realCost = 0;

                // Déterminer si l'armure a aidé
                if (hasArmureInfini && originalCostType === "demi-focus") {
                    // L'armure a transformé demi-focus → focusable
                    savedByArmure = Math.floor(baseCost / 2);
                    displayMessage = `GRATUIT (Demi-focus → Focusable par Armure, Position Focus)`;
                } else if (originalCostType === "focusable") {
                    // Déjà focusable, l'armure n'a pas aidé
                    savedByArmure = 0;
                    displayMessage = `GRATUIT (Focusable, Position Focus)`;
                }

            } else if (modifiedCostType === "demi-focus") {
                realCost = Math.ceil(baseCost / 2);
                savedMana = Math.floor(baseCost / 2);

                // Si l'armure a transformé non-focusable → demi-focus
                if (hasArmureInfini && originalCostType === "non-focusable") {
                    savedByArmure = Math.floor(baseCost / 2);
                    displayMessage = `${realCost} mana (Non-focusable → Demi-focus par Armure, Position Focus)`;
                } else {
                    savedByArmure = 0;
                    displayMessage = `${realCost} mana (Demi-focalisable, Position Focus)`;
                }
            } else {
                // Non-focusable même avec armure
                savedMana = 0;
                savedByArmure = 0;
                displayMessage = `${realCost} mana (Non-focusable)`;
            }
        } else {
            // Pas en Focus
            if (modifiedCostType === "demi-focus") {
                realCost = Math.ceil(baseCost / 2);
                if (hasArmureInfini && originalCostType === "non-focusable") {
                    displayMessage = `${realCost} mana (Non-focusable → Demi-focus par Armure)`;
                } else {
                    displayMessage = `${realCost} mana (Demi-focalisable)`;
                }
            } else if (modifiedCostType === "focusable") {
                if (hasArmureInfini && originalCostType === "demi-focus") {
                    displayMessage = `${realCost} mana (Demi-focus → Focusable par Armure, hors Focus)`;
                } else {
                    displayMessage = `${realCost} mana (Focusable, hors Focus)`;
                }
            } else {
                displayMessage = `${realCost} mana`;
            }
        }

        return {
            realCost,
            savedMana,
            savedByArmure,
            displayMessage,
            modifiedCostType
        };
    }

    /**
     * Met à jour le compteur Armure Infini
     */
    async function updateArmureInfiniCounter(actor, manaToAdd) {
        const armureEffect = actor.effects.contents.find(e =>
            e.name === "Armure du Fléau de l'Infini"
        );

        if (!armureEffect) return;

        const currentValue = armureEffect.flags?.statuscounter?.value || 0;
        const newValue = currentValue + manaToAdd;

        await armureEffect.update({
            'flags.statuscounter.value': newValue
        });

        console.log(`[IronMegumin] Armure Infini counter: ${currentValue} → ${newValue}`);
    }

    /**
     * Met à jour le compteur InvocationsComplexe sur Raynart
     */
    async function updateInvocationsComplexeCounter(actor, delta) {
        if (delta === 0) return;

        let invocationsEffect = actor.effects.contents.find(e =>
            e.name === "InvocationsComplexe"
        );

        if (!invocationsEffect) {
            console.log(`[IronMegumin] No InvocationsComplexe effect found, cannot update`);
            return;
        }

        const currentValue = invocationsEffect.flags?.statuscounter?.value || 0;
        const newValue = Math.max(0, currentValue + delta);

        await invocationsEffect.update({
            'flags.statuscounter.value': newValue
        });

        console.log(`[IronMegumin] InvocationsComplexe counter: ${currentValue} → ${newValue} (delta: ${delta})`);
    }

    /**
     * Détecte les invocations existantes de Raynart sur le terrain
     */
    function getExistingInvocations() {
        const invocations = {};

        for (const [key, config] of Object.entries(SPELL_CONFIG.invocationTypes)) {
            invocations[key] = [];
        }

        // Parcourir tous les tokens de la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            for (const [key, config] of Object.entries(SPELL_CONFIG.invocationTypes)) {
                if (token.actor.id === config.actorId) {
                    invocations[key].push({
                        token: token,
                        actor: token.actor,
                        name: token.name,
                        x: token.x,
                        y: token.y,
                        config: config
                    });
                }
            }
        }

        return invocations;
    }

    /**
     * Trouve toutes les cibles dans un rayon donné (en cases) autour d'une position
     * Exclut les invocations de Raynart des cibles potentielles
     */
    function findTargetsInRadius(centerX, centerY, radiusCases, excludeToken = null) {
        const gridSize = canvas.grid.size;
        const radiusPixels = radiusCases * gridSize;
        const targets = [];

        // Créer un Set des ActorIDs des invocations de Raynart pour une recherche rapide
        const invocationActorIds = new Set(
            Object.values(SPELL_CONFIG.invocationTypes).map(config => config.actorId)
        );

        for (const token of canvas.tokens.placeables) {
            if (excludeToken && token.id === excludeToken.id) continue;
            if (!token.actor) continue;

            // Exclure les invocations de Raynart des cibles
            if (invocationActorIds.has(token.actor.id)) continue;

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

    // ===== DETECT INVOCATIONS =====
    const allInvocations = getExistingInvocations();
    const flatInvocations = [];

    for (const [key, invocList] of Object.entries(allInvocations)) {
        for (const invoc of invocList) {
            invoc.key = key;
            flatInvocations.push(invoc);
        }
    }

    if (flatInvocations.length === 0) {
        ui.notifications.warn("⚠️ Aucune invocation de Raynart n'est actuellement sur le terrain !");
        return;
    }

    console.log(`[IronMegumin] Found ${flatInvocations.length} invocations on canvas`);

    // ===== PRE-SELECT CONTROLLED TOKENS =====
    const controlledTokenIds = new Set(canvas.tokens.controlled.map(t => t.id));
    const preSelectedInvocations = flatInvocations.filter(inv => controlledTokenIds.has(inv.token.id));

    console.log(`[IronMegumin] Pre-selected ${preSelectedInvocations.length} controlled invocations`);

    // ===== CALCULATE TARGETS FOR EACH INVOCATION =====
    const invocationTargetMap = new Map();

    for (const invoc of flatInvocations) {
        const gridSize = canvas.grid.size;
        // Calculer le centre réel du token en utilisant sa taille en cases
        const tokenWidthInPixels = invoc.token.document.width * gridSize;
        const tokenHeightInPixels = invoc.token.document.height * gridSize;
        const centerX = invoc.x + (tokenWidthInPixels / 2);
        const centerY = invoc.y + (tokenHeightInPixels / 2);
        console.log(`[IronMegumin] Centre explosion pour ${invoc.name}: (${centerX}, ${centerY})`);
        const targets = findTargetsInRadius(centerX, centerY, SPELL_CONFIG.effectRadius, invoc.token);
        invocationTargetMap.set(invoc.token.id, targets);
    }

    // ===== DIALOG DE SÉLECTION DES INVOCATIONS =====
    let selectedInvocations = new Set(preSelectedInvocations.map(inv => inv.token.id));

    async function showInvocationDialog() {
        return new Promise((resolve) => {
            // Calculer le résumé des cibles touchées
            function calculateTargetSummary() {
                const targetExplosionCount = new Map(); // tokenId -> count

                for (const invocId of selectedInvocations) {
                    const targets = invocationTargetMap.get(invocId) || [];
                    for (const target of targets) {
                        const count = targetExplosionCount.get(target.token.id) || 0;
                        targetExplosionCount.set(target.token.id, count + 1);
                    }
                }

                return targetExplosionCount;
            }

            function buildDialogContent() {
                const targetSummary = calculateTargetSummary();

                let html = `
                    <style>
                        .ironmegumin-dialog { font-family: 'Signika', sans-serif; }
                        .invocation-section { margin-bottom: 15px; border: 2px solid #ddd; border-radius: 8px; padding: 10px; background: #f9f9f9; }
                        .invocation-header { font-weight: bold; margin-bottom: 8px; padding: 8px; border-radius: 4px; color: white; cursor: pointer; user-select: none; }
                        .invocation-list { display: flex; flex-direction: column; gap: 8px; }
                        .invocation-item { display: flex; align-items: center; padding: 8px; border: 1px solid #ccc; border-radius: 4px; background: white; }
                        .invocation-item.selected { background: #e3f2fd; border-color: #2196f3; }
                        .invocation-checkbox { margin-right: 10px; cursor: pointer; }
                        .invocation-name { flex: 1; font-weight: bold; }
                        .invocation-targets { font-size: 0.9em; color: #666; }
                        .target-summary { margin-top: 20px; padding: 15px; background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; }
                        .target-summary h4 { margin: 0 0 10px 0; color: #ff9800; }
                        .target-list { max-height: 200px; overflow-y: auto; }
                        .target-item { padding: 6px; margin: 4px 0; background: white; border-radius: 4px; border: 1px solid #ddd; }
                        .target-item.multiple { border-color: #f44336; background: #ffebee; }
                        .target-item.capped { border-color: #9c27b0; background: #f3e5f5; font-weight: bold; }
                        .global-buttons { display: flex; gap: 10px; margin-bottom: 15px; }
                        .global-button { flex: 1; padding: 8px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
                        .select-all { background: #4caf50; color: white; }
                        .select-all:hover { background: #45a049; }
                        .deselect-all { background: #f44336; color: white; }
                        .deselect-all:hover { background: #da190b; }
                    </style>
                    <div class="ironmegumin-dialog">
                        <h3 style="color: #ff6600; margin-bottom: 15px;">💥 IronMegumin - Sélection des Invocations</h3>
                        <p style="margin-bottom: 15px;">Sélectionnez les invocations à faire exploser. Les cibles dans un rayon de 2 cases seront affectées.</p>

                        <div class="global-buttons">
                            <button class="global-button select-all" onclick="selectAllInvocations()">✓ Tout Sélectionner</button>
                            <button class="global-button deselect-all" onclick="deselectAllInvocations()">✗ Tout Désélectionner</button>
                        </div>
                `;

                // Grouper par type d'invocation
                const groupedInvocations = {};
                for (const invoc of flatInvocations) {
                    if (!groupedInvocations[invoc.key]) {
                        groupedInvocations[invoc.key] = [];
                    }
                    groupedInvocations[invoc.key].push(invoc);
                }

                for (const [key, invocList] of Object.entries(groupedInvocations)) {
                    const config = SPELL_CONFIG.invocationTypes[key];
                    const allSelected = invocList.every(inv => selectedInvocations.has(inv.token.id));

                    html += `
                        <div class="invocation-section">
                            <div class="invocation-header" style="background: ${config.color};" onclick="toggleCategory('${key}')">
                                ${config.displayName} (${invocList.length})
                            </div>
                            <div class="invocation-list" id="category-${key}">
                    `;

                    for (let i = 0; i < invocList.length; i++) {
                        const invoc = invocList[i];
                        const isSelected = selectedInvocations.has(invoc.token.id);
                        const targets = invocationTargetMap.get(invoc.token.id) || [];
                        const targetNames = targets.length > 0
                            ? targets.map(t => t.name).join(', ')
                            : 'Aucune cible';

                        html += `
                            <div class="invocation-item ${isSelected ? 'selected' : ''}" id="invoc-${invoc.token.id}">
                                <input type="checkbox" class="invocation-checkbox"
                                    ${isSelected ? 'checked' : ''}
                                    onchange="toggleInvocation('${invoc.token.id}')" />
                                <span class="invocation-name">${invoc.name}</span>
                                <span class="invocation-targets">(${targets.length} cible${targets.length > 1 ? 's' : ''}: ${targetNames})</span>
                            </div>
                        `;
                    }

                    html += `
                            </div>
                        </div>
                    `;
                }

                // Résumé des cibles
                html += `
                    <div class="target-summary">
                        <h4>📊 Résumé des Cibles Touchées</h4>
                `;

                if (targetSummary.size === 0) {
                    html += `<p style="color: #999;">Aucune cible ne sera touchée.</p>`;
                } else {
                    // Trier par nombre d'explosions (décroissant)
                    const sortedTargets = Array.from(targetSummary.entries())
                        .sort((a, b) => b[1] - a[1]);

                    html += `<div class="target-list">`;
                    for (const [tokenId, count] of sortedTargets) {
                        const token = canvas.tokens.get(tokenId);
                        if (!token) continue;

                        const cappedClass = count > SPELL_CONFIG.maxExplosionsPerTarget ? 'capped' : (count > 1 ? 'multiple' : '');
                        const displayCount = Math.min(count, SPELL_CONFIG.maxExplosionsPerTarget);
                        const cappedText = count > SPELL_CONFIG.maxExplosionsPerTarget ? ` (limité à ${SPELL_CONFIG.maxExplosionsPerTarget})` : '';

                        html += `
                            <div class="target-item ${cappedClass}">
                                <strong>${token.name}</strong>: ${displayCount} explosion${displayCount > 1 ? 's' : ''}${cappedText}
                            </div>
                        `;
                    }
                    html += `</div>`;
                }

                html += `
                    </div>
                    </div>
                `;

                return html;
            }

            // Fonctions globales pour l'interaction
            window.toggleInvocation = (tokenId) => {
                if (selectedInvocations.has(tokenId)) {
                    selectedInvocations.delete(tokenId);
                } else {
                    selectedInvocations.add(tokenId);
                }

                // Mettre à jour l'UI
                const item = document.getElementById(`invoc-${tokenId}`);
                if (item) {
                    if (selectedInvocations.has(tokenId)) {
                        item.classList.add('selected');
                    } else {
                        item.classList.remove('selected');
                    }
                }

                // Reconstruire le résumé des cibles
                updateTargetSummary();
            };

            window.toggleCategory = (key) => {
                const invocList = flatInvocations.filter(inv => inv.key === key);
                const allSelected = invocList.every(inv => selectedInvocations.has(inv.token.id));

                if (allSelected) {
                    // Désélectionner tous
                    for (const invoc of invocList) {
                        selectedInvocations.delete(invoc.token.id);
                    }
                } else {
                    // Sélectionner tous
                    for (const invoc of invocList) {
                        selectedInvocations.add(invoc.token.id);
                    }
                }

                // Reconstruire le dialogue
                const content = buildDialogContent();
                const dialogContent = document.querySelector('.ironmegumin-dialog').parentElement;
                dialogContent.innerHTML = content;
            };

            window.selectAllInvocations = () => {
                selectedInvocations = new Set(flatInvocations.map(inv => inv.token.id));
                const content = buildDialogContent();
                const dialogContent = document.querySelector('.ironmegumin-dialog').parentElement;
                dialogContent.innerHTML = content;
            };

            window.deselectAllInvocations = () => {
                selectedInvocations.clear();
                const content = buildDialogContent();
                const dialogContent = document.querySelector('.ironmegumin-dialog').parentElement;
                dialogContent.innerHTML = content;
            };

            window.updateTargetSummary = () => {
                const content = buildDialogContent();
                const dialogContent = document.querySelector('.ironmegumin-dialog').parentElement;
                dialogContent.innerHTML = content;
            };

            const dialogContent = buildDialogContent();

            new Dialog({
                title: "💥 IronMegumin",
                content: dialogContent,
                buttons: {
                    cast: {
                        label: "💥 Faire Exploser !",
                        callback: () => resolve({ confirmed: true })
                    },
                    cancel: {
                        label: "❌ Annuler",
                        callback: () => resolve({ confirmed: false })
                    }
                },
                default: "cast",
                close: () => resolve({ confirmed: false })
            }, {
                width: 700,
                height: 800
            }).render(true);
        });
    }

    const dialogResult = await showInvocationDialog();

    // Nettoyer les fonctions globales
    delete window.toggleInvocation;
    delete window.toggleCategory;
    delete window.selectAllInvocations;
    delete window.deselectAllInvocations;
    delete window.updateTargetSummary;

    if (!dialogResult.confirmed || selectedInvocations.size === 0) {
        ui.notifications.info("❌ IronMegumin annulé.");
        return;
    }

    // ===== PREPARE SELECTED INVOCATIONS =====
    const selectedInvocList = flatInvocations.filter(inv => selectedInvocations.has(inv.token.id));
    console.log(`[IronMegumin] ${selectedInvocList.length} invocations selected for detonation`);

    // ===== CALCULATE TARGETS FOR SELECTED INVOCATIONS =====
    const targetExplosionMap = new Map(); // tokenId -> { token, actor, name, explosions: [damageRolls] }

    for (const invoc of selectedInvocList) {
        const targets = invocationTargetMap.get(invoc.token.id) || [];

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
                invocation: invoc,
                damageRoll: null // Sera rempli après les jets de dés
            });
        }
    }

    console.log(`[IronMegumin] ${targetExplosionMap.size} unique targets will be affected`);

    // ===== CALCULATE MANA COST =====
    const currentStance = getCurrentStance(raynartActor);
    const characteristicInfo = getCharacteristicValue(raynartActor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    const costCalc = calculateManaCost(
        SPELL_CONFIG.baseMana,
        SPELL_CONFIG.costType,
        raynartActor,
        currentStance
    );

    console.log(`[IronMegumin] Mana cost: ${costCalc.realCost} (${costCalc.displayMessage})`);

    // Mettre à jour le compteur Armure Infini si nécessaire
    if (costCalc.savedByArmure > 0) {
        await updateArmureInfiniCounter(raynartActor, costCalc.savedByArmure);
    }

    // ===== SINGLE ATTACK ROLL FOR ALL EXPLOSIONS =====
    const spellLevelBonus = SPELL_CONFIG.spellLevel * 2;
    const totalAttackDice = characteristicInfo.final;
    const attackFormula = `${totalAttackDice}d7 + ${spellLevelBonus}`;
    const attackRoll = new Roll(attackFormula);
    await attackRoll.evaluate({ async: true });

    console.log(`[IronMegumin] Attack roll: ${attackRoll.formula} = ${attackRoll.total}`);

    // ===== PREPARE DAMAGE FORMULA =====
    const espritBonus = Math.floor(characteristicInfo.final / 2);
    const damageFormula = `${SPELL_CONFIG.damageFormula} + ${espritBonus}`;

    // Maximiser les dés en stance offensive
    const isOffensive = currentStance === 'offensif';

    // ===== ANIMATIONS SIMULTANÉES =====
    async function playAllExplosions() {
        const allSequences = [];

        for (const invoc of selectedInvocList) {
            // Délai aléatoire entre 0 et 200ms

            const sequence = new Sequence()
                .effect()
                    .file(SPELL_CONFIG.animation.cast)
                    .atLocation(invoc.token)
                    .scale({ x: 1, y: 1 })
                    .anchor({ x: 0.5, y: 0.5 })
                    .delay(0, 200)
                .wait(1000)
                .effect()
                    .file(SPELL_CONFIG.animation.pulse)
                    .atLocation(invoc.token)
                    .scale({ x: 1, y: 1 })
                    .anchor({ x: 0.5, y: 0.5 })
                .wait(300)
                .effect()
                    .file(SPELL_CONFIG.animation.shatter)
                    .atLocation(invoc.token)
                    .scale({ x: 1, y: 1 })
                    .anchor({ x: 0.5, y: 0.5 })
                .wait(1300)
                .effect()
                    .file(SPELL_CONFIG.animation.explosion1)
                    .atLocation(invoc.token)
                    .scale({ x: 1.5, y: 1.5 })
                    .anchor({ x: 0.5, y: 0.5 })
                .effect()
                    .file(SPELL_CONFIG.animation.explosion2)
                    .atLocation(invoc.token)
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

    // ===== DESTRUCTION DES INVOCATIONS =====
    let totalComplexityReduction = 0;

    for (const invoc of selectedInvocList) {
        totalComplexityReduction += invoc.config.complexityValue;
        await invoc.token.document.delete();
        console.log(`[IronMegumin] Destroyed ${invoc.name} (complexity: ${invoc.config.complexityValue})`);
    }

    // Mettre à jour le compteur InvocationsComplexe
    if (totalComplexityReduction > 0) {
        await updateInvocationsComplexeCounter(raynartActor, -totalComplexityReduction);
    }

    // ===== COMBINED ROLL FOR CHAT MESSAGE =====
    // Créer un roll combiné avec l'attaque et tous les jets de dégâts
    const allRollFormulas = [attackFormula];

    // Ajouter tous les jets de dégâts au roll combiné
    for (const invoc of selectedInvocList) {
        allRollFormulas.push(damageFormula);
    }

    const combinedRoll = new Roll(`{${allRollFormulas.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extraire le résultat d'attaque
    const attackResult = combinedRoll.terms[0].results[0].result;

    // Extraire les résultats de dégâts et les assigner aux invocations
    for (let i = 0; i < selectedInvocList.length; i++) {
        const invoc = selectedInvocList[i];
        const damageResult = combinedRoll.terms[0].results[i + 1].result;

        let finalDamage = damageResult;

        if (isOffensive) {
            // Maximiser le dé: 1d6 = 6
            finalDamage = 6 + espritBonus;
        }

        // Associer le jet de dégâts à toutes les cibles touchées par cette invocation
        const targets = invocationTargetMap.get(invoc.token.id) || [];
        for (const target of targets) {
            const targetData = targetExplosionMap.get(target.token.id);
            if (targetData) {
                const explosionIndex = targetData.explosions.findIndex(e =>
                    e.invocation.token.id === invoc.token.id && e.damageRoll === null
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
        }

        console.log(`[IronMegumin] Damage for ${invoc.name}: ${damageFormula} = ${finalDamage}${isOffensive ? ' (maximized)' : ''}`);
    }

    // ===== APPLY MAX 3 EXPLOSIONS PER TARGET =====
    for (const [tokenId, targetData] of targetExplosionMap.entries()) {
        if (targetData.explosions.length > SPELL_CONFIG.maxExplosionsPerTarget) {
            // Trier par dégâts décroissants et garder les 3 meilleurs
            targetData.explosions.sort((a, b) =>
                b.damageRoll.finalDamage - a.damageRoll.finalDamage
            );
            targetData.explosions = targetData.explosions.slice(0, SPELL_CONFIG.maxExplosionsPerTarget);

            console.log(`[IronMegumin] ${targetData.name} hit by multiple explosions, capped to top 3`);
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
                    💥 ${SPELL_CONFIG.name}
                </h3>
                <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                    <strong>Mage Mécanique:</strong> ${raynartActor.name}${stanceInfo}
                </div>
            </div>

            <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #2196f3;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9em;">
                    <div><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} ${characteristicInfo.final}</div>
                    <div><strong>Invocations:</strong> ${selectedInvocList.length} détruites</div>
                    <div style="grid-column: 1 / -1;"><strong>Coût:</strong> ${costCalc.displayMessage}</div>
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
    ui.notifications.info(`💥 IronMegumin : ${selectedInvocList.length} invocation${selectedInvocList.length > 1 ? 's' : ''} explosée${selectedInvocList.length > 1 ? 's' : ''}, ${totalTargets} cible${totalTargets > 1 ? 's' : ''} touchée${totalTargets > 1 ? 's' : ''} !`);

    console.log(`[IronMegumin] Spell complete - ${selectedInvocList.length} invocations destroyed, ${totalTargets} targets hit, complexity reduced by ${totalComplexityReduction}`);

})();
