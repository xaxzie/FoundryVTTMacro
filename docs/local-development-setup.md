# Local FoundryVTT Development Setup Guide

## Overview
This guide enables autonomous macro development and testing without dependency on a remote FoundryVTT server. You'll set up a local FoundryVTT instance, VS Code development environment, and automated testing workflow.

## 🎯 Benefits of Local Development
- ✅ **Complete autonomy** - Test macros independently
- ✅ **Faster iteration** - No server restarts or deployments
- ✅ **Version control** - Track macro changes with Git
- ✅ **IDE integration** - Full VS Code support with autocomplete
- ✅ **Offline development** - Work without internet connection
- ✅ **Debugging tools** - Console access and error tracking

---

## 📋 Prerequisites

### System Requirements
- **Node.js 18+** (LTS recommended)
- **VS Code** with Extensions
- **FoundryVTT License** (required for local installation)
- **8GB+ RAM** (for running FoundryVTT + VS Code)

### Required Knowledge
- Basic command line usage
- FoundryVTT macro basics
- JavaScript fundamentals

---

## 🚀 Step 1: Local FoundryVTT Installation

### Option A: Portable FoundryVTT (Recommended)
1. **Purchase FoundryVTT License**
   - Visit https://foundryvtt.com/purchase/
   - Download your licensed copy

2. **Extract Portable Installation**
   ```bash
   # Download and extract FoundryVTT
   cd ~/Desktop
   mkdir FoundryVTT-Local
   cd FoundryVTT-Local
   
   # Extract your downloaded FoundryVTT package
   unzip ~/Downloads/FoundryVirtualTabletop-*.zip
   ```

3. **Create Local Data Directory**
   ```bash
   # Create dedicated data folder for development
   mkdir foundrydata
   cd foundrydata
   mkdir Config Data Logs
   ```

4. **Configure for Local Development**
   ```bash
   # Create startup script
   cat > start-foundry-dev.sh << 'EOF'
   #!/bin/bash
   
   # Set development environment variables
   export FOUNDRY_VTT_DATA_PATH="$(pwd)/foundrydata"
   export NODE_ENV=development
   
   # Start FoundryVTT with development settings
   node resources/app/main.js \
     --port=30000 \
     --hostname=localhost \
     --dataPath="$FOUNDRY_VTT_DATA_PATH" \
     --world=dev-world \
     --verbose
   EOF
   
   chmod +x start-foundry-dev.sh
   ```

### Option B: Node.js Installation
```bash
# Install FoundryVTT via npm (if available in your region)
npm install -g foundryvtt

# Start local server
foundryvtt --hostname=localhost --port=30000 --dataPath=./foundrydata
```

---

## 🛠️ Step 2: VS Code Development Environment

### Install Required Extensions
```bash
# Install VS Code extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension formulahendry.auto-rename-tag
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-json
```

### Configure TypeScript Support for FoundryVTT
1. **Install FoundryVTT Types**
   ```bash
   cd /Users/mac-Z08TLHOT/ReactTest/TestFoundry
   
   # Initialize npm project
   npm init -y
   
   # Install FoundryVTT type definitions
   npm add -D fvtt-types@github:League-of-Foundry-Developers/foundry-vtt-types#main
   ```

2. **Create TypeScript Configuration**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "types": ["fvtt-types"],
       "target": "esnext",
       "moduleResolution": "bundler",
       "strict": true,
       "lib": ["esnext", "dom"],
       "allowJs": true,
       "checkJs": false,
       "declaration": false,
       "outDir": "./dist",
       "rootDir": "./",
       "removeComments": true,
       "noEmit": true
     },
     "include": [
       "macros/**/*",
       "utilities/**/*",
       "src/**/*"
     ],
     "exclude": [
       "node_modules",
       "dist",
       "foundrydata"
     ]
   }
   ```

3. **VS Code Workspace Configuration**
   ```json
   // .vscode/settings.json
   {
     "typescript.preferences.includePackageJsonAutoImports": "auto",
     "typescript.suggest.autoImports": true,
     "javascript.preferences.includePackageJsonAutoImports": "auto",
     "javascript.suggest.autoImports": true,
     "files.associations": {
       "*.js": "javascript"
     },
     "editor.codeActionsOnSave": {
       "source.fixAll": true
     },
     "typescript.validate.enable": true,
     "javascript.validate.enable": true
   }
   ```

---

## 🎮 Step 3: Local World Setup

### Create Development World
1. **Start Local FoundryVTT**
   ```bash
   cd ~/Desktop/FoundryVTT-Local
   ./start-foundry-dev.sh
   ```

2. **Access Local Instance**
   - Open browser: http://localhost:30000
   - Create admin user
   - Create new world: "Macro Development"

3. **Install Essential Modules**
   Via Module Browser or Manual URLs:
   - **Sequencer**: `https://github.com/FantasyCalendar/FoundryVTT-Sequencer/releases/latest/download/module.json`
   - **JB2A Free**: `https://github.com/Jules-Bens-Aa/JB2A_DnD5e/releases/latest/download/module.json`
   - **Warp Gate**: Search "Warp Gate" in module browser

4. **Configure Development World**
   - Enable all essential modules
   - Create test scene with tokens
   - Set up macro hotbar

---

## 📝 Step 4: Macro Development Workflow

### Directory Structure for Development
```bash
# Create organized macro development structure
mkdir -p macro-dev/{src,dist,tests}
cd macro-dev

# Source macros with full IntelliSense
mkdir -p src/{basic,intermediate,advanced,characters,utilities}

# Compiled/minified for FoundryVTT
mkdir -p dist/{basic,intermediate,advanced,characters,utilities}
```

### Development Script Template
```javascript
// src/basic/spell-template.js
/**
 * @file Spell Template for Local Development
 * @description Template with full type safety and IntelliSense
 * @author Your Name
 * @version 1.0.0
 * @requires Sequencer, JB2A
 */

// Type-safe token selection
/** @type {Token} */
const caster = canvas.tokens.controlled[0];

if (!caster) {
    ui.notifications.warn("Please select a caster token.");
    return;
}

// Type-safe Sequencer usage with IntelliSense
const sequence = new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(caster)
        .scale(1.5)
        .duration(2000)
    .sound()
        .file("assets/sounds/spell-cast.wav")
        .volume(0.3)
    .play();

// Development-only logging
if (game.settings.get("core", "debug")) {
    console.log("Spell cast by:", caster.name);
    console.log("Sequence:", sequence);
}
```

### Build Script for Deployment
```javascript
// build-macros.js
const fs = require('fs');
const path = require('path');

/**
 * Builds development macros for FoundryVTT deployment
 */
function buildMacros() {
    const srcDir = './src';
    const distDir = './dist';
    
    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Process all JS files in src
    function processDirectory(dir) {
        const entries = fs.readdirSync(path.join(srcDir, dir), { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                processDirectory(path.join(dir, entry.name));
            } else if (entry.name.endsWith('.js')) {
                const srcPath = path.join(srcDir, dir, entry.name);
                const distPath = path.join(distDir, dir, entry.name);
                
                let content = fs.readFileSync(srcPath, 'utf8');
                
                // Remove development-only code
                content = content.replace(/\/\*\*.*?\*\//gs, ''); // Remove JSDoc
                content = content.replace(/if \(game\.settings\.get\("core", "debug"\)\) \{[^}]*\}/g, ''); // Remove debug code
                content = content.replace(/console\.log\([^)]*\);?/g, ''); // Remove console.log
                content = content.replace(/\/\/ Type-safe.*$/gm, ''); // Remove type comments
                
                // Ensure dist subdirectory exists
                const distSubDir = path.dirname(distPath);
                if (!fs.existsSync(distSubDir)) {
                    fs.mkdirSync(distSubDir, { recursive: true });
                }
                
                fs.writeFileSync(distPath, content);
                console.log(`Built: ${srcPath} -> ${distPath}`);
            }
        }
    }
    
    processDirectory('');
    console.log('Build complete!');
}

buildMacros();
```

---

## 🔧 Step 5: VS Code Tasks and Automation

### Create VS Code Tasks
```json
// .vscode/tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Start FoundryVTT Dev Server",
            "type": "shell",
            "command": "./start-foundry-dev.sh",
            "group": "build",
            "isBackground": true,
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "new"
            },
            "options": {
                "cwd": "${workspaceFolder}/../FoundryVTT-Local"
            }
        },
        {
            "label": "Build Macros",
            "type": "shell",
            "command": "node",
            "args": ["build-macros.js"],
            "group": "build",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "options": {
                "cwd": "${workspaceFolder}/macro-dev"
            }
        },
        {
            "label": "Deploy Macros to FoundryVTT",
            "type": "shell",
            "command": "cp",
            "args": [
                "-r",
                "macro-dev/dist/*",
                "../FoundryVTT-Local/foundrydata/Data/worlds/macro-development/scripts/"
            ],
            "group": "build",
            "dependsOn": "Build Macros"
        },
        {
            "label": "Full Development Cycle",
            "dependsOrder": "sequence",
            "dependsOn": [
                "Build Macros",
                "Deploy Macros to FoundryVTT"
            ]
        }
    ]
}
```

### Launch Configuration
```json
// .vscode/launch.json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Open FoundryVTT in Browser",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/open-foundry.js",
            "console": "integratedTerminal"
        }
    ]
}
```

### Browser Launcher Script
```javascript
// open-foundry.js
const { exec } = require('child_process');

// Open FoundryVTT in default browser
exec('open http://localhost:30000', (error) => {
    if (error) {
        console.error('Error opening browser:', error);
        return;
    }
    console.log('FoundryVTT opened in browser');
});
```

---

## 🧪 Step 6: Testing Workflow

### Automated Macro Testing
```javascript
// test-macro.js
/**
 * Macro testing utility for local development
 */
class MacroTester {
    constructor() {
        this.testResults = [];
    }
    
    async runTest(macroPath, testName) {
        console.log(`Testing: ${testName}`);
        
        try {
            // Load and execute macro
            const macroContent = await fetch(`/scripts/${macroPath}`).then(r => r.text());
            const testFunction = new Function(macroContent);
            
            await testFunction();
            
            this.testResults.push({
                name: testName,
                status: 'PASS',
                timestamp: new Date()
            });
            
            console.log(`✅ ${testName} PASSED`);
            
        } catch (error) {
            this.testResults.push({
                name: testName,
                status: 'FAIL',
                error: error.message,
                timestamp: new Date()
            });
            
            console.error(`❌ ${testName} FAILED:`, error.message);
        }
    }
    
    generateReport() {
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        
        console.log(`\n📊 Test Report: ${passed} passed, ${failed} failed`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        }
    }
}

// Usage in FoundryVTT console
const tester = new MacroTester();
await tester.runTest('basic/spell-template.js', 'Basic Spell Test');
tester.generateReport();
```

### Package.json Scripts
```json
{
  "name": "foundryvtt-macro-development",
  "version": "1.0.0",
  "scripts": {
    "start:foundry": "cd ../FoundryVTT-Local && ./start-foundry-dev.sh",
    "build": "node macro-dev/build-macros.js",
    "deploy": "npm run build && cp -r macro-dev/dist/* ../FoundryVTT-Local/foundrydata/Data/worlds/macro-development/scripts/",
    "dev": "npm run build && npm run deploy",
    "test": "node test-macro.js",
    "open": "open http://localhost:30000"
  },
  "devDependencies": {
    "fvtt-types": "github:League-of-Foundry-Developers/foundry-vtt-types#main"
  }
}
```

---

## ⚡ Quick Start Commands

### Initial Setup
```bash
# 1. Setup development environment
cd /Users/mac-Z08TLHOT/ReactTest/TestFoundry
npm init -y
npm install -D fvtt-types@github:League-of-Foundry-Developers/foundry-vtt-types#main

# 2. Create development structure
mkdir -p macro-dev/{src,dist,tests}
mkdir -p .vscode

# 3. Start FoundryVTT (in separate terminal)
cd ~/Desktop/FoundryVTT-Local
./start-foundry-dev.sh

# 4. Open VS Code with full IntelliSense
code .
```

### Daily Development Workflow
```bash
# 1. Edit macros in src/ with full IntelliSense
# 2. Build and deploy
npm run dev

# 3. Test in browser
npm run open

# 4. Run automated tests (optional)
npm run test
```

---

## 🎯 Development Benefits

### VS Code IntelliSense Features
- ✅ **Autocomplete** for all FoundryVTT APIs
- ✅ **Type checking** for tokens, scenes, actors
- ✅ **Error detection** before runtime
- ✅ **Documentation tooltips** for all methods
- ✅ **Go to definition** for FoundryVTT classes

### Local Testing Advantages
- 🚀 **Instant feedback** - No server uploads
- 🔧 **Full console access** - Debug with Chrome DevTools
- 📁 **File system access** - Direct macro file editing
- 🔄 **Hot reloading** - Changes reflect immediately
- 🧪 **Safe environment** - No production impact

### Autonomous Workflow
- 💻 **Offline development** - Work without internet
- 🎮 **Local world control** - Full GM permissions
- 📊 **Performance testing** - Test with different token counts
- 🔍 **Debug mode** - Enable verbose logging
- 📝 **Version control** - Track all changes with Git

---

## 🚨 Troubleshooting

### Common Issues

**FoundryVTT won't start:**
```bash
# Check Node.js version
node --version  # Should be 18+

# Check port availability
lsof -i :30000

# Try different port
node resources/app/main.js --port=30001
```

**TypeScript errors in VS Code:**
```bash
# Reinstall types
npm uninstall fvtt-types
npm install -D fvtt-types@github:League-of-Foundry-Developers/foundry-vtt-types#main

# Reload VS Code
# Cmd+Shift+P -> "Developer: Reload Window"
```

**Macros not deploying:**
```bash
# Check permissions
ls -la ../FoundryVTT-Local/foundrydata/Data/worlds/

# Create scripts directory if missing
mkdir -p ../FoundryVTT-Local/foundrydata/Data/worlds/macro-development/scripts/
```

### Performance Optimization
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Start FoundryVTT with more memory
node --max-old-space-size=4096 resources/app/main.js --port=30000
```

---

## 📚 Next Steps

1. **Complete the setup** following this guide
2. **Test with existing macros** from the repository
3. **Develop new macros** with full IntelliSense
4. **Create automated tests** for critical functionality
5. **Share your setup** with the development team

This setup provides complete autonomy for FoundryVTT macro development while maintaining professional development standards and testing capabilities.