/**
 * Public Module Routes
 * All routes prefixed with /api/v1/public
 * No authentication required
 */

import { Router } from 'express';
import * as publicCtrl from '../controllers/publicController.js';

const router = Router();

// City discovery
router.get('/cities', publicCtrl.getActiveCities);
router.get('/cities/:city/stores', publicCtrl.getStoresByCity);

// Store detail
router.get('/stores/:id', publicCtrl.getStoreDetail);

// Order tracking (by order ID)
router.get('/orders/:id/track', publicCtrl.trackOrder);

export default router;
