/**
 * 224 - Ora (Sort de Niveau 3)
 *
 * Sort complexe de statues de glace avec attaques multiples et risques élevés.
 * Aucun prérequis initial - peut être lancé directement.
 *
 * MÉCANIQUES DU SORT :
 * 1. Ora choisit le nombre de statues (1-3, configurable)
 * 2. Ciblage d'un ennemi
 * 3. Apparition simultanée des statues de glace aux positions calculées :
 *    - Statue 1 : 1 case derrière la cible (axe Ora-cible)
 *    - Statue 2 (optionnelle) : 1 case à gauche de la cible (axe Ora-cible)
 *    - Statue 3 (optionnelle) : 1 case à droite de la cible (axe Ora-cible)
 * 4. Rayons de glace des statues vers la cible
 * 5. Saut d'Ora devant la cible + coup de pied sanglant
 * 6. Jets multiples :
 *    - Jets d'attaque des statues (Esprit sans bonus, séparés)
 *    - Jet d'attaque d'Ora (Esprit + niveau 3)
 *    - Dégâts : 1d8 + Xd6 + Esprit + (X*Esprit/2) où X = nombre de statues
 *    - Jet de risque : 1d(X+1), échec sur 1
 * 7. Conséquences :
 *    - Échec du jet de risque : perte du prochain tour
 *    - Réussite : perte de capacité de défense jusqu'au prochain tour
 *    - Si effet "224" déjà actif et échec : perte de conscience
 *    - Si effet "224" déjà actif et réussite : perte forcée du prochain tour
 *
 * Usage : Sélectionner le token d'Ora et lancer la macro.
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "224",
        spellLevel: 3,
        characteristic: "esprit",
        characteristicDisplay: "Esprit",
        manaCost: 0, // Défini par le niveau et la stance

        // Configuration des statues
        statues: {
            min: 1,
            max: 3,
            images: [
                "worlds/ft/TOKEN/SO_rnd1.png", // Statue 1 (derrière)
                "worlds/ft/TOKEN/SO_rnd4.png", // Statue 2 (gauche)
                "worlds/ft/TOKEN/SO_rnd2.png"  // Statue 3 (droite)
            ],
            positions: ["derrière", "gauche", "droite"]
        },

        // Animations
        animations: {
            statueAppear: "jb2a.impact_themed.ice_shard.blue", // Nova de givre pour apparition
            iceBeam: "jb2a.melee_generic.creature_attack.fist.002.blue.2",
            iceImpact: "jb2a_patreon.shield_themed.below.ice.01.blue", // Impact des rayons de glace
            jump: "animated-spell-effects-cartoon.air.puff.01",
            kick: "jb2a_patreon.unarmed_strike.physical.02.blue",
            finalImpact: "jb2a_patreon.impact.ground_crack.blue.01" // Impact final après le coup de pied
        },

        // Configuration du ciblage
        targeting: {
            range: 150, // Portée étendue pour un sort de niveau 3
            color: "#87CEEB", // Bleu ciel glacé
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
        },

        // Configuration des effets
        effects: {
            trackingEffect: "224"
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
     * Obtient les bonus d'effets actifs pour une caractéristique donnée
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
            throw new Error(`Caractéristique ${characteristic} non trouvée ! Veuillez d'abord exécuter l'utilitaire de Configuration des Statistiques de Personnage.`);
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
     * Vérifie si l'effet 224 est déjà actif
     */
    function check224Effect(actor) {
        return actor?.effects?.contents?.find(e =>
            e.name === SPELL_CONFIG.effects.trackingEffect
        ) || null;
    }

    /**
     * Calcule le coût en mana basé sur le nombre de statues (4 × X, non focusable)
     */
    function calculateManaCost(statueCount) {
        return 4 * statueCount; // 4 mana par statue, non focusable
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    const existing224Effect = check224Effect(actor);

    // ===== DIALOG DE CONFIGURATION =====
    async function showConfigDialog() {
        const warningInfo = existing224Effect ?
            `<div style="color: #ff5722; font-weight: bold; margin: 10px 0; padding: 12px; background: #fff3e0; border-radius: 4px; border: 2px solid #ff5722;">
                ⚠️ ATTENTION : L'effet "224" est déjà actif sur Ora !
                <br><small>• Échec du jet de risque = <strong>PERTE DE CONSCIENCE</strong></small>
                <br><small>• Réussite du jet de risque = <strong>PERTE FORCÉE DU PROCHAIN TOUR</strong></small>
            </div>` :
            `<div style="color: #2e7d32; font-weight: bold; margin: 10px 0; padding: 8px; background: #e8f5e8; border-radius: 4px;">
                ✨ Première utilisation du sort 224
            </div>`;

        return new Promise(resolve => {
            const dialogContent = `
                <div style="padding: 15px; background: linear-gradient(135deg, #e3f2fd, #bbdefb); border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: #1565c0;">❄️ ${SPELL_CONFIG.name} - Sort de Glace</h3>
                        <p style="margin: 5px 0; color: #424242;"><strong>Lanceur:</strong> ${actor.name}</p>
                        <p style="margin: 5px 0; color: #424242;"><strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel}</p>
                        ${currentStance ? `<p style="margin: 5px 0; color: #424242;"><strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</p>` : ''}
                    </div>

                    ${warningInfo}

                    <div style="margin: 15px 0; padding: 10px; background: rgba(21,101,192,0.1); border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #1565c0;">🗿 Configuration des Statues</h4>
                        <p style="margin: 5px 0; font-size: 0.9em;">Choisissez le nombre de statues de glace à invoquer :</p>

                        <div style="margin: 10px 0;">
                            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                                <input type="radio" name="statueCount" value="1" checked style="margin-right: 8px;">
                                <span><strong>1 Statue</strong> - Derrière la cible | Coût: 4 mana | Jet de risque : 1d2</span>
                            </label>
                            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                                <input type="radio" name="statueCount" value="2" style="margin-right: 8px;">
                                <span><strong>2 Statues</strong> - Derrière + Gauche | Coût: 8 mana | Jet de risque : 1d3</span>
                            </label>
                            <label style="display: flex; align-items: center; margin-bottom: 8px; cursor: pointer;">
                                <input type="radio" name="statueCount" value="3" style="margin-right: 8px;">
                                <span><strong>3 Statues</strong> - Derrière + Gauche + Droite | Coût: 12 mana | Jet de risque : 1d4</span>
                            </label>
                        </div>

                        <div style="margin: 10px 0; padding: 8px; background: rgba(255,152,0,0.1); border-radius: 4px; border: 1px solid #ff9800;">
                            <strong>💰 Coût du sort :</strong> 4 mana × nombre de statues (NON FOCUSABLE)
                            <br><small style="color: #e65100;">⚠️ Ce sort ne bénéficie d'aucune réduction de coût, quelle que soit la stance</small>
                        </div>
                    </div>

                    <div style="margin: 15px 0; padding: 10px; background: rgba(255,255,255,0.3); border-radius: 4px;">
                        <h4 style="margin-top: 0; color: #1565c0;">📊 Statistiques</h4>
                        <p style="margin: 5px 0;"><strong>${SPELL_CONFIG.characteristicDisplay} :</strong> ${characteristicInfo.final}${characteristicInfo.injuries > 0 || characteristicInfo.effectBonus !== 0 ? ` <em>(${characteristicInfo.base}${characteristicInfo.injuries > 0 ? ` - ${characteristicInfo.injuries} blessures` : ''}${characteristicInfo.effectBonus !== 0 ? ` + ${characteristicInfo.effectBonus} effets` : ''})</em>` : ''}</p>
                    </div>

                    <div style="margin: 15px 0; padding: 10px; background: rgba(255,193,7,0.2); border-radius: 4px; border: 1px solid #ffc107;">
                        <h4 style="margin-top: 0; color: #f57c00;">⚠️ Mécaniques du Sort</h4>
                        <ul style="margin: 5px 0; padding-left: 20px; font-size: 0.9em;">
                            <li><strong>Jets d'attaque séparés</strong> pour chaque statue (Esprit sans bonus)</li>
                            <li><strong>Jet principal d'Ora</strong> (Esprit + niveau 6)</li>
                            <li><strong>Dégâts :</strong> 1d8 + Xd6 + Esprit + (X×Esprit/2)</li>
                            <li><strong>Jet de risque :</strong> 1d(X+1) - Réussite uniquement sur résultat "1"</li>
                            <li><strong>Conséquences :</strong> Perte défense/tour selon résultat</li>
                        </ul>
                    </div>
                </div>
            `;

            new Dialog({
                title: "❄️ 224 - Configuration du Sort",
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-snowflake"></i>',
                        label: "❄️ Lancer",
                        callback: (html) => {
                            const statueCount = parseInt(html.find('input[name="statueCount"]:checked').val());
                            resolve({ statueCount });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast"
            }, { width: 550 }).render(true);
        });
    }

    const configResult = await showConfigDialog();
    if (!configResult) {
        ui.notifications.info("❌ Sort 224 annulé.");
        return;
    }

    const { statueCount } = configResult;

    // Calculer le coût de mana basé sur le nombre de statues
    const manaCost = calculateManaCost(statueCount);

    // ===== CIBLAGE PRINCIPAL =====
    let target;
    try {
        const portal = new Portal()
            .origin(caster)
            .range(SPELL_CONFIG.targeting.range)
            .color(SPELL_CONFIG.targeting.color)
            .texture(SPELL_CONFIG.targeting.texture);

        target = await portal.pick();
        if (!target) {
            ui.notifications.info("❌ Ciblage annulé.");
            return;
        }
    } catch (error) {
        ui.notifications.error("Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.");
        return;
    }

    // ===== CALCULS GÉOMÉTRIQUES =====

    /**
     * Calcule les positions des statues basées sur l'axe Ora-cible
     */
    function calculateStatuePositions(casterPos, targetPos, statueCount) {
        const gridSize = canvas.grid.size;

        // Centrer les positions sur les cases
        const casterCenter = {
            x: casterPos.x + (gridSize / 2),
            y: casterPos.y + (gridSize / 2)
        };

        // Aligner targetPos sur la grille correctement - identifier d'abord le token à cette position
        const targetActor = getActorAtLocation(targetPos.x, targetPos.y);
        let targetCenter;

        if (targetActor && targetActor.token) {
            // Si on a trouvé un token, utiliser sa position centrée
            const tokenGridSize = targetActor.token.document.width * gridSize;
            targetCenter = {
                x: targetActor.token.document.x + (tokenGridSize / 2),
                y: targetActor.token.document.y + (tokenGridSize / 2)
            };
        } else {
            // Sinon, aligner sur la grille et centrer
            const targetGridX = Math.floor(targetPos.x / gridSize) * gridSize;
            const targetGridY = Math.floor(targetPos.y / gridSize) * gridSize;
            targetCenter = {
                x: targetGridX + (gridSize / 2),
                y: targetGridY + (gridSize / 2)
            };
        }

        // Calculer le vecteur directionnel de Ora vers la cible
        const dx = targetCenter.x - casterCenter.x;
        const dy = targetCenter.y - casterCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Vecteurs unitaires
        const unitX = distance > 0 ? dx / distance : 1; // Par défaut vers l'est
        const unitY = distance > 0 ? dy / distance : 0;

        // Vecteur perpendiculaire (pour gauche/droite) - Adapté au système FoundryVTT (Y vers le bas)
        const perpX = -unitY; // Perpendiculaire à gauche
        const perpY = unitX;   // Perpendiculaire

        const positions = [];

        // Position 1: Derrière la cible (toujours présente) - du côté d'Ora
        const behindX = targetCenter.x + (unitX * gridSize);
        const behindY = targetCenter.y + (unitY * gridSize);

        // Aligner sur la grille - utiliser floor pour aligner sur le coin supérieur gauche
        const behindGridX = Math.floor(behindX / gridSize) * gridSize;
        const behindGridY = Math.floor(behindY / gridSize) * gridSize;

        positions.push({
            x: behindGridX,
            y: behindGridY,
            gridX: behindGridX / gridSize,
            gridY: behindGridY / gridSize,
            type: "behind",
            imageIndex: 0,
            name: "Statue (Derrière)"
        });

        // Position 2: À gauche de la cible (si 2+ statues)
        if (statueCount >= 2) {
            const leftX = targetCenter.x + (perpX * gridSize);
            const leftY = targetCenter.y + (perpY * gridSize);

            const leftGridX = Math.floor(leftX / gridSize) * gridSize;
            const leftGridY = Math.floor(leftY / gridSize) * gridSize;

            positions.push({
                x: leftGridX,
                y: leftGridY,
                gridX: leftGridX / gridSize,
                gridY: leftGridY / gridSize,
                type: "left",
                imageIndex: 1,
                name: "Statue (Gauche)"
            });
        }

        // Position 3: À droite de la cible (si 3 statues)
        if (statueCount >= 3) {
            const rightX = targetCenter.x - (perpX * gridSize);
            const rightY = targetCenter.y - (perpY * gridSize);

            const rightGridX = Math.floor(rightX / gridSize) * gridSize;
            const rightGridY = Math.floor(rightY / gridSize) * gridSize;

            positions.push({
                x: rightGridX,
                y: rightGridY,
                gridX: rightGridX / gridSize,
                gridY: rightGridY / gridSize,
                type: "right",
                imageIndex: 2,
                name: "Statue (Droite)"
            });
        }

        return positions;
    }

    /**
     * Calcule la position devant la cible pour le saut d'Ora
     */
    function calculateOraJumpPosition(casterPos, targetPos) {
        const gridSize = canvas.grid.size;

        // Centrer les positions
        const casterCenter = {
            x: casterPos.x + (gridSize / 2),
            y: casterPos.y + (gridSize / 2)
        };

        // Utiliser la même logique que calculateStatuePositions pour la cohérence
        const targetActor = getActorAtLocation(targetPos.x, targetPos.y);
        let targetCenter;

        if (targetActor && targetActor.token) {
            // Si on a trouvé un token, utiliser sa position centrée
            const tokenGridSize = targetActor.token.document.width * gridSize;
            targetCenter = {
                x: targetActor.token.document.x + (tokenGridSize / 2),
                y: targetActor.token.document.y + (tokenGridSize / 2)
            };
        } else {
            // Sinon, aligner sur la grille et centrer
            const targetGridX = Math.floor(targetPos.x / gridSize) * gridSize;
            const targetGridY = Math.floor(targetPos.y / gridSize) * gridSize;
            targetCenter = {
                x: targetGridX + (gridSize / 2),
                y: targetGridY + (gridSize / 2)
            };
        }

        // Calculer le vecteur directionnel de Ora vers la cible
        const dx = targetCenter.x - casterCenter.x;
        const dy = targetCenter.y - casterCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Vecteur unitaire
        const unitX = distance > 0 ? dx / distance : 1;
        const unitY = distance > 0 ? dy / distance : 0;

        // Position devant la cible (côté opposé à la statue "derrière")
        const frontX = targetCenter.x - (unitX * gridSize);
        const frontY = targetCenter.y - (unitY * gridSize);

        // Aligner sur la grille - utiliser floor pour aligner sur le coin supérieur gauche
        const frontGridX = Math.floor(frontX / gridSize) * gridSize;
        const frontGridY = Math.floor(frontY / gridSize) * gridSize;

        return {
            x: frontGridX,
            y: frontGridY,
            gridX: frontGridX / gridSize,
            gridY: frontGridY / gridSize
        };
    }

    /**
     * Détecte l'acteur à une position donnée (réutilisé de combat-sanglant.js)
     */
    function getActorAtLocation(x, y) {
        const gridSize = canvas.grid.size;

        if (canvas.grid.type !== 0) {
            const targetGridX = Math.floor(x / gridSize);
            const targetGridY = Math.floor(y / gridSize);

            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                if (!(token.isVisible || token.isOwner || game.user.isGM)) return false;

                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);
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
            return targetToken.actor ? { name: targetToken.name, token: targetToken, actor: targetToken.actor } : null;
        } else {
            const tolerance = gridSize;
            const tokensAtLocation = canvas.tokens.placeables.filter(token => {
                if (!(token.isVisible || token.isOwner || game.user.isGM)) return false;

                const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
                const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
                const distance = Math.sqrt(Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2));
                return distance <= tolerance;
            });

            if (tokensAtLocation.length === 0) return null;

            const targetToken = tokensAtLocation[0];
            return targetToken.actor ? { name: targetToken.name, token: targetToken, actor: targetToken.actor } : null;
        }
    }

    // Calculer toutes les positions
    const casterPosition = { x: caster.document.x, y: caster.document.y };
    const statuePositions = calculateStatuePositions(casterPosition, target, statueCount);
    const oraJumpPosition = calculateOraJumpPosition(casterPosition, target);

    // Identifier la cible
    const targetActor = getActorAtLocation(target.x, target.y);
    const targetName = targetActor ? targetActor.name : "position cible";

    // ===== ANIMATIONS D'APPARITION DES STATUES =====

    /**
     * Joue l'animation d'apparition simultanée de toutes les statues
     */
    async function playStatueAppearAnimations() {
        const sequence = new Sequence();
        const gridSize = canvas.grid.size;

        // Pour chaque statue, ajouter l'animation d'apparition + nova de givre
        for (const [index, position] of statuePositions.entries()) {
            const statueImage = SPELL_CONFIG.statues.images[position.imageIndex];

            // Centrer la position d'animation
            const centerX = position.x + (gridSize / 2);
            const centerY = position.y + (gridSize / 2);

            // Animation de la statue (image persistante jusqu'à la fin des rayons)
            sequence.effect()
                .file(statueImage)
                .atLocation({ x: centerX, y: centerY })
                .scale(0.13) // Taille réduite pour correspondre à une statue
                .fadeIn(500)
                .fadeOut(500)
                .duration(7000) // Durée prolongée pour couvrir les rayons de glace (1000ms apparition + 2000ms rayons + 1000ms buffer)
                .name(`statue-${index}-${caster.id}`);

            // Animation d'explosion de glace (nova de givre)
            sequence.effect()
                .file(SPELL_CONFIG.animations.statueAppear)
                .atLocation({ x: centerX, y: centerY })
                .scale(0.6)
                .name(`statue-frost-${index}-${caster.id}`)
                .zIndex(1001); // Au-dessus de la statue
        }

        try {
            await sequence.play();
            console.log(`[224] Statue appearance animations completed for ${statueCount} statues`);
        } catch (error) {
            console.error("[224] Error playing statue animations:", error);
            ui.notifications.warn("⚠️ Erreur lors des animations de statues, mais le sort continue...");
        }
    }

    // Jouer les animations d'apparition des statues
    ui.notifications.info(`❄️ Invocation de ${statueCount} statue(s) de glace...`);
    await playStatueAppearAnimations();

    // ===== ANIMATIONS DES RAYONS DE GLACE ET SAUT D'ORA =====

    /**
     * Joue les rayons de glace des statues vers la cible, puis le saut et la frappe d'Ora
     */
    async function playIceBeamsAndOraAttack() {
        const sequence = new Sequence();
        const gridSize = canvas.grid.size;

        // Position centrale de la cible - utiliser la même logique que calculateStatuePositions
        const targetActor = getActorAtLocation(target.x, target.y);
        let targetCenter;

        if (targetActor && targetActor.token) {
            // Si on a trouvé un token, utiliser sa position centrée
            const tokenGridSize = targetActor.token.document.width * gridSize;
            targetCenter = {
                x: targetActor.token.document.x + (tokenGridSize / 2),
                y: targetActor.token.document.y + (tokenGridSize / 2)
            };
        } else {
            // Sinon, aligner sur la grille et centrer
            const targetGridX = Math.floor(target.x / gridSize) * gridSize;
            const targetGridY = Math.floor(target.y / gridSize) * gridSize;
            targetCenter = {
                x: targetGridX + (gridSize / 2),
                y: targetGridY + (gridSize / 2)
            };
        }

        // Position centrale de la position de saut d'Ora
        const oraJumpCenter = {
            x: oraJumpPosition.x + (gridSize / 2),
            y: oraJumpPosition.y + (gridSize / 2)
        };

        // Position actuelle d'Ora
        const oraCurrentCenter = {
            x: caster.document.x + (gridSize / 2),
            y: caster.document.y + (gridSize / 2)
        };

        // Phase 1: Rayons de glace des statues vers la cible
        for (const [index, position] of statuePositions.entries()) {
            const statueCenterX = position.x + (gridSize / 2);
            const statueCenterY = position.y + (gridSize / 2);

            sequence.effect()
                .file(SPELL_CONFIG.animations.iceBeam)
                .atLocation({ x: statueCenterX, y: statueCenterY })
                .stretchTo(targetCenter)
                .scale(0.6)
                .delay(1000) // Après l'apparition des statues
                .name(`ice-beam-${index}-${caster.id}`)
                .zIndex(1002);
        }

        // Impact des rayons de glace (une seule animation centrée sur la cible)
        sequence.effect()
            .file(SPELL_CONFIG.animations.iceImpact)
            .atLocation(targetCenter)
            .scale(0.4)
            .delay(1500) // 500ms après le début des ice beams
            .duration(5000) // Se termine avec les rayons
            .fadeOut(500)
            .fadeIn(500)
            .name(`ice-impact-${caster.id}`)
            .zIndex(1003);

        // Phase 2: Saut d'Ora (animation puff)
        sequence.effect()
            .file(SPELL_CONFIG.animations.jump)
            .atLocation(oraCurrentCenter)
            .scale(0.8)
            .delay(2700) // Après les rayons de glace + impact
            .name(`ora-jump-${caster.id}`)
            .zIndex(1004);

        // Phase 3: Coup de pied d'Ora vers la cible
        sequence.effect()
            .file(SPELL_CONFIG.animations.kick)
            .atLocation(oraJumpCenter)
            .stretchTo(targetCenter)
            .scale(1.2)
            .delay(3500) // Après le saut
            .name(`ora-kick-${caster.id}`)
            .zIndex(1005);

        // Impact final après le coup de pied
        sequence.effect()
            .file(SPELL_CONFIG.animations.finalImpact)
            .atLocation(targetCenter)
            .scale(1.0)
            .delay(3900) // Légèrement après le début du kick
            .name(`final-impact-${caster.id}`)
            .belowTokens()
            .zIndex(1006);

        try {
            const animationPromise = sequence.play();

            // Effectuer le saut d'Ora au bon moment (pendant l'animation)
            setTimeout(async () => {
                await executeOraJump();
            }, 2900); // Légèrement avant l'animation de coup de pied (ajusté pour le nouveau timing)

            await animationPromise;
            console.log(`[224] Ice beams and Ora attack animations completed`);
        } catch (error) {
            console.error("[224] Error playing ice beam/attack animations:", error);
            ui.notifications.warn("⚠️ Erreur lors des animations d'attaque, mais le sort continue...");
        }
    }

    /**
     * Effectue le saut d'Ora vers la position calculée
     */
    async function executeOraJump() {
        try {
            const originalMovementType = caster.document.movementAction;

            // Activer le mode de déplacement "Jump"
            await caster.document.update({ movementAction: 'jump' });

            // Effectuer le déplacement avec le mode saut
            const updates = {
                x: oraJumpPosition.x,
                y: oraJumpPosition.y
            };

            await caster.document.update(updates);

            // Restaurer le mode de déplacement original
            await caster.document.update({ movementAction: originalMovementType });

            console.log(`[224] Ora jumped to position (${oraJumpPosition.x}, ${oraJumpPosition.y})`);
            return true;
        } catch (error) {
            console.error("[224] Error during Ora's jump:", error);
            ui.notifications.error("Échec du saut d'Ora !");
            return false;
        }
    }

    // Jouer les animations des rayons et du saut d'Ora
    ui.notifications.info(`❄️ Les statues attaquent la cible... Ora se lance dans la bataille !`);
    await playIceBeamsAndOraAttack();

    // ===== SYSTÈME DE JETS MULTIPLES =====

    /**
     * Calcule et effectue tous les jets du sort
     */
    async function performAllRolls() {
        // Jets d'attaque séparés pour chaque statue (Esprit sans bonus)
        const statueRolls = [];
        for (let i = 0; i < statueCount; i++) {
            const statueRoll = new Roll(`${characteristicInfo.final}d7`);
            await statueRoll.evaluate({ async: true });
            statueRolls.push({
                index: i,
                position: statuePositions[i],
                roll: statueRoll,
                result: statueRoll.total
            });
        }

        // Jet d'attaque principal d'Ora (Esprit + niveau de sort x2)
        const levelBonus = 2 * SPELL_CONFIG.spellLevel;
        const oraAttackRoll = new Roll(`${characteristicInfo.final}d7 + ${levelBonus}`);
        await oraAttackRoll.evaluate({ async: true });

        // Calcul des dégâts d'Ora: 1d8 + Xd6 + Esprit + (X*Esprit/2)
        const bonusDamage = Math.floor(statueCount * characteristicInfo.final / 2);
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = characteristicInfo.final + bonusDamage + effectDamageBonus;

        let oraDamageRoll;
        if (currentStance === 'offensif') {
            // Dégâts maximisés en position offensive
            const maxBaseDamage = 8 + (statueCount * 6); // 1d8 max + Xd6 max
            const maxTotalDamage = maxBaseDamage + totalDamageBonus;
            oraDamageRoll = {
                total: maxTotalDamage,
                formula: `8 + ${statueCount * 6} + ${totalDamageBonus}`,
                isMaximized: true
            };
        } else {
            const damageFormula = `1d8 + ${statueCount}d6 + ${totalDamageBonus}`;
            oraDamageRoll = new Roll(damageFormula);
            await oraDamageRoll.evaluate({ async: true });
        }

        // Jet de risque: 1d(X+1), réussite uniquement sur résultat "1"
        const riskSides = statueCount + 1;
        const riskRoll = new Roll(`1d${riskSides}`);
        await riskRoll.evaluate({ async: true });
        const riskSuccess = riskRoll.total === 1; // Réussite uniquement sur 1

        return {
            statueRolls,
            oraAttackRoll,
            oraDamageRoll,
            riskRoll,
            riskSuccess,
            riskSides
        };
    }

    // Effectuer tous les jets
    ui.notifications.info(`❄️ Résolution des attaques multiples...`);
    const rollResults = await performAllRolls();

    // ===== CRÉATION DU MESSAGE DE CHAT =====

    /**
     * Crée le message de chat avec tous les résultats
     */
    function createCombinedChatFlavor() {
        const stanceNote = currentStance === 'offensif' ? ' <em>(MAXIMISÉ)</em>' : '';
        const riskStatusColor = rollResults.riskSuccess ? '#4CAF50' : '#F44336';
        const riskStatusText = rollResults.riskSuccess ? 'RÉUSSI (1)' : 'ÉCHEC';

        // Section des jets des statues
        const statueSection = rollResults.statueRolls.map(statue =>
            `<div style="font-size: 1.2em; margin: 2px 0;">
                ${statue.position.name}: <strong>${statue.result}</strong>
            </div>`
        ).join('');

        // Info sur les esquives
        const dodgeInfo = rollResults.statueRolls.length > 1 ?
            `<div style="font-size: 0.8em; color: #440000; margin-top: 4px;">
                ⚠️ La cible perd 1d d'esquive pour chaque attaque de statue échouée
            </div>` : '';

        return `
            <div style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); padding: 12px; border-radius: 8px; border: 2px solid #1565c0; margin: 8px 0; color: #000;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1565c0;">❄️ ${SPELL_CONFIG.name} - Sort de Glace</h3>
                    <div style="margin-top: 3px; font-size: 0.9em; color: #424242;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Niveau:</strong> ${SPELL_CONFIG.spellLevel} | <strong>Coût:</strong> ${manaCost} mana (4×${statueCount}, NON FOCUSABLE)
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(21,101,192,0.1); border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #1565c0; font-weight: bold; margin-bottom: 6px;">🗿 ATTAQUES DES STATUES (${statueCount})</div>
                    <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${targetName}</div>
                    ${statueSection}
                    ${dodgeInfo}
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(255,255,255,0.3); border-radius: 4px;">
                    <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">🎯 ATTAQUE D'ORA: ${rollResults.oraAttackRoll.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(${characteristicInfo.final}d7 + ${2 * SPELL_CONFIG.spellLevel})</div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(21,101,192,0.2); border-radius: 4px;">
                    <div style="font-size: 1.1em; color: #1565c0; margin-bottom: 6px;"><strong>❄️ Combo Glace + Coup de Pied${stanceNote}</strong></div>
                    <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${rollResults.oraDamageRoll.total}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">(1d8 + ${statueCount}d6 + Esprit + ${Math.floor(statueCount * characteristicInfo.final / 2)} bonus)</div>
                </div>

                <div style="text-align: center; margin: 8px 0; padding: 10px; background: rgba(0,0,0,0.1); border-radius: 4px;">
                    <div style="font-size: 1.1em; color: ${riskStatusColor}; font-weight: bold;">🎲 JET DE RISQUE: ${rollResults.riskRoll.total}/${rollResults.riskSides} - ${riskStatusText}</div>
                    <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                        ${existing224Effect ?
                (rollResults.riskSuccess ?
                    'Effet "224" actif : Perte forcée du prochain tour' :
                    'Effet "224" actif : PERTE DE CONSCIENCE !') :
                (rollResults.riskSuccess ?
                    'Perte de capacité de défense jusqu\'au prochain tour' :
                    'Perte du prochain tour')}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== COMBINED ROLL POUR LE CHAT =====

    // Construire le roll combiné pour l'affichage
    let combinedRollParts = [];

    // Ajouter les jets des statues
    rollResults.statueRolls.forEach((statue, index) => {
        combinedRollParts.push(`${characteristicInfo.final}d7`);
    });

    // Ajouter le jet d'attaque d'Ora
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;
    combinedRollParts.push(`${characteristicInfo.final}d7 + ${levelBonus}`);

    // Ajouter les dégâts si pas en stance offensive
    if (currentStance !== 'offensif') {
        const bonusDamage = Math.floor(statueCount * characteristicInfo.final / 2);
        const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
        const totalDamageBonus = characteristicInfo.final + bonusDamage + effectDamageBonus;
        combinedRollParts.push(`1d8 + ${statueCount}d6 + ${totalDamageBonus}`);
    }

    // Ajouter le jet de risque
    combinedRollParts.push(`1d${rollResults.riskSides}`);

    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Envoyer le message au chat
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: createCombinedChatFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== GESTION DES EFFETS ET CONSÉQUENCES =====

    /**
     * Applique l'effet de tracking "224" sur Ora
     */
    async function apply224TrackingEffect() {
        try {
            const effectData = {
                name: SPELL_CONFIG.effects.trackingEffect,
                icon: "icons/magic/water/heart-ice-freeze.webp",
                description: "Récupération du sort 224 - Double utilisation cause perte de conscience",
                origin: actor.uuid,
                duration: { seconds: 86400 }, // 24h
                flags: {
                    world: {
                        spell224Used: true
                    },
                    statuscounter: { value: 1, visible: true }
                }
            };

            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
            console.log("[224] Applied tracking effect to Ora");
            return true;
        } catch (error) {
            console.error("[224] Error applying tracking effect:", error);
            return false;
        }
    }


    // Appliquer les effets selon les résultats et la situation
    let statusMessage = "";

    if (existing224Effect) {
        // Double utilisation du sort
        if (rollResults.riskSuccess) {
            // Réussite mais effet 224 déjà actif = perte forcée du prochain tour
            statusMessage = "🟡 Effet '224' déjà actif - Réussite : Perte forcée du prochain tour + perte de défense";
            ui.notifications.warn(statusMessage);
        } else {
            statusMessage = "🔴 Effet '224' déjà actif - Échec : Ora perd CONSCIENCE !";
            ui.notifications.error(statusMessage);
        }
    } else {
        // Première utilisation du sort
        if (rollResults.riskSuccess) {
            // Réussite = perte de capacité de défense seulement
            statusMessage = "🟢 Jet de risque réussi : Ora perd sa capacité de défense jusqu'au prochain tour";
            ui.notifications.info(statusMessage);
        } else {
            statusMessage = "🟠 Jet de risque échoué : Ora perd son prochain tour + capacité de défense";
            ui.notifications.warn(statusMessage);
        }

        // Appliquer l'effet de tracking "224" pour les prochaines utilisations
        await apply224TrackingEffect();
    }

    // ===== MESSAGE FINAL ET STATISTIQUES =====
    const statueAttackSummary = rollResults.statueRolls.map(s => s.result).join(", ");
    const riskInfo = rollResults.riskSuccess ?
        `Réussite sur 1 (${rollResults.riskRoll.total}/${rollResults.riskSides})` :
        `Échec (${rollResults.riskRoll.total}/${rollResults.riskSides})`;

    const finalSummary = `❄️ Sort 224 exécuté !
Cible: ${targetName}
Statues (${statueCount}): [${statueAttackSummary}]
Ora: Attaque ${rollResults.oraAttackRoll.total}, Dégâts ${rollResults.oraDamageRoll.total}
Risque: ${riskInfo}
${statusMessage}`;

    ui.notifications.info(finalSummary);

    console.log(`[224] Spell 224 completed successfully`);
    console.log(`[224] Final results:`, {
        statueCount,
        targetName,
        statueAttacks: statueAttackSummary,
        oraAttack: rollResults.oraAttackRoll.total,
        oraDamage: rollResults.oraDamageRoll.total,
        riskResult: rollResults.riskSuccess ? 'Success' : 'Failure',
        existing224Effect: !!existing224Effect,
        statusMessage
    });

})();
