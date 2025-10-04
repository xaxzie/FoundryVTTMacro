# Léo — Résumé des capacités et macros

Ce document présente de façon concise les capacités visuelles/macros de Léo, un guerrier mêlée qui mêle force physique et effets électriques. L'objectif des macros ici est d'afficher des animations et des messages de résultat (attaque + dégâts) — elles ne modifient pas automatiquement les feuilles de personnage.

## Capacités globales

- Rôle : Guerrier mêlée, dégâts et zone en ligne.
- Caractéristique principale : Physique (sauf exceptions précisées ci‑dessous).
- Système de dés : Tous les jets liés aux caractéristiques utilisent le système `d7` (ex. 4d7).
- Blessures : Un effet "Blessures" peut diminuer la valeur de la caractéristique.
- Bonus : Les Active Effects peuvent fournir des bonus à la caractéristique ou des bonus de dégâts (certaines variantes de sorts excluent ces bonus — indiqué ci‑dessous).

Modules requis (parmi les plus importants) : Sequencer, JB2A (free et/ou patreon selon les assets utilisés), Portal (pour le ciblage), et Carousel Combat Track si vous testez en combat. Vérifiez `MODULE-REQUIREMENTS.md` pour la liste complète.

## Sorts fournis (résumé fonctionnel)

- Steel Lance (Lance d'Acier) — fichier : `steel-lance.js`

  - Objectif : Créer une lance projetée en ligne qui traverse la carte et peut toucher plusieurs cibles en ligne.
  - Variantes :
    - Normal (depuis le jeton du lanceur) — Physique, coût 2 mana, focusable.
    - Électrique (normal) — Physique, coût 5 mana, zone plus large (5 cases).
    - Portail (depuis un point choisi) — Dextérité, coût +3 mana (non focusable pour le +3), aucun bonus d'Active Effects appliqué (seuls les bonus manuels entrés dans la boîte de dialogue sont pris en compte).
    - Portail Électrique — comme ci‑dessus mais zone 5 cases, coût plus élevé.
  - Dégâts : Formule de base `1d4 + [caractéristique] + bonus` (précisée dans la boîte de dialogue). En Position Offensive, les dégâts peuvent être maximisés selon la règle du projet.
  - Ciblage : Mode portail permet de choisir d'abord le point d'origine (où le portail s'ouvre), puis la direction / point d'impact.
  - Animations : utilise JB2A/Sequencer pour projectile + (en mode portail) animation d'ouverture de portail au point d'origine.
  - Modules requis : Sequencer, JB2A (ou jb2a_patreon pour variantes), Portal.

- Lightning Chain (Chaîne d'Éclairs) — fichier : `lightning-chain.js`

  - Objectif : Attaque directe à cible unique projetant des éclairs depuis l'arme.
  - Caractéristique : Physique.
  - Coût : typiquement 4 mana (vérifier entête du fichier), focalisable (gratuit en Position Focus si la configuration le permet).
  - Dégâts : `1d6 + fixe + Physique + bonus manuels + bonus d'Active Effects` (le bonus nommé "Serpent" est explicitement exclu pour ce sort).
  - Ciblage : Portal (sélection d'une position/cible avec le crosshair).
  - Animations : Marker cast sous le lanceur, transition attachée à l'arme, finish lightning (JB2A / jaamod / patreon assets selon configuration).
  - Modules requis : Sequencer, JB2A (et jb2a_patreon si utilisé), Portal.

- Steel Chain (Chaîne d'Acier) — fichiers : `steel-chain.js` + `steel-chain-end.js`

  - Objectif : Créer une chaîne magique persistante qui relie Léo à sa cible. Aucun dégât, juste enchaînement.
  - Caractéristique : Physique (l'effet "Serpent" ne fonctionne pas avec ce sort).
  - Coût : 2 mana, focalisable (gratuit en Position Focus).
  - Niveau : 2 (+4 bonus d'attaque).
  - Effet : Seul le jet d'attaque compte (pas de dégâts). En cas de réussite, la cible est "enchaînée" visuellement.
  - Ciblage : Portal (sélection de la cible).
  - Animations : Animation de lancement + chaîne persistante visible entre Léo et la cible (reste affichée jusqu'à libération).
  - Libération : Utiliser `steel-chain-end.js` pour choisir quelle(s) chaîne(s) terminer.
  - Modules requis : Sequencer, JB2A, Portal.

- Electric Axe Strike (Frappe Électrique) — fichier : `electric-axe-strike.js`

  - Objectif : Attaque corps-à-corps thématique (hache électrifiée) pour un seul adversaire.
  - Caractéristique : Physique.
  - Coût : faible (ex. 1 mana) — non focalisable selon la macro.
  - Dégâts : Exemple dans le fichier : `1d9 + fixe + Physique + bonus manuels + bonus d'Active Effects` (consultez le `SPELL_CONFIG` dans le fichier pour la formule exacte).
  - Ciblage : Token ciblé / Portal selon implémentation.
  - Animations : Séquence (charge + stretch d'arme + impact + aftermath). Utilise Sequencer et assets JB2A.
  - Modules requis : Sequencer, JB2A, Portal (si la macro active un ciblage Portal).

- Katana — fichier : `katana.js`

  - Objectif : Coup de katana rapide et précis, niveau 0 (attaque basique).
  - Caractéristique : Physique (jet de toucher basé sur la Physique).
  - Coût : 0 mana (focalisable — gratuit si en Position Focus).
  - Dégâts : `1d7 + 1 + Physique + bonus manuels + bonus d'Active Effects`.
  - Option spéciale : case à cocher (désactivée par défaut) « Fourreau de la waifu » qui ajoute `1d6` de dégâts si activée.
  - Ciblage : Portal crosshair pour sélectionner la position/cible (macro utilise Portal si disponible).
  - Animations : petite séquence cast → impact via Sequencer (fichiers JB2A par défaut, ajustables).
  - Modules requis : Sequencer, JB2A, Portal (Portal recommandé pour le ciblage visuel).

- Empalement — fichier : `empalement.js`

  - Objectif : Créer un cercle magique qui invoque des armes du sol pour transpercer les ennemis dans une zone et les ralentir.
  - Caractéristique : Dextérité (l'effet "Serpent" ne fonctionne pas avec ce sort).
  - Variantes :
    - Standard : Coût 3 mana (focalisable), niveau 2, ralentissement `1d3` cases.
    - Électrique : Coût 5 mana (focalisable), niveau 2, ralentissement `2d3` cases (plus puissant).
  - Dégâts : `1d6 + Dextérité + bonus manuels + bonus d'Active Effects` (Serpent exclu).
  - Zone d'effet : Cercle de 1 case de rayon autour du point ciblé.
  - Effet spécial : Applique un effet "Ralentissement" avec statusCounter aux cibles touchées (icône native FoundryVTT). La réduction de vitesse n'est jamais maximisée, même en Position Offensive.
  - Ciblage : Portal pour sélectionner le centre de la zone d'effet.
  - Animations : Effet de lancement + zone circulaire + impacts individuels sur chaque cible (+ effets électriques pour la variante électrique).
  - Modules requis : Sequencer, JB2A, Portal.

- Impulsion Divine — fichier : `impulsion-divine.js`

  - Objectif : Sort spécial permettant d'obtenir une action supplémentaire au risque de subir des blessures.
  - Caractéristique : Physique (pour le jet de réussite uniquement).
  - Coût : 0 mana (focalisable), niveau 2.
  - Mécaniques :
    - **Tentative de jet** : Jet de Physique vs difficulté 40 (de base). Réussite = action supplémentaire. Échec = pas de tour + blessure.
    - **Sacrifice volontaire** : Subir directement une blessure pour garantir l'action supplémentaire.
    - **Difficulté progressive** : Chaque utilisation augmente la difficulté de +5 (via l'effet "Impulsed").
  - Effets appliqués :
    - "Blessures" : Ajouté/augmenté en cas d'échec ou sacrifice volontaire (avec statusCounter).
    - "Impulsed" : Compteur d'utilisations qui augmente la difficulté future (avec statusCounter).
  - Animations : Effet divin en cas de réussite/sacrifice, effet de douleur en cas d'échec.
  - Modules requis : Sequencer, JB2A.

- Flèche d'Acier — fichier : `fleche-acier.js`

  - Objectif : Tirer des flèches magiques d'acier avec différentes propriétés selon la variante choisie.
  - Caractéristique : Dextérité (sauf Perce Muraille qui utilise Dextérité/2 pour l'attaque).
  - Variantes :
    - **Standard** : Coût 1 mana (focalisable), niveau 1, dégâts `1d4 + Dextérité`.
    - **Électrique** : Coût 4 mana (focalisable), niveau 2, dégâts `1d4 + 3 + Dextérité`, touche les ennemis adjacents à la cible.
    - **Perce Armure** : Coût 3 mana (focalisable), niveau 1, dégâts `1d4 + 3 + Dextérité`, ignore RD égale à Physique/2.
    - **Perce Muraille** : Coût 4 mana (demi-focalisable), niveau 0, attaque avec Dextérité/2, dégâts `2d4 + Physique*2 + 3`.
  - Effet spécial : L'effet "Serpent" ne fonctionne pas avec ces sorts.
  - Ciblage : Portal pour sélectionner la cible unique.
  - Animations : Projectile de flèche avec effets spéciaux selon la variante (électrique, perçage, impact lourd).
  - Modules requis : Sequencer, JB2A, Portal.

- Ragnarok — fichier : `ragnarok.js`

  - Objectif : Sort ultime projetant toutes les armes créées sur le terrain vers une cible unique avec convergence spectaculaire.
  - Caractéristique : Volonté (+ effets actifs + bonus manuels pour l'attaque uniquement).
  - Coût : 10 mana (demi-focalisable — coût réduit de moitié en Position Focus), niveau 3.
  - Dégâts : `Nombre d'armes × 1d6 + Physique×2 + bonus manuels` (les bonus d'effet ne s'appliquent pas aux dégâts).
  - Mécanique spéciale : La cible subit la moitié des dégâts même si elle réussit à esquiver (au lieu de subir aucun dégât).
  - Ciblage : Portal pour sélectionner la cible unique, puis dialogue pour indiquer le nombre d'armes (1-20).
  - Animations : Multiples projectiles d'armes convergeant depuis des directions aléatoires (360°), distances aléatoires (2-4 cases), délais répartis sur 2 secondes, impact final spectaculaire.
  - Modules requis : Sequencer, JB2A, Portal.

## Utilisation rapide

1. Sélectionnez le token de Léo.
2. Lancez la macro désirée (`steel-lance.js`, `lightning-chain.js`, `steel-chain.js`, ou `electric-axe-strike.js`).
3. Remplissez les bonus manuels demandés dans les dialogues (objets, enchantements temporaires, etc.).
4. Si la macro demande un ciblage Portal :
   - En mode normal : sélectionnez la direction / point d'impact depuis votre position.
   - En mode portail (Steel Lance) : sélectionnez d'abord le point d'origine du portail, puis la direction/point d'impact.
   - Pour Steel Chain : sélectionnez la cible à enchaîner.
5. La macro jouera la séquence d'animations et publiera le(s) roll(s) d'attaque et de dégâts dans le chat.
6. Pour Steel Chain : utilisez `steel-chain-end.js` quand vous voulez libérer les cibles enchaînées.

## Remarques & dépannage

- Vérifiez que `Sequencer` et `JB2A` (free ou patreon selon les fichiers référencés) sont installés et activés. Sans eux, les macros afficheront des erreurs ou ne joueront pas d'effets.
- `Portal` est requis pour les macros qui utilisent le crosshair (sélection de point/direction). Assurez-vous que les permissions et paramètres du module permettent aux joueurs d'utiliser les crosshairs.
- Si une macro attend une caractéristique en entrée (ex. Dextérité en mode portail), la valeur est lue via les utilitaires fournis : si vos feuilles ne contiennent pas ces attributs au bon emplacement, vous devrez fournir ou adapter manuellement.
- Les macros n'appliquent pas automatiquement les pertes de ressources (mana, HP) ni les effets de dégâts : elles affichent les résultats et animations uniquement.

## Contribution

Propositions d'amélioration, corrections FX ou nouvelles variantes : ouvrez une issue ou une PR. Indiquez : quel fichier, ce que vous voulez changer, et quels assets/modules sont nécessaires.

---

Pour toute précision sur une macro en particulier (changer l'asset utilisé, modifier la formule des dégâts, ajouter une variante), dites-moi laquelle et j'ajusterai le README et la macro en conséquence.
