/**
 * Delivery Partner Auth Service (Scaffold)
 * Future: full OTP / login flow for delivery partners
 */

import * as otpRepo from '../../../models/otpRepository.js';
import * as userRepo from '../../../models/userRepository.js';
import { generateOTP, getOTPExpirationTime } from '../../../utils/otp.js';
import { generateToken } from '../../../utils/jwt.js';
import logger from '../../../utils/logger.js';

export const sendOtp = async (mobileNumber) => {
  const otp = generateOTP();
  const expiresAt = getOTPExpirationTime();

  await otpRepo.saveOTP(mobileNumber, otp, expiresAt);

  logger.info(`Delivery OTP sent to ${mobileNumber}: ${otp}`);
  return { mobileNumber, message: 'OTP sent' };
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
    user = await userRepo.createUser(mobileNumber, null, 'Delivery Partner', null, null);
    // Update role to delivery (createUser defaults to customer)
    const { query } = await import('../../../config/database.js');
    await query(`UPDATE users SET role = 'delivery', is_verified = true WHERE id = $1`, [user.id]);
    user.role = 'delivery';
  }

  const token = generateToken({ userId: user.id, role: user.role, mobileNumber: user.mobile_number });
  return { user, token };
};
