# MobAndBosses - Utilitaires d'Animation

## 📋 Vue d'ensemble

Ce dossier contient des macros utilitaires pour créer et tester des animations pour les mobs et les boss du système RPG personnalisé.

## 🎬 Animation Player

### Description

**animation-player.js** est un utilitaire complet pour lancer des animations Sequencer avec support intégré de TokenMagic FX. Il permet de :

- Tester rapidement des animations visuelles
- Combiner Sequencer et TokenMagic FX
- Contrôler le timing des effets TokenMagic (avant, pendant, après)
- Appliquer des effets sur le lanceur ou la cible

### Prérequis

- **Sequencer** - Système d'animation principal
- **Portal** - Système de ciblage
- **TokenMagic FX** - Effets visuels avancés
- **JB2A (Free + Patreon)** - Bibliothèque d'animations
- **Animated Spell Effects** - Effets additionnels (optionnel)

### Utilisation

1. Sélectionner un token sur le canvas
2. Lancer la macro `animation-player.js`
3. Choisir une animation dans le menu déroulant
4. Cibler si nécessaire (modes "target" et "projectile")
5. L'animation se joue avec les effets TokenMagic configurés

### Modes de Ciblage

| Mode           | Description                                | Ciblage Requis |
| -------------- | ------------------------------------------ | -------------- |
| **self**       | Animation sur le token contrôlé uniquement | Non            |
| **target**     | Animation à une position ciblée            | Oui (Portal)   |
| **projectile** | Animation depuis le token vers une cible   | Oui (Portal)   |

## 🎨 Configuration TokenMagic

### Structure de Configuration

```javascript
{
    name: "Nom de l'animation",
    description: "Description courte",
    mode: "self|target|projectile",
    sequence: [
        // Configuration Sequencer standard
    ],
    tokenMagic: [
        {
            timing: "before|during|after",
            target: "caster|target",
            duration: 5000, // ms, optionnel (si omis, effet persistant)
            filterId: "mon-effet-unique", // optionnel (généré automatiquement si absent)
            params: [
                // Configuration TokenMagic standard
            ]
        }
    ]
}
```

### Propriétés TokenMagic

#### `timing` (requis)

Définit quand l'effet TokenMagic est appliqué par rapport à la séquence Sequencer :

- **`"before"`** : Appliqué avant le début de la séquence Sequencer
- **`"during"`** : Appliqué juste avant de lancer la séquence Sequencer (simultané)
- **`"after"`** : Appliqué après la fin de la séquence Sequencer

#### `target` (requis)

Définit sur quel token appliquer l'effet :

- **`"caster"`** : Sur le token contrôlé (lanceur)
- **`"target"`** : Sur le token à la position ciblée (modes "target" et "projectile")

**Note** : Même en mode "self", vous pouvez appliquer un effet sur "target" si vous utilisez Portal.

**Détection de Token** : Le système utilise une détection robuste basée sur la grille :

- **Avec grille** : Détecte tous les tokens occupant la case ciblée (supporte les tokens de taille variable)
- **Sans grille** : Utilise une détection circulaire par distance au centre du token
- **Visibilité** : Ne cible que les tokens visibles par l'utilisateur (propriétaires, visibles, ou GM)

#### `duration` (optionnel)

Durée en millisecondes avant suppression automatique de l'effet.

- Si **omis** : L'effet persiste indéfiniment (doit être supprimé manuellement)
- Si **spécifié** : L'effet est automatiquement supprimé après la durée

#### `filterId` (optionnel)

Identifiant unique pour l'effet TokenMagic.

- Si **omis** : Un ID unique est généré automatiquement
- Si **spécifié** : Utilisé pour identifier l'effet (utile pour suppression manuelle)

#### `params` (requis)

Array de filtres TokenMagic. Chaque filtre suit la structure standard de l'API TokenMagic.

Voir [Documentation TokenMagic](https://github.com/Feu-Secret/Tokenmagic) pour tous les types de filtres disponibles.

## 📚 Exemples d'Animations avec TokenMagic

### 1. Éclat Lumineux (Glow Simple)

```javascript
"glow_burst_tm": {
    name: "✨ Éclat Lumineux",
    mode: "self",
    sequence: [
        {
            file: "jb2a.explosion.04.blue",
            atLocation: true,
            scale: 1.5
        }
    ],
    tokenMagic: [
        {
            timing: "during",
            target: "caster",
            duration: 5000,
            params: [{
                filterType: "glow",
                outerStrength: 8,
                color: 0x00FFFF,
                animated: {
                    color: {
                        active: true,
                        loopDuration: 2000,
                        animType: "colorOscillation",
                        val1: 0x00FFFF,
                        val2: 0x0000FF
                    }
                }
            }]
        }
    ]
}
```

**Résultat** : Explosion bleue avec effet glow cyan/bleu oscillant pendant 5 secondes sur le lanceur.

### 2. Chaîne Électrique (Effet sur Cible)

```javascript
"electric_chain_tm": {
    name: "⚡ Chaîne Électrique",
    mode: "projectile",
    sequence: [
        {
            file: "jb2a.chain_lightning.primary.blue.05ft",
            atLocation: true,
            stretchTo: "target"
        }
    ],
    tokenMagic: [
        {
            timing: "after",
            target: "target",
            duration: 6000,
            params: [{
                filterType: "electric",
                color: 0x00AAFF,
                intensity: 5,
                animated: {
                    time: {
                        active: true,
                        speed: 0.0020,
                        animType: "move"
                    }
                }
            }]
        }
    ]
}
```

**Résultat** : Éclair vers la cible, puis effet électrique bleu persistant sur la cible pendant 6 secondes.

### 3. Téléportation Ténébreuse (Avant + Après)

```javascript
"shadow_teleport_tm": {
    name: "👻 Téléportation Ténébreuse",
    mode: "target",
    sequence: [
        {
            file: "jb2a_patreon.misty_step.01.dark_black",
            atLocation: true,
            scale: 0.8,
            duration: 800
        },
        {
            file: "jb2a_patreon.misty_step.02.dark_black",
            atLocation: "target",
            scale: 0.8,
            duration: 800
        }
    ],
    tokenMagic: [
        {
            timing: "before",
            target: "caster",
            duration: 800,
            params: [{
                filterType: "fog",
                color: 0x000000,
                density: 0.5
            }]
        },
        {
            timing: "after",
            target: "caster",
            duration: 1000,
            params: [{
                filterType: "fog",
                color: 0x000000,
                density: 0.5
            }]
        }
    ]
}
```

**Résultat** : Brouillard noir avant téléportation, animation de téléportation, puis brouillard noir après.

### 4. Aura de Flammes (Effets Multiples)

```javascript
"fire_aura_tm": {
    name: "🔥 Aura de Flammes",
    mode: "self",
    sequence: [
        {
            file: "jb2a_patreon.explosion.orange.1",
            atLocation: true,
            scale: 2
        }
    ],
    tokenMagic: [
        {
            timing: "after",
            target: "caster",
            duration: 8000,
            params: [
                {
                    filterType: "fire",
                    intensity: 2,
                    color: 0xFF4500,
                    animated: {
                        intensity: {
                            active: true,
                            loopDuration: 3000,
                            animType: "syncCosOscillation",
                            val1: 1.5,
                            val2: 2.5
                        }
                    }
                },
                {
                    filterType: "glow",
                    outerStrength: 6,
                    color: 0xFF4500
                }
            ]
        }
    ]
}
```

**Résultat** : Explosion de feu, puis aura de flammes + glow orange persistants pendant 8 secondes.

### 5. Images Miroir

```javascript
"mirror_image_tm": {
    name: "🎭 Images Miroir",
    mode: "self",
    sequence: [
        {
            file: "jb2a_patreon.misty_step.01.blue",
            atLocation: true,
            scale: 1.2
        }
    ],
    tokenMagic: [
        {
            timing: "after",
            target: "caster",
            duration: 10000,
            params: [{
                filterType: "images",
                nbImage: 3,
                alphaImg: 0.5,
                alphaChr: 0.7,
                animated: {
                    ampX: {
                        active: true,
                        loopDuration: 3000,
                        animType: "syncCosOscillation",
                        val1: 0.02,
                        val2: 0.08
                    }
                }
            }]
        }
    ]
}
```

**Résultat** : Effet de brume bleue, puis 3 images miroir semi-transparentes oscillantes pendant 10 secondes.

## 🔧 Types de Filtres TokenMagic Disponibles

### Filtres Visuels de Base

| Type      | Description     | Propriétés Clés                           |
| --------- | --------------- | ----------------------------------------- |
| `glow`    | Effet de lueur  | `outerStrength`, `innerStrength`, `color` |
| `outline` | Contour coloré  | `thickness`, `color`                      |
| `shadow`  | Ombre portée    | `rotation`, `blur`, `distance`, `alpha`   |
| `bevel`   | Effet de relief | `rotation`, `thickness`, `lightAlpha`     |

### Filtres d'Altération

| Type         | Description            | Propriétés Clés                        |
| ------------ | ---------------------- | -------------------------------------- |
| `adjustment` | Ajustements de couleur | `brightness`, `contrast`, `saturation` |
| `blur`       | Flou                   | `blur`, `quality`                      |
| `pixelate`   | Pixelisation           | `sizeX`, `sizeY`                       |
| `oldfilm`    | Effet film ancien      | `sepia`, `noise`, `vignetting`         |

### Filtres Animés

| Type       | Description      | Propriétés Clés                   |
| ---------- | ---------------- | --------------------------------- |
| `fire`     | Flammes animées  | `intensity`, `color`, `amplitude` |
| `electric` | Électricité      | `color`, `intensity`, `blend`     |
| `fog`      | Brouillard animé | `color`, `density`, `time`        |
| `smoke`    | Fumée            | `color`, `time`, `blend`          |
| `liquid`   | Effet liquide    | `color`, `time`, `blend`          |
| `wave`     | Vagues           | `time`, `anchorX`, `anchorY`      |

### Filtres de Déformation

| Type         | Description         | Propriétés Clés                    |
| ------------ | ------------------- | ---------------------------------- |
| `twist`      | Torsion             | `radiusPercent`, `angle`           |
| `bulgepinch` | Bosse/Pincement     | `radius`, `strength`               |
| `distortion` | Distorsion générale | `maskSpriteId`, `scaleX`, `scaleY` |
| `shockwave`  | Onde de choc        | `time`, `amplitude`                |

### Filtres Spéciaux

| Type     | Description      | Propriétés Clés                   |
| -------- | ---------------- | --------------------------------- |
| `images` | Images miroir    | `nbImage`, `alphaImg`, `alphaChr` |
| `xray`   | Effet rayon X    | `color`, `blend`                  |
| `freeze` | Effet gel        | `time`                            |
| `field`  | Champ de force   | `color`, `intensity`              |
| `globes` | Globes flottants | `scale`, `time`                   |

## 🎯 Animations Keywords pour TokenMagic

### Oscillations

```javascript
animated: {
    <property>: {
        active: true,
        loopDuration: 3000,
        animType: "cosOscillation", // ou "sinOscillation", "syncCosOscillation"
        val1: 0,
        val2: 100
    }
}
```

### Oscillations de Couleur

```javascript
animated: {
    color: {
        active: true,
        loopDuration: 2000,
        animType: "colorOscillation",
        val1: 0xFF0000,
        val2: 0x0000FF
    }
}
```

### Rotation

```javascript
animated: {
    rotation: {
        active: true,
        loopDuration: 5000,
        animType: "rotation", // ou "syncRotation"
        clockwise: true // optionnel, défaut: true
    }
}
```

### Mouvement

```javascript
animated: {
    time: {
        active: true,
        speed: 0.002, // pixels/ms
        animType: "move"
    }
}
```

### Nombres Aléatoires

```javascript
animated: {
    <property>: {
        active: true,
        animType: "randomNumber", // ou "randomNumberPerLoop"
        val1: 0,
        val2: 100,
        wantInteger: true // optionnel
    }
}
```

## 💡 Conseils et Bonnes Pratiques

### Timing des Effets

- **`before`** : Idéal pour les préparations visuelles (charge, concentration)
- **`during`** : Pour des effets simultanés à l'animation (casting, channeling)
- **`after`** : Pour les effets persistants (debuffs, buffs, conditions)

### Durée des Effets

- **Effets courts (1-2s)** : Impacts, flashs, transitions
- **Effets moyens (3-6s)** : Buffs temporaires, debuffs mineurs
- **Effets longs (8-10s)** : Buffs majeurs, conditions persistantes
- **Effets permanents (pas de duration)** : États constants nécessitant suppression manuelle

### Cibles des Effets

- **`caster`** : Toujours disponible, bon pour les auto-buffs
- **`target`** : Nécessite qu'un token soit présent à la position ciblée

### Performance

- Éviter trop d'animations simultanées (max 3-4 filtres par effet)
- Préférer des `loopDuration` > 1000ms pour réduire la charge
- Utiliser `duration` pour nettoyer automatiquement les effets

### Couleurs Hexadécimales

```javascript
// Format: 0xRRGGBB
0xff0000; // Rouge
0x00ff00; // Vert
0x0000ff; // Bleu
0xffff00; // Jaune
0xff00ff; // Magenta
0x00ffff; // Cyan
0xffffff; // Blanc
0x000000; // Noir
```

## 🔗 Ressources

- [Documentation TokenMagic](https://github.com/Feu-Secret/Tokenmagic)
- [Aperçu des Effets TokenMagic](https://github.com/Feu-Secret/Tokenmagic/blob/master/wiki/TokenMagicPreview.md)
- [Documentation Sequencer](https://fantasycomputer.works/FoundryVTT-Sequencer/#/api/effect)
- [JB2A Animations](https://github.com/Jules-Bens-Aa/JB2A_DnD5e)

## 📝 Notes

- TokenMagic FX doit être installé et activé pour utiliser les animations avec effets
- Les filtres TokenMagic peuvent être combinés (plusieurs filtres dans `params`)
- Le système détecte automatiquement les tokens à la position ciblée
- Les effets peuvent être supprimés manuellement via `TokenMagic.deleteFilters(token, filterId)`

## 🐛 Dépannage

### L'effet TokenMagic ne s'applique pas

1. Vérifier que TokenMagic FX est activé
2. Vérifier que la cible est bien "caster" ou qu'un token existe à la position "target"
3. Consulter la console (F12) pour les messages d'erreur

### L'effet persiste trop longtemps

- Ajouter ou réduire la propriété `duration`
- Supprimer manuellement : `TokenMagic.deleteFilters(token, filterId)`

### Performance dégradée

- Réduire le nombre de filtres simultanés
- Augmenter `loopDuration` des animations
- Utiliser des durées plus courtes pour les effets complexes
