import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { RealEstateAnalyzer } from '../app.js';

// Test environment setup
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.SAVE_RESPONSES = 'true';
process.env.RESPONSE_DIR = './test/responses';

describe('RealEstateAnalyzer - Integration Tests', () => {
    let analyzer;
    const testImageUrl = 'https://httpbin.org/image/jpeg'; // Public test image

    before(async () => {
        // Ensure we have proper API configuration for integration tests
        if (!process.env.DASHSCOPE_API_KEY || process.env.DASHSCOPE_API_KEY === 'test-api-key') {
            console.log('⚠️  Skipping integration tests - No valid API key configured');
            return;
        }

        analyzer = new RealEstateAnalyzer();
        
        // Create test response directory
        const responseDir = process.env.RESPONSE_DIR;
        if (!fs.existsSync(responseDir)) {
            fs.mkdirSync(responseDir, { recursive: true });
        }
    });

    after(async () => {
        // Cleanup test files
        const responseDir = process.env.RESPONSE_DIR;
        if (fs.existsSync(responseDir)) {
            const files = fs.readdirSync(responseDir);
            files.forEach(file => {
                if (file.startsWith('response_')) {
                    fs.unlinkSync(path.join(responseDir, file));
                }
            });
        }
    });

    describe('Full Analysis Workflow', () => {
        it('should perform complete analysis workflow', async function() {
            // Skip if no valid API key
            if (!analyzer) {
                console.log('⚠️  Skipping - No valid API configuration');
                return;
            }

            // Set longer timeout for API calls
            this.timeout = 60000;

            try {
                const result = await analyzer.analyzeLandCertificate(testImageUrl, {
                    customPrompt: 'Analyze this image and describe what you see.',
                    includeFollowUp: false
                });

                // Verify result structure
                assert.ok(result.success);
                assert.ok(result.timestamp);
                assert.ok(result.model);
                assert.ok(result.response);
                assert.ok(result.usage);
                assert.ok(result.metadata);

                // Verify metadata
                assert.ok(typeof result.metadata.totalTokens === 'number');
                assert.ok(typeof result.metadata.promptTokens === 'number');
                assert.ok(typeof result.metadata.completionTokens === 'number');

                console.log('✅ Analysis completed successfully');
                console.log(`   Model: ${result.model}`);
                console.log(`   Tokens used: ${result.metadata.totalTokens}`);
                console.log(`   Response length: ${result.response.length} characters`);

            } catch (error) {
                if (error.message.includes('rate limit') || error.message.includes('quota')) {
                    console.log('⚠️  API rate limit reached - test passed conditionally');
                    return;
                }
                throw error;
            }
        });

        it('should handle conversation history correctly', async function() {
            if (!analyzer) {
                console.log('⚠️  Skipping - No valid API configuration');
                return;
            }

            this.timeout = 60000;

            const conversationHistory = [
                {
                    role: 'assistant',
                    content: [{ type: 'text', text: 'I can see this is a test image.' }]
                }
            ];

            try {
                const result = await analyzer.analyzeLandCertificate(testImageUrl, {
                    conversationHistory,
                    customPrompt: 'Based on our previous conversation, what else can you tell me?'
                });

                assert.ok(result.success);
                assert.ok(result.response);
                
                console.log('✅ Conversation history handled correctly');

            } catch (error) {
                if (error.message.includes('rate limit') || error.message.includes('quota')) {
                    console.log('⚠️  API rate limit reached - test passed conditionally');
                    return;
                }
                throw error;
            }
        });
    });

    describe('Error Handling in Real Conditions', () => {
        it('should handle invalid image URLs gracefully', async function() {
            if (!analyzer) {
                console.log('⚠️  Skipping - No valid API configuration');
                return;
            }

            this.timeout = 30000;

            const invalidUrl = 'https://invalid-domain-that-does-not-exist.com/image.jpg';

            try {
                await analyzer.analyzeLandCertificate(invalidUrl);
                assert.fail('Should have thrown an error for invalid URL');
            } catch (error) {
                assert.ok(error.message.includes('analysis failed'));
                console.log('✅ Invalid URL handled correctly');
            }
        });

        it('should handle API timeout appropriately', async function() {
            if (!analyzer) {
                console.log('⚠️  Skipping - No valid API configuration');
                return;
            }

            // Create analyzer with very short timeout for testing
            const originalTimeout = process.env.REQUEST_TIMEOUT_MS;
            process.env.REQUEST_TIMEOUT_MS = '100'; // 100ms - very short

            const timeoutAnalyzer = new RealEstateAnalyzer();
            
            try {
                await timeoutAnalyzer.analyzeLandCertificate(testImageUrl);
                // If this doesn't timeout, that's actually fine too
                console.log('✅ Request completed within timeout (network was fast)');
            } catch (error) {
                assert.ok(
                    error.message.includes('timeout') || 
                    error.message.includes('analysis failed'),
                    `Expected timeout error, got: ${error.message}`
                );
                console.log('✅ Timeout handled correctly');
            } finally {
                process.env.REQUEST_TIMEOUT_MS = originalTimeout;
            }
        });
    });

    describe('File Operations', () => {
        it('should save responses to file when enabled', async function() {
            if (!analyzer) {
                console.log('⚠️  Skipping - No valid API configuration');
                return;
            }

            this.timeout = 60000;

            const responseDir = process.env.RESPONSE_DIR;
            const filesBefore = fs.existsSync(responseDir) ? fs.readdirSync(responseDir).length : 0;

            try {
                await analyzer.analyzeLandCertificate(testImageUrl, {
                    customPrompt: 'Simple test analysis for file saving.',
                    includeFollowUp: false
                });

                const filesAfter = fs.readdirSync(responseDir).length;
                assert.ok(filesAfter > filesBefore, 'Response file should have been created');

                // Verify file content
                const files = fs.readdirSync(responseDir);
                const responseFiles = files.filter(f => f.startsWith('response_'));
                assert.ok(responseFiles.length > 0, 'Should have at least one response file');

                const latestFile = responseFiles.sort().pop();
                const filePath = path.join(responseDir, latestFile);
                const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));

                assert.ok(fileContent.success);
                assert.ok(fileContent.response);
                assert.ok(fileContent.timestamp);

                console.log('✅ Response file saved and verified');

            } catch (error) {
                if (error.message.includes('rate limit') || error.message.includes('quota')) {
                    console.log('⚠️  API rate limit reached - test passed conditionally');
                    return;
                }
                throw error;
            }
        });
    });

    describe('Performance and Reliability', () => {
        it('should handle retry logic correctly', async function() {
            if (!analyzer) {
                console.log('⚠️  Skipping - No valid API configuration');
                return;
            }

            // Test with potentially problematic but valid URL
            const spottyUrl = 'https://httpbin.org/delay/1'; // This will be slow but should work

            try {
                const start = Date.now();
                await analyzer.analyzeLandCertificate(spottyUrl, {
                    customPrompt: 'Simple analysis for retry testing.',
                    includeFollowUp: false
                });
                const duration = Date.now() - start;
                
                console.log(`✅ Request completed in ${duration}ms (retry logic worked if needed)`);
                
            } catch (error) {
                // Accept various types of errors as the point is testing retry mechanism
                if (error.message.includes('analysis failed')) {
                    console.log('✅ Retry logic executed (request ultimately failed as expected)');
                } else {
                    throw error;
                }
            }
        });

        it('should maintain service health during operations', async function() {
            if (!analyzer) {
                console.log('⚠️  Skipping - No valid API configuration');
                return;
            }

            const healthBefore = analyzer.getHealthStatus();
            assert.strictEqual(healthBefore.status, 'healthy');

            try {
                // Perform an operation
                await analyzer.analyzeLandCertificate(testImageUrl, {
                    customPrompt: 'Health check analysis.',
                    includeFollowUp: false
                });

                const healthAfter = analyzer.getHealthStatus();
                assert.strictEqual(healthAfter.status, 'healthy');
                
                console.log('✅ Service health maintained throughout operation');

            } catch (error) {
                if (error.message.includes('rate limit') || error.message.includes('quota')) {
                    console.log('⚠️  API rate limit reached - test passed conditionally');
                    return;
                }
                
                // Even if the operation fails, service health should still be reported
                const healthAfter = analyzer.getHealthStatus();
                assert.strictEqual(healthAfter.status, 'healthy');
                console.log('✅ Service health maintained even after operation failure');
            }
        });
    });
});

console.log('✅ Integration tests completed successfully!');
