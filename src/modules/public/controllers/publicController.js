/**
 * Public Controller
 * No authentication required — city discovery, store browsing, order tracking
 */

import * as publicService from '../services/publicService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getActiveCities = asyncHandler(async (req, res) => {
  const cities = await publicService.getActiveCities();
  res.json(successResponse(cities));
});

export const getStoresByCity = asyncHandler(async (req, res) => {
  const { city } = req.params;
  if (!city) {
    return res.status(400).json(errorResponse(null, 400, 'city parameter is required'));
  }
  const stores = await publicService.getStoresByCity(city, req.query);
  res.json(successResponse(stores));
});

export const getStoreDetail = asyncHandler(async (req, res) => {
  const store = await publicService.getStoreDetail(req.params.id);
  res.json(successResponse(store));
});

export const trackOrder = asyncHandler(async (req, res) => {
  const order = await publicService.trackOrder(req.params.id);
  res.json(successResponse(order));
});
