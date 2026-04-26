/**
 * Livre de Compagnie - Urgen
 *
 * Urgen invoque un livre de compagnie qui se lie à un allié (ou lui-même)
 * et amplifie sa puissance offensive.
 *
 * - Caractéristique : Esprit (pour calcul du bonus de dégâts)
 * - Coût : 2 mana (non focalisable)
 * - Niveau de sort : 1
 * - Cibles : Urgen lui-même ou un allié visible sur le canvas
 * - Effet : Ajoute + ceil(Esprit / 2) aux dégâts de la cible
 * - Animation : projectile bleu depuis Urgen → cible, puis chauve souris
 *
 * Usage : Sélectionner le token de Urgen, lancer la macro et cibler un allié (ou soi-même).
 */

(async () => {
  // ===== CONFIGURATION DU SORT =====
  const SPELL_CONFIG = {
    name: "Livre de Compagnie",
    description:
      "Un livre s'envole et se lie à un allié, amplifiant ses dégâts.",
    manaCost: 2,
    isFocusable: false,
    effectIcon: "icons/creatures/claws/claw-talons-yellow-red.webp",
    effectName: "Livre de Compagnie",
    characteristic: "esprit",
    characteristicDisplay: "Esprit",
    spellLevel: 1,
    animations: {
      projectile: "jb2a_patreon.magic_missile.blue",
      impact: "jb2a.shield.01.complete.01.blue",
      attachment: "animated-spell-effects.misc.bat.loop.square",
    },
    targeting: {
      range: 180,
      color: "#4169e1",
      texture:
        "modules/jb2a/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
    },
  };

  // ===== VALIDATION BASIQUE =====
  if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("⚠️ Sélectionnez le token de Urgen !");
    return;
  }

  const caster = canvas.tokens.controlled[0];
  const actor = caster.actor;

  if (!actor) {
    ui.notifications.error(
      "❌ Aucun acteur trouvé pour le token sélectionné !",
    );
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
    let totalBonus = 0;
    for (const effect of actor.effects.contents) {
      const flagValue = effect.flags?.[flagKey]?.value;
      if (typeof flagValue === "number") {
        totalBonus += flagValue;
      }
    }
    return totalBonus;
  }

  function getCharacteristicValue(actor, characteristic) {
    const charAttribute = actor.system.attributes?.[characteristic];
    if (!charAttribute) {
      throw new Error(`Caractéristique ${characteristic} non trouvée !`);
    }
    const baseValue = charAttribute.value || 3;
    const injuryEffect = actor?.effects?.contents?.find(
      (e) => e.name?.toLowerCase() === "blessures",
    );
    const injuryStacks = injuryEffect?.flags?.statuscounter?.value || 0;
    const effectBonus = getActiveEffectBonus(actor, characteristic);
    const injuryAdjusted = Math.max(1, baseValue - injuryStacks);
    const finalValue = Math.max(1, injuryAdjusted + effectBonus);
    return {
      base: baseValue,
      injuries: injuryStacks,
      effectBonus,
      injuryAdjusted,
      final: finalValue,
    };
  }

  async function applyEffectWithGMDelegation(targetToken, effectData) {
    if (targetToken.actor.isOwner) {
      await targetToken.actor.createEmbeddedDocuments("ActiveEffect", [
        effectData,
      ]);
      return { success: true };
    }
    if (!globalThis.gmSocket) {
      ui.notifications.error("GM Socket non disponible !");
      return { success: false, error: "GM Socket non disponible" };
    }
    try {
      const result = await globalThis.gmSocket.executeAsGM(
        "applyEffectToActor",
        targetToken.id,
        effectData,
      );
      return result?.success
        ? { success: true }
        : { success: false, error: result?.error };
    } catch (error) {
      console.error("Error applying effect:", error);
      return { success: false, error: error.message };
    }
  }

  async function removeEffectWithGMDelegation(targetToken, effectId) {
    if (targetToken.actor.isOwner) {
      const effect = targetToken.actor.effects.get(effectId);
      if (effect) await effect.delete();
      return { success: true };
    }
    if (!globalThis.gmSocket) {
      return { success: false, error: "GM Socket non disponible" };
    }
    try {
      return await globalThis.gmSocket.executeAsGM(
        "removeEffectFromActor",
        targetToken.id,
        effectId,
      );
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ===== STATS =====
  const currentStance = getCurrentStance(actor);
  const characteristicInfo = getCharacteristicValue(
    actor,
    SPELL_CONFIG.characteristic,
  );
  const damageBonus = Math.ceil(characteristicInfo.final / 2);

  // ===== TARGETING =====
  let target;
  try {
    const portal = new Portal()
      .origin(caster)
      .range(SPELL_CONFIG.targeting.range)
      .color(SPELL_CONFIG.targeting.color)
      .texture(SPELL_CONFIG.targeting.texture);

    ui.notifications.info(
      "🎯 Sélectionnez la cible du Livre de Compagnie (allié ou vous-même)",
    );
    target = await portal.pick();
  } catch (error) {
    ui.notifications.error(
      "Erreur lors du ciblage. Assurez-vous que le module Portal est installé et activé.",
    );
    return;
  }

  if (!target) {
    ui.notifications.info("❌ Ciblage annulé.");
    return;
  }

  // ===== ACTOR DETECTION =====
  function getActorAtLocation(targetX, targetY) {
    const gridSize = canvas.grid.size;

    if (canvas.grid.type !== 0) {
      const targetGridX = Math.floor(targetX / gridSize);
      const targetGridY = Math.floor(targetY / gridSize);

      const tokensAtLocation = canvas.tokens.placeables.filter((token) => {
        const tokenGridX = Math.floor(token.x / gridSize);
        const tokenGridY = Math.floor(token.y / gridSize);
        const tokenWidth = Math.ceil(token.document.width || 1);
        const tokenHeight = Math.ceil(token.document.height || 1);
        return (
          targetGridX >= tokenGridX &&
          targetGridX < tokenGridX + tokenWidth &&
          targetGridY >= tokenGridY &&
          targetGridY < tokenGridY + tokenHeight
        );
      });

      if (!tokensAtLocation.length) {
        console.log("[DEBUG] No tokens at target grid position");
        return null;
      }
      const targetToken = tokensAtLocation[0];
      if (!targetToken.actor) return null;
      return {
        name: targetToken.name,
        token: targetToken,
        actor: targetToken.actor,
      };
    } else {
      const tolerance = gridSize;
      const tokensAtLocation = canvas.tokens.placeables.filter((token) => {
        const tokenCenterX = token.x + token.w / 2;
        const tokenCenterY = token.y + token.h / 2;
        const distance = Math.sqrt(
          Math.pow(targetX - tokenCenterX, 2) +
            Math.pow(targetY - tokenCenterY, 2),
        );
        return distance <= tolerance;
      });

      if (!tokensAtLocation.length) return null;
      const targetToken = tokensAtLocation[0];
      if (!targetToken.actor) return null;
      return {
        name: targetToken.name,
        token: targetToken,
        actor: targetToken.actor,
      };
    }
  }

  const targetActor = getActorAtLocation(target.x, target.y);

  if (!targetActor) {
    ui.notifications.warn("⚠️ Aucune cible trouvée à cette position !");
    return;
  }

  const isSelfTarget = targetActor.actor.id === actor.id;
  const targetName = targetActor.name;

  // ===== CHECK EXISTING EFFECT =====
  const existingEffect = targetActor.actor.effects.contents.find(
    (e) =>
      e.name === SPELL_CONFIG.effectName &&
      e.flags?.world?.livreCompagnieCaster === actor.id,
  );
  const alreadyHasEffect = !!existingEffect;

  // ===== CONFIRM DIALOG =====
  const confirmed = await new Promise((resolve) => {
    const tokenImg = targetActor.token.document.texture.src;
    const statusHtml = alreadyHasEffect
      ? `<div style="padding:8px 12px; background:#fff8e1; border-radius:6px; border-left:4px solid #ff9800; margin:10px 0; font-size:0.9em;">
                   ⚠️ <strong>${targetName}</strong> a déjà un Livre de Compagnie actif.
                   Confirmer remplacera l'effet existant.
               </div>`
      : "";

    new Dialog(
      {
        title: `📖 Livre de Compagnie`,
        content: `
                <div style="padding:12px;">
                    <div style="text-align:center; margin-bottom:14px; padding:12px;
                        background:linear-gradient(135deg, #e8eaf6, #c5cae9); border-radius:8px;">
                        <h3 style="margin:0; color:#3f51b5;">📖 Livre de Compagnie</h3>
                        <div style="color:#555; margin-top:5px; font-size:0.9em;">
                            <strong>Lanceur :</strong> ${actor.name} &nbsp;|&nbsp;
                            <strong>Coût :</strong> ${SPELL_CONFIG.manaCost} mana
                        </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:12px; padding:10px 12px;
                        background:#f5f5f5; border:2px solid #3f51b5; border-radius:8px; margin:8px 0;">
                        <img src="${tokenImg}" style="width:40px;height:40px;border-radius:50%;border:2px solid #3f51b5;object-fit:cover;" />
                        <div>
                            <strong style="font-size:1.05em;">${targetName}</strong>
                            ${isSelfTarget ? ' <em style="color:#9c27b0;">(vous-même)</em>' : ""}
                            <br>
                            <span style="color:#2e7d32; font-size:0.9em;">
                                +<strong>${damageBonus}</strong> dégâts
                                <small style="color:#777;">(Esprit ${characteristicInfo.final} ÷ 2 = ${damageBonus})</small>
                            </span>
                        </div>
                    </div>

                    ${statusHtml}
                </div>
            `,
        buttons: {
          cast: {
            icon: '<i class="fas fa-book"></i>',
            label: "Invoquer le Livre",
            callback: () => resolve(true),
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: "Annuler",
            callback: () => resolve(false),
          },
        },
        default: "cast",
        close: () => resolve(false),
      },
      { width: 420 },
    ).render(true);
  });

  if (!confirmed) {
    ui.notifications.info("❌ Livre de Compagnie annulé.");
    return;
  }

  // ===== REMOVE OLD EFFECT IF PRESENT =====
  if (alreadyHasEffect) {
    await removeEffectWithGMDelegation(targetActor.token, existingEffect.id);
    console.log(
      `[DEBUG] Removed existing Livre de Compagnie from ${targetName}`,
    );
  }

  // ===== ANIMATION =====
  async function playSpellAnimation() {
    try {
      if (typeof Sequence === "undefined") {
        console.warn("[DEBUG] Livre de Compagnie: Sequencer non disponible.");
        return;
      }

      let sequence = new Sequence();

      // Projectile only if not self-targeting
      if (!isSelfTarget) {
        sequence
          .effect()
          .file(SPELL_CONFIG.animations.projectile)
          .attachTo(caster)
          .stretchTo(targetActor.token)
          .scale(0.4)
          .waitUntilFinished(-500)
          .effect()
          .file(SPELL_CONFIG.animations.impact)
          .atLocation(targetActor.token)
          .scale(0.4)
          .waitUntilFinished(-300);
      }

      sequence
        .effect()
        .file(SPELL_CONFIG.animations.attachment)
        .attachTo(targetActor.token)
        .scale(0.6)
        .name(`LivreCompagnie_${targetActor.token.id}`);

      await sequence.play();
    } catch (err) {
      console.warn("[DEBUG] Livre de Compagnie: Erreur animation :", err);
    }
  }

  await playSpellAnimation();

  // ===== APPLY EFFECT =====
  const effectData = {
    name: SPELL_CONFIG.effectName,
    icon: SPELL_CONFIG.effectIcon,
    description: `Livre de Compagnie d'Urgen — +${damageBonus} dégâts`,
    origin: actor.uuid,
    duration: { seconds: 86400 },
    flags: {
      damage: { value: damageBonus },
      world: {
        livreCompagnie: true,
        livreCompagnieCaster: actor.id,
        casterEsprit: characteristicInfo.final,
        damageBonus: damageBonus,
        sequencerName: `LivreCompagnie_${targetActor.token.id}`,
      },
    },
  };

  const result = await applyEffectWithGMDelegation(
    targetActor.token,
    effectData,
  );

  // ===== CHAT MESSAGE =====
  if (result?.success !== false) {
    const chatContent = `
            <div style="background:linear-gradient(135deg, #e8eaf6, #9fa8da); padding:14px; border-radius:10px; border:2px solid #3f51b5; margin:8px 0;">
                <div style="text-align:center; margin-bottom:12px;">
                    <h3 style="margin:0; color:#1a237e;">📖 Livre de Compagnie</h3>
                    <div style="color:#333; margin-top:4px; font-size:0.9em;">
                        <strong>Lanceur :</strong> ${actor.name} &nbsp;|&nbsp;
                        <strong>Coût :</strong> ${SPELL_CONFIG.manaCost} mana
                        ${currentStance ? ` | <strong>Position :</strong> ${currentStance.charAt(0).toUpperCase() + currentStance.slice(1)}` : ""}
                    </div>
                </div>

                <div style="background:white; padding:12px; border-radius:8px; margin:8px 0; border-left:4px solid #3f51b5;">
                    <div style="margin-bottom:6px;">
                        <strong>🎯 Cible :</strong> ${targetName}${isSelfTarget ? " <em>(vous-même)</em>" : ""}
                    </div>
                    <div style="margin-bottom:6px;">
                        <strong>💥 Bonus de dégâts :</strong>
                        <span style="color:#2e7d32; font-size:1.1em; font-weight:bold;">+${damageBonus}</span>
                        <small style="color:#777;">(Esprit ${characteristicInfo.final} ÷ 2, arrondi au supérieur)</small>
                    </div>
                    <div style="color:#555; font-size:0.9em; font-style:italic;">
                        Le livre de compagnie se lie à ${targetName} et amplifie sa puissance de combat.
                    </div>
                </div>
            </div>
        `;

    await ChatMessage.create({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ token: caster }),
      content: chatContent,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER,
    });

    ui.notifications.info(
      `📖 Livre de Compagnie invoqué sur ${targetName} ! +${damageBonus} dégâts — ${SPELL_CONFIG.manaCost} mana`,
    );
  } else {
    ui.notifications.error(
      `❌ Échec de l'application de l'effet sur ${targetName}.`,
    );
  }

  console.log(
    `[DEBUG] Livre de Compagnie cast complete – Caster: ${actor.name}, Target: ${targetName}, Damage bonus: +${damageBonus}`,
  );
})();
