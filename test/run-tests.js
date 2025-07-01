import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Test Runner for Real Estate Analyzer
 * ====================================
 * 
 * This script runs both unit and integration tests with proper error handling
 * and detailed reporting.
 */

class TestRunner {
    constructor() {
        this.testResults = {
            unit: { status: 'pending', output: '', error: '' },
            integration: { status: 'pending', output: '', error: '' }
        };
    }

    /**
     * Run a single test file
     * @param {string} testFile - Path to test file
     * @param {string} testType - Type of test (unit/integration)
     * @returns {Promise<boolean>} - Success status
     */
    async runTest(testFile, testType) {
        return new Promise((resolve) => {
            console.log(`\n🧪 Running ${testType} tests...`);
            console.log(`📁 File: ${testFile}`);
            console.log('─'.repeat(50));

            const child = spawn('node', [testFile], {
                cwd: path.dirname(__dirname),
                stdio: ['inherit', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                process.stdout.write(output);
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                process.stderr.write(output);
            });

            child.on('close', (code) => {
                const success = code === 0;
                this.testResults[testType] = {
                    status: success ? 'passed' : 'failed',
                    output: stdout,
                    error: stderr,
                    exitCode: code
                };

                if (success) {
                    console.log(`\n✅ ${testType} tests PASSED`);
                } else {
                    console.log(`\n❌ ${testType} tests FAILED (exit code: ${code})`);
                }
                
                resolve(success);
            });

            child.on('error', (error) => {
                console.error(`\n💥 Failed to start ${testType} tests:`, error.message);
                this.testResults[testType] = {
                    status: 'error',
                    output: stdout,
                    error: error.message,
                    exitCode: -1
                };
                resolve(false);
            });
        });
    }

    /**
     * Print comprehensive test summary
     */
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));

        let totalPassed = 0;
        let totalFailed = 0;

        for (const [testType, result] of Object.entries(this.testResults)) {
            const status = result.status;
            const icon = status === 'passed' ? '✅' : status === 'failed' ? '❌' : '⚠️';
            
            console.log(`${icon} ${testType.toUpperCase()} Tests: ${status.toUpperCase()}`);
            
            if (status === 'passed') totalPassed++;
            else if (status === 'failed') totalFailed++;

            if (result.exitCode !== undefined) {
                console.log(`   Exit Code: ${result.exitCode}`);
            }
        }

        console.log('─'.repeat(60));
        console.log(`📈 Results: ${totalPassed} passed, ${totalFailed} failed`);

        const overallStatus = totalFailed === 0 ? 'PASSED' : 'FAILED';
        const overallIcon = totalFailed === 0 ? '🎉' : '💥';
        
        console.log(`${overallIcon} Overall Status: ${overallStatus}`);
        console.log('='.repeat(60));

        return totalFailed === 0;
    }

    /**
     * Print environment information
     */
    printEnvironmentInfo() {
        console.log('🌍 ENVIRONMENT INFORMATION');
        console.log('─'.repeat(60));
        console.log(`Node.js Version: ${process.version}`);
        console.log(`Platform: ${process.platform}`);
        console.log(`Architecture: ${process.arch}`);
        console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
        console.log(`API Key configured: ${process.env.DASHSCOPE_API_KEY ? 'Yes' : 'No'}`);
        console.log(`Test Mode: ${process.env.NODE_ENV === 'test' ? 'Yes' : 'No'}`);
        console.log('─'.repeat(60));
    }

    /**
     * Check prerequisites
     * @returns {boolean} - Whether prerequisites are met
     */
    checkPrerequisites() {
        console.log('🔍 CHECKING PREREQUISITES');
        console.log('─'.repeat(60));

        const checks = [
            {
                name: 'Node.js Version',
                check: () => {
                    const version = process.version;
                    const major = parseInt(version.slice(1).split('.')[0]);
                    return major >= 18;
                },
                message: 'Node.js 18+ required'
            },
            {
                name: 'Environment Variables',
                check: () => process.env.DASHSCOPE_API_KEY && process.env.OPENAI_BASE_URL,
                message: 'API configuration required for full tests'
            },
            {
                name: 'Test Files',
                check: () => {
                    return fs.existsSync(path.join(__dirname, 'unit.test.js')) &&
                           fs.existsSync(path.join(__dirname, 'integration.test.js'));
                },
                message: 'Test files must exist'
            }
        ];

        let allPassed = true;
        for (const check of checks) {
            const passed = check.check();
            const icon = passed ? '✅' : '⚠️';
            console.log(`${icon} ${check.name}: ${passed ? 'OK' : check.message}`);
            if (!passed && check.name !== 'Environment Variables') {
                allPassed = false;
            }
        }

        console.log('─'.repeat(60));
        return allPassed;
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        console.log('🚀 REAL ESTATE ANALYZER - TEST SUITE');
        console.log('='.repeat(60));

        this.printEnvironmentInfo();

        if (!this.checkPrerequisites()) {
            console.log('❌ Prerequisites not met. Exiting.');
            process.exit(1);
        }

        const testFiles = [
            { file: path.join(__dirname, 'unit.test.js'), type: 'unit' },
            { file: path.join(__dirname, 'integration.test.js'), type: 'integration' }
        ];

        let allTestsPassed = true;

        for (const { file, type } of testFiles) {
            const success = await this.runTest(file, type);
            if (!success) {
                allTestsPassed = false;
            }
            
            // Small delay between test suites
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const overallSuccess = this.printSummary();
        
        if (!overallSuccess) {
            console.log('\n📋 FAILURE DETAILS:');
            console.log('─'.repeat(60));
            
            for (const [testType, result] of Object.entries(this.testResults)) {
                if (result.status === 'failed' && result.error) {
                    console.log(`\n❌ ${testType.toUpperCase()} Test Errors:`);
                    console.log(result.error);
                }
            }
        }

        process.exit(overallSuccess ? 0 : 1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test run interrupted by user');
    process.exit(130);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Test run terminated');
    process.exit(143);
});

// Run tests if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const runner = new TestRunner();
    runner.runAllTests().catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}
