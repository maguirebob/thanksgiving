const express = require('express');
const aboutController = require('../controllers/aboutController');
const { requireAuthView } = require('../middleware/auth');

const router = express.Router();

// About page (requires authentication)
router.get('/', requireAuthView, aboutController.getAboutPage);

// API endpoints for version information
router.get('/api/v1/version', aboutController.getVersionInfo);
router.get('/api/v1/version/display', aboutController.getVersionDisplay);

module.exports = router;
