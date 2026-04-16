/**
 * Customer Menu Review Service
 * Business logic for menu item reviews
 */

import * as menuItemReviewRepo from '../../../models/menuItemReviewRepository.js';
import * as menuRepo from '../../../models/menuRepository.js';
import logger from '../../../utils/logger.js';

export const getMenuItemReviews = async (menuItemId, page, limit) => {
  const offset = (page - 1) * limit;
  const [reviews, total, summary] = await Promise.all([
    menuItemReviewRepo.listByMenuItemId(menuItemId, limit, offset),
    menuItemReviewRepo.countByMenuItemId(menuItemId),
    menuItemReviewRepo.getSummaryByMenuItemId(menuItemId)
  ]);
  return { reviews, total, summary };
};

export const upsertMenuItemReview = async (menuItemId, userId, rating, comment) => {
  // Verify menu item exists
  const item = await menuRepo.getMenuItemById(menuItemId);
  if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });

  return await menuItemReviewRepo.upsertReview(menuItemId, userId, rating, comment);
};

export const deleteMenuItemReview = async (menuItemId, reviewId, userId) => {
  const result = await menuItemReviewRepo.deleteReview(reviewId, userId, menuItemId);
  if (!result) throw Object.assign(new Error('Review not found or not owned by you'), { statusCode: 404 });
  return result;
};

export const getMenuItemWithReviewSummary = async (menuItemId) => {
  const [item, summary] = await Promise.all([
    menuRepo.getMenuItemById(menuItemId),
    menuItemReviewRepo.getSummaryByMenuItemId(menuItemId)
  ]);
  if (!item) throw Object.assign(new Error('Menu item not found'), { statusCode: 404 });
  return { ...item, review_summary: summary };
};
