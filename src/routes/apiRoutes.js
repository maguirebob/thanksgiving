const express = require('express');
const menuController = require('../controllers/menuController');
const { 
  validateMenuId, 
  validateYear, 
  validateQueryParams, 
  validateMenuUpdate,
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

// API version prefix
const API_VERSION = '/v1';

// All menus API endpoint
router.get(`${API_VERSION}/events`, 
  validateQueryParams, 
  handleValidationErrors, 
  menuController.getAllMenusAPI
);

// Single menu API endpoint
router.get(`${API_VERSION}/events/:id`, 
  validateMenuId, 
  handleValidationErrors, 
  menuController.getMenuByIdAPI
);

// Update menu API endpoint
router.put(`${API_VERSION}/events/:id`, 
  validateMenuUpdate, 
  handleValidationErrors, 
  menuController.updateMenu
);

// Menus by year API endpoint
router.get(`${API_VERSION}/events/year/:year`, 
  validateYear, 
  handleValidationErrors, 
  menuController.getMenusByYear
);

// Menu statistics API endpoint
router.get(`${API_VERSION}/stats`, 
  menuController.getMenuStats
);

// Legacy API endpoint (for backward compatibility)
router.get('/events', 
  validateQueryParams, 
  handleValidationErrors, 
  menuController.getAllMenusAPI
);

module.exports = router;
