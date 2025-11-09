/**
 * Étoile du renouveau - Forge de Xanathar - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Sort ultime de sacrifice et transformation :
 * - Phase 1 (Création) : Raynart sacrifie TOUTES ses invocations pour créer un soleil artificiel
 * - Phase 2 (Tir) : Le soleil peut tirer des rayons destructeurs
 * - Phase 2 (Destruction) : Le soleil peut être détruit manuellement
 *
 * MÉCANIQUES :
 * - Création : Sacrifice toutes les invocations, crée un soleil persistant au point ciblé
 * - Tir : X mana par tir (non-focusable, demi-focus si Armure de l'Infini)
 *   * Jet d'Esprit (sort niveau 3)
 *   * Dégâts : (Esprit/2 arrondi inf.) × mana dépensé, perforant
 * - Destruction : Détruit le soleil avec animation
 *
 * Prerequisites:
 * - Portal module (ciblage)
 * - Sequencer (animations)
 * - JB2A (effets visuels)
 *
 * Usage : Sélectionner le token de Raynart et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Étoile du renouveau",
        subtitle: "Forge de Xanathar",
        raynartActorId: "4bandVHr1d92RYuL",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        spellLevel: 3,

        sunEffect: {
            name: "EtoileRenouveau",
            flagName: "etoileRenouveauSun"
        },

        // IDs des invocations (depuis HandleRaynartInvocations.js)
        invocationActorIds: {
            murMecanique: "9NXEFMzzBF3nmByB",
            balliste: "FQzsrD4o20avg7co",
            gatling: "M7oAyZmgzi5XEYNE",
            araignee: "P0NlGCJh7r6K5yuc",
            paratonnerre: "pJuR9WIyouueE6Kv",
            velkoz: "DCUdL8S8N6t9eSMF"
        },

        animation: {
            castCircle: "modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm",
            sunCore: "jb2a_patreon.fireball.loop_debris.orange",
            sunAura: "jb2a.template_circle.aura.03.inward.004.complete.part01.blue",
            missile: "jb2a_patreon.scorching_ray.02.orange"
        },

        targeting: {
            color: "#ff9800",
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
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

    console.log(`[EtoileRenouveau] Raynart detected: ${raynartActor.name}`);

    // ===== VÉRIFICATION MODULE PORTAL =====
    if (typeof Portal === "undefined") {
        ui.notifications.error("❌ Le module Portal n'est pas disponible ! Veuillez l'activer.");
        return;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Détecte la stance actuelle de l'acteur
     */
    function detectCombatStance(actor) {
        const currentStance = actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
        return currentStance;
    }

    /**
     * Gets active effect bonuses for a specific flag key
     */
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.world?.[flagKey];
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
            }
        }
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
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
     * Vérifie si Armure de l'Infini est active
     */
    function hasArmureInfini(actor) {
        return actor?.effects?.contents?.some(e => e.name === "Armure du Fléau de l'Infini") || false;
    }

    /**
     * Met à jour le compteur Armure Infini
     */
    async function updateArmureInfiniCounter(actor, manaToAdd) {
        const armureEffect = actor?.effects?.contents?.find(e =>
            e.name === "Armure de l'Infini"
        );
        if (!armureEffect) return;

        const currentCounter = armureEffect.flags?.statuscounter?.value || 0;
        const newCounter = currentCounter + manaToAdd;

        await armureEffect.update({
            'flags.statuscounter.value': newCounter
        });

        console.log(`[EtoileRenouveau] Armure Infini updated: ${currentCounter} -> ${newCounter}`);
    }

    /**
     * Récupère toutes les invocations de Raynart sur la scène
     */
    function getAllInvocations() {
        const invocations = [];
        const actorIds = Object.values(SPELL_CONFIG.invocationActorIds);

        for (const token of canvas.tokens.placeables) {
            if (token.actor && actorIds.includes(token.actor.id)) {
                invocations.push(token);
            }
        }

        return invocations;
    }

    /**
     * Vérifie si le soleil est déjà actif
     */
    function checkSunExists() {
        return raynartActor?.flags?.world?.[SPELL_CONFIG.sunEffect.flagName] || null;
    }

    /**
     * Trouve le token à une position donnée
     */
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

    // ===== DETECT CURRENT STATE =====
    const currentStance = detectCombatStance(raynartActor);
    const characteristicInfo = getCharacteristicValue(raynartActor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    const hasArmure = hasArmureInfini(raynartActor);
    const sunData = checkSunExists();
    const sunExists = !!sunData;

    console.log(`[EtoileRenouveau] State - Sun exists: ${sunExists}, Armure: ${hasArmure}`);

    // ===== PHASE 1: CRÉATION DU SOLEIL =====
    if (!sunExists) {
        console.log(`[EtoileRenouveau] Starting sun creation phase...`);

        // Récupérer toutes les invocations
        const invocations = getAllInvocations();

        if (invocations.length === 0) {
            ui.notifications.warn("⚠️ Aucune invocation à sacrifier ! Impossible de créer l'Étoile du renouveau.");
            return;
        }

        console.log(`[EtoileRenouveau] Found ${invocations.length} invocations to sacrifice`);

        // Sélectionner l'emplacement du soleil
        ui.notifications.info("🌟 Sélectionnez l'emplacement de l'Étoile du renouveau...");

        const portalInstance = new Portal()
            .origin(raynartToken)
            .color(SPELL_CONFIG.targeting.color)
            .texture(SPELL_CONFIG.targeting.texture);

        const portalResult = await portalInstance.pick();

        if (!portalResult || portalResult.cancelled) {
            ui.notifications.warn("❌ Création annulée.");
            return;
        }

        const sunPosition = { x: portalResult.x, y: portalResult.y };

        // Animation du cercle de magie sur Raynart
        const castSequence = new Sequence()
            .effect()
                .file(SPELL_CONFIG.animation.castCircle)
                .attachTo(raynartToken)
                .scaleToObject(2.0)
                .fadeOut(500)
                .waitUntilFinished(-500);

        await castSequence.play();

        // Déplacer toutes les invocations vers le point du soleil
        ui.notifications.info("🌟 Les invocations convergent vers le soleil...");

        // Déplacer chaque invocation vers le soleil
        for (const invocation of invocations) {
            // Mise à jour de la position vers le soleil
            const updates = {
                x: sunPosition.x -50,
                y: sunPosition.y -50
            };

            await invocation.document.update(updates);
        }

        // Attendre un peu pour laisser les animations de déplacement se terminer
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Détruire les tokens une fois arrivés
        for (const invocation of invocations) {
            await invocation.document.delete();
        }

        // Créer le soleil avec scale in progressif
        const sunCreationSequence = new Sequence()
            // Core du soleil avec scale in
            .effect()
                .file(SPELL_CONFIG.animation.sunCore)
                .atLocation(sunPosition)
                .opacity(0.6)
                .scaleIn(0, 3000, { ease: "easeOutCubic" })
                .scale(1)
                .persist()
                .scaleOut(0, 1000, { ease: "easeInCubic" })
                .fadeOut(1000)
                .name(`${SPELL_CONFIG.sunEffect.name}-core-${raynartToken.id}`)
            // Aura persistante
            .effect()
                .file(SPELL_CONFIG.animation.sunAura)
                .atLocation(sunPosition)
                .opacity(0.2)
                .tint("#8b0000") // Rouge sombre
                .scale(1)
                .delay(500) // Après le scale in du core
                .persist()
                .belowTokens(true)
                .scaleOut(0, 1000, { ease: "easeInCubic" })
                .fadeOut(1000)
                .name(`${SPELL_CONFIG.sunEffect.name}-aura-${raynartToken.id}`);

        await sunCreationSequence.play();

        // Enregistrer les données du soleil dans les flags de Raynart
        await raynartActor.setFlag('world', SPELL_CONFIG.sunEffect.flagName, {
            x: sunPosition.x,
            y: sunPosition.y,
            createdAt: Date.now(),
            invocationsSacrificed: invocations.length
        });

        // Message dans le chat
        const chatContent = `
            <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, #ff9800, #ff5722); padding: 15px; border-radius: 10px; border: 3px solid #bf360c;">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: white; font-size: 1.5em;">
                        🌟 ${SPELL_CONFIG.name}
                    </h3>
                    <div style="margin-top: 4px; font-size: 0.9em; color: #ffccbc;">
                        <em>${SPELL_CONFIG.subtitle}</em>
                    </div>
                    <div style="margin-top: 6px; font-size: 0.95em; color: white;">
                        <strong>Mage:</strong> ${raynartActor.name}
                    </div>
                </div>

                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                    <p style="margin: 4px 0; font-size: 1.1em; color: #bf360c; font-weight: bold;">
                        ☀️ Un soleil artificiel apparaît dans le ciel !
                    </p>
                    <p style="margin: 4px 0;"><strong>Invocations sacrifiées:</strong> ${invocations.length}</p>
                    <p style="margin: 4px 0; font-size: 0.9em; color: #666;">
                        Raynart a utilisé ses créations pour forger une étoile dans le ciel,
                        un soleil artificiel de pure énergie mécanique.
                    </p>
                </div>

                <div style="background: #fff3e0; padding: 10px; border-radius: 6px; font-size: 0.85em; color: #666; text-align: center;">
                    ℹ️ Lancez à nouveau la macro pour tirer avec le soleil ou le détruire
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: raynartToken }),
            content: chatContent,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`🌟 Étoile du renouveau créée ! (${invocations.length} invocations sacrifiées)`);
        return;
    }

    // ===== PHASE 2: TIR OU DESTRUCTION =====
    console.log(`[EtoileRenouveau] Sun already exists, offering fire or destroy options...`);

    // Dialog de choix
    const action = await new Promise((resolve) => {
        const dialogContent = `
            <style>
                .etoile-dialog { font-family: 'Signika', sans-serif; }
                .action-card {
                    margin: 10px 0;
                    padding: 15px;
                    border: 2px solid;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .action-card:hover {
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    transform: scale(1.02);
                }
                .fire-card {
                    background: #fff3e0;
                    border-color: #ff9800;
                }
                .destroy-card {
                    background: #ffebee;
                    border-color: #f44336;
                }
            </style>
            <div class="etoile-dialog">
                <h3 style="color: #ff9800; margin-bottom: 15px;">🌟 Étoile du renouveau - Actions</h3>
                <p style="margin-bottom: 15px;"><strong>Mage:</strong> ${raynartActor.name}</p>

                <div class="action-card fire-card" data-action="fire">
                    <h4 style="margin: 0; color: #ff9800;">☀️ Tirer avec le soleil</h4>
                    <p style="margin: 4px 0; font-size: 0.9em; color: #666;">
                        Libère l'énergie du soleil en rayons destructeurs
                    </p>
                </div>

                <div class="action-card destroy-card" data-action="destroy">
                    <h4 style="margin: 0; color: #f44336;">💥 Détruire le soleil</h4>
                    <p style="margin: 4px 0; font-size: 0.9em; color: #666;">
                        Dissipe le soleil artificiel
                    </p>
                </div>
            </div>
        `;

        let selectedAction = null;

        const dialog = new Dialog({
            title: "🌟 Étoile du renouveau",
            content: dialogContent,
            buttons: {
                confirm: {
                    label: "✅ Confirmer",
                    callback: () => {
                        if (!selectedAction) {
                            ui.notifications.warn("⚠️ Veuillez sélectionner une action !");
                            return;
                        }
                        resolve(selectedAction);
                    }
                },
                cancel: {
                    label: "❌ Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "confirm",
            close: () => resolve(null),
            render: (html) => {
                html.find('.action-card').click(function() {
                    html.find('.action-card').css('border-width', '2px');
                    $(this).css('border-width', '4px');
                    selectedAction = $(this).data('action');
                });
            }
        }, {
            width: 500
        });

        dialog.render(true);
    });

    if (!action) {
        ui.notifications.info("❌ Action annulée.");
        return;
    }

    // ===== DESTRUCTION DU SOLEIL =====
    if (action === 'destroy') {
        console.log(`[EtoileRenouveau] Destroying sun...`);

        // Arrêter les animations persistantes avec fadeOut et scaleOut
        Sequencer.EffectManager.endEffects({ name: `${SPELL_CONFIG.sunEffect.name}-core-${raynartToken.id}` });
        Sequencer.EffectManager.endEffects({ name: `${SPELL_CONFIG.sunEffect.name}-aura-${raynartToken.id}` });

        // Retirer le flag
        await raynartActor.unsetFlag('world', SPELL_CONFIG.sunEffect.flagName);

        // Message dans le chat
        const chatContent = `
            <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, #ffebee, #ffccbc); padding: 15px; border-radius: 10px; border: 3px solid #f44336;">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: #f44336; font-size: 1.5em;">
                        💥 ${SPELL_CONFIG.name}
                    </h3>
                    <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                        <strong>Mage:</strong> ${raynartActor.name}
                    </div>
                </div>

                <div style="background: white; padding: 12px; border-radius: 8px;">
                    <p style="margin: 4px 0; font-size: 1.1em; color: #f44336; font-weight: bold;">
                        🌑 Le soleil artificiel se dissipe...
                    </p>
                    <p style="margin: 4px 0; font-size: 0.9em; color: #666;">
                        L'étoile forgée par Raynart disparaît dans un éclat de lumière.
                    </p>
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: raynartToken }),
            content: chatContent,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info("💥 Le soleil a été détruit.");
        return;
    }

    // ===== TIR AVEC LE SOLEIL =====
    if (action === 'fire') {
        console.log(`[EtoileRenouveau] Firing with sun...`);

        // Dialog pour configurer les tirs
        const fireConfig = await new Promise((resolve) => {
            const dialogContent = `
                <style>
                    .fire-config-dialog { font-family: 'Signika', sans-serif; }
                    .shot-config {
                        margin: 10px 0;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 6px;
                    }
                </style>
                <div class="fire-config-dialog">
                    <h3 style="color: #ff9800; margin-bottom: 15px;">☀️ Configuration des Tirs</h3>

                    <div style="margin-bottom: 15px; padding: 10px; background: #fff3e0; border-radius: 6px;">
                        <p style="margin: 4px 0;"><strong>Mage:</strong> ${raynartActor.name}</p>
                        <p style="margin: 4px 0;"><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} ${characteristicInfo.final}</p>
                        <p style="margin: 4px 0;"><strong>Dégâts par mana:</strong> ${Math.floor(characteristicInfo.final / 2)} (Esprit/2, perforant)</p>
                        <p style="margin: 4px 0; color: #666; font-size: 0.9em;">
                            Coût: ${hasArmure ? 'Demi-focusable (Armure active)' : 'Non-focusable'}
                        </p>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 4px;"><strong>Nombre de tirs :</strong></label>
                        <input type="number" id="shotCount" value="1" min="1" max="10" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                    </div>

                    <div id="shotConfigs"></div>
                </div>
            `;

            let currentShotCount = 1;

            const updateShotConfigs = (html) => {
                const shotCount = parseInt(html.find('#shotCount').val()) || 1;
                if (shotCount === currentShotCount) return;
                currentShotCount = shotCount;

                const container = html.find('#shotConfigs');
                container.empty();

                for (let i = 1; i <= shotCount; i++) {
                    container.append(`
                        <div class="shot-config">
                            <label style="display: block; margin-bottom: 4px;"><strong>Tir ${i} - Mana dépensé :</strong></label>
                            <input type="number" class="mana-input" data-shot="${i}" value="1" min="1" style="width: 100%; padding: 6px; border: 1px solid #ccc; border-radius: 4px;">
                        </div>
                    `);
                }
            };

            const dialog = new Dialog({
                title: "☀️ Tirs du Soleil",
                content: dialogContent,
                buttons: {
                    confirm: {
                        label: "✅ Tirer",
                        callback: (html) => {
                            const shotCount = parseInt(html.find('#shotCount').val()) || 1;
                            const shots = [];

                            for (let i = 1; i <= shotCount; i++) {
                                const mana = parseInt(html.find(`.mana-input[data-shot="${i}"]`).val()) || 1;
                                shots.push({ index: i, mana: mana });
                            }

                            resolve({ shots });
                        }
                    },
                    cancel: {
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null),
                render: (html) => {
                    updateShotConfigs(html);
                    html.find('#shotCount').change(() => updateShotConfigs(html));
                }
            }, {
                width: 500,
                height: 1000
            });

            dialog.render(true);
        });

        if (!fireConfig) {
            ui.notifications.info("❌ Tir annulé.");
            return;
        }

        const { shots } = fireConfig;
        console.log(`[EtoileRenouveau] Configured ${shots.length} shots:`, shots);

        // Calculer le coût total en mana
        let totalManaCost = 0;
        let savedByArmure = 0;

        for (const shot of shots) {
            let shotCost = shot.mana;

            // Si Armure de l'Infini active, demi-focusable (coût / 2)
            if (hasArmure) {
                const halfCost = Math.floor(shot.mana / 2);
                savedByArmure += halfCost;
                shotCost = halfCost;
            }

            totalManaCost += shotCost;
        }

        console.log(`[EtoileRenouveau] Total mana cost: ${totalManaCost}, saved by armure: ${savedByArmure}`);

        // Mettre à jour Armure Infini si nécessaire
        if (savedByArmure > 0) {
            await updateArmureInfiniCounter(raynartActor, savedByArmure);
        }

        // Ciblage pour chaque tir
        const targets = [];

        for (let i = 0; i < shots.length; i++) {
            ui.notifications.info(`🎯 Cible du tir ${i + 1}/${shots.length}...`);

            const portalInstance = new Portal()
                .origin(raynartToken)
                .color(SPELL_CONFIG.targeting.color)
                .texture(SPELL_CONFIG.targeting.texture);

            const portalResult = await portalInstance.pick();

            if (!portalResult || portalResult.cancelled) {
                ui.notifications.warn(`❌ Ciblage du tir ${i + 1} annulé.`);
                return;
            }

            const targetToken = getTokenAtLocation(portalResult.x, portalResult.y);
            targets.push({
                shot: shots[i],
                token: targetToken,
                name: targetToken?.name || "Position vide",
                position: { x: portalResult.x, y: portalResult.y }
            });
        }

        // Jets d'attaque et de dégâts
        const levelBonus = SPELL_CONFIG.spellLevel * 2;
        const damagePerMana = Math.floor(characteristicInfo.final / 2);

        const allRolls = [];

        for (const target of targets) {
            const attackFormula = `${characteristicInfo.final}d7 + ${levelBonus}`;
            const rawDamage = damagePerMana * target.shot.mana;

            allRolls.push({
                target: target,
                attackFormula: attackFormula,
                rawDamage: rawDamage // Dégâts fixes (perforant)
            });
        }

        // Animations des tirs depuis le soleil
        const sunPosition = { x: sunData.x, y: sunData.y };
        const gridSize = canvas.grid.size;

        const fireSequence = new Sequence();

        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];
            const delay = i * 300; // 300ms entre chaque tir

            // Offset aléatoire dans un rayon d'une case
            const randomOffsetX = (Math.random() - 0.5) * 3 * gridSize;
            const randomOffsetY = (Math.random() - 0.5) * 3 * gridSize;

            const startPos = {
                x: sunPosition.x + randomOffsetX,
                y: sunPosition.y + randomOffsetY
            };

            fireSequence
                .effect()
                    .file(SPELL_CONFIG.animation.missile)
                    .atLocation(startPos)
                    .stretchTo(target.position)
                    .mirrorY(Math.random() > 0.5 ? true : false)
                    .delay(delay)
        }

        await fireSequence.play();

        // Combined roll pour les attaques
        const rollFormulas = allRolls.map(r => r.attackFormula);
        const combinedRoll = new Roll(`{${rollFormulas.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        // Extraire les résultats des attaques
        for (let i = 0; i < allRolls.length; i++) {
            allRolls[i].attackResult = combinedRoll.terms[0].results[i].result;
        }

        // Construire le message de chat
        const shotSummaries = allRolls.map((roll, index) => {
            return `
                <div style="margin: 8px 0; padding: 8px; background: #f5f5f5; border-radius: 4px; border-left: 3px solid #ff9800;">
                    <strong>Tir ${index + 1}:</strong> ${roll.target.name}<br>
                    <small>Mana: ${roll.target.shot.mana} | Attaque: ${roll.attackResult} | Dégâts: ${roll.rawDamage} (perforant)</small>
                </div>
            `;
        }).join('');

        const costDisplay = hasArmure
            ? `${totalManaCost} mana (demi-focusable, ${savedByArmure} économisés)`
            : `${totalManaCost} mana (non-focusable)`;

        const chatContent = `
            <div style="font-family: 'Signika', sans-serif; background: linear-gradient(135deg, #fff3e0, #ff9800); padding: 15px; border-radius: 10px; border: 3px solid #ff9800;">
                <div style="text-align: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; color: #bf360c; font-size: 1.5em;">
                        ☀️ ${SPELL_CONFIG.name}
                    </h3>
                    <div style="margin-top: 4px; font-size: 0.9em; color: #666;">
                        <em>Tirs Solaires</em>
                    </div>
                    <div style="margin-top: 6px; font-size: 0.95em; color: #666;">
                        <strong>Mage:</strong> ${raynartActor.name}
                    </div>
                </div>

                <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
                    <p style="margin: 4px 0;"><strong>Nombre de tirs:</strong> ${shots.length}</p>
                    <p style="margin: 4px 0;"><strong>Coût total:</strong> ${costDisplay}</p>
                    <p style="margin: 4px 0;"><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} ${characteristicInfo.final}</p>
                    <p style="margin: 4px 0;"><strong>Dégâts par mana:</strong> ${damagePerMana} (perforant)</p>
                </div>

                <div style="background: #f3e5f5; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                    <h4 style="margin: 0 0 8px 0; color: #ff9800;">Résultats des Tirs :</h4>
                    ${shotSummaries}
                </div>
            </div>
        `;

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: raynartToken }),
            flavor: chatContent,
            rollMode: game.settings.get('core', 'rollMode')
        });

        ui.notifications.info(`☀️ ${shots.length} tir(s) solaire(s) déclenché(s) ! (Coût: ${costDisplay})`);
    }

    console.log(`[EtoileRenouveau] Spell complete`);

})();
