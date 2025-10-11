/**
 * Téléportation dans l'ombre avec Gestion de Mana - Moctei (Mage des Ombres)
 *
 * Cette macro gère la configuration, le coût en mana et fait appel à la macro "Teleport"
 * pour l'exécution de la téléportation elle-même.
 *
 * - Coût : 5 points de mana (focalisable)
 * - Niveau de sort : 1
 * - Effet : Téléportation du lanceur
 * - Portée : Portée visuelle via Portal
 *
 * FONCTIONNEMENT :
 * 1. Validation du lanceur et des prérequis
 * 2. Calcul du coût en mana (avec réduction focus si applicable)
 * 3. Menu de confirmation avec les détails du sort
 * 4. Appel de la macro "Teleport" pour l'exécution
 * 5. Message récapitulatif dans le chat
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        solo: {
            name: "Téléportation dans l'ombre",
            manaCost: 5,
            spellLevel: 1,
            isFocusable: true,
            description: "Moctei se téléporte instantanément en utilisant les ombres comme passage.",
            range: "Portée visuelle",
            duration: "Instantané",
            components: ["Mental", "Gestuel"],
            school: "Invocation/Déplacement"
        },
        transport: {
            name: "Transport dans l'ombre",
            manaCost: 6,
            spellLevel: 1,
            isFocusable: true, // Demi focus (réduction de moitié)
            focusReduction: 0.5, // Réduction de 50% au lieu de 25%
            description: "Moctei emmène un allié adjacent avec lui dans les ombres pour une téléportation commune.",
            range: "Portée visuelle + Allié adjacent",
            duration: "Instantané",
            components: ["Mental", "Gestuel", "Contact"],
            school: "Invocation/Déplacement"
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
        // Chercher les ressources de mana dans l'acteur
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

    // ===== DÉTECTION DES ALLIÉS ADJACENTS =====
    function getAdjacentAllies() {
        const gridSize = canvas.grid.size;
        const casterGridX = Math.floor(casterToken.document.x / gridSize);
        const casterGridY = Math.floor(casterToken.document.y / gridSize);

        const adjacentAllies = [];

        // Vérifier les 8 cases adjacentes
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue; // Ignorer la case du lanceur

                const checkX = casterGridX + dx;
                const checkY = casterGridY + dy;
                const worldX = checkX * gridSize;
                const worldY = checkY * gridSize;

                // Chercher des tokens sur cette case
                const tokensOnSquare = canvas.tokens.placeables.filter(token => {
                    const tokenGridX = Math.floor(token.document.x / gridSize);
                    const tokenGridY = Math.floor(token.document.y / gridSize);
                    return tokenGridX === checkX && tokenGridY === checkY;
                });

                for (const token of tokensOnSquare) {
                    if (token.actor &&
                        token.actor.hasPlayerOwner &&
                        token.id !== casterToken.id) {
                        adjacentAllies.push({
                            token: token,
                            actor: token.actor,
                            name: token.actor.name
                        });
                    }
                }
            }
        }

        return adjacentAllies;
    }

    const adjacentAllies = getAdjacentAllies();

    // ===== MENU DE CONFIGURATION INITIAL =====
    async function showSpellSelection() {
        const stanceInfo = currentStance ?
            `<div style="color: #666; font-size: 0.9em; margin-bottom: 8px;">
                Position actuelle: <strong>${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}</strong>
            </div>` : '';

        // Calculer les coûts pour chaque option
        const soloActualCost = (currentStance === 'focus' && SPELL_CONFIG.solo.isFocusable) ?
            0 : SPELL_CONFIG.solo.manaCost; // Focusable normal = GRATUIT en position Focus

        const transportActualCost = (currentStance === 'focus' && SPELL_CONFIG.transport.isFocusable) ?
            Math.max(1, Math.floor(SPELL_CONFIG.transport.manaCost * 0.5)) : SPELL_CONFIG.transport.manaCost; // Demi-focusable

        const manaStatus = manaInfo ?
            `<div style="background: rgba(255,255,255,0.7); padding: 8px; border-radius: 4px; text-align: center; margin: 10px 0;">
                <strong>🔋 Mana Disponible :</strong> ${manaInfo.current}/${manaInfo.max} ${manaInfo.label}
            </div>` : '';

        // Options d'alliés adjacents
        const allyOptions = adjacentAllies.length > 0 ?
            adjacentAllies.map((ally, index) =>
                `<option value="${index}">${ally.name}</option>`
            ).join('') : '';

        const transportOption = adjacentAllies.length > 0 ? `
            <div style="border: 1px solid #ddd; padding: 12px; border-radius: 6px; margin: 8px 0;">
                <input type="radio" id="transport" name="spellType" value="transport">
                <label for="transport" style="margin-left: 8px; font-weight: bold; color: #6a1b9a;">
                    🤝 ${SPELL_CONFIG.transport.name}
                </label>
                <div style="margin: 8px 0; font-size: 0.9em; color: #666;">
                    ${SPELL_CONFIG.transport.description}
                </div>
                <div style="background: #f3e5f5; padding: 8px; border-radius: 4px; margin: 8px 0;">
                    <strong>💰 Coût :</strong> ${transportActualCost} mana
                    ${currentStance === 'focus' ? `<span style="color: #2196f3;"> ⚡ (Demi Focus: ${SPELL_CONFIG.transport.manaCost} → ${transportActualCost})</span>` : ''}
                </div>
                <div style="margin: 8px 0;">
                    <label for="allySelect" style="font-weight: bold;">Choisir l'allié :</label>
                    <select id="allySelect" style="margin-left: 8px; padding: 4px;">
                        ${allyOptions}
                    </select>
                </div>
            </div>
        ` : `
            <div style="border: 1px solid #ccc; padding: 12px; border-radius: 6px; margin: 8px 0; background: #f5f5f5; opacity: 0.6;">
                <div style="font-weight: bold; color: #999;">
                    🤝 ${SPELL_CONFIG.transport.name}
                </div>
                <div style="margin: 8px 0; font-size: 0.9em; color: #999;">
                    Aucun allié adjacent disponible
                </div>
            </div>
        `;

        const dialogContent = `
            <div style="padding: 10px;">
                <div style="text-align: center; margin-bottom: 15px;">
                    <h2 style="color: #4a148c; margin: 0;">🌑 Sorts de Téléportation</h2>
                    <p style="font-style: italic; color: #666; margin: 5px 0;">
                        "Choisissez votre méthode de voyage dans les ombres..."
                    </p>
                </div>

                ${stanceInfo}
                ${manaStatus}

                <div style="margin: 15px 0;">
                    <div style="border: 1px solid #ddd; padding: 12px; border-radius: 6px; margin: 8px 0;">
                        <input type="radio" id="solo" name="spellType" value="solo" checked>
                        <label for="solo" style="margin-left: 8px; font-weight: bold; color: #4a148c;">
                            🌑 ${SPELL_CONFIG.solo.name}
                        </label>
                        <div style="margin: 8px 0; font-size: 0.9em; color: #666;">
                            ${SPELL_CONFIG.solo.description}
                        </div>
                        <div style="background: #f3e5f5; padding: 8px; border-radius: 4px; margin: 8px 0;">
                            <strong>💰 Coût :</strong> ${soloActualCost} mana
                            ${currentStance === 'focus' ? `<span style="color: #2196f3;"> ⚡ (Focus: GRATUIT)</span>` : ''}
                        </div>
                    </div>

                    ${transportOption}
                </div>

                <div style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9em;">
                    Sélectionnez le type de téléportation
                </div>
            </div>
        `;

        return new Promise((resolve) => {
            new Dialog({
                title: "🌑 Configuration de Téléportation",
                content: dialogContent,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-magic"></i>',
                        label: "Lancer le Sort",
                        callback: (html) => {
                            const selectedType = html.find('input[name="spellType"]:checked').val();
                            const selectedAllyIndex = html.find('#allySelect').val();

                            resolve({
                                type: selectedType,
                                allyIndex: selectedAllyIndex !== undefined ? parseInt(selectedAllyIndex) : null
                            });
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

                    // Activer/désactiver le sélecteur d'allié
                    html.find('input[name="spellType"]').change(function() {
                        const isTransport = $(this).val() === 'transport';
                        html.find('#allySelect').prop('disabled', !isTransport);
                    });

                    // Initialiser l'état
                    html.find('#allySelect').prop('disabled', true);
                },
                close: () => resolve(null)
            }, {
                width: 600,
                height: "auto"
            }).render(true);
        });
    }

    // Afficher le menu de sélection de sort
    const spellChoice = await showSpellSelection();
    if (!spellChoice) {
        ui.notifications.info("Sort annulé.");
        return;
    }

    // Déterminer la configuration selon le choix
    const isTransport = spellChoice.type === 'transport';
    const selectedSpell = isTransport ? SPELL_CONFIG.transport : SPELL_CONFIG.solo;
    const selectedAlly = (isTransport && spellChoice.allyIndex !== null) ?
        adjacentAllies[spellChoice.allyIndex] : null;

    // Calculer le coût effectif
    let actualManaCost = selectedSpell.manaCost;
    let focusReduction = false;

    if (selectedSpell.isFocusable && currentStance === 'focus') {
        if (isTransport) {
            // Demi focus pour Transport dans l'ombre
            actualManaCost = Math.max(1, Math.floor(selectedSpell.manaCost * selectedSpell.focusReduction));
        } else {
            // Focus normal pour Téléportation simple = GRATUIT
            actualManaCost = 0;
        }
        focusReduction = true;
    }

    // Affichage informatif du mana (pas de déduction automatique)
    console.log(`[Moctei] Coût du sort: ${actualManaCost} mana. Disponible: ${manaInfo?.current || 'N/A'}/${manaInfo?.max || 'N/A'}`);

    // ===== APPEL DE LA MACRO DE TÉLÉPORTATION =====
    ui.notifications.info("🌑 Lancement de la téléportation...");

    // Chercher la macro "Teleport"
    const teleportMacro = game.macros.contents.find(m =>
        m.name === "Teleport" ||
        m.name.toLowerCase().includes('teleport')
    );

    if (!teleportMacro) {
        ui.notifications.error('Macro "Teleport" non trouvée ! Assurez-vous qu\'elle existe dans vos macros.');
        return;
    }

    // Stocker les informations pour le message final
    const spellExecutionInfo = {
        casterName: actor.name,
        spellName: selectedSpell.name,
        manaCost: actualManaCost,
        originalCost: selectedSpell.manaCost,
        focusReduction: focusReduction,
        isTransport: isTransport,
        allyName: selectedAlly?.name || null,
        allyToken: selectedAlly?.token || null,
        stance: currentStance,
        executionTime: new Date().toLocaleTimeString()
    };

    try {
        // Exécuter la macro de téléportation pour Moctei
        await teleportMacro.execute();

        // Attendre un court délai puis envoyer le message récapitulatif unique
        setTimeout(async () => {
            await sendUnifiedMessage(spellExecutionInfo, true);
        }, 2000); // 2 secondes de délai

    } catch (error) {
        console.error("[Moctei] Erreur lors de l'exécution de la téléportation:", error);
        ui.notifications.error("Échec de l'exécution de la téléportation !");

        await sendUnifiedMessage(spellExecutionInfo, false);
    }

    // ===== MESSAGE UNIQUE PUBLIC =====
    async function sendUnifiedMessage(info, success) {
        const successStyle = success ?
            "background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); border-color: #4caf50;" :
            "background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%); border-color: #f44336;";

        const statusIcon = success ? "✅" : "❌";
        const statusText = success ? "Lancé" : "Échec";

        const focusInfo = info.focusReduction ?
            (info.manaCost === 0 ? ` ⚡ Focus (GRATUIT)` : ` ⚡ Focus (${info.originalCost} → ${info.manaCost})`) : '';



        // Si c'est un transport avec allié, inclure le bouton pour l'allié
        const transportSection = info.isTransport && info.allyName ? `
            <div style="background: rgba(106, 27, 154, 0.1); padding: 12px; border-radius: 4px; margin: 12px 0;">
                <div style="text-align: center; margin-bottom: 10px;">
                    <strong>🤝 Transport dans l'Ombre</strong>
                </div>
                <div style="background: rgba(255,255,255,0.7); padding: 10px; border-radius: 4px; margin: 8px 0; text-align: center;">
                    <strong>${info.allyName} :</strong><br>
                    Moctei souhaite se déplacer avec toi dans un endroit sombre, acceptes-tu ?
                </div>
                <div style="text-align: center; margin: 10px 0;">
                    <button
                        class="teleport-moctei-button"
                        style="background: #6a1b9a; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;"
                    >
                        ✨ Accepter le Transport
                    </button>
                </div>
                <div style="text-align: center; font-size: 0.9em; color: #666; font-style: italic;">
                    En acceptant, tu seras téléporté vers la destination choisie par Moctei
                </div>
            </div>
        ` : '';

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

                ${transportSection}

                <div style="text-align: center; margin-top: 8px; font-size: 0.9em; font-style: italic; color: #555;">
                    ${success ?
                        (info.isTransport ? "🌑 Moctei disparaît dans les ombres... 🌑" : "🌑 Téléportation réussie 🌑") :
                        "⚠️ Échec de la téléportation ⚠️"
                    }
                </div>
            </div>
        `;

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ token: casterToken }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER
        });
    }

})();
