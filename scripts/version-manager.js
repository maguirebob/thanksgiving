#!/usr/bin/env ts-node
"use strict";
/**
 * Version Manager for Thanksgiving Website
 *
 * This script helps manage version increments and updates across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VersionManager = void 0;
const fs_1 = require("fs");
const child_process_1 = require("child_process");
class VersionManager {
    constructor() {
        this.packageJsonPath = './package.json';
        this.serverPath = './src/server.ts';
    }
    getCurrentVersion() {
        const packageJson = JSON.parse((0, fs_1.readFileSync)(this.packageJsonPath, 'utf8'));
        const version = packageJson.version.split('.').map(Number);
        return {
            major: version[0],
            minor: version[1],
            patch: version[2],
            buildDate: new Date().toISOString().split('T')[0] || '',
            environment: process.env['NODE_ENV'] || 'development'
        };
    }
    incrementVersion(type) {
        const current = this.getCurrentVersion();
        let newVersion;
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
    updateVersion(version) {
        const versionString = `${version.major}.${version.minor}.${version.patch}`;
        // Update package.json
        const packageJson = JSON.parse((0, fs_1.readFileSync)(this.packageJsonPath, 'utf8'));
        packageJson.version = versionString;
        (0, fs_1.writeFileSync)(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        // Update server.ts version endpoint
        let serverContent = (0, fs_1.readFileSync)(this.serverPath, 'utf8');
        serverContent = serverContent.replace(/version: '[\d.]+'/g, `version: '${versionString}'`);
        (0, fs_1.writeFileSync)(this.serverPath, serverContent);
        // Update about page route
        serverContent = (0, fs_1.readFileSync)(this.serverPath, 'utf8');
        serverContent = serverContent.replace(/version: '[\d.]+'/g, `version: '${versionString}'`);
        (0, fs_1.writeFileSync)(this.serverPath, serverContent);
        console.log(`✅ Version updated to ${versionString}`);
        console.log(`📅 Build Date: ${version.buildDate}`);
        console.log(`🌍 Environment: ${version.environment}`);
    }
    generateChangelog(version, changes) {
        const changelogPath = './CHANGELOG.md';
        const versionString = `${version.major}.${version.minor}.${version.patch}`;
        let changelog = '';
        try {
            changelog = (0, fs_1.readFileSync)(changelogPath, 'utf8');
        }
        catch (error) {
            changelog = '# Changelog\n\nAll notable changes to the Thanksgiving Menu Collection will be documented in this file.\n\n';
        }
        const newEntry = `## [${versionString}] - ${version.buildDate}\n\n${changes.map(change => `- ${change}`).join('\n')}\n\n`;
        // Insert new entry after the header
        const lines = changelog.split('\n');
        const headerEndIndex = lines.findIndex(line => line.startsWith('## ['));
        if (headerEndIndex > 0) {
            lines.splice(headerEndIndex, 0, newEntry.trim());
        }
        else {
            lines.push(newEntry.trim());
        }
        (0, fs_1.writeFileSync)(changelogPath, lines.join('\n'));
        console.log(`📝 Changelog updated for version ${versionString}`);
    }
    createReleaseTag(version) {
        const versionString = `${version.major}.${version.minor}.${version.patch}`;
        try {
            (0, child_process_1.execSync)(`git add .`, { stdio: 'inherit' });
            (0, child_process_1.execSync)(`git commit -m "chore: bump version to ${versionString}"`, { stdio: 'inherit' });
            (0, child_process_1.execSync)(`git tag -a v${versionString} -m "Release version ${versionString}"`, { stdio: 'inherit' });
            console.log(`🏷️  Git tag v${versionString} created`);
        }
        catch (error) {
            console.error('❌ Error creating git tag:', error);
        }
    }
}
exports.VersionManager = VersionManager;
// CLI Interface
if (require.main === module) {
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
    const type = args[0];
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
