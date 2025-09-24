const packageJson = require('../../package.json');

/**
 * Version utility for the Thanksgiving Menu application
 * Implements Semantic Versioning (SemVer): MAJOR.MINOR.PATCH
 */
class VersionManager {
  constructor() {
    this.version = packageJson.version;
    this.name = packageJson.name;
    this.description = packageJson.description;
    this.author = packageJson.author || 'Bob Maguire';
    this.license = packageJson.license;
    this.nodeVersion = process.version;
    this.buildDate = new Date().toISOString();
  }

  /**
   * Get the current application version
   */
  getVersion() {
    return this.version;
  }

  /**
   * Get version information as an object
   */
  getVersionInfo() {
    return {
      version: this.version,
      name: this.name,
      description: this.description,
      author: this.author,
      license: this.license,
      nodeVersion: this.nodeVersion,
      buildDate: this.buildDate,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Get version components
   */
  getVersionComponents() {
    const [major, minor, patch] = this.version.split('.').map(Number);
    return { major, minor, patch };
  }

  /**
   * Check if this is a major version
   */
  isMajorVersion() {
    const { minor, patch } = this.getVersionComponents();
    return minor === 0 && patch === 0;
  }

  /**
   * Get version display string for UI
   */
  getDisplayVersion() {
    const { major, minor, patch } = this.getVersionComponents();
    return `v${major}.${minor}.${patch}`;
  }

  /**
   * Get changelog information based on version
   */
  getChangelog() {
    const { major, minor, patch } = this.getVersionComponents();
    
    const changelog = {
      '1.0.0': {
        date: '2024-09-20',
        changes: [
          'Initial release of Thanksgiving Menu application',
          'Menu display and management functionality',
          'User authentication and authorization',
          'Photo upload and management',
          'Admin dashboard'
        ]
      },
      '1.1.0': {
        date: '2024-09-23',
        changes: [
          'Added About page with version information',
          'Implemented semantic versioning strategy',
          'Enhanced navigation with About menu',
          'Added version API endpoint',
          'Improved footer with version display'
        ]
      }
    };

    return changelog[this.version] || {
      date: new Date().toISOString().split('T')[0],
      changes: ['Version information not available']
    };
  }
}

module.exports = new VersionManager();
