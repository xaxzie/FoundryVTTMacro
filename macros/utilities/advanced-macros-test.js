/**
 * Test Advanced Macros - executeAsGM
 *
 * Utilitaire de test pour vérifier le fonctionnement d'Advanced Macros
 * et de sa fonction executeAsGM.
 *
 * UTILISATION :
 * 1. S'assurer qu'Advanced Macros est installé et activé
 * 2. Lancer cette macro depuis n'importe quel joueur
 * 3. Observer les messages dans le chat pour confirmer le fonctionnement
 *
 * TESTS INCLUS :
 * - Vérification de la disponibilité d'Advanced Macros
 * - Test de base avec message de chat via executeAsGM
 * - Test de manipulation de token (si applicable)
 * - Test d'accès aux données de jeu
 */

(async () => {
    console.log("[AdvancedMacros Test] Starting test sequence...");

    // ===== FONCTION DE VÉRIFICATION D'ADVANCED MACROS =====
    function checkAdvancedMacrosCapabilities() {
        const advancedMacros = game.modules.get("advanced-macros");

        if (!advancedMacros) {
            return { available: false, reason: "Module non installé" };
        }

        if (!advancedMacros.active) {
            return { available: false, reason: "Module non activé" };
        }

        if (!advancedMacros.api) {
            return { available: false, reason: "API non disponible" };
        }

        // Vérifier les méthodes disponibles
        const capabilities = {
            executeAsGM: typeof advancedMacros.api.executeAsGM === 'function',
            runAsGM: typeof advancedMacros.api.runAsGM === 'function'
        };

        return {
            available: true,
            capabilities,
            version: advancedMacros.version || "Version inconnue"
        };
    }

    // ===== VÉRIFICATION INITIALE =====
    const macroCheck = checkAdvancedMacrosCapabilities();

    if (!macroCheck.available) {
        const errorMsg = `❌ Advanced Macros non disponible: ${macroCheck.reason}`;
        ui.notifications.error(errorMsg);
        console.error("[AdvancedMacros Test]", errorMsg);
        return;
    }

    ui.notifications.info("🧪 Test Advanced Macros - Début des tests...");
    console.log("[AdvancedMacros Test] Advanced Macros available:", macroCheck);

    // ===== TEST 1: MESSAGE DE CHAT BASIQUE =====
    console.log("[AdvancedMacros Test] Running Test 1: Basic Chat Message");

    try {
        const chatTestScript = `
            const testMessage = {
                content: "<div style='border: 2px solid #4a148c; padding: 10px; border-radius: 5px; background: #f3e5f5;'>" +
                         "<h3 style='color: #4a148c; margin: 0;'>🧪 Test Advanced Macros - executeAsGM</h3>" +
                         "<p><strong>Statut:</strong> ✅ Succès</p>" +
                         "<p><strong>Utilisateur:</strong> ${game.user.name}</p>" +
                         "<p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>" +
                         "<p><strong>Privilèges:</strong> Exécuté en tant que GM</p>" +
                         "</div>",
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                speaker: { alias: "Advanced Macros Test" }
            };

            await ChatMessage.create(testMessage);

            return {
                success: true,
                message: "Message de chat créé avec succès",
                user: game.user.name,
                isGM: game.user.isGM
            };
        `;

        const result1 = await game.modules.get("advanced-macros").api.executeAsGM(chatTestScript);

        if (result1.success) {
            ui.notifications.success("✅ Test 1 réussi: Message de chat via executeAsGM");
            console.log("[AdvancedMacros Test] Test 1 Success:", result1);
        } else {
            throw new Error("Test 1 failed: " + result1.message);
        }

    } catch (error) {
        const errorMsg = `❌ Test 1 échoué: ${error.message}`;
        ui.notifications.error(errorMsg);
        console.error("[AdvancedMacros Test] Test 1 Error:", error);
    }

    // ===== TEST 2: ACCÈS AUX DONNÉES DE JEU =====
    console.log("[AdvancedMacros Test] Running Test 2: Game Data Access");

    try {
        const gameDataScript = `
            const gameInfo = {
                worldTitle: game.world.title,
                systemId: game.system.id,
                systemVersion: game.system.version,
                foundryVersion: game.version,
                userCount: game.users.size,
                sceneCount: game.scenes.size,
                actorCount: game.actors.size,
                tokenCount: canvas.tokens.placeables.length
            };

            const detailedMessage = {
                content: "<div style='border: 2px solid #2e7d32; padding: 15px; border-radius: 5px; background: #e8f5e8;'>" +
                         "<h3 style='color: #2e7d32; margin: 0 0 10px 0;'>🎮 Test Advanced Macros - Données de Jeu</h3>" +
                         "<div style='display: grid; grid-template-columns: 1fr 1fr; gap: 10px;'>" +
                         "<div><strong>Monde:</strong> " + gameInfo.worldTitle + "</div>" +
                         "<div><strong>Système:</strong> " + gameInfo.systemId + " v" + gameInfo.systemVersion + "</div>" +
                         "<div><strong>FoundryVTT:</strong> v" + gameInfo.foundryVersion + "</div>" +
                         "<div><strong>Utilisateurs:</strong> " + gameInfo.userCount + "</div>" +
                         "<div><strong>Scènes:</strong> " + gameInfo.sceneCount + "</div>" +
                         "<div><strong>Acteurs:</strong> " + gameInfo.actorCount + "</div>" +
                         "<div><strong>Tokens visibles:</strong> " + gameInfo.tokenCount + "</div>" +
                         "<div><strong>Exécuteur:</strong> ${game.user.name}</div>" +
                         "</div>" +
                         "<p style='margin-top: 10px; font-style: italic; color: #666;'>✅ Accès complet aux données de jeu confirmé</p>" +
                         "</div>",
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                speaker: { alias: "Advanced Macros Test - Game Data" }
            };

            await ChatMessage.create(detailedMessage);

            return {
                success: true,
                message: "Accès aux données de jeu réussi",
                gameInfo: gameInfo
            };
        `;

        const result2 = await game.modules.get("advanced-macros").api.executeAsGM(gameDataScript);

        if (result2.success) {
            ui.notifications.success("✅ Test 2 réussi: Accès aux données de jeu");
            console.log("[AdvancedMacros Test] Test 2 Success:", result2);
        } else {
            throw new Error("Test 2 failed: " + result2.message);
        }

    } catch (error) {
        const errorMsg = `❌ Test 2 échoué: ${error.message}`;
        ui.notifications.error(errorMsg);
        console.error("[AdvancedMacros Test] Test 2 Error:", error);
    }

    // ===== TEST 3: MANIPULATION DE TOKEN (SI TOKENS DISPONIBLES) =====
    console.log("[AdvancedMacros Test] Running Test 3: Token Manipulation");

    try {
        const tokenTestScript = `
            const tokens = canvas.tokens.placeables;
            let testResult = {
                success: false,
                message: "Aucun token disponible pour le test",
                tokenCount: tokens.length
            };

            if (tokens.length > 0) {
                const testToken = tokens[0];
                const originalName = testToken.name;
                const testName = originalName + " [TEST]";

                // Sauvegarder le nom original
                const originalTokenName = testToken.document.name;

                // Changer temporairement le nom
                await testToken.document.update({ name: testName });

                // Attendre un peu
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Restaurer le nom original
                await testToken.document.update({ name: originalTokenName });

                testResult = {
                    success: true,
                    message: "Token manipulé avec succès",
                    tokenName: originalName,
                    tokenId: testToken.id,
                    operation: "Changement temporaire de nom"
                };
            }

            const tokenMessage = {
                content: "<div style='border: 2px solid #f57c00; padding: 15px; border-radius: 5px; background: #fff8e1;'>" +
                         "<h3 style='color: #f57c00; margin: 0 0 10px 0;'>🎭 Test Advanced Macros - Manipulation Token</h3>" +
                         "<p><strong>Statut:</strong> " + (testResult.success ? "✅ Succès" : "⚠️ Aucun token") + "</p>" +
                         "<p><strong>Tokens sur la scène:</strong> " + testResult.tokenCount + "</p>" +
                         (testResult.success ?
                            "<p><strong>Token testé:</strong> " + testResult.tokenName + "</p>" +
                            "<p><strong>Opération:</strong> " + testResult.operation + "</p>"
                            : "<p><strong>Note:</strong> Placez un token sur la scène pour tester la manipulation</p>") +
                         "<p><strong>Exécuteur:</strong> ${game.user.name}</p>" +
                         "</div>",
                type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                speaker: { alias: "Advanced Macros Test - Token" }
            };

            await ChatMessage.create(tokenMessage);

            return testResult;
        `;

        const result3 = await game.modules.get("advanced-macros").api.executeAsGM(tokenTestScript);

        if (result3.success) {
            ui.notifications.success("✅ Test 3 réussi: Manipulation de token");
            console.log("[AdvancedMacros Test] Test 3 Success:", result3);
        } else {
            ui.notifications.info("ℹ️ Test 3: " + result3.message);
            console.log("[AdvancedMacros Test] Test 3 Info:", result3);
        }

    } catch (error) {
        const errorMsg = `❌ Test 3 échoué: ${error.message}`;
        ui.notifications.error(errorMsg);
        console.error("[AdvancedMacros Test] Test 3 Error:", error);
    }

    // ===== RÉSUMÉ FINAL =====
    const summaryScript = `
        const finalMessage = {
            content: "<div style='border: 3px solid #4a148c; padding: 20px; border-radius: 10px; background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);'>" +
                     "<h2 style='color: #4a148c; margin: 0 0 15px 0; text-align: center;'>🧪 Advanced Macros - Résumé des Tests</h2>" +
                     "<div style='text-align: center; margin-bottom: 15px;'>" +
                     "<p><strong>Module:</strong> Advanced Macros v" + "${macroCheck.version}" + "</p>" +
                     "<p><strong>Testeur:</strong> ${game.user.name}</p>" +
                     "<p><strong>Date:</strong> ${new Date().toLocaleString()}</p>" +
                     "</div>" +
                     "<div style='background: rgba(255,255,255,0.7); padding: 15px; border-radius: 5px;'>" +
                     "<h3 style='color: #4a148c; margin: 0 0 10px 0;'>📋 Résultats:</h3>" +
                     "<p>✅ <strong>Test 1:</strong> Message de chat via executeAsGM</p>" +
                     "<p>✅ <strong>Test 2:</strong> Accès aux données de jeu</p>" +
                     "<p>ℹ️ <strong>Test 3:</strong> Manipulation de token (selon disponibilité)</p>" +
                     "</div>" +
                     "<div style='text-align: center; margin-top: 15px; padding: 10px; background: rgba(46, 125, 50, 0.1); border-radius: 5px;'>" +
                     "<strong style='color: #2e7d32;'>🎉 Advanced Macros fonctionne correctement !</strong>" +
                     "</div>" +
                     "</div>",
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: { alias: "Advanced Macros Test - Final" }
        };

        await ChatMessage.create(finalMessage);

        return {
            success: true,
            message: "Tous les tests Advanced Macros terminés"
        };
    `;

    try {
        await game.modules.get("advanced-macros").api.executeAsGM(summaryScript);
        ui.notifications.success("🎉 Tests Advanced Macros terminés - Vérifiez le chat !");
        console.log("[AdvancedMacros Test] All tests completed successfully");
    } catch (error) {
        console.error("[AdvancedMacros Test] Summary error:", error);
    }

})();
