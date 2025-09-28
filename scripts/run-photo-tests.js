#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Comprehensive Photo Upload Test Suite\n');

const testResults = {
    unit: { passed: 0, failed: 0, total: 0 },
    api: { passed: 0, failed: 0, total: 0 },
    e2e: { passed: 0, failed: 0, total: 0 },
    total: { passed: 0, failed: 0, total: 0 }
};

function runTest(testType, testFile, description) {
    console.log(`\n📋 ${description}`);
    console.log('─'.repeat(50));
    
    try {
        const startTime = Date.now();
        const output = execSync(`npm test ${testFile}`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        const duration = Date.now() - startTime;
        
        // Parse Jest output to count tests
        const lines = output.split('\n');
        let passed = 0, failed = 0, total = 0;
        
        for (const line of lines) {
            if (line.includes('Tests:')) {
                const match = line.match(/(\d+) passed|(\d+) failed|(\d+) total/);
                if (match) {
                    if (match[1]) passed = parseInt(match[1]);
                    if (match[2]) failed = parseInt(match[2]);
                    if (match[3]) total = parseInt(match[3]);
                }
            }
        }
        
        testResults[testType].passed += passed;
        testResults[testType].failed += failed;
        testResults[testType].total += total;
        
        console.log(`✅ ${passed} passed, ${failed} failed (${duration}ms)`);
        
        if (failed > 0) {
            console.log('❌ Test failures detected');
            console.log(output);
        }
        
    } catch (error) {
        testResults[testType].failed += 1;
        testResults[testType].total += 1;
        
        console.log('❌ Test execution failed');
        console.log(error.message);
    }
}

function runE2ETest(testFile, description) {
    console.log(`\n📋 ${description}`);
    console.log('─'.repeat(50));
    
    try {
        const startTime = Date.now();
        const output = execSync(`npx playwright test ${testFile} --reporter=line`, { 
            encoding: 'utf8',
            stdio: 'pipe'
        });
        const duration = Date.now() - startTime;
        
        // Parse Playwright output
        const lines = output.split('\n');
        let passed = 0, failed = 0, total = 0;
        
        for (const line of lines) {
            if (line.includes('passed') || line.includes('failed')) {
                const passedMatch = line.match(/(\d+) passed/);
                const failedMatch = line.match(/(\d+) failed/);
                const totalMatch = line.match(/(\d+) total/);
                
                if (passedMatch) passed = parseInt(passedMatch[1]);
                if (failedMatch) failed = parseInt(failedMatch[1]);
                if (totalMatch) total = parseInt(totalMatch[1]);
            }
        }
        
        testResults.e2e.passed += passed;
        testResults.e2e.failed += failed;
        testResults.e2e.total += total;
        
        console.log(`✅ ${passed} passed, ${failed} failed (${duration}ms)`);
        
        if (failed > 0) {
            console.log('❌ E2E test failures detected');
            console.log(output);
        }
        
    } catch (error) {
        testResults.e2e.failed += 1;
        testResults.e2e.total += 1;
        
        console.log('❌ E2E test execution failed');
        console.log(error.message);
    }
}

// Check if test files exist
const testFiles = {
    unit: 'tests/unit/photoComponent.test.js',
    api: 'tests/api/photoApi.test.js',
    e2e: 'tests/e2e/photo-upload.test.js'
};

console.log('🔍 Checking test files...');
for (const [type, file] of Object.entries(testFiles)) {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
    }
}

// Run tests
console.log('\n🚀 Starting test execution...');

// 1. Unit Tests
if (fs.existsSync(testFiles.unit)) {
    runTest('unit', testFiles.unit, 'Unit Tests - PhotoComponent Class Methods');
} else {
    console.log('⏭️  Skipping unit tests - file not found');
}

// 2. API Tests
if (fs.existsSync(testFiles.api)) {
    runTest('api', testFiles.api, 'API Tests - Photo Upload Endpoints');
} else {
    console.log('⏭️  Skipping API tests - file not found');
}

// 3. E2E Tests
if (fs.existsSync(testFiles.e2e)) {
    runE2ETest(testFiles.e2e, 'E2E Tests - Full User Workflows');
} else {
    console.log('⏭️  Skipping E2E tests - file not found');
}

// Calculate totals
testResults.total.passed = testResults.unit.passed + testResults.api.passed + testResults.e2e.passed;
testResults.total.failed = testResults.unit.failed + testResults.api.failed + testResults.e2e.failed;
testResults.total.total = testResults.unit.total + testResults.api.total + testResults.e2e.total;

// Print summary
console.log('\n📊 Test Results Summary');
console.log('═'.repeat(50));

console.log(`Unit Tests:    ${testResults.unit.passed}/${testResults.unit.total} passed`);
console.log(`API Tests:     ${testResults.api.passed}/${testResults.api.total} passed`);
console.log(`E2E Tests:     ${testResults.e2e.passed}/${testResults.e2e.total} passed`);
console.log('─'.repeat(30));
console.log(`Total:         ${testResults.total.passed}/${testResults.total.total} passed`);

const successRate = testResults.total.total > 0 ? 
    (testResults.total.passed / testResults.total.total * 100).toFixed(1) : 0;

console.log(`Success Rate:  ${successRate}%`);

if (testResults.total.failed === 0) {
    console.log('\n🎉 All tests passed! Photo upload functionality is working correctly.');
    process.exit(0);
} else {
    console.log(`\n⚠️  ${testResults.total.failed} test(s) failed. Please review the output above.`);
    process.exit(1);
}
