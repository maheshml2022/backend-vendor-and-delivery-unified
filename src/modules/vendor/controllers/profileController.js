/**
 * Vendor Profile Controller
 */

import * as profileService from '../services/profileService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateVendorProfile } from '../../../validators/vendorValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.getProfile(req.user.userId);
  res.json(successResponse(profile));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateVendorProfile, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const profile = await profileService.updateProfile(req.user.userId, value);
  res.json(successResponse(profile, 'Profile updated'));
});
