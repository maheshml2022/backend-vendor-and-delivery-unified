/**
 * Delivery Earnings Repository
 * Data access for delivery partner earnings
 */

import { query } from '../config/database.js';

/**
 * Get earnings for a delivery partner
 */
export const getByPartnerId = async (partnerId, startDate = null, endDate = null) => {
  const params = [partnerId];
  let where = `WHERE de.delivery_partner_id = $1`;

  if (startDate) {
    params.push(startDate);
    where += ` AND de.created_at >= $${params.length}`;
  }
  if (endDate) {
    params.push(endDate);
    where += ` AND de.created_at <= $${params.length}`;
  }

  const result = await query(
    `SELECT de.*, o.order_number
     FROM delivery_earnings de
     LEFT JOIN orders o ON de.order_id = o.id
     ${where}
     ORDER BY de.created_at DESC`,
    params
  );
  return result.rows;
};

/**
 * Get earnings summary
 */
export const getSummary = async (partnerId) => {
  const result = await query(
    `SELECT
       COALESCE(SUM(amount), 0) as total_earnings,
       COALESCE(SUM(amount) FILTER (WHERE status = 'settled'), 0) as settled_amount,
       COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
       COUNT(*) as total_deliveries,
       COALESCE(SUM(amount) FILTER (WHERE DATE(created_at) = CURRENT_DATE), 0) as today_earnings
     FROM delivery_earnings
     WHERE delivery_partner_id = $1`,
    [partnerId]
  );
  return result.rows[0];
};

/**
 * Create earning record
 */
export const create = async (partnerId, orderId, amount) => {
  const result = await query(
    `INSERT INTO delivery_earnings (delivery_partner_id, order_id, amount, status)
     VALUES ($1, $2, $3, 'pending') RETURNING *`,
    [partnerId, orderId, amount]
  );
  return result.rows[0];
};
