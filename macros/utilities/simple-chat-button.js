/**
 * Simple Chat Button Example
 *
 * Version simplifiée pour démontrer le mécanisme de base des boutons dans le chat
 */

(async () => {
    // Configuration simple
    const buttonId = `simple-btn-${Date.now()}`;

    // Message avec bouton simple
    const content = `
        <div style="padding: 15px; border: 2px solid #4a148c; border-radius: 8px; background: #f3e5f5;">
            <h4 style="color: #4a148c; margin-top: 0;">🧪 Test Bouton Simple</h4>
            <p>Cliquez sur le bouton ci-dessous :</p>
            <div style="text-align: center; margin: 10px 0;">
                <button
                    id="${buttonId}"
                    style="background: #4a148c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;"
                >
                    🌑 Téléporter Moctei
                </button>
            </div>
        </div>
    `;

    // Envoyer le message
    const message = await ChatMessage.create({
        content: content,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });

    // Attacher l'événement via un Hook
    Hooks.once('renderChatMessage', (msg, html, data) => {
        if (msg.id === message.id) {
            html.find(`#${buttonId}`).click(async function() {
                // Vérifier qu'un token est sélectionné
                if (!canvas.tokens.controlled.length) {
                    ui.notifications.warn("Sélectionnez d'abord un token !");
                    return;
                }

                // Chercher la macro de téléportation
                const macro = game.macros.contents.find(m =>
                    m.name.toLowerCase().includes('teleportation') ||
                    m.command.includes('Téléportation dans l\'ombre')
                );

                if (macro) {
                    ui.notifications.info("🌑 Téléportation déclenchée !");
                    await macro.execute();
                } else {
                    ui.notifications.success("✅ Bouton fonctionne ! (Macro non trouvée)");

                    // Message de confirmation
                    ChatMessage.create({
                        content: `<div style="background: #e8f5e8; padding: 10px; border-radius: 5px;">
                            ✅ <strong>Test réussi !</strong><br>
                            Le bouton a été cliqué par ${game.user.name}
                        </div>`
                    });
                }
            });
        }
    });

    ui.notifications.info("📤 Message avec bouton envoyé !");

})();
