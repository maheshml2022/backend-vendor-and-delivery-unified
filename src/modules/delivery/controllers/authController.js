/**
 * Delivery Auth Controller
 * Handles registration, login (phone+password), and OTP auth
 */

import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateDeliveryRegister, validateDeliverySendOtp, validateDeliveryVerifyOtp, validateDeliveryLogin } from '../../../validators/deliveryValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

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
