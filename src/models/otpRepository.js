/**
 * OTP Repository
 * Database queries for OTP management
 */

import { query } from '../config/database.js';

/**
 * Save OTP record
 */
export const saveOTP = async (mobileNumber, otpCode, expiresAt) => {
  // Delete previous OTPs for this mobile number
  await query(
    'DELETE FROM otps WHERE mobile_number = $1',
    [mobileNumber]
  );

  // Insert new OTP
  const result = await query(
    `INSERT INTO otps (mobile_number, otp_code, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, mobile_number, expires_at`,
    [mobileNumber, otpCode, expiresAt]
  );
  return result.rows[0];
};

/**
 * Get latest OTP for mobile number
 */
export const getOTPByMobile = async (mobileNumber) => {
  const result = await query(
    `SELECT * FROM otps WHERE mobile_number = $1 
     ORDER BY created_at DESC LIMIT 1`,
    [mobileNumber]
  );
  return result.rows[0];
};

/**
 * Verify OTP
 */
export const verifyOTP = async (mobileNumber, otpCode) => {
  const result = await query(
    `UPDATE otps 
     SET is_verified = TRUE 
     WHERE mobile_number = $1 AND otp_code = $2 AND expires_at > CURRENT_TIMESTAMP
     RETURNING id`,
    [mobileNumber, otpCode]
  );
  return result.rows[0];
};

/**
 * Increment OTP attempt count
 */
export const incrementOTPAttempt = async (mobileNumber) => {
  const result = await query(
    `UPDATE otps 
     SET attempt_count = attempt_count + 1 
     WHERE id = (SELECT id FROM otps WHERE mobile_number = $1 ORDER BY created_at DESC LIMIT 1)
     RETURNING attempt_count`,
    [mobileNumber]
  );
  return result.rows[0];
};

/**
 * Check if OTP is verified
 */
export const isOTPVerified = async (mobileNumber) => {
  const result = await query(
    `SELECT is_verified FROM otps WHERE mobile_number = $1 
     ORDER BY created_at DESC LIMIT 1`,
    [mobileNumber]
  );
  return result.rows[0]?.is_verified || false;
};

/**
 * Delete expired OTPs
 */
export const deleteExpiredOTPs = async () => {
  const result = await query(
    'DELETE FROM otps WHERE expires_at <= CURRENT_TIMESTAMP'
  );
  return result.rowCount;
};

export default {
  saveOTP,
  getOTPByMobile,
  verifyOTP,
  incrementOTPAttempt,
  isOTPVerified,
  deleteExpiredOTPs
};
