/**
 * Test Utilities and Helpers
 * ==========================
 * 
 * Common utilities for testing the Real Estate Analyzer
 */

export class TestHelpers {
    /**
     * Generate mock API completion response
     * @param {Object} options - Options for the mock response
     * @returns {Object} Mock completion object
     */
    static createMockCompletion(options = {}) {
        return {
            model: options.model || 'test-model',
            choices: [{
                message: { 
                    content: options.content || 'Mock response content' 
                },
                finish_reason: options.finishReason || 'stop'
            }],
            usage: {
                total_tokens: options.totalTokens || 100,
                prompt_tokens: options.promptTokens || 50,
                completion_tokens: options.completionTokens || 50
            }
        };
    }

    /**
     * Generate mock land certificate data
     * @returns {Object} Mock certificate data
     */
    static createMockLandCertificateData() {
        return {
            metadata: {
                document_type: "Land_Certificate",
                document_name: "Giấy chứng nhận quyền sử dụng đất",
                issuing_authority: "Cộng hòa xã hội chủ nghĩa Việt Nam",
                certificate_number: "TEST123456",
                registration_number: "REG789"
            },
            property_owners: [{
                owner_type: "Ông",
                full_name: "Nguyễn Văn Test",
                date_of_birth: "1990",
                id_number: "123456789",
                permanent_address: "Test Address, Test City"
            }],
            land_information: {
                land_address: "Test Land Address",
                plot_number: "TEST001",
                area: "100.0 m²",
                usage_purpose: "Đất ở tại đô thị",
                usage_form: "Sử dụng riêng",
                usage_duration: "Lâu dài"
            }
        };
    }

    /**
     * Create a mock response with JSON data
     * @param {Object} data - Data to include in JSON
     * @returns {string} Formatted response with JSON
     */
    static createMockResponseWithJson(data) {
        return `Đây là phân tích từ sổ đỏ:

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

Dữ liệu đã được trích xuất thành công.`;
    }

    /**
     * Validate response structure
     * @param {Object} response - Response to validate
     * @returns {Object} Validation result
     */
    static validateResponseStructure(response) {
        const errors = [];
        const warnings = [];

        // Required fields
        const requiredFields = ['success', 'timestamp', 'model', 'response', 'usage', 'metadata'];
        for (const field of requiredFields) {
            if (!(field in response)) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Type checks
        if (typeof response.success !== 'boolean') {
            errors.push('success must be boolean');
        }

        if (response.timestamp && isNaN(Date.parse(response.timestamp))) {
            errors.push('timestamp must be valid ISO string');
        }

        if (response.usage) {
            const usageFields = ['total_tokens', 'prompt_tokens', 'completion_tokens'];
            for (const field of usageFields) {
                if (response.usage[field] && typeof response.usage[field] !== 'number') {
                    warnings.push(`usage.${field} should be number`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Create test image URLs for different scenarios
     * @returns {Object} Collection of test URLs
     */
    static getTestImageUrls() {
        return {
            valid: 'https://httpbin.org/image/jpeg',
            png: 'https://httpbin.org/image/png',
            invalid: 'https://invalid-domain-12345.com/image.jpg',
            notFound: 'https://httpbin.org/status/404',
            slow: 'https://httpbin.org/delay/5',
            large: 'https://httpbin.org/image/jpeg?size=2048',
            malformed: 'not-a-url'
        };
    }

    /**
     * Setup test environment
     */
    static setupTestEnvironment() {
        // Store original environment
        const originalEnv = { ...process.env };

        // Set test environment variables
        process.env.NODE_ENV = 'test';
        process.env.LOG_LEVEL = 'error';
        process.env.SAVE_RESPONSES = 'false';

        return {
            restore: () => {
                // Restore original environment
                Object.keys(process.env).forEach(key => {
                    if (originalEnv[key] !== undefined) {
                        process.env[key] = originalEnv[key];
                    } else {
                        delete process.env[key];
                    }
                });
            }
        };
    }

    /**
     * Wait for a specified amount of time
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise} Promise that resolves after the delay
     */
    static async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Measure execution time of a function
     * @param {Function} fn - Function to measure
     * @returns {Promise<Object>} Result with execution time
     */
    static async measureTime(fn) {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            return { result, duration, success: true };
        } catch (error) {
            const duration = Date.now() - start;
            return { error, duration, success: false };
        }
    }

    /**
     * Create a temporary directory for testing
     * @param {string} prefix - Directory prefix
     * @returns {string} Path to temporary directory
     */
    static createTempDir(prefix = 'test_') {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        const tempDir = path.join(os.tmpdir(), `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        fs.mkdirSync(tempDir, { recursive: true });
        
        return tempDir;
    }

    /**
     * Clean up temporary directory
     * @param {string} dirPath - Directory to clean up
     */
    static cleanupTempDir(dirPath) {
        const fs = require('fs');
        const path = require('path');

        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    this.cleanupTempDir(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            }
            fs.rmdirSync(dirPath);
        }
    }

    /**
     * Assert that a value matches expected type and structure
     * @param {any} value - Value to check
     * @param {Object} schema - Expected schema
     * @returns {boolean} Whether value matches schema
     */
    static matchesSchema(value, schema) {
        for (const [key, expectedType] of Object.entries(schema)) {
            if (!(key in value)) {
                return false;
            }

            const actualType = typeof value[key];
            if (actualType !== expectedType) {
                return false;
            }
        }
        return true;
    }
}

/**
 * Mock OpenAI Client for Testing
 */
export class MockOpenAIClient {
    constructor(options = {}) {
        this.options = options;
        this.callCount = 0;
        this.lastCall = null;
        
        // Create the chat property with completions
        this.chat = {
            completions: {
                create: this.createCompletion.bind(this)
            }
        };
    }

    async createCompletion(params) {
        this.callCount++;
        this.lastCall = { params, timestamp: new Date() };

        // Simulate various scenarios based on options
        if (this.options.shouldFail) {
            throw new Error(this.options.errorMessage || 'Mock API error');
        }

        if (this.options.delay) {
            await TestHelpers.wait(this.options.delay);
        }

        return TestHelpers.createMockCompletion(this.options.response || {});
    }

    getCallHistory() {
        return {
            count: this.callCount,
            lastCall: this.lastCall
        };
    }

    reset() {
        this.callCount = 0;
        this.lastCall = null;
    }
}

export default TestHelpers;
