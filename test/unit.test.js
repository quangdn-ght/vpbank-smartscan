import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RealEstateAnalyzer } from '../app.js';

// Mock environment variables for testing
process.env.DASHSCOPE_API_KEY = 'test-api-key';
process.env.OPENAI_BASE_URL = 'https://test-api.example.com';
process.env.AI_MODEL = 'test-model';
process.env.LOG_LEVEL = 'error'; // Suppress logs during testing
process.env.NODE_ENV = 'test';

describe('RealEstateAnalyzer - Unit Tests', () => {
    let analyzer;

    beforeEach(() => {
        analyzer = new RealEstateAnalyzer();
    });

    describe('Constructor and Initialization', () => {
        it('should initialize properly with valid configuration', () => {
            assert.ok(analyzer instanceof RealEstateAnalyzer);
            assert.ok(analyzer.openai);
            assert.ok(analyzer.prompts);
        });

        it('should throw error when required environment variables are missing', () => {
            const originalApiKey = process.env.DASHSCOPE_API_KEY;
            delete process.env.DASHSCOPE_API_KEY;

            assert.throws(() => {
                new RealEstateAnalyzer();
            }, /Missing required environment variables/);

            process.env.DASHSCOPE_API_KEY = originalApiKey;
        });
    });

    describe('Configuration Validation', () => {
        it('should validate configuration successfully with all required variables', () => {
            assert.doesNotThrow(() => {
                analyzer.validateConfig();
            });
        });

        it('should identify missing environment variables', () => {
            const originalModel = process.env.AI_MODEL;
            delete process.env.AI_MODEL;

            assert.throws(() => {
                analyzer.validateConfig();
            }, /Missing required environment variables: AI_MODEL/);

            process.env.AI_MODEL = originalModel;
        });
    });

    describe('URL Validation', () => {
        it('should validate valid HTTP URLs', () => {
            const validUrls = [
                'http://example.com/image.jpg',
                'https://example.com/image.png',
                'https://api.example.com/v1/images/123.jpeg'
            ];

            validUrls.forEach(url => {
                assert.strictEqual(analyzer.isValidImageUrl(url), true, `URL should be valid: ${url}`);
            });
        });

        it('should reject invalid URLs', () => {
            const invalidUrls = [
                'ftp://example.com/image.jpg',
                'file:///local/image.jpg',
                'not-a-url',
                '',
                null,
                undefined
            ];

            invalidUrls.forEach(url => {
                assert.strictEqual(analyzer.isValidImageUrl(url), false, `URL should be invalid: ${url}`);
            });
        });
    });

    describe('Message Building', () => {
        it('should build basic messages correctly', () => {
            const imageUrl = 'https://example.com/test.jpg';
            const messages = analyzer.buildMessages(imageUrl);

            assert.ok(Array.isArray(messages));
            assert.strictEqual(messages.length, 2); // User message + follow-up
            
            const userMessage = messages[0];
            assert.strictEqual(userMessage.role, 'user');
            assert.ok(Array.isArray(userMessage.content));
            assert.strictEqual(userMessage.content.length, 2); // Text + image
            
            const textContent = userMessage.content[0];
            const imageContent = userMessage.content[1];
            
            assert.strictEqual(textContent.type, 'text');
            assert.ok(textContent.text.includes('Bạn là trợ lý AI'));
            
            assert.strictEqual(imageContent.type, 'image_url');
            assert.strictEqual(imageContent.image_url.url, imageUrl);
        });

        it('should build messages with custom prompt', () => {
            const imageUrl = 'https://example.com/test.jpg';
            const customPrompt = 'Custom analysis prompt';
            const messages = analyzer.buildMessages(imageUrl, { customPrompt });

            const userMessage = messages[0];
            const textContent = userMessage.content[0];
            
            assert.strictEqual(textContent.text, customPrompt);
        });

        it('should include conversation history when provided', () => {
            const imageUrl = 'https://example.com/test.jpg';
            const conversationHistory = [
                { role: 'assistant', content: 'Previous response' }
            ];
            const messages = analyzer.buildMessages(imageUrl, { conversationHistory });

            assert.strictEqual(messages.length, 3); // User + history + follow-up
            assert.deepStrictEqual(messages[1], conversationHistory[0]);
        });

        it('should exclude follow-up when specified', () => {
            const imageUrl = 'https://example.com/test.jpg';
            const messages = analyzer.buildMessages(imageUrl, { includeFollowUp: false });

            assert.strictEqual(messages.length, 1); // Only user message
        });
    });

    describe('Response Processing', () => {
        it('should process successful API response correctly', () => {
            const mockCompletion = {
                model: 'test-model',
                choices: [{
                    message: { content: 'Test response content' },
                    finish_reason: 'stop'
                }],
                usage: {
                    total_tokens: 100,
                    prompt_tokens: 50,
                    completion_tokens: 50
                }
            };

            const result = analyzer.processResponse(mockCompletion);

            assert.strictEqual(result.success, true);
            assert.ok(result.timestamp);
            assert.strictEqual(result.model, 'test-model');
            assert.strictEqual(result.response, 'Test response content');
            assert.deepStrictEqual(result.usage, mockCompletion.usage);
            assert.strictEqual(result.metadata.finishReason, 'stop');
            assert.strictEqual(result.metadata.totalTokens, 100);
        });

        it('should extract JSON from response when present', () => {
            const jsonData = { test: 'data', nested: { value: 123 } };
            const responseWithJson = `Here is the analysis:

\`\`\`json
${JSON.stringify(jsonData, null, 2)}
\`\`\`

This is the extracted information.`;

            const mockCompletion = {
                model: 'test-model',
                choices: [{ message: { content: responseWithJson }, finish_reason: 'stop' }],
                usage: { total_tokens: 100, prompt_tokens: 50, completion_tokens: 50 }
            };

            const result = analyzer.processResponse(mockCompletion);

            assert.ok(result.extractedData);
            assert.deepStrictEqual(result.extractedData, jsonData);
        });

        it('should handle response without JSON gracefully', () => {
            const mockCompletion = {
                model: 'test-model',
                choices: [{ message: { content: 'Plain text response' }, finish_reason: 'stop' }],
                usage: { total_tokens: 50, prompt_tokens: 25, completion_tokens: 25 }
            };

            const result = analyzer.processResponse(mockCompletion);

            assert.strictEqual(result.success, true);
            assert.strictEqual(result.extractedData, undefined);
        });
    });

    describe('Health Status', () => {
        it('should return proper health status', () => {
            const health = analyzer.getHealthStatus();

            assert.strictEqual(health.status, 'healthy');
            assert.ok(health.timestamp);
            assert.strictEqual(health.config.model, process.env.AI_MODEL);
            assert.strictEqual(health.config.baseURL, process.env.OPENAI_BASE_URL);
            assert.strictEqual(health.config.hasApiKey, true);
            assert.strictEqual(health.config.nodeEnv, 'test');
        });
    });

    describe('Utility Functions', () => {
        it('should implement sleep function correctly', async () => {
            const start = Date.now();
            await analyzer.sleep(100);
            const elapsed = Date.now() - start;
            
            // Allow some variance in timing
            assert.ok(elapsed >= 95 && elapsed <= 150, `Sleep should take ~100ms, took ${elapsed}ms`);
        });

        it('should load prompts correctly', () => {
            const prompts = analyzer.loadPrompts();
            
            assert.ok(prompts.systemPrompt);
            assert.ok(prompts.followUpPrompt);
            assert.ok(prompts.systemPrompt.includes('Bạn là trợ lý AI'));
            assert.strictEqual(prompts.followUpPrompt, 'What can you do next?');
        });
    });

    describe('Error Handling', () => {
        it('should handle missing environment variables gracefully', () => {
            // Test individual missing variables
            const originalValues = {};
            const requiredVars = ['DASHSCOPE_API_KEY', 'OPENAI_BASE_URL', 'AI_MODEL'];
            
            requiredVars.forEach(varName => {
                originalValues[varName] = process.env[varName];
                delete process.env[varName];
                
                assert.throws(() => {
                    new RealEstateAnalyzer();
                }, new RegExp(`Missing required environment variables.*${varName}`));
                
                process.env[varName] = originalValues[varName];
            });
        });
    });
});

console.log('✅ Unit tests completed successfully!');
