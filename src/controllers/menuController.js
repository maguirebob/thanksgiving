const menuService = require('../services/menuService');

class MenuController {
  /**
   * Get all menus for the home page
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getAllMenus(req, res, next) {
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
  }

  /**
   * Get a single menu by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getMenuById(req, res, next) {
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
        title: menu.menu_title,
        event: menu 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menus by year
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getMenusByYear(req, res, next) {
    try {
      const { year } = req.params;
      const menus = await menuService.getMenusByYear(year);
      
      res.render('index', { 
        title: `Thanksgiving Menus for ${year}`,
        events: menus,
        year: parseInt(year)
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all menus as JSON (API endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getAllMenusAPI(req, res, next) {
    try {
      const { sort = 'desc', limit } = req.query;
      const menus = await menuService.getAllMenus({ sort, limit });
      
      res.json({
        success: true,
        data: menus,
        count: menus.length,
        query: { sort, limit }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single menu as JSON (API endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getMenuByIdAPI(req, res, next) {
    try {
      const { id } = req.params;
      const menu = await menuService.getMenuById(id);
      
      if (!menu) {
        return res.status(404).json({
          success: false,
          error: 'Menu not found',
          message: 'The requested menu could not be found.'
        });
      }
      
      res.json({
        success: true,
        data: menu
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get menu statistics (API endpoint)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getMenuStats(req, res, next) {
    try {
      const stats = await menuService.getMenuStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MenuController();
