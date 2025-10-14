#!/usr/bin/env ts-node

/**
 * Version Manager for Thanksgiving Website
 * 
 * This script helps manage version increments and updates across the application
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  buildDate: string;
  environment: string;
}

class VersionManager {
  private packageJsonPath = './package.json';
  private serverPath = './src/server.ts';

  getCurrentVersion(): VersionInfo {
    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
    const version = packageJson.version.split('.').map(Number);
    
    return {
      major: version[0],
      minor: version[1],
      patch: version[2],
      buildDate: new Date().toISOString().split('T')[0] || '',
      environment: process.env['NODE_ENV'] || 'development'
    };
  }

  incrementVersion(type: 'major' | 'minor' | 'patch'): VersionInfo {
    const current = this.getCurrentVersion();
    let newVersion: VersionInfo;

    switch (type) {
      case 'major':
        newVersion = {
          major: current.major + 1,
          minor: 0,
          patch: 0,
          buildDate: new Date().toISOString().split('T')[0] || '',
          environment: current.environment
        };
        break;
      case 'minor':
        newVersion = {
          major: current.major,
          minor: current.minor + 1,
          patch: 0,
          buildDate: new Date().toISOString().split('T')[0] || '',
          environment: current.environment
        };
        break;
      case 'patch':
        newVersion = {
          major: current.major,
          minor: current.minor,
          patch: current.patch + 1,
          buildDate: new Date().toISOString().split('T')[0] || '',
          environment: current.environment
        };
        break;
    }

    this.updateVersion(newVersion);
    return newVersion;
  }

  private updateVersion(version: VersionInfo): void {
    const versionString = `${version.major}.${version.minor}.${version.patch}`;
    
    // Update package.json
    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf8'));
    packageJson.version = versionString;
    writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');

    // Update server.ts version endpoint
    let serverContent = readFileSync(this.serverPath, 'utf8');
    serverContent = serverContent.replace(
      /version: '[\d.]+'/g,
      `version: '${versionString}'`
    );
    writeFileSync(this.serverPath, serverContent);

    // Update about page route
    serverContent = readFileSync(this.serverPath, 'utf8');
    serverContent = serverContent.replace(
      /version: '[\d.]+'/g,
      `version: '${versionString}'`
    );
    writeFileSync(this.serverPath, serverContent);

    console.log(`✅ Version updated to ${versionString}`);
    console.log(`📅 Build Date: ${version.buildDate}`);
    console.log(`🌍 Environment: ${version.environment}`);
  }

  generateChangelog(version: VersionInfo, changes: string[]): void {
    const changelogPath = './CHANGELOG.md';
    const versionString = `${version.major}.${version.minor}.${version.patch}`;
    
    let changelog = '';
    try {
      changelog = readFileSync(changelogPath, 'utf8');
    } catch (error) {
      changelog = '# Changelog\n\nAll notable changes to the Thanksgiving Menu Collection will be documented in this file.\n\n';
    }

    const newEntry = `## [${versionString}] - ${version.buildDate}\n\n${changes.map(change => `- ${change}`).join('\n')}\n\n`;
    
    // Insert new entry after the header
    const lines = changelog.split('\n');
    const headerEndIndex = lines.findIndex(line => line.startsWith('## ['));
    if (headerEndIndex > 0) {
      lines.splice(headerEndIndex, 0, newEntry.trim());
    } else {
      lines.push(newEntry.trim());
    }
    
    writeFileSync(changelogPath, lines.join('\n'));
    console.log(`📝 Changelog updated for version ${versionString}`);
  }

  createReleaseTag(version: VersionInfo): void {
    const versionString = `${version.major}.${version.minor}.${version.patch}`;
    
    try {
      execSync(`git add .`, { stdio: 'inherit' });
      execSync(`git commit -m "chore: bump version to ${versionString}"`, { stdio: 'inherit' });
      execSync(`git tag -a v${versionString} -m "Release version ${versionString}"`, { stdio: 'inherit' });
      console.log(`🏷️  Git tag v${versionString} created`);
    } catch (error) {
      console.error('❌ Error creating git tag:', error);
    }
  }
}

// CLI Interface
if (process.argv[1] && process.argv[1].endsWith('version-manager.ts')) {
  const args = process.argv.slice(2);
  const manager = new VersionManager();

  if (args.length === 0) {
    console.log('📋 Current Version:', manager.getCurrentVersion());
    console.log('\nUsage:');
    console.log('  npm run version:patch  - Increment patch version (bug fixes)');
    console.log('  npm run version:minor  - Increment minor version (new features)');
    console.log('  npm run version:major  - Increment major version (breaking changes)');
    process.exit(0);
  }

  const type = args[0] as 'major' | 'minor' | 'patch';
  const changes = args.slice(1);

  if (!['major', 'minor', 'patch'].includes(type)) {
    console.error('❌ Invalid version type. Use: major, minor, or patch');
    process.exit(1);
  }

  console.log(`🚀 Incrementing ${type} version...`);
  const newVersion = manager.incrementVersion(type);
  
  if (changes.length > 0) {
    manager.generateChangelog(newVersion, changes);
  }
  
  manager.createReleaseTag(newVersion);
  
  console.log('\n🎉 Version update complete!');
  console.log('Next steps:');
  console.log('1. Review changes');
  console.log('2. Run tests: npm test');
  console.log('3. Deploy: git push origin main --tags');
}

export { VersionManager };

