// Status Effects Manager (enhanced) for Foundry V13
// Full UI with proper dialogs, icon display, and V13 compatibility

(async () => {
    if (!game.user?.isGM) return ui.notifications.error("Run this as a GM.");

    const getEffects = () => {
        try {
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
        try {
            const settingsMap = game.settings?.settings;
            const key = 'core.statusEffects';
            const registered = !!(settingsMap && typeof settingsMap.has === 'function' && settingsMap.has(key));
            if (!registered) {
                CONFIG.statusEffects = foundry.utils.deepClone(arr);
                ui.notifications.warn("'core.statusEffects' is not registered. Updated CONFIG.statusEffects in-memory only; this will not persist across a server restart.");
                console.warn("Persist fallback used: core.statusEffects not registered. To persist changes across restarts, create a small init module or edit the world settings file on the server.");
                Hooks.callAll("renderTokenHUD");
                return false;
            }

            await game.settings.set("core", "statusEffects", foundry.utils.deepClone(arr));
            ui.notifications.info("Saved status effects to world settings.");
            return true;
        } catch (e) {
            console.warn("Saving status effects failed:", e);
            CONFIG.statusEffects = foundry.utils.deepClone(arr);
            ui.notifications.warn("Failed to save to world settings. Updated CONFIG.statusEffects in-memory (not persisted). See console for details.");
            Hooks.callAll("renderTokenHUD");
            return false;
        }
    };

    const esc = (v) => {
        if (v === undefined || v === null) return "";
        return String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    };

    // Get the actual icon path used by Foundry (prioritizes img over icon)
    const getEffectIcon = (effect) => {
        return effect.img || effect.icon || 'icons/svg/mystery-man.svg';
    };

    // Get the display label for status effects (handles localization)
    const getEffectLabel = (effect) => {
        if (effect.label) return effect.label;
        if (effect.name && game.i18n.has(effect.name)) {
            return game.i18n.localize(effect.name);
        }
        return effect.name || effect.id || effect.statusId || 'Unknown';
    };

    // Input Dialog helper for V13 compatibility
    const inputDialog = async (title, fields, existingData = {}) => {
        return new Promise((resolve) => {
            const formFields = fields.map(field => {
                const value = existingData[field.name] || field.default || '';
                if (field.type === 'filepicker') {
                    return `
                        <div class="form-group">
                            <label>${field.label}:</label>
                            <div class="form-fields">
                                <input type="text" name="${field.name}" value="${esc(value)}" placeholder="${field.placeholder || ''}" />
                                <button type="button" class="file-picker" data-type="imagevideo" data-target="${field.name}" title="Browse Files">
                                    <i class="fas fa-file-import fa-fw"></i>
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="form-group">
                            <label>${field.label}:</label>
                            <input type="text" name="${field.name}" value="${esc(value)}" placeholder="${field.placeholder || ''}" />
                        </div>
                    `;
                }
            }).join('');

            const content = `
                <form class="flexcol">
                    <style>
                        .status-effects-form .form-group { margin-bottom: 10px; }
                        .status-effects-form .form-fields { display: flex; align-items: center; gap: 5px; }
                        .status-effects-form .form-fields input { flex: 1; }
                        .status-effects-form .file-picker { flex: 0 0 auto; }
                    </style>
                    <div class="status-effects-form">
                        ${formFields}
                    </div>
                </form>
            `;

            new Dialog({
                title,
                content,
                buttons: {
                    save: {
                        label: "Save",
                        callback: (html) => {
                            const formData = new FormDataExtended(html.find('form')[0]).object;
                            resolve(formData);
                        }
                    },
                    cancel: {
                        label: "Cancel",
                        callback: () => resolve(null)
                    }
                },
                render: (html) => {
                    // Setup file picker functionality
                    html.find('.file-picker').click(async (event) => {
                        const button = event.currentTarget;
                        const input = html.find(`input[name="${button.dataset.target}"]`)[0];

                        const fp = new FilePicker({
                            type: button.dataset.type,
                            callback: (path) => {
                                input.value = path;
                            }
                        });
                        fp.render(true);
                    });
                },
                default: "save"
            }).render(true);
        });
    };

    function renderManager() {
        const arr = foundry.utils.deepClone(getEffects() || []);
        const rows = arr.map((e, i) => {
            const icon = getEffectIcon(e);
            const label = getEffectLabel(e);
            const statusId = e.statusId || e.id || '';

            return `
                <tr data-idx="${i}" draggable="true" class="draggable-row">
                    <td class="drag-handle" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></td>
                    <td><img src="${esc(icon)}" style="width:32px;height:32px;object-fit:contain;" onerror="this.src='icons/svg/mystery-man.svg'" /></td>
                    <td>${esc(label)}</td>
                    <td><code>${esc(statusId)}</code></td>
                    <td>
                        <button class="edit" data-idx="${i}" title="Edit Status Effect"><i class="fas fa-edit"></i></button>
                        <button class="del" data-idx="${i}" title="Delete Status Effect"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join("");

        const content = `
            <div>
                <p>Manage status effects for tokens. Click Add to create new effects, Edit to modify existing ones, or Delete to remove them.</p>
                <style>
                    .status-effects-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    .status-effects-table th, .status-effects-table td {
                        padding: 8px;
                        text-align: left;
                        border-bottom: 1px solid #ccc;
                        vertical-align: middle;
                    }
                    .status-effects-table th { background-color: #f5f5f5; font-weight: bold; }
                    .status-effects-table button {
                        margin: 0 2px;
                        padding: 4px 8px;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        background: #4CAF50;
                        color: white;
                    }
                    .status-effects-table button.del { background: #f44336; }
                    .status-effects-table button:hover { opacity: 0.8; }
                    .status-effects-table code {
                        background: #f4f4f4;
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: monospace;
                        font-size: 0.9em;
                    }
                    .draggable-row {
                        cursor: move;
                        transition: background-color 0.2s;
                    }
                    .draggable-row:hover {
                        background-color: #f9f9f9;
                    }
                    .draggable-row.drag-over {
                        background-color: #e3f2fd;
                        border-top: 2px solid #2196f3;
                    }
                    .drag-handle {
                        cursor: grab;
                        color: #666;
                        text-align: center;
                        width: 30px;
                    }
                    .drag-handle:active {
                        cursor: grabbing;
                    }
                </style>
                <table class="status-effects-table">
                    <thead>
                        <tr>
                            <th style="width:30px;" title="Drag rows to reorder"><i class="fas fa-sort"></i></th>
                            <th style="width:60px;">Icon</th>
                            <th>Label</th>
                            <th>Status ID</th>
                            <th style="width:100px;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="status-effects-tbody">${rows}</tbody>
                </table>
            </div>
        `;

        new Dialog({
            title: "Status Effects Manager",
            content,
            buttons: {
                add: {
                    label: "<i class='fas fa-plus'></i> Add New",
                    callback: async () => {
                        const data = await inputDialog("Add New Status Effect", [
                            { name: 'id', label: 'Status ID', placeholder: 'unique-id-no-spaces' },
                            { name: 'label', label: 'Display Label', placeholder: 'Visible name' },
                            { name: 'name', label: 'Name (for localization)', placeholder: 'EFFECT.StatusExample' },
                            { name: 'icon', label: 'Icon Path', type: 'filepicker', placeholder: 'icons/svg/example.svg' }
                        ]);

                        if (!data || !data.id) return;

                        const cur = getEffects();
                        if (cur.find(x => (x.statusId || x.id) === data.id)) {
                            return ui.notifications.error('Status ID already exists');
                        }

                        cur.push({
                            id: data.id,
                            statusId: data.id,
                            label: data.label || data.id,
                            name: data.name,
                            img: data.icon || 'icons/svg/mystery-man.svg'
                        });

                        await saveEffects(cur);
                        renderManager();
                    }
                },
                export: {
                    label: "<i class='fas fa-download'></i> Export",
                    callback: () => {
                        console.log('Status effects:', getEffects());
                        ui.notifications.info('Status effects exported to console (F12)');
                    }
                },
                close: { label: "<i class='fas fa-times'></i> Close" }
            },
            render: html => {
                // Setup drag and drop functionality
                const tbody = html.find('#status-effects-tbody')[0];
                let draggedElement = null;

                html.find('.draggable-row').each((i, row) => {
                    row.addEventListener('dragstart', (e) => {
                        draggedElement = row;
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/html', row.outerHTML);
                        row.style.opacity = '0.5';
                    });

                    row.addEventListener('dragend', (e) => {
                        row.style.opacity = '';
                        html.find('.draggable-row').removeClass('drag-over');
                    });

                    row.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                    });

                    row.addEventListener('dragenter', (e) => {
                        e.preventDefault();
                        if (row !== draggedElement) {
                            row.classList.add('drag-over');
                        }
                    });

                    row.addEventListener('dragleave', (e) => {
                        row.classList.remove('drag-over');
                    });

                    row.addEventListener('drop', async (e) => {
                        e.preventDefault();
                        row.classList.remove('drag-over');

                        if (row !== draggedElement) {
                            const draggedIdx = parseInt(draggedElement.dataset.idx);
                            const targetIdx = parseInt(row.dataset.idx);

                            // Reorder the effects array
                            const effects = getEffects();
                            const draggedItem = effects[draggedIdx];
                            effects.splice(draggedIdx, 1);
                            effects.splice(targetIdx, 0, draggedItem);

                            // Save and refresh
                            await saveEffects(effects);
                            renderManager();
                            ui.notifications.info('Status effects reordered');
                        }
                    });
                });

                html.find('button.edit').click(async ev => {
                    const idx = Number(ev.currentTarget.dataset.idx);
                    const cur = getEffects();
                    const entry = cur[idx];

                    const data = await inputDialog("Edit Status Effect", [
                        { name: 'id', label: 'Status ID' },
                        { name: 'label', label: 'Display Label' },
                        { name: 'name', label: 'Name (for localization)' },
                        { name: 'icon', label: 'Icon Path', type: 'filepicker' }
                    ], {
                        id: entry.statusId || entry.id,
                        label: entry.label,
                        name: entry.name,
                        icon: getEffectIcon(entry)
                    });

                    if (!data) return;

                    cur[idx] = {
                        ...entry,
                        id: data.id,
                        statusId: data.id,
                        label: data.label,
                        name: data.name,
                        img: data.icon
                    };

                    await saveEffects(cur);
                    renderManager();
                });

                html.find('button.del').click(async ev => {
                    const idx = Number(ev.currentTarget.dataset.idx);
                    const cur = getEffects();
                    const entry = cur[idx];

                    const confirmed = await Dialog.confirm({
                        title: "Delete Status Effect",
                        content: `<p>Are you sure you want to delete the status effect "<strong>${getEffectLabel(entry)}</strong>"?</p>`,
                        yes: () => true,
                        no: () => false
                    });

                    if (!confirmed) return;

                    cur.splice(idx, 1);
                    await saveEffects(cur);
                    renderManager();
                });
            }
        }, { width: 600, height: 500 }).render(true);
    }

    renderManager();

})();
