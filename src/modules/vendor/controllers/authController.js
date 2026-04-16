/**
 * Vendor Auth Controller
 * Handles vendor authentication endpoints
 */

import * as authService from '../services/authService.js';
import { sendOTP as coreSendOTP } from '../../../services/authService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import {
  validateVendorRegistration, validateVendorLogin,
  validateForgotPassword, validateResetPassword
} from '../../../validators/vendorValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    return res.status(400).json(errorResponse(null, 400, 'mobileNumber is required'));
  }
  // Reuse admin's OTP sending logic
  const result = await coreSendOTP(mobileNumber);
  res.json(successResponse(result, 'OTP sent successfully'));
});

export const verifyOtpLogin = asyncHandler(async (req, res) => {
  const { mobileNumber, otpCode } = req.body;
  if (!mobileNumber || !otpCode) {
    return res.status(400).json(errorResponse(null, 400, 'mobileNumber and otpCode required'));
  }
  const result = await authService.verifyOTPLogin(mobileNumber, otpCode);
  res.json(successResponse(result, 'Login successful'));
});

export const register = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorRegistration, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.register(value);
  res.status(201).json(successResponse(result, 'Registration successful', 201));
});

export const login = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorLogin, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.login(value.mobileNumber, value.password);
  res.json(successResponse(result, 'Login successful'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateForgotPassword, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const result = await authService.forgotPassword(value.mobileNumber);
  res.json(successResponse(result, 'OTP sent for password reset'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateResetPassword, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  await authService.resetPassword(value.mobileNumber, value.otp, value.newPassword);
  res.json(successResponse(null, 'Password reset successful'));
});
