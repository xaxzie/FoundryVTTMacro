# Raynart - Le Mage de la Mécanique

## Vue d'ensemble du personnage

**Raynart** est un mage spécialisé dans la création et le contrôle d'invocations mécaniques. Son arsenal diversifié lui permet d'invoquer des constructions allant de simples murs défensifs à des tourelles offensives sophistiquées, en passant par des créatures de reconnaissance et des systèmes de protection avancés.

### Caractéristiques principales

- **Dextérité** : Utilisée pour déterminer les PV et l'efficacité de la plupart des invocations
- **Esprit** : Utilisée pour les calculs de défense (RD foudre), certaines invocations spéciales, et les modes avancés
- **Style de jeu** : Contrôle de zone, support défensif, pression offensive à distance, transformation tactique
- **Complexité** : Très élevée - nécessite une gestion stratégique des ressources, du positionnement, et des modes de combat

## 🎯 Passif : Maître Mécaniste

Raynart possède un système unique de **complexité d'invocations** qui limite le nombre et le type de créations qu'il peut maintenir simultanément.

### Compteur de Complexité

Le compteur **InvocationsComplexe** suit la charge mentale de Raynart :

- **Araignées Mécaniques** : 0 complexité (ne comptent pas, créations simples)
- **Murs Mécaniques** : 0 complexité (structures statiques)
- **Invocations standards** (Balliste, ParaTonnerre, Velkoz) : 1 complexité chacune
- **Gatling** : 2 complexité (tourelle lourde et sophistiquée)

**Limite de base** : 20 points de complexité
**Gestion** : Le compteur s'incrémente/décrémente automatiquement lors de la création/destruction d'invocations
**Mode Eclipse** : Double la limite (40 points) mais impose des restrictions sévères

### Stance Focus

Raynart bénéficie de la **Posture Focus** comme les autres personnages :

- **Invocations gratuites** : Toutes les invocations créées en stance Focus ne coûtent pas de mana
- **Récupération de mana** : Les invocations créées en Focus ne remboursent PAS de mana à la destruction
- **Traçage automatique** : Un flag `raynartCreatedInFocus` est ajouté aux invocations pour gérer correctement la récupération

## 🎭 Modes de Combat Avancés

Raynart dispose de plusieurs modes spéciaux qui transforment radicalement son style de jeu. Tous ces modes sont gérés via la macro **HandleRaynartEffect.js**.

### ⚔️ Armure du Fléau de l'Infini

**Coût** : Spécial (sort légendaire)
**Type** : Transformation complète
**Durée** : Jusqu'à désactivation

**Effets** :

- ✨ **Modification des coûts** :
  - Effets non-focusables → demi-focusables
  - Effets demi-focusables → focusables
- ⚡ **Force la Posture Focus** : Raynart ne peut être qu'en Focus
- 📊 **Compteur de mana économisée** : Suit la mana économisée grâce à l'armure
- 🎬 **Animation spectaculaire** : Séquence d'activation épique avec effets persistants

**À la désactivation** : Dialog pour calculer le coût total final (mana économisée + tours en modes spéciaux)

### 🌐 Expansion du Monde Intérieur

**Coût** : 5 mana (non-focusable)
**Type** : Buff global aux invocations

**Effets** :

- 🛡️ **Résistance aux invocations** : Accorde Résistance = Esprit/2 (arrondi inférieur) à TOUTES les invocations existantes
- 🔄 **Application automatique** : Tous les tokens d'invocations reçoivent l'effet de résistance
- ⚠️ **Ne retire PAS la résistance** : À la désactivation, les invocations conservent leur résistance

### 🌑 Mode Eclipse

**Coût** : 6 mana (non-focusable)
**Type** : Mode de création maximale
**Durée** : Jusqu'à désactivation

**Avantages** :

- ✨ **Double la limite de complexité** : 40 points au lieu de 20
- ⚡ **Force la Posture Focus** : Invocations gratuites

**Inconvénients** :

- ❌ **Ne peut plus esquiver** : Aucune esquive possible
- 🎲 **Jet de Volonté si dégâts** : DD = 25 + PV manquants pour garder le contrôle
- 🚫 **Interdit explosions et magie stellaire** : Certaines créations impossibles

**Usage** : Pour créer une armée massive d'invocations dans des situations critiques

### 🌟 Mode Stellaire

**Coût** : 3 mana par tour (demi-focusable)
**Type** : Mode d'attaque à distance

**Avantages** :

- 💥 **Explosions à distance** : Peut créer des explosions n'importe où sur le champ de bataille
- ✨ **Projection de mana** : Déploie sa mana autour de lui

**Inconvénients** :

- ⚠️ **Limite de complexité sévère** : Maximum 1 invocation complexe
- 💰 **Coût par tour** : 3 mana chaque tour en mode Stellaire

**Usage** : Pour des frappes de précision à longue portée sans invocations lourdes

### 🔫 Mode Big Gun

**Coût** : 4 mana (focusable)
**Type** : Buff de dégâts personnels

**Avantages** :

- ⚔️ **Bonus aux dégâts** : +Esprit/4 (arrondi supérieur) aux tirs
- 🛡️ **Résistance limitée** : Esprit/2 (arrondi supérieur) avec 3 utilisations
- ♻️ **Recharge** : 1 utilisation de résistance recharge par tour (gestion manuelle)

**Usage** : Pour participer directement au combat avec bonus de dégâts

## 🔧 Système d'Invocations Mécaniques

### Macro Centrale : `HandleRaynartInvocations.js`

Cette macro est le cœur du système d'invocations de Raynart. Elle permet de :

- **Créer** des invocations mécaniques variées
- **Gérer** toutes les invocations existantes sur le terrain
- **Détruire** les invocations pour récupérer du mana
- **Calculer automatiquement** les PV selon les statistiques de Raynart
- **Afficher** des animations appropriées pour chaque action
- **Gérer le compteur de complexité** automatiquement

#### Fonctionnalités clés

✅ **Détection automatique** des invocations existantes (basée sur actor.id)
✅ **Création multiple** d'invocations en une seule action
✅ **Animation unique** de cast pour plusieurs invocations
✅ **Animations individuelles** de création pour chaque invocation
✅ **Destruction avec récupération de mana** (calcul automatique, sauf si créées en Focus)
✅ **Interface intuitive** avec sélection visuelle
✅ **Gestion automatique du compteur InvocationsComplexe** (incrémentation/décrémentation)
✅ **Token Magic FX** : Effet de lévitation pour Velkoz
✅ **Animations persistantes** : Bouclier pour ParaTonnerre

## 📋 Types d'Invocations

### 🛡️ Mur Mécanique

**Type** : Défensif - Barrière
**Actor ID** : `9NXEFMzzBF3nmByB`
**Complexité** : 0 (ne compte pas dans la limite)

- **Coût** : 4 mana / 3 murs
- **PV** : (4 + Dextérité + Esprit) × 2
- **Spécial** :
  - 3 murs instantanés par combat (gestion manuelle)
  - Récupère 2 mana si démontés manuellement (pour 3 murs)
  - Ne compte pas dans la limite de complexité (structures statiques)
- **Animations** :
  - Cast : Cercle de magie mécanique sur Raynart
  - Création : Impact avec fissures oranges au sol
  - Destruction : Explosion orange
- **Usage** : Bloquer des passages, créer des choke points, protéger des alliés

### 🎯 Balliste

**Type** : Offensif - Tourelle à distance
**Actor ID** : `FQzsrD4o20avg7co`
**Complexité** : 1

- **Coût** : 4 mana par tourelle
- **PV** : 4 + Dextérité
- **Récupération mana** : 4 mana (destruction, sauf si créée en Focus)
- **Animations** :
  - Cast : Cercle de magie mécanique sur Raynart
  - Création : Impact orange
  - Destruction : Explosion orange
- **Usage** : Pression offensive à distance, couverture de zone

### ⚔️ Gatling

**Type** : Offensif - Tourelle lourde
**Actor ID** : `M7oAyZmgzi5XEYNE`
**Complexité** : 2 (tourelle sophistiquée)

- **Coût** : 4 mana + sacrifice d'une Balliste
- **PV** : 4 + Dextérité
- **Récupération mana** : 4 mana (destruction, sauf si créée en Focus)
- **Spécial** : Nécessite le sacrifice d'une Balliste (non vérifié automatiquement par la macro)
- **Animations** :
  - Cast : Cercle de magie mécanique sur Raynart
  - Création : Impact avec fissures oranges
  - Destruction : Explosion orange
- **Usage** : Dégâts massifs concentrés, destruction de cibles prioritaires

### 🕷️ Araignée Mécanique

**Type** : Reconnaissance - Éclaireur
**Actor ID** : `P0NlGCJh7r6K5yuc`
**Complexité** : 0 (créations simples)

- **Coût** : 3 mana par araignée
- **PV** : Dextérité / 2 (arrondi inférieur)
- **Récupération mana** : 3 mana (destruction, sauf si créée en Focus)
- **Spécial** :
  - Raynart partage 2 sens avec ses araignées
  - Ne comptent pas dans la limite de complexité
- **Animations** :
  - Cast : Cercle de magie mécanique sur Raynart
  - Création : Impact jaune
  - Destruction : Explosion orange
- **Usage** : Exploration, détection d'ennemis, contrôle de vision

### ⚡ ParaTonnerre

**Type** : Défensif - Protection contre la foudre
**Actor ID** : `pJuR9WIyouueE6Kv`
**Complexité** : 1

- **Coût** : 4 mana par paratonnerre
- **PV** : 4 + Dextérité
- **Récupération mana** : 4 mana (destruction, sauf si créée en Focus)
- **Spécial** :
  - Zone de protection : 4 cases de rayon
  - RD Foudre : Dextérité + Esprit
  - Offre un jet de déviation sur toutes les attaques foudre dans la zone
  - **Animation persistante** : Bouclier de protection bleu autour du paratonnerre
- **Animations** :
  - Cast : Cercle de magie mécanique sur Raynart
  - Création : Effet électrique cartoon
  - Persistant : Bouclier circulaire magique (opacity 0.2)
  - Destruction : Explosion orange
- **Usage** : Défense contre les ennemis utilisant la foudre, contrôle de zone défensif

### 👁️ Velkoz

**Type** : Défensif - Protection active
**Actor ID** : `DCUdL8S8N6t9eSMF`
**Complexité** : 1

- **Coût** : 4 mana par velkoz
- **PV** : Esprit / 2 (arrondi inférieur)
- **Récupération mana** : 4 mana (destruction, sauf si créée en Focus)
- **Spécial** :
  - Protège une cible par tour de maximum 25 dégâts par velkoz
  - **Token Magic FX** : Effet de lévitation avec oscillation sinusoïdale
- **Animations** :
  - Cast : Cercle de magie mécanique sur Raynart
  - Création : Impact rouge sombre
  - Token Magic : Transformation continue avec oscillation translationX/Y (val1: -0.015, val2: +0.015, loop 2000ms)
  - Destruction : Explosion orange
- **Usage** : Protection d'alliés vulnérables, absorption de dégâts

## ⚔️ Sorts Offensifs et Utilitaires

### 🛡️ Champs de Force

**Type** : Défensif - Protection avancée
**Fichier** : `champs-de-force.js`

- **Coût** : 4 mana (focusable)
- **Niveau** : Sort niveau 1
- **Mécaniques** :
  - Détection automatique des Velkoz sur le terrain
  - Sélection interactive des Velkoz participants
  - Boost de mana optionnel :
    - +1 dé : 4 mana (non-focusable, demi-focus avec Armure Infini)
    - +2 dés : 8 mana (non-focusable, demi-focus avec Armure Infini)
  - Animation simultanée depuis tous les Velkoz
- **Jet de Défense** :
  - Raynart ciblé : Esprit + bonus + (2 × Velkoz supplémentaires)
  - Autre cible : Dextérité + bonus + (2 × Velkoz supplémentaires)
  - Dés : d7
- **Capacité de Blocage** :
  - Premier Velkoz : Esprit × 2
  - Chaque Velkoz supplémentaire : Esprit × 1
  - Exemple (8 Esprit, 3 Velkoz) : 16 + 16 = 32 dégâts max
- **Animations** :
  - Faisceaux d'énergie bleue (energy_strands)
  - Boucliers multiples avec glow oranges
  - Explosion finale avec glow rouge
- **Usage** : Protection tactique contre attaques massives, défense d'objectifs

---

### 🔫 Tir de Tourelles

**Type** : Offensif - Contrôle de tourelles
**Fichier** : `tir-tourelles.js`

- **Coût** : Aucun (utilisation des tourelles déjà invoquées)
- **Incompatible** : Mode Big Gun
- **Balliste** :
  - Jet de touché : Esprit (Sort niveau 1)
  - Dégâts : 1d4 + Esprit
  - Mode : Tir simple mono-cible
  - Animation : Rayon laser rouge-orange
- **Gatling** :
  - Jet de touché : Esprit (Sort niveau 2)
  - Modes :
    - Mono-cible : 2d4 + 2 + Esprit×2
    - Double-cible : 1d4 + 2 + Esprit (2 cibles)
    - Cône : 1d4 + Esprit/cible (cône 25°, 10 cases)
  - Animation : Séquence bullet avec trails rouges
- **Spécial** :
  - Sélection interactive des tourelles
  - Animation de ciblage radar pendant sélection
  - Tirs simultanés avec délais aléatoires
- **Usage** : Attaquer depuis positions avantageuses sans exposer Raynart

---

### 💥 IronMegumin

**Type** : Offensif - Destruction massive
**Fichier** : `IronMegumin.js`

- **Coût** : 7 mana (demi-focusable, focusable avec Armure Infini)
- **Niveau** : Sort niveau 2
- **Mécaniques** :
  - Fait exploser simultanément toutes les invocations sélectionnées
  - Jet d'attaque unique : Esprit (pour toutes les explosions)
  - Dégâts : 1d6 + Esprit/2 par explosion
  - Zone : 2 cases de rayon par invocation
  - Limite : Maximum 3 explosions/cible (3 meilleurs résultats)
  - Dégâts sur esquive : Moitié des dégâts
- **Invocations explosives** :
  - Mur Mécanique, Balliste, Gatling, Araignée, ParaTonnerre, Velkoz
- **Workflow** :
  - Sélection des invocations à détruire
  - Aperçu des cibles touchées
  - Jet d'attaque + jets de dégâts
  - Animations simultanées (délai 0-200ms)
  - Destruction et récupération de complexité
- **Animations** :
  - Explosions multiples avec ondes de choc
  - Délais aléatoires pour effet chaotique
- **Usage** : Finisher dévastateur, clear de zone, situations désespérées

---

### ⚡ Rayon Explosif

**Type** : Offensif - Artillerie à chargement
**Fichier** : `rayon-explosif.js`

- **Coût** : 6 mana (demi-focusable, focusable avec Armure Infini)
- **Niveau** : Sort niveau 2
- **Phase 1 - Chargement** :
  - Applique effet "ChargementTir"
  - Animation persistante orbite
  - Compte les tours de charge
- **Phase 2 - Tir** :
  - Mode Normal : Xd4 + Esprit (2.5 cases rayon, X = tours de charge)
  - Mode Fléau : 3d6 + Esprit (cible unique concentrée)
  - Mode Stellaire : 3 rayons simultanés (2d6 + Esprit chacun)
    - Perce-armure : Esprit/2 (arrondi sup.)
    - Dégâts réduits sur répétition : 1d6 + Esprit/2
- **Mode Stellaire** :
  - Requiert Mode Stellaire actif
  - 3 débris orbitaux + 3 tirs simultanés
  - Gère les cibles répétées automatiquement
- **Animations** :
  - Chargement : Orbes énergétiques orbitaux
  - Tir Normal : Projectile orange explosif
  - Tir Fléau : Rayon laser concentré rouge
  - Tir Stellaire : 3 rayons bleus simultanés
- **Usage** : Attaque préparée puissante, alpha strike, contrôle de zone

---

### 🔧 Mécanique Armé

**Type** : Utilitaire - Buff d'arme
**Fichier** : `mecanique-arme.js`

- **Coût** : Variable selon le buff
- **Durée** : Jusqu'à annulation manuelle
- **Types de buffs** :
  - **Allonge** (2 mana) : +1 allonge, -1d7 au toucher
  - **Booster** (1 mana) : +3 dégâts
  - **Bond** (1 mana/utilisation) : Change trajectoire projectiles
- **Mécaniques** :
  - Ciblage Portal pour sélectionner allié
  - Buffs cumulables sur même cible
  - Effets actifs jusqu'à désactivation
- **Animations** :
  - Cast : Cercle mécanique sur Raynart
  - Application : Effet énergétique sur cible
- **Usage** : Support d'alliés martiaux, augmenter polyvalence de l'équipe

---

### ⭐ Étoile du Renouveau

**Type** : Ultime - Transformation/Artillerie
**Fichier** : `etoile-du-renouveau.js`
**Sous-titre** : Forge de Xanathar

- **Phase 1 - Création** :
  - Sacrifice TOUTES les invocations
  - Crée un soleil artificiel persistant
  - Animation épique de fusion énergétique
- **Phase 2 - Tir** :
  - Coût : X mana par tir (non-focusable, demi-focus avec Armure Infini)
  - Jet : Esprit (Sort niveau 3)
  - Dégâts : (Esprit/2) × mana dépensé (perforant)
  - Animation : Rayon solaire dévastateur
- **Phase 2 - Destruction** :
  - Détruit le soleil manuellement
  - Animation d'explosion solaire
- **Mécaniques** :
  - Détection automatique de toutes les invocations
  - Validation du sacrifice
  - Effet persistant "EtoileRenouveau"
  - Tirs multiples possibles tant que le soleil existe
- **Animations** :
  - Fusion : Absorption invocations → formation soleil
  - Persistant : Orbe énergétique géant pulsant
  - Tir : Faisceau solaire concentré
  - Destruction : Supernova
- **Usage** : Transformation tactique ultime, artillerie mobile dévastatrice, boss killer

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

### Défense en profondeur (Standard)

1. Placer des Murs Mécaniques pour créer des choke points
2. Positionner des Ballistes derrière pour couverture
3. Utiliser ParaTonnerre contre ennemis électriques
4. Velkoz pour protéger les alliés fragiles
5. **Expansion du Monde Intérieur** pour renforcer toutes les invocations

**Limite** : 20 points de complexité (environ 20 invocations standards ou 10 Gatlings)

### Pression offensive (Big Gun)

1. Activer **Mode Big Gun** pour bonus aux dégâts
2. Déployer plusieurs Ballistes en arc de cercle
3. Sacrifier une pour créer une Gatling (2 complexité)
4. Araignées pour vision et flanking (0 complexité)
5. Murs pour bloquer les retraites ennemies (0 complexité)

**Avantage** : Participe directement au combat avec +Esprit/4 dégâts

### Frappe à distance (Stellaire)

1. Activer **Mode Stellaire** (3 mana/tour)
2. Limiter à 1 invocation complexe maximum
3. Créer des explosions n'importe où sur le champ de bataille
4. Utiliser Araignées pour vision (0 complexité)
5. Positionner stratégiquement pour couverture maximale

**Coût** : 3 mana par tour maintenu

### Armée massive (Eclipse)

1. Activer **Mode Eclipse** (6 mana, force Focus)
2. Créer jusqu'à 40 points de complexité d'invocations (GRATUITES en Focus)
3. Combiner : 20 Ballistes (20) + 10 ParaTonnerre (10) + 10 Velkoz (10) = 40 complexité
4. Ou : 20 Gatlings (40 complexité) pour dégâts maximaux
5. **ATTENTION** : Ne peut plus esquiver, jet Volonté si dégâts

**Usage critique** : Situations désespérées ou combats boss

### Transformation ultime (Armure Infini + Eclipse)

1. Activer **Armure du Fléau de l'Infini** (transformation complète)
2. Tous les effets deviennent gratuits ou presque en Focus
3. Activer **Mode Eclipse** (6 mana → 0 mana avec Armure)
4. Créer 40 points de complexité d'invocations GRATUITES
5. Tous les modes deviennent gratuits ou demi-coût

**Coût total** : Calcul à la désactivation (mana économisée + tours en modes spéciaux)

### Reconnaissance et contrôle

1. Déployer Araignées pour cartographier (0 complexité)
2. ParaTonnerre en zones clés (1 complexité chacun)
3. Velkoz près des objectifs (1 complexité chacun)
4. Murs pour canaliser les mouvements (0 complexité)
5. Garder de la complexité disponible pour réagir

## 🔄 Macro de Gestion des Effets : `HandleRaynartEffect.js`

Cette macro gère tous les effets spéciaux, modes de combat et postures de Raynart.

### Fonctionnalités

✅ **Gestion des modes de combat** : Armure Infini, Eclipse, Stellaire, Big Gun, Expansion
✅ **Gestion des postures** : Offensif, Défensif, Focus (avec détection des statuts CONFIG)
✅ **Gestion des blessures** : Blessures légères/graves avec compteur de stacks
✅ **Effets externes** : Détection et suppression des effets non-Raynart
✅ **Compteur InvocationsComplexe** : Modification manuelle du compteur de complexité
✅ **Calculs automatiques** : Coûts de mana avec modificateurs Armure Infini
✅ **Interface unifiée** : Dialog unique pour tous les effets avec sections organisées

### Sections de l'Interface

1. **Effets Personnalisés** : Modes de combat spéciaux (Armure, Eclipse, Stellaire, etc.)
2. **Postures de Combat** : Offensif, Défensif, Focus (avec bouton "Retirer toutes")
3. **Blessures** : Gestion des stacks de blessures légères/graves
4. **Effets Externes** : Liste et suppression des effets non-Raynart

### Détection Intelligente

- **Postures** : Détection automatique depuis `CONFIG.statusEffects`
- **Blessures** : Détection automatique depuis `CONFIG.statusEffects`
- **Effets externes** : Tout effet qui n'est pas dans `CUSTOM_EFFECTS`, `POSTURES`, ou `INJURIES`

### Calcul des Coûts avec Armure Infini

Lorsque l'Armure du Fléau de l'Infini est active :

- **Non-focusable** → **Demi-focusable** (coût = coût/2 en Focus, coût normal sinon)
- **Demi-focusable** → **Focusable** (coût = 0 en Focus, coût/2 sinon)
- **Focusable** → **Reste focusable** (coût = 0 en Focus)
- **Spécial** : Pas de modification (ex: Armure Infini elle-même)

Le compteur de mana économisée est automatiquement incrémenté lors de l'activation d'effets.

## ⚙️ Prérequis Techniques

### Modules FoundryVTT

- ✅ **Portal** - Ciblage et spawn de tokens
- ✅ **Sequencer** - Animations
- ✅ **JB2A** (Free + Patreon) - Effets visuels
- ✅ **Token Magic FX** - Effet de lévitation Velkoz (optionnel mais recommandé)
- ✅ **Animated Spell Effects** - Effets supplémentaires (optionnel)

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

### Gestion Automatique

✅ **Compteur InvocationsComplexe** : Incrémentation/décrémentation automatique
✅ **Flag Focus** : Les invocations créées en Focus sont marquées automatiquement
✅ **Calcul des PV** : Selon les stats de Raynart (Dex, Esprit, blessures, effets actifs)
✅ **Animations** : Toutes les animations sont gérées automatiquement
✅ **Token Magic FX** : Application/suppression automatique pour Velkoz
✅ **Animations persistantes** : ParaTonnerre (bouclier), Velkoz (lévitation)
✅ **Résistance Expansion** : Application automatique à toutes les invocations existantes

### Gestion Manuelle

Les éléments suivants sont **gérés manuellement** (pas de code automatique) :

- ✋ **Mana** : Déduction et récupération du mana (message affiché, action manuelle requise)
- ✋ **Murs Instantanés** : Les 3 murs gratuits par combat
- ✋ **Sacrifice de Balliste** : Vérification pour créer une Gatling
- ✋ **Actions de combat** : Les actions des invocations (attaques, protections, etc.)
- ✋ **Jet de Volonté** : Pour Mode Eclipse si dégâts subis (DD 25 + PV manquants)
- ✋ **Résistance Mode Big Gun** : 3 utilisations avec recharge 1/tour

### Détection Robuste

- ✅ Fonctionne même si les invocations sont créées manuellement
- ✅ Pas de dépendance aux flags ou effets actifs
- ✅ Basé uniquement sur l'Actor ID du token

### Flexibilité

- 🔧 Configuration centralisée dans `INVOCATION_CONFIG`
- 🔧 Facile d'ajouter de nouveaux types d'invocations
- 🔧 Formules de calcul modulaires et personnalisables
- 🔧 Animations et couleurs configurables par type

## 🎬 Système d'Animations

### Animations d'Invocations

Toutes les invocations utilisent des animations JB2A et Animated Spell Effects :

**Cast unifié** : `modules/Animation%20Custom/Raynart/Cercle%20magie%20mecanique%20V1_VP9.webm`

- Joué sur Raynart AVANT toute action (création ou destruction)
- Scale 2.0, belowTokens, fadeIn 300ms, fadeOut 500ms

**Animations de création** : Spécifiques par type

- Mur : Impact avec fissures oranges
- Balliste : Impact orange
- Gatling : Impact avec fissures oranges
- Araignée : Impact jaune
- ParaTonnerre : Effet électrique + bouclier persistant
- Velkoz : Impact rouge sombre + Token Magic FX lévitation

**Animations persistantes** :

- ParaTonnerre : `animated-spell-effects.magic.shield.circle.04` (opacity 0.2, scale 2.0)
- Velkoz : Token Magic FX Transform filter avec oscillation sinusoïdale/cosinusoïdale

**Animations de destruction** :

- Toutes : Explosion orange JB2A

### Animations de Modes

**Armure du Fléau de l'Infini** :

- Séquence d'activation épique (11 étapes)
- Cercle mécanique avec rotation et scale out
- Divine smite bleu-jaune
- Pulse d'impulsion
- Fissures au sol (bleues et oranges)
- Effets d'énergie et de feu cartoon avec filtres Glow
- Animation persistante : `worlds/ft/TOKEN/Token%20anim%20v18.1_VP9.webm` (scale 1.3)

**Expansion du Monde Intérieur** :

- Cast : Cercle mécanique sur Raynart
- Pulse : Effet TMFx outpulse lent

**Mode Eclipse** :

- Cast : Template circle pulse bleu-blanc
- Persistant : Aura circulaire bleue (opacity 0.2, scale 0.8)

**Mode Stellaire** :

- Cast : Shockwave circulaire magique
- Persistant : Aura large bleu-rose (opacity 0.4, scale 1, belowTokens)

**Mode Big Gun** :

- Cast : Shockwave explosion orange
- Persistant : Distorsion (force 1, padding 70)

## 🚀 Évolutions Futures

### Améliorations Possibles

- [ ] Gestion automatique du sacrifice de Balliste pour Gatling
- [ ] Système de commande pour les actions d'invocations
- [ ] Interface de contrôle avancée pour les invocations actives
- [ ] Statistiques de combat des invocations
- [ ] Effets de synergie entre différentes invocations
- [ ] Amélioration des invocations (upgrades)
- [ ] Présets de formations tactiques

### Extensions

- [ ] Nouvelles invocations spécialisées
- [ ] Modes de comportement des tourelles (agressif, défensif, attente)
- [ ] Formations tactiques prédéfinies (défense, assaut, reconnaissance)
- [ ] Système de recycling avancé avec bonus
- [ ] Invocations hybrides (combinaison de types)

## 📚 Référence Rapide

### Macros Principales

| Macro                         | Description                      | Usage                              |
| ----------------------------- | -------------------------------- | ---------------------------------- |
| `HandleRaynartInvocations.js` | Gestion complète des invocations | Créer/détruire invocations         |
| `HandleRaynartEffect.js`      | Gestion des modes et effets      | Activer/désactiver modes de combat |

### Sorts Offensifs/Utilitaires

| Sort                | Type       | Coût     | Niveau | Description courte                  |
| ------------------- | ---------- | -------- | ------ | ----------------------------------- |
| Champs de Force     | Défensif   | 4        | 1      | Boucliers Velkoz, blocage dynamique |
| Tir de Tourelles    | Offensif   | 0        | 1-2    | Contrôle Balliste/Gatling           |
| IronMegumin         | Offensif   | 7        | 2      | Explosions massives d'invocations   |
| Rayon Explosif      | Offensif   | 6        | 2      | Artillerie à chargement progressif  |
| Mécanique Armé      | Utilitaire | 1-2      | -      | Buff d'armes (allonge/dégâts/bond)  |
| Étoile du Renouveau | Ultime     | Variable | 3      | Sacrifice→Soleil→Tirs dévastateurs  |

**Notes** :

- Coûts indiqués sont de base (modificateurs Armure Infini/Focus non inclus)
- Types de focusabilité : voir tableau "Coûts Mana avec Armure Infini"

### Complexité des Invocations

| Type         | Complexité | Coût Mana  | PV               |
| ------------ | ---------- | ---------- | ---------------- |
| Araignée     | 0          | 3          | Dex/2            |
| Mur          | 0          | 4/3        | (4+Dex+Esprit)×2 |
| Balliste     | 1          | 4          | 4+Dex            |
| ParaTonnerre | 1          | 4          | 4+Dex            |
| Velkoz       | 1          | 4          | Esprit/2         |
| Gatling      | 2          | 4+Balliste | 4+Dex            |

**Limite** : 20 points (40 en Mode Eclipse)

### Modes de Combat

| Mode          | Coût    | Type           | Effet Principal                            |
| ------------- | ------- | -------------- | ------------------------------------------ |
| Armure Infini | Spécial | Transformation | Réduit tous les coûts, force Focus         |
| Expansion     | 5       | Non-focusable  | Résistance à toutes invocations            |
| Eclipse       | 6       | Non-focusable  | Double limite complexité (40), force Focus |
| Stellaire     | 3/tour  | Demi-focusable | Explosions à distance, max 1 complexe      |
| Big Gun       | 4       | Focusable      | +dégâts, résistance 3 charges              |

### Coûts Mana avec Armure Infini

| Type Original  | Sans Armure                  | Avec Armure (hors Focus)       | Avec Armure (Focus) |
| -------------- | ---------------------------- | ------------------------------ | ------------------- |
| Non-focusable  | Coût                         | Coût/2                         | Coût/2              |
| Demi-focusable | Coût (hors Focus), 0 (Focus) | 0 (Focus), Coût/2 (hors Focus) | 0                   |
| Focusable      | 0 (Focus), Coût (hors Focus) | 0 (Focus), Coût (hors Focus)   | 0                   |

### Commandes Clés

**Invocations** :

- **Créer** : Macro → Sélectionner type → Indiquer nombre → Cibler avec Portal
- **Détruire** : Macro → Cliquer invocations dans liste → Confirmer
- **Annuler** : Bouton "Annuler" ou fermer dialog

**Effets** :

- **Activer mode** : Macro HandleRaynartEffect → Sélectionner effet → Appliquer
- **Désactiver mode** : Macro HandleRaynartEffect → Toggle effet actif
- **Modifier compteur** : Macro HandleRaynartEffect → Increase/Decrease sur InvocationsComplexe

### Récupération Mana

- **Murs** : 2 mana par groupe de 3 détruit
- **Autres invocations** : Coût complet
- **⚠️ Exception** : Invocations créées en stance Focus ne remboursent RIEN

### Animations Spéciales

- **Velkoz** : Token Magic FX lévitation avec oscillation
- **ParaTonnerre** : Bouclier de protection persistant
- **Armure Infini** : Séquence épique 11 étapes + aura persistante

---

_Raynart - Maître de la Mécanique Magique_ ⚙️✨

**Version** : 2.0 (avec système de complexité, modes avancés, et Token Magic FX)
