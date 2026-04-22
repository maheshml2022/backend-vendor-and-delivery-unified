/**
 * Delivery Auth Controller
 * Handles registration, login (phone+password), and OTP auth
 */

import Joi from 'joi';
import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateDeliveryRegister, validateDeliverySendOtp, validateDeliveryVerifyOtp, validateDeliveryLogin } from '../../../validators/deliveryValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

const forgotPasswordSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^\d{10}$/).required()
});

const resetPasswordSchema = Joi.object({
  mobileNumber: Joi.string().pattern(/^\d{10}$/).required(),
  otpCode: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).required()
});

export const register = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateDeliveryRegister, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.register(value);
  res.status(201).json(successResponse(result, 'Registration successful. Pending admin approval.'));
});

export const login = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateDeliveryLogin, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.login(value.mobileNumber, value.password);
  res.json(successResponse(result, 'Login successful'));
});

export const sendOtp = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateDeliverySendOtp, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.sendOtp(value.mobileNumber);
  res.json(successResponse(result, 'OTP sent'));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateDeliveryVerifyOtp, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.verifyOtp(value.mobileNumber, value.otpCode);
  res.json(successResponse(result, 'Login successful'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  const result = await authService.forgotPassword(value.mobileNumber);
  res.json(successResponse(result, 'OTP sent for password reset'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  await authService.resetPassword(value.mobileNumber, value.otpCode, value.newPassword);
  res.json(successResponse(null, 'Password reset successful'));
});
