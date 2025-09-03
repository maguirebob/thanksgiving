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
    const { sort = 'desc', limit } = options;
    
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

    return await Event.findAll({
      where: {
        event_date: {
          [Op.between]: [`${year}-01-01`, `${year}-12-31`]
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
      'event_name',
      'event_type', 
      'event_location',
      'event_date',
      'event_description',
      'menu_title',
      'menu_image_filename'
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
}

module.exports = new MenuService();
