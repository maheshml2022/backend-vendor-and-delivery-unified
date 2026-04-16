/**
 * Response Utility
 * Standardized API response format
 */

/**
 * Success response format
 */
export const successResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Error response format
 */
export const errorResponse = (error, statusCode = 500, message = 'An error occurred') => {
  return {
    success: false,
    statusCode,
    message: message || error.message || 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? error : undefined,
    timestamp: new Date().toISOString()
  };
};

/**
 * Pagination response format
 */
export const paginatedResponse = (data, total, page, limit, message = 'Success') => {
  return {
    success: true,
    statusCode: 200,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    },
    timestamp: new Date().toISOString()
  };
};

export default { successResponse, errorResponse, paginatedResponse };
