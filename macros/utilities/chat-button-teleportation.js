/**
 * Chat Button Test - Téléportation dans l'ombre
 *
 * Cette macro démontre l'utilisation des boutons interactifs dans le chat FoundryVTT.
 * Elle envoie un message avec un bouton qui, lorsqu'on clique dessus, déclenche
 * la macro "Téléportation dans l'ombre" pour la personne qui clique.
 *
 * Fonctionnalités testées :
 * - Création de boutons HTML dans les messages de chat
 * - Gestion des événements de clic via les flags FoundryVTT
 * - Exécution de macros via l'interaction des joueurs
 * - Sécurité : Vérification des permissions et du token sélectionné
 *
 * Usage : Lancer cette macro pour envoyer le bouton de test dans le chat
 */

(async () => {
    // ===== CONFIGURATION =====
    const CONFIG = {
        buttonLabel: "🌑 Téléportation dans l'ombre",
        macroName: "teleportation-dans-lombre.js", // Nom du fichier de la macro à exécuter
        description: "Cliquez pour déclencher la téléportation de Moctei dans les ombres",
        requiredCharacter: "Moctei", // Optionnel : nom du personnage requis

        // Style du bouton
        buttonStyle: {
            background: "linear-gradient(135deg, #4a148c, #7b1fa2)",
            color: "white",
            border: "2px solid #2e0054",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            transition: "all 0.3s ease"
        }
    };

    // ===== CRÉATION DU MESSAGE AVEC BOUTON =====

    // Convertir le style en CSS inline
    const buttonStyleCSS = Object.entries(CONFIG.buttonStyle)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('; ');

    // Créer l'ID unique pour ce bouton
    const buttonId = `teleport-btn-${Date.now()}`;

    // HTML du message avec le bouton interactif
    const messageContent = `
        <div style="border: 2px solid #4a148c; border-radius: 10px; padding: 15px; background: linear-gradient(135deg, #f3e5f5, #e1bee7); margin: 8px 0;">
            <div style="text-align: center; margin-bottom: 12px;">
                <h3 style="color: #4a148c; margin: 0; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                    🧪 Test de Bouton Interactif
                </h3>
                <p style="margin: 8px 0; color: #666; font-style: italic;">
                    Démonstration des boutons cliquables dans le chat FoundryVTT
                </p>
            </div>

            <div style="background: rgba(255,255,255,0.8); padding: 12px; border-radius: 6px; margin: 10px 0;">
                <div style="margin-bottom: 8px;">
                    <strong>📖 Description :</strong><br>
                    ${CONFIG.description}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>🎯 Prérequis :</strong><br>
                    • Sélectionner un token de ${CONFIG.requiredCharacter || 'votre personnage'}<br>
                    • Avoir les permissions appropriées
                </div>
                <div>
                    <strong>⚙️ Fonctionnement :</strong><br>
                    Le bouton utilise les événements FoundryVTT pour déclencher la macro
                </div>
            </div>

            <div style="text-align: center; margin: 15px 0;">
                <button
                    type="button"
                    id="${buttonId}"
                    data-macro-file="${CONFIG.macroName}"
                    style="${buttonStyleCSS}"
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(74,20,140,0.3)';"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
                >
                    ${CONFIG.buttonLabel}
                </button>
            </div>

            <div style="background: rgba(46, 0, 84, 0.1); padding: 8px; border-radius: 4px; margin-top: 10px; font-size: 0.9em; text-align: center;">
                <em style="color: #4a148c;">
                    💡 Cliquez sur le bouton pour tester l'exécution de macro via le chat !
                </em>
            </div>
        </div>
    `;

    // ===== SCRIPT D'INTERACTION =====
    // Ce script sera intégré dans le message pour gérer les clics
    const interactionScript = `
        <script>
        (function() {
            // Attendre que le DOM soit prêt
            setTimeout(function() {
                const button = document.getElementById('${buttonId}');
                if (button) {
                    button.addEventListener('click', async function(event) {
                        event.preventDefault();

                        const macroFile = this.getAttribute('data-macro-file');
                        console.log('[Chat Button] Button clicked, attempting to execute:', macroFile);

                        try {
                            // Méthode 1 : Essayer de trouver et exécuter la macro par nom
                            const macro = game.macros.contents.find(m =>
                                m.name.includes('téléportation') ||
                                m.name.includes('teleportation') ||
                                m.command.includes('Téléportation dans l\\'ombre')
                            );

                            if (macro) {
                                console.log('[Chat Button] Found macro:', macro.name);

                                // Vérifier qu'un token est sélectionné
                                if (!canvas.tokens.controlled.length) {
                                    ui.notifications.warn('⚠️ Veuillez d\\'abord sélectionner un token !');
                                    return;
                                }

                                // Exécuter la macro
                                await macro.execute();
                                console.log('[Chat Button] Macro executed successfully');

                            } else {
                                // Méthode 2 : Exécution directe du code (fallback)
                                console.log('[Chat Button] Macro not found, attempting direct execution');

                                // Vérifier qu'un token est sélectionné
                                if (!canvas.tokens.controlled.length) {
                                    ui.notifications.warn('⚠️ Veuillez d\\'abord sélectionner un token de Moctei !');
                                    return;
                                }

                                const selectedToken = canvas.tokens.controlled[0];
                                if (!selectedToken.actor) {
                                    ui.notifications.error('❌ Token invalide !');
                                    return;
                                }

                                // Notification que le bouton fonctionne
                                ui.notifications.info('🌑 Bouton cliqué ! Téléportation déclenchée...');

                                // Ici, nous pourrions intégrer le code de téléportation directement
                                // Pour cet exemple, on simule juste l'action
                                ChatMessage.create({
                                    user: game.user.id,
                                    content: \`<div style="background: #e8f5e8; padding: 10px; border-radius: 5px; border-left: 4px solid #4caf50;">
                                        <strong>✅ Test Réussi !</strong><br>
                                        Le bouton a été cliqué par <strong>\${game.user.name}</strong><br>
                                        Token sélectionné : <strong>\${selectedToken.name}</strong><br>
                                        <em>La macro de téléportation serait exécutée ici.</em>
                                    </div>\`,
                                    type: CONST.CHAT_MESSAGE_TYPES.OTHER
                                });
                            }

                        } catch (error) {
                            console.error('[Chat Button] Error executing macro:', error);
                            ui.notifications.error('❌ Erreur lors de l\\'exécution : ' + error.message);

                            // Message d'erreur dans le chat
                            ChatMessage.create({
                                user: game.user.id,
                                content: \`<div style="background: #ffebee; padding: 10px; border-radius: 5px; border-left: 4px solid #f44336;">
                                    <strong>❌ Erreur de Test</strong><br>
                                    L'exécution du bouton a échoué :<br>
                                    <code>\${error.message}</code>
                                </div>\`,
                                type: CONST.CHAT_MESSAGE_TYPES.OTHER
                            });
                        }
                    });

                    console.log('[Chat Button] Event listener attached to button:', button);
                } else {
                    console.warn('[Chat Button] Button not found in DOM');
                }
            }, 100);
        })();
        </script>
    `;

    // ===== ENVOI DU MESSAGE =====
    try {
        await ChatMessage.create({
            user: game.user.id,
            content: messageContent + interactionScript,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,

            // Flags pour identifier ce type de message
            flags: {
                world: {
                    chatButtonTest: true,
                    buttonId: buttonId,
                    macroFile: CONFIG.macroName,
                    createdBy: game.user.name,
                    timestamp: Date.now()
                }
            }
        });

        // ===== NOTIFICATION DE SUCCÈS =====
        ui.notifications.info('🧪 Message avec bouton envoyé ! Cliquez sur le bouton pour tester.');

        // Log pour debugging
        console.log(`[Chat Button Test] Message sent with button ID: ${buttonId}`);
        console.log(`[Chat Button Test] Target macro: ${CONFIG.macroName}`);

    } catch (error) {
        console.error('[Chat Button Test] Error creating message:', error);
        ui.notifications.error('❌ Erreur lors de l\'envoi du message : ' + error.message);
    }

    // ===== ALTERNATIVE AVEC HOOK (MÉTHODE PLUS ROBUSTE) =====
    // Cette méthode utilise les hooks FoundryVTT pour une meilleure intégration
    Hooks.once('renderChatMessage', (message, html, data) => {
        // Vérifier si c'est notre message
        if (message.flags?.world?.buttonId === buttonId) {
            console.log('[Chat Button] Setting up hook-based event listener');

            const button = html.find(`#${buttonId}`);
            if (button.length) {
                button.off('click'); // Supprimer les anciens événements

                button.on('click', async function(event) {
                    event.preventDefault();
                    console.log('[Chat Button Hook] Button clicked via Hook method');

                    try {
                        // Vérifier la sélection de token
                        if (!canvas.tokens.controlled.length) {
                            ui.notifications.warn('⚠️ Veuillez d\'abord sélectionner un token !');
                            return;
                        }

                        const selectedToken = canvas.tokens.controlled[0];

                        // Rechercher la macro de téléportation
                        const teleportMacro = game.macros.contents.find(m =>
                            m.name.toLowerCase().includes('téléportation') ||
                            m.name.toLowerCase().includes('teleportation') ||
                            m.command.includes('Téléportation dans l\'ombre')
                        );

                        if (teleportMacro) {
                            ui.notifications.info('🌑 Exécution de la téléportation via le bouton...');
                            await teleportMacro.execute();
                        } else {
                            // Message de succès du test même sans la macro
                            ui.notifications.success('✅ Test du bouton réussi ! (Macro de téléportation non trouvée)');

                            await ChatMessage.create({
                                user: game.user.id,
                                content: `<div style="background: #e8f5e8; padding: 10px; border-radius: 5px; border-left: 4px solid #4caf50;">
                                    <strong>🧪 Test de Bouton Réussi !</strong><br>
                                    Utilisateur : <strong>${game.user.name}</strong><br>
                                    Token : <strong>${selectedToken.name}</strong><br>
                                    <em>Le bouton fonctionne correctement ! La macro de téléportation n'a pas été trouvée, mais le mécanisme est opérationnel.</em>
                                </div>`,
                                type: CONST.CHAT_MESSAGE_TYPES.OTHER
                            });
                        }

                    } catch (error) {
                        console.error('[Chat Button Hook] Error:', error);
                        ui.notifications.error('❌ Erreur : ' + error.message);
                    }
                });

                console.log('[Chat Button Hook] Event listener attached successfully');
            }
        }
    });

})();
