// Status Effects Manager (compact) for Foundry V13
// Minimal UI: lists entries, supports Add/Edit/Delete with prompts, safe persist fallback

(async () => {
    if (!game.user?.isGM) return ui.notifications.error("Run this as a GM.");

    const getEffects = () => {
        try {
            // Avoid calling game.settings.get when the setting isn't registered; that throws in Foundry.
            const settingsMap = game.settings?.settings;
            const key = 'core.statusEffects';
            if (settingsMap && typeof settingsMap.has === 'function' && !settingsMap.has(key)) {
                return CONFIG.statusEffects ?? [];
            }
            const v = game.settings.get("core", "statusEffects");
            return Array.isArray(v) ? v : (CONFIG.statusEffects ?? []);
        }
        catch (e) {
            console.warn('getEffects fallback to CONFIG.statusEffects', e);
            return CONFIG.statusEffects ?? [];
        }
    };

    const saveEffects = async (arr) => {
        // If the core.statusEffects setting isn't registered we must not call game.settings.get/set
        // because Foundry will throw. In that case update the runtime CONFIG and inform the user.
        try {
            const settingsMap = game.settings?.settings;
            const key = 'core.statusEffects';
            const registered = !!(settingsMap && typeof settingsMap.has === 'function' && settingsMap.has(key));
            if (!registered) {
                CONFIG.statusEffects = arr;
                ui.notifications.warn("'core.statusEffects' is not registered. Updated CONFIG.statusEffects in-memory only; this will not persist across a server restart.");
                console.warn("Persist fallback used: core.statusEffects not registered. To persist changes across restarts, create a small init module or edit the world settings file on the server.");
                Hooks.callAll("renderTokenHUD");
                return false;
            }

            await game.settings.set("core", "statusEffects", arr);
            ui.notifications.info("Saved status effects to world settings.");
            return true;
        } catch (e) {
            console.warn("Saving status effects failed:", e);
            // Final fallback: update runtime CONFIG so the UI reflects changes for this session
            CONFIG.statusEffects = arr;
            ui.notifications.warn("Failed to save to world settings. Updated CONFIG.statusEffects in-memory (not persisted). See console for details.");
            Hooks.callAll("renderTokenHUD");
            return false;
        }
    };

    // small, dependency-free HTML escaper for macro environment
    const esc = (v) => {
        if (v === undefined || v === null) return "";
        return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    };

    function renderManager() {
        const arr = foundry.utils.deepClone(getEffects() || []);
        const rows = arr.map((e, i) => `
                <tr data-idx="${i}">
                    <td><img src="${esc(e.icon || 'icons/svg/mystery-man.svg')}" style="width:28px;height:28px"></td>
                    <td>${esc(e.label || '')}</td>
                    <td>${esc(e.statusId || e.id || '')}</td>
                    <td><button class="edit" data-idx="${i}">Edit</button> <button class="del" data-idx="${i}">Delete</button></td>
                </tr>`).join("");

        const content = `
      <div>
        <p>Manage status effects. Add/Edit/Delete entries. Export prints the array to console.</p>
        <table style="width:100%"><thead><tr><th></th><th>Label</th><th>ID</th><th></th></tr></thead><tbody>${rows}</tbody></table>
      </div>`;

        new Dialog({
            title: "Status Effects Manager (compact)",
            content,
            buttons: {
                add: {
                    label: "Add", callback: async () => {
                        const id = (await new Promise(r => r(prompt('Status ID (no spaces)'))))?.trim();
                        if (!id) return ui.notifications.error('ID required');
                        const label = prompt('Label') || id;
                        const icon = prompt('Icon path (Files & Folders -> Copy Path)') || '';
                        const cur = getEffects();
                        if (cur.find(x => (x.statusId || x.id) === id)) return ui.notifications.error('ID exists');
                        cur.push({ id, statusId: id, label, icon });
                        await saveEffects(cur);
                        renderManager();
                    }
                },
                export: { label: 'Export', callback: () => { console.log('Status effects:', getEffects()); ui.notifications.info('Exported to console'); } },
                close: { label: 'Close' }
            },
            render: html => {
                html.find('button.edit').on('click', async ev => {
                    const idx = Number(ev.currentTarget.dataset.idx);
                    const cur = getEffects();
                    const entry = cur[idx];
                    const newLabel = prompt('Label', entry.label) || entry.label;
                    const newIcon = prompt('Icon path', entry.icon) || entry.icon;
                    cur[idx] = { ...entry, label: newLabel, icon: newIcon };
                    await saveEffects(cur);
                    renderManager();
                });
                html.find('button.del').on('click', async ev => {
                    const idx = Number(ev.currentTarget.dataset.idx);
                    if (!confirm('Delete this status entry?')) return;
                    const cur = getEffects();
                    cur.splice(idx, 1);
                    await saveEffects(cur);
                    renderManager();
                });
            }
        }).render(true);
    }

    renderManager();

})();
