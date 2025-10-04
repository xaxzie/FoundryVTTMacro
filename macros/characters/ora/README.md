# Ora - Water Elementalist (RPG-Compliant Spells)

RPG-compliant spell animations for Ora, designed to work with the custom RPG system outlined in [GAME-RULES.md](../../../GAME-RULES.md). **Toutes les macros ont été mises à jour avec le format standard**.

## 🌊 Character Overview

**Ora** is a water elementalist specializing in versatile projectile attacks and battlefield control through elemental effects.

### Combat Characteristics

- **Primary Stat**: Esprit (used for most spell calculations)
- **Secondary Stats**: Dextérité (precision), Sens (targeting)
- **Preferred Stances**: Focus (for mana efficiency), Defensive (reactive casting)
- **Combat Role**: Ranged damage dealer with battlefield control

## 🫧 Available Spells

### Bubbles

**File**: `bubbles.js` (⭐ **NOUVELLE VERSION - FORMAT STANDARD**)
**Type**: Dual projectile attack / Single healing
**Mana Cost**: 4 mana (focusable - gratuit en Position Focus, sauf Eau Vivante: 2 mana)
**Range**: 120 (Portal targeting)

**Description**: Lance des projectiles élémentaires personnalisables pour différents effets tactiques ou de soin. **Version réécrite avec le format standard utilisé par les sorts de Léo**.

**Éléments Disponibles**:

- **Eau**: Augmente les futurs dégâts électriques (+2 prochaine attaque électrique) (2 projectiles)
- **Glace**: Diminue la vitesse de la cible de 1 case (2 projectiles)
- **Huile**: Augmente les futurs dégâts de feu (+2 prochaine attaque de feu) (2 projectiles)
- **Eau Vivante**: Soigne la cible pour 1d6 + (Esprit + bonus)/2 (1 projectile, peut se cibler soi-même, NON focalisable)

**Dégâts**: Chaque projectile de dégât inflige `1d6 + (Esprit + bonus)/2` OU **maximisé en Position Offensive**
**Soin**: Eau Vivante soigne `1d6 + (Esprit + bonus)/2` (non affecté par la position)

**Ciblage**:

- **Variantes de dégâts**: 1 cible (deux projectiles) ou 2 cibles (un chacun)
- **Eau Vivante**: Cible unique seulement, peut se cibler soi-même en cliquant près de son token

**Combat Stance Integration** ⚔️:

- **Focus Stance**:
  - Water/Ice/Oil variants: **FREE** (0 mana)
  - Living Water: **2 mana** (reduced cost)
  - Normal dice rolling for damage/healing
- **Offensive Stance**:
  - All variants: **4 mana**
  - Damage dice **MAXIMIZED** (6 + stat bonus per projectile)
  - Living Water unaffected (normal dice rolling)
- **Defensive Stance**:
  - All variants: **4 mana**
  - Normal dice rolling
- **No Stance**:
  - All variants: **4 mana**
  - Normal dice rolling

**RPG Integration**:

- ✅ **Automatic stance detection** from Active Effects
- ✅ **Stance-specific damage mechanics** (Offensive = maximized dice)
- ✅ **Stance-specific mana costs** (Focus = free/reduced, others = 4 mana)
- ✅ Proper damage/healing calculation display with stance indicators
- ✅ Four element options with distinct tactical effects
- ✅ Manual bonus damage input (Esprit automatically read from character sheet)
- ✅ Attack resolution: Esprit-based d7 roll with spell level bonus
- ✅ Self-targeting capability for Living Water variant
- ✅ Chat message with complete spell results and stance information
- ✅ Visual effects synchronized with game mechanics
- ✅ UI shows current stance in dialog titles and descriptions
- ⚠️ Turn validation bypassed (as per spell requirements)
- 🔄 Mana resource deduction (planned for character sheet integration)

**Required Modules**:

- Sequencer (core animation)
- JB2A (visual effects)
- Portal (crosshair/targeting - primary targeting system)

### Bubble Spam

**File**: `bubble-spam.js` (⭐ **NOUVELLE VERSION - FORMAT STANDARD**)
**Type**: Utilitaire de tir rapide
**Coût**: Aucun (mode utilitaire)
**Range**: Illimitée (clic direct)

**Description**: Mode tir rapide pour lancer des bulles d'eau en continu sans dialogs. **Version réécrite avec configuration structurée**.

**Contrôles**:

- **Clic**: Tire une bulle vers la position cliquée
- **ESC**: Quitte le mode spam

### Tourbillon

**File**: `tourbillon.js` (⭐ **NOUVELLE VERSION - FORMAT STANDARD**)
**Type**: Création de vortex persistants
**Coût**: 4 mana (focusable - gratuit en Position Focus, pas de choix sur protection)
**Range**: 150 (Portal targeting)

**Description**: Crée un ou plusieurs tourbillons d'eau persistants qui infligent des dégâts lors de la traversée. **Version réécrite avec le format standard**.

**Types de Tourbillon**:

- **Simple**: 1 tourbillon puissant (2d6 + Esprit + bonus)
- **Divisé**: 2 tourbillons faibles (1d6 + Esprit/2 + bonus chacun)

**Mécaniques Spéciales**:

- **Protection**: Peut bloquer les attaques traversantes (Position Focus = toujours actif)
- **Vision**: Bloque la ligne de vue (géré manuellement)
- **Évasion**: Jet d'Agilité pour traverser sans dégâts (coûte une action de mouvement)
- **Durée**: Persistant (2 minutes) jusqu'à destruction manuelle

### Tourbillon Destroyer

**File**: `tourbillon-destroy.js` (⭐ **NOUVELLE VERSION - FORMAT STANDARD**)
**Type**: Utilitaire de destruction
**Coût**: Aucun (mode utilitaire)
**Range**: 200 (Portal targeting)

**Description**: Détruit automatiquement le tourbillon le plus proche de la position ciblée. **Version réécrite avec détection optimisée**.

**Fonctionnalités**:

- **Détection**: Recherche dans un rayon de 1.5 cases
- **Ciblage**: Rouge pour indiquer la destruction
- **Suppression**: Immédiate avec animation de destruction
- **Mode**: Silencieux (pas de notifications)

## 🎯 Exemples d'Usage

### Bubbles - Usage Standard

1. Sélectionner le token d'Ora (position détectée automatiquement)
2. Activer la macro Bubbles
3. **Information de position affichée** dans les titres de dialogue
4. Choisir le type d'élément (Eau/Glace/Huile/Eau Vivante)
5. Examiner les informations de dégâts spécifiques à la position (maximisé en Position Offensive)
6. Entrer les bonus manuels de dégâts/attaque
7. Cibler la première position (peut se cibler soi-même pour Eau Vivante)
8. Pour les variantes de dégâts : Choisir une deuxième cible ou la même cible
9. Observer l'animation et vérifier le chat pour les résultats avec information de position

### Tourbillon - Usage Standard

1. Sélectionner le token d'Ora (position détectée automatiquement)
2. Activer la macro Tourbillon
3. Choisir le type (Simple/Divisé) et la protection (sauf Position Focus)
4. Entrer les bonus manuels de dégâts/attaque
5. Cibler les positions pour les tourbillons
6. Observer l'animation et vérifier le chat pour les résultats
7. Utiliser Tourbillon Destroyer pour supprimer les effets plus tard

## 🔮 Format Standard - Nouvelles Fonctionnalités

**Toutes les macros d'Ora utilisent maintenant le format standard des sorts de Léo** :

### Structure de Configuration

- **Configuration centralisée** en haut de chaque macro
- **Animations configurables** avec paramètres ajustables
- **Ciblage standardisé** via Portal avec couleurs spécifiques
- **Calculs de dégâts uniformes** avec support des positions de combat

### Améliorations Techniques

- **Détection de position automatique** : Focus/Offensif/Défensif via Active Effects
- **Gestion des bonus d'effets actifs** : Intégration complète des bonus d'effets
- **Calculs de blessures** : Ajustement automatique des caractéristiques
- **Messages de chat enrichis** : HTML formaté avec informations de position
- **Validation robuste** : Vérifications d'entrée et gestion d'erreurs

### Notes Spéciales

- **Détection de Position** : Détecte automatiquement Focus/Offensif/Défensif depuis les Active Effects
- **Position Offensive** : Les dés de dégâts sont maximisés (6 + bonus de caractéristique), affiché comme "MAXIMISÉ"
- **Position Focus** : Eau/Glace/Huile deviennent gratuits, Eau Vivante coûte 2 mana
- **Eau Vivante** : Seule variante de soin, projectile unique, peut se cibler soi-même
- **Affichage de Position** : Position actuelle montrée dans les titres de dialogue et la sortie de chat
- **Auto-Ciblage** : Pour Eau Vivante, cliquer dans un rayon de 50 pixels de son token pour se soigner
- **Formule de Dégâts** : `1d6 + (Esprit + bonus)/2` ou maximisé en Position Offensive

## 🎯 RPG Compliance Features

### Turn-Based Integration

- **Combat State**: Can be adapted to check active combat
- **Turn Validation**: Framework ready (currently bypassed per requirements)
- **Initiative Order**: Compatible with Carousel Combat Track

### Character Sheet Integration

- **Damage Calculation**: Uses proper 1d6 + Esprit formula
- **Stat Dependencies**: References Esprit characteristic
- **Resource Management**: Ready for mana cost integration
- **Effect Tracking**: Element effects clearly displayed

### Game Mechanics Compliance

- **Targeting System**: Uses proper crosshair selection
- **Damage Display**: Shows formula and results in chat
- **Element Effects**: Follows RPG tactical combat rules
- **Visual Feedback**: Clear spell casting and impact animations

## 🔮 Development Notes

### Future Enhancements

- **Mana Cost Integration**: Deduct spell cost from character resources with focus stance detection
- **Turn Validation**: Add combat state checking when needed
- **Stance Integration**: Modify effects based on active combat stance
- **Duration Tracking**: Track element effect durations
- **Living Water Enhancements**: Potential over-healing mechanics or additional effects

### Technical Implementation

- **Async/Await Pattern**: Proper handling of user input and targeting
- **Error Handling**: Validates requirements and provides clear feedback
- **Sequencer Integration**: Uses proper effect timing and synchronization
- **Portal Targeting**: Implements crosshair system for precise targeting

### Testing Guidelines

1. Test with different element choices
2. Verify single vs dual targeting
3. Check damage calculation accuracy
4. Validate visual effect timing
5. Confirm chat message formatting

## 🤝 Contributing Additional Spells

When adding new spells for Ora:

1. **Follow RPG Rules**: Reference [GAME-RULES.md](../../../GAME-RULES.md)
2. **Use Esprit Stat**: Primary characteristic for water magic
3. **Include Element Variations**: Water, ice, oil themes
4. **Add Chat Output**: Display damage and effects clearly
5. **Test Thoroughly**: Verify all targeting scenarios
6. **Document Effects**: Clear descriptions of tactical benefits

### Tourbillon (Vortex)

**Files**: `tourbillon.js` + `tourbillon-destroy.js`
**Type**: Area control / Battlefield manipulation
**Mana Cost**: Stance-dependent (4 mana standard, FREE in Focus stance)
**Range**: Portal targeting (150 units)

**Description**: Creates persistent water vortices that trap and damage targets while providing tactical battlefield control options. **Enhanced with token attachment and smooth destruction effects.**

**Vortex Configuration**:

- **Single Vortex**: 2d6 + Esprit damage when traversed (one powerful vortex)
- **Divided Vortices**: 1d6 + Esprit/2 damage each (two smaller vortices)

**Advanced Features** ✨:

- **Token Attachment**: Vortices attach to targeted tokens and move with them
- **Adaptive Scaling**: Effects scale based on target token size (30% larger than token)
- **Smart Positioning**: Effects appear under tokens, not over them
- **Smooth Destruction**: 3-second fade-out with water splash effects
- **Visual Polish**: Professional impact and splash animations

**Tactical Effects**:

- **Protection**: Can block piercing damage (optional choice except in Focus stance)
- **Vision Blocking**: Cuts line of sight (managed manually)
- **Mobile Control**: Vortices follow attached tokens as they move
- **Escape Mechanism**: Agility roll to traverse without damage (costs movement action)
- **Persistent Duration**: Remains until destroyed or traversed

**Combat Stance Integration** ⚔️:

- **Focus Stance**: FREE mana cost, protection ALWAYS active (no choice)
- **Offensive Stance**: 4 mana, damage dice MAXIMIZED
- **Defensive/No Stance**: 4 mana, normal mechanics, protection optional

**Damage Application**:
Applied immediately on cast (simulates movement through vortex). Use `tourbillon-destroy.js` to handle traversal/destruction mechanics.

**Management System**:

- **Creation**: `tourbillon.js` - Creates persistent, scalable vortex effects with token attachment
- **Destruction**: `tourbillon-destroy.js` - Portal targeting with smooth fade-out and splash effects
- **Visual Persistence**: Effects remain active and follow tokens until manually removed

**RPG Integration**:

- ✅ **Automatic stance detection** with stance-specific mechanics
- ✅ **Portal targeting system** for precise placement
- ✅ **Token attachment system** for mobile battlefield control
- ✅ **Adaptive visual scaling** based on target size
- ✅ **Persistent Sequencer effects** with fadeOut configured at creation
- ✅ **Streamlined destruction** with visual feedback
- ✅ **Professional chat output** with tactical information
- ✅ **Stance-specific protection rules** (Focus always blocks, others optional)
- ✅ **Injury-adjusted stat calculations** for Esprit and Agility

**Required Modules**:

- Sequencer (persistent effects)
- JB2A (vortex visuals)
- Portal (targeting system)

**Usage Workflow**:

1. **Creation**: Run `tourbillon.js`, configure vortex type and protection, target positions
2. **Management**: Vortices persist, scale to targets, and follow tokens if attached
3. **Destruction**: Run `tourbillon-destroy.js`, use Portal targeting for precise selection
4. **Visual Feedback**: Smooth fade-out with water splash indicates successful destruction

### Bubble Spam

**File**: `bubbleSpam.js`
**Type**: Rapid-fire utility / Animation testing
**Mana Cost**: None (utility macro)
**Range**: Unlimited (direct canvas clicking)

**Description**: Streamlined rapid-fire bubble shooting for testing animations or battlefield fun. **Ultra-responsive spam-click interface.**

**Features** 🎯:

- **No Prompts**: Immediate activation, no configuration dialogs
- **Direct Canvas Clicking**: Click anywhere to shoot bubbles instantly
- **Rapid Fire**: Non-blocking animations allow immediate consecutive shots
- **Visual Feedback**: Water bubble projectiles with blue explosion impacts
- **Continuous Mode**: Keeps firing until ESC key pressed
- **Zero Latency**: Fastest possible response time for spam clicking

**Usage**:

1. **Select character token**
2. **Run macro** → Immediate activation
3. **Click anywhere** → Bubbles shoot from character to click point
4. **Spam click rapidly** → Multiple bubbles flying simultaneously
5. **Press ESC** → Exit spam mode

**Technical Features**:

- ✅ **Event-driven architecture** for maximum responsiveness
- ✅ **Direct coordinate conversion** without Portal delays
- ✅ **Clean event listener management** with proper cleanup
- ✅ **Non-blocking animations** for true rapid fire capability
- ✅ **Unlimited range and targets** for maximum flexibility

**Required Modules**:

- Sequencer (animations)
- JB2A (bubble effects)

**Perfect For**:

- Animation testing and demonstration
- Quick visual effects during gameplay
- Stress testing Sequencer performance
- Player entertainment and spell practice

### Spell Ideas for Future Development

- **Water Shield**: Defensive barrier with damage reduction
- **Ice Shards**: Area effect with slowing properties
- **Oil Slick**: Ground effect creating fire vulnerability zone
- **Tidal Wave**: Line attack affecting multiple targets
- **Freezing Mist**: Area denial with movement restriction
- **Healing Spring**: Area healing over time (upgrade to Living Water concept)
- **Elemental Burst**: Combination spell using multiple elements

---

_Harness the power of water, ice, and oil to control the battlefield! 🌊_
