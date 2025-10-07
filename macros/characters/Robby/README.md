# Robby — Sorts et notes d'utilisation

Ce dossier contient les macros liées au personnage "Robby", un lanceur orienté magie du sang et attaques précises (mêlée et projectiles). Ce README résume ses sorts, comportements et dépendances.

## Type de personnage

Robby est un personnage polyvalent axé sur la magie du sang et les attaques physiques rapides :

- Caractéristique principale (magie) : Esprit (pour les sorts comme Incarnation Sanglante)
- Caractéristique principale (mêlée) : Dextérité (pour Coup d'Épée)
- Style : mélange d'attaques directes (épée) et de sorts à cible (projectiles) qui peuvent appliquer des malus/bonus persistants.

## Macros présentes

- `coup-depee.js`

  - Coup d'Épée : attaque de mêlée directe.
  - Attaque basée sur la Dextérité, dégâts `1d4 + Dextérité + bonus`.
  - Coût : 0 mana (focalisable). Utilise `Portal` pour le ciblage et `Sequencer` pour l'animation.

- `incarnation-sanglante.js`

  - Incarnation Sanglante : crée un projectile (petit rongeur de sang) qui inflige dégâts.
  - Attaque basée sur Esprit, dégâts `1d6 + Esprit + bonus`.
  - Coût : 4 mana (focalisable). La cible peut faire un jet de Physique pour résister et réduire les dégâts de moitié.
  - Utilise `Portal` pour le ciblage, `Sequencer` pour les effets, et génère un message de chat consolidé (attaque + dégâts + résistance).

- `flechettes-sanguines.js`

  - Fléchettes Sanguines : sort polyvalent avec deux modes — offensif (inflige dégâts et applique un ralentissement) et défensif (donne de la résistance à un allié).
  - Les effets persistants (ralentissement / résistance) sont appliqués via ActiveEffect et identifiés par des flags `flags.world.spellCaster` / `flags.world.spellName`.
  - Note importante : le comportement a été ajusté pour éviter l'accumulation indésirable — si un effet (ralentissement ou résistance) existe déjà sur la cible, la macro ne l'incrémente pas et affiche dans le chat que la valeur a été "réinitialisée" (affiche la valeur actuelle).

- `endRobbyEffect.js`
  - Gestionnaire pour détecter et terminer les effets appliqués par Robby sur la scène.
  - Fournit une interface pour lister et retirer les effets (ralentissements, résistances, etc.).
  - Recherche les effets par nom et par flags configurés dans `EFFECT_CONFIG`.

## Détails d'implémentation et flags

- Les macros utilisent des ActiveEffects avec des flags personnalisés (par exemple `flags.world.spellCaster` et `flags.world.spellName`) pour identifier les effets applicables et permettre à `endRobbyEffect.js` de les retrouver.
- Les animations sont gérées avec `Sequencer` et les ciblages avec `Portal`. Les fichiers d'animation référencent souvent la librairie `jb2a`.
- Les macros respectent les positions/stances (`focus`, `offensif`, `defensif`) lorsqu'elles calculent coûts/mécaniques (ex : coût 0 si en Focus, maximisation des dégâts en position Offensif).

## Dépendances

- Modules recommandés :
  - Sequencer (pour les animations)
  - Portal (pour le ciblage)
  - JB2A (assets d'animation)
  - socketlib / un GM-delegation helper (les macros délèguent la création/mise à jour/suppression d'ActiveEffect quand l'utilisateur n'est pas GM)

Assurez-vous que ces modules sont installés et activés pour une expérience complète.

## Utilisation et bonnes pratiques

- Sélectionnez toujours le token de Robby avant d'exécuter une macro.
- Les dialogues de configuration demandent des bonus optionnels (attaque / dégâts) et affichent un aperçu du coût en mana et des dommages estimés.
- Pour retirer proprement les effets persistants appliqués par Robby, exécutez `endRobbyEffect.js` et utilisez l'interface pour sélectionner ceux à supprimer.

## Notes et limites connues

- Les macros effectuent des vérifications basiques (token sélectionné, présence d'acteur, modules requis) mais supposent un système d'acteur avec attributs localisés (`actor.system.attributes`).
- Le comportement d'empilement des effets pour `flechettes-sanguines` a été modifié : les effets ne s'additionnent plus automatiquement — la macro laisse la valeur existante et indique qu'elle a été réinitialisée si l'effet existe.
- Les messages et styles HTML/CSS sont embarqués dans les macros ; si vous souhaitez harmoniser les couleurs ou rendre les styles plus uniformes, envisagez d'extraire des constantes ou styles partagés.

## Où modifier/étendre

- Ajouter un nouveau sort : créer un nouveau fichier `.js` suivant les patterns existants (config + dialog + ciblage + animation + envoi chat).
- Ajouter un nouvel effet persistant : mettre à jour `EFFECT_CONFIG` dans `endRobbyEffect.js` avec la détection de flags et la description.

---

Si vous voulez, je peux :

- Générer des exemples d'usage dans le chat (ex : commandes rapides),
- Extraire les couleurs/styles communs dans un petit module utilitaire,
- Ou ajouter des commentaires techniques aux macros pour faciliter la maintenance.
