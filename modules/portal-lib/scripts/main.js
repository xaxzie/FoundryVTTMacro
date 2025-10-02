import {initConfig} from "./config.js";
import {registerSettings} from "./settings.js";
import {Portal} from "./portal.js";

export const MODULE_ID = "portal-lib";

globalThis.Portal = Portal;

Hooks.on("init", () => {
    console.log(`[Portal-Lib] Module initializing - version with Shift key free positioning`);
    initConfig();
    registerSettings();
});

Hooks.on("ready", () => {
    console.log(`[Portal-Lib] Module ready - detecting grid configuration`);
    if (canvas?.scene) {
        const gridType = canvas.scene.grid.type;
        const hasGrid = gridType !== CONST.GRID_TYPES.GRIDLESS;
        console.log(`[Portal-Lib] Scene grid type: ${gridType} (${hasGrid ? 'HAS GRID' : 'GRIDLESS'})`);
        console.log(`[Portal-Lib] Shift key feature: ${hasGrid ? 'ENABLED' : 'DISABLED (no grid)'}`);
    } else {
        console.log(`[Portal-Lib] Canvas not ready yet - grid detection will occur per template`);
    }
});

Hooks.on("getActorSheetHeaderButtons", (app, buttons) => {
    const actor = app.document ?? app.actor;
    const canRevert = actor.token?.flags[MODULE_ID]?.revertData;
    if(!canRevert) return;
    buttons.unshift({
        label: "Revert Transformation",
        class: "revert",
        icon: "fas fa-undo",
        onclick: () => {
            Portal.revertTransformation(actor.token);
        }
    });
});

Hooks.on("getHeaderControlsActorSheetV2", (app, buttons) => {
    const actor = app.document ?? app.actor;
    const canRevert = actor.token?.flags[MODULE_ID]?.revertData;
    if(!canRevert) return;
    buttons.unshift({
        label: "Revert Transformation",
        action: "revert",
        icon: "fas fa-undo",
        onClick: () => {
            Portal.revertTransformation(actor.token);
        }
    });
});
