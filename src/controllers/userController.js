/**
 * User Controller
 * Handles user profile endpoints
 */

import * as userService from '../services/userService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/**
 * GET /api/v1/users/profile
 * Get user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const user = await userService.getUserProfile(userId);
  res.json(successResponse(user, 'User profile retrieved'));
});

/**
 * PUT /api/v1/users/profile
 * Update user profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { fullName, email, profileImageUrl } = req.body;

  const user = await userService.updateUserProfile(
    userId,
    fullName,
    email,
    profileImageUrl
  );

  res.json(successResponse(user, 'Profile updated successfully'));
});

/**
 * GET /api/v1/users
 * Get all users (admin)
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await userService.getAllUsers(parseInt(page), parseInt(limit));
  res.json(successResponse(result, 'Users retrieved'));
});

/**
 * POST /api/v1/users
 * Create a new user (admin)
 */
export const createUser = asyncHandler(async (req, res) => {
  const { mobileNumber, fullName, email, password } = req.body;

  const user = await userService.createUser(mobileNumber, fullName, email, password);
  res.status(201).json(successResponse(user, 'User created successfully', 201));
});

export default {
  getProfile,
  updateProfile,
  getAllUsers,
  createUser
};
