/**
 * Admin Routes
 * Routes for admin panel operations
 */

import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate } from '../middleware/authentication.js';
import { requireRole } from '../middleware/rbac.js';

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireRole('admin'));

// ==================== DASHBOARD ====================

router.get('/dashboard/metrics', adminController.getDashboardMetrics);

// ==================== USERS ====================

router.get('/users', adminController.getAdminUsers);
router.put('/users/:id', adminController.updateAdminUser);
router.patch('/users/:id/status', adminController.toggleUserStatus);

// ==================== VENDORS ====================

router.get('/vendors', adminController.getAdminVendors);
router.post('/vendors', adminController.createAdminVendor);
router.get('/vendors/:id', adminController.getAdminVendorById);
router.post('/vendors/:id/approve', adminController.approveVendor);
router.post('/vendors/:id/reject', adminController.rejectVendor);

// ==================== ORDERS ====================

router.get('/orders', adminController.getAdminOrders);
router.get('/orders/:id', adminController.getAdminOrderById);

// ==================== REPORTS ====================

router.get('/reports/orders', adminController.getOrdersReport);
router.get('/reports/revenue', adminController.getRevenueReport);

// ==================== DELIVERY PARTNERS ====================

router.get('/delivery-partners', adminController.getAllDeliveryPartners);
router.get('/delivery-partners/available', adminController.getAvailableDeliveryPartners);
router.post('/delivery-partners', adminController.createDeliveryPartner);
router.get('/delivery-partners/:id', adminController.getDeliveryPartnerById);
router.put('/delivery-partners/:id', adminController.updateDeliveryPartner);
router.patch('/delivery-partners/:id/status', adminController.toggleDeliveryPartnerStatus);
router.patch('/delivery-partners/:id/availability', adminController.toggleAvailability);
router.post('/delivery-partners/:id/approve', adminController.approveDeliveryPartner);
router.post('/delivery-partners/:id/reject', adminController.rejectDeliveryPartner);
router.delete('/delivery-partners/:id', adminController.deleteDeliveryPartner);

export default router;
