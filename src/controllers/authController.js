/**
 * Authentication Controller
 * Handles authentication endpoints
 */

import * as authService from '../services/authService.js';
import { validate, validateSendOTP, validateVerifyOTP, validateUserRegistration, validateLogin, validateChangePassword } from '../validators/index.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to user's mobile number
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateSendOTP, req.body);

  if (error) {
    return res.status(400).json(
      errorResponse(error, 400, 'Validation error')
    );
  }

  const result = await authService.sendOTP(value.mobileNumber);
  res.json(successResponse(result, 'OTP sent successfully'));
});

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and login/register user
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVerifyOTP, req.body);

  if (error) {
    return res.status(400).json(
      errorResponse(error, 400, 'Validation error')
    );
  }

  const result = await authService.verifyOTP(value.mobileNumber, value.otpCode);
  res.json(successResponse(result, 'OTP verified successfully'));
});

/**
 * POST /api/v1/auth/register
 * Register user with password
 */
export const register = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateUserRegistration, req.body);

  if (error) {
    return res.status(400).json(
      errorResponse(error, 400, 'Validation error')
    );
  }

  const result = await authService.registerUser(
    value.mobileNumber,
    value.fullName,
    value.email,
    value.password
  );

  res.status(201).json(successResponse(result, 'Registration successful', 201));
});

/**
 * POST /api/v1/auth/login
 * Login user with username and password
 */
export const login = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateLogin, req.body);

  if (error) {
    return res.status(400).json(
      errorResponse(error, 400, 'Validation error')
    );
  }

  try {
    const result = await authService.loginUser(value.username, value.password);
    res.json(successResponse(result, 'Login successful'));
  } catch (err) {
    return res.status(401).json(
      errorResponse(err, 401, err.message || 'Invalid credentials')
    );
  }
});

/**
 * PUT /api/v1/auth/change-password
 * Change password for logged-in user
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateChangePassword, req.body);

  if (error) {
    return res.status(400).json(
      errorResponse(error, 400, 'Validation error')
    );
  }

  const result = await authService.changePassword(req.user, value.oldPassword, value.newPassword);
  res.json(successResponse(result, 'Password changed successfully'));
});

export default {
  sendOTP,
  verifyOTP,
  register,
  login,
  changePassword
};
