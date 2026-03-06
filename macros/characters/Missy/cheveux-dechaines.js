/**
 * Cheveux Déchaînés - Missy
 *
 * Missy libère une explosion capillaire magique en cône qui frappe jusqu'à 3 ennemis.
 *
 * - Caractéristique : Dextérité
 * - Zone : Cône de 120° sur 4 cases de rayon (direction choisie via Portal)
 * - Animation : Trois cônes violets simultanés (±40° pour couvrir 120°)
 * - Sélection des cibles : Jusqu'à 3 cibles dans la zone, pré-sélectionnées puis modifiables
 *
 * Mécanique de dégâts selon le nombre de cibles choisies :
 *   1 cible  → 2d4 + Dextérité
 *   2 cibles → une : 2d4 + Dextérité  |  autre : 1d4 + Dextérité/2 (arrondi supérieur)
 *   3 cibles → chaque : 1d4 + Dextérité/2 (arrondi supérieur)
 *
 * - Coût : 6 mana | Demi-Focus : 3 mana si Missy est en posture Focus
 *
 * Usage : Sélectionner le token de Missy, choisir la direction, valider les cibles.
 */

(async () => {
    // ===== CONFIGURATION =====
    const SPELL_CONFIG = {
        name: "Cheveux Déchaînés",
        characteristic: "dexterite",
        characteristicDisplay: "Dextérité",
        manaCostBase: 6,
        manaCostFocus: 3, // demi-focus
        coneAngle: 120,   // degrés
        coneRange: 4,     // cases
        maxTargets: 3,
        animation: {
            cone: "jb2a_patreon.cone_of_cold.purple",
            cast: null
        },
        targeting: {
            color: "#9c27b0",
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Purple_400x400.webm"
        }
    };

    // ===== VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token de Missy !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;

    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé pour le token sélectionné !");
        return;
    }

    // ===== UTILITY FUNCTIONS =====
    function getCurrentStance(actor) {
        return actor?.effects?.contents?.find(e =>
            ['focus', 'offensif', 'defensif'].includes(e.name?.toLowerCase())
        )?.name?.toLowerCase() || null;
    }

    function getActiveEffectBonus(actor, flagKey) {
        if (!actor?.effects) return 0;
        let totalBonus = 0;
        for (const effect of actor.effects.contents) {
            const flagValue = effect.flags?.[flagKey]?.value;
            if (typeof flagValue === 'number') {
                totalBonus += flagValue;
            }
        }
        return totalBonus;
    }

    function getCharacteristicValue(actor, characteristic) {
        const charAttribute = actor.system.attributes?.[characteristic];
        if (!charAttribute) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
            return null;
        }
        const baseValue = charAttribute.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
        const finalValue = Math.max(1, injuryAdjusted + effectBonus);
        return { base: baseValue, injuries: injuryStacks, effectBonus, injuryAdjusted, final: finalValue };
    }

    // ===== STATS =====
    const currentStance = getCurrentStance(actor);
    const characteristicInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!characteristicInfo) return;

    const actualManaCost = currentStance === 'focus'
        ? SPELL_CONFIG.manaCostFocus
        : SPELL_CONFIG.manaCostBase;

    const dexFull = characteristicInfo.final;
    const dexHalf = Math.ceil(dexFull / 2);

    // ===== DIRECTION TARGETING VIA PORTAL =====
    let direction;
    try {
        const portal = new Portal()
            .origin(caster)
            .range(SPELL_CONFIG.coneRange * canvas.grid.size)
            .color(SPELL_CONFIG.targeting.color)
            .texture(SPELL_CONFIG.targeting.texture);

        ui.notifications.info("🎯 Sélectionnez la direction du cône de Cheveux Déchaînés...");
        direction = await portal.pick();
    } catch (err) {
        ui.notifications.error("❌ Erreur lors du ciblage. Vérifiez que le module Portal est installé.");
        return;
    }

    if (!direction) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    // ===== COMPUTE CONE DIRECTION =====
    const casterCenter = {
        x: caster.x + caster.w / 2,
        y: caster.y + caster.h / 2
    };

    const directionAngle = Math.atan2(direction.y - casterCenter.y, direction.x - casterCenter.x);
    const directionDeg = (directionAngle * 180 / Math.PI + 360) % 360;

    console.log(`[DEBUG] Cheveux Déchaînés direction: ${directionDeg.toFixed(1)}°`);

    // ===== AUTO-DETECT TARGETS IN CONE =====
    function findTargetsInCone() {
        const targets = [];
        const gridSize = canvas.grid.size;
        const halfAngle = SPELL_CONFIG.coneAngle / 2;
        const rangeInPx = SPELL_CONFIG.coneRange * gridSize;

        for (const token of canvas.tokens.placeables) {
            if (token === caster) continue;
            if (!token.visible) continue;

            const tokenCenterX = token.x + token.w / 2;
            const tokenCenterY = token.y + token.h / 2;

            const dx = tokenCenterX - casterCenter.x;
            const dy = tokenCenterY - casterCenter.y;
            const distPx = Math.sqrt(dx * dx + dy * dy);
            if (distPx > rangeInPx) continue;

            const tokenDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
            let angleDiff = Math.abs(tokenDeg - directionDeg);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            if (angleDiff <= halfAngle) {
                targets.push({
                    token,
                    name: token.name,
                    actor: token.actor,
                    distance: distPx / gridSize,
                    angleDiff
                });
                console.log(`[DEBUG] Cone target: ${token.name}, dist=${(distPx / gridSize).toFixed(1)} cases, angleDiff=${angleDiff.toFixed(1)}°`);
            }
        }

        // Sort by distance (closest first)
        targets.sort((a, b) => a.distance - b.distance);
        return targets;
    }

    const coneTargets = findTargetsInCone();

    if (coneTargets.length === 0) {
        ui.notifications.warn("⚠️ Aucune cible trouvée dans le cône !\nLe sort est tout de même exécuté.");
    }

    // ===== TARGET SELECTION DIALOG =====
    const preSelected = coneTargets.slice(0, SPELL_CONFIG.maxTargets);

    async function showTargetSelectionDialog() {
        if (coneTargets.length === 0) {
            return { selectedTargets: [], bonusAttack: 0 };
        }

        return new Promise((resolve) => {
            // Build rows for each detected target
            const targetRows = coneTargets.map((t, i) => {
                const isPreselected = i < SPELL_CONFIG.maxTargets;
                const tokenImg = t.token.document.texture.src;
                return `
                    <label style="display:flex; align-items:center; gap:10px; padding:8px 10px; margin:4px 0;
                        background:${isPreselected ? 'linear-gradient(135deg,#f3e5f5,#ede7f6)' : '#f5f5f5'};
                        border:2px solid ${isPreselected ? '#9c27b0' : '#ccc'}; border-radius:6px; cursor:pointer;">
                        <input type="checkbox" name="target" value="${i}" ${isPreselected ? 'checked' : ''}
                            style="accent-color:#9c27b0; width:16px; height:16px; cursor:pointer;">
                        <img src="${tokenImg}" style="width:32px;height:32px;border-radius:50%;border:2px solid #9c27b0;object-fit:cover;">
                        <div style="flex-grow:1;">
                            <strong>${t.name}</strong>
                            <span style="font-size:0.8em; color:#777; margin-left:8px;">
                                (${t.distance.toFixed(1)} cases, ${t.angleDiff.toFixed(0)}° du centre)
                            </span>
                        </div>
                    </label>
                `;
            }).join('');

            // Compute damage preview
            const dmg1 = `2d4 + ${dexFull}`;
            const dmg2a = `2d4 + ${dexFull}`, dmg2b = `1d4 + ${dexHalf}`;
            const dmg3 = `1d4 + ${dexHalf}`;

            const dmgPreview = `
                <div style="padding:8px 12px; background:#f3e5f5; border-radius:6px; border-left:4px solid #9c27b0; margin-top:10px; font-size:0.88em; color:#4a148c;">
                    <strong>🎲 Dégâts selon nombre de cibles :</strong><br>
                    <span>1 cible → <code>${dmg1}</code></span><br>
                    <span>2 cibles → <code>${dmg2a}</code> + <code>${dmg2b}</code></span><br>
                    <span>3 cibles → chaque : <code>${dmg3}</code></span>
                </div>
            `;

            new Dialog({
                title: "💇‍♀️ Cheveux Déchaînés — Cibles",
                content: `
                    <div style="padding:10px;">
                        <div style="text-align:center; margin-bottom:14px; padding:12px;
                            background:linear-gradient(135deg,#4a148c,#7b1fa2); border-radius:8px;">
                            <h3 style="margin:0; color:#fff; text-shadow:0 0 8px #ce93d8;">
                                💇‍♀️ Cheveux Déchaînés
                            </h3>
                            <div style="color:#e1bee7; margin-top:4px; font-size:0.9em;">
                                <strong>${actor.name}</strong> &nbsp;|&nbsp;
                                <strong>Coût :</strong> ${actualManaCost} mana
                                ${currentStance === 'focus' ? ' <em>(Demi-Focus)</em>' : ''}
                                &nbsp;|&nbsp; <strong>Dextérité :</strong> ${dexFull}
                            </div>
                        </div>

                        <p style="margin:0 0 8px 0; color:#555; font-size:0.9em;">
                            <strong>${coneTargets.length}</strong> cible${coneTargets.length > 1 ? 's' : ''} détectée${coneTargets.length > 1 ? 's' : ''} dans le cône
                            (max <strong>${SPELL_CONFIG.maxTargets}</strong> sélectionnables) :
                        </p>

                        <div id="target-list">${targetRows}</div>
                        <div id="target-warning" style="display:none; color:#d32f2f; font-size:0.85em; margin-top:4px;">
                            ⚠️ Maximum 3 cibles autorisé.
                        </div>

                        <div style="margin-top:12px;">
                            <label style="font-size:0.9em;"><strong>Bonus d'attaque manuel :</strong></label>
                            <input type="number" id="bonusAttack" value="0" min="-10" max="10"
                                style="width:70px; margin-left:8px; padding:4px; border:1px solid #ccc; border-radius:4px;">
                        </div>

                        ${dmgPreview}
                    </div>
                `,
                buttons: {
                    cast: {
                        icon: '<i class="fas fa-wind"></i>',
                        label: "Lancer !",
                        callback: (html) => {
                            const checked = [...html.find('input[name="target"]:checked')].map(el => parseInt(el.value));
                            if (checked.length > SPELL_CONFIG.maxTargets) {
                                ui.notifications.warn(`⚠️ Maximum ${SPELL_CONFIG.maxTargets} cibles !`);
                                return;
                            }
                            const bonusAttack = parseInt(html.find('#bonusAttack').val()) || 0;
                            resolve({ selectedTargets: checked.map(i => coneTargets[i]), bonusAttack });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Annuler",
                        callback: () => resolve(null)
                    }
                },
                default: "cast",
                close: () => resolve(null),
                render: (html) => {
                    // Enforce max 3 checkboxes
                    html.find('input[name="target"]').on('change', () => {
                        const checkedCount = html.find('input[name="target"]:checked').length;
                        html.find('#target-warning').toggle(checkedCount > SPELL_CONFIG.maxTargets);
                        if (checkedCount > SPELL_CONFIG.maxTargets) {
                            // Uncheck the last one that was just checked
                            const last = [...html.find('input[name="target"]:checked')].pop();
                            $(last).prop('checked', false);
                        }
                    });
                }
            }, { width: 480 }).render(true);
        });
    }

    const selection = await showTargetSelectionDialog();
    if (selection === null) {
        ui.notifications.info("❌ Sort annulé.");
        return;
    }

    const { selectedTargets, bonusAttack } = selection;
    const numTargets = selectedTargets.length;

    // ===== BUILD DAMAGE ASSIGNMENTS =====
    // Returns array of { target, formula, label }
    function buildDamageAssignments(targets) {
        const count = targets.length;
        if (count === 0) return [];
        if (count === 1) {
            return [{ target: targets[0], formula: `2d4 + ${dexFull}`, label: `2d4 + Dex (${dexFull})` }];
        }
        if (count === 2) {
            return [
                { target: targets[0], formula: `2d4 + ${dexFull}`, label: `2d4 + Dex (${dexFull})` },
                { target: targets[1], formula: `1d4 + ${dexHalf}`, label: `1d4 + Dex/2 (${dexHalf})` }
            ];
        }
        // 3 targets
        return targets.map(t => ({
            target: t,
            formula: `1d4 + ${dexHalf}`,
            label: `1d4 + Dex/2 (${dexHalf})`
        }));
    }

    const damageAssignments = buildDamageAssignments(selectedTargets);

    // ===== ANIMATION =====
    async function playSpellAnimation() {
        try {
            if (typeof Sequence === "undefined") {
                console.warn("[DEBUG] Cheveux Déchaînés: Sequencer non disponible.");
                return;
            }

            // End angle in pixels for cone stretch
            const coneRangePx = SPELL_CONFIG.coneRange * canvas.grid.size;
            const endCenter = {
                x: casterCenter.x + Math.cos(directionAngle) * coneRangePx,
                y: casterCenter.y + Math.sin(directionAngle) * coneRangePx
            };

            // Function to compute an offset endpoint rotated by `offsetDeg`
            function rotatedEnd(offsetDeg) {
                const rad = directionAngle + (offsetDeg * Math.PI / 180);
                return {
                    x: casterCenter.x + Math.cos(rad) * coneRangePx,
                    y: casterCenter.y + Math.sin(rad) * coneRangePx
                };
            }

            const endLeft = rotatedEnd(-40);
            const endRight = rotatedEnd(+40);

            await new Sequence()
                // Center cone
                .effect()
                .file(SPELL_CONFIG.animation.cone)
                .atLocation(casterCenter)
                .stretchTo(endCenter)
                .scale(1.0)
                .tint("#9c00ff")
                .belowTokens(false)
                // Left cone (−40°)
                .effect()
                .file(SPELL_CONFIG.animation.cone)
                .atLocation(casterCenter)
                .stretchTo(endLeft)
                .scale(0.9)
                .tint("#7b00cc")
                .belowTokens(false)
                // Right cone (+40°)
                .effect()
                .file(SPELL_CONFIG.animation.cone)
                .atLocation(casterCenter)
                .stretchTo(endRight)
                .scale(0.9)
                .tint("#7b00cc")
                .belowTokens(false)
                .play();

        } catch (err) {
            console.warn("[DEBUG] Cheveux Déchaînés: Erreur animation :", err);
        }
    }

    await playSpellAnimation();

    // ===== ROLL DICE FOR EACH TARGET =====
    const rollResults = [];

    for (const assign of damageAssignments) {
        const roll = new Roll(assign.formula);
        await roll.evaluate({ async: true });
        rollResults.push({
            target: assign.target,
            formula: assign.formula,
            label: assign.label,
            total: roll.total,
            roll
        });
    }

    // ===== ATTACK ROLL (single, vs all targets simultaneously) =====
    // Level 2 spell → fixed bonus of +4 (level × 2) on the hit roll
    const SPELL_LEVEL = 2;
    const levelBonus = SPELL_LEVEL * 2; // +4
    const attackDice = dexFull + getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const attackFormula = `${attackDice}d7 + ${levelBonus}${bonusAttack !== 0 ? ` + ${bonusAttack}` : ''}`;
    const attackRoll = new Roll(attackFormula);
    await attackRoll.evaluate({ async: true });

    // ===== CHAT MESSAGE =====
    const manaCostDisplay = actualManaCost === 0 ? 'GRATUIT' : `${actualManaCost} mana`;
    const stanceLabel = currentStance
        ? ` (Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}${currentStance === 'focus' ? ' — Demi-Focus' : ''})`
        : '';

    const targetRows = numTargets > 0
        ? rollResults.map(r => `
            <div style="display:flex; justify-content:space-between; align-items:center;
                padding:6px 10px; margin:4px 0; background:#fff; border-radius:6px; border-left:4px solid #9c27b0;">
                <span><strong>🎯 ${r.target.name}</strong>
                    <small style="color:#777; margin-left:6px;">${r.label}</small>
                </span>
                <span style="font-size:1.25em; font-weight:bold; color:#6a1b9a;">💥 ${r.total}</span>
            </div>`).join('')
        : `<div style="color:#999; font-style:italic; padding:8px;">Aucune cible sélectionnée.</div>`;

    const noTargetsInZoneNote = coneTargets.length === 0
        ? `<div style="color:#d32f2f; font-size:0.85em; margin-top:6px;">⚠️ Aucune cible détectée dans la zone.</div>`
        : '';

    const chatContent = `
        <div style="background:linear-gradient(135deg,#3d0059,#6a1b9a); padding:14px; border-radius:10px; border:2px solid #9c27b0; margin:8px 0;">
            <div style="text-align:center; margin-bottom:12px;">
                <h3 style="margin:0; color:#e1bee7; text-shadow:0 0 8px #ce93d8;">💇‍♀️ Cheveux Déchaînés</h3>
                <div style="color:#ce93d8; margin-top:4px; font-size:0.9em;">
                    <strong>Lanceur :</strong> ${actor.name}${stanceLabel} &nbsp;|&nbsp;
                    <strong>Coût :</strong> ${manaCostDisplay}
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.12); padding:10px 12px; border-radius:8px; margin:8px 0;">
                <div style="color:#ffe0ff; font-size:1em; margin-bottom:6px;">
                    <strong>🎯 Jet d'attaque :</strong>
                    <span style="font-size:1.3em; font-weight:bold; color:#fff; margin-left:8px;">
                        ${attackRoll.total}
                    </span>
                    <small style="color:#d1b3d1; margin-left:6px;">(${attackFormula})</small>
                </div>
                <div style="color:#ffe0ff; font-size:0.9em;">
                    <strong>📐 Zone :</strong> Cône ${SPELL_CONFIG.coneAngle}° · ${SPELL_CONFIG.coneRange} cases
                    &nbsp;|&nbsp; <strong>Cibles :</strong> ${numTargets} / ${SPELL_CONFIG.maxTargets}
                </div>
            </div>

            <div style="margin:8px 0;">
                ${targetRows}
                ${noTargetsInZoneNote}
            </div>

            <div style="margin-top:10px; padding:8px 12px; background:rgba(156,0,255,0.25); border-radius:6px;
                border:1px solid #ce93d8; font-size:0.85em; color:#e1bee7; text-align:center;">
                🎲 <strong>Dextérité :</strong> ${dexFull}
                &nbsp;|&nbsp; <strong>Dex/2 :</strong> ${dexHalf}
                &nbsp;|&nbsp; <strong>Formule (1 cible) :</strong> 2d4+${dexFull}
                &nbsp;&nbsp;<strong>(3 cibles) :</strong> 1d4+${dexHalf} chacune
            </div>
        </div>
    `;

    // Send attack roll to chat (dice visible)
    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: chatContent,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== NOTIFICATION =====
    const dmgSummary = rollResults.map(r => `${r.target.name}: ${r.total}`).join(', ');
    ui.notifications.info(
        `💇‍♀️ Cheveux Déchaînés ! Attaque: ${attackRoll.total} | ${numTargets} cible${numTargets > 1 ? 's' : ''}${dmgSummary ? ` — ${dmgSummary}` : ''} — ${manaCostDisplay}`
    );

    console.log(`[DEBUG] Cheveux Déchaînés cast — Attack: ${attackRoll.total}, Targets: ${numTargets}, Results: ${dmgSummary}`);
})();
