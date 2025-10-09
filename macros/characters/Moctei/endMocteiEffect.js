/**
 * End Moctei Effects (Terminer Effets de Moctei) - Moctei (Mage des Ombres)
 *
 * Macro pour terminer les effets que Moctei a appliqués sur d'autres tokens.
 * Spécialisé pour les effets d'ombre et de magie sombre de Moctei.
 *
 * Fonctionnalités :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détecte automatiquement tous les effets appliqués par Moctei sur le canvas
 * - Interface de sélection pour choisir quels effets supprimer
 * - Supprime les animations Sequencer associées si applicable
 * - Gestion par délégation GM pour les tokens non possédés
 * - Facilement extensible pour de nouveaux effets via EFFECT_CONFIG
 * - Spécialisé pour les mécaniques d'ombre de Moctei
 *
 * Pour ajouter un nouvel effet :
 * 1. Ajouter l'entrée dans EFFECT_CONFIG avec les paramètres appropriés
 * 2. Le système détectera automatiquement le nouvel effet
 *
 * Usage : Sélectionner le token de Moctei et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DU PERSONNAGE =====
    const CHARACTER_CONFIG = {
        name: "Moctei",
        displayName: "Moctei (Mage des Ombres)",
        icon: "🌑",
        color: "#4a148c",
        noEffectsMessage: "Pas d'effets d'ombre détectés à supprimer !",
        dialogTitle: "Terminer Effets de Moctei",
        chatTitle: "Effets d'Ombre de Moctei Terminés"
    };

    // ===== CONFIGURATION DES EFFETS =====
    const EFFECT_CONFIG = {
        // Manipulation des ombres - Effet principal d'immobilisation
        "Manipulation des ombres": {
            displayName: "Manipulation des ombres",
            icon: "icons/creatures/tentacles/tentacles-octopus-black-pink.webp",
            description: "Immobilisé par les ombres de Moctei",
            sectionTitle: "🌑 Manipulation des Ombres",
            sectionIcon: "🌑",
            cssClass: "shadow-manipulation-effect",
            borderColor: "#2e0054",
            bgColor: "#f3e5f5",
            detectFlags: [
                { path: "name", matchValue: "Manipulation des ombres" },
                { path: "flags.world.shadowManipulationCaster", matchValue: "CASTER_ID" }
            ],
            cleanup: {
                sequencerNames: [
                    "shadowManipulationSequenceName", // Trait d'ombre
                    "immobilizationSequenceName"      // Effet d'immobilisation
                ]
            },
            mechanicType: "shadowManipulation"
        },

        // Flamme Noire - Effet de feu obscur (toutes variantes)
        "Flamme Noire": {
            displayName: "Flamme Noire",
            icon: "icons/magic/fire/flame-burning-eye.webp",
            description: "Brûlé par les flammes noires de Moctei",
            sectionTitle: "🔥 Flammes Noires",
            sectionIcon: "🔥",
            cssClass: "dark-flame-effect",
            borderColor: "#1a0033",
            bgColor: "#f3e5f5",
            detectFlags: [
                { path: "name", matchValue: "Flamme Noire" },
                { path: "flags.world.darkFlameCaster", matchValue: "CASTER_ID" }
            ],
            mechanicType: "darkFlame",
            // Données supplémentaires pour l'affichage
            getExtraData: (effect) => ({
                damagePerTurn: effect.flags?.statuscounter?.value || 0,
                isComboFlame: effect.flags?.world?.isComboFlame || false,
                sourceSpell: effect.flags?.world?.spellName || "Feu obscur",
                flameType: effect.flags?.world?.darkFlameType || "unknown"
            }),
            getDynamicDescription: (effect) => {
                const damage = effect.flags?.statuscounter?.value || 0;
                const isCombo = effect.flags?.world?.isComboFlame || false;
                const sourceSpell = effect.flags?.world?.spellName || "Feu obscur";
                const flameType = effect.flags?.world?.darkFlameType || "";

                let typeInfo = "";
                if (flameType === "source") typeInfo = " (source)";
                else if (flameType === "extension") typeInfo = " (extension)";

                if (isCombo) {
                    return `Flamme noire${typeInfo} (${sourceSpell}) - ${damage} dégâts/tour`;
                } else {
                    return `Flamme noire${typeInfo} - ${damage} dégâts/tour`;
                }
            }
        },

        // TODO: Add more Moctei's specific shadow effects here
        // Future effects like shadow teleportation, darkness manipulation, etc.
    };

    // ===== FONCTIONS UTILITAIRES =====

    /**
     * Vérifie si un effet correspond aux flags de configuration (comme Urgen)
     */
    function checkEffectFlags(effect, config, casterId, targetId = null) {
        for (const flagCheck of config.detectFlags) {
            if (flagCheck.path === "name") {
                // Vérification spéciale par nom d'effet (comme Urgen)
                if (effect.name === flagCheck.matchValue) {
                    return true;
                }
            } else {
                const flagValue = getProperty(effect, flagCheck.path);
                let expectedValue = flagCheck.matchValue;

                // Remplacements dynamiques
                if (expectedValue === "CASTER_ID") expectedValue = casterId;
                if (expectedValue === "TARGET_ID") expectedValue = targetId;

                if (flagValue === expectedValue) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Fonction de délégation GM pour suppression d'effets
     */
    async function removeEffectWithGMDelegation(targetActor, effectId) {
        if (!globalThis.gmSocket) {
            return { success: false, error: "GM Socket non disponible" };
        }
        return await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetActor.id, effectId);
    }

    /**
     * Fonction de délégation GM pour mise à jour d'effets
     */
    async function updateEffectWithGMDelegation(targetActor, effectId, updateData) {
        if (!globalThis.gmSocket) {
            return { success: false, error: "GM Socket non disponible" };
        }
        return await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetActor.id, effectId, updateData);
    }

    /**
     * Nettoie les animations Sequencer
     */
    function cleanupSequencerAnimations(effect, config) {
        if (config.cleanup?.sequencerName) {
            const sequenceName = getProperty(effect, config.cleanup.sequencerName);
            if (sequenceName) {
                try {
                    Sequencer.EffectManager.endEffects({ name: sequenceName });
                    console.log(`[Moctei] Cleaned up sequencer effect: ${sequenceName}`);
                } catch (seqError) {
                    console.warn(`[Moctei] Could not clean up sequencer effect ${sequenceName}:`, seqError);
                }
            }
        }

        if (config.cleanup?.sequencerNames) {
            for (const sequencerPath of config.cleanup.sequencerNames) {
                const sequenceName = getProperty(effect, sequencerPath);
                if (sequenceName) {
                    try {
                        Sequencer.EffectManager.endEffects({ name: sequenceName });
                        console.log(`[Moctei] Cleaned up sequencer effect: ${sequenceName}`);
                    } catch (seqError) {
                        console.warn(`[Moctei] Could not clean up sequencer effect ${sequenceName}:`, seqError);
                    }
                }
            }
        }
    }

    /**
     * Nettoie les filtres Token Magic FX
     */
    async function cleanupTokenMagicFilters(token, config) {
        if (config.cleanup?.removeTokenMagicFilters && config.transformationConfig?.tokenMagicFilters) {
            for (const filterType of config.transformationConfig.tokenMagicFilters) {
                try {
                    await TokenMagic.deleteFilters(token, filterType);
                    console.log(`[Moctei] Removed ${filterType} filter from ${token.name}`);
                } catch (tmfxError) {
                    console.warn(`[Moctei] Could not remove ${filterType} filter:`, tmfxError);
                }
            }
        }
    }

    /**
     * Traite la suppression d'un effet simple
     */
    async function handleSimpleEffectRemoval(effectInfo, results) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            // Cleanup des animations Sequencer
            cleanupSequencerAnimations(effect, config);

            // Cleanup des filtres Token Magic FX
            await cleanupTokenMagicFilters(token, config);

            // Animation de suppression
            if (config.removeAnimation) {
                const seq = new Sequence();
                seq.effect()
                    .file(config.removeAnimation.file)
                    .attachTo(token)
                    .scale(config.removeAnimation.scale || 1.0)
                    .duration(config.removeAnimation.duration || 2000)
                    .fadeOut(config.removeAnimation.fadeOut || 1000);

                if (config.removeAnimation.tint) {
                    seq.tint(config.removeAnimation.tint);
                }

                await seq.play();
            }

            // Suppression de l'effet
            if (token.actor.isOwner) {
                await effect.delete();
            } else {
                await removeEffectWithGMDelegation(token.actor, effect.id);
            }

            results.simple.push({
                target: token.name,
                effect: effectType
            });
            console.log(`[Moctei] Removed ${effectType} from ${token.name}`);

        } catch (error) {
            console.error(`[Moctei] Error removing ${effectType} from ${token.name}:`, error);
            results.failed.push({
                target: token.name,
                effect: effectType,
                error: error.message
            });
        }
    }

    /**
     * Traite la suppression d'un effet de manipulation des ombres
     */
    async function handleShadowManipulationRemoval(effectInfo, results) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            // Récupérer les informations du lanceur pour supprimer l'effet de contrôle
            const casterId = effect.flags?.world?.shadowManipulationCaster;
            const targetId = effect.flags?.world?.shadowManipulationTarget;

            // Cleanup des animations Sequencer spécifiques
            if (config.cleanup?.sequencerNames) {
                for (const sequencerKey of config.cleanup.sequencerNames) {
                    const sequencerName = effect.flags?.world?.[sequencerKey];
                    if (sequencerName) {
                        console.log(`[Moctei] Ending shadow manipulation animation: ${sequencerName}`);
                        Sequencer.EffectManager.endEffects({ name: sequencerName });
                    }
                }
            }

            // Animation de libération des ombres
            if (config.removeAnimation) {
                const seq = new Sequence();
                seq.effect()
                    .file(config.removeAnimation.file)
                    .attachTo(token)
                    .scale(config.removeAnimation.scale || 1.0)
                    .duration(config.removeAnimation.duration || 2000)
                    .fadeOut(config.removeAnimation.fadeOut || 1000)
                    .tint(config.removeAnimation.tint || "#2e0054");

                await seq.play();
            }

            // Suppression de l'effet sur la cible
            if (token.actor.isOwner) {
                await effect.delete();
            } else {
                await removeEffectWithGMDelegation(token.actor, effect.id);
            }

            // Supprimer l'effet de contrôle correspondant sur le lanceur
            if (casterId) {
                const casterToken = canvas.tokens.get(casterId);
                if (casterToken?.actor) {
                    const controlEffects = casterToken.actor.effects.contents.filter(e =>
                        e.name === "Manipulation des ombres (Contrôle)" &&
                        e.flags?.world?.shadowManipulationTarget === targetId
                    );

                    for (const controlEffect of controlEffects) {
                        try {
                            if (casterToken.actor.isOwner) {
                                await controlEffect.delete();
                            } else {
                                await removeEffectWithGMDelegation(casterToken.actor, controlEffect.id);
                            }
                            console.log(`[Moctei] Removed shadow manipulation control effect from ${casterToken.name}`);
                        } catch (error) {
                            console.error(`[Moctei] Error removing control effect:`, error);
                        }
                    }
                }
            }

            results.shadowEffects.push({
                target: token.name,
                effect: effectType
            });
            console.log(`[Moctei] Removed shadow manipulation from ${token.name}`);

        } catch (error) {
            console.error(`[Moctei] Error removing shadow manipulation from ${token.name}:`, error);
            results.failed.push({
                target: token.name,
                effect: effectType,
                error: error.message
            });
        }
    }

    /**
     * Traite la suppression d'un effet de flamme noire
     */
    async function handleDarkFlameRemoval(effectInfo, results) {
        const { token, effect, effectType, config } = effectInfo;

        try {
            // Récupérer les informations du lanceur pour mettre à jour l'effet de contrôle
            const casterId = effect.flags?.world?.darkFlameCaster;
            const targetId = effect.flags?.world?.darkFlameTarget;

            // Cleanup des animations Sequencer spécifiques
            if (config.cleanup?.sequencerNames) {
                for (const sequencerKey of config.cleanup.sequencerNames) {
                    const sequenceName = getProperty(effect, `flags.world.${sequencerKey}`);
                    if (sequenceName) {
                        try {
                            Sequencer.EffectManager.endEffects({ name: sequenceName });
                            console.log(`[Moctei] Cleaned up sequencer effect: ${sequenceName}`);
                        } catch (seqError) {
                            console.warn(`[Moctei] Could not clean up sequencer effect ${sequenceName}:`, seqError);
                        }
                    }
                }
            }

            // Animation d'extinction de la flamme
            if (config.removeAnimation) {
                const seq = new Sequence();
                seq.effect()
                    .file(config.removeAnimation.file)
                    .attachTo(token)
                    .scale(config.removeAnimation.scale || 1.0)
                    .duration(config.removeAnimation.duration || 2000)
                    .fadeOut(config.removeAnimation.fadeOut || 1000)
                    .tint(config.removeAnimation.tint || "#1a0033");

                await seq.play();
            }

            // Suppression de l'effet sur la cible
            if (token.actor.isOwner) {
                await effect.delete();
            } else {
                await removeEffectWithGMDelegation(token.actor, effect.id);
            }

            // Mettre à jour l'effet de contrôle correspondant sur le lanceur
            if (casterId) {
                const casterToken = canvas.tokens.get(casterId);
                if (casterToken?.actor) {
                    const controlEffects = casterToken.actor.effects.contents.filter(e =>
                        e.name === "Feu obscur (Contrôle)" &&
                        e.flags?.world?.darkFlameTargets?.includes(targetId)
                    );

                    for (const controlEffect of controlEffects) {
                        try {
                            const currentSources = controlEffect.flags?.world?.darkFlameInitialSources || [];
                            const currentExtensions = controlEffect.flags?.world?.darkFlameExtensions || [];
                            const currentTargets = controlEffect.flags?.world?.darkFlameTargets || [];

                            // Vérifier si la cible supprimée est une source initiale ou une extension
                            // D'abord vérifier le flag directement sur l'effet supprimé
                            const flameType = effect.flags?.world?.darkFlameType;
                            const isInitialSource = flameType === "source" || currentSources.includes(targetId);
                            const isExtension = flameType === "extension" || currentExtensions.includes(targetId);

                            if (isInitialSource) {
                                // C'est une source initiale - retirer toutes les extensions associées et décrémenter le compteur
                                const updatedSources = currentSources.filter(id => id !== targetId);

                                // TODO: Pour une implémentation complète, il faudrait identifier et supprimer
                                // les extensions liées à cette source spécifique
                                // Pour l'instant, on garde toutes les extensions (comportement simplifié)
                                const updatedExtensions = currentExtensions;
                                const updatedTargets = [...updatedSources, ...updatedExtensions];

                                if (updatedSources.length === 0) {
                                    // Plus de sources, supprimer l'effet de contrôle
                                    if (casterToken.actor.isOwner) {
                                        await controlEffect.delete();
                                    } else {
                                        await removeEffectWithGMDelegation(casterToken.actor, controlEffect.id);
                                    }
                                    console.log(`[Moctei] Removed dark flame control effect from ${casterToken.name} (no more sources)`);
                                } else {
                                    // Mettre à jour l'effet de contrôle - seul le compteur des sources change
                                    const updateData = {
                                        description: `Contrôle des flammes noires actives - ${updatedSources.length} source(s) active(s)`,
                                        flags: {
                                            ...controlEffect.flags,
                                            world: {
                                                ...controlEffect.flags.world,
                                                darkFlameInitialSources: updatedSources,
                                                darkFlameExtensions: updatedExtensions,
                                                darkFlameTargets: updatedTargets
                                            },
                                            statuscounter: { value: updatedSources.length, visible: true }
                                        }
                                    };

                                    if (casterToken.actor.isOwner) {
                                        await controlEffect.update(updateData);
                                    } else {
                                        await updateEffectWithGMDelegation(casterToken.actor, controlEffect.id, updateData);
                                    }
                                    console.log(`[Moctei] Updated dark flame control effect on ${casterToken.name}: ${updatedSources.length} sources remaining`);
                                }
                            } else if (isExtension) {
                                // C'est une extension - retirer seulement de la liste des extensions, ne pas toucher au compteur
                                const updatedExtensions = currentExtensions.filter(id => id !== targetId);
                                const updatedTargets = [...currentSources, ...updatedExtensions];

                                const updateData = {
                                    description: `Contrôle des flammes noires actives - ${currentSources.length} source(s) active(s)`,
                                    flags: {
                                        ...controlEffect.flags,
                                        world: {
                                            ...controlEffect.flags.world,
                                            darkFlameInitialSources: currentSources,
                                            darkFlameExtensions: updatedExtensions,
                                            darkFlameTargets: updatedTargets
                                        },
                                        statuscounter: { value: currentSources.length, visible: true } // Le compteur ne change pas
                                    }
                                };

                                if (casterToken.actor.isOwner) {
                                    await controlEffect.update(updateData);
                                } else {
                                    await updateEffectWithGMDelegation(casterToken.actor, controlEffect.id, updateData);
                                }
                                console.log(`[Moctei] Removed extension flame from control effect on ${casterToken.name}: ${currentSources.length} sources still active`);
                            } else {
                                // Cas de fallback - ancienne logique pour compatibilité
                                const updatedTargets = currentTargets.filter(id => id !== targetId);
                                if (updatedTargets.length === 0) {
                                    if (casterToken.actor.isOwner) {
                                        await controlEffect.delete();
                                    } else {
                                        await removeEffectWithGMDelegation(casterToken.actor, controlEffect.id);
                                    }
                                    console.log(`[Moctei] Removed dark flame control effect from ${casterToken.name} (fallback)`);
                                }
                            }
                        } catch (error) {
                            console.error(`[Moctei] Error updating control effect:`, error);
                        }
                    }
                }
            }

            results.darkFlames.push({
                target: token.name,
                effect: effectType
            });
            console.log(`[Moctei] Removed dark flame from ${token.name}`);

        } catch (error) {
            console.error(`[Moctei] Error removing dark flame from ${token.name}:`, error);
            results.failed.push({
                target: token.name,
                effect: effectType,
                error: error.message
            });
        }
    }

    // ===== VALIDATION INITIALE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error(`Veuillez d'abord sélectionner le jeton de ${CHARACTER_CONFIG.displayName} !`);
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== DÉTECTION DES EFFETS SUR LE CANVAS =====
    function findCharacterEffectsOnCanvas() {
        const characterEffects = [];

        // Parcourir tous les tokens sur la scène
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            if (token.id === caster.id) continue; // Skip Moctei lui-même

            // Chercher les effets appliqués par Moctei (approche identique à Urgen)
            for (const effect of token.actor.effects.contents) {
                // Vérifier chaque type d'effet configuré
                for (const [effectType, config] of Object.entries(EFFECT_CONFIG)) {

                    // Utiliser la même logique que Urgen : checkEffectFlags
                    if (checkEffectFlags(effect, config, actor.id, token.id)) {
                        const extraData = config.getExtraData ? config.getExtraData(effect) : {};
                        const description = config.getDynamicDescription ?
                            config.getDynamicDescription(effect) : config.description;

                        characterEffects.push({
                            token: token,
                            effect: effect,
                            effectType: effectType,
                            config: config,
                            description: description,
                            extraData: extraData
                        });

                        console.log(`[Moctei] Found ${effectType} on ${token.name}:`, {
                            effectName: effect.name,
                            flags: effect.flags?.world,
                            extraData: extraData
                        });
                    }
                }
            }
        }

        return characterEffects;
    }

    const characterEffects = findCharacterEffectsOnCanvas();

    if (characterEffects.length === 0) {
        ui.notifications.info(`${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.noEffectsMessage}`);
        return;
    }

    // ===== DIALOG DE SÉLECTION DES EFFETS =====
    async function showEffectSelectionDialog() {
        let dialogContent = `
            <h3>${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.dialogTitle}</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p>Sélectionnez le(s) effet(s) d'ombre à supprimer :</p>

            <style>
                .effect-item {
                    margin: 8px 0;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #f9f9f9;
                    display: flex;
                    align-items: center;
                }
                .effect-icon {
                    width: 32px;
                    height: 32px;
                    margin-right: 12px;
                    background-size: cover;
                    background-position: center;
                    border-radius: 4px;
                    flex-shrink: 0;
                }
                .effect-content {
                    flex-grow: 1;
                }
                .effect-type {
                    font-weight: bold;
                    color: ${CHARACTER_CONFIG.color};
                }
                .effect-target {
                    font-size: 1.1em;
                    font-weight: bold;
                    margin: 2px 0;
                }
                .effect-description {
                    font-size: 0.9em;
                    color: #666;
                }
                ${Object.entries(EFFECT_CONFIG).map(([effectType, config]) => `
                .${config.cssClass} {
                    border-left: 4px solid ${config.borderColor};
                }`).join('')}
            </style>

            <div style="margin: 15px 0; max-height: 400px; overflow-y: auto;">
        `;

        // Organiser les effets par type configuré
        const effectsByType = {};
        for (const effectInfo of characterEffects) {
            if (!effectsByType[effectInfo.effectType]) {
                effectsByType[effectInfo.effectType] = [];
            }
            effectsByType[effectInfo.effectType].push(effectInfo);
        }

        let effectIndex = 0;

        // Générer les sections pour chaque type d'effet
        for (const [effectType, effects] of Object.entries(effectsByType)) {
            const config = EFFECT_CONFIG[effectType];
            if (!config) continue;

            dialogContent += `<h4 style="color: ${config.borderColor}; margin: 15px 0 10px 0;">${config.sectionTitle}</h4>`;

            for (const effectInfo of effects) {
                const { token, effect, description, extraData } = effectInfo;
                let extraInfo = '';

                // Formatage des données supplémentaires selon le type
                if (extraData.stacks) extraInfo += ` (${extraData.stacks} stacks)`;
                if (extraData.counter) extraInfo += ` (${extraData.counter})`;
                if (extraData.power) extraInfo += ` (Puissance: ${extraData.power})`;
                if (extraData.usageCount) extraInfo += ` (${extraData.usageCount} utilisation(s))`;

                dialogContent += `
                    <div class="effect-item ${config.cssClass}">
                        <input type="checkbox" id="effect-${effectIndex}" value="${effectIndex}" style="margin-right: 12px;">
                        <div class="effect-icon" style="background-image: url('${config.icon}');"></div>
                        <div class="effect-content">
                            <div class="effect-type">${config.displayName}${extraInfo}</div>
                            <div class="effect-target">${token.name}</div>
                            <div class="effect-description">${description}</div>
                        </div>
                    </div>
                `;
                effectIndex++;
            }
        }

        dialogContent += `</div>`;

        return new Promise(resolve => {
            new Dialog({
                title: CHARACTER_CONFIG.dialogTitle,
                content: dialogContent,
                buttons: {
                    removeSelected: {
                        icon: '<i class="fas fa-eraser"></i>',
                        label: `${CHARACTER_CONFIG.icon} Retirer Sélectionnés`,
                        callback: (html) => {
                            const selectedIndices = [];
                            html.find('input[type="checkbox"]:checked').each(function () {
                                selectedIndices.push(parseInt($(this).val()));
                            });
                            if (selectedIndices.length === 0) {
                                ui.notifications.warn("Aucun effet sélectionné !");
                                return;
                            }
                            resolve({ selectedIndices });
                        }
                    },
                    removeAll: {
                        icon: '<i class="fas fa-ban"></i>',
                        label: `${CHARACTER_CONFIG.icon} Retirer Tous`,
                        callback: () => {
                            const allIndices = characterEffects.map((_, index) => index);
                            resolve({ selectedIndices: allIndices });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "removeSelected",
                close: () => resolve(null)
            }, {
                width: 600,
                height: 800,
                resizable: true,
                top: window.innerHeight * 0.1
            }).render(true);
        });
    }

    const selection = await showEffectSelectionDialog();
    if (!selection) {
        ui.notifications.info("Opération annulée.");
        return;
    }

    // ===== SUPPRESSION DES EFFETS SÉLECTIONNÉS =====
    const { selectedIndices } = selection;
    const effectsToRemove = selectedIndices.map(index => characterEffects[index]);
    const removedEffects = {
        simple: [],
        shadowEffects: [],
        darkFlames: [],
        casterEffects: [],
        failed: []
    };

    for (const effectInfo of effectsToRemove) {
        try {
            const { config } = effectInfo;

            // Traiter selon le type de mécanique
            switch (config.mechanicType) {
                case "shadowManipulation":
                    await handleShadowManipulationRemoval(effectInfo, removedEffects);
                    break;
                case "darkFlame":
                    await handleDarkFlameRemoval(effectInfo, removedEffects);
                    break;
                case "simple":
                default:
                    await handleSimpleEffectRemoval(effectInfo, removedEffects);
                    break;
            }

        } catch (error) {
            console.error(`[Moctei] Error processing effect removal:`, error);
            removedEffects.failed.push({
                target: effectInfo.token.name,
                effect: effectInfo.config.displayName,
                error: error.message
            });
        }
    }

    // ===== ANIMATIONS DE LIBÉRATION =====
    const liberationSeq = new Sequence();
    let hasAnimations = false;

    for (const effectInfo of effectsToRemove) {
        const { token, config } = effectInfo;

        if (config.removeAnimation && !removedEffects.failed.some(f => f.target === token.name)) {
            liberationSeq.effect()
                .file(config.removeAnimation.file)
                .attachTo(token)
                .scale(config.removeAnimation.scale || 0.6)
                .duration(config.removeAnimation.duration || 1500)
                .fadeOut(config.removeAnimation.fadeOut || 500);

            if (config.removeAnimation.tint) {
                liberationSeq.tint(config.removeAnimation.tint);
            }

            hasAnimations = true;
        }
    }

    if (hasAnimations) {
        await liberationSeq.play();
    }

    // ===== RÉSULTATS ET FEEDBACK =====
    const totalRemoved = Object.values(removedEffects).reduce((sum, arr) => {
        return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0) - removedEffects.failed.length;
    const totalFailed = removedEffects.failed.length;

    if (totalRemoved > 0) {
        // Message dans le chat
        let chatContent = `
            <div style="background: linear-gradient(135deg, #f3e5f5, #f9f9f9); padding: 12px; border-radius: 8px; border: 2px solid ${CHARACTER_CONFIG.color}; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: ${CHARACTER_CONFIG.color};">${CHARACTER_CONFIG.icon} ${CHARACTER_CONFIG.chatTitle}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Mage des Ombres:</strong> ${actor.name}
                    </div>
                </div>
        `;

        // Sections pour chaque type d'effet supprimé
        for (const [categoryKey, effects] of Object.entries(removedEffects)) {
            if (categoryKey === 'failed' || categoryKey === 'casterEffects' || !Array.isArray(effects) || effects.length === 0) continue;

            let categoryTitle = "";
            let categoryColor = CHARACTER_CONFIG.color;
            let categoryBg = "#f3e5f5";

            switch (categoryKey) {
                case 'simple':
                    categoryTitle = "🌑 Effets d'Ombre Simples Supprimés";
                    break;
                case 'shadowEffects':
                    categoryTitle = "🌑 Manipulations d'Ombre Terminées";
                    categoryColor = "#2e0054";
                    categoryBg = "#f3e5f5";
                    break;
                case 'darkFlames':
                    categoryTitle = "🔥 Flammes Noires Éteintes";
                    categoryColor = "#1a0033";
                    categoryBg = "#f3e5f5";
                    break;
                default:
                    categoryTitle = `${categoryKey} Supprimés`;
                    break;
            }

            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${categoryBg}; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${categoryColor}; margin-bottom: 6px;"><strong>${categoryTitle}</strong></div>
            `;
            for (const removed of effects) {
                chatContent += `<div style="font-size: 0.9em; margin: 2px 0;">${removed.target}: ${removed.effect}</div>`;
            }
            chatContent += `</div>`;
        }

        // Effets de lanceur supprimés
        if (removedEffects.casterEffects && removedEffects.casterEffects.length > 0) {
            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8f5e8; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #2e7d32; margin-bottom: 6px;"><strong>${CHARACTER_CONFIG.icon} Effets de Lanceur Supprimés</strong></div>
            `;
            for (const removed of removedEffects.casterEffects) {
                chatContent += `<div style="font-size: 0.9em; margin: 2px 0;">${removed.target}: ${removed.effect}</div>`;
            }
            chatContent += `</div>`;
        }

        // Erreurs s'il y en a
        if (removedEffects.failed.length > 0) {
            chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffcdd2; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #d32f2f; margin-bottom: 6px;"><strong>❌ Erreurs</strong></div>
            `;
            for (const failed of removedEffects.failed) {
                chatContent += `<div style="font-size: 0.9em; margin: 2px 0;">${failed.target}: ${failed.effect} (${failed.error})</div>`;
            }
            chatContent += `</div>`;
        }

        chatContent += `</div>`;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: chatContent,
            rollMode: game.settings.get("core", "rollMode")
        });

        // Notification de succès
        let notificationText = `${CHARACTER_CONFIG.icon} Effets d'ombre supprimés : `;
        const parts = [];

        if (removedEffects.simple.length > 0) parts.push(`${removedEffects.simple.length} effet(s) simple(s)`);
        if (removedEffects.shadowEffects.length > 0) parts.push(`${removedEffects.shadowEffects.length} effet(s) d'ombre`);
        if (removedEffects.darkFlames.length > 0) parts.push(`${removedEffects.darkFlames.length} flamme(s) noire(s)`);

        notificationText += parts.join(', ');

        if (totalFailed > 0) {
            notificationText += ` (${totalFailed} échec(s))`;
        }

        ui.notifications.info(notificationText);

    } else {
        ui.notifications.error(`❌ Aucun effet d'ombre n'a pu être supprimé !`);

        // Afficher les erreurs si il y en a
        if (removedEffects.failed.length > 0) {
            let errorMsg = "Erreurs rencontrées:\n";
            for (const failed of removedEffects.failed) {
                errorMsg += `- ${failed.target}: ${failed.error}\n`;
            }
            ui.notifications.error(errorMsg);
        }
    }

})();
