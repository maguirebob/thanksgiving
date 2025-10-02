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
    const baseUrl = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
    const environment = baseUrl.includes('localhost') ? 'Development' : 
                       baseUrl.includes('test') ? 'Test' : 
                       baseUrl.includes('prod') ? 'Production' : 'Unknown';
    
    console.log(`🚀 Starting Smoke Tests for ${environment} Environment...`);
    console.log(`📍 Base URL: ${baseUrl}\n`);

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
      
      if (!response.success || !response.data || !response.data.version) {
        throw new Error('Version API returned invalid response structure');
      }
      
      // Check if version follows semantic versioning format (e.g., 2.4.3)
      const versionPattern = /^\d+\.\d+\.\d+$/;
      if (!versionPattern.test(response.data.version)) {
        throw new Error(`Version format is invalid: ${response.data.version}. Expected format: x.y.z`);
      }
      
      console.log(`   Version: ${response.data.version}`);
    });

    await this.runTest('Database Setup API', async () => {
      const response = await this.makeRequest('GET', '/api/setup-database');
      
      if (!response.success) {
        throw new Error('Database setup API failed');
      }
    });

    // Homepage Tests (now requires authentication)
    await this.runTest('Homepage Redirects to Login', async () => {
      const response = await this.makeRequest('GET', '/');
      
      // Should redirect to login page since authentication is required
      if (!response.includes('Login') || !response.includes('username')) {
        throw new Error('Homepage does not redirect to login page as expected');
      }
    });

    await this.runTest('Homepage Authentication Required', async () => {
      const response = await this.makeRequest('GET', '/');
      
      // Should show login form, not menu data
      if (!response.includes('Login') || !response.includes('password')) {
        throw new Error('Homepage does not require authentication');
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

    // Admin Dashboard Tests
    await this.runTest('Admin Dashboard Access', async () => {
      // Test that admin dashboard requires authentication
      const response = await this.makeRequest('GET', '/admin/dashboard');
      
      // Should redirect to login or show authentication required
      if (!response.includes('Login') && !response.includes('auth')) {
        throw new Error('Admin dashboard does not require authentication');
      }
    });

    await this.runTest('Admin Volume Contents API', async () => {
      // Test volume contents API (requires authentication)
      const response = await this.makeRequest('GET', '/admin/volume-contents');
      
      // Should redirect to login or return JSON (depending on auth)
      if (typeof response === 'string' && response.includes('Login')) {
        // This is expected - API requires authentication
        console.log('   Volume contents API requires authentication (expected)');
      } else if (typeof response === 'object' && response.success) {
        // API returned JSON successfully
        console.log('   Volume contents API returned JSON successfully');
      } else {
        throw new Error('Volume contents API returned unexpected response');
      }
    });

    // File Upload Tests
    await this.runTest('File Upload Endpoint Exists', async () => {
      // Test that file upload endpoints exist
      const response = await this.makeRequest('GET', '/admin/dashboard');
      
      // Should contain file upload form elements
      if (!response.includes('menu_image') && !response.includes('file')) {
        throw new Error('File upload functionality not found in admin dashboard');
      }
    });

    // Authentication Tests
    await this.runTest('User Registration Endpoint', async () => {
      const response = await this.makeRequest('GET', '/auth/register');
      
      if (!response.includes('Register') && !response.includes('registration')) {
        throw new Error('User registration page not found');
      }
    });

    await this.runTest('Profile Management', async () => {
      const response = await this.makeRequest('GET', '/auth/profile');
      
      // Should redirect to login or show profile page
      if (!response.includes('Login') && !response.includes('Profile')) {
        throw new Error('Profile management not properly configured');
      }
    });

    // Menu Management Tests
    await this.runTest('Menu Creation API', async () => {
      // Test menu creation endpoint exists (requires authentication)
      try {
        const response = await this.makeRequest('POST', '/api/v1/events', {
          event_name: 'Test Event',
          event_date: '2024-11-28',
          menu_title: 'Test Menu'
        });
        
        // Should redirect to login or return validation error (both are expected)
        if (typeof response === 'string' && response.includes('Login')) {
          // This is expected - API requires authentication
          console.log('   Menu creation API requires authentication (expected)');
        } else {
          // Any other response means the endpoint exists
          console.log('   Menu creation API endpoint exists');
        }
      } catch (error) {
        // HTTP 400 Bad Request means endpoint exists but validation failed (expected)
        if (error instanceof Error && error.message.includes('HTTP 400')) {
          console.log('   Menu creation API endpoint exists (validation working)');
        } else if (error instanceof Error && error.message.includes('Cannot POST')) {
          throw new Error('Menu creation API endpoint does not exist');
        } else {
          throw error;
        }
      }
    });

    // Photo Management Tests
    await this.runTest('Photo Upload Endpoint', async () => {
      const response = await this.makeRequest('GET', '/admin/dashboard');
      
      // Should contain photo-related functionality
      if (!response.includes('photo') && !response.includes('image')) {
        throw new Error('Photo management functionality not found');
      }
    });

    // Error Handling Tests
    await this.runTest('Error Handling', async () => {
      // Test 404 handling
      try {
        const response = await this.makeRequest('GET', '/nonexistent-endpoint');
        
        // Should return 404 error page or redirect to login
        if (response.includes('Error') || response.includes('404') || response.includes('Not Found') || response.includes('Login')) {
          console.log('   Error handling working correctly');
        } else {
          throw new Error('Error handling not working properly');
        }
      } catch (error) {
        // HTTP 404 Not Found is expected behavior
        if (error instanceof Error && error.message.includes('HTTP 404')) {
          console.log('   Error handling working correctly (404 response)');
        } else {
          throw error;
        }
      }
    });

    // Performance Tests
    await this.runTest('Response Time Performance', async () => {
      const startTime = Date.now();
      
      await this.makeRequest('GET', '/');
      
      const responseTime = Date.now() - startTime;
      if (responseTime > 10000) { // 10 seconds
        throw new Error(`Response time too slow: ${responseTime}ms`);
      }
      
      console.log(`   Response time: ${responseTime}ms`);
    });

    // Environment Tests (optional for local testing)
    await this.runTest('Environment Variables', async () => {
      // For local testing, TEST_BASE_URL is optional (defaults to localhost:3000)
      const baseUrl = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      
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
      const baseUrl = process.env['TEST_BASE_URL'] || 'http://localhost:3000';
      const environment = baseUrl.includes('localhost') ? 'Development' : 
                         baseUrl.includes('test') ? 'Test' : 
                         baseUrl.includes('prod') ? 'Production' : 'Unknown';
      console.log(`\n🎉 All smoke tests passed! ${environment} environment is ready.`);
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
