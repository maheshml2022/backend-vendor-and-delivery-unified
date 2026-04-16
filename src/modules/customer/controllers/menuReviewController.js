/**
 * Customer Menu Review Controller
 * Handles menu item review operations
 */

import * as menuReviewService from '../services/menuReviewService.js';
import { successResponse, paginatedResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateMenuItemReview } from '../../../validators/customerValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const listMenuItemReviews = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const data = await menuReviewService.getMenuItemReviews(menuItemId, page, limit);
  res.json(paginatedResponse(data.reviews, data.total, page, limit, 'Reviews retrieved'));
});

export const createOrUpdateMenuItemReview = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;
  const { error, value } = validate(validateMenuItemReview, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const review = await menuReviewService.upsertMenuItemReview(
    menuItemId, req.user.userId, value.rating, value.comment
  );
  res.status(201).json(successResponse(review, 'Review saved', 201));
});

export const removeMenuItemReview = asyncHandler(async (req, res) => {
  const { menuItemId, reviewId } = req.params;
  await menuReviewService.deleteMenuItemReview(menuItemId, reviewId, req.user.userId);
  res.json(successResponse(null, 'Review deleted'));
});

export const getMenuItemDetails = asyncHandler(async (req, res) => {
  const { menuItemId } = req.params;
  const item = await menuReviewService.getMenuItemWithReviewSummary(menuItemId);
  res.json(successResponse(item));
});
