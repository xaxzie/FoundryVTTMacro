# Aloha — Résumé des capacités et macros

Ce document présente de façon concise les capacités visuelles/macros d'Aloha, un défenseur thermique qui utilise sa carrure imposante et sa capacité à chauffer ce qu'il touche pour protéger ses compagnons. L'objectif des macros ici est d'afficher des animations et des messages de résultat (attaque + dégâts) — elles ne modifient pas automatiquement les feuilles de personnage.

## Capacités globales

- **Rôle** : Tank/Défenseur thermique avec capacités de grappling et contrôle de zone
- **Caractéristique principale** : Physique (pour la plupart des sorts)
- **Thème** : Chaleur et effets thermiques, poêle chauffée à blanc
- **Système de dés** : Tous les jets liés aux caractéristiques utilisent le système `d7` (ex. 4d7)
- **Blessures** : Un effet "Blessures" peut diminuer la valeur de la caractéristique
- **Bonus** : Les Active Effects peuvent fournir des bonus à la caractéristique ou des bonus de dégâts

**Spécialité d'Aloha** : Aloha est un grand gars qui se sert de sa carrure pour défendre ses compagnons. Il a la capacité de faire chauffer ce qu'il touche... ou de se chauffer lui-même. Il se bat avec une poêle qu'il chauffe régulièrement à blanc.

Modules requis (parmi les plus importants) : Sequencer, JB2A (free et/ou patreon selon les assets utilisés), Portal (pour le ciblage), et Carousel Combat Track si vous testez en combat. Vérifiez `MODULE-REQUIREMENTS.md` pour la liste complète.

## 🔥 Sorts fournis (résumé fonctionnel)

### Coup de Poêle

**Fichier** : `coup-de-poele.js`
**Type** : Attaque de base thermique (niveau 0)
**Coût** : 0 mana (focalisable - gratuit en Position Focus)
**Portée** : Portal targeting

**Description** : Attaque basique avec la poêle chauffée d'Aloha. Sort de niveau 0 parfait pour les attaques fréquentes.

**Mécaniques** :
- **Caractéristique** : Physique (pour l'attaque et les dégâts)
- **Niveau** : 0 (+0 bonus d'attaque)
- **Dégâts** : `1d4 + Physique/2 + bonus manuels + bonus d'Active Effects`
- **Thème visuel** : Poêle chauffée avec effets thermiques orange/rouge

**Combat Stance Integration** ⚔️ :
- **Position Focus** : **GRATUIT** (0 mana), jets de dés normaux
- **Position Offensive** : 0 mana, dégâts **MAXIMISÉS** (4 + bonus de Physique/2)
- **Position Défensive/Normale** : 0 mana, jets de dés normaux

**Ciblage** : Portal crosshair pour sélectionner la cible
**Animations** : Effets de chaleur et impact thermique avec thème orange (#ff5722)
**Modules requis** : Sequencer, JB2A, Portal

---

### Cuisine à Blanc

**Fichier** : `cuisine-a-blanc.js`
**Type** : Attaque améliorée thermique (niveau 1)
**Coût** : 3 mana (focalisable - gratuit en Position Focus)
**Portée** : Portal targeting

**Description** : Version améliorée du Coup de Poêle avec une poêle chauffée à blanc pour des dégâts supérieurs.

**Mécaniques** :
- **Caractéristique** : Physique (pour l'attaque et les dégâts)
- **Niveau** : 1 (+2 bonus d'attaque)
- **Dégâts** : `1d6 + Physique + bonus manuels + bonus d'Active Effects`
- **Thème visuel** : Poêle chauffée à blanc avec effets thermiques intenses

**Combat Stance Integration** ⚔️ :
- **Position Focus** : **GRATUIT** (0 mana), jets de dés normaux
- **Position Offensive** : 3 mana, dégâts **MAXIMISÉS** (6 + bonus de Physique)
- **Position Défensive/Normale** : 3 mana, jets de dés normaux

**Ciblage** : Portal crosshair pour sélectionner la cible
**Animations** : Effets thermiques blancs intenses avec impacts spectaculaires
**Modules requis** : Sequencer, JB2A, Portal

---

### Contact Cuisant

**Fichier** : `contact-cuisant.js`
**Type** : Sort de grappling progressif avec système dual-mode
**Coût** : Variable (2 mana initial / 3 mana réactivation, puis 1 mana + risque pour chauffer)
**Portée** : Portal targeting

**Description** : Sort complexe à deux phases permettant d'agripper un ennemi puis de le chauffer progressivement avec des risques croissants pour Aloha.

#### Phase 1 - Lancement Initial/Réactivation

**Coût Initial** :
- **Première utilisation** : 2 mana (focalisable)
- **Réactivation** : 3 mana (non focalisable - coût fixe)

**Mécaniques de Grappling** :
- **Caractéristique** : Physique (pour l'attaque)
- **Niveau** : 1 (+2 bonus d'attaque)
- **Dégâts** : `1d6 + Physique/2 + bonus manuels + bonus d'Active Effects`
- **Effet appliqué** : "Etreinte Chauffée" sur la cible

#### Phase 2 - Mode Chauffage

**Coût de Chauffage** : 1 mana + risque de blessure

**Mécaniques de Chauffage** :
- **Dégâts à la cible** : `1d6 + Physique + bonus manuels + bonus d'Active Effects`
- **Dégâts à Aloha** : La moitié des dégâts infligés, sauf si réussit un jet de Volonté
- **Jet de Volonté d'Aloha** : Difficulté 15 (+5 par utilisation précédente)
- **Système progressif** : Plus on utilise le chauffage, plus c'est risqué

**Suivi des Utilisations** :
- Compteur persistent via `flags.world.contactCuisantUsageCount`
- Difficulté progressive : 15, 20, 25, 30, etc.
- Risque croissant pour Aloha à chaque utilisation

**Combat Stance Integration** ⚔️ :
- **Position Focus** : Coût initial GRATUIT (0 mana), chauffage normal (1 mana)
- **Position Offensive** : Coûts normaux, dégâts **MAXIMISÉS**
- **Position Défensive/Normale** : Coûts normaux, jets de dés normaux

**États de l'Effet** :
- **"Etreinte Chauffée"** : Appliqué à la cible, permet les actions de chauffage
- **Flags de suivi** : `contactCuisantCaster`, `contactCuisantUsageCount`, `spellName`
- **Animation persistante** : Effet thermique continu sur la cible

**Interface Utilisateur** :
- **Dialog Initial** : Choix entre lancement initial (2/3 mana) et chauffage (1 mana)
- **Dialog de Chauffage** : Confirme le chauffage avec risque affiché
- **Feedback visuel** : Animations distinctes pour grappling et chauffage

**Ciblage** : Portal crosshair pour sélectionner la cible (phase initiale seulement)
**Animations** : Grappling avec chaînes thermiques, effets de chauffage progressifs
**Modules requis** : Sequencer, JB2A, Portal, socketlib (pour la délégation GM)

**Stratégie d'Utilisation** :
1. **Première phase** : Lancer sur la cible pour l'agripper (2 mana)
2. **Chauffages répétés** : Utiliser le mode chauffage (1 mana + risque)
3. **Gestion du risque** : Surveiller la difficulté croissante des jets de Volonté
4. **Réactivation** : Si l'effet expire, relancer pour 3 mana

---

### Charge Éclair

**Fichier** : `charge-eclair.js`
**Type** : Sort de déplacement offensif en ligne (niveau 1)
**Coût** : 3 mana (focalisable — gratuit en Position Focus)
**Portée** : Ligne droite de 6 cases, direction via Portal

**Description** : Aloha fonce en ligne droite et percute toutes les cibles sur sa trajectoire. Si un mur bloque son élan avant la fin des 6 cases, les cases non parcourues infligent des dégâts bonus supplémentaires à chaque cible touchée.

**Mécaniques** :
- **Caractéristique** : Physique (jet de touché et dégâts)
- **Niveau** : 1 (+2 au jet de touché)
- **Jet de touché** : `Physiqued7 + 2 (niv.1) + bonus manuels`
- **Dégâts de base** : `1d6 + Physique`
  - **1ère cible** : score complet
  - **Cibles suivantes** : moitié du score (arrondi inférieur)
- **Bonus mur** : Si Aloha est stoppé par une paroi, chaque case restante inflige `×2` en dégâts plats supplémentaires à toutes les cibles touchées
- **Déplacement** : Aloha est physiquement déplacé jusqu'à la dernière case libre de son chemin

**Détection automatique des cibles** :
- Toutes les cibles présentes sur les cases traversées sont détectées dans l'ordre d'impact
- Fonctionne en ligne droite snappée aux 8 directions (cardinal + diagonal)

**Combat Stance Integration** ⚔️ :
- **Position Focus** : **GRATUIT** (0 mana)
- **Position Offensive** : 3 mana, jets normaux
- **Position Défensive/Normale** : 3 mana, jets normaux

**Ciblage** : Portal — sélectionner un point dans la direction de la charge
**Animations** : Traînée de charge orange, impacts sur chaque cible, crash sur mur si applicable
**Modules requis** : Sequencer, JB2A, Portal

---

### Sous Haute Pression

**Fichier** : `sous-haute-pression.js`
**Type** : Sort d'explosion thermique en zone (niveau 2)
**Coût** : 8 mana NON FOCUSABLE − Résistance Thermique actuelle (minimum 0)
**Zone** : 2 cases de rayon, centré sur Aloha (aucun ciblage manuel)

**Description** : Aloha relâche en une seule explosion toute la chaleur accumulée. Plus il a de Résistance Thermique, moins le sort coûte cher, plus il fait de dégâts, et plus loin il projette ses ennemis. Après le sort, la Résistance Thermique est ineffective pendant 2 tours.

**Mécaniques** :
- **Caractéristique** : Physique
- **Niveau** : 2 (+4 au jet de touché)
- **Jet de touché** : `Physiqued7 + 4 (niv.2) + bonus manuel`
- **Dégâts** : `2d6 + Physique + Résistance Thermique`
- **Coût dynamique** : `max(0, 8 − Résistance Thermique)`
- **Projection** (indicative, non appliquée) : `1d(RT ÷ 2)` cases par cible
- **Esquive** :
  - Cible à **≤ 1 case** : **impossible** — trop proche
  - Cible à **2 cases** : demi-dégâts autorisés
- **Post-sort** : Résistance Thermique ineffective 2 tours (effet maintenu, simplement non comptabilisé)

**Synergie avec la Résistance Thermique :**

| RT | Coût | Bonus dégâts | Projection |
|:---:|:---:|:---:|:---:|
| 0 | 8 mana | +0 | — |
| 3 | 5 mana | +3 | 1d1 case |
| 6 | 2 mana | +6 | 1d3 cases |
| 8 | 0 mana | +8 | 1d4 cases |

*Plus Aloha est blessé (donc plus il a de RT), plus cette explosion est dévastatrice et économique.*

**Animation** : `jb2a_patreon.fireball.explosion.orange` centrée sur Aloha
**Modules requis** : Sequencer, JB2A

---

## 🛠️ Macros Utilitaires

### Handle Aloha Effect

**Fichier** : `HandleAlohaEffect.js`
**Type** : Gestionnaire d'effets centralisé
**Usage** : Système interne pour gérer les effets thermiques d'Aloha

**Fonctionnalités** :
- **Configuration centralisée** : `CUSTOM_EFFECTS` prêt pour extensions futures
- **Thème thermique** : Couleurs orange/rouge (#ff5722) et emojis 🍳
- **Système extensible** : Framework pour ajouter de nouveaux effets facilement
- **Intégration GM** : Support pour la délégation via socketlib

---

### End Aloha Effect

**Fichier** : `endAlohaEffect.js`
**Type** : Nettoyage des effets thermiques
**Usage** : Sélectionner Aloha et lancer cette macro pour supprimer ses effets

**Fonctionnalités** :
- **Détection automatique** : Scanne tous les tokens pour trouver les effets d'Aloha
- **Interface de sélection** : Permet de choisir quels effets supprimer
- **Effets supportés** : "Etreinte Chauffée" (Contact Cuisant)
- **Animations de libération** : Effets visuels lors de la suppression
- **Nettoyage Sequencer** : Supprime les animations persistantes

**Effets Détectés** :
- **"Etreinte Chauffée"** : Effet du sort Contact Cuisant
- **Détection par flags** : `contactCuisantCaster` et `spellName`
- **Données supplémentaires** : Affiche le nombre d'utilisations

**Interface** :
- **Section "🔥 Effets Thermiques"** avec bordure orange
- **Informations détaillées** : Cible, type d'effet, nombre d'utilisations
- **Options** : Supprimer sélectionnés ou tous les effets
- **Feedback visuel** : Animations de libération et messages de chat

**Modules requis** : Sequencer, custom-status-effects (pour délégation GM)

---

## 🎯 Utilisation rapide

1. **Sélectionnez le token d'Aloha**
2. **Lancez la macro désirée** (`coup-de-poele.js`, `cuisine-a-blanc.js`, `contact-cuisant.js`)
3. **Remplissez les bonus manuels** dans les dialogues (objets, enchantements, etc.)
4. **Ciblage Portal** :
   - Sélectionnez la cible avec le crosshair orange/rouge
   - Pour Contact Cuisant : dialogue de choix entre phases après ciblage
5. **Observez les animations** thermiques avec thème orange/rouge
6. **Consultez le chat** pour les résultats d'attaque et de dégâts
7. **Nettoyage** : Utilisez `endAlohaEffect.js` pour supprimer les effets persistants

## 🔥 Conseils stratégiques

### Coup de Poêle
- **Sort de base** : Parfait pour les attaques fréquentes (0 mana)
- **Position Focus** : Gratuit, idéal pour les combats prolongés
- **Position Offensive** : Dégâts maximisés, excellent pour finir les ennemis

### Cuisine à Blanc
- **Sort intermédiaire** : Plus de dégâts que Coup de Poêle (1d6 vs 1d4)
- **Coût modéré** : 3 mana, utilisable plusieurs fois par combat
- **Thème "blanc"** : Animations plus intenses pour un impact visuel

### Contact Cuisant
- **Sort complexe** : Système à deux phases pour contrôle prolongé
- **Gestion du risque** : Surveiller la difficulté croissante des jets de Volonté
- **Stratégie économique** : Coût initial faible (2 mana), puis risque vs récompense
- **Contrôle de zone** : Immobilise l'ennemi pendant les phases de chauffage
- **Risque partagé** : Aloha peut se blesser, mais inflige des dégâts constants

## 🔧 Remarques & dépannage

- **Modules requis** : Vérifiez que `Sequencer`, `JB2A`, et `Portal` sont installés et activés
- **Permissions Portal** : Assurez-vous que les joueurs peuvent utiliser les crosshairs
- **Thème visuel** : Tous les effets utilisent la palette orange/rouge (#ff5722) pour cohérence
- **Contact Cuisant** : Effet le plus complexe, nécessite `socketlib` pour la délégation GM
- **Persistance des effets** : Les effets thermiques restent jusqu'à nettoyage manuel
- **Système progressif** : Contact Cuisant devient plus risqué à chaque utilisation

## 🎨 Thème visuel

Tous les sorts d'Aloha suivent un **thème thermique cohérent** :
- **Couleurs principales** : Orange (#ff5722), rouge, blanc-chaud
- **Éléments visuels** : Flammes, chaleur, vapeur, effets thermiques
- **Icônes** : Émojis 🍳 (poêle) et 🔥 (feu) dans les interfaces
- **Animations** : JB2A avec teintes orange/rouge pour cohérence
- **Effets persistants** : Animations thermiques continues pour Contact Cuisant

## 📈 Évolutions futures

### Sorts potentiels
- **Bouclier Thermique** : Protection qui brûle les attaquants
- **Vague de Chaleur** : Attaque en zone avec effets de déshydratation
- **Poêle Volante** : Projectile à distance avec la poêle
- **Embrace Ardent** : Version améliorée de Contact Cuisant
- **Température Corporelle** : Auto-buff de résistance au froid/feu

### Améliorations techniques
- **Intégration ressources** : Déduction automatique du mana
- **Validation de tour** : Vérification de l'état de combat
- **Effets de zone** : Extensions pour attaques multiples
- **Système de température** : Mécaniques de surchauffe/refroidissement

## 🤝 Contribution

Propositions d'amélioration, corrections FX ou nouvelles variantes : ouvrez une issue ou une PR. Indiquez : quel fichier, ce que vous voulez changer, et quels assets/modules sont nécessaires.

---

**Aloha maîtrise la chaleur pour protéger ses alliés et punir ses ennemis ! 🍳🔥**

Pour toute précision sur une macro en particulier (changer l'asset utilisé, modifier la formule des dégâts, ajouter une variante), dites-moi laquelle et j'ajusterai le README et la macro en conséquence.
