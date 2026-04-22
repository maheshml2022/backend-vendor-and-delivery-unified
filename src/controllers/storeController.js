/**
 * Store Controller
 * Handles vendor store endpoints
 */

import * as storeService from '../services/storeService.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, validateStore } from '../validators/index.js';

/**
 * GET /api/v1/stores
 * Get all stores with pagination
 */
export const getAllStores = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const result = await storeService.getAllStores(parseInt(page), parseInt(limit));

  res.json(paginatedResponse(
    result.stores,
    result.pagination.total,
    result.pagination.page,
    result.pagination.limit,
    'Stores retrieved'
  ));
});

/**
 * GET /api/v1/stores/:storeId
 * Get store details
 */
export const getStoreDetails = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const store = await storeService.getStoreDetails(parseInt(storeId));
  res.json(successResponse(store, 'Store details retrieved'));
});

/**
 * GET /api/v1/stores/cities
 * Get all available cities
 */
export const getAllCities = asyncHandler(async (req, res) => {
  const cities = await storeService.getAllCities();
  res.json(successResponse(cities, 'Cities retrieved'));
});

/**
 * GET /api/v1/stores/city/:city
 * Get stores by city
 */
export const getStoresByCity = asyncHandler(async (req, res) => {
  const { city } = req.params;
  const { page = 1, limit = 20 } = req.query;

  if (!city) {
    return res.status(400).json(
      errorResponse(null, 400, 'City name is required')
    );
  }

  const result = await storeService.getStoresByCity(city, parseInt(page), parseInt(limit));

  res.json(paginatedResponse(
    result.stores,
    result.pagination.total,
    result.pagination.page,
    result.pagination.limit,
    `Stores in ${city} retrieved`
  ));
});

/**
 * GET /api/v1/stores/search
 * Search stores
 */
export const searchStores = asyncHandler(async (req, res) => {
  const { query, page = 1, limit = 20 } = req.query;

  if (!query) {
    return res.status(400).json(
      errorResponse(null, 400, 'Search query is required')
    );
  }

  const result = await storeService.searchStores(query, parseInt(page), parseInt(limit));

  res.json(paginatedResponse(
    result.stores,
    result.pagination.total,
    result.pagination.page,
    result.pagination.limit,
    'Search results'
  ));
});

/**
 * GET /api/v1/stores/nearby
 * Get nearby stores by location
 */
export const getNearbyStores = asyncHandler(async (req, res) => {
  const { latitude, longitude, radius = 5, limit = 20 } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json(
      errorResponse(null, 400, 'Latitude and longitude are required')
    );
  }

  const result = await storeService.getStoresByLocation(
    parseFloat(latitude),
    parseFloat(longitude),
    parseFloat(radius),
    parseInt(limit)
  );

  res.json(successResponse(result, 'Nearby stores retrieved'));
});

/**
 * POST /api/v1/stores
 * Create new store (admin)
 */
export const createStore = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateStore, req.body);

  if (error) {
    return res.status(400).json(errorResponse(error, 400, 'Validation error'));
  }

  const store = await storeService.createStore(value);
  res.status(201).json(successResponse(store, 'Store created successfully', 201));
});

export default {
  getAllStores,
  getStoreDetails,
  searchStores,
  getNearbyStores,
  createStore
};
