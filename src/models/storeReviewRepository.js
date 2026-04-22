/**
 * Store Review Repository
 * Data access for store/restaurant-level reviews
 */

import { query } from '../config/database.js';

/**
 * Get review summary (avg rating + count) for a store
 */
export const getSummaryByStoreId = async (storeId) => {
  const result = await query(
    `SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as review_count
     FROM store_reviews WHERE store_id = $1`,
    [storeId]
  );
  return {
    averageRating: parseFloat(result.rows[0].average_rating),
    reviewCount: parseInt(result.rows[0].review_count)
  };
};

/**
 * List reviews for a store with pagination
 */
export const listByStoreId = async (storeId, limit, offset) => {
  const result = await query(
    `SELECT r.*, u.full_name as user_name, u.profile_image_url
     FROM store_reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.store_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [storeId, limit, offset]
  );
  return result.rows;
};

/**
 * Count reviews for a store
 */
export const countByStoreId = async (storeId) => {
  const result = await query(
    `SELECT COUNT(*) FROM store_reviews WHERE store_id = $1`,
    [storeId]
  );
  return parseInt(result.rows[0].count);
};

/**
 * Create or update a review (upsert)
 */
export const upsertReview = async (storeId, userId, rating, comment) => {
  const result = await query(
    `INSERT INTO store_reviews (store_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (store_id, user_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       comment = EXCLUDED.comment,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [storeId, userId, rating, comment]
  );
  return result.rows[0];
};

/**
 * Delete a review (ownership check)
 */
export const deleteReview = async (reviewId, userId, storeId) => {
  const result = await query(
    `DELETE FROM store_reviews
     WHERE id = $1 AND user_id = $2 AND store_id = $3
     RETURNING id`,
    [reviewId, userId, storeId]
  );
  return result.rows[0];
};

/**
 * Update store's average rating (call this after creating/deleting reviews)
 */
export const updateStoreRating = async (storeId) => {
  const summary = await getSummaryByStoreId(storeId);
  await query(
    `UPDATE vendor_stores SET rating = $1, updated_at = NOW() WHERE id = $2`,
    [summary.averageRating, storeId]
  );
  return summary;
};

