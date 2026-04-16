/**
 * Delivery Module Validators
 * Joi schemas for delivery partner endpoints (future-ready)
 */

import Joi from 'joi';

const phoneSchema = Joi.string()
  .pattern(/^[0-9]{10}$/)
  .required()
  .messages({ 'string.pattern.base': 'Mobile number must be 10 digits' });

// ── Auth ───────────────────────────────────────────────────────────────────────

export const validateDeliverySendOtp = Joi.object({
  mobileNumber: phoneSchema
});

export const validateDeliveryLogin = Joi.object({
  mobileNumber: phoneSchema,
  password: Joi.string().required()
});

export const validateDeliveryVerifyOtp = Joi.object({
  mobileNumber: phoneSchema,
  otpCode: Joi.string().length(6).pattern(/^[0-9]{6}$/).required()
    .messages({ 'string.pattern.base': 'OTP must be 6 digits' })
});

// ── Order Status Update ────────────────────────────────────────────────────────

export const validateDeliveryStatusUpdate = Joi.object({
  status: Joi.string().valid(
    'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'
  ).required(),
  cancellationReason: Joi.string().max(500).optional().allow('')
});

// ── Location Update ────────────────────────────────────────────────────────────

export const validateLocationUpdate = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required()
});
