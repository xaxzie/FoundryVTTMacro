/**
 * Nuages d'ombre - Moctei (Mage des Ombres)
 *
 * Moctei déploie une brume d'ombre sur plusieurs cases du terrain.
 *
 * - Coût : 4 points de mana (focalisable)
 * - Niveau de sort : 2
 * - Effet : Zone d'ombre sur le terrain
 * - Cibles : 8 cases de base + optionnel 1 case supplémentaire pour +1 mana (max 4 extensions)
 * - Portée : Portée visuelle via Portal
 *
 * MÉCANIQUES :
 * - Utilise Portal pour sélectionner les destinations
 * - Spawn des tokens "Zone d'ombre" avec Portal.spawn()
 * - Animation similaire à la téléportation avec tint noire
 * - Option d'extension avec coût en mana supplémentaire
 *
 * UTILISATION :
 * 1. Sélectionner le token de Moctei
 * 2. Choisir le nombre de cases d'extension (0 à 8)
 * 3. Utiliser Portal pour choisir les destinations (8 + 0-4 extensions = max 12 zones)
 * 4. Les zones d'ombre apparaissent avec les effets visuels appropriés
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Nuages d'ombre",
        manaCost: 4,
        spellLevel: 2,
        isFocusable: true,
        description: "Moctei déploie une brume d'ombre sur plusieurs cases du terrain",
        baseCases: 8, // Nombre de cases de base
        extensionCost: 2, // Coût par extension de 1 case
        extensionCases: 2, // Nombre de cases par extension
        maxExtensions: 4, // Nombre maximum d'extensions (4 cases supplémentaires)
        range: "Portée visuelle",
        duration: "Permanent jusqu'à dissipation",

        // Configuration des animations (basées sur simple-teleportation avec tint noir)
        animations: {
            projectile: {
                file: "jb2a.energy_strands.range.standard.purple.03",
                scale: 0.6,
                tint: "#1a0033" // Tint noir-violet pour l'ombre
            },
            arrival: {
                file: "jb2a_patreon.misty_step.01.purple",
                scale: 0.4,
                duration: 1500,
                fadeIn: 300,
                fadeOut: 500,
                tint: "#000000" // Tint noire pour l'ombre
            }
        },

        // Configuration Portal pour le ciblage
        portal: {
            texture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm",
            label: "Destination des Nuages d'ombre"
        },

        // Configuration pour spawn des tokens
        shadowZone: {
            actorId: "3klSiU91i21Co71t", // Actor "Zone d'ombre"
            tokenName: "Zone d'ombre"
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

    // ===== UTILS (stance, mana) =====
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

    const currentStance = getCurrentStance(actor);
    const manaInfo = getCurrentMana(actor);

    // ===== MENU DE CONFIGURATION =====
    async function showSpellConfiguration() {
        const stanceInfo = currentStance ?
            `<div style="color: #666; font-size: 0.9em; margin-bottom: 8px;">
                Position actuelle: <strong>${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</strong>
            </div>` : '';

        // Calculer le coût de base
        const baseManaCost = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ?
            0 : SPELL_CONFIG.manaCost;

        const manaStatus = manaInfo ?
            `<div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px; text-align: center; margin: 10px 0;">
                <strong>🔋 Mana Disponible :</strong> ${manaInfo.current}/${manaInfo.max} ${manaInfo.label}
            </div>` : '';

        const dialogContent = `
            <div style="padding: 10px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h2 style="color: #4a148c; margin: 0;">🌫️ ${SPELL_CONFIG.name}</h2>
                    <p style="font-style: italic; color: #666; margin: 5px 0;">
                        "${SPELL_CONFIG.description}"
                    </p>
                </div>

                ${stanceInfo}
                ${manaStatus}

                <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin: 10px 0;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 0.9em;">
                        <div><strong>Niveau :</strong> ${SPELL_CONFIG.spellLevel}</div>
                        <div><strong>Portée :</strong> ${SPELL_CONFIG.range}</div>
                        <div><strong>Durée :</strong> ${SPELL_CONFIG.duration}</div>
                    </div>
                </div>

                <div style="background: #f3e5f5; padding: 12px; border-radius: 6px; margin: 10px 0;">
                    <div><strong>💰 Coût de base :</strong> ${baseManaCost} mana ${currentStance === 'focus' ? '(Focus: GRATUIT)' : ''}</div>
                    <div><strong>🎯 Cases de base :</strong> ${SPELL_CONFIG.baseCases} cases</div>
                    <div style="margin-top: 8px;">
                        <strong>🔮 Extensions optionnelles :</strong><br>
                        +${SPELL_CONFIG.extensionCost} mana = +${SPELL_CONFIG.extensionCases} case supplémentaire (max ${SPELL_CONFIG.maxExtensions} extensions = ${SPELL_CONFIG.maxExtensions} cases)
                    </div>
                </div>

                <div style="margin: 15px 0;">
                    <label for="extensionCount" style="font-weight: bold; display: block; margin-bottom: 8px;">
                        Nombre d'extensions (0-${SPELL_CONFIG.maxExtensions}) :
                    </label>
                    <input type="number" id="extensionCount" value="0" min="0" max="${SPELL_CONFIG.maxExtensions}"
                           style="width: 80px; padding: 4px; margin-right: 10px;">
                    <span id="extensionCost" style="color: #666; font-size: 0.9em;">
                        Coût total : ${baseManaCost} mana
                    </span>
                    <div id="totalCases" style="color: #666; font-size: 0.9em; margin-top: 4px;">
                        Cases totales : ${SPELL_CONFIG.baseCases}
                    </div>
                </div>

                <div style="background: #fff3e0; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    <strong>⚡ Effet :</strong><br>
                    Moctei peut se téléporter gratuitement vers n'importe quelle zone d'ombre qu'il a créée.
                    Peu déclencher "animation de brume" sur une zone existante pour la rendre offensive
                </div>

                <div style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9em;">
                    Voulez-vous lancer ce sort ?
                </div>
            </div>
        `;

        return new Promise((resolve) => {
            const dialog = new Dialog({
                title: "🌫️ Configuration des Nuages d'ombre",
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const extensions = parseInt(html.find('#extensionCount').val()) || 0;
                            resolve({ extensions });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                render: html => {
                    html.find('.dialog-button').each(function() {
                        if ($(this).text().trim() === 'Lancer le Sort') {
                            $(this).css({
                                'background': '#4a148c',
                                'color': 'white',
                                'border': 'none'
                            });
                        }
                    });

                    // Mise à jour dynamique des coûts
                    html.find('#extensionCount').on('input', function() {
                        const extensions = parseInt($(this).val()) || 0;
                        const extensionCost = extensions * SPELL_CONFIG.extensionCost;
                        const totalCost = baseManaCost + extensionCost;
                        const totalCases = SPELL_CONFIG.baseCases + (extensions * SPELL_CONFIG.extensionCases);

                        html.find('#extensionCost').text(`Coût total : ${totalCost} mana`);
                        html.find('#totalCases').text(`Cases totales : ${totalCases}`);
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

    // Afficher le menu de configuration
    const spellConfig = await showSpellConfiguration();
    if (!spellConfig) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    const { extensions } = spellConfig;

    // Calculer les coûts et cases totales
    let actualManaCost = SPELL_CONFIG.manaCost + (extensions * SPELL_CONFIG.extensionCost);
    let focusReduction = false;

    if (SPELL_CONFIG.isFocusable && currentStance === 'focus') {
        // En focus, seul le coût de base est gratuit, les extensions restent payantes
        actualManaCost = extensions * SPELL_CONFIG.extensionCost;
        focusReduction = true;
    }

    const totalCases = SPELL_CONFIG.baseCases + (extensions * SPELL_CONFIG.extensionCases);

    // Affichage informatif du mana
    console.log(`[Moctei] Coût du sort: ${actualManaCost} mana (${extensions} extensions). Disponible: ${manaInfo?.current || 'N/A'}/${manaInfo?.max || 'N/A'}`);
    ui.notifications.info(`🌫️ Préparation des nuages d'ombre (${totalCases} zones)...`);

    // ===== SPAWN ET ANIMATIONS =====
    async function executeNuagesDombre() {
        const gridSize = canvas.grid.size;
        const casterCenter = {
            x: casterToken.document.x + (gridSize / 2),
            y: casterToken.document.y + (gridSize / 2)
        };

        // Vérifier que l'acteur "Zone d'ombre" existe
        const shadowActor = game.actors.get(SPELL_CONFIG.shadowZone.actorId);
        if (!shadowActor) {
            ui.notifications.error(`Acteur "Zone d'ombre" non trouvé (ID: ${SPELL_CONFIG.shadowZone.actorId}) !`);
            return false;
        }

        const spawnedTokens = [];

        // Spawner chaque zone d'ombre individuellement avec animations
        for (let i = 0; i < totalCases; i++) {
            try {
                ui.notifications.info(`🌫️ Sélectionnez la destination ${i + 1}/${totalCases} pour les nuages d'ombre...`);

                // Utiliser Portal.spawn (méthode statique) pour placer la zone
                const spawnResult = await Portal.spawn(shadowActor, {
                    hidden: false,
                    name: `${SPELL_CONFIG.shadowZone.tokenName} ${i + 1}`,
                    // Options de positionnement pour centrer le token
                    snap: true,          // Aligner sur la grille
                    center: true,        // Centrer sur la case
                    width: gridSize,     // Taille de la case
                    height: gridSize     // Taille de la case
                });

                console.log(`[Moctei] Portal.spawn result:`, spawnResult);

                let spawnToken = null;
                let spawnX, spawnY;

                // Gérer les différents formats de retour de Portal.spawn
                if (spawnResult) {
                    if (Array.isArray(spawnResult) && spawnResult.length > 0) {
                        // Si c'est un tableau, prendre le premier élément
                        spawnToken = spawnResult[0];
                    } else if (spawnResult.document || spawnResult.x !== undefined) {
                        // Si c'est directement un token ou un objet avec coordonnées
                        spawnToken = spawnResult;
                    }

                    if (spawnToken) {
                        // Essayer différentes façons d'accéder aux coordonnées
                        if (spawnToken.document && spawnToken.document.x !== undefined) {
                            spawnX = spawnToken.document.x;
                            spawnY = spawnToken.document.y;
                        } else if (spawnToken.x !== undefined) {
                            spawnX = spawnToken.x;
                            spawnY = spawnToken.y;
                        } else if (spawnToken.data && spawnToken.data.x !== undefined) {
                            spawnX = spawnToken.data.x;
                            spawnY = spawnToken.data.y;
                        }
                    }
                }

                if (spawnX !== undefined && spawnY !== undefined) {
                    // S'assurer que le token est centré sur la grille
                    const gridSnappedX = Math.floor(spawnX / gridSize) * gridSize;
                    const gridSnappedY = Math.floor(spawnY / gridSize) * gridSize;

                    // Calculer le centre de la case
                    const centerX = gridSnappedX + (gridSize / 2);
                    const centerY = gridSnappedY + (gridSize / 2);

                    console.log(`[Moctei] Token spawné à (${spawnX}, ${spawnY}) -> grille (${gridSnappedX}, ${gridSnappedY}) -> centre (${centerX}, ${centerY})`);

                    // Repositionner le token au centre de la case si nécessaire
                    if (spawnToken && (spawnX !== gridSnappedX || spawnY !== gridSnappedY)) {
                        try {
                            await spawnToken.document.update({
                                x: gridSnappedX,
                                y: gridSnappedY,
                                width: gridSize,
                                height: gridSize
                            });
                            console.log(`[Moctei] Token repositionné au centre de la grille`);
                        } catch (updateError) {
                            console.warn(`[Moctei] Impossible de repositionner le token:`, updateError);
                        }
                    }                    // Lancer l'animation basée sur la position du spawn
                    const seq = new Sequence();


                    // 2. Animation de projectile d'ombre vers la destination
                    seq.effect()
                        .file(SPELL_CONFIG.animations.projectile.file)
                        .atLocation(casterCenter)
                        .stretchTo({ x: centerX, y: centerY }, { onlyX: false })
                        .scale(SPELL_CONFIG.animations.projectile.scale)
                        .tint(SPELL_CONFIG.animations.projectile.tint)
                        .duration(1200)
                        .waitUntilFinished(-600);

                    // 3. Animation d'arrivée à la destination
                    seq.effect()
                        .file(SPELL_CONFIG.animations.arrival.file)
                        .atLocation({ x: centerX, y: centerY })
                        .scale(SPELL_CONFIG.animations.arrival.scale)
                        .duration(SPELL_CONFIG.animations.arrival.duration)
                        .fadeIn(SPELL_CONFIG.animations.arrival.fadeIn)
                        .fadeOut(SPELL_CONFIG.animations.arrival.fadeOut)
                        .tint(SPELL_CONFIG.animations.arrival.tint);

                    // Jouer l'animation pour cette zone
                    seq.play();

                    spawnedTokens.push(spawnToken);
                    console.log(`[Moctei] Zone d'ombre ${i + 1} créée et animée à (${spawnX}, ${spawnY}) -> centre (${centerX}, ${centerY})`);

                } else {
                    console.warn(`[Moctei] Impossible de récupérer les coordonnées du spawn pour la zone d'ombre ${i + 1}`);
                    console.warn(`[Moctei] SpawnResult structure:`, spawnResult);
                    ui.notifications.warn(`Échec de la récupération des coordonnées pour la zone d'ombre ${i + 1}. Animation ignorée.`);

                    // Ajouter quand même le token à la liste si il existe
                    if (spawnToken) {
                        spawnedTokens.push(spawnToken);
                    }
                }

            } catch (error) {
                console.error(`[Moctei] Erreur lors de la création de la zone d'ombre ${i + 1}:`, error);
                ui.notifications.error(`Erreur lors de la création de la zone ${i + 1}. Sort interrompu.`);
                break;
            }
        }

        return spawnedTokens.length > 0;
    }

    // Exécuter le sort
    ui.notifications.info("🌫️ Lancement des Nuages d'ombre...");

    const success = await executeNuagesDombre();

    // ===== MESSAGE RÉCAPITULATIF =====
    const spellExecutionInfo = {
        casterName: actor.name,
        spellName: SPELL_CONFIG.name,
        manaCost: actualManaCost,
        originalCost: SPELL_CONFIG.manaCost + (extensions * SPELL_CONFIG.extensionCost),
        focusReduction: focusReduction,
        extensions: extensions,
        totalCases: totalCases,
        baseCases: SPELL_CONFIG.baseCases,
        stance: currentStance,
        executionTime: new Date().toLocaleTimeString()
    };

    await sendSummaryMessage(spellExecutionInfo, success);

    // ===== MESSAGE FINAL =====
    async function sendSummaryMessage(info, success) {
        const successStyle = success ?
            "background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); border-color: #4caf50;" :
            "background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-color: #f44336;";

        const statusIcon = success ? "✅" : "❌";
        const statusText = success ? "Lancé" : "Échec";

        const focusInfo = info.focusReduction ?
            (info.manaCost === 0 ? ` ⚡ Focus (GRATUIT)` :
             info.extensions > 0 ? ` ⚡ Focus (Base gratuit, +${info.extensions * SPELL_CONFIG.extensionCost} extensions)` :
             ` ⚡ Focus (GRATUIT)`) : '';

        const extensionInfo = info.extensions > 0 ?
            `<div style="background: rgba(106, 27, 154, 0.1); padding: 8px; border-radius: 4px; margin: 8px 0; font-size: 0.9em;">
                🔮 <strong>Extensions :</strong> +${info.extensions} (${info.extensions * SPELL_CONFIG.extensionCases} case${info.extensions > 1 ? 's' : ''} supplémentaire${info.extensions > 1 ? 's' : ''})
                <br><small>Cases totales : ${info.baseCases} + ${info.extensions * SPELL_CONFIG.extensionCases} = ${info.totalCases}</small>
            </div>` : '';

        const content = `
            <div style="border: 2px solid; border-radius: 8px; padding: 12px; ${successStyle}">
                <div style="text-align: center;">
                    <h4 style="margin: 0; color: #333;">
                        ${statusIcon} ${info.spellName} - ${statusText}
                    </h4>
                    <div style="margin: 8px 0; font-size: 0.9em;">
                        💰 <strong>Coût :</strong> ${info.manaCost} mana${focusInfo}
                    </div>
                </div>

                ${extensionInfo}

                <div style="text-align: center; margin-top: 8px; font-size: 0.9em; font-style: italic; color: #555;">
                    ${success ?
                        `🌫️ ${info.totalCases} zones d'ombre déployées avec succès ! 🌫️` :
                        "⚠️ Échec de la création des zones d'ombre ⚠️"
                    }
                </div>

                ${success ? `
                <div style="background: rgba(74, 20, 140, 0.1); padding: 10px; border-radius: 4px; margin: 10px 0; border-left: 3px solid #4a148c;">
                    <div style="font-weight: bold; color: #4a148c; margin-bottom: 5px;">
                        🎮 Contrôle des Nuages d'Ombre
                    </div>
                    <div style="font-size: 0.85em; color: #333;">
                        <strong>📍 Déplacement :</strong> Moctei peut déplacer jusqu'à 8 nuages, 1 fois par tour<br>
                        <strong>📏 Portée :</strong> Maximum 6 cases de déplacement par nuage<br>
                        <strong>💰 Coût :</strong> 1 mana par tranche de 2 nuages déplacés (focusable)<br>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: casterToken }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }

    // ===== NOTIFICATION FINALE =====
    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const extensionInfo = extensions > 0 ? ` +${extensions} extensions` : '';

    if (success) {
        ui.notifications.info(`🌫️ ${SPELL_CONFIG.name} lancé !${stanceInfo} ${totalCases} zones créées${extensionInfo}. Coût : ${actualManaCost} mana.`);
    } else {
        ui.notifications.error(`❌ Échec du ${SPELL_CONFIG.name} !${stanceInfo}`);
    }

    console.log(`[Moctei] Nuages d'ombre completed: ${success ? 'success' : 'failure'}`);

})();
