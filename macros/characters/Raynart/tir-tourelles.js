/**
 * Tir de Tourelles - Raynart (Le Mage de la Mécanique)
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Permet à Raynart de contrôler ses tourelles (Balliste/Gatling) pour effectuer des tirs.
 *
 * BALLISTE :
 * - Jet de touché : Esprit (Sort niveau 1)
 * - Dégâts : 1d4 + Esprit
 * - Portée : Longue distance
 * - Mode : Tir simple mono-cible
 *
 * GATLING :
 * - Jet de touché : Esprit (Sort niveau 2)
 * - Modes de tir :
 *   * Mono-cible : 2d4 + 2 + Esprit×2 (cible unique)
 *   * Double-cible : 1d4 + 2 + Esprit (2 cibles différentes)
 *   * Cône : 1d4 + Esprit par cible (cône 25°, 10 cases)
 *
 * MÉCANIQUES :
 * - Détection automatique des tourelles actives
 * - Sélection interactive des tourelles à utiliser
 * - Animation de ciblage pendant la sélection Portal
 * - Animations de tir simultanées pour toutes les tourelles
 * - Incompatible avec Mode Big Gun
 * - Gestion des bonus/malus d'effets actifs
 *
 * Prerequisites:
 * - Portal module (ciblage)
 * - Sequencer (animations)
 * - JB2A & Animated Spell Effects (effets visuels)
 *
 * Usage : Sélectionner le token de Raynart et lancer cette macro
 */

(async () => {
    // ===== CONFIGURATION DU SORT =====
    const SPELL_CONFIG = {
        name: "Tir de Tourelles",
        characteristic: "esprit",
        characteristicDisplay: "Esprit",

        balliste: {
            name: "Balliste",
            actorId: "FQzsrD4o20avg7co",
            spellLevel: 1,
            damageFormula: "1d4",
            damageBonus: "esprit",
            animation: {
                targeting: "jb2a_patreon.extras.tmfx.radar.circle.loop.02.fast",
                projectile: "jb2a_patreon.arrow.physical.orange",
                impact: "jb2a_patreon.impact.010.orange"
            }
        },

        gatling: {
            name: "Gatling",
            actorId: "M7oAyZmgzi5XEYNE",
            spellLevel: 2,
            modes: {
                mono: {
                    name: "Mono-cible",
                    description: "Tir concentré sur une seule cible",
                    damageFormula: "2d4 + 2",
                    damageMultiplier: 2, // Esprit × 2
                    targetCount: 1,
                    animation: {
                        projectile: "animated-spell-effects.scifi.bullet.barrage"
                    }
                },
                double: {
                    name: "Double-cible",
                    description: "Tir réparti sur deux cibles",
                    damageFormula: "1d4 + 2",
                    damageMultiplier: 1,
                    targetCount: 2,
                    animation: {
                        projectile: "animated-spell-effects.scifi.bullet.barrage"
                    }
                },
                cone: {
                    name: "Cône",
                    description: "Tir en cône (25°, 10 cases)",
                    damageFormula: "1d4",
                    damageMultiplier: 1,
                    coneAngle: 25,
                    coneRange: 20,
                    animation: {
                        projectile: "jb2a.volley_of_projectiles_Line.bullet.001.002.orangeyellow"
                    }
                }
            },
            animation: {
                targeting: "jb2a_patreon.extras.tmfx.radar.circle.loop.02.fast",
                impact: "jb2a_patreon.impact.010.orange"
            }
        },

        targeting: {
            ballisteColor: "#ff6600",
            gatlingColor: "#cc0000",
            ballisteTexture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm",
            gatlingTexture: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Red_400x400.webm"
        }
    };

    // ===== VALIDATION BASIQUE =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.error("Veuillez d'abord sélectionner le jeton de Raynart !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("Aucun acteur valide trouvé !");
        return;
    }

    // ===== VÉRIFICATION MODULE PORTAL =====
    if (typeof Portal === "undefined") {
        ui.notifications.error("Le module Portal n'est pas disponible ! Veuillez l'activer.");
        return;
    }

    // ===== UTILITY FUNCTIONS =====

    /**
     * Détecte la stance actuelle de l'acteur
     */
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    /**
     * Gets active effect bonuses for a specific flag key
     * @param {Actor} actor - The actor to check for active effects
     * @param {string} flagKey - The flag key to look for (e.g., "damage", "esprit")
     * @param {boolean} excludeBigGun - If true, exclude Mode Big Gun bonus for damage (tourelles don't benefit)
     * @returns {number} Total bonus from all matching active effects
     */
    function getActiveEffectBonus(actor, flagKey, excludeBigGun = false) {
        if (!actor?.effects) return 0;

        let totalBonus = 0;

        for (const effect of actor.effects.contents) {
            // Exclure Mode Big Gun pour les dégâts des tourelles
            if (excludeBigGun && flagKey === "damage" && effect.name === "Mode Big Gun") {
                console.log(`[Raynart Tourelles] Excluding Mode Big Gun damage bonus for turrets`);
                continue;
            }

            if (!effect.flags?.world?.[flagKey]) continue;
            const bonus = parseInt(effect.flags.world[flagKey]);
            if (!isNaN(bonus)) {
                totalBonus += bonus;
                console.log(`[Raynart Tourelles] Found ${flagKey} bonus: ${bonus} from effect ${effect.name}`);
            }
        }

        console.log(`[Raynart Tourelles] Total ${flagKey} bonus from active effects: ${totalBonus}`);
        return totalBonus;
    }

    /**
     * Obtient et calcule la valeur finale de la caractéristique avec injuries et effets
     */
    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`Caractéristique "${characteristic}" introuvable !`);
            return null;
        }
        const baseValue = charAttribute.value || 3;

        const injuryEffect = actor?.effects?.contents?.find(e =>
            e.name?.toLowerCase() === 'blessures'
        );
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;

        const effectBonus = getActiveEffectBonus(actor, characteristic);

        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);

        console.log(`[Raynart Tourelles] ${characteristic}: base=${baseValue}, injuries=${injuryStacks}, effectBonus=${effectBonus}, final=${finalValue}`);

        return {
            base: baseValue,
            injuries: injuryStacks,
            effectBonus: effectBonus,
            injuryAdjusted: injuryAdjusted,
            final: finalValue
        };
    }

    /**
     * Détecte les tourelles existantes de Raynart sur le terrain
     */
    function getExistingTurrets() {
        const ballistes = [];
        const gatlings = [];

        for (const token of canvas.tokens.placeables) {
            const tokenActor = token.actor;
            if (!tokenActor) continue;

            // Comparer directement l'ID de l'acteur du token avec les actorId configurés
            if (tokenActor.id === SPELL_CONFIG.balliste.actorId) {
                ballistes.push({
                    token: token,
                    name: token.name,
                    position: `(${Math.round(token.x / canvas.grid.size)}, ${Math.round(token.y / canvas.grid.size)})`,
                    type: 'balliste'
                });
                console.log(`[Raynart Tourelles] Found balliste: ${token.name} at (${token.x}, ${token.y})`);
            } else if (tokenActor.id === SPELL_CONFIG.gatling.actorId) {
                gatlings.push({
                    token: token,
                    name: token.name,
                    position: `(${Math.round(token.x / canvas.grid.size)}, ${Math.round(token.y / canvas.grid.size)})`,
                    type: 'gatling'
                });
                console.log(`[Raynart Tourelles] Found gatling: ${token.name} at (${token.x}, ${token.y})`);
            }
        }

        return { ballistes, gatlings };
    }

    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    // ===== DÉTECTION DES TOURELLES =====
    const { ballistes, gatlings } = getExistingTurrets();
    const allTurrets = [...ballistes, ...gatlings];

    if (allTurrets.length === 0) {
        ui.notifications.warn("⚠️ Aucune tourelle (Balliste/Gatling) n'est actuellement invoquée !");
        return;
    }

    console.log(`[Raynart Tourelles] Found ${ballistes.length} ballistes and ${gatlings.length} gatlings`);

    // ===== FONCTION BONUS POUR TOURELLE UNIQUE =====
    async function getBonusesAndModeForSingleTurret(turret) {
        return new Promise((resolve) => {
            // Section mode Gatling si nécessaire
            let gatlingModeSection = '';
            if (turret.type === 'gatling') {
                const modes = SPELL_CONFIG.gatling.modes;
                const modeOptions = Object.keys(modes).map(key => {
                    const mode = modes[key];
                    return `
                        <label style="display: block; margin: 8px 0; cursor: pointer; padding: 10px; border: 2px solid #ddd; border-radius: 6px; transition: all 0.2s;"
                               onmouseover="this.style.background='#ffebee'; this.style.borderColor='#e65100'"
                               onmouseout="this.style.background='white'; this.style.borderColor='#ddd'">
                            <input type="radio" name="gatling-mode" value="${key}" ${key === 'mono' ? 'checked' : ''} />
                            <strong style="color: #e65100;">${mode.name}</strong>
                            <div style="font-size: 12px; color: #666; margin-top: 4px;">${mode.description}</div>
                            <div style="font-size: 11px; color: #999; margin-top: 4px;">
                                💥 ${mode.damageFormula}${mode.damageMultiplier > 1 ? ` + Esprit×${mode.damageMultiplier}` : ' + Esprit'}
                            </div>
                        </label>
                    `;
                }).join('');

                gatlingModeSection = `
                    <div style="margin-bottom: 20px; padding: 15px; background: #fff3e0; border-left: 4px solid #e65100; border-radius: 4px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #e65100;">⚔️ Mode de Tir - Gatling</h4>
                        ${modeOptions}
                    </div>
                `;
            }

            const dialogContent = `
                <div style="font-family: 'Signika', sans-serif;">
                    ${gatlingModeSection}

                    <div style="margin-bottom: 15px;">
                        <p style="font-size: 14px; margin-bottom: 15px;">
                            <strong>Bonus manuels pour le tir :</strong>
                        </p>
                        <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                            <div>
                                <label style="font-weight: bold; font-size: 13px; color: #333;">Bonus d'Attaque :</label>
                                <input type="number" id="attackBonus" value="0" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;" />
                            </div>
                            <div>
                                <label style="font-weight: bold; font-size: 13px; color: #333;">Bonus de Dégâts :</label>
                                <input type="number" id="damageBonus" value="0" style="width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px;" />
                            </div>
                        </div>
                    </div>
                </div>
            `;

            new Dialog({
                title: `🎯 Configuration - ${turret.name}`,
                content: dialogContent,
                buttons: {
                    ok: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirmer",
                        callback: (html) => {
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;

                            let gatlingMode = null;
                            if (turret.type === 'gatling') {
                                gatlingMode = html.find('input[name="gatling-mode"]:checked').val();
                            }

                            resolve({ attackBonus, damageBonus, gatlingMode });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "ok",
                close: () => resolve(null)
            }).render(true);
        });
    }

    // ===== DIALOG DE SÉLECTION DES TOURELLES =====
    async function selectTurrets() {
        // Si une seule tourelle, dialogue simplifié avec mode intégré si Gatling
        if (allTurrets.length === 1) {
            const singleTurret = allTurrets[0];
            console.log(`[Raynart Tourelles] Auto-selecting single turret: ${singleTurret.name}`);

            // Demander bonus et mode (si Gatling) dans le même dialogue
            const result = await getBonusesAndModeForSingleTurret(singleTurret);
            if (!result) return null;

            // Si c'est un Gatling, ajouter le mode sélectionné
            if (singleTurret.type === 'gatling') {
                singleTurret.gatlingMode = result.gatlingMode;
                console.log(`[Raynart Tourelles] Gatling mode selected: ${result.gatlingMode}`);
            }

            return {
                turrets: [singleTurret],
                attackBonus: result.attackBonus,
                damageBonus: result.damageBonus
            };
        }

        // Dialogue de sélection multiple
        return new Promise((resolve) => {
            let selectedTurrets = [];

            const turretRows = allTurrets.map((turret, index) => {
                const icon = turret.type === 'balliste' ? '🎯' : '⚔️';
                const color = turret.type === 'balliste' ? '#ff6600' : '#cc0000';

                // Section de sélection du mode pour les Gatlings
                let gatlingModeSection = '';
                if (turret.type === 'gatling') {
                    const modes = SPELL_CONFIG.gatling.modes;
                    const modeOptions = Object.keys(modes).map(key => {
                        const mode = modes[key];
                        return `
                            <label style="display: block; margin: 5px 0; cursor: pointer; padding: 5px; border-radius: 3px; transition: background 0.2s;"
                                   onmouseover="this.style.background='#ffebee'"
                                   onmouseout="this.style.background='transparent'">
                                <input type="radio" name="gatling-mode-${index}" value="${key}" ${key === 'mono' ? 'checked' : ''} />
                                <strong>${mode.name}</strong> - ${mode.description}
                            </label>
                        `;
                    }).join('');

                    gatlingModeSection = `
                        <tr id="gatling-mode-row-${index}" style="display: none; background: #fff3e0;">
                            <td colspan="4" style="padding: 10px;">
                                <div style="margin-left: 20px;">
                                    <strong style="color: #e65100;">⚔️ Mode de tir pour ${turret.name} :</strong>
                                    <div style="margin-top: 8px;">
                                        ${modeOptions}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    `;
                }

                return `
                    <tr>
                        <td style="text-align: center;">
                            <input type="checkbox" id="turret-${index}" data-index="${index}" data-type="${turret.type}" />
                        </td>
                        <td style="padding: 5px;">
                            <span style="color: ${color}; font-weight: bold;">${icon} ${turret.name}</span>
                        </td>
                        <td style="padding: 5px; color: #666;">
                            ${turret.position}
                        </td>
                        <td style="padding: 5px; color: #999; font-style: italic;">
                            ${turret.type === 'balliste' ? 'Balliste' : 'Gatling'}
                        </td>
                    </tr>
                    ${gatlingModeSection}
                `;
            }).join('');

            const dialogContent = `
                <div style="font-family: 'Signika', sans-serif;">
                    <p style="font-size: 14px; margin-bottom: 15px;">
                        <strong>Sélectionnez les tourelles à utiliser :</strong>
                    </p>

                    <div style="margin-bottom: 10px; text-align: right;">
                        <button type="button" id="selectAllButton" style="
                            padding: 6px 12px;
                            background: #2196f3;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 13px;
                            transition: background 0.2s;
                        " onmouseover="this.style.background='#1976d2'" onmouseout="this.style.background='#2196f3'">
                            ✅ Tout sélectionner
                        </button>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
                        <thead>
                            <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
                                <th style="padding: 8px; text-align: center; width: 40px;">✓</th>
                                <th style="padding: 8px; text-align: left;">Nom</th>
                                <th style="padding: 8px; text-align: left;">Position</th>
                                <th style="padding: 8px; text-align: left;">Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${turretRows}
                        </tbody>
                    </table>

                    <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #1976d2;">⚡ Bonus Manuels</h4>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <label style="font-weight: bold; font-size: 13px; color: #333;">Bonus d'Attaque :</label>
                                <input type="number" id="attackBonus" value="0" style="width: 100%; padding: 6px; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px;" />
                            </div>
                            <div>
                                <label style="font-weight: bold; font-size: 13px; color: #333;">Bonus de Dégâts :</label>
                                <input type="number" id="damageBonus" value="0" style="width: 100%; padding: 6px; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px;" />
                            </div>
                        </div>
                        <p style="margin: 8px 0 0 0; font-size: 11px; color: #666; font-style: italic;">
                            Ces bonus s'appliquent à toutes les tourelles sélectionnées
                        </p>
                    </div>

                    <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px;">
                        <p style="margin: 0; font-size: 13px; color: #856404;">
                            <strong>Note :</strong> Les Gatlings proposeront ensuite de choisir leur mode de tir.
                        </p>
                    </div>
                </div>
            `;

            const dialog = new Dialog({
                title: "🎯 Tir de Tourelles - Sélection",
                content: dialogContent,
                buttons: {
                    fire: {
                        icon: '<i class="fas fa-crosshairs"></i>',
                        label: "Tirer",
                        callback: async (html) => {
                            const checkboxes = html.find('input[type="checkbox"]:checked');
                            const indices = checkboxes.map((i, el) => parseInt($(el).data('index'))).get();

                            if (indices.length === 0) {
                                ui.notifications.warn("Aucune tourelle sélectionnée !");
                                resolve(null);
                                return;
                            }

                            selectedTurrets = indices.map(i => allTurrets[i]);

                            // Récupérer les bonus manuels
                            const attackBonus = parseInt(html.find('#attackBonus').val()) || 0;
                            const damageBonus = parseInt(html.find('#damageBonus').val()) || 0;

                            // Pour chaque Gatling sélectionné, récupérer le mode depuis le formulaire
                            for (let i = 0; i < selectedTurrets.length; i++) {
                                const turret = selectedTurrets[i];
                                if (turret.type === 'gatling') {
                                    const turretIndex = indices[i];
                                    const selectedMode = html.find(`input[name="gatling-mode-${turretIndex}"]:checked`).val();

                                    if (!selectedMode) {
                                        ui.notifications.warn(`Aucun mode sélectionné pour ${turret.name} !`);
                                        resolve(null);
                                        return;
                                    }

                                    turret.gatlingMode = selectedMode;
                                    console.log(`[Raynart Tourelles] Gatling ${turret.name} mode: ${selectedMode}`);
                                }
                            }

                            resolve({ turrets: selectedTurrets, attackBonus, damageBonus });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "fire",
                close: () => resolve(null),
                render: (html) => {
                    // Gérer l'affichage des options de mode Gatling
                    html.find('input[type="checkbox"]').on('change', function() {
                        const index = $(this).data('index');
                        const type = $(this).data('type');
                        const isChecked = $(this).is(':checked');

                        if (type === 'gatling') {
                            const modeRow = html.find(`#gatling-mode-row-${index}`);
                            if (isChecked) {
                                modeRow.show();
                            } else {
                                modeRow.hide();
                            }
                        }
                    });

                    // Gérer le bouton "Tout sélectionner"
                    html.find('#selectAllButton').on('click', function() {
                        const allChecked = html.find('input[type="checkbox"]:checked').length === html.find('input[type="checkbox"]').length;

                        if (allChecked) {
                            // Tout désélectionner
                            html.find('input[type="checkbox"]').prop('checked', false);
                            $(this).text('✅ Tout sélectionner');
                            // Cacher toutes les lignes de mode Gatling
                            html.find('[id^="gatling-mode-row-"]').hide();
                        } else {
                            // Tout sélectionner
                            html.find('input[type="checkbox"]').prop('checked', true);
                            $(this).text('❌ Tout désélectionner');
                            // Afficher toutes les lignes de mode Gatling pour les Gatlings sélectionnés
                            html.find('input[type="checkbox"]').each(function() {
                                const index = $(this).data('index');
                                const type = $(this).data('type');
                                if (type === 'gatling') {
                                    html.find(`#gatling-mode-row-${index}`).show();
                                }
                            });
                        }
                    });
                }
            }, {
                width: 600,
                height: "auto"
            });

            dialog.render(true);
        });
    }

    /**
     * Dialogue pour sélectionner le mode de tir du Gatling
     */
    async function selectGatlingMode() {
        return new Promise((resolve) => {
            const modes = SPELL_CONFIG.gatling.modes;

            const modeButtons = Object.keys(modes).map(key => {
                const mode = modes[key];
                return `
                    <button class="mode-button" data-mode="${key}" style="
                        display: block;
                        width: 100%;
                        padding: 15px;
                        margin: 10px 0;
                        background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
                        border: 2px solid #7f1d1d;
                        border-radius: 8px;
                        color: white;
                        font-weight: bold;
                        cursor: pointer;
                        transition: all 0.3s;
                        text-align: left;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(220, 38, 38, 0.4)';"
                       onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        <div style="font-size: 16px; margin-bottom: 5px;">⚔️ ${mode.name}</div>
                        <div style="font-size: 12px; opacity: 0.9;">${mode.description}</div>
                        <div style="font-size: 11px; opacity: 0.8; margin-top: 5px;">
                            💥 ${mode.damageFormula}${mode.damageMultiplier > 1 ? ` + Esprit×${mode.damageMultiplier}` : ' + Esprit'}
                        </div>
                    </button>
                `;
            }).join('');

            const dialogContent = `
                <div style="font-family: 'Signika', sans-serif;">
                    <p style="font-size: 14px; margin-bottom: 15px;">
                        <strong>Choisissez le mode de tir du Gatling :</strong>
                    </p>
                    ${modeButtons}
                </div>
            `;

            const dialog = new Dialog({
                title: "⚔️ Mode de Tir - Gatling",
                content: dialogContent,
                buttons: {
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cancel",
                close: () => resolve(null),
                render: (html) => {
                    html.find('.mode-button').on('click', function() {
                        const selectedMode = $(this).data('mode');
                        dialog.close();
                        resolve(selectedMode);
                    });
                }
            }, {
                width: 500,
                height: "auto"
            });

            dialog.render(true);
        });
    }

    const selectionResult = await selectTurrets();
    if (!selectionResult || !selectionResult.turrets || selectionResult.turrets.length === 0) {
        ui.notifications.info("❌ Tir annulé.");
        return;
    }

    const selectedTurrets = selectionResult.turrets;
    const bonuses = {
        attackBonus: selectionResult.attackBonus || 0,
        damageBonus: selectionResult.damageBonus || 0
    };

    console.log(`[Raynart Tourelles] Selected ${selectedTurrets.length} turrets for firing`);
    console.log(`[Raynart Tourelles] Bonuses: Attack +${bonuses.attackBonus}, Damage +${bonuses.damageBonus}`);

    // ===== TARGETING POUR CHAQUE TOURELLE =====
    const turretTargets = [];

    for (const turret of selectedTurrets) {
        console.log(`[Raynart Tourelles] Targeting for ${turret.name} (${turret.type})`);

        // Animation de ciblage sur la tourelle (loop)
        const targetingSequence = Sequencer.EffectManager.getEffects({ name: `targeting-${turret.token.id}` });
        if (targetingSequence.length === 0) {
            new Sequence()
                .effect()
                .file(turret.type === 'balliste'
                    ? SPELL_CONFIG.balliste.animation.targeting
                    : SPELL_CONFIG.gatling.animation.targeting)
                .atLocation(turret.token)
                .scale(0.5)
                .fadeIn(200)
                .fadeOut(200)
                .belowTokens(true)
                .loopProperty("sprite", "rotation", { from: 0, to: 360, duration: 3000 })
                .persist()
                .name(`targeting-${turret.token.id}`)
                .play();
        }

        let targets = null;

        if (turret.type === 'balliste') {
            // Balliste : 1 cible
            ui.notifications.info(`🎯 Sélectionnez la cible pour ${turret.name}...`);
            const portalInstance = new Portal()
                .origin(turret.token)
                .color(SPELL_CONFIG.targeting.ballisteColor)
                .texture(SPELL_CONFIG.targeting.ballisteTexture);

            const target = await portalInstance.pick();

            // Récupérer le token à cette position
            const targetToken = getTokenAtLocation(target.x, target.y);

            targets = [{
                x: target.x,
                y: target.y,
                type: 'single',
                token: targetToken?.token,
                name: targetToken?.name
            }];

        } else if (turret.type === 'gatling') {
            const mode = turret.gatlingMode;
            const modeConfig = SPELL_CONFIG.gatling.modes[mode];

            if (mode === 'mono' || mode === 'double') {
                // Mono ou Double : sélection de cibles
                const targetCount = modeConfig.targetCount;
                ui.notifications.info(`🎯 Sélectionnez ${targetCount} cible${targetCount > 1 ? 's' : ''} pour ${turret.name} (${modeConfig.name})...`);

                const picked = [];
                for (let i = 0; i < targetCount; i++) {
                    const portalInstance = new Portal()
                        .origin(turret.token)
                        .size(1) // Taille d'une case normale
                        .color(SPELL_CONFIG.targeting.gatlingColor)
                        .texture(SPELL_CONFIG.targeting.gatlingTexture);

                    const target = await portalInstance.pick();

                    // Récupérer le token à cette position
                    const targetToken = getTokenAtLocation(target.x, target.y);

                    picked.push({
                        x: target.x,
                        y: target.y,
                        token: targetToken?.token,
                        name: targetToken?.name
                    });
                }

                targets = picked.map(p => ({ x: p.x, y: p.y, type: mode, token: p.token, name: p.name }));

            } else if (mode === 'cone') {
                // Cône : sélection de direction
                ui.notifications.info(`🎯 Sélectionnez la direction du cône pour ${turret.name}...`);

                const portalInstance = new Portal()
                    .origin(turret.token)
                    .range(modeConfig.coneRange * canvas.grid.size)
                    .size(1) // Taille d'une case normale
                    .color(SPELL_CONFIG.targeting.gatlingColor)
                    .texture(SPELL_CONFIG.targeting.gatlingTexture);

                const direction = await portalInstance.pick();

                // Calculer l'angle de direction
                const turretCenter = {
                    x: turret.token.x + (turret.token.width / 2),
                    y: turret.token.y + (turret.token.height / 2)
                };
                const directionAngle = Math.atan2(
                    direction.y - turretCenter.y,
                    direction.x - turretCenter.x
                );
                const directionDegrees = (directionAngle * 180 / Math.PI + 360) % 360;

                // Détecter les cibles dans le cône
                const coneTargets = findTargetsInCone(
                    turret.token,
                    directionDegrees,
                    modeConfig.coneAngle,
                    modeConfig.coneRange
                );

                // Stocker les informations du cône pour l'animation
                targets = [{
                    x: direction.x,
                    y: direction.y,
                    type: 'cone',
                    direction: directionDegrees,
                    coneTargets: coneTargets
                }];
            }
        }

        // Arrêter l'animation de ciblage
        Sequencer.EffectManager.endEffects({ name: `targeting-${turret.token.id}` });

        turretTargets.push({
            turret: turret,
            targets: targets
        });
        console.log(`[Raynart Tourelles] ${turret.name} targeting complete: ${targets.length} targets`);
    }

    // ===== HELPER: GET TOKEN AT LOCATION =====
    function getTokenAtLocation(x, y) {
        const gridSize = canvas.grid.size;
        const tolerance = gridSize / 2;

        const tokensAtLocation = canvas.tokens.placeables.filter(token => {
            const tokenCenterX = token.x + (token.document.width * gridSize) / 2;
            const tokenCenterY = token.y + (token.document.height * gridSize) / 2;
            const tokenDistance = Math.sqrt(
                Math.pow(tokenCenterX - x, 2) + Math.pow(tokenCenterY - y, 2)
            );
            return tokenDistance <= tolerance;
        });

        if (tokensAtLocation.length === 0) return null;

        const targetToken = tokensAtLocation[0];
        return { name: targetToken.name, token: targetToken };
    }

    // ===== CONE TARGET DETECTION =====
    function findTargetsInCone(turretToken, directionDegrees, coneAngle, maxRange) {
        const targets = [];
        const gridSize = canvas.grid.size;
        const maxRangePixels = maxRange * gridSize;

        const turretCenter = {
            x: turretToken.x + (turretToken.width / 2),
            y: turretToken.y + (turretToken.height / 2)
        };

        const halfAngle = coneAngle / 2;

        for (const token of canvas.tokens.placeables) {
            if (token.id === turretToken.id) continue;
            if (!token.actor) continue;

            const tokenCenter = {
                x: token.x + (token.width / 2),
                y: token.y + (token.height / 2)
            };

            const dx = tokenCenter.x - turretCenter.x;
            const dy = tokenCenter.y - turretCenter.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > maxRangePixels) continue;

            const targetAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
            let angleDiff = Math.abs(targetAngle - directionDegrees);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            if (angleDiff <= halfAngle) {
                targets.push({
                    token: token,
                    name: token.name,
                    x: tokenCenter.x,
                    y: tokenCenter.y,
                    distance: distance / gridSize,
                    angle: angleDiff
                });
            }
        }

        return targets;
    }

    // ===== ANIMATIONS SIMULTANÉES =====
    async function playAllTurretAnimations() {
        // Créer une séquence par tourelle pour paralléliser
        const allSequences = [];

        for (const turretTarget of turretTargets) {
            const turret = turretTarget.turret;
            const targets = turretTarget.targets;

            for (const target of targets) {
                let projectileFile = "";

                if (turret.type === 'balliste') {
                    projectileFile = SPELL_CONFIG.balliste.animation.projectile;
                } else if (turret.type === 'gatling') {
                    const modeConfig = SPELL_CONFIG.gatling.modes[turret.gatlingMode];
                    projectileFile = modeConfig.animation.projectile;
                }

                // Créer une séquence indépendante pour ce tir
                const shotSequence = new Sequence();

                // Mode cône : une seule animation dans la direction
                if (target.type === 'cone') {
                    shotSequence
                        .effect()
                        .file(projectileFile)
                        .atLocation(turret.token)
                        .stretchTo(target)
                        .waitUntilFinished(-1000);

                    // Impact à la position ciblée (direction)
                    const impactFile = SPELL_CONFIG.gatling.animation.impact;
                    shotSequence
                        .effect()
                        .file(impactFile)
                        .atLocation(target)
                        .scale(0.5);
                } else {
                    // Mode normal : projectile vers la cible
                    shotSequence
                        .effect()
                        .file(projectileFile)
                        .atLocation(turret.token)
                        .stretchTo(target)
                        .waitUntilFinished(-200);

                    // Impact animation
                    const impactFile = turret.type === 'balliste'
                        ? SPELL_CONFIG.balliste.animation.impact
                        : SPELL_CONFIG.gatling.animation.impact;

                    shotSequence
                        .effect()
                        .file(impactFile)
                        .atLocation(target)
                        .scale(0.5);
                }

                // Ajouter cette séquence à la liste
                allSequences.push(shotSequence);
            }
        }

        // Lancer toutes les séquences en parallèle
        await Promise.all(allSequences.map(seq => seq.play()));
    }

    await playAllTurretAnimations();

    // ===== DAMAGE CALCULATION FOR EACH TURRET =====
    const allRolls = [];

    for (const turretTarget of turretTargets) {
        const turret = turretTarget.turret;
        const targets = turretTarget.targets;

        const spellLevel = turret.type === 'balliste'
            ? SPELL_CONFIG.balliste.spellLevel
            : SPELL_CONFIG.gatling.spellLevel;

        const levelBonus = spellLevel * 2;
        const totalAttackDice = characteristicInfo.final + bonuses.attackBonus;

        for (const target of targets) {
            // Mode cône : gérer toutes les cibles détectées
            if (target.type === 'cone' && target.coneTargets) {
                for (const coneTarget of target.coneTargets) {
                    // Attack roll
                    const attackFormula = `${totalAttackDice}d7 + ${levelBonus}`;
                    const attackRoll = new Roll(attackFormula);
                    await attackRoll.evaluate({ async: true });

                    // Damage roll
                    const modeConfig = SPELL_CONFIG.gatling.modes[turret.gatlingMode];
                    const damageFormula = modeConfig.damageFormula;
                    const damageMultiplier = modeConfig.damageMultiplier;

                    const damageRoll = new Roll(damageFormula);
                    await damageRoll.evaluate({ async: true });

                    const characteristicDamageBonus = characteristicInfo.final * damageMultiplier;
                    const activeEffectDamageBonus = getActiveEffectBonus(actor, "damage", true);
                    const totalDamageBonus = characteristicDamageBonus + activeEffectDamageBonus + bonuses.damageBonus;

                    let finalDamage = damageRoll.total + totalDamageBonus;

                    if (currentStance === 'offensif') {
                        const diceCount = damageFormula.split('d')[0];
                        const diceMax = parseInt(damageFormula.split('d')[1]?.split('+')[0] || '4');
                        const maxDiceValue = parseInt(diceCount) * diceMax;
                        const fixedBonus = damageFormula.includes('+')
                            ? parseInt(damageFormula.split('+')[1])
                            : 0;
                        finalDamage = maxDiceValue + fixedBonus + totalDamageBonus;
                    }

                    allRolls.push({
                        turret: turret,
                        target: coneTarget,
                        attackRoll: attackRoll,
                        damageRoll: damageRoll,
                        finalDamage: finalDamage,
                        attackTotal: attackRoll.total,
                        isCone: true
                    });
                }
            } else {
                // Mode normal
                const attackFormula = `${totalAttackDice}d7 + ${levelBonus}`;
                const attackRoll = new Roll(attackFormula);
                await attackRoll.evaluate({ async: true });

                let damageFormula = "";
                let damageMultiplier = 1;

                if (turret.type === 'balliste') {
                    damageFormula = SPELL_CONFIG.balliste.damageFormula;
                } else if (turret.type === 'gatling') {
                    const modeConfig = SPELL_CONFIG.gatling.modes[turret.gatlingMode];
                    damageFormula = modeConfig.damageFormula;
                    damageMultiplier = modeConfig.damageMultiplier;
                }

                const damageRoll = new Roll(damageFormula);
                await damageRoll.evaluate({ async: true });

                const characteristicDamageBonus = characteristicInfo.final * damageMultiplier;
                const activeEffectDamageBonus = getActiveEffectBonus(actor, "damage", true);
                const totalDamageBonus = characteristicDamageBonus + activeEffectDamageBonus + bonuses.damageBonus;

                let finalDamage = damageRoll.total + totalDamageBonus;

                if (currentStance === 'offensif') {
                    const diceCount = damageFormula.split('d')[0];
                    const diceMax = parseInt(damageFormula.split('d')[1]?.split('+')[0] || '4');
                    const maxDiceValue = parseInt(diceCount) * diceMax;
                    const fixedBonus = damageFormula.includes('+')
                        ? parseInt(damageFormula.split('+')[1])
                        : 0;
                    finalDamage = maxDiceValue + fixedBonus + totalDamageBonus;
                }

                allRolls.push({
                    turret: turret,
                    target: target,
                    attackRoll: attackRoll,
                    damageRoll: damageRoll,
                    finalDamage: finalDamage,
                    attackTotal: attackRoll.total,
                    isCone: false
                });
            }
        }
    }

    // ===== COMBINED CHAT MESSAGE WITH ALL ROLLS =====
    // Calculer le coût en mana
    const totalManaCost = selectedTurrets.length * 2;
    const isFocusable = true;
    const actualManaCost = currentStance === 'focus' && isFocusable
        ? 'GRATUIT (Position Focus)'
        : `${totalManaCost} mana`;

    const stanceInfo = currentStance ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)})` : '';
    const bonusInfo = (bonuses.attackBonus !== 0 || bonuses.damageBonus !== 0)
        ? `<p><strong>Bonus:</strong> Attaque +${bonuses.attackBonus}, Dégâts +${bonuses.damageBonus}</p>`
        : '';

    // Créer un roll combiné avec TOUS les jets d'attaque et de dégâts
    const allRollsFormulas = [];
    for (const roll of allRolls) {
        allRollsFormulas.push(roll.attackRoll.formula);
        allRollsFormulas.push(roll.damageRoll.formula);
    }

    const combinedRoll = new Roll(`{${allRollsFormulas.join(', ')}}`);
    await combinedRoll.evaluate({ async: true });

    // Extraire les résultats du roll combiné
    let resultIndex = 0;
    for (const roll of allRolls) {
        // Extraire le résultat d'attaque (index pair)
        const attackResult = combinedRoll.terms[0].results[resultIndex];
        roll.actualAttackTotal = attackResult.result;
        resultIndex++;

        // Extraire le résultat de dégâts (index impair)
        const damageResult = combinedRoll.terms[0].results[resultIndex];
        // Note: pour les dégâts, on garde roll.finalDamage qui inclut la maximisation si nécessaire
        resultIndex++;
    }

    // Construire le message de résumé avec les VRAIS résultats extraits
    const turretSummaries = turretTargets.map(tt => {
        const turret = tt.turret;
        const turretRolls = allRolls.filter(r => r.turret === turret);

        const turretIcon = turret.type === 'balliste' ? '🎯' : '⚔️';
        const turretColor = turret.type === 'balliste' ? '#ff6600' : '#cc0000';

        const targetLines = turretRolls.map(roll => {
            const targetName = roll.target.name || 'Cible non identifiée';
            const maximized = currentStance === 'offensif' ? ' (MAXIMISÉ)' : '';

            return `
                <div style="margin-left: 15px; padding: 5px; border-left: 2px solid ${turretColor};">
                    <strong>→ ${targetName}</strong><br/>
                    Attaque: ${roll.actualAttackTotal} | Dégâts: ${roll.finalDamage}${maximized}
                </div>
            `;
        }).join('');

        return `
            <div style="margin-bottom: 15px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 5px;">
                <h4 style="margin: 0 0 10px 0; color: ${turretColor};">
                    ${turretIcon} ${turret.name}
                </h4>
                ${turret.type === 'gatling' ? `<p style="margin: 5px 0; font-size: 12px; color: #666;"><em>Mode: ${SPELL_CONFIG.gatling.modes[turret.gatlingMode].name}</em></p>` : ''}
                ${targetLines}
            </div>
        `;
    }).join('');

    const chatContent = `
        <div class="spell-result" style="font-family: 'Signika', sans-serif;">
            <h3 style="border-bottom: 2px solid #ff6600; padding-bottom: 5px;">
                🎯 ${SPELL_CONFIG.name}
            </h3>
            <p><strong>Contrôleur:</strong> ${actor.name}${stanceInfo}</p>
            <p><strong>Caractéristique:</strong> ${SPELL_CONFIG.characteristicDisplay} ${characteristicInfo.final}</p>
            <p><strong>Coût:</strong> ${actualManaCost}</p>
            ${bonusInfo}
            <hr style="margin: 10px 0;" />
            <h4>Résultats des Tirs :</h4>
            ${turretSummaries}
        </div>
    `;

    await combinedRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: chatContent,
        rollMode: game.settings.get('core', 'rollMode')
    });

    // ===== FINAL NOTIFICATION =====
    const totalTargets = allRolls.length;
    const manaCostInfo = currentStance === 'focus' ? ' (Gratuit en Focus)' : ` (${totalManaCost} mana)`;
    ui.notifications.info(`🎯 ${SPELL_CONFIG.name} : ${turretTargets.length} tourelle${turretTargets.length > 1 ? 's' : ''} ont tiré sur ${totalTargets} cible${totalTargets > 1 ? 's' : ''} !${manaCostInfo}${stanceInfo}`);

    console.log(`[Raynart Tourelles] Spell complete - ${turretTargets.length} turrets, ${totalTargets} total targets`);

})();
