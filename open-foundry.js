/**
 * Browser launcher script for FoundryVTT development
 * Usage: node open-foundry.js
 */

const { exec } = require('child_process');
const readline = require('readline');

const FOUNDRY_URL = 'http://localhost:30000';

function checkFoundryStatus() {
    return new Promise((resolve) => {
        exec(`curl -s -o /dev/null -w "%{http_code}" ${FOUNDRY_URL}`, (error, stdout) => {
            if (error) {
                resolve(false);
            } else {
                resolve(stdout === '200');
            }
        });
    });
}

async function waitForFoundry(maxWaitTime = 30000) {
    const startTime = Date.now();
    
    console.log('🔍 Checking if FoundryVTT is running...');
    
    while (Date.now() - startTime < maxWaitTime) {
        const isRunning = await checkFoundryStatus();
        
        if (isRunning) {
            console.log('✅ FoundryVTT is running!');
            return true;
        }
        
        console.log('⏳ Waiting for FoundryVTT to start...');
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('❌ FoundryVTT is not responding after 30 seconds');
    return false;
}

async function main() {
    const isRunning = await waitForFoundry();
    
    if (!isRunning) {
        console.log('');
        console.log('🚀 To start FoundryVTT manually:');
        console.log('   cd ~/Desktop/FoundryVTT-Local');
        console.log('   ./start-foundry-dev.sh');
        console.log('');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
            rl.question('Start FoundryVTT automatically? (y/n): ', resolve);
        });
        
        rl.close();
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            console.log('🚀 Starting FoundryVTT...');
            exec('cd ~/Desktop/FoundryVTT-Local && ./start-foundry-dev.sh', { detached: true });
            
            const started = await waitForFoundry(60000); // Wait up to 60 seconds for startup
            if (!started) {
                console.log('❌ Failed to start FoundryVTT');
                process.exit(1);
            }
        } else {
            process.exit(1);
        }
    }
    
    // Open FoundryVTT in default browser
    console.log('🌐 Opening FoundryVTT in browser...');
    
    const platform = process.platform;
    let openCommand;
    
    switch (platform) {
        case 'darwin': // macOS
            openCommand = 'open';
            break;
        case 'win32': // Windows
            openCommand = 'start';
            break;
        default: // Linux and others
            openCommand = 'xdg-open';
            break;
    }
    
    exec(`${openCommand} ${FOUNDRY_URL}`, (error) => {
        if (error) {
            console.error('❌ Error opening browser:', error.message);
            console.log(`📋 Manual URL: ${FOUNDRY_URL}`);
            process.exit(1);
        }
        
        console.log('✅ FoundryVTT opened in browser');
        console.log(`📋 URL: ${FOUNDRY_URL}`);
    });
}

main().catch(console.error);