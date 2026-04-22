/**
 * Alerts Service
 * Business logic for alerts and actions
 */

import * as alertsRepository from '../models/alertsRepository.js';
import logger from '../utils/logger.js';

/**
 * Fetch all alerts
 */
export const getAllAlerts = async (options = {}) => {
  try {
    const { includeDetails = true, delayThreshold = 30 } = options;

    if (!includeDetails) {
      // Return only summary counts
      return await alertsRepository.getAlertsSummary();
    }

    // Fetch all alert types in parallel for better performance
    const [
      failedPayments,
      unassignedOrders,
      vendorsOffline,
      deliveryDelays
    ] = await Promise.all([
      alertsRepository.getFailedPayments(),
      alertsRepository.getUnassignedOrders(),
      alertsRepository.getVendorsOffline(),
      alertsRepository.getDeliveryDelays(delayThreshold)
    ]);

    return {
      failed_payments: failedPayments,
      unassigned_orders: unassignedOrders,
      vendors_offline: vendorsOffline,
      delivery_delays: deliveryDelays,
      summary: {
        total_alerts: failedPayments.length + unassignedOrders.length + vendorsOffline.length + deliveryDelays.length,
        failed_payments_count: failedPayments.length,
        unassigned_orders_count: unassignedOrders.length,
        vendors_offline_count: vendorsOffline.length,
        delivery_delays_count: deliveryDelays.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Assign delivery partner to order
 */
export const assignDeliveryPartner = async (orderId, deliveryPartnerId) => {
  try {
    // Validate order exists
    const order = await alertsRepository.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Validate delivery partner exists and is active
    const deliveryPartner = await alertsRepository.getDeliveryPartnerById(deliveryPartnerId);
    if (!deliveryPartner) {
      throw new Error(`Delivery partner ${deliveryPartnerId} not found`);
    }

    if (deliveryPartner.status === 'inactive' || !deliveryPartner.is_available) {
      throw new Error(`Delivery partner ${deliveryPartnerId} is not available`);
    }

    // Check if order already has a delivery partner
    if (order.delivery_partner_id) {
      throw new Error(`Order ${orderId} is already assigned to delivery partner ${order.delivery_partner_id}`);
    }

    // Create delivery assignment record
    const assignment = await alertsRepository.createDeliveryAssignment(orderId, deliveryPartnerId);

    // Update order with delivery partner
    const updatedOrder = await alertsRepository.updateOrderDeliveryPartner(orderId, deliveryPartnerId);

    logger.info(`Order ${orderId} assigned to delivery partner ${deliveryPartnerId}`);

    return {
      success: true,
      order_id: orderId,
      delivery_partner_id: deliveryPartnerId,
      assignment_id: assignment.id,
      assigned_at: assignment.assigned_at,
      order_status: updatedOrder.status,
      message: `Order successfully assigned to delivery partner ${deliveryPartner.name}`
    };
  } catch (error) {
    logger.error('Error assigning delivery partner:', error);
    throw error;
  }
};

/**
 * Get failed payments alert
 */
export const getFailedPaymentsAlert = async () => {
  try {
    const data = await alertsRepository.getFailedPayments();
    return {
      type: 'failed_payments',
      count: data.length,
      data: data,
      severity: 'high',
      message: `${data.length} failed payment(s) require attention`
    };
  } catch (error) {
    logger.error('Error fetching failed payments alert:', error);
    throw error;
  }
};

/**
 * Get unassigned orders alert
 */
export const getUnassignedOrdersAlert = async () => {
  try {
    const data = await alertsRepository.getUnassignedOrders();
    return {
      type: 'unassigned_orders',
      count: data.length,
      data: data,
      severity: data.length > 10 ? 'high' : 'medium',
      message: `${data.length} order(s) waiting for delivery partner assignment`
    };
  } catch (error) {
    logger.error('Error fetching unassigned orders alert:', error);
    throw error;
  }
};

/**
 * Get vendors offline alert
 */
export const getVendorsOfflineAlert = async () => {
  try {
    const data = await alertsRepository.getVendorsOffline();
    return {
      type: 'vendors_offline',
      count: data.length,
      data: data,
      severity: 'medium',
      message: `${data.length} vendor/store(s) are currently offline`
    };
  } catch (error) {
    logger.error('Error fetching vendors offline alert:', error);
    throw error;
  }
};

/**
 * Get delivery delays alert
 */
export const getDeliveryDelaysAlert = async (thresholdMinutes = 30) => {
  try {
    const data = await alertsRepository.getDeliveryDelays(thresholdMinutes);
    return {
      type: 'delivery_delays',
      count: data.length,
      data: data,
      severity: 'high',
      threshold_minutes: thresholdMinutes,
      message: `${data.length} delivery(ies) delayed beyond ${thresholdMinutes} minutes`
    };
  } catch (error) {
    logger.error('Error fetching delivery delays alert:', error);
    throw error;
  }
};

export default {
  getAllAlerts,
  assignDeliveryPartner,
  getFailedPaymentsAlert,
  getUnassignedOrdersAlert,
  getVendorsOfflineAlert,
  getDeliveryDelaysAlert
};
