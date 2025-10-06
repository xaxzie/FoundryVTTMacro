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
console.log("[DEBUG]FT World | default door sounds setted");
});

// Note: GM Socket Handlers for Effect Management are now handled by the custom-status-effects module

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
