#!/usr/bin/env ts-node

/**
 * Smoke Test Runner for Test Environment
 * 
 * This script runs comprehensive smoke tests to verify the application
 * is working correctly in the test environment.
 */

// import { execSync } from 'child_process'; // Not used in this version
// import { PrismaClient } from '@prisma/client'; // Not used in this version

// const prisma = new PrismaClient(); // Not used in this version

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  duration: number;
}

class SmokeTestRunner {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    try {
      await testFn();
      this.results.push({
        name,
        status: 'PASS',
        message: 'Test passed successfully',
        duration: Date.now() - startTime
      });
      console.log(`✅ ${name} - PASS (${Date.now() - startTime}ms)`);
    } catch (error) {
      this.results.push({
        name,
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      });
      console.log(`❌ ${name} - FAIL (${Date.now() - startTime}ms)`);
      console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Smoke Tests for Test Environment...\n');

    // Database Connection Tests (via API)
    await this.runTest('Database Connection', async () => {
      const response = await this.makeRequest('GET', '/api/setup-database');
      if (!response.success) {
        throw new Error('Database connection failed');
      }
    });

    await this.runTest('Database Schema Exists', async () => {
      const response = await this.makeRequest('GET', '/api/setup-database');
      if (!response.success) {
        throw new Error('Database schema does not exist');
      }
      
      // Check if we have data
      const data = response.data;
      if (data.eventCount === undefined || data.userCount === undefined) {
        throw new Error('Database tables not properly initialized');
      }
    });

    // API Endpoint Tests
    await this.runTest('Version API Endpoint', async () => {
      const response = await this.makeRequest('GET', '/api/v1/version/display');
      
        if (!response.success || response.data.version !== '2.3.0') {
          throw new Error('Version API returned unexpected response');
        }
    });

    await this.runTest('Database Setup API', async () => {
      const response = await this.makeRequest('GET', '/api/setup-database');
      
      if (!response.success) {
        throw new Error('Database setup API failed');
      }
    });

    // Homepage Tests
    await this.runTest('Homepage Loads', async () => {
      const response = await this.makeRequest('GET', '/');
      
      if (!response.includes('Thanksgiving Menu Collection')) {
        throw new Error('Homepage does not contain expected content');
      }
    });

    await this.runTest('Homepage Has Menu Data', async () => {
      const response = await this.makeRequest('GET', '/');
      
      if (!response.includes('menu-card') || !response.includes('View Details')) {
        throw new Error('Homepage does not display menu cards');
      }
    });

    // Authentication Tests
    await this.runTest('Login Page Loads', async () => {
      const response = await this.makeRequest('GET', '/auth/login');
      
      if (!response.includes('Login') || !response.includes('username') || !response.includes('password')) {
        throw new Error('Login page does not contain expected form elements');
      }
    });

    await this.runTest('Login Form Submission', async () => {
      // Test login form submission with invalid credentials
      // This should return an error page, not crash the server
      const response = await this.makeRequest('POST', '/auth/login', {
        username: 'testuser',
        password: 'wrongpassword'
      });
      
      // Should redirect to login page with error (status 302) or show error message
      if (!response.includes('error') && !response.includes('Invalid')) {
        throw new Error('Login form submission did not handle invalid credentials properly');
      }
    });

    // Menu Detail Tests
    await this.runTest('Menu Detail Page Loads', async () => {
      // Use a known menu ID from the test environment
      const response = await this.makeRequest('GET', '/menu/31');
      
      if (!response.includes('enhanced-detail-container')) {
        throw new Error('Menu detail page does not contain expected content');
      }
    });

    // Static Asset Tests
    await this.runTest('CSS Assets Load', async () => {
      const response = await this.makeRequest('GET', '/');
      
      if (!response.includes('bootstrap') || !response.includes('font-awesome')) {
        throw new Error('Required CSS assets not loaded');
      }
    });

    // Environment Tests (skip for remote testing)
    await this.runTest('Environment Variables', async () => {
      // For remote testing, we don't need local environment variables
      // The Railway environment has its own variables
      const baseUrl = process.env['TEST_BASE_URL'];
      if (!baseUrl) {
        throw new Error('TEST_BASE_URL environment variable is not set');
      }
      
      // Verify the base URL is accessible
      try {
        const response = await fetch(baseUrl);
        if (!response.ok) {
          throw new Error(`Base URL ${baseUrl} is not accessible`);
        }
      } catch (error) {
        throw new Error(`Cannot reach base URL ${baseUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Print Summary
    this.printSummary();
  }

  private async makeRequest(method: string, path: string, data?: any): Promise<any> {
    const baseUrl = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
    const url = `${baseUrl}${path}`;
    
    try {
      const options: RequestInit = { method };
      
      if (data && method === 'POST') {
        // For form data submission
        const formData = new URLSearchParams();
        Object.keys(data).forEach(key => {
          formData.append(key, data[key]);
        });
        options.body = formData;
        options.headers = {
          'Content-Type': 'application/x-www-form-urlencoded'
        };
      }
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      throw new Error(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private printSummary(): void {
    console.log('\n📊 Smoke Test Summary:');
    console.log('='.repeat(50));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   - ${r.name}: ${r.message}`));
    }
    
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`\nTotal Duration: ${totalDuration}ms`);
    
    if (failed === 0) {
      console.log('\n🎉 All smoke tests passed! Test environment is ready.');
      process.exit(0);
    } else {
      console.log('\n💥 Some smoke tests failed. Please check the issues above.');
      process.exit(1);
    }
  }
}

// Run smoke tests
async function main() {
  const runner = new SmokeTestRunner();
  
  try {
    await runner.runAllTests();
  } catch (error) {
    console.error('❌ Smoke test runner failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Smoke tests interrupted');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Smoke tests terminated');
  process.exit(0);
});

if (require.main === module) {
  main();
}
