# FoundryVTT Module Requirements

## Quick Reference for All Macros

This document provides a comprehensive list of all FoundryVTT modules required to run the macros in this collection.

## Essential Modules (Required)

### 1. Sequencer ⭐
- **Package ID**: `sequencer`
- **Install URL**: `https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json`
- **Purpose**: Core animation and effect system
- **Required for**: ALL macros in this collection
- **Version**: Latest stable

### 2. JB2A - Jules&Ben's Animated Assets ⭐
- **Package ID**: `jb2a_dnd5e` (free) or `jb2a_patreon` (paid)
- **Install**: Search "JB2A" in Foundry module browser
- **Purpose**: Visual effect files (.webm animations)
- **Required for**: 95% of macros (all except basic sound-only)
- **Alternative**: Use local assets with provided download script

### 3. Warp Gate ⭐
- **Package ID**: `warpgate`
- **Install**: Search "Warp Gate" in Foundry module browser
- **Purpose**: Crosshair targeting system
- **Required for**: ALL character-specific macros (Ora & Moctei)
- **Used by**: `warpgate.crosshairs.show()` function

## Optional Enhancement Modules

### 4. Animated Spell Effects
- **Package ID**: `animated-spell-effects`
- **Purpose**: Additional spell effect animations
- **Required for**: `acid-splash.js` only
- **Alternative**: Replace with JB2A equivalent

### 5. Animated Spell Effects - Cartoon
- **Package ID**: `animated-spell-effects-cartoon`
- **Purpose**: Cartoon-style spell animations
- **Required for**: `acid-splash.js` only
- **Alternative**: Replace with JB2A equivalent

## Module Requirements by Macro Category

| Category | File Count | Sequencer | JB2A | Warp Gate | Other |
|----------|------------|-----------|------|-----------|-------|
| **Basic** | 7 macros | ✅ Required | ✅ Required | ❌ Not used | ❌ None |
| **Intermediate** | 6 macros | ✅ Required | ✅ Required | ❌ Not used | 🔹 Animated Effects (1 macro) |
| **Advanced** | 5 macros | ✅ Required | ✅ Required | ❌ Not used | ❌ None |
| **Spells** | 3 macros | ✅ Required | ✅ Required | ❌ Not used | ❌ None |
| **Characters/Ora** | 5 macros | ✅ Required | ✅ Required | ✅ Required | ❌ None |
| **Characters/Moctei** | 5 macros | ✅ Required | ✅ Required | ✅ Required | ❌ None |
| **Templates** | 2 templates | ✅ Required | ✅ Required | 🔹 Optional | ❌ None |
| **Utilities** | 2 utilities | ✅ Required | ✅ Required | ❌ Not used | ❌ None |

**Total Macros**: 35 files  
**Require Sequencer**: 35 (100%)  
**Require JB2A**: 34 (97%)  
**Require Warp Gate**: 10 (29% - all character macros)  

## Installation Commands

### Via FoundryVTT Module Browser
1. Go to "Add-on Modules"
2. Click "Install Module"
3. Search for:
   - "Sequencer"
   - "JB2A" or "Jules Ben Animated Assets"
   - "Warp Gate"

### Via Direct URLs
```
Sequencer: https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json
```

### Enable Modules
1. World Settings → Manage Modules
2. Enable: ✅ Sequencer, ✅ JB2A, ✅ Warp Gate
3. Click "Save Module Settings"
4. Restart world if prompted

## Module Dependency Tree

```
All Macros
├── Sequencer (CORE - handles all animations)
├── JB2A (ASSETS - provides effect files)
│   ├── Free version: 1.5GB, 2000+ effects
│   └── Patreon version: 8GB+, 5000+ effects
└── Character Macros Only
    └── Warp Gate (TARGETING - crosshair system)
        └── Used for spell placement and targeting
```

## Troubleshooting Module Issues

### Error: "Sequencer is not defined"
- **Cause**: Sequencer module not installed or enabled
- **Solution**: Install Sequencer module and restart world

### Error: "warpgate is not defined"
- **Cause**: Warp Gate module missing for character macros
- **Solution**: Install Warp Gate module (only needed for Ora/Moctei spells)

### Error: "Effect file not found"
- **Cause**: JB2A module not installed or wrong file path
- **Solutions**:
  1. Install JB2A module
  2. Use asset download script: `./download-jb2a-assets.sh`
  3. Update file paths in macros

### Error: "Cannot read property 'crosshairs'"
- **Cause**: Using character macros without Warp Gate
- **Solution**: Install Warp Gate or use basic macros instead

## Performance Considerations

### Module Load Order
1. **Sequencer** (load first - core system)
2. **JB2A** (assets loaded on demand)
3. **Warp Gate** (utilities loaded as needed)

### Resource Usage
- **Sequencer**: ~2MB (lightweight core)
- **JB2A Free**: ~1.5GB (asset files)
- **JB2A Patreon**: ~8GB+ (extended assets)
- **Warp Gate**: ~1MB (utility functions)

### Optimization Tips
- Use JB2A Free version for testing
- Upgrade to Patreon for production/enhanced effects
- Disable unused optional modules
- Clear effect cache if experiencing lag

## Compatibility Matrix

| FoundryVTT Version | Sequencer | JB2A | Warp Gate | Status |
|-------------------|-----------|------|-----------|--------|
| v12+ | ✅ Latest | ✅ Latest | ✅ Latest | ✅ Fully Supported |
| v11 | ✅ Compatible | ✅ Compatible | ✅ Compatible | ✅ Supported |
| v10 | 🔹 Older version | ✅ Compatible | ✅ Compatible | 🔹 Limited Support |
| v9 and below | ❌ Not supported | ❌ Not supported | ❌ Not supported | ❌ Incompatible |

## Alternative Solutions

### Without Warp Gate
- Replace `warpgate.crosshairs.show()` with `Sequencer.Crosshair.show()`
- Manually specify target coordinates
- Use token targeting instead of crosshair placement

### Without JB2A
- Use local asset files (provided download script)
- Replace with other effect modules
- Create custom effect file paths

### Minimal Setup
For basic testing with minimal modules:
1. **Sequencer** + **JB2A Free** = Basic effects
2. Add **Warp Gate** for character macros
3. Skip optional modules unless specifically needed

---

*Last updated: September 2025*  
*Total modules analyzed: 35 macro files*