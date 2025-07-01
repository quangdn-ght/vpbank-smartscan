import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

console.log('Environment loaded, starting application...');

/**
 * Real Estate Document Analysis Service
 * ====================================
 * 
 * This service analyzes Vietnamese land use rights certificates (Sổ đỏ)
 * and extracts structured data for banking and CRM systems.
 */

class RealEstateAnalyzer {
    constructor() {
        console.log('Initializing RealEstateAnalyzer...');
        console.log('Validating configuration...');
        this.validateConfig();
        console.log('Initializing OpenAI client...');
        this.openai = this.initializeOpenAI();
        console.log('Loading prompts...');
        this.prompts = this.loadPrompts();
        console.log('RealEstateAnalyzer initialization complete');
    }

    /**
     * Validate required configuration
     */
    validateConfig() {
        const requiredEnvVars = ['DASHSCOPE_API_KEY', 'OPENAI_BASE_URL', 'AI_MODEL'];
        const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }

    /**
     * Initialize OpenAI client with configuration
     */
    initializeOpenAI() {
        return new OpenAI({
            apiKey: process.env.DASHSCOPE_API_KEY,
            baseURL: process.env.OPENAI_BASE_URL,
            timeout: parseInt(process.env.REQUEST_TIMEOUT_MS) || 30000,
        });
    }

    /**
     * Load system prompts for analysis
     */
    loadPrompts() {
        return {
            systemPrompt: `
Bạn là trợ lý AI chuyên về phân tích dữ liệu bất động sản.

Nhiệm vụ của bạn là:

Đọc và phân tích thông tin từ ảnh chụp Giấy chứng nhận quyền sử dụng đất, quyền sở hữu nhà ở và tài sản khác gắn liền với đất (thường gọi là "sổ đỏ").

phân loại và đánh nhãn loại tài liệu này trong metadata json

Xác định và trích xuất các trường thông tin quan trọng bao gồm nhưng không giới hạn:

Thông tin chủ sở hữu
Địa chỉ thửa đất
Số thửa, số tờ bản đồ
Diện tích
Mục đích sử dụng
Hình thức sử dụng (riêng, chung)
Thời hạn sử dụng
Nguồn gốc sử dụng
Tài sản gắn liền với đất (nếu có)

Tổng hợp và xuất dữ liệu vào định dạng JSON chuẩn, dễ dàng tích hợp vào hệ thống quản lý tài sản ngân hàng hoặc phần mềm CRM.

Trả kết quả dưới dạng đối tượng JSON duy nhất, có cấu trúc rõ ràng và dễ đọc.
            `.trim(),
            
            followUpPrompt: "What can you do next?"
        };
    }

    /**
     * Analyze land certificate image
     * @param {string} imageUrl - URL of the image to analyze
     * @param {Object} options - Additional options for analysis
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeLandCertificate(imageUrl, options = {}) {
        try {
            this.log('Starting land certificate analysis...', 'info');
            
            const messages = this.buildMessages(imageUrl, options);
            
            const completion = await this.callOpenAI(messages);
            
            const result = this.processResponse(completion);
            
            if (process.env.SAVE_RESPONSES === 'true') {
                await this.saveResponse(result);
            }
            
            this.log('Analysis completed successfully', 'info');
            return result;
            
        } catch (error) {
            this.log(`Analysis failed: ${error.message}`, 'error');
            throw new Error(`Land certificate analysis failed: ${error.message}`);
        }
    }

    /**
     * Build messages array for OpenAI API
     * @param {string} imageUrl - URL of the image
     * @param {Object} options - Additional options
     * @returns {Array} Messages array
     */
    buildMessages(imageUrl, options = {}) {
        const userMessage = {
            role: "user",
            content: [
                {
                    type: "text",
                    text: options.customPrompt || this.prompts.systemPrompt
                },
                {
                    type: "image_url",
                    image_url: { url: imageUrl }
                }
            ]
        };

        const messages = [userMessage];

        // Add conversation history if provided
        if (options.conversationHistory) {
            messages.push(...options.conversationHistory);
        }

        // Add follow-up question
        if (options.includeFollowUp !== false) {
            messages.push({
                role: "user",
                content: [{ type: "text", text: this.prompts.followUpPrompt }]
            });
        }

        return messages;
    }

    /**
     * Call OpenAI API with retry logic
     * @param {Array} messages - Messages to send
     * @returns {Promise<Object>} API response
     */
    async callOpenAI(messages) {
        const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
        const retryDelay = parseInt(process.env.RETRY_DELAY_MS) || 1000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log(`API call attempt ${attempt}/${maxRetries}`, 'debug');
                
                const completion = await this.openai.chat.completions.create({
                    model: process.env.AI_MODEL,
                    messages: messages,
                    max_tokens: parseInt(process.env.MAX_TOKENS) || 4000,
                    temperature: parseFloat(process.env.TEMPERATURE) || 0.1,
                });

                return completion;
                
            } catch (error) {
                this.log(`API call attempt ${attempt} failed: ${error.message}`, 'warn');
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retry
                await this.sleep(retryDelay * attempt);
            }
        }
    }

    /**
     * Process API response
     * @param {Object} completion - OpenAI API response
     * @returns {Object} Processed result
     */
    processResponse(completion) {
        const result = {
            success: true,
            timestamp: new Date().toISOString(),
            model: completion.model,
            usage: completion.usage,
            response: completion.choices[0]?.message?.content || '',
            metadata: {
                finishReason: completion.choices[0]?.finish_reason,
                totalTokens: completion.usage?.total_tokens,
                promptTokens: completion.usage?.prompt_tokens,
                completionTokens: completion.usage?.completion_tokens
            }
        };

        // Try to extract JSON from response if it contains structured data
        try {
            const jsonMatch = result.response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                result.extractedData = JSON.parse(jsonMatch[1]);
            }
        } catch (error) {
            this.log('Could not extract JSON from response', 'debug');
        }

        return result;
    }

    /**
     * Save response to file
     * @param {Object} result - Analysis result
     */
    async saveResponse(result) {
        try {
            const responseDir = process.env.RESPONSE_DIR || './responses';
            
            // Create directory if it doesn't exist
            if (!fs.existsSync(responseDir)) {
                fs.mkdirSync(responseDir, { recursive: true });
            }

            const filename = `response_${Date.now()}.json`;
            const filepath = path.join(responseDir, filename);

            console.log(`Saving response to ${filepath}`);
            this.log(`Saving response to ${filepath}`, 'debug');
            
            fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
            this.log(`Response saved to ${filepath}`, 'debug');
            
        } catch (error) {
            this.log(`Failed to save response: ${error.message}`, 'warn');
        }
    }

    /**
     * Utility function for logging
     * @param {string} message - Log message
     * @param {string} level - Log level
     */
    log(message, level = 'info') {
        const logLevel = process.env.LOG_LEVEL || 'info';
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        
        if (levels[level] <= levels[logLevel]) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
        }
    }

    /**
     * Utility function for sleep/delay
     * @param {number} ms - Milliseconds to sleep
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Validate image URL (supports both HTTP URLs and base64 data URLs)
     * @param {string} imageUrl - URL to validate
     * @returns {boolean} Is valid URL
     */
    isValidImageUrl(imageUrl) {
        try {
            // Check for base64 data URL
            if (imageUrl.startsWith('data:image/')) {
                return true;
            }
            
            // Check for HTTP URL
            const url = new URL(imageUrl);
            return ['http:', 'https:'].includes(url.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Convert local image file to base64 data URL
     * @param {string} imagePath - Path to the local image file
     * @returns {string} Base64 data URL
     */
    convertImageToBase64(imagePath) {
        try {
            // Resolve the absolute path
            const absolutePath = path.resolve(imagePath);
            
            // Check if file exists
            if (!fs.existsSync(absolutePath)) {
                throw new Error(`Image file not found: ${absolutePath}`);
            }
            
            // Read the file
            const imageBuffer = fs.readFileSync(absolutePath);
            
            // Get file extension to determine MIME type
            const ext = path.extname(imagePath).toLowerCase();
            let mimeType;
            
            switch (ext) {
                case '.jpg':
                case '.jpeg':
                    mimeType = 'image/jpeg';
                    break;
                case '.png':
                    mimeType = 'image/png';
                    break;
                case '.webp':
                    mimeType = 'image/webp';
                    break;
                case '.gif':
                    mimeType = 'image/gif';
                    break;
                default:
                    mimeType = 'image/jpeg'; // Default fallback
            }
            
            // Convert to base64 data URL
            const base64String = imageBuffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64String}`;
            
            this.log(`Converted ${imagePath} to base64 data URL (${imageBuffer.length} bytes)`, 'debug');
            return dataUrl;
            
        } catch (error) {
            this.log(`Failed to convert image to base64: ${error.message}`, 'error');
            throw new Error(`Image conversion failed: ${error.message}`);
        }
    }

    /**
     * Get service health status
     * @returns {Object} Health status
     */
    getHealthStatus() {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            config: {
                model: process.env.AI_MODEL,
                baseURL: process.env.OPENAI_BASE_URL,
                hasApiKey: !!process.env.DASHSCOPE_API_KEY,
                nodeEnv: process.env.NODE_ENV
            }
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    try {
        console.log('Starting main function...');
        const analyzer = new RealEstateAnalyzer();
        console.log('RealEstateAnalyzer created successfully');
        
        // Health check
        console.log('Getting health status...');
        const healthStatus = analyzer.getHealthStatus();
        console.log('Service Health:', JSON.stringify(healthStatus, null, 2));
        
        // Get image path from environment variable or command line argument
        let imagePath = process.env.TEST_IMAGE_PATH || process.argv[2] || './process/merged.jpg';
        
        console.log(`Using image path: ${imagePath}`);
        
        // Convert local image to base64 data URL
        console.log('Converting image to base64...');
        const imageUrl = analyzer.convertImageToBase64(imagePath);
        console.log('Image converted successfully');
        
        const result = await analyzer.analyzeLandCertificate(imageUrl);
        
        console.log('\n=== ANALYSIS RESULT ===');
        console.log(JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Application error:', error.message);
        process.exit(1);
    }
}

// Export for testing
export { RealEstateAnalyzer };

// Run main function if this file is executed directly
console.log('Checking execution condition...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// Convert file path to file URL for proper comparison
const currentFileUrl = new URL(import.meta.url).href;
const executedFileUrl = new URL(`file://${process.argv[1]}`).href;

console.log('currentFileUrl:', currentFileUrl);
console.log('executedFileUrl:', executedFileUrl);

if (currentFileUrl === executedFileUrl) {
    console.log('Running main function...');
    main();
} else {
    console.log('File not executed directly, skipping main()');
}
