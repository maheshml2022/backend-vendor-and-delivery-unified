/**
 * Payment Repository
 * Data access for payment records
 */

import { query } from '../config/database.js';

/**
 * Create payment record
 */
export const create = async (orderId, amount, paymentMethod, status = 'pending') => {
  const result = await query(
    `INSERT INTO payments (order_id, amount, payment_method, status)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [orderId, amount, paymentMethod, status]
  );
  return result.rows[0];
};

/**
 * Get payment by order ID
 */
export const getByOrderId = async (orderId) => {
  const result = await query(
    `SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [orderId]
  );
  return result.rows[0];
};

/**
 * Update payment status
 */
export const updateStatus = async (paymentId, status, transactionId = null) => {
  const result = await query(
    `UPDATE payments SET
       status = $1,
       transaction_id = COALESCE($2, transaction_id),
       updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [status, transactionId, paymentId]
  );
  return result.rows[0];
};
