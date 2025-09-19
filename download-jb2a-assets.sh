#!/bin/bash

# JB2A Asset Download Script
# This script helps download and organize JB2A assets for your macro collection

echo "🎭 JB2A Asset Download Helper"
echo "=============================="
echo ""

# Check if we have curl and unzip
if ! command -v curl &> /dev/null; then
    echo "❌ curl is required but not installed. Please install curl first."
    exit 1
fi

if ! command -v unzip &> /dev/null; then
    echo "❌ unzip is required but not installed. Please install unzip first."
    exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
ASSETS_DIR="$(pwd)/assets"
JB2A_DIR="$ASSETS_DIR/jb2a"

echo "📁 Working directory: $ASSETS_DIR"
echo "🎪 Temporary directory: $TEMP_DIR"
echo ""

# Download JB2A free module
echo "⬇️  Downloading JB2A Free Module (this may take a while - ~1.5GB)..."
echo "If you prefer, you can install JB2A through FoundryVTT instead."
echo ""

read -p "Do you want to download the full JB2A module? [y/N]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Downloading JB2A module..."
    curl -L -o "$TEMP_DIR/jb2a-module.zip" "https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases/download/0.8.2/module-0.8.2.zip"
    
    if [ $? -eq 0 ]; then
        echo "✅ Download completed!"
        echo ""
        
        echo "📂 Extracting assets..."
        cd "$TEMP_DIR"
        unzip -q jb2a-module.zip
        
        # Find the assets directory in the extracted files
        EXTRACTED_ASSETS=$(find . -name "*.webm" -type f | head -1 | xargs dirname)
        
        if [ -n "$EXTRACTED_ASSETS" ]; then
            echo "🎬 Found assets in: $EXTRACTED_ASSETS"
            echo "📋 Copying required assets..."
            
            # Create organized structure
            mkdir -p "$JB2A_DIR"/{explosions,lightning,healing,combat,magic,environmental}
            
            # Copy specific assets we need (if they exist)
            echo "  🔥 Copying explosion effects..."
            find "$TEMP_DIR" -name "*explosion*orange*" -type f -exec cp {} "$JB2A_DIR/explosions/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*explosion*blue*" -type f -exec cp {} "$JB2A_DIR/explosions/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*fireball*" -type f -exec cp {} "$JB2A_DIR/explosions/" \; 2>/dev/null
            
            echo "  ⚡ Copying lightning effects..."
            find "$TEMP_DIR" -name "*lightning*" -type f -exec cp {} "$JB2A_DIR/lightning/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*static*electricity*" -type f -exec cp {} "$JB2A_DIR/lightning/" \; 2>/dev/null
            
            echo "  💚 Copying healing effects..."
            find "$TEMP_DIR" -name "*healing*" -type f -exec cp {} "$JB2A_DIR/healing/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*cure*wounds*" -type f -exec cp {} "$JB2A_DIR/healing/" \; 2>/dev/null
            
            echo "  ⚔️  Copying combat effects..."
            find "$TEMP_DIR" -name "*melee*" -type f -exec cp {} "$JB2A_DIR/combat/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*impact*" -type f -exec cp {} "$JB2A_DIR/combat/" \; 2>/dev/null
            
            echo "  🔮 Copying magic effects..."
            find "$TEMP_DIR" -name "*magic*" -type f -exec cp {} "$JB2A_DIR/magic/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*misty*step*" -type f -exec cp {} "$JB2A_DIR/magic/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*shield*" -type f -exec cp {} "$JB2A_DIR/magic/" \; 2>/dev/null
            
            echo "  🌬️  Copying environmental effects..."
            find "$TEMP_DIR" -name "*wind*" -type f -exec cp {} "$JB2A_DIR/environmental/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*smoke*" -type f -exec cp {} "$JB2A_DIR/environmental/" \; 2>/dev/null
            find "$TEMP_DIR" -name "*breath*" -type f -exec cp {} "$JB2A_DIR/environmental/" \; 2>/dev/null
            
            echo ""
            echo "✅ Assets organized successfully!"
            
            # Count assets
            TOTAL_ASSETS=$(find "$JB2A_DIR" -name "*.webm" | wc -l)
            echo "📊 Total assets copied: $TOTAL_ASSETS"
            
        else
            echo "❌ Could not find assets in the downloaded module."
        fi
    else
        echo "❌ Download failed. You can:"
        echo "   1. Install JB2A through FoundryVTT Module Browser"
        echo "   2. Download manually from: https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases"
        echo "   3. Use placeholder assets for testing"
    fi
else
    echo "⏭️  Skipping download. Creating placeholder structure..."
fi

# Create placeholder README files
echo ""
echo "📝 Creating asset documentation..."

cat > "$JB2A_DIR/README.md" << EOF
# JB2A Assets Directory

This directory contains JB2A (Jules&Ben's Animated Assets) video effects used by the macros.

## Installation Options

### Option 1: FoundryVTT Module (Recommended)
1. Install "JB2A - Jules&Ben's Animated Assets" through FoundryVTT
2. Enable the module in your world
3. Macros will automatically use the effects through Sequencer

### Option 2: Manual Assets
Place .webm effect files in the appropriate subdirectories:
- explosions/ - Explosion and fire effects
- lightning/ - Lightning and energy effects
- healing/ - Healing and restoration effects
- combat/ - Melee and combat impacts
- magic/ - Magical circles and spell effects
- environmental/ - Wind, smoke, and environmental effects

## Asset Sources
- Free JB2A: https://foundryvtt.com/packages/JB2A_DnD5e
- Patreon JB2A: https://www.patreon.com/JB2A
- Manual Download: https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases

## Usage
Effects are referenced in macros using either:
- JB2A database notation: \`jb2a.explosion.01.orange\`
- Direct file paths: \`assets/jb2a/explosions/explosion_01_orange.webm\`
EOF

# Create sample sounds
echo "🔊 Creating sample sound structure..."
mkdir -p "$ASSETS_DIR/sounds"

cat > "$ASSETS_DIR/sounds/README.md" << EOF
# Sound Assets Directory

This directory contains sound effects used by the macros.

## Required Sounds
- explosion.wav - Explosion sound effect
- fire-cast.wav - Fire spell casting sound
- healing.wav - Healing spell sound
- lightning-cast.wav - Lightning spell casting
- spell-cast.wav - Generic spell casting
- sword-hit.wav - Weapon impact sound
- critical-hit.wav - Critical hit sound

## Sources
- Freesound.org (CC licensed sounds)
- Zapsplat.com (subscription required)
- Custom recordings
- Game asset packs

## Formats
- Preferred: WAV or OGG
- Bitrate: 44.1kHz, 16-bit
- Length: 1-5 seconds for most effects
EOF

# Create asset inventory
echo "📋 Creating asset inventory..."

cat > "$ASSETS_DIR/asset-inventory.md" << EOF
# Asset Inventory

## JB2A Effects Used in Macros

### 🔥 Fire and Explosions
- [ ] jb2a.explosion.01.orange
- [ ] jb2a.explosion.01.blue
- [ ] jb2a.fireball
- [ ] jb2a.fireball.explosion.orange
- [ ] jb2a.fire_jet.orange
- [ ] jb2a.impact.fire.01.orange

### ⚡ Lightning and Energy
- [ ] jb2a.chain_lightning.primary.blue
- [ ] jb2a.chain_lightning.secondary.blue
- [ ] jb2a.static_electricity.03.blue
- [ ] jb2a.lightning_strike.no_ring.blue
- [ ] jb2a.energy_beam.normal.orange.03
- [ ] jb2a.energy_beam.normal.blue.03
- [ ] jb2a.energy_field.02.above.purple
- [ ] jb2a.energy_field.02.above.blue

### 💚 Healing
- [ ] jb2a.healing_generic.burst.yellowwhite
- [ ] jb2a.healing_generic.beam.yellowwhite
- [ ] jb2a.cure_wounds.400px.blue

### ⚔️ Combat
- [ ] jb2a.melee_generic.slashing.one_handed
- [ ] jb2a.melee_generic.slashing.two_handed
- [ ] jb2a.impact.ground_crack.orange.02
- [ ] jb2a.impact.ground_crack.still_frame.02

### 🔮 Magic
- [ ] jb2a.magic_missile
- [ ] jb2a.magic_signs.circle.02.conjuration.intro.purple
- [ ] jb2a.magic_signs.circle.02.conjuration.outro.purple
- [ ] jb2a.magic_signs.circle.02.transmutation.intro.blue
- [ ] jb2a.magic_signs.circle.02.transmutation.outro.blue
- [ ] jb2a.misty_step.01.blue
- [ ] jb2a.misty_step.02.blue
- [ ] jb2a.misty_step.01.purple
- [ ] jb2a.shield.03.intro.blue
- [ ] jb2a.markers.circle_of_stars.orange

### 🌬️ Environmental
- [ ] jb2a.wind_stream.default
- [ ] jb2a.smoke.puff.centered.grey.2
- [ ] jb2a.breath_weapons02.burst.cone.fire.orange.02

## Sound Effects Needed
- [ ] explosion.wav
- [ ] fire-cast.wav
- [ ] healing.wav
- [ ] lightning-cast.wav
- [ ] spell-cast.wav
- [ ] sword-hit.wav
- [ ] critical-hit.wav

Check off items as you acquire them!
EOF

# Cleanup
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Asset setup complete!"
echo ""
echo "📁 Asset directories created:"
echo "   - $JB2A_DIR (JB2A video effects)"
echo "   - $ASSETS_DIR/sounds (Audio effects)"
echo ""
echo "📖 Next steps:"
echo "   1. Review docs/jb2a-assets-guide.md for detailed information"
echo "   2. Check assets/asset-inventory.md to track your assets"
echo "   3. Install JB2A through FoundryVTT or manually add assets"
echo "   4. Add sound files to assets/sounds/"
echo "   5. Test macros with your FoundryVTT setup"
echo ""
echo "🎮 Happy gaming!"