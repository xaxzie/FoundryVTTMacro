# End Leo Effects (endLeoEffect.js)

## Description

Macro général pour terminer les effets négatifs que Léo a appliqués sur d'autres tokens durant le combat. Fonctionne comme une version "suppression uniquement" du gestionnaire AddEffect.

**⚡ Nouveau :** Configuration centralisée via `EFFECT_CONFIG` pour faciliter l'ajout de nouveaux effets !

## Fonctionnalités

### Configuration Centralisée (EFFECT_CONFIG)

Le macro utilise maintenant un objet de configuration centralisé qui définit :

- **Détection des effets** : flags à vérifier et valeurs attendues
- **Affichage** : icônes, descriptions, couleurs, sections de l'interface
- **Animations** : effets visuels de suppression
- **Nettoyage spécial** : suppression d'animations Sequencer, etc.

#### Avantages

- ✅ **Facilement extensible** : ajouter un nouvel effet en modifiant uniquement la config
- ✅ **Maintenance simplifiée** : toute la logique centralisée
- ✅ **Cohérence visuelle** : style uniforme pour tous les effets
- ✅ **Flexibilité** : support de différents types de détection et nettoyage

### Détection Automatique

- Scanne automatiquement tous les tokens sur le canvas
- Détecte les effets basés sur la configuration `EFFECT_CONFIG`
- Système flexible de vérification des flags avec support multi-critères
- Exclut Léo lui-même de la recherche

### Effets Supportés

#### 🔗 Chaîne d'Acier

- **Source:** Macro `steel-chain.js`
- **Identification:** Nom "Chaîne d'Acier" + flag `world.chainCaster`
- **Suppression:** Effet + animation Sequencer persistante
- **Icône:** `icons/commodities/metal/chain-steel.webp`

#### 🐌 Ralentissement

- **Source:** Macro `empalement.js`
- **Identification:** Nom "Ralentissement" + flag `world.spellCaster` ou `world.appliedBy`
- **Suppression:** Effet avec compteur de stacks
- **Icône:** `icons/svg/downgrade.svg`
- **Affichage:** Indique le nombre de cases de réduction (-X cases)

### Interface Utilisateur

#### Organisation par Type

- **Chaînes d'Acier:** Section dédiée avec compteur
- **Ralentissements:** Section dédiée avec compteur
- **Style visuel:** Bordures colorées par type d'effet

#### Sélection

- **Sélection individuelle:** Cases à cocher pour chaque effet
- **Sélection par section:** Clic sur les titres pour sélectionner/désélectionner une section entière
- **Sélection globale:** Bouton "Supprimer Tous"

#### Boutons d'Action

- **🗑️ Supprimer Sélectionnés:** Supprime uniquement les effets cochés
- **🗑️ Supprimer Tous:** Supprime tous les effets détectés
- **❌ Annuler:** Ferme la dialog sans changement

### Gestion des Permissions

#### GM Delegation

- Utilise le système `globalThis.gmSocket` via le module `custom-status-effects`
- Permet aux joueurs de supprimer des effets sur des tokens qu'ils ne possèdent pas
- Gestion d'erreur robuste avec feedback détaillé

#### Cas d'Échec

- GM Socket indisponible
- Actor ou effet introuvable
- Erreurs de suppression

### Feedback et Résultats

#### Chat Message

- **Chaînes supprimées:** Liste des cibles libérées avec animation dorée
- **Ralentissements supprimés:** Liste avec indication des stacks (-X cases)
- **Erreurs:** Section dédiée avec détails des échecs

#### Notifications

- **Succès:** Compteur par type d'effet supprimé
- **Échecs:** Détails des erreurs avec console logging
- **Aucun effet:** Message "Pas de malus détecté à supprimer"

#### Animations

- **Chaînes d'Acier:** Animation de libération dorée (`jb2a.chain.03.complete.blue` avec tint doré)
- **Ralentissements:** Pas d'animation spécifique

## Usage

### Pré-requis

1. **Module custom-status-effects** actif
2. **Socketlib** installé et fonctionnel
3. **Token de Léo** sélectionné

### Étapes

1. Sélectionner le token de Léo
2. Lancer la macro `endLeoEffect.js`
3. Si aucun effet détecté → Message "Pas de malus détecté à supprimer"
4. Si effets détectés → Dialog de sélection s'ouvre
5. Cocher les effets à supprimer ou utiliser "Supprimer Tous"
6. Confirmer avec le bouton approprié
7. Feedback dans le chat et notifications

### Cas d'Usage Typiques

- **Fin de combat:** Nettoyer tous les effets appliqués par Léo
- **Libération ciblée:** Supprimer uniquement certains effets spécifiques
- **Gestion d'erreur:** Corriger des effets mal appliqués

## Intégration avec Autres Macros

### steel-chain.js

- Les chaînes créées sont automatiquement détectables
- L'animation Sequencer est correctement terminée
- Les flags `world.chainCaster` permettent l'identification

### empalement.js

- Les ralentissements appliqués sont détectables
- Les stacks de compteur sont affichées correctement
- Les flags `world.spellCaster` permettent l'identification

### Extensibilité avec EFFECT_CONFIG

Pour ajouter support d'un nouvel effet (ex: "Paralysie") :

1. **Ajouter l'entrée dans EFFECT_CONFIG** :

   ```javascript
   "Paralysie": {
       displayName: "Paralysie",
       icon: "icons/svg/paralysis.svg",
       description: "Paralysé par la magie de Léo",
       sectionTitle: "⚡ Paralysies",
       sectionIcon: "⚡",
       cssClass: "paralysis-effect",
       borderColor: "#9c27b0",
       bgColor: "#f3e5f5",
       detectFlags: [
           { path: "flags.world.paralysisCreator", matchValue: "CASTER_ID" }
       ],
       removeAnimation: {
           file: "jb2a.cure_wounds.400px.blue",
           scale: 0.8,
           duration: 2000,
           fadeOut: 800,
           tint: "#ffffff"
       }
   }
   ```

2. **C'est tout !** Le système détectera automatiquement le nouvel effet et :
   - ✅ Le trouvera sur le canvas basé sur les flags configurés
   - ✅ L'affichera dans l'interface avec l'icône et style appropriés
   - ✅ Le regroupera dans sa propre section
   - ✅ Jouera l'animation de suppression configurée
   - ✅ L'inclura dans les résultats et feedback

### Paramètres de Configuration

#### Paramètres Obligatoires

- `displayName`: Nom affiché de l'effet
- `icon`: Chemin vers l'icône
- `description`: Description de base
- `sectionTitle`: Titre de la section dans l'interface
- `sectionIcon`: Emoji/icône pour la section
- `cssClass`: Classe CSS pour le style
- `borderColor`: Couleur de la bordure gauche
- `bgColor`: Couleur de fond de la section de résultats
- `detectFlags`: Array des flags à vérifier pour détecter l'effet

#### Paramètres Optionnels

- `getDynamicDescription`: Fonction pour générer une description dynamique
- `getExtraData`: Fonction pour extraire des données supplémentaires
- `removeAnimation`: Configuration de l'animation de suppression
- `cleanup.sequencerName`: Chemin vers le nom de séquence à nettoyer

## Structure du Code

### Fonctions Principales

- `EFFECT_CONFIG`: Configuration centralisée de tous les effets supportés
- `checkEffectFlags()`: Utilitaire de vérification des flags basé sur la config
- `findLeoEffectsOnCanvas()`: Détection des effets sur le canvas (générique)
- `showEffectSelectionDialog()`: Interface de sélection (générée dynamiquement)
- **GM Delegation**: Utilise les handlers du module custom-status-effects

### Gestion d'Erreur

- Try/catch pour chaque suppression
- Collecte des succès et échecs
- Feedback détaillé pour debugging

### Logging

- `[DEBUG]` pour les opérations internes
- Tracking des animations Sequencer
- Détails des appels GM Socket

## Dépendances

### Modules FoundryVTT

- **socketlib**: Pour la délégation GM
- **custom-status-effects**: Handlers GM pour suppression d'effets
- **sequencer**: Pour terminer les animations persistantes

### Macros Liées

- **steel-chain.js**: Source des effets "Chaîne d'Acier"
- **empalement.js**: Source des effets "Ralentissement"
- **AddEffect.js**: Inspiration pour l'interface utilisateur

## Maintenance

### Mise à Jour

- Vérifier la compatibilité avec les nouvelles versions de socketlib
- Adapter les sélecteurs d'effets si les noms/flags changent
- Tester la délégation GM après mise à jour FoundryVTT

### Debug

- Utiliser les logs `[DEBUG]` pour tracer les opérations
- Vérifier `globalThis.gmSocket` si problèmes de délégation
- Inspecter les flags des effets si détection échoue
