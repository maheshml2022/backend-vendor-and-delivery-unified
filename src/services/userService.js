/**
 * User Service
 * Handles user profile operations
 */

import bcryptjs from 'bcryptjs';
import * as userRepo from '../models/userRepository.js';
import logger from '../utils/logger.js';

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId) => {
  try {
    const user = await userRepo.findUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    logger.error('Get user profile error:', error);
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, fullName, email, profileImageUrl) => {
  try {
    const user = await userRepo.updateUserProfile(userId, fullName, email, profileImageUrl);

    if (!user) {
      throw new Error('Failed to update user profile');
    }

    return user;
  } catch (error) {
    logger.error('Update user profile error:', error);
    throw error;
  }
};

/**
 * Get all users (admin)
 */
export const getAllUsers = async (page = 1, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const users = await userRepo.getAllUsers(limit, offset);
    const total = await userRepo.countUsers();

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Get all users error:', error);
    throw error;
  }
};

/**
 * Create new user (admin)
 */
export const createUser = async (mobileNumber, fullName, email, password = null) => {
  try {
    // Prevent duplicate creation
    const existingUser = await userRepo.findUserByMobile(mobileNumber);
    if (existingUser) {
      throw new Error('User already exists');
    }

    let passwordHash = null;
    if (password) {
      passwordHash = await bcryptjs.hash(password, 10);
    }
    const user = await userRepo.createUser(mobileNumber, email, fullName, passwordHash);
    return user;
  } catch (error) {
    logger.error('Create user error:', error);
    throw error;
  }
};

/**
 * Update user by admin
 */
export const updateUserByAdmin = async (adminUserId, adminRole, targetUserId, updates) => {
  try {
    const parsedAdminUserId = Number.parseInt(adminUserId, 10);
    let admin = false;

    if (!Number.isNaN(parsedAdminUserId)) {
      admin = await userRepo.isUserAdmin(parsedAdminUserId);
    } else if (process.env.NODE_ENV === 'development' && adminRole === 'admin') {
      // Dev auth middleware injects a non-numeric id; trust injected admin role in dev only.
      admin = true;
    }

    if (!admin) {
      throw createHttpError(403, 'Admin access required');
    }

    if (updates.password !== undefined || updates.password_hash !== undefined) {
      throw createHttpError(400, 'Password update is not allowed in this API');
    }

    const dbUpdateData = {
      ...(updates.mobileNumber !== undefined ? { mobile_number: updates.mobileNumber } : {}),
      ...(updates.mobile_number !== undefined ? { mobile_number: updates.mobile_number } : {}),
      ...(updates.email !== undefined ? { email: updates.email } : {}),
      ...(updates.fullName !== undefined ? { full_name: updates.fullName } : {}),
      ...(updates.full_name !== undefined ? { full_name: updates.full_name } : {}),
      ...(updates.profileImageUrl !== undefined ? { profile_image_url: updates.profileImageUrl } : {}),
      ...(updates.profile_image_url !== undefined ? { profile_image_url: updates.profile_image_url } : {}),
      ...(updates.isVerified !== undefined ? { is_verified: updates.isVerified } : {}),
      ...(updates.is_verified !== undefined ? { is_verified: updates.is_verified } : {}),
      ...(updates.isActive !== undefined ? { is_active: updates.isActive } : {}),
      ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.role !== undefined ? { role: updates.role } : {}),
      ...(updates.lastLogin !== undefined ? { last_login: updates.lastLogin } : {}),
      ...(updates.last_login !== undefined ? { last_login: updates.last_login } : {})
    };

    if (Object.keys(dbUpdateData).length === 0) {
      throw createHttpError(400, 'No valid fields provided for update');
    }

    const updatedUser = await userRepo.updateUserByAdmin(targetUserId, dbUpdateData);
    if (!updatedUser) {
      throw createHttpError(404, 'User not found');
    }

    return updatedUser;
  } catch (error) {
    logger.error('Admin update user error:', error);
    throw error;
  }
};

export default {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  createUser,
  updateUserByAdmin
};
