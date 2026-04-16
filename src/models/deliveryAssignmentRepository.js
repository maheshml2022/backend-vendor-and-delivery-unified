/**
 * Delivery Assignment Repository
 * Data access for order-to-delivery-partner assignments
 */

import { query } from '../config/database.js';

/**
 * Get assignments for a delivery partner
 */
export const getByPartnerId = async (partnerId, status = null) => {
  const params = [partnerId];
  let where = `WHERE da.delivery_partner_id = $1`;

  if (status) {
    params.push(status);
    where += ` AND da.status = $${params.length}`;
  }

  const result = await query(
    `SELECT da.*, o.order_number, o.status as order_status,
            o.final_amount, o.payment_method,
            vs.name as store_name, vs.city as store_city,
            u.full_name as customer_name, u.mobile_number as customer_phone
     FROM delivery_assignments da
     JOIN orders o ON da.order_id = o.id
     LEFT JOIN vendor_stores vs ON o.store_id = vs.id
     LEFT JOIN users u ON o.user_id = u.id
     ${where}
     ORDER BY da.assigned_at DESC`,
    params
  );
  return result.rows;
};

/**
 * Get assignment by order ID
 */
export const getByOrderId = async (orderId) => {
  const result = await query(
    `SELECT da.*, dp.name as partner_name, dp.mobile_number as partner_phone
     FROM delivery_assignments da
     LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id
     WHERE da.order_id = $1`,
    [orderId]
  );
  return result.rows[0];
};

/**
 * Create assignment
 */
export const create = async (orderId, partnerId) => {
  const result = await query(
    `INSERT INTO delivery_assignments (order_id, delivery_partner_id, status)
     VALUES ($1, $2, 'assigned') RETURNING *`,
    [orderId, partnerId]
  );
  return result.rows[0];
};

/**
 * Update assignment status
 */
export const updateStatus = async (assignmentId, partnerId, status) => {
  const timestampField = {
    accepted: 'accepted_at',
    picked_up: 'picked_up_at',
    delivered: 'delivered_at'
  }[status];

  let sql = `UPDATE delivery_assignments SET status = $1`;
  if (timestampField) {
    sql += `, ${timestampField} = NOW()`;
  }
  sql += ` WHERE id = $2 AND delivery_partner_id = $3 RETURNING *`;

  const result = await query(sql, [status, assignmentId, partnerId]);
  return result.rows[0];
};

/**
 * Update assignment status with cancellation reason
 */
export const cancel = async (assignmentId, partnerId, reason) => {
  const result = await query(
    `UPDATE delivery_assignments
     SET status = 'cancelled', cancellation_reason = $1
     WHERE id = $2 AND delivery_partner_id = $3 RETURNING *`,
    [reason, assignmentId, partnerId]
  );
  return result.rows[0];
};
