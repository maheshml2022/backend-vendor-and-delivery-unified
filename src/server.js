/**
 * DailyBox Backend Server
 * Main entry point for the food delivery platform API
 * 
 * Features:
 * - User Authentication with JWT & OTP
 * - Store and Menu Management
 * - Cart and Order Management
 * - PostgreSQL Integration
 * - Scalable Architecture
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import configuration and routes
import { initializeDatabase } from './db/init.js';
import { initializeModuleTables } from './db/init-modules.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import storeRoutes from './routes/store.routes.js';
import menuRoutes from './routes/menu.routes.js';
import cartRoutes from './routes/cart.routes.js';
import orderRoutes from './routes/order.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

// Module routes
import customerRoutes from './modules/customer/routes/index.js';
import vendorRoutes from './modules/vendor/routes/index.js';
import deliveryRoutes from './modules/delivery/routes/index.js';
import publicRoutes from './modules/public/routes/index.js';

// Initialize Express app
const app = express();

// ==================== MIDDLEWARE ====================

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Logging Middleware
app.use(morgan('combined', {
  stream: fs.createWriteStream(path.join(__dirname, '../logs/access.log'), { flags: 'a' })
}));
app.use(morgan('dev')); // Console logging

// ==================== ROUTES ====================

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'DailyBox Backend is running',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION
  });
});

// API Routes
const apiBase = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${apiBase}/auth`, authRoutes);
app.use(`${apiBase}/users`, userRoutes);
app.use(`${apiBase}/stores`, storeRoutes);
app.use(`${apiBase}/menu`, menuRoutes);
app.use(`${apiBase}/cart`, cartRoutes);
app.use(`${apiBase}/orders`, orderRoutes);
app.use(`${apiBase}/admin`, adminRoutes);
app.use('/api/upload', uploadRoutes);

// ==================== MODULE ROUTES ====================
app.use(`${apiBase}/customer`, customerRoutes);
app.use(`${apiBase}/vendor`, vendorRoutes);
app.use(`${apiBase}/delivery`, deliveryRoutes);
app.use(`${apiBase}/public`, publicRoutes);

// ==================== STATIC FILES — Uploads ====================
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
app.use('/uploads', express.static(uploadsPath));

// Production uploads path (EC2)
const prodUploadsPath = process.env.UPLOAD_BASE_PATH || '/var/www/dailyboxapp/uploads';
if (fs.existsSync(prodUploadsPath)) {
  app.use('/uploads', express.static(prodUploadsPath));
}
// Serve admin app build files in production
const adminBuildPath = path.join(__dirname, '../../adminapp/build');
if (fs.existsSync(adminBuildPath)) {
  app.use(express.static(adminBuildPath));
  // For any non-API route, serve the admin app's index.html (SPA support)
  app.get(/^(?!\/api\/)(?!\/health).*/, (req, res) => {
    res.sendFile(path.join(adminBuildPath, 'index.html'));
  });
}

// 404 Handler (for API routes only)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// ==================== ERROR HANDLING ====================
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

const PORT = process.env.PORT;
const API_VERSION = process.env.API_VERSION;
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL;

// Start Server
const startServer = async () => {
  try {
    // Initialize Database
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('Database connection successful');

    // Initialize module tables (extensions)
    await initializeModuleTables();
    logger.info('Module tables initialized');

    // Start Express Server
    app.listen(PORT, () => {
      logger.info(`
        ╔════════════════════════════════════════════════╗
        ║     DailyBox Unified Backend Started           ║
        ║     Port: ${PORT}                            ║
        ║     Environment: ${process.env.NODE_ENV}      ║
        ║     API Base: /api/${API_VERSION}                  ║
        ║     Backend URL: ${BACKEND_BASE_URL}   ║
        ║     Health Check: ${BACKEND_BASE_URL}/health ║
        ║     Modules: admin, customer, vendor,          ║
        ║              delivery, public                  ║
        ╚════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle Graceful Shutdown
process.on('SIGINT', () => {
  logger.info('Server shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

export default app;
