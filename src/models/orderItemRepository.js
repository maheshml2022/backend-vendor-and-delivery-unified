/**
 * Cart and Order Repository (combined)
 * Database queries for cart and order items
 */

import { query } from '../config/database.js';

/**
 * Get cart item details
 */
export const getCartItemById = async (cartId) => {
  const result = await query(
    `SELECT c.*, p.price, p.discount_percentage 
     FROM cart c
     JOIN products p ON c.product_id = p.id
     WHERE c.id = $1`,
    [cartId]
  );
  return result.rows[0];
};

/**
 * Get order item details
 */
export const getOrderItem = async (orderItemId) => {
  const result = await query(
    'SELECT * FROM order_items WHERE id = $1',
    [orderItemId]
  );
  return result.rows[0];
};

/**
 * Get order items
 */
export const getOrderItems = async (orderId) => {
  const result = await query(
    `SELECT oi.*, p.name, p.description, p.image_url 
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = $1`,
    [orderId]
  );
  return result.rows;
};

export default {
  getCartItemById,
  getOrderItem,
  getOrderItems
};
