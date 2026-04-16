/**
 * Review Repository
 * Data access for product-level reviews (used by vendor module)
 */

import { query } from '../config/database.js';

/**
 * Get reviews for a vendor's products
 */
export const getReviewsByVendor = async (vendorId) => {
  const result = await query(
    `SELECT r.*, p.name as product_name, u.full_name as customer_name
     FROM reviews r
     JOIN products p ON r.product_id = p.id
     LEFT JOIN users u ON r.user_id = u.id
     WHERE p.vendor_id = $1
     ORDER BY r.created_at DESC`,
    [vendorId]
  );
  return result.rows;
};

/**
 * Reply to a review (vendor action)
 */
export const addReply = async (reviewId, vendorId, reply) => {
  const result = await query(
    `UPDATE reviews SET vendor_reply = $1, updated_at = NOW()
     WHERE id = $2
       AND product_id IN (SELECT id FROM products WHERE vendor_id = $3)
     RETURNING *`,
    [reply, reviewId, vendorId]
  );
  return result.rows[0];
};

/**
 * Get average rating for a vendor
 */
export const getVendorAverageRating = async (vendorId) => {
  const result = await query(
    `SELECT COALESCE(AVG(r.rating), 0) as avg_rating
     FROM reviews r
     JOIN products p ON r.product_id = p.id
     WHERE p.vendor_id = $1`,
    [vendorId]
  );
  return parseFloat(result.rows[0].avg_rating);
};
