/**
 * Cart Routes
 * Handles shopping cart endpoints
 */

import express from 'express';
import { authenticate } from '../middleware/authentication.js';
import * as cartController from '../controllers/cartController.js';

const router = express.Router();

/**
 * POST /api/v1/cart/add
 * Add item to cart
 * Auth required: Yes
 * Body: { storeId: number, menuItemId: number, quantity: number, specialInstructions?: string }
 */
router.post('/add', authenticate, cartController.addToCart);

/**
 * GET /api/v1/cart
 * Get cart items
 * Auth required: Yes
 */
router.get('/', authenticate, cartController.getCart);

/**
 * PUT /api/v1/cart/:cartId
 * Update cart item quantity
 * Auth required: Yes
 * Body: { quantity: number }
 */
router.put('/:cartId', authenticate, cartController.updateCartItem);

/**
 * DELETE /api/v1/cart/:cartId
 * Remove item from cart
 * Auth required: Yes
 */
router.delete('/:cartId', authenticate, cartController.removeFromCart);

/**
 * DELETE /api/v1/cart
 * Clear entire cart
 * Auth required: Yes
 */
router.delete('/', authenticate, cartController.clearCart);

export default router;
