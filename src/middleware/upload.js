/**
 * Upload Middleware
 * Multer configuration for handling image uploads
 * Stores files under /var/www/dailyboxapp/uploads/{type}/
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Allowed folder types
const ALLOWED_TYPES = ['users', 'vendors', 'products', 'delivery', 'admin'];

// Base upload path — EC2 production path
const BASE_UPLOAD_PATH = process.env.UPLOAD_BASE_PATH || '/var/www/dailyboxapp/uploads';

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validate the folder type from request body
 */
export const validateUploadType = (req, res, next) => {
  const { type } = req.body;

  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Missing required field: type',
    });
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid type "${type}". Allowed types: ${ALLOWED_TYPES.join(', ')}`,
    });
  }

  next();
};

/**
 * Multer storage configuration
 * Uses diskStorage with dynamic destination based on `type` field
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return cb(new Error(`Invalid upload type: ${type}`));
    }

    const uploadDir = path.join(BASE_UPLOAD_PATH, type);

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadDir, { recursive: true });

    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter — only allow jpg, jpeg, png
 */
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, and PNG images are allowed.'), false);
  }
};

/**
 * Configured multer instance for single image upload
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('image');

/**
 * Configured multer instance for multiple image uploads (future use)
 * Max 5 images per request
 */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).array('images', 5);

/**
 * Multer error handler middleware
 */
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: `Unexpected field "${err.field}". Use "image" for single upload or "images" for multiple.`,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

export { ALLOWED_TYPES, BASE_UPLOAD_PATH };
