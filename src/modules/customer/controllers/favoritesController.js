/**
 * Favorites Controller
 * Handles all favorite-related endpoints
 */

import * as favoritesService from '../services/favoritesService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

// ===========================
// FAVORITE RESTAURANTS
// ===========================

/**
 * POST /api/v1/customer/favorites/restaurants
 * Add a restaurant to favorites
 */
export const addFavoriteRestaurant = asyncHandler(async (req, res) => {
  const { storeId, storeName, imageUrl, rating } = req.body;
  const userId = req.user?.userId || req.user?.id;

  const result = await favoritesService.addFavoriteRestaurant(
    userId,
    storeId,
    storeName,
    imageUrl,
    rating
  );

  res.status(201).json(successResponse(result, 'Restaurant added to favorites'));
});

/**
 * DELETE /api/v1/customer/favorites/restaurants/:storeId
 * Remove a restaurant from favorites
 */
export const removeFavoriteRestaurant = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  await favoritesService.removeFavoriteRestaurant(userId, parseInt(storeId));

  res.json(successResponse(null, 'Restaurant removed from favorites'));
});

/**
 * GET /api/v1/customer/favorites/restaurants/:storeId/is-favorite
 * Check if a restaurant is favorited
 */
export const isFavoriteRestaurant = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  const result = await favoritesService.isFavoriteRestaurant(userId, parseInt(storeId));

  res.json(successResponse(result, 'Favorite status retrieved'));
});

/**
 * GET /api/v1/customer/favorites/restaurants
 * Get all favorite restaurants for user
 */
export const getFavoriteRestaurants = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const { page = 1, limit = 50 } = req.query;

  const result = await favoritesService.getFavoriteRestaurants(
    userId,
    parseInt(page),
    parseInt(limit)
  );

  res.json(successResponse(result, 'Favorite restaurants retrieved'));
});

// ===========================
// FAVORITE ITEMS/PRODUCTS
// ===========================

/**
 * POST /api/v1/customer/favorites/items
 * Add an item/product to favorites
 */
export const addFavoriteItem = asyncHandler(async (req, res) => {
  const { itemId, itemName, domain, price, imageUrl, storeId, storeName, category, type = 'menu' } = req.body;
  const userId = req.user?.userId || req.user?.id;

  const result = await favoritesService.addFavoriteItem(
    userId,
    itemId,
    itemName,
    domain,
    price,
    imageUrl,
    storeId,
    storeName,
    category,
    type
  );

  res.status(201).json(successResponse(result, 'Item added to favorites'));
});

/**
 * DELETE /api/v1/customer/favorites/items/:itemId
 * Remove an item/product from favorites
 */
export const removeFavoriteItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  await favoritesService.removeFavoriteItem(userId, parseInt(itemId));

  res.json(successResponse(null, 'Item removed from favorites'));
});

/**
 * GET /api/v1/customer/favorites/items/:itemId/is-favorite
 * Check if an item is favorited
 */
export const isFavoriteItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user?.userId || req.user?.id;

  const result = await favoritesService.isFavoriteItem(userId, parseInt(itemId));

  res.json(successResponse(result, 'Favorite status retrieved'));
});

/**
 * GET /api/v1/customer/favorites/items
 * Get all favorite items for user
 */
export const getFavoriteItems = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const { page = 1, limit = 50 } = req.query;

  const result = await favoritesService.getFavoriteItems(
    userId,
    parseInt(page),
    parseInt(limit)
  );

  res.json(successResponse(result, 'Favorite items retrieved'));
});

/**
 * GET /api/v1/customer/favorites/items/domain/:domain
 * Get favorite items by domain
 */
export const getFavoriteItemsByDomain = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const { domain } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const result = await favoritesService.getFavoriteItemsByDomain(
    userId,
    domain,
    parseInt(page),
    parseInt(limit)
  );

  res.json(successResponse(result, 'Favorite items retrieved by domain'));
});

/**
 * GET /api/v1/customer/favorites/summary
 * Get favorites summary
 */
export const getFavoritesSummary = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;

  const result = await favoritesService.getFavoritesSummary(userId);

  res.json(successResponse(result, 'Favorites summary retrieved'));
});

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

