/**
 * Product Repository
 * Data access for vendor product management
 */

import { query } from '../config/database.js';

const DUMMY_IMAGES = {
  food: 'https://placehold.co/1200x360/FF6A00/FFFFFF?text=DailyBox+Food',
  grocery: 'https://placehold.co/1200x360/2ECC71/FFFFFF?text=DailyBox+Grocery',
  vegetables: 'https://placehold.co/1200x360/4CAF50/FFFFFF?text=DailyBox+Vegetables',
  pharmacy: 'https://placehold.co/1200x360/1976D2/FFFFFF?text=DailyBox+Pharmacy'
};

const getDummyImageUrl = (domain) => {
  const normalized = (domain || 'grocery').toString().trim().toLowerCase();
  if (normalized === 'veg') return DUMMY_IMAGES.vegetables;
  return DUMMY_IMAGES[normalized] || DUMMY_IMAGES.grocery;
};

const withDefaultCatalogImage = (imageUrl, domain) => {
  return imageUrl && imageUrl.toString().trim() !== ''
    ? imageUrl
    : getDummyImageUrl(domain);
};

/**
 * Get products for a vendor with optional store filter
 */
export const getProductsByVendor = async (vendorId, storeId = null) => {
  const params = [vendorId];
  let where = `WHERE p.vendor_id = $1`;

  if (storeId) {
    params.push(storeId);
    where += ` AND p.store_id = $2`;
  }

  const result = await query(
    `SELECT p.*,
       json_agg(pi.image_url) FILTER (WHERE pi.id IS NOT NULL) as extra_images
     FROM products p
     LEFT JOIN product_images pi ON pi.product_id = p.id
     ${where}
     GROUP BY p.id
     ORDER BY p.created_at DESC`,
    params
  );
  return result.rows;
};

/**
 * Get single product by ID
 */
export const getProductById = async (productId) => {
  const result = await query(
    `SELECT p.*,
       json_agg(pi.image_url) FILTER (WHERE pi.id IS NOT NULL) as extra_images
     FROM products p
     LEFT JOIN product_images pi ON pi.product_id = p.id
     WHERE p.id = $1
     GROUP BY p.id`,
    [productId]
  );
  return result.rows[0];
};

/**
 * Create a product
 */
export const createProduct = async (vendorId, data) => {
  const normalizedImageUrl = withDefaultCatalogImage(data.imageUrl, data.domain || data.category);
  const normalizedThumbnailUrl = withDefaultCatalogImage(data.thumbnailUrl || data.imageUrl, data.domain || data.category);

  const result = await query(
    `INSERT INTO products
       (store_id, vendor_id, name, description, category, price, original_price,
        image_url, thumbnail_url, is_vegetarian, discount_percentage,
        requires_prescription, stock_quantity)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
    [
      data.storeId || null, vendorId, data.name, data.description || null,
      data.category, data.price, data.originalPrice || data.price,
      normalizedImageUrl, normalizedThumbnailUrl,
      data.isVegetarian || false, data.discountPercentage || 0,
      data.requiresPrescription || false, data.stockQuantity || 0
    ]
  );
  return result.rows[0];
};

/**
 * Update a product (vendor-scoped)
 */
export const updateProduct = async (productId, vendorId, data) => {
  const normalizedImageUrl = data.imageUrl === undefined
    ? undefined
    : withDefaultCatalogImage(data.imageUrl, data.domain || data.category);
  const normalizedThumbnailUrl = data.thumbnailUrl === undefined
    ? undefined
    : withDefaultCatalogImage(data.thumbnailUrl || data.imageUrl, data.domain || data.category);

  const result = await query(
    `UPDATE products SET
       name                  = COALESCE($1, name),
       description           = COALESCE($2, description),
       category              = COALESCE($3, category),
       price                 = COALESCE($4, price),
       original_price        = COALESCE($5, original_price),
       image_url             = COALESCE($6, image_url),
       thumbnail_url         = COALESCE($7, thumbnail_url),
       is_vegetarian         = COALESCE($8, is_vegetarian),
       discount_percentage   = COALESCE($9, discount_percentage),
       requires_prescription = COALESCE($10, requires_prescription),
       is_available          = COALESCE($11, is_available),
       stock_quantity        = COALESCE($12, stock_quantity),
       updated_at            = NOW()
     WHERE id = $13 AND vendor_id = $14
     RETURNING *`,
    [
      data.name, data.description, data.category, data.price,
      data.originalPrice, normalizedImageUrl, normalizedThumbnailUrl,
      data.isVegetarian, data.discountPercentage, data.requiresPrescription,
      data.isAvailable, data.stockQuantity,
      productId, vendorId
    ]
  );
  return result.rows[0];
};

/**
 * Delete a product (vendor-scoped)
 */
export const deleteProduct = async (productId, vendorId) => {
  const result = await query(
    `DELETE FROM products WHERE id = $1 AND vendor_id = $2 RETURNING id`,
    [productId, vendorId]
  );
  return result.rows[0];
};

/**
 * Check product ownership
 */
export const isOwnedByVendor = async (productId, vendorId) => {
  const result = await query(
    `SELECT id FROM products WHERE id = $1 AND vendor_id = $2`,
    [productId, vendorId]
  );
  return result.rows.length > 0;
};
