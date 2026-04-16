/**
 * Authentication Middleware
 * Verify JWT token and protect routes
 */

import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Verify JWT token middleware
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        errorResponse(null, 401, 'Missing or invalid authorization header')
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    return res.status(401).json(
      errorResponse(error, 401, 'Authentication failed')
    );
  }
};

/**
 * Optional authentication - don't fail if no token provided
 */
export const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    logger.debug('Optional authentication skipped:', error.message);
    next();
  }
};

export default authenticate;
