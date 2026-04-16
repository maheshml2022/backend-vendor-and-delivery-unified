/**
 * Cart Controller
 * Handles shopping cart endpoints
 */

import * as cartService from '../services/cartService.js';
import { validate, validateCartItem } from '../validators/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * POST /api/v1/cart/add
 * Add item to cart
 */
export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { error, value } = validate(validateCartItem, req.body);

  if (error) {
    return res.status(400).json(
      errorResponse(error, 400, 'Validation error')
    );
  }

  const cartItem = await cartService.addToCart(
    userId,
    value.storeId,
    value.menuItemId,
    value.quantity,
    value.specialInstructions
  );

  res.status(201).json(successResponse(cartItem, 'Item added to cart', 201));
});

/**
 * GET /api/v1/cart
 * Get cart items
 */
export const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const cartItems = await cartService.getCartItems(userId);
  const totals = await cartService.calculateCartTotal(userId);

  res.json(successResponse({
    items: cartItems,
    totals
  }, 'Cart retrieved'));
});

/**
 * PUT /api/v1/cart/:cartId
 * Update cart item quantity
 */
export const updateCartItem = asyncHandler(async (req, res) => {
  const { cartId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json(
      errorResponse(null, 400, 'Invalid quantity')
    );
  }

  const cartItem = await cartService.updateCartItemQuantity(parseInt(cartId), quantity);
  res.json(successResponse(cartItem, 'Cart item updated'));
});

/**
 * DELETE /api/v1/cart/:cartId
 * Remove item from cart
 */
export const removeFromCart = asyncHandler(async (req, res) => {
  const { cartId } = req.params;
  await cartService.removeFromCart(parseInt(cartId));
  res.json(successResponse(null, 'Item removed from cart'));
});

/**
 * DELETE /api/v1/cart
 * Clear entire cart
 */
export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  await cartService.clearCart(userId);
  res.json(successResponse(null, 'Cart cleared'));
});

export default {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
