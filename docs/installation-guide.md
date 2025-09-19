# Installation and Setup Guide for Custom RPG System

This guide will help you set up FoundryVTT with all required modules for the custom RPG spell animation collection, including the specific combat and character sheet integrations.

## 🎯 Custom RPG Context

This installation guide is specifically tailored for our custom RPG system. Unlike generic FoundryVTT setups, this installation includes:
- **Turn-based combat integration** (Carousel Combat Track)
- **Character sheet resource management** (mana/power and health tracking)
- **Spell targeting systems** (Warp Gate integration)
- **Custom combat stances** (integration points for future automation)

> **Important**: Read [GAME-RULES.md](../GAME-RULES.md) to understand the RPG context before installation.

## Prerequisites

- **FoundryVTT version 10 or higher** (version 11+ recommended)
- **GM or Assistant GM privileges** to install modules
- **Understanding of custom RPG mechanics** (see GAME-RULES.md)
- **Character sheet setup** for 6-stat system and resource tracking

## Step 1: Install Core Animation Modules

### Sequencer Module (Essential)

#### Method 1: Module Browser (Recommended)
1. In FoundryVTT, go to **Settings** → **Manage Modules**
2. Click **Install Module**
3. Search for "Sequencer"
4. Click **Install** on "Sequencer" by Fantasy Computerworks

#### Method 2: Direct URL
1. In FoundryVTT, go to **Settings** → **Manage Modules**
2. Click **Install Module**
3. Paste this URL in the Manifest URL field:
   ```
   https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json
   ```
4. Click **Install**

### Warp Gate Module (Essential for Spell Targeting)

1. In the module browser, search for "Warp Gate"
2. Install "Warp Gate" by honeybadger
3. **Purpose**: Required for crosshair targeting system used in spell animations

### Carousel Combat Track (Essential for RPG System)

1. Search for "carousel" or "combat track" in the module browser
2. Install "Combat Carousel" or similar combat tracking module
3. **Purpose**: Manages turn order for our custom RPG combat system
4. **Documentation**: Check [Carousel Combat Track Documentation](https://wiki.theripper93.com/free/combat-tracker-dock) for latest info

> **Critical**: All three modules above are **required** for proper RPG integration.

## Step 2: Install Visual Effect Packages

### JB2A - Jules&Ben's Animated Assets (Essential)

**Free Version:**
1. Search for "JB2A" in the module browser
2. Install "JB2A - Jules&Ben's Animated Assets (Free)"
3. **Coverage**: Provides 95% of effects used in our spell collection

**Patreon Version (Recommended for Enhanced Effects):**
1. Subscribe to [JB2A Patreon](https://www.patreon.com/JB2A)
2. Download the module files
3. Extract to your FoundryVTT modules folder
4. **Benefits**: Additional high-quality effects for character-specific spells

### Optional Enhancement Modules

**Animated Spell Effects:**
1. Search for "animated-spell-effects" in module browser
2. Install "Jack Kerouac's Animated Spell Effects"
3. **Usage**: Used in only one macro (`acid-splash.js`)

**Cartoon Spell Effects:**
1. Search for "animated-spell-effects-cartoon"
2. Install "Jack Kerouac's Animated Cartoon Spell Effects"
3. **Usage**: Alternative visual style for some effects

## Step 3: Enable Modules for RPG System

1. Go to **Settings** → **Manage Modules**
2. Enable the following modules **in order**:
   
   **Priority 1 (Essential):**
   - ✅ Sequencer
   - ✅ JB2A - Jules&Ben's Animated Assets
   - ✅ Warp Gate
   - ✅ Carousel Combat Track (or your combat tracker)
   
   **Priority 2 (Recommended):**
   - 🔸 JB2A Patreon (if subscribed)
   
   **Priority 3 (Optional):**
   - 🔹 Jack Kerouac's Animated Spell Effects
   - 🔹 Jack Kerouac's Animated Cartoon Spell Effects

3. Click **Save Module Settings**
4. **Refresh** your browser or **restart** FoundryVTT

> **Note**: Enable modules in the order listed to avoid dependency conflicts.

## Step 4: Configure RPG System Integration

### Character Sheet Setup

#### Resource Configuration
1. **Create/Edit Character Actors**
2. **Configure Resources** in character sheets:
   - **Primary Resource**: "power" (represents mana)
   - **Secondary Resource**: "health" (hit points)
   - **Attributes**: Set up 6 core stats:
     - Force, Dexterité, Agilité, Esprit, Sens, Volonté, Charisme

#### Character Sheet Example
```json
{
  "resources": {
    "power": {
      "value": 50,
      "max": 50,
      "label": "Mana"
    },
    "health": {
      "value": 100,
      "max": 100,
      "label": "Health"
    }
  },
  "attributes": {
    "force": { "value": 7 },
    "dexterite": { "value": 5 },
    "agilite": { "value": 8 },
    "esprit": { "value": 6 },
    "sens": { "value": 5 },
    "volonte": { "value": 7 },
    "charisme": { "value": 4 }
  }
}
```

### Combat Tracker Configuration

#### Carousel Combat Track Setup
1. **Configure Turn Order**: Set up initiative system
2. **Token Integration**: Ensure tokens link to character sheets
3. **Combat States**: Configure for turn-based mechanics
4. **API Access**: Verify spell macros can access combat state

> **Important**: Character sheet structure must match RPG requirements for proper resource tracking.

### Targeting System Configuration

#### Warp Gate Settings
1. **Crosshair Options**: Configure targeting templates
2. **Permission Settings**: Set player targeting permissions
3. **Integration Testing**: Test crosshair functionality

## Step 5: Verify RPG Integration

### Test Basic Spell Animation
1. Create a new macro (click empty hotbar slot)
2. Set type to **Script**
3. Paste this RPG-adapted test code:
```javascript
// Test spell animation with RPG context
if (!canvas.tokens.controlled.length) {
    ui.notifications.warn("Please select a caster token.");
    return;
}

let caster = canvas.tokens.controlled[0];
new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(caster)
        .scale(1.0)
    .sound()
        .file("assets/sounds/spell-cast.wav") // Add custom sound
        .volume(0.3)
    .play();

ui.notifications.info("Spell animation complete - handle mana cost manually.");
```
4. Select a token on the canvas
5. Execute the macro
6. You should see an orange explosion with notification

### Test Spell Targeting System
```javascript
// Test Warp Gate crosshair targeting
async function testSpellTargeting() {
    if (typeof warpgate === "undefined") {
        ui.notifications.error("Warp Gate module required for targeting.");
        return;
    }
    
    const crosshairs = await warpgate.crosshairs.show({
        size: 1,
        icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
        label: "Select Spell Target"
    });
    
    if (crosshairs.cancelled) {
        ui.notifications.info("Spell targeting cancelled.");
        return;
    }
    
    new Sequence()
        .effect()
            .file("jb2a.magic_missile")
            .atLocation(canvas.tokens.controlled[0])
            .stretchTo(crosshairs)
        .play();
}

testSpellTargeting();
```

### Test Combat Integration
```javascript
// Test combat state access for RPG integration
if (game.combat?.current) {
    let activeToken = game.combat.current.token;
    ui.notifications.info(`Current turn: ${activeToken.name}`);
    
    // Test if selected token matches active combatant
    let selectedToken = canvas.tokens.controlled[0];
    if (selectedToken?.id === activeToken?.id) {
        ui.notifications.success("Ready to cast spell on your turn!");
    } else {
        ui.notifications.warn("Wait for your turn to cast spells.");
    }
} else {
    ui.notifications.info("No active combat - testing mode.");
}
```

### Open Sequencer Database
1. Open the **Sequencer Database Viewer** (check Tools menu)
2. Browse available effects by category
3. Test playing effects directly from the viewer
4. **Note effects suitable for RPG spells** (fire, ice, lightning, etc.)

### Verify Character Sheet Access
```javascript
// Test character sheet resource access
let actor = canvas.tokens.controlled[0]?.actor;
if (actor) {
    let mana = actor.system.resources.power?.value || 0;
    let health = actor.system.resources.health?.value || 0;
    ui.notifications.info(`Mana: ${mana}, Health: ${health}`);
} else {
    ui.notifications.warn("No character selected for resource check.");
}
```

## Step 6: Configure RPG-Specific Settings (Optional)

### Sequencer Settings for RPG
Go to **Settings** → **Module Settings** → **Sequencer**:

- **Enable Debug Mode**: Turn on for spell development/troubleshooting
- **Default Volume**: Set spell sound volume (0.3-0.5 recommended)
- **Show Player Controls**: Allow players to use spell targeting tools
- **Database Integration**: Ensure JB2A effects are properly indexed

### Warp Gate Settings for Spell Targeting
Go to **Settings** → **Module Settings** → **Warp Gate**:

- **Crosshair Permissions**: Configure who can use targeting
- **Template Settings**: Set default spell targeting templates
- **Player Access**: Allow players to target with their spells

### Combat Tracker Settings
Configure Carousel Combat Track for RPG mechanics:

- **Turn Order Display**: Show initiative order clearly
- **Active Player Highlighting**: Clear indication of current turn
- **API Access**: Enable macro access to combat state
- **Turn Notifications**: Alert players when their turn begins

### Performance Settings for Spell-Heavy Sessions
For optimal performance during spell-intensive combat:
- **Effect Quality**: Medium to high for spell clarity
- **Simultaneous Effects**: Limit to 3-5 concurrent animations
- **Audio Buffer**: Increase for better spell sound synchronization
- **Memory Management**: Enable automatic cleanup of old effects

## Common Installation Issues for RPG System

### Module Not Loading
**Problem**: Required modules don't appear in module list
**Solution**: 
- Check FoundryVTT version compatibility (v10+ required)
- Verify internet connection during install
- Try manual download and installation
- **For Carousel Combat Track**: Search for alternative combat tracker modules

### RPG Integration Failures
**Problem**: Character sheet resources not accessible
**Solution**:
- Verify character sheet structure matches RPG requirements
- Check resource names: "power" for mana, "health" for HP
- Ensure character sheets are properly linked to tokens
- Test resource access with simple macros

### Spell Effects Not Found
**Problem**: "File not found" errors when running spell macros
**Solution**:
- Ensure JB2A module is enabled and loaded
- Check file paths in Sequencer Database Viewer
- Update spell macro paths to match installed modules
- Verify JB2A Free vs Patreon version compatibility

### Targeting System Issues
**Problem**: `warpgate.crosshairs.show()` not working
**Solution**:
- Ensure Warp Gate module is installed and enabled
- Check module permissions for players
- Test basic crosshair functionality first
- Update to latest Warp Gate version

### Combat Tracker Integration
**Problem**: Turn order not accessible from spell macros
**Solution**:
- Verify combat tracker module is properly configured
- Test basic combat state access
- Check API compatibility with installed combat module
- Consider alternative combat tracking solutions

### Performance Issues During Spell Combat
**Problem**: Game slows down with multiple spell effects
**Solution**:
- Reduce spell effect quality and duration
- Limit simultaneous spell animations
- Use cleanup functions to remove persistent effects
- Consider hardware upgrade for complex spell sequences

## File Path Reference for Spell Effects

### JB2A Free Edition
```
modules/jb2a_patreon/Library/[Category]/[Effect]/[EffectName].webm

Examples:
modules/jb2a_patreon/Library/Generic/Explosion/Explosion_01_Orange_400x400.webm
modules/jb2a_patreon/Library/Cantrip/Fire_Bolt/FireBolt_01_Orange_Projectile_400x400.webm
```

### JB2A Patreon Edition
```
modules/JB2A_DnD5e/Library/[Category]/[Effect]/[EffectName].webm

Examples:
modules/JB2A_DnD5e/Library/1st_Level/Magic_Missile/MagicMissile_01_Blue_d4_Projectile_400x400.webm
modules/JB2A_DnD5e/Library/2nd_Level/Scorching_Ray/ScorchingRay_01_Orange_Projectile_400x400.webm
```

### Custom RPG Spell Sounds
```
assets/sounds/[spell-category]/[sound-name].wav

Examples:
assets/sounds/fire-spells/fireball-cast.wav
assets/sounds/ice-spells/frost-bolt.wav
assets/sounds/healing/heal-spring.wav
assets/sounds/shadow/darkness-cloud.wav
```

### Animated Spell Effects (Optional)
```
modules/animated-spell-effects/spell-effects/[element]/[spell-name].webm
modules/animated-spell-effects-cartoon/spell-effects/cartoon/[element]/[spell-name].webm
```

## Testing Your RPG Setup

### Basic Spell Animation Test
```javascript
// Test basic spell with RPG context
async function testBasicSpell() {
    if (!canvas.tokens.controlled.length) {
        ui.notifications.warn("Select a caster token first.");
        return;
    }
    
    let caster = canvas.tokens.controlled[0];
    
    new Sequence()
        .effect()
            .file("jb2a.magic_missile")
            .atLocation(caster)
            .scale(1.0)
        .sound()
            .file("assets/sounds/spell-cast.wav")
            .volume(0.3)
        .play();
        
    // Note: Mana cost handled separately in RPG system
    ui.notifications.info("Basic spell animation test complete.");
}

testBasicSpell();
```

### Spell Targeting Test
```javascript
// Test crosshair targeting for spells
async function testSpellTargeting() {
    if (typeof warpgate === "undefined") {
        ui.notifications.error("Warp Gate required for spell targeting.");
        return;
    }
    
    const target = await warpgate.crosshairs.show({
        size: 1,
        icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
        label: "Target Spell Location"
    });
    
    if (target.cancelled) return;
    
    new Sequence()
        .effect()
            .file("jb2a.explosion.01.orange")
            .atLocation(target)
            .scale(1.2)
        .play();
        
    ui.notifications.success("Spell targeting test successful!");
}

testSpellTargeting();
```

### RPG Combat Integration Test
```javascript
// Test combat state integration
function testCombatIntegration() {
    if (!game.combat?.current) {
        ui.notifications.warn("Start combat to test turn integration.");
        return;
    }
    
    let activeCombatant = game.combat.current;
    let selectedToken = canvas.tokens.controlled[0];
    
    if (selectedToken?.id === activeCombatant.token?.id) {
        ui.notifications.success(`${activeCombatant.name}'s turn - ready to cast!`);
        
        // Test character resource access
        let actor = selectedToken.actor;
        if (actor?.system?.resources?.power) {
            let mana = actor.system.resources.power.value;
            ui.notifications.info(`Current mana: ${mana}`);
        }
    } else {
        ui.notifications.warn("Not your turn - wait to cast spells.");
    }
}

testCombatIntegration();
```

### Character-Specific Spell Test
```javascript
// Test character-specific spell (example: Ora's Frost Bolt)
async function testCharacterSpell() {
    let caster = canvas.tokens.controlled[0];
    if (!caster) {
        ui.notifications.warn("Select Ora's token to test frost bolt.");
        return;
    }
    
    // Test targeting
    const target = await warpgate.crosshairs.show({
        size: 1,
        icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm"
    });
    
    if (target.cancelled) return;
    
    // Frost Bolt animation sequence
    new Sequence()
        .effect()
            .file("jb2a.ice_shard.01.blue")
            .atLocation(caster)
            .stretchTo(target)
            .scale(1.2)
            .waitUntilFinished(-200)
        .effect()
            .file("jb2a.impact.ice.blue")
            .atLocation(target)
            .scale(0.8)
        .sound()
            .file("assets/sounds/ice-spells/frost-bolt.wav")
            .volume(0.4)
        .play();
        
    ui.notifications.info("Frost Bolt cast - deduct mana manually.");
}

testCharacterSpell();
```

## Next Steps for RPG Integration

1. **Understand the RPG System**: Read [GAME-RULES.md](../GAME-RULES.md) thoroughly
2. **Set up Character Sheets**: Configure resources and stats for all characters
3. **Test Spell Collection**: Try existing spell macros from each category
4. **Configure Combat**: Set up Carousel Combat Track for turn-based play
5. **Create Custom Spells**: Follow [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines
6. **Join Development**: Contribute RPG-specific spell animations

## Essential RPG Resources

- **[GAME-RULES.md](../GAME-RULES.md)**: Complete RPG mechanics and rules
- **[CONTRIBUTING.md](../CONTRIBUTING.md)**: How to add new spell animations
- **[Best Practices](./best-practices.md)**: RPG-specific development guidelines
- **Character Guides**: Detailed spell documentation in `/macros/characters/`

## External Documentation

- **[Sequencer Wiki](https://fantasycomputer.works/FoundryVTT-Sequencer)**: Core animation system
- **[JB2A Discord](https://discord.gg/A59GAZwB9M)**: Visual effect resources
- **[Carousel Combat Track](https://wiki.theripper93.com/free/combat-tracker-dock)**: Turn order system
- **[FoundryVTT Character Sheets](https://foundryvtt.com/article/actors/)**: Resource management
- **[Warp Gate Documentation](https://github.com/trioderegion/warpgate)**: Targeting system

## Troubleshooting RPG Integration

### RPG-Specific Issues

#### Character Sheet Problems
**Issue**: Resources not accessible from spell macros
**Solution**:
```javascript
// Debug character sheet structure
let actor = canvas.tokens.controlled[0]?.actor;
console.log("Actor resources:", actor?.system?.resources);
console.log("Actor attributes:", actor?.system?.attributes);
```

#### Combat Integration Problems
**Issue**: Turn order not working with spell animations
**Solution**:
```javascript
// Debug combat state
console.log("Combat active:", game.combat?.started);
console.log("Current combatant:", game.combat?.current);
console.log("Turn ID:", game.combat?.current?.tokenId);
```

#### Spell Targeting Issues
**Issue**: Crosshair targeting not working
**Solution**:
- Verify Warp Gate module version compatibility
- Test with basic crosshair setup first
- Check player permissions for targeting

### General Troubleshooting
If you encounter issues:
1. **Check browser console (F12)** for specific error messages
2. **Verify all required modules** are installed and enabled
3. **Test with minimal module setup** to isolate conflicts
4. **Consult [GAME-RULES.md](../GAME-RULES.md)** for RPG-specific context
5. **Ask GameMaster** for rule clarifications if needed
6. **Report bugs** following [CONTRIBUTING.md](../CONTRIBUTING.md) guidelines

### Important Backup Reminder
**Always back up your world before:**
- Installing new modules
- Testing complex spell macros
- Making character sheet changes
- Configuring combat systems

---

*Remember: This setup is specifically for our custom RPG system. Enjoy casting spells with amazing animations! ⚡🎲*