/**
 * Vendor Product Controller
 */

import * as productService from '../services/productService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateVendorProduct, validateVendorProductUpdate } from '../../../validators/vendorValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getProducts = asyncHandler(async (req, res) => {
  const products = await productService.getProducts(req.user.userId, req.query.store_id);
  res.json(successResponse(products));
});

export const createProduct = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorProduct, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const product = await productService.createProduct(req.user.userId, value);
  res.status(201).json(successResponse(product, 'Product created', 201));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorProductUpdate, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const product = await productService.updateProduct(req.params.id, req.user.userId, value);
  res.json(successResponse(product, 'Product updated'));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.user.userId);
  res.json(successResponse(null, 'Product deleted'));
});

export const addProductImage = asyncHandler(async (req, res) => {
  const { imageUrl, isPrimary } = req.body;
  if (!imageUrl) {
    return res.status(400).json(errorResponse(null, 400, 'imageUrl is required'));
  }
  const image = await productService.addProductImage(req.params.id, req.user.userId, imageUrl, isPrimary);
  res.status(201).json(successResponse(image, 'Image added', 201));
});
