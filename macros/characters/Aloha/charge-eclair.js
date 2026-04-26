/**
 * Charge Éclair - Aloha (Niveau 1) - Version Simplifiée
 *
 * Aloha effectue une charge de combat. Le joueur gère manuellement les cibles touchées et le déplacement.
 *
 * MÉCANIQUES :
 * 1. Jet de touché automatique : Physique + bonus d'effets + 2 (niveau 1) + bonus manuel
 * 2. Jet de dégâts automatique : 1d6 + Physique
 * 3. Le joueur applique manuellement les dégâts aux cibles touchées
 * 4. Le joueur déplace Aloha manuellement sur le champ de bataille
 *
 * - Coût : 3 mana | Gratuit en Position Focus
 * - Caractéristique : Physique
 * - Niveau : 1 (bonus de +2 au jet de touché)
 *
 * Usage : Sélectionner le token d'Aloha, lancer la macro, appliquer résultats manuellement.
 */

(async () => {
  // ===== CONFIGURATION =====
  const SPELL_CONFIG = {
    name: "Charge Éclair",
    spellLevel: 1,
    characteristic: "physique",
    characteristicDisplay: "Physique",
    manaCost: 3,
    isFocusable: true,
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
    return (
      actor?.effects?.contents
        ?.find((e) =>
          ["focus", "offensif", "defensif"].includes(e.name?.toLowerCase()),
        )
        ?.name?.toLowerCase() || null
    );
  }

  function getActiveEffectBonus(actor, flagKey) {
    if (!actor?.effects) return 0;
    let total = 0;
    for (const effect of actor.effects.contents) {
      const v = effect.flags?.[flagKey]?.value;
      if (typeof v === "number") total += v;
    }
    return total;
  }

  function getCharacteristicValue(actor, characteristic) {
    const attr = actor.system.attributes?.[characteristic];
    if (!attr) {
      ui.notifications.error(
        `❌ Caractéristique '${characteristic}' non trouvée !`,
      );
      return null;
    }
    const base = attr.value || 3;
    const injuryEffect = actor?.effects?.contents?.find(
      (e) => e.name?.toLowerCase() === "blessures",
    );
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

  const actualManaCost =
    currentStance === "focus" && SPELL_CONFIG.isFocusable
      ? 0
      : SPELL_CONFIG.manaCost;
  const levelBonus = SPELL_CONFIG.spellLevel * 2; // +2 pour niveau 1

  // ===== CONFIG DIALOG =====
  const bonusAttack = await new Promise((resolve) => {
    new Dialog(
      {
        title: "⚡ Charge Éclair",
        content: `
                <div style="padding:12px; background:linear-gradient(135deg,#bf360c,#e64a19); border-radius:8px;">
                    <div style="text-align:center; margin-bottom:12px;">
                        <h3 style="margin:0; color:#fff; text-shadow:0 0 6px #ff7043;">⚡ Charge Éclair</h3>
                        <div style="color:#ffccbc; margin-top:4px; font-size:0.9em;">
                            <strong>${actor.name}</strong> &nbsp;|&nbsp;
                            Coût : <strong>${actualManaCost === 0 ? "GRATUIT (Focus)" : actualManaCost + " mana"}</strong>
                            ${currentStance ? ` &nbsp;|&nbsp; Position : <strong>${currentStance}</strong>` : ""}
                        </div>
                    </div>

                    <div style="background:rgba(255,255,255,0.15); border-radius:6px; padding:10px; margin:8px 0; color:#fff;">
                        <div style="margin-bottom:4px;">🎯 <strong>Touché :</strong> ${charInfo.final}d7 + ${levelBonus} (niv.${SPELL_CONFIG.spellLevel}) + bonus</div>
                        <div style="margin-bottom:4px;">💥 <strong>Dégâts :</strong> 1d6 + ${charInfo.final}</div>
                        <div style="font-size:0.85em; color:#ffccbc;">📋 Manipulation manuelle: cibles et déplacement.</div>
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
            callback: (html) =>
              resolve(parseInt(html.find("#bonusAtk").val()) || 0),
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Annuler",
            callback: () => resolve(null),
          },
        },
        default: "charge",
      },
      { width: 420 },
    ).render(true);
  });

  if (bonusAttack === null) {
    ui.notifications.info("❌ Charge annulée.");
    return;
  }

  // ===== COMBINED ATTACK AND DAMAGE ROLL =====
  const physiqueDice =
    charInfo.final + getActiveEffectBonus(actor, SPELL_CONFIG.characteristic);
  const attackFormula = `${physiqueDice}d7 + ${levelBonus}${bonusAttack !== 0 ? ` + ${bonusAttack}` : ""}`;

  const damageBonusEffect = getActiveEffectBonus(actor, "damage");
  const damageFormula = `1d6 + ${charInfo.final}${damageBonusEffect !== 0 ? ` + ${damageBonusEffect}` : ""}`;

  // Create combined roll with attack and damage
  const combinedRoll = new Roll(`{${attackFormula}, ${damageFormula}}`);
  await combinedRoll.evaluate({ async: true });

  // Extract results
  const attackRoll = { total: combinedRoll.terms[0].results[0].result };
  const baseScore = combinedRoll.terms[0].results[1].result;

  // ===== BUILD CHAT MESSAGE =====
  const manaCostDisplay =
    actualManaCost === 0 ? "GRATUIT (Focus)" : `${actualManaCost} mana`;
  const stanceLabel = currentStance
    ? ` · Position ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}${currentStance === "focus" ? " (Focusable)" : ""}`
    : "";

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
                <div style="color:#ffccbc; font-size:0.95em; margin-bottom:6px;">
                    <strong>🎯 Jet de touché :</strong>
                    <span style="font-size:1.3em; font-weight:bold; color:#fff; margin-left:6px;">${attackRoll.total}</span>
                    <small style="color:#ffab91; margin-left:6px;">(${attackFormula})</small>
                </div>
                <div style="color:#ffccbc; font-size:0.95em;">
                    <strong>🎲 Jet de dégâts :</strong>
                    <span style="font-size:1.2em; font-weight:bold; color:#fff; margin-left:6px;">${baseScore}</span>
                    <small style="color:#ffab91; margin-left:6px;">(${damageFormula})</small>
                </div>
            </div>

            <div style="background:rgba(255,255,255,0.12); padding:8px 12px; border-radius:6px; margin:8px 0; border-left:3px solid #ff9800;">
                <div style="color:#ffccbc; font-size:0.9em; font-style:italic;">
                    📋 Applique les dégâts manuellement aux cibles. Déplace Aloha sur le champ de bataille.
                </div>
            </div>

            <div style="margin-top:10px; padding:6px 10px; background:rgba(255,87,34,0.2); border-radius:6px;
                font-size:0.82em; color:#ffab91; text-align:center;">
                ⚡ <strong>Physique :</strong> ${charInfo.final}
                &nbsp;|&nbsp; <strong>Dés d'attaque :</strong> ${physiqueDice}d7
                &nbsp;|&nbsp; <strong>Bonus niveau :</strong> +${levelBonus}
                ${bonusAttack !== 0 ? `&nbsp;|&nbsp; <strong>Bonus manuel :</strong> +${bonusAttack}` : ""}
            </div>
        </div>
    `;

  await combinedRoll.toMessage({
    speaker: ChatMessage.getSpeaker({ token: caster }),
    flavor: chatContent,
    rollMode: game.settings.get("core", "rollMode"),
  });

  // ===== NOTIFICATION =====
  ui.notifications.info(
    `⚡ Charge Éclair ! Touché: ${attackRoll.total} | Dégâts: ${baseScore} | ${manaCostDisplay} — Applique manuellement, déplace Aloha !`,
  );

  console.log(
    `[DEBUG] Charge Éclair — atk: ${attackRoll.total}, dmg: ${baseScore}`,
  );
})();
