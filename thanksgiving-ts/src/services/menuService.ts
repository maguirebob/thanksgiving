import prisma from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export interface MenuEvent {
  id: number;
  title: string;
  description: string;
  date: Date;
  location: string;
  menu_image_url: string;
  event_name: string;
  event_type: string;
  event_location: string;
  event_date: Date;
  event_description: string;
  menu_title: string;
  menu_image_filename: string;
}

export interface MenuFilters {
  year?: number;
  limit?: number;
  offset?: number;
}

/**
 * Service class for menu-related operations
 */
export class MenuService {
  /**
   * Get all menus with optional filtering
   */
  static async getAllMenus(filters: MenuFilters = {}): Promise<MenuEvent[]> {
    try {
      const { year, limit = 50, offset = 0 } = filters;

      const whereClause = year ? {
        event_date: {
          gte: new Date(`${year}-01-01`),
          lt: new Date(`${year + 1}-01-01`)
        }
      } : {};

      const events = await prisma.event.findMany({
        where: whereClause,
        orderBy: { event_date: 'desc' },
        take: limit,
        skip: offset
      });

      return this.transformEvents(events);
    } catch (error) {
      console.error('Error fetching all menus:', error);
      throw new AppError('Failed to fetch menus', 500);
    }
  }

  /**
   * Get menu by ID
   */
  static async getMenuById(id: number): Promise<MenuEvent | null> {
    try {
      const event = await prisma.event.findUnique({
        where: { event_id: id }
      });

      if (!event) {
        return null;
      }

      return this.transformEvent(event);
    } catch (error) {
      console.error('Error fetching menu by ID:', error);
      throw new AppError('Failed to fetch menu', 500);
    }
  }

  /**
   * Get menus by year
   */
  static async getMenusByYear(year: number): Promise<MenuEvent[]> {
    try {
      const events = await prisma.event.findMany({
        where: {
          event_date: {
            gte: new Date(`${year}-01-01`),
            lt: new Date(`${year + 1}-01-01`)
          }
        },
        orderBy: { event_date: 'desc' }
      });

      return this.transformEvents(events);
    } catch (error) {
      console.error('Error fetching menus by year:', error);
      throw new AppError('Failed to fetch menus for year', 500);
    }
  }

  /**
   * Get featured menus (most recent)
   */
  static async getFeaturedMenus(limit: number = 6): Promise<MenuEvent[]> {
    try {
      const events = await prisma.event.findMany({
        orderBy: { event_date: 'desc' },
        take: limit
      });

      return this.transformEvents(events);
    } catch (error) {
      console.error('Error fetching featured menus:', error);
      throw new AppError('Failed to fetch featured menus', 500);
    }
  }

  /**
   * Get menu statistics
   */
  static async getMenuStats(): Promise<{
    totalMenus: number;
    years: number[];
    mostRecentYear: number;
    oldestYear: number;
  }> {
    try {
      const totalMenus = await prisma.event.count();
      
      const events = await prisma.event.findMany({
        select: { event_date: true },
        orderBy: { event_date: 'asc' }
      });

      const years = events.map(event => event.event_date.getFullYear());
      const uniqueYears = [...new Set(years)].sort((a, b) => b - a);

      return {
        totalMenus,
        years: uniqueYears,
        mostRecentYear: uniqueYears[0] || 0,
        oldestYear: uniqueYears[uniqueYears.length - 1] || 0
      };
    } catch (error) {
      console.error('Error fetching menu stats:', error);
      throw new AppError('Failed to fetch menu statistics', 500);
    }
  }

  /**
   * Transform single event to include computed fields
   */
  private static transformEvent(event: any): MenuEvent {
    return {
      ...event,
      id: event.event_id,
      title: event.event_name,
      description: event.event_description,
      date: event.event_date,
      location: event.event_location,
      menu_image_url: `/images/${event.menu_image_filename}`
    };
  }

  /**
   * Transform array of events to include computed fields
   */
  private static transformEvents(events: any[]): MenuEvent[] {
    return events.map(event => this.transformEvent(event));
  }
}
