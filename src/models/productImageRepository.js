/**
 * Product Image Repository
 * Data access for product image management
 */

import { query, transaction } from '../config/database.js';

/**
 * Add image to product
 */
export const addImage = async (productId, imageUrl, isPrimary = false) => {
  if (isPrimary) {
    return transaction(async (client) => {
      await client.query(`UPDATE product_images SET is_primary = false WHERE product_id = $1`, [productId]);
      const result = await client.query(
        `INSERT INTO product_images (product_id, image_url, is_primary)
         VALUES ($1, $2, $3) RETURNING *`,
        [productId, imageUrl, true]
      );
      return result.rows[0];
    });
  }
  const result = await query(
    `INSERT INTO product_images (product_id, image_url, is_primary)
     VALUES ($1, $2, $3) RETURNING *`,
    [productId, imageUrl, false]
  );
  return result.rows[0];
};

/**
 * Get all images for a product
 */
export const getImagesByProduct = async (productId) => {
  const result = await query(
    `SELECT * FROM product_images WHERE product_id = $1 ORDER BY is_primary DESC, id ASC`,
    [productId]
  );
  return result.rows;
};

/**
 * Delete an image
 */
export const deleteImage = async (imageId) => {
  const result = await query(
    `DELETE FROM product_images WHERE id = $1 RETURNING *`,
    [imageId]
  );
  return result.rows[0];
};
