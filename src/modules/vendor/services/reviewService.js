/**
 * Vendor Review Service
 * Business logic for vendor review management
 */

import * as reviewRepo from '../../../models/reviewRepository.js';
import logger from '../../../utils/logger.js';

export const getReviews = async (vendorId) => {
  const reviews = await reviewRepo.getReviewsByVendor(vendorId);
  return reviews.map(r => ({
    id: r.id,
    productId: r.product_id,
    productName: r.product_name,
    customerName: r.customer_name || 'Anonymous',
    rating: r.rating,
    comment: r.comment,
    vendorReply: r.vendor_reply || null,
    createdAt: r.created_at
  }));
};

export const replyToReview = async (reviewId, vendorId, reply) => {
  const result = await reviewRepo.addReply(reviewId, vendorId, reply);
  if (!result) throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  return result;
};
