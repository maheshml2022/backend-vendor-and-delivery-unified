/**
 * Vendor Module Validators
 * Joi schemas for vendor-specific endpoints
 */

import Joi from 'joi';

const phoneSchema = Joi.string()
  .pattern(/^[0-9]{10}$/)
  .required()
  .messages({ 'string.pattern.base': 'Mobile number must be 10 digits' });

// ── Registration ───────────────────────────────────────────────────────────────

export const validateVendorRegistration = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  mobileNumber: phoneSchema,
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).required(),
  businessName: Joi.string().max(255).optional(),
  businessType: Joi.string().max(50).optional(),
  city: Joi.string().min(2).max(100).required()
});

export const validateVendorLogin = Joi.object({
  mobileNumber: phoneSchema,
  password: Joi.string().required()
});

export const validateForgotPassword = Joi.object({
  mobileNumber: phoneSchema
});

export const validateResetPassword = Joi.object({
  mobileNumber: phoneSchema,
  otp: Joi.string().length(6).pattern(/^[0-9]{6}$/).required(),
  newPassword: Joi.string().min(6).required()
});

// ── Profile ────────────────────────────────────────────────────────────────────

export const validateVendorProfile = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  profileImageUrl: Joi.string().uri().optional().allow(''),
  businessName: Joi.string().max(255).optional(),
  businessType: Joi.string().max(50).optional(),
  city: Joi.string().max(100).optional(),
  openingTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().allow(''),
  closingTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().allow(''),
  gstNumber: Joi.string().max(50).optional().allow(''),
  panNumber: Joi.string().max(50).optional().allow(''),
  bankAccountNumber: Joi.string().max(50).optional().allow(''),
  ifscCode: Joi.string().max(20).optional().allow('')
});

// ── Store ──────────────────────────────────────────────────────────────────────

export const validateVendorStore = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  storeType: Joi.string().max(100).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  logoUrl: Joi.string().uri().optional().allow(''),
  bannerUrl: Joi.string().uri().optional().allow(''),
  deliveryTime: Joi.number().integer().optional(),
  deliveryCharge: Joi.number().min(0).optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional()
});

export const validateVendorStoreUpdate = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  storeType: Joi.string().max(100).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  logoUrl: Joi.string().uri().optional().allow(''),
  bannerUrl: Joi.string().uri().optional().allow(''),
  deliveryTime: Joi.number().integer().optional(),
  deliveryCharge: Joi.number().min(0).optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  isActive: Joi.boolean().optional()
});

// ── Product ────────────────────────────────────────────────────────────────────

export const validateVendorProduct = Joi.object({
  storeId: Joi.number().optional(),
  name: Joi.string().min(2).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  category: Joi.string().max(100).required(),
  price: Joi.number().positive().required(),
  originalPrice: Joi.number().positive().optional(),
  imageUrl: Joi.string().uri().optional().allow(''),
  thumbnailUrl: Joi.string().uri().optional().allow(''),
  isVegetarian: Joi.boolean().optional(),
  discountPercentage: Joi.number().min(0).max(100).optional(),
  requiresPrescription: Joi.boolean().optional(),
  stockQuantity: Joi.number().integer().min(0).optional()
});

export const validateVendorProductUpdate = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  category: Joi.string().max(100).optional(),
  price: Joi.number().positive().optional(),
  originalPrice: Joi.number().positive().optional(),
  imageUrl: Joi.string().uri().optional().allow(''),
  thumbnailUrl: Joi.string().uri().optional().allow(''),
  isVegetarian: Joi.boolean().optional(),
  discountPercentage: Joi.number().min(0).max(100).optional(),
  requiresPrescription: Joi.boolean().optional(),
  isAvailable: Joi.boolean().optional(),
  stockQuantity: Joi.number().integer().min(0).optional()
});

// ── Order Status ───────────────────────────────────────────────────────────────

export const validateVendorOrderStatus = Joi.object({
  status: Joi.string().valid(
    'pending', 'accepted', 'preparing', 'ready',
    'out_for_delivery', 'delivered', 'cancelled', 'rejected'
  ).required()
});

// ── Review Reply ───────────────────────────────────────────────────────────────

export const validateReviewReply = Joi.object({
  reply: Joi.string().min(1).max(2000).required()
});
