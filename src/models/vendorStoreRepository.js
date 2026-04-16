/**
 * Vendor Store Repository
 * Data access for vendor store management
 */

import { query } from '../config/database.js';

/**
 * Get stores by vendor ID
 */
export const getByVendorId = async (vendorId) => {
  const result = await query(
    `SELECT * FROM vendor_stores WHERE vendor_id = $1 ORDER BY created_at DESC`,
    [vendorId]
  );
  return result.rows;
};

/**
 * Get single store by ID (vendor-scoped)
 */
export const getById = async (storeId, vendorId = null) => {
  const params = [storeId];
  let where = `WHERE id = $1`;
  if (vendorId) {
    params.push(vendorId);
    where += ` AND vendor_id = $2`;
  }
  const result = await query(`SELECT * FROM vendor_stores ${where}`, params);
  return result.rows[0];
};

/**
 * Create a store
 */
export const create = async (vendorId, data) => {
  const result = await query(
    `INSERT INTO vendor_stores
       (vendor_id, owner_id, name, store_type, city, description, logo_url, banner_url,
        delivery_time, delivery_charge, latitude, longitude, is_active, approval_status)
     VALUES ($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'pending')
     RETURNING *`,
    [
      vendorId, data.name, data.storeType || null, data.city || '',
      data.description || null, data.logoUrl || null, data.bannerUrl || null,
      data.deliveryTime || null, data.deliveryCharge || null,
      data.latitude || null, data.longitude || null, true
    ]
  );
  return result.rows[0];
};

/**
 * Update a store (vendor-scoped)
 */
export const update = async (storeId, vendorId, data) => {
  const result = await query(
    `UPDATE vendor_stores SET
       name            = COALESCE($1, name),
       store_type      = COALESCE($2, store_type),
       description     = COALESCE($3, description),
       logo_url        = COALESCE($4, logo_url),
       banner_url      = COALESCE($5, banner_url),
       delivery_time   = COALESCE($6, delivery_time),
       delivery_charge = COALESCE($7, delivery_charge),
       latitude        = COALESCE($8, latitude),
       longitude       = COALESCE($9, longitude),
       is_active       = COALESCE($10, is_active),
       updated_at      = NOW()
     WHERE id = $11 AND vendor_id = $12
     RETURNING *`,
    [
      data.name, data.storeType, data.description, data.logoUrl,
      data.bannerUrl, data.deliveryTime, data.deliveryCharge,
      data.latitude, data.longitude, data.isActive,
      storeId, vendorId
    ]
  );
  return result.rows[0];
};

/**
 * Update store status
 */
export const updateStatus = async (vendorId, isActive) => {
  let result = await query(
    `UPDATE vendor_stores SET is_active = $1, updated_at = NOW()
     WHERE vendor_id = $2 RETURNING id, is_active`,
    [isActive, vendorId]
  );
  return result.rows[0];
};

/**
 * Update store city and times
 */
export const updateCityAndTimes = async (vendorId, city, openingTime, closingTime) => {
  await query(
    `UPDATE vendor_stores SET
       city         = COALESCE($1, city),
       opening_time = COALESCE($2, opening_time),
       closing_time = COALESCE($3, closing_time),
       updated_at   = NOW()
     WHERE vendor_id = $4`,
    [city || null, openingTime || null, closingTime || null, vendorId]
  );
};

/**
 * Get stores by city (public discovery)
 */
export const getByCity = async (city, storeType, search, limit, offset) => {
  const params = [city.trim()];
  let filters = `WHERE vs.city ILIKE $1 AND vs.is_active = true`;

  if (storeType) {
    params.push(storeType.trim());
    filters += ` AND vs.store_type ILIKE $${params.length}`;
  }
  if (search) {
    params.push(`%${search.trim()}%`);
    filters += ` AND (vs.name ILIKE $${params.length} OR vd.business_name ILIKE $${params.length})`;
  }

  const countResult = await query(
    `SELECT COUNT(*)
     FROM vendor_stores vs
     JOIN users u ON vs.vendor_id = u.id
     LEFT JOIN vendor_details vd ON vd.user_id = u.id
     ${filters}`,
    params
  );

  const result = await query(
    `SELECT vs.*, u.full_name as owner_name, vd.business_name, vd.business_type
     FROM vendor_stores vs
     JOIN users u ON vs.vendor_id = u.id
     LEFT JOIN vendor_details vd ON vd.user_id = u.id
     ${filters}
     ORDER BY vs.rating DESC, vs.name ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return { stores: result.rows, total: parseInt(countResult.rows[0].count) };
};

/**
 * Get all active cities
 */
export const getActiveCities = async () => {
  const result = await query(`
    SELECT vs.city, COUNT(DISTINCT vs.id) AS store_count
    FROM vendor_stores vs
    JOIN users u ON vs.vendor_id = u.id
    WHERE vs.city <> '' AND vs.is_active = true AND u.is_active = true
    GROUP BY vs.city
    HAVING COUNT(DISTINCT vs.id) > 0
    ORDER BY store_count DESC
  `);
  return result.rows;
};
