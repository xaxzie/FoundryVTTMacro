/**
 * Handle Yunyun Runes - Yunyun (Mage Polyvalente)
 *
 * Macro pour gérer le système de runes de Yunyun.
 * Yunyun écrit ses runes sur des galets qu'elle transporte.
 *
 * Fonctionnalités :
 * - Préparer une rune à l'avance (crée un effet sur Yunyun avec counter)
 * - Placer une rune sur le terrain (animation persistante)
 * - Activer une rune (déclenche l'effet associé)
 * - Recycler une rune (détruit sans activer, récupération mana si à côté)
 *
 * Types de Runes :
 * - Rune Explosive : Déclenche le sort Explosion (6 mana, action simple)
 * - Rune de Transposition : Téléporte Yunyun à l'emplacement (2 mana, action rapide)
 * - Rune Mur de Terre : Crée un mur de terre (3 mana, action rapide)
 * - Rune de Soin : Soigne Charisme × PV sur cible (3 mana, 2 actions simples, action immédiate)
 * - Rune Générique : Effet personnalisé accepté par le MJ
 *
 * Usage : Sélectionner le token de Yunyun et lancer cette macro
 */

(async () => {
    // ===== VALIDATION BASIQUE =====
    const casterToken = canvas.tokens.controlled[0];
    if (!casterToken) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Yunyun !");
        return;
    }

    const actor = casterToken.actor;
    if (!actor) {
        ui.notifications.error("❌ Impossible de trouver l'acteur du token sélectionné !");
        return;
    }

    // ===== VÉRIFICATION GM SOCKET =====
    if (!globalThis.gmSocket) {
        ui.notifications.error("❌ Le GM socket n'est pas disponible ! Vérifie que Custom Status Effects Override est activé et qu'un MJ est en ligne.");
        return;
    }

    // ===== CONFIGURATION DES RUNES =====
    const RUNE_TYPES = {
        explosive: {
            name: "Rune Explosive",
            displayName: "💥 Rune Explosive",
            icon: "icons/magic/symbols/runes-carved-stone-red.webp",
            manaCost: 6,
            manaType: "réservée",
            preparationAction: "Action Simple",
            activationAction: "Action Simple",
            description: "Déclenche une explosion dévastatrice",
            animation: {
                rune: "jb2a.magic_signs.rune.evocation.loop.red",
                scale: 0.6,
                opacity: 0.8,
                tint: "#ff8c00"
            },
            activationEffect: "explosion",
            color: "#ff8c00",
            bgColor: "#fff3e0"
        },
        transposition: {
            name: "Rune de Transposition",
            displayName: "🌀 Rune de Transposition",
            icon: "icons/magic/symbols/chevron-elipse-circle-blue.webp",
            manaCost: 2,
            manaType: "+/- réservée",
            preparationAction: "Action Simple",
            activationAction: "Action Rapide",
            description: "Téléporte Yunyun à l'emplacement de la rune",
            animation: {
                rune: "jb2a.magic_signs.rune.abjuration.loop.blue",
                scale: 0.5,
                opacity: 0.8,
                tint: "#4a90e2"
            },
            activationEffect: "teleportation",
            color: "#4a90e2",
            bgColor: "#e3f2fd"
        },
        murDeTerre: {
            name: "Rune Mur de Terre",
            displayName: "🧱 Rune Mur de Terre",
            icon: "icons/magic/earth/projectile-boulder-debris.webp",
            manaCost: 3,
            manaType: "réservée",
            preparationAction: "Action Simple",
            activationAction: "Action Rapide",
            description: "Crée un mur de terre solide",
            animation: {
                rune: "jb2a.magic_signs.rune.divination.loop.blue",
                scale: 0.6,
                opacity: 0.8,
                tint: "#8d6e63"
            },
            activationEffect: "wall",
            color: "#8d6e63",
            bgColor: "#efebe9"
        },
        soin: {
            name: "Rune de Soin",
            displayName: "💚 Rune de Soin",
            icon: "icons/magic/symbols/rune-sigil-green.webp",
            manaCost: 3,
            manaType: "réservée",
            preparationAction: "2 Actions Simples",
            activationAction: "Action Immédiate",
            description: "Soigne Charisme × PV sur une cible",
            animation: {
                rune: "jb2a_patreon.magic_signs.rune.transmutation.loop.green",
                scale: 0.5,
                opacity: 0.8,
                tint: "#4caf50"
            },
            activationEffect: "healing",
            color: "#4caf50",
            bgColor: "#e8f5e9"
        },
        generique: {
            name: "Rune Générique",
            displayName: "✨ Rune Générique",
            icon: "icons/magic/symbols/rune-sigil-rough-white-teal.webp",
            manaCost: 0,
            manaType: "variable",
            preparationAction: "Variable",
            activationAction: "Variable",
            description: "Effet personnalisé accepté par le MJ",
            animation: {
                rune: "jb2a_patreon.magic_signs.rune.abjuration.loop.red",
                scale: 0.55,
                opacity: 0.7,
                tint: "#9c27b0"
            },
            activationEffect: "custom",
            color: "#9c27b0",
            bgColor: "#f3e5f5"
        }
    };

    // ===== UTILITY FUNCTIONS =====

    /**
     * Gets active effect bonuses for a specific flag key
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "charisme")
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
                console.log(`[Yunyun Runes] Active effect "${effect.name}" provides ${flagKey} bonus: ${flagValue}`);
            }
        }

        console.log(`[Yunyun Runes] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        // Get base characteristic from character sheet
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
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

        console.log(`[Yunyun Runes] Base ${characteristic}: ${baseValue}, Injury stacks: ${injuryStacks}, Effect bonus: ${effectBonus}`);

        // Calculate final value: base - injuries + effects, minimum of 1
        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        if (injuryStacks > 0) {
            console.log(`[Yunyun Runes] ${characteristic} reduced by ${injuryStacks} due to injuries`);
        }
        if (effectBonus !== 0) {
            console.log(`[Yunyun Runes] ${characteristic} ${effectBonus > 0 ? 'increased' : 'decreased'} by ${effectBonus} due to active effects`);
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
     * Obtient la valeur de Charisme de Yunyun avec tous les modificateurs
     */
    function getCharismaValue(actor) {
        const charismaInfo = getCharacteristicValue(actor, "charisme");
        return charismaInfo.final;
    }

    /**
     * Détecte les runes existantes sur Yunyun
     */
    function getExistingRunes() {
        const runes = {};
        for (const [key, config] of Object.entries(RUNE_TYPES)) {
            const effect = actor.effects.find(e => e.name === config.name || e.label === config.name);
            if (effect) {
                const counter = effect.flags?.statuscounter?.value || 1;
                runes[key] = {
                    effect: effect,
                    count: counter,
                    config: config
                };
            }
        }
        return runes;
    }

    /**
     * Détecte les runes placées sur le terrain (via Sequencer)
     */
    function getPlacedRunes() {
        const placedRunes = [];

        if (typeof Sequencer === "undefined" || !Sequencer.EffectManager) {
            return placedRunes;
        }

        // Chercher toutes les animations de runes de Yunyun
        const allEffects = Sequencer.EffectManager.getEffects();

        for (const effect of allEffects) {
            if (effect.data?.name?.startsWith("yunyun_rune_")) {
                // Extraire le type de rune du nom (format: yunyun_rune_TYPE_timestamp)
                const nameParts = effect.data.name.split('_');
                // nameParts[0] = "yunyun", nameParts[1] = "rune", nameParts[2] = type, nameParts[3] = timestamp
                const runeType = nameParts[2];
                const runeConfig = RUNE_TYPES[runeType];

                // Récupérer la position correcte depuis data.source
                const posX = effect.data?.source?.x || effect.data?.position?.x || 0;
                const posY = effect.data?.source?.y || effect.data?.position?.y || 0;

                console.log(`[Yunyun Runes] Found placed rune: ${effect.data.name}, type: ${runeType}, position: (${posX}, ${posY})`);

                if (runeConfig) {
                    placedRunes.push({
                        type: runeType,
                        config: runeConfig,
                        effectName: effect.data.name,
                        position: {
                            x: posX,
                            y: posY
                        }
                    });
                }
            }
        }

        console.log(`[Yunyun Runes] Total placed runes detected: ${placedRunes.length}`);
        return placedRunes;
    }

    const existingRunes = getExistingRunes();
    const placedRunes = getPlacedRunes();
    const charismaValue = getCharismaValue(actor);

    // ===== DIALOG BUILDER =====

    /**
     * Construit le contenu HTML du dialogue
     */
    function buildDialogContent() {
        let html = `
            <style>
                .rune-dialog {
                    font-family: "Signika", sans-serif;
                    max-height: 70vh;
                    overflow-y: auto;
                }
                .rune-section {
                    margin-bottom: 20px;
                    padding: 12px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
                    border: 2px solid #9c27b0;
                }
                .rune-section-title {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #9c27b0;
                    text-align: center;
                }
                .rune-item {
                    margin: 8px 0;
                    padding: 10px;
                    border-radius: 6px;
                    border: 2px solid #ddd;
                    background: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .rune-item:hover {
                    border-color: #9c27b0;
                    box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
                    transform: translateY(-2px);
                }
                .rune-item.selected {
                    border-color: #9c27b0;
                    background: #f3e5f5;
                    box-shadow: 0 0 10px rgba(156, 39, 176, 0.4);
                }
                .rune-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 6px;
                }
                .rune-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                }
                .rune-name {
                    font-weight: bold;
                    font-size: 14px;
                    flex: 1;
                }
                .rune-counter {
                    background: #9c27b0;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: bold;
                }
                .rune-info {
                    font-size: 12px;
                    color: #555;
                    margin-top: 4px;
                    padding-left: 42px;
                }
                .rune-placed {
                    background: #fff3e0;
                    border-color: #ff9800;
                }
                .action-section {
                    margin-top: 20px;
                    padding: 12px;
                    border-radius: 8px;
                    background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
                    border: 2px solid #2196f3;
                }
                .action-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #2196f3;
                    text-align: center;
                }
                .action-buttons {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                }
                .action-btn {
                    padding: 8px;
                    border-radius: 6px;
                    border: 2px solid #ccc;
                    background: white;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: bold;
                    transition: all 0.2s;
                    text-align: center;
                }
                .action-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }
                .action-btn.prepare {
                    border-color: #4caf50;
                    color: #4caf50;
                }
                .action-btn.prepare:hover {
                    background: #e8f5e9;
                }
                .action-btn.place {
                    border-color: #ff9800;
                    color: #ff9800;
                }
                .action-btn.place:hover {
                    background: #fff3e0;
                }
                .action-btn.activate {
                    border-color: #f44336;
                    color: #f44336;
                }
                .action-btn.activate:hover {
                    background: #ffebee;
                }
                .action-btn.recycle {
                    border-color: #9e9e9e;
                    color: #9e9e9e;
                }
                .action-btn.recycle:hover {
                    background: #f5f5f5;
                }
                .info-box {
                    margin-top: 15px;
                    padding: 10px;
                    border-radius: 6px;
                    background: #e8f5e9;
                    border: 1px solid #4caf50;
                    font-size: 12px;
                    color: #2e7d32;
                }
            </style>
            <div class="rune-dialog">
        `;

        // Section: Préparer une nouvelle rune
        html += `
            <div class="rune-section">
                <div class="rune-section-title">📝 Préparer une Nouvelle Rune</div>
        `;

        for (const [key, config] of Object.entries(RUNE_TYPES)) {
            const existing = existingRunes[key];
            const count = existing ? existing.count : 0;

            html += `
                <div class="rune-item prepare-rune" data-rune-type="${key}" data-action="prepare">
                    <div class="rune-header">
                        <img src="${config.icon}" class="rune-icon" />
                        <span class="rune-name">${config.displayName}</span>
                        ${count > 0 ? `<span class="rune-counter">×${count}</span>` : ''}
                    </div>
                    <div class="rune-info">
                        💧 ${config.manaCost} mana (${config.manaType}) |
                        ⏱️ Préparation: ${config.preparationAction} |
                        ⚡ Activation: ${config.activationAction}
                        <br/>📖 ${config.description}
                    </div>
                </div>
            `;
        }

        html += `</div>`;

        // Section: Runes préparées (actions disponibles)
        if (Object.keys(existingRunes).length > 0) {
            html += `
                <div class="rune-section">
                    <div class="rune-section-title">🎒 Runes Préparées (Galets)</div>
            `;

            for (const [key, runeData] of Object.entries(existingRunes)) {
                const config = runeData.config;
                html += `
                    <div class="rune-item prepared-rune" data-rune-type="${key}" data-action="manage">
                        <div class="rune-header">
                            <img src="${config.icon}" class="rune-icon" />
                            <span class="rune-name">${config.displayName}</span>
                            <span class="rune-counter">×${runeData.count}</span>
                        </div>
                        <div class="rune-info">
                            💧 ${config.manaCost} mana (${config.manaType}) |
                            ⚡ Activation: ${config.activationAction}
                            <br/>📖 ${config.description}
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
        }

        // Section: Runes placées sur le terrain
        if (placedRunes.length > 0) {
            html += `
                <div class="rune-section">
                    <div class="rune-section-title">🗺️ Runes Placées sur le Terrain</div>
            `;

            for (const placedRune of placedRunes) {
                const config = placedRune.config;
                html += `
                    <div class="rune-item rune-placed placed-rune" data-rune-type="${placedRune.type}" data-effect-name="${placedRune.effectName}" data-action="placed">
                        <div class="rune-header">
                            <img src="${config.icon}" class="rune-icon" />
                            <span class="rune-name">${config.displayName} (Placée)</span>
                        </div>
                        <div class="rune-info">
                            📍 Position: (${Math.round(placedRune.position.x)}, ${Math.round(placedRune.position.y)}) |
                            ⚡ Activation: ${config.activationAction}
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
        }

        // Info box
        html += `
            <div class="info-box">
                ℹ️ <strong>Instructions:</strong><br/>
                • Cliquez sur une rune pour la sélectionner<br/>
                • Une fois sélectionnée, choisissez l'action à effectuer dans le menu ci-dessous
            </div>
        `;

        html += `</div>`;

        return html;
    }

    // ===== MAIN DIALOG =====

    let selectedRuneType = null;
    let selectedAction = null;
    let selectedEffectName = null;

    const dialogContent = buildDialogContent();

    const choice = await new Promise((resolve) => {
        const dialog = new Dialog({
            title: "✨ Gestion des Runes de Yunyun",
            content: dialogContent,
            buttons: {
                prepare: {
                    label: "📝 Préparer",
                    callback: () => resolve({ action: "prepare", runeType: selectedRuneType })
                },
                place: {
                    label: "📍 Placer",
                    callback: () => resolve({ action: "place", runeType: selectedRuneType })
                },
                activate: {
                    label: "⚡ Activer",
                    callback: () => resolve({ action: "activate", runeType: selectedRuneType, effectName: selectedEffectName })
                },
                recycle: {
                    label: "♻️ Recycler",
                    callback: () => resolve({ action: "recycle", runeType: selectedRuneType, effectName: selectedEffectName })
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "prepare",
            render: (html) => {
                // Gestion de la sélection de rune
                html.find(".rune-item").on("click", function() {
                    html.find(".rune-item").removeClass("selected");
                    $(this).addClass("selected");

                    selectedRuneType = $(this).data("rune-type");
                    selectedAction = $(this).data("action");
                    selectedEffectName = $(this).data("effect-name") || null;

                    console.log(`[Yunyun Runes] Selected: ${selectedRuneType}, Action: ${selectedAction}`);
                });
            },
            close: () => resolve(null)
        }, {
            width: 600,
            height: "auto"
        });

        dialog.render(true);
    });

    if (!choice || !choice.action) {
        console.log("[Yunyun Runes] Macro cancelled by user");
        return;
    }

    if (!selectedRuneType) {
        ui.notifications.warn("⚠️ Veuillez d'abord sélectionner une rune !");
        return;
    }

    const runeConfig = RUNE_TYPES[selectedRuneType];
    const action = choice.action;

    console.log(`[Yunyun Runes] Executing action: ${action} on rune: ${selectedRuneType}`);

    // ===== ACTIONS HANDLER =====

    /**
     * ACTION: PRÉPARER UNE RUNE
     */
    if (action === "prepare") {
        const existingEffect = actor.effects.find(e => e.name === runeConfig.name || e.label === runeConfig.name);

        if (existingEffect) {
            // Augmenter le counter
            const currentCount = existingEffect.flags?.statuscounter?.value || 1;
            const newCount = currentCount + 1;

            const updateResult = await globalThis.gmSocket.executeAsGM(
                "updateEffectOnActor",
                casterToken.id,
                existingEffect.id,
                { "flags.statuscounter.value": newCount,
                "flags.statuscounter.visible": true
                 }
            );

            if (!updateResult.success) {
                ui.notifications.error(`❌ Impossible de mettre à jour la rune : ${updateResult.error}`);
                return;
            }

            ui.notifications.info(`✨ Yunyun prépare une ${runeConfig.name} supplémentaire ! (×${newCount})`);
        } else {
            // Créer un nouvel effet
            const effectData = {
                name: runeConfig.name,
                label: runeConfig.name,
                icon: runeConfig.icon,
                origin: `Actor.${actor.id}`,
                duration: { seconds: 86400 }, // 24 heures
                flags: {
                    statuscounter: { value: 1, visible: true },
                    world: {
                        yunyunRune: true,
                        runeType: selectedRuneType,
                        manaCost: runeConfig.manaCost
                    }
                }
            };

            const createResult = await globalThis.gmSocket.executeAsGM("applyEffectToActor", casterToken.id, effectData);

            if (!createResult.success) {
                ui.notifications.error(`❌ Impossible de créer la rune : ${createResult.error}`);
                return;
            }

            ui.notifications.info(`✨ Yunyun prépare une ${runeConfig.name} ! (×1)`);
        }

        // Message dans le chat
        const messageHTML = `
            <div style="border: 2px solid ${runeConfig.color}; background: ${runeConfig.bgColor}; border-radius: 8px; padding: 10px; font-family: 'Signika', sans-serif;">
                <h2 style="text-align: center; color: ${runeConfig.color}; margin: 0 0 8px 0;">
                    ${runeConfig.displayName}
                </h2>
                <p style="text-align: center; margin: 4px 0;">
                    <strong>Yunyun</strong> prépare une rune sur un galet
                </p>
                <div style="font-size: 11px; color: #666; text-align: center; margin-top: 8px;">
                    💧 ${runeConfig.manaCost} mana (${runeConfig.manaType}) |
                    ⏱️ ${runeConfig.preparationAction}
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: casterToken }),
            content: messageHTML
        });

        return;
    }

    /**
     * ACTION: PLACER UNE RUNE
     */
    if (action === "place") {
        // Vérifier que la rune est préparée
        const preparedRune = existingRunes[selectedRuneType];
        if (!preparedRune) {
            ui.notifications.warn("⚠️ Cette rune n'est pas encore préparée !");
            return;
        }

        // Sélection de position avec Portal
        let targetPosition;
        try {
            const portalInstance = new Portal()
                .color(runeConfig.color)
                .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm");

            targetPosition = await portalInstance.pick();
        } catch (error) {
            console.log("[Yunyun Runes] Portal targeting cancelled or failed:", error);
            ui.notifications.warn("⚠️ Ciblage annulé");
            return;
        }

        if (!targetPosition) {
            ui.notifications.warn("⚠️ Aucune position sélectionnée");
            return;
        }

        // Aligner sur la grille (comme dans simple-teleportation.js de Moctei)
        const gridSize = canvas.grid.size;
        const targetGridX = Math.floor(targetPosition.x / gridSize);
        const targetGridY = Math.floor(targetPosition.y / gridSize);
        const snappedX = targetGridX * gridSize;
        const snappedY = targetGridY * gridSize;

        // Centrer sur la case
        const centerX = snappedX + (gridSize / 2);
        const centerY = snappedY + (gridSize / 2);

        // Placer l'animation de la rune
        const sequencerName = `yunyun_rune_${selectedRuneType}_${Date.now()}`;

        if (typeof Sequence !== "undefined") {
            await new Sequence()
                .effect()
                    .file(runeConfig.animation.rune)
                    .name(sequencerName)
                    .atLocation({ x: centerX, y: centerY })
                    .scale(runeConfig.animation.scale)
                    .opacity(runeConfig.animation.opacity)
                    .tint(runeConfig.animation.tint)
                    .persist(true)
                    .belowTokens(true)
                .play();
        }

        // Décrémenter le counter de la rune préparée
        const currentCount = preparedRune.count;
        if (currentCount > 1) {
            const updateResult = await globalThis.gmSocket.executeAsGM(
                "updateEffectOnActor",
                casterToken.id,
                preparedRune.effect.id,
                { "flags.statuscounter.value": currentCount - 1 }
            );

            if (!updateResult.success) {
                ui.notifications.error(`❌ Impossible de mettre à jour le compteur : ${updateResult.error}`);
            }
        } else {
            // Retirer l'effet complètement
            const removeResult = await globalThis.gmSocket.executeAsGM(
                "removeEffectFromActor",
                casterToken.id,
                preparedRune.effect.id
            );

            if (!removeResult.success) {
                ui.notifications.error(`❌ Impossible de retirer l'effet : ${removeResult.error}`);
            }
        }

        ui.notifications.info(`📍 ${runeConfig.name} placée sur le terrain !`);

        // Message dans le chat
        const messageHTML = `
            <div style="border: 2px solid ${runeConfig.color}; background: ${runeConfig.bgColor}; border-radius: 8px; padding: 10px; font-family: 'Signika', sans-serif;">
                <h2 style="text-align: center; color: ${runeConfig.color}; margin: 0 0 8px 0;">
                    ${runeConfig.displayName}
                </h2>
                <p style="text-align: center; margin: 4px 0;">
                    <strong>Yunyun</strong> place une rune sur le terrain
                </p>
                <div style="font-size: 11px; color: #666; text-align: center; margin-top: 8px;">
                    📍 Position: (${Math.round(centerX)}, ${Math.round(centerY)})
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: casterToken }),
            content: messageHTML
        });

        return;
    }

    /**
     * ACTION: ACTIVER UNE RUNE
     */
    if (action === "activate") {
        // Trouver la rune placée et/ou préparée
        const placedRune = placedRunes.find(r => r.type === selectedRuneType);
        const preparedRune = existingRunes[selectedRuneType];

        // Si la rune n'est ni placée ni préparée, erreur
        if (!placedRune && !preparedRune) {
            ui.notifications.warn("⚠️ Cette rune n'existe pas (ni placée ni préparée) !");
            return;
        }

        // Si la rune est placée, la supprimer visuellement
        if (placedRune && typeof Sequencer !== "undefined") {
            Sequencer.EffectManager.endEffects({ name: placedRune.effectName });
        }

        // Si la rune est préparée (et pas encore placée), déterminer si on a besoin de cibler
        let activationPosition = null;
        const needsTargeting = preparedRune && !placedRune &&
            (runeConfig.activationEffect === 'teleportation' || runeConfig.activationEffect === 'healing');

        if (needsTargeting) {
            // Seulement les runes de transposition et de soin ont besoin de ciblage
            ui.notifications.info("🎯 Sélectionnez où placer et activer la rune...");

            try {
                const portalInstance = new Portal()
                    .color(runeConfig.color)
                    .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm");

                activationPosition = await portalInstance.pick();
            } catch (error) {
                console.log("[Yunyun Runes] Portal targeting cancelled:", error);
                ui.notifications.warn("⚠️ Ciblage annulé");
                return;
            }

            if (!activationPosition) {
                ui.notifications.warn("⚠️ Aucune position sélectionnée");
                return;
            }

            // Centrer la position sur la grille
            const gridSize = canvas.grid.size;
            const targetGridX = Math.floor(activationPosition.x / gridSize);
            const targetGridY = Math.floor(activationPosition.y / gridSize);
            const snappedX = targetGridX * gridSize;
            const snappedY = targetGridY * gridSize;

            activationPosition.x = snappedX + (gridSize / 2);
            activationPosition.y = snappedY + (gridSize / 2);
        } else if (placedRune) {
            // La rune était déjà placée, utiliser sa position
            activationPosition = placedRune.position;
        }
        // Pour explosion/mur/générique préparées non placées : activationPosition reste null (pas besoin)

        // Décrémenter le compteur de rune préparée
        if (preparedRune) {
            const currentCount = preparedRune.count;
            if (currentCount > 1) {
                const updateResult = await globalThis.gmSocket.executeAsGM(
                    "updateEffectOnActor",
                    casterToken.id,
                    preparedRune.effect.id,
                    { "flags.statuscounter.value": currentCount - 1 }
                );

                if (!updateResult.success) {
                    ui.notifications.error(`❌ Impossible de mettre à jour le compteur : ${updateResult.error}`);
                }
            } else {
                const removeResult = await globalThis.gmSocket.executeAsGM(
                    "removeEffectFromActor",
                    casterToken.id,
                    preparedRune.effect.id
                );

                if (!removeResult.success) {
                    ui.notifications.error(`❌ Impossible de retirer l'effet : ${removeResult.error}`);
                }
            }
        }

        // Exécuter l'effet d'activation selon le type
        await executeRuneActivation(selectedRuneType, runeConfig, activationPosition);

        return;
    }

    /**
     * ACTION: RECYCLER UNE RUNE
     */
    if (action === "recycle") {
        // Trouver la rune (placée ou préparée)
        const placedRune = placedRunes.find(r => r.type === selectedRuneType);
        const preparedRune = existingRunes[selectedRuneType];

        let recycleMessage = "";

        // Si la rune est placée, la supprimer
        if (placedRune && typeof Sequencer !== "undefined") {
            Sequencer.EffectManager.endEffects({ name: placedRune.effectName });
            recycleMessage = "Yunyun récupère la rune du terrain. ";
        }

        // Si la rune est préparée, décrémenter
        if (preparedRune) {
            const currentCount = preparedRune.count;
            if (currentCount > 1) {
                const updateResult = await globalThis.gmSocket.executeAsGM(
                    "updateEffectOnActor",
                    casterToken.id,
                    preparedRune.effect.id,
                    { "flags.statuscounter.value": currentCount - 1 }
                );

                if (!updateResult.success) {
                    ui.notifications.error(`❌ Impossible de mettre à jour le compteur : ${updateResult.error}`);
                }
            } else {
                const removeResult = await globalThis.gmSocket.executeAsGM(
                    "removeEffectFromActor",
                    casterToken.id,
                    preparedRune.effect.id
                );

                if (!removeResult.success) {
                    ui.notifications.error(`❌ Impossible de retirer l'effet : ${removeResult.error}`);
                }
            }
            recycleMessage = "Yunyun recycle la rune préparée. ";
        }

        ui.notifications.info(`♻️ ${runeConfig.name} recyclée !`);

        // Message dans le chat
        const messageHTML = `
            <div style="border: 2px solid ${runeConfig.color}; background: ${runeConfig.bgColor}; border-radius: 8px; padding: 10px; font-family: 'Signika', sans-serif;">
                <h2 style="text-align: center; color: ${runeConfig.color}; margin: 0 0 8px 0;">
                    ♻️ Recyclage de Rune
                </h2>
                <p style="text-align: center; margin: 4px 0;">
                    <strong>Yunyun</strong> recycle une ${runeConfig.name}
                </p>
                <div style="font-size: 11px; color: #666; text-align: center; margin-top: 8px;">
                    ${recycleMessage}Yunyun peut récupérer ${runeConfig.manaCost} mana si elle est à côté de la rune.
                    <br/>⏱️ Action: ${runeConfig.preparationAction}
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: casterToken }),
            content: messageHTML
        });

        return;
    }

    // ===== ACTIVATION EFFECTS =====

    /**
     * Exécute l'effet d'activation de la rune
     * @param {string} runeType - Type de rune
     * @param {Object} config - Configuration de la rune
     * @param {Object} position - Position {x, y} de la rune (peut être null pour certains types)
     */
    async function executeRuneActivation(runeType, config, position) {
        const activationType = config.activationEffect;

        let messageHTML = `
            <div style="border: 2px solid ${config.color}; background: ${config.bgColor}; border-radius: 8px; padding: 10px; font-family: 'Signika', sans-serif;">
                <h2 style="text-align: center; color: ${config.color}; margin: 0 0 8px 0;">
                    ⚡ ${config.displayName} Activée !
                </h2>
        `;

        switch (activationType) {
            case "explosion":
                // Rune Explosive - Détruit l'animation, explosion gérée par autre macro
                messageHTML += `
                    <p style="text-align: center; margin: 4px 0; font-weight: bold; color: #f44336;">
                        💥 EXPLOSION DÉVASTATRICE !
                    </p>
                    <p style="text-align: center; margin: 4px 0; font-size: 12px; color: #666;">
                        La rune explose violemment !<br/>
                        (Utiliser la macro "Explosion" pour résoudre les dégâts)
                    </p>
                `;
                ui.notifications.info("💥 Rune Explosive déclenchée !");
                break;

            case "teleportation":
                // Rune de Transposition - Téléporte Yunyun
                if (!position) {
                    ui.notifications.error("❌ La rune doit avoir une position pour se téléporter !");
                    return;
                }

                const gridSize = canvas.grid.size;

                // Calculer la position de grille alignée
                const targetGridX = Math.floor(position.x / gridSize);
                const targetGridY = Math.floor(position.y / gridSize);
                const gridX = targetGridX * gridSize;
                const gridY = targetGridY * gridSize;

                // Animation de téléportation (inspirée de simple-teleportation.js de Moctei)
                const originalCenter = {
                    x: casterToken.document.x + (gridSize / 2),
                    y: casterToken.document.y + (gridSize / 2)
                };

                const destinationCenter = {
                    x: gridX + (gridSize / 2),
                    y: gridY + (gridSize / 2)
                };

                // Animation de départ + projectile + arrivée
                if (typeof Sequence !== "undefined") {
                    const teleportSeq = new Sequence()
                        .effect()
                            .file("jb2a.misty_step.01.blue")
                            .atLocation(originalCenter)
                            .scale(0.8)
                            .fadeIn(300)
                            .fadeOut(500)
                        .effect()
                            .file("jb2a.energy_strands.range.standard.purple.01")
                            .atLocation(originalCenter)
                            .stretchTo(destinationCenter)
                            .scale(0.6)
                            .waitUntilFinished(-500)
                            .tint("#2600fd")
                        .effect()
                            .file("jb2a.misty_step.01.blue")
                            .atLocation(destinationCenter)
                            .scale(0.8)
                            .fadeIn(300)
                            .fadeOut(500);

                    teleportSeq.play();

                    // Téléporter le token après 1 seconde avec le mode blink
                    setTimeout(async () => {
                        try {
                            // Sauvegarder le mode de déplacement actuel
                            const originalMovementType = casterToken.document.movementAction;

                            // Activer le mode de déplacement "Teleportation" de FoundryVTT
                            await casterToken.document.update({ movementAction: 'blink' });

                            // Effectuer le déplacement
                            await casterToken.document.update({
                                x: gridX,
                                y: gridY
                            });

                            // Restaurer le mode de déplacement original
                            await casterToken.document.update({ movementAction: originalMovementType });
                        } catch (error) {
                            console.error("[Yunyun Runes] Teleportation error:", error);
                        }
                    }, 1000);
                } else {
                    // Téléportation sans animation
                    try {
                        const originalMovementType = casterToken.document.movementAction;
                        await casterToken.document.update({ movementAction: 'blink' });
                        await casterToken.document.update({
                            x: gridX,
                            y: gridY
                        });
                        await casterToken.document.update({ movementAction: originalMovementType });
                    } catch (error) {
                        console.error("[Yunyun Runes] Teleportation error:", error);
                    }
                }

                messageHTML += `
                    <p style="text-align: center; margin: 4px 0; font-weight: bold; color: #2196f3;">
                        🌀 Téléportation Magique !
                    </p>
                    <p style="text-align: center; margin: 4px 0; font-size: 12px; color: #666;">
                        Yunyun se téléporte à l'emplacement de la rune !<br/>
                        📍 Position: (${Math.round(destinationCenter.x)}, ${Math.round(destinationCenter.y)})
                    </p>
                `;
                ui.notifications.info("🌀 Yunyun se téléporte !");
                break;

            case "wall":
                // Rune Mur de Terre - Détruit l'animation, mur géré par autre macro
                messageHTML += `
                    <p style="text-align: center; margin: 4px 0; font-weight: bold; color: #8d6e63;">
                        🧱 Invocation de Mur de Terre !
                    </p>
                    <p style="text-align: center; margin: 4px 0; font-size: 12px; color: #666;">
                        Un mur de terre solide surgit du sol !<br/>
                        (Utiliser la macro "Mur de Pierre" pour placer le mur)
                    </p>
                `;
                ui.notifications.info("🧱 Rune Mur de Terre activée !");
                break;

            case "healing":
                // Rune de Soin - Utilise la position déjà ciblée ou demande une nouvelle position
                let healingTarget;

                // Si position déjà fournie (cas "placer + activer"), l'utiliser
                if (position) {
                    healingTarget = position;
                } else {
                    // Sinon demander le ciblage (cas rune déjà placée qu'on active)
                    try {
                        const healingPortal = new Portal()
                            .color("#4caf50")
                            .texture("modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm");

                        healingTarget = await healingPortal.pick();
                    } catch (error) {
                        console.log("[Yunyun Runes] Healing target cancelled:", error);
                        ui.notifications.warn("⚠️ Ciblage de soin annulé");
                        return;
                    }

                    if (!healingTarget) {
                        ui.notifications.warn("⚠️ Aucune cible sélectionnée pour le soin");
                        return;
                    }
                }

                // Trouver le token à la position
                const healingTokens = canvas.tokens.placeables.filter(token => {
                    const tokenBounds = token.bounds;
                    return healingTarget.x >= tokenBounds.x &&
                           healingTarget.x < tokenBounds.x + tokenBounds.width &&
                           healingTarget.y >= tokenBounds.y &&
                           healingTarget.y < tokenBounds.y + tokenBounds.height;
                });

                const healingToken = healingTokens[0];
                const targetName = healingToken ? healingToken.name : "Cible Inconnue";
                const healingAmount = charismaValue;

                // Animation de soin
                if (healingToken && typeof Sequence !== "undefined") {
                    await new Sequence()
                        .effect()
                            .file("jb2a.healing_generic.burst.greenorange")
                            .atLocation(healingToken)
                            .scale(0.6)
                        .play();
                }

                messageHTML += `
                    <p style="text-align: center; margin: 4px 0; font-weight: bold; color: #4caf50;">
                        💚 Soin Runique !
                    </p>
                    <p style="text-align: center; margin: 4px 0; font-size: 12px; color: #666;">
                        Yunyun soigne <strong>${targetName}</strong> avec du pansement cœur<br/>
                        💖 Soin: <strong>${healingAmount} PV</strong> (Charisme de Yunyun)
                    </p>
                `;
                ui.notifications.info(`💚 ${targetName} soigné de ${healingAmount} PV !`);
                break;

            case "custom":
                // Rune Générique - Effet personnalisé
                messageHTML += `
                    <p style="text-align: center; margin: 4px 0; font-weight: bold; color: #9c27b0;">
                        ✨ Effet Runique Personnalisé !
                    </p>
                    <p style="text-align: center; margin: 4px 0; font-size: 12px; color: #666;">
                        L'effet en accord avec le MJ s'applique<br/>
                        🎲 Effet à déterminer par le Maître du Jeu
                    </p>
                `;
                ui.notifications.info("✨ Rune Générique activée - Effet MJ !");
                break;
        }

        messageHTML += `
                <div style="font-size: 11px; color: #666; text-align: center; margin-top: 8px;">
                    ⚡ Type d'activation: ${config.activationAction}
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: casterToken }),
            content: messageHTML
        });
    }

})();
