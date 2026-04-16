/**
 * Upload Controller
 * Handles image upload requests
 */

import logger from '../utils/logger.js';

/**
 * POST /api/upload
 * Upload a single image
 * Body (multipart/form-data): image (file), type (string)
 */
export const uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No image file provided. Use field name "image".',
    });
  }

  const { type } = req.body;
  const baseUrl = process.env.UPLOAD_PUBLIC_URL || `${process.env.BACKEND_BASE_URL || 'https://dailyboxapp.com'}`;
  const imageUrl = `${baseUrl}/uploads/${type}/${req.file.filename}`;

  logger.info(`Image uploaded: ${type}/${req.file.filename} (${req.file.size} bytes)`);

  res.status(201).json({
    success: true,
    imageUrl,
  });
};

/**
 * POST /api/upload/multiple
 * Upload multiple images (up to 5)
 * Body (multipart/form-data): images (files), type (string)
 */
export const uploadMultipleImages = (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No image files provided. Use field name "images".',
    });
  }

  const { type } = req.body;
  const baseUrl = process.env.UPLOAD_PUBLIC_URL || `${process.env.BACKEND_BASE_URL || 'https://dailyboxapp.com'}`;

  const images = req.files.map((file) => ({
    imageUrl: `${baseUrl}/uploads/${type}/${file.filename}`,
    originalName: file.originalname,
    size: file.size,
  }));

  logger.info(`${images.length} images uploaded to ${type}/`);

  res.status(201).json({
    success: true,
    images,
  });
};
