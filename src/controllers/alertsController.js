/**
 * Alerts Controller
 * Handles request/response for alerts and actions
 */

import * as alertsService from '../services/alertsService.js';
import logger from '../utils/logger.js';

/**
 * Get all alerts
 * GET /api/admin/alerts
 */
export const getAllAlerts = async (req, res) => {
  try {
    const { detailed = true, delayThreshold = 30 } = req.query;
    const includeDetails = detailed !== 'false' && detailed !== '0';

    const alerts = await alertsService.getAllAlerts({
      includeDetails,
      delayThreshold: parseInt(delayThreshold) || 30
    });

    return res.status(200).json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getAllAlerts:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alerts'
    });
  }
};

/**
 * Get failed payments alert
 * GET /api/admin/alerts/failed-payments
 */
export const getFailedPaymentsAlert = async (req, res) => {
  try {
    const alert = await alertsService.getFailedPaymentsAlert();

    return res.status(200).json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getFailedPaymentsAlert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch failed payments alert'
    });
  }
};

/**
 * Get unassigned orders alert
 * GET /api/admin/alerts/unassigned-orders
 */
export const getUnassignedOrdersAlert = async (req, res) => {
  try {
    const alert = await alertsService.getUnassignedOrdersAlert();

    return res.status(200).json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getUnassignedOrdersAlert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch unassigned orders alert'
    });
  }
};

/**
 * Get vendors offline alert
 * GET /api/admin/alerts/vendors-offline
 */
export const getVendorsOfflineAlert = async (req, res) => {
  try {
    const alert = await alertsService.getVendorsOfflineAlert();

    return res.status(200).json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getVendorsOfflineAlert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch vendors offline alert'
    });
  }
};

/**
 * Get delivery delays alert
 * GET /api/admin/alerts/delivery-delays
 */
export const getDeliveryDelaysAlert = async (req, res) => {
  try {
    const { thresholdMinutes = 30 } = req.query;

    const alert = await alertsService.getDeliveryDelaysAlert(parseInt(thresholdMinutes) || 30);

    return res.status(200).json({
      success: true,
      data: alert,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getDeliveryDelaysAlert:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch delivery delays alert'
    });
  }
};

/**
 * Assign delivery partner to order
 * POST /api/admin/assign-delivery
 */
export const assignDeliveryPartner = async (req, res) => {
  try {
    const { order_id, delivery_partner_id } = req.body;

    // Validate required fields
    if (!order_id || !delivery_partner_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: order_id and delivery_partner_id'
      });
    }

    // Validate that IDs are valid numbers
    if (isNaN(order_id) || isNaN(delivery_partner_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid order_id or delivery_partner_id'
      });
    }

    const result = await alertsService.assignDeliveryPartner(order_id, delivery_partner_id);

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in assignDeliveryPartner:', error);

    // Check for specific error messages
    if (error.message.includes('not found') || error.message.includes('not available')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    if (error.message.includes('already assigned')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign delivery partner'
    });
  }
};

/**
 * Get alerts summary (lightweight endpoint for dashboard widgets)
 * GET /api/admin/alerts/summary
 */
export const getAlertsSummary = async (req, res) => {
  try {
    const alerts = await alertsService.getAllAlerts({
      includeDetails: false
    });

    return res.status(200).json({
      success: true,
      data: alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in getAlertsSummary:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alerts summary'
    });
  }
};

export default {
  getAllAlerts,
  getFailedPaymentsAlert,
  getUnassignedOrdersAlert,
  getVendorsOfflineAlert,
  getDeliveryDelaysAlert,
  assignDeliveryPartner,
  getAlertsSummary
};
