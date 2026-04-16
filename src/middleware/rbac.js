/**
 * Role-Based Access Control (RBAC) Middleware
 * Extends the base authentication middleware with role enforcement
 * Supports: admin, customer, vendor, delivery
 */

import { errorResponse } from '../utils/response.js';
import logger from '../utils/logger.js';

/**
 * Require specific role(s) — must be used AFTER authenticate middleware
 * @param  {...string} roles - Allowed roles
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(
      errorResponse(null, 401, 'Authentication required')
    );
  }

  if (!roles.includes(req.user.role)) {
    logger.warn('Access denied:', { userId: req.user.userId, role: req.user.role, required: roles });
    return res.status(403).json(
      errorResponse(null, 403, 'Access denied. Insufficient permissions.')
    );
  }

  next();
};

/**
 * Require any authenticated user — role-agnostic
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(
      errorResponse(null, 401, 'Authentication required')
    );
  }
  next();
};

export default { requireRole, requireAuth };
