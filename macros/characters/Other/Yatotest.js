// 🌸 Kawaii Dodge Buff — version compatible avec Custom Status Effects Override
// Auteur : ChatGPT 💖

// --- CONFIGURATION ---
const flagKey = "kawaiiDodgeBuff";
const buffIcon = "icons/magic/shield/pink-shield.webp";
const auraAnim = "jb2a.energy_field.02.pink";
const castAnim = "jb2a.magic_signs.circle.pink";
const dodgePath = "system.attributes.Combat.Dodge.value";

// --- Vérif préliminaire ---
if (!globalThis.gmSocket) {
  ui.notifications.error("❌ Le GM socket n'est pas disponible ! Vérifie que Custom Status Effects Override est activé et qu'un MJ est en ligne.");
  return;
}

const caster = canvas.tokens.controlled[0];
if (!caster) return ui.notifications.warn("❌ Sélectionne ton token lanceur !");
const targets = Array.from(game.user.targets);
if (!targets.length) return ui.notifications.warn("❌ Cible au moins un token !");

// --- Animation de cast kawaii sur le lanceur ---
if (typeof Sequence !== "undefined") {
  new Sequence()
    .effect()
      .file(castAnim)
      .atLocation(caster)
      .scale(0.8)
      .opacity(0.9)
      .belowTokens(false)
      .waitUntilFinished(500)
    .play();
}

// --- Fonction toggle du buff ---
async function toggleBuffOnToken(token) {
  const actor = token.actor;

  // Chercher un effet existant avec notre label
  const existingEffect = actor.effects.find(e => e.label === "Buff Dodge Kawaii");

  if (existingEffect) {
    // 🌙 Suppression du buff
    const result = await globalThis.gmSocket.executeAsGM("removeEffectFromToken", token.id, existingEffect.id);

    if (!result.success) {
      ui.notifications.error(`Impossible de retirer l'effet de ${actor.name} : ${result.error}`);
      return;
    }

    // Stopper l'aura animée
    if (typeof Sequencer !== "undefined") {
      Sequencer.EffectManager.endEffects({ name: `KawaiiDodgeAura-${token.id}` });
    }

    ui.notifications.info(`🌸 Le buff Kawaii de ${actor.name} s'est dissipé !`);

  } else {
    // 💖 Application du buff
    // Récupérer la valeur actuelle de Dodge pour construire la formule
    const currentDodge = foundry.utils.getProperty(actor, dodgePath) || "2d6";

    // Création d'un effet avec modification via Active Effect changes
    const effectData = {
      label: "Buff Dodge Kawaii",
      icon: buffIcon,
      origin: `Actor.${actor.id}`,
      duration: { seconds: 3600 },
      changes: [
        {
          key: dodgePath,
          mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
          value: `${currentDodge}+1d6`,
          priority: 20
        }
      ],
      flags: {
        statuscounter: { value: 1, visible: true },
        world: { [flagKey]: currentDodge } // Sauvegarder la valeur originale dans l'effet lui-même
      }
    };

    const result = await globalThis.gmSocket.executeAsGM("applyEffectToToken", token.id, effectData);
    if (!result.success) {
      ui.notifications.error(`Impossible d'appliquer l'effet sur ${actor.name} : ${result.error}`);
      return;
    }

    // Aura persistante
    if (typeof Sequence !== "undefined") {
      new Sequence()
        .effect()
          .file(auraAnim)
          .name(`KawaiiDodgeAura-${token.id}`)
          .atLocation(token)
          .attachTo(token)
          .persist(true)
          .scale(0.8)
          .opacity(0.85)
          .belowTokens(true)
        .play();
    }

    ui.notifications.info(`💖 ${actor.name} reçoit un doux vent magique (+1d6 Dodge) !`);
  }
}

// --- Application sur toutes les cibles ---
for (let target of targets) {
  await toggleBuffOnToken(target);
}

// --- Message RP dans le chat ---
const targetNames = targets.map(t => t.name).join(", ");
const messageHTML = `
<div style="border:2px solid pink; background:#ffe6f2; border-radius:12px; padding:10px; font-family:'Comic Sans MS', cursive; color:#d63384;">
  <h2 style="text-align:center;">🌸✨ Bénédiction Kawaii ✨🌸</h2>
  <p style="text-align:center;">💖 <b>${caster.name}</b> envoie un nuage de cœurs vers <b>${targetNames}</b> 💫</p>
  <p style="text-align:center; font-size:0.9em; color:#b03a84;">(Un doux vent magique entoure les alliés... 💕)</p>
</div>
`;

ChatMessage.create({
  speaker: ChatMessage.getSpeaker({ token: caster }),
  content: messageHTML
});
