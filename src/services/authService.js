/**
 * Authentication Service
 * Handles OTP generation, verification, and JWT token generation
 * Integrated with Firebase Phone Authentication
 */

import bcryptjs from 'bcryptjs';
import * as userRepo from '../models/userRepository.js';
import * as otpRepo from '../models/otpRepository.js';
import { generateOTP, getOTPExpirationTime, isOTPExpired, isValidOTPFormat } from '../utils/otp.js';
import { generateToken } from '../utils/jwt.js';
import * as firebaseService from '../utils/firebase.js';
import logger from '../utils/logger.js';
import { MAX_OTP_ATTEMPTS } from '../utils/otp.js';

/**
 * Send OTP to mobile number
 * Firebase Phone Auth: OTP is sent by client-side Firebase SDK
 * Server just prepares the session and returns firebase mode indicator
 */
export const sendOTP = async (mobileNumber) => {
  try {
    // Check if user exists
    let user = await userRepo.findUserByMobile(mobileNumber);

    // If user doesn't exist, create them first to satisfy foreign key constraint in otps table
    if (!user) {
      logger.info('Creating new user for OTP:', { mobileNumber });
      user = await userRepo.createUser(mobileNumber, null, 'User', null, null);
    }

    // Check if Firebase is ready
    const useFirebase = process.env.FIREBASE_PHONE_AUTH_ENABLED === 'true' && firebaseService.isFirebaseReady();

    // Always generate a real OTP and store in DB
    const otp = generateOTP();
    const expiresAt = getOTPExpirationTime();
    await otpRepo.saveOTP(mobileNumber, otp, expiresAt);

    if (useFirebase) {
      logger.info('Firebase Phone Authentication enabled');
      const formattedPhone = mobileNumber.startsWith('+') ? mobileNumber : `+91${mobileNumber}`;

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt,
        authMethod: 'firebase',
        phoneNumber: formattedPhone,
        // In dev mode, also return OTP for curl testing
        debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
      };
    }

    // Custom OTP only if Firebase not configured
    logger.info('Using custom OTP generation (Firebase not configured)');

    return {
      success: true,
      message: 'OTP sent successfully',
      expiresAt,
      authMethod: 'custom',
      debug_otp: process.env.NODE_ENV === 'development' ? otp : undefined
    };
  } catch (error) {
    logger.error('Send OTP error:', error);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Verify OTP and create/update user
 * Supports Firebase ID token and custom OTP verification
 */
export const verifyOTP = async (mobileNumber, otpCode, firebaseIdToken) => {
  try {
    const tokenCandidate = firebaseIdToken || otpCode;
    const isFirebaseToken = tokenCandidate && tokenCandidate.includes('.') && tokenCandidate.split('.').length === 3;

    const useFirebase = process.env.FIREBASE_PHONE_AUTH_ENABLED === 'true' && firebaseService.isFirebaseReady();

    if (isFirebaseToken) {
      if (!useFirebase) {
        throw new Error('Firebase phone auth is not configured on server');
      }

      try {
        logger.info('Verifying Firebase ID token');
        const firebaseUser = await firebaseService.verifyFirebaseToken(tokenCandidate);

        // Verify phone number matches
        if (firebaseUser.phoneNumber) {
          const firebasePhone = firebaseUser.phoneNumber.replace(/\D/g, '');
          const userPhone = mobileNumber.replace(/\D/g, '');
          if (!firebasePhone.includes(userPhone) && !userPhone.includes(firebasePhone)) {
            throw new Error('Phone number mismatch');
          }
        }

        // Get or create user from Firebase info
        let user = await userRepo.findUserByMobile(mobileNumber);

        if (!user) {
          logger.info('Creating user from Firebase token:', { mobileNumber });
          user = await userRepo.createUser(
            mobileNumber,
            firebaseUser.email,
            firebaseUser.displayName || 'User',
            null
          );
        }

        // Update user verification status
        await userRepo.updateUserVerification(user.id);

        // Update last login
        await userRepo.updateUserLastLogin(user.id);

        // Generate JWT token for our API
        const token = generateToken({
          userId: user.id,
          mobileNumber: user.mobile_number,
          firebaseUid: firebaseUser.uid
        });

        return {
          success: true,
          message: 'OTP verified successfully',
          authMethod: 'firebase',
          user: {
            id: user.id,
            mobileNumber: user.mobile_number,
            fullName: user.full_name,
            email: user.email,
            isVerified: true
          },
          token
        };
      } catch (firebaseError) {
        logger.warn('Firebase verification failed:', firebaseError.message);
        throw new Error(firebaseError.message || 'Invalid or expired Firebase token');
      }
    }

    // Fallback to custom OTP verification for numeric OTP only
    logger.info('Verifying custom OTP');

    // Validate OTP format
    if (!isValidOTPFormat(otpCode)) {
      throw new Error('Invalid OTP format');
    }

    // Get OTP record
    const otpRecord = await otpRepo.getOTPByMobile(mobileNumber);

    if (!otpRecord) {
      throw new Error('OTP not found or expired');
    }

    // Check if OTP is expired
    if (isOTPExpired(otpRecord.expires_at)) {
      throw new Error('OTP has expired');
    }

    // Check attempt count
    if (otpRecord.attempt_count >= MAX_OTP_ATTEMPTS) {
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Verify OTP
    if (otpRecord.otp_code !== otpCode) {
      await otpRepo.incrementOTPAttempt(mobileNumber);
      throw new Error('Invalid OTP');
    }

    // Update OTP as verified
    await otpRepo.verifyOTP(mobileNumber, otpCode);

    // Get or create user (safety check, should exist from sendOTP)
    let user = await userRepo.findUserByMobile(mobileNumber);

    if (!user) {
      user = await userRepo.createUser(mobileNumber, null, null, null);
    }

    // Update user verification status
    await userRepo.updateUserVerification(user.id);

    // Update last login
    await userRepo.updateUserLastLogin(user.id);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      mobileNumber: user.mobile_number
    });

    return {
      success: true,
      message: 'OTP verified successfully',
      authMethod: 'custom',
      user: {
        id: user.id,
        mobileNumber: user.mobile_number,
        fullName: user.full_name,
        email: user.email,
        isVerified: true
      },
      token
    };
  } catch (error) {
    logger.error('Verify OTP error:', error);
    throw error;
  }
};

/**
 * User registration with password
 */
export const registerUser = async (mobileNumber, fullName, email, password) => {
  try {
    // Check if user already exists
    const existingUser = await userRepo.findUserByMobile(mobileNumber);

    if (existingUser && existingUser.password_hash) {
      throw new Error('User already registered');
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create or update user
    let user;
    if (existingUser) {
      user = await userRepo.updateUserProfile(
        existingUser.id,
        fullName,
        email,
        null
      );
      await userRepo.updateUserPassword(existingUser.id, passwordHash);
      user.id = existingUser.id;
    } else {
      user = await userRepo.createUser(mobileNumber, email, fullName, passwordHash);
      await userRepo.updateUserVerification(user.id);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      mobileNumber: user.mobile_number
    });

    return {
      success: true,
      message: 'User registered successfully',
      user: {
        id: user.id,
        mobileNumber: user.mobile_number,
        fullName: user.full_name,
        email: user.email
      },
      token
    };
  } catch (error) {
    logger.error('User registration error:', error);
    throw error;
  }
};

/**
 * User login with username and password
 */
export const loginUser = async (username, password) => {
  try {
    const user = await userRepo.findUserByUsername(username);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    if (!user.password_hash) {
      throw new Error('Account not set up. Please contact support');
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password_hash);

    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Update last login
    await userRepo.updateUserLastLogin(user.id);

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        isVerified: user.is_verified
      },
      token
    };
  } catch (error) {
    logger.error('User login error:', error);
    throw error;
  }
};

/**
 * Change user password
 */
export const changePassword = async (userContext, oldPassword, newPassword) => {
  try {
    if (oldPassword === newPassword) {
      throw new Error('New password must be different from old password');
    }

    const parsedUserId = Number.parseInt(userContext?.userId || userContext?.id, 10);
    let user = null;

    if (!Number.isNaN(parsedUserId)) {
      user = await userRepo.findUserAuthById(parsedUserId);
    }

    if (!user && userContext?.username) {
      user = await userRepo.findUserByUsername(userContext.username);
    }

    if (!user && userContext?.mobileNumber) {
      user = await userRepo.findUserByMobile(userContext.mobileNumber);
    }

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.password_hash) {
      throw new Error('User has no password set. Please register password first');
    }

    const isOldPasswordValid = await bcryptjs.compare(oldPassword, user.password_hash);
    if (!isOldPasswordValid) {
      throw new Error('Old password is incorrect');
    }

    const newPasswordHash = await bcryptjs.hash(newPassword, 10);
    await userRepo.updateUserPassword(user.id, newPasswordHash, newPassword);

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    logger.error('Change password error:', error);
    throw error;
  }
};

export default {
  sendOTP,
  verifyOTP,
  registerUser,
  loginUser,
  changePassword
};
