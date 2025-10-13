/**
 * Syphon de Grêle - Sort Ultime d'Ora (Multi-Phase Ultimate)
 *
 * Sort de contrôle de zone évolutif avec 4 phases distinctes sur plusieurs tours.
 *
 * Phase 1 - Initialisation (Tour 1) :
 * - Coût : 4 mana (NON focusable, Force Focus obligatoire)
 * - Jet : Esprit contre esquive (niveau 1)
 * - Zone : 4 cases de rayon avec animation persistante
 * - Effet : "Syphon" (statuscounter=1), malus -3 déplacement sur échec jet Force
 * - Message : "Des trombes d'eau commence à tourbillonner autour de Ora"
 *
 * Phase 2 - Première Extension (Tour 2) :
 * - Coût : 6 mana (NON focusable, Force Focus obligatoire)
 * - Extension : Animation 4→6 cases + animation particules
 * - Attaque : Esprit niveau 2 (2d6+Esprit) sur zone 4-6 cases
 * - Effet : Syphon (statuscounter=2)
 *
 * Phase 3 - Extensions Répétables (Tours suivants) :
 * - Coût : 4 mana par extension
 * - Choix : Extension +6 cases OU passer Phase 4
 * - Attaque : Niveau 2 sur nouvelle zone externe
 * - Tracking : Taille stockée dans flags effect
 *
 * Phase 4 - Forme Finale :
 * - Coût : 10 mana (Rayon = 8×X cases, X=extensions)
 * - Animation : Ajout syphon central (rotation 180°)
 * - Attaques par quarts : 0, 2d6+Esprit, 3d6+Esprit, 4d6+Esprit
 * - Spécial : Traversée bord = 8d6+Esprit×2
 * - Interruption : Jet Volonté vs PV perdus×1.5
 *
 * Phase Finale - Actions Répétées :
 * - Répéter attaques par quarts
 * - Extension : +8 cases (4 mana, max 5 extensions)
 * - "Fuck you in particular" : Attaque gratuite niveau 3
 * - Jet final : Volonté DD 10×X ou -3 mana
 *
 * Usage : Ora DOIT être en Position Focus. Chaque phase = 1 tour.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Syphon de Grêle",
        description: "Sort ultime multi-phases de contrôle de zone aquatique",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        isDirect: true,
        isFocusable: false, // NON focusable - Force Focus obligatoire
        requiresFocus: true, // DOIT être en Focus

        // Coûts par phase
        phases: {
            1: { cost: 4, level: 1, radius: 4 },
            2: { cost: 6, level: 2, radius: 6 },
            3: { cost: 4, level: 2, radiusExtension: 6 },
            4: { cost: 10, level: 3, radiusMultiplier: 8 }
        },

        // Extensions Phase Finale
        finalPhase: {
            extensionCost: 4,
            maxExtensions: 5,
            extensionRadius: 8,
            freeAttackLevel: 3,
            willSaveDC: 10, // × nombre extensions
            willFailCost: 3
        },

        // Alliés protégés (même liste que grêle)
        allies: {
            "Raynart": "4bandVHr1d92RYuL",
            "Moctei": "RTwQuERFkkNPk4ni",
            "Yunyun": "E0B1mjYMdX1gqzvh",
            "Léo": "0w7rtAdrpd3lPkN2"
        },

        // Animations par phase
        animations: {
            phase1: "jb2a_patreon.spirit_guardians.blue.particles", // Zone initiale
            phase2Particles: "jb2a_patreon.spirit_guardians.blue.spirits", // Particules ajoutées
            syphonCenter: "jb2a_patreon.spirit_guardians.blue.spirits", // Animation centrale rotée
            impact: "animated-spell-effects-cartoon.water.water impact",
            cast: "jb2a.water_splash.circle.01.blue"
        },

        // Configuration de l'effet Syphon
        syphonEffect: {
            name: "Syphon",
            icon: "icons/magic/water/projectile-water-rings.webp",
            description: "Syphon de Grêle en cours d'évolution",
            duration: { seconds: 86400 },
            flags: {
                world: {
                    oraCaster: "CASTER_ID",
                    spellName: "Syphon de Grêle",
                    effectType: "syphon_evolution",
                    appliedAt: "TIMESTAMP",
                    currentPhase: 1,
                    currentRadius: 4,
                    extensions: 2, // Nombre base d'extensions (Phase 1 + Phase 2)
                    increasable: true
                },
                statuscounter: { value: 1 }
            },
            changes: [],
            tint: "#4169e1",
            visible: true
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token d'Ora !");
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
            }
        }
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée !`);
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

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Vérifie si l'effet Syphon est actif
     */
    function getSyphonEffect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === "Syphon" &&
            e.flags?.world?.oraCaster === actor.id
        ) || null;
    }

    /**
     * Trouve un acteur par ID
     */
    function findActorById(actorId) {
        return game.actors.get(actorId);
    }

    /**
     * Trouve les tokens dans une zone annulaire (entre deux rayons)
     */
    function findTokensInRing(centerToken, innerRadius, outerRadius) {
        const allTokens = canvas.tokens.placeables.filter(token =>
            token.actor && token.id !== centerToken.id
        );

        const tokensInRing = [];

        for (const token of allTokens) {
            const distance = Math.sqrt(
                Math.pow(token.x - centerToken.x, 2) +
                Math.pow(token.y - centerToken.y, 2)
            ) / canvas.grid.size;

            if (distance > innerRadius && distance <= outerRadius) {
                tokensInRing.push(token);
            }
        }

        return tokensInRing;
    }

    /**
     * Trouve les tokens dans une zone circulaire
     */
    function findTokensInCircle(centerToken, radius) {
        const allTokens = canvas.tokens.placeables.filter(token =>
            token.actor && token.id !== centerToken.id
        );

        const tokensInCircle = [];

        for (const token of allTokens) {
            const distance = Math.sqrt(
                Math.pow(token.x - centerToken.x, 2) +
                Math.pow(token.y - centerToken.y, 2)
            ) / canvas.grid.size;

            if (distance <= radius) {
                tokensInCircle.push(token);
            }
        }

        return tokensInCircle;
    }

    /**
     * Filtre les alliés de la liste des cibles
     */
    function filterAlliesFromTargets(tokens) {
        return tokens.filter(token => {
            const actorId = token.actor.id;
            return !Object.values(SPELL_CONFIG.allies).includes(actorId);
        });
    }

    /**
     * Force la stance Focus si pas déjà active
     */
    async function ensureFocusStance(actor) {
        const currentStance = getCurrentStance(actor);

        if (currentStance !== 'focus') {
            // Retirer les autres stances
            const stanceEffects = actor.effects.contents.filter(e =>
                ['offensif', 'defensif'].includes(e.name?.toLowerCase())
            );

            for (const effect of stanceEffects) {
                await effect.delete();
            }

            // Ajouter la stance Focus
            const focusEffectData = {
                name: "Focus",
                icon: "icons/magic/control/hypnosis-mesmerism-eye.webp",
                description: "Position Focus - Sorts gratuits ou réduits",
                origin: actor.id,
                disabled: false,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        stance: "focus",
                        appliedAt: Date.now()
                    }
                },
                changes: [],
                tint: "#4169e1"
            };

            await actor.createEmbeddedDocuments("ActiveEffect", [focusEffectData]);
            ui.notifications.info("🎯 Position Focus forcée pour le Syphon de Grêle !");
        }
    }

    // ===== VALIDATION FOCUS REQUIS =====
    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    if (!characteristicInfo) {
        return;
    }

    // Vérification Position Focus obligatoire
    if (currentStance !== 'focus') {
        return;
    }    // ===== DÉTECTION DE PHASE =====
    const syphonEffect = getSyphonEffect(actor);
    let currentPhase = 1;
    let currentRadius = 4;
    let extensions = 2;

    if (syphonEffect) {
        currentPhase = syphonEffect.flags?.statuscounter?.value || 1;
        currentRadius = syphonEffect.flags?.world?.currentRadius || 4;
        extensions = syphonEffect.flags?.world?.extensions || 2;

        // Déterminer la prochaine phase
        if (currentPhase === 1) {
            currentPhase = 2;
        } else if (currentPhase === 2) {
            currentPhase = 3; // Ou 4 selon choix utilisateur
        } else if (currentPhase >= 3) {
            currentPhase = 4; // Phase finale ou continuation
        }
    }

    console.log(`[Syphon de Grêle] Phase courante: ${currentPhase}, Rayon: ${currentRadius}, Extensions: ${extensions}`);

    // ===== ANIMATIONS FUNCTIONS =====

    /**
     * Démarre l'animation persistante de phase 1 (4 cases)
     */
    async function startPhase1Animation(actorId, radius) {
        const sequence = new Sequence();

        sequence.effect()
            .file(SPELL_CONFIG.animations.phase1)
            .attachTo(caster)
            .scale(radius * 0.25) // Échelle proportionnelle au rayon
            .fadeIn(1000)
            .persist(true)
            .name(`SyphonGrele_Phase1_${actorId}`)
            .belowTokens(true)
            .opacity(0.15);

        await sequence.play();
    }

    /**
     * Arrête une animation persistante spécifique
     */
    async function stopAnimation(animationName) {
        try {
            await Sequencer.EffectManager.endEffects({ name: animationName });
        } catch (error) {
            console.warn(`[Syphon de Grêle] Could not stop animation ${animationName}:`, error);
        }
    }

    /**
     * Arrête toutes les animations du Syphon
     */
    async function stopAllSyphonAnimations(actorId) {
        const animationsToStop = [
            `SyphonGrele_Phase1_${actorId}`,
            `SyphonGrele_Phase2_Zone_${actorId}`,
            `SyphonGrele_Phase2_Particles_${actorId}`,
            `SyphonGrele_Phase3_Zone_${actorId}`,
            `SyphonGrele_Phase3_Particles_${actorId}`,
            `SyphonGrele_Final_Zone_${actorId}`,
            `SyphonGrele_Final_Particles_${actorId}`,
            `SyphonGrele_Final_Syphon_${actorId}`
        ];

        for (const animName of animationsToStop) {
            try {
                await stopAnimation(animName);
            } catch (error) {
                // Ignorer les erreurs d'animations non trouvées
            }
        }
    }

    /**
     * Demande confirmation pour terminer le sort
     */
    async function confirmEndSpell() {
        return new Promise((resolve) => {
            new Dialog({
                title: "🛑 Terminer le Syphon de Grêle",
                content: `
                    <div style="padding: 15px; text-align: center;">
                        <h3 style="color: #d32f2f; margin-bottom: 15px;">⚠️ Confirmer l'arrêt</h3>
                        <p>Êtes-vous sûr de vouloir terminer le Syphon de Grêle ?</p>
                        <p style="font-size: 0.9em; color: #666;">
                            Toutes les animations seront arrêtées et l'effet supprimé.
                        </p>
                    </div>
                `,
                buttons: {
                    yes: {
                        label: "🛑 Oui, Terminer",
                        callback: () => resolve(true)
                    },
                    no: {
                        label: "❌ Annuler",
                        callback: () => resolve(false)
                    }
                },
                default: "no"
            }).render(true);
        });
    }

    /**
     * Applique un effet sur l'acteur
     */
    async function applySyphonEffect(actor, phase, radius, extensions) {
        const effectData = {
            ...SPELL_CONFIG.syphonEffect,
            flags: JSON.parse(JSON.stringify(SPELL_CONFIG.syphonEffect.flags))
        };

        // Remplir les données dynamiques
        effectData.flags.world.oraCaster = actor.id;
        effectData.flags.world.appliedAt = Date.now();
        effectData.flags.world.currentPhase = phase;
        effectData.flags.world.currentRadius = radius;
        effectData.flags.world.extensions = extensions;
        effectData.flags.statuscounter.value = phase;

        // Description dynamique selon la phase
        const phaseNames = ["", "Initialisation", "Première Extension", "Extension", "Forme Finale"];
        effectData.description = `Syphon de Grêle - ${phaseNames[phase]} (${radius} cases)`;

        try {
            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            return true;
        } catch (error) {
            console.error("[Syphon de Grêle] Error applying effect:", error);
            return false;
        }
    }

    // ===== GESTION DES PHASES =====

    if (!syphonEffect) {
        // ===== PHASE 1 : INITIALISATION =====
        console.log("[Syphon de Grêle] Lancement Phase 1 - Initialisation");

        const phase1Cost = SPELL_CONFIG.phases[1].cost;
        const phase1Radius = SPELL_CONFIG.phases[1].radius;

        // Animation de lancement
        const castSequence = new Sequence();
        castSequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .attachTo(caster)
            .scale(0.8)
            .fadeIn(500)
            .fadeOut(500);
        await castSequence.play();

        // Démarrer l'animation persistante
        await startPhase1Animation(actor.id, phase1Radius);

        // Appliquer l'effet Syphon
        const effectApplied = await applySyphonEffect(actor, 1, phase1Radius, 2);
        if (!effectApplied) {
            ui.notifications.error("❌ Erreur lors de l'application de l'effet Syphon !");
            await stopAnimation(`SyphonGrele_Phase1_${actor.id}`);
            return;
        }

        // Trouver les cibles dans la zone (exclure les alliés)
        const allTargetsInZone = findTokensInCircle(caster, phase1Radius);
        const enemyTargets = filterAlliesFromTargets(allTargetsInZone);

        // Jet d'attaque d'Esprit (niveau 1)
        const spellLevelBonus = SPELL_CONFIG.phases[1].level * 2; // Bonus 2×niveau sort
        const attackRoll = new Roll(`${characteristicInfo.final}d7 + ${spellLevelBonus}`);

        const attackFlavor = `
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 8px; border: 2px solid #2196f3;">
                <h3 style="margin: 0; color: #1976d2;">🌊 Syphon de Grêle - Phase 1</h3>
                <div style="margin: 5px 0;">
                    <strong>Jet d'Attaque:</strong> ${characteristicInfo.final}d7 + ${spellLevelBonus} (Esprit ${characteristicInfo.final} + Niveau ${SPELL_CONFIG.phases[1].level})
                </div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    ${enemyTargets.length} cible(s) potentielle(s) dans la zone de ${phase1Radius} cases
                </div>
            </div>
        `;

        await attackRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: attackFlavor,
            rollMode: game.settings.get('core', 'rollMode')
        });

        // Message principal dans le chat
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e0f6ff, #ffffff); border-radius: 8px; border: 2px solid #0077be; margin: 8px 0;">
                    <h3 style="margin: 0; color: #0077be;">🌊 Syphon de Grêle - Phase 1</h3>
                    <div style="margin: 5px 0;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${phase1Cost} mana
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                        <div style="font-size: 1.1em; font-weight: bold; color: #0077be; margin-bottom: 8px;">
                            💧 "Des trombes d'eau commencent à tourbillonner autour d'Ora"
                        </div>
                        <div style="font-size: 0.95em;">
                            <p><strong>🎯 Zone d'effet :</strong> ${phase1Radius} cases de rayon</p>
                            <p><strong>⚔️ Attaque :</strong> Esprit (niveau ${SPELL_CONFIG.phases[1].level}) = ${attackRoll.total}</p>
                            <p><strong>🎲 Malus :</strong> Échec jet de Force = -3 au déplacement</p>
                        </div>
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        Cibles dans la zone : ${enemyTargets.length} | Effet "Syphon" appliqué
                    </div>
                </div>
            `,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`🌊 Phase 1 lancée ! Zone de ${phase1Radius} cases active. Attaque: ${attackRoll.total}`);

    } else if (currentPhase === 2) {
        // ===== PHASE 2 : PREMIÈRE EXTENSION =====
        console.log("[Syphon de Grêle] Lancement Phase 2 - Première Extension");

        const phase2Cost = SPELL_CONFIG.phases[2].cost;
        const phase2Radius = SPELL_CONFIG.phases[2].radius;
        const previousRadius = currentRadius; // Rayon précédent (4 cases)



        // Arrêter l'animation précédente et démarrer les nouvelles
        await stopAnimation(`SyphonGrele_Phase1_${actor.id}`);

        // Extension de l'animation principale de 4 à 6 cases
        const extensionSequence = new Sequence();
        extensionSequence.effect()
            .file(SPELL_CONFIG.animations.phase1)
            .attachTo(caster)
            .scale(phase2Radius * 0.25) // Nouvelle échelle pour 6 cases
            .fadeIn(1000)
            .persist(true)
            .name(`SyphonGrele_Phase2_Zone_${actor.id}`)
            .belowTokens(true)
            .opacity(0.15);

        // Ajout de l'animation de particules
        extensionSequence.effect()
            .file(SPELL_CONFIG.animations.phase2Particles)
            .attachTo(caster)
            .scale(phase2Radius * 0.25)
            .fadeIn(1000)
            .persist(true)
            .name(`SyphonGrele_Phase2_Particles_${actor.id}`)
            .belowTokens(false)
            .opacity(0.2);

        await extensionSequence.play();

        // Mettre à jour l'effet Syphon existant
        await syphonEffect.update({
            "flags.world.currentPhase": 2,
            "flags.world.currentRadius": phase2Radius,
            "flags.statuscounter.value": 2,
            "description": `Syphon de Grêle - Première Extension (${phase2Radius} cases)`
        });

        // Trouver les cibles dans la nouvelle zone externe (entre 4 et 6 cases)
        const targetsInNewRing = findTokensInRing(caster, previousRadius, phase2Radius);
        const enemyTargetsInRing = filterAlliesFromTargets(targetsInNewRing);

        // Jet d'attaque d'Esprit (niveau 2) avec dégâts
        const spellLevelBonus = SPELL_CONFIG.phases[2].level * 2; // Bonus 2×niveau sort
        const attackRoll = new Roll(`${characteristicInfo.final}d7 + ${spellLevelBonus}`);
        const damageRoll = new Roll(`2d6 + ${characteristicInfo.final}`);

        const attackFlavor = `
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 8px; border: 2px solid #2196f3;">
                <h3 style="margin: 0; color: #1976d2;">🌊 Syphon de Grêle - Phase 2</h3>
                <div style="margin: 5px 0;">
                    <strong>Jet d'Attaque:</strong> ${characteristicInfo.final}d7 + ${spellLevelBonus} (Esprit ${characteristicInfo.final} + Niveau ${SPELL_CONFIG.phases[2].level})
                </div>
                <div style="margin: 5px 0;">
                    <strong>Dégâts:</strong> 2d6 + ${characteristicInfo.final} (Esprit)
                </div>
                <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                    Zone d'attaque: ${previousRadius}-${phase2Radius} cases | ${enemyTargetsInRing.length} cible(s) potentielle(s)
                </div>
            </div>
        `;

        await attackRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: attackFlavor,
            rollMode: game.settings.get('core', 'rollMode')
        });

        await damageRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: "💧 <strong>Dégâts du Syphon de Grêle</strong>",
            rollMode: game.settings.get('core', 'rollMode')
        });

        // Animations d'impact sur les cibles touchées
        if (enemyTargetsInRing.length > 0) {
            const impactSequence = new Sequence();

            for (const target of enemyTargetsInRing) {
                impactSequence.effect()
                    .file(SPELL_CONFIG.animations.impact)
                    .atLocation(target)
                    .scale(0.6)
                    .fadeIn(200)
                    .fadeOut(500)
                    .delay(Math.random() * 1000); // Impact échelonnés
            }

            await impactSequence.play();
        }

        // Message principal dans le chat
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e0f6ff, #ffffff); border-radius: 8px; border: 2px solid #0077be; margin: 8px 0;">
                    <h3 style="margin: 0; color: #0077be;">🌊 Syphon de Grêle - Phase 2</h3>
                    <div style="margin: 5px 0;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${phase2Cost} mana
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                        <div style="font-size: 1.1em; font-weight: bold; color: #0077be; margin-bottom: 8px;">
                            🌀 Extension du Syphon : ${previousRadius} → ${phase2Radius} cases
                        </div>
                        <div style="font-size: 0.95em;">
                            <p><strong>🎯 Zone d'attaque :</strong> ${previousRadius}-${phase2Radius} cases (anneau externe)</p>
                            <p><strong>⚔️ Attaque :</strong> Esprit (niveau ${SPELL_CONFIG.phases[2].level}) = ${attackRoll.total}</p>
                            <p><strong>💥 Dégâts :</strong> 2d6 + ${characteristicInfo.final} (Esprit) = ${damageRoll.total}</p>
                            <p><strong>✨ Effets :</strong> Animation de particules ajoutée</p>
                        </div>
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        Cibles dans l'anneau externe : ${enemyTargetsInRing.length} | Animation étendue à ${phase2Radius} cases
                    </div>
                </div>
            `,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`🌊 Phase 2 lancée ! Extension ${previousRadius}→${phase2Radius} cases. Attaque: ${attackRoll.total}, Dégâts: ${damageRoll.total}`);

    } else if (currentPhase === 3) {
        // ===== PHASE 3 : CHOIX EXTENSION OU PHASE 4 =====
        console.log("[Syphon de Grêle] Lancement Phase 3 - Extensions Répétables");

        // Dialog de choix : Extension ou Forme Finale
        const phase3Choice = await new Promise((resolve) => {
            new Dialog({
                title: "🌊 Syphon de Grêle - Phase 3",
                content: `
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 15px 0; color: #0077be;">🌀 Choix de Développement</h3>

                        <div style="margin: 15px 0; padding: 12px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196f3;">
                            <h4 style="margin: 0 0 8px 0; color: #1976d2;">📊 État Actuel</h4>
                            <p style="margin: 0;"><strong>Rayon actuel :</strong> ${currentRadius} cases</p>
                            <p style="margin: 0;"><strong>Extensions :</strong> ${extensions} (base: 2)</p>
                        </div>

                        <div style="margin: 15px 0; padding: 12px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                            <h4 style="margin: 0 0 8px 0; color: #e65100;">⚡ Option 1 : Extension (+6 cases)</h4>
                            <p style="margin: 0;"><strong>Coût :</strong> ${SPELL_CONFIG.phases[3].cost} mana</p>
                            <p style="margin: 0;"><strong>Nouveau rayon :</strong> ${currentRadius + SPELL_CONFIG.phases[3].radiusExtension} cases</p>
                            <p style="margin: 0;"><strong>Attaque :</strong> Zone ${currentRadius}-${currentRadius + SPELL_CONFIG.phases[3].radiusExtension} (2d6 + Esprit)</p>
                        </div>

                        <div style="margin: 15px 0; padding: 12px; background: #ffebee; border-radius: 6px; border-left: 4px solid #f44336;">
                            <h4 style="margin: 0 0 8px 0; color: #c62828;">🔥 Option 2 : Forme Finale</h4>
                            <p style="margin: 0;"><strong>Coût :</strong> ${SPELL_CONFIG.phases[4].cost} mana</p>
                            <p style="margin: 0;"><strong>Rayon final :</strong> ${SPELL_CONFIG.phases[4].radiusMultiplier * extensions} cases</p>
                            <p style="margin: 0;"><strong>Puissance :</strong> Attaques par quarts + Syphon central</p>
                        </div>
                    </div>
                `,
                buttons: {
                    extend: {
                        label: "⚡ Extension (+6 cases)",
                        callback: () => resolve({ action: 'extend' })
                    },
                    final: {
                        label: "🔥 Forme Finale",
                        callback: () => resolve({ action: 'final' })
                    },
                    end: {
                        label: "🛑 Terminer le Sort",
                        callback: () => resolve({ action: 'end' })
                    },
                    cancel: {
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "extend"
            }).render(true);
        });

        if (!phase3Choice) {
            ui.notifications.info("❌ Action annulée.");
            return;
        }

        if (phase3Choice.action === 'extend') {
            // EXTENSION +6 CASES
            const phase3Cost = SPELL_CONFIG.phases[3].cost;
            const extensionRadius = SPELL_CONFIG.phases[3].radiusExtension;
            const newRadius = currentRadius + extensionRadius;
            const newExtensions = extensions + 1;



            // Arrêter les animations précédentes
            await stopAnimation(`SyphonGrele_Phase2_Zone_${actor.id}`);
            await stopAnimation(`SyphonGrele_Phase2_Particles_${actor.id}`);

            // Nouvelles animations étendues
            const extensionSequence = new Sequence();
            extensionSequence.effect()
                .file(SPELL_CONFIG.animations.phase1)
                .attachTo(caster)
                .scale(newRadius * 0.25) // Nouvelle échelle étendue
                .fadeIn(1000)
                .persist(true)
                .name(`SyphonGrele_Phase3_Zone_${actor.id}`)
                .belowTokens(true)
                .opacity(0.15);

            extensionSequence.effect()
                .file(SPELL_CONFIG.animations.phase2Particles)
                .attachTo(caster)
                .scale(newRadius * 0.25)
                .fadeIn(1000)
                .persist(true)
                .name(`SyphonGrele_Phase3_Particles_${actor.id}`)
                .belowTokens(false)
                .opacity(0.2);

            await extensionSequence.play();

            // Mettre à jour l'effet Syphon
            await syphonEffect.update({
                "flags.world.currentPhase": 3,
                "flags.world.currentRadius": newRadius,
                "flags.world.extensions": newExtensions,
                "flags.statuscounter.value": 3,
                "description": `Syphon de Grêle - Extension ${newExtensions} (${newRadius} cases)`
            });

            // Attaque sur la nouvelle zone externe
            const targetsInNewRing = findTokensInRing(caster, currentRadius, newRadius);
            const enemyTargetsInRing = filterAlliesFromTargets(targetsInNewRing);

            const spellLevelBonus = SPELL_CONFIG.phases[3].level * 2;
            const attackRoll = new Roll(`${characteristicInfo.final}d7 + ${spellLevelBonus}`);
            const damageRoll = new Roll(`2d6 + ${characteristicInfo.final}`);

            const attackFlavor = `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 8px; border: 2px solid #2196f3;">
                    <h3 style="margin: 0; color: #1976d2;">🌊 Syphon de Grêle - Extension ${newExtensions}</h3>
                    <div style="margin: 5px 0;">
                        <strong>Zone d'attaque:</strong> ${currentRadius}-${newRadius} cases | ${enemyTargetsInRing.length} cible(s)
                    </div>
                </div>
            `;

            await attackRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ token: caster }),
                flavor: attackFlavor,
                rollMode: game.settings.get('core', 'rollMode')
            });

            await damageRoll.toMessage({
                speaker: ChatMessage.getSpeaker({ token: caster }),
                flavor: "💧 <strong>Dégâts d'Extension</strong>",
                rollMode: game.settings.get('core', 'rollMode')
            });

            // Animations d'impact
            if (enemyTargetsInRing.length > 0) {
                const impactSequence = new Sequence();
                for (const target of enemyTargetsInRing) {
                    impactSequence.effect()
                        .file(SPELL_CONFIG.animations.impact)
                        .atLocation(target)
                        .scale(0.6)
                        .fadeIn(200)
                        .fadeOut(500)
                        .delay(Math.random() * 1000);
                }
                await impactSequence.play();
            }

            ChatMessage.create({
                speaker: ChatMessage.getSpeaker({ token: caster }),
                content: `
                    <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e0f6ff, #ffffff); border-radius: 8px; border: 2px solid #0077be; margin: 8px 0;">
                        <h3 style="margin: 0; color: #0077be;">🌊 Syphon de Grêle - Extension ${newExtensions}</h3>
                        <div style="margin: 5px 0;">
                            <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${phase3Cost} mana
                        </div>
                        <div style="margin: 10px 0; padding: 10px; background: #e3f2fd; border-radius: 4px;">
                            <div style="font-size: 1.1em; font-weight: bold; color: #0077be; margin-bottom: 8px;">
                                🌀 Extension : ${currentRadius} → ${newRadius} cases (Extension ${newExtensions}/${SPELL_CONFIG.finalPhase.maxExtensions})
                            </div>
                            <div style="font-size: 0.95em;">
                                <p><strong>🎯 Zone d'attaque :</strong> ${currentRadius}-${newRadius} cases</p>
                                <p><strong>⚔️ Attaque :</strong> ${attackRoll.total} | <strong>💥 Dégâts :</strong> ${damageRoll.total}</p>
                            </div>
                        </div>
                        <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                            Cibles touchées : ${enemyTargetsInRing.length} | Prochaine action : Extension ou Forme Finale
                        </div>
                    </div>
                `,
                rollMode: game.settings.get('core', 'rollMode')
            });

            ui.notifications.info(`🌊 Extension ${newExtensions} ! Rayon: ${newRadius} cases. Attaque: ${attackRoll.total}`);

        } else if (phase3Choice.action === 'final') {
            // PASSER À LA PHASE 4 (sera géré par la prochaine exécution)
            await syphonEffect.update({
                "flags.world.currentPhase": 4,
                "flags.statuscounter.value": 4,
                "description": `Syphon de Grêle - Transition vers Forme Finale`
            });

            ui.notifications.info("🔥 Transition vers la Forme Finale ! Relancez le sort pour activer la Phase 4.");
        } else if (phase3Choice.action === 'end') {
            // TERMINER LE SORT
            const confirmEnd = await confirmEndSpell();
            if (confirmEnd) {
                await stopAllSyphonAnimations(actor.id);
                await syphonEffect.delete();

                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: caster }),
                    content: `
                        <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #f1f8e9, #ffffff); border-radius: 8px; border: 2px solid #4caf50; margin: 8px 0;">
                            <h3 style="margin: 0; color: #388e3c;">🛑 Syphon de Grêle - Arrêté</h3>
                            <div style="margin: 10px 0; padding: 10px; background: #f1f8e9; border-radius: 4px;">
                                <p style="font-weight: bold; font-size: 1.1em; color: #388e3c;">
                                    🌊 Le syphon de grêle se dissipe avant sa forme finale...
                                </p>
                                <p><strong>Phase arrêtée:</strong> Extension ${extensions}</p>
                            </div>
                        </div>
                    `,
                    rollMode: game.settings.get('core', 'rollMode')
                });

                ui.notifications.info("🛑 Syphon de Grêle arrêté volontairement.");
                return;
            }
        }

    } else if (currentPhase >= 4) {
        // ===== PHASE 4 : FORME FINALE =====
        console.log("[Syphon de Grêle] Lancement Phase 4 - Forme Finale");

        // Calculer le rayon final et les coûts
        const finalRadius = SPELL_CONFIG.phases[4].radiusMultiplier * extensions; // 8 × extensions
        const phase4Cost = SPELL_CONFIG.phases[4].cost;

        // Fonction pour calculer les quarts de distance
        function getQuarterRanges(totalRadius) {
            const quarter = totalRadius / 4;
            return {
                quarter1: { min: 0, max: quarter },
                quarter2: { min: quarter, max: quarter * 2 },
                quarter3: { min: quarter * 2, max: quarter * 3 },
                quarter4: { min: quarter * 3, max: totalRadius }
            };
        }

        // Fonction pour trouver les cibles par quart
        function findTargetsByQuarter(centerToken, quarters) {
            const allTokens = canvas.tokens.placeables.filter(token =>
                token.actor && token.id !== centerToken.id
            );

            const result = {
                quarter1: [], quarter2: [], quarter3: [], quarter4: []
            };

            for (const token of allTokens) {
                const distance = Math.sqrt(
                    Math.pow(token.x - centerToken.x, 2) +
                    Math.pow(token.y - centerToken.y, 2)
                ) / canvas.grid.size;

                if (distance > quarters.quarter1.min && distance <= quarters.quarter1.max) {
                    result.quarter1.push(token);
                } else if (distance > quarters.quarter2.min && distance <= quarters.quarter2.max) {
                    result.quarter2.push(token);
                } else if (distance > quarters.quarter3.min && distance <= quarters.quarter3.max) {
                    result.quarter3.push(token);
                } else if (distance > quarters.quarter4.min && distance <= quarters.quarter4.max) {
                    result.quarter4.push(token);
                }
            }

            return result;
        }

        if (currentPhase === 4) {
            // PREMIÈRE ACTIVATION DE LA FORME FINALE



            // Arrêter les animations précédentes
            await stopAnimation(`SyphonGrele_Phase2_Zone_${actor.id}`);
            await stopAnimation(`SyphonGrele_Phase2_Particles_${actor.id}`);
            await stopAnimation(`SyphonGrele_Phase3_Zone_${actor.id}`);
            await stopAnimation(`SyphonGrele_Phase3_Particles_${actor.id}`);

            // Nouvelles animations de forme finale
            const finalSequence = new Sequence();

            // Animation de zone finale
            finalSequence.effect()
                .file(SPELL_CONFIG.animations.phase1)
                .attachTo(caster)
                .scale(finalRadius * 0.25)
                .fadeIn(2000)
                .persist(true)
                .name(`SyphonGrele_Final_Zone_${actor.id}`)
                .belowTokens(true)
                .opacity(0.1);

            // Animation de particules
            finalSequence.effect()
                .file(SPELL_CONFIG.animations.phase2Particles)
                .attachTo(caster)
                .scale(finalRadius * 0.25)
                .fadeIn(2000)
                .persist(true)
                .name(`SyphonGrele_Final_Particles_${actor.id}`)
                .belowTokens(false)
                .opacity(0.15);

            // Animation du syphon central (rotation 180°)
            finalSequence.effect()
                .file(SPELL_CONFIG.animations.syphonCenter)
                .attachTo(caster)
                .scale(1.2)
                .fadeIn(2000)
                .persist(true)
                .name(`SyphonGrele_Final_Syphon_${actor.id}`)
                .belowTokens(false)
                .opacity(0.6)
                .rotate(180); // Rotation de 180°

            await finalSequence.play();

            // Mettre à jour l'effet vers la phase finale
            await syphonEffect.update({
                "flags.world.currentPhase": "final",
                "flags.world.finalRadius": finalRadius,
                "flags.statuscounter.value": 10, // Valeur spéciale pour phase finale
                "description": `Syphon de Grêle - Forme Finale (${finalRadius} cases, ${extensions} extensions)`
            });

            ui.notifications.info(`🔥 Forme Finale activée ! Rayon: ${finalRadius} cases, Extensions: ${extensions}`);
        }

        // ATTAQUES PAR QUARTS DE DISTANCE
        const quarters = getQuarterRanges(finalRadius);
        const targetsByQuarter = findTargetsByQuarter(caster, quarters);

        // Filtrer les alliés
        const enemiesByQuarter = {
            quarter1: filterAlliesFromTargets(targetsByQuarter.quarter1),
            quarter2: filterAlliesFromTargets(targetsByQuarter.quarter2),
            quarter3: filterAlliesFromTargets(targetsByQuarter.quarter3),
            quarter4: filterAlliesFromTargets(targetsByQuarter.quarter4)
        };

        // Attaque générale avec difficulté élevée
        const attackDifficulty = (characteristicInfo.final * 4) + 6;
        const attackRoll = new Roll(`${characteristicInfo.final}d7`);

        // Dégâts par quart
        const damageRolls = {
            quarter1: null, // 0 dégâts
            quarter2: new Roll(`2d6 + ${characteristicInfo.final}`),
            quarter3: new Roll(`3d6 + ${characteristicInfo.final}`),
            quarter4: new Roll(`4d6 + ${characteristicInfo.final}`)
        };

        // Lancer tous les dés
        await attackRoll.evaluate();
        for (const [quarter, roll] of Object.entries(damageRolls)) {
            if (roll) await roll.evaluate();
        }

        // Message principal avec tous les résultats
        const attackFlavor = `
            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 8px; border: 2px solid #d32f2f;">
                <h3 style="margin: 0; color: #d32f2f;">🔥 Syphon de Grêle - Forme Finale</h3>
                <div style="margin: 10px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                    <div style="font-size: 1.1em; font-weight: bold; margin-bottom: 8px;">
                        ⚔️ Difficulté d'Esquive: ${attackDifficulty} (Esprit × 4 + 6)
                    </div>
                    <div style="font-size: 0.95em;">
                        <p><strong>🎯 Rayon total:</strong> ${finalRadius} cases (${extensions} extensions)</p>
                        <p><strong>💀 Quart 1 (0-${Math.floor(quarters.quarter1.max)}):</strong> 0 dégâts (${enemiesByQuarter.quarter1.length} cibles)</p>
                        <p><strong>💧 Quart 2 (${Math.floor(quarters.quarter1.max) + 1}-${Math.floor(quarters.quarter2.max)}):</strong> ${damageRolls.quarter2?.total || 0} dégâts (${enemiesByQuarter.quarter2.length} cibles)</p>
                        <p><strong>🌊 Quart 3 (${Math.floor(quarters.quarter2.max) + 1}-${Math.floor(quarters.quarter3.max)}):</strong> ${damageRolls.quarter3?.total || 0} dégâts - Esquive = demi (${enemiesByQuarter.quarter3.length} cibles)</p>
                        <p><strong>🌀 Quart 4 (${Math.floor(quarters.quarter3.max) + 1}-${finalRadius}):</strong> ${damageRolls.quarter4?.total || 0} dégâts - Esquive = demi (${enemiesByQuarter.quarter4.length} cibles)</p>
                    </div>
                </div>
                <div style="background: #fff3cd; padding: 8px; border-radius: 4px; margin-top: 8px;">
                    <strong>⚠️ Traversée du bord:</strong> 8d6 + ${characteristicInfo.final * 2} dégâts
                </div>
                <div style="background: #d1ecf1; padding: 8px; border-radius: 4px; margin-top: 8px;">
                    <strong>🛡️ Interruption:</strong> Si Ora subit des dégâts → Jet Volonté vs PV perdus × 1.5
                </div>
            </div>
        `;

        await attackRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: attackFlavor,
            rollMode: game.settings.get('core', 'rollMode')
        });

        // Messages de dégâts individuels
        for (const [quarter, roll] of Object.entries(damageRolls)) {
            if (roll && roll.total > 0) {
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ token: caster }),
                    flavor: `💧 <strong>Dégâts ${quarter.toUpperCase()}</strong>`,
                    rollMode: game.settings.get('core', 'rollMode')
                });
            }
        }

        // Animations d'impact par quart
        for (const [quarter, targets] of Object.entries(enemiesByQuarter)) {
            if (targets.length > 0 && damageRolls[quarter]) {
                const impactSequence = new Sequence();

                for (const target of targets) {
                    impactSequence.effect()
                        .file(SPELL_CONFIG.animations.impact)
                        .atLocation(target)
                        .scale(0.8)
                        .fadeIn(200)
                        .fadeOut(800)
                        .delay(Math.random() * 2000);
                }

                await impactSequence.play();
            }
        }

        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            content: `
                <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #ffebee, #ffffff); border-radius: 8px; border: 2px solid #d32f2f; margin: 8px 0;">
                    <h3 style="margin: 0; color: #d32f2f;">🔥 Syphon de Grêle - Forme Finale Activée</h3>
                    <div style="margin: 5px 0;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Rayon final:</strong> ${finalRadius} cases
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                        <p style="font-weight: bold; font-size: 1.1em; color: #d32f2f;">
                            🌀 Le Syphon atteint sa forme finale ! Attaques par quarts de distance.
                        </p>
                        <p><strong>Total des cibles:</strong> ${Object.values(enemiesByQuarter).flat().length}</p>
                    </div>
                    <div style="font-size: 0.9em; color: #666; margin-top: 5px;">
                        Prochaines actions disponibles : Répéter attaques, Extension, "Fuck you in particular"
                    </div>
                </div>
            `,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`🔥 Forme Finale ! ${finalRadius} cases, ${Object.values(enemiesByQuarter).flat().length} cibles affectées`);

    }

    // ===== PHASE FINALE : ACTIONS RÉPÉTÉES =====
    if (syphonEffect && syphonEffect.flags?.world?.currentPhase === "final") {
        console.log("[Syphon de Grêle] Actions en Phase Finale");

        const finalRadius = syphonEffect.flags?.world?.finalRadius || (SPELL_CONFIG.phases[4].radiusMultiplier * extensions);
        const currentExtensions = extensions;
        const maxExtensions = SPELL_CONFIG.finalPhase.maxExtensions;

        // Dialog de choix pour les actions en phase finale
        const finalActions = await new Promise((resolve) => {
            new Dialog({
                title: "🔥 Syphon de Grêle - Phase Finale",
                content: `
                    <div style="padding: 15px;">
                        <h3 style="margin: 0 0 15px 0; color: #d32f2f;">🌀 Actions en Phase Finale</h3>

                        <div style="margin: 15px 0; padding: 12px; background: #ffebee; border-radius: 6px; border-left: 4px solid #f44336;">
                            <h4 style="margin: 0 0 8px 0; color: #d32f2f;">📊 État Actuel</h4>
                            <p style="margin: 0;"><strong>Rayon actuel :</strong> ${finalRadius} cases</p>
                            <p style="margin: 0;"><strong>Extensions :</strong> ${currentExtensions}/${maxExtensions}</p>
                        </div>

                        <div style="margin: 15px 0; padding: 12px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #2196f3;">
                            <h4 style="margin: 0 0 8px 0; color: #1976d2;">🔄 Répéter Attaques</h4>
                            <p style="margin: 0;"><strong>Coût :</strong> Gratuit</p>
                            <p style="margin: 0;"><strong>Effet :</strong> Relance les attaques par quarts de distance</p>
                        </div>

                        ${currentExtensions < maxExtensions ? `
                        <div style="margin: 15px 0; padding: 12px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                            <h4 style="margin: 0 0 8px 0; color: #e65100;">📏 Extension</h4>
                            <p style="margin: 0;"><strong>Coût :</strong> ${SPELL_CONFIG.finalPhase.extensionCost} mana</p>
                            <p style="margin: 0;"><strong>Nouveau rayon :</strong> ${finalRadius + SPELL_CONFIG.finalPhase.extensionRadius} cases (+${SPELL_CONFIG.finalPhase.extensionRadius})</p>
                        </div>
                        ` : '<div style="padding: 8px; background: #f5f5f5; border-radius: 4px; color: #666;"><em>Extension maximale atteinte (5/5)</em></div>'}

                        <div style="margin: 15px 0; padding: 12px; background: #f3e5f5; border-radius: 6px; border-left: 4px solid #e91e63;">
                            <h4 style="margin: 0 0 8px 0; color: #c2185b;">"Fuck You In Particular"</h4>
                            <p style="margin: 0;"><strong>Coût :</strong> GRATUIT</p>
                            <p style="margin: 0;"><strong>Effet :</strong> Attaque ciblée niveau ${SPELL_CONFIG.finalPhase.freeAttackLevel}</p>
                            <p style="margin: 0;"><strong>Dégâts :</strong> Selon le quart de distance de la cible</p>
                        </div>

                        <div style="margin: 15px 0; padding: 12px; background: #f1f8e9; border-radius: 6px; border-left: 4px solid #4caf50;">
                            <h4 style="margin: 0 0 8px 0; color: #388e3c;">🛑 Terminer le Sort</h4>
                            <p style="margin: 0;"><strong>Coût :</strong> Jet de Volonté DD ${SPELL_CONFIG.finalPhase.willSaveDC * currentExtensions}</p>
                            <p style="margin: 0;"><strong>Échec :</strong> -${SPELL_CONFIG.finalPhase.willFailCost} mana</p>
                        </div>
                    </div>
                `,
                buttons: {
                    repeat: {
                        label: "🔄 Répéter Attaques",
                        callback: () => resolve({ action: 'repeat' })
                    },
                    ...(currentExtensions < maxExtensions ? {
                        extend: {
                            label: "📏 Extension (+8 cases)",
                            callback: () => resolve({ action: 'extend' })
                        }
                    } : {}),
                    fuck: {
                        label: '💀 "Fuck You In Particular"',
                        callback: () => resolve({ action: 'fuck' })
                    },
                    end: {
                        label: "🛑 Terminer le Sort",
                        callback: () => resolve({ action: 'end' })
                    },
                    cancel: {
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "repeat"
            }).render(true);
        });

        if (!finalActions) {
            ui.notifications.info("❌ Action annulée.");
            return;
        }

        switch (finalActions.action) {
            case 'repeat':
                // RÉPÉTER LES ATTAQUES (gratuit - code déjà exécuté ci-dessus)
                ui.notifications.info("🔄 Attaques répétées ! (Voir les jets ci-dessus)");
                break;

            case 'extend':
                // EXTENSION (+8 CASES)
                const extensionCost = SPELL_CONFIG.finalPhase.extensionCost;
                if (currentExtensions >= maxExtensions) {
                    ui.notifications.error(`❌ Extension maximale atteinte (${maxExtensions}/5) !`);
                    return;
                } const newFinalRadius = finalRadius + SPELL_CONFIG.finalPhase.extensionRadius;
                const newExtensions = currentExtensions + 1;

                // Mettre à jour les animations
                await stopAnimation(`SyphonGrele_Final_Zone_${actor.id}`);
                await stopAnimation(`SyphonGrele_Final_Particles_${actor.id}`);
                await stopAnimation(`SyphonGrele_Final_Syphon_${actor.id}`);

                const extendedSequence = new Sequence();

                extendedSequence.effect()
                    .file(SPELL_CONFIG.animations.phase1)
                    .attachTo(caster)
                    .scale(newFinalRadius * 0.25)
                    .fadeIn(1500)
                    .persist(true)
                    .name(`SyphonGrele_Final_Zone_${actor.id}`)
                    .belowTokens(true)
                    .opacity(0.1);

                extendedSequence.effect()
                    .file(SPELL_CONFIG.animations.phase2Particles)
                    .attachTo(caster)
                    .scale(newFinalRadius * 0.25)
                    .fadeIn(1500)
                    .persist(true)
                    .name(`SyphonGrele_Final_Particles_${actor.id}`)
                    .belowTokens(false)
                    .opacity(0.15);

                extendedSequence.effect()
                    .file(SPELL_CONFIG.animations.syphonCenter)
                    .attachTo(caster)
                    .scale(1.4)
                    .fadeIn(1500)
                    .persist(true)
                    .name(`SyphonGrele_Final_Syphon_${actor.id}`)
                    .belowTokens(false)
                    .opacity(0.7)
                    .rotate(180);

                await extendedSequence.play();

                await syphonEffect.update({
                    "flags.world.finalRadius": newFinalRadius,
                    "flags.world.extensions": newExtensions,
                    "description": `Syphon de Grêle - Forme Finale (${newFinalRadius} cases, ${newExtensions} extensions)`
                });

                ui.notifications.info(`📏 Extension ! Nouveau rayon: ${newFinalRadius} cases (${newExtensions}/${maxExtensions})`);
                break;

            case 'fuck':
                // "FUCK YOU IN PARTICULAR" - Attaque ciblée gratuite
                try {
                    const target = await portal.crosshairs.show({
                        size: 1,
                        icon: "icons/magic/death/skull-horned-goat-pentagram-red.webp",
                        label: "Sélectionner la cible malchanceuse",
                        tag: "syphon-fuck-target",
                        drawIcon: true,
                        drawOutline: true,
                        interval: -1
                    });

                    if (!target.cancelled) {
                        const targetToken = canvas.tokens.placeables.find(t =>
                            t.x === target.x && t.y === target.y
                        );

                        // Déterminer le quart de distance pour les dégâts
                        const distance = Math.sqrt(
                            Math.pow(target.x - caster.x, 2) +
                            Math.pow(target.y - caster.y, 2)
                        ) / canvas.grid.size;

                        const quarters = getQuarterRanges(finalRadius);
                        let damageFormula = "2d6"; // Défaut quart 2
                        let quarterName = "2";

                        if (distance <= quarters.quarter1.max) {
                            damageFormula = "2d6"; // Considérer le quart 2 si quart 1
                            quarterName = "1→2";
                        } else if (distance <= quarters.quarter2.max) {
                            damageFormula = "2d6";
                            quarterName = "2";
                        } else if (distance <= quarters.quarter3.max) {
                            damageFormula = "3d6";
                            quarterName = "3";
                        } else {
                            damageFormula = "4d6";
                            quarterName = "4";
                        }

                        const fuckAttackRoll = new Roll(`${characteristicInfo.final}d7`);
                        const fuckDamageRoll = new Roll(`${damageFormula} + ${characteristicInfo.final}`);

                        const fuckFlavor = `
                            <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #f3e5f5, #fce4ec); border-radius: 8px; border: 2px solid #e91e63;">
                                <h3 style="margin: 0; color: #c2185b;">💀 "Fuck You In Particular"</h3>
                                <div style="margin: 5px 0;">
                                    <strong>Cible:</strong> ${targetToken?.name || "Position " + target.x + "," + target.y}
                                </div>
                                <div style="margin: 5px 0;">
                                    <strong>Distance:</strong> ${Math.floor(distance)} cases (Quart ${quarterName})
                                </div>
                                <div style="margin: 5px 0; font-weight: bold; color: #e91e63;">
                                    💀 ATTAQUE GRATUITE NIVEAU ${SPELL_CONFIG.finalPhase.freeAttackLevel} 💀
                                </div>
                            </div>
                        `;

                        await fuckAttackRoll.toMessage({
                            speaker: ChatMessage.getSpeaker({ token: caster }),
                            flavor: fuckFlavor,
                            rollMode: game.settings.get('core', 'rollMode')
                        });

                        await fuckDamageRoll.toMessage({
                            speaker: ChatMessage.getSpeaker({ token: caster }),
                            flavor: `💀 <strong>Dégâts "Fuck You In Particular"</strong>`,
                            rollMode: game.settings.get('core', 'rollMode')
                        });

                        // Animation d'impact spéciale
                        const fuckSequence = new Sequence();
                        fuckSequence.effect()
                            .file("jb2a.explosion.01.orange")
                            .atLocation(target)
                            .scale(1.5)
                            .fadeIn(100)
                            .fadeOut(1000);
                        await fuckSequence.play();

                        ui.notifications.info(`💀 "Fuck You In Particular" lancé ! Attaque: ${fuckAttackRoll.total}, Dégâts: ${fuckDamageRoll.total}`);
                    }
                } catch (error) {
                    console.error("[Syphon de Grêle] Erreur ciblage:", error);
                    ui.notifications.error("❌ Erreur lors du ciblage !");
                }
                break;

            case 'end':
                // TERMINER LE SORT avec jet de Volonté
                const willSaveDC = SPELL_CONFIG.finalPhase.willSaveDC * currentExtensions;
                const willRoll = new Roll(`${characteristicInfo.final}d7`);

                const willFlavor = `
                    <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #f1f8e9, #e8f5e8); border-radius: 8px; border: 2px solid #4caf50;">
                        <h3 style="margin: 0; color: #388e3c;">🛑 Terminer le Syphon de Grêle</h3>
                        <div style="margin: 5px 0;">
                            <strong>Jet de Volonté:</strong> ${characteristicInfo.final}d7 vs DD ${willSaveDC}
                        </div>
                        <div style="margin: 5px 0;">
                            <strong>Échec:</strong> -${SPELL_CONFIG.finalPhase.willFailCost} mana
                        </div>
                    </div>
                `;

                await willRoll.toMessage({
                    speaker: ChatMessage.getSpeaker({ token: caster }),
                    flavor: willFlavor,
                    rollMode: game.settings.get('core', 'rollMode')
                });

                if (willRoll.total < willSaveDC) {
                    // Échec : information seulement
                    ui.notifications.warn(`⚠️ Jet de Volonté échoué ! Coût théorique: ${SPELL_CONFIG.finalPhase.willFailCost} mana`);
                }

                // Arrêter toutes les animations
                await stopAnimation(`SyphonGrele_Final_Zone_${actor.id}`);
                await stopAnimation(`SyphonGrele_Final_Particles_${actor.id}`);
                await stopAnimation(`SyphonGrele_Final_Syphon_${actor.id}`);

                // Supprimer l'effet Syphon
                await syphonEffect.delete();

                ChatMessage.create({
                    speaker: ChatMessage.getSpeaker({ token: caster }),
                    content: `
                        <div style="text-align: center; padding: 12px; background: linear-gradient(135deg, #f1f8e9, #ffffff); border-radius: 8px; border: 2px solid #4caf50; margin: 8px 0;">
                            <h3 style="margin: 0; color: #388e3c;">🛑 Syphon de Grêle - Terminé</h3>
                            <div style="margin: 10px 0; padding: 10px; background: #f1f8e9; border-radius: 4px;">
                                <p style="font-weight: bold; font-size: 1.1em; color: #388e3c;">
                                    🌊 Le puissant syphon de grêle se dissipe enfin...
                                </p>
                                <p><strong>Jet de Volonté:</strong> ${willRoll.total} vs DD ${willSaveDC} ${willRoll.total >= willSaveDC ? '✅ Réussi' : '❌ Échec'}</p>
                                ${willRoll.total < willSaveDC ? `<p style="color: #f57c00;"><strong>Coût d'échec:</strong> -${SPELL_CONFIG.finalPhase.willFailCost} mana</p>` : ''}
                            </div>
                        </div>
                    `,
                    rollMode: game.settings.get('core', 'rollMode')
                });

                ui.notifications.info("🛑 Syphon de Grêle terminé !");
                break;
        }
    }

})();
