// Script de téléportation exécuté avec privilèges GM
                            const { tokenId, destinationX, destinationY } = args[0];

                            const targetToken = canvas.tokens.get(tokenId);
                            if (!targetToken) {
                                return { success: false, error: "Token non trouvé" };
                            }

                            try {
                                // Sauvegarder le mode de déplacement actuel
                                const originalMovementType = targetToken.document.movementAction;

                                // Activer le mode de déplacement "Teleportation"
                                await targetToken.document.update({ movementAction: 'blink' });

                                // Effectuer le déplacement
                                await targetToken.document.update({
                                    x: destinationX,
                                    y: destinationY
                                });

                                // Restaurer le mode de déplacement original
                                await targetToken.document.update({ movementAction: originalMovementType });

                                return {
                                    success: true,
                                    message: "Téléportation d'allié réussie",
                                    tokenName: targetToken.name,
                                    position: { x: destinationX, y: destinationY }
                                };
                            } catch (err) {
                                return { success: false, error: err.message };
                            }
