/**
 * Upload Routes
 * POST /api/upload       — single image upload
 * POST /api/upload/multiple — multiple image upload
 */

import { Router } from 'express';
import { uploadSingle, uploadMultiple, validateUploadType, handleMulterError } from '../middleware/upload.js';
import { uploadImage, uploadMultipleImages } from '../controllers/uploadController.js';
import { authenticate } from '../middleware/authentication.js';

const router = Router();

/**
 * POST /api/upload
 * Upload a single image
 * multipart/form-data: image (file), type (string)
 * Requires authentication
 */
router.post(
  '/',
  authenticate,
  uploadSingle,
  handleMulterError,
  validateUploadType,
  uploadImage
);

/**
 * POST /api/upload/multiple
 * Upload multiple images (max 5)
 * multipart/form-data: images (files), type (string)
 * Requires authentication
 */
router.post(
  '/multiple',
  authenticate,
  uploadMultiple,
  handleMulterError,
  validateUploadType,
  uploadMultipleImages
);

export default router;
