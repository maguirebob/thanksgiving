const express = require('express');
const menuController = require('../controllers/menuController');
const { requireAuthView } = require('../middleware/auth');
const { 
  validateMenuId, 
  validateYear, 
  validateQueryParams, 
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

// Home page - all menus (requires authentication)
router.get('/', 
  requireAuthView,
  validateQueryParams, 
  handleValidationErrors, 
  menuController.getAllMenus
);

// Individual menu detail page (requires authentication)
router.get('/menu/:id', 
  requireAuthView,
  validateMenuId, 
  handleValidationErrors, 
  menuController.getMenuById
);

// Menus by year (requires authentication)
router.get('/year/:year', 
  requireAuthView,
  validateYear, 
  handleValidationErrors, 
  menuController.getMenusByYear
);

module.exports = router;
