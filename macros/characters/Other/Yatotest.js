// 🌸 Kawaii Dodge Buff — version compatible avec Custom Status Effects Override
// Auteur : ChatGPT 💖

// --- CONFIGURATION ---
const flagKey = "kawaiiDodgeBuff";
const buffIcon = "icons/magic/light/beam-deflect-path-yellow.webp";
const auraAnim = "jb2a.wind_lines.01.leaves.02.pink";
const castAnim = "jb2a.divine_smite.caster.reversed.pink";
const dodgePath = "system.attributes.Combat.Dodge.value";
const appliedTargets = []; // pour savoir si on doit envoyer le message chat

// 🎯 Formules des jets
const rollTouch = "@Dice.Magic-Check";      // Jet de réussite / touché

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
    const result = await globalThis.gmSocket.executeAsGM("removeEffectFromActor", token.id, existingEffect.id);

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
    const currentDodge = foundry.utils.getProperty(actor, dodgePath) || "2d6";

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
        world: { [flagKey]: currentDodge }
      }
    };

    const result = await globalThis.gmSocket.executeAsGM("applyEffectToActor", token.id, effectData);
    if (!result.success) {
      ui.notifications.error(`Impossible d'appliquer l'effet sur ${actor.name} : ${result.error}`);
      return;
    }

    // Aura persistante
    if (typeof Sequence !== "undefined") {
      new Sequence()
        .effect()
          .file("jb2a.divine_smite.caster.pink")
          .atLocation(token)
          .scale(0.8)
          .opacity(0.9)
        .effect()
          .file(auraAnim)
          .name(`KawaiiDodgeAura-${token.id}`)
          .atLocation(token)
          .fadeOut(1000)
          .attachTo(token)
          .persist(true)
          .scaleToObject(1.4)
          .rotate(90)
          .opacity(0.85)
        .play();
    }

    ui.notifications.info(`💖 ${actor.name} reçoit un doux vent magique (+1d6 Dodge) !`);
    appliedTargets.push(actor.name); // marquer comme appliqué
  }
}

// --- Application sur toutes les cibles ---
for (let target of targets) {
  await toggleBuffOnToken(target);
}

// --- Si au moins une cible a reçu le buff, alors lancer le jet ---
if (appliedTargets.length > 0) {

  const actor = caster.actor; // pour le roll
  const rollTouchResult = await new Roll(rollTouch, actor.getRollData()).roll({async:true});

  // --- DÉS 3D ---
  if (game.dice3d) {
      await game.dice3d.showForRoll(rollTouchResult, game.user, true);
  }

  // --- DÉTECTION ÉCHEC CRITIQUE ---
  const diceResults = rollTouchResult.dice[0]?.results.map(r=>r.result)||[];
  const allOnes = diceResults.length>0 && diceResults.every(r=>r===1);
  const crit= diceResults.filter(r => r === 6).length >= 2;

  // --- RENDER HTML DES DÉS ---
  let touchHTML = await rollTouchResult.render();
  if(allOnes) touchHTML += `<div style="color:red; font-weight:bold;">⚠ Échec Critique !</div>`;
  if(crit) touchHTML += `<div style="color:lime; font-weight:bold;">✨ RÉUSSITE CRITIQUE ✨</div>`;

  // --- Message RP dans le chat ---
  const targetNames = targets.map(t => t.name).join(", ");
  const messageHTML = `
  <div style="border:2px solid pink; background:#ffe6f2; border-radius:12px; padding:10px; font-family:'Comic Sans MS', cursive; color:#d63384;">
    <h2 style="text-align:center;">🌸✨ Enchant ✨🌸 Evade </h2>
    <p style="text-align:center;">💖 <b>${caster.name}</b> lance une douce brise protectrice entourant <b>${targetNames}</b> 💫</p>
<p style="text-align:center;"> <b> +1d6 à l'esquive </b> </p>
    <div style="margin:6px 0;"><b>🎯 Jet de Réussite :</b> ${touchHTML}</div>
    <p style="text-align:center; font-size:0.7em; color:#b03a84;">20 m | 6 mana mono | 9 mana multi</p>
  </div>
  `;

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ token: caster }),
    content: messageHTML
  });
}
