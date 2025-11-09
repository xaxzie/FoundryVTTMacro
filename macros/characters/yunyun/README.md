# Yunyun - Mage Polyvalente

Yunyun est une mage capable de maîtriser de nombreuses magies diverses et variées. Elle se caractérise par sa polyvalence, et ses capacités sont majoritairement gérées par le **Charisme**.

## 📊 Caractéristiques Principales

- **Caractéristique Principale** : Charisme
- **Style de Combat** : Mage polyvalente avec sorts offensifs et de contrôle
- **Spécialité** : Diversité magique et adaptabilité tactique
- **Complexité** : Moyenne - équilibre entre dégâts, contrôle et défense

## 🔮 Sorts Disponibles

### ⚡ Sorts Offensifs

#### 1. Boule de Mana (`boule-de-mana.js`)

**Projectile magique adaptatif**

- **Mode Simple**
  - Coût : 3 mana (focalisable)
  - Niveau : 1
  - Dégâts : 1d6 + Charisme
  - Animation : Projectile énergétique bleu
- **Mode Lourde**
  - Coût : 6 mana (demi-focusable)
  - Niveau : 2
  - Dégâts : 2d5 + Charisme
  - Effet secondaire : Applique "Très Fatigué" à Yunyun
  - Animation : Projectile énergétique violet massif
- **Usage** : Attaque à distance polyvalente, mono-cible

---

#### 2. Explosion (`explosion.js`)

**Sort de zone destructeur**

- **Mode Simple**
  - Coût : 6 mana (non-focusable)
  - Niveau : Non spécifié
  - Dégâts : 2d6 + Charisme×1.5
  - Zone : 3 cases de rayon
  - Animation : Explosion rouge massive
- **Mode Concentré**
  - Coût : 6 mana (non-focusable)
  - Niveau : Non spécifié
  - Dégâts : 3d6 + Charisme×1.5
  - Zone : 2 cases de rayon
  - Effet secondaire : Applique "Très Fatigué" à Yunyun
  - Animation : Explosion rouge concentrée intense
- **Esquive** : Les cibles peuvent esquiver pour moitié dégâts
- **Usage** : Clear de zone, groupe d'ennemis, finisher

---

#### 3. Émanation de Flamme (`emanation-de-flamme.js`)

**Sort linéaire ou conique de feu**

- **Coût** : 4 mana (focusable)
- **Niveau** : 2
- **Attaque** : Jet de Charisme
- **Mode Ligne**
  - Type : Ligne droite depuis Yunyun
  - Dégâts : 1d6 + Charisme
  - Animation : Jet de flammes linéaire orange-rouge
- **Mode Cône**
  - Type : Cône 120°, rayon 4 cases
  - Dégâts : 1d6 + Charisme
  - Animation : Vague de flammes conique
- **Usage** : Attaque multi-cibles, contrôle de zone

---

#### 4. Aiguille Contrôlée (`aiguille-controlee.js`)

**Projectile téléguidé de précision**

- **Coût** : 2 mana (non-focusable)
- **Niveau** : 1
- **Attaque** : Jet de Charisme
- **Dégâts** : Toujours Charisme/2 (arrondi supérieur) - DÉGÂTS FIXES
- **Restriction** : Yunyun ne peut pas aider d'allié ce tour
- **Animation** : Fil énergétique bleu + impact cartoon
- **Usage** : Attaque garantie, finisher sur cible basse vie, précision absolue

---

#### 5. Onde Sonore (`onde-sonore.js`)

**Onde de choc sonore circulaire**

- **Coût** : 1 mana (focusable)
- **Niveau** : 1
- **Type** : Zone circulaire
- **Dégâts** : Variables selon situation (déterminés par MJ)
- **Animation** : Cast rose-turquoise + onde sonore bleue circulaire
- **Usage** : Attaque de zone économique, contrôle de foule

---

### 🛡️ Sorts Défensifs

#### 6. Portail de Renvoi (`portail-de-renvoi.js`)

**Contre-attaque par portail magique**

- **Coût** : 3 mana (non-focusable)
- **Niveau** : 1
- **Jet d'interception** : Charisme vs jet adversaire
- **Mécaniques** :
  - **Réussite simple** : Projectile renvoyé dans case aléatoire (3 cases rayon autour attaquant)
  - **Réussite critique (+10)** : Projectile renvoyé directement sur l'attaquant
  - **Échec** : Projectile touche Yunyun, portail trop tard
- **Animation** :
  - Portail bleu s'ouvre devant Yunyun
  - Projectile entre dans portail
  - Portail se rouvre ailleurs
  - Projectile ressort et frappe
- **Usage** : Défense réactive contre projectiles, retournement de situation

---

### 🧱 Sorts de Contrôle

#### 7. Ramollissement (`ramollissement.js`)

**Contrôle de terrain persistant**

- **Coût** : 3 mana (focusable)
- **Niveau** : 1
- **Zone** : 4 cases de rayon, animation permanente
- **Effet** : Ralentissement de Charisme/3 cases (arrondi supérieur)
- **Statut** : Applique "Sol Ramoli" aux cibles dans la zone
- **Réactivable** : Peut mettre fin au sort ou réappliquer les effets
- **Animation** : Zone brune-verte persistante avec particules
- **Usage** : Ralentir ennemis, créer zones de déni, contrôle de mobilité

---

#### 8. Mur de Pierre (`mur-de-pierre.js`)

**Invocation d'obstacle solide**

- **Coût** : 3 mana (non-focusable)
- **Niveau** : 1
- **Taille** : 2×1 cases (orientation choisie)
- **Points de Vie** : 3 × Charisme de Yunyun
- **Animation** : Rochers tombants en grès avec poussière
- **Persistant** : Reste jusqu'à destruction ou fin manuelle
- **Usage** : Bloquer passages, créer couverture, séparer champ de bataille

---

## 🛠️ Système de Gestion

### HandleYunYunEffect (`HandleYunYunEffect.js`)

**Système central de gestion des effets actifs de Yunyun**

Fonctionnalités :

- ✅ Gestion des postures de combat (Offensif/Défensif/Focus)
- ✅ Gestion des blessures (légères/graves)
- ✅ Suivi de l'état "Très Fatigué"
- ✅ Détection des effets externes
- ✅ Interface unifiée pour tous les effets

**Usage** : Lancer cette macro pour gérer/modifier les effets actifs sur Yunyun

---

### endYunYunEffect (`endYunYunEffect.js`)

**Macro de nettoyage des effets persistants**

Permet de terminer :

- 🧱 Murs de Pierre (destruction du mur)
- 🌊 Sols Ramolis (fin de la zone)
- 🔄 Autres effets persistants créés par Yunyun

**Usage** : Sélectionner Yunyun et lancer pour voir tous les effets terminables

---

### HandleYunYunRunes (`HandleYunYunRunes.js`)

**Système de gestion des runes magiques**

Gestion avancée des runes et marqueurs magiques de Yunyun.

---

## 📊 Tableau Récapitulatif

### Sorts par Catégorie

| Sort                | Type     | Coût | Focusable | Niveau | Dégâts/Effet              |
| ------------------- | -------- | ---- | --------- | ------ | ------------------------- |
| Boule de Mana       | Offensif | 3/6  | Oui/Demi  | 1/2    | 1d6+Cha / 2d5+Cha         |
| Explosion           | Offensif | 6    | Non       | -      | 2d6+Cha×1.5 / 3d6+Cha×1.5 |
| Émanation de Flamme | Offensif | 4    | Oui       | 2      | 1d6+Cha (ligne/cône)      |
| Aiguille Contrôlée  | Offensif | 2    | Non       | 1      | Cha/2 (fixe)              |
| Onde Sonore         | Offensif | 1    | Oui       | 1      | Variable (MJ)             |
| Portail de Renvoi   | Défensif | 3    | Non       | 1      | Renvoi projectile         |
| Ramollissement      | Contrôle | 3    | Oui       | 1      | Ralentit Cha/3 cases      |
| Mur de Pierre       | Contrôle | 3    | Non       | 1      | Obstacle (3×Cha PV)       |

### Coûts en Mana

| Range de Coût | Sorts                                                |
| ------------- | ---------------------------------------------------- |
| 1 mana        | Onde Sonore                                          |
| 2 mana        | Aiguille Contrôlée                                   |
| 3 mana        | Boule de Mana (simple), Portail, Ramollissement, Mur |
| 4 mana        | Émanation de Flamme                                  |
| 6 mana        | Boule de Mana (lourde), Explosion (×2 modes)         |

### Effets Secondaires

| Effet             | Sorts Affectés                            |
| ----------------- | ----------------------------------------- |
| Très Fatigué      | Boule de Mana (lourde), Explosion (conc.) |
| Restriction Allié | Aiguille Contrôlée                        |
| Sol Ramoli        | Ramollissement                            |

## 🎯 Guide d'Utilisation

### Combat Offensif

1. **Phase d'ouverture** : Onde Sonore (1 mana) pour dégâts de zone économiques
2. **Phase principale** : Émanation de Flamme (4 mana) en cône ou ligne
3. **Dégâts massifs** : Explosion (6 mana) sur groupes compacts
4. **Finisher** : Aiguille Contrôlée (2 mana) pour dégâts garantis

### Combat Défensif

1. **Stance Défensif** : Activer pour utiliser sorts réactifs
2. **Portail de Renvoi** : Intercepter projectiles ennemis
3. **Mur de Pierre** : Créer couverture et bloquer approches
4. **Ramollissement** : Ralentir ennemis qui s'approchent

### Contrôle de Zone

1. **Ramollissement** sur zones de passage clés
2. **Murs de Pierre** pour canaliser ennemis
3. **Émanation de Flamme** en cône pour zone denial
4. **Explosion** pour clear de groupe

### Gestion du Mana

- **Stance Focus** : Utiliser pour sorts focusables (Boule Mana simple, Émanation, Onde, Ramollissement)
- **Sorts économiques** : Onde Sonore (1) et Aiguille (2) pour conserver mana
- **Sorts puissants** : Réserver Explosion (6) et Boule Lourde (6) pour moments critiques
- **Attention fatigue** : Boule Lourde et Explosion Concentrée appliquent "Très Fatigué"

## 🎬 Animations et Effets Visuels

### Projectiles

- **Boule de Mana** : Orbe énergétique bleu/violet avec trail
- **Aiguille Contrôlée** : Fil d'énergie bleu fin et précis
- **Portail de Renvoi** : Portails verticaux bleus avec anneaux

### Zones

- **Explosion** : Explosion rouge massive avec onde de choc
- **Émanation de Flamme** : Jet/vague de flammes orange-rouge
- **Onde Sonore** : Onde circulaire bleue expansive
- **Ramollissement** : Zone brune-verte persistante avec particules

### Créations

- **Mur de Pierre** : Rochers tombants en grès avec poussière

## 🔧 Prérequis Techniques

### Modules FoundryVTT

- ✅ **Portal** - Ciblage et sélection de zones
- ✅ **Sequencer** - Système d'animations
- ✅ **JB2A** (Free + Patreon) - Bibliothèque d'effets visuels
- ✅ **Animated Spell Effects** - Effets cartoon supplémentaires

### Configuration Actor

- **Resources** : health, mana configurés
- **Characteristics** : Charisme comme stat principale
- **Active Effects** : Support des postures et états

## 📝 Notes Importantes

### Gestion Automatique

✅ **Calcul des dégâts** : Formules automatiques avec Charisme
✅ **Détection stance** : Focus/Offensif/Défensif automatique
✅ **Effets persistants** : Ramollissement, Mur de Pierre
✅ **Animations** : Toutes gérées automatiquement
✅ **Blessures** : Impact sur caractéristique calculé

### Gestion Manuelle

Les éléments suivants nécessitent action manuelle :

- ✋ **Mana** : Déduction/récupération
- ✋ **État Très Fatigué** : Application après Boule Lourde/Explosion Concentrée
- ✋ **Dégâts Onde Sonore** : Déterminés par MJ selon situation
- ✋ **Portail de Renvoi** : Jet adversaire doit être fourni
- ✋ **Destruction Mur** : Via endYunYunEffect ou dégâts

### Mécaniques Spéciales

- 🎲 **Aiguille Contrôlée** : Dégâts FIXES (Cha/2) - toujours les mêmes
- 🔄 **Portail de Renvoi** : Mécaniques critiques (+10 = renvoi direct)
- 🌊 **Ramollissement** : Effet persistant réapplicable
- 🧱 **Mur de Pierre** : 3×Cha PV, détruit si réduit à 0

## 🚀 Stratégies Avancées

### Combo Contrôle Total

1. Placer **Murs de Pierre** pour canaliser ennemis
2. Lancer **Ramollissement** sur zone de passage obligatoire
3. Utiliser **Émanation de Flamme** (cône) sur groupe ralenti
4. **Portail de Renvoi** prêt en défensif pour contre-attaques

### Combo Burst Damage

1. Activer **Stance Focus**
2. **Émanation de Flamme** (4 mana → 0 en Focus) sur groupe
3. **Explosion Simple** (6 mana) sur survivants
4. **Aiguille Contrôlée** (2 mana) pour finisher garanti

### Combo Économie Mana

1. **Stance Focus** active
2. **Onde Sonore** (1 → 0) pour poke zone
3. **Ramollissement** (3 → 0) pour contrôle
4. **Émanation Flamme** (4 → 0) pour dégâts
5. Conserver mana pour **Portail de Renvoi** si besoin

### Utilisation Fatigue Stratégique

⚠️ **Sorts appliquant Très Fatigué** : Boule Lourde, Explosion Concentrée

**Stratégie** :

- Utiliser en **fin de tour** ou **situation critique**
- S'assurer que l'effet de fatigue ne pénalise pas tour suivant
- Réserver pour **finishers** ou **retournement de situation**
- Ne PAS utiliser si combat prolongé attendu

## 📚 Référence Rapide

### Commandes Clés

**Lancer sort** :

1. Sélectionner token de Yunyun
2. Lancer macro du sort
3. Choisir mode/options si applicable
4. Cibler selon type de sort
5. Confirmer

**Gérer effets** :

- **HandleYunYunEffect** : Voir/modifier tous effets actifs
- **endYunYunEffect** : Terminer effets persistants (murs, ramollissement)

### Priorisation Sorts (par Coût/Efficacité)

1. **Onde Sonore** (1 mana) - Best ratio économique zone
2. **Aiguille Contrôlée** (2 mana) - Best ratio dégâts fixes
3. **Ramollissement/Mur** (3 mana) - Contrôle excellent
4. **Émanation Flamme** (4 mana) - Multi-cible équilibré
5. **Explosion** (6 mana) - Burst damage maximum

### Sorts par Situation

| Situation             | Sort Recommandé        | Raison                         |
| --------------------- | ---------------------- | ------------------------------ |
| Groupe compact        | Explosion              | Max dégâts zone                |
| Ennemis dispersés     | Émanation (ligne/cône) | Portée et flexibilité          |
| Économie mana         | Onde Sonore            | 1 mana, zone                   |
| Finisher garanti      | Aiguille Contrôlée     | Dégâts fixes                   |
| Défense projectile    | Portail de Renvoi      | Contre-attaque                 |
| Bloquer passage       | Mur de Pierre          | Obstacle physique              |
| Ralentir approche     | Ramollissement         | Zone persistante               |
| Cible unique éloignée | Boule de Mana (simple) | Projectile classique focusable |

---

_Yunyun - Mage Polyvalente de l'Adaptabilité Magique_ 🔮✨

**Version** : 2.0 (avec documentation complète des sorts et stratégies)
