/**
 * Vendor Profile Service
 * Business logic for vendor profile management
 */

import * as vendorDetailRepo from '../../../models/vendorDetailRepository.js';
import * as vendorStoreRepo from '../../../models/vendorStoreRepository.js';
import { query } from '../../../config/database.js';
import logger from '../../../utils/logger.js';

/**
 * Get full vendor profile (user + vendor_details + store)
 */
export const getProfile = async (userId) => {
  const result = await query(
    `SELECT u.id, u.full_name, u.mobile_number, u.email, u.profile_image_url,
            u.status, u.is_verified, u.last_login,
            vd.business_name, vd.business_type, vd.gst_number,
            vd.pan_number, vd.bank_account_number, vd.ifsc_code,
            vd.is_verified as vendor_verified,
            vs.city, vs.is_active as store_is_active,
            vs.opening_time, vs.closing_time
     FROM users u
     LEFT JOIN vendor_details vd ON vd.user_id = u.id
     LEFT JOIN vendor_stores vs ON vs.vendor_id = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Vendor not found'), { statusCode: 404 });
  }

  return formatProfile(result.rows[0]);
};

/**
 * Update vendor profile
 */
export const updateProfile = async (userId, data) => {
  // Update user table
  await query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       email = COALESCE($2, email),
       profile_image_url = COALESCE($3, profile_image_url),
       updated_at = NOW()
     WHERE id = $4`,
    [data.fullName, data.email, data.profileImageUrl, userId]
  );

  // Upsert vendor details
  await vendorDetailRepo.upsert(userId, data);

  // Update store city/times if provided
  if (data.city || data.openingTime !== undefined || data.closingTime !== undefined) {
    await vendorStoreRepo.updateCityAndTimes(userId, data.city, data.openingTime, data.closingTime);
  }

  return await getProfile(userId);
};

const formatProfile = (u) => ({
  id: u.id,
  fullName: u.full_name,
  mobileNumber: u.mobile_number,
  email: u.email,
  profileImageUrl: u.profile_image_url,
  status: u.status,
  isActive: u.store_is_active !== undefined ? u.store_is_active : true,
  isVerified: u.is_verified,
  businessName: u.business_name,
  businessType: u.business_type,
  city: u.city || null,
  openingTime: u.opening_time || null,
  closingTime: u.closing_time || null,
  gstNumber: u.gst_number,
  panNumber: u.pan_number,
  bankAccountNumber: u.bank_account_number,
  ifscCode: u.ifsc_code,
  vendorVerified: u.vendor_verified
});
