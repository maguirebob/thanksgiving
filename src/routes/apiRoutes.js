const express = require('express');
const menuController = require('../controllers/menuController');
const photoController = require('../controllers/photoController');
const profileRoutes = require('./profileRoutes');
const {
  validateMenuId,
  validateYear,
  validateQueryParams,
  validateMenuCreate,
  validateMenuUpdate,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// All menus API endpoint
router.get('/events', 
  validateQueryParams, 
  handleValidationErrors, 
  menuController.getAllMenusAPI
);

// Single menu API endpoint
router.get('/events/:id', 
  validateMenuId, 
  handleValidationErrors, 
  menuController.getMenuByIdAPI
);

// Create menu API endpoint
router.post('/events', 
  validateMenuCreate,
  handleValidationErrors,
  menuController.createMenu
);

// Update menu API endpoint
router.put('/events/:id', 
  validateMenuUpdate, 
  handleValidationErrors, 
  menuController.updateMenu
);

// Delete menu API endpoint
router.delete('/events/:id', 
  validateMenuId, 
  handleValidationErrors, 
  menuController.deleteMenu
);

// Menus by year API endpoint
router.get('/events/year/:year', 
  validateYear, 
  handleValidationErrors, 
  menuController.getMenusByYear
);

// Menu statistics API endpoint
router.get('/stats', 
  menuController.getMenuStats
);

// Photo routes
router.get('/events/:id/photos', 
  validateMenuId,
  handleValidationErrors,
  photoController.getEventPhotos
);

router.post('/events/:id/photos', 
  validateMenuId,
  handleValidationErrors,
  (req, res, next) => {
    // Use the upload middleware from the request
    req.upload.single('photo')(req, res, next);
  },
  photoController.uploadPhoto
);

router.put('/photos/:photoId', 
  photoController.updatePhoto
);

router.delete('/photos/:photoId', 
  photoController.deletePhoto
);

// Profile management routes
router.use('/', profileRoutes);

module.exports = router;
