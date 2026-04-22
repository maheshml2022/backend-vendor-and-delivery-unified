/**
 * Customer Address Controller
 * Handles address CRUD operations for customers
 */

import * as addressService from '../services/addressService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateCustomerAddress, validateUpdateAddress } from '../../../validators/customerValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getUserAddresses(req.user.userId);
  res.json(successResponse(addresses, 'Addresses retrieved'));
});

export const createAddress = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateCustomerAddress, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }

  const address = await addressService.addAddress(req.user.userId, value);
  res.status(201).json(successResponse(address, 'Address created', 201));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { error, value } = validate(validateUpdateAddress, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }

  const address = await addressService.updateAddress(addressId, req.user.userId, value);
  res.json(successResponse(address, 'Address updated'));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  await addressService.deleteAddress(addressId, req.user.userId);
  res.json(successResponse(null, 'Address deleted'));
});

export const makePrimaryAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  await addressService.setPrimaryAddress(addressId, req.user.userId);
  res.json(successResponse(null, 'Primary address updated'));
});
