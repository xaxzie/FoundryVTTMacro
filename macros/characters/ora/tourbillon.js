/**
 * Tourbillon - Ora's Water Vortex Creation
 *
 * Ora crée un ou plusieurs tourbillons d'eau qui infligent des dégâts aux cibles qui les traversent.
 *
 * - Coût : 4 mana (focalisable — gratuit en Position Focus, mais pas de choix sur protection)
 * - Caractéristique d'attaque : Esprit (+ effets actifs sur 'esprit')
 * - Dégâts de traversée : 2d6 + Esprit + bonus (simple) / 1d6 + Esprit/2 + bonus (divisé)
 * - Cible : 1 position (simple) ou 2 positions (divisé)
 * - Durée : Permanent jusqu'à destruction manuelle
 *
 * Types :
 * - Simple : 1 tourbillon puissant (2d6 + Esprit + bonus)
 * - Divisé : 2 tourbillons faibles (1d6 + Esprit/2 + bonus chacun)
 *
 * Protection : Peut bloquer les attaques traversantes (sauf en Position Focus = toujours actif)
 * Vision : Bloque la ligne de vue (géré manuellement par le MJ)
 * Évasion : La cible peut traverser sans dégâts sur un jet d'Agilité (coûte une action de mouvement)
 *
 * Animations :
 * - Cast : jb2a.cast_generic.water.02.blue.0
 * - Tourbillon : jb2a_patreon.whirlwind.blue (persistant, 2 minutes)
 * - Impact initial : jb2a.impact.water.02.blue.0 + animated-spell-effects-cartoon.water.water splash.01
 *
 * Usage : sélectionner le token d'Ora, lancer la macro et choisir le type puis les positions.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Tourbillon",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        manaCost: 4,
        spellLevel: 1,
        isDirect: false, // Sort indirect - pas de bonus d'effets actifs sur les dégâts
        isFocusable: true,

        vortexTypes: {
            single: {
                name: "Simple",
                description: "1 tourbillon puissant",
                count: 1,
                damageFormula: "2d6",
                statMultiplier: 1.0, // Esprit complet
                damageDisplay: "2d6 + Esprit",
                effectType: "vortex"
            },
            divided: {
                name: "Divisé",
                description: "2 tourbillons faibles",
                count: 2,
                damageFormula: "1d6",
                statMultiplier: 0.5, // Esprit divisé par 2
                damageDisplay: "1d6 + Esprit/2 chacun",
                effectType: "vortex"
            },
            iceDome: {
                name: "Dôme de Glace",
                description: "1 dôme défensif de glace",
                count: 1,
                damageFormula: "3d6", // PV du dôme
                statMultiplier: 1.0, // Esprit complet
                damageDisplay: "3d6 + Esprit PV",
                effectType: "dome"
            }
        },



        animations: {
            cast: "jb2a.cast_generic.water.02.blue.0",
            vortex: "jb2a_patreon.whirlwind.blue",
            iceDome: "jb2a.dome_of_force.blue",
            impact: "jb2a.impact.water.02.blue.0",
            splash: "animated-spell-effects-cartoon.water.water splash.01",
            iceImpact: "jb2a.impact.frost.blue.02",

            // Propriétés d'animation
            vortexDuration: 120000, // 2 minutes (120 secondes)
            domeDuration: 120000, // 2 minutes (120 secondes)
            vortexFadeOut: 3000, // 3 secondes de fade out
            domeFadeOut: 3000, // 3 secondes de fade out
            castDuration: 3000,
            castScale: 0.9,
            impactDelay: 800,
            splashDelay: 1200
        },

        targeting: {
            range: 150, // Portée plus longue pour effet de zone
            color: "#00bfff", // Bleu ciel profond pour vortex d'eau
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        },

        scaling: {
            // Échelle adaptative basée sur la taille du token
            defaultScale: 0.5,
            dividedReduction: 0.7, // Réduction si divisé
            tokenSizeMultiplier: 1.3, // 30% plus grand que le token
            impactReduction: 0.8,
            splashReduction: 0.6
        },

        // Configuration des effets appliqués
        effectConfigs: {
            vortex: {
                name: "Tourbillon",
                icon: "icons/magic/water/vortex-water-whirlpool.webp",
                description: "Pris dans un tourbillon d'eau d'Ora",
                duration: {
                    seconds: 84600 // Permanent jusqu'à suppression manuelle
                },
                flags: {
                    world: {
                        vortexCaster: "CASTER_ID", // Remplacé dynamiquement
                        vortexTarget: "TARGET_ID", // Remplacé dynamiquement
                        vortexIndex: "VORTEX_INDEX", // Remplacé dynamiquement
                        spellName: "Tourbillon",
                        createdAt: "TIMESTAMP" // Remplacé dynamiquement
                    }
                },
                changes: [],
                // Configuration pour endOraEffect
                endEffectConfig: {
                    displayName: "Tourbillon",
                    sectionTitle: "🌊 Tourbillons",
                    sectionIcon: "🌊",
                    cssClass: "vortex-effect",
                    borderColor: "#2196f3",
                    bgColor: "#e3f2fd",
                    mechanicType: "vortex",
                    detectFlags: [
                        { path: "name", matchValue: "Tourbillon" },
                        { path: "flags.world.vortexCaster", matchValue: "CASTER_ID" }
                    ],
                    cleanup: {
                        sequencerPatterns: ["tourbillon_*"] // Pattern pour nettoyer les animations
                    },
                    removeAnimation: {
                        file: "jb2a.water_splash.blue",
                        scale: 0.8,
                        duration: 2000,
                        fadeOut: 1000,
                        tint: "#2196f3"
                    }
                }
            },
            dome: {
                name: "Dôme",
                icon: "icons/magic/defensive/barrier-ice-crystal-wall-jagged-blue.webp",
                description: "Enfermé dans un dôme de glace d'Ora - STATUS_COUNTER_VALUE PV",
                duration: {
                    seconds: 84600 // Permanent jusqu'à suppression manuelle
                },
                flags: {
                    world: {
                        domeCaster: "CASTER_ID", // Remplacé dynamiquement
                        domeTarget: "TARGET_ID", // Remplacé dynamiquement
                        domeIndex: "DOME_INDEX", // Remplacé dynamiquement
                        spellName: "Dôme de Glace",
                        createdAt: "TIMESTAMP" // Remplacé dynamiquement
                    },
                    statuscounter: {
                        value: "DOME_HP" // PV du dôme, remplacé dynamiquement
                    }
                },
                changes: [],
                // Configuration pour endOraEffect
                endEffectConfig: {
                    displayName: "Dôme de Glace",
                    sectionTitle: "🧊 Dômes de Glace",
                    sectionIcon: "🧊",
                    cssClass: "ice-dome-effect",
                    borderColor: "#87ceeb",
                    bgColor: "#f0f8ff",
                    mechanicType: "dome",
                    detectFlags: [
                        { path: "name", matchValue: "Dôme" },
                        { path: "flags.world.domeCaster", matchValue: "CASTER_ID" }
                    ],
                    cleanup: {
                        sequencerPatterns: ["dome_*"] // Pattern pour nettoyer les animations
                    },
                    removeAnimation: {
                        file: "jb2a.impact.frost.blue.02",
                        scale: 1.0,
                        duration: 2500,
                        fadeOut: 1000,
                        tint: "#87ceeb"
                    },
                    getExtraData: (effect) => ({
                        currentHP: effect.flags?.statuscounter?.value || 0,
                        maxHP: effect.flags?.world?.maxHP || 0
                    }),
                    getDynamicDescription: (effect) => {
                        const currentHP = effect.flags?.statuscounter?.value || 0;
                        return `Enfermé dans un dôme de glace d'Ora (${currentHP} PV)`;
                    }
                }
            }
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton d'Ora !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILS (stance, effets) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e => ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase()))?.name?.toLowerCase() || null;
    }
    const currentStance = getCurrentStance(actor);

    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                total += flagValue;
            }
        }
        return total;
    }

    // ===== CHARACTERISTIC CALC =====
    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
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

    // ===== DIALOG DE CONFIGURATION DU SORT =====
    async function showSpellConfigDialog() {
        const manaInfo = currentStance === 'focus'
            ? "<strong>Coût en Mana :</strong> GRATUIT (Position Focus)"
            : "<strong>Coût en Mana :</strong> 4 mana";

        const damageInfo = currentStance === 'offensif'
            ? `Effets : <strong>Maximisés en Position Offensive</strong>`
            : `Effets : <strong>Normaux (lancer de dés)</strong>`;

        return new Promise((resolve) => {
            const vortexTypeOptions = Object.keys(SPELL_CONFIG.vortexTypes).map(key => {
                const vortexType = SPELL_CONFIG.vortexTypes[key];
                const displayInfo = vortexType.effectType === "dome"
                    ? `${vortexType.description} (${vortexType.damageDisplay})`
                    : `${vortexType.description} (${vortexType.damageDisplay} de traversée)`;

                return `<label><input type="radio" name="vortexType" value="${key}" ${key === 'single' ? 'checked' : ''}>
                    <strong>${vortexType.name} :</strong> ${displayInfo}</label>`;
            }).join('<br>');

            new Dialog({
                title: `Sort de ${SPELL_CONFIG.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>Configuration du Sort d'Eau :</h3>
                    <p>${manaInfo}</p>
                    <p><strong>Caractéristique ${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                        <h4>Type d'Effet d'Eau</h4>
                        ${vortexTypeOptions}
                    </div>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                        <h4>Bonus Manuels</h4>
                        <div style="margin: 5px 0;">
                            <label>Bonus de dégâts :
                                <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Objets, effets temporaires, etc.</small>
                        </div>
                        <div style="margin: 5px 0;">
                            <label>Bonus de résolution d'attaque :
                                <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                        </div>
                    </div>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f0f8ff;">
                        <h4>Échelle d'Animation</h4>
                        <div style="margin: 5px 0;">
                            <label>Échelle par défaut des tourbillons :
                                <input type="number" id="defaultScale" value="0.5" min="0.1" max="20.0" step="0.1" style="width: 60px;">
                            </label>
                            <small style="display: block; margin-left: 20px;">Taille de base des tourbillons (0.1 à 20.0)</small>
                        </div>
                    </div>

                    <p>${damageInfo}</p>
                    <p><strong>Jet d'attaque :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}</span></p>

                    <div id="effectNotes" style="margin: 10px 0; padding: 8px; background: #fff3e0; border-radius: 4px; border-left: 4px solid #ff6f00;">
                        <div style="font-size: 0.9em; color: #e65100;">
                            <strong>⚠️ Note :</strong> <span id="noteText">Dégâts appliqués lors de la traversée. Ora peut choisir de bloquer les attaques traversantes.</span>
                        </div>
                    </div>

                    <script>
                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const bonus = parseInt(this.value) || 0;
                            const total = base + bonus;
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${2 * SPELL_CONFIG.spellLevel}';
                        });

                        // Mettre à jour les notes selon le type sélectionné
                        function updateEffectNotes() {
                            const selectedType = document.querySelector('input[name="vortexType"]:checked').value;
                            const noteElement = document.getElementById('noteText');

                            if (selectedType === 'iceDome') {
                                noteElement.textContent = "Le dôme possède des PV et doit être brisé pour être traversé. Ne peut pas être traversé sans destruction.";
                            } else {
                                noteElement.textContent = "Dégâts appliqués lors de la traversée. Ora peut choisir de bloquer les attaques traversantes.";
                            }
                        }

                        // Mettre à jour au changement de sélection
                        document.querySelectorAll('input[name="vortexType"]').forEach(radio => {
                            radio.addEventListener('change', updateEffectNotes);
                        });

                        // Initialiser
                        updateEffectNotes();
                    </script>
                `,
                buttons: {
                    confirm: {
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const vortexType = html.find('input[name="vortexType"]:checked').val();
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const defaultScale = parseFloat(html.find('#defaultScale').val()) || 0.5;
                            resolve({ vortexType, damageBonus, attackBonus, defaultScale });
                        }
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                }
            }).render(true);
        });
    }

    const spellConfig = await showSpellConfigDialog();
    if (!spellConfig) return;
    const { vortexType, damageBonus, attackBonus, defaultScale } = spellConfig;
    const vortexTypeConfig = SPELL_CONFIG.vortexTypes[vortexType];

    // ===== TARGETING via Portal =====
    async function selectTargets() {
        let targets = [];

        try {
            for (let i = 0; i < vortexTypeConfig.count; i++) {
                const targetPrompt = vortexTypeConfig.count > 1 ? `Tourbillon ${i + 1}` : "Cible du tourbillon";

                const portal = new Portal()
                    .origin(caster)
                    .range(SPELL_CONFIG.targeting.range)
                    .color(SPELL_CONFIG.targeting.color)
                    .texture(SPELL_CONFIG.targeting.texture);

                const target = await portal.pick();
                if (!target) return null;

                targets.push({ x: target.x, y: target.y });
            }

            return targets;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const targets = await selectTargets();
    if (!targets) return;

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
            // No grid: use circular tolerance detection (original behavior)
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

    const targetActors = targets.map(target => getActorAtLocation(target.x, target.y));

    // ===== FONCTIONS GÉNÉRIQUES D'APPLICATION D'EFFETS =====
    /**
     * Fonction générique pour appliquer un effet configuré sur un token/acteur
     */
    async function applyGenericEffect(targetInfo, effectConfig, replacements = {}) {
        if (!targetInfo || !targetInfo.token || !effectConfig) return false;

        try {
            // Construire les données d'effet à partir de la configuration
            const effectData = {
                name: effectConfig.name,
                icon: effectConfig.icon,
                duration: { ...effectConfig.duration },
                flags: { ...effectConfig.flags },
                changes: [...effectConfig.changes]
            };

            // Appliquer les remplacements dynamiques dans les flags
            if (effectData.flags.world) {
                for (const [key, value] of Object.entries(effectData.flags.world)) {
                    if (typeof value === 'string' && replacements[value]) {
                        effectData.flags.world[key] = replacements[value];
                    }
                }
            }

            // Délégation GM si nécessaire
            if (targetInfo.token.actor.isOwner) {
                await targetInfo.token.actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            } else {
                if (!globalThis.gmSocket) {
                    console.error("GM Socket non disponible pour appliquer l'effet !");
                    return false;
                }
                const result = await globalThis.gmSocket.executeAsGM("createActiveEffectOnActor", targetInfo.token.actor.id, effectData);
                if (!result.success) {
                    console.error(`Failed to create effect: ${result.error}`);
                    return false;
                }
            }

            console.log(`[Ora] Applied ${effectData.name} to ${targetInfo.token.name}`);
            return true;
        } catch (error) {
            console.error(`[Ora] Error applying effect to ${targetInfo.token.name}:`, error);
            return false;
        }
    }

    // ===== APPLICATION DES EFFETS =====
    async function applyEffect(targetInfo, effectIndex, effectType, hpValue = null) {
        if (!targetInfo || !targetInfo.token) return;

        // Sélectionner la bonne configuration d'effet
        const effectConfig = SPELL_CONFIG.effectConfigs[effectType];
        if (!effectConfig) {
            console.error(`Unknown effect type: ${effectType}`);
            return;
        }

        // Définir les remplacements dynamiques pour la configuration
        const replacements = {
            "CASTER_ID": caster.id,
            "TARGET_ID": targetInfo.token.id,
            "VORTEX_INDEX": effectIndex,
            "DOME_INDEX": effectIndex,
            "TIMESTAMP": Date.now()
        };

        // Pour les dômes, ajouter les PV
        if (effectType === "dome" && hpValue !== null) {
            replacements["DOME_HP"] = hpValue;
            // Aussi ajouter maxHP aux flags du monde pour référence
            const modifiedConfig = JSON.parse(JSON.stringify(effectConfig));
            modifiedConfig.flags.world.maxHP = hpValue;
            modifiedConfig.description = modifiedConfig.description.replace("STATUS_COUNTER_VALUE", hpValue);

            const success = await applyGenericEffect(targetInfo, modifiedConfig, replacements);
            if (!success) {
                ui.notifications.error(`Impossible d'appliquer l'effet de dôme sur ${targetInfo.token.name}`);
            }
        } else {
            // Utiliser la fonction générique avec la configuration centralisée
            const success = await applyGenericEffect(targetInfo, effectConfig, replacements);
            if (!success) {
                const effectName = effectType === "dome" ? "dôme" : "tourbillon";
                ui.notifications.error(`Impossible d'appliquer l'effet de ${effectName} sur ${targetInfo.token.name}`);
            }
        }
    }

    // Calculer les valeurs pour les effets (PV des dômes ou dégâts des tourbillons)
    async function calculateEffectValues() {
        const values = [];
        const effectType = vortexTypeConfig.effectType;

        if (effectType === "dome") {
            // Calculer les PV du dôme
            const statBonus = Math.floor(characteristicInfo.final * vortexTypeConfig.statMultiplier);

            if (currentStance === 'offensif') {
                // PV maximisés en position offensive
                const maxBaseDamage = 18; // 3d6 max = 18
                const maxHP = maxBaseDamage + statBonus;
                values.push(maxHP);
            } else {
                // Lancer les dés normalement pour les PV
                const roll = new Roll(`${vortexTypeConfig.damageFormula} + @statBonus`, { statBonus: statBonus });
                await roll.evaluate({ async: true });
                values.push(roll.total);
            }
        }

        return values;
    }

    const effectValues = await calculateEffectValues();

    // Appliquer les effets sur les cibles
    for (let i = 0; i < targetActors.length; i++) {
        if (targetActors[i]) {
            const hpValue = vortexTypeConfig.effectType === "dome" ? effectValues[0] : null;
            await applyEffect(targetActors[i], i, vortexTypeConfig.effectType, hpValue);
        }
    }

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const damages = [];
        // Note: Sorts indirects ne bénéficient PAS des bonus d'effets actifs sur les dégâts
        const statBonus = Math.floor((characteristicInfo.final * vortexTypeConfig.statMultiplier) + damageBonus);

        if (vortexTypeConfig.effectType === "dome") {
            // Pour les dômes, on affiche les PV au lieu des dégâts
            return effectValues.map(hp => ({
                total: hp,
                formula: `${vortexTypeConfig.damageFormula} + ${characteristicInfo.final}`,
                result: `${hp} PV`,
                isHP: true
            }));
        }

        if (currentStance === 'offensif') {
            // Dégâts maximisés en position offensive
            const maxBaseDamage = vortexTypeConfig.damageFormula === "2d6" ? 12 : 6;
            const maxDamage = maxBaseDamage + statBonus;

            for (let i = 0; i < vortexTypeConfig.count; i++) {
                damages.push({
                    total: maxDamage,
                    formula: `${maxBaseDamage} + ${statBonus}`,
                    result: `${maxBaseDamage} + ${statBonus}`,
                    isMaximized: true
                });
            }
        } else {
            // Lancer les dés normalement
            for (let i = 0; i < vortexTypeConfig.count; i++) {
                const roll = new Roll(`${vortexTypeConfig.damageFormula} + @statBonus`, { statBonus: statBonus });
                await roll.evaluate({ async: true });
                damages.push(roll);
            }
        }

        return damages;
    }

    const damages = await calculateDamage();

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        let sequence = new Sequence();

        // Effet de lancement sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .atLocation(caster)
            .scale(SPELL_CONFIG.animations.castScale)
            .duration(SPELL_CONFIG.animations.castDuration);

        // Créer les effets pour chaque cible
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];

            // Détecter le token à la position cible pour l'échelle adaptative (utilise la même logique que getActorAtLocation)
            const targetTokenInfo = getActorAtLocation(target.x, target.y);
            const targetToken = targetTokenInfo ? targetTokenInfo.token : null;

            // Calculer l'échelle adaptative
            let effectScale;
            if (targetToken) {
                const tokenSize = Math.max(targetToken.document.width, targetToken.document.height) * 0.5;
                effectScale = (tokenSize * SPELL_CONFIG.scaling.tokenSizeMultiplier) *
                    (vortexType === 'divided' ? SPELL_CONFIG.scaling.dividedReduction : 1.0);
            } else {
                effectScale = defaultScale *
                    (vortexType === 'divided' ? SPELL_CONFIG.scaling.dividedReduction : 1.0);
            }

            if (vortexTypeConfig.effectType === "dome") {
                // Animation du dôme de glace
                let domeEffect = sequence.effect()
                    .file(SPELL_CONFIG.animations.iceDome)
                    .scale(effectScale * 1.2) // Dômes légèrement plus grands
                    .belowTokens() // Place l'effet sous les tokens
                    .duration(SPELL_CONFIG.animations.domeDuration)
                    .fadeOut(SPELL_CONFIG.animations.domeFadeOut)
                    .persist() // Rend persistant jusqu'à suppression manuelle
                    .name(`dome_${i + 1}_${Date.now()}`) // Identifiant unique pour destruction
                    .delay(SPELL_CONFIG.animations.impactDelay);

                // Attacher au token s'il existe, sinon position fixe
                if (targetToken) {
                    domeEffect.attachTo(targetToken);
                } else {
                    domeEffect.atLocation(target);
                }

                // Effet d'impact de glace
                let iceImpactEffect = sequence.effect()
                    .file(SPELL_CONFIG.animations.iceImpact)
                    .scale(effectScale * SPELL_CONFIG.scaling.impactReduction)
                    .belowTokens()
                    .delay(SPELL_CONFIG.animations.impactDelay);

                if (targetToken) {
                    iceImpactEffect.attachTo(targetToken);
                } else {
                    iceImpactEffect.atLocation(target);
                }

            } else {
                // Animation du tourbillon classique
                let vortexEffect = sequence.effect()
                    .file(SPELL_CONFIG.animations.vortex)
                    .scale(effectScale)
                    .belowTokens() // Place l'effet sous les tokens
                    .duration(SPELL_CONFIG.animations.vortexDuration)
                    .fadeOut(SPELL_CONFIG.animations.vortexFadeOut)
                    .persist() // Rend persistant jusqu'à suppression manuelle
                    .name(`tourbillon_${i + 1}_${Date.now()}`) // Identifiant unique pour destruction
                    .delay(SPELL_CONFIG.animations.impactDelay);

                // Attacher au token s'il existe, sinon position fixe
                if (targetToken) {
                    vortexEffect.attachTo(targetToken);
                } else {
                    vortexEffect.atLocation(target);
                }

                // Effet d'impact initial
                let impactEffect = sequence.effect()
                    .file(SPELL_CONFIG.animations.impact)
                    .scale(effectScale * SPELL_CONFIG.scaling.impactReduction)
                    .belowTokens()
                    .delay(SPELL_CONFIG.animations.impactDelay);

                if (targetToken) {
                    impactEffect.attachTo(targetToken);
                } else {
                    impactEffect.atLocation(target);
                }

                // Effet d'éclaboussure d'eau
                let splashEffect = sequence.effect()
                    .file(SPELL_CONFIG.animations.splash)
                    .scale(effectScale * SPELL_CONFIG.scaling.splashReduction)
                    .belowTokens()
                    .delay(SPELL_CONFIG.animations.splashDelay);

                if (targetToken) {
                    splashEffect.attachTo(targetToken);
                } else {
                    splashEffect.atLocation(target);
                }
            }
        }

        await sequence.play();
    }

    await playAnimation();

    // ===== ATTACK + DAMAGE RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;
    let combinedParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    if (currentStance !== 'offensif' && vortexTypeConfig.effectType !== "dome") {
        // Ajouter les dés de dégâts si pas maximisé et si ce n'est pas un dôme
        const statBonus = Math.floor((characteristicInfo.final * vortexTypeConfig.statMultiplier) + damageBonus);

        for (let i = 0; i < vortexTypeConfig.count; i++) {
            combinedParts.push(`${vortexTypeConfig.damageFormula} + ${statBonus}`);
        }
    }

    const combinedRoll = new Roll(`{${combinedParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    const attackResult = combinedRoll.terms[0].results[0];

    // ===== CHAT MESSAGE =====
    const targetText = vortexTypeConfig.count > 1
        ? targetActors.map((actor, i) => actor?.name || `position ${i + 1}`).join(' et ')
        : targetActors[0]?.name || "position";

    const totalValue = damages.reduce((sum, dmg) => sum + dmg.total, 0);
    const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
    const isDome = vortexTypeConfig.effectType === "dome";

    const actualManaCost = currentStance === 'focus'
        ? 'GRATUIT (Position Focus)'
        : `${SPELL_CONFIG.manaCost} mana`;

    function createFlavor() {
        const effectIcon = isDome ? "🧊" : "🌊";
        const borderColor = isDome ? "#87ceeb" : "#2196f3";
        const bgGradient = isDome ? "linear-gradient(135deg, #f0f8ff, #e3f2fd)" : "linear-gradient(135deg, #e3f2fd, #f3e5f5)";

        const valueText = isDome
            ? `💎 POINTS DE VIE DU DÔME: ${totalValue}`
            : `💥 DÉGÂTS DE TRAVERSÉE: ${totalValue}`;

        const noteText = isDome
            ? "Le dôme possède des PV et doit être brisé pour être traversé. Ne peut pas être traversé sans destruction."
            : "Dégâts appliqués lors de la traversée. Ora peut choisir de bloquer les attaques traversantes.";

        return `
            <div style="background: ${bgGradient}; padding: 12px; border-radius: 8px; border: 2px solid ${borderColor}; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1976d2;">${effectIcon} Sort de ${SPELL_CONFIG.name} - ${vortexTypeConfig.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                    </div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e7f3ff; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #0066cc; margin-bottom: 6px;"><strong>${effectIcon} ${vortexTypeConfig.name}${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible(s):</strong> ${targetText}</div>
                    <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">${valueText}</div>
                    ${vortexTypeConfig.count > 1 ? `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${damages.map(d => d.total).join(' + ')})</div>` : ''}
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>⚠️ Notes:</strong> ${noteText}</div>
                </div>
            </div>
        `;
    }

    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const effectInfo = isDome
        ? (vortexTypeConfig.count > 1 ? `${vortexTypeConfig.count} dômes créés` : `Dôme de glace créé`)
        : (vortexTypeConfig.count > 1 ? `${vortexTypeConfig.count} tourbillons créés` : `Tourbillon puissant créé`);
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

    ui.notifications.info(`Sort de ${SPELL_CONFIG.name} lancé !${stanceInfo} ${effectInfo}${maximizedInfo}. Jet d'attaque : ${attackResult.result}.`);

})();
