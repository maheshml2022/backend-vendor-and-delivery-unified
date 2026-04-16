/**
 * Delivery Assignment Controller (Scaffold)
 */

import * as assignmentService from '../services/assignmentService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateDeliveryStatusUpdate, validateLocationUpdate } from '../../../validators/deliveryValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getAssignedOrders = asyncHandler(async (req, res) => {
  const orders = await assignmentService.getAssignedOrders(req.user.userId);
  res.json(successResponse(orders));
});

export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateDeliveryStatusUpdate, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await assignmentService.updateDeliveryStatus(req.params.id, req.user.userId, value.status);
  res.json(successResponse(result, 'Status updated'));
});

export const updateLocation = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateLocationUpdate, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await assignmentService.updateLocation(req.user.userId, value.latitude, value.longitude);
  res.json(successResponse(result, 'Location updated'));
});

export const toggleAvailability = asyncHandler(async (req, res) => {
  const result = await assignmentService.toggleAvailability(req.user.userId);
  res.json(successResponse(result, 'Availability toggled'));
});

export const getEarnings = asyncHandler(async (req, res) => {
  const earnings = await assignmentService.getEarnings(req.user.userId);
  res.json(successResponse(earnings));
});
