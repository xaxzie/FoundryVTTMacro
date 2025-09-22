/**
 * Macro Build System for FoundryVTT Development
 * Converts development macros with full type safety to production-ready versions
 */

const fs = require('fs');
const path = require('path');

class MacroBuilder {
    constructor() {
        this.srcDir = './src';
        this.distDir = './dist';
        this.builtFiles = [];
        this.errors = [];
    }

    /**
     * Main build process
     */
    async build() {
        console.log('🏗️  Starting macro build process...');
        
        // Ensure dist directory exists
        this.ensureDirectory(this.distDir);
        
        // Process all source files
        this.processDirectory('');
        
        // Generate build report
        this.generateReport();
        
        return this.errors.length === 0;
    }

    /**
     * Recursively process directories
     */
    processDirectory(dir) {
        const srcPath = path.join(this.srcDir, dir);
        
        if (!fs.existsSync(srcPath)) {
            console.log('📁 Source directory not found, creating example structure...');
            this.createExampleStructure();
            return;
        }
        
        const entries = fs.readdirSync(srcPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                this.processDirectory(path.join(dir, entry.name));
            } else if (entry.name.endsWith('.js')) {
                this.processFile(dir, entry.name);
            }
        }
    }

    /**
     * Process individual JavaScript file
     */
    processFile(dir, filename) {
        try {
            const srcPath = path.join(this.srcDir, dir, filename);
            const distPath = path.join(this.distDir, dir, filename);
            
            let content = fs.readFileSync(srcPath, 'utf8');
            
            // Transform development code to production
            content = this.transformCode(content, filename);
            
            // Ensure dist subdirectory exists
            const distSubDir = path.dirname(distPath);
            this.ensureDirectory(distSubDir);
            
            // Write transformed code
            fs.writeFileSync(distPath, content);
            
            this.builtFiles.push({
                src: srcPath,
                dist: distPath,
                size: content.length
            });
            
            console.log(`✅ Built: ${srcPath} -> ${distPath}`);
            
        } catch (error) {
            this.errors.push({
                file: path.join(dir, filename),
                error: error.message
            });
            console.error(`❌ Error building ${filename}:`, error.message);
        }
    }

    /**
     * Transform development code for production
     */
    transformCode(content, filename) {
        let transformed = content;
        
        // Remove development comments and JSDoc
        transformed = transformed.replace(/\/\*\*[\s\S]*?\*\//g, '');
        transformed = transformed.replace(/\/\*[\s\S]*?\*\//g, '');
        transformed = transformed.replace(/\/\/.*$/gm, '');
        
        // Remove type annotations and comments
        transformed = transformed.replace(/\/\*\* @type \{.*?\} \*\//g, '');
        transformed = transformed.replace(/\/\/ Type-safe.*$/gm, '');
        
        // Remove development-only code blocks
        transformed = transformed.replace(
            /if \(game\.settings\.get\("core", "debug"\)\) \{[\s\S]*?\}/g, 
            ''
        );
        
        // Remove console.log statements
        transformed = transformed.replace(/console\.log\([^)]*\);?/g, '');
        transformed = transformed.replace(/console\.debug\([^)]*\);?/g, '');
        
        // Remove development assertions
        transformed = transformed.replace(/console\.assert\([^)]*\);?/g, '');
        
        // Clean up extra whitespace
        transformed = transformed.replace(/\n\s*\n\s*\n/g, '\n\n');
        transformed = transformed.trim();
        
        // Add production header
        const header = `/**\n * Macro: ${this.getDisplayName(filename)}\n * Built: ${new Date().toISOString()}\n */\n\n`;
        
        return header + transformed;
    }

    /**
     * Get display name from filename
     */
    getDisplayName(filename) {
        return filename
            .replace('.js', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Ensure directory exists
     */
    ensureDirectory(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    /**
     * Create example source structure for first-time setup
     */
    createExampleStructure() {
        const exampleDirs = ['basic', 'intermediate', 'advanced', 'characters', 'utilities'];
        
        for (const dir of exampleDirs) {
            this.ensureDirectory(path.join(this.srcDir, dir));
        }
        
        // Create example macro
        const exampleMacro = `/**
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
`;
        
        fs.writeFileSync(path.join(this.srcDir, 'basic', 'example-spell.js'), exampleMacro);
        console.log('📝 Created example macro structure');
    }

    /**
     * Generate build report
     */
    generateReport() {
        console.log('\n📊 Build Report:');
        console.log(`✅ Successfully built: ${this.builtFiles.length} files`);
        console.log(`❌ Errors: ${this.errors.length}`);
        
        if (this.builtFiles.length > 0) {
            console.log('\n📁 Built files:');
            for (const file of this.builtFiles) {
                const sizeKB = (file.size / 1024).toFixed(2);
                console.log(`   ${file.dist} (${sizeKB} KB)`);
            }
        }
        
        if (this.errors.length > 0) {
            console.log('\n❌ Build errors:');
            for (const error of this.errors) {
                console.log(`   ${error.file}: ${error.error}`);
            }
        }
        
        console.log('\n🎉 Build complete!');
    }
}

// Auto-run if called directly
if (require.main === module) {
    const builder = new MacroBuilder();
    builder.build().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = MacroBuilder;