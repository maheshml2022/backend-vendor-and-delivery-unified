/**
 * Database Initialization
 * Creates tables and initial setup for DailyBox application
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Initialize database with required tables
 */
export const initializeDatabase = async () => {
  try {
    logger.info('Ensuring database tables exist...');

    // Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        mobile_number VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE,
        username VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        full_name VARCHAR(255),
        profile_image_url TEXT,
        role VARCHAR(50) DEFAULT 'customer',
        status VARCHAR(50) DEFAULT 'active',
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Users table ready');

    // OTP Table
    await query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        mobile_number VARCHAR(20),
        otp_code VARCHAR(10),
        expires_at TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ OTP table ready');

    // Addresses Table
    await query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        address_line1 VARCHAR(255),
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100),
        postal_code VARCHAR(20),
        latitude NUMERIC(10, 8),
        longitude NUMERIC(11, 8),
        is_primary BOOLEAN DEFAULT FALSE,
        label VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Addresses table ready');

    // Vendor Details Table
    await query(`
      CREATE TABLE IF NOT EXISTS vendor_details (
        id SERIAL PRIMARY KEY,
        user_id INT UNIQUE REFERENCES users(id),
        vendor_name VARCHAR(255),
        business_name VARCHAR(255),
        gst_number VARCHAR(50),
        business_type VARCHAR(50),
        profile_image_url TEXT,
        pan_number VARCHAR(50),
        bank_account_number VARCHAR(50),
        ifsc_code VARCHAR(20),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Vendor Details table ready');

    // Vendor Stores Table
    await query(`
      CREATE TABLE IF NOT EXISTS vendor_stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        store_type VARCHAR,
        vendor_id INT REFERENCES vendor_details(id),
        description TEXT,
        logo_url TEXT,
        banner_url TEXT,
        rating NUMERIC(3, 2) DEFAULT 0,
        delivery_time INT,
        delivery_charge NUMERIC(10, 2),
        latitude NUMERIC(10, 8),
        longitude NUMERIC(11, 8),
        is_active BOOLEAN DEFAULT TRUE,
        approval_status VARCHAR(50) DEFAULT 'pending',
        owner_id INT REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Vendor Stores table ready');

    // Delivery Partners Table
    await query(`
      CREATE TABLE IF NOT EXISTS delivery_partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        user_id INT REFERENCES users(id),
        mobile_number VARCHAR(20),
        email VARCHAR(255),
        profile_image_url TEXT,
        vehicle_type VARCHAR(100),
        vehicle_number VARCHAR(50),
        license_number VARCHAR(100),
        rating NUMERIC(3, 2),
        is_available BOOLEAN DEFAULT TRUE,
        latitude NUMERIC(10, 8),
        longitude NUMERIC(11, 8),
        is_verified BOOLEAN DEFAULT FALSE,
        total_deliveries INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        approval_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure approval_status column exists (for existing tables)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'delivery_partners' AND column_name = 'approval_status'
        ) THEN
          ALTER TABLE delivery_partners ADD COLUMN approval_status VARCHAR(50) DEFAULT 'pending';
        END IF;
      END
      $$;
    `);

    // Ensure password_hash column exists (for delivery partner self-registration)
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'delivery_partners' AND column_name = 'password_hash'
        ) THEN
          ALTER TABLE delivery_partners ADD COLUMN password_hash VARCHAR(255);
        END IF;
      END
      $$;
    `);
    logger.info('✓ Delivery Partners table ready');

    // Menu Items Table
    await query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        store_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        price DECIMAL(10, 2) NOT NULL,
        discount_percentage DECIMAL(5, 2) DEFAULT 0,
        image_url TEXT,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        preparation_time INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES vendor_stores(id) ON DELETE CASCADE
      )
    `);
    logger.info('✓ Menu Items table ready');

    // Products Table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INT REFERENCES vendor_stores(id) ON DELETE CASCADE,
        vendor_id INT REFERENCES vendor_details(id) ON DELETE CASCADE,
        name VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        price NUMERIC(10, 2),
        original_price NUMERIC(10, 2),
        image_url TEXT,
        thumbnail_url TEXT,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        discount_percentage NUMERIC(5, 2) DEFAULT 0,
        requires_prescription BOOLEAN DEFAULT FALSE,
        is_available BOOLEAN DEFAULT TRUE,
        stock_quantity INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Products table ready');

    // Cart Table
    await query(`
      CREATE TABLE IF NOT EXISTS cart (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id),
        vendor_id INT REFERENCES vendor_details(id),
        quantity INT DEFAULT 1,
        special_instructions TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Cart table ready');

    // Orders Table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE,
        user_id INT REFERENCES users(id),
        vendor_id INT REFERENCES vendor_details(id),
        store_id INT REFERENCES vendor_stores(id),
        address_id INT REFERENCES addresses(id),
        delivery_address_id INT REFERENCES addresses(id),
        total_amount NUMERIC(10, 2),
        delivery_charge NUMERIC(10, 2),
        discount_amount NUMERIC(10, 2),
        final_amount NUMERIC(10, 2),
        status VARCHAR(50) DEFAULT 'pending',
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    logger.info('✓ Orders table ready');

    // Order Items Table
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id),
        quantity INT,
        price NUMERIC(10, 2)
      )
    `);
    logger.info('✓ Order Items table ready');

    // Migrate restaurant_id → store_id if needed (for existing databases)
    await query(`
      DO $$
      BEGIN
        -- menu_items: rename restaurant_id to store_id if store_id doesn't exist yet
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'menu_items' AND column_name = 'restaurant_id'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'menu_items' AND column_name = 'store_id'
        ) THEN
          ALTER TABLE menu_items RENAME COLUMN restaurant_id TO store_id;
        END IF;

        -- cart: rename or drop old restaurant_id
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'cart' AND column_name = 'restaurant_id'
        ) THEN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'cart' AND column_name = 'store_id'
          ) THEN
            ALTER TABLE cart RENAME COLUMN restaurant_id TO store_id;
          ELSE
            ALTER TABLE cart DROP COLUMN restaurant_id;
          END IF;
        END IF;

        -- orders: rename or drop old restaurant_id
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'orders' AND column_name = 'restaurant_id'
        ) THEN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'orders' AND column_name = 'store_id'
          ) THEN
            ALTER TABLE orders RENAME COLUMN restaurant_id TO store_id;
          ELSE
            ALTER TABLE orders DROP COLUMN restaurant_id;
          END IF;
        END IF;
      END
      $$;
    `);

    // Create indexes for better query performance
    await query(`CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile_number)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_cart_user ON cart(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`);
    await query(`DROP INDEX IF EXISTS idx_menu_restaurant`);
    await query(`CREATE INDEX IF NOT EXISTS idx_menu_store ON menu_items(store_id)`);
    logger.info('✓ Database indexes ready');

    logger.info('✓ Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

export default initializeDatabase;
