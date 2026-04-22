/**
 * Firebase Admin SDK Configuration & Utilities
 * Handles Firebase Phone Authentication and Firestore operations
 */

import admin from 'firebase-admin';
import logger from './logger.js';

// Initialize Firebase Admin SDK only if credentials are provided
let firebaseInitialized = false;

const initializeFirebase = () => {
  try {
    // Check if all required Firebase config variables exist
    const requiredVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID',
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL'
    ];

    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
      logger.warn('Firebase not fully configured. Missing:', missingVars);
      logger.info('Firebase Authentication will use mock OTP mode for development');
      return false;
    }

    if (!admin.apps.length) {
      // Parse private key - handle both escaped newlines and quoted strings
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;

      // Remove surrounding quotes if present
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
      }

      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');

      const firebaseConfig = {
        type: 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });

      firebaseInitialized = true;
      logger.info('Firebase Admin SDK initialized successfully');
    }

    return true;
  } catch (error) {
    logger.error('Firebase initialization error:', error);
    logger.warn('Falling back to mock OTP mode');
    return false;
  }
};

/**
 * Create a session for phone authentication
 * Used to initiate phone sign-in flow
 */
export const createPhoneAuthSession = async (phoneNumber) => {
  try {
    // Format phone number with country code if needed
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+91${phoneNumber}`; // Default to India, adjust as needed

    // In production, Firebase would handle this server-side
    // For now, we generate a session ID that the client will use
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Phone auth session created:', { phoneNumber: formattedPhone, sessionId });

    return {
      sessionId,
      phoneNumber: formattedPhone,
      message: 'Phone authentication session created'
    };
  } catch (error) {
    logger.error('Create phone auth session error:', error);
    throw new Error('Failed to create phone authentication session');
  }
};

/**
 * Send OTP via Firebase (server-side initiation)
 * Note: Actual OTP sending to phone happens on client-side with Firebase SDK
 */
export const sendPhoneOTP = async (phoneNumber) => {
  try {
    if (!firebaseInitialized && process.env.FIREBASE_PHONE_AUTH_ENABLED === 'true') {
      initializeFirebase();
    }

    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+91${phoneNumber}`;

    // Firebase phone auth is client-initiated, but we can create a custom token
    // or prepare the backend for verification
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    logger.info('OTP initialization prepared', { phoneNumber: formattedPhone, sessionId });

    return {
      sessionId,
      phoneNumber: formattedPhone,
      message: 'OTP will be sent to your phone',
      expiresAt: new Date(Date.now() + parseInt(process.env.FIREBASE_OTP_EXPIRATION_MINUTES || 5) * 60000)
    };
  } catch (error) {
    logger.error('Send phone OTP error:', error);
    throw new Error('Failed to send OTP');
  }
};

/**
 * Verify Firebase ID Token and extract user info
 */
export const verifyFirebaseToken = async (idToken) => {
  try {
    if (!firebaseInitialized) {
      throw new Error('Firebase not initialized');
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    return {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number,
      email: decodedToken.email || null,
      isVerified: true,
      issuedAt: new Date(decodedToken.iat * 1000),
      expiresAt: new Date(decodedToken.exp * 1000)
    };
  } catch (error) {
    logger.error('Verify Firebase token error:', error);
    throw new Error('Invalid or expired Firebase token');
  }
};

/**
 * Create or get Firebase user
 */
export const createOrGetFirebaseUser = async (phoneNumber, email = null, displayName = null) => {
  try {
    if (!firebaseInitialized) {
      throw new Error('Firebase not initialized');
    }

    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+91${phoneNumber}`;

    // Try to get user by phone number
    let user;
    try {
      user = await admin.auth().getUserByPhoneNumber(formattedPhone);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        // Create new user
        user = await admin.auth().createUser({
          phoneNumber: formattedPhone,
          email: email || undefined,
          displayName: displayName || 'User',
          emailVerified: false
        });
      } else {
        throw error;
      }
    }

    return {
      uid: user.uid,
      phoneNumber: user.phoneNumber,
      email: user.email,
      displayName: user.displayName,
      creationTime: user.metadata?.creationTime
    };
  } catch (error) {
    logger.error('Create or get Firebase user error:', error);
    throw new Error('Failed to create or get user');
  }
};

/**
 * Generate custom token for authenticated user
 * Used if you want to extend Firebase auth with custom claims
 */
export const generateCustomToken = async (uid, additionalClaims = {}) => {
  try {
    if (!firebaseInitialized) {
      throw new Error('Firebase not initialized');
    }

    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    logger.error('Generate custom token error:', error);
    throw new Error('Failed to generate custom token');
  }
};

/**
 * Check if Firebase is properly initialized
 */
export const isFirebaseReady = () => {
  return firebaseInitialized;
};

/**
 * Initialize Firebase on module load
 */
export const initFirebaseSDK = () => {
  if (process.env.FIREBASE_PHONE_AUTH_ENABLED === 'true') {
    const initialized = initializeFirebase();
    if (!initialized) {
      logger.warn('Firebase will work in mock/development mode');
    }
  }
};

// Initialize on import
initFirebaseSDK();

export default {
  initializeFirebase,
  createPhoneAuthSession,
  sendPhoneOTP,
  verifyFirebaseToken,
  createOrGetFirebaseUser,
  generateCustomToken,
  isFirebaseReady
};

