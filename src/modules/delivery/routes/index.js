/**
 * Delivery Module Routes (Scaffold)
 * All routes prefixed with /api/v1/delivery
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { requireRole } from '../../../middleware/rbac.js';

import * as authCtrl from '../controllers/authController.js';
import * as assignmentCtrl from '../controllers/assignmentController.js';
import * as profileCtrl from '../controllers/profileController.js';

const router = Router();

// ─── Auth (public) ──────────────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/send-otp', authCtrl.sendOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);

// ─── Protected routes (delivery role) ───────────────────────────────────────
router.use(authenticate, requireRole('delivery'));

router.get('/orders', assignmentCtrl.getAssignedOrders);
router.patch('/orders/:id/status', assignmentCtrl.updateDeliveryStatus);
router.post('/location', assignmentCtrl.updateLocation);
router.patch('/availability', assignmentCtrl.toggleAvailability);
router.get('/earnings', assignmentCtrl.getEarnings);

// ─── Profile ─────────────────────────────────────────────────────────────────
router.get('/profile', profileCtrl.getProfile);
router.put('/profile', profileCtrl.updateProfile);

export default router;
