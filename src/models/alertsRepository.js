/**
 * Alerts Repository
 * Database queries for system alerts and critical issues
 */

import pool from '../config/database.js';

/**
 * Get failed payments
 * Fetches all orders with failed payment status
 */
export const getFailedPayments = async () => {
  const result = await pool.query(
    `SELECT 
       o.id as order_id,
       o.user_id,
       o.final_amount as amount,
       p.payment_method,
       p.created_at as timestamp,
       p.transaction_id,
       u.mobile_number,
       u.full_name
     FROM orders o
     LEFT JOIN payments p ON o.id = p.order_id
     LEFT JOIN users u ON o.user_id = u.id
     WHERE p.status = 'failed' OR p.status = 'FAILED'
     ORDER BY p.created_at DESC
     LIMIT 100`
  );
  return result.rows;
};

/**
 * Get unassigned orders
 * Fetches orders that are in PLACED or CONFIRMED status but not yet assigned to delivery partner
 */
export const getUnassignedOrders = async () => {
  const result = await pool.query(
    `SELECT 
       o.id as order_id,
       o.store_id,
       o.created_at as order_time,
       o.status,
       u.full_name as customer_name,
       u.mobile_number,
       vs.name as store_name,
       o.final_amount
     FROM orders o
     LEFT JOIN vendor_stores vs ON o.store_id = vs.id
     LEFT JOIN users u ON o.user_id = u.id
     WHERE o.delivery_partner_id IS NULL 
       AND (LOWER(o.status) = 'placed' OR LOWER(o.status) = 'confirmed')
     ORDER BY o.created_at ASC
     LIMIT 100`
  );
  return result.rows;
};

/**
 * Get vendors offline
 * Fetches vendors/stores that are marked as offline (is_active = false)
 */
export const getVendorsOffline = async () => {
  const result = await pool.query(
    `SELECT 
       vs.id as vendor_id,
       vs.name as store_name,
       vs.store_type,
       vs.updated_at as last_active_time,
       vd.vendor_name as vendor_name,
       u.full_name as owner_name,
       u.mobile_number,
       vs.city
     FROM vendor_stores vs
     LEFT JOIN vendor_details vd ON vs.vendor_id = vd.id
     LEFT JOIN users u ON vd.user_id = u.id
     WHERE vs.is_active = FALSE
     ORDER BY vs.updated_at DESC
     LIMIT 100`
  );
  return result.rows;
};

/**
 * Get delivery delays
 * Fetches orders that are in OUT_FOR_DELIVERY status for more than threshold minutes
 * Default threshold: 30 minutes
 */
export const getDeliveryDelays = async (thresholdMinutes = 30) => {
  const result = await pool.query(
    `SELECT 
       o.id as order_id,
       o.delivery_partner_id,
       da.assigned_at,
       EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - da.assigned_at)) / 60 as delay_minutes,
       o.final_amount,
       u.full_name as customer_name,
       u.mobile_number,
       dp.name as delivery_partner_name,
       dp.mobile_number as delivery_partner_mobile,
       vs.name as store_name,
       o.status
     FROM orders o
     LEFT JOIN delivery_assignments da ON o.id = da.order_id
     LEFT JOIN delivery_partners dp ON o.delivery_partner_id = dp.id
     LEFT JOIN vendor_stores vs ON o.store_id = vs.id
     LEFT JOIN users u ON o.user_id = u.id
     WHERE LOWER(o.status) = 'out_for_delivery'
       AND da.assigned_at IS NOT NULL
       AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - da.assigned_at)) / 60 > $1
     ORDER BY delay_minutes DESC
     LIMIT 100`,
    [thresholdMinutes]
  );
  return result.rows;
};

/**
 * Get all alerts summary
 * Returns count of each alert type for dashboard widget
 */
export const getAlertsSummary = async () => {
  const result = await pool.query(
    `SELECT 
       (SELECT COUNT(*) FROM payments WHERE status = 'failed' OR status = 'FAILED') as failed_payments_count,
       (SELECT COUNT(*) FROM orders WHERE delivery_partner_id IS NULL AND (status = 'placed' OR status = 'PLACED' OR status = 'confirmed' OR status = 'CONFIRMED')) as unassigned_orders_count,
       (SELECT COUNT(*) FROM vendor_stores WHERE is_active = FALSE) as vendors_offline_count,
       (SELECT COUNT(*) FROM orders o LEFT JOIN delivery_assignments da ON o.id = da.order_id WHERE (o.status = 'out_for_delivery' OR o.status = 'OUT_FOR_DELIVERY') AND da.assigned_at IS NOT NULL AND EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - da.assigned_at)) / 60 > 30) as delivery_delays_count`
  );
  return result.rows[0];
};

/**
 * Check if order exists and get details
 */
export const getOrderById = async (orderId) => {
  const result = await pool.query(
    `SELECT * FROM orders WHERE id = $1`,
    [orderId]
  );
  return result.rows[0];
};

/**
 * Check if delivery partner exists and is active
 */
export const getDeliveryPartnerById = async (partnerId) => {
  const result = await pool.query(
    `SELECT * FROM delivery_partners WHERE id = $1`,
    [partnerId]
  );
  return result.rows[0];
};

/**
 * Check if delivery assignment already exists
 */
export const getDeliveryAssignmentByOrderId = async (orderId) => {
  const result = await pool.query(
    `SELECT * FROM delivery_assignments WHERE order_id = $1 ORDER BY assigned_at DESC LIMIT 1`,
    [orderId]
  );
  return result.rows[0];
};

/**
 * Create new delivery assignment
 */
export const createDeliveryAssignment = async (orderId, deliveryPartnerId) => {
  const result = await pool.query(
    `INSERT INTO delivery_assignments (order_id, delivery_partner_id, status, assigned_at)
     VALUES ($1, $2, 'assigned', CURRENT_TIMESTAMP)
     RETURNING *`,
    [orderId, deliveryPartnerId]
  );
  return result.rows[0];
};

/**
 * Update order with delivery partner assignment
 */
export const updateOrderDeliveryPartner = async (orderId, deliveryPartnerId) => {
  const result = await pool.query(
    `UPDATE orders 
     SET delivery_partner_id = $1, status = 'assigned', updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING *`,
    [deliveryPartnerId, orderId]
  );
  return result.rows[0];
};

export default {
  getFailedPayments,
  getUnassignedOrders,
  getVendorsOffline,
  getDeliveryDelays,
  getAlertsSummary,
  getOrderById,
  getDeliveryPartnerById,
  getDeliveryAssignmentByOrderId,
  createDeliveryAssignment,
  updateOrderDeliveryPartner
};
