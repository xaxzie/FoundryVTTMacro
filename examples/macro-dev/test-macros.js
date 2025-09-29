/**
 * FoundryVTT Macro Testing Suite
 * Automated testing framework for local development
 */

class MacroTester {
    constructor() {
        this.testResults = [];
        this.testSuites = [];
        this.startTime = null;
    }

    /**
     * Add a test suite
     */
    addSuite(name, tests) {
        this.testSuites.push({ name, tests });
    }

    /**
     * Run all test suites
     */
    async runAllTests() {
        console.log('🧪 Starting FoundryVTT Macro Test Suite...');
        this.startTime = Date.now();

        for (const suite of this.testSuites) {
            await this.runSuite(suite);
        }

        this.generateReport();
        return this.getPassRate() === 100;
    }

    /**
     * Run a specific test suite
     */
    async runSuite(suite) {
        console.log(`\n📋 Running test suite: ${suite.name}`);

        for (const test of suite.tests) {
            await this.runTest(test, suite.name);
        }
    }

    /**
     * Run individual test
     */
    async runTest(test, suiteName) {
        const testName = `${suiteName}: ${test.name}`;
        console.log(`   Testing: ${test.name}`);

        try {
            // Setup test environment
            await this.setupTest(test);

            // Run the test function
            const result = await test.fn();

            // Validate result
            const passed = result === true || result === undefined;

            this.testResults.push({
                suite: suiteName,
                name: test.name,
                status: passed ? 'PASS' : 'FAIL',
                error: passed ? null : 'Test returned false',
                timestamp: new Date(),
                duration: Date.now() - this.testStartTime
            });

            console.log(`   ${passed ? '✅' : '❌'} ${test.name}`);

        } catch (error) {
            this.testResults.push({
                suite: suiteName,
                name: test.name,
                status: 'ERROR',
                error: error.message,
                timestamp: new Date(),
                duration: Date.now() - this.testStartTime
            });

            console.log(`   ❌ ${test.name}: ${error.message}`);
        }
    }

    /**
     * Setup test environment
     */
    async setupTest(test) {
        this.testStartTime = Date.now();

        // Clear previous test artifacts
        if (canvas && canvas.effects) {
            canvas.effects.removeChildren();
        }

        // Setup test tokens if needed
        if (test.requiresToken && canvas.tokens.controlled.length === 0) {
            // Try to select first available token
            const availableTokens = canvas.tokens.placeables;
            if (availableTokens.length > 0) {
                availableTokens[0].control();
            }
        }
    }

    /**
     * Generate comprehensive test report
     */
    generateReport() {
        const duration = Date.now() - this.startTime;
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const errors = this.testResults.filter(r => r.status === 'ERROR').length;
        const total = this.testResults.length;

        console.log('\n📊 Test Report');
        console.log('='.repeat(50));
        console.log(`Total tests: ${total}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`💥 Errors: ${errors}`);
        console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
        console.log(`📈 Pass rate: ${this.getPassRate().toFixed(1)}%`);

        if (failed > 0 || errors > 0) {
            console.log('\n❌ Failed/Error Tests:');
            this.testResults
                .filter(r => r.status !== 'PASS')
                .forEach(r => {
                    console.log(`   ${r.suite}: ${r.name}`);
                    console.log(`      ${r.error}`);
                });
        }

        // Generate JSON report for CI/CD
        this.generateJsonReport();
    }

    /**
     * Calculate pass rate percentage
     */
    getPassRate() {
        if (this.testResults.length === 0) return 0;
        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        return (passed / this.testResults.length) * 100;
    }

    /**
     * Generate JSON report for automation
     */
    generateJsonReport() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            summary: {
                total: this.testResults.length,
                passed: this.testResults.filter(r => r.status === 'PASS').length,
                failed: this.testResults.filter(r => r.status === 'FAIL').length,
                errors: this.testResults.filter(r => r.status === 'ERROR').length,
                passRate: this.getPassRate()
            },
            results: this.testResults
        };

        if (typeof require !== 'undefined') {
            const fs = require('fs');
            fs.writeFileSync('./test-results.json', JSON.stringify(report, null, 2));
            console.log('\n📄 JSON report saved to test-results.json');
        }
    }
}

/**
 * Predefined test suites for common macro functionality
 */
class DefaultTestSuites {
    static getBasicTests() {
        return {
            name: 'Basic Functionality',
            tests: [
                {
                    name: 'FoundryVTT APIs Available',
                    fn: () => {
                        return typeof game !== 'undefined' &&
                            typeof canvas !== 'undefined' &&
                            typeof ui !== 'undefined';
                    }
                },
                {
                    name: 'Sequencer Available',
                    fn: () => {
                        return typeof Sequence !== 'undefined';
                    }
                },
                {
                    name: 'JB2A Database Accessible',
                    fn: () => {
                        return game.modules.get('jb2a_patreon')?.active ||
                            game.modules.get('JB2A_DnD5e')?.active;
                    }
                },
                {
                    name: 'Canvas Ready',
                    fn: () => {
                        return canvas && canvas.ready;
                    }
                }
            ]
        };
    }

    static getSequencerTests() {
        return {
            name: 'Sequencer Functionality',
            tests: [
                {
                    name: 'Create Basic Sequence',
                    requiresToken: false,
                    fn: async () => {
                        const seq = new Sequence();
                        return seq instanceof Sequence;
                    }
                },
                {
                    name: 'Effect with File Path',
                    requiresToken: true,
                    fn: async () => {
                        if (canvas.tokens.controlled.length === 0) {
                            throw new Error('No token selected for test');
                        }

                        const token = canvas.tokens.controlled[0];
                        const seq = new Sequence()
                            .effect()
                            .file("jb2a.explosion.01.orange")
                            .atLocation(token)
                            .duration(1000);

                        return seq !== null;
                    }
                },
                {
                    name: 'Sound Effect',
                    requiresToken: false,
                    fn: async () => {
                        const seq = new Sequence()
                            .sound()
                            .file("assets/sounds/test.wav")
                            .volume(0.1);

                        return seq !== null;
                    }
                }
            ]
        };
    }

    static getMacroTests() {
        return {
            name: 'Macro Integration',
            tests: [
                {
                    name: 'Token Selection Check',
                    requiresToken: false,
                    fn: () => {
                        // Test the common token selection pattern
                        const caster = canvas.tokens.controlled[0];

                        if (!caster) {
                            // This should handle gracefully
                            return true; // Expected behavior
                        }

                        return typeof caster.name === 'string';
                    }
                },
                {
                    name: 'Notification System',
                    requiresToken: false,
                    fn: () => {
                        // Test notification without actually showing it
                        return typeof ui.notifications !== 'undefined' &&
                            typeof ui.notifications.warn === 'function';
                    }
                },
                {
                    name: 'Game Settings Access',
                    requiresToken: false,
                    fn: () => {
                        return typeof game.settings !== 'undefined' &&
                            typeof game.settings.get === 'function';
                    }
                }
            ]
        };
    }
}

/**
 * Main test runner function
 */
async function runMacroTests() {
    const tester = new MacroTester();

    // Add default test suites
    tester.addSuite('Basic Functionality', DefaultTestSuites.getBasicTests().tests);
    tester.addSuite('Sequencer Functionality', DefaultTestSuites.getSequencerTests().tests);
    tester.addSuite('Macro Integration', DefaultTestSuites.getMacroTests().tests);

    // Run all tests
    const success = await tester.runAllTests();

    return success;
}

// Export for use in FoundryVTT console or as module
if (typeof module !== 'undefined') {
    module.exports = { MacroTester, DefaultTestSuites, runMacroTests };
} else {
    // Make available globally in FoundryVTT
    window.MacroTester = MacroTester;
    window.DefaultTestSuites = DefaultTestSuites;
    window.runMacroTests = runMacroTests;
}
