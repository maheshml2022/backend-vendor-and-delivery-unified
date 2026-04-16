/**
 * Vendor Order Controller
 */

import * as orderService from '../services/orderService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateVendorOrderStatus } from '../../../validators/vendorValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.query;
  const orders = await orderService.getOrders(req.user.userId, { status, page, limit });
  res.json(successResponse(orders));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user.userId);
  res.json(successResponse(order));
});

export const acceptOrder = asyncHandler(async (req, res) => {
  const order = await orderService.acceptOrder(req.params.id, req.user.userId);
  res.json(successResponse(order, 'Order accepted'));
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorOrderStatus, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const order = await orderService.updateOrderStatus(req.params.id, req.user.userId, value.status);
  res.json(successResponse(order, 'Order status updated'));
});
