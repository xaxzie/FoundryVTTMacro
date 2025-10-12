/**
 * Bubbles - Ora's Elemental Projectiles
 *
 * Ora lance des projectiles élémentaires qui peuvent être de l'eau, de la glace, de l'huile ou de l'eau vivante.
 *
 * - Coût : 4 mana (focalisable — gratuit en Position Focus, sauf Eau Vivante: 2 mana)
 * - Caractéristique d'attaque : Esprit (+ effets actifs sur 'esprit')
 * - Dégâts : 1d6 + (Esprit + bonus)/2 par projectile + bonus de dégâts provenant des Active Effects
 * - Soin : 1d6 + (Esprit + bonus)/2 (Eau Vivante uniquement)
 * - Cible : 1 cible (2 projectiles) ou 2 cibles (1 chacun) ; Eau Vivante = 1 cible seulement
 *
 * Éléments :
 * - Eau : +2 dégâts électriques futurs (2 projectiles)
 * - Glace : Vitesse -1 case (2 projectiles)
 * - Huile : +2 dégâts de feu futurs (2 projectiles)
 * - Eau Vivante : Soigne la cible (1 projectile, peut se cibler soi-même, NON focalisable)
 *
 * Animations :
 * - Cast : jb2a.cast_generic.water.02.blue.0
 * - Projectiles : jb2a.bullet.03.blue
 * - Impact : jb2a.explosion.04.blue / jb2a.explosion.02.blue / jb2a.healing_generic.burst.greenorange
 * - Sons : aucun
 *
 * Usage : sélectionner le token d'Ora, lancer la macro et choisir l'élément puis les cibles.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Bulles",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        manaCost: 4,
        spellLevel: 1,
        damageFormula: "1d6",
        isDirect: true,
        isFocusable: true,

        elements: {
            water: {
                name: "Eau",
                description: "Augmente les futurs dégâts électriques (+2 prochaine attaque électrique)",
                projectileCount: 2,
                manaCost: 4,
                isFocusable: true,
                effectFile: "jb2a.bullet.03.blue",
                explosionFile: "jb2a.explosion.04.blue",
                effectColor: "blue",
                tint: null,
                targeting: {
                    color: "#0080ff",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
                }
            },
            ice: {
                name: "Glace",
                description: "Diminue la vitesse de la cible de 1 case",
                projectileCount: 2,
                manaCost: 4,
                isFocusable: true,
                effectFile: "jb2a.bullet.03.blue",
                explosionFile: "jb2a.explosion.02.blue",
                effectColor: "blue",
                tint: null,
                targeting: {
                    color: "#87ceeb",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
                }
            },
            oil: {
                name: "Huile",
                description: "Augmente les futurs dégâts de feu (+2 prochaine attaque de feu)",
                projectileCount: 2,
                manaCost: 4,
                isFocusable: true,
                effectFile: "jb2a.bullet.03.blue",
                explosionFile: "jb2a.explosion.04.blue",
                effectColor: "orange",
                tint: "#FF8C00",
                targeting: {
                    color: "#ff8c00",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
                }
            },
            living_water: {
                name: "Eau Vivante",
                description: "Soigne la cible (peut se cibler soi-même, NON focalisable)",
                projectileCount: 1,
                manaCost: 4,
                isFocusable: false,
                effectFile: "jb2a.healing_generic.burst.greenorange",
                explosionFile: null,
                effectColor: "green",
                tint: null,
                targeting: {
                    color: "#00ff00",
                    texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Green_400x400.webm"
                }
            }
        },

        animations: {
            cast: "jb2a.cast_generic.water.02.blue.0",
            sound: null
        },

        targeting: {
            range: 120,
            selfTargetTolerance: 50 // Distance pour se cibler soi-même
        },

        // Configuration des effets de statut générés par les éléments
        statusEffects: {
            ice: {
                name: "Ora Ralentissement",
                icon: "icons/magic/water/ice-snowflake.webp",
                description: "Ralenti par la glace d'Ora",
                duration: {
                    rounds: null, // Permanent jusqu'à suppression manuelle
                    seconds: null,
                    startRound: null,
                    startTime: null
                },
                flags: {
                    world: {
                        oraCaster: "CASTER_ID", // Remplacé dynamiquement
                        spellName: "SPELL_NAME", // Remplacé dynamiquement
                        effectType: "slowdown",
                        appliedAt: "TIMESTAMP" // Remplacé dynamiquement
                    },
                    statuscounter: {
                        value: 1, // -1 case de vitesse
                        max: 10,
                        min: 0
                    }
                },
                changes: [],
                tint: "#87ceeb",
                // Configuration pour endOraEffect
                endEffectConfig: {
                    displayName: "Ora Ralentissement",
                    sectionTitle: "❄️ Ralentissement",
                    sectionIcon: "❄️",
                    cssClass: "ice-slowdown-effect",
                    borderColor: "#87ceeb",
                    bgColor: "#f0f8ff",
                    mechanicType: "slowdown",
                    detectFlags: [
                        { path: "name", matchValue: "Ora Ralentissement" },
                        { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
                    ],
                    getExtraData: (effect) => ({
                        slowdownAmount: effect.flags?.statuscounter?.value || 1,
                        sourceSpell: effect.flags?.world?.spellName || "Bulles de glace"
                    }),
                    getDynamicDescription: (effect) => {
                        const slowdown = effect.flags?.statuscounter?.value || 1;
                        const sourceSpell = effect.flags?.world?.spellName || "Bulles de glace";
                        return `Ralenti par ${sourceSpell} d'Ora (-${slowdown} case de vitesse)`;
                    },
                    removeAnimation: {
                        file: "jb2a.ice_shards.burst.blue",
                        scale: 0.6,
                        duration: 1500,
                        fadeOut: 500,
                        tint: "#87ceeb"
                    }
                }
            },
            water: {
                name: "Ora Faiblesse Électrique",
                icon: "icons/magic/lightning/bolt-strike-blue.webp",
                description: "Vulnérable aux dégâts électriques (+2 prochaine attaque électrique)",
                duration: {
                    rounds: null, // Permanent jusqu'à suppression ou utilisation
                    seconds: null,
                    startRound: null,
                    startTime: null
                },
                flags: {
                    world: {
                        oraCaster: "CASTER_ID", // Remplacé dynamiquement
                        spellName: "SPELL_NAME", // Remplacé dynamiquement
                        effectType: "weakness",
                        appliedAt: "TIMESTAMP", // Remplacé dynamiquement
                        damageType: "electric"
                    },
                    statuscounter: {
                        value: 2, // +2 dégâts électriques
                        max: 10,
                        min: 0
                    }
                },
                changes: [],
                tint: "#0080ff",
                // Configuration pour endOraEffect
                endEffectConfig: {
                    displayName: "Ora Faiblesse Électrique",
                    sectionTitle: "⚡ Faiblesse Électrique",
                    sectionIcon: "⚡",
                    cssClass: "electric-weakness-effect",
                    borderColor: "#0080ff",
                    bgColor: "#e3f2fd",
                    mechanicType: "weakness",
                    detectFlags: [
                        { path: "name", matchValue: "Ora Faiblesse Électrique" },
                        { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
                    ],
                    getExtraData: (effect) => ({
                        bonusDamage: effect.flags?.statuscounter?.value || 2,
                        sourceSpell: effect.flags?.world?.spellName || "Bulles d'eau"
                    }),
                    getDynamicDescription: (effect) => {
                        const bonus = effect.flags?.statuscounter?.value || 2;
                        const sourceSpell = effect.flags?.world?.spellName || "Bulles d'eau";
                        return `Vulnérable aux dégâts électriques par ${sourceSpell} d'Ora (+${bonus} prochaine attaque électrique)`;
                    },
                    removeAnimation: {
                        file: "jb2a.electric_ball.blue",
                        scale: 0.5,
                        duration: 1200,
                        fadeOut: 400,
                        tint: "#0080ff"
                    }
                }
            },
            oil: {
                name: "Ora Faiblesse Feu",
                icon: "icons/magic/fire/flame-burning-creature-orange.webp",
                description: "Vulnérable aux dégâts de feu (+2 prochaine attaque de feu)",
                duration: {
                    rounds: null, // Permanent jusqu'à suppression ou utilisation
                    seconds: null,
                    startRound: null,
                    startTime: null
                },
                flags: {
                    world: {
                        oraCaster: "CASTER_ID", // Remplacé dynamiquement
                        spellName: "SPELL_NAME", // Remplacé dynamiquement
                        effectType: "weakness",
                        appliedAt: "TIMESTAMP", // Remplacé dynamiquement
                        damageType: "fire"
                    },
                    statuscounter: {
                        value: 2, // +2 dégâts de feu
                        max: 10,
                        min: 0
                    }
                },
                changes: [],
                tint: "#ff8c00",
                // Configuration pour endOraEffect
                endEffectConfig: {
                    displayName: "Ora Faiblesse Feu",
                    sectionTitle: "🔥 Faiblesse Feu",
                    sectionIcon: "🔥",
                    cssClass: "fire-weakness-effect",
                    borderColor: "#ff8c00",
                    bgColor: "#fff3e0",
                    mechanicType: "weakness",
                    detectFlags: [
                        { path: "name", matchValue: "Ora Faiblesse Feu" },
                        { path: "flags.world.oraCaster", matchValue: "CASTER_ID" }
                    ],
                    getExtraData: (effect) => ({
                        bonusDamage: effect.flags?.statuscounter?.value || 2,
                        sourceSpell: effect.flags?.world?.spellName || "Bulles d'huile"
                    }),
                    getDynamicDescription: (effect) => {
                        const bonus = effect.flags?.statuscounter?.value || 2;
                        const sourceSpell = effect.flags?.world?.spellName || "Bulles d'huile";
                        return `Vulnérable aux dégâts de feu par ${sourceSpell} d'Ora (+${bonus} prochaine attaque de feu)`;
                    },
                    removeAnimation: {
                        file: "jb2a.fire_bolt.orange",
                        scale: 0.4,
                        duration: 1000,
                        fadeOut: 300,
                        tint: "#ff8c00"
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

    // ===== DIALOG UNIFIÉ DE CONFIGURATION =====
    async function showSpellConfigDialog() {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');

        return new Promise((resolve) => {
            const elementOptions = Object.keys(SPELL_CONFIG.elements).map(key => {
                const element = SPELL_CONFIG.elements[key];
                return `<label><input type="radio" name="element" value="${key}" ${key === 'water' ? 'checked' : ''} onchange="updateElementInfo()">
                    <strong>${element.name}</strong> - ${element.description} (${element.projectileCount} projectile${element.projectileCount > 1 ? 's' : ''})</label>`;
            }).join('<br>');

            new Dialog({
                title: `Sort de ${SPELL_CONFIG.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <div style="padding: 5px;">
                        <h3>Configuration du Sort :</h3>

                        <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f0f8ff;">
                            <h4>Élément</h4>
                            ${elementOptions}
                        </div>

                        <div id="targeting-options" style="margin: 10px 0; padding: 10px; border: 1px solid #ccc; background: #f9f9f9; border-radius: 5px;">
                            <h4>Options de Ciblage :</h4>
                            <div id="targeting-choices">
                                <label><input type="radio" name="targeting" value="single" checked>
                                    <strong>Cible unique</strong> - Tous les projectiles sur la même cible</label><br>
                                <label><input type="radio" name="targeting" value="multiple">
                                    <strong>Cibles multiples</strong> - Un projectile par cible différente</label>
                            </div>
                        </div>

                        <div style="margin: 10px 0; border: 1px solid #ddd; padding: 8px; background: #f8f9fa;">
                            <h4>Statistiques</h4>
                            <div style="font-size: 0.9em;">
                                <p><strong>Position :</strong> ${currentStance ? currentStance.charAt(0).toUpperCase() + currentStance.slice(1) : 'Aucune'}</p>
                                <p><strong>${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>
                                <p id="mana-cost"><strong>Coût :</strong> <span id="mana-display">4 mana</span></p>
                                <p id="damage-info"><strong>Dégâts :</strong> <span id="damage-display">${SPELL_CONFIG.damageFormula} + (Esprit + bonus)/2</span></p>
                                <p><strong>Attaque de base :</strong> ${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}</p>
                            </div>
                        </div>

                        <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                            <h4>Bonus Manuels</h4>
                            <div style="margin: 5px 0;">
                                <label><span id="damage-label">Bonus de dégâts</span> :
                                    <input type="number" id="damageBonus" value="0" min="0" style="width: 60px;">
                                </label>
                                <small style="display: block; margin-left: 20px;">Objets, effets temporaires, etc.</small>
                            </div>
                            <div style="margin: 5px 0;" id="attack-bonus-div">
                                <label>Bonus de résolution d'attaque :
                                    <input type="number" id="attackBonus" value="0" min="0" style="width: 60px;">
                                </label>
                                <small style="display: block; margin-left: 20px;">Dés d7 supplémentaires pour l'attaque</small>
                            </div>
                        </div>

                        <p id="final-attack"><strong>Jet d'attaque final :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}</span></p>
                    </div>

                    <script>
                        function updateElementInfo() {
                            const selectedElement = document.querySelector('input[name="element"]:checked').value;
                            const isLivingWater = selectedElement === 'living_water';
                            const targetingDiv = document.getElementById('targeting-choices');
                            const manaCostSpan = document.getElementById('mana-display');
                            const damageDisplay = document.getElementById('damage-display');
                            const damageLabel = document.getElementById('damage-label');
                            const attackBonusDiv = document.getElementById('attack-bonus-div');
                            const finalAttackP = document.getElementById('final-attack');

                            // Mise à jour du ciblage
                            if (isLivingWater) {
                                targetingDiv.innerHTML = '<p><em>Eau Vivante cible automatiquement une seule cible.</em></p>';
                            } else {
                                targetingDiv.innerHTML = \`
                                    <label><input type="radio" name="targeting" value="single" checked>
                                        <strong>Cible unique</strong> - Tous les projectiles sur la même cible</label><br>
                                    <label><input type="radio" name="targeting" value="multiple">
                                        <strong>Cibles multiples</strong> - Un projectile par cible différente</label>
                                \`;
                            }

                            // Mise à jour du coût
                            if (isLivingWater) {
                                manaCostSpan.textContent = '${currentStance === 'focus' ? '2 mana (Position Focus - coût réduit)' : '4 mana'}';
                            } else {
                                manaCostSpan.textContent = '${currentStance === 'focus' ? 'GRATUIT (Position Focus)' : '4 mana'}';
                            }

                            // Mise à jour des dégâts/soin
                            if (isLivingWater) {
                                damageDisplay.textContent = '1d6 + (Esprit + bonus)/2 (Soin)';
                                damageLabel.textContent = 'Bonus de soin';
                                attackBonusDiv.style.display = 'none';
                                finalAttackP.style.display = 'none';
                            } else {
                                const stanceNote = '${currentStance === 'offensif' ? ' (MAXIMISÉ en Position Offensive)' : ''}';
                                damageDisplay.textContent = '1d6 + (Esprit + bonus)/2' + stanceNote;
                                damageLabel.textContent = 'Bonus de dégâts';
                                attackBonusDiv.style.display = 'block';
                                finalAttackP.style.display = 'block';
                            }
                        }

                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const bonus = parseInt(this.value) || 0;
                            const total = base + bonus;
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${2 * SPELL_CONFIG.spellLevel}';
                        });

                        // Initialisation
                        updateElementInfo();
                    </script>
                `,
                buttons: {
                    confirm: {
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const element = html.find('input[name="element"]:checked').val();
                            const targeting = html.find('input[name="targeting"]:checked').val() || 'single';
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({ element, targeting, damageBonus, attackBonus });
                        }
                    },
                    cancel: {
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                }
            }, { width: 500 }).render(true);
        });
    }

    const spellConfig = await showSpellConfigDialog();
    if (!spellConfig) return;

    const { element: selectedElement, targeting: targetingMode, damageBonus, attackBonus } = spellConfig;
    const elementConfig = SPELL_CONFIG.elements[selectedElement];
    const isLivingWater = selectedElement === 'living_water';

    // ===== TARGETING via Portal =====
    async function selectTargets() {
        let targets = [];

        try {
            // Premier ciblage
            const portal1 = new Portal()
                .origin(caster)
                .range(SPELL_CONFIG.targeting.range)
                .color(elementConfig.targeting.color)
                .texture(elementConfig.targeting.texture);

            const target1 = await portal1.pick();
            if (!target1) return null;

            targets.push({ x: target1.x, y: target1.y });

            // Vérifier si on se cible soi-même pour Eau Vivante
            let allowSelfTarget = false;
            if (isLivingWater) {
                const distance = Math.sqrt(Math.pow(target1.x - caster.x, 2) + Math.pow(target1.y - caster.y, 2));
                if (distance <= SPELL_CONFIG.targeting.selfTargetTolerance) {
                    allowSelfTarget = true;
                }
            }

            // Deuxième ciblage basé sur le mode sélectionné
            if (elementConfig.projectileCount > 1 && targetingMode === 'multiple') {
                const portal2 = new Portal()
                    .origin(caster)
                    .range(SPELL_CONFIG.targeting.range)
                    .color(elementConfig.targeting.color)
                    .texture(elementConfig.targeting.texture);

                const target2 = await portal2.pick();
                if (target2) {
                    targets.push({ x: target2.x, y: target2.y });
                }
            }

            return { targets, allowSelfTarget };
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            return null;
        }
    }

    const targetingResult = await selectTargets();
    if (!targetingResult) return;
    const { targets, allowSelfTarget } = targetingResult;

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

            const isOwner = targetActor.isOwner;
            const isVisible = targetToken.visible;
            const isGM = game.user.isGM;

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

            const isOwner = targetActor.isOwner;
            const isVisible = targetToken.visible;
            const isGM = game.user.isGM;

            // Return appropriate name based on visibility (tokens are already filtered for visibility)
            return { name: targetToken.name, token: targetToken, actor: targetActor };
        }
    }

    const targetActors = targets.map(target => getActorAtLocation(target.x, target.y));

    // ===== FONCTIONS GÉNÉRIQUES D'APPLICATION D'EFFETS =====
    /**
     * Fonction générique pour appliquer un effet configuré sur un token/acteur
     */
    async function applyGenericEffect(targetActor, effectConfig, replacements = {}) {
        if (!targetActor || !effectConfig) return false;

        try {
            // Construire les données d'effet à partir de la configuration
            const effectData = {
                name: effectConfig.name,
                icon: effectConfig.icon,
                origin: replacements.CASTER_ID || null,
                disabled: false,
                duration: { ...effectConfig.duration },
                flags: JSON.parse(JSON.stringify(effectConfig.flags)), // Deep clone
                changes: [...effectConfig.changes],
                tint: effectConfig.tint
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
            if (targetActor.isOwner) {
                await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            } else {
                if (globalThis.gmSocket) {
                    await globalThis.gmSocket.executeAsGM("createEffectOnActor", targetActor.id, effectData);
                } else {
                    console.warn(`[Ora Bubbles] Cannot apply effect to ${targetActor.name} - no GM socket`);
                    return false;
                }
            }

            console.log(`[Ora Bubbles] Applied ${effectData.name} to ${targetActor.name}`);
            return true;
        } catch (error) {
            console.error(`[Ora Bubbles] Error applying effect to ${targetActor.name}:`, error);
            return false;
        }
    }

    // ===== FUNCTIONS FOR EFFECT MANAGEMENT =====

    /**
     * Supprime les anciens effets d'Ora avant d'appliquer de nouveaux
     */
    async function removeExistingOraEffects(targetActor, casterId) {
        const oraEffectsToRemove = [];

        // Chercher tous les effets d'Ora sur la cible
        for (const effect of targetActor.effects.contents) {
            const isOraEffect = (
                effect.name === "Ora Ralentissement" ||
                effect.name === "Ora Faiblesse Électrique" ||
                effect.name === "Ora Faiblesse Feu"
            );

            if (isOraEffect) {
                const effectCaster = effect.flags?.world?.oraCaster;
                if (effectCaster === casterId) {
                    oraEffectsToRemove.push(effect);
                }
            }
        }

        // Supprimer les effets trouvés
        for (const effect of oraEffectsToRemove) {
            try {
                if (targetActor.isOwner) {
                    await effect.delete();
                } else {
                    // Délégation GM
                    if (globalThis.gmSocket) {
                        await globalThis.gmSocket.executeAsGM("removeEffectFromActor", targetActor.id, effect.id);
                    }
                }
                console.log(`[Ora Bubbles] Removed existing effect ${effect.name} from ${targetActor.name}`);
            } catch (error) {
                console.error(`[Ora Bubbles] Error removing effect ${effect.name}:`, error);
            }
        }

        return oraEffectsToRemove.length;
    }

    /**
     * Applique un effet de statut sur un acteur cible
     */
    async function applyStatusEffect(targetActor, targetToken, effectType, casterId, spellName) {
        if (!targetActor) return false;

        // D'abord supprimer les anciens effets d'Ora
        const removedCount = await removeExistingOraEffects(targetActor, casterId);
        if (removedCount > 0) {
            console.log(`[Ora Bubbles] Removed ${removedCount} existing Ora effect(s) from ${targetActor.name}`);
        }

        // Obtenir la configuration de l'effet à partir de SPELL_CONFIG
        const statusConfig = SPELL_CONFIG.statusEffects[effectType];
        if (!statusConfig) {
            console.error(`[Ora Bubbles] Unknown effect type: ${effectType}`);
            return false;
        }

        // Définir les remplacements dynamiques pour la configuration
        const replacements = {
            "CASTER_ID": casterId,
            "SPELL_NAME": spellName,
            "TIMESTAMP": Date.now()
        };

        // Utiliser la fonction générique avec la configuration centralisée
        return await applyGenericEffect(targetActor, statusConfig, replacements);
    }

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = Math.floor((characteristicInfo.final + totalDamageBonus) / 2);

        if (currentStance === 'offensif' && !isLivingWater) {
            // Dégâts maximisés en position offensive
            const maxDamage = 6 + statBonus;
            return Array(elementConfig.projectileCount).fill({
                total: maxDamage,
                formula: `6 + ${statBonus}`,
                result: `6 + ${statBonus}`,
                isMaximized: true
            });
        } else {
            // Lancer les dés normalement
            const damages = [];
            for (let i = 0; i < elementConfig.projectileCount; i++) {
                const roll = new Roll("1d6 + @statBonus", { statBonus: statBonus });
                await roll.evaluate({ async: true });
                damages.push(roll);
            }
            return damages;
        }
    }

    const damages = await calculateDamage();

    // ===== ANIMATIONS (Sequencer) =====
    async function playAnimation() {
        let sequence = new Sequence();

        // Effet de lancement sur le lanceur
        sequence.effect()
            .file(SPELL_CONFIG.animations.cast)
            .atLocation(caster)
            .scale(0.8)
            .duration(3000);

        for (let i = 0; i < elementConfig.projectileCount; i++) {
            const targetIndex = Math.min(i, targets.length - 1);
            const target = targets[targetIndex];

            if (isLivingWater) {
                // Eau Vivante : effet direct sur la cible
                let healEffect = sequence.effect()
                    .file(elementConfig.effectFile)
                    .atLocation(target)
                    .scale(0.8)
                    .delay(500 + i * 200);

                if (elementConfig.tint) {
                    healEffect.tint(elementConfig.tint);
                }
            } else {
                // Projectile de dégâts : voyage du lanceur vers la cible
                let projectileEffect = sequence.effect()
                    .file(elementConfig.effectFile)
                    .atLocation(caster)
                    .stretchTo(target)
                    .scale(0.6)
                    .delay(500 + i * 200)
                    .waitUntilFinished(-200);

                if (elementConfig.tint) {
                    projectileEffect.tint(elementConfig.tint);
                }

                // Effet d'impact
                if (elementConfig.explosionFile) {
                    let impactEffect = sequence.effect()
                        .file(elementConfig.explosionFile)
                        .atLocation(target)
                        .scale(0.5);

                    if (elementConfig.tint) {
                        impactEffect.tint(elementConfig.tint);
                    }
                }
            }
        }

        await sequence.play();
    }

    await playAnimation();

    // ===== ATTACK + DAMAGE RESOLUTION =====
    if (!isLivingWater) {
        // Pour les sorts d'attaque
        const totalAttackDice = characteristicInfo.final + attackBonus;
        const levelBonus = 2 * SPELL_CONFIG.spellLevel;
        let combinedParts = [`${totalAttackDice}d7 + ${levelBonus}`];

        if (currentStance !== 'offensif') {
            // Ajouter les dés de dégâts si pas maximisé
            const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
            const totalDamageBonus = damageBonus + effectDamageBonus;
            const statBonus = Math.floor((characteristicInfo.final + totalDamageBonus) / 2);

            for (let i = 0; i < elementConfig.projectileCount; i++) {
                combinedParts.push(`1d6 + ${statBonus}`);
            }
        }

        const combinedRoll = new Roll(`{${combinedParts.join(', ')}}`);
        await combinedRoll.evaluate({ async: true });

        const attackResult = combinedRoll.terms[0].results[0];

        // ===== CHAT MESSAGE POUR ATTAQUE =====
        const targetText = targets.length > 1
            ? `${targetActors[0]?.name || 'cible'} et ${targetActors[1]?.name || 'cible'}`
            : targetActors[0]?.name || 'cible';

        const totalDamage = damages.reduce((sum, dmg) => sum + dmg.total, 0);
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';

        const actualManaCost = currentStance === 'focus' && elementConfig.isFocusable
            ? 'GRATUIT (Position Focus)'
            : `${elementConfig.manaCost} mana`;

        function createAttackFlavor() {
            return `
                <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #1976d2;">🫧 Sort de ${SPELL_CONFIG.name} - ${elementConfig.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                        <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #c62828; margin-bottom: 6px;"><strong>🫧 ${elementConfig.name}${stanceNote}</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible(s):</strong> ${targetText}</div>
                        <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS: ${totalDamage}</div>
                        ${elementConfig.projectileCount > 1 ? `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${damages.map(d => d.total).join(' + ')})</div>` : ''}
                    </div>
                    <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                        <div style="font-size: 0.9em; color: #1976d2;"><strong>✨ Effet:</strong> ${elementConfig.description}</div>
                    </div>
                </div>
            `;
        }

        await combinedRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: createAttackFlavor(),
            rollMode: game.settings.get('core', 'rollMode')
        });

        // ===== APPLICATION DES EFFETS DE STATUT =====
        if (selectedElement !== 'living_water') {
            const appliedEffects = [];
            const failedEffects = [];

            // Appliquer les effets sur chaque cible touchée
            for (let i = 0; i < targetActors.length; i++) {
                const targetInfo = targetActors[i];
                if (targetInfo && targetInfo.actor) {
                    const success = await applyStatusEffect(
                        targetInfo.actor,
                        targetInfo.token,
                        selectedElement,
                        actor.id,
                        SPELL_CONFIG.name
                    );

                    if (success) {
                        appliedEffects.push(targetInfo.name);
                    } else {
                        failedEffects.push(targetInfo.name);
                    }
                }
            }

            // Notification des effets appliqués
            if (appliedEffects.length > 0) {
                let effectName = "";
                switch (selectedElement) {
                    case 'ice':
                        effectName = "Ralentissement";
                        break;
                    case 'water':
                        effectName = "Faiblesse Électrique";
                        break;
                    case 'oil':
                        effectName = "Faiblesse Feu";
                        break;
                }

                ui.notifications.info(`✨ Effet ${effectName} appliqué sur: ${appliedEffects.join(', ')}`);
            }

            if (failedEffects.length > 0) {
                ui.notifications.warn(`⚠️ Impossible d'appliquer l'effet sur: ${failedEffects.join(', ')}`);
            }
        }

        ui.notifications.info(`${SPELL_CONFIG.name} lancé ! Cible: ${targetText}. Attaque: ${attackResult.result}, Dégâts: ${totalDamage}.`);

    } else {
        // Pour l'Eau Vivante (soin)
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = damageBonus + effectDamageBonus;
        const statBonus = Math.floor((characteristicInfo.final + totalDamageBonus) / 2);
        const healingRoll = new Roll("1d6 + @statBonus", { statBonus: statBonus });
        await healingRoll.evaluate({ async: true });

        const targetName = allowSelfTarget ? actor.name : (targetActors[0]?.name || "cible");
        const actualManaCost = currentStance === 'focus'
            ? '2 mana (Position Focus - coût réduit)'
            : `${elementConfig.manaCost} mana`;

        function createHealingFlavor() {
            return `
                <div style="background: linear-gradient(135deg, #e8f5e9, #c8e6c9); padding: 12px; border-radius: 8px; border: 2px solid #4caf50; margin: 8px 0;">
                    <div style="text-align: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; color: #2e7d32;">🫧 Sort de ${SPELL_CONFIG.name} - ${elementConfig.name}</h3>
                        <div style="margin-top: 3px; font-size: 0.9em;">
                            <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                        </div>
                    </div>
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: #d4edda; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #155724; margin-bottom: 6px;"><strong>🫧 ${elementConfig.name}</strong></div>
                        <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                        <div style="font-size: 1.4em; color: #2e7d32; font-weight: bold;">💚 SOIN: ${healingRoll.total}</div>
                    </div>
                    <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f1f8e9; border-radius: 4px;">
                        <div style="font-size: 0.9em; color: #2e7d32;"><strong>✨ Effet:</strong> ${elementConfig.description}</div>
                    </div>
                </div>
            `;
        }

        await healingRoll.toMessage({
            speaker: ChatMessage.getSpeaker({ token: caster }),
            flavor: createHealingFlavor(),
            rollMode: game.settings.get("core", "rollMode")
        });

        ui.notifications.info(`${SPELL_CONFIG.name} lancé ! ${healingRoll.total} soin appliqué à ${targetName}.`);
    }

})();
