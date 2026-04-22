/**
 * Banner Controller
 * Handles banner image upload, listing, and deletion for admin panel
 */

import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

const BASE_UPLOAD_PATH = process.env.UPLOAD_BASE_PATH || '/var/www/dailyboxapp/uploads';
const BANNER_DIR = path.join(BASE_UPLOAD_PATH, 'admin');

/**
 * POST /api/v1/admin/banners/upload
 * Upload a banner image
 */
export const uploadBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided. Please upload an image.',
      });
    }

    const { filename, originalname, size } = req.file;
    const imageUrl = `/uploads/admin/${filename}`;

    logger.info(`Banner uploaded: ${filename} by admin ${req.user?.id}`);

    res.status(201).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        filename,
        originalName: originalname,
        size,
        url: imageUrl,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Banner upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload banner image',
    });
  }
};

/**
 * GET /api/v1/admin/banners
 * List all uploaded banner images
 */
export const getBanners = async (req, res) => {
  try {
    // Ensure directory exists
    if (!fs.existsSync(BANNER_DIR)) {
      fs.mkdirSync(BANNER_DIR, { recursive: true });
      return res.json({ success: true, data: [] });
    }

    const files = fs.readdirSync(BANNER_DIR);
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const banners = files
      .filter((file) => {
        const ext = path.extname(file).toLowerCase();
        return allowedExtensions.includes(ext);
      })
      .map((file) => {
        const filePath = path.join(BANNER_DIR, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          url: `/uploads/admin/${file}`,
          size: stats.size,
          uploadedAt: stats.birthtime || stats.mtime,
        };
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    res.json({
      success: true,
      data: banners,
      total: banners.length,
    });
  } catch (error) {
    logger.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner images',
    });
  }
};

/**
 * DELETE /api/v1/admin/banners/:filename
 * Delete a banner image from the server
 */
export const deleteBanner = async (req, res) => {
  try {
    const { filename } = req.params;

    // Sanitize filename — prevent path traversal
    const sanitized = path.basename(filename);
    if (sanitized !== filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename',
      });
    }

    const filePath = path.join(BANNER_DIR, sanitized);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Banner image not found',
      });
    }

    fs.unlinkSync(filePath);

    logger.info(`Banner deleted: ${sanitized} by admin ${req.user?.id}`);

    res.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner image',
    });
  }
};
