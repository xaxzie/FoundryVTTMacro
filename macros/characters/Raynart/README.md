# Raynart - Le Mage de la Mécanique

## Vue d'ensemble du personnage

**Raynart** est un mage spécialisé dans la création et le contrôle d'invocations mécaniques. Son arsenal diversifié lui permet d'invoquer des constructions allant de simples murs défensifs à des tourelles offensives sophistiquées, en passant par des créatures de reconnaissance et des systèmes de protection avancés.

### Caractéristiques principales

- **Dextérité** : Utilisée pour déterminer les PV et l'efficacité de la plupart des invocations
- **Esprit** : Utilisée pour les calculs de défense (RD foudre) et certaines invocations spéciales
- **Style de jeu** : Contrôle de zone, support défensif, pression offensive à distance
- **Complexité** : Élevée - nécessite une gestion stratégique des ressources et du positionnement

## 🔧 Système d'Invocations Mécaniques

### Macro Centrale : `HandleRaynartInvocations.js`

Cette macro est le cœur du système d'invocations de Raynart. Elle permet de :

- **Créer** des invocations mécaniques variées
- **Gérer** toutes les invocations existantes sur le terrain
- **Détruire** les invocations pour récupérer du mana
- **Calculer automatiquement** les PV selon les statistiques de Raynart
- **Afficher** des animations appropriées pour chaque action

#### Fonctionnalités clés

✅ **Détection automatique** des invocations existantes (basée sur actor.id)
✅ **Création multiple** d'invocations en une seule action
✅ **Animation unique** de cast pour plusieurs invocations
✅ **Animations individuelles** de création pour chaque invocation
✅ **Destruction avec récupération de mana** (calcul automatique)
✅ **Interface intuitive** avec sélection visuelle

## 📋 Types d'Invocations

### 🛡️ Mur Mécanique

**Type** : Défensif - Barrière
**Actor ID** : `9NXEFMzzBF3nmByB`

- **Coût** : 4 mana / 3 murs
- **PV** : (4 + Dextérité + Esprit) × 2
- **Spécial** :
  - 3 murs instantanés par combat (gestion manuelle)
  - Récupère 2 mana si démontés manuellement (pour 3 murs)
- **Usage** : Bloquer des passages, créer des choke points, protéger des alliés

### 🎯 Balliste

**Type** : Offensif - Tourelle à distance
**Actor ID** : `FQzsrD4o20avg7co`

- **Coût** : 4 mana par tourelle
- **PV** : 4 + Dextérité
- **Récupération mana** : 4 mana (destruction)
- **Usage** : Pression offensive à distance, couverture de zone

### ⚔️ Gatling

**Type** : Offensif - Tourelle lourde
**Actor ID** : `M7oAyZmgzi5XEYNE`

- **Coût** : 4 mana + sacrifice d'une Balliste
- **PV** : 4 + Dextérité
- **Récupération mana** : 4 mana (destruction)
- **Spécial** : Nécessite le sacrifice d'une Balliste (non vérifié automatiquement par la macro)
- **Usage** : Dégâts massifs concentrés, destruction de cibles prioritaires

### 🕷️ Araignée Mécanique

**Type** : Reconnaissance - Éclaireur
**Actor ID** : `P0NlGCJh7r6K5yuc`

- **Coût** : 3 mana par araignée
- **PV** : Dextérité / 2 (arrondi inférieur)
- **Récupération mana** : 3 mana (destruction)
- **Spécial** : Raynart partage 2 sens avec ses araignées
- **Usage** : Exploration, détection d'ennemis, contrôle de vision

### ⚡ ParaTonnerre

**Type** : Défensif - Protection contre la foudre
**Actor ID** : `pJuR9WIyouueE6Kv`

- **Coût** : 4 mana par paratonnerre
- **PV** : 4 + Dextérité
- **Récupération mana** : 4 mana (destruction)
- **Spécial** :
  - Zone de protection : 4 cases de rayon
  - RD Foudre : Dextérité + Esprit
  - Offre un jet de déviation sur toutes les attaques foudre dans la zone
  - Animation persistante de protection
- **Usage** : Défense contre les ennemis utilisant la foudre, contrôle de zone défensif

### 👁️ Velkoz

**Type** : Défensif - Protection active
**Actor ID** : `DCUdL8S8N6t9eSMF`

- **Coût** : 4 mana par velkoz
- **PV** : Esprit / 2 (arrondi inférieur)
- **Récupération mana** : 4 mana (destruction)
- **Spécial** : Protège une cible par tour de maximum 25 dégâts par velkoz
- **Usage** : Protection d'alliés vulnérables, absorption de dégâts

## 🎮 Utilisation

### Création d'invocations

1. Sélectionner le token de Raynart
2. Lancer la macro `HandleRaynartInvocations.js`
3. Choisir le type d'invocation dans le menu
4. Indiquer le nombre à créer
5. Cibler les emplacements avec Portal (un par un)
6. Confirmer la création

**Animation** :

- Une animation de cast unique sur Raynart
- Une animation de création individuelle pour chaque invocation
- Animation persistante pour le ParaTonnerre

### Destruction d'invocations

1. Sélectionner le token de Raynart
2. Lancer la macro `HandleRaynartInvocations.js`
3. Cliquer sur les invocations à détruire dans la liste
4. Confirmer la destruction
5. Le mana récupéré est calculé automatiquement

**Récupération de mana** :

- Murs Mécaniques : 2 mana par groupe de 3 murs
- Autres invocations : Coût de création complet

## 📊 Calculs Automatiques

### Points de Vie (PV)

La macro calcule automatiquement les PV selon la formule de chaque invocation :

```javascript
// Mur Mécanique
PV = (4 + Dextérité + Esprit) × 2

// Balliste / Gatling / ParaTonnerre
PV = 4 + Dextérité

// Araignée Mécanique
PV = Math.floor(Dextérité / 2)

// Velkoz
PV = Math.floor(Esprit / 2)
```

### Résistance aux Dégâts (RD)

```javascript
// ParaTonnerre uniquement
RD Foudre = Dextérité + Esprit
```

### Récupération de Mana

```javascript
// Murs Mécaniques (cas spécial)
Mana récupéré = Math.floor(nombre détruit / 3) × 2

// Autres invocations
Mana récupéré = nombre détruit × coût de création
```

## 🎨 Animations

Chaque type d'invocation dispose d'animations spécifiques :

### Cast (sur Raynart)

- **Mur** : `jb2a.energy_field.02.below.blue`
- **Balliste** : `jb2a.energy_field.02.below.red`
- **Gatling** : `jb2a.energy_field.02.below.purple`
- **Araignée** : `jb2a.energy_field.02.below.yellow`
- **ParaTonnerre** : `jb2a.energy_field.02.below.yellow`
- **Velkoz** : `jb2a.energy_field.02.below.pink`

### Création (sur l'invocation)

- **Mur** : `jb2a.impact.ground_crack.03.blue`
- **Balliste** : `jb2a.impact.010.red`
- **Gatling** : `jb2a.explosion.01.purple`
- **Araignée** : `jb2a.impact.ground_crack.02.yellow`
- **ParaTonnerre** : `jb2a.static_electricity.01.blue` + protection persistante
- **Velkoz** : `jb2a.energy_beam.normal.bluepink.03`

### Destruction

- **Mur** : `jb2a.smoke.puff.01.white`
- **Balliste** : `jb2a.explosion.04.orange`
- **Gatling** : `jb2a.explosion.04.purple`
- **Araignée** : `jb2a.smoke.puff.01.dark_black`
- **ParaTonnerre** : `jb2a.explosion.01.blue`
- **Velkoz** : `jb2a.explosion.pink`

## 🔍 Détection des Invocations

La macro détecte automatiquement toutes les invocations existantes sur le terrain en utilisant :

- **Parcours des tokens** de la scène
- **Correspondance par Actor ID** pour identifier le type
- **Affichage dans l'interface** avec nom, PV actuels et PV maximum

**Indépendance** : La détection fonctionne même si les invocations ont été créées manuellement ou via d'autres moyens (pas besoin de flags spéciaux).

## 🎯 Stratégies d'Utilisation

### Défense en profondeur

1. Placer des Murs Mécaniques pour créer des choke points
2. Positionner des Ballistes derrière pour couverture
3. Utiliser ParaTonnerre contre ennemis électriques
4. Velkoz pour protéger les alliés fragiles

### Pression offensive

1. Déployer plusieurs Ballistes en arc de cercle
2. Sacrifier une pour créer une Gatling
3. Araignées pour vision et flanking
4. Murs pour bloquer les retraites ennemies

### Reconnaissance et contrôle

1. Déployer Araignées pour cartographier
2. ParaTonnerre en zones clés
3. Velkoz près des objectifs
4. Murs pour canaliser les mouvements

## ⚙️ Prérequis Techniques

### Modules FoundryVTT

- ✅ **Portal** - Ciblage et spawn de tokens
- ✅ **Sequencer** - Animations
- ✅ **JB2A** - Effets visuels

### Actors Requis

Les 6 actors suivants doivent exister dans le monde avec les IDs spécifiés :

- `9NXEFMzzBF3nmByB` - Mur Mécanique
- `FQzsrD4o20avg7co` - Balliste
- `M7oAyZmgzi5XEYNE` - Gatling
- `P0NlGCJh7r6K5yuc` - Araignée Mécanique
- `pJuR9WIyouueE6Kv` - ParaTonnerre
- `DCUdL8S8N6t9eSMF` - Velkoz

### Configuration Actor

Chaque actor d'invocation doit avoir :

- **Resources** : `health` configuré (value et max)
- **Token** : Image et configuration appropriées

## 📝 Notes Importantes

### Gestion Manuelle

Les éléments suivants sont **gérés manuellement** (pas de code automatique) :

- ✋ **Mana** : Déduction et récupération du mana (message affiché, action manuelle requise)
- ✋ **Murs Instantanés** : Les 3 murs gratuits par combat
- ✋ **Sacrifice de Balliste** : Vérification pour créer une Gatling
- ✋ **Actions de combat** : Les actions des invocations (attaques, protections, etc.)

### Détection Robuste

- ✅ Fonctionne même si les invocations sont créées manuellement
- ✅ Pas de dépendance aux flags ou effets actifs
- ✅ Basé uniquement sur l'Actor ID du token

### Flexibilité

- 🔧 Configuration centralisée dans `INVOCATION_CONFIG`
- 🔧 Facile d'ajouter de nouveaux types d'invocations
- 🔧 Formules de calcul modulaires et personnalisables
- 🔧 Animations et couleurs configurables par type

## 🚀 Évolutions Futures

### Améliorations Possibles

- [ ] Gestion automatique du sacrifice de Balliste pour Gatling
- [ ] Système de commande pour les actions d'invocations
- [ ] Interface de contrôle avancée pour les invocations actives
- [ ] Statistiques de combat des invocations
- [ ] Effets de synergie entre différentes invocations
- [ ] Amélioration des invocations (upgrades)

### Extensions

- [ ] Nouvelles invocations spécialisées
- [ ] Modes de comportement des tourelles
- [ ] Formations tactiques prédéfinies
- [ ] Système de recycling avancé avec bonus

## 📚 Référence Rapide

### Commandes Clés

- **Créer** : Sélectionner type → Indiquer nombre → Cibler emplacements
- **Détruire** : Cliquer sur invocations dans liste → Confirmer
- **Annuler** : Bouton "Annuler" ou fermer dialog

### Coûts Mana

- Murs : 4 mana / 3 (3 gratuits/combat)
- Balliste : 4 mana
- Gatling : 4 mana + 1 Balliste
- Araignée : 3 mana
- ParaTonnerre : 4 mana
- Velkoz : 4 mana

### Récupération

- Murs : 2 mana / 3
- Autres : Coût complet

---

_Raynart - Maître de la Mécanique Magique_ ⚙️✨
