/**
 * Vendor Store Controller
 */

import * as storeService from '../services/storeService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateVendorStore, validateVendorStoreUpdate } from '../../../validators/vendorValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getStores = asyncHandler(async (req, res) => {
  const stores = await storeService.getStores(req.user.userId);
  res.json(successResponse(stores));
});

export const createStore = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorStore, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const store = await storeService.createStore(req.user.userId, value);
  res.status(201).json(successResponse(store, 'Store created', 201));
});

export const updateStore = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorStoreUpdate, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const store = await storeService.updateStore(req.params.id, req.user.userId, value);
  res.json(successResponse(store, 'Store updated'));
});

export const updateStoreStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json(errorResponse(null, 400, 'isActive must be true or false'));
  }
  const result = await storeService.updateStoreStatus(req.user.userId, isActive);
  res.json(successResponse(result, `Store is now ${isActive ? 'open' : 'closed'}`));
});
