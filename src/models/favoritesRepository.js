/**
 * Favorites Repository
 * Database queries for managing user favorites (restaurants and items)
 */

import { query } from '../config/database.js';

// ===========================
// FAVORITE RESTAURANTS
// ===========================

/**
 * Add a restaurant to user's favorites
 */
export const addFavoriteRestaurant = async (userId, storeId, storeName, imageUrl, rating) => {
  try {
    const result = await query(
      `INSERT INTO favorite_restaurants (user_id, store_id, store_name, image_url, rating)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, store_id) DO NOTHING
       RETURNING *`,
      [userId, storeId, storeName, imageUrl, rating]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a restaurant from user's favorites
 */
export const removeFavoriteRestaurant = async (userId, storeId) => {
  try {
    const result = await query(
      'DELETE FROM favorite_restaurants WHERE user_id = $1 AND store_id = $2 RETURNING *',
      [userId, storeId]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Check if a restaurant is favorited by user
 */
export const isFavoriteRestaurant = async (userId, storeId) => {
  try {
    const result = await query(
      'SELECT id FROM favorite_restaurants WHERE user_id = $1 AND store_id = $2',
      [userId, storeId]
    );
    return result.rows.length > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all favorite restaurants for a user
 */
export const getFavoriteRestaurants = async (userId, limit = 50, offset = 0) => {
  try {
    const result = await query(
      `SELECT * FROM favorite_restaurants 
       WHERE user_id = $1 
       ORDER BY added_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Get count of favorite restaurants for a user
 */
export const countFavoriteRestaurants = async (userId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM favorite_restaurants WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    throw error;
  }
};

// ===========================
// FAVORITE ITEMS/PRODUCTS
// ===========================

/**
 * Add a product/menu item to user's favorites
 */
export const addFavoriteItem = async (
  userId,
  productId = null,
  menuItemId = null,
  itemName,
  domain,
  price,
  imageUrl,
  storeId,
  storeName,
  category
) => {
  try {
    const result = await query(
      `INSERT INTO favorite_items 
       (user_id, product_id, menu_item_id, item_name, domain, price, image_url, store_id, store_name, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, product_id, menu_item_id) DO NOTHING
       RETURNING *`,
      [userId, productId, menuItemId, itemName, domain, price, imageUrl, storeId, storeName, category]
    );
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Remove a product/menu item from user's favorites
 */
export const removeFavoriteItem = async (userId, itemId) => {
  try {
    // Try by product_id first, then by menu_item_id
    let result = await query(
      'DELETE FROM favorite_items WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [userId, itemId]
    );

    if (result.rows.length === 0) {
      result = await query(
        'DELETE FROM favorite_items WHERE user_id = $1 AND menu_item_id = $2 RETURNING *',
        [userId, itemId]
      );
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

/**
 * Check if an item is favorited by user
 */
export const isFavoriteItem = async (userId, itemId) => {
  try {
    let result = await query(
      'SELECT id FROM favorite_items WHERE user_id = $1 AND product_id = $2',
      [userId, itemId]
    );

    if (result.rows.length > 0) {
      return true;
    }

    result = await query(
      'SELECT id FROM favorite_items WHERE user_id = $1 AND menu_item_id = $2',
      [userId, itemId]
    );

    return result.rows.length > 0;
  } catch (error) {
    throw error;
  }
};

/**
 * Get all favorite items for a user
 */
export const getFavoriteItems = async (userId, limit = 50, offset = 0) => {
  try {
    const result = await query(
      `SELECT * FROM favorite_items 
       WHERE user_id = $1 
       ORDER BY added_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Get favorite items by domain (e.g., grocery, vegetables, pharmacy)
 */
export const getFavoriteItemsByDomain = async (userId, domain, limit = 50, offset = 0) => {
  try {
    const result = await query(
      `SELECT * FROM favorite_items 
       WHERE user_id = $1 AND domain = $2 
       ORDER BY added_at DESC 
       LIMIT $3 OFFSET $4`,
      [userId, domain, limit, offset]
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Get count of favorite items for a user
 */
export const countFavoriteItems = async (userId) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM favorite_items WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    throw error;
  }
};

/**
 * Get count of favorite items by domain
 */
export const countFavoriteItemsByDomain = async (userId, domain) => {
  try {
    const result = await query(
      'SELECT COUNT(*) as count FROM favorite_items WHERE user_id = $1 AND domain = $2',
      [userId, domain]
    );
    return parseInt(result.rows[0].count);
  } catch (error) {
    throw error;
  }
};

/**
 * Delete all favorites for a user (account deletion)
 */
export const deleteAllFavorites = async (userId) => {
  try {
    await query('DELETE FROM favorite_restaurants WHERE user_id = $1', [userId]);
    await query('DELETE FROM favorite_items WHERE user_id = $1', [userId]);
    return true;
  } catch (error) {
    throw error;
  }
};

export default {
  // Restaurants
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
  isFavoriteRestaurant,
  getFavoriteRestaurants,
  countFavoriteRestaurants,

  // Items
  addFavoriteItem,
  removeFavoriteItem,
  isFavoriteItem,
  getFavoriteItems,
  getFavoriteItemsByDomain,
  countFavoriteItems,
  countFavoriteItemsByDomain,

  // Account
  deleteAllFavorites
};

