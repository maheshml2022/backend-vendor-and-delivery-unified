/**
 * Vendor Review Controller
 */

import * as reviewService from '../services/reviewService.js';
import { successResponse, errorResponse } from '../../../utils/response.js';
import { validate } from '../../../validators/index.js';
import { validateReviewReply } from '../../../validators/vendorValidators.js';
import { asyncHandler } from '../../../middleware/errorHandler.js';

export const getReviews = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const reviews = await reviewService.getReviews(req.user.userId, { page, limit });
  res.json(successResponse(reviews));
});

export const replyToReview = asyncHandler(async (req, res) => {
  const { error, value } = validate(validateReviewReply, req.body);
  if (error) {
    return res.status(400).json(errorResponse(null, 400, error.details[0].message));
  }
  const review = await reviewService.replyToReview(req.params.id, req.user.userId, value.reply);
  res.json(successResponse(review, 'Reply added'));
});
