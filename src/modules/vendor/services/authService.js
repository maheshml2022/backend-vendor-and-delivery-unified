/**
 * Vendor Auth Service
 * Business logic for vendor authentication (register, login, password recovery)
 */

import bcryptjs from 'bcryptjs';
import * as userRepo from '../../../models/userRepository.js';
import * as otpRepo from '../../../models/otpRepository.js';
import * as vendorDetailRepo from '../../../models/vendorDetailRepository.js';
import * as vendorStoreRepo from '../../../models/vendorStoreRepository.js';
import { generateOTP, getOTPExpirationTime, isOTPExpired, MAX_OTP_ATTEMPTS } from '../../../utils/otp.js';
import { generateToken } from '../../../utils/jwt.js';
import { query as dbQuery, transaction } from '../../../config/database.js';
import logger from '../../../utils/logger.js';

/**
 * Send OTP for vendor login (requires existing vendor account)
 */
export const sendOTP = async (mobileNumber) => {
  // Verify that vendor account exists
  const result = await dbQuery(
    `SELECT id FROM users WHERE mobile_number = $1 AND role = 'vendor'`,
    [mobileNumber]
  );
  if (result.rows.length === 0) {
    throw Object.assign(new Error('No vendor account found. Please register first.'), { statusCode: 404 });
  }

  const otp = generateOTP();
  const expiresAt = getOTPExpirationTime();
  await otpRepo.saveOTP(mobileNumber, otp, expiresAt);

  logger.info('Vendor OTP generated:', { mobileNumber });
  return {
    expiresAt,
    debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
  };
};

/**
 * Register a new vendor
 */
export const register = async ({ fullName, mobileNumber, email, password, businessName, businessType, city }) => {
  const existing = await userRepo.findUserByMobile(mobileNumber);
  if (existing) throw Object.assign(new Error('Mobile number already registered'), { statusCode: 409 });

  const passwordHash = await bcryptjs.hash(password, 10);

  // Wrap all DB writes in a transaction so partial failure doesn't leave orphan data
  const result = await transaction(async (client) => {
    const userResult = await client.query(
      `INSERT INTO users (mobile_number, email, full_name, password_hash, role, is_verified)
       VALUES ($1, $2, $3, $4, 'vendor', FALSE)
       RETURNING id, mobile_number, email, full_name, created_at`,
      [mobileNumber, email || null, fullName, passwordHash]
    );
    const user = userResult.rows[0];

    // Create vendor details
    const vdResult = await client.query(
      `INSERT INTO vendor_details (user_id, business_name, business_type)
       VALUES ($1, $2, $3) RETURNING *`,
      [user.id, businessName || null, businessType || null]
    );
    const vendorDetail = vdResult.rows[0];

    // Create default store (vendor_id = vendor_details.id, owner_id = users.id)
    await client.query(
      `INSERT INTO vendor_stores
         (vendor_id, owner_id, name, store_type, city, is_active, approval_status)
       VALUES ($1, $2, $3, $4, $5, TRUE, 'pending')`,
      [vendorDetail.id, user.id, businessName || `${fullName}'s Store`, businessType || null, city || '']
    );

    return user;
  });

  const token = generateToken({ userId: result.id, mobile_number: mobileNumber, role: 'vendor' });

  logger.info('Vendor registered:', { userId: result.id, mobileNumber });
  return { token, user: { id: result.id, fullName, mobileNumber, email, role: 'vendor' } };
};

/**
 * Vendor login with mobile + password
 */
export const login = async (mobileNumber, password) => {
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

  const storeResult = await dbQuery(
    `SELECT vs.id FROM vendor_stores vs
     JOIN vendor_details vd ON vd.id = vs.vendor_id
     WHERE vd.user_id = $1 AND vs.approval_status = 'approved' LIMIT 1`,
    [user.id]
  );

  if (storeResult.rows.length === 0) {
    throw Object.assign(
      new Error('Your account is pending admin approval. Please wait for approval.'),
      { statusCode: 403 }
    );
  }

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
  if (otp.attempt_count >= MAX_OTP_ATTEMPTS) {
    throw Object.assign(new Error('Maximum OTP attempts exceeded. Please request a new OTP.'), { statusCode: 429 });
  }
  if (otp.otp_code !== otpCode) {
    await otpRepo.incrementOTPAttempt(mobileNumber);
    throw Object.assign(new Error('Invalid OTP'), { statusCode: 400 });
  }

  await otpRepo.verifyOTP(mobileNumber, otpCode);

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

  const storeResult = await dbQuery(
    `SELECT vs.id FROM vendor_stores vs
     JOIN vendor_details vd ON vd.id = vs.vendor_id
     WHERE vd.user_id = $1 AND vs.approval_status = 'approved' LIMIT 1`,
    [user.id]
  );

  if (storeResult.rows.length === 0) {
    throw Object.assign(
      new Error('Your account is pending admin approval. Please wait for approval.'),
      { statusCode: 403 }
    );
  }

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
 * Forgot password — send OTP
 */
export const forgotPassword = async (mobileNumber) => {
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

  await dbQuery(
    `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE mobile_number = $2 AND role = 'vendor'`,
    [passwordHash, mobileNumber]
  );

  logger.info('Vendor password reset:', { mobileNumber });
};
