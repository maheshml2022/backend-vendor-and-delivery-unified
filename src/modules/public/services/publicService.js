/**
 * Public Service
 * City discovery, store browsing, public order tracking
 */

import * as vendorStoreRepo from '../../../models/vendorStoreRepository.js';
import { query } from '../../../config/database.js';

export const getActiveCities = async () => {
  return vendorStoreRepo.getActiveCities();
};

export const getStoresByCity = async (city, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const stores = await vendorStoreRepo.getByCity(city);
  // Simple pagination on the result
  return {
    stores: stores.slice(offset, offset + parseInt(limit)),
    total: stores.length,
    page: parseInt(page),
    limit: parseInt(limit)
  };
};

export const getStoreDetail = async (storeId) => {
  const store = await vendorStoreRepo.getById(storeId);
  if (!store) {
    throw Object.assign(new Error('Store not found'), { statusCode: 404 });
  }
  return store;
};

export const trackOrder = async (orderId) => {
  const result = await query(
    `SELECT o.id, o.status, o.total_amount, o.delivery_address,
            o.created_at, o.updated_at,
            da.status AS delivery_status,
            dp.current_latitude, dp.current_longitude
     FROM orders o
     LEFT JOIN delivery_assignments da ON da.order_id = o.id
     LEFT JOIN delivery_partners dp ON dp.id = da.partner_id
     WHERE o.id = $1`,
    [orderId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  return result.rows[0];
};
