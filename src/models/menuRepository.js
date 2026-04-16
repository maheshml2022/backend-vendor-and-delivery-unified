/**
 * Menu Item Repository
 * Database queries for menu management
 */

import { query } from '../config/database.js';

/**
 * Get all menu items by store
 */
export const getMenuByStore = async (storeId, limit = 50, offset = 0) => {
  const result = await query(
    `SELECT * FROM menu_items 
     WHERE store_id = $1 AND is_available = TRUE
     ORDER BY category, name ASC
     LIMIT $2 OFFSET $3`,
    [storeId, limit, offset]
  );
  return result.rows;
};

/**
 * Get menu item by ID
 */
export const getMenuItemById = async (menuItemId) => {
  const result = await query(
    'SELECT * FROM menu_items WHERE id = $1 AND is_available = TRUE',
    [menuItemId]
  );
  return result.rows[0];
};

/**
 * Get menu items by category
 */
export const getMenuByCategory = async (storeId, category, limit = 20, offset = 0) => {
  const result = await query(
    `SELECT * FROM menu_items 
     WHERE store_id = $1 AND category = $2 AND is_available = TRUE
     ORDER BY name ASC
     LIMIT $3 OFFSET $4`,
    [storeId, category, limit, offset]
  );
  return result.rows;
};

/**
 * Search menu items
 */
export const searchMenuItems = async (storeId, searchTerm, limit = 20, offset = 0) => {
  const searchPattern = `%${searchTerm}%`;
  const result = await query(
    `SELECT * FROM menu_items 
     WHERE store_id = $1 AND is_available = TRUE AND name ILIKE $2
     ORDER BY name ASC
     LIMIT $3 OFFSET $4`,
    [storeId, searchPattern, limit, offset]
  );
  return result.rows;
};

/**
 * Create menu item
 */
export const createMenuItem = async (storeId, menuData) => {
  const {
    name, description, category, price, discountPercentage,
    imageUrl, isVegetarian, preparationTime
  } = menuData;

  const result = await query(
    `INSERT INTO menu_items 
    (store_id, name, description, category, price, discount_percentage,
     image_url, is_vegetarian, preparation_time)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [storeId, name, description, category, price, discountPercentage || 0,
     imageUrl, isVegetarian || false, preparationTime]
  );
  return result.rows[0];
};

/**
 * Update menu item
 */
export const updateMenuItem = async (menuItemId, menuData) => {
  const updates = [];
  const values = [];
  let paramCounter = 1;

  Object.entries(menuData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updates.push(`${dbKey} = $${paramCounter}`);
      values.push(value);
      paramCounter++;
    }
  });

  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(menuItemId);

  const result = await query(
    `UPDATE menu_items SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete menu item (soft delete)
 */
export const deleteMenuItem = async (menuItemId) => {
  const result = await query(
    'UPDATE menu_items SET is_available = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
    [menuItemId]
  );
  return result.rows[0];
};

/**
 * Get menu categories by store
 */
export const getCategories = async (storeId) => {
  const result = await query(
    `SELECT DISTINCT category FROM menu_items 
     WHERE store_id = $1 AND is_available = TRUE
     ORDER BY category ASC`,
    [storeId]
  );
  return result.rows.map(row => row.category);
};

export default {
  getMenuByStore,
  getMenuItemById,
  getMenuByCategory,
  searchMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories
};
