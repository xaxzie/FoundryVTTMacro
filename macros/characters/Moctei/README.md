# Moctei - Mage des Ombres

**Moctei** est un mage des ombres mystérieux et très discret, spécialisé dans la magie sombre, les attaques furtives, le contrôle de terrain et la manipulation des ombres pour des effets dévastateurs

## 🌑 Caractéristiques du Personnage

- **Caractéristiques Principales** : Dextérité (attaques), Sens (contrôle)
- **Style de Combat** : Mage furtif avec contrôle de zone, attaques continues, et téléportation
- **Spécialité** : Magie des ombres, feu noir, immobilisation, téléportation
- **Thème Visuel** : Ombres, violet sombre, noir profond, effets d'obscurité
- **Complexité** : Élevée - gestion d'effets persistants, coûts de maintenance, zones tactiques

## 📁 Fichiers du Système

### 🛠️ Gestionnaires d'Effets

#### `HandleMocteiEffect.js`

**Gestionnaire complet des effets de Moctei**

- Basé sur le template générique avec spécialisation pour les effets d'ombre
- Support pour les transformations visuelles
- Filtres Token Magic FX spécialisés pour les effets d'ombre
- Animations persistantes avec Sequencer
- Interface adaptée au thème sombre de Moctei

**Effets configurés** :

- `Dagues d'ombre` : Effet de longue durée pour les attaques gratuites

#### `endMocteiEffect.js`

**Gestionnaire de fin d'effets pour Moctei**

- Basé sur le template générique
- Spécialisé pour les mécaniques d'ombre
- Nettoyage des animations persistantes
- Suppression des effets Token Magic FX
- Interface thématique violette/sombre

## ⚔️ Sorts et Capacités

### 🗡️ `invocation-de-dagues.js`

**Sort de base de Moctei - Niveau 1**

#### Fonctionnalités Principales

**Mode Normal (1 mana - focalisable)** :

- Usage unique
- Dégâts variables selon la distance
- Animation adaptée à la portée

**Mode Longue Durée (2 mana - focalisable)** :

- Crée l'effet "Dagues d'ombre" sur Moctei
- Attaques gratuites tant que l'effet persiste
- L'effet se dissipe après une attaque à distance

#### Mécaniques de Combat

**Toucher** : Dextérité + bonus + niveau de sort
**Dégâts** :

- **Rapprochée (≤2 cases)** : 2D4 + Dextérité
- **À distance (>2 cases)** : 1D4 + Dextérité

#### Détection de Distance

- Calcul automatique en cases de grille
- Seuil : 2 cases pour différencier proche/loin
- Marge de sécurité intégrée

#### Animations Visuelles

**Animations de Cast** :

- **Moctei** : `jb2a.darkness.black` (effet d'ombre)
- **Proche** : `jb2a.dagger.melee.01.white.4`
- **Distance** : `jb2a.dagger.throw.01.white.15ft`

**Animations d'Impact** :

- **Proche** : `jb2a.sword.melee.01.white.4`
- **Distance** : `jb2a.dagger.throw.01.white.hit`

**Effet Longue Durée** :

- Animation persistante : `jb2a.darkness.black`
- Nom de l'effet Sequencer : `MocteiShadowDaggers`
- Nettoyage automatique lors de la dissipation

#### Configuration Technique

**Ciblage** :

- Portée maximale : 300 pixels
- Couleur de ciblage : `#4a148c` (violet sombre)
- Texture : Marqueur violet de JB2A

**Intégration Système** :

- Utilise les utilities existantes
- Compatible avec le système de postures
- Gestion des blessures et bonus d'effets
- Calculs de caractéristiques automatiques

## 🎨 Thème Visuel

### Palette de Couleurs

- **Principal** : `#4a148c` (violet sombre)
- **Secondaire** : `#7b1fa2` (violet moyen)
- **Accents** : `#f3e5f5` (violet très clair)

### Icônes et Assets

- **Dagues** : `icons/weapons/daggers/dagger-curved-purple.webp`
- **Effets d'ombre** : Animations JB2A darkness/black
- **Marqueurs** : Textures violettes JB2A

## 🔧 Configuration et Personnalisation

### Ajout de Nouveaux Effets

Pour ajouter un nouvel effet d'ombre dans `HandleMocteiEffect.js` :

```javascript
"NouvelEffetOmbre": {
    name: "Nouvel Effet Ombre",
    icon: "icons/magic/unholy/strike-body-explode-disintegrate.webp",
    flags: [],
    description: "Description de l'effet d'ombre",
    category: "custom",
    increasable: false,
    hasFilters: true,
    filters: {
        filterId: "nouvelEffetOmbre",
        filterConfigs: [
            {
                filterType: "shadow",
                blur: 2,
                quality: 5,
                distance: 0.3,
                alpha: 0.8,
                color: 0x4a148c,
                // ... configuration des filtres
            }
        ]
    }
}
```

### Ajout de Nouveaux Sorts

Structure recommandée pour les sorts de Moctei :

1. Configuration des modes de lancement
2. Mécaniques de distance/portée
3. Animations thématiques d'ombre
4. Intégration avec les effets persistants
5. Interface utilisateur cohérente

## 🚀 Utilisation

### Lancement des Macros

1. **Sélectionner le token de Moctei**
2. **Gestionnaire d'effets** : Lancer `HandleMocteiEffect.js`
3. **Sorts** : Lancer le sort désiré (ex: `invocation-de-dagues.js`)
4. **Nettoyage** : Utiliser `endMocteiEffect.js` pour terminer les effets

### Workflow Typique

1. **Configuration des effets** via le gestionnaire
2. **Lancement des sorts** avec sélection du mode
3. **Ciblage** via l'interface Portal
4. **Résolution automatique** des attaques et dégâts
5. **Gestion automatique** des effets persistants

## 📋 TODO et Extensions Futures

### Sorts à Développer

- **Téléportation d'ombre** : Déplacement instantané dans l'obscurité
- **Liens d'ombre** : Entrave les ennemis avec des chaînes d'obscurité
- **Furtivité** : Effets de camouflage et d'invisibilité
- **Manipulation des ombres** : Contrôle de l'environnement

### Améliorations Système

- **Système de furtivité avancé**
- **Interaction avec les sources de lumière**
- **Résistances aux effets d'ombre**
- **Cumul d'effets d'obscurité**

### Mécaniques Spéciales

- **Recharge en obscurité** : Récupération de mana dans l'ombre
- **Bonus nocturnes** : Avantages pendant la nuit
- **Vulnérabilité à la lumière** : Malus dans les zones très éclairées

## 🔗 Intégrations

- **Système de caractéristiques** : Intégration complète
- **Gestionnaire de postures** : Compatible avec focus/offensif/défensif
- **Système de blessures** : Prise en compte automatique
- **Assets JB2A** : Utilisation extensive des animations d'ombre
- **Token Magic FX** : Effets visuels persistants
- **Sequencer** : Animations coordonnées et nettoyage automatique

## 📖 Documentation Technique

Tous les fichiers incluent une documentation inline détaillée avec :

- Configuration des paramètres
- Exemples d'utilisation
- Guide d'extension
- Gestion d'erreurs
- Intégrations système
