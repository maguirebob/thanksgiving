const express = require('express');
const menuController = require('../controllers/menuController');
const { 
  validateMenuId, 
  validateYear, 
  validateQueryParams, 
  handleValidationErrors 
} = require('../middleware/validation');

const router = express.Router();

// Home page - all menus
router.get('/', 
  validateQueryParams, 
  handleValidationErrors, 
  menuController.getAllMenus
);

// Individual menu detail page
router.get('/menu/:id', 
  validateMenuId, 
  handleValidationErrors, 
  menuController.getMenuById
);

// Menus by year
router.get('/year/:year', 
  validateYear, 
  handleValidationErrors, 
  menuController.getMenusByYear
);

module.exports = router;
