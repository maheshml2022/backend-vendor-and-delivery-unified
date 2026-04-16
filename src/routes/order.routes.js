/**
 * Order Routes
 * Handles order placement and management
 */

import express from 'express';
import { authenticate } from '../middleware/authentication.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

/**
 * POST /api/v1/orders
 * Place new order
 * Auth required: Yes
 * Body: { storeId: number, deliveryAddressId: number, paymentMethod: string, specialInstructions?: string }
 */
router.post('/', authenticate, orderController.placeOrder);

/**
 * GET /api/v1/orders
 * Get user orders
 * Auth required: Yes
 * Query: { page?: number, limit?: number }
 */
router.get('/', authenticate, orderController.getUserOrders);

/**
 * GET /api/v1/orders/:orderId
 * Get order details
 * Auth required: Yes
 */
router.get('/:orderId', authenticate, orderController.getOrderDetails);

/**
 * PUT /api/v1/orders/:orderId/status
 * Update order status (admin)
 * Auth required: Yes
 * Body: { status: string }
 */
router.put('/:orderId/status', authenticate, orderController.updateOrderStatus);

export default router;
