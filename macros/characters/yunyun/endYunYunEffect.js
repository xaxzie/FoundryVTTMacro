/**
 * End Yunyun Effects (Terminer Effets de Yunyun) - Yunyun (Mage Polyvalente)
 *
 * Macro pour terminer les effets que Yunyun a appliqués sur d'autres tokens ou zones.
 * Spécialisé pour les effets de magie polyvalente de Yunyun.
 *
 * Fonctionnalités :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détecte automatiquement tous les effets appliqués par Yunyun sur le canvas
 * - Interface de sélection pour choisir quels effets supprimer
 * - Supprime les animations Sequencer associées si applicable
 * - Gestion par délégation GM pour les tokens non possédés
 * - Facilement extensible pour de nouveaux effets via EFFECT_CONFIG
 * - Spécialisé pour les mécaniques de magie polyvalente de Yunyun
 *
 * GUIDE D'EXTENSION POUR DE NOUVEAUX SORTS :
 *
 * 1. Configuration dans le nouveau sort :
 *    - Ajouter une section `effectConfig` ou `statusEffects` dans SPELL_CONFIG
 *    - Inclure une sous-section `endEffectConfig` avec les propriétés suivantes :
 *      * displayName, sectionTitle, sectionIcon, cssClass
 *      * borderColor, bgColor, mechanicType
 *      * detectFlags (pour identifier l'effet)
 *      * removeAnimation (animation de suppression)
 *      * cleanup (patterns Sequencer à nettoyer)
 *      * getExtraData, getDynamicDescription (optionnel)
 *
 * 2. Mise à jour d'endYunYunEffect.js :
 *    - Ajouter l'entrée dans EFFECT_CONFIG en important la config du sort
 *    - Le système détectera automatiquement le nouvel effet
 *
 * 3. Mécaniques supportées :
 *    - "simple" : Effet d'acteur standard avec animation de retrait
 *    - "persistentZone" : Zone permanente avec cleanup d'animations Sequencer
 *    - "slowdown" : Effets avec Status Counter pour ralentissement
 *
 * Usage : Sélectionner le token de Yunyun et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DU PERSONNAGE =====
    const CHARACTER_CONFIG = {
        name: "Yunyun",
        displayName: "Yunyun (Mage Polyvalente)",
        icon: "✨",
        color: "#9c27b0",
        noEffectsMessage: "Pas d'effets magiques détectés à supprimer !",
        dialogTitle: "Terminer Effets de Yunyun",
        chatTitle: "Effets Magiques de Yunyun Terminés"
    };

    // ===== CONFIGURATION CENTRALISÉE DES EFFETS =====
    /**
     * Configuration centralisée qui réunit toutes les configurations d'effets de Yunyun
     * provenant des différents sorts (ramollissement.js, futurs sorts, etc.)
     */
    const EFFECT_CONFIG = {
        "Sol Ramoli": {
            displayName: "Sol Ramoli",
            icon: "icons/magic/earth/barrier-stone-brown.webp",
            description: "Sol ramolli par Yunyun (ralentissement de déplacement)",
            sectionTitle: "🌍 Sol Ramoli",
            sectionIcon: "🌍",
            cssClass: "ramollissement-effect",
            borderColor: "#8d6e63",
            bgColor: "#efebe9",
            detectFlags: [
                { path: "name", matchValue: "Sol Ramoli" },
                { path: "flags.world.yunyunCaster", matchValue: "CASTER_ID" }
            ],
            cleanup: {
                sequencerPatterns: ["ramollissement_yunyun_zone_*"],
                utilityFunction: "YunyunRamollissementUtils.endSpell"
            },
            mechanicType: "slowdown",
            getExtraData: (effect) => ({
                slowdownAmount: effect.flags?.world?.slowdownAmount || 1,
                sourceSpell: effect.flags?.world?.spellName || "Ramollissement"
            }),
            getDynamicDescription: (effect) => {
                const slowdown = effect.flags?.world?.slowdownAmount || 1;
                return `Ralentissement: ${slowdown} case${slowdown > 1 ? 's' : ''} de déplacement`;
            }
        }
        // Futurs effets seront ajoutés ici quand de nouveaux sorts sont créés
    };

    /**
     * Fonction utilitaire pour enregistrer de nouveaux effets de Yunyun dynamiquement
     * Peut être appelée par d'autres macros pour étendre les configurations
     */
    function registerYunyunEffect(effectName, effectConfig) {
        if (EFFECT_CONFIG[effectName]) {
            console.warn(`[DEBUG] Effect ${effectName} already exists, overriding...`);
        }
        EFFECT_CONFIG[effectName] = effectConfig;
        console.log(`[DEBUG] Registered new Yunyun effect: ${effectName}`);
    }

    // Exposer la fonction d'enregistrement globalement pour autres macros
    if (!globalThis.YunyunEffectRegistry) {
        globalThis.YunyunEffectRegistry = {
            register: registerYunyunEffect,
            getConfig: () => EFFECT_CONFIG
        };
    }

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Yunyun !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé pour le token sélectionné !");
        return;
    }

    // ===== DETECTION DES EFFETS ACTIFS =====
    /**
     * Détecte tous les effets appliqués par Yunyun sur le canvas
     * @returns {Array} Liste des effets détectés avec leurs configurations
     */
    function detectActiveYunyunEffects() {
        const detectedEffects = [];
        const casterId = actor.id;

        console.log(`[DEBUG] Detecting effects for Yunyun (${actor.name}, ID: ${casterId})`);

        // Parcourir tous les tokens du canvas
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            // Vérifier chaque effet de l'acteur
            for (const effect of token.actor.effects.contents) {
                // Vérifier si cet effet correspond à une configuration de Yunyun
                for (const [configKey, config] of Object.entries(EFFECT_CONFIG)) {
                    if (effectMatchesConfig(effect, config, casterId)) {
                        const extraData = config.getExtraData ? config.getExtraData(effect) : {};
                        const dynamicDescription = config.getDynamicDescription ? config.getDynamicDescription(effect) : config.description;

                        detectedEffects.push({
                            token: token,
                            effect: effect,
                            config: config,
                            configKey: configKey,
                            extraData: extraData,
                            dynamicDescription: dynamicDescription
                        });

                        console.log(`[DEBUG] Found ${configKey} effect on ${token.name}:`, extraData);
                    }
                }
            }
        }

        // Détecter les zones persistantes (effets Sequencer sans acteur associé)
        const persistentZones = detectPersistentZones(casterId);
        detectedEffects.push(...persistentZones);

        return detectedEffects;
    }

    /**
     * Vérifie si un effet correspond à une configuration donnée
     * @param {Object} effect - L'effet à vérifier
     * @param {Object} config - La configuration à comparer
     * @param {string} casterId - L'ID du lanceur
     * @returns {boolean} True si l'effet correspond
     */
    function effectMatchesConfig(effect, config, casterId) {
        if (!config.detectFlags || !Array.isArray(config.detectFlags)) {
            return false;
        }

        return config.detectFlags.every(flag => {
            const actualValue = getNestedProperty(effect, flag.path);
            const expectedValue = flag.matchValue === "CASTER_ID" ? casterId : flag.matchValue;

            const matches = actualValue === expectedValue;
            if (!matches) {
                console.log(`[DEBUG] Flag mismatch - Path: ${flag.path}, Expected: ${expectedValue}, Actual: ${actualValue}`);
            }
            return matches;
        });
    }

    /**
     * Détecte les zones persistantes (animations Sequencer)
     * @param {string} casterId - L'ID du lanceur
     * @returns {Array} Liste des zones persistantes détectées
     */
    function detectPersistentZones(casterId) {
        const persistentZones = [];

        try {
            const sequencerEffects = Sequencer.EffectManager.getEffects();

            for (const seqEffect of sequencerEffects) {
                // Vérifier les patterns de ramollissement
                if (seqEffect.data?.name?.includes("ramollissement_yunyun_zone")) {
                    const config = EFFECT_CONFIG["Sol Ramoli"];
                    if (config) {
                        persistentZones.push({
                            token: null, // Pas de token associé
                            effect: null, // Pas d'effet d'acteur
                            sequencerEffect: seqEffect,
                            config: config,
                            configKey: "Sol Ramoli",
                            extraData: {
                                type: "persistentZone",
                                position: seqEffect.data.position || { x: 0, y: 0 }
                            },
                            dynamicDescription: "Zone de sol ramolli persistante"
                        });

                        console.log(`[DEBUG] Found persistent zone: ramollissement at`, seqEffect.data.position);
                    }
                }
            }
        } catch (error) {
            console.error("[DEBUG] Error detecting Sequencer effects:", error);
        }

        return persistentZones;
    }

    /**
     * Accède à une propriété imbriquée d'un objet
     * @param {Object} obj - L'objet à parcourir
     * @param {string} path - Le chemin vers la propriété (ex: "flags.world.caster")
     * @returns {*} La valeur trouvée ou undefined
     */
    function getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    // ===== DÉTECTION ET VALIDATION =====
    const activeEffects = detectActiveYunyunEffects();

    if (activeEffects.length === 0) {
        ui.notifications.info(CHARACTER_CONFIG.noEffectsMessage);
        return;
    }

    console.log(`[DEBUG] Found ${activeEffects.length} active Yunyun effects`);

    // ===== INTERFACE DE SÉLECTION =====
    /**
     * Affiche un dialogue pour sélectionner les effets à supprimer
     * @param {Array} effects - Liste des effets détectés
     * @returns {Promise<Array|null>} Liste des effets sélectionnés ou null si annulé
     */
    async function showEffectSelectionDialog(effects) {
        return new Promise((resolve) => {
            // Grouper les effets par section
            const groupedEffects = {};

            effects.forEach((effectData, index) => {
                const sectionTitle = effectData.config.sectionTitle || "🔮 Effets Divers";
                if (!groupedEffects[sectionTitle]) {
                    groupedEffects[sectionTitle] = [];
                }
                groupedEffects[sectionTitle].push({ ...effectData, index });
            });

            // Construire le contenu HTML
            let dialogContent = `
                <div style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 15px; border-radius: 10px; border: 2px solid ${CHARACTER_CONFIG.color}; font-family: Arial, sans-serif;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h2 style="color: #6a1b9a; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                            ${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.dialogTitle} ${CHARACTER_CONFIG.icon}
                        </h2>
                        <p style="color: #666; margin: 5px 0; font-style: italic;">Sélectionnez les effets à supprimer</p>
                    </div>
            `;

            // Ajouter chaque section d'effets
            for (const [sectionTitle, sectionEffects] of Object.entries(groupedEffects)) {
                const sectionIcon = sectionEffects[0].config.sectionIcon || "🔮";
                const sectionColor = sectionEffects[0].config.borderColor || CHARACTER_CONFIG.color;
                const sectionBg = sectionEffects[0].config.bgColor || "#f3e5f5";

                dialogContent += `
                    <div style="background: ${sectionBg}; padding: 12px; border-radius: 8px; border: 2px solid ${sectionColor}; margin: 10px 0;">
                        <h3 style="color: #6a1b9a; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
                            <span>${sectionIcon}</span>
                            <span>${sectionTitle}</span>
                            <span style="font-size: 0.8em; font-weight: normal;">(${sectionEffects.length})</span>
                        </h3>
                `;

                // Ajouter chaque effet de la section
                sectionEffects.forEach(effectData => {
                    const targetName = effectData.token ? effectData.token.name : "Zone Persistante";
                    const isZone = effectData.extraData.type === "persistentZone";

                    dialogContent += `
                        <div style="background: rgba(255, 255, 255, 0.3); padding: 8px; border-radius: 5px; margin: 5px 0; border-left: 3px solid ${sectionColor};">
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                                <input type="checkbox" id="effect_${effectData.index}" name="selectedEffects" value="${effectData.index}" checked style="transform: scale(1.2);">
                                <img src="${effectData.config.icon}" style="width: 24px; height: 24px; border-radius: 3px;">
                                <div style="flex-grow: 1;">
                                    <div style="font-weight: bold; color: #333;">${effectData.config.displayName}</div>
                                    <div style="font-size: 0.85em; color: #666;">
                                        ${isZone ? 'Zone' : 'Cible'}: <strong>${targetName}</strong>
                                    </div>
                                    <div style="font-size: 0.8em; color: #888; font-style: italic;">
                                        ${effectData.dynamicDescription}
                                    </div>
                                </div>
                            </label>
                        </div>
                    `;
                });

                dialogContent += `</div>`;
            }

            dialogContent += `
                    <div style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; margin-top: 15px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <button type="button" id="selectAll" style="padding: 5px 10px; border: 1px solid #666; background: #fff; border-radius: 3px; cursor: pointer;">Tout Sélectionner</button>
                            <button type="button" id="selectNone" style="padding: 5px 10px; border: 1px solid #666; background: #fff; border-radius: 3px; cursor: pointer;">Tout Désélectionner</button>
                        </div>
                    </div>
                </div>
            `;

            new Dialog({
                title: CHARACTER_CONFIG.dialogTitle,
                content: dialogContent,
                buttons: {
                    remove: {
                        icon: '<i class="fas fa-trash"></i>',
                        label: "Supprimer Sélectionnés",
                        callback: (html) => {
                            const selectedIndices = [];
                            html.find('input[name="selectedEffects"]:checked').each(function() {
                                selectedIndices.push(parseInt(this.value));
                            });

                            const selectedEffects = selectedIndices.map(index => effects[index]);
                            resolve(selectedEffects);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "remove",
                render: (html) => {
                    // Gérer les boutons de sélection
                    html.find('#selectAll').click(() => {
                        html.find('input[name="selectedEffects"]').prop('checked', true);
                    });
                    html.find('#selectNone').click(() => {
                        html.find('input[name="selectedEffects"]').prop('checked', false);
                    });
                }
            }).render(true);
        });
    }

    const selectedEffects = await showEffectSelectionDialog(activeEffects);

    if (!selectedEffects || selectedEffects.length === 0) {
        ui.notifications.info("❌ Aucun effet sélectionné.");
        return;
    }

    // ===== SUPPRESSION DES EFFETS =====
    /**
     * Supprime les effets sélectionnés
     * @param {Array} effectsToRemove - Liste des effets à supprimer
     */
    async function removeSelectedEffects(effectsToRemove) {
        const results = {
            removed: [],
            failed: [],
            sequencerCleaned: []
        };

        for (const effectData of effectsToRemove) {
            const config = effectData.config;

            try {
                // Supprimer l'effet d'acteur (si présent)
                if (effectData.effect) {
                    await effectData.effect.delete();
                    results.removed.push({
                        name: config.displayName,
                        target: effectData.token.name
                    });
                    console.log(`[DEBUG] Removed ${config.displayName} from ${effectData.token.name}`);
                }

                // Nettoyer les animations Sequencer
                if (config.cleanup) {
                    if (config.cleanup.sequencerPatterns) {
                        for (const pattern of config.cleanup.sequencerPatterns) {
                            try {
                                await Sequencer.EffectManager.endEffects({ name: pattern });
                                results.sequencerCleaned.push(pattern);
                                console.log(`[DEBUG] Cleaned Sequencer pattern: ${pattern}`);
                            } catch (seqError) {
                                console.error(`[DEBUG] Failed to clean Sequencer pattern ${pattern}:`, seqError);
                            }
                        }
                    }

                    // Utiliser une fonction utilitaire spécialisée si disponible
                    if (config.cleanup.utilityFunction) {
                        try {
                            const utilityFunc = eval(config.cleanup.utilityFunction);
                            if (typeof utilityFunc === 'function') {
                                await utilityFunc();
                                console.log(`[DEBUG] Executed utility function: ${config.cleanup.utilityFunction}`);
                            }
                        } catch (utilError) {
                            console.error(`[DEBUG] Failed to execute utility function ${config.cleanup.utilityFunction}:`, utilError);
                        }
                    }
                }

                // Supprimer l'effet Sequencer direct (pour zones persistantes)
                if (effectData.sequencerEffect) {
                    try {
                        await Sequencer.EffectManager.endEffects({ name: effectData.sequencerEffect.data.name });
                        results.sequencerCleaned.push(effectData.sequencerEffect.data.name);
                        console.log(`[DEBUG] Ended direct Sequencer effect: ${effectData.sequencerEffect.data.name}`);
                    } catch (seqError) {
                        console.error(`[DEBUG] Failed to end Sequencer effect:`, seqError);
                    }
                }

            } catch (error) {
                console.error(`[DEBUG] Failed to remove effect ${config.displayName}:`, error);
                results.failed.push({
                    name: config.displayName,
                    target: effectData.token ? effectData.token.name : "Zone",
                    error: error.message
                });
            }
        }

        return results;
    }

    const removalResults = await removeSelectedEffects(selectedEffects);

    // ===== MESSAGE DE CHAT =====
    /**
     * Crée le message de chat récapitulatif
     * @param {Object} results - Résultats de la suppression
     * @returns {string} Contenu HTML du message
     */
    function createRemovalChatMessage(results) {
        const totalRemoved = results.removed.length;
        const totalFailed = results.failed.length;

        let content = `
            <div style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 12px; border-radius: 8px; border: 2px solid ${CHARACTER_CONFIG.color};">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h3 style="color: #6a1b9a; margin: 0;">${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.chatTitle} ${CHARACTER_CONFIG.icon}</h3>
                    <div style="color: #666; font-size: 0.9em;">Lanceur: <strong>${actor.name}</strong></div>
                </div>

                <div style="background: rgba(76, 175, 80, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                    <strong>✅ Effets Supprimés:</strong> ${totalRemoved}
        `;

        if (results.removed.length > 0) {
            content += `<ul style="margin: 5px 0; padding-left: 20px;">`;
            results.removed.forEach(item => {
                content += `<li>${item.name} (${item.target})</li>`;
            });
            content += `</ul>`;
        }

        content += `</div>`;

        if (results.sequencerCleaned.length > 0) {
            content += `
                <div style="background: rgba(33, 150, 243, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                    <strong>🎬 Animations Nettoyées:</strong> ${results.sequencerCleaned.length}
                </div>
            `;
        }

        if (results.failed.length > 0) {
            content += `
                <div style="background: rgba(244, 67, 54, 0.1); padding: 8px; border-radius: 5px; margin: 10px 0;">
                    <strong>❌ Échecs:</strong> ${totalFailed}
                    <ul style="margin: 5px 0; padding-left: 20px;">
            `;
            results.failed.forEach(item => {
                content += `<li>${item.name} (${item.target}) - ${item.error}</li>`;
            });
            content += `</ul></div>`;
        }

        content += `</div>`;
        return content;
    }

    const chatContent = createRemovalChatMessage(removalResults);

    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: chatContent,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== NOTIFICATION FINALE =====
    const totalProcessed = removalResults.removed.length + removalResults.failed.length;
    const successCount = removalResults.removed.length;
    const sequencerCount = removalResults.sequencerCleaned.length;

    let notificationMsg = `${CHARACTER_CONFIG.chatTitle} ! ${successCount}/${totalProcessed} effet${totalProcessed > 1 ? 's' : ''} supprimé${successCount > 1 ? 's' : ''}`;
    if (sequencerCount > 0) {
        notificationMsg += ` (+ ${sequencerCount} animation${sequencerCount > 1 ? 's' : ''})`;
    }

    if (removalResults.failed.length > 0) {
        ui.notifications.warn(notificationMsg + ` - ${removalResults.failed.length} échec${removalResults.failed.length > 1 ? 's' : ''}`);
    } else {
        ui.notifications.info(notificationMsg);
    }

    console.log(`[DEBUG] End Yunyun Effects complete - Processed: ${totalProcessed}, Success: ${successCount}, Failed: ${removalResults.failed.length}, Sequencer cleaned: ${sequencerCount}`);

})();
