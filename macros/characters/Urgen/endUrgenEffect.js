/**
 * End Urgen Effects (Terminer Effets de Urgen) - Urgen
 *
 * Macro pour terminer les effets que Urgen a appliqués sur d'autres tokens.
 * Similaire au gestionnaire endLeoEffect mais spécialisé pour les effets de livres magiques.
 *
 * Fonctionnalités :
 * - Configuration centralisée des effets via EFFECT_CONFIG
 * - Détecte automatiquement tous les effets appliqués par Urgen sur le canvas
 * - Supporte "Livre Monstrueux" et futurs effets de livres magiques
 * - Interface de sélection pour choisir quels effets supprimer
 * - Supprime les animations Sequencer associées si applicable
 * - Gestion par délégation GM pour les tokens non possédés
 * - Facilement extensible pour de nouveaux effets de livres via EFFECT_CONFIG
 *
 * Pour ajouter un nouvel effet :
 * 1. Ajouter l'entrée dans EFFECT_CONFIG avec les paramètres appropriés
 * 2. Le système détectera automatiquement le nouvel effet
 *
 * Usage : Sélectionner le token de Urgen et lancer cette macro
 */

(async () => {
  // ===== CONFIGURATION DES EFFETS =====
  const EFFECT_CONFIG = {
    "Livre Monstrueux": {
      displayName: "Livre Monstrueux",
      icon: "icons/sundries/books/book-red-exclamation.webp",
      description: "Livre magique attaché",
      sectionTitle: "📚 Livres Monstrueux",
      sectionIcon: "📚",
      cssClass: "book-effect",
      borderColor: "#3f51b5",
      bgColor: "#e8eaf6",
      // Détection des flags - les livres utilisent statuscounter
      detectFlags: [
        { path: "flags.statuscounter.active", matchValue: true },
        // On peut aussi détecter par nom d'effet directement
        { path: "name", matchValue: "Livre Monstrueux" },
      ],
      // Animation de suppression
      removeAnimation: {
        file: "animated-spell-effects-cartoon.earth.explosion.02",
        scale: 0.5,
        duration: 1201,
        fadeOut: 10,
        tint: "#4169e1",
      },
      // Whether to play the removeAnimation when the effect is detached
      shouldTriggerAnimation: false,
      // Description dynamique basée sur les stacks
      getDynamicDescription: (effect) => {
        const counter = effect.flags?.statuscounter?.value || 1;
        return `Livre magique attaché (Force: ${counter})`;
      },
      // Données supplémentaires pour l'affichage
      getExtraData: (effect) => {
        return {
          counter: effect.flags?.statuscounter?.value || 1,
          BookCount: effect.flags?.BookCount || 1,
        };
      },
    },
    "Livre Défensif": {
      displayName: "Livre Défensif",
      icon: "icons/sundries/books/book-blue-shield.webp",
      description: "Livre défensif attaché",
      sectionTitle: "🛡️ Livres Défensifs",
      sectionIcon: "🛡️",
      cssClass: "defensive-book-effect",
      borderColor: "#2196f3",
      bgColor: "#e3f2fd",
      // Détection des flags - les livres défensifs utilisent statuscounter
      detectFlags: [
        { path: "flags.statuscounter.active", matchValue: true },
        { path: "name", matchValue: "Livre Défensif" },
      ],
      // Animation de suppression
      removeAnimation: {
        file: "jb2a.shield.03.outro_explode.blue",
        scale: 0.6,
        duration: 1500,
        fadeOut: 500,
        tint: "#2196f3",
      },
      // Whether to play the removeAnimation when the effect is detached
      shouldTriggerAnimation: false,
      // Description dynamique basée sur les stacks
      getDynamicDescription: (effect) => {
        const counter = effect.flags?.statuscounter?.value || 1;
        const bookCount = effect.flags?.BookCount?.value || 1;
        return `Livre défensif attaché (Protection: ${counter}, Livres: ${bookCount})`;
      },
      // Données supplémentaires pour l'affichage
      getExtraData: (effect) => {
        return {
          counter: effect.flags?.statuscounter?.value || 1,
          BookCount: effect.flags?.BookCount || { value: 1 },
        };
      },
    },
    Book: {
      displayName: "Book",
      icon: "icons/sundries/books/book-stack-blue.webp",
      description: "Livres magiques créés et attachés aux ennemis et alliés",
      sectionTitle: "📘 Compteur de Livres",
      sectionIcon: "📘",
      cssClass: "book-counter-effect",
      borderColor: "#1976d2",
      bgColor: "#e3f2fd",
      // Détection des flags - effect Book sur Urgen
      detectFlags: [
        { path: "flags.statuscounter.active", matchValue: true },
        { path: "name", matchValue: "Book" },
      ],
      // Animation de suppression
      removeAnimation: {
        file: "jb2a.magic_signs.circle.02.conjuration.complete.blue",
        scale: 0.6,
        duration: 1200,
        fadeOut: 400,
        tint: "#2196f3",
      },
      // Whether to play the removeAnimation when the effect is detached
      shouldTriggerAnimation: false,
      // Description dynamique basée sur les stacks
      getDynamicDescription: (effect) => {
        const counter = effect.flags?.statuscounter?.value || 1;
        return `Compteur de livres créés (Total: ${counter})`;
      },
      // Données supplémentaires pour l'affichage
      getExtraData: (effect) => {
        return {
          counter: effect.flags?.statuscounter?.value || 1,
        };
      },
    },
    "Livre de Compagnie": {
      displayName: "Livre de Compagnie",
      icon: "icons/creatures/claws/claw-talons-yellow-red.webp",
      description: "Livre de compagnie amplifiant les dégâts de la cible",
      sectionTitle: "📖 Livres de Compagnie",
      sectionIcon: "📖",
      cssClass: "companion-book-effect",
      borderColor: "#9c27b0",
      bgColor: "#f3e5f5",
      // Détection par flag world.livreCompagnie
      detectFlags: [
        { path: "flags.world.livreCompagnieCaster", matchValue: "CASTER_ID" },
      ],
      // Animation de suppression : fin de la chauve-souris persistante
      removeAnimation: null,
      shouldTriggerAnimation: false,
      // Nettoyer l'effet Sequencer persistant
      cleanup: {
        sequencerName: "flags.world.sequencerName",
      },
      getDynamicDescription: (effect) => {
        const bonus =
          effect.flags?.world?.damageBonus || effect.flags?.damage?.value || 0;
        return `Livre de compagnie actif — +${bonus} dégâts`;
      },
      getExtraData: (effect) => ({
        damageBonus:
          effect.flags?.world?.damageBonus || effect.flags?.damage?.value || 0,
        sequencerName: effect.flags?.world?.sequencerName || null,
      }),
      // Nettoyage de l'animation Sequencer lors de la suppression
      onRemove: async (effect) => {
        const seqName = effect.flags?.world?.sequencerName;
        if (seqName && typeof Sequencer !== "undefined") {
          try {
            if (
              Sequencer.EffectManager.getEffects({ name: seqName }).length > 0
            ) {
              await Sequencer.EffectManager.endEffects({ name: seqName });
              console.log(`[DEBUG] Ended Sequencer effect: ${seqName}`);
            }
          } catch (err) {
            console.warn(
              `[DEBUG] Could not end Sequencer effect ${seqName}:`,
              err,
            );
          }
        }
      },
    },

    /*
     * ===== EXEMPLE POUR AJOUTER UN NOUVEL EFFET =====
     *
     * Pour ajouter un futur effet "Livre de Flammes" appliqué par Urgen :
     *
     * "Livre de Flammes": {
     *     displayName: "Livre de Flammes",
     *     icon: "icons/sundries/books/book-fire.webp",
     *     description: "Livre enflammé causant des dégâts de feu",
     *     sectionTitle: "🔥 Livres de Flammes",
     *     sectionIcon: "🔥",
     *     cssClass: "fire-book-effect",
     *     borderColor: "#ff5722",
     *     bgColor: "#fff3e0",
     *     detectFlags: [
     *         { path: "flags.world.bookType", matchValue: "fire" },
     *         { path: "flags.world.bookCaster", matchValue: "CASTER_ID" }
     *     ],
     *     removeAnimation: {
     *         file: "jb2a.fireball.explosion.orange",
     *         scale: 0.7,
     *         duration: 2000,
     *         fadeOut: 800,
     *         tint: "#ff6600"
     *     },
     *     cleanup: {
     *         sequencerName: "flags.world.fireBookSequenceName"
     *     }
     * }
     */
  };

  // ===== FONCTIONS UTILITAIRES =====
  function checkEffectFlags(effect, config, casterId) {
    for (const flagCheck of config.detectFlags) {
      if (flagCheck.path === "name") {
        // Vérification spéciale par nom d'effet
        if (effect.name === flagCheck.matchValue) {
          return true;
        }
      } else {
        const flagValue = getProperty(effect, flagCheck.path);
        const expectedValue =
          flagCheck.matchValue === "CASTER_ID"
            ? casterId
            : flagCheck.matchValue;
        if (flagValue === expectedValue) {
          return true;
        }
      }
    }
    return false;
  }

  // ===== VALIDATION BASIQUE =====
  if (!canvas.tokens.controlled.length) {
    ui.notifications.error("Veuillez d'abord sélectionner le jeton de Urgen !");
    return;
  }

  const caster = canvas.tokens.controlled[0];
  const actor = caster.actor;

  if (!actor) {
    ui.notifications.error("Aucun acteur valide trouvé !");
    return;
  }

  // ===== DETECT ALL URGEN'S EFFECTS ON CANVAS =====
  function findUrgenEffectsOnCanvas() {
    const urgenEffects = [];

    // Parcourir tous les tokens sur la scène
    for (const token of canvas.tokens.placeables) {
      if (!token.actor) continue;

      // Check if this is Urgen himself
      const isUrgenToken = token.id === caster.id;

      // Chercher les effets appliqués par Urgen
      for (const effect of token.actor.effects.contents) {
        // Vérifier chaque type d'effet configuré
        for (const [effectName, config] of Object.entries(EFFECT_CONFIG)) {
          // Skip "Book" effect if this is Urgen's own token (Book is internal tracking, not removable)
          if (isUrgenToken && effectName === "Book") {
            continue;
          }

          if (checkEffectFlags(effect, config, caster.id)) {
            // Construire les informations de base
            let effectInfo = {
              token: token,
              actor: token.actor,
              effect: effect,
              name: token.name,
              effectType: effectName,
              icon: config.icon,
              description: config.description,
              config: config,
            };

            // Description dynamique si disponible
            if (config.getDynamicDescription) {
              effectInfo.description = config.getDynamicDescription(effect);
            }

            // Données supplémentaires si disponibles
            if (config.getExtraData) {
              const extraData = config.getExtraData(effect);
              Object.assign(effectInfo, extraData);
            }

            // Cleanup spécial (ex: nom de séquence)
            if (config.cleanup?.sequencerName) {
              effectInfo.sequenceName = getProperty(
                effect,
                config.cleanup.sequencerName,
              );
            }

            urgenEffects.push(effectInfo);
            break; // Une fois trouvé, pas besoin de vérifier les autres configs
          }
        }
      }
    }

    return urgenEffects;
  }

  const urgenEffects = findUrgenEffectsOnCanvas();

  if (urgenEffects.length === 0) {
    ui.notifications.info("📚 Aucun livre magique à détacher !");
    return;
  }

  // ===== EFFECT SELECTION DIALOG =====
  async function showEffectSelectionDialog() {
    let dialogContent = `
            <h3>📚 Détacher Livres Magiques de Urgen</h3>
            <p><strong>Lanceur:</strong> ${actor.name}</p>
            <p>Sélectionnez le(s) livre(s) à détacher :</p>

            <style>
                .effect-item {
                    margin: 8px 0;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: #f9f9f9;
                    display: flex;
                    align-items: center;
                }
                .effect-icon {
                    width: 32px;
                    height: 32px;
                    margin-right: 12px;
                    background-size: cover;
                    background-position: center;
                    border-radius: 4px;
                    flex-shrink: 0;
                }
                .effect-content {
                    flex-grow: 1;
                }
                .effect-type {
                    font-weight: bold;
                    color: #1565c0;
                }
                .effect-target {
                    font-size: 1.1em;
                    font-weight: bold;
                    margin: 2px 0;
                }
                .effect-description {
                    font-size: 0.9em;
                    color: #666;
                }
                ${Object.entries(EFFECT_CONFIG)
                  .map(
                    ([effectType, config]) => `
                .${config.cssClass} {
                    border-left: 4px solid ${config.borderColor};
                    background: ${config.bgColor};
                }`,
                  )
                  .join("")}
            </style>

            <div style="margin: 15px 0; max-height: 400px; overflow-y: auto;">
        `;

    // Organiser les effets par type configuré
    const effectsByType = {};
    for (const effectInfo of urgenEffects) {
      if (!effectsByType[effectInfo.effectType]) {
        effectsByType[effectInfo.effectType] = [];
      }
      effectsByType[effectInfo.effectType].push(effectInfo);
    }

    let effectIndex = 0;

    // Générer les sections pour chaque type d'effet
    for (const [effectType, effects] of Object.entries(effectsByType)) {
      const config = EFFECT_CONFIG[effectType];
      if (!config) continue;

      dialogContent += `<h4 style="margin: 15px 0 10px 0; color: #424242;">${config.sectionTitle} (${effects.length})</h4>`;

      for (const effectInfo of effects) {
        // Affichage spécial pour les livres avec counter
        let extraInfo = "";
        if (effectInfo.counter) {
          extraInfo = ` - Force: ${effectInfo.counter}`;
        }

        dialogContent += `
                    <label class="effect-item ${config.cssClass}" style="cursor: pointer;">
                        <input type="checkbox" name="selectedEffects" value="${effectIndex}" style="margin-right: 12px;">
                        <div class="effect-icon" style="background-image: url(${effectInfo.icon});"></div>
                        <div class="effect-content">
                            <div class="effect-type">${config.sectionIcon} ${effectInfo.effectType}${extraInfo}</div>
                            <div class="effect-target">${effectInfo.name}</div>
                            <div class="effect-description">${effectInfo.description}</div>
                        </div>
                    </label>
                `;
        effectIndex++;
      }
    }

    dialogContent += `</div>`;

    return new Promise((resolve) => {
      const buttons = {
        removeSelected: {
          icon: '<i class="fas fa-book-open"></i>',
          label: "📖 Détacher Sélectionnés",
          callback: (html) => {
            const selected = [];
            html.find('input[name="selectedEffects"]:checked').each((i, el) => {
              selected.push(parseInt(el.value));
            });
            if (selected.length === 0) {
              ui.notifications.warn("Aucun livre sélectionné !");
              return;
            }
            resolve({ selectedIndices: selected });
          },
        },
        removeAll: {
          icon: '<i class="fas fa-trash-alt"></i>',
          label: "🗑️ Détacher Tous",
          callback: () => {
            const allIndices = urgenEffects.map((_, index) => index);
            resolve({ selectedIndices: allIndices });
          },
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "❌ Annuler",
          callback: () => resolve(null),
        },
      };

      new Dialog({
        title: "📚 Détacher Livres Magiques de Urgen",
        content: dialogContent,
        buttons: buttons,
        default: "removeSelected",
        render: (html) => {
          // Add select all/none functionality per section
          html.find("h4").each((i, header) => {
            const $header = $(header);
            $header.css("cursor", "pointer");
            $header.on("click", () => {
              const $section = $header.nextUntil("h4, :last");
              const $checkboxes = $section.find('input[type="checkbox"]');
              const allChecked =
                $checkboxes.filter(":checked").length === $checkboxes.length;
              $checkboxes.prop("checked", !allChecked);
            });
          });
        },
      }).render(true);
    });
  }

  const selection = await showEffectSelectionDialog();
  if (!selection) {
    ui.notifications.info("Opération annulée.");
    return;
  }

  // ===== REMOVE SELECTED EFFECTS =====
  const { selectedIndices } = selection;
  const effectsToRemove = selectedIndices.map((index) => urgenEffects[index]);
  const removedEffects = {
    books: [],
    failed: [],
  };

  // Fonction de délégation GM pour suppression d'effets
  async function removeEffectWithGMDelegation(targetToken, effectId) {
    if (!globalThis.gmSocket) {
      const error =
        "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
      ui.notifications.error(error);
      console.error("[DEBUG] GM Socket not available for effect removal");
      return { success: false, error };
    }

    try {
      console.log(
        `[DEBUG] Removing effect ${effectId} from ${targetToken.name} via GM socket`,
      );
      const result = await globalThis.gmSocket.executeAsGM(
        "removeEffectFromActor",
        targetToken.id,
        effectId,
      );

      if (result?.success) {
        console.log(
          `[DEBUG] Successfully removed effect ${effectId} from ${targetToken.name}`,
        );
        return { success: true };
      } else {
        console.error(`[DEBUG] Failed to remove effect: ${result?.error}`);
        return { success: false, error: result?.error || "Unknown error" };
      }
    } catch (error) {
      console.error("Error removing effect:", error);
      return { success: false, error: error.message };
    }
  }

  // Fonction de délégation GM pour mise à jour d'effets
  async function updateEffectWithGMDelegation(
    targetToken,
    effectId,
    updateData,
  ) {
    if (!globalThis.gmSocket) {
      const error =
        "GM Socket non disponible ! Assurez-vous que le module custom-status-effects est actif.";
      ui.notifications.error(error);
      console.error("[DEBUG] GM Socket not available for effect update");
      return { success: false, error };
    }

    try {
      console.log(
        `[DEBUG] Updating effect ${effectId} on ${targetToken.name} via GM socket`,
      );
      const result = await globalThis.gmSocket.executeAsGM(
        "updateEffectOnActor",
        targetToken.id,
        effectId,
        updateData,
      );

      if (result?.success) {
        console.log(
          `[DEBUG] Successfully updated effect ${effectId} on ${targetToken.name}`,
        );
        return { success: true };
      } else {
        console.error(`[DEBUG] Failed to update effect: ${result?.error}`);
        return { success: false, error: result?.error || "Unknown error" };
      }
    } catch (error) {
      console.error("Error updating effect:", error);
      return { success: false, error: error.message };
    }
  }

  // Fonction pour gérer le compteur de livres de Urgen
  async function updateUrgenBookCounter(BookCountToRemove) {
    // Chercher l'effet "Book" sur Urgen
    let urgenBookEffect = null;
    for (const effect of actor.effects) {
      if (effect.name === "Book") {
        urgenBookEffect = effect;
        break;
      }
    }

    if (!urgenBookEffect) {
      console.warn("[DEBUG] No Book effect found on Urgen to update");
      return { success: true, action: "none" };
    }

    const currentCounter = urgenBookEffect.flags?.statuscounter?.value || 0;
    const newCounter = Math.max(0, currentCounter - BookCountToRemove);

    console.log(
      `[DEBUG] Updating Urgen's Book counter: ${currentCounter} - ${BookCountToRemove} = ${newCounter}`,
    );

    if (newCounter <= 0) {
      // Supprimer complètement l'effet Book
      const result = await removeEffectWithGMDelegation(
        caster,
        urgenBookEffect.id,
      );
      if (result.success) {
        console.log(
          "[DEBUG] Removed Book effect from Urgen (counter reached zero)",
        );
        return {
          success: true,
          action: "removed",
          previousCount: currentCounter,
        };
      } else {
        console.error(
          `[DEBUG] Failed to remove Book effect from Urgen: ${result.error}`,
        );
        return { success: false, error: result.error };
      }
    } else {
      // Mettre à jour le counter
      const updateData = {
        "flags.statuscounter.value": newCounter,
      };

      const result = await updateEffectWithGMDelegation(
        caster,
        urgenBookEffect.id,
        updateData,
      );
      if (result.success) {
        console.log(`[DEBUG] Updated Urgen's Book counter to ${newCounter}`);
        return {
          success: true,
          action: "updated",
          previousCount: currentCounter,
          newCount: newCounter,
        };
      } else {
        console.error(
          `[DEBUG] Failed to update Urgen's Book counter: ${result.error}`,
        );
        return { success: false, error: result.error };
      }
    }
  }

  // Calculer le total de BookCount à soustraire du compteur de Urgen
  let totalBookCountToRemove = 0;

  for (const effectInfo of effectsToRemove) {
    try {
      // Nettoyage spécial via configuration
      const config = effectInfo.config;
      if (config.cleanup?.sequencerName && effectInfo.sequenceName) {
        Sequencer.EffectManager.endEffects({ name: effectInfo.sequenceName });
        console.log(
          `[DEBUG] Removed ${effectInfo.effectType} animation: ${effectInfo.sequenceName}`,
        );
      }

      // Supprimer l'effet actif via GM delegation
      const result = await removeEffectWithGMDelegation(
        effectInfo.token,
        effectInfo.effect.id,
      );

      if (result.success) {
        console.log(
          `[DEBUG] Successfully removed ${effectInfo.effectType} effect from ${effectInfo.name}`,
        );

        // Organiser les résultats par type d'effet
        if (effectInfo.effectType === "Livre Monstrueux") {
          const BookCount = effectInfo.BookCount.value || 1;
          totalBookCountToRemove += BookCount;

          removedEffects.books.push({
            name: effectInfo.name,
            counter: effectInfo.counter,
            BookCount: BookCount,
            type: "Monstrueux",
          });
          console.log(
            `[DEBUG] Queued ${BookCount} monstrous book(s) for Urgen counter update`,
          );
        } else if (effectInfo.effectType === "Livre Défensif") {
          const BookCount = effectInfo.BookCount.value || 1;
          totalBookCountToRemove += BookCount;

          removedEffects.books.push({
            name: effectInfo.name,
            counter: effectInfo.counter,
            BookCount: BookCount,
            type: "Défensif",
          });
          console.log(
            `[DEBUG] Queued ${BookCount} defensive book(s) for Urgen counter update`,
          );
        } else if (effectInfo.effectType === "Livre de Compagnie") {
          removedEffects.books.push({
            name: effectInfo.name,
            damageBonus: effectInfo.damageBonus || 0,
            type: "Compagnie",
          });
          console.log(
            `[DEBUG] Removed Livre de Compagnie from ${effectInfo.name}`,
          );
        } else if (effectInfo.effectType === "Book") {
          // Si on supprime directement l'effet Book de Urgen, ne pas le compter
          removedEffects.books.push({
            name: effectInfo.name,
            counter: effectInfo.counter,
            isUrgenBook: true,
          });
        }
      } else {
        console.error(
          `[DEBUG] Failed to remove ${effectInfo.effectType} effect: ${result.error}`,
        );
        removedEffects.failed.push({
          name: effectInfo.name,
          type: effectInfo.effectType,
          error: result.error || "Erreur inconnue",
        });
      }
    } catch (error) {
      console.error(
        `Error removing ${effectInfo.effectType} from ${effectInfo.name}:`,
        error,
      );
      removedEffects.failed.push({
        name: effectInfo.name,
        type: effectInfo.effectType,
        error: error.message,
      });
    }
  }

  // Mettre à jour le compteur de livres de Urgen si des livres ont été retirés
  let urgenBookUpdate = { success: true, action: "none" };
  if (totalBookCountToRemove > 0) {
    urgenBookUpdate = await updateUrgenBookCounter(totalBookCountToRemove);
    if (!urgenBookUpdate.success) {
      console.error(
        `[DEBUG] Failed to update Urgen's book counter: ${urgenBookUpdate.error}`,
      );
      ui.notifications.warn(
        `⚠️ Erreur mise à jour compteur Urgen: ${urgenBookUpdate.error}`,
      );
    }
  }

  // ===== RESULTS AND FEEDBACK =====
  const totalRemoved = removedEffects.books.length;
  const totalFailed = removedEffects.failed.length;

  if (totalRemoved > 0) {
    // Animations de détachement basées sur la configuration
    const detachmentSeq = new Sequence();
    let hasAnimations = false;

    for (const effectInfo of effectsToRemove) {
      const config = effectInfo.config;
      // Only queue animations when a removeAnimation is configured and the
      // effect config explicitly allows triggering it via shouldTriggerAnimation.
      if (config.removeAnimation && config.shouldTriggerAnimation) {
        // Vérifier si cet effet a bien été supprimé
        const wasRemoved = removedEffects.books.some(
          (b) => b.name === effectInfo.name,
        );

        if (wasRemoved) {
          const anim = config.removeAnimation;
          detachmentSeq
            .effect()
            .file(anim.file)
            .atLocation(effectInfo.token)
            .scale(anim.scale)
            .duration(anim.duration)
            .fadeOut(anim.fadeOut)
            .tint(anim.tint);
          hasAnimations = true;
        }
      }
    }

    if (hasAnimations) {
      await detachmentSeq.play();
    }

    // Message dans le chat
    let chatContent = `
            <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); padding: 12px; border-radius: 8px; border: 2px solid #2196f3; margin: 8px 0;">
                <div style="text-align: center; margin-bottom: 8px;">
                    <h3 style="margin: 0; color: #1565c0;">📚 Livres Magiques Détachés</h3>
                    <div style="margin-top: 3px; font-size: 0.9em;">
                        <strong>Lanceur:</strong> ${actor.name}
                    </div>
                </div>
        `;

    // Section pour les livres détachés
    if (removedEffects.books.length > 0) {
      // Séparer les livres par type et effets Book de Urgen
      const monstrousBooks = removedEffects.books.filter(
        (b) => !b.isUrgenBook && b.type === "Monstrueux",
      );
      const defensiveBooks = removedEffects.books.filter(
        (b) => !b.isUrgenBook && b.type === "Défensif",
      );
      const urgenBookEffects = removedEffects.books.filter(
        (b) => b.isUrgenBook,
      );

      // Afficher les livres monstrueux détachés
      if (monstrousBooks.length > 0) {
        const config = EFFECT_CONFIG["Livre Monstrueux"];
        const bookList = monstrousBooks
          .map((b) => `${b.name} (Force: ${b.counter}, Livres: ${b.BookCount})`)
          .join(", ");

        chatContent += `
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #1565c0; margin-bottom: 6px;"><strong>${config.sectionTitle} Détachés</strong></div>
                        <div style="font-size: 1.0em; font-weight: bold;">${bookList}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Les livres magiques retournent à leur créateur</div>
                    </div>
                `;
      }

      // Afficher les livres défensifs détachés
      if (defensiveBooks.length > 0) {
        const config = EFFECT_CONFIG["Livre Défensif"];
        const bookList = defensiveBooks
          .map(
            (b) =>
              `${b.name} (Protection: ${b.counter}, Livres: ${b.BookCount})`,
          )
          .join(", ");

        chatContent += `
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #1565c0; margin-bottom: 6px;"><strong>${config.sectionTitle} Détachés</strong></div>
                        <div style="font-size: 1.0em; font-weight: bold;">${bookList}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 4px;">La protection magique se dissipe</div>
                    </div>
                `;
      }

      // Afficher les livres de compagnie détachés
      const companionBooks = removedEffects.books.filter(
        (b) => b.type === "Compagnie",
      );
      if (companionBooks.length > 0) {
        const config = EFFECT_CONFIG["Livre de Compagnie"];
        const bookList = companionBooks
          .map((b) => `${b.name} (+${b.damageBonus} dégâts)`)
          .join(", ");

        chatContent += `
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #9c27b0; margin-bottom: 6px;"><strong>${config.sectionTitle} Détachés</strong></div>
                        <div style="font-size: 1.0em; font-weight: bold;">${bookList}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Le livre de compagnie retourne à son créateur</div>
                    </div>
                `;
      }

      // Afficher les effets Book de Urgen si applicable
      if (urgenBookEffects.length > 0) {
        const config = EFFECT_CONFIG["Book"];
        const urgenList = urgenBookEffects
          .map((b) => `${b.name} (Compteur: ${b.counter})`)
          .join(", ");

        chatContent += `
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px;">
                        <div style="font-size: 1.1em; color: #1565c0; margin-bottom: 6px;"><strong>${config.sectionTitle} Supprimé</strong></div>
                        <div style="font-size: 1.0em; font-weight: bold;">${urgenList}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Compteur de livres de Urgen réinitialisé</div>
                    </div>
                `;
      }
    }

    // Section pour la mise à jour du compteur de Urgen
    if (urgenBookUpdate.action !== "none") {
      const config = EFFECT_CONFIG["Book"];
      let updateMessage = "";

      if (urgenBookUpdate.action === "removed") {
        updateMessage = `Compteur supprimé (était à ${urgenBookUpdate.previousCount})`;
      } else if (urgenBookUpdate.action === "updated") {
        updateMessage = `Compteur mis à jour: ${urgenBookUpdate.previousCount} → ${urgenBookUpdate.newCount}`;
      }

      if (updateMessage) {
        chatContent += `
                    <div style="text-align: center; margin: 8px 0; padding: 10px; background: ${config.bgColor}; border-radius: 4px; border: 1px solid ${config.borderColor};">
                        <div style="font-size: 1.0em; color: #1565c0; margin-bottom: 6px;"><strong>📘 Compteur Urgen Mis à Jour</strong></div>
                        <div style="font-size: 0.9em; font-weight: bold;">${updateMessage}</div>
                        <div style="font-size: 0.8em; color: #666; margin-top: 4px;">Retrait automatique de ${totalBookCountToRemove} livre${totalBookCountToRemove > 1 ? "s" : ""}</div>
                    </div>
                `;
      }
    }

    // Erreurs s'il y en a
    if (removedEffects.failed.length > 0) {
      const failedList = removedEffects.failed
        .map((f) => `${f.name} (${f.type}): ${f.error}`)
        .join("<br>");

      chatContent += `
                <div style="text-align: center; margin: 8px 0; padding: 10px; background: #ffebee; border-radius: 4px; border: 1px solid #f44336;">
                    <div style="font-size: 1.1em; color: #d32f2f; margin-bottom: 6px;"><strong>⚠️ Erreurs</strong></div>
                    <div style="font-size: 0.9em; color: #d32f2f;">${failedList}</div>
                </div>
            `;
    }

    chatContent += `</div>`;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ token: caster }),
      content: chatContent,
      rollMode: game.settings.get("core", "rollMode"),
    });

    // Notification de succès
    let notificationText = "📚 Livres détachés : ";
    notificationText += `${removedEffects.books.length} livre${removedEffects.books.length > 1 ? "s" : ""}`;

    if (totalFailed > 0) {
      notificationText += ` (${totalFailed} erreur${totalFailed > 1 ? "s" : ""})`;
    }

    ui.notifications.info(notificationText);
  } else {
    ui.notifications.error("❌ Aucun livre n'a pu être détaché !");

    // Show errors if any
    if (removedEffects.failed.length > 0) {
      const errorDetails = removedEffects.failed
        .map((f) => `• ${f.name} (${f.type}): ${f.error}`)
        .join("\n");

      console.error("[DEBUG] Failed to remove effects:", errorDetails);
      ui.notifications.error(`Détails des erreurs :\n${errorDetails}`);
    }
  }
})();
