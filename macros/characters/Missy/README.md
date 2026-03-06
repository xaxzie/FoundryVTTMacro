# 💇‍♀️ Missy - Mage aux Cheveux Magiques

Missy est une mage spécialisée dans la manipulation capillaire, utilisant ses cheveux comme armes et outils magiques. Son système d'effets et de sorts est centré sur la dextérité et les manipulations créatives de ses cheveux enchantés.

## 🎭 Système de Macros

### 📋 Gestionnaire Principal
- **HandleMissyEffect.js** : Gestionnaire complet d'effets, postures et blessures
- **endMissyEffect.js** : Système de fin d'effets persistants

### ⚔️ Sorts Offensifs

#### 🪄 Matraque Capillaire
**Fichier :** `matraque-capillaire.js`

Sort d'attaque de base utilisant les cheveux comme une masse.

- **Caractéristique :** Dextérité
- **Coût :** 2 mana (gratuit en Position Focus)
- **Niveau :** 1
- **Dégâts :** 1d6 + Dextérité + bonus
- **Portée :** Courte (Portal)
- **Animation :** Fouet de cheveux violet/magenta
- **Type :** Sort direct sans effet persistant

*Usage : Attaque basique rapide et efficace pour les combats de proximité.*

---

#### 💜 Etreinte Chevelue
**Fichier :** `etreinte-chevelue.js`

Sort de contrôle avancé qui enlace et affaiblit une cible.

- **Caractéristique :** Dextérité (test de toucher uniquement)
- **Coût :** 3 mana initial + 1 mana/tour de maintenance
- **Niveau :** 1
- **Effet :** Malus de -2 sur toutes les caractéristiques de la cible
- **Portée :** Moyenne (150px)
- **Animation :** Cheveux entrelacés persistants autour de la cible
- **Type :** Sort persistant avec maintenance

*Usage : Contrôle de battlefield pour affaiblir les ennemis puissants. Permet à Missy de se déplacer tout en maintenant l'effet.*

**⚠️ Important :** Pas de dégâts directs - seul le test de toucher compte. Utiliser `endMissyEffect.js` pour terminer l'étreinte.

---

#### 🌪️ Cheveux Déchaînés
**Fichier :** `cheveux-dechaines.js`

Missy libère une explosion capillaire explosive en cône qui frappe jusqu'à 3 ennemis simultanément. La direction du cône est choisie via Portal.

- **Caractéristique :** Dextérité
- **Coût :** 6 mana | **Demi-Focus :** 3 mana si en Position Focus
- **Zone :** Cône de 120° sur 4 cases de rayon (direction via Portal)
- **Animation :** Trois cônes violets simultanés (axe central ±40°)
- **Cibles :** Auto-détectées dans la zone, modifiables (max 3)
- **Type :** Sort de zone à dégâts multiples

**Mécanique de dégâts selon le nombre de cibles :**
| Cibles choisies | Cible principale | Cible(s) secondaire(s) |
|:---:|:---:|:---:|
| 1 | `2d4 + Dex` | — |
| 2 | `2d4 + Dex` | `1d4 + Dex/2` |
| 3 | `1d4 + Dex/2` | `1d4 + Dex/2` × 2 |

*Usage : Sort de zone idéal pour frapper plusieurs ennemis groupés. Plus efficace contre 1 cible (dégâts maximaux) mais utile pour toucher tout un groupe à moindre coût de mana grâce au Demi-Focus.*

---

### 🛡️ Effets Défensifs

#### 🛡️ Cheveuxlerie
**Intégré dans :** `HandleMissyEffect.js`

Protection capillaire formant un bouclier défensif.

- **Coût :** 2 mana par tour (maintenance)
- **Résistance :** Dextérité ÷ 2 (arrondi vers le bas)
- **Icône :** Bouclier métallique
- **Flag :** `resistance` avec valeur dynamique basée sur la Dextérité
- **Status Counter :** Toujours égal à Dextérité ÷ 2

*Usage : Protection passive qui s'adapte automatiquement à la Dextérité de Missy.*

---

## 🎨 Thème Visuel

### 🎨 Couleurs Signature
- **Couleur principale :** Violet/Magenta (`#9c27b0`)
- **Animations :** Teintes violettes et roses
- **Style :** Élégant et mystique

### ✨ Animations (JB2A)
- **Matraque :** `jb2a.melee_generic.creature_attack.fist.002.blue.1` (teinté violet)
- **Etreinte :** `jb2a_patreon.energy_strands.complete.pinkyellow.01` (persistant)
- **Cheveux Déchaînés :** `jb2a_patreon.cone_of_cold.purple` × 3 simultanés (0°, −40°, +40°)
- **Cast :** `jb2a_patreon.markers.02.pink`

---

## ⚙️ Système Technique

### 🔧 Caractéristiques Système
- **Caractéristique principale :** Dextérité
- **Système de blessures :** Intégré (réduit les caractéristiques)
- **Postures :** Focus, Offensif, Défensif (comme les autres personnages)
- **Ciblage :** Portal Module pour sélection précise des cibles

### 🏗️ Architecture des Effets
- **Effets personnalisés :** Configuration dans `CUSTOM_EFFECTS`
- **Effets persistants :** Gestion automatique via `endMissyEffect.js`
- **Flags système :** Support des bonus/malus dynamiques
- **GM Delegation :** Support socketlib pour effets cross-ownership

### 📊 Calculs Dynamiques
- **Cheveuxlerie :** Résistance = `Math.floor(dexterite / 2)`
- **Status Counters :** Valeurs automatiquement calculées
- **Bonus d'effets :** Cumul automatique des flags actifs

---

## 🎯 Stratégies de Combat

### 🥊 Combat Rapproché
1. **Matraque Capillaire** pour dégâts constants
2. **Position Focus** pour économie de mana
3. **Cheveuxlerie** pour protection passive

### 🎭 Contrôle de Zone
1. **Etreinte Chevelue** sur cibles prioritaires
2. Maintien de distance tout en contrôlant
3. Gestion de mana pour maintenance des effets

### 🛡️ Défense
1. **Cheveuxlerie** permanent si mana suffisant
2. **Position Défensif** pour réduction de dégâts
3. Mobilité pour éviter les concentrations d'ennemis

---

## 📝 Notes de Développement

### 🔄 Évolutions Prévues
- Nouveaux sorts capillaires (ex: "Cheveu Rasoir", "Toile Capillaire")
- Effets de groupe avec les cheveux
- Sorts utilitaires (escalade, manipulation d'objets)

### 🐛 Points d'Attention
- **Maintenance des effets :** Vérifier régulièrement les coûts en mana
- **Animations persistantes :** Nettoyer avec `endMissyEffect.js`
- **Calculs dynamiques :** Cheveuxlerie se recalcule à chaque application

### 🔧 Maintenance
- Utiliser `HandleMissyEffect.js` pour gestion complète des états
- `endMissyEffect.js` pour terminer proprement les effets persistants
- Vérifier la cohérence des animations Sequencer

---

## 🎮 Guide d'Usage

### 🚀 Démarrage
1. Sélectionner le token de Missy
2. Utiliser `HandleMissyEffect.js` pour configurer les effets de base
3. Lancer les sorts depuis leurs macros individuelles

### ⚔️ En Combat
1. **Tour 1 :** Position + Cheveuxlerie si nécessaire
2. **Attaque :** Matraque ou Etreinte selon la situation
3. **Maintenance :** Gérer les coûts en mana des effets persistants

### 🧹 Fin de Combat
1. Utiliser `endMissyEffect.js` pour nettoyer les effets persistants
2. Vérifier les animations Sequencer restantes
3. Réinitialiser les positions si nécessaire

---

*Système créé pour FoundryVTT avec support JB2A, Portal, et Sequencer.*
*Thème : Magie capillaire élégante et polyvalente* 💇‍♀️✨
