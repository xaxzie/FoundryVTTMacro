/**
 * Royaume des Chaînes - Léo
 *
 * Deux versions disponibles :
 *
 * VERSION SIMPLE (Monocible) :
 * - Coût : 3 mana initial (focalisable) + 3 mana/tour maintenu (NON focalisable)
 * - Effet sur la cible : -4 Agilité, -2 sur toutes autres caractéristiques
 * - Effet sur Léo : -3 Agilité (concentration requise)
 * - Cible : unique avec animations complexes persistantes
 *
 * VERSION MULTICIBLE :
 * - Coût : 5 mana (focalisable) - pas de maintenance
 * - Malus d'attaque : -4 dés (difficulté du multicible)
 * - Effet appliqué : "Chaîne d'Acier" (comme Steel Chain) sur chaque cible
 * - Cibles : 1 à 4 cibles avec bonus de libération +2
 * - Animations : chaînes multiples vers chaque cible
 *
 * Usage : sélectionner le token de Léo, choisir la version, puis cibler.
 * Utiliser la macro "endLeoEffect.js" pour terminer les effets.
 */

(async () => {
    // ===== CONFIGURATIONS DES SORTS =====
    const SPELL_CONFIGS = {
        simple: {
            name: "Royaume des Chaînes",
            characteristic: "physique",
            characteristicDisplay: "Physique",
            manaCost: 3,
            maintenanceCost: 3, // Coût par tour pour maintenir (NON focalisable)
            spellLevel: 2,
            isDirect: true,
            isFocusable: true, // Seulement pour le coût initial
            hasNoDamage: true, // Pas de dégâts, juste un test de toucher
            isMultiTarget: false,

            animations: {
                cast: "jb2a.divine_smite.caster.reversed.blueyellow",
                chainKingdom: "jb2a.markers.chain.standard.loop.01.red", // Animation persistante de chaînes complexes
                connection: "jaamod.spells_effects.chain2", // Chaîne de connexion
                sound: null
            },

            targeting: {
                range: 200, // Plus longue portée que Steel Chain
                color: "#4a4a4a", // Couleur acier sombre
                texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            },

            // Configuration des effets persistants
            targetEffects: {
                // Effet principal (Agilité -4) - celui qui sera détecté par endLeoEffect
                agility: {
                    name: "Royaume des Chaînes (Agilité)",
                    icon: "icons/tools/fasteners/chain-brass-yellow.webp",
                    description: "Entravé par le royaume des chaînes de Léo - Agilité fortement réduite"
                },
                // Effet secondaire (autres stats -2)
                other: {
                    name: "Royaume des Chaînes (Général)",
                    icon: "icons/commodities/metal/chain-steel.webp",
                    description: "Affaibli par le royaume des chaînes de Léo - Toutes autres caractéristiques réduites"
                }
            },

            // Effet sur le lanceur
            casterEffect: {
                name: "Royaume des Chaînes (Concentration)",
                icon: "icons/magic/symbols/runes-star-blue.webp",
                description: "Maintient le royaume des chaînes - Agilité réduite par la concentration"
            },

            // Les 7 caractéristiques du système (pour l'effet -2)
            otherCharacteristics: [
                "physique",
                "dexterite",
                "perception",
                "esprit",
                "parole",
                "savoir",
                "volonte"
            ]
        },

        multicible: {
            name: "Royaume des Chaînes (Multicible)",
            characteristic: "physique",
            characteristicDisplay: "Physique",
            manaCost: 5,
            spellLevel: 2,
            isDirect: true,
            isFocusable: true,
            hasNoDamage: true, // Pas de dégâts, juste un test de toucher
            multiTargetPenalty: -4, // Malus pour le multicible
            isMultiTarget: true,

            animations: {
                cast: "jb2a.divine_smite.caster.reversed.blueyellow",
                chain: "jaamod.spells_effects.chain2", // Chaîne persistante (même que Steel Chain)
                sound: null
            },

            targeting: {
                range: 200,
                color: "#4a4a4a", // Couleur acier sombre
                texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            },

            // Configuration de l'effet appliqué (même que Steel Chain)
            chainEffect: {
                name: "Chaîne d'Acier",
                icon: "icons/commodities/metal/chain-steel.webp",
                description: "Enchaîné par une chaîne d'acier magique (Royaume Multicible)",
                liberationBonus: 2 // Bonus pour se libérer
            },

            // Limites de ciblage
            targetLimits: {
                min: 1,
                max: 4
            }
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== CHOIX DE LA VERSION =====
    async function selectSpellVersion() {
        return new Promise(resolve => {
            new Dialog({
                title: "🔗 Royaume des Chaînes - Choix de la Version",
                content: `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="margin: 0; color: #3f51b5;">🔗 Royaume des Chaînes</h2>
                        <p style="margin: 5px 0; color: #666;">Choisissez la version du sort à lancer</p>
                    </div>

                    <div style="display: flex; gap: 15px; margin: 20px 0;">
                        <!-- Version Simple -->
                        <div style="flex: 1; border: 2px solid #4a4a4a; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #e8eaf6, #fff8e1);">
                            <h3 style="margin-top: 0; color: #3f51b5; text-align: center;">🎯 Version Simple</h3>
                            <div style="font-size: 0.9em; line-height: 1.4;">
                                <p><strong>Cibles :</strong> 1 seule cible</p>
                                <p><strong>Coût :</strong> 3 mana + 3/tour maintenu</p>
                                <p><strong>Effets :</strong></p>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    <li>Cible : -4 Agilité, -2 autres stats</li>
                                    <li>Léo : -3 Agilité (concentration)</li>
                                </ul>
                                <p><strong>Animation :</strong> Royaume complexe + lien</p>
                                <p style="color: #ff9800;"><strong>Maintenance requise</strong></p>
                            </div>
                        </div>

                        <!-- Version Multicible -->
                        <div style="flex: 1; border: 2px solid #4a4a4a; border-radius: 8px; padding: 15px; background: linear-gradient(135deg, #f3e5f5, #fff3e0);">
                            <h3 style="margin-top: 0; color: #9c27b0; text-align: center;">🔗 Version Multicible</h3>
                            <div style="font-size: 0.9em; line-height: 1.4;">
                                <p><strong>Cibles :</strong> 1 à 4 cibles</p>
                                <p><strong>Coût :</strong> 5 mana (pas de maintenance)</p>
                                <p><strong>Malus :</strong> -4 dés d'attaque</p>
                                <p><strong>Effets :</strong></p>
                                <ul style="margin: 5px 0; padding-left: 20px;">
                                    <li>Effet "Chaîne d'Acier" sur chaque cible</li>
                                    <li>Bonus libération +2 pour les cibles</li>
                                </ul>
                                <p><strong>Animation :</strong> Chaînes multiples</p>
                                <p style="color: #4caf50;"><strong>Pas de maintenance</strong></p>
                            </div>
                        </div>
                    </div>
                `,
                buttons: {
                    simple: {
                        icon: '<i class="fas fa-target"></i>',
                        label: "🎯 Version Simple",
                        callback: () => resolve('simple')
                    },
                    multicible: {
                        icon: '<i class="fas fa-sitemap"></i>',
                        label: "🔗 Version Multicible",
                        callback: () => resolve('multicible')
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "❌ Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "simple",
                close: () => resolve(null)
            }, {
                width: 700,
                height: 500,
                resizable: true
            }).render(true);
        });
    }

    const selectedVersion = await selectSpellVersion();
    if (!selectedVersion) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    const SPELL_CONFIG = SPELL_CONFIGS[selectedVersion];

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }
    const currentStance = getCurrentStance(actor);

    // Active effect bonuses
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

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée !`);
            return null;
        }
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // ===== GESTION DU CIBLAGE MULTICIBLE =====
    let targetCount = 1;
    if (SPELL_CONFIG.isMultiTarget) {
        const targetCountResult = await getTargetCount();
        if (!targetCountResult) {
            ui.notifications.info('Sort annulé.');
            return;
        }
        targetCount = targetCountResult.targetCount;
    }

    // ===== TARGET COUNT DIALOG (pour multicible) =====
    async function getTargetCount() {
        const manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
            `<strong>Coût en Mana :</strong> GRATUIT (Position Focus)` :
            `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana`;

        return new Promise(resolve => {
            new Dialog({
                title: `🔗 ${SPELL_CONFIG.name} - Sélection des Cibles`,
                content: `
                    <h3>🔗 ${SPELL_CONFIG.name}</h3>
                    <p><strong>Lanceur:</strong> ${actor.name}</p>
                    <p>${manaInfo}</p>
                    <p><strong>Physique:</strong> ${characteristicInfo.final} <span style="color: #d32f2f;">(-4 dés multicible)</span></p>

                    <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                        <p><strong>📜 Mécaniques multicibles :</strong></p>
                        <ul>
                            <li><strong>Malus d'attaque :</strong> -4 dés (difficulté du multicible)</li>
                            <li><strong>Effet appliqué :</strong> "Chaîne d'Acier" sur chaque cible touchée</li>
                            <li><strong>Bonus de libération :</strong> +2 pour les cibles (plus facile à briser)</li>
                            <li><strong>Animations :</strong> Chaînes persistantes vers chaque cible</li>
                        </ul>
                    </div>

                    <div style="margin: 15px 0;">
                        <label for="targetCount"><strong>Nombre de cibles à enchaîner :</strong></label>
                        <input type="number" id="targetCount" name="targetCount" value="2"
                               min="${SPELL_CONFIG.targetLimits.min}" max="${SPELL_CONFIG.targetLimits.max}"
                               style="width: 80px; margin-left: 10px;">
                        <small>(${SPELL_CONFIG.targetLimits.min}-${SPELL_CONFIG.targetLimits.max} cibles)</small>
                    </div>
                `,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-chain"></i>',
                        label: "Sélectionner les Cibles",
                        callback: (html) => {
                            const targetCount = parseInt(html.find('#targetCount').val()) || 2;
                            const clampedCount = Math.max(SPELL_CONFIG.targetLimits.min,
                                Math.min(SPELL_CONFIG.targetLimits.max, targetCount));
                            resolve({ targetCount: clampedCount });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null)
            }).render(true);
        });
    }

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        let manaInfo, effectsInfo;

        if (SPELL_CONFIG.isMultiTarget) {
            // Version multicible
            manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
                `<strong>Coût en Mana :</strong> GRATUIT (Position Focus)` :
                `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana`;

            effectsInfo = `
                <div style="margin: 15px 0; padding: 10px; background: #f3e5f5; border: 1px solid #e1bee7; border-radius: 5px;">
                    <p><strong>📜 Effets multicibles :</strong></p>
                    <ul>
                        <li><strong>Cibles à enchaîner :</strong> ${targetCount}</li>
                        <li><strong>Effet appliqué :</strong> "Chaîne d'Acier" sur chaque cible</li>
                        <li><strong>Bonus de libération :</strong> +2 pour les cibles</li>
                        <li><strong>Malus d'attaque :</strong> -4 dés (multicible)</li>
                    </ul>
                </div>
            `;
        } else {
            // Version simple
            manaInfo = currentStance === 'focus' && SPELL_CONFIG.isFocusable ?
                `<strong>Coût en Mana :</strong> GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} mana par tour maintenu (non focalisable)` :
                `<strong>Coût en Mana :</strong> ${SPELL_CONFIG.manaCost} mana initial + ${SPELL_CONFIG.maintenanceCost} mana par tour maintenu (non focalisable)`;

            effectsInfo = `
                <div style="margin: 15px 0; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px;">
                    <p><strong>📜 Effets du royaume :</strong></p>
                    <ul>
                        <li><strong>Sur la cible :</strong> -4 Agilité, -2 sur toutes autres caractéristiques</li>
                        <li><strong>Sur Léo :</strong> -3 Agilité (concentration requise)</li>
                        <li><strong>Maintenance :</strong> ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)</li>
                        <li><strong>Jets de libération :</strong> Aucun malus pour la cible</li>
                    </ul>
                </div>
            `;
        }

        const attackPreview = SPELL_CONFIG.isMultiTarget ?
            `${Math.max(1, characteristicInfo.final + SPELL_CONFIG.multiTargetPenalty)}d7 + ${2 * SPELL_CONFIG.spellLevel}` :
            `${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}`;

        return new Promise(resolve => {
            new Dialog({
                title: `🔗 ${SPELL_CONFIG.name} - Configuration`,
                content: `
                    <h3>🔗 ${SPELL_CONFIG.name}</h3>
                    <p><strong>Lanceur:</strong> ${actor.name}</p>
                    <p>${manaInfo}</p>
                    <p><strong>Physique:</strong> ${characteristicInfo.final}${SPELL_CONFIG.isMultiTarget ? ' <span style="color: #d32f2f;">(-4 dés multicible)</span>' : ''}</p>

                    ${effectsInfo}

                    <div style="margin: 15px 0;">
                        <label for="attackBonus">Bonus d'attaque manuel:</label>
                        <input type="number" id="attackBonus" name="attackBonus" value="0" min="-10" max="10">
                    </div>

                    <div style="margin: 10px 0; padding: 8px; background: #e8f5e8; border-radius: 4px;">
                        <div><strong>Jet d'attaque final :</strong> <span id="finalAttack">${attackPreview}</span></div>
                    </div>

                    <script>
                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const penalty = ${SPELL_CONFIG.multiTargetPenalty || 0};
                            const bonus = parseInt(this.value) || 0;
                            const total = Math.max(1, base + penalty + bonus);
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${SPELL_CONFIG.spellLevel * 2}';
                        });
                    </script>
                `,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-chain"></i>',
                        label: SPELL_CONFIG.isMultiTarget ? "🔗 Lancer Multicible" : "🎯 Invoquer le Royaume",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({ attackBonus });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "confirm",
                close: () => resolve(null)
            }).render(true);
        });
    }

    const userConfig = await showConfigDialog();
    if (!userConfig) {
        ui.notifications.info('Sort annulé.');
        return;
    }
    const { attackBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTargets() {
        const targets = [];

        if (SPELL_CONFIG.isMultiTarget) {
            // Multicible: sélectionner plusieurs cibles
            for (let i = 0; i < targetCount; i++) {
                ui.notifications.info(`🎯 Sélectionnez la cible ${i + 1}/${targetCount}`);

                try {
                    const target = await new Portal()
                        .color(SPELL_CONFIG.targeting.color)
                        .texture(SPELL_CONFIG.targeting.texture)
                        .pick();

                    if (!target) {
                        ui.notifications.warn(`Ciblage annulé à la cible ${i + 1}.`);
                        return null;
                    }

                    targets.push(target);
                } catch (e) {
                    console.warn("Portal targeting failed:", e);
                    ui.notifications.error(`Erreur lors du ciblage de la cible ${i + 1}.`);
                    return null;
                }
            }
        } else {
            // Simple: une seule cible
            try {
                const target = await new Portal()
                    .color(SPELL_CONFIG.targeting.color)
                    .texture(SPELL_CONFIG.targeting.texture)
                    .pick();

                if (!target) {
                    return null;
                }

                targets.push(target);
            } catch (e) {
                console.warn("Portal targeting failed:", e);
                return null;
            }
        }

        return targets;
    }

    const targets = await selectTargets();
    if (!targets) {
        ui.notifications.info('Sort annulé.');
        return;
    }

    // Get actor at target location
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: convert target coordinates to grid coordinates
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                // Get token's grid position (top-left corner)
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Check if any grid square occupied by the token matches the target grid square
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        if (tokenSquareX === targetGridX && tokenSquareY === targetGridY) {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        } else {
            // No grid: use circular tolerance detection (original behavior with visibility check)
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const tokenDistance = Math.sqrt(
                    Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2)
                );
                return tokenDistance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            const targetActor = targetToken.actor;
            if (!targetActor) return null;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    }

    // Process all targets
    const targetActors = [];
    for (const target of targets) {
        const targetActor = getActorAtLocation(target.x, target.y);
        if (targetActor) {
            // Check for existing effects based on spell type
            if (SPELL_CONFIG.isMultiTarget) {
                // Multicible: vérifier "Chaîne d'Acier"
                const existingChain = targetActor.actor.effects.find(e => e.name === SPELL_CONFIG.chainEffect.name);
                if (existingChain) {
                    ui.notifications.warn(`${targetActor.name} est déjà enchaîné ! (ignoré)`);
                    continue;
                }
            } else {
                // Simple: vérifier "Royaume des Chaînes"
                const existingChainKingdom = targetActor.actor.effects.find(e =>
                    e.name === SPELL_CONFIG.targetEffects.agility.name ||
                    e.name === SPELL_CONFIG.targetEffects.other.name
                );
                if (existingChainKingdom) {
                    ui.notifications.warn(`${targetActor.name} est déjà affecté par un Royaume des Chaînes !`);
                    return;
                }
            }
            targetActors.push(targetActor);
        } else {
            const message = SPELL_CONFIG.isMultiTarget ?
                `Aucune cible trouvée à une position (ignorée)` :
                `Aucune cible trouvée à la position`;
            ui.notifications.warn(message);
            if (!SPELL_CONFIG.isMultiTarget) return; // Pour simple, arrêter. Pour multicible, continuer.
        }
    }

    if (targetActors.length === 0) {
        ui.notifications.error("Aucune cible valide trouvée !");
        return;
    }

    // Check if caster already maintains a Chain Kingdom (only for simple version)
    if (!SPELL_CONFIG.isMultiTarget) {
        const existingCasterEffect = actor.effects.find(e => e.name === SPELL_CONFIG.casterEffect.name);
        if (existingCasterEffect) {
            ui.notifications.warn("Vous maintenez déjà un Royaume des Chaînes !");
            return;
        }
    }

    // Pour la version simple, on garde la logique avec une seule cible
    const primaryTarget = targetActors[0];
    const targetName = SPELL_CONFIG.isMultiTarget ?
        `${targetActors.length} cible(s)` :
        (primaryTarget ? primaryTarget.name : 'position');

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        const seq = new Sequence();

        // Cast animation sous le lanceur
        if (SPELL_CONFIG.animations.cast) {
            seq
                .effect()
                .file(SPELL_CONFIG.animations.cast)
                .belowTokens()
                .attachTo(caster)
                .tint("#bb2222")
                .scale(1.2);
        }

        if (SPELL_CONFIG.isMultiTarget) {
            // Animations multicibles : chaînes vers chaque cible
            if (SPELL_CONFIG.animations.chain) {
                for (let i = 0; i < targetActors.length; i++) {
                    const targetActor = targetActors[i];
                    seq
                        .effect()
                        .file(SPELL_CONFIG.animations.chain)
                        .attachTo(caster)
                        .stretchTo(targetActor.token, { attachTo: true })
                        .scale(0.2)
                        .delay(1500 + (i * 200)) // Délai progressif pour chaque chaîne
                        .persist()
                        .name(`multi-chain-${caster.id}-${targetActor.token.id}`)
                        .fadeIn(500)
                        .fadeOut(500);
                }
            }
        } else {
            // Animations simples : royaume complexe + connexion
            const targetActor = primaryTarget;

            // Animation de royaume de chaînes persistante
            if (SPELL_CONFIG.animations.chainKingdom && targetActor?.token) {
                seq
                    .effect()
                    .file(SPELL_CONFIG.animations.chainKingdom)
                    .attachTo(targetActor.token)
                    .scale(0.5)
                    .persist()
                    .name(`chain-kingdom-${caster.id}-${targetActor.token.id}`)
                    .fadeIn(1000)
                    .fadeOut(1000);
            }

            // Chaîne de connexion entre Léo et la cible
            if (SPELL_CONFIG.animations.connection && targetActor?.token) {
                seq
                    .effect()
                    .file(SPELL_CONFIG.animations.connection)
                    .stretchTo(targetActor.token, { attachTo: true })
                    .attachTo(caster)
                    .persist()
                    .name(`chain-connection-${caster.id}-${targetActor.token.id}`)
                    .fadeIn(1000)
                    .fadeOut(1000);
            }
        }

        await seq.play();
    }

    await playAnimation();

    // ===== ATTACK RESOLUTION =====
    const baseAttackDice = characteristicInfo.final + (SPELL_CONFIG.multiTargetPenalty || 0) + attackBonus;
    const finalAttackDice = Math.max(1, baseAttackDice); // Au minimum 1 dé
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;

    const attackRoll = new Roll(`${finalAttackDice}d7 + ${levelBonus}`);
    await attackRoll.evaluate({ async: true });

    // ===== ADD ACTIVE EFFECTS =====
    if (SPELL_CONFIG.isMultiTarget) {
        // VERSION MULTICIBLE : Appliquer "Chaîne d'Acier" à chaque cible
        const successfulChains = [];
        const failedChains = [];

        for (const targetActor of targetActors) {
            const effectData = {
                name: SPELL_CONFIG.chainEffect.name,
                icon: SPELL_CONFIG.chainEffect.icon,
                description: SPELL_CONFIG.chainEffect.description,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        chainCaster: caster.id,
                        chainTarget: targetActor.token.id,
                        chainSequenceName: `multi-chain-${caster.id}-${targetActor.token.id}`,
                        spellName: SPELL_CONFIG.name,
                        liberationBonus: SPELL_CONFIG.chainEffect.liberationBonus
                    }
                }
            };

            try {
                // Use GM delegation for effect application
                if (!globalThis.gmSocket) {
                    ui.notifications.error("GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.");
                    failedChains.push(targetActor.name);
                    continue;
                }

                console.log(`[DEBUG] Applying multi-chain effect to ${targetActor.name} via GM socket`);
                const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", targetActor.actor.id, effectData);

                if (result?.success) {
                    console.log(`[DEBUG] Successfully applied multi-chain effect to ${targetActor.name}`);
                    successfulChains.push(targetActor.name);
                } else {
                    console.error(`[DEBUG] Failed to apply multi-chain effect to ${targetActor.name}: ${result?.error}`);
                    failedChains.push(targetActor.name);
                }
            } catch (error) {
                console.error(`Error applying multi-chain effect to ${targetActor.name}:`, error);
                failedChains.push(targetActor.name);
            }
        }

        // Store results for chat message
        window.chainResults = { successfulChains, failedChains };

    } else {
        // VERSION SIMPLE : Appliquer les effets complexes du royaume
        const targetActor = primaryTarget;

        if (targetActor?.actor) {
            // Effet principal sur la cible : Agilité -4
            console.log("[ROYAUME DES CHAINES] Application des effets sur la cible:", targetActor.token);
            const agilityEffectData = {
                name: SPELL_CONFIG.targetEffects.agility.name,
                icon: SPELL_CONFIG.targetEffects.agility.icon,
                description: SPELL_CONFIG.targetEffects.agility.description,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        chainKingdomCaster: caster.id,
                        chainKingdomTarget: targetActor.token.id,
                        chainKingdomSequenceName: `chain-kingdom-${caster.id}-${targetActor.token.id}`,
                        chainConnectionSequenceName: `chain-connection-${caster.id}-${targetActor.token.id}`,
                        spellName: SPELL_CONFIG.name
                    },
                    agilite: { value: -4 },
                    statuscounter: { value: 4 }
                },
                visible: true
            };

            // Effet secondaire sur la cible : Autres stats -2
            const otherEffectData = {
                name: SPELL_CONFIG.targetEffects.other.name,
                icon: SPELL_CONFIG.targetEffects.other.icon,
                description: SPELL_CONFIG.targetEffects.other.description,
                duration: { seconds: 86400 },
                flags: {
                    world: {
                        chainKingdomCaster: caster.id,
                        chainKingdomTarget: targetActor.token.id,
                        spellName: SPELL_CONFIG.name
                    },
                    // Toutes les autres caractéristiques à -2
                    ...Object.fromEntries(
                        SPELL_CONFIG.otherCharacteristics.map(char => [char, { value: -2 }])
                    ),
                    statuscounter: { value: 2 }
                },
                visible: true
            };

            try {
                // Utiliser socketlib pour déléguer au GM si nécessaire
                if (game.modules.get('socketlib')?.active && !game.user.isGM) {
                    // Délégation GM pour les effets sur la cible
                    await game.socket.executeAsGM('createActiveEffect', {
                        actorId: targetActor.actor.id,
                        effectData: agilityEffectData
                    });
                    await game.socket.executeAsGM('createActiveEffect', {
                        actorId: targetActor.actor.id,
                        effectData: otherEffectData
                    });
                } else {
                    // Application directe si on est GM ou si socketlib n'est pas disponible
                    await targetActor.actor.createEmbeddedDocuments('ActiveEffect', [agilityEffectData, otherEffectData]);
                }
            } catch (error) {
                console.error('[ROYAUME DES CHAINES] Erreur lors de la création des effets sur la cible:', error);
                ui.notifications.error("Erreur lors de l'application des effets sur la cible !");
            }
        }

        // Effet sur le lanceur : Agilité -3 (seulement pour version simple)
        const casterEffectData = {
            name: SPELL_CONFIG.casterEffect.name,
            icon: SPELL_CONFIG.casterEffect.icon,
            description: SPELL_CONFIG.casterEffect.description,
            duration: { seconds: 86400 },
            flags: {
                world: {
                    chainKingdomTarget: primaryTarget?.token?.id || 'unknown',
                    spellName: SPELL_CONFIG.name
                },
                agilite: { value: -3 },
                statuscounter: { value: 3 }
            },
            visible: true
        };

        try {
            await actor.createEmbeddedDocuments('ActiveEffect', [casterEffectData]);
        } catch (error) {
            console.error('[ROYAUME DES CHAINES] Erreur lors de la création de l\'effet sur le lanceur:', error);
            ui.notifications.error("Erreur lors de l'application de l'effet sur le lanceur !");
        }
    }

    // ===== CHAT MESSAGE =====
    function createFlavor() {
        let actualMana, effectsDisplay;

        if (SPELL_CONFIG.isMultiTarget) {
            actualMana = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
                'GRATUIT (Position Focus)' : `${SPELL_CONFIG.manaCost} mana`;

            const results = window.chainResults || { successfulChains: [], failedChains: [] };
            effectsDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8eaf6; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #3f51b5; margin-bottom: 6px;"><strong>🔗 ${SPELL_CONFIG.name}</strong></div>
                    <div style="font-size: 1.0em; color: #4a4a4a; font-weight: bold;">Cibles visées: ${targetCount} | Chaînes créées: ${results.successfulChains.length}</div>
                    <div style="font-size: 0.8em; color: #666;">Aucun dégât - Enchaînement magique multicible</div>
                    <div style="font-size: 0.8em; color: #ff9800; margin-top: 4px;">
                        <strong>Effets:</strong><br>
                        • Effet "Chaîne d'Acier" sur les cibles touchées<br>
                        • Bonus de libération: +2 pour les cibles<br>
                        • Attaque: ${characteristicInfo.final} - 4 (multicible) ${attackBonus !== 0 ? (attackBonus > 0 ? '+ ' + attackBonus : '- ' + Math.abs(attackBonus)) : ''} = ${finalAttackDice}d7
                    </div>
                    ${results.successfulChains.length > 0 ? `<div style="font-size: 0.8em; color: #4caf50; margin-top: 2px;">✅ Enchaînés: ${results.successfulChains.join(', ')}</div>` : ''}
                    ${results.failedChains.length > 0 ? `<div style="font-size: 0.8em; color: #f44336; margin-top: 2px;">❌ Échecs: ${results.failedChains.join(', ')}</div>` : ''}
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">Utilisez "Terminer Effets" pour libérer</div>
                </div>
            `;
        } else {
            actualMana = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
                `GRATUIT (Position Focus) + ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)` :
                `${SPELL_CONFIG.manaCost} mana + ${SPELL_CONFIG.maintenanceCost} mana/tour (non focalisable)`;

            effectsDisplay = `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e8eaf6; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #3f51b5; margin-bottom: 6px;"><strong>🔗 Royaume des Chaînes</strong></div>
                    <div style="font-size: 1.2em; color: #4a4a4a; font-weight: bold;">Cible: ${targetName}</div>
                    <div style="font-size: 0.8em; color: #666;">Aucun dégât - Affaiblissement massif</div>
                    <div style="font-size: 0.8em; color: #ff9800; margin-top: 4px;">
                        <strong>Effets:</strong><br>
                        • Cible: -4 Agilité, -2 autres stats<br>
                        • Léo: -3 Agilité (concentration)<br>
                        • Maintenance: ${SPELL_CONFIG.maintenanceCost} mana/tour
                    </div>
                    <div style="font-size: 0.8em; color: #4caf50; margin-top: 2px;">✅ Jets de libération: Aucun malus pour la cible</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">Utilisez "Terminer Effets" pour libérer</div>
                </div>
            `;
        }

        const injuryInfo = characteristicInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${characteristicInfo.base} - ${characteristicInfo.injuries} = ${characteristicInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = characteristicInfo.effectBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>✨ Bonus de Physique: +${characteristicInfo.effectBonus}</div>
            </div>` : '';

        const bonusInfo = attackBonus !== 0 ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                <div>⚡ Bonus Manuel d'Attaque: ${attackBonus > 0 ? '+' : ''}${attackBonus} dés</div>
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackRoll.total}</div>
                ${SPELL_CONFIG.isMultiTarget ? '<div style="font-size: 0.9em; color: #d32f2f; margin-top: 4px;">Malus multicible: -4 dés appliqué</div>' : ''}
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #e8eaf6, #fff8e1); padding: 12px; border-radius: 8px; border: 2px solid #4a4a4a; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #3f51b5;">🔗 ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Maître des Chaînes:</strong> ${actor.name} | <strong>Coût:</strong> ${actualMana}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}
                ${attackDisplay}
                ${effectsDisplay}
            </div>
        `;
    }

    // Send attack roll to chat
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createFlavor(),
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== FINAL NOTIFICATION =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    if (SPELL_CONFIG.isMultiTarget) {
        const results = window.chainResults || { successfulChains: [], failedChains: [] };
        if (results.successfulChains.length > 0) {
            ui.notifications.info(`🔗 ${SPELL_CONFIG.name} lancé !${stanceInfo} ${results.successfulChains.length}/${targetCount} cibles enchaînées. Attaque: ${attackRoll.total}.`);
        } else {
            ui.notifications.warn(`🔗 ${SPELL_CONFIG.name} lancé${stanceInfo} mais aucune chaîne créée ! Attaque: ${attackRoll.total}.`);
        }
        // Clean up
        delete window.chainResults;
    } else {
        ui.notifications.info(`🔗 ${SPELL_CONFIG.name} invoqué !${stanceInfo} Cible: ${targetName}. Attaque: ${attackRoll.total}. Royaume actif ! (${SPELL_CONFIG.maintenanceCost} mana/tour)`);
    }

})();
