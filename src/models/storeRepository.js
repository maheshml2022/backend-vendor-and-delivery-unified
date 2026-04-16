/**
 * Store Repository
 * Database queries for vendor store management
 */

import { query } from '../config/database.js';

/**
 * Get all stores with pagination
 */
export const getAllStores = async (limit = 20, offset = 0) => {
  const result = await query(
    `SELECT * FROM vendor_stores 
     WHERE is_active = TRUE 
     ORDER BY rating DESC, name ASC 
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

/**
 * Get store by ID
 */
export const getStoreById = async (storeId) => {
  const result = await query(
    'SELECT * FROM vendor_stores WHERE id = $1 AND is_active = TRUE',
    [storeId]
  );
  return result.rows[0];
};

/**
 * Search stores by name or cuisine
 */
export const searchStores = async (searchTerm, limit = 20, offset = 0) => {
  const searchPattern = `%${searchTerm}%`;
  const result = await query(
    `SELECT * FROM vendor_stores 
     WHERE is_active = TRUE AND (name ILIKE $1 OR cuisine_type ILIKE $1)
     ORDER BY rating DESC, name ASC 
     LIMIT $2 OFFSET $3`,
    [searchPattern, limit, offset]
  );
  return result.rows;
};

/**
 * Get stores by location (latitude, longitude)
 */
export const getStoresByLocation = async (latitude, longitude, radiusKm = 5, limit = 20) => {
  const result = await query(
    `SELECT *, 
     (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
     cos(radians(longitude) - radians($2)) + sin(radians($1)) * 
     sin(radians(latitude)))) AS distance
     FROM vendor_stores 
     WHERE is_active = TRUE
     HAVING (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * 
     cos(radians(longitude) - radians($2)) + sin(radians($1)) * 
     sin(radians(latitude)))) <= $3
     ORDER BY distance ASC
     LIMIT $4`,
    [latitude, longitude, radiusKm, limit]
  );
  return result.rows;
};

/**
 * Create store
 */
export const createStore = async (storeData) => {
  const {
    name, storeType, vendorId, description, deliveryTime, deliveryCharge,
    logoUrl, bannerUrl, latitude, longitude, ownerId
  } = storeData;

  const result = await query(
    `INSERT INTO vendor_stores 
    (name, store_type, vendor_id, description, delivery_time, delivery_charge, 
     logo_url, banner_url, latitude, longitude, owner_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [name, storeType, vendorId, description, deliveryTime, deliveryCharge,
     logoUrl, bannerUrl, latitude, longitude, ownerId]
  );
  return result.rows[0];
};

/**
 * Update store
 */
export const updateStore = async (storeId, storeData) => {
  const updates = [];
  const values = [];
  let paramCounter = 1;

  Object.entries(storeData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updates.push(`${dbKey} = $${paramCounter}`);
      values.push(value);
      paramCounter++;
    }
  });

  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(storeId);

  const result = await query(
    `UPDATE vendor_stores SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Count total stores
 */
export const countStores = async () => {
  const result = await query(
    'SELECT COUNT(*) FROM vendor_stores WHERE is_active = TRUE'
  );
  return parseInt(result.rows[0].count);
};

export default {
  getAllStores,
  getStoreById,
  searchStores,
  getStoresByLocation,
  createStore,
  updateStore,
  countStores
};
