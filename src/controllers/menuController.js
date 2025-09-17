const menuService = require('../services/menuService');

/**
 * Get all menus for the home page
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllMenus = async (req, res, next) => {
  try {
    const { sort = 'desc', limit } = req.query;
    const menus = await menuService.getAllMenus({ sort, limit });
    
    res.render('index', { 
      title: 'Thanksgiving Menus Through the Years',
      events: menus,
      query: { sort, limit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single menu by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await menuService.getMenuById(id);
    
    if (!menu) {
      return res.status(404).render('error', { 
        message: 'Menu not found',
        error: 'The requested menu could not be found.',
        statusCode: 404
      });
    }
    
    res.render('detail', { 
      title: menu.title,
      event: menu 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get menus by year
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMenusByYear = async (req, res, next) => {
  try {
    const { year } = req.params;
    const menus = await menuService.getMenusByYear(year);
    
    res.render('index', { 
      title: `Thanksgiving Menus for ${year}`,
      events: menus,
      query: { year }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all menus as JSON (API endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllMenusAPI = async (req, res, next) => {
  try {
    const { sort = 'desc', limit, year, offset } = req.query;
    const menus = await menuService.getAllMenus({ sort, limit, year, offset });
    
    res.json({
      success: true,
      data: menus,
      count: menus.length,
      query: { sort, limit, year, offset }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single menu as JSON (API endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMenuByIdAPI = async (req, res, next) => {
  try {
    const { id } = req.params;
    const menu = await menuService.getMenuById(id);
    
    if (!menu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }
    
    res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a menu (API endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const updateMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedMenu = await menuService.updateMenu(id, updateData);
    
    if (!updatedMenu) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedMenu,
      message: 'Menu updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get menu statistics (API endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getMenuStats = async (req, res, next) => {
  try {
    const stats = await menuService.getMenuStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new menu (API endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const createMenu = async (req, res, next) => {
  try {
    const menuData = req.body;
    const newMenu = await menuService.createMenu(menuData);
    
    res.status(201).json({
      success: true,
      data: newMenu,
      message: 'Menu created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a menu (API endpoint)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await menuService.deleteMenu(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Menu not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Menu deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllMenus,
  getMenuById,
  getMenusByYear,
  getAllMenusAPI,
  getMenuByIdAPI,
  updateMenu,
  getMenuStats,
  createMenu,
  deleteMenu
};