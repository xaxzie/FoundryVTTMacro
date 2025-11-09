# TokenMagic - Exemples Rapides

## 🎨 Templates d'Animations avec TokenMagic

### Template de Base

```javascript
"mon_animation": {
    name: "🎯 Mon Animation",
    description: "Description courte",
    mode: "self", // "self", "target", ou "projectile"
    sequence: [
        {
            file: "jb2a.effect.webm",
            atLocation: true,
            scale: 1
        }
    ],
    tokenMagic: [
        {
            timing: "during", // "before", "during", ou "after"
            target: "caster", // "caster" ou "target"
            duration: 5000, // en ms, optionnel
            params: [{
                filterType: "glow",
                // propriétés du filtre
            }]
        }
    ]
}
```

## 🌟 Effets Communs

### Glow Animé

```javascript
tokenMagic: [
  {
    timing: "during",
    target: "caster",
    duration: 5000,
    params: [
      {
        filterType: "glow",
        outerStrength: 8,
        innerStrength: 2,
        color: 0x00ffff,
        quality: 0.5,
        padding: 20,
        animated: {
          color: {
            active: true,
            loopDuration: 2000,
            animType: "colorOscillation",
            val1: 0x00ffff,
            val2: 0x0000ff,
          },
        },
      },
    ],
  },
];
```

### Feu Persistant

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "caster",
    duration: 8000,
    params: [
      {
        filterType: "fire",
        intensity: 2,
        color: 0xff4500,
        amplitude: 1,
        time: 0,
        animated: {
          time: {
            active: true,
            speed: -0.002,
            animType: "move",
          },
        },
      },
    ],
  },
];
```

### Électricité

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "target",
    duration: 6000,
    params: [
      {
        filterType: "electric",
        color: 0x00aaff,
        time: 0,
        blend: 1,
        intensity: 5,
        animated: {
          time: {
            active: true,
            speed: 0.002,
            animType: "move",
          },
        },
      },
    ],
  },
];
```

### Brouillard/Fumée

```javascript
tokenMagic: [
  {
    timing: "during",
    target: "caster",
    duration: 4000,
    params: [
      {
        filterType: "fog",
        color: 0x000000,
        density: 0.5,
        time: 0,
        dimX: 1,
        dimY: 1,
        animated: {
          time: {
            active: true,
            speed: 0.005,
            animType: "move",
          },
        },
      },
    ],
  },
];
```

### Gel/Freeze

```javascript
tokenMagic: [
  {
    timing: "during",
    target: "target",
    duration: 4000,
    params: [
      {
        filterType: "freeze",
        time: 0,
        animated: {
          time: {
            active: true,
            speed: 0.003,
            animType: "move",
          },
        },
      },
      {
        filterType: "adjustment",
        saturation: 0,
        brightness: 1.2,
        contrast: 1,
      },
    ],
  },
];
```

### Images Miroir

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "caster",
    duration: 10000,
    params: [
      {
        filterType: "images",
        nbImage: 3,
        alphaImg: 0.5,
        alphaChr: 0.7,
        blend: 2,
        ampX: 0.05,
        ampY: 0.05,
        animated: {
          ampX: {
            active: true,
            loopDuration: 3000,
            animType: "syncCosOscillation",
            val1: 0.02,
            val2: 0.08,
          },
        },
      },
    ],
  },
];
```

### Torsion (Twist)

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "target",
    duration: 5000,
    params: [
      {
        filterType: "twist",
        radiusPercent: 150,
        angle: 2,
        padding: 20,
        animated: {
          angle: {
            active: true,
            loopDuration: 5000,
            animType: "syncCosOscillation",
            val1: -2,
            val2: 2,
          },
        },
      },
    ],
  },
];
```

### Ombre/Shadow

```javascript
tokenMagic: [
  {
    timing: "during",
    target: "caster",
    duration: 3000,
    params: [
      {
        filterType: "shadow",
        rotation: 35,
        blur: 2,
        quality: 10,
        distance: 20,
        alpha: 0.7,
        padding: 5,
        color: 0x000000,
        animated: {
          blur: {
            active: true,
            loopDuration: 500,
            animType: "syncCosOscillation",
            val1: 2,
            val2: 4,
          },
        },
      },
    ],
  },
];
```

### Contour (Outline)

```javascript
tokenMagic: [
  {
    timing: "during",
    target: "caster",
    duration: 6000,
    params: [
      {
        filterType: "outline",
        thickness: 3,
        color: 0xff0000,
        quality: 1,
        padding: 10,
        animated: {
          thickness: {
            active: true,
            loopDuration: 2000,
            animType: "cosOscillation",
            val1: 2,
            val2: 5,
          },
        },
      },
    ],
  },
];
```

### Liquide

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "target",
    duration: 6000,
    params: [
      {
        filterType: "liquid",
        color: 0x0088ff,
        time: 0,
        blend: 2,
        spectral: false,
        scale: 1,
        animated: {
          time: {
            active: true,
            speed: 0.003,
            animType: "move",
          },
        },
      },
    ],
  },
];
```

### Rayon X (XRay)

```javascript
tokenMagic: [
  {
    timing: "before",
    target: "caster",
    duration: 2000,
    params: [
      {
        filterType: "xray",
        time: 0,
        color: 0x00ff00,
        blend: 3,
        animated: {
          time: {
            active: true,
            speed: 0.004,
            animType: "move",
          },
        },
      },
    ],
  },
];
```

## 🎯 Combinaisons Courantes

### Buff Défensif (Glow + Outline)

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "caster",
    duration: 10000,
    params: [
      {
        filterType: "glow",
        outerStrength: 6,
        color: 0x0088ff,
        quality: 0.5,
        padding: 15,
      },
      {
        filterType: "outline",
        thickness: 2,
        color: 0x0088ff,
        quality: 1,
        padding: 10,
      },
    ],
  },
];
```

### Debuff de Poison (Fog + Adjustment)

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "target",
    duration: 8000,
    params: [
      {
        filterType: "fog",
        color: 0x00ff00,
        density: 0.4,
        time: 0,
        animated: {
          time: {
            active: true,
            speed: 0.003,
            animType: "move",
          },
        },
      },
      {
        filterType: "adjustment",
        saturation: -0.5,
        brightness: 0.8,
        contrast: 1.2,
      },
    ],
  },
];
```

### Transformation (Multiple Effets)

```javascript
tokenMagic: [
  {
    timing: "before",
    target: "caster",
    duration: 1000,
    params: [
      {
        filterType: "fog",
        color: 0xffffff,
        density: 1,
        time: 0,
      },
    ],
  },
  {
    timing: "after",
    target: "caster",
    duration: 8000,
    params: [
      {
        filterType: "glow",
        outerStrength: 8,
        color: 0xff0000,
        quality: 0.5,
        padding: 20,
      },
      {
        filterType: "fire",
        intensity: 1.5,
        color: 0xff0000,
        animated: {
          intensity: {
            active: true,
            loopDuration: 3000,
            animType: "syncCosOscillation",
            val1: 1,
            val2: 2,
          },
        },
      },
    ],
  },
];
```

### Invisibilité (Adjustment + Outline)

```javascript
tokenMagic: [
  {
    timing: "after",
    target: "caster",
    duration: 15000,
    params: [
      {
        filterType: "adjustment",
        alpha: 0.3,
        saturation: -1,
        brightness: 1.2,
      },
      {
        filterType: "outline",
        thickness: 1,
        color: 0xcccccc,
        quality: 1,
        padding: 10,
        animated: {
          thickness: {
            active: true,
            loopDuration: 2000,
            animType: "cosOscillation",
            val1: 0.5,
            val2: 1.5,
          },
        },
      },
    ],
  },
];
```

## 🎨 Palettes de Couleurs

### Éléments

```javascript
// Feu
0xff4500; // Orange-Rouge
0xff6600; // Orange Vif
0xffaa00; // Jaune-Orange

// Eau
0x0088ff; // Bleu Clair
0x0066cc; // Bleu Moyen
0x003399; // Bleu Foncé

// Électricité
0x00aaff; // Cyan Électrique
0x00ffff; // Cyan Pur
0x00ccff; // Bleu Électrique

// Nature/Poison
0x00ff00; // Vert Pur
0x66ff33; // Vert Clair
0x339900; // Vert Foncé

// Ombre/Mort
0x000000; // Noir
0x330033; // Violet Très Foncé
0x660066; // Violet Sombre

// Lumière/Divin
0xffffff; // Blanc
0xffff99; // Jaune Pâle
0xffcc00; // Doré

// Arcane/Magie
0x8a2be2; // Violet
0xcc00ff; // Magenta
0xff00ff; // Fuchsia
```

## 📋 Checklist de Configuration

Avant d'ajouter une animation avec TokenMagic :

- [ ] Définir le `mode` approprié (self/target/projectile)
- [ ] Choisir le `timing` (before/during/after)
- [ ] Choisir la `target` (caster/target)
- [ ] Définir une `duration` appropriée (ou laisser vide pour persistant)
- [ ] Configurer les `params` du filtre TokenMagic
- [ ] Ajouter des animations si désiré (oscillations, rotations, etc.)
- [ ] Tester l'animation in-game
- [ ] Ajuster les valeurs selon le résultat visuel

## 💡 Astuces

1. **Durées recommandées** :

   - Buff court : 3000-5000ms
   - Buff moyen : 6000-8000ms
   - Buff long : 10000-15000ms

2. **Performance** :

   - Max 3-4 filtres par configuration
   - `loopDuration` > 1000ms pour les animations
   - Utiliser `duration` pour auto-cleanup

3. **Timing** :

   - `before` : Préparation (0.5-1s)
   - `during` : Casting (1-2s)
   - `after` : Effet persistant (variable)

4. **Couleurs** :
   - Utiliser le format hexadécimal : `0xRRGGBB`
   - Tester plusieurs couleurs pour trouver le bon effet
   - Utiliser `colorOscillation` pour des effets vivants
