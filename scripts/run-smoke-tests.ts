#!/usr/bin/env ts-node

/**
 * Smoke Test Runner for Test Environment
 * 
 * This script runs comprehensive smoke tests to verify the application
 * is working correctly in the test environment.
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Database Connection Tests
    await this.runTest('Database Connection', async () => {
      await prisma.$connect();
      await prisma.$disconnect();
    });

    await this.runTest('Database Schema Exists', async () => {
      await prisma.$connect();
      
      // Check if all required tables exist
      const eventCount = await prisma.event.count();
      const userCount = await prisma.user.count();
      const photoCount = await prisma.photo.count();
      const sessionCount = await prisma.session.count();
      
      // If we can count, the tables exist
      if (typeof eventCount !== 'number' || typeof userCount !== 'number') {
        throw new Error('Required database tables do not exist');
      }
      
      await prisma.$disconnect();
    });

    // API Endpoint Tests
    await this.runTest('Version API Endpoint', async () => {
      const response = await this.makeRequest('GET', '/api/v1/version/display');
      
      if (!response.success || response.data.version !== '2.0.0') {
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

    // Menu Detail Tests
    await this.runTest('Menu Detail Page Loads', async () => {
      // First get a menu ID from the database
      await prisma.$connect();
      const event = await prisma.event.findFirst();
      await prisma.$disconnect();
      
      if (!event) {
        throw new Error('No events found in database');
      }
      
      const response = await this.makeRequest('GET', `/menu/${event.event_id}`);
      
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

    // Environment Tests
    await this.runTest('Environment Variables', async () => {
      const requiredVars = ['DATABASE_URL', 'NODE_ENV'];
      
      for (const varName of requiredVars) {
        if (!process.env[varName]) {
          throw new Error(`Required environment variable ${varName} is not set`);
        }
      }
    });

    // Print Summary
    this.printSummary();
  }

  private async makeRequest(method: string, path: string): Promise<any> {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    const url = `${baseUrl}${path}`;
    
    try {
      const response = await fetch(url, { method });
      
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
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Smoke tests terminated');
  await prisma.$disconnect();
  process.exit(0);
});

if (require.main === module) {
  main();
}
