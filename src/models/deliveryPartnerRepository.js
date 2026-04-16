/**
 * Delivery Partner Repository
 * Data access for delivery partner management
 */

import { query } from '../config/database.js';

/**
 * Find delivery partner by user ID
 */
export const findByUserId = async (userId) => {
  const result = await query(
    `SELECT * FROM delivery_partners WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Find delivery partner by ID
 */
export const findById = async (partnerId) => {
  const result = await query(
    `SELECT dp.*, u.full_name, u.mobile_number as user_mobile, u.email as user_email
     FROM delivery_partners dp
     LEFT JOIN users u ON dp.user_id = u.id
     WHERE dp.id = $1`,
    [partnerId]
  );
  return result.rows[0];
};

/**
 * Update partner location
 */
export const updateLocation = async (partnerId, latitude, longitude) => {
  const result = await query(
    `UPDATE delivery_partners SET latitude = $1, longitude = $2
     WHERE id = $3 RETURNING id, latitude, longitude`,
    [latitude, longitude, partnerId]
  );
  return result.rows[0];
};

/**
 * Toggle availability
 */
export const toggleAvailability = async (partnerId, isAvailable) => {
  const result = await query(
    `UPDATE delivery_partners SET is_available = $1
     WHERE id = $2 RETURNING id, is_available`,
    [isAvailable, partnerId]
  );
  return result.rows[0];
};
