/**
 * Vendor Auth Service
 * Business logic for vendor authentication (register, login, password recovery)
 */

import bcryptjs from 'bcryptjs';
import * as userRepo from '../../../models/userRepository.js';
import * as otpRepo from '../../../models/otpRepository.js';
import * as vendorDetailRepo from '../../../models/vendorDetailRepository.js';
import * as vendorStoreRepo from '../../../models/vendorStoreRepository.js';
import { generateOTP, getOTPExpirationTime, isOTPExpired } from '../../../utils/otp.js';
import { generateToken } from '../../../utils/jwt.js';
import logger from '../../../utils/logger.js';

/**
 * Register a new vendor
 */
export const register = async ({ fullName, mobileNumber, email, password, businessName, businessType, city }) => {
  const existing = await userRepo.findUserByMobile(mobileNumber);
  if (existing) throw Object.assign(new Error('Mobile number already registered'), { statusCode: 409 });

  const passwordHash = await bcryptjs.hash(password, 10);
  const user = await userRepo.createUser(mobileNumber, email || null, fullName, passwordHash, null);

  // Set user role to vendor
  const { query: dbQuery } = await import('../../../config/database.js');
  await dbQuery(`UPDATE users SET role = 'vendor' WHERE id = $1`, [user.id]);

  // Create vendor details
  await vendorDetailRepo.create(user.id, { businessName, businessType });

  // Create default store
  await vendorStoreRepo.create(user.id, {
    name: businessName || `${fullName}'s Store`,
    storeType: businessType || null,
    city
  });

  const token = generateToken({ userId: user.id, mobile_number: mobileNumber, role: 'vendor' });

  logger.info('Vendor registered:', { userId: user.id, mobileNumber });
  return { token, user: { id: user.id, fullName, mobileNumber, email, role: 'vendor' } };
};

/**
 * Vendor login with mobile + password
 */
export const login = async (mobileNumber, password) => {
  const { query: dbQuery } = await import('../../../config/database.js');
  const result = await dbQuery(
    `SELECT u.*, vd.business_name, vd.business_type
     FROM users u
     LEFT JOIN vendor_details vd ON vd.user_id = u.id
     WHERE u.mobile_number = $1 AND u.role = 'vendor'`,
    [mobileNumber]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  }

  const user = result.rows[0];
  const isMatch = await bcryptjs.compare(password, user.password_hash);
  if (!isMatch) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });

  await dbQuery(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);

  const token = generateToken({ userId: user.id, mobile_number: user.mobile_number, role: 'vendor' });
  return {
    token,
    user: {
      id: user.id, fullName: user.full_name, mobileNumber: user.mobile_number,
      email: user.email, role: user.role, businessName: user.business_name,
      businessType: user.business_type
    }
  };
};

/**
 * Vendor OTP login
 */
export const verifyOTPLogin = async (mobileNumber, otpCode) => {
  const otp = await otpRepo.getOTPByMobile(mobileNumber);
  if (!otp || otp.is_verified || isOTPExpired(otp.expires_at)) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
  }
  if (otp.otp_code !== otpCode) {
    await otpRepo.incrementOTPAttempt(mobileNumber);
    throw Object.assign(new Error('Invalid OTP'), { statusCode: 400 });
  }

  await otpRepo.verifyOTP(mobileNumber, otpCode);

  const { query: dbQuery } = await import('../../../config/database.js');
  const result = await dbQuery(
    `SELECT u.*, vd.business_name, vd.business_type
     FROM users u LEFT JOIN vendor_details vd ON vd.user_id = u.id
     WHERE u.mobile_number = $1 AND u.role = 'vendor'`,
    [mobileNumber]
  );

  if (result.rows.length === 0) {
    throw Object.assign(new Error('No vendor account found. Please register first.'), { statusCode: 404 });
  }

  const user = result.rows[0];
  await dbQuery(`UPDATE users SET last_login = NOW() WHERE id = $1`, [user.id]);
  const token = generateToken({ userId: user.id, mobile_number: user.mobile_number, role: 'vendor' });

  return {
    token,
    user: {
      id: user.id, fullName: user.full_name, mobileNumber: user.mobile_number,
      email: user.email, role: user.role, businessName: user.business_name
    }
  };
};

/**
 * Forgot password — send OTP
 */
export const forgotPassword = async (mobileNumber) => {
  const { query: dbQuery } = await import('../../../config/database.js');
  const result = await dbQuery(
    `SELECT id FROM users WHERE mobile_number = $1 AND role = 'vendor'`,
    [mobileNumber]
  );
  if (result.rows.length === 0) {
    throw Object.assign(new Error('No vendor account found'), { statusCode: 404 });
  }

  const otp = generateOTP();
  const expiresAt = getOTPExpirationTime();
  await otpRepo.saveOTP(mobileNumber, otp, expiresAt);

  logger.info('Vendor reset OTP generated:', { mobileNumber });
  return {
    expiresAt,
    debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
  };
};

/**
 * Reset password using OTP
 */
export const resetPassword = async (mobileNumber, otpCode, newPassword) => {
  const otp = await otpRepo.getOTPByMobile(mobileNumber);
  if (!otp || otp.is_verified || isOTPExpired(otp.expires_at) || otp.otp_code !== otpCode) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
  }

  await otpRepo.verifyOTP(mobileNumber, otpCode);
  const passwordHash = await bcryptjs.hash(newPassword, 10);

  const { query: dbQuery } = await import('../../../config/database.js');
  await dbQuery(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE mobile_number = $2`,
    [passwordHash, mobileNumber]
  );

  logger.info('Vendor password reset:', { mobileNumber });
};
