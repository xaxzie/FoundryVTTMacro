/**
 * Feu Infernal - Seraphin & Moctei (Mage des Ombres)
 *
 * Amélioration des flammes noires existantes par la puissance de Seraphin.
 * Augmente les dégâts continus des "Flamme Noire" de +2 points sur toutes les cibles touchées.
 *
 * CONDITION SPÉCIALE :
 * - Seraphin (acteur 6JHg02P8GWUz0AlN) doit être présent sur le canvas actuel
 * - Si absent, la macro reste utilisable mais avec avertissement
 *
 * FONCTIONNALITÉS :
 * - Coût : 1 mana (NON focalisable)
 * - Cible : Toutes les "Flamme Noire" actives sur le canvas
 * - Effet : +2 dégâts continus par utilisation
 * - Maximum : 7 dégâts continus par flamme
 * - À 7 dégâts : Ajoute le flag "explosion: ready"
 * - Si déjà "ready" : Aucun effet supplémentaire
 *
 * MÉCANIQUES :
 * - Détection automatique des flammes noires actives
 * - Mise à jour des statusCounter
 * - Gestion des explosions prêtes
 * - Résumé des cibles affectées
 *
 * Usage : Sélectionner le token de Moctei et lancer la macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Feu Infernal",
        caster: "Seraphin", // Affiché comme exécutant l'action
        manaCost: 1,
        isFocusable: false, // NON focalisable
        damageIncrease: 2, // +2 dégâts par utilisation
        maxDamage: 7, // Dégâts maximum avant explosion

        // ID de l'acteur Seraphin requis
        seraphinActorId: "6JHg02P8GWUz0AlN",

        // Configuration des explosions
        explosion: {
            // Coûts selon le niveau d'amélioration
            costs: {
                3: 2,  // Aucune amélioration (dégâts de base): 2 mana
                5: 1,  // Amélioré une fois: 1 mana
                7: 0   // Amélioré 2 fois ou plus: 0 mana
            },
            // Dégâts selon le niveau d'amélioration
            damages: {
                3: 10, // Aucune amélioration: 10 dégâts
                5: 21, // Amélioré une fois: 21 dégâts
                7: 21  // Amélioré 2 fois ou plus: 21 dégâts
            }
        },

        // Effet cible à améliorer
        targetEffect: {
            name: "Flamme Noire",
            explosionFlag: "explosion"
        },

        animations: {
            enhancement: "jb2a.template_circle.aura.02.loop.large.bluepink", // Animation d'amélioration
            explosion: "animated-spell-effects-cartoon.fire.explosion.03", // Animation d'explosion
            sound: null
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Moctei !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== VÉRIFICATION DE LA PRÉSENCE DE SERAPHIN =====
    function checkSeraphinPresence() {
        const seraphinTokens = canvas.tokens.placeables.filter(token =>
            token.actor?.id === SPELL_CONFIG.seraphinActorId
        );

        return {
            present: seraphinTokens.length > 0,
            tokens: seraphinTokens,
            message: seraphinTokens.length > 0 ?
                `Seraphin présent sur le canvas (${seraphinTokens.length} token${seraphinTokens.length > 1 ? 's' : ''})` :
                "⚠️ SERAPHIN ABSENT DU CANVAS"
        };
    }

    const seraphinCheck = checkSeraphinPresence();

    // ===== DÉTECTION DES FLAMMES NOIRES ACTIVES =====
    function findActiveFlames() {
        const activeFlames = [];

        // Parcourir tous les tokens sur le canvas
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;

            // Chercher l'effet "Flamme Noire" sur chaque acteur
            const flameEffect = token.actor.effects.find(e =>
                e.name === SPELL_CONFIG.targetEffect.name
            );

            if (flameEffect) {
                const currentDamage = flameEffect.flags?.statuscounter?.value || 0;
                const isExplosionReady = flameEffect.flags?.world?.explosion === "ready";

                // Déterminer le type de flamme (source ou extension) pour la gestion des effets
                const isSourceFlame = flameEffect.flags?.world?.darkFlameType === "source";

                activeFlames.push({
                    token: token,
                    actor: token.actor,
                    effect: flameEffect,
                    currentDamage: currentDamage,
                    isExplosionReady: isExplosionReady,
                    canIncrease: currentDamage < SPELL_CONFIG.maxDamage,
                    willExplode: currentDamage >= SPELL_CONFIG.maxDamage && !isExplosionReady,
                    isSourceFlame: isSourceFlame,
                    explosionCost: SPELL_CONFIG.explosion.costs[currentDamage] || 0, // Coût pour toutes les flammes
                    explosionDamage: SPELL_CONFIG.explosion.damages[currentDamage] || SPELL_CONFIG.explosion.damages[7]
                });
            }
        }

        return activeFlames;
    }

    const activeFlames = findActiveFlames();

    if (activeFlames.length === 0) {
        ui.notifications.warn("Aucune Flamme Noire active trouvée sur le canvas !");
        return;
    }

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    const currentStance = getCurrentStance(actor);

    // ===== GM DELEGATION FUNCTIONS =====
    async function updateEffectWithGMDelegation(targetToken, effectId, updateData) {
        if (!targetToken?.actor) {
            console.error("[Feu Infernal] No valid target token or actor");
            return false;
        }

        try {
            if (targetToken.actor.isOwner) {
                // User owns the token, update directly
                const effect = targetToken.actor.effects.get(effectId);
                if (effect) {
                    await effect.update(updateData);
                    console.log(`[Feu Infernal] Updated effect directly on ${targetToken.name}`);
                    return true;
                }
            } else {
                // Use GM delegation for tokens the user doesn't own
                if (globalThis.gmSocket) {
                    await globalThis.gmSocket.executeAsGM("updateEffectOnActor", targetToken.id, effectId, updateData);
                    console.log(`[Feu Infernal] Updated effect on ${targetToken.name} via GM delegation`);
                    return true;
                } else {
                    console.warn(`[Feu Infernal] GM Socket not available and user doesn't own ${targetToken.name}`);
                    ui.notifications.warn(`Impossible de mettre à jour l'effet sur ${targetToken.name} - Contactez le MJ`);
                    return false;
                }
            }
        } catch (error) {
            console.error(`[Feu Infernal] Error updating effect on ${targetToken.name}:`, error);
            return false;
        }

        return false;
    }

    async function removeEffectWithGMDelegation(targetToken, effectId) {
        if (!targetToken?.actor) {
            console.error("[Feu Infernal] No valid target token or actor");
            return false;
        }

        try {
            if (targetToken.actor.isOwner) {
                // User owns the token, remove directly
                const effect = targetToken.actor.effects.get(effectId);
                if (effect) {
                    await effect.delete();
                    console.log(`[Feu Infernal] Removed effect directly from ${targetToken.name}`);
                    return true;
                }
            } else {
                // Use GM delegation for tokens the user doesn't own
                if (globalThis.gmSocket) {
                    await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetToken.id, effectId);
                    console.log(`[Feu Infernal] Removed effect from ${targetToken.name} via GM delegation`);
                    return true;
                } else {
                    console.warn(`[Feu Infernal] GM Socket not available and user doesn't own ${targetToken.name}`);
                    ui.notifications.warn(`Impossible de supprimer l'effet sur ${targetToken.name} - Contactez le MJ`);
                    return false;
                }
            }
        } catch (error) {
            console.error(`[Feu Infernal] Error removing effect from ${targetToken.name}:`, error);
            return false;
        }

        return false;
    }

    // ===== GESTION DE L'EFFET DE CONTRÔLE SUR MOCTEI =====
    async function updateCasterControlEffect(flamesToExplode) {
        const casterControlEffect = actor.effects.find(e =>
            e.name === "Feu obscur (Contrôle)"
        );

        if (!casterControlEffect) {
            console.log("[Feu Infernal] No caster control effect found");
            return;
        }

        const currentSources = casterControlEffect.flags?.world?.darkFlameInitialSources || [];
        const currentExtensions = casterControlEffect.flags?.world?.darkFlameExtensions || [];

        // Calculer les flammes à retirer selon leur type
        const explodedSources = flamesToExplode.filter(f => f.isSourceFlame).map(f => f.token.id);
        const explodedExtensions = flamesToExplode.filter(f => !f.isSourceFlame).map(f => f.token.id);

        // Retirer les flammes explosées des listes
        const updatedSources = currentSources.filter(id => !explodedSources.includes(id));
        const updatedExtensions = currentExtensions.filter(id => !explodedExtensions.includes(id));
        const allAffectedTargets = [...updatedSources, ...updatedExtensions];

        if (allAffectedTargets.length === 0) {
            // Plus aucune flamme active, supprimer l'effet de contrôle
            try {
                await casterControlEffect.delete();
                console.log("[Feu Infernal] Removed caster control effect - no more active flames");
            } catch (error) {
                console.error("[Feu Infernal] Error removing caster control effect:", error);
            }
        } else {
            // Mettre à jour l'effet de contrôle
            const updateData = {
                description: `Contrôle des flammes noires actives - ${updatedSources.length} source(s) active(s)`,
                flags: {
                    ...casterControlEffect.flags,
                    world: {
                        ...casterControlEffect.flags.world,
                        darkFlameInitialSources: updatedSources,
                        darkFlameExtensions: updatedExtensions,
                        darkFlameTargets: allAffectedTargets
                    },
                    statuscounter: {
                        value: updatedSources.length,
                        visible: true
                    }
                }
            };

            try {
                await casterControlEffect.update(updateData);
                console.log(`[Feu Infernal] Updated caster control effect: ${updatedSources.length} sources, ${updatedExtensions.length} extensions`);
            } catch (error) {
                console.error("[Feu Infernal] Error updating caster control effect:", error);
            }
        }
    }

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigurationDialog() {
        const seraphinStatusColor = seraphinCheck.present ? "#2e7d32" : "#d32f2f";
        const seraphinStatusIcon = seraphinCheck.present ? "✅" : "❌";

        let targetsDisplay = '';
        let effectivesCount = 0;

        for (const flame of activeFlames) {
            const statusIcon = flame.isExplosionReady ? "💥" :
                              flame.currentDamage >= SPELL_CONFIG.maxDamage ? "🔥" : "🌑";
            const nextDamage = Math.min(flame.currentDamage + SPELL_CONFIG.damageIncrease, SPELL_CONFIG.maxDamage);
            const effectText = flame.isExplosionReady ?
                "Explosion déjà prête - Aucun effet" :
                flame.currentDamage >= SPELL_CONFIG.maxDamage ?
                "Préparera l'explosion (déjà au maximum)" :
                `${flame.currentDamage} → ${nextDamage} dégâts/tour`;

            const explosionInfo = flame.explosionCost > 0 ?
                ` (Explosion: ${flame.explosionDamage} dégâts, ${flame.explosionCost} mana)` :
                ` (Explosion: ${flame.explosionDamage} dégâts, gratuit)`;

            const sourceInfo = flame.isSourceFlame ? " [Source]" : " [Extension]";

            if (!flame.isExplosionReady) effectivesCount++;

            targetsDisplay += `
                <div style="margin: 5px 0; padding: 8px; background: ${flame.isExplosionReady ? '#ffecb3' : '#e8f5e8'}; border-radius: 4px; border-left: 4px solid ${flame.isExplosionReady ? '#ff9800' : '#4caf50'};">
                    <div style="font-weight: bold;">${statusIcon} ${flame.token.name}${sourceInfo}</div>
                    <div style="font-size: 0.9em; color: #666;">
                        <div><strong>Amélioration:</strong> ${effectText}</div>
                        <div><strong>Explosion disponible:</strong>${explosionInfo}</div>
                    </div>
                    <div style="margin-top: 8px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="explode_${activeFlames.indexOf(flame)}" style="margin-right: 8px;">
                            <span style="color: #d32f2f; font-weight: bold;">💥 Faire exploser cette flamme</span>
                        </label>
                    </div>
                </div>
            `;
        }

        return new Promise(resolve => {
            new Dialog({
                title: `🔥 ${SPELL_CONFIG.name} - Seraphin`,
                content: `
                    <div style="margin-bottom: 15px;">
                        <h3 style="border-bottom: 2px solid #ff5722; color: #ff5722;">🔥 ${SPELL_CONFIG.name}</h3>
                        <p><strong>Exécutant:</strong> ${SPELL_CONFIG.caster}</p>
                        <p><strong>Lanceur:</strong> ${actor.name}</p>
                        <p><strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana (NON focalisable)</p>

                        <div style="margin: 10px 0; padding: 10px; background: ${seraphinCheck.present ? '#e8f5e8' : '#ffebee'}; border-radius: 4px; border: 2px solid ${seraphinStatusColor};">
                            <div style="font-weight: bold; color: ${seraphinStatusColor};">
                                ${seraphinStatusIcon} Condition Seraphin
                            </div>
                            <div style="font-size: 0.9em; color: ${seraphinStatusColor}; margin-top: 4px;">
                                ${seraphinCheck.message}
                            </div>
                        </div>

                        <div style="margin: 10px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                            <strong>🔥 Effet du sort :</strong>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                <li>📈 <strong>Amélioration :</strong> +${SPELL_CONFIG.damageIncrease} dégâts continus par flamme</li>
                                <li>🎯 <strong>Cibles :</strong> Toutes les "Flamme Noire" actives</li>
                                <li>🔥 <strong>Maximum :</strong> ${SPELL_CONFIG.maxDamage} dégâts/tour</li>
                                <li>💥 <strong>À ${SPELL_CONFIG.maxDamage} dégâts :</strong> Prépare l'explosion</li>
                                <li>⚠️ <strong>Explosion prête :</strong> Aucun effet supplémentaire</li>
                            </ul>
                        </div>

                        <div style="margin: 15px 0;">
                            <h4 style="margin: 10px 0; color: #ff5722;">🔥 Flammes Noires Détectées (${activeFlames.length})</h4>
                            <div style="max-height: 300px; overflow-y: auto;">
                                ${targetsDisplay}
                            </div>
                            ${effectivesCount > 0 ?
                                `<div style="margin-top: 10px; padding: 8px; background: #e3f2fd; border-radius: 4px; text-align: center;">
                                    <strong>✨ ${effectivesCount} flamme${effectivesCount > 1 ? 's' : ''} sera${effectivesCount > 1 ? 'nt' : ''} améliorée${effectivesCount > 1 ? 's' : ''}</strong>
                                </div>` :
                                `<div style="margin-top: 10px; padding: 8px; background: #ffecb3; border-radius: 4px; text-align: center;">
                                    <strong>⚠️ Aucune flamme ne peut être améliorée</strong>
                                </div>`
                            }
                        </div>
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-fire"></i>',
                        label: '🔥 Déchaîner le Feu Infernal',
                        callback: (html) => {
                            // Récupérer les sélections d'explosion
                            const explosions = [];
                            for (let i = 0; i < activeFlames.length; i++) {
                                const checkbox = html.find(`#explode_${i}`)[0];
                                if (checkbox && checkbox.checked) {
                                    explosions.push(i);
                                }
                            }
                            resolve({
                                confirmed: true,
                                explosions: explosions
                            });
                        }
                    },
                    explodeAll: {
                        icon: '<i class="fas fa-bomb"></i>',
                        label: '💥 Tout Exploser',
                        callback: () => {
                            // Faire exploser toutes les flammes
                            const allExplosions = [];
                            for (let i = 0; i < activeFlames.length; i++) {
                                allExplosions.push(i);
                            }
                            resolve({
                                confirmed: true,
                                explosions: allExplosions
                            });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: '❌ Annuler',
                        callback: () => resolve(null)
                    }
                },
                default: effectivesCount > 0 ? "cast" : "cancel"
            }, {
                width: 550,
                height: "auto"
            }).render(true);
        });
    }

    const userConfig = await showConfigurationDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    const { explosions } = userConfig;
    const flamesToExplode = explosions.map(index => activeFlames[index]);
    const flamesToEnhance = activeFlames.filter((_, index) => !explosions.includes(index));

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Animations d'amélioration sur les flammes à améliorer
        for (const flame of flamesToEnhance) {
            if (!flame.isExplosionReady) {
                if (SPELL_CONFIG.animations.enhancement) {
                    seq.effect()
                        .file(SPELL_CONFIG.animations.enhancement)
                        .attachTo(flame.token)
                        .scale(0.1)
                        .duration(2000)
                        .fadeOut(800)
                        .tint("#ff3d00");
                }
            }
        }

        // Animations d'explosion sur les flammes à faire exploser
        for (const flame of flamesToExplode) {
            if (SPELL_CONFIG.animations.explosion) {
                seq.effect()
                    .file(SPELL_CONFIG.animations.explosion)
                    .attachTo(flame.token)
                    .scale(0.8)
                    .duration(1500)
                    .tint("#1a0033"); // Tinte de feu noir
            }
        }

        await seq.play();
    }

    await playAnimation();

    // ===== APPLICATION DES EFFETS =====
    const processedFlames = [];
    let explosionsReady = 0;
    let damageIncreased = 0;
    let noEffect = 0;
    let exploded = 0;
    let totalExplosionCost = 0;
    let totalExplosionDamage = 0;

    // Traitement des explosions
    for (const flame of flamesToExplode) {
        const success = await removeEffectWithGMDelegation(flame.token, flame.effect.id);

        if (success) {
            processedFlames.push({
                ...flame,
                action: `EXPLOSÉ ! ${flame.explosionDamage} dégâts`,
                newDamage: 0, // Plus de dégâts continus après explosion
                exploded: true
            });

            exploded++;
            totalExplosionDamage += flame.explosionDamage;

            // Compter le coût de toutes les explosions (sources et extensions)
            totalExplosionCost += flame.explosionCost;

            console.log(`[Feu Infernal] Exploded flame on ${flame.token.name}: ${flame.explosionDamage} damage, ${flame.explosionCost} mana cost (type: ${flame.isSourceFlame ? 'source' : 'extension'})`);
        } else {
            processedFlames.push({
                ...flame,
                action: "Échec de l'explosion",
                newDamage: flame.currentDamage,
                exploded: false
            });
        }
    }

    // Traitement des améliorations
    for (const flame of flamesToEnhance) {
        if (flame.isExplosionReady) {
            // Aucun effet si l'explosion est déjà prête
            processedFlames.push({
                ...flame,
                action: "Aucun effet (explosion déjà prête)",
                newDamage: flame.currentDamage
            });
            noEffect++;
            continue;
        }

        const newDamage = Math.min(flame.currentDamage + SPELL_CONFIG.damageIncrease, SPELL_CONFIG.maxDamage);
        const willSetExplosion = flame.currentDamage >= SPELL_CONFIG.maxDamage; // Explosion si DÉJÀ à 7 dégâts

        // Préparer les données de mise à jour
        const updateData = {
            flags: {
                ...flame.effect.flags,
                statuscounter: {
                    value: newDamage,
                    visible: true
                }
            }
        };

        // Ajouter le flag d'explosion seulement si la flamme était DÉJÀ au maximum
        if (willSetExplosion) {
            updateData.flags.world = {
                ...flame.effect.flags.world,
                explosion: "ready"
            };
        }

        // Appliquer la mise à jour
        const success = await updateEffectWithGMDelegation(flame.token, flame.effect.id, updateData);

        if (success) {
            processedFlames.push({
                ...flame,
                action: willSetExplosion ? "Explosion préparée !" : `Dégâts augmentés: ${flame.currentDamage} → ${newDamage}`,
                newDamage: newDamage
            });

            if (willSetExplosion) {
                explosionsReady++;
            } else {
                damageIncreased++;
            }

            console.log(`[Feu Infernal] Enhanced flame on ${flame.token.name}: ${flame.currentDamage} → ${newDamage}${willSetExplosion ? ' (explosion ready)' : ''}`);
        } else {
            processedFlames.push({
                ...flame,
                action: "Échec de la mise à jour",
                newDamage: flame.currentDamage
            });
        }
    }

    // Mise à jour de l'effet de contrôle sur Moctei (retirer les flammes explosées)
    if (flamesToExplode.length > 0) {
        await updateCasterControlEffect(flamesToExplode);
    }

    // ===== CALCUL DU COÛT TOTAL EN MANA =====
    const enhancementCost = flamesToEnhance.filter(f => !f.isExplosionReady).length > 0 ? SPELL_CONFIG.manaCost : 0;
    const finalTotalCost = enhancementCost + totalExplosionCost;

    // ===== CHAT MESSAGE =====
    function createChatFlavor() {
        const seraphinStatusColor = seraphinCheck.present ? "#2e7d32" : "#d32f2f";
        const seraphinStatusText = seraphinCheck.present ?
            "✅ Seraphin présent " :
            "❌ Seraphin absent ";

        const resultsDisplay = processedFlames.map(flame => {
            const statusIcon = flame.exploded ? "🎆" :
                              flame.action.includes("explosion") ? "💥" :
                              flame.action.includes("augmentés") ? "🔥" : "⚠️";
            const bgColor = flame.exploded ? "#ffecb3" :
                           flame.action.includes("explosion") ? "#fff3e0" :
                           flame.action.includes("augmentés") ? "#e8f5e8" : "#f5f5f5";
            return `
                <div style="margin: 4px 0; padding: 6px; background: ${bgColor}; border-radius: 4px;">
                    <div style="font-weight: bold;">${statusIcon} ${flame.token.name}${flame.isSourceFlame ? ' [Source]' : ' [Extension]'}</div>
                    <div style="font-size: 0.9em; color: #666;">${flame.action}</div>
                </div>
            `;
        }).join('');

        // Préparer le résumé en filtrant les valeurs à zéro
        const summaryLines = [];
        if (damageIncreased > 0) {
            summaryLines.push(`<div>🔥 <strong>Dégâts augmentés:</strong> ${damageIncreased} flamme${damageIncreased !== 1 ? 's' : ''}</div>`);
        }
        if (explosionsReady > 0) {
            summaryLines.push(`<div>💥 <strong>Explosions préparées:</strong> ${explosionsReady} flamme${explosionsReady !== 1 ? 's' : ''}</div>`);
        }
        if (exploded > 0) {
            summaryLines.push(`<div>🎆 <strong>Explosions déclenchées:</strong> ${exploded} flamme${exploded !== 1 ? 's' : ''}</div>`);
        }
        if (noEffect > 0) {
            summaryLines.push(`<div>⚠️ <strong>Aucun effet:</strong> ${noEffect} flamme${noEffect !== 1 ? 's' : ''}</div>`);
        }

        const summaryStats = summaryLines.length > 0 ? `
            <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                <div style="font-weight: bold; color: #1976d2; margin-bottom: 8px;">📊 Résumé des Effets</div>
                <div style="font-size: 0.9em;">
                    ${summaryLines.join('')}
                </div>
                ${exploded > 0 ? `
                    <div style="margin-top: 10px; padding: 8px; background: #ffecb3; border-radius: 4px; border: 2px solid #ff9800;">
                        <div style="font-weight: bold; color: #e65100;">🎆 EXPLOSIONS DÉCLENCHÉES</div>
                        <div style="font-size: 0.9em; color: #e65100;">
                            <div>💥 <strong>Dégâts totaux d'explosion:</strong> ${totalExplosionDamage} points</div>
                            <div>💰 <strong>Coût des explosions:</strong> ${totalExplosionCost} mana</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : '';

        return `
            <div style="border: 2px solid #ff5722; border-radius: 8px; padding: 12px; background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);">
                <div style="text-align: center; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: #ff5722; text-shadow: 1px 1px 2px rgba(0,0,0,0.1);">
                        🔥 ${SPELL_CONFIG.name}
                    </h3>
                    <div style="font-size: 0.9em; color: #666; margin-top: 3px;">
                        <strong>Exécutant:</strong> ${SPELL_CONFIG.caster} | <strong>Lanceur:</strong> ${actor.name}
                    </div>
                </div>

                <div style="margin: 10px 0; padding: 8px; background: ${seraphinCheck.present ? '#e8f5e8' : '#ffebee'}; border-radius: 4px; text-align: center;">
                    <div style="font-weight: bold; color: ${seraphinStatusColor};">
                        ${seraphinStatusText}
                    </div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.2em; color: #ff5722; font-weight: bold;">
                        🔥 COÛT TOTAL: ${finalTotalCost} mana (NON focalisable)
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 4px;">
                        Amélioration: ${enhancementCost} mana | Explosions: ${totalExplosionCost} mana
                    </div>
                </div>

                ${summaryStats}

                <div style="margin: 10px 0;">
                    <div style="font-weight: bold; color: #ff5722; margin-bottom: 8px;">🎯 Flammes Affectées (${processedFlames.length})</div>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${resultsDisplay}
                    </div>
                </div>
            </div>
        `;
    }

    // Envoyer le message au chat (sans jet de dés)
    await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: createChatFlavor(),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    // ===== NOTIFICATION FINALE =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const seraphinInfo = seraphinCheck.present ? " [Seraphin présent]" : " [Seraphin absent]";

    let effectSummary = [];
    if (damageIncreased > 0) effectSummary.push(`${damageIncreased} améliorée${damageIncreased > 1 ? 's' : ''}`);
    if (explosionsReady > 0) effectSummary.push(`${explosionsReady} explosion${explosionsReady > 1 ? 's' : ''} prête${explosionsReady > 1 ? 's' : ''}`);
    if (exploded > 0) effectSummary.push(`${exploded} explosée${exploded > 1 ? 's' : ''} (${totalExplosionDamage} dégâts)`);
    if (noEffect > 0) effectSummary.push(`${noEffect} sans effet`);

    const costInfo = finalTotalCost > 0 ? ` [${finalTotalCost} mana]` : '';
    const summaryText = effectSummary.length > 0 ? ` (${effectSummary.join(', ')})` : '';

    ui.notifications.info(`🔥 ${SPELL_CONFIG.name} exécuté par ${SPELL_CONFIG.caster} !${stanceInfo} ${processedFlames.length} flamme${processedFlames.length > 1 ? 's' : ''} traitée${processedFlames.length > 1 ? 's' : ''}${summaryText}.${costInfo}${seraphinInfo}`);

})();
