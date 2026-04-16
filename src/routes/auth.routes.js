/**
 * Authentication Routes
 * Handles OTP, registration, and login endpoints
 */

import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authentication.js';

const router = express.Router();

/**
 * POST /api/v1/auth/send-otp
 * Send OTP to user's mobile number
 * Body: { mobileNumber: string }
 */
router.post('/send-otp', authController.sendOTP);

/**
 * POST /api/v1/auth/verify-otp
 * Verify OTP and login/create user
 * Body: { mobileNumber: string, otpCode: string }
 */
router.post('/verify-otp', authController.verifyOTP);

/**
 * POST /api/v1/auth/register
 * Register new user with password
 * Body: { mobileNumber: string, fullName: string, email?: string, password: string }
 */
router.post('/register', authController.register);

/**
 * POST /api/v1/auth/login
 * Login user with username and password
 * Body: { username: string, password: string }
 */
router.post('/login', authController.login);

/**
 * PUT /api/v1/auth/change-password
 * Change password for logged-in user
 * Auth required: Yes
 * Body: { oldPassword: string, newPassword: string }
 */
router.put('/change-password', authenticate, authController.changePassword);

export default router;
