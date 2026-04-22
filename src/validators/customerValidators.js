/**
 * Customer Module Validators
 * Joi schemas for customer-specific endpoints
 */

import Joi from 'joi';

const phoneSchema = Joi.string()
  .pattern(/^[0-9]{10}$/)
  .required()
  .messages({ 'string.pattern.base': 'Mobile number must be 10 digits' });

// ── Auth ───────────────────────────────────────────────────────────────────────

export const validateCustomerLogin = Joi.object({
  mobileNumber: phoneSchema,
  password: Joi.string().required()
});

// ── Address ────────────────────────────────────────────────────────────────────

export const validateCustomerAddress = Joi.object({
  label: Joi.string().max(100).optional(),
  addressLine1: Joi.string().max(255).required(),
  addressLine2: Joi.string().max(255).optional().allow(''),
  city: Joi.string().max(100).required(),
  state: Joi.string().max(100).optional().allow(''),
  postalCode: Joi.string().max(20).optional().allow(''),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  isPrimary: Joi.boolean().optional()
});

export const validateUpdateAddress = Joi.object({
  label: Joi.string().max(100).optional(),
  addressLine1: Joi.string().max(255).optional(),
  addressLine2: Joi.string().max(255).optional().allow(''),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional().allow(''),
  postalCode: Joi.string().max(20).optional().allow(''),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  isPrimary: Joi.boolean().optional()
});

// ── Cart (hybrid: food + catalog) ──────────────────────────────────────────────

export const validateCustomerCartItem = Joi.object({
  menuItemId: Joi.number().optional(),
  storeId: Joi.number().optional(),
  catalogItemId: Joi.number().optional(),
  catalogType: Joi.string().valid('grocery', 'vegetables', 'pharmacy').optional(),
  quantity: Joi.number().min(1).required(),
  specialInstructions: Joi.string().max(500).optional().allow('')
}).custom((value, helpers) => {
  const hasFood = value.menuItemId && value.storeId;
  const hasCatalog = value.catalogItemId && value.catalogType;
  if (!hasFood && !hasCatalog) {
    return helpers.error('any.custom', {
      message: 'Provide either (menuItemId + storeId) or (catalogItemId + catalogType)'
    });
  }
  if (hasFood && hasCatalog) {
    return helpers.error('any.custom', {
      message: 'Cannot mix food and catalog items in a single cart entry'
    });
  }
  return value;
});

// ── Order (unified: food + catalog) ────────────────────────────────────────────

export const validateCustomerOrder = Joi.object({
  catalogType: Joi.string().valid('food', 'grocery', 'vegetables', 'pharmacy').optional(),
  storeId: Joi.number().optional(),
  storeId: Joi.number().optional(),
  deliveryAddressId: Joi.number().optional(),
  address: Joi.object({
    addressLine1: Joi.string().max(255).required(),
    addressLine2: Joi.string().max(255).optional().allow(''),
    city: Joi.string().max(100).required(),
    state: Joi.string().max(100).optional().allow(''),
    postalCode: Joi.string().max(20).optional().allow(''),
    latitude: Joi.number().optional(),
    longitude: Joi.number().optional()
  }).optional(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI').required(),
  specialInstructions: Joi.string().max(1000).optional().allow('')
}).or('deliveryAddressId', 'address');

// ── Menu Item Review ───────────────────────────────────────────────────────────

export const validateMenuItemReview = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000).optional().allow('')
});

// ── Store Review ───────────────────────────────────────────────────────────

export const validateStoreReview = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000).optional().allow('')
});
