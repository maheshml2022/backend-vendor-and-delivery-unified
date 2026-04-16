/**
 * Cart Service
 * Handles shopping cart operations
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Add item to cart
 */
export const addToCart = async (userId, productId, vendorId, quantity, specialInstructions) => {
  try {
    const result = await query(
      `INSERT INTO cart (user_id, product_id, vendor_id, quantity, special_instructions)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, productId, vendorId, quantity, specialInstructions || null]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Add to cart error:', error);
    throw error;
  }
};

/**
 * Get cart items
 */
export const getCartItems = async (userId) => {
  try {
    const result = await query(
      `SELECT c.*, p.name, p.price, p.discount_percentage, vs.name as store_name,
              (p.price * (1 - p.discount_percentage/100)) as discounted_price
       FROM cart c
       JOIN products p ON c.product_id = p.id
       JOIN vendor_details vd ON c.vendor_id = vd.id
       LEFT JOIN vendor_stores vs ON p.store_id = vs.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    logger.error('Get cart items error:', error);
    throw error;
  }
};

/**
 * Update cart item quantity
 */
export const updateCartItemQuantity = async (cartId, quantity) => {
  try {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      return await removeFromCart(cartId);
    }

    const result = await query(
      `UPDATE cart SET quantity = $1
       WHERE id = $2 RETURNING *`,
      [quantity, cartId]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Update cart item quantity error:', error);
    throw error;
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (cartId) => {
  try {
    const result = await query(
      'DELETE FROM cart WHERE id = $1 RETURNING id',
      [cartId]
    );
    return result.rows[0];
  } catch (error) {
    logger.error('Remove from cart error:', error);
    throw error;
  }
};

/**
 * Clear cart
 */
export const clearCart = async (userId) => {
  try {
    const result = await query(
      'DELETE FROM cart WHERE user_id = $1',
      [userId]
    );
    return result.rowCount;
  } catch (error) {
    logger.error('Clear cart error:', error);
    throw error;
  }
};

/**
 * Calculate cart total
 */
export const calculateCartTotal = async (userId) => {
  try {
    const result = await query(
      `SELECT 
        SUM(p.price * (1 - p.discount_percentage/100) * c.quantity) as subtotal,
        COUNT(DISTINCT c.vendor_id) as vendor_count
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = $1`,
      [userId]
    );
    
    const cartTotal = result.rows[0];
    return {
      subtotal: parseFloat(cartTotal.subtotal) || 0,
      vendorCount: parseInt(cartTotal.vendor_count) || 0
    };
  } catch (error) {
    logger.error('Calculate cart total error:', error);
    throw error;
  }
};

export default {
  addToCart,
  getCartItems,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  calculateCartTotal
};
