/**
 * Delivery Partner Auth Service
 * Handles registration, login (phone+password), and OTP flow
 */

import bcryptjs from 'bcryptjs';
import * as otpRepo from '../../../models/otpRepository.js';
import * as userRepo from '../../../models/userRepository.js';
import { generateOTP, getOTPExpirationTime } from '../../../utils/otp.js';
import { generateToken } from '../../../utils/jwt.js';
import { query } from '../../../config/database.js';
import logger from '../../../utils/logger.js';

const SALT_ROUNDS = 10;

/**
 * Register a new delivery partner (self-registration)
 */
export const register = async ({ name, mobileNumber, password, email, vehicleType, vehicleNumber }) => {
  // Check if mobile number already exists in delivery_partners
  const existing = await query(
    `SELECT id FROM delivery_partners WHERE mobile_number = $1`,
    [mobileNumber]
  );
  if (existing.rows.length > 0) {
    throw Object.assign(new Error('Mobile number already registered as a delivery partner'), { statusCode: 409 });
  }

  // Check if user already exists with this mobile
  let user = await userRepo.findUserByMobile(mobileNumber);

  const passwordHash = await bcryptjs.hash(password, SALT_ROUNDS);

  if (!user) {
    // Create user record with delivery role
    user = await userRepo.createUser(mobileNumber, email || null, name, passwordHash);
    await query(`UPDATE users SET role = 'delivery', is_verified = false WHERE id = $1`, [user.id]);
    user.role = 'delivery';
  } else if (user.role !== 'delivery') {
    throw Object.assign(new Error('This mobile number is registered with a different role'), { statusCode: 409 });
  }

  // Create delivery partner record
  const dpResult = await query(
    `INSERT INTO delivery_partners
     (name, user_id, mobile_number, email, vehicle_type, vehicle_number, password_hash, approval_status, status, is_available, rating, total_deliveries)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', 'active', false, 5.0, 0)
     RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number, approval_status, created_at`,
    [name, user.id, mobileNumber, email || null, vehicleType, vehicleNumber, passwordHash]
  );

  logger.info(`Delivery partner registered: ${mobileNumber} (pending approval)`);
  return {
    partner: dpResult.rows[0],
    message: 'Registration successful. Your account is pending admin approval.'
  };
};

/**
 * Login with phone + password
 */
export const login = async (mobileNumber, password) => {
  // Find delivery partner by mobile
  const dpResult = await query(
    `SELECT dp.*, u.id as uid, u.role, u.full_name, u.password_hash as user_password_hash
     FROM delivery_partners dp
     JOIN users u ON dp.user_id = u.id
     WHERE dp.mobile_number = $1`,
    [mobileNumber]
  );

  if (dpResult.rows.length === 0) {
    throw Object.assign(new Error('Invalid mobile number or password'), { statusCode: 401 });
  }

  const partner = dpResult.rows[0];

  // Verify password (check dp.password_hash first, fallback to user password_hash)
  const storedHash = partner.password_hash || partner.user_password_hash;
  if (!storedHash) {
    throw Object.assign(new Error('Password login not set up. Please use OTP login or register again.'), { statusCode: 401 });
  }

  const isValidPassword = await bcryptjs.compare(password, storedHash);
  if (!isValidPassword) {
    throw Object.assign(new Error('Invalid mobile number or password'), { statusCode: 401 });
  }

  // Check approval status
  const approvalStatus = partner.approval_status || 'pending';
  if (approvalStatus === 'pending') {
    throw Object.assign(new Error('Your account is pending admin approval. Please wait for approval.'), { statusCode: 403 });
  }
  if (approvalStatus === 'rejected') {
    throw Object.assign(new Error('Your registration has been rejected. Please contact support.'), { statusCode: 403 });
  }

  const token = generateToken({
    userId: partner.uid,
    role: partner.role,
    mobileNumber: partner.mobile_number
  });

  return {
    token,
    user: {
      userId: partner.uid,
      name: partner.name,
      mobileNumber: partner.mobile_number,
      role: partner.role,
      vehicleType: partner.vehicle_type,
      isAvailable: partner.is_available,
      approvalStatus: approvalStatus
    }
  };
};

export const sendOtp = async (mobileNumber) => {
  const otp = generateOTP();
  const expiresAt = getOTPExpirationTime();

  await otpRepo.saveOTP(mobileNumber, otp, expiresAt);

  logger.info(`Delivery OTP sent to ${mobileNumber}: ${otp}`);
  return { mobileNumber, message: 'OTP sent', expiresIn: '10 minutes' };
};

export const verifyOtp = async (mobileNumber, otpCode) => {
  const verified = await otpRepo.verifyOTP(mobileNumber, otpCode);

  if (!verified) {
    throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 400 });
  }

  // Check if delivery partner user exists
  let user = await userRepo.findUserByMobile(mobileNumber);

  if (!user) {
    // Auto-create delivery partner user with role 'delivery'
    user = await userRepo.createUser(mobileNumber, null, 'Delivery Partner', null);
    await query(`UPDATE users SET role = 'delivery', is_verified = true WHERE id = $1`, [user.id]);
    user.role = 'delivery';
  }

  // Check delivery partner approval status
  const dpResult = await query(
    `SELECT approval_status FROM delivery_partners WHERE user_id = $1`,
    [user.id]
  );

  if (dpResult.rows.length > 0) {
    const approvalStatus = dpResult.rows[0].approval_status || 'pending';
    if (approvalStatus === 'pending') {
      throw Object.assign(new Error('Your account is pending admin approval. Please wait for approval.'), { statusCode: 403 });
    }
    if (approvalStatus === 'rejected') {
      throw Object.assign(new Error('Your registration has been rejected. Please contact support.'), { statusCode: 403 });
    }
  }

  const token = generateToken({ userId: user.id, role: user.role, mobileNumber: user.mobile_number });
  return { user, token };
};
