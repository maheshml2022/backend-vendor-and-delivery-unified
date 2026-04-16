/**
 * Vendor Order Service
 * Business logic for vendor-side order management
 */

import { query } from '../../../config/database.js';
import logger from '../../../utils/logger.js';

const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];

export const getOrders = async (vendorId, status = null, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const params = [vendorId];
  let where = `WHERE o.vendor_id = $1`;

  if (status) {
    params.push(status);
    where += ` AND o.status = $${params.length}`;
  }

  const result = await query(
    `SELECT o.*,
       u.full_name as customer_name, u.mobile_number as customer_phone,
       vs.name as store_name,
       json_agg(
         json_build_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)
       ) FILTER (WHERE oi.id IS NOT NULL) as items
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN vendor_stores vs ON o.store_id = vs.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     ${where}
     GROUP BY o.id, u.full_name, u.mobile_number, vs.name
     ORDER BY o.created_at DESC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );

  return result.rows.map(formatOrder);
};

export const getOrderById = async (orderId, vendorId) => {
  const result = await query(
    `SELECT o.*,
       u.full_name as customer_name, u.mobile_number as customer_phone,
       vs.name as store_name,
       a.address_line1, a.address_line2, a.city as delivery_city,
       json_agg(
         json_build_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)
       ) FILTER (WHERE oi.id IS NOT NULL) as items
     FROM orders o
     LEFT JOIN users u ON o.user_id = u.id
     LEFT JOIN vendor_stores vs ON o.store_id = vs.id
     LEFT JOIN addresses a ON o.delivery_address_id = a.id
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.id = $1 AND o.vendor_id = $2
     GROUP BY o.id, u.full_name, u.mobile_number, vs.name, a.address_line1, a.address_line2, a.city`,
    [orderId, vendorId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }
  return formatOrder(result.rows[0]);
};

export const acceptOrder = async (orderId, vendorId) => {
  const result = await query(
    `UPDATE orders SET status = 'accepted', updated_at = NOW()
     WHERE id = $1 AND vendor_id = $2 AND status = 'pending' RETURNING *`,
    [orderId, vendorId]
  );
  if (result.rows.length === 0) {
    throw Object.assign(new Error('Order not found or already processed'), { statusCode: 404 });
  }
  return await getOrderById(orderId, vendorId);
};

export const updateOrderStatus = async (orderId, vendorId, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw Object.assign(new Error(`Status must be one of: ${VALID_STATUSES.join(', ')}`), { statusCode: 400 });
  }

  const result = await query(
    `UPDATE orders SET status = $1, updated_at = NOW()
     WHERE id = $2 AND vendor_id = $3 RETURNING *`,
    [status, orderId, vendorId]
  );
  if (result.rows.length === 0) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  if (status === 'delivered') {
    await query(`UPDATE orders SET completed_at = NOW() WHERE id = $1`, [orderId]);
  }

  return await getOrderById(orderId, vendorId);
};

const formatOrder = (o) => ({
  id: o.id,
  orderNumber: o.order_number,
  userId: o.user_id,
  vendorId: o.vendor_id,
  storeId: o.store_id,
  storeName: o.store_name || null,
  customerName: o.customer_name || null,
  customerPhone: o.customer_phone || null,
  status: o.status,
  totalAmount: parseFloat(o.total_amount) || 0,
  deliveryCharge: parseFloat(o.delivery_charge) || 0,
  discountAmount: parseFloat(o.discount_amount) || 0,
  finalAmount: parseFloat(o.final_amount) || 0,
  paymentMethod: o.payment_method,
  items: o.items || [],
  createdAt: o.created_at,
  updatedAt: o.updated_at,
  completedAt: o.completed_at
});
