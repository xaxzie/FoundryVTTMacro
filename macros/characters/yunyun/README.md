# Yunyun - Mage Polyvalente

Yunyun est une mage capable de maîtriser de nombreuses magies diverses et variées. Elle se caractérise par sa polyvalence, et ses capacités sont majoritairement gérées par le **Charisme**.

## 📊 Caractéristiques Principales

- **Caractéristique Principale** : Charisme
- **Style de Combat** : Mage polyvalente avec sorts offensifs et de contrôle
- **Spécialité** : Diversité magique et adaptabilité tactique

## 🔮 Sorts Disponibles

### 1. Boule de Mana (`boule-de-mana.js`)

**Projectile magique adaptatif**

- **Mode Simple** : Niveau 1, 3 mana (focalisable), 1d6 + Charisme
- **Mode Lourde** : Niveau 2, 6 mana (coût ÷2 en focus), 2d5 + Charisme
  - Applique l'état "Très Fatigué" à Yunyun

### 2. Explosion (`explosion.js`)

**Sort de zone destructeur**

- **Mode Simple** : 6 mana (non focalisable), 2d6 + Charisme×1.5, rayon 3 cases
- **Mode Concentré** : 6 mana (non focalisable), 3d6 + Charisme×1.5, rayon 2 cases
  - Applique l'état "Très Fatigué" à Yunyun
- **Esquive** : Permet de réduire les dégâts de moitié

### 3. Émanation de Flamme (`emanation-de-flamme.js`)

**Sort linéaire ou conique**

- **Coût** : 4 mana (focalisable)
- **Niveau** : 2
- **Mode Ligne** : Ligne droite depuis Yunyun, 1d6 + Charisme
- **Mode Cône** : Cône 120°, rayon 4 cases, 1d6 + Charisme
- **Attaque** : Jet sur Charisme

### 4. Ramollissement (`ramollissement.js`)

**Contrôle de terrain persistant**

- **Coût** : 3 mana (focalisable)
- **Zone** : 4 cases de rayon, animation permanente
- **Effet** : Ralentissement de Charisme/3 cases (arrondi supérieur)
- **Statut** : Applique "Sol Ramoli"
- **Réactivable** : Peut mettre fin au sort ou réappliquer les effets

## 🛠️ Utilitaires

### HandleYunYunEffect (`HandleYunYunEffect.js`)

Système de gestion des effets actifs de Yunyun avec fonctions utilitaires.

### endYunYunEffect (`endYunYunEffect.js`)

Macro pour terminer manuellement les effets appliqués par Yunyun.

## 🎯 Usage

1. Sélectionner le token de Yunyun
2. Lancer le sort souhaité
3. Choisir le mode approprié
4. Cibler selon les besoins du sort
5. Utiliser les utilitaires pour gérer les effets persistants

## 📝 Notes de Développement

- Tous les sorts utilisent **Charisme** comme caractéristique principale
- Système d'états "Très Fatigué" pour certains sorts puissants
- Effets de zone avec détection automatique des cibles
- Animations persistantes pour le contrôle de terrain
- Interface cohérente avec les autres personnages du système
