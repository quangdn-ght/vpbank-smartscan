# Real Estate Document Analyzer - Testing Guide

This guide covers how to test the Real Estate Document Analyzer application.

## 📋 Test Overview

The test suite includes:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test complete workflows with real API calls
- **Test Utilities**: Helper functions and mock objects for testing

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Copy the test environment file:

```bash
cp .env.test .env
```

Edit `.env` with your actual API key:

```env
DASHSCOPE_API_KEY=your_actual_api_key_here
```

### 3. Run All Tests

```bash
npm test
```

### 4. Run Specific Test Types

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration
```

## 📁 Test Structure

```
test/
├── unit.test.js           # Unit tests for individual components
├── integration.test.js    # End-to-end integration tests
├── helpers.js            # Test utilities and mock objects
└── run-tests.js          # Test runner with detailed reporting
```

## 🧪 Test Categories

### Unit Tests

Test individual methods and components:

- ✅ Configuration validation
- ✅ URL validation
- ✅ Message building
- ✅ Response processing
- ✅ Utility functions
- ✅ Error handling

**Run unit tests:**
```bash
node test/unit.test.js
```

### Integration Tests

Test complete workflows with real API calls:

- ✅ Full analysis workflow
- ✅ Conversation history handling
- ✅ Error handling with real network conditions
- ✅ File operations
- ✅ Performance and reliability

**Run integration tests:**
```bash
node test/integration.test.js
```

## 🛠️ Test Configuration

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
NODE_ENV=test
LOG_LEVEL=error
DASHSCOPE_API_KEY=your_test_api_key
SAVE_RESPONSES=true
RESPONSE_DIR=./test/responses
REQUEST_TIMEOUT_MS=30000
MAX_RETRIES=2
```

### Test Data

The test suite uses:

- **Mock responses** for unit tests
- **Public test images** for integration tests
- **Configurable delays** and timeouts
- **Temporary files** for file operation tests

## 📊 Test Reporting

The test runner provides detailed reporting:

```
🚀 REAL ESTATE ANALYZER - TEST SUITE
============================================================

🌍 ENVIRONMENT INFORMATION
────────────────────────────────────────────────────────
Node.js Version: v20.x.x
Platform: linux
Architecture: x64
NODE_ENV: test
API Key configured: Yes
Test Mode: Yes

🔍 CHECKING PREREQUISITES
────────────────────────────────────────────────────────
✅ Node.js Version: OK
✅ Environment Variables: OK
✅ Test Files: OK

🧪 Running unit tests...
📁 File: test/unit.test.js
──────────────────────────────────────────────────────
✅ Constructor and Initialization
✅ Configuration Validation
✅ URL Validation
...

📊 TEST SUMMARY
============================================================
✅ UNIT Tests: PASSED
✅ INTEGRATION Tests: PASSED
────────────────────────────────────────────────────────
📈 Results: 2 passed, 0 failed
🎉 Overall Status: PASSED
```

## 🔧 Writing New Tests

### Unit Test Example

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RealEstateAnalyzer } from '../app.js';

describe('New Feature Tests', () => {
    it('should test new functionality', () => {
        const analyzer = new RealEstateAnalyzer();
        const result = analyzer.newMethod();
        assert.strictEqual(result, expectedValue);
    });
});
```

### Integration Test Example

```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RealEstateAnalyzer } from '../app.js';

describe('New Integration Tests', () => {
    it('should test end-to-end workflow', async function() {
        this.timeout = 60000; // 60 second timeout
        
        const analyzer = new RealEstateAnalyzer();
        const result = await analyzer.someAsyncMethod();
        
        assert.ok(result.success);
    });
});
```

## 🐛 Debugging Tests

### Enable Debug Mode

```bash
# Set debug environment
export DEBUG_MODE=true
export LOG_LEVEL=debug

# Run tests with verbose output
npm test
```

### Check Test Responses

When `SAVE_RESPONSES=true`, test responses are saved to:

```
test/responses/
├── response_1234567890123.json
├── response_1234567890124.json
└── ...
```

### Common Issues

1. **API Rate Limits**
   - Tests include rate limit handling
   - Use delays between tests if needed

2. **Network Timeouts**
   - Adjust `REQUEST_TIMEOUT_MS` in test config
   - Some tests may skip if network is slow

3. **API Key Issues**
   - Ensure valid API key in `.env`
   - Some integration tests will skip without valid key

## 📈 Test Coverage

The test suite covers:

- ✅ **Configuration** - Environment validation, API setup
- ✅ **Core Logic** - Message building, response processing
- ✅ **Error Handling** - Invalid inputs, network errors, API failures
- ✅ **Utilities** - URL validation, logging, file operations
- ✅ **Integration** - Full workflows, real API calls
- ✅ **Performance** - Timeouts, retries, large responses

## 🚀 Continuous Integration

For CI/CD pipelines:

```bash
# Install dependencies
npm ci

# Run tests with coverage
npm run test

# Check exit code
echo "Tests completed with exit code: $?"
```

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
        env:
          DASHSCOPE_API_KEY: ${{ secrets.DASHSCOPE_API_KEY }}
```

## 🔒 Security Notes

- Never commit real API keys to version control
- Use environment variables for sensitive configuration
- Test files should not contain production data
- Mock sensitive data in unit tests

## 📚 Additional Resources

- [Node.js Testing Documentation](https://nodejs.org/api/test.html)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Environment Variable Best Practices](https://12factor.net/config)

---

**Last Updated**: July 1, 2025  
**Test Framework**: Node.js built-in test runner  
**Coverage**: Unit + Integration Tests
