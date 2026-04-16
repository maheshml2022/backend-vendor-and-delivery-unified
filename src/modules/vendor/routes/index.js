/**
 * Vendor Module Routes
 * All routes prefixed with /api/v1/vendor
 */

import { Router } from 'express';
import { authenticate } from '../../../middleware/authentication.js';
import { requireRole } from '../../../middleware/rbac.js';

// Controllers
import * as authCtrl from '../controllers/authController.js';
import * as profileCtrl from '../controllers/profileController.js';
import * as storeCtrl from '../controllers/storeController.js';
import * as productCtrl from '../controllers/productController.js';
import * as orderCtrl from '../controllers/orderController.js';
import * as dashboardCtrl from '../controllers/dashboardController.js';
import * as reviewCtrl from '../controllers/reviewController.js';
import { uploadImage } from '../controllers/uploadController.js';

const router = Router();

// ─── Auth (public) ──────────────────────────────────────────────────────────
router.post('/auth/send-otp', authCtrl.sendOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtpLogin);
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/forgot-password', authCtrl.forgotPassword);
router.post('/auth/reset-password', authCtrl.resetPassword);

// ─── Protected routes (vendor role) ─────────────────────────────────────────
router.use(authenticate, requireRole('vendor'));

// Profile
router.get('/profile', profileCtrl.getProfile);
router.put('/profile', profileCtrl.updateProfile);

// Stores
router.get('/stores', storeCtrl.getStores);
router.post('/stores', storeCtrl.createStore);
router.put('/stores/:id', storeCtrl.updateStore);
router.patch('/stores/:id/status', storeCtrl.updateStoreStatus);

// Products
router.get('/products', productCtrl.getProducts);
router.post('/products', productCtrl.createProduct);
router.put('/products/:id', productCtrl.updateProduct);
router.delete('/products/:id', productCtrl.deleteProduct);
router.post('/products/:id/images', productCtrl.addProductImage);

// Orders
router.get('/orders', orderCtrl.getOrders);
router.get('/orders/:id', orderCtrl.getOrderById);
router.patch('/orders/:id/accept', orderCtrl.acceptOrder);
router.patch('/orders/:id/status', orderCtrl.updateOrderStatus);

// Dashboard
router.get('/dashboard', dashboardCtrl.getDashboard);

// Reviews
router.get('/reviews', reviewCtrl.getReviews);
router.post('/reviews/:id/reply', reviewCtrl.replyToReview);

// Upload
router.post('/upload-image', ...uploadImage);

export default router;
