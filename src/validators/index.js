/**
 * Validation Schemas
 * Input validation using Joi
 */

import Joi from 'joi';

// Phone number validation
const phoneSchema = Joi.string()
  .pattern(/^[0-9]{10}$/)
  .required()
  .messages({
    'string.pattern.base': 'Mobile number must be 10 digits'
  });

// Auth Schemas
export const validateSendOTP = Joi.object({
  mobileNumber: phoneSchema
});

export const validateVerifyOTP = Joi.object({
  mobileNumber: phoneSchema,
  otpCode: Joi.string()
    .length(6)
    .pattern(/^[0-9]{6}$/)
    .required()
    .messages({
      'string.pattern.base': 'OTP must be 6 digits'
    })
});

export const validateUserRegistration = Joi.object({
  mobileNumber: phoneSchema,
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().optional(),
  password: Joi.string()
    .min(6)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number'
    })
});

export const validateLogin = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

export const validateChangePassword = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(6)
    .required()
});

// Store Schemas
export const validateStore = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().optional(),
  cuisineType: Joi.string().optional(),
  city: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'City is required',
    'any.required': 'City is required'
  }),
  deliveryTime: Joi.number().optional(),
  deliveryCharge: Joi.number().optional(),
  logoUrl: Joi.string().uri().optional(),
  bannerUrl: Joi.string().uri().optional(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  openingTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Opening time must be in HH:MM format (24-hour)'
  }),
  closingTime: Joi.string().pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
    'string.pattern.base': 'Closing time must be in HH:MM format (24-hour)'
  }),
  ownerName: Joi.string().min(2).max(100).required(),
  ownerPhone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    'string.pattern.base': 'Owner phone must be 10 digits'
  })
});

// Menu Item Schemas
export const validateMenuItem = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().optional(),
  category: Joi.string().required(),
  price: Joi.number().positive().required(),
  discountPercentage: Joi.number().min(0).max(100).optional(),
  isVegetarian: Joi.boolean().optional(),
  preparationTime: Joi.number().optional()
});

// Cart Schemas
export const validateCartItem = Joi.object({
  menuItemId: Joi.number().required(),
  storeId: Joi.number().required(),
  quantity: Joi.number().min(1).required(),
  specialInstructions: Joi.string().optional()
});

// Order Schemas
export const validateCreateOrder = Joi.object({
  storeId: Joi.number().required(),
  deliveryAddressId: Joi.number().required(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'UPI').required(),
  specialInstructions: Joi.string().optional()
});

// Address Schemas
export const validateAddress = Joi.object({
  addressLine1: Joi.string().max(255).required(),
  addressLine2: Joi.string().max(255).optional(),
  city: Joi.string().required(),
  postalCode: Joi.string().required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  isPrimary: Joi.boolean().optional()
});

// Delivery Partner Schemas
export const validateDeliveryPartner = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  mobile_number: phoneSchema,
  email: Joi.string().email().optional(),
  vehicle_type: Joi.string().valid('bike', 'scooter', 'car', 'truck').required(),
  vehicle_number: Joi.string().min(3).max(20).required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional()
});

/**
 * Validate request data
 * @param {object} schema - Joi schema
 * @param {object} data - Data to validate
 * @returns {object} { error, value }
 */
export const validate = (schema, data) => {
  return schema.validate(data, { abortEarly: false });
};
