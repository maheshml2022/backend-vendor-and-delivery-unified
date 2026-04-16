/**
 * JWT Utility
 * Handle JWT token generation and verification
 */

import jwt from 'jsonwebtoken';
import logger from './logger.js';

if (!process.env.JWT_SECRET) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d';

/**
 * Generate JWT token
 * @param {object} payload - Data to encrypt in token
 * @param {string} expiresIn - Token expiration time
 * @returns {string} JWT token
 */
export const generateToken = (payload, expiresIn = JWT_EXPIRATION) => {
  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    return token;
  } catch (error) {
    logger.error('Token generation error:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    logger.error('Token verification error:', error.message);
    throw new Error('Invalid or expired token');
  }
};

/**
 * Refresh JWT token
 * @param {string} token - Existing JWT token
 * @returns {string} New JWT token
 */
export const refreshToken = (token) => {
  try {
    const decoded = verifyToken(token);
    delete decoded.iat;
    delete decoded.exp;
    return generateToken(decoded);
  } catch (error) {
    throw new Error('Failed to refresh token');
  }
};

export { JWT_SECRET, JWT_EXPIRATION };
