# Urgen - Maître des Livres Magiques

Urgen est un personnage spécialisé dans la magie des livres et de la connaissance. Il manipule l'énergie magique à travers des ouvrages enchantés, utilisant sa maîtrise intellectuelle pour créer des effets variés.

## 🎯 Concept du Personnage

### Spécialité : Magie des Livres et de l'Esprit
- **Élément** : Mental/Esprit et Dextérité (selon le sort)
- **Style de Combat** : Attaque à distance et zone d'effet avec livres magiques
- **Caractéristiques** : **Esprit** (sorts magiques) et **Dextérité** (lancers précis)

### Gamme de Sorts
- **Sorts Simples** : Lancers rapides et économiques
- **Sorts Puissants** : Attachements persistants avec coût de maintenance
- **Sorts Défensifs** : Protection d'alliés avec mécaniques de portail
- **Sorts de Zone** : Tempêtes magiques affectant plusieurs cibles

## 📚 Sorts de Urgen

### � Livre Simple (Niveau 0.5)
**Fichier** : `livre-simple.js`

**Description** : Sort basique permettant de lancer un petit livre avec précision et agilité.

**Mécaniques** :
- **Caractéristique** : Dextérité (attaque) + Dextérité/2 (dégâts)
- **Dégâts** : 1d2 + Dextérité/2 + bonus
- **Coût** : 0 mana (toujours gratuit)
- **Type** : Attaque directe simple, pas d'effet persistant

### 📚 Livre Monstrueux (Niveau 1)
**Fichier** : `livre-monstrueux.js`

**Description** : Livre magique lancé avec l'esprit, peut s'accrocher à la cible pour infliger des dégâts persistants.

**Mécaniques** :
- **Caractéristique** : Esprit (attaque et dégâts)
- **Dégâts** : 1d4 + Esprit + bonus
- **Coût** : 3 mana (focalisable)
- **Attachement** : Option d'accrocher le livre (Counter: Esprit/2, coût: 1 mana/tour)
- **Limite** : Livres illimités par cible (cumul possible)

### 🛡️ Livre Défensif (Niveau 1)
**Fichier** : `livre-defensif.js`

**Description** : Sort défensif utilisant deux portails pour envoyer des livres protecteurs aux alliés.

**Mécaniques** :
- **Caractéristique** : Esprit (aucun jet d'attaque)
- **Coût** : 2 mana par livre (non focalisable)
- **Ciblage** : Double portail pour sélectionner 1-2 alliés
- **Effet Défensif** : Applique "Livre Défensif" avec counter basé sur Esprit
- **Book Counter** : Incrémente le compteur de livres de Urgen

### 📚 Tempête Littéraire (Niveau 2)
**Fichier** : `tempete-litteraire.js`

**Description** : Livre explosant en tempête de pages magiques dans une zone de 2 cases de rayon.

**Mécaniques** :
- **Caractéristique** : Esprit (attaque et dégâts)
- **Dégâts** : 1d6 + Esprit + bonus
- **Coût** : 6 mana (demi-focalisable : 3 en Focus)
- **Zone** : Cercle de 2 cases de rayon (étendu)
- **Spécial** : L'esquive ne réduit les dégâts que de moitié

## 🛠️ Utilitaires de Gestion

### 🎭 Gestionnaire d'Effets de Urgen
**Fichier** : `HandleUrgenEffects.js`

**Description** : Interface unifiée pour gérer tous les effets actifs de Urgen.

**Fonctionnalités** :
- **Postures** : Focus, Offensif, Défensif (mutuellement exclusives)
- **Blessures** : Gestion des injuries avec counters
- **Book Counter** : Compteur de livres magiques créés
- **Effets Externes** : Auto-détection avec counters activés
- **Interface Unifiée** : Gestion complète depuis une macro

### 🗑️ Nettoyage des Effets
**Fichier** : `endUrgenEffect.js`

**Description** : Utilitaire pour détacher les livres magiques attachés aux autres personnages.

**Fonctionnalités** :
- **Détection Auto** : Trouve tous les effets de livres sur le canvas
- **Sélection** : Choisir quels livres détacher individuellement
- **Animation** : Effets visuels de détachement
- **Gestion GM** : Support pour tokens non possédés
- **Mise à Jour** : Ajuste automatiquement le compteur Book de Urgen

## 🎮 Mécaniques de Jeu

### Système d'Attaque
- **Dés d'Attaque** : [Caractéristique]d7 + bonus de niveau (×2)
- **Défense** : [Agilité du défenseur]d7
- **Réussite** : Attaque > Défense

### Stances de Combat
- **Offensive** : Dégâts maximisés (1d2→2, 1d4→4, 1d6→6)
- **Défensive** : Résistance accrue et magie réactive
- **Focus** : Sorts focalisables gratuits, demi-focalisables à moitié prix

### Types de Coûts en Mana
- **Focalisable** : Gratuit en stance Focus
- **Demi-focalisable** : Moitié prix en stance Focus
- **Non focalisable** : Coût fixe (maintenance, sorts défensifs)

### Caractéristiques Utilisées
- **Esprit** : Sorts magiques offensifs et défensifs
- **Dextérité** : Sorts de précision (Livre Simple)
- **Système d'Injuries** : Réduction de caractéristiques par blessures

## 🎯 Stratégies de Combat

### Économie de Mana
- **Livre Simple** : Attaque gratuite de base
- **Focus Stance** : Maximise l'efficacité des gros sorts
- **Gestion Book Counter** : Limiter les coûts de maintenance

### Polyvalence Tactique
- **Attaque Directe** : Livre Simple et Livre Monstrueux
- **Contrôle de Zone** : Tempête Littéraire pour groupes d'ennemis
- **Support Défensif** : Livre Défensif pour protéger les alliés
- **Persistance** : Livres attachés pour dégâts continus

### Optimisations
- **Combinaisons** : Alterner sorts simples et complexes
- **Positionnement** : Exploiter les portées et zones d'effet
- **Timing** : Utiliser les stances au bon moment
