# Urgen - Maître des Livres Magiques

Urgen est un personnage spécialisé dans la magie des livres. Il peut créer des livres magiques qui déclenchent des effets spécifiques selon ses maîtrises.

## 🎯 Concept du Personnage

### Spécialité : Magie des Livres
- **Élément** : Mental/Esprit
- **Style de Combat** : Attaque à distance avec livres magiques
- **Caractéristique Principale** : **Esprit** (concentration et magie)

### Limitation Unique
- **Maximum de Livres** : Ne peut avoir plus de **4 livres créés simultanément**
- **Gestion des Resources** : Chaque livre attaché coûte de la mana par tour

## 📚 Sorts de Urgen

### 🔥 Livre Monstrueux
**Fichier** : `livre-monstrueux.js`

**Description** : Urgen utilise son esprit pour créer un livre magique qu'il lance sur un adversaire, infligeant des dégâts et pouvant s'accrocher à la cible.

**Mécaniques** :
- **Caractéristique** : Esprit (pour attaque et dégâts)
- **Dégâts** : 1d4 + Esprit (si touche)
- **Coût de Base** : 2 mana (focalisable)
- **Niveau de Sort** : 1

**Système d'Accrochage** :
- **Option** : Peut choisir d'accrocher le livre à la cible
- **Effet** : Ajoute un effet "Livre Monstrueux" avec statusCounter
- **Valeur Counter** : Esprit/2 de Urgen
- **Limite** : Jusqu'à 2 livres par cible
- **Coût Maintenance** : 1 mana/tour (non focalisable)
- **Stacking** : Si déjà présent, augmente le statusCounter de Esprit/2

### 🗑️ Terminer Effets de Urgen
**Fichier** : `endUrgenEffect.js`

**Description** : Macro utilitaire pour détacher et supprimer les livres magiques que Urgen a attachés à d'autres personnages.

**Fonctionnalités** :
- **Détection Automatique** : Trouve tous les effets "Livre Monstrueux" sur le canvas
- **Interface de Sélection** : Choisir quels livres détacher (sélectionnés ou tous)
- **Animation de Détachement** : Effet visuel lors de la suppression
- **Gestion GM** : Utilise le système de délégation GM pour les tokens non possédés
- **Extensible** : Configuration centralisée pour ajouter facilement de nouveaux types de livres

**Usage** : Sélectionner le token de Urgen et lancer la macro pour voir tous les livres attachés

## 🎮 Règles RPG Spécifiques

### Système de Dés (d7)
- **Attaque** : [Esprit de Urgen]d7 + bonus de niveau
- **Défense** : [Agilité du défenseur]d7
- **Touche si** : Total attaque > Total défense

### Stances de Combat
- **Offensive** : Dégâts maximisés (1d4 devient 4)
- **Defensive** : Peut utiliser magie réactive
- **Focus** : Sorts focalisables deviennent gratuits

### Intégration Système
- **Détection Stance** : Utilise les fonctions utilitaires du projet
- **Gestion Effets** : Utilise le système GM delegation
- **Interface** : Dialogs pour configuration manuelle des bonus

## 📝 Notes de Développement

### Conformité RPG
- Suit les règles du système RPG personnalisé
- Utilise les fonctions utilitaires standardisées
- Intègre la détection de stance et calculs d'injury
- Respecte le système de délégation GM pour les effets

### Animation et Effets
- Utilise les assets JB2A et autres bibliothèques disponibles
- Animations adaptées au thème "livre magique"
- Effets visuels pour l'accrochage du livre à la cible

### Future Expansion
- Autres types de livres magiques
- Système de maîtrise des livres
- Interactions entre livres différents
