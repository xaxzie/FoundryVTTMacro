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
                damageDisplay: "2d6 + Esprit"
            },
            divided: {
                name: "Divisé",
                description: "2 tourbillons faibles",
                count: 2,
                damageFormula: "1d6",
                statMultiplier: 0.5, // Esprit divisé par 2
                damageDisplay: "1d6 + Esprit/2 chacun"
            }
        },

        protection: {
            // En Position Focus, protection toujours active (pas de choix)
            // En autres positions, choix entre protection ou non
            enabledByDefault: true,
            description: "Bloque les attaques traversantes"
        },

        animations: {
            cast: "jb2a.cast_generic.water.02.blue.0",
            vortex: "jb2a_patreon.whirlwind.blue",
            impact: "jb2a.impact.water.02.blue.0",
            splash: "animated-spell-effects-cartoon.water.water splash.01",

            // Propriétés d'animation
            vortexDuration: 120000, // 2 minutes (120 secondes)
            vortexFadeOut: 3000, // 3 secondes de fade out
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
            ? "<strong>Coût en Mana :</strong> GRATUIT (Position Focus) - <em>Pas de choix sur protection (bloque toujours)</em>"
            : "<strong>Coût en Mana :</strong> 4 mana";

        const damageInfo = currentStance === 'offensif'
            ? `Dégâts de traversée : <strong>Maximisés en Position Offensive</strong>`
            : `Dégâts de traversée : <strong>Normaux (lancer de dés)</strong>`;

        return new Promise((resolve) => {
            const vortexTypeOptions = Object.keys(SPELL_CONFIG.vortexTypes).map(key => {
                const vortexType = SPELL_CONFIG.vortexTypes[key];
                return `<label><input type="radio" name="vortexType" value="${key}" ${key === 'single' ? 'checked' : ''}>
                    <strong>${vortexType.name} :</strong> ${vortexType.description} (${vortexType.damageDisplay})</label>`;
            }).join('<br>');

            const protectionOptions = currentStance !== 'focus' ? `
                <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f0f8ff;">
                    <h4>Protection Anti-Projectiles</h4>
                    <p><em>Le tourbillon peut-il bloquer les attaques traversantes ?</em></p>
                    <label><input type="radio" name="protection" value="yes" checked>
                        <strong>Oui :</strong> ${SPELL_CONFIG.protection.description}</label><br>
                    <label><input type="radio" name="protection" value="no">
                        <strong>Non :</strong> N'offre aucune protection</label>
                </div>
            ` : '';

            new Dialog({
                title: `Sort de ${SPELL_CONFIG.name}${currentStance ? ` (Position: ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : ''}`,
                content: `
                    <h3>Configuration du Tourbillon :</h3>
                    <p>${manaInfo}</p>
                    <p><strong>Caractéristique ${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>

                    <div style="margin: 10px 0; border: 1px solid #ccc; padding: 10px; background: #f9f9f9;">
                        <h4>Type de Tourbillon</h4>
                        ${vortexTypeOptions}
                    </div>

                    ${protectionOptions}

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

                    <p>${damageInfo}</p>
                    <p><strong>Jet d'attaque :</strong> <span id="finalAttack">${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel}</span></p>

                    <script>
                        document.getElementById('attackBonus').addEventListener('input', function() {
                            const base = ${characteristicInfo.final};
                            const bonus = parseInt(this.value) || 0;
                            const total = base + bonus;
                            document.getElementById('finalAttack').textContent = total + 'd7 + ${2 * SPELL_CONFIG.spellLevel}';
                        });
                    </script>
                `,
                buttons: {
                    confirm: {
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const vortexType = html.find('input[name="vortexType"]:checked').val();
                            const protection = currentStance === 'focus' ? 'yes' : html.find('input[name="protection"]:checked').val();
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            resolve({ vortexType, protection, damageBonus, attackBonus });
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
    const { vortexType, protection, damageBonus, attackBonus } = spellConfig;
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
        const tolerance = canvas.grid.size;
        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
            const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;
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

        if (isOwner || isVisible || isGM) {
            return { name: targetActor.name, token: targetToken, actor: targetActor };
        } else {
            return { name: "cible", token: targetToken, actor: targetActor };
        }
    }

    const targetActors = targets.map(target => getActorAtLocation(target.x, target.y));

    // ===== DAMAGE CALCULATION =====
    async function calculateDamage() {
        const damages = [];
        // Note: Sorts indirects ne bénéficient PAS des bonus d'effets actifs sur les dégâts
        const statBonus = Math.floor((characteristicInfo.final * vortexTypeConfig.statMultiplier) + damageBonus);

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

        // Créer les effets de tourbillon pour chaque cible
        for (let i = 0; i < targets.length; i++) {
            const target = targets[i];

            // Détecter le token à la position cible pour l'échelle adaptative
            const targetToken = canvas.tokens.placeables.find(token => {
                const tokenCenterX = token.x + (token.document.width * canvas.grid.size) / 2;
                const tokenCenterY = token.y + (token.document.height * canvas.grid.size) / 2;
                const distance = Math.sqrt(
                    Math.pow(tokenCenterX - target.x, 2) + Math.pow(tokenCenterY - target.y, 2)
                );
                return distance <= canvas.grid.size;
            });

            // Calculer l'échelle adaptative
            let vortexScale;
            if (targetToken) {
                const tokenSize = Math.max(targetToken.document.width, targetToken.document.height) * 0.5;
                vortexScale = (tokenSize * SPELL_CONFIG.scaling.tokenSizeMultiplier) *
                             (vortexType === 'divided' ? SPELL_CONFIG.scaling.dividedReduction : 1.0);
            } else {
                vortexScale = SPELL_CONFIG.scaling.defaultScale *
                             (vortexType === 'divided' ? SPELL_CONFIG.scaling.dividedReduction : 1.0);
            }

            // Effet de tourbillon principal - PERSISTANT
            let vortexEffect = sequence.effect()
                .file(SPELL_CONFIG.animations.vortex)
                .scale(vortexScale)
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
                .scale(vortexScale * SPELL_CONFIG.scaling.impactReduction)
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
                .scale(vortexScale * SPELL_CONFIG.scaling.splashReduction)
                .belowTokens()
                .delay(SPELL_CONFIG.animations.splashDelay);

            if (targetToken) {
                splashEffect.attachTo(targetToken);
            } else {
                splashEffect.atLocation(target);
            }
        }

        await sequence.play();
    }

    await playAnimation();

    // ===== ATTACK + DAMAGE RESOLUTION =====
    const totalAttackDice = characteristicInfo.final + attackBonus;
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;
    let combinedParts = [`${totalAttackDice}d7 + ${levelBonus}`];

    if (currentStance !== 'offensif') {
        // Ajouter les dés de dégâts si pas maximisé
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

    const totalDamage = damages.reduce((sum, dmg) => sum + dmg.total, 0);
    const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';

    const actualManaCost = currentStance === 'focus'
        ? 'GRATUIT (Position Focus)'
        : `${SPELL_CONFIG.manaCost} mana`;

    function createFlavor() {
        return `
            <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1976d2;">🌊 Sort de ${SPELL_CONFIG.name} - ${vortexTypeConfig.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Personnage:</strong> ${actor.name} | <strong>Coût:</strong> ${actualManaCost}
                    </div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff3e0; border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #e65100; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
                </div>
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #e7f3ff; border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #0066cc; margin-bottom: 6px;"><strong>🌊 ${vortexTypeConfig.name}${stanceNote}</strong></div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible(s):</strong> ${targetText}</div>
                    <div style="font-size: 1.4em; color: #d32f2f; font-weight: bold;">💥 DÉGÂTS DE TRAVERSÉE: ${totalDamage}</div>
                    ${vortexTypeConfig.count > 1 ? `<div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${damages.map(d => d.total).join(' + ')})</div>` : ''}
                </div>
                <div style="text-align: center; margin: 6px 0; padding: 6px; background: #f0f4ff; border-radius: 4px;">
                    <div style="font-size: 0.9em; color: #1976d2;"><strong>⚠️ Notes:</strong> Dégâts appliqués lors de la traversée. ${protection === 'yes' ? 'Bloque les attaques traversantes.' : ''}</div>
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
    const vortexInfo = vortexTypeConfig.count > 1 ? `${vortexTypeConfig.count} tourbillons créés` : `Tourbillon puissant créé`;
    const maximizedInfo = currentStance === 'offensif' ? ' MAXIMISÉ' : '';

    ui.notifications.info(`Sort de ${SPELL_CONFIG.name} lancé !${stanceInfo} ${vortexInfo}${maximizedInfo}. Jet d'attaque : ${attackResult.result}.`);

})();
