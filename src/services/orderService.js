/**
 * Order Service
 * Handles order placement and management
 */

import { query, transaction } from '../config/database.js';
import * as cartService from './cartService.js';
import logger from '../utils/logger.js';

/**
 * Generate unique order number
 */
const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

/**
 * Place order
 */
export const placeOrder = async (userId, storeId, addressId, paymentMethod, specialInstructions) => {
  try {
    return await transaction(async (client) => {
      // Look up vendor from store
      const storeResult = await client.query('SELECT vendor_id FROM vendor_stores WHERE id = $1', [storeId]);
      const vendorId = storeResult.rows[0]?.vendor_id || storeId;

      // Get cart items for this vendor
      const cartResult = await client.query(
        `SELECT c.*, p.price, p.discount_percentage
         FROM cart c
         JOIN products p ON c.product_id = p.id
         WHERE c.user_id = $1 AND c.vendor_id = $2`,
        [userId, vendorId]
      );

      if (cartResult.rows.length === 0) {
        throw new Error('No items in cart for this vendor');
      }

      // Calculate totals
      let totalAmount = 0;
      cartResult.rows.forEach(item => {
        const discountedPrice = item.price * (1 - item.discount_percentage / 100);
        totalAmount += discountedPrice * item.quantity;
      });

      // Get store delivery charge (simplified - use 0 for now)
      const deliveryCharge = 0;
      const discountAmount = 0;
      const finalAmount = totalAmount + deliveryCharge - discountAmount;

      // Create order
      const orderNumber = generateOrderNumber();
      const orderResult = await client.query(
        `INSERT INTO orders 
        (order_number, user_id, vendor_id, store_id, address_id, total_amount, 
         delivery_charge, discount_amount, final_amount, payment_method, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
        RETURNING *`,
        [orderNumber, userId, vendorId, storeId, addressId, totalAmount, 
         deliveryCharge, discountAmount, finalAmount, paymentMethod]
      );

      const order = orderResult.rows[0];

      // Insert order items
      for (const cartItem of cartResult.rows) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id, cartItem.product_id, cartItem.quantity, 
           cartItem.price * (1 - cartItem.discount_percentage / 100)]
        );
      }

      // Clear cart items for this vendor
      await client.query(
        'DELETE FROM cart WHERE user_id = $1 AND vendor_id = $2',
        [userId, vendorId]
      );

      return {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount,
        deliveryCharge,
        finalAmount,
        status: order.status
      };
    });
  } catch (error) {
    logger.error('Place order error:', error);
    throw error;
  }
};

/**
 * Get orders
 */
export const getUserOrders = async (userId, page = 1, limit = 20) => {
  try {
    const offset = (page - 1) * limit;
    const result = await query(
      `SELECT id, order_number, vendor_id, store_id, total_amount, final_amount, status, created_at, completed_at
       FROM orders 
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM orders WHERE user_id = $1',
      [userId]
    );

    return {
      orders: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    };
  } catch (error) {
    logger.error('Get user orders error:', error);
    throw error;
  }
};

/**
 * Get order details
 */
export const getOrderDetails = async (orderId, userId) => {
  try {
    const orderResult = await query(
      `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error('Order not found');
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await query(
      `SELECT oi.*, p.name, p.description, p.image_url
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    return {
      ...order,
      items: itemsResult.rows
    };
  } catch (error) {
    logger.error('Get order details error:', error);
    throw error;
  }
};

/**
 * Update order status (admin)
 */
export const updateOrderStatus = async (orderId, status) => {
  try {
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new Error('Invalid order status');
    }

    const completedAt = status === 'delivered' ? new Date() : null;

    const result = await query(
      `UPDATE orders 
       SET status = $1, completed_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, completedAt, orderId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Update order status error:', error);
    throw error;
  }
};

export default {
  placeOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus
};
