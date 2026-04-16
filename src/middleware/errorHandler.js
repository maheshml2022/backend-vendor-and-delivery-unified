/**
 * Error Handler Middleware
 * Centralized error handling for all routes
 */

import logger from '../utils/logger.js';
import { errorResponse } from '../utils/response.js';

export const errorHandler = (error, req, res, next) => {
  logger.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json(errorResponse(error, statusCode, message));
};

/**
 * Async Handler - Wrap async route handlers to catch errors
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;
