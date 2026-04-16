/**
 * Catalog Repository
 * Data access for multi-domain catalog (grocery, vegetables, pharmacy)
 */

import { query } from '../config/database.js';

/**
 * Get stores by type with pagination
 */
export const getStores = async (storeType, limit, offset) => {
  const result = await query(
    `SELECT * FROM vendor_stores
     WHERE store_type = $1 AND is_active = true
     ORDER BY rating DESC, name ASC
     LIMIT $2 OFFSET $3`,
    [storeType, limit, offset]
  );
  return result.rows;
};

/**
 * Count stores by type
 */
export const countStores = async (storeType) => {
  const result = await query(
    `SELECT COUNT(*) FROM vendor_stores WHERE store_type = $1 AND is_active = true`,
    [storeType]
  );
  return parseInt(result.rows[0].count);
};

/**
 * Get catalog items with filters
 */
export const getCatalogItems = async (filters, limit, offset) => {
  const params = [];
  const conditions = ['p.is_available = true'];

  if (filters.domain) {
    params.push(filters.domain);
    conditions.push(`p.domain = $${params.length}`);
  }

  if (filters.storeId) {
    params.push(filters.storeId);
    conditions.push(`p.store_id = $${params.length}`);
  }

  if (filters.category) {
    params.push(filters.category);
    conditions.push(`p.category = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`p.name ILIKE $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit, offset);
  const result = await query(
    `SELECT p.*, vs.name as store_name
     FROM products p
     LEFT JOIN vendor_stores vs ON p.store_id = vs.id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return result.rows;
};

/**
 * Count catalog items with filters
 */
export const countCatalogItems = async (filters) => {
  const params = [];
  const conditions = ['p.is_available = true'];

  if (filters.domain) {
    params.push(filters.domain);
    conditions.push(`p.domain = $${params.length}`);
  }
  if (filters.storeId) {
    params.push(filters.storeId);
    conditions.push(`p.store_id = $${params.length}`);
  }
  if (filters.category) {
    params.push(filters.category);
    conditions.push(`p.category = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`p.name ILIKE $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(`SELECT COUNT(*) FROM products p ${where}`, params);
  return parseInt(result.rows[0].count);
};

/**
 * Get single catalog item by ID
 */
export const getCatalogItemById = async (itemId) => {
  const result = await query(
    `SELECT p.*, vs.name as store_name, vs.store_type
     FROM products p
     LEFT JOIN vendor_stores vs ON p.store_id = vs.id
     WHERE p.id = $1`,
    [itemId]
  );
  return result.rows[0];
};

/**
 * Get distinct categories for a domain
 */
export const getCategories = async (domain) => {
  const result = await query(
    `SELECT DISTINCT category FROM products
     WHERE domain = $1 AND is_available = true AND category IS NOT NULL
     ORDER BY category`,
    [domain]
  );
  return result.rows.map(r => r.category);
};

/**
 * Get catalog home items (recent per domain)
 */
export const getCatalogHomeItems = async (domain, limit) => {
  const result = await query(
    `SELECT p.*, vs.name as store_name
     FROM products p
     LEFT JOIN vendor_stores vs ON p.store_id = vs.id
     WHERE p.domain = $1 AND p.is_available = true
     ORDER BY p.created_at DESC
     LIMIT $2`,
    [domain, limit]
  );
  return result.rows;
};

/**
 * Get store by ID with optional type filter
 */
export const getStoreById = async (storeId, storeType = null) => {
  const params = [storeId];
  let where = `WHERE vs.id = $1`;
  if (storeType) {
    params.push(storeType);
    where += ` AND vs.store_type = $2`;
  }
  const result = await query(
    `SELECT vs.*, u.full_name as owner_name, vd.business_name
     FROM vendor_stores vs
     LEFT JOIN users u ON vs.owner_id = u.id
     LEFT JOIN vendor_details vd ON vd.user_id = vs.owner_id
     ${where}`,
    params
  );
  return result.rows[0];
};
