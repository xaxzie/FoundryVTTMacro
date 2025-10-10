/**
 * Test Advanced Macros - Système de Queries
 *
 * Utilitaire de test pour vérifier le fonctionnement d'Advanced Macros
 * et de son système de queries pour l'exécution de macros avec privilèges.
 *
 * IMPORTANT: Advanced Macros N'A PAS d'API executeAsGM !
 * Il utilise un système de queries et de configuration de macros.
 *
 * UTILISATION :
 * 1. S'assurer qu'Advanced Macros est installé et activé
 * 2. Créer une macro de test configurée pour s'exécuter en tant que GM
 * 3. Lancer cette macro pour tester le système de queries
 *
 * TESTS INCLUS :
 * - Vérification de la disponibilité d'Advanced Macros
 * - Test du système de queries
 * - Création dynamique d'une macro de test
 * - Test d'exécution avec privilèges GM via user.query
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

        // Vérifier les queries disponibles
        const hasExecuteMacroQuery = CONFIG.queries && CONFIG.queries["advanced-macros.executeMacro"];

        return {
            available: true,
            version: advancedMacros.version || "Version inconnue",
            hasQueries: !!hasExecuteMacroQuery,
            userCanQuery: typeof game.user.query === 'function',
            currentUser: {
                name: game.user.name,
                isGM: game.user.isGM,
                id: game.user.id
            },
            activeGM: game.users.activeGM?.name || "Aucun GM actif"
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

    // Message d'information initial
    const initialMessage = {
        content: `<div style='border: 2px solid #1976d2; padding: 15px; border-radius: 5px; background: #e3f2fd;'>
                     <h3 style='color: #1976d2; margin: 0 0 10px 0;'>🧪 Test Advanced Macros - Début</h3>
                     <p><strong>Module:</strong> Advanced Macros v${macroCheck.version}</p>
                     <p><strong>Testeur:</strong> ${macroCheck.currentUser.name} ${macroCheck.currentUser.isGM ? '(GM)' : '(Joueur)'}</p>
                     <p><strong>GM Actif:</strong> ${macroCheck.activeGM}</p>
                     <p><strong>Système de queries:</strong> ${macroCheck.hasQueries ? '✅ Disponible' : '❌ Non disponible'}</p>
                     <p><strong>API user.query:</strong> ${macroCheck.userCanQuery ? '✅ Disponible' : '❌ Non disponible'}</p>
                     <hr style='margin: 10px 0;'>
                     <p style='font-style: italic;'>⚠️ Note: Advanced Macros n'a PAS d'API executeAsGM direct.<br>
                     Il utilise un système de configuration de macros et de queries.</p>
                  </div>`,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        speaker: { alias: "Advanced Macros Test" }
    };

    await ChatMessage.create(initialMessage);
    ui.notifications.info("🧪 Test Advanced Macros - Analyse en cours...");
    console.log("[AdvancedMacros Test] Advanced Macros check:", macroCheck);

    // ===== TEST 1: CRÉATION D'UNE MACRO DE TEST =====
    console.log("[AdvancedMacros Test] Running Test 1: Creating Test Macro");

    let testMacro = null;
    try {
        // Chercher d'abord si une macro de test existe déjà
        testMacro = game.macros.getName("Test Advanced Macros GM");

        if (!testMacro) {
            // Créer une nouvelle macro de test
            const macroData = {
                name: "Test Advanced Macros GM",
                type: "script",
                command: `
                    const testResult = {
                        success: true,
                        executedBy: game.user.name,
                        isGM: game.user.isGM,
                        timestamp: new Date().toLocaleString(),
                        message: "Macro exécutée avec succès"
                    };

                    const resultMessage = {
                        content: "<div style='border: 2px solid #4caf50; padding: 10px; border-radius: 5px; background: #e8f5e8;'>" +
                                 "<h3 style='color: #4caf50; margin: 0;'>✅ Macro Test - Succès</h3>" +
                                 "<p><strong>Exécutée par:</strong> " + testResult.executedBy + "</p>" +
                                 "<p><strong>Privilèges GM:</strong> " + (testResult.isGM ? "✅ Oui" : "❌ Non") + "</p>" +
                                 "<p><strong>Timestamp:</strong> " + testResult.timestamp + "</p>" +
                                 "</div>",
                        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
                        speaker: { alias: "Test Macro GM" }
                    };

                    await ChatMessage.create(resultMessage);
                    return testResult;
                `,
                folder: null,
                sort: 0,
                ownership: {
                    default: CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED
                },
                flags: {}
            };

            // Si on est GM, configurer la macro pour s'exécuter en tant que GM
            if (game.user.isGM) {
                macroData.flags["advanced-macros"] = {
                    runForSpecificUser: "GM"
                };
                macroData.ownership.default = CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED;
            }

            testMacro = await Macro.create(macroData);

            ui.notifications.success("✅ Macro de test créée");
            console.log("[AdvancedMacros Test] Created test macro:", testMacro);
        } else {
            ui.notifications.info("ℹ️ Macro de test trouvée (existante)");
            console.log("[AdvancedMacros Test] Found existing test macro:", testMacro);
        }

    } catch (error) {
        const errorMsg = `❌ Erreur création macro: ${error.message}`;
        ui.notifications.error(errorMsg);
        console.error("[AdvancedMacros Test] Macro creation error:", error);
    }

    // ===== TEST 2: SYSTÈME DE QUERIES =====
    console.log("[AdvancedMacros Test] Running Test 2: Query System Test");

    try {
        if (!macroCheck.hasQueries) {
            throw new Error("Système de queries non disponible");
        }

        if (!macroCheck.userCanQuery) {
            throw new Error("API user.query non disponible");
        }

        // Test direct du système de queries
        const queryData = {
            macro: testMacro ? testMacro.id : "test-id",
            scope: { testParam: "valeur de test" }
        };

        let queryResult;
        if (game.users.activeGM && !game.users.activeGM.isSelf) {
            // Envoyer query au GM actif
            queryResult = await game.users.activeGM.query("advanced-macros.executeMacro", queryData, { timeout: 10000 });
            ui.notifications.success("✅ Query envoyée au GM avec succès");
        } else if (testMacro) {
            // Exécuter directement la macro si on est GM ou pas de GM actif
            queryResult = await testMacro.execute({ testParam: "valeur de test" });
            ui.notifications.success("✅ Macro exécutée directement");
        } else {
            throw new Error("Aucune macro de test disponible");
        }

        console.log("[AdvancedMacros Test] Query result:", queryResult);

    } catch (error) {
        const errorMsg = `❌ Erreur système queries: ${error.message}`;
        ui.notifications.error(errorMsg);
        console.error("[AdvancedMacros Test] Query system error:", error);

        // Message d'erreur détaillé
        const errorMessage = {
            content: `<div style='border: 2px solid #f44336; padding: 15px; border-radius: 5px; background: #ffebee;'>
                         <h3 style='color: #f44336; margin: 0 0 10px 0;'>❌ Erreur Système Queries</h3>
                         <p><strong>Erreur:</strong> ${error.message}</p>
                         <p><strong>Cause possible:</strong> Système de queries non configuré correctement</p>
                         <hr style='margin: 10px 0;'>
                         <p><strong>Solutions:</strong></p>
                         <ul>
                            <li>Vérifier qu'un GM est connecté et actif</li>
                            <li>Vérifier que les macros sont créées par un GM</li>
                            <li>Configurer les permissions appropriées</li>
                         </ul>
                      </div>`,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: { alias: "Advanced Macros Test - Error" }
        };

        await ChatMessage.create(errorMessage);
    }

    // ===== TEST 3: VÉRIFICATION DES MACROS EXISTANTES =====
    console.log("[AdvancedMacros Test] Running Test 3: Existing Macros Check");

    try {
        const allMacros = game.macros.contents;
        const advancedMacrosConfigured = allMacros.filter(macro =>
            macro.getFlag("advanced-macros", "runForSpecificUser")
        );

        const macroDetails = advancedMacrosConfigured.map(macro => ({
            name: macro.name,
            runFor: macro.getFlag("advanced-macros", "runForSpecificUser"),
            canRunAsGM: macro.canRunAsGM,
            author: game.users.get(macro.author?.id)?.name || "Inconnu"
        }));

        const macroListMessage = {
            content: `<div style='border: 2px solid #ff9800; padding: 15px; border-radius: 5px; background: #fff3e0;'>
                         <h3 style='color: #ff9800; margin: 0 0 10px 0;'>📋 Macros Advanced Macros Configurées</h3>
                         <p><strong>Total macros:</strong> ${allMacros.length}</p>
                         <p><strong>Macros Advanced Macros:</strong> ${advancedMacrosConfigured.length}</p>
                         ${macroDetails.length > 0 ?
                    `<hr style='margin: 10px 0;'><strong>Détails:</strong><ul>` +
                    macroDetails.map(m =>
                        `<li><strong>${m.name}</strong> - ${m.runFor} (Auteur: ${m.author}) ${m.canRunAsGM ? '✅' : '❌'}</li>`
                    ).join('') +
                    `</ul>`
                    : '<p><em>Aucune macro Advanced Macros configurée</em></p>'
                }
                      </div>`,
            type: CONST.CHAT_MESSAGE_TYPES.OTHER,
            speaker: { alias: "Advanced Macros Test - Macros" }
        };

        await ChatMessage.create(macroListMessage);
        ui.notifications.info(`ℹ️ ${advancedMacrosConfigured.length} macros Advanced Macros trouvées`);
        console.log("[AdvancedMacros Test] Advanced Macros configured:", macroDetails);

    } catch (error) {
        console.error("[AdvancedMacros Test] Macros check error:", error);
    }

    // ===== RÉSUMÉ FINAL =====
    const finalMessage = {
        content: `<div style='border: 3px solid #9c27b0; padding: 20px; border-radius: 10px; background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);'>
                     <h2 style='color: #9c27b0; margin: 0 0 15px 0; text-align: center;'>🧪 Advanced Macros - Résumé Final</h2>
                     <div style='text-align: center; margin-bottom: 15px;'>
                        <p><strong>Module:</strong> Advanced Macros v${macroCheck.version}</p>
                        <p><strong>Testeur:</strong> ${macroCheck.currentUser.name}</p>
                        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
                     </div>
                     <div style='background: rgba(255,255,255,0.7); padding: 15px; border-radius: 5px;'>
                        <h3 style='color: #9c27b0; margin: 0 0 10px 0;'>📋 Découvertes importantes:</h3>
                        <p>⚠️ <strong>Pas d'API executeAsGM:</strong> Advanced Macros n'expose pas cette fonction</p>
                        <p>✅ <strong>Système de queries:</strong> Utilise user.query("advanced-macros.executeMacro")</p>
                        <p>⚙️ <strong>Configuration required:</strong> Les macros doivent être configurées par un GM</p>
                        <p>🔒 <strong>Sécurité:</strong> Seules les macros créées par GM peuvent s'exécuter avec privilèges</p>
                     </div>
                     <div style='text-align: center; margin-top: 15px; padding: 10px; background: rgba(156, 39, 176, 0.1); border-radius: 5px;'>
                        <strong style='color: #9c27b0;'>📖 Utiliser le système de macros configurées plutôt qu'une API directe</strong>
                     </div>
                  </div>`,
        type: CONST.CHAT_MESSAGE_TYPES.OTHER,
        speaker: { alias: "Advanced Macros Test - Final" }
    };

    await ChatMessage.create(finalMessage);
    ui.notifications.success("🎉 Test Advanced Macros terminé - Vérifiez le chat pour les détails");
    console.log("[AdvancedMacros Test] All tests completed. No direct executeAsGM API available.");

})();
