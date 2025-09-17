const { Event } = require('../../models');
const { Op } = require('sequelize');

class MenuService {
  /**
   * Get all menus with optional sorting and limiting
   * @param {Object} options - Query options
   * @param {string} options.sort - Sort order ('asc' or 'desc')
   * @param {number} options.limit - Maximum number of results
   * @returns {Promise<Array>} Array of menu events
   */
  async getAllMenus(options = {}) {
    const { sort = 'desc', limit, year, offset } = options;
    
    const queryOptions = {
      order: [['event_date', sort.toUpperCase()]],
      attributes: [
        'event_id', 
        'event_name',
        'event_type', 
        'event_location', 
        'event_date', 
        'event_description', 
        'menu_title',
        'menu_image_filename'
      ]
    };

    // Add year filtering
    if (year) {
      const yearStart = `${year}-01-01`;
      const yearEnd = `${year}-12-31`;
      queryOptions.where = {
        event_date: {
          [Op.between]: [yearStart, yearEnd]
        }
      };
    }

    // Add pagination
    if (offset && offset > 0) {
      queryOptions.offset = parseInt(offset);
    }

    if (limit && limit > 0) {
      queryOptions.limit = parseInt(limit);
    }

    return await Event.findAll(queryOptions);
  }

  /**
   * Get a single menu by ID
   * @param {number} id - Menu ID
   * @returns {Promise<Object|null>} Menu event or null if not found
   */
  async getMenuById(id) {
    if (!id || isNaN(id)) {
      throw new Error('Invalid menu ID');
    }
    
    return await Event.findByPk(id);
  }

  /**
   * Get menus by year
   * @param {number} year - Year to filter by
   * @returns {Promise<Array>} Array of menu events for the year
   */
  async getMenusByYear(year) {
    if (!year || isNaN(year)) {
      throw new Error('Invalid year');
    }

    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;
    return await Event.findAll({
      where: {
        event_date: {
          [Op.between]: [yearStart, yearEnd]
        }
      },
      order: [['event_date', 'DESC']]
    });
  }

  /**
   * Update a menu by ID
   * @param {number} id - Menu ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated menu event or null if not found
   */
  async updateMenu(id, updateData) {
    if (!id || isNaN(id)) {
      throw new Error('Invalid menu ID');
    }

    const menu = await Event.findByPk(id);
    if (!menu) {
      return null;
    }

    // Validate required fields
    const allowedFields = [
      'year',
      'title',
      'description',
      'date',
      'location',
      'host',
      'menu_items'
    ];

    const filteredData = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }

    await menu.update(filteredData);
    return menu;
  }

  /**
   * Get menu statistics
   * @returns {Promise<Object>} Statistics about menus
   */
  async getMenuStats() {
    const totalMenus = await Event.count();
    const [earliestMenu] = await Event.findAll({
      order: [['event_date', 'ASC']],
      limit: 1,
      attributes: ['event_date']
    });
    const [latestMenu] = await Event.findAll({
      order: [['event_date', 'DESC']],
      limit: 1,
      attributes: ['event_date']
    });

    return {
      totalMenus,
      earliestYear: earliestMenu ? new Date(earliestMenu.event_date).getFullYear() : null,
      latestYear: latestMenu ? new Date(latestMenu.event_date).getFullYear() : null
    };
  }

  /**
   * Create a new menu
   * @param {Object} menuData - Menu data
   * @returns {Promise<Object>} Created menu
   */
  async createMenu(menuData) {
    const newMenu = await Event.create(menuData);
    return newMenu;
  }

  /**
   * Delete a menu by ID
   * @param {number} id - Menu ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async deleteMenu(id) {
    if (!id || isNaN(id)) {
      throw new Error('Invalid menu ID');
    }
    
    const deleted = await Event.destroy({
      where: { event_id: id }
    });
    
    return deleted > 0;
  }
}

module.exports = new MenuService();
