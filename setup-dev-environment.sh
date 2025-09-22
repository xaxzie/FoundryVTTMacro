#!/bin/bash

# FoundryVTT Development Setup Script
# Automates the initial setup of local development environment

set -e

echo "🚀 FoundryVTT Local Development Setup"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FOUNDRY_DIR="$HOME/Desktop/FoundryVTT-Local"
PROJECT_DIR="$(pwd)"

# Helper functions
print_step() {
    echo -e "\n${BLUE}📋 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_requirements() {
    print_step 1 "Checking system requirements"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
    else
        print_error "npm not found. Please install npm"
        exit 1
    fi
    
    # Check if FoundryVTT directory exists
    if [ -d "$FOUNDRY_DIR" ]; then
        print_success "FoundryVTT directory found: $FOUNDRY_DIR"
    else
        print_warning "FoundryVTT directory not found at $FOUNDRY_DIR"
        echo "You'll need to set up FoundryVTT manually following the guide in docs/local-development-setup.md"
    fi
}

setup_node_environment() {
    print_step 2 "Setting up Node.js environment"
    
    # Install dependencies
    if [ -f "package.json" ]; then
        print_success "Installing npm dependencies..."
        npm install
    else
        print_error "package.json not found!"
        exit 1
    fi
    
    # Install FoundryVTT types
    print_success "Installing FoundryVTT TypeScript definitions..."
    npm run install-types
}

create_development_structure() {
    print_step 3 "Creating development directory structure"
    
    # Create macro development directories
    mkdir -p macro-dev/{src,dist,tests}
    mkdir -p macro-dev/src/{basic,intermediate,advanced,characters,utilities}
    
    print_success "Created macro development directories"
    
    # Create example macro if none exists
    if [ ! -f "macro-dev/src/basic/example-spell.js" ]; then
        cat > macro-dev/src/basic/example-spell.js << 'EOF'
/**
 * @file Example Spell Macro
 * @description Template with full type safety and IntelliSense
 * @author Development Team
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

// Development logging
if (game.settings.get("core", "debug")) {
    console.log("Spell cast by:", caster.name);
}

// Type-safe Sequencer usage with IntelliSense
new Sequence()
    .effect()
        .file("jb2a.explosion.01.orange")
        .atLocation(caster)
        .scale(1.5)
        .duration(2000)
    .sound()
        .file("assets/sounds/spell-cast.wav")
        .volume(0.3)
    .play();
EOF
        print_success "Created example spell macro"
    fi
}

setup_vscode_integration() {
    print_step 4 "Setting up VS Code integration"
    
    # Check if VS Code is installed
    if command -v code &> /dev/null; then
        print_success "VS Code found"
        
        # Install recommended extensions
        echo "Installing recommended VS Code extensions..."
        code --install-extension ms-vscode.vscode-typescript-next --force
        code --install-extension GitHub.copilot --force
        code --install-extension GitHub.copilot-chat --force
        code --install-extension ms-vscode.vscode-json --force
        
        print_success "VS Code extensions installed"
    else
        print_warning "VS Code not found. Install from https://code.visualstudio.com/"
        echo "Extensions to install manually:"
        echo "- TypeScript Language Service"
        echo "- GitHub Copilot"
        echo "- JSON Language Features"
    fi
}

test_setup() {
    print_step 5 "Testing development environment"
    
    # Test TypeScript compilation
    if npx tsc --noEmit; then
        print_success "TypeScript configuration valid"
    else
        print_warning "TypeScript configuration needs adjustment"
    fi
    
    # Test build system
    echo "Testing macro build system..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_success "Build system working correctly"
    else
        print_error "Build system has issues"
    fi
}

create_startup_script() {
    print_step 6 "Creating development startup script"
    
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# FoundryVTT Development Startup Script

echo "🎮 Starting FoundryVTT Development Environment"

# Start FoundryVTT in background if not running
if ! curl -s http://localhost:30000 > /dev/null 2>&1; then
    echo "🚀 Starting FoundryVTT server..."
    if [ -d "../FoundryVTT-Local" ]; then
        cd ../FoundryVTT-Local && ./start-foundry-dev.sh &
        cd - > /dev/null
        echo "⏳ Waiting for FoundryVTT to start..."
        sleep 5
    else
        echo "⚠️  FoundryVTT not found. Please set up FoundryVTT first."
        echo "📖 See docs/local-development-setup.md for instructions"
        exit 1
    fi
else
    echo "✅ FoundryVTT is already running"
fi

# Open VS Code
if command -v code &> /dev/null; then
    echo "📝 Opening VS Code..."
    code .
fi

# Open browser
echo "🌐 Opening FoundryVTT in browser..."
node open-foundry.js

echo "🎉 Development environment ready!"
echo "📖 See docs/local-development-setup.md for usage instructions"
EOF

    chmod +x start-dev.sh
    print_success "Created development startup script: start-dev.sh"
}

print_final_instructions() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "Your FoundryVTT development environment is ready!"
    echo ""
    echo "📁 Development structure created:"
    echo "   - macro-dev/src/     # Development macros with IntelliSense"
    echo "   - macro-dev/dist/    # Built macros for FoundryVTT"
    echo "   - .vscode/           # VS Code configuration"
    echo ""
    echo "🚀 Quick start commands:"
    echo "   ./start-dev.sh       # Start complete development environment"
    echo "   npm run dev          # Build and deploy macros"
    echo "   npm run open         # Open FoundryVTT in browser"
    echo ""
    echo "📖 Next steps:"
    echo "   1. Set up FoundryVTT following docs/local-development-setup.md"
    echo "   2. Edit macros in macro-dev/src/ with full IntelliSense"
    echo "   3. Use npm run dev to build and deploy"
    echo "   4. Test in FoundryVTT at http://localhost:30000"
    echo ""
    echo "💡 Tips:"
    echo "   - Use VS Code for best development experience"
    echo "   - Check the example macro in macro-dev/src/basic/"
    echo "   - Run npm run test for automated testing"
    echo ""
}

# Main execution
main() {
    check_requirements
    setup_node_environment
    create_development_structure
    setup_vscode_integration
    test_setup
    create_startup_script
    print_final_instructions
}

# Run main function
main