/**
 * Menu Routes
 * Handles menu browsing endpoints
 */

import express from 'express';
import { optionalAuthenticate } from '../middleware/authentication.js';
import * as menuController from '../controllers/menuController.js';

const router = express.Router();

/**
 * GET /api/v1/menu/store/:storeId
 * Get menu by store
 * Auth required: No
 * Query: { page?: number, limit?: number }
 */
router.get('/store/:storeId', optionalAuthenticate, menuController.getMenuByStore);

/**
 * GET /api/v1/menu/store/:storeId/categories
 * Get menu categories for store
 * Auth required: No
 */
router.get('/store/:storeId/categories', optionalAuthenticate, menuController.getMenuCategories);

/**
 * GET /api/v1/menu/store/:storeId/category/:category
 * Get menu items by category
 * Auth required: No
 * Query: { page?: number, limit?: number }
 */
router.get('/store/:storeId/category/:category', optionalAuthenticate, menuController.getMenuByCategory);

/**
 * GET /api/v1/menu/store/:storeId/search
 * Search menu items
 * Auth required: No
 * Query: { query: string, page?: number, limit?: number }
 */
router.get('/store/:storeId/search', optionalAuthenticate, menuController.searchMenuItems);

/**
 * GET /api/v1/menu/:menuItemId
 * Get menu item details
 * Auth required: No
 */
router.get('/:menuItemId', optionalAuthenticate, menuController.getMenuItemDetails);

export default router;
