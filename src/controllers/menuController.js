/**
 * Menu Controller
 * Handles menu endpoints
 */

import * as menuService from '../services/menuService.js';
import { validate, validateMenuItem } from '../validators/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/v1/menu/store/:storeId
 * Get menu by store
 */
export const getMenuByStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const result = await menuService.getMenuByStore(
    parseInt(storeId),
    parseInt(page),
    parseInt(limit)
  );

  res.json(successResponse(result, 'Menu retrieved'));
});

/**
 * GET /api/v1/menu/:menuItemId
 * Get menu item details
 */
export const getMenuItemDetails = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;
  const menuItem = await menuService.getMenuItemDetails(parseInt(menuItemId));
  res.json(successResponse(menuItem, 'Menu item retrieved'));
});

/**
 * GET /api/v1/menu/store/:storeId/category/:category
 * Get menu items by category
 */
export const getMenuByCategory = asyncHandler(async (req, res) => {
  const { storeId, category } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const result = await menuService.getMenuByCategory(
    parseInt(storeId),
    category,
    parseInt(page),
    parseInt(limit)
  );

  res.json(successResponse(result, 'Menu category retrieved'));
});

/**
 * GET /api/v1/menu/store/:storeId/search
 * Search menu items
 */
export const searchMenuItems = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { query, page = 1, limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json(
      errorResponse(null, 400, 'Search query is required')
    );
  }

  const result = await menuService.searchMenuItems(
    parseInt(storeId),
    query,
    parseInt(page),
    parseInt(limit)
  );

  res.json(successResponse(result, 'Search results'));
});

/**
 * GET /api/v1/menu/store/:storeId/categories
 * Get menu categories
 */
export const getMenuCategories = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const categories = await menuService.getMenuCategories(parseInt(storeId));
  res.json(successResponse(categories, 'Categories retrieved'));
});

export default {
  getMenuByStore,
  getMenuItemDetails,
  getMenuByCategory,
  searchMenuItems,
  getMenuCategories
};
