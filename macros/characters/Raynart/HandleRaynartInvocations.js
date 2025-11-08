/**
 * Handle Raynart Invocations - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Macro central pour gérer TOUTES les invocations mécaniques de Raynart.
 * Système polyvalent et configurable pour créer, gérer et détruire les créations mécaniques.
 *
 * Invocations disponibles :
 * - Mur Mécanique : Barrière défensive (4 mana / 3 murs, 3 gratuits/combat)
 * - Balliste : Tourelle offensive (4 mana, 4+Dex PV)
 * - Gatling : Tourelle lourde (4 mana + sacrifice Balliste, 4+Dex PV)
 * - Araignée Mécanique : Reconnaissance (3 mana, partage 2 sens, Dex/2 PV)
 * - ParaTonnerre : Défense foudre (4 cases rayon, RD Dex+Esprit, 4+Dex PV)
 * - Velkoz : Protection défensive (4 mana, Esprit/2 PV, 25 dégâts max/tour)
 *
 * Fonctionnalités :
 * - Création multiple d'invocations avec ciblage Portal
 * - Détection automatique des invocations existantes
 * - Destruction avec animation et récupération de mana
 * - Animation de cast unique pour création multiple
 * - Calcul automatique des PV selon les stats
 *
 * Prerequisites:
 * - Portal module (pour le ciblage)
 * - Sequencer (pour les animations)
 * - JB2A (pour les effets visuels)
 * - Actors avec IDs spécifiques pour chaque type d'invocation
 *
 * Usage: Sélectionner le token de Raynart et lancer cette macro
 */

(async () => {
    // ===== VALIDATION BASIQUE =====
    const casterToken = canvas.tokens.controlled[0];
    if (!casterToken) {
        ui.notifications.warn("⚠️ Veuillez d'abord sélectionner le jeton de Raynart !");
        return;
    }

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

    // ===== CONFIGURATION DES INVOCATIONS =====
    const INVOCATION_CONFIG = {
        murMecanique: {
            name: "Mur Mécanique",
            displayName: "🛡️ Mur Mécanique",
            icon: "icons/environment/settlement/city-wall.webp",
            actorId: "9NXEFMzzBF3nmByB",
            manaCost: 4,
            manaCostDisplay: "4 mana / 3 murs",
            manaRefund: 2, // Mana récupéré par 3 murs détruits
            specialNote: "3 murs instantanés/combat (gestion manuelle)",
            hpFormula: "(4 + Dex + Esprit) × 2",
            calculateHP: (dex, esprit) => (4 + dex + esprit) * 2,
            description: "Barrière défensive mécanique. Peut être recyclé pour récupérer 2 mana/3 murs.",
            color: "#757575",
            bgColor: "#eeeeee",
            animation: {
                cast: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                creation: "jb2a_patreon.impact.ground_crack.orange.01",
                destruction: "jb2a_patreon.explosion.01.orange",
                scale: 2.0
            }
        },
        balliste: {
            name: "Balliste",
            displayName: "🎯 Balliste",
            icon: "icons/weapons/crossbows/crossbow-golden-bolt.webp",
            actorId: "FQzsrD4o20avg7co",
            manaCost: 4,
            manaCostDisplay: "4 mana/tourelle",
            manaRefund: 4,
            hpFormula: "4 + Dex",
            calculateHP: (dex) => 4 + dex,
            description: "Tourelle offensive mécanique. Attaque à distance.",
            color: "#f44336",
            bgColor: "#ffebee",
            animation: {
                cast: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                creation: "jb2a_patreon.impact.004.orange",
                destruction: "jb2a_patreon.explosion.01.orange",
                scale: 2.0
            }
        },
        gatling: {
            name: "Gatling",
            displayName: "⚔️ Gatling",
            icon: "icons/weapons/guns/rifle-white.webp",
            actorId: "M7oAyZmgzi5XEYNE",
            manaCost: 4,
            manaCostDisplay: "4 mana + sacrifice d'une Balliste",
            manaRefund: 4,
            specialNote: "Nécessite le sacrifice d'une Balliste (non vérifié automatiquement)",
            hpFormula: "4 + Dex",
            calculateHP: (dex) => 4 + dex,
            description: "Tourelle lourde ultra-offensive. Nécessite le sacrifice d'une Balliste.",
            color: "#9c27b0",
            bgColor: "#f3e5f5",
            animation: {
                cast: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                creation: "jb2a_patreon.impact.ground_crack.orange.01",
                destruction: "jb2a_patreon.explosion.01.orange",
                scale: 2.0
            }
        },
        araignee: {
            name: "Araignée Mécanique",
            displayName: "🕷️ Araignée Mécanique",
            icon: "icons/creatures/invertebrates/bug-cross-green.webp",
            actorId: "P0NlGCJh7r6K5yuc",
            manaCost: 3,
            manaCostDisplay: "3 mana/araignée",
            manaRefund: 3,
            specialNote: "Raynart partage 2 sens avec ses araignées",
            hpFormula: "Dex / 2 (arrondi inf.)",
            calculateHP: (dex) => Math.floor(dex / 2),
            description: "Reconnaissance mécanique. Raynart partage 2 sens avec ses araignées.",
            color: "#795548",
            bgColor: "#efebe9",
            animation: {
                cast: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                creation: "jb2a_patreon.impact.004.yellow",
                destruction: "jb2a_patreon.explosion.01.orange",
                scale: 2.0
            }
        },
        paratonnerre: {
            name: "ParaTonnerre",
            displayName: "⚡ ParaTonnerre",
            icon: "icons/magic/lightning/bolts-strike-salvo-blue.webp",
            actorId: "pJuR9WIyouueE6Kv",
            manaCost: 4,
            manaCostDisplay: "4 mana/paratonnerre",
            manaRefund: 4,
            specialNote: "Zone de protection 4 cases de rayon",
            hpFormula: "4 + Dex",
            rdFormula: "RD Foudre: Dex + Esprit",
            calculateHP: (dex) => 4 + dex,
            calculateRD: (dex, esprit) => dex + esprit,
            description: "Défense contre la foudre. Zone 4 cases: RD foudre et déviation sur attaques foudre.",
            color: "#ffc107",
            bgColor: "#fff8e1",
            animation: {
                cast: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                creation: "animated-spell-effects-cartoon.electricity.10",
                destruction: "jb2a_patreon.explosion.01.orange",
                protection: "animated-spell-effects.magic.shield.circle.04", // Animation persistante
                scale: 2.0
            }
        },
        velkoz: {
            name: "Velkoz",
            displayName: "👁️ Velkoz",
            icon: "icons/magic/perception/eye-ringed-glow-angry-red.webp",
            actorId: "DCUdL8S8N6t9eSMF",
            manaCost: 4,
            manaCostDisplay: "4 mana/velkoz",
            manaRefund: 4,
            hpFormula: "Esprit / 2 (arrondi inf.)",
            calculateHP: (esprit) => Math.floor(esprit / 2),
            specialNote: "Protège une cible par tour (max 25 dégâts)",
            description: "Protection défensive. Protège une cible par tour de maximum 25 dégâts/velkoz.",
            color: "#e91e63",
            bgColor: "#fce4ec",
            animation: {
                cast: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
                creation: "jb2a_patreon.impact.004.dark_red",
                destruction: "jb2a_patreon.explosion.01.orange",
                scale: 2.0
            }
        }
    };

    // ===== UTILITY FUNCTIONS =====

    /**
     * Gets active effect bonuses for a specific flag key
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "dexterite", "esprit")
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[Raynart] Active effect "${effect.name}" provides ${flagKey} bonus: ${flagValue}`);
            }
        }

        console.log(`[Raynart] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        // Get base characteristic from character sheet
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.warn(`⚠️ Caractéristique '${characteristic}' non trouvée ! Utilisation de valeur par défaut: 3`);
            return { base: 3, injuries: 0, effectBonus: 0, injuryAdjusted: 3, final: 3 };
        }
        const baseValue = charAttribute.value || 3;

        // Detect injury stacks and reduce characteristic accordingly
        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        // Get active effect bonuses for the characteristic
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        console.log(`[Raynart] Base ${characteristic}: ${baseValue}, Injury stacks: ${injuryStacks}, Effect bonus: ${effectBonus}`);

        // Calculate final value: base - injuries + effects, minimum of 1
        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[Raynart] ${characteristic} reduced by ${injuryStacks} due to injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[Raynart] ${characteristic} ${effectBonus > 0 ? 'increased' : 'decreased'} by ${effectBonus} due to active effects`);
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
     * Obtient les statistiques de Raynart (Dex et Esprit)
     */
    function getRaynartStats(actor) {
        const dex = getCharacteristicValue(actor, "dexterite");
        const esprit = getCharacteristicValue(actor, "esprit");

        return {
            dex: dex.final,
            esprit: esprit.final,
            dexInfo: dex,
            espritInfo: esprit
        };
    }

    /**
     * Détecte les invocations existantes de Raynart sur le terrain
     */
    function getExistingInvocations() {
        const invocations = {};

        for (const [key, config] of Object.entries(INVOCATION_CONFIG)) {
            invocations[key] = [];
        }

        // Parcourir tous les tokens de la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            // Vérifier si le token correspond à un type d'invocation
            for (const [key, config] of Object.entries(INVOCATION_CONFIG)) {
                if (token.actor.id === config.actorId) {
                    invocations[key].push({
                        token: token,
                        config: config,
                        name: token.name,
                        hp: token.actor.system.health?.value || 0,
                        maxHP: token.actor.system.health?.max || 0
                    });
                    console.log(`[Raynart] Found existing ${config.name}: ${token.name} at (${token.x}, ${token.y})`);
                }
            }
        }

        return invocations;
    }

    const stats = getRaynartStats(actor);
    const existingInvocations = getExistingInvocations();

    // ===== DÉTECTION DE LA STANCE FOCUS =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    const currentStance = getCurrentStance(actor);
    const isFocusStance = currentStance === 'focus';

    console.log(`[Raynart] Current stance: ${currentStance || 'None'}, Focus active: ${isFocusStance}`);

    // ===== DIALOG BUILDER =====

    /**
     * Construit le contenu HTML du dialogue
     */
    function buildDialogContent() {
        let html = `
            <style>
                .invocation-dialog {
                    font-family: "Signika", sans-serif;
                    max-height: 70vh;
                    overflow-y: auto;
                }
                .invocation-section {
                    margin-bottom: 20px;
                    padding: 12px;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    background: #f9f9f9;
                }
                .section-title {
                    font-size: 1.2em;
                    font-weight: bold;
                    margin-bottom: 10px;
                    border-bottom: 2px solid #333;
                    padding-bottom: 5px;
                }
                .invocation-item {
                    margin: 10px 0;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .invocation-item:hover {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    transform: translateY(-2px);
                }
                .invocation-item.selected {
                    border: 2px solid #2196f3;
                    background: #e3f2fd;
                }
                .invocation-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }
                .invocation-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    object-fit: cover;
                }
                .invocation-title {
                    font-size: 1.1em;
                    font-weight: bold;
                }
                .invocation-details {
                    font-size: 0.9em;
                    color: #555;
                    margin-top: 5px;
                }
                .invocation-cost {
                    font-weight: bold;
                    color: #1976d2;
                }
                .invocation-hp {
                    color: #388e3c;
                }
                .special-note {
                    font-style: italic;
                    color: #f57c00;
                    font-size: 0.85em;
                    margin-top: 5px;
                }
                .existing-list {
                    margin-top: 10px;
                    padding: 8px;
                    background: #fff3e0;
                    border-radius: 4px;
                    font-size: 0.9em;
                }
                .existing-item {
                    padding: 4px 8px;
                    margin: 2px 0;
                    background: white;
                    border-left: 3px solid #ff9800;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .existing-item:hover {
                    background: #ffe0b2;
                }
                .existing-item.selected-destroy {
                    background: #ffccbc;
                    border-left: 3px solid #f44336;
                    font-weight: bold;
                }
                .select-all-btn {
                    padding: 2px 6px;
                    background: #ff9800;
                    color: white;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 0.75em;
                    transition: background 0.2s;
                    margin-left: 6px;
                }
                .select-all-btn:hover {
                    background: #f57c00;
                }
                .select-all-btn.deselect {
                    background: #9e9e9e;
                }
                .select-all-btn.deselect:hover {
                    background: #757575;
                }
                .select-all-btn.category {
                    padding: 0px;
                    font-size: 0.65em;
                    margin-left: 4px;
                    line-height: 1;
                    width: 1.2em;
                    height: 1.2em;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                .select-all-btn.category.all-selected {
                    background: #4caf50;
                }
                .select-all-btn.category.all-selected:hover {
                    background: #388e3c;
                }
                .global-select-buttons {
                    display: flex;
                    gap: 6px;
                    margin-bottom: 10px;
                    justify-content: flex-end;
                }
                .count-selector {
                    margin-top: 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .count-selector input {
                    width: 60px;
                    padding: 4px;
                    text-align: center;
                    font-size: 1em;
                }
                .stats-display {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border-radius: 6px;
                    text-align: center;
                }
            </style>
            <div class="invocation-dialog">
                <div class="stats-display">
                    <strong>🔧 Raynart - Mage de la Mécanique</strong><br>
                    Dextérité: ${stats.dex} | Esprit: ${stats.esprit}
                    ${isFocusStance ? '<br><span style="color: #4caf50; font-weight: bold;">⚡ POSITION FOCUS - Invocations gratuites ⚡</span>' : ''}
                </div>
        `;

        // Section: Créer des invocations
        html += `
            <div class="invocation-section">
                <div class="section-title">⚙️ Créer des Invocations</div>
        `;

        for (const [key, config] of Object.entries(INVOCATION_CONFIG)) {
            const existing = existingInvocations[key];
            const existingCount = existing.length;

            // Calculer les PV selon la config
            let hpDisplay = "";
            if (config.calculateHP) {
                if (key === 'murMecanique' || key === 'paratonnerre' || key === 'balliste' || key === 'gatling') {
                    const hp = config.calculateHP(stats.dex, stats.esprit || 0);
                    hpDisplay = `<span class="invocation-hp">PV: ${hp}</span>`;
                } else if (key === 'araignee') {
                    const hp = config.calculateHP(stats.dex);
                    hpDisplay = `<span class="invocation-hp">PV: ${hp}</span>`;
                } else if (key === 'velkoz') {
                    const hp = config.calculateHP(stats.esprit);
                    hpDisplay = `<span class="invocation-hp">PV: ${hp}</span>`;
                }
            }

            // RD pour paratonnerre
            let rdDisplay = "";
            if (key === 'paratonnerre' && config.calculateRD) {
                const rd = config.calculateRD(stats.dex, stats.esprit);
                rdDisplay = ` | <span style="color: #ffc107;">RD Foudre: ${rd}</span>`;
            }

            // Affichage du coût en fonction de la stance Focus
            const displayManaCost = isFocusStance
                ? `<span style="color: #4caf50;">GRATUIT (Focus)</span> <em style="font-size: 0.85em;">(Coût normal: ${config.manaCostDisplay})</em>`
                : config.manaCostDisplay;

            html += `
                <div class="invocation-item" data-invocation="${key}" onclick="selectInvocation('${key}')">
                    <div class="invocation-header">
                        <img src="${config.icon}" class="invocation-icon" alt="${config.name}">
                        <span class="invocation-title" style="color: ${config.color};">${config.displayName}</span>
                    </div>
                    <div class="invocation-details">
                        <div>${config.description}</div>
                        <div style="margin-top: 5px;">
                            <span class="invocation-cost">Coût: ${displayManaCost}</span>
                            ${hpDisplay}${rdDisplay}
                        </div>
                        ${config.specialNote ? `<div class="special-note">⚠️ ${config.specialNote}</div>` : ''}
                        <div class="count-selector" id="count-${key}" style="display: none;" onclick="event.stopPropagation()">
                            <label>Nombre à créer:</label>
                            <input type="number" id="count-input-${key}" min="1" max="10" value="1" onclick="event.stopPropagation()">
                        </div>
                    </div>
                </div>
            `;
        }

        html += `</div>`; // Fin section création

        // Section: Détruire des invocations existantes
        html += `
            <div class="invocation-section">
                <div class="section-title">🗑️ Détruire des Invocations</div>
        `;

        let hasExisting = false;
        for (const [key, config] of Object.entries(INVOCATION_CONFIG)) {
            const existing = existingInvocations[key];
            if (existing.length > 0) {
                hasExisting = true;
            }
        }

        // Boutons globaux si des invocations existent
        if (hasExisting) {
            html += `
                <div class="global-select-buttons">
                    <button class="select-all-btn" onclick="selectAllDestroyGlobal()">✅ Tout sélectionner</button>
                    <button class="select-all-btn deselect" onclick="deselectAllDestroyGlobal()">❌ Tout désélectionner</button>
                </div>
            `;
        }

        for (const [key, config] of Object.entries(INVOCATION_CONFIG)) {
            const existing = existingInvocations[key];
            if (existing.length > 0) {
                html += `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; align-items: center;">
                            <strong style="color: ${config.color};">${config.displayName}</strong> (${existing.length})
                            <button class="select-all-btn category" id="select-btn-${key}" onclick="selectAllDestroy('${key}')" title="Sélectionner tous les ${config.name}">✅</button>
                            <button class="select-all-btn category deselect" id="deselect-btn-${key}" onclick="deselectAllDestroy('${key}')" title="Désélectionner tous les ${config.name}" style="display: none;">❌</button>
                        </div>
                        <div class="existing-list" id="destroy-list-${key}">
                `;

                existing.forEach((inv, index) => {
                    html += `
                        <div class="existing-item" data-destroy-key="${key}" data-destroy-index="${index}" onclick="toggleDestroy('${key}', ${index})">
                            ${inv.name} - ${inv.hp}/${inv.maxHP} PV
                        </div>
                    `;
                });

                html += `
                        </div>
                    </div>
                `;
            }
        }

        if (!hasExisting) {
            html += `<p style="text-align: center; color: #999; font-style: italic;">Aucune invocation détectée sur le terrain.</p>`;
        }

        html += `</div>`; // Fin section destruction
        html += `</div>`; // Fin dialog

        return html;
    }

    // ===== MAIN DIALOG =====

    let selectedInvocationTypes = {}; // { key: count }
    let selectedDestroy = {}; // { key: [index1, index2, ...] }

    const dialogContent = buildDialogContent();

    // Préparer les fonctions pour l'interaction
    window.selectInvocation = (key) => {
        const selectedItem = document.querySelector(`[data-invocation="${key}"]`);
        const countDiv = selectedItem?.querySelector('.count-selector');

        if (selectedInvocationTypes[key]) {
            // Déjà sélectionné, désélectionner
            delete selectedInvocationTypes[key];
            if (selectedItem) selectedItem.classList.remove('selected');
            if (countDiv) countDiv.style.display = 'none';
        } else {
            // Sélectionner
            selectedInvocationTypes[key] = 1; // Valeur par défaut
            if (selectedItem) selectedItem.classList.add('selected');
            if (countDiv) countDiv.style.display = 'flex';
        }

        console.log(`[Raynart] Selected invocation types:`, selectedInvocationTypes);
    };

    window.updateCategoryButtons = (key) => {
        const existing = existingInvocations[key];
        if (!existing) return;

        const selectBtn = document.getElementById(`select-btn-${key}`);
        const deselectBtn = document.getElementById(`deselect-btn-${key}`);

        const selectedCount = selectedDestroy[key]?.length || 0;
        const totalCount = existing.length;

        if (selectedCount === 0) {
            // Rien n'est sélectionné, montrer le bouton select
            if (selectBtn) {
                selectBtn.style.display = '';
                selectBtn.classList.remove('all-selected');
            }
            if (deselectBtn) deselectBtn.style.display = 'none';
        } else if (selectedCount === totalCount) {
            // Tout est sélectionné, montrer le bouton deselect avec style "all-selected"
            if (selectBtn) selectBtn.style.display = 'none';
            if (deselectBtn) {
                deselectBtn.style.display = '';
                deselectBtn.classList.add('all-selected');
            }
        } else {
            // Partiellement sélectionné, montrer les deux
            if (selectBtn) {
                selectBtn.style.display = '';
                selectBtn.classList.remove('all-selected');
            }
            if (deselectBtn) {
                deselectBtn.style.display = '';
                deselectBtn.classList.remove('all-selected');
            }
        }
    };

    window.toggleDestroy = (key, index) => {
        if (!selectedDestroy[key]) {
            selectedDestroy[key] = [];
        }

        const indexPos = selectedDestroy[key].indexOf(index);
        const element = document.querySelector(`[data-destroy-key="${key}"][data-destroy-index="${index}"]`);

        if (indexPos !== -1) {
            // Déselectionner
            selectedDestroy[key].splice(indexPos, 1);
            if (element) element.classList.remove('selected-destroy');
        } else {
            // Sélectionner
            selectedDestroy[key].push(index);
            if (element) element.classList.add('selected-destroy');
        }

        updateCategoryButtons(key);
        console.log(`[Raynart] Toggle destroy for ${key} index ${index}:`, selectedDestroy);
    };

    window.selectAllDestroy = (key) => {
        const existing = existingInvocations[key];
        if (!existing) return;

        if (!selectedDestroy[key]) {
            selectedDestroy[key] = [];
        }

        // Sélectionner tous les indices
        for (let i = 0; i < existing.length; i++) {
            if (!selectedDestroy[key].includes(i)) {
                selectedDestroy[key].push(i);
                const element = document.querySelector(`[data-destroy-key="${key}"][data-destroy-index="${i}"]`);
                if (element) element.classList.add('selected-destroy');
            }
        }

        updateCategoryButtons(key);
        console.log(`[Raynart] Selected all ${key}:`, selectedDestroy);
    };

    window.deselectAllDestroy = (key) => {
        if (!selectedDestroy[key]) return;

        const existing = existingInvocations[key];
        if (!existing) return;

        // Désélectionner tous les indices
        for (let i = 0; i < existing.length; i++) {
            const element = document.querySelector(`[data-destroy-key="${key}"][data-destroy-index="${i}"]`);
            if (element) element.classList.remove('selected-destroy');
        }

        selectedDestroy[key] = [];
        updateCategoryButtons(key);
        console.log(`[Raynart] Deselected all ${key}:`, selectedDestroy);
    };

    window.selectAllDestroyGlobal = () => {
        for (const [key, invList] of Object.entries(existingInvocations)) {
            if (invList.length > 0) {
                if (!selectedDestroy[key]) {
                    selectedDestroy[key] = [];
                }

                // Sélectionner tous les indices
                for (let i = 0; i < invList.length; i++) {
                    if (!selectedDestroy[key].includes(i)) {
                        selectedDestroy[key].push(i);
                        const element = document.querySelector(`[data-destroy-key="${key}"][data-destroy-index="${i}"]`);
                        if (element) element.classList.add('selected-destroy');
                    }
                }
                updateCategoryButtons(key);
            }
        }
        console.log(`[Raynart] Selected all invocations globally:`, selectedDestroy);
    };

    window.deselectAllDestroyGlobal = () => {
        for (const [key, invList] of Object.entries(existingInvocations)) {
            if (invList.length > 0) {
                for (let i = 0; i < invList.length; i++) {
                    const element = document.querySelector(`[data-destroy-key="${key}"][data-destroy-index="${i}"]`);
                    if (element) element.classList.remove('selected-destroy');
                }
                selectedDestroy[key] = [];
                updateCategoryButtons(key);
            }
        }
        console.log(`[Raynart] Deselected all invocations globally:`, selectedDestroy);
    };

    const choice = await new Promise((resolve) => {
        new Dialog({
            title: "🔧 Gestion des Invocations de Raynart",
            content: dialogContent,
            buttons: {
                apply: {
                    label: "✅ Appliquer",
                    callback: (html) => {
                        const hasCreation = Object.keys(selectedInvocationTypes).length > 0;
                        const hasDestruction = Object.values(selectedDestroy).some(arr => arr.length > 0);

                        if (!hasCreation && !hasDestruction) {
                            ui.notifications.warn("⚠️ Veuillez sélectionner au moins une action (création ou destruction) !");
                            resolve({ action: null });
                            return;
                        }

                        // Récupérer les counts pour chaque type sélectionné
                        const invocationsToCreate = {};
                        if (hasCreation) {
                            for (const key of Object.keys(selectedInvocationTypes)) {
                                const countInput = html.find(`#count-input-${key}`)[0];
                                const count = parseInt(countInput?.value || 1);
                                invocationsToCreate[key] = count;
                            }
                        }

                        resolve({
                            action: "apply",
                            invocations: invocationsToCreate,
                            destructions: selectedDestroy
                        });
                    }
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve({ action: null })
                }
            },
            default: "apply",
            close: () => resolve({ action: null })
        }).render(true);
    });

    // Nettoyer les fonctions globales
    delete window.selectInvocation;
    delete window.toggleDestroy;
    delete window.selectAllDestroy;
    delete window.deselectAllDestroy;
    delete window.selectAllDestroyGlobal;
    delete window.deselectAllDestroyGlobal;
    delete window.updateCategoryButtons;

    if (!choice || !choice.action) {
        console.log("[Raynart] Dialog cancelled");
        return;
    }

    console.log(`[Raynart] User choice:`, choice);

    // ===== ACTIONS HANDLER =====

    if (choice.action === "apply") {
        const invocationsToCreate = choice.invocations || {};
        const invocationsToDestroy = choice.destructions || {};

        const hasCreation = Object.keys(invocationsToCreate).length > 0;
        const hasDestruction = Object.values(invocationsToDestroy).some(arr => arr.length > 0);

        // ===== CAST ANIMATION (joué AVANT toute action) =====
        if (hasCreation || hasDestruction) {
            console.log("[Raynart] Playing cast animation before actions...");

            const castAnimation = "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm";
            const castSeq = new Sequence()
                .effect()
                .file(castAnimation)
                .atLocation(casterToken)
                .scaleToObject(2.0)
                .belowTokens(true)
                .fadeIn(300)
                .fadeOut(500);

            await castSeq.play();
            console.log("[Raynart] Cast animation completed!");
        }

        // ===== DESTRUCTION D'INVOCATIONS =====
        let totalManaRefund = 0;
        let destroyedSummary = {};

        if (hasDestruction) {
            console.log("[Raynart] Starting destruction phase...");

            for (const [key, indices] of Object.entries(invocationsToDestroy)) {
                if (indices.length === 0) continue;

                const config = INVOCATION_CONFIG[key];
                const invocationList = existingInvocations[key];

                destroyedSummary[key] = {
                    config: config,
                    count: 0
                };

                for (const index of indices) {
                    const invocation = invocationList[index];
                    if (!invocation || !invocation.token) continue;

                    try {
                        console.log(`[Raynart] Destroying ${config.name}: ${invocation.name}`);

                        // Vérifier si l'invocation a été créée en Focus
                        const wasCreatedInFocus = invocation.token.actor?.flags?.world?.raynartCreatedInFocus || false;

                        if (wasCreatedInFocus) {
                            console.log(`[Raynart] ${config.name} was created in Focus - no mana refund will be given`);
                            if (!destroyedSummary[key].noRefundCount) {
                                destroyedSummary[key].noRefundCount = 0;
                            }
                            destroyedSummary[key].noRefundCount++;
                        }

                        // Supprimer l'effet persistant si ParaTonnerre
                        if (key === 'paratonnerre') {
                            Sequencer.EffectManager.endEffects({ name: `paratonnerre_shield_${invocation.token.id}` });
                        }

                        // Animation de destruction
                        const destructionSeq = new Sequence()
                            .effect()
                            .file(config.animation.destruction)
                            .atLocation(invocation.token)
                            .scaleToObject(config.animation.scale)
                            .fadeOut(500);

                        destructionSeq.play();
                        await new Promise(resolve => setTimeout(resolve, 100));

                        // Supprimer le token
                        await invocation.token.document.delete();

                        destroyedSummary[key].count++;
                        console.log(`[Raynart] Destroyed ${config.name}: ${invocation.name}`);

                    } catch (error) {
                        console.error(`[Raynart] Error destroying ${config.name}:`, error);
                        ui.notifications.warn(`⚠️ Impossible de détruire ${invocation.name}`);
                    }
                }

                // Calculer le mana récupéré (seulement pour les invocations NON créées en Focus)
                if (destroyedSummary[key].count > 0) {
                    const refundableCount = destroyedSummary[key].count - (destroyedSummary[key].noRefundCount || 0);

                    if (refundableCount > 0) {
                        if (key === 'murMecanique') {
                            const wallSets = Math.floor(refundableCount / 3);
                            const refund = wallSets * config.manaRefund;
                            totalManaRefund += refund;
                            console.log(`[Raynart] Mana refund for ${refundableCount} walls: ${refund} mana (${wallSets} sets)`);
                        } else {
                            const refund = refundableCount * config.manaRefund;
                            totalManaRefund += refund;
                            console.log(`[Raynart] Mana refund for ${refundableCount} ${config.name}: ${refund} mana`);
                        }
                    }

                    if (destroyedSummary[key].noRefundCount > 0) {
                        console.log(`[Raynart] No mana refund for ${destroyedSummary[key].noRefundCount} ${config.name} (created in Focus)`);
                    }
                }
            }
        }

        // ===== CRÉATION D'INVOCATIONS =====
        const allCreatedInvocations = {};

        if (hasCreation) {
            console.log("[Raynart] Starting creation phase...");

            for (const [invocationType, count] of Object.entries(invocationsToCreate)) {
                const config = INVOCATION_CONFIG[invocationType];

                if (!config) {
                    ui.notifications.error(`❌ Configuration d'invocation invalide pour ${invocationType} !`);
                    continue;
                }

                // Récupérer l'actor de l'invocation
                const invocationActor = game.actors.get(config.actorId);
                if (!invocationActor) {
                    ui.notifications.error(`❌ Actor "${config.name}" introuvable (ID: ${config.actorId}) !`);
                    continue;
                }

                console.log(`[Raynart] Creating ${count}x ${config.name}`);

                allCreatedInvocations[invocationType] = [];

                // Créer chaque invocation de ce type avec Portal
                for (let i = 0; i < count; i++) {
                    ui.notifications.info(`🎯 Sélectionnez l'emplacement ${i + 1}/${count} pour ${config.name}...`);

                try {
                    // Calculer les PV selon la config
                    let calculatedHP = 10; // Valeur par défaut
                    if (config.calculateHP) {
                        if (invocationType === 'murMecanique' || invocationType === 'paratonnerre') {
                            calculatedHP = config.calculateHP(stats.dex, stats.esprit);
                        } else if (invocationType === 'balliste' || invocationType === 'gatling') {
                            calculatedHP = config.calculateHP(stats.dex);
                        } else if (invocationType === 'araignee') {
                            calculatedHP = config.calculateHP(stats.dex);
                        } else if (invocationType === 'velkoz') {
                            calculatedHP = config.calculateHP(stats.esprit);
                        }
                    }

                    // Spawner l'invocation avec Portal
                    const spawnResult = await Portal.spawn(invocationActor, {
                        hidden: false,
                        name: `${config.name} ${i + 1}`,
                        snap: true,
                        center: true
                    });

                    console.log(`[Raynart] Portal.spawn result:`, spawnResult);

                    let spawnToken = null;
                    let spawnX, spawnY;

                    // Gérer les différents formats de retour de Portal.spawn
                    if (spawnResult) {
                        if (Array.isArray(spawnResult) && spawnResult.length > 0) {
                            spawnToken = spawnResult[0];
                        } else if (spawnResult.document || spawnResult.x !== undefined) {
                            spawnToken = spawnResult;
                        }

                        if (spawnToken) {
                            if (spawnToken.document && spawnToken.document.x !== undefined) {
                                spawnX = spawnToken.document.x;
                                spawnY = spawnToken.document.y;
                            } else if (spawnToken.x !== undefined) {
                                spawnX = spawnToken.x;
                                spawnY = spawnToken.y;
                            }
                        }
                    }

                    if (spawnX === undefined || spawnY === undefined) {
                        ui.notifications.warn(`⚠️ Création de ${config.name} ${i + 1} annulée.`);
                        continue;
                    }

                    // Mettre à jour les PV du token créé et ajouter un flag si créé en Focus
                    if (spawnToken && spawnToken.actor) {
                        const updateData = {
                            "system.health.value": calculatedHP,
                            "system.health.max": calculatedHP
                        };

                        // Si créé en stance Focus, ajouter un flag pour la gestion du remboursement de mana
                        if (isFocusStance) {
                            updateData["flags.world.raynartCreatedInFocus"] = true;
                            updateData["flags.world.raynartCreator"] = actor.id;
                            updateData["flags.world.raynartCreatedAt"] = Date.now();
                            console.log(`[Raynart] ${config.name} created in Focus stance - no mana refund on destruction`);
                        }

                        await spawnToken.actor.update(updateData);
                        console.log(`[Raynart] Updated ${config.name} HP to ${calculatedHP}`);
                    }

                    // Animation de création à l'emplacement (utilise scaleToObject)
                    const creationSeq = new Sequence();

                    creationSeq.effect()
                        .file(config.animation.creation)
                        .atLocation(spawnToken)
                        .scaleToObject(config.animation.scale)
                        .belowTokens(true)
                        .fadeIn(200)
                        .fadeOut(500);

                    // Animation persistante pour ParaTonnerre
                    if (invocationType === 'paratonnerre' && config.animation.protection) {
                        creationSeq.effect()
                            .file(config.animation.protection)
                            .attachTo(spawnToken)
                            .scale(2.0)
                            .opacity(0.2)
                            .persist()
                            .name(`paratonnerre_shield_${spawnToken.id}`);
                    }

                    creationSeq.play();

                    allCreatedInvocations[invocationType].push({
                        type: invocationType,
                        config: config,
                        token: spawnToken,
                        hp: calculatedHP
                    });

                    console.log(`[Raynart] ${config.name} ${i + 1} créé avec ${calculatedHP} PV`);

                } catch (error) {
                    console.error(`[Raynart] Error creating ${config.name}:`, error);
                    ui.notifications.error(`❌ Erreur lors de la création de ${config.name} !`);
                }
            }
        }
    }

        // ===== MESSAGE RÉCAPITULATIF =====
        let chatMessage = "";
        let totalCreated = 0;
        let totalDestroyed = 0;

        // Section création
        if (hasCreation && Object.keys(allCreatedInvocations).length > 0) {
            chatMessage += `
                <div style="border: 2px solid #667eea; border-radius: 8px; padding: 12px; margin-bottom: 10px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                    <h3 style="margin: 0 0 10px 0; color: #667eea;">⚙️ Création d'Invocations Mécaniques</h3>
                    <p><strong>Invocateur:</strong> ${actor.name}</p>
                    <hr style="border-color: #667eea;">
            `;

            for (const [invocationType, createdList] of Object.entries(allCreatedInvocations)) {
                if (createdList.length > 0) {
                    const config = createdList[0].config;
                    totalCreated += createdList.length;

                    const actualCost = isFocusStance
                        ? `<span style="color: #4caf50;">GRATUIT (Focus)</span> <em style="font-size: 0.85em;">(Coût normal: ${config.manaCostDisplay})</em>`
                        : config.manaCostDisplay;

                    chatMessage += `
                        <div style="margin: 10px 0; padding: 8px; background: ${config.bgColor}; border-left: 4px solid ${config.color}; border-radius: 4px;">
                            <p style="margin: 5px 0;"><strong style="color: ${config.color};">${config.displayName}</strong>: ${createdList.length}x créé(e)s</p>
                            <p style="margin: 5px 0; font-size: 0.9em;">${config.description}</p>
                            <p style="margin: 5px 0;"><strong>Coût:</strong> ${actualCost}</p>
                    `;

                    // Afficher les PV
                    if (createdList[0].hp) {
                        chatMessage += `<p style="margin: 5px 0;"><strong>PV:</strong> ${createdList[0].hp} (${config.hpFormula})</p>`;
                    }

                    // Afficher RD pour paratonnerre
                    if (invocationType === 'paratonnerre' && config.calculateRD) {
                        const rd = config.calculateRD(stats.dex, stats.esprit);
                        chatMessage += `<p style="margin: 5px 0;"><strong>RD Foudre:</strong> ${rd} (${config.rdFormula})</p>`;
                        chatMessage += `<p style="margin: 5px 0; font-size: 0.85em;">Zone 4 cases: Déviation attaques foudre</p>`;
                    }

                    // Note spéciale
                    if (config.specialNote) {
                        chatMessage += `<p style="margin: 5px 0; font-style: italic; color: #f57c00; font-size: 0.85em;">⚠️ ${config.specialNote}</p>`;
                    }

                    chatMessage += `</div>`;
                }
            }

            chatMessage += `
                    <p style="margin-top: 10px;"><strong>Total créé:</strong> ${totalCreated} invocation(s)</p>
                </div>
            `;
        }

        // Section destruction
        if (hasDestruction && Object.keys(destroyedSummary).length > 0) {
            for (const [key, data] of Object.entries(destroyedSummary)) {
                if (data.count > 0) {
                    totalDestroyed += data.count;
                }
            }

            if (totalDestroyed > 0) {
                chatMessage += `
                    <div style="border: 2px solid #f44336; border-radius: 8px; padding: 12px; background: #ffebee;">
                        <h3 style="margin: 0 0 10px 0; color: #f44336;">🗑️ Destruction d'Invocations</h3>
                        <p><strong>Invocateur:</strong> ${actor.name}</p>
                        <hr style="border-color: #f44336;">
                `;

                for (const [key, data] of Object.entries(destroyedSummary)) {
                    if (data.count > 0) {
                        const noRefundCount = data.noRefundCount || 0;
                        const refundableCount = data.count - noRefundCount;

                        chatMessage += `<p><strong>${data.config.displayName}:</strong> ${data.count} détruit(e)s`;
                        if (noRefundCount > 0) {
                            chatMessage += ` <em style="font-size: 0.85em; color: #999;">(${noRefundCount} créé(e)s en Focus - pas de remboursement)</em>`;
                        }
                        chatMessage += `</p>`;
                    }
                }

                chatMessage += `<p><strong>Mana récupéré:</strong> ${totalManaRefund} mana</p>`;
                if (totalManaRefund > 0) {
                    chatMessage += `<p style="font-size: 0.85em; font-style: italic; color: #666;">Note: La récupération de mana doit être gérée manuellement sur la fiche de personnage.</p>`;
                } else {
                    chatMessage += `<p style="font-size: 0.85em; font-style: italic; color: #999;">Toutes les invocations ont été créées en Position Focus - aucun remboursement de mana.</p>`;
                }
                chatMessage += `</div>`;
            }
        }

        // Envoyer le message récapitulatif
        if (chatMessage) {
            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: casterToken }),
                content: chatMessage
            });

            let notification = "";
            if (totalCreated > 0 && totalDestroyed > 0) {
                notification = `✅ ${totalCreated} invocation(s) créée(s), ${totalDestroyed} détruite(s) !`;
            } else if (totalCreated > 0) {
                notification = `✅ ${totalCreated} invocation(s) créée(s) avec succès !`;
            } else if (totalDestroyed > 0) {
                notification = `✅ ${totalDestroyed} invocation(s) détruite(s) ! Mana récupéré: ${totalManaRefund}`;
            }

            if (notification) {
                ui.notifications.info(notification);
            }
        }
    }

})();
