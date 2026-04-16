/**
 * OTP Utility
 * Generate and validate OTP codes
 */

import logger from './logger.js';

const OTP_LENGTH = parseInt(process.env.OTP_LENGTH) || 6;
const OTP_EXPIRATION = parseInt(process.env.OTP_EXPIRATION) || 5; // minutes
const MAX_OTP_ATTEMPTS = parseInt(process.env.MAX_OTP_ATTEMPTS) || 3;

export { OTP_LENGTH, OTP_EXPIRATION, MAX_OTP_ATTEMPTS };

/**
 * Generate random OTP
 * @returns {string} OTP code
 */
export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString().substring(0, OTP_LENGTH);
  logger.debug('OTP generated:', { length: otp.length });
  return otp;
};

/**
 * Calculate OTP expiration time
 * @returns {Date} Expiration timestamp
 */
export const getOTPExpirationTime = () => {
  const expirationTime = new Date(Date.now() + OTP_EXPIRATION * 60 * 1000);
  return expirationTime;
};

/**
 * Validate OTP format
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
export const isValidOTPFormat = (otp) => {
  const otpRegex = new RegExp(`^\\d{${OTP_LENGTH}}$`);
  return otpRegex.test(otp);
};

/**
 * Check if OTP is expired
 * @param {Date} expirationTime - OTP expiration time
 * @returns {boolean} True if expired
 */
export const isOTPExpired = (expirationTime) => {
  return new Date() > new Date(expirationTime);
};
