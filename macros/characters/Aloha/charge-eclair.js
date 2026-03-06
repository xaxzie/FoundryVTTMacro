/**
 * Charge Éclair - Aloha (Niveau 1)
 *
 * Aloha fonce en ligne droite sur 6 cases dans une direction choisie.
 * Elle traverse toutes les cibles sur sa trajectoire et s'arrête si un mur
 * bloque son mouvement.
 *
 * MÉCANIQUES :
 * 1. Choix de la direction via Portal
 * 2. Aloha se déplace en ligne droite jusqu'à 6 cases (ou jusqu'au mur)
 * 3. Si un mur bloque : cases restantes × 2 = dégâts bonus supplémentaires à toutes les cibles
 * 4. Détection de toutes les cibles sur la trajectoire
 * 5. Jet de touché : Physique + bonus d'effets + 2 (niveau 1) + bonus manuel
 * 6. Dégâts : 1d6 + Physique
 *    - 1ère cible  → score complet
 *    - Autres cibles → moitié du score (arrondi inférieur)
 * 7. Aloha est déplacée physiquement à la fin de sa trajectoire
 *
 * - Coût : 3 mana | Gratuit en Position Focus
 * - Caractéristique : Physique
 * - Niveau : 1 (bonus de +2 au jet de touché)
 *
 * Usage : Sélectionner le token d'Aloha, choisir la direction.
 */

(async () => {
    // ===== CONFIGURATION =====
    const SPELL_CONFIG = {
        name: "Charge Éclair",
        spellLevel: 1,          // Niveau du sort → +2 au jet de touché
        characteristic: "physique",
        characteristicDisplay: "Physique",
        manaCost: 3,
        isFocusable: true,      // Gratuit en Focus
        chargeRange: 6,         // Nombre maximum de cases

        animations: {
            dash: "jb2a_patreon.ground_cracks.orange.01",
            impact: "jb2a.melee_generic.creature_attack.fist.001.red.0",
            wallCrash: "jb2a_patreon.impact.ground_crack.orange.01",
        },

        targeting: {
            range: 6,           // cases (utilisé uniquement pour la direction)
            color: "#ff5722",
            texture: "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Orange_400x400.webm"
        }
    };

    // ===== VALIDATION =====
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("⚠️ Sélectionnez le token d'Aloha !");
        return;
    }

    const caster = canvas.tokens.controlled[0];
    const actor = caster.actor;
    if (!actor) {
        ui.notifications.error("❌ Aucun acteur trouvé !");
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
        let total = 0;
        for (const effect of actor.effects.contents) {
            const v = effect.flags?.[flagKey]?.value;
            if (typeof v === 'number') total += v;
        }
        return total;
    }

    function getCharacteristicValue(actor, characteristic) {
        const attr = actor.system.attributes?.[characteristic];
        if (!attr) {
            ui.notifications.error(`❌ Caractéristique '${characteristic}' non trouvée !`);
            return null;
        }
        const base = attr.value || 3;
        const injuryEffect = actor?.effects?.contents?.find(e => e.name?.toLowerCase() === 'blessures');
        const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
        const effectBonus = getActiveEffectBonus(actor, characteristic);
        const injuryAdjusted = Math.max(1, base - injuryStacks);
        const final = Math.max(1, injuryAdjusted + effectBonus);
        return { base, injuries: injuryStacks, effectBonus, injuryAdjusted, final };
    }

    // ===== STATS =====
    const currentStance = getCurrentStance(actor);
    const charInfo = getCharacteristicValue(actor, SPELL_CONFIG.characteristic);
    if (!charInfo) return;

    const actualManaCost = (currentStance === 'focus' && SPELL_CONFIG.isFocusable) ? 0 : SPELL_CONFIG.manaCost;
    const levelBonus = SPELL_CONFIG.spellLevel * 2; // +2 pour niveau 1

    // ===== CONFIG DIALOG =====
    const bonusAttack = await new Promise(resolve => {
        new Dialog({
            title: "⚡ Charge Éclair",
            content: `
                <div style="padding:12px; background:linear-gradient(135deg,#bf360c,#e64a19); border-radius:8px;">
                    <div style="text-align:center; margin-bottom:12px;">
                        <h3 style="margin:0; color:#fff; text-shadow:0 0 6px #ff7043;">⚡ Charge Éclair</h3>
                        <div style="color:#ffccbc; margin-top:4px; font-size:0.9em;">
                            <strong>${actor.name}</strong> &nbsp;|&nbsp;
                            Coût : <strong>${actualManaCost === 0 ? 'GRATUIT (Focus)' : actualManaCost + ' mana'}</strong>
                            ${currentStance ? ` &nbsp;|&nbsp; Position : <strong>${currentStance}</strong>` : ''}
                        </div>
                    </div>

                    <div style="background:rgba(255,255,255,0.15); border-radius:6px; padding:10px; margin:8px 0; color:#fff;">
                        <div style="margin-bottom:4px;">⚡ <strong>Portée :</strong> ${SPELL_CONFIG.chargeRange} cases en ligne droite</div>
                        <div style="margin-bottom:4px;">🎯 <strong>Touché :</strong> ${charInfo.final}d7 + ${levelBonus} (niv.${SPELL_CONFIG.spellLevel}) + bonus</div>
                        <div style="margin-bottom:4px;">💥 <strong>Dégâts :</strong> 1d6 + ${charInfo.final} (1ère cible) · moitié pour les suivantes</div>
                        <div style="font-size:0.85em; color:#ffccbc;">🧱 Si mur : cases restantes × 2 en dégâts bonus à toutes les cibles</div>
                    </div>

                    <div style="margin-top:10px;">
                        <label style="color:#fff; font-size:0.9em;"><strong>Bonus d'attaque manuel :</strong></label>
                        <input type="number" id="bonusAtk" value="0" min="-10" max="20"
                            style="width:70px; margin-left:8px; padding:4px; border-radius:4px; border:none;">
                    </div>
                </div>
            `,
            buttons: {
                charge: {
                    icon: '<i class="fas fa-bolt"></i>',
                    label: "CHARGER !",
                    callback: html => resolve(parseInt(html.find('#bonusAtk').val()) || 0)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Annuler",
                    callback: () => resolve(null)
                }
            },
            default: "charge"
        }, { width: 420 }).render(true);
    });

    if (bonusAttack === null) {
        ui.notifications.info("❌ Charge annulée.");
        return;
    }

    // ===== DIRECTION VIA PORTAL =====
    let directionPick;
    try {
        const portalRangePx = SPELL_CONFIG.chargeRange * canvas.grid.size;
        const portal = new Portal()
            .origin(caster)
            .range(portalRangePx)
            .color(SPELL_CONFIG.targeting.color)
            .texture(SPELL_CONFIG.targeting.texture);

        ui.notifications.info("⚡ Sélectionnez la direction de la charge...");
        directionPick = await portal.pick();
    } catch (err) {
        ui.notifications.error("❌ Erreur Portal. Vérifiez que le module Portal est installé.");
        return;
    }

    if (!directionPick) {
        ui.notifications.info("❌ Charge annulée.");
        return;
    }

    // ===== COMPUTE DIRECTION UNIT VECTOR =====
    const gridSize = canvas.grid.size;

    const casterCenterX = caster.x + caster.w / 2;
    const casterCenterY = caster.y + caster.h / 2;

    const rawDx = directionPick.x - casterCenterX;
    const rawDy = directionPick.y - casterCenterY;
    const rawDist = Math.sqrt(rawDx * rawDx + rawDy * rawDy);

    if (rawDist < 1) {
        ui.notifications.warn("⚠️ Direction trop courte. Clinquez plus loin.");
        return;
    }

    // Snap to 8 cardinal/diagonal directions for grid-based movement
    const angle = Math.atan2(rawDy, rawDx);
    const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
    const unitX = Math.round(Math.cos(snapAngle)); // -1, 0, or 1
    const unitY = Math.round(Math.sin(snapAngle)); // -1, 0, or 1

    console.log(`[DEBUG] Charge Éclair — direction angle: ${(angle * 180 / Math.PI).toFixed(1)}°, snapped: (${unitX}, ${unitY})`);

    // ===== WALL COLLISION CHECK =====
    /**
     * Test if there is a wall between two canvas points (move collision)
     */
    function hasWallBetween(x1, y1, x2, y2) {
        try {
            const ray = new Ray({ x: x1, y: y1 }, { x: x2, y: y2 });

            // FoundryVTT v13 wall collision API
            if (canvas.walls?.checkCollision) {
                return canvas.walls.checkCollision(ray, { type: "move", mode: "any" });
            }
            // Fallback for older API
            if (canvas.walls?.getRayCollisions) {
                const collisions = canvas.walls.getRayCollisions(ray, { type: "move" });
                return collisions.length > 0;
            }
            return false;
        } catch (err) {
            console.warn("[DEBUG] Wall check error:", err);
            return false;
        }
    }

    // ===== WALK THE CHARGE PATH =====
    const chargeSteps = []; // each step: {x, y, centerX, centerY} in canvas coords
    let blockedByWall = false;
    let wallHitAtStep = -1; // index of step where wall was hit

    let prevCenterX = casterCenterX;
    let prevCenterY = casterCenterY;

    for (let step = 1; step <= SPELL_CONFIG.chargeRange; step++) {
        const nextCenterX = casterCenterX + unitX * step * gridSize;
        const nextCenterY = casterCenterY + unitY * step * gridSize;

        // Check for wall between prev center and next center
        if (hasWallBetween(prevCenterX, prevCenterY, nextCenterX, nextCenterY)) {
            blockedByWall = true;
            wallHitAtStep = step; // wall found before completing this step
            console.log(`[DEBUG] Wall detected at step ${step} (before reaching cell ${step})`);
            break;
        }

        // Top-left corner of the grid cell
        const cellX = Math.floor(nextCenterX / gridSize) * gridSize;
        const cellY = Math.floor(nextCenterY / gridSize) * gridSize;

        chargeSteps.push({
            step,
            x: cellX,
            y: cellY,
            centerX: nextCenterX,
            centerY: nextCenterY
        });

        prevCenterX = nextCenterX;
        prevCenterY = nextCenterY;
    }

    const cellsTraversed = chargeSteps.length;
    const cellsRemaining = blockedByWall ? (SPELL_CONFIG.chargeRange - wallHitAtStep + 1) : 0;
    const wallBonusDamage = cellsRemaining * 2;

    console.log(`[DEBUG] Charge path: ${cellsTraversed} cells traversed, wall: ${blockedByWall}, remaining: ${cellsRemaining}, wall bonus dmg: ${wallBonusDamage}`);

    // Destination: last reachable grid tile
    const destination = chargeSteps.length > 0
        ? { x: chargeSteps[chargeSteps.length - 1].x, y: chargeSteps[chargeSteps.length - 1].y }
        : { x: caster.x, y: caster.y }; // didn't move

    // ===== DETECT TARGETS ON PATH =====
    /**
     * Find all tokens whose center falls within one grid cell of the charge line
     */
    function findTargetsOnPath() {
        const hits = [];
        for (const token of canvas.tokens.placeables) {
            if (token === caster) continue;
            if (!token.visible) continue;

            const tokenCenterX = token.x + token.w / 2;
            const tokenCenterY = token.y + token.h / 2;

            for (const step of chargeSteps) {
                const dx = tokenCenterX - step.centerX;
                const dy = tokenCenterY - step.centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Hit if within half grid size (token overlaps the charge path cell)
                if (dist <= gridSize * 0.75) {
                    if (!hits.find(h => h.token === token)) {
                        hits.push({ token, name: token.name, actor: token.actor, step: step.step });
                    }
                    break;
                }
            }
        }
        // Sort by step order (first encountered first)
        hits.sort((a, b) => a.step - b.step);
        return hits;
    }

    const targetsHit = findTargetsOnPath();

    // ===== ANIMATIONS =====
    async function playChargeAnimation() {
        if (typeof Sequence === "undefined") {
            console.warn("[DEBUG] Charge Éclair: Sequencer not available.");
            return;
        }

        try {
            const endCenter = destination;

            const seq = new Sequence();

            // Dash trail from caster to destination
            seq.effect()
                .file(SPELL_CONFIG.animations.dash)
                .atLocation(caster)
                .stretchTo(endCenter)
                .scale(0.7)
                .tint("#ff7043")
                .belowTokens(false)
                .duration(600)
                .fadeIn(100)
                .fadeOut(200);

            // Impact animations on each target
            for (const hit of targetsHit) {
                const hitCenter = {
                    x: hit.token.x + hit.token.w / 2,
                    y: hit.token.y + hit.token.h / 2
                };
                seq.effect()
                    .file(SPELL_CONFIG.animations.impact)
                    .atLocation(hitCenter)
                    .scale(0.9)
                    .tint("#ff5722")
                    .delay(400)
                    .duration(800)
                    .fadeOut(300);
            }

            // Wall crash effect if movement was blocked
            if (blockedByWall && chargeSteps.length > 0) {
                const lastCell = chargeSteps[chargeSteps.length - 1];
                // Project one more step forward to show where the wall is
                const wallFaceCenter = {
                    x: lastCell.centerX + unitX * gridSize * 0.5,
                    y: lastCell.centerY + unitY * gridSize * 0.5
                };
                seq.effect()
                    .file(SPELL_CONFIG.animations.wallCrash)
                    .atLocation(wallFaceCenter)
                    .scale(1.2)
                    .tint("#ff9800")
                    .delay(500)
                    .duration(1500)
                    .fadeOut(500);
            }

            await seq.play();
        } catch (err) {
            console.warn("[DEBUG] Charge animation error:", err);
        }
    }

    await playChargeAnimation();

    // ===== MOVE ALOHA =====
    try {
        if (destination.x !== caster.x || destination.y !== caster.y) {
            if (globalThis.gmSocket) {
                await globalThis.gmSocket.executeAsGM("updateToken", caster.id, {
                    x: destination.x,
                    y: destination.y
                });
            } else {
                await caster.document.update({ x: destination.x, y: destination.y });
            }
            console.log(`[DEBUG] Aloha moved to (${destination.x}, ${destination.y})`);
        }
    } catch (err) {
        console.warn("[DEBUG] Token move error:", err);
        // Try direct update as fallback
        try {
            await caster.document.update({ x: destination.x, y: destination.y });
        } catch (err2) {
            console.error("[DEBUG] Could not move token:", err2);
        }
    }

    // ===== ROLL DICE =====
    // Attack roll: Physique dice + level bonus + manual bonus
    const physiqueDice = charInfo.final + getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
    const attackFormula = `${physiqueDice}d7 + ${levelBonus}${bonusAttack !== 0 ? ` + ${bonusAttack}` : ''}`;
    const attackRoll = new Roll(attackFormula);
    await attackRoll.evaluate({ async: true });

    // Damage roll: 1d6 + Physique
    const damageBonusEffect = getActiveEffectBonus(actor, 'damage');
    const damageFormula = `1d6 + ${charInfo.final}${damageBonusEffect !== 0 ? ` + ${damageBonusEffect}` : ''}`;
    const damageRoll = new Roll(damageFormula);
    await damageRoll.evaluate({ async: true });

    // Per target damage assignment
    const baseScore = damageRoll.total;
    const halfScore = Math.floor(baseScore / 2);

    // ===== BUILD CHAT MESSAGE =====
    const manaCostDisplay = actualManaCost === 0 ? 'GRATUIT (Focus)' : `${actualManaCost} mana`;
    const stanceLabel = currentStance
        ? ` · Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}${currentStance === 'focus' ? ' (Focusable)' : ''}`
        : '';

    // Path info
    const pathInfo = blockedByWall
        ? `<span style="color:#ff6f00;">🧱 Mur ! Cases restantes : <strong>${cellsRemaining}</strong> → <strong>+${wallBonusDamage} dégâts bonus</strong></span>`
        : `<span style="color:#43a047;">✅ Trajectoire libre sur ${cellsTraversed} case${cellsTraversed > 1 ? 's' : ''}</span>`;

    // Target rows
    const targetRows = targetsHit.length > 0
        ? targetsHit.map((hit, i) => {
            const isFirst = i === 0;
            const rawDmg = isFirst ? baseScore : halfScore;
            const finalDmg = rawDmg + (blockedByWall ? wallBonusDamage : 0);
            const tokenImg = hit.token.document.texture.src;
            return `
                <div style="display:flex; align-items:center; gap:10px; padding:6px 10px; margin:4px 0;
                    background:${isFirst ? 'rgba(255,87,34,0.18)' : 'rgba(255,152,0,0.12)'};
                    border-left:4px solid ${isFirst ? '#ff5722' : '#ff9800'}; border-radius:6px;">
                    <img src="${tokenImg}" style="width:30px;height:30px;border-radius:50%;border:2px solid ${isFirst ? '#ff5722' : '#ff9800'};object-fit:cover;">
                    <div style="flex:1;">
                        <strong>${hit.name}</strong>
                        <span style="font-size:0.8em; color:#bbb; margin-left:6px;">${isFirst ? '(1ère cible)' : '(secondaire)'}</span>
                        ${blockedByWall ? `<span style="font-size:0.8em; color:#ff9800;"> + ${wallBonusDamage} (mur)</span>` : ''}
                    </div>
                    <span style="font-size:1.3em; font-weight:bold; color:${isFirst ? '#ff7043' : '#ffa726'};">
                        💥 ${finalDmg}
                    </span>
                </div>`;
        }).join('')
        : `<div style="color:#999; font-style:italic; padding:8px; text-align:center;">Aucune cible sur le chemin.</div>`;

    const chatContent = `
        <div style="background:linear-gradient(135deg,#3e0000,#b71c1c); padding:14px; border-radius:10px;
            border:2px solid #ff5722; margin:8px 0;">
            <div style="text-align:center; margin-bottom:12px;">
                <h3 style="margin:0; color:#ffccbc; text-shadow:0 0 8px #ff7043;">⚡ Charge Éclair</h3>
                <div style="color:#ffab91; margin-top:4px; font-size:0.9em;">
                    <strong>${actor.name}</strong>${stanceLabel} &nbsp;|&nbsp;
                    Coût : <strong>${manaCostDisplay}</strong> &nbsp;|&nbsp;
                    Niveau <strong>${SPELL_CONFIG.spellLevel}</strong> (+${levelBonus} touché)
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.1); padding:8px 12px; border-radius:6px; margin:8px 0;">
                <div style="color:#ffccbc; margin-bottom:4px; font-size:0.95em;">
                    <strong>📐 Trajectoire :</strong> ${cellsTraversed} case${cellsTraversed > 1 ? 's' : ''} · ${pathInfo}
                </div>
                <div style="color:#ffccbc; font-size:0.95em;">
                    <strong>🎯 Jet de touché :</strong>
                    <span style="font-size:1.3em; font-weight:bold; color:#fff; margin-left:6px;">${attackRoll.total}</span>
                    <small style="color:#ffab91; margin-left:6px;">(${attackFormula})</small>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.1); padding:8px 12px; border-radius:6px; margin:8px 0;">
                <div style="color:#ffccbc; font-size:0.95em; margin-bottom:4px;">
                    <strong>🎲 Jet de dégâts :</strong>
                    <span style="font-size:1.2em; font-weight:bold; color:#fff; margin-left:6px;">${baseScore}</span>
                    <small style="color:#ffab91; margin-left:6px;">(${damageFormula}) · Moitié : ${halfScore}</small>
                </div>
                ${blockedByWall ? `<div style="color:#ffd54f; font-size:0.9em;">🧱 Bonus mur : +${wallBonusDamage} sur toutes les cibles</div>` : ''}
            </div>

            <div style="color:#ffccbc; font-size:0.9em; font-weight:bold; margin:8px 0 4px 0;">
                🎯 Cibles touchées (${targetsHit.length}) :
            </div>
            ${targetRows}

            <div style="margin-top:10px; padding:6px 10px; background:rgba(255,87,34,0.2); border-radius:6px;
                font-size:0.82em; color:#ffab91; text-align:center;">
                ⚡ <strong>Physique :</strong> ${charInfo.final}
                &nbsp;|&nbsp; <strong>Dés d'attaque :</strong> ${physiqueDice}d7
                &nbsp;|&nbsp; <strong>Bonus niveau :</strong> +${levelBonus}
                ${bonusAttack !== 0 ? `&nbsp;|&nbsp; <strong>Bonus manuel :</strong> +${bonusAttack}` : ''}
            </div>
        </div>
    `;

    await attackRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ token: caster }),
        flavor: chatContent,
        rollMode: game.settings.get("core", "rollMode")
    });

    // ===== NOTIFICATION =====
    const dmgLine = targetsHit.length > 0
        ? targetsHit.map((h, i) => {
            const raw = i === 0 ? baseScore : halfScore;
            return `${h.name}: ${raw + (blockedByWall ? wallBonusDamage : 0)}`;
        }).join(', ')
        : 'pas de cibles';

    ui.notifications.info(
        `⚡ Charge Éclair ! Touché: ${attackRoll.total} | Dégâts: ${baseScore} (moitié: ${halfScore})` +
        `${blockedByWall ? ` | 🧱 Mur ! +${wallBonusDamage} bonus` : ''} | ${dmgLine} | ${manaCostDisplay}`
    );

    console.log(`[DEBUG] Charge Éclair — atk: ${attackRoll.total}, dmg: ${baseScore}, halfDmg: ${halfScore}, wall: ${blockedByWall}, wallBonus: ${wallBonusDamage}, targets: ${targetsHit.map(h => h.name).join(', ')}`);

})();
