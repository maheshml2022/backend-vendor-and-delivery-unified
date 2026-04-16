/**
 * Menu Item Review Repository
 * Data access for menu item reviews
 */

import { query } from '../config/database.js';

/**
 * Get review summary (avg rating + count)
 */
export const getSummaryByMenuItemId = async (menuItemId) => {
  const result = await query(
    `SELECT COALESCE(AVG(rating), 0) as average_rating, COUNT(*) as review_count
     FROM menu_item_reviews WHERE menu_item_id = $1`,
    [menuItemId]
  );
  return {
    averageRating: parseFloat(result.rows[0].average_rating),
    reviewCount: parseInt(result.rows[0].review_count)
  };
};

/**
 * List reviews for a menu item with pagination
 */
export const listByMenuItemId = async (menuItemId, limit, offset) => {
  const result = await query(
    `SELECT r.*, u.full_name as user_name, u.profile_image_url
     FROM menu_item_reviews r
     LEFT JOIN users u ON r.user_id = u.id
     WHERE r.menu_item_id = $1
     ORDER BY r.created_at DESC
     LIMIT $2 OFFSET $3`,
    [menuItemId, limit, offset]
  );
  return result.rows;
};

/**
 * Count reviews for a menu item
 */
export const countByMenuItemId = async (menuItemId) => {
  const result = await query(
    `SELECT COUNT(*) FROM menu_item_reviews WHERE menu_item_id = $1`,
    [menuItemId]
  );
  return parseInt(result.rows[0].count);
};

/**
 * Create or update a review (upsert)
 */
export const upsertReview = async (menuItemId, userId, rating, comment) => {
  const result = await query(
    `INSERT INTO menu_item_reviews (menu_item_id, user_id, rating, comment)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (menu_item_id, user_id) DO UPDATE SET
       rating = EXCLUDED.rating,
       comment = EXCLUDED.comment,
       updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [menuItemId, userId, rating, comment]
  );
  return result.rows[0];
};

/**
 * Delete a review (ownership check)
 */
export const deleteReview = async (reviewId, userId, menuItemId) => {
  const result = await query(
    `DELETE FROM menu_item_reviews
     WHERE id = $1 AND user_id = $2 AND menu_item_id = $3
     RETURNING id`,
    [reviewId, userId, menuItemId]
  );
  return result.rows[0];
};
