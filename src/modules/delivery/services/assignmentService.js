/**
 * Delivery Assignment Service (Scaffold)
 * Manages order assignments, status updates, and location tracking
 */

import * as deliveryAssignmentRepo from '../../../models/deliveryAssignmentRepository.js';
import * as deliveryPartnerRepo from '../../../models/deliveryPartnerRepository.js';
import * as deliveryEarningsRepo from '../../../models/deliveryEarningsRepository.js';
import logger from '../../../utils/logger.js';

export const getAssignedOrders = async (userId) => {
  const partner = await deliveryPartnerRepo.findByUserId(userId);
  if (!partner) {
    throw Object.assign(new Error('Delivery partner profile not found'), { statusCode: 404 });
  }
  return deliveryAssignmentRepo.getByPartnerId(partner.id);
};

export const updateDeliveryStatus = async (assignmentId, userId, status) => {
  const partner = await deliveryPartnerRepo.findByUserId(userId);
  if (!partner) {
    throw Object.assign(new Error('Delivery partner profile not found'), { statusCode: 404 });
  }
  return deliveryAssignmentRepo.updateStatus(assignmentId, status);
};

export const updateLocation = async (userId, latitude, longitude) => {
  const partner = await deliveryPartnerRepo.findByUserId(userId);
  if (!partner) {
    throw Object.assign(new Error('Delivery partner profile not found'), { statusCode: 404 });
  }
  return deliveryPartnerRepo.updateLocation(partner.id, latitude, longitude);
};

export const toggleAvailability = async (userId) => {
  const partner = await deliveryPartnerRepo.findByUserId(userId);
  if (!partner) {
    throw Object.assign(new Error('Delivery partner profile not found'), { statusCode: 404 });
  }
  return deliveryPartnerRepo.toggleAvailability(partner.id);
};

export const getEarnings = async (userId) => {
  const partner = await deliveryPartnerRepo.findByUserId(userId);
  if (!partner) {
    throw Object.assign(new Error('Delivery partner profile not found'), { statusCode: 404 });
  }
  return deliveryEarningsRepo.getSummary(partner.id);
};
