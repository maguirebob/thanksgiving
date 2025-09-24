const versionManager = require('../utils/version');

/**
 * About Controller
 * Handles about page and version information
 */
class AboutController {
  /**
   * Render the About page
   */
  async getAboutPage(req, res) {
    try {
      const versionInfo = versionManager.getVersionInfo();
      const changelog = versionManager.getChangelog();
      
      res.render('about', {
        title: 'About',
        versionInfo,
        changelog,
        user: req.session?.user || null
      });
    } catch (error) {
      console.error('Error rendering about page:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Unable to load about page',
        error: process.env.NODE_ENV === 'development' ? error : null
      });
    }
  }

  /**
   * Get version information as JSON (API endpoint)
   */
  async getVersionInfo(req, res) {
    try {
      const versionInfo = versionManager.getVersionInfo();
      const changelog = versionManager.getChangelog();
      
      res.json({
        success: true,
        data: {
          ...versionInfo,
          changelog
        }
      });
    } catch (error) {
      console.error('Error getting version info:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve version information'
      });
    }
  }

  /**
   * Get version display for footer
   */
  async getVersionDisplay(req, res) {
    try {
      const displayVersion = versionManager.getDisplayVersion();
      const environment = process.env.NODE_ENV || 'development';
      
      res.json({
        success: true,
        data: {
          version: displayVersion,
          environment,
          buildDate: versionManager.buildDate
        }
      });
    } catch (error) {
      console.error('Error getting version display:', error);
      res.status(500).json({
        success: false,
        error: 'Unable to retrieve version display'
      });
    }
  }
}

module.exports = new AboutController();
