/**
 * User Routes
 * Handles user profile endpoints
 */

import express from 'express';
import { authenticate } from '../middleware/authentication.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

/**
 * GET /api/v1/users/profile
 * Get logged-in user profile
 * Auth required: Yes
 */
router.get('/profile', authenticate, userController.getProfile);

/**
 * PUT /api/v1/users/profile
 * Update user profile
 * Auth required: Yes
 * Body: { fullName?: string, email?: string, profileImageUrl?: string }
 */
router.put('/profile', authenticate, userController.updateProfile);

/**
 * GET /api/v1/users
 * Get all users (admin)
 * Auth required: Yes
 * Query: { page?: number, limit?: number }
 */
router.get('/', authenticate, userController.getAllUsers);

/**
 * POST /api/v1/users
 * Create user (admin)
 * Auth required: Yes
 */
router.post('/', authenticate, userController.createUser);

export default router;
