// World script for default door sounds and GM socket handlers
// World script for default door sounds and GM socket handlers
Hooks.on('ready', async () => {
    console.log("[DEBUG]FT World | Initializing default door sounds");
    await game.settings.register("world", "defaultDoorSound", {
        name: "Default Door Sound",
        scope: "world",
        config: false,
        type: String,
        default: "woodBasic"
    });
    await game.settings.set("world", "defaultDoorSound", "woodBasic");
    // Hook for new door creation
    Hooks.on('createWall', (document, data, options) => {
        if (document.door !== 0) {
            document.update({ doorSound: "woodBasic" });
        }
    });

    Hooks.on("renderChatMessage", (message, html, data) => {
        html.find(".teleport-moctei-button").click(async () => {
            const macro = game.macros.find(m => m.name === "Teleport");
            if (!macro) return ui.notifications.error("Macro 'Teleport' not found!");
            macro.execute();
        });
    });
    console.log("[DEBUG]FT World | default door sounds setted");
});

// Note: GM Socket Handlers for Effect Management are now handled by the custom-status-effects module

// ===== ALOHA AUTOMATIC THERMAL RESISTANCE SYSTEM =====
// Automatically manages Aloha's thermal resistance based on missing HP
// 1 resistance per 3 missing HP, displayed as a visible statusCounter effect

const AlohaResistanceManager = (() => {
    const CONFIG = {
        actorName: "Aloha",
        effectName: "Résistance Thermique",
        effectIcon: "icons/magic/fire/barrier-shield-explosion-yellow.webp",
        hpPath: "system.health",
        resistancePerMissingHP: 3, // 1 resistance per 3 missing HP
        resistanceValue: 1
    };

    // Check if current user should handle Aloha resistance management
    function shouldHandleResistance() {
        // Only the GM named "GM" handles this to avoid conflicts
        return game.user.name === "MJ" && game.user.isGM;
    }

    // Calculate resistance based on missing HP
    function calculateResistance(currentHP, maxHP) {
        if (typeof currentHP !== "number" || typeof maxHP !== "number") return 0;
        const missingHP = Math.max(0, maxHP - currentHP);
        return Math.floor(missingHP / CONFIG.resistancePerMissingHP) * CONFIG.resistanceValue;
    }

    // Get HP values from actor
    function getActorHP(actor) {
        try {
            const healthData = getProperty(actor, CONFIG.hpPath);
            if (healthData && typeof healthData.value === "number" && typeof healthData.max === "number") {
                return {
                    current: healthData.value,
                    max: healthData.max,
                    valid: true
                };
            }
        } catch (e) {
            console.error("[DEBUG] AlohaResistance: Error getting HP from actor:", e);
        }
        return { valid: false };
    }

    // Create or update the thermal resistance effect
    async function updateResistanceEffect(actor, resistance, currentHP, maxHP) {
        if (!actor) return;

        try {
            // Find existing effect
            const existingEffect = actor.effects.find(e => e.name === CONFIG.effectName);

            // If resistance is 0, remove the effect if it exists
            if (resistance === 0) {
                if (existingEffect) {
                    await existingEffect.delete();
                    console.log(`[DEBUG] AlohaResistance: Removed effect for ${actor.name} - No resistance needed`);
                }
                return;
            }

            const effectData = {
                name: CONFIG.effectName,
                icon: CONFIG.effectIcon,
                description: `Résistance thermique basée sur PV manquants : ${resistance} point(s) (PV ${currentHP}/${maxHP})`,
                duration: { seconds: 84600 },
                flags: {
                    world: {
                        autoAlohaResistance: true,
                        resistanceValue: resistance,
                        hpCurrent: currentHP,
                        hpMax: maxHP
                    },
                    statuscounter: {
                        value: resistance,
                        visible: true // Make it visible like Urgen's Book effect
                    }
                },
                changes: [] // No automatic system changes, just for display
            };

            if (existingEffect) {
                // Update only if resistance changed
                const currentResistance = existingEffect.flags?.statuscounter?.value || 0;
                if (currentResistance !== resistance) {
                    await existingEffect.update(effectData);
                    console.log(`[DEBUG] AlohaResistance: Updated effect for ${actor.name} - Resistance: ${resistance}`);
                }
            } else {
                // Create new effect
                await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                console.log(`[DEBUG] AlohaResistance: Created effect for ${actor.name} - Resistance: ${resistance}`);
            }
        } catch (error) {
            console.error("[DEBUG] AlohaResistance: Error updating effect:", error);
        }
    }

    // Main function to update Aloha's resistance
    async function updateAlohaResistance(actor) {
        if (!actor || actor.name !== CONFIG.actorName) return;

        const hpData = getActorHP(actor);
        if (!hpData.valid) {
            console.warn(`[DEBUG] AlohaResistance: Could not get valid HP data for ${actor.name}`);
            return;
        }

        const resistance = calculateResistance(hpData.current, hpData.max);
        await updateResistanceEffect(actor, resistance, hpData.current, hpData.max);
    }

    // Hook into actor updates
    Hooks.on("updateActor", async (actor, changes, options, userId) => {
        try {
            // Only handle if current user is the designated GM
            if (!shouldHandleResistance()) return;

            // Check if health changed
            if (changes.system?.health) {
                await updateAlohaResistance(actor);
            }
        } catch (e) {
            console.error("[DEBUG] AlohaResistance: updateActor hook error:", e);
        }
    });

    // Hook into token updates (in case HP is managed via token bars)
    Hooks.on("updateToken", async (tokenDoc, changes, options, userId) => {
        try {
            // Only handle if current user is the designated GM
            if (!shouldHandleResistance()) return;

            if (changes.actorData?.system?.health || changes.bar1 || changes.bar2) {
                const actor = tokenDoc.actor;
                if (actor) await updateAlohaResistance(actor);
            }
        } catch (e) {
            console.error("[DEBUG] AlohaResistance: updateToken hook error:", e);
        }
    });

    // Initial setup when world loads
    Hooks.once("ready", async () => {
        try {
            // Only initialize if current user is the designated GM
            if (!shouldHandleResistance()) {
                console.log(`[DEBUG] AlohaResistance: User ${game.user.name} is not the designated GM, skipping initialization`);
                return;
            }

            // Find Aloha and initialize resistance
            for (const actor of game.actors.contents) {
                if (actor.name === CONFIG.actorName) {
                    await updateAlohaResistance(actor);
                    console.log(`[DEBUG] AlohaResistance: Initialized for ${actor.name} by GM ${game.user.name}`);
                }
            }
        } catch (e) {
            console.error("[DEBUG] AlohaResistance: ready hook error:", e);
        }
    });

    console.log(`[DEBUG] AlohaResistance: System initialized for user ${game.user.name} (${game.user.isGM ? 'GM' : 'Player'})`);
})();

Hooks.on("createMacro", async (macro, options, userId) => {
    try {
        console.log("[DEBUG] createMacro hook fired", macro);

        // Résolution sûre de l'auteur — plusieurs emplacements possibles selon la version et la source
        const authorId =
            macro?.data?._source?.author ??
            macro?.data?.author ??
            macro?._source?.author ??
            macro?.author?.id ??
            userId ??
            game.user?.id;

        console.log("[DEBUG]Resolved authorId:", authorId);

        const user = game.users.get(authorId) || game.users.get(userId) || game.user;
        if (!user) {
            console.log("[DEBUG]No user found for macro author, aborting");
            return;
        }
        console.log("[DEBUG]Macro created by user:", user.name);

        // Cherche un dossier Macro existant pour cet utilisateur
        let folder = game.folders.find(f => f.type === "Macro" && f.name === user.name);
        console.log("[DEBUG]Found folder:", folder);

        // Crée le dossier si nécessaire
        if (!folder) {
            console.log("[DEBUG]No folder found, creating folder for user", user.name);
            folder = await Folder.create({ name: user.name, type: "Macro", parent: null });
            console.log("[DEBUG]Folder created:", folder);
        }

        // Assure que le macro est bien enregistré (id présent) avant update ; si besoin, attendre un court instant
        if (!macro?.id) {
            // normalement non nécessaire mais garde un fallback
            await new Promise(r => setTimeout(r, 50));
        }

        console.log("[DEBUG]Updating macro", macro.name, "to folder", folder.name);
        await macro.update({ folder: folder.id });
        console.log("[DEBUG]Macro updated successfully");
    } catch (err) {
        console.error("[DEBUG] createMacro hook error:", err);
    }
});

