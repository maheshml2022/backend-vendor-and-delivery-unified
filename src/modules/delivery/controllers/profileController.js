/**
 * Delivery Partner Profile Controller
 */

import { query } from '../../../config/database.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';
import Joi from 'joi';

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional().allow('', null),
  vehicleType: Joi.string().optional().allow('', null),
  vehicleNumber: Joi.string().max(20).optional().allow('', null),
  licenseNumber: Joi.string().max(50).optional().allow('', null),
  licenseImageUrl: Joi.string().uri().optional().allow('', null)
});

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await query(
    `SELECT dp.id, dp.name, dp.mobile_number, dp.email,
            dp.vehicle_type, dp.vehicle_number, dp.license_number,
            dp.license_image_url, dp.profile_image_url,
            dp.is_available, dp.status,
            dp.approval_status, dp.rating, dp.total_deliveries,
            u.full_name, u.mobile_number as user_mobile
     FROM delivery_partners dp
     JOIN users u ON dp.user_id = u.id
     WHERE dp.user_id = $1`,
    [userId]
  );

  if (!result.rows[0]) {
    return res.status(404).json(errorResponse(null, 404, 'Profile not found'));
  }

  res.json(successResponse(result.rows[0], 'Profile retrieved'));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json(errorResponse(null, 400, error.details[0].message));

  const result = await query(
    `UPDATE delivery_partners SET
       name           = COALESCE($1, name),
       email          = COALESCE($2, email),
       vehicle_type   = COALESCE($3, vehicle_type),
       vehicle_number = COALESCE($4, vehicle_number),
       license_number = COALESCE($5, license_number),
       license_image_url = COALESCE($6, license_image_url)
     WHERE user_id = $7
     RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number,
               license_number, license_image_url, is_available, status`,
    [value.name || null, value.email || null, value.vehicleType || null,
     value.vehicleNumber || null, value.licenseNumber || null,
     value.licenseImageUrl || null, userId]
  );

  res.json(successResponse(result.rows[0], 'Profile updated'));
});
