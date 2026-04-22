/**
 * Favorites Service
 * Business logic for managing user favorites
 */

import * as favRepo from '../../../models/favoritesRepository.js';
import logger from '../../../utils/logger.js';

// ===========================
// FAVORITE RESTAURANTS
// ===========================

/**
 * Add a restaurant to user's favorites
 */
export const addFavoriteRestaurant = async (userId, storeId, storeName, imageUrl, rating) => {
  try {
    if (!userId || !storeId) {
      throw Object.assign(new Error('User ID and Store ID are required'), { statusCode: 400 });
    }

    const favorite = await favRepo.addFavoriteRestaurant(
      userId,
      storeId,
      storeName,
      imageUrl,
      rating
    );

    logger.info(`Restaurant ${storeId} added to favorites for user ${userId}`);
    return favorite;
  } catch (error) {
    logger.error('Add favorite restaurant error:', error);
    throw error;
  }
};

/**
 * Remove a restaurant from user's favorites
 */
export const removeFavoriteRestaurant = async (userId, storeId) => {
  try {
    if (!userId || !storeId) {
      throw Object.assign(new Error('User ID and Store ID are required'), { statusCode: 400 });
    }

    const result = await favRepo.removeFavoriteRestaurant(userId, storeId);

    if (!result) {
      throw Object.assign(new Error('Favorite restaurant not found'), { statusCode: 404 });
    }

    logger.info(`Restaurant ${storeId} removed from favorites for user ${userId}`);
    return result;
  } catch (error) {
    logger.error('Remove favorite restaurant error:', error);
    throw error;
  }
};

/**
 * Check if a restaurant is favorited
 */
export const isFavoriteRestaurant = async (userId, storeId) => {
  try {
    const isFavorite = await favRepo.isFavoriteRestaurant(userId, storeId);
    return { isFavorite };
  } catch (error) {
    logger.error('Check favorite restaurant error:', error);
    throw error;
  }
};

/**
 * Get all favorite restaurants for a user
 */
export const getFavoriteRestaurants = async (userId, page = 1, limit = 50) => {
  try {
    if (!userId) {
      throw Object.assign(new Error('User ID is required'), { statusCode: 400 });
    }

    const offset = (page - 1) * limit;
    const [favorites, total] = await Promise.all([
      favRepo.getFavoriteRestaurants(userId, limit, offset),
      favRepo.countFavoriteRestaurants(userId)
    ]);

    return {
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get favorite restaurants error:', error);
    throw error;
  }
};

// ===========================
// FAVORITE ITEMS/PRODUCTS
// ===========================

/**
 * Add an item/product to user's favorites
 */
export const addFavoriteItem = async (
  userId,
  itemId,
  itemName,
  domain,
  price,
  imageUrl,
  storeId = null,
  storeName = null,
  category = null,
  type = 'menu' // 'menu' or 'product'
) => {
  try {
    if (!userId || !itemId) {
      throw Object.assign(new Error('User ID and Item ID are required'), { statusCode: 400 });
    }

    const productId = type === 'product' ? itemId : null;
    const menuItemId = type === 'menu' ? itemId : null;

    const favorite = await favRepo.addFavoriteItem(
      userId,
      productId,
      menuItemId,
      itemName,
      domain,
      price,
      imageUrl,
      storeId,
      storeName,
      category
    );

    logger.info(`Item ${itemId} added to favorites for user ${userId}`);
    return favorite;
  } catch (error) {
    logger.error('Add favorite item error:', error);
    throw error;
  }
};

/**
 * Remove an item/product from user's favorites
 */
export const removeFavoriteItem = async (userId, itemId) => {
  try {
    if (!userId || !itemId) {
      throw Object.assign(new Error('User ID and Item ID are required'), { statusCode: 400 });
    }

    const result = await favRepo.removeFavoriteItem(userId, itemId);

    if (!result) {
      throw Object.assign(new Error('Favorite item not found'), { statusCode: 404 });
    }

    logger.info(`Item ${itemId} removed from favorites for user ${userId}`);
    return result;
  } catch (error) {
    logger.error('Remove favorite item error:', error);
    throw error;
  }
};

/**
 * Check if an item is favorited
 */
export const isFavoriteItem = async (userId, itemId) => {
  try {
    const isFavorite = await favRepo.isFavoriteItem(userId, itemId);
    return { isFavorite };
  } catch (error) {
    logger.error('Check favorite item error:', error);
    throw error;
  }
};

/**
 * Get all favorite items for a user
 */
export const getFavoriteItems = async (userId, page = 1, limit = 50) => {
  try {
    if (!userId) {
      throw Object.assign(new Error('User ID is required'), { statusCode: 400 });
    }

    const offset = (page - 1) * limit;
    const [favorites, total] = await Promise.all([
      favRepo.getFavoriteItems(userId, limit, offset),
      favRepo.countFavoriteItems(userId)
    ]);

    return {
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get favorite items error:', error);
    throw error;
  }
};

/**
 * Get favorite items by domain
 */
export const getFavoriteItemsByDomain = async (userId, domain, page = 1, limit = 50) => {
  try {
    if (!userId || !domain) {
      throw Object.assign(new Error('User ID and Domain are required'), { statusCode: 400 });
    }

    const offset = (page - 1) * limit;
    const [favorites, total] = await Promise.all([
      favRepo.getFavoriteItemsByDomain(userId, domain, limit, offset),
      favRepo.countFavoriteItemsByDomain(userId, domain)
    ]);

    return {
      favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get favorite items by domain error:', error);
    throw error;
  }
};

/**
 * Get all favorites summary (restaurants and items count)
 */
export const getFavoritesSummary = async (userId) => {
  try {
    if (!userId) {
      throw Object.assign(new Error('User ID is required'), { statusCode: 400 });
    }

    const [restaurantCount, itemCount] = await Promise.all([
      favRepo.countFavoriteRestaurants(userId),
      favRepo.countFavoriteItems(userId)
    ]);

    return {
      totalFavoriteRestaurants: restaurantCount,
      totalFavoriteItems: itemCount,
      totalFavorites: restaurantCount + itemCount
    };
  } catch (error) {
    logger.error('Get favorites summary error:', error);
    throw error;
  }
};

export default {
  // Restaurants
  addFavoriteRestaurant,
  removeFavoriteRestaurant,
  isFavoriteRestaurant,
  getFavoriteRestaurants,

  // Items
  addFavoriteItem,
  removeFavoriteItem,
  isFavoriteItem,
  getFavoriteItems,
  getFavoriteItemsByDomain,

  // Summary
  getFavoritesSummary
};

