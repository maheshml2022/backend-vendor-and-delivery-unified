/**
 * Order Controller
 * Handles order endpoints
 */

import * as orderService from '../services/orderService.js';
import { validate, validateCreateOrder } from '../validators/index.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * POST /api/v1/orders
 * Place a new order
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { error, value } = validate(validateCreateOrder, req.body);

  if (error) {
    return res.status(400).json(
      errorResponse(error, 400, 'Validation error')
    );
  }

  const resolvedStoreId = value.storeId ?? value.restaurantId;

  const order = await orderService.placeOrder(
    userId,
    resolvedStoreId,
    value.deliveryAddressId,
    value.paymentMethod,
    value.specialInstructions
  );

  res.status(201).json(successResponse(order, 'Order placed successfully', 201));
});

/**
 * GET /api/v1/orders
 * Get user orders
 */
export const getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 20 } = req.query;

  const result = await orderService.getUserOrders(
    userId,
    parseInt(page),
    parseInt(limit)
  );

  res.json(paginatedResponse(
    result.orders,
    result.pagination.total,
    result.pagination.page,
    result.pagination.limit,
    'Orders retrieved'
  ));
});

/**
 * GET /api/v1/orders/:orderId
 * Get order details
 */
export const getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.userId;

  const order = await orderService.getOrderDetails(parseInt(orderId), userId);
  res.json(successResponse(order, 'Order details retrieved'));
});

/**
 * PUT /api/v1/orders/:orderId/status
 * Update order status (admin)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json(
      errorResponse(null, 400, 'Status is required')
    );
  }

  const order = await orderService.updateOrderStatus(parseInt(orderId), status);
  res.json(successResponse(order, 'Order status updated'));
});

export default {
  placeOrder,
  getUserOrders,
  getOrderDetails,
  updateOrderStatus
};
