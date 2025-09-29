# Sequencer Spell Animation Best Practices for Custom RPG

This guide outlines best practices for developing effective, maintainable, and performant FoundryVTT spell animation macros specifically for our custom RPG system using the Sequencer module.

## 🎲 RPG-Specific Development Guidelines

### Understanding the RPG Context

Before developing any spell animation, you must understand:

- **Custom RPG rules**: Read [GAME-RULES.md](../GAME-RULES.md) completely
- **7-stat system**: Physique, Dextérité, Agilité, Esprit, Sens, Volonté, Charisme
- **Character statistics**: Use utility functions from `/macros/utilities/character-stats.js` for injury-adjusted values
- **Combat stances**: Fully implemented with utility functions in `/macros/utilities/stance-detection.js`
- **Turn-based mechanics**: Integration with Carousel Combat Track
- **Portal targeting**: Advanced crosshair system via `/macros/utilities/portal-targeting.js`
- **Animation scope**: Visual effects with comprehensive RPG integration (see bubbles.js)
- **Tested implementation**: Reference bubbles.js for proven RPG-compliant pattern

### GameMaster Authority

> **CRITICAL**: When in doubt about RPG mechanics or rule interpretation, **always consult the GameMaster**.

#### When to Consult GameMaster:

- ❓ **Rule interpretation**: Unclear how a spell mechanic should work
- 🆕 **New spell concepts**: Creating spells not yet defined
- 🎨 **Visual design**: Appropriate visual style for spell effects
- ⚖️ **Balance concerns**: Whether spell animations are too intense/distracting
- 🔧 **Automation decisions**: How much automation is appropriate

#### How to Consult:

1. Create GitHub issue with `[GameMaster Review]` label
2. Provide clear context and specific questions
3. Offer potential solutions/interpretations
4. Wait for approval before implementing

## Spell Animation Code Organization

### RPG-Specific File Naming

- **Spell type prefix**: `frost-bolt.js`, `shadow-step.js`, `healing-spring.js`
- **Character specific**: `ora-blizzard.js`, `moctei-void-prison.js`
- **Stance variants**: `fireball-offensive.js`, `heal-defensive.js` (if applicable)
- **Use kebab-case**: `chain-lightning-spell.js` not `ChainLightningSpell.js`

### Spell Macro Structure Template

```javascript
/**
 * [SPELL NAME] - Custom RPG Spell Animation
 *
 * RPG-COMPLIANT SPELL for Custom RPG System
 *
 * Description: [Visual effect description and RPG context]
 * Associated Stat: [Which of 7 stats this spell uses - Physique/Dextérité/Agilité/Esprit/Sens/Volonté/Charisme]
 * Stance Compatibility: [How different stances affect this spell - see bubbles.js for example]
 * Target Type: [Single/Multiple/Area/Self]
 * Character: [Generic/Ora/Moctei/etc.]
 * Mana Cost: [Base cost and stance modifications]
 * Damage: [Formula with stance effects - e.g., 1d6 + (Esprit + bonus)/2, maximized in Offensive]
 *
 * Requirements:
 * - Sequencer module
 * - JB2A effects
 * - Portal module (for targeting)
 * - Carousel Combat Track (for turn validation - optional)
 *
 * RPG Integration:
 * - Full stance detection and mana cost calculation
 * - Character stat integration with injury adjustments
 * - Professional damage calculation and chat output
 * - Portal crosshair targeting system
 * - Element selection with game effects
 *
 * Usage Pattern: Copy functions from /macros/utilities/ for consistent RPG integration
 *
 * @author [Your Name]
 * @version 1.0
 * @tested_on_server [Date if tested]
 * @gamemaster_approved [Date of approval if required]
 */

// === MODERN RPG INTEGRATION PATTERN (Copy from utilities) ===

(async () => {
  // 1. VALIDATION - Copy from actor-validation.js
  function validateSpellCasterWithAttributes() {
    /* utility function */
  }

  const validation = validateSpellCasterWithAttributes();
  if (!validation) return;
  const { caster, actor } = validation;

  // 2. STANCE DETECTION - Copy from stance-detection.js
  function getStanceInfo(actor) {
    /* utility function */
  }
  function calculateStanceManaCost(stance, baseCost, isFocusable) {
    /* utility function */
  }

  const { stance, stanceName, stanceDisplay } = getStanceInfo(actor);
  const manaCostInfo = calculateStanceManaCost(stance, 4, true);

  // 3. CHARACTER STATS - Copy from character-stats.js
  function getEspritStat(actor) {
    /* utility function */
  }

  const { baseStat, injuryStacks, adjustedStat } = getEspritStat(actor);

  // 4. ELEMENT SELECTION - Copy from element-selection.js
  function createBasicElementDialog(stance, manaCostInfo) {
    /* utility function */
  }

  const element = await createBasicElementDialog(
    stance,
    manaCostInfo.description
  );
  if (!element) return;

  // 5. TARGETING - Copy from portal-targeting.js
  function selectSingleTarget(casterToken, options) {
    /* utility function */
  }

  const target = await selectSingleTarget(caster);
  if (!target) return;

  // 6. ACTOR DETECTION - Copy from actor-detection.js
  function getActorAtLocation(targetX, targetY, tolerance) {
    /* utility function */
  }

  const actorInfo = getActorAtLocation(target.x, target.y);

  // 7. DAMAGE CALCULATION - Copy from damage-calculation.js
  function getBonusDialog(espritStat, spellLevel, stance, isHealing) {
    /* utility function */
  }
  function calculateStanceDamage(stance, espritStat, damageBonus, isHealing) {
    /* utility function */
  }

  const bonuses = await getBonusDialog(adjustedStat, 1, stance, false);
  if (!bonuses) return;
  const damage = await calculateStanceDamage(
    stance,
    adjustedStat,
    bonuses.damageBonus,
    false
  );

  // 8. SPELL ANIMATION
  new Sequence()
    .effect()
    .file("jb2a.your_effect.webm")
    .atLocation(target)
    .play();

  // 9. CHAT MESSAGE - Copy from chat-formatting.js
  function createSpellResultMessage(messageData, caster) {
    /* utility function */
  }

  const messageData = {
    spellName: "Your Spell",
    damages: [damage],
    targetActors: [actorInfo],
    stance: stance,
  };
  await createSpellResultMessage(messageData, caster);
})();
```

## RPG-Specific Error Handling and Validation

### Turn Order Validation

```javascript
// Check if it's player's turn (optional for some spells)
function validatePlayerTurn(caster, enforceOrder = true) {
  if (!enforceOrder || !game.combat?.started) {
    return true; // Allow casting outside combat or when not enforcing
  }

  const activeCombatant = game.combat.current;
  if (activeCombatant?.token?.id !== caster.id) {
    ui.notifications.warn(`Wait for ${caster.name}'s turn to cast spells!`);
    return false;
  }

  return true;
}

// Usage in spell macros
const caster = canvas.tokens.controlled[0];
if (!validatePlayerTurn(caster, ENFORCE_TURN_ORDER)) {
  return;
}
```

### Character Resource Validation

```javascript
// Check character sheet resources (for display/reminders)
function checkCharacterResources(actor, requiredMana = 0) {
  if (!actor?.system?.resources) {
    ui.notifications.warn(
      "Character sheet not properly configured for RPG system!"
    );
    return false;
  }

  const currentMana = actor.system.resources.power?.value || 0;
  const currentHealth = actor.system.resources.health?.value || 0;

  if (requiredMana > 0 && currentMana < requiredMana) {
    ui.notifications.warn(
      `Insufficient mana! Need ${requiredMana}, have ${currentMana}.`
    );
    return false;
  }

  // Display current resources for manual tracking
  ui.notifications.info(
    `Current: ${currentMana} mana, ${currentHealth} health`
  );
  return true;
}

// Usage in spell macros
const caster = canvas.tokens.controlled[0];
if (!checkCharacterResources(caster.actor, SPELL_MANA_COST)) {
  return;
}
```

### Spell Targeting Validation

```javascript
// RPG-specific targeting validation
async function getSpellTarget(config = {}) {
  const {
    requireTarget = true,
    allowMultiple = false,
    maxRange = null,
    spellName = "spell",
  } = config;

  if (requireTarget && !game.user.targets.size) {
    ui.notifications.warn(`Select target(s) for ${spellName}!`);
    return null;
  }

  const targets = Array.from(game.user.targets);

  if (!allowMultiple && targets.length > 1) {
    ui.notifications.warn(`${spellName} can only target one enemy!`);
    return null;
  }

  // Check range if specified (for future range validation)
  if (maxRange && caster) {
    const distance = canvas.grid.measureDistance(caster, targets[0]);
    if (distance > maxRange) {
      ui.notifications.warn(
        `Target too far! Range: ${maxRange} squares, Distance: ${Math.round(
          distance
        )}`
      );
      return null;
    }
  }

  return allowMultiple ? targets : targets[0];
}
```

### Character-Specific Validation

```javascript
// Validate character-specific spells
function validateCharacterSpell(actor, requiredCharacter) {
  const characterName = actor?.name?.toLowerCase() || "";

  if (!characterName.includes(requiredCharacter.toLowerCase())) {
    ui.notifications.warn(`This spell is specific to ${requiredCharacter}!`);
    return false;
  }

  return true;
}

// Usage for character-specific spells
if (!validateCharacterSpell(caster.actor, "Ora")) {
  return; // Only Ora can cast ice spells
}
```

## RPG Performance Optimization

### Spell Animation Timing for Turn-Based Combat

```javascript
// Keep spell animations concise for turn-based flow
const SPELL_TIMING = {
  QUICK_CAST: 1500, // Basic spells (1.5 seconds)
  NORMAL_CAST: 3000, // Standard spells (3 seconds)
  EPIC_CAST: 5000, // Powerful spells (5 seconds max)
  COUNTER_WINDOW: 2000, // Time for counter-spells
};

// Example: Quick combat spell
new Sequence()
  .effect()
  .file("jb2a.magic_missile")
  .atLocation(caster)
  .stretchTo(target)
  .duration(SPELL_TIMING.QUICK_CAST)
  .play();
```

### Stance-Aware Performance

```javascript
// Future: Adjust effects based on combat stance
function getStanceEffectScale(stance) {
    switch(stance) {
        case "offensive": return 1.3; // Larger, more aggressive effects
        case "defensive": return 0.8; // Subtle, conservative effects
        case "focus": return 1.0;     // Standard effects
        default: return 1.0;
    }
}

// Usage (when stance detection is implemented)
.effect()
    .file("jb2a.fireball.explosion.orange")
    .scale(getStanceEffectScale(currentStance))
```

### Multiple Target Optimization

```javascript
// Optimized multi-target spells for RPG system
function createMultiTargetSpell(caster, targets, effectConfig) {
  let sequence = new Sequence();

  // Limit simultaneous effects for performance
  const maxSimultaneous = 5;
  const staggerDelay = 150; // Milliseconds between targets

  targets.slice(0, maxSimultaneous).forEach((target, index) => {
    sequence
      .effect()
      .file(effectConfig.projectile)
      .atLocation(caster)
      .stretchTo(target)
      .duration(1000)
      .wait(index * staggerDelay)
      .effect()
      .file(effectConfig.impact)
      .atLocation(target)
      .delay(1000 + index * staggerDelay)
      .scale(0.8);
  });

  return sequence;
}
```

### Resource-Conscious Effects

```javascript
// Scale effects based on system performance
const PERFORMANCE_SETTINGS = {
  particles: game.settings.get("core", "performanceMode") ? "low" : "high",
  effectQuality: canvas.app.renderer.resolution > 1 ? "high" : "medium",
};

// Adjust spell complexity accordingly
if (PERFORMANCE_SETTINGS.particles === "low") {
  // Use simpler effects for lower-end systems
  effectFile = "jb2a.explosion.01.orange"; // Simple version
} else {
  effectFile = "jb2a.explosion.fireball.orange"; // Complex version
}
```

## RPG-Specific User Experience

### Clear Spell Feedback

```javascript
// RPG-aware user notifications
function notifySpellCast(spellName, manaCost, casterName) {
  ui.notifications.info(`${casterName} casts ${spellName}!`);

  if (manaCost > 0) {
    ui.notifications.warn(
      `Manually deduct ${manaCost} mana from ${casterName}.`
    );
  }
}

// Usage
notifySpellCast("Frost Bolt", 15, caster.name);
```

### Turn-Based UI Feedback

```javascript
// Inform players about turn requirements
function checkAndNotifyTurn(caster) {
  if (!game.combat?.started) {
    ui.notifications.info("Casting outside of combat - no turn restrictions.");
    return true;
  }

  const activeCombatant = game.combat.current;
  if (activeCombatant?.token?.id !== caster.id) {
    const activeName = activeCombatant?.name || "Unknown";
    ui.notifications.warn(
      `Currently ${activeName}'s turn. Wait for your turn to cast.`
    );
    return false;
  }

  ui.notifications.success(`${caster.name}'s turn - spell ready to cast!`);
  return true;
}
```

### Spell Targeting UI

```javascript
// RPG-themed crosshair targeting
async function showSpellCrosshairs(spellConfig) {
  const {
    spellName,
    areaSize = 1,
    spellColor = "blue",
    requiresLineOfSight = true,
  } = spellConfig;

  return await warpgate.crosshairs.show({
    size: areaSize,
    icon: `modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_${spellColor}_400x400.webm`,
    label: `${spellName} Target`,
    drawIcon: true,
    drawOutline: true,
    interval: requiresLineOfSight ? -1 : 0, // Check line of sight if needed
  });
}

// Usage
const target = await showSpellCrosshairs({
  spellName: "Fireball",
  areaSize: 3,
  spellColor: "Red",
  requiresLineOfSight: true,
});
```

### Combat Stance Integration (Future)

```javascript
// Placeholder for future stance detection
function getStanceNotification(currentStance) {
  const stanceEffects = {
    offensive: "Damage dice maximized! -3 dodge dice.",
    defensive: "Can counter-spell! No dodge penalty.",
    focus: "Reduced mana costs! Some spells cost-free.",
  };

  return stanceEffects[currentStance] || "Stance effects unknown.";
}

// Display stance reminder
if (DISPLAY_STANCE_REMINDERS) {
  ui.notifications.info(
    `Current stance: ${currentStance}. ${getStanceNotification(currentStance)}`
  );
}
```

## Modern RPG-Specific Code Reusability

### ✅ **NEW: Comprehensive Utility System (2025)**

All utility functions have been extracted from the tested bubbles.js spell and are available in `/macros/utilities/`:

**Available Utility Files:**

- `actor-validation.js` - Token and actor validation functions
- `stance-detection.js` - Combat stance detection and mana cost calculation
- `character-stats.js` - Character statistics with injury adjustment
- `portal-targeting.js` - Crosshair targeting using Portal module
- `actor-detection.js` - Actor detection at target locations
- `damage-calculation.js` - Damage/healing rolls with stance mechanics
- `element-selection.js` - Element selection dialogs and properties
- `chat-formatting.js` - Professional chat message formatting
- `README.md` - Complete utility reference guide

**Usage Pattern:**

````javascript
// Copy utility functions into your spell macros for standalone operation
// See /macros/utilities/README.md for complete function reference

### Legacy Spell Animation Utility Functions (Pre-2025)
```javascript
// Common spell utilities for RPG system (LEGACY - use utilities/ instead)
const SpellUtils = {
    // Validate RPG spell casting requirements
    validateSpellCast: function(caster, config = {}) {
        const {
            requiresTurn = false,
            manaCost = 0,
            requiredCharacter = null,
            maxTargets = 1
        } = config;

        if (!caster) {
            ui.notifications.warn("No caster selected!");
            return false;
        }

        if (requiresTurn && !this.validateTurn(caster)) {
            return false;
        }

        if (requiredCharacter && !this.validateCharacter(caster.actor, requiredCharacter)) {
            return false;
        }

        if (manaCost > 0 && !this.checkMana(caster.actor, manaCost)) {
            return false;
        }

        return true;
    },

    // Create standardized spell projectile
    createSpellProjectile: function(caster, target, effectFile, duration = 1000) {
        return new Sequence()
            .effect()
                .file(effectFile)
                .atLocation(caster)
                .stretchTo(target)
                .duration(duration)
                .waitUntilFinished(-200);
    },

    // Create standardized spell impact
    createSpellImpact: function(target, effectFile, scale = 1.0) {
        return new Sequence()
            .effect()
                .file(effectFile)
                .atLocation(target)
                .scale(scale)
                .duration(1500);
    },

    // Combine projectile + impact for complete spell
    createCompleteSpell: function(config) {
        const {
            caster,
            targets,
            projectileEffect,
            impactEffect,
            soundEffect = null,
            manaCost = 0,
            spellName = "Unknown Spell"
        } = config;

        let sequence = new Sequence();

        // Add sound if provided
        if (soundEffect) {
            sequence.sound()
                .file(soundEffect)
                .volume(0.4);
        }

        // Handle multiple targets
        const targetArray = Array.isArray(targets) ? targets : [targets];

        targetArray.forEach((target, index) => {
            // Projectile
            sequence.addSequence(
                this.createSpellProjectile(caster, target, projectileEffect)
            );

            // Impact (delayed for projectile travel)
            sequence.addSequence(
                this.createSpellImpact(target, impactEffect)
                    .delay(1000 + (index * 200))
            );
        });

        // Add completion notification
        sequence.thenDo(() => {
            if (manaCost > 0) {
                ui.notifications.warn(`${spellName} cast! Deduct ${manaCost} mana from ${caster.name}.`);
            }
        });

        return sequence;
    }
};
````

### Character-Specific Spell Templates

```javascript
// Ora's Ice Spell Template
const OraSpells = {
  createIceSpell: function (caster, target, spellType = "frost_bolt") {
    const iceEffects = {
      frost_bolt: {
        projectile: "jb2a.ice_shard.01.blue",
        impact: "jb2a.impact.ice.blue",
        sound: "assets/sounds/ice-spells/frost-bolt.wav",
      },
      blizzard: {
        projectile: "jb2a.snowflake.01.blue",
        impact: "jb2a.blizzard.blue",
        sound: "assets/sounds/ice-spells/blizzard.wav",
      },
    };

    const effect = iceEffects[spellType];
    return SpellUtils.createCompleteSpell({
      caster,
      targets: target,
      projectileEffect: effect.projectile,
      impactEffect: effect.impact,
      soundEffect: effect.sound,
      spellName: `Ora's ${spellType.replace("_", " ")}`,
    });
  },
};

// Moctei's Shadow Spell Template
const MocteiSpells = {
  createShadowSpell: function (caster, target, spellType = "shadow_bolt") {
    const shadowEffects = {
      shadow_bolt: {
        projectile: "jb2a.eldritch_blast.dark_purple",
        impact: "jb2a.impact.dark_purple",
        sound: "assets/sounds/shadow/shadow-bolt.wav",
      },
      void_prison: {
        projectile: "jb2a.darkness.black",
        impact: "jb2a.spirit_guardians.dark_purple",
        sound: "assets/sounds/shadow/void-prison.wav",
      },
    };

    const effect = shadowEffects[spellType];
    return SpellUtils.createCompleteSpell({
      caster,
      targets: target,
      projectileEffect: effect.projectile,
      impactEffect: effect.impact,
      soundEffect: effect.sound,
      spellName: `Moctei's ${spellType.replace("_", " ")}`,
    });
  },
};
```

### RPG Integration Helpers

```javascript
// Helper functions for RPG system integration
const RPGHelpers = {
  // Get character stats (now available via individual attributes)
  getCharacterStat: function (actor, statName) {
    // Access individual characteristic attributes
    return actor?.system?.attributes?.[statName]?.value || 3;
  },

  // Calculate spell dice (for future automation)
  calculateSpellDice: function (actor, statName) {
    const statValue = this.getCharacterStat(actor, statName);
    return `${statValue}d7`; // RPG uses d7 dice
  },

  // Check combat stance (for future implementation)
  getCombatStance: function (actor) {
    // Placeholder for future stance detection
    return actor?.flags?.rpg?.stance || "neutral";
  },

  // Apply stance effects to spell visuals
  applyStanceEffects: function (sequence, stance) {
    switch (stance) {
      case "offensive":
        // More intense, aggressive visuals
        return sequence.effect().scale(1.3).tint("#ff4500");
      case "defensive":
        // Subdued, protective visuals
        return sequence.effect().scale(0.8).tint("#4169e1");
      case "focus":
        // Clean, precise visuals
        return sequence.effect().scale(1.0).tint("#ffd700");
      default:
        return sequence;
    }
  },
};
```

## RPG Testing and Debugging

### RPG-Specific Debug Mode

```javascript
// Enhanced debug mode for RPG system
const RPG_DEBUG = true;

function debugRPG(category, message, data = null) {
  if (!RPG_DEBUG) return;

  const timestamp = new Date().toLocaleTimeString();
  console.log(`[RPG-${category}] ${timestamp}: ${message}`, data);
}

// Usage throughout spell macros
debugRPG("SPELL", "Starting Frost Bolt animation", {
  caster: caster.name,
  target: target.name,
});
debugRPG("COMBAT", "Turn validation", {
  currentTurn: game.combat?.current?.name,
  selectedToken: caster.name,
});
debugRPG("RESOURCE", "Mana check", {
  current: currentMana,
  required: SPELL_COST,
});
```

### RPG Test Scenarios

```javascript
// Comprehensive RPG spell testing
function testSpellScenarios(spellFunction) {
  const scenarios = [
    {
      name: "No Caster Selected",
      setup: () => (canvas.tokens.controlled.length = 0),
      expect: "Should show warning",
    },
    {
      name: "Wrong Turn Order",
      setup: () => {
        // Simulate different active combatant
        game.combat = { current: { token: { id: "different-id" } } };
      },
      expect: "Should prevent casting",
    },
    {
      name: "Insufficient Mana",
      setup: () => {
        const actor = canvas.tokens.controlled[0].actor;
        actor.system.resources.power.value = 0;
      },
      expect: "Should show mana warning",
    },
    {
      name: "Valid Spell Cast",
      setup: () => {
        // Set up proper conditions
        selectTestToken();
        targetTestEnemy();
        setProperTurn();
      },
      expect: "Should execute spell animation",
    },
  ];

  scenarios.forEach((scenario) => {
    console.log(`Testing: ${scenario.name}`);
    scenario.setup();
    try {
      spellFunction();
      console.log(`✓ ${scenario.expect}`);
    } catch (error) {
      console.error(`✗ Failed: ${error.message}`);
    }
  });
}
```

### Character-Specific Testing

```javascript
// Test character-specific spell requirements
function testCharacterSpell(characterName, spellName) {
  debugRPG("TEST", `Testing ${characterName}'s ${spellName}`);

  // Validate character
  const caster = canvas.tokens.controlled[0];
  if (!caster?.name?.toLowerCase().includes(characterName.toLowerCase())) {
    console.warn(
      `Wrong character: Expected ${characterName}, got ${caster?.name}`
    );
    return false;
  }

  // Test character sheet setup
  const resources = caster.actor?.system?.resources;
  if (!resources?.power || !resources?.health) {
    console.error("Character sheet not configured for RPG system");
    return false;
  }

  debugRPG("TEST", "Character validation passed", {
    character: caster.name,
    mana: resources.power.value,
    health: resources.health.value,
  });

  return true;
}
```

### Performance Testing for Combat

```javascript
// Test spell performance in combat scenarios
function testCombatPerformance() {
  const performanceTests = {
    singleTarget: () => {
      const start = performance.now();
      // Execute single-target spell
      const end = performance.now();
      return end - start;
    },

    multiTarget: () => {
      const start = performance.now();
      // Execute multi-target spell with 5 enemies
      const end = performance.now();
      return end - start;
    },

    complexSpell: () => {
      const start = performance.now();
      // Execute complex spell with multiple effects
      const end = performance.now();
      return end - start;
    },
  };

  Object.entries(performanceTests).forEach(([testName, testFn]) => {
    const timing = testFn();
    debugRPG("PERFORMANCE", `${testName} took ${timing.toFixed(2)}ms`);

    if (timing > 5000) {
      // 5 second threshold
      console.warn(`${testName} may be too slow for turn-based combat`);
    }
  });
}
```

## RPG Documentation Standards

### Spell Macro Headers

```javascript
/**
 * Spell: Ora's Frost Bolt
 * Description: Fires a precision ice projectile that can slow enemies
 *
 * RPG Integration:
 * - Associated Stat: Dexterité (for accuracy)
 * - Mana Cost: 15 points (handled manually)
 * - Turn Requirement: Must be Ora's turn
 * - Target Type: Single enemy
 * - Range: 8 squares maximum
 * - Stance Effects:
 *   * Offensive: Damage maximized, -3 dodge dice
 *   * Defensive: Can be used as counter-spell
 *   * Focus: Mana cost reduced to 7 points
 *
 * Requirements:
 * - Sequencer module
 * - JB2A effects (ice shard, impact)
 * - Warp Gate (targeting)
 * - Character: Ora only
 *
 * Usage:
 * 1. Select Ora's token during her turn
 * 2. Target enemy within range
 * 3. Execute macro
 * 4. Manually deduct 15 mana (or 7 if in Focus stance)
 *
 * @author [Your Name]
 * @version 1.0
 * @character Ora
 * @stat_requirement Dexterité
 * @gamemaster_approved 2025-09-19
 * @tested_scenarios [combat, out-of-combat, various stances]
 */
```

### Inline Comments for RPG Context

```javascript
// === RPG VALIDATION SECTION ===
// Check if it's Ora's turn (character-specific spell)
if (game.combat?.started) {
  const activeToken = game.combat.current?.token;
  if (activeToken?.id !== caster.id) {
    ui.notifications.warn("Wait for Ora's turn to cast Frost Bolt!");
    return;
  }
}

// Validate this is Ora's token
if (!caster.name.toLowerCase().includes("ora")) {
  ui.notifications.error("Only Ora can cast Frost Bolt!");
  return;
}

// === MANA COST CALCULATION ===
// Base cost: 15 mana
// Focus stance: 7 mana (to be automated later)
const currentStance = getRPGStance(caster.actor); // Future implementation
const manaCost = currentStance === "focus" ? 7 : 15;

// === SPELL MECHANICS ===
// Dexterité-based spell: Player will roll [Dex Value]d7
// Target rolls Agilité defense: [Agi Value]d7
// Hit if Attacker > Defender
// Animation shows visual effect only, dice handled externally

// === TARGETING VALIDATION ===
const target = await warpgate.crosshairs.show({
  size: 1,
  icon: "modules/jb2a_patreon/Library/Generic/Marker/MarkerLight_01_Regular_Blue_400x400.webm",
  label: "Frost Bolt Target",
});

if (target.cancelled) {
  ui.notifications.info("Frost Bolt cancelled.");
  return;
}

// Check range (8 squares maximum for Frost Bolt)
const distance = canvas.grid.measureDistance(caster, target);
if (distance > 8) {
  ui.notifications.warn(
    `Target too far! Frost Bolt range: 8 squares, target: ${Math.round(
      distance
    )} squares`
  );
  return;
}

// === ANIMATION SEQUENCE ===
new Sequence()
  .effect() // Ice projectile
  .file("jb2a.ice_shard.01.blue")
  .atLocation(caster)
  .stretchTo(target)
  .duration(1200)
  .waitUntilFinished(-200)
  .effect() // Ice impact
  .file("jb2a.impact.ice.blue")
  .atLocation(target)
  .scale(0.8)
  .duration(1500)
  .sound() // Spell sound
  .file("assets/sounds/ice-spells/frost-bolt.wav")
  .volume(0.4)
  .thenDo(() => {
    // === POST-CAST NOTIFICATIONS ===
    ui.notifications.info(
      `Frost Bolt cast! Manually deduct ${manaCost} mana from Ora.`
    );
    ui.notifications.warn(
      "Roll Dexterité vs target's Agilité to determine hit."
    );
  })
  .play();
```

### RPG Integration Notes

```javascript
/**
 * RPG INTEGRATION NOTES:
 *
 * Current Implementation:
 * ✅ Visual animation only
 * ✅ Turn validation
 * ✅ Character restriction (Ora only)
 * ✅ Range checking
 * ✅ Manual mana cost notification
 *
 * Future Automation (requires GameMaster approval):
 * 🔄 Automatic mana deduction
 * 🔄 Stance detection and cost adjustment
 * 🔄 Dice rolling integration
 * 🔄 Damage calculation
 * 🔄 Status effect application
 *
 * Testing Checklist:
 * ✅ Works with Ora's token
 * ✅ Rejects non-Ora characters
 * ✅ Respects turn order
 * ✅ Validates target range
 * ✅ Shows appropriate notifications
 * ✅ Animation timing appropriate for combat
 *
 * GameMaster Notes:
 * - Frost Bolt is Ora's signature spell
 * - Dexterité-based for precision theme
 * - Lower mana cost encourages frequent use
 * - Ice theme fits character lore
 */
```

## RPG Version Control and Approval Process

### Changelog for RPG Context

Keep track of changes with RPG-specific notes:

```javascript
/**
 * Changelog:
 * v1.0 - Initial Frost Bolt spell for Ora
 * v1.1 - Added turn validation and character restriction
 * v1.2 - Implemented range checking (8 squares max)
 * v1.3 - Added stance-aware mana cost notifications
 * v1.4 - GameMaster approved visual intensity adjustments
 * v1.5 - Performance optimized for turn-based combat timing
 */
```

### GameMaster Approval Tracking

```javascript
/**
 * GameMaster Approval Log:
 *
 * @gamemaster_approved_date 2025-09-19
 * @gamemaster_approved_by [GameMaster Name]
 * @approval_scope Visual effects, mana costs, character restrictions
 * @pending_approval Automatic dice rolling integration
 * @rejected_features Automatic damage application (per GM ruling)
 *
 * Notes from GameMaster:
 * - Animation timing approved for combat flow
 * - Mana cost balanced for Ora's playstyle
 * - Visual intensity appropriate for spell level
 * - Future automation to be reviewed separately
 */
```

### Backwards Compatibility for RPG System

```javascript
// Support different module versions while maintaining RPG integrity
const getRPGCompatibleEffect = (spellType) => {
  const effectPaths = {
    frost_bolt: [
      "jb2a.ice_shard.01.blue", // Preferred JB2A path
      "modules/jb2a_patreon/Library/1st_Level/Ice_Shard/IceShard_01_Blue_400x400.webm", // Fallback
      "modules/animated-spell-effects/spell-effects/ice/ice-bolt.webm", // Alternative
    ],
  };

  const paths = effectPaths[spellType] || [];

  for (const path of paths) {
    if (Sequencer.Database.entryExists(path)) {
      debugRPG("EFFECTS", `Using effect path: ${path}`);
      return path;
    }
  }

  ui.notifications.error(
    `No compatible effect found for ${spellType}! Check module installations.`
  );
  return null;
};

// Usage
const frostBoltEffect = getRPGCompatibleEffect("frost_bolt");
if (!frostBoltEffect) return;
```

## RPG Security Considerations

### Input Validation for RPG System

```javascript
// Validate RPG-specific inputs
function validateRPGInput(input, type) {
  switch (type) {
    case "character_name":
      // Only allow known character names
      const validCharacters = ["ora", "moctei"];
      return validCharacters.includes(input.toLowerCase());

    case "spell_name":
      // Validate against known spell list
      return input.match(/^[a-zA-Z\s_-]+$/) && input.length <= 30;

    case "mana_cost":
      // Validate mana cost range
      return Number.isInteger(input) && input >= 0 && input <= 100;

    case "stat_name":
      // Validate against 7-stat system
      const validStats = [
        "physique",
        "dexterite",
        "agilite",
        "esprit",
        "sens",
        "volonte",
        "charisme",
      ];
      return validStats.includes(input.toLowerCase());

    default:
      return false;
  }
}

// Usage in spells
if (!validateRPGInput(characterName, "character_name")) {
  ui.notifications.error("Invalid character name for RPG system!");
  return;
}
```

### Permission Checks for RPG Features

```javascript
// Check RPG-specific permissions
const RPGPermissions = {
  canCastSpell: function (user, character, spellLevel = 1) {
    // Basic permission: can user control this character?
    if (!character.isOwner) {
      ui.notifications.warn(
        "You don't have permission to control this character!"
      );
      return false;
    }

    // RPG rule: high-level spells may require GM approval
    if (spellLevel > 3 && !game.user.isGM) {
      ui.notifications.warn("High-level spells require GameMaster presence!");
      return false;
    }

    return true;
  },

  canModifyCharacter: function (user, character) {
    // Only GMs and character owners can modify character sheets
    return character.isOwner || game.user.isGM;
  },

  canAccessCombatFeatures: function (user) {
    // Advanced combat features may require specific permissions
    return game.user.hasRole("GAMEMASTER") || game.user.hasRole("ASSISTANT");
  },
};

// Usage
if (!RPGPermissions.canCastSpell(game.user, caster.actor, 2)) {
  return;
}
```

### Secure RPG Data Handling

```javascript
// Secure access to character data
function getSecureCharacterData(actor) {
  if (!actor || !actor.system) {
    debugRPG("SECURITY", "Invalid actor data access attempt");
    return null;
  }

  // Only access approved RPG data fields
  const approvedFields = {
    resources: actor.system.resources,
    attributes: actor.system.attributes,
    name: actor.name,
  };

  // Sanitize output
  Object.keys(approvedFields).forEach((key) => {
    if (approvedFields[key] === undefined) {
      delete approvedFields[key];
    }
  });

  debugRPG("SECURITY", "Secure character data accessed", {
    actorName: actor.name,
  });
  return approvedFields;
}

// Safe resource checking
function checkResourcesSafely(actor, resourceName) {
  const data = getSecureCharacterData(actor);
  return data?.resources?.[resourceName]?.value || 0;
}
```

## 🏷️ Tagger Module Integration for Advanced RPG Macros

### What is Tagger and Why Use It?

Tagger is a powerful module that allows you to assign custom tags to any scene object and retrieve them programmatically. For RPG spell development, this creates unprecedented automation possibilities and environmental interactivity.

### RPG-Specific Tagger Use Cases

#### 1. **Environmental Magic Enhancement**

```javascript
// Enhanced spell power based on environmental elements
function getEnvironmentalBonus(targetLocation, spellType) {
  let bonusMultiplier = 1.0;
  let bonusDescription = [];

  switch (spellType) {
    case "water":
      // Water spells enhanced near water sources
      const waterSources = Tagger.getByTag("water-source", {
        withinDistance: 50,
        from: targetLocation,
      });
      if (waterSources.length > 0) {
        bonusMultiplier = 1.5;
        bonusDescription.push("Enhanced by nearby water source");
      }
      break;

    case "fire":
      // Fire spells enhanced near fire elements
      const fireSources = Tagger.getByTag(
        ["fire-source", "forge", "altar-fire"],
        {
          withinDistance: 60,
          from: targetLocation,
          matchAny: true,
        }
      );
      if (fireSources.length > 0) {
        bonusMultiplier = 1.3;
        bonusDescription.push("Amplified by nearby fire");
      }
      break;

    case "shadow":
      // Shadow spells stronger in dark areas
      const darkAreas = Tagger.getByTag("darkness", {
        withinDistance: 40,
        from: targetLocation,
      });
      if (darkAreas.length > 0) {
        bonusMultiplier = 1.4;
        bonusDescription.push("Empowered by shadows");
      }
      break;
  }

  return { multiplier: bonusMultiplier, description: bonusDescription };
}

// Usage in Ora's water spells
const environmentalBonus = getEnvironmentalBonus(targetLocation, "water");
const finalScale = baseScale * environmentalBonus.multiplier;

if (environmentalBonus.description.length > 0) {
  ui.notifications.info(
    `Environmental Effect: ${environmentalBonus.description.join(", ")}`
  );
}
```

#### 2. **Smart Multi-Target Spell Systems**

```javascript
// Intelligent healing that targets all allies in area
async function castAreaHealing(casterToken, centerLocation, radius = 60) {
  // Find all tagged allies within range
  const alliesInRange = Tagger.getByTag("ally", {
    withinDistance: radius,
    from: centerLocation,
  });

  // Exclude caster from self-healing spells if desired
  const healTargets = alliesInRange.filter(
    (ally) => ally.id !== casterToken.id
  );

  if (healTargets.length === 0) {
    ui.notifications.warn("No allies in range for group healing!");
    return;
  }

  // Create healing sequence for each ally
  let sequence = new Sequence();

  healTargets.forEach((ally, index) => {
    sequence
      .effect()
      .file("jb2a.cure_wounds.400px.blue")
      .atLocation(ally)
      .scale(0.8)
      .delay(index * 200) // Stagger effects
      .sound()
      .file("assets/sounds/healing/group-heal.wav")
      .volume(0.3)
      .delay(index * 200);
  });

  await sequence.play();

  ui.notifications.info(`Area healing cast on ${healTargets.length} allies!`);

  // Return target information for damage calculation utilities
  return healTargets.map((ally) => ({ actor: ally.actor, token: ally }));
}
```

#### 3. **Interactive Spell Component System**

```javascript
// Spell requires specific magical components in scene
function checkSpellComponents(spellName, casterLocation) {
  const componentRequirements = {
    "lightning-storm": ["mana-crystal", "conductor"],
    "mass-teleport": ["teleport-circle", "ley-line"],
    resurrection: ["holy-altar", "life-crystal"],
    "meteor-strike": ["star-chart", "focus-lens"],
  };

  const required = componentRequirements[spellName];
  if (!required) return { canCast: true, missing: [] };

  const missing = [];
  const found = [];

  required.forEach((component) => {
    const nearby = Tagger.getByTag(component, {
      withinDistance: 100,
      from: casterLocation,
    });

    if (nearby.length === 0) {
      missing.push(component);
    } else {
      found.push({ component, objects: nearby });
    }
  });

  return {
    canCast: missing.length === 0,
    missing,
    found,
    message:
      missing.length > 0
        ? `Spell requires nearby: ${missing.join(", ")}`
        : `Spell components found: ${found.map((f) => f.component).join(", ")}`,
  };
}

// Usage in advanced spells
const componentCheck = checkSpellComponents("lightning-storm", caster);
if (!componentCheck.canCast) {
  ui.notifications.error(componentCheck.message);
  return;
}

ui.notifications.success(componentCheck.message);
```

#### 4. **Dynamic Combat Automation**

```javascript
// Advanced combat targeting with role-based logic
function getSmartCombatTargets(casterToken, spellType, maxTargets = 5) {
  let targetTags = [];
  let excludeTags = [];

  switch (spellType) {
    case "healing":
      targetTags = ["ally", "friendly", "injured"];
      excludeTags = ["enemy", "hostile"];
      break;
    case "damage":
      targetTags = ["enemy", "hostile"];
      excludeTags = ["ally", "friendly", "neutral"];
      break;
    case "buff":
      targetTags = ["ally", "friendly"];
      excludeTags = ["enemy"];
      break;
    case "crowd-control":
      targetTags = ["enemy", "neutral"];
      excludeTags = ["ally", "friendly"];
      break;
  }

  // Get potential targets
  let potentialTargets = [];

  targetTags.forEach((tag) => {
    const tagged = Tagger.getByTag(tag, {
      withinDistance: 120,
      from: casterToken,
    });
    potentialTargets.push(...tagged);
  });

  // Remove excluded targets
  excludeTags.forEach((excludeTag) => {
    potentialTargets = potentialTargets.filter(
      (target) => !Tagger.hasTags(target, excludeTag)
    );
  });

  // Remove duplicates and limit count
  const uniqueTargets = [...new Set(potentialTargets)].slice(0, maxTargets);

  return {
    targets: uniqueTargets,
    count: uniqueTargets.length,
    breakdown: {
      allies: uniqueTargets.filter((t) =>
        Tagger.hasTags(t, ["ally", "friendly"])
      ).length,
      enemies: uniqueTargets.filter((t) =>
        Tagger.hasTags(t, ["enemy", "hostile"])
      ).length,
      neutrals: uniqueTargets.filter((t) => Tagger.hasTags(t, ["neutral"]))
        .length,
    },
  };
}

// Usage
const combatTargets = getSmartCombatTargets(caster, "damage", 3);
if (combatTargets.count === 0) {
  ui.notifications.warn("No valid targets for offensive spell!");
  return;
}

ui.notifications.info(`Targeting ${combatTargets.count} enemies`);
```

#### 5. **Scene-Based Spell Modifications**

```javascript
// Spells adapt to scene environment automatically
function getSceneModifications(spellElement) {
  const sceneModifiers = {
    // Check for elemental dominance in scene
    fire: {
      enhancing: ["volcano", "forge", "fire-plane", "summer"],
      diminishing: ["ice-cave", "underwater", "rain-storm", "winter"],
    },
    water: {
      enhancing: ["ocean", "river", "rain-storm", "underwater", "spring"],
      diminishing: ["desert", "fire-plane", "drought", "volcano"],
    },
    shadow: {
      enhancing: ["darkness", "crypt", "shadow-plane", "night"],
      diminishing: ["holy-ground", "daylight", "light-source", "temple"],
    },
    holy: {
      enhancing: ["temple", "holy-ground", "consecrated", "altar"],
      diminishing: ["cursed", "unholy", "shadow-plane", "corruption"],
    },
  };

  const element = sceneModifiers[spellElement];
  if (!element) return { modifier: 1.0, description: "" };

  // Check enhancing factors
  const enhancers = element.enhancing.some(
    (tag) => Tagger.getByTag(tag).length > 0
  );

  // Check diminishing factors
  const diminishers = element.diminishing.some(
    (tag) => Tagger.getByTag(tag).length > 0
  );

  if (enhancers && !diminishers) {
    return {
      modifier: 1.5,
      description: "Scene enhances spell power",
      visual: "enhanced",
    };
  } else if (diminishers && !enhancers) {
    return {
      modifier: 0.7,
      description: "Scene weakens spell power",
      visual: "diminished",
    };
  }

  return {
    modifier: 1.0,
    description: "Scene neutral to spell",
    visual: "normal",
  };
}

// Usage in spells
const sceneEffect = getSceneModifications("fire");
const finalDamage = baseDamage * sceneEffect.modifier;

if (sceneEffect.description !== "Scene neutral to spell") {
  ui.notifications.info(sceneEffect.description);
}

// Adjust visual effects based on scene
let effectTint = "#ffffff";
if (sceneEffect.visual === "enhanced") effectTint = "#ffff00";
if (sceneEffect.visual === "diminished") effectTint = "#808080";
```

### Tagger Setup Workflow for RPG Sessions

#### 1. **Pre-Session Scene Tagging (GM)**

```javascript
// Utility function for GMs to quickly tag scene elements
function setupRPGSceneTags() {
  // Common environmental tags
  const environmentalTags = {
    // Water features
    waterTiles: ["water-source", "flowing-water", "deep-water"],
    // Fire features
    fireTiles: ["fire-source", "heat-source", "forge"],
    // Magical elements
    altarTiles: ["altar", "holy-ground", "magical-focus"],
    // Lighting
    lightSources: ["light-source", "illumination"],
    // Combat zones
    dangerAreas: ["hazard", "trap", "dangerous-terrain"],
  };

  // Interactive tagging interface for GMs
  const tagDialog = new Dialog({
    title: "RPG Scene Tagger",
    content: `
      <form>
        <p>Select tiles/tokens, then choose tags to apply:</p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          ${Object.entries(environmentalTags)
            .map(
              ([category, tags]) => `
            <div>
              <h4>${category}</h4>
              ${tags
                .map(
                  (tag) => `
                <button type="button" onclick="applyTag('${tag}')">${tag}</button>
              `
                )
                .join("")}
            </div>
          `
            )
            .join("")}
        </div>
      </form>
    `,
    buttons: {
      close: { label: "Close" },
    },
  });

  tagDialog.render(true);
}
```

#### 2. **Dynamic Combat Tagging**

```javascript
// Automatically tag combatants based on their role
function autoTagCombatants() {
  if (!game.combat) return;

  game.combat.combatants.forEach((combatant) => {
    const token = combatant.token?.object;
    if (!token) return;

    // Clear previous combat tags
    Tagger.removeTags(token, ["ally", "enemy", "neutral", "boss", "minion"]);

    // Determine role based on disposition
    let roleTags = [];

    switch (token.disposition) {
      case 1: // Friendly
        roleTags.push("ally", "friendly");
        break;
      case -1: // Hostile
        roleTags.push("enemy", "hostile");
        // Check if it's a boss (higher HP, special name, etc.)
        if (token.actor.system.resources.health.max > 50) {
          roleTags.push("boss");
        } else {
          roleTags.push("minion");
        }
        break;
      case 0: // Neutral
        roleTags.push("neutral");
        break;
    }

    // Add character-specific tags
    const actorName = token.actor.name.toLowerCase();
    if (actorName.includes("ora")) roleTags.push("water-mage", "healer");
    if (actorName.includes("moctei")) roleTags.push("shadow-mage", "striker");

    Tagger.setTags(token, roleTags);
  });

  ui.notifications.info("Combat roles auto-tagged!");
}
```

### Integration with Existing RPG Utilities

#### Enhanced Tourbillon with Tagger

```javascript
// Enhanced version of tourbillon.js using Tagger
async function castEnhancedTourbillon() {
  // Use existing utility validation
  const validation = validateSpellCasterWithAttributes();
  if (!validation) return;
  const { caster, actor } = validation;

  // Use Tagger to check for water enhancement
  const waterSources = Tagger.getByTag("water-source", {
    withinDistance: 80,
    from: caster,
  });

  // Enhanced scaling based on environment + tokens
  const nearbyTokens = canvas.tokens.placeables.filter((token) => {
    const distance = canvas.grid.measureDistance(caster, token);
    return distance <= 30 && token !== caster;
  });

  const baseScale = nearbyTokens.length > 0 ? 1.5 : 1.0;
  const environmentalBonus = waterSources.length > 0 ? 1.4 : 1.0;
  const finalScale = baseScale * environmentalBonus;

  // Use Portal targeting (existing utility)
  const target = await selectSingleTarget(caster);
  if (!target) return;

  // Create enhanced effect with environmental feedback
  new Sequence()
    .effect("jb2a_patreon.whirlwind.blue")
    .atLocation(target)
    .scale(finalScale)
    .fadeOut(3000)
    .belowTokens()
    .thenDo(() => {
      const effects = [];
      if (nearbyTokens.length > 0) effects.push("Enhanced by nearby presence");
      if (waterSources.length > 0) effects.push("Empowered by water sources");

      if (effects.length > 0) {
        ui.notifications.info(`Tourbillon: ${effects.join(", ")}`);
      }
    })
    .play();
}
```

#### Enhanced BubbleSpam with Smart Targeting

```javascript
// Enhanced bubbleSpam with Tagger-based ally avoidance
function createSmartBubbleSpam() {
  let isActive = false;

  canvas.app.stage.addEventListener("click", async (event) => {
    if (!isActive) return;

    const clickLocation = canvas.canvasCoordinatesFromClient({
      x: event.clientX,
      y: event.clientY,
    });

    // Check for allies nearby using Tagger
    const nearbyAllies = Tagger.getByTag(["ally", "friendly"], {
      withinDistance: 25,
      from: clickLocation,
    });

    if (nearbyAllies.length > 0) {
      ui.notifications.warn("Too close to allies! Redirecting...");

      // Find safe alternative location
      const safeDistance = 40;
      const angle = Math.random() * Math.PI * 2;
      const safeLocation = {
        x: clickLocation.x + Math.cos(angle) * safeDistance,
        y: clickLocation.y + Math.sin(angle) * safeDistance,
      };

      // Cast at safe location instead
      castBubbleEffect(safeLocation);
    } else {
      castBubbleEffect(clickLocation);
    }
  });

  // Activation with smart targeting announcement
  ui.notifications.info(
    "Smart Bubble Spam active! Automatic ally avoidance enabled. ESC to stop."
  );
  isActive = true;
}
```

### Performance Considerations for Tagger + RPG

#### Optimized Scene Queries

```javascript
// Cache frequent tag queries for performance
const TagCache = {
  cache: new Map(),
  cacheDuration: 5000, // 5 seconds

  getWithCache: function (tags, options = {}) {
    const cacheKey = JSON.stringify({ tags, options });
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.results;
    }

    const results = Array.isArray(tags)
      ? Tagger.getByTag(tags, options)
      : Tagger.getByTag(tags, options);

    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now(),
    });

    return results;
  },

  clearCache: function () {
    this.cache.clear();
  },
};

// Usage in spells
const fireSource = TagCache.getWithCache("fire-source", {
  withinDistance: 50,
  from: caster,
});
```

### Best Practices for RPG Tagger Integration

#### 1. **Consistent Tag Naming**

```javascript
// Standardized tag categories for RPG system
const RPG_TAG_STANDARDS = {
  // Character roles
  roles: ["ally", "enemy", "neutral", "boss", "minion"],

  // Character types
  classes: ["water-mage", "shadow-mage", "healer", "striker", "tank"],

  // Environmental elements
  elements: ["fire-source", "water-source", "earth-element", "air-current"],

  // Magical features
  magic: ["mana-crystal", "ley-line", "magical-focus", "power-source"],

  // Terrain types
  terrain: ["difficult-terrain", "hazard", "safe-zone", "cover"],

  // Status conditions (temporary)
  conditions: ["burning", "frozen", "blessed", "cursed", "marked"],
};
```

#### 2. **Tag Management Utilities**

```javascript
// Utility functions for RPG tag management
const RPGTagger = {
  // Batch tag assignment for common scenarios
  tagCombatRoles: function (friendlyTokens, enemyTokens) {
    friendlyTokens.forEach((token) => {
      Tagger.setTags(token, ["ally", "friendly"]);
    });
    enemyTokens.forEach((token) => {
      Tagger.setTags(token, ["enemy", "hostile"]);
    });
  },

  // Clean up temporary battle tags
  cleanupCombatTags: function () {
    const temporaryTags = ["burning", "frozen", "marked", "targeted"];

    temporaryTags.forEach((tag) => {
      const tagged = Tagger.getByTag(tag);
      tagged.forEach((object) => {
        Tagger.removeTags(object, [tag]);
      });
    });
  },

  // Validate tag consistency
  validateSceneTags: function () {
    const issues = [];

    // Check for conflicting role tags
    canvas.tokens.placeables.forEach((token) => {
      const isAlly = Tagger.hasTags(token, "ally");
      const isEnemy = Tagger.hasTags(token, "enemy");

      if (isAlly && isEnemy) {
        issues.push(`${token.name} has conflicting ally/enemy tags`);
      }
    });

    if (issues.length > 0) {
      console.warn("Tag Validation Issues:", issues);
      ui.notifications.warn(`Found ${issues.length} tag conflicts`);
    }

    return issues;
  },
};
```

This Tagger integration transforms RPG spell development from manual targeting to intelligent, environmental magic systems that respond dynamically to scene elements and combat roles, making spells feel truly integrated with the game world.

## Summary: RPG-First Development Approach

By following these modern RPG-specific best practices, your spell animation macros will:

### ✅ **Respect RPG Mechanics (FULLY IMPLEMENTED)**

- **Complete 7-stat integration** with injury adjustments via utility functions
- **Full combat stance detection** with mana cost calculation and damage maximization
- **Professional Portal targeting** with crosshair selection and actor detection
- **Comprehensive damage calculation** with stance-dependent mechanics
- **Professional chat output** with formatted damage, attack rolls, and effects
- **Tested implementation** - Pattern proven in bubbles.js on live server

### ✅ **Follow GameMaster Authority**

- **Proven RPG compliance** - bubbles.js serves as approved template
- **Utility-based development** - Use tested utility functions for consistency
- **Consult GameMaster** for new spell concepts and rule interpretations
- **Document all approvals** and maintain collaborative development process

### ✅ **Maintain Performance Standards**

- Keep animations concise for turn-based combat
- Optimize for multiple players and complex spell sequences
- Provide fallbacks for different module configurations
- Scale effects appropriately for various system capabilities

### ✅ **Ensure Usability**

- Clear notifications about manual processes (mana, dice, damage)
- Intuitive targeting systems for tactical combat
- Consistent behavior across all spell animations
- Helpful error messages for troubleshooting

### ✅ **Support Collaboration**

- **Complete utility system** - 8 comprehensive utility files with documentation
- **Tested spell template** - bubbles.js as proven RPG-compliant pattern
- **Copy-paste development** - Standalone utility functions maintain macro independence
- **Professional standards** - Consistent chat output, error handling, and user experience
- **Character-specific patterns** - Ora's bubbles.js shows advanced spell development

---

## 🚀 **Quick Start for New Spells (2025)**

### **Recommended Development Path:**

1. **Study bubbles.js** - `/macros/characters/ora/bubbles.js` (tested, RPG-compliant)
2. **Read utilities guide** - `/macros/utilities/README.md` (complete function reference)
3. **Copy utility functions** - Select functions needed for your spell
4. **Follow the pattern** - Use bubbles.js structure as template
5. **Test thoroughly** - Validate all RPG integration features

### **Essential Utilities for Most Spells:**

- `validateSpellCasterWithAttributes()` - Basic validation
- `getStanceInfo()` + `calculateStanceManaCost()` - Stance system
- `getEspritStat()` - Character stats with injury adjustment
- `selectSingleTarget()` - Portal targeting
- `getActorAtLocation()` - Target detection
- `calculateStanceDamage()` - Damage with stance mechanics
- `createSpellResultMessage()` - Professional chat output

**Remember**: These spell animations serve a specific custom RPG system with **full implementation available**. Use the proven utility system and bubbles.js pattern for reliable, RPG-compliant spell development.

_Happy spell animation development with complete RPG integration! ⚡🎲_
