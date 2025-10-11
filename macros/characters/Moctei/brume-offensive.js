/**
 * Brume offensive - Moctei (Mage des Ombres)
 *
 * Moctei déclenche une attaque offensive depuis ses zones d'ombre.
 *
 * - Coût : 2 points de mana (NON focalisable, NON offensif)
 * - Niveau de sort : 1
 * - Effet : Attaque à distance depuis les zones d'ombre
 * - Cibles : Ennemis présents dans les zones d'ombre de Moctei
 * - Toucher : Dextérité + niveau de sort
 * - Dégâts : 1d6 + 1/2 Dextérité (arrondi vers le bas)
 *
 * MÉCANIQUES :
 * - Détecte automatiquement toutes les "Zone d'ombre" sur le terrain
 * - Vérifie s'il y a d'autres tokens dans ces zones
 * - Propose de choisir quelle cible attaquer
 * - Animation d'attaque depuis la zone d'ombre vers la cible
 *
 * UTILISATION :
 * 1. Sélectionner le token de Moctei
 * 2. La macro détecte automatiquement les cibles disponibles
 * 3. Choisir la cible à attaquer dans le menu
 * 4. L'attaque se déclenche avec les effets visuels appropriés
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Brume offensive",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        manaCost: 2,
        spellLevel: 1,
        damageFormula: "1d6",
        isFocusable: false, // NON focalisable
        isOffensive: false, // NON offensif (pas de maximisation en stance offensive)
        description: "Moctei déclenche une attaque offensive depuis ses zones d'ombre",
        range: "Zones d'ombre existantes",
        duration: "Instantané",

        // Configuration des animations
        animations: {
            attack: {
                file: "jb2a.eldritch_blast.purple",
                scale: 0.8,
                tint: "#4a148c" // Violet sombre pour l'attaque d'ombre
            },
            hit: {
                file: "jb2a.impact.003.dark_purple",
                scale: 0.6,
                duration: 1000,
                fadeIn: 200,
                fadeOut: 400
            }
        },

        // Configuration pour la détection des zones d'ombre
        shadowZone: {
            tokenName: "Zone d'ombre",
            actorId: "3klSiU91i21Co71t" // Même ID que dans nuages-dombre.js
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le token de Moctei !");
        return;
    }

    const casterToken = canvas.tokens.controlled[0];
    const actor = casterToken.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== UTILS (stance, mana, caractéristiques) =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    function getCurrentMana(actor) {
        const manaResource = Object.values(actor.system.resources || {}).find(resource =>
            resource.label?.toLowerCase().includes('mana') ||
            resource.label?.toLowerCase().includes('mp') ||
            resource.label?.toLowerCase().includes('magie')
        );

        return manaResource ? {
            current: manaResource.value || 0,
            max: manaResource.max || 0,
            label: manaResource.label || "Mana"
        } : null;
    }

    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system?.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`Caractéristique ${characteristic} non trouvée sur la fiche de l'acteur.`);
            return null;
        }
        const base = attr.value || 3;

        // Gestion des blessures
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        // Bonus d'effets actifs
        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);

        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let total = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') total += flagValue;
        }
        return total;
    }

    const currentStance = getCurrentStance(actor);
    const manaInfo = getCurrentMana(actor);
    const dexteriteInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);

    if (!dexteriteInfo) return;

    // ===== DÉTECTION DES ZONES D'OMBRE ET CIBLES =====
    function detectShadowZonesWithTargets() {
        const gridSize = canvas.grid.size;
        const shadowZones = [];

        // Trouver toutes les "Zone d'ombre" sur le terrain
        const shadowTokens = canvas.tokens.placeables.filter(token =>
            token.name === SPELL_CONFIG.shadowZone.tokenName ||
            token.actor?.id === SPELL_CONFIG.shadowZone.actorId
        );

        console.log(`[Moctei] Trouvé ${shadowTokens.length} zones d'ombre sur le terrain`);

        for (const shadowToken of shadowTokens) {
            const shadowX = shadowToken.x;
            const shadowY = shadowToken.y;

            // Calculer la position de grille de la zone d'ombre
            const gridX = Math.floor(shadowX / gridSize);
            const gridY = Math.floor(shadowY / gridSize);

            // Chercher d'autres tokens dans la même case
            const targetsInZone = canvas.tokens.placeables.filter(token => {
                // Exclure la zone d'ombre elle-même et Moctei
                if (token.id === shadowToken.id || token.id === casterToken.id) {
                    return false;
                }

                // Vérifier la visibilité du token
                const isOwner = token.actor?.isOwner;
                const isVisible = token.visible;
                const isGM = game.user.isGM;

                if (!isOwner && !isVisible && !isGM) {
                    return false;
                }

                // Calculer la position de grille du token cible
                const tokenGridX = Math.floor(token.x / gridSize);
                const tokenGridY = Math.floor(token.y / gridSize);

                // Vérifier si le token occupe la même case que la zone d'ombre
                const tokenWidth = token.document.width;
                const tokenHeight = token.document.height;

                for (let dx = 0; dx < tokenWidth; dx++) {
                    for (let dy = 0; dy < tokenHeight; dy++) {
                        const tokenSquareX = tokenGridX + dx;
                        const tokenSquareY = tokenGridY + dy;

                        if (tokenSquareX === gridX && tokenSquareY === gridY) {
                            return true;
                        }
                    }
                }
                return false;
            });

            if (targetsInZone.length > 0) {
                shadowZones.push({
                    shadowToken: shadowToken,
                    targets: targetsInZone,
                    position: { x: shadowX, y: shadowY, gridX, gridY }
                });

                console.log(`[Moctei] Zone d'ombre à (${gridX}, ${gridY}) contient ${targetsInZone.length} cible(s): ${targetsInZone.map(t => t.name).join(', ')}`);
            }
        }

        return shadowZones;
    }

    const shadowZonesWithTargets = detectShadowZonesWithTargets();

    // ===== GESTION DU CAS OÙ AUCUNE CIBLE N'EST TROUVÉE =====
    if (shadowZonesWithTargets.length === 0) {
        ui.notifications.info("🌫️ Aucun ennemi n'est présent dans les zones d'ombre. Brume offensive impossible à déclencher.");
        return;
    }

    // ===== CRÉATION DE LA LISTE DES CIBLES DISPONIBLES =====
    const availableTargets = [];
    shadowZonesWithTargets.forEach(zone => {
        zone.targets.forEach(target => {
            availableTargets.push({
                token: target,
                shadowZone: zone.shadowToken,
                shadowPosition: zone.position,
                displayName: `${target.name} (Zone ${zone.position.gridX}, ${zone.position.gridY})`
            });
        });
    });

    console.log(`[Moctei] ${availableTargets.length} cible(s) disponible(s) pour la Brume offensive`);

    // ===== MENU DE SÉLECTION DE CIBLE =====
    async function showTargetSelection() {
        const stanceInfo = currentStance ?
            `<div style="color: #666; font-size: 0.9em; margin-bottom: 8px;">
                Position actuelle: <strong>${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</strong>
            </div>` : '';

        const manaStatus = manaInfo ?
            `<div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px; text-align: center; margin: 10px 0;">
                <strong>🔋 Mana Disponible :</strong> ${manaInfo.current}/${manaInfo.max} ${manaInfo.label}
            </div>` : '';

        // Créer la liste des cibles
        const targetList = availableTargets.map((target, index) =>
            `<option value="${index}">${target.displayName}</option>`
        ).join('');

        const dialogContent = `
            <div style="padding: 10px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h2 style="color: #4a148c; margin: 0;">⚔️ ${SPELL_CONFIG.name}</h2>
                    <p style="font-style: italic; color: #666; margin: 5px 0;">
                        "${SPELL_CONFIG.description}"
                    </p>
                </div>

                ${stanceInfo}
                ${manaStatus}

                <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 10px 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9em;">
                        <div><strong>Niveau :</strong> ${SPELL_CONFIG.spellLevel}</div>
                        <div><strong>Coût :</strong> ${SPELL_CONFIG.manaCost} mana</div>
                        <div><strong>Attaque :</strong> ${SPELL_CONFIG.characteristicDisplay}</div>
                        <div><strong>Dégâts :</strong> ${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay}/2</div>
                    </div>
                </div>

                <div style="background: #f3e5f5; padding: 12px; border-radius: 6px; margin: 10px 0;">
                    <div><strong>🎯 Cibles disponibles :</strong> ${availableTargets.length}</div>
                    <div style="margin-top: 8px;">
                        <label for="targetSelect" style="font-weight: bold; display: block; margin-bottom: 8px;">
                            Choisir la cible à attaquer :
                        </label>
                        <select id="targetSelect" style="width: 100%; padding: 4px;">
                            ${targetList}
                        </select>
                    </div>
                </div>

                <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong>⚡ Caractéristique d'attaque :</strong><br>
                    ${SPELL_CONFIG.characteristicDisplay}: ${dexteriteInfo.final}${dexteriteInfo.injuries > 0 || dexteriteInfo.effectBonus !== 0 ? ` (${dexteriteInfo.base}${dexteriteInfo.injuries > 0 ? ` - ${dexteriteInfo.injuries} blessures` : ''}${dexteriteInfo.effectBonus ? ` + ${dexteriteInfo.effectBonus} effets` : ''})` : ''}
                </div>

                <div style="background: #ffebee; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong>⚠️ Restrictions :</strong><br>
                    • Sort NON focalisable (coût fixe)<br>
                    • Sort NON offensif (pas de maximisation des dégâts)
                </div>

                <div style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9em;">
                    Voulez-vous déclencher la Brume offensive ?
                </div>
            </div>
        `;

        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: "⚔️ Brume offensive - Sélection de cible",
                content: dialogContent,
                buttons: {
                    attack: {
                        icon: '<i class="fas fa-sword"></i>',
                        label: "Attaquer",
                        callback: (html) => {
                            const targetIndex = parseInt(html.find('#targetSelect').val());
                            const selectedTarget = availableTargets[targetIndex];
                            resolve(selectedTarget);
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "attack",
                render: html => {
                    html.find('.dialog-button').each(function() {
                        if ($(this).text().trim() === 'Attaquer') {
                            $(this).css({
                                'background': '#d32f2f',
                                'color': 'white',
                                'border': 'none'
                            });
                        }
                    });
                },
                close: () => resolve(null)
            }, {
                width: 500,
                height: "auto"
            });
            dialog.render(true);
        });
    }

    // Afficher le menu de sélection de cible
    const selectedTarget = await showTargetSelection();
    if (!selectedTarget) {
        ui.notifications.info("Attaque annulée.");
        return;
    }

    console.log(`[Moctei] Cible sélectionnée: ${selectedTarget.token.name}`);

    // ===== CALCUL DES DÉGÂTS ET ATTAQUE =====
    const levelBonus = 2 * SPELL_CONFIG.spellLevel;
    const totalAttackDice = dexteriteInfo.final;

    // Calcul des dégâts: 1d6 + Dextérité/2 (arrondi vers le bas)
    const dexterityDamageBonus = Math.floor(dexteriteInfo.final / 2);
    const effectDamageBonus = getActiveEffectBonus(actor, 'damage');
    const totalDamageBonus = dexterityDamageBonus + effectDamageBonus;

    console.log(`[Moctei] Attaque: ${totalAttackDice}d7 + ${levelBonus}, Dégâts: ${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`);

    // ===== LANCEMENT DE L'ATTAQUE AVEC ANIMATIONS =====
    async function executeOffensiveAttack() {
        const gridSize = canvas.grid.size;

        // Position de la zone d'ombre (source de l'attaque)
        const shadowCenter = {
            x: selectedTarget.shadowPosition.x + (gridSize / 2),
            y: selectedTarget.shadowPosition.y + (gridSize / 2)
        };

        // Position de la cible
        const targetCenter = {
            x: selectedTarget.token.x + (selectedTarget.token.document.width * gridSize) / 2,
            y: selectedTarget.token.y + (selectedTarget.token.document.height * gridSize) / 2
        };

        // Animation d'attaque depuis la zone d'ombre vers la cible
        try {
            if (typeof Sequence !== 'undefined') {
                const seq = new Sequence();

                // 1. Effet d'attaque depuis la zone d'ombre
                seq.effect()
                    .file(SPELL_CONFIG.animations.attack.file)
                    .atLocation(shadowCenter)
                    .stretchTo(targetCenter)
                    .scale(SPELL_CONFIG.animations.attack.scale)
                    .tint(SPELL_CONFIG.animations.attack.tint)
                    .duration(1200)
                    .waitUntilFinished(-400);

                // 2. Effet d'impact sur la cible
                seq.effect()
                    .file(SPELL_CONFIG.animations.hit.file)
                    .atLocation(targetCenter)
                    .scale(SPELL_CONFIG.animations.hit.scale)
                    .duration(SPELL_CONFIG.animations.hit.duration)
                    .fadeIn(SPELL_CONFIG.animations.hit.fadeIn)
                    .fadeOut(SPELL_CONFIG.animations.hit.fadeOut);

                await seq.play();
            }
        } catch (error) {
            console.warn('[Moctei] Erreur lors de l\'animation Sequencer:', error);
        }

        return true;
    }

    // ===== CRÉATION DU ROLL COMBINÉ =====
    const combinedRollParts = [`${totalAttackDice}d7 + ${levelBonus}`, `${SPELL_CONFIG.damageFormula} + ${totalDamageBonus}`];
    const combinedRoll = new Roll(`{${combinedRollParts.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extraire les résultats
    const attackResult = combinedRoll.terms[0].results[0];
    const damageResult = combinedRoll.terms[0].results[1];

    // Exécuter l'attaque et les animations
    ui.notifications.info(`⚔️ Déclenchement de la Brume offensive contre ${selectedTarget.token.name}...`);
    const success = await executeOffensiveAttack();

    // ===== CRÉATION DU MESSAGE DE CHAT =====
    function createChatFlavor() {
        const injuryInfo = dexteriteInfo.injuries > 0 ?
            `<div style="color: #d32f2f; font-size: 0.9em; margin: 5px 0;">
                <i>⚠️ Ajusté pour blessures: Base ${dexteriteInfo.base} - ${dexteriteInfo.injuries} = ${dexteriteInfo.injuryAdjusted}</i>
            </div>` : '';

        const effectInfo = (dexteriteInfo.effectBonus !== 0 || effectDamageBonus !== 0) ?
            `<div style="color: #2e7d32; font-size: 0.9em; margin: 5px 0;">
                ${dexteriteInfo.effectBonus !== 0 ? `<div>✨ Bonus de ${SPELL_CONFIG.characteristicDisplay}: +${dexteriteInfo.effectBonus}</div>` : ''}
                ${effectDamageBonus !== 0 ? `<div>🗡️ Bonus de Dégâts: +${effectDamageBonus}</div>` : ''}
            </div>` : '';

        const attackDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #fff8e1; border-radius: 4px;">
                <div style="font-size: 1.4em; color: #f57f17; font-weight: bold;">🎯 ATTAQUE: ${attackResult.result}</div>
            </div>
        `;

        const damageDisplay = `
            <div style="text-align: center; margin: 8px 0; padding: 10px; background: #f5f5f5; border-radius: 4px;">
                <div style="font-size: 1.1em; color: #424242; margin-bottom: 6px;"><strong>⚔️ ${SPELL_CONFIG.name}</strong></div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Cible:</strong> ${selectedTarget.token.name}</div>
                <div style="font-size: 0.9em; margin-bottom: 4px;"><strong>Source:</strong> Zone d'ombre (${selectedTarget.shadowPosition.gridX}, ${selectedTarget.shadowPosition.gridY})</div>
                <div style="font-size: 1.4em; color: #1565c0; font-weight: bold;">💥 DÉGÂTS: ${damageResult.result}</div>
                <div style="font-size: 0.8em; color: #666; margin-top: 2px;">
                    (${SPELL_CONFIG.damageFormula} + ${SPELL_CONFIG.characteristicDisplay}/2 + bonus)
                </div>
                <div style="font-size: 0.8em; color: #666;">
                    Dégâts: ${damageResult.result} (${dexterityDamageBonus} de Dextérité/2${effectDamageBonus > 0 ? ` + ${effectDamageBonus} effets` : ''})
                </div>
            </div>
        `;

        return `
            <div style="background: linear-gradient(135deg, #f3e5f5, #e1bee7); padding: 12px; border-radius: 8px; border: 2px solid #4a148c; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #424242;">⚔️ ${SPELL_CONFIG.name}</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name} | <strong>Coût:</strong> ${SPELL_CONFIG.manaCost} mana (NON focalisable)
                        ${currentStance ? ` | <strong>Position:</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ''}
                    </div>
                </div>
                ${injuryInfo}
                ${effectInfo}
                ${attackDisplay}
                ${damageDisplay}
                <div style="background: rgba(74, 20, 140, 0.1); padding: 8px; border-radius: 4px; margin: 8px 0; text-align: center; font-size: 0.85em;">
                    🌫️ Attaque lancée depuis une zone d'ombre contrôlée par Moctei
                </div>
            </div>
        `;
    }

    // Envoyer le roll combiné au chat
    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: casterToken }),
        flavor: createChatFlavor(),
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== NOTIFICATION FINALE =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';

    if (success) {
        ui.notifications.info(`⚔️ ${SPELL_CONFIG.name} lancée !${stanceInfo} Cible: ${selectedTarget.token.name}. Attaque: ${attackResult.result}, Dégâts: ${damageResult.result}.`);
    } else {
        ui.notifications.error(`❌ Échec de la ${SPELL_CONFIG.name} !${stanceInfo}`);
    }

    console.log(`[Moctei] Brume offensive completed: ${success ? 'success' : 'failure'} against ${selectedTarget.token.name}`);

})();
