/**
 * Customer Store Review Service
 * Business logic for store/restaurant reviews
 */

import * as storeReviewRepo from '../../../models/storeReviewRepository.js';
import * as storeRepo from '../../../models/vendorStoreRepository.js';
import logger from '../../../utils/logger.js';

/**
 * Get store reviews with pagination
 */
export const getStoreReviews = async (storeId, page, limit) => {
  const offset = (page - 1) * limit;
  const [reviews, total, summary] = await Promise.all([
    storeReviewRepo.listByStoreId(storeId, limit, offset),
    storeReviewRepo.countByStoreId(storeId),
    storeReviewRepo.getSummaryByStoreId(storeId)
  ]);
  return { reviews, total, summary };
};

/**
 * Create or update a store review and update store rating
 */
export const upsertStoreReview = async (storeId, userId, rating, comment) => {
  // Verify store exists
  const store = await storeRepo.getById(storeId);
  if (!store) throw Object.assign(new Error('Store not found'), { statusCode: 404 });

  // Upsert review
  const review = await storeReviewRepo.upsertReview(storeId, userId, rating, comment);

  // Update store's average rating
  const summary = await storeReviewRepo.updateStoreRating(storeId);

  logger.info(`Store ${storeId} rating updated to ${summary.averageRating} (${summary.reviewCount} reviews)`);

  return { review, summary };
};

/**
 * Delete a store review and update store rating
 */
export const deleteStoreReview = async (reviewId, userId, storeId) => {
  const result = await storeReviewRepo.deleteReview(reviewId, userId, storeId);
  if (!result) throw Object.assign(new Error('Review not found or not owned by you'), { statusCode: 404 });

  // Update store's average rating
  const summary = await storeReviewRepo.updateStoreRating(storeId);

  logger.info(`Store ${storeId} rating updated to ${summary.averageRating} after review deletion (${summary.reviewCount} reviews remaining)`);

  return summary;
};

/**
 * Get store with review summary
 */
export const getStoreWithReviewSummary = async (storeId) => {
  const [store, summary] = await Promise.all([
    storeRepo.getById(storeId),
    storeReviewRepo.getSummaryByStoreId(storeId)
  ]);
  if (!store) throw Object.assign(new Error('Store not found'), { statusCode: 404 });
  return { ...store, review_summary: summary };
};

