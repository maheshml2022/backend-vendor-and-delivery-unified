/**
 * Address Repository
 * Database queries for address management
 */

import { query } from '../config/database.js';

/**
 * Get user addresses
 */
export const getUserAddresses = async (userId) => {
  const result = await query(
    `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Get address by ID
 */
export const getAddressById = async (addressId, userId) => {
  const result = await query(
    'SELECT * FROM addresses WHERE id = $1 AND user_id = $2',
    [addressId, userId]
  );
  return result.rows[0];
};

/**
 * Create address
 */
export const createAddress = async (userId, addressData) => {
  const {
    addressLine1, addressLine2, city, postalCode,
    latitude, longitude, isPrimary
  } = addressData;

  const result = await query(
    `INSERT INTO addresses 
    (user_id, address_line1, address_line2, city, postal_code, latitude, longitude, is_primary)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [userId, addressLine1, addressLine2 || null, city, postalCode,
     latitude || null, longitude || null, isPrimary || false]
  );
  return result.rows[0];
};

/**
 * Update address
 */
export const updateAddress = async (addressId, userId, addressData) => {
  const updates = [];
  const values = [];
  let paramCounter = 1;

  Object.entries(addressData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      updates.push(`${dbKey} = $${paramCounter}`);
      values.push(value);
      paramCounter++;
    }
  });

  if (updates.length === 0) return null;

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(addressId);
  values.push(userId);

  const result = await query(
    `UPDATE addresses SET ${updates.join(', ')} 
     WHERE id = $${paramCounter} AND user_id = $${paramCounter + 1} RETURNING *`,
    values
  );
  return result.rows[0];
};

/**
 * Delete address
 */
export const deleteAddress = async (addressId, userId) => {
  const result = await query(
    'DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id',
    [addressId, userId]
  );
  return result.rows[0];
};

/**
 * Set address as primary
 */
export const setPrimaryAddress = async (addressId, userId) => {
  // First remove primary from all addresses
  await query(
    'UPDATE addresses SET is_primary = FALSE WHERE user_id = $1',
    [userId]
  );

  // Set new primary
  const result = await query(
    'UPDATE addresses SET is_primary = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
    [addressId, userId]
  );
  return result.rows[0];
};

export default {
  getUserAddresses,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
  setPrimaryAddress
};
