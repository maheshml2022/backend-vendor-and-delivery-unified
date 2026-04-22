/**
 * Customer Store Review Controller
 * Handles store/restaurant review operations
 */

import * as storeReviewService from '../services/storeReviewService.js';
import { successResponse, paginatedResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateStoreReview } from '../../../validators/customerValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

/**
 * GET /api/v1/customer/stores/:storeId/reviews
 * List store reviews with pagination
 */
export const listStoreReviews = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const data = await storeReviewService.getStoreReviews(storeId, page, limit);
  res.json(paginatedResponse(data.reviews, data.total, page, limit, 'Reviews retrieved', data.summary));
});

/**
 * POST /api/v1/customer/stores/:storeId/reviews
 * Create or update a store review
 */
export const createOrUpdateStoreReview = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const { error, value } = validate(validateStoreReview, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const data = await storeReviewService.upsertStoreReview(
    storeId, req.user.userId, value.rating, value.comment
  );
  res.status(201).json(successResponse(data, 'Review saved', 201));
});

/**
 * DELETE /api/v1/customer/stores/:storeId/reviews/:reviewId
 * Delete a store review
 */
export const removeStoreReview = asyncHandler(async (req, res) => {
  const { storeId, reviewId } = req.params;
  const summary = await storeReviewService.deleteStoreReview(reviewId, req.user.userId, storeId);
  res.json(successResponse({ summary }, 'Review deleted'));
});

/**
 * GET /api/v1/customer/stores/:storeId/details
 * Get store with review summary
 */
export const getStoreDetails = asyncHandler(async (req, res) => {
  const { storeId } = req.params;
  const store = await storeReviewService.getStoreWithReviewSummary(storeId);
  res.json(successResponse(store, 'Store details retrieved'));
});

