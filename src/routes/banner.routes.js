/**
 * Banner Routes
 * Routes for admin banner image management
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../middleware/authentication.js';
import { requireRole } from '../middleware/rbac.js';
import * as bannerController from '../controllers/bannerController.js';

const router = express.Router();

// Banner upload directory
const BASE_UPLOAD_PATH = process.env.UPLOAD_BASE_PATH || '/var/www/dailyboxapp/uploads';
const BANNER_DIR = path.join(BASE_UPLOAD_PATH, 'admin');

// Multer config specific to banners (supports webp)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(BANNER_DIR, { recursive: true });
    cb(null, BANNER_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, uniqueName);
  },
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Multer error handler
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
      });
    }
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// Routes
router.post('/upload', authenticate, requireRole('admin'), upload.single('image'), handleUploadError, bannerController.uploadBanner);
router.get('/', bannerController.getBanners);
router.delete('/:filename', authenticate, requireRole('admin'), bannerController.deleteBanner);

export default router;
