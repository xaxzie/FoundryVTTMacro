# Installation and Setup Guide

This guide will help you set up FoundryVTT with the Sequencer module and recommended effect packages for the best macro experience.

## Prerequisites

- FoundryVTT version 10 or higher (version 11+ recommended)
- GM or Assistant GM privileges to install modules
- Basic understanding of FoundryVTT macro system

## Step 1: Install Sequencer Module

### Method 1: Module Browser (Recommended)
1. In FoundryVTT, go to **Settings** → **Manage Modules**
2. Click **Install Module**
3. Search for "Sequencer"
4. Click **Install** on "Sequencer" by Fantasy Computerworks

### Method 2: Direct URL
1. In FoundryVTT, go to **Settings** → **Manage Modules**
2. Click **Install Module**
3. Paste this URL in the Manifest URL field:
   ```
   https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json
   ```
4. Click **Install**

## Step 2: Install Effect Packages

### JB2A - Jules&Ben's Animated Assets (Essential)

**Free Version:**
1. Search for "JB2A" in the module browser
2. Install "JB2A - Jules&Ben's Animated Assets (Free)"

**Patreon Version (Recommended):**
1. Subscribe to [JB2A Patreon](https://www.patreon.com/JB2A)
2. Download the module files
3. Extract to your FoundryVTT modules folder
4. Or use the Patreon-specific install URL if provided

### Jack Kerouac's Animated Effects

**Animated Spell Effects:**
1. Search for "animated-spell-effects" in module browser
2. Install "Jack Kerouac's Animated Spell Effects"

**Cartoon Spell Effects:**
1. Search for "animated-spell-effects-cartoon"
2. Install "Jack Kerouac's Animated Cartoon Spell Effects"

## Step 3: Enable Modules

1. Go to **Settings** → **Manage Modules**
2. Enable the following modules:
   - ✅ Sequencer
   - ✅ JB2A - Jules&Ben's Animated Assets
   - ✅ Jack Kerouac's Animated Spell Effects (optional)
   - ✅ Jack Kerouac's Animated Cartoon Spell Effects (optional)
3. Click **Save Module Settings**
4. **Refresh** your browser or **restart** FoundryVTT

## Step 4: Verify Installation

### Test Sequencer
1. Create a new macro (click empty hotbar slot)
2. Set type to **Script**
3. Paste this test code:
```javascript
new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(canvas.tokens.controlled[0])
    .play();
```
4. Select a token on the canvas
5. Execute the macro
6. You should see an orange explosion effect

### Open Sequencer Database
1. Open the **Sequencer Database Viewer** (check Tools menu)
2. Browse available effects
3. Test playing effects directly from the viewer

## Step 5: Configure Settings (Optional)

### Sequencer Settings
Go to **Settings** → **Module Settings** → **Sequencer**:

- **Enable Debug Mode**: Turn on for development/troubleshooting
- **Default Volume**: Set default audio volume
- **Show Player Controls**: Allow players to use Sequencer tools

### Performance Settings
For better performance on lower-end systems:
- Reduce effect quality in video settings
- Limit simultaneous effects
- Use shorter duration effects

## Common Installation Issues

### Module Not Loading
**Problem**: Sequencer doesn't appear in module list
**Solution**: 
- Check FoundryVTT version compatibility
- Verify internet connection during install
- Try manual download and installation

### Effects Not Found
**Problem**: "File not found" errors when running macros
**Solution**:
- Ensure effect modules are enabled
- Check file paths in Sequencer Database Viewer
- Update file paths in macros to match installed modules

### Performance Issues
**Problem**: Game slows down with effects
**Solution**:
- Reduce effect quality
- Use fewer simultaneous effects
- Close unnecessary browser tabs
- Consider hardware upgrade

## File Path Reference

### JB2A Free Edition
```
modules/jb2a_patreon/Library/[Category]/[Effect]/[EffectName].webm
```

### JB2A Patreon Edition
```
modules/JB2A_DnD5e/Library/[Category]/[Effect]/[EffectName].webm
```

### Animated Spell Effects
```
modules/animated-spell-effects/spell-effects/[element]/[spell-name].webm
```

### Animated Cartoon Spell Effects
```
modules/animated-spell-effects-cartoon/spell-effects/cartoon/[element]/[spell-name].webm
```

## Testing Your Setup

### Basic Effect Test
```javascript
// Test basic effect
new Sequence()
    .effect()
        .file("jb2a.magic_missile")
        .atLocation(canvas.tokens.controlled[0])
    .play();
```

### Sound Test
```javascript
// Test sound (requires sound files)
new Sequence()
    .sound()
        .file("sounds/spellcast.wav")
        .volume(0.5)
    .play();
```

### Multi-Effect Test
```javascript
// Test multiple effects
new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(canvas.tokens.controlled[0])
    .wait(500)
    .effect()
        .file("jb2a.smoke.puff.01.white")
        .atLocation(canvas.tokens.controlled[0])
    .play();
```

## Next Steps

1. **Explore the Database**: Use the Sequencer Database Viewer to discover available effects
2. **Try Example Macros**: Test the macros included in this collection
3. **Read the Documentation**: Study the API reference and best practices
4. **Join the Community**: Connect with other Sequencer users on Discord and forums
5. **Start Creating**: Begin writing your own custom macros

## Useful Resources

- [Sequencer Wiki](https://fantasycomputer.works/FoundryVTT-Sequencer)
- [JB2A Discord](https://discord.gg/A59GAZwB9M)
- [FoundryVTT Discord](https://discord.gg/foundryvtt)
- [Sequencer GitHub](https://github.com/FantasyCalendar/FoundryVTT-Sequencer)

## Troubleshooting

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify all modules are up to date
3. Test with a minimal set of modules enabled
4. Ask for help in the FoundryVTT community Discord
5. Report bugs to the respective module developers

Remember to back up your world before making significant changes!