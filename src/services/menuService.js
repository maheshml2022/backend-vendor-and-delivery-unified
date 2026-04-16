/**
 * Menu Service
 * Handles menu item operations
 */

import * as menuRepo from '../models/menuRepository.js';
import logger from '../utils/logger.js';

/**
 * Get menu by store
 */
export const getMenuByStore = async (storeId, page = 1, limit = 50) => {
  try {
    const offset = (page - 1) * limit;
    const menuItems = await menuRepo.getMenuByStore(storeId, limit, offset);

    return {
      storeId,
      menuItems,
      pagination: {
        page,
        limit,
        total: menuItems.length
      }
    };
  } catch (error) {
    logger.error('Get menu by store error:', error);
    throw error;
  }
};

/**
 * Get menu item details
 */
export const getMenuItemDetails = async (menuItemId) => {
  try {
    const menuItem = await menuRepo.getMenuItemById(menuItemId);

    if (!menuItem) {
      throw new Error('Menu item not found');
    }

    return menuItem;
  } catch (error) {
    logger.error('Get menu item details error:', error);
    throw error;
  }
};

/**
 * Get menu items by category
 */
export const getMenuByCategory = async (storeId, category, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const menuItems = await menuRepo.getMenuByCategory(storeId, category, limit, offset);

    return {
      storeId,
      category,
      menuItems,
      pagination: {
        page,
        limit,
        total: menuItems.length
      }
    };
  } catch (error) {
    logger.error('Get menu by category error:', error);
    throw error;
  }
};

/**
 * Search menu items
 */
export const searchMenuItems = async (storeId, searchTerm, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const menuItems = await menuRepo.searchMenuItems(storeId, searchTerm, limit, offset);

    return {
      storeId,
      searchTerm,
      menuItems
    };
  } catch (error) {
    logger.error('Search menu items error:', error);
    throw error;
  }
};

/**
 * Get menu categories
 */
export const getMenuCategories = async (storeId) => {
  try {
    const categories = await menuRepo.getCategories(storeId);
    return categories;
  } catch (error) {
    logger.error('Get menu categories error:', error);
    throw error;
  }
};

/**
 * Create menu item (admin/store)
 */
export const createMenuItem = async (storeId, menuData) => {
  try {
    const menuItem = await menuRepo.createMenuItem(storeId, menuData);
    return menuItem;
  } catch (error) {
    logger.error('Create menu item error:', error);
    throw error;
  }
};

/**
 * Update menu item (admin/store)
 */
export const updateMenuItem = async (menuItemId, menuData) => {
  try {
    const menuItem = await menuRepo.updateMenuItem(menuItemId, menuData);
    return menuItem;
  } catch (error) {
    logger.error('Update menu item error:', error);
    throw error;
  }
};

export default {
  getMenuByStore,
  getMenuItemDetails,
  getMenuByCategory,
  searchMenuItems,
  getMenuCategories,
  createMenuItem,
  updateMenuItem
};
