/**
 * Store Routes
 * Handles vendor store browsing endpoints
 */

import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authentication.js';
import * as storeController from '../controllers/storeController.js';

const router = express.Router();

/**
 * GET /api/v1/stores
 * Get all stores with pagination
 * Auth required: No
 * Query: { page?: number, limit?: number }
 */
router.get('/', optionalAuthenticate, storeController.getAllStores);

/**
 * GET /api/v1/stores/search
 * Search stores by name or cuisine
 * Auth required: No
 * Query: { query: string, page?: number, limit?: number }
 */
router.get('/search', optionalAuthenticate, storeController.searchStores);

/**
 * GET /api/v1/stores/nearby
 * Get nearby stores by location
 * Auth required: No
 * Query: { latitude: number, longitude: number, radius?: number, limit?: number }
 */
router.get('/nearby', optionalAuthenticate, storeController.getNearbyStores);

/**
 * POST /api/v1/stores
 * Create store (admin)
 * Auth required: Yes
 */
router.post('/', authenticate, storeController.createStore);

/**
 * GET /api/v1/stores/:storeId
 * Get store details
 * Auth required: No
 */
router.get('/:storeId', optionalAuthenticate, storeController.getStoreDetails);

export default router;
