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
                cast: "jb2a.ranged.02.projectile.arrow.01.yellow",
                projectile: "jb2a.arrow.physical.yellow",
                hit: "jb2a.impact.010.orange",
                sound: null
            },
            targeting: {
                color: "#c0c0c0",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Grey_400x400.webm"
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
                cast: "jb2a.ranged.02.projectile.arrow.01.blue",
                projectile: "jb2a.arrow.physical.blue",
                hit: "jb2a.lightning_bolt.wide.blue",
                area: "jb2a.chain_lightning.secondary.blue",
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
                cast: "jb2a.ranged.02.projectile.arrow.01.orange",
                projectile: "jb2a.arrow.physical.orange",
                hit: "jb2a.impact.ground_crack.orange.02",
                piercing: "jb2a.extras.tmfx.border.circle.outpulse.01.normal",
                sound: null
            },
            targeting: {
                color: "#ff6600",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
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
                cast: "jb2a.ranged.02.projectile.arrow.01.red",
                projectile: "jb2a.arrow.physical.red",
                hit: "jb2a.impact.boulder.01",
                heavy: "jb2a.ground_cracks.orange.02",
                sound: null
            },
            targeting: {
                color: "#cc0000",
                texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
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

    function getCharacteristicValue(actor, characteristic) {
        const baseValue = actor.system?.abilities?.[characteristic]?.value ||
                         actor.system?.[characteristic] || 0;

        // Detect injuries effect
        const injuryEffect = actor.effects.find(e => e.name === "Blessures");
        let injuryStacks = 0;
        if (injuryEffect?.flags?.statuscounter?.value) {
            injuryStacks = injuryEffect.flags.statuscounter.value;
        }

        const adjustedValue = Math.max(0, baseValue - injuryStacks);

        return {
            base: baseValue,
            injuries: injuryStacks,
            final: adjustedValue
        };
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
        return new Portal()
            .color(arrowConfig.targeting.color)
            .texture(arrowConfig.targeting.texture)
            .pick();
    }

    const target = await selectTarget();
    if (!target) {
        ui.notifications.info("ℹ️ Ciblage annulé.");
        return;
    }

    // Find target actor
    function getActorAtLocation(x, y, tolerance = 50) {
        for (const token of canvas.tokens.placeables) {
            if (!token.actor) continue;
            const distance = Math.sqrt(Math.pow(x - token.center.x, 2) + Math.pow(y - token.center.y, 2));
            if (distance <= tolerance) return token;
        }
        return null;
    }

    const targetToken = getActorAtLocation(target.x, target.y);
    const targetName = targetToken ? targetToken.name : 'position';

    // Find adjacent targets for electric variant
    let adjacentTargets = [];
    if (arrowConfig.hasAreaEffect && targetToken) {
        for (const token of canvas.tokens.placeables) {
            if (token === targetToken || !token.actor) continue;

            const distance = Math.sqrt(
                Math.pow(targetToken.center.x - token.center.x, 2) +
                Math.pow(targetToken.center.y - token.center.y, 2)
            );

            const gridDistance = distance / canvas.grid.size;
            if (gridDistance <= BASE_CONFIG.adjacencyRadius) {
                adjacentTargets.push(token);
            }
        }
    }

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        let damageComponents = [arrowConfig.damageFormula];

        if (arrowConfig.isHeavyArrow) {
            // Wall piercing: 2d4 + Physique*2 + 3
            damageComponents.push(`${physiqueInfo.final * 2} + ${arrowConfig.damageBonus}`);
        } else {
            // Standard arrows: damage + Dex + bonus
            damageComponents.push(`${dexterityInfo.final} + ${arrowConfig.damageBonus}`);
        }

        if (damageBonus !== 0) {
            damageComponents.push(`${damageBonus}`);
        }

        // Active effect damage bonus (excludes Serpent)
        const effectDamageBonus = getActiveEffectBonus(actor, "damage");
        if (effectDamageBonus !== 0) {
            damageComponents.push(`${effectDamageBonus}`);
        }

        const damageFormula = damageComponents.join(' + ');
        const roll = new Roll(damageFormula);
        await roll.evaluate({ async: true });

        return {
            roll: roll,
            total: roll.total,
            formula: damageFormula
        };
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
            .duration(1000);

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
                .scale(1.2)
                .duration(1000)
                .delay(300);
        }

        if (arrowConfig.isHeavyArrow) {
            // Heavy impact effect
            sequence
                .effect()
                .file(arrowConfig.animations.heavy)
                .atLocation(target)
                .scale(1.5)
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

        return `
            <div style="border: 2px solid #8b4513; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #f4f4f4, #e8e8e8);">
                <h3 style="margin-top: 0; color: #8b4513;">
                    🏹 <strong>${arrowConfig.name}</strong>
                </h3>

                <div style="margin: 10px 0;">
                    <p><strong>🧙‍♂️ Tireur:</strong> ${actor.name}</p>
                    <p><strong>🎯 Cible:</strong> ${targetName}</p>
                    <p><strong>💫 Coût:</strong> ${actualManaCost === 0 ? '0 mana (Focus possible)' : `${actualManaCost} mana`}</p>
                    <p><strong>🎲 Caractéristique:</strong> ${arrowConfig.useFullDexterity ?
                        `${BASE_CONFIG.characteristicDisplay} (${dexterityInfo.final})` :
                        `${BASE_CONFIG.characteristicDisplay}/2 (${Math.floor(dexterityInfo.final / 2)})`}</p>
                </div>

                <div style="margin: 15px 0; padding: 10px; background: rgba(139, 69, 19, 0.1); border-radius: 5px;">
                    <h4 style="color: #8b4513; margin-top: 0;">🎲 Résultats des jets:</h4>
                    <p><strong>🏹 Attaque:</strong> ${attackResult.result} (${totalAttackDice}d7 + ${levelBonus})</p>
                    <p><strong>💥 Dégâts:</strong> ${finalDamageResult.total}${stanceText}</p>
                    ${armorPiercingText}
                    ${areaText}
                </div>

                <div style="margin-top: 15px; padding: 10px; background: rgba(158, 158, 158, 0.1); border-radius: 5px; font-size: 0.9em;">
                    <strong>🏹 Variante:</strong> ${arrowConfig.description}
                    <br><strong>🕒 Tiré:</strong> ${new Date().toLocaleString()}
                </div>
            </div>
        `;
    }

    await ChatMessage.create({
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ token: caster }),
        content: createChatFlavor(),
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        rollMode: game.settings.get("core", "rollMode")
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
