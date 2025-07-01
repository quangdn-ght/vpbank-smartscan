import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

/**
 * Real Estate Document Analysis Service
 * ====================================
 * 
 * This service analyzes Vietnamese land use rights certificates (Sổ đỏ)
 * and extracts structured data for banking and CRM systems.
 */

class RealEstateAnalyzer {
    constructor() {
        this.validateConfig();
        this.openai = this.initializeOpenAI();
        this.prompts = this.loadPrompts();
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
     * Validate image URL
     * @param {string} imageUrl - URL to validate
     * @returns {boolean} Is valid URL
     */
    isValidImageUrl(imageUrl) {
        try {
            const url = new URL(imageUrl);
            return ['http:', 'https:'].includes(url.protocol);
        } catch {
            return false;
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
        const analyzer = new RealEstateAnalyzer();
        
        // Health check
        console.log('Service Health:', JSON.stringify(analyzer.getHealthStatus(), null, 2));
        
        // Example analysis with the existing image URL
        const imageUrl = "https://bailian-bmp-intl-prod.oss-ap-southeast-1.aliyuncs.com/model_offline_result/34582/1751359160145/qianwen/merged.jpg?Expires=1751359837&OSSAccessKeyId=STS.NY1kgjVxyywKNATEagDuCnHQU&Signature=S1ZOuOVQ5A8T%2BYMKj1I%2BNn4MFlU%3D&security-token=CAIS4gJ1q6Ft5B2yfSjIr5qEIN3eu6dYzrWgTGfloWEySPpvgY36tzz2IHhMenJsA%2BsYv%2Fg%2BnW1Y6%2Fsalrp6SJtIXleCZtF94oxN9h2gb4yoOGmWQ0s%2FLI3OaLjKm9u2wCryLYbGwU%2FOpbE%2B%2B5U0X6LDmdDKkckW4OJmS8%2FBOZcgWWQ%2FKBlgvRq0hRG1YpdQdKGHaONu0LxfumRCwNkdzvRdmgm4NgsbWgO%2Fkt0WF1A2jkL5F%2Bt6gfcD9P%2FMBZskvA4eHu8VtbbfE3SJq7BxHybx7lqQs%2B02c5onDWAULuEvXb7uNr40ycVdjLKIgHKdIt%2FP7jfA9sOHVnITywgxOePlRWjjRQ5qlhcrCBOe5pC7cnxAXxBYnu%2FP41fmd22tMCRpzv4NZbsK4XTQ537BG%2F7tOkFVDRPxAGDKICvHj%2Fuhf6oF%2BpDbDtvnpHBOsWN6yskt2d%2BF6AQpGWBB%2B7z8AhvBuG2QagAElOqometFiPMI8opX2%2Fd2t5iPCN6JYc7t3BcgPQrCGqJ%2FSU%2Fhf%2BANRMnp22GPfMgsdTtKeIJV1%2BrY1bwBYMpvmyVFlVVpKImc6CUKYIk8z%2BykcPlYwGnRdlK0Sx66zYcd7j3PPC9r%2BS3hNufLxo0X0apC5cxA9c%2FXkH2dljehjnSAA";
        
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
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
