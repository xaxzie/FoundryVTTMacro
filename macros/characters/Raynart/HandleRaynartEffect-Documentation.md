# HandleRaynartEffect - Documentation Complète

## Vue d'Ensemble

HandleRaynartEffect.js est le gestionnaire central de tous les effets mécaniques spéciaux de Raynart. Il implémente un système sophistiqué de modification dynamique des coûts de mana basé sur l'Armure du Fléau de l'Infini.

## Fonctionnalités Principales

### ✅ Système de Coûts Dynamiques

- **3 types de coûts:** Focusable, Demi-focus, Non-focusable
- **Modification par Armure Infini:**
  - Non-focusable → Demi-focus
  - Demi-focus → Focusable
- **Calcul en temps réel** selon la posture actuelle

### ✅ Tracking Automatique de Mana

- StatusCounter visible sur l'Armure Infini
- Incrémentation automatique à chaque économie
- Menu de fin avec calculs détaillés

### ✅ 6 Effets Mécaniques Complets

Tous avec animations, flags, et intégration posture

### ✅ Intégration Invocations

- Détection via tag "RaynartInvocations"
- Application d'effets en masse (Expansion)
- Compteur "InvocationsComplexe" synchronisé

## Effets Disponibles

### 1. ⚡ Armure du Fléau de l'Infini

**Le cœur du système**

```javascript
// Animation complète (10 étapes)
// Force Focus
// StatusCounter: 0 (visible)
// Modifie tous les coûts
```

**Menu de fin:**

- Extension Invocations: ×5 mana/tour
- Mécanique Analytique: ×2 mana/tour
- Mode Stellaire: ×1.5 mana/tour (arrondi inf)

### 2. 🌍 Expansion du Monde Intérieur

**Support d'invocations**

```javascript
Coût: 5 mana (non-focusable)
→ Sous Armure: 2.5 mana (demi-focus)
→ Sous Armure + Focus: GRATUIT

Effet: Résistance = Esprit/2 sur TOUTES invocations
```

### 3. 🔫 Mode Big Gun

**Amélioration combat**

```javascript
Coût: 4 mana (focusable)
→ En Focus: GRATUIT
→ Sous Armure: Déjà focusable

Flags:
- damage: Esprit/4 (arrondi sup)
- resistance: Esprit/2 (arrondi sup)
```

### 4. 🔍 Mécanique Analytique

**Prédiction tactique**

```javascript
Coût: 6 mana + 2/tour (non-focusable)
→ Sous Armure: 3 mana + 1/tour (demi-focus)
→ Sous Armure + Focus: GRATUIT + 1 mana/tour

Animation legacy intégrée
```

### 5. 🌑 Mode Eclipse

**Partage mental**

```javascript
Coût: 6 mana (non-focusable)
→ Sous Armure: 3 mana (demi-focus)
→ Sous Armure + Focus: GRATUIT

Force Focus
Double capacité invocations
Restrictions: esquive, explosions, magie stellaire
```

### 6. ⭐ Mode Stellaire

**Déploiement mana**

```javascript
Coût: 3 mana/tour (demi-focus)
→ En Focus: 1.5 mana/tour
→ Sous Armure: GRATUIT en Focus (focusable)

Max 1 création complexe
Permet explosions partout
```

## Architecture Technique

### Fonctions Helpers

```javascript
// Détection stance
getCurrentStance(actor) → "focus" | "offensif" | "defensif" | null

// Vérification Armure
hasArmureInfini(actor) → boolean

// Calcul coûts
calculateManaCost(effectConfig, actor) → {
    realCost,      // Coût réel après modifications
    savedMana,     // Mana économisée
    displayMessage, // Message formaté HTML
    modifiedCostType // Type après modification Armure
}

// Update compteur Armure
updateArmureInfiniCounter(actor, savedMana)

// Forcer Focus
forceFocusPosture(actor)

// Invocations
getRaynartInvocations() → Token[]
applyResistanceToInvocations(value) → {total, success}
```

### Gestion Animations

```javascript
// Séquence complexe
playAnimationSequence(token, sequenceArray);

// Animation persistante
playPersistentAnimation(token, animConfig, isActivating);

// Cleanup automatique
Sequencer.EffectManager.endEffects({
  name: "sequencerName",
  object: token,
});
```

### Effect Handlers Spécialisés

```javascript
handleArmureInfiniActivation();
handleArmureInfiniEnd(); // Avec dialog de fin
handleExpansionActivation();
handleEclipseActivation();
handleGenericEffectActivation();
handleGenericEffectDeactivation();
```

## Dialog Interface

### Structure

- **Section Armure Infini:** Affichage compteur si actif
- **Section Effets Externes:** Détection effets non-gérés
- **Section Effets Mécaniques:** 6 effets avec coûts dynamiques
- **Section Postures:** Gestion mutuellement exclusive
- **Section Blessures:** Ajout/retrait avec quantité

### Boutons

- **✅ Appliquer:** Exécute les changements pending
- **🗑️ Tout Retirer:** Cleanup complet avec dialogs spéciaux
- **❌ Annuler:** Ferme sans changements

### Feedback Visuel

- Pending changes: Box-shadow bleu
- Coûts: Affichage HTML coloré
- Économies: Texte vert
- Modificateurs Armure: Texte orange

## Intégration HandleRaynartInvocations

### Tags Partagés

```javascript
// Sur création d'invocation
flags: {
    world: {
        RaynartInvocations: true,
        raynartInvocationType: "type",
        raynartCreatedInFocus: boolean,
        raynartCreator: actorId,
        raynartCreatedAt: timestamp
    }
}
```

### Détection Invocations

```javascript
// Dans HandleRaynartEffect
const invocations = canvas.tokens.placeables.filter(
  (t) => t.actor?.flags?.world?.RaynartInvocations === true
);

// Application Résistance
for (const inv of invocations) {
  await inv.actor.createEmbeddedDocuments("ActiveEffect", [
    {
      name: "Résistance",
      flags: {
        statuscounter: { value: resistValue, visible: true },
      },
    },
  ]);
}
```

### Compteur InvocationsComplexe

Créé/géré par HandleRaynartInvocations, visible dans le dialog Effect pour contexte.

## Messages Chat

### Format Standard

```html
<div
  style="border: 2px solid #COLOR; border-radius: 8px; padding: 12px; background: #BG;"
>
  <h3>EMOJI Nom Effet</h3>
  <p><strong>Acteur</strong> action</p>
  <hr />
  <p><strong>💎 Coût:</strong> DisplayMessage</p>
  <p>Description effets</p>
  <p style="color: #4caf50;">⚡ Économies</p>
</div>
```

### Message Armure Infini (Fin)

```html
<h3>⚡ Fin de l'Armure</h3>
<p><strong>💎 Mana économisée totale: XX</strong></p>
<ul>
  <li>Compteur: XX</li>
  <li>Extension: X tours × 5 = XX</li>
  <li>Analytique: X tours × 2 = XX</li>
  <li>Stellaire: X tours × 1.5 = XX</li>
</ul>
```

## Stratégies d'Utilisation

### Combo Maximum Économie

```
1. Activer Armure Infini (Force Focus)
2. Activer Mode Eclipse (6 mana → GRATUIT, +6 compteur)
3. Créer invocations (gratuites en Focus)
4. Activer Expansion (5 mana → GRATUIT, +5 compteur)
5. Activer Analytique (6 mana → GRATUIT, +6 compteur)
6. Activer Stellaire (3/tour → GRATUIT)

Économie instantanée: 17 mana
+ 2 mana/tour (Analytique sous Armure)
+ 3 mana/tour (Stellaire sous Armure+Focus)
```

### Rotation Combat

```
Tour 1: Armure + Eclipse + Invocations + Expansion
Tour 2-N: Maintien Analytique + Stellaire (tracking tours)
Tour Fin: Désactiver Armure → Menu → Calcul total
```

### Sans Armure

```
En Focus:
- Big Gun: GRATUIT (focusable)
- Stellaire: 1.5 mana/tour (demi-focus)
- Eclipse: 6 mana (non-focusable)

En Offensif/Défensif:
- Tous les coûts normaux
- Pas d'économies
```

## Configuration et Personnalisation

### Ajouter un Nouvel Effet

```javascript
// Dans CUSTOM_EFFECTS
"Nom Effet": {
    name: "Nom Effet",
    icon: "path/to/icon",
    flags: [
        { key: "flagName", value: calculatedValue }
    ],
    description: "Description détaillée",
    category: "custom",
    increasable: false,
    manaCost: X,
    costType: "focusable" | "demi-focus" | "non-focusable",
    isPerTurn: boolean,
    manaPerTurn: X, // Si isPerTurn
    forcesFocusPosture: boolean, // Si force Focus
    hasAnimation: true,
    animation: {
        castAnimation: { ... },
        persistent: { ... },
        deactivationAnimation: { ... }
    },
    hasStatusCounter: boolean,
    statusCounterValue: X,
    statusCounterVisible: boolean
}
```

### Modifier Animations

```javascript
// Cast simple
castAnimation: {
    file: "path/to/animation",
    atLocation: true,
    scale: 2,
    tint: 0xCOLOR
}

// Persistante
persistent: {
    file: "path/to/animation",
    attachTo: true,
    scale: 2,
    opacity: 0.8,
    belowTokens: true,
    sequencerName: "UniqueName"
}

// Séquence complexe (array)
activationSequence: [
    {
        file: "anim1",
        atLocation: true,
        waitUntilFinished: -500
    },
    {
        file: "anim2",
        atLocation: true,
        scale: 2
    }
]
```

### Ajuster Calculs

```javascript
// Modifier formules dans CUSTOM_EFFECTS
const esprit = actor.system.attributes?.esprit?.value || 3;

CUSTOM_EFFECTS["Mode Big Gun"].flags[0].value = Math.ceil(esprit / 4);
CUSTOM_EFFECTS["Mode Big Gun"].flags[1].value = Math.ceil(esprit / 2);
```

## Dépannage

### Armure ne modifie pas les coûts

```javascript
// Vérifier:
1. Effet "Armure du Fléau de l'Infini" existe dans actor.effects
2. hasArmureInfini(actor) retourne true
3. calculateManaCost() est appelé APRÈS création Armure
4. Logs console: [Raynart] pour debug
```

### Animations ne jouent pas

```javascript
// Vérifier:
1. Sequencer module actif
2. Chemins fichiers corrects (sensible à la casse)
3. JB2A modules actifs (Free + Patreon)
4. Logs console pour erreurs Sequencer
```

### Compteur ne s'incrémente pas

```javascript
// Vérifier:
1. updateArmureInfiniCounter() appelé
2. savedMana > 0 dans calculateManaCost
3. Effect Armure a flags.statuscounter.value
4. Effect.update() permissions
```

### Invocations non détectées

```javascript
// Vérifier:
1. HandleRaynartInvocations créé les flags correctement
2. flags.world.RaynartInvocations === true
3. getRaynartInvocations() retourne tokens
4. Permissions sur tokens.placeables
```

## Performance

### Optimisations Implémentées

- Calculs cachés (esprit lu une fois)
- Animations async sans blocage
- Cleanup automatique des effets
- Dialog événements délégu és

### Limites Connues

- Max ~50 invocations simultanées (performance Expansion)
- Animations complexes peuvent lag sur systèmes faibles
- Dialog peut être lent avec >100 effets externes

## Tests Recommandés

### Checklist Validation

- [ ] Armure active force Focus
- [ ] Compteur Armure visible sur token
- [ ] Coûts affichés correctement (avec/sans Armure)
- [ ] Économies ajoutées au compteur
- [ ] Menu fin Armure calcule correct
- [ ] Expansion détecte invocations
- [ ] Expansion ajoute Résistance
- [ ] Eclipse force Focus
- [ ] Mode Big Gun flags corrects
- [ ] Analytique animation legacy
- [ ] Stellaire belowTokens
- [ ] Toutes animations persistent/cleanup
- [ ] Messages chat formatés
- [ ] Postures mutuellement exclusives
- [ ] Blessures incrémentent/décrémentent

---

**Version:** 1.0.0
**Dernière mise à jour:** Novembre 2025
**Fichier:** HandleRaynartEffect.js (~1400 lignes)
