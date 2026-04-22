/**
 * Alerts Routes
 * Routes for admin alerts and actions
 */

import express from 'express';
import * as alertsController from '../controllers/alertsController.js';
import { authenticate } from '../middleware/authentication.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// All alert routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

/**
 * @route GET /api/admin/alerts
 * @desc Get all system alerts
 * @query {boolean} detailed - Include detailed alert data (default: true)
 * @query {number} delayThreshold - Delivery delay threshold in minutes (default: 30)
 */
router.get('/', alertsController.getAllAlerts);

/**
 * @route GET /api/admin/alerts/summary
 * @desc Get alerts summary (counts only)
 */
router.get('/summary', alertsController.getAlertsSummary);

/**
 * @route GET /api/admin/alerts/failed-payments
 * @desc Get failed payments alert
 */
router.get('/failed-payments', alertsController.getFailedPaymentsAlert);

/**
 * @route GET /api/admin/alerts/unassigned-orders
 * @desc Get unassigned orders alert
 */
router.get('/unassigned-orders', alertsController.getUnassignedOrdersAlert);

/**
 * @route GET /api/admin/alerts/vendors-offline
 * @desc Get vendors offline alert
 */
router.get('/vendors-offline', alertsController.getVendorsOfflineAlert);

/**
 * @route GET /api/admin/alerts/delivery-delays
 * @desc Get delivery delays alert
 * @query {number} thresholdMinutes - Delay threshold in minutes (default: 30)
 */
router.get('/delivery-delays', alertsController.getDeliveryDelaysAlert);

/**
 * @route POST /api/admin/assign-delivery
 * @desc Assign delivery partner to an order
 * @body {number} order_id - Order ID to assign
 * @body {number} delivery_partner_id - Delivery partner ID to assign
 */
router.post('/assign-delivery', alertsController.assignDeliveryPartner);

export default router;
