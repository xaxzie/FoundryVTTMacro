/**
 * Flèche d'Acier - Léo
 *
 * Léo crée et tire des flèches magiques d'acier avec différentes propriétés selon la variante choisie.
 *
 * Variantes :
 * - Standard : 1 mana (focalisable), niveau 1, dégâts 1d4+Dextérité
 * - Électrique : 4 mana (focalisable), niveau 2, dégâts 1d4+3+Dextérité, zone adjacente
 * - Perce Armure : 3 mana (focalisable), niveau 1, dégâts 1d4+3+Dextérité, ignore RD (Physique/2)
 * - Perce Muraille : 4 mana (demi-focalisable), niveau 0, attaque Dextérité/2, dégâts 2d4+Physique*2+3
 *
 * - Caractéristique d'attaque : Dextérité (sauf Perce Muraille qui utilise Dextérité/2)
 * - Effet spécial : L'effet "Serpent" ne fonctionne pas avec ces sorts
 * - Cible : unique (Portal pour sélectionner la cible)
 *
 * Usage : Sélectionner le token de Léo, lancer la macro et choisir la variante.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const ARROW_VARIANTS = {
        "standard": {
            name: "Flèche d'Acier",
            description: "Flèche magique d'acier basique (1d4+Dextérité)",
            manaCost: 1,
            spellLevel: 1,
            damageFormula: "1d4",
            damageBonus: 0,
            useFullDexterity: true,
            isFocusable: true,
            hasAreaEffect: false,
            hasArmorPiercing: false,
            animations: {
                cast: "jb2a_patreon.token_border.circle.spinning.orange.011",
                projectile: "jb2a.arrow.physical.white.01",
                hit: "jb2a_patreon.impact.003.orange",
                sound: null
            },
            targeting: {
                color: "#c0c0c0",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            }
        },
        "electric": {
            name: "Flèche Électrique",
            description: "Flèche électrifiée touchant la cible et les ennemis adjacents (1d4+3+Dextérité)",
            manaCost: 4,
            spellLevel: 2,
            damageFormula: "1d4",
            damageBonus: 3,
            useFullDexterity: true,
            isFocusable: true,
            hasAreaEffect: true,
            hasArmorPiercing: false,
            animations: {
                cast: "jb2a_patreon.token_border.circle.spinning.orange.011",
                projectile: "jb2a_patreon.arrow.lightning.orange",
                hit: "jb2a.static_electricity.02.blue",
                area: "animated-spell-effects-cartoon.electricity.08",
                sound: null
            },
            targeting: {
                color: "#0066ff",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            }
        },
        "armor_piercing": {
            name: "Flèche Perce Armure",
            description: "Flèche perforante ignorant la RD (1d4+3+Dextérité, ignore Physique/2 RD)",
            manaCost: 3,
            spellLevel: 1,
            damageFormula: "1d4",
            damageBonus: 3,
            useFullDexterity: true,
            isFocusable: true,
            hasAreaEffect: false,
            hasArmorPiercing: true,
            animations: {
                cast: "jb2a_patreon.token_border.circle.spinning.orange.011",
                projectile: "jb2a_patreon.arrow.physical.white.02",
                hit: "jb2a_patreon.impact.003.orange",
                piercing: "jb2a_patreon.extras.tmfx.border.circle.outpulse.01.normal",
                sound: null
            },
            targeting: {
                color: "#ff6600",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            }
        },
        "wall_piercing": {
            name: "Flèche Perce Muraille",
            description: "Flèche lourde et puissante (attaque Dex/2, dégâts 2d4+Physique*2+3)",
            manaCost: 4,
            spellLevel: 0,
            damageFormula: "2d4",
            damageBonus: 3,
            useFullDexterity: false, // Uses Dexterity/2 for attack
            isFocusable: false, // Demi-focalisable (not fully focusable)
            hasAreaEffect: false,
            hasArmorPiercing: false,
            isHeavyArrow: true, // Uses Physique*2 for damage
            animations: {
                cast: "jb2a_patreon.token_border.circle.spinning.orange.011",
                projectile: "animated-spell-effects.magic.arrow.ray.01",
                hit: "jb2a_patreon.impact.003.orange",
                heavy: "jb2a_patreon.impact.ground_crack.02.orange",
                sound: null
            },
            targeting: {
                color: "#cc0000",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
            }
        }
    };

    const BASE_CONFIG = {
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        isDirect: true,
        serpentExclusion: true, // Serpent effect doesn't work with arrow spells
        maxRange: 300,
        adjacencyRadius: 1 // For electric variant area effect
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("⚠️ Veuillez d'abord sélectionner le token de Léo !");
        return;
    }
    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("⚠️ Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====
    function getCurrentStance(actor) {
        return actor.getFlag("world", "combatStance") || "normal";
    }

    // Active effect bonuses (excludes Serpent for this spell)
    function getActiveEffectBonus(actor, flagKey) {
        let total = 0;
        for (const effect of actor.effects) {
            if (effect.flags?.[flagKey]?.value) {
                // Skip Serpent effect
                if (effect.name.toLowerCase() === "serpent") continue;
                total += effect.flags[flagKey].value;
            }
        }
        return total;
    }

    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    // Active effect bonuses (excludes Serpent for this spell)
    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            // Skip Serpent effect
            if (effect.name?.toLowerCase() === 'serpent') {
                console.log(`[DEBUG] Excluding Serpent effect from ${flagKey} bonus`);
                continue;
            }
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                total += flagValue;
                console.log(`[DEBUG] Active effect "${effect.name}" adds ${flagValue} to ${flagKey}`);
            }
        }
        return total;
    }

    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system?.attributes?.[characteristic];
        if (!attr) {
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
        }
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    function calculateManaCost(baseCost, stance, isFocusable) {
        if (isFocusable && stance === 'focus') return 0;
        return baseCost;
    }

    const currentStance = getCurrentStance(actor);
    const dexterityInfo = getCharacteristicValue(actor, BASE_CONFIG.characteristic);
    const physiqueInfo = getCharacteristicValue(actor, "physique");

    // ===== ARROW VARIANT SELECTION =====
    async function selectArrowVariant() {
        const dialogContent = `
            <h3>🏹 Sélection de Flèche</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p><strong>Dextérité:</strong> ${dexterityInfo.final} | <strong>Physique:</strong> ${physiqueInfo.final}</p>

            <div style="margin: 15px 0;">
                ${Object.entries(ARROW_VARIANTS).map(([key, variant]) => {
                    const actualCost = calculateManaCost(variant.manaCost, currentStance, variant.isFocusable);
                    const costText = actualCost === 0 ? '0 mana (Focus)' : `${actualCost} mana`;

                    return `
                        <div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
                            <input type="radio" id="${key}" name="variant" value="${key}" ${key === 'standard' ? 'checked' : ''}>
                            <label for="${key}">
                                <strong>${variant.name}</strong> (${costText})<br>
                                <small>${variant.description}</small>
                            </label>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        return new Promise(resolve => {
            new Dialog({
                title: "🏹 Flèche d'Acier - Sélection de Variante",
                content: dialogContent,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-crosshairs"></i>',
                        label: "Sélectionner",
                        callback: (html) => {
                            const variant = html.find('input[name="variant"]:checked').val();
                            resolve({ variant });
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

    const variantChoice = await selectArrowVariant();
    if (!variantChoice) {
        ui.notifications.info("ℹ️ Lancement de flèche annulé.");
        return;
    }

    const arrowConfig = ARROW_VARIANTS[variantChoice.variant];
    const actualManaCost = calculateManaCost(arrowConfig.manaCost, currentStance, arrowConfig.isFocusable);

    // ===== CONFIGURATION DIALOG =====
    async function showConfigDialog() {
        const dialogContent = `
            <h3>🏹 ${arrowConfig.name}</h3>
            <p><strong>Coût:</strong> ${actualManaCost === 0 ? '0 mana (Focus possible)' : `${actualManaCost} mana`}</p>
            <p><strong>Caractéristique:</strong> ${arrowConfig.useFullDexterity ?
                `${BASE_CONFIG.characteristicDisplay} (${dexterityInfo.final})` :
                `${BASE_CONFIG.characteristicDisplay}/2 (${Math.floor(dexterityInfo.final / 2)})`}</p>

            <div style="margin: 15px 0;">
                <label for="attackBonus">Bonus d'attaque manuel:</label>
                <input type="number" id="attackBonus" name="attackBonus" value="0" min="-10" max="10">
            </div>

            <div style="margin: 15px 0;">
                <label for="damageBonus">Bonus de dégâts manuel:</label>
                <input type="number" id="damageBonus" name="damageBonus" value="0" min="-10" max="20">
            </div>
        `;

        return new Promise(resolve => {
            new Dialog({
                title: `🏹 Configuration - ${arrowConfig.name}`,
                content: dialogContent,
                buttons: {
                    confirm: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirmer",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            resolve({ attackBonus, damageBonus });
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
        ui.notifications.info("ℹ️ Configuration annulée.");
        return;
    }

    const { attackBonus, damageBonus } = userConfig;

    // ===== TARGETING via Portal =====
    async function selectTarget() {
        try {
            const portal = new Portal()
                .origin(caster)
                .range(BASE_CONFIG.maxRange)
                .color(arrowConfig.targeting.color)
                .texture(arrowConfig.targeting.texture);
            const target = await portal.pick();
            return target;
        } catch (error) {
            ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
            console.error("Portal targeting error:", error);
            return null;
        }
    }

    const target = await selectTarget();

    if (!target) {
        ui.notifications.info("ℹ️ Ciblage annulé.");
        return;
    }

    // Find target actor
    function getActorAtLocation(x, y, tolerance = 50) {
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
            return tokensAtLocation[0];
        } else {
            // No grid: use circular tolerance detection (original behavior with visibility check)
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                // First check if the token is visible to the current user
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                if (!token.actor) return false;
                const distance = Math.sqrt(Math.pow(x - token.center.x, 2) + Math.pow(y - token.center.y, 2));
                return distance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;
            return tokensAtLocation[0];
        }
    }

    const targetToken = getActorAtLocation(target.x, target.y);
    const targetName = targetToken ? targetToken.name : 'position';

    // Find adjacent targets for electric variant
    let adjacentTargets = [];    if (arrowConfig.hasAreaEffect && targetToken) {
        const gridSize = canvas.grid.size;

        // Check if we have a grid
        if (canvas.grid.type !== 0) {
            // Grid-based detection: get target's grid position
            const targetGridX = Math.floor(targetToken.x / gridSize);
            const targetGridY = Math.floor(targetToken.y / gridSize);

            for (const token of canvas.tokens.placeables) {
                if (token === targetToken || !token.actor) continue;

                // Check visibility before adding to adjacent targets
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    continue;
                }

                // Get token's grid position (top-left corner)
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // For tokens larger than 1x1, check all grid squares they occupy
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                let tokenIsAdjacent = false;

                // Check each grid square occupied by the token
                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        // Calculate grid distance (Chebyshev distance for D&D-style adjacency)
                        const gridDistance = Math.max(
                            Math.abs(tokenSquareX - targetGridX),
                            Math.abs(tokenSquareY - targetGridY)
                        );

                        if (gridDistance <= 1) {
                            tokenIsAdjacent = true;
                            break;
                        }
                    }
                    if (tokenIsAdjacent) break;
                }

                if (tokenIsAdjacent) {
                    adjacentTargets.push(token);
                }
            }
        } else {
            // No grid: use circular tolerance detection (original behavior)
            for (const token of canvas.tokens.placeables) {
                if (token === targetToken || !token.actor) continue;

                // Check visibility before adding to adjacent targets
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                // Skip tokens that aren't visible to the current user
                if (!isOwner && !isVisible && !isGM) {
                    continue;
                }

                const distance = Math.sqrt(
                    Math.pow(targetToken.center.x - token.center.x, 2) +
                    Math.pow(targetToken.center.y - token.center.y, 2)
                );

                const gridDistance = distance / gridSize;
                if (gridDistance <= BASE_CONFIG.adjacencyRadius) {
                    adjacentTargets.push(token);
                }
            }
        }

    }

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {

        // Active effect damage bonus (excludes Serpent)
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");

        let totalStaticBonus;
        if (arrowConfig.isHeavyArrow) {
            // Wall piercing: Physique*2 + 3 + manual bonus + effect bonus
            totalStaticBonus = (physiqueInfo.final * 2) + arrowConfig.damageBonus + damageBonus + effectDamageBonus;
        } else {
            // Standard arrows: Dex + bonus + manual bonus + effect bonus
            totalStaticBonus = dexterityInfo.final + arrowConfig.damageBonus + damageBonus + effectDamageBonus;
        }

        if (currentStance === 'offensif') {
            // Offensive stance: damage is maximized
            const diceMax = arrowConfig.damageFormula === '2d4' ? 8 : 4; // 1d4 max = 4, 2d4 max = 8
            const maxDamage = diceMax + totalStaticBonus;

            console.log(`[DEBUG] Maximized damage: ${maxDamage} (${diceMax} + ${totalStaticBonus})`);

            return {
                total: maxDamage,
                formula: `${diceMax} + ${totalStaticBonus}`,
                result: maxDamage,
                isMaximized: true
            };
        } else {
            // Normal dice rolling
            const damage = new Roll(`${arrowConfig.damageFormula} + @totalBonus`, { totalBonus: totalStaticBonus });
            await damage.evaluate({ async: true });

            console.log(`[DEBUG] Rolled damage: ${damage.total} (formula: ${damage.formula})`);
            return damage;
        }
    }

    // ===== SEQUENCER ANIMATION =====
    async function playArrowAnimation() {
        const sequence = new Sequence();

        // Cast effect
        sequence
            .effect()
            .file(arrowConfig.animations.cast)
            .attachTo(caster)
            .scale(0.8)
            .tint("#ff6666");

        // Projectile
        sequence
            .effect()
            .file(arrowConfig.animations.projectile)
            .atLocation(caster)
            .stretchTo(target)
            .scale(0.6)
            .waitUntilFinished(-200);

        // Hit effect
        sequence
            .effect()
            .file(arrowConfig.animations.hit)
            .atLocation(target)
            .scale(0.8)
            .duration(1500);

        // Special effects based on variant
        if (arrowConfig.hasAreaEffect && adjacentTargets.length > 0) {
            // Electric area effect
            for (const adjTarget of adjacentTargets) {
                sequence
                    .effect()
                    .file(arrowConfig.animations.area)
                    .atLocation(target)
                    .stretchTo(adjTarget)
                    .scale(0.5)
                    .delay(500);
            }
        }

        if (arrowConfig.hasArmorPiercing) {
            // Armor piercing effect
            sequence
                .effect()
                .file(arrowConfig.animations.piercing)
                .atLocation(target)
                .scale(0.5)
                .duration(1000)
                .delay(300);
        }

        if (arrowConfig.isHeavyArrow) {
            // Heavy impact effect
            sequence
                .effect()
                .file(arrowConfig.animations.heavy)
                .atLocation(target)
                .scale(0.7)
                .duration(2000)
                .delay(400);
        }

        return sequence.play();
    }

    const damageResult = await calculateDamage();
    await playArrowAnimation();

    // ===== ATTACK RESOLUTION =====
    const attackCharacteristic = arrowConfig.useFullDexterity ?
        dexterityInfo.final : Math.floor(dexterityInfo.final / 2);

    const totalAttackDice = attackCharacteristic + attackBonus;
    const levelBonus = 2 * arrowConfig.spellLevel;

    // Build combined roll formula
    let combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    // Add damage roll (only if not maximized)
    if (currentStance !== 'offensif') {
        combinedRollParts.push(damageResult.formula);
    }

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extract results
    const attackResult = combinedRoll.terms[0].results[0];
    let finalDamageResult = damageResult;

    if (currentStance !== 'offensif') {
        const damageRollResult = combinedRoll.terms[0].results[1];
        finalDamageResult = {
            total: damageRollResult.result,
            formula: damageRollResult.expression,
            result: damageRollResult.result
        };
    }

    // ===== CREATE ENHANCED CHAT MESSAGE =====
    function createChatFlavor() {
        const stanceText = currentStance === 'offensif' ? ' (Position Offensive - Dégâts maximisés)' : '';
        const armorPiercingText = arrowConfig.hasArmorPiercing ?
            `<br><strong>🛡️ Perce Armure:</strong> Ignore ${Math.floor(physiqueInfo.final / 2)} points de RD` : '';
        const areaText = arrowConfig.hasAreaEffect && adjacentTargets.length > 0 ?
            `<br><strong>⚡ Zone d'Effet:</strong> ${adjacentTargets.length} cible(s) adjacente(s) touchée(s)` : '';

        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        const injuryInfo = (dexterityInfo.injuries > 0 || physiqueInfo.injuries > 0) ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Dextérité ${dexterityInfo.base} - ${dexterityInfo.injuries} = ${dexterityInfo.injuryAdjusted}${physiqueInfo.injuries > 0 ? `, Physique ${physiqueInfo.base} - ${physiqueInfo.injuries} = ${physiqueInfo.injuryAdjusted}` : ''}</i>
            </div>` : '';

        const effectInfo = (dexterityInfo.effectBonus !== 0 || physiqueInfo.effectBonus !== 0 || effectDamageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${dexterityInfo.effectBonus !== 0 ? `<div>✨ Bonus de Dextérité: +${dexterityInfo.effectBonus}</div>` : ''}
                ${physiqueInfo.effectBonus !== 0 ? `<div>💪 Bonus de Physique: +${physiqueInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 ? `<div>🗡️ Bonus de Dégâts: +${effectDamageBonus} (Serpent exclu)</div>` : ''}
            </div>` : '';

        const bonusInfo = (damageBonus > 0 || attackBonus > 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${damageBonus > 0 ? `<div>🔧 Bonus Manuel de Dégâts: +${damageBonus}</div>` : ''}
                ${attackBonus > 0 ? `<div>⚡ Bonus Manuel d'Attaque: +${attackBonus} dés</div>` : ''}
            </div>` : '';

        return `
            <div style="border: 2px solid #8b4513; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #f4f4f4, #e8e8e8);">
                <h3 style="margin-top: 0; color: #8b4513;">
                    🏹 <strong>${arrowConfig.name}</strong>
                </h3>

                <div style="margin: 10px 0;">
                    <p><strong>🧙‍♂️ Tireur:</strong> ${actor.name}${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}</p>
                    <p><strong>🎯 Cible:</strong> ${targetName}</p>
                    <p><strong>💫 Coût:</strong> ${actualManaCost === 0 ? '0 mana (Focus possible)' : `${actualManaCost} mana`}</p>
                    <p><strong>🎲 Caractéristique:</strong> ${arrowConfig.useFullDexterity ?
                        `${BASE_CONFIG.characteristicDisplay} (${dexterityInfo.final})` :
                        `${BASE_CONFIG.characteristicDisplay}/2 (${Math.floor(dexterityInfo.final / 2)})`}</p>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${bonusInfo}

                <div style="margin: 15px 0; padding: 10px; background: rgba(139, 69, 19, 0.1); border-radius: 5px;">
                    <h4 style="color: #8b4513; margin-top: 0;">🎲 Résultats des jets:</h4>
                    <p><strong>🏹 Attaque:</strong> ${attackResult.result} (${totalAttackDice}d7 + ${levelBonus})</p>
                    <p><strong>💥 Dégâts:</strong> ${finalDamageResult.total}${stanceText}</p>
                    ${armorPiercingText}
                    ${areaText}
                </div>

                <div style="margin-top: 15px; padding: 10px; background: rgba(158, 158, 158, 0.1); border-radius: 5px; font-size: 0.9em;">
                    <strong>🏹 Variante:</strong> ${arrowConfig.description}
                </div>
            </div>
        `;
    }

    // Send the combined roll to chat with visual dice
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    console.log("[FLECHE D'ACIER] Arrow spell completed:", {
        caster: actor.name,
        variant: arrowConfig.name,
        target: targetName,
        attack: attackResult.result,
        damage: finalDamageResult.total,
        adjacentTargets: adjacentTargets.length
    });

})();
