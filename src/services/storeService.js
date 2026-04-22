/**
 * Store Service
 * Handles vendor store operations
 */

import * as storeRepo from '../models/storeRepository.js';
import logger from '../utils/logger.js';

/**
 * Get all stores
 */
export const getAllStores = async (page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const stores = await storeRepo.getAllStores(limit, offset);
    const total = await storeRepo.countStores();

    return {
      stores,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get all stores error:', error);
    throw error;
  }
};

/**
 * Get store details
 */
export const getStoreDetails = async (storeId) => {
  try {
    const store = await storeRepo.getStoreById(storeId);

    if (!store) {
      throw new Error('Store not found');
    }

    return store;
  } catch (error) {
    logger.error('Get store details error:', error);
    throw error;
  }
};

/**
 * Search stores
 */
export const searchStores = async (searchTerm, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const stores = await storeRepo.searchStores(searchTerm, limit, offset);
    const total = stores.length; // Note: For real implementation, count separately

    return {
      stores,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Search stores error:', error);
    throw error;
  }
};

/**
 * Get stores by city
 */
export const getStoresByCity = async (city, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const stores = await storeRepo.getStoresByCity(city, limit, offset);
    const total = await storeRepo.countStoresByCity(city);

    return {
      stores,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get stores by city error:', error);
    throw error;
  }
};

/**
 * Get all cities
 */
export const getAllCities = async () => {
  try {
    const cities = await storeRepo.getAllCities();
    return cities;
  } catch (error) {
    logger.error('Get all cities error:', error);
    throw error;
  }
};

/**
 * Get stores by location
 */
export const getStoresByLocation = async (latitude, longitude, radiusKm = 5, limit = 20) => {
  try {
    const stores = await storeRepo.getStoresByLocation(latitude, longitude, radiusKm, limit);

    return {
      stores,
      searchCenter: { latitude, longitude },
      radiusKm
    };
  } catch (error) {
    logger.error('Get stores by location error:', error);
    throw error;
  }
};

/**
 * Create store (admin)
 */
export const createStore = async (storeData) => {
  try {
    const store = await storeRepo.createStore(storeData);
    return store;
  } catch (error) {
    logger.error('Create store error:', error);
    throw error;
  }
};

/**
 * Update store (admin)
 */
export const updateStore = async (storeId, storeData) => {
  try {
    const store = await storeRepo.updateStore(storeId, storeData);
    return store;
  } catch (error) {
    logger.error('Update store error:', error);
    throw error;
  }
};

export default {
  getAllStores,
  getStoreDetails,
  searchStores,
  getStoresByCity,
  getAllCities,
  getStoresByLocation,
  createStore,
  updateStore
};
