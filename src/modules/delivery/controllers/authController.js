/**
 * Delivery Auth Controller (Scaffold)
 */

import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateDeliverySendOtp, validateDeliveryVerifyOtp } from '../../../validators/deliveryValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

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
