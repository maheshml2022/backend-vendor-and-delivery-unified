/**
 * Extended Database Initialization
 * Additional tables for Customer, Vendor, and Delivery modules
 * Runs AFTER the core admin init to add module-specific schema extensions
 */

import { query } from '../config/database.js';
import logger from '../utils/logger.js';

const DUMMY_IMAGES = {
  food: 'https://placehold.co/1200x360/FF6A00/FFFFFF?text=DailyBox+Food',
  grocery: 'https://placehold.co/1200x360/2ECC71/FFFFFF?text=DailyBox+Grocery',
  vegetables: 'https://placehold.co/1200x360/4CAF50/FFFFFF?text=DailyBox+Vegetables',
  pharmacy: 'https://placehold.co/1200x360/1976D2/FFFFFF?text=DailyBox+Pharmacy'
};

const getDummyImageUrl = (domain) => {
  const normalized = (domain || 'grocery').toString().trim().toLowerCase();
  return DUMMY_IMAGES[normalized] || DUMMY_IMAGES.grocery;
};

/**
 * Initialize module-specific database tables and columns
 */
export const initializeModuleTables = async () => {
  try {
    logger.info('Initializing module-specific tables...');

    // ── Vendor Stores: add city, opening/closing time columns ──────────────
    await query(`ALTER TABLE vendor_stores ADD COLUMN IF NOT EXISTS city VARCHAR(100) NOT NULL DEFAULT ''`);
    await query(`ALTER TABLE vendor_stores ADD COLUMN IF NOT EXISTS opening_time VARCHAR(20)`);
    await query(`ALTER TABLE vendor_stores ADD COLUMN IF NOT EXISTS closing_time VARCHAR(20)`);
    logger.info('✓ Vendor Stores columns extended');

    // ── OTPs: add attempt_count if missing ─────────────────────────────────
    await query(`ALTER TABLE otps ADD COLUMN IF NOT EXISTS attempt_count INT DEFAULT 0`);
    logger.info('✓ OTPs table extended');

    // ── Products: add domain and unit columns for catalog support ──────────
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS domain VARCHAR(50)`);
    await query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50)`);
    logger.info('✓ Products table extended for catalog');

    // ── Cart: add catalog columns for multi-domain cart ────────────────────
    await query(`ALTER TABLE cart ADD COLUMN IF NOT EXISTS store_id INT`);
    await query(`ALTER TABLE cart ADD COLUMN IF NOT EXISTS menu_item_id INT`);
    await query(`ALTER TABLE cart ADD COLUMN IF NOT EXISTS catalog_item_id INT`);
    await query(`ALTER TABLE cart ADD COLUMN IF NOT EXISTS catalog_type VARCHAR(50)`);
    await query(`ALTER TABLE cart ADD COLUMN IF NOT EXISTS catalog_store_id INT`);
    logger.info('✓ Cart table extended for catalog');

    // ── Orders: add catalog columns for multi-domain orders ────────────────
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS store_id INT`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS catalog_type VARCHAR(50)`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS catalog_store_id INT`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    await query(`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_partner_id INT REFERENCES delivery_partners(id)`);
    logger.info('✓ Orders table extended for catalog');

    // ── Order Items: add catalog columns ───────────────────────────────────
    await query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS menu_item_id INT`);
    await query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS catalog_item_id INT`);
    await query(`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS special_instructions TEXT`);
    logger.info('✓ Order Items table extended');

    // ── Product Images Table ───────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id         SERIAL PRIMARY KEY,
        product_id INT     REFERENCES products(id) ON DELETE CASCADE,
        image_url  TEXT    NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Product Images table ready');

    // ── Reviews Table (product-level reviews) ──────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id            SERIAL PRIMARY KEY,
        product_id    INT       REFERENCES products(id) ON DELETE CASCADE,
        store_id      INT       REFERENCES vendor_stores(id) ON DELETE CASCADE,
        user_id       INT       REFERENCES users(id) ON DELETE CASCADE,
        rating        INT       CHECK (rating BETWEEN 1 AND 5),
        comment       TEXT,
        vendor_reply  TEXT,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Reviews table ready');

    // ── Menu Item Reviews Table ────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS menu_item_reviews (
        id           SERIAL PRIMARY KEY,
        menu_item_id INT       REFERENCES menu_items(id) ON DELETE CASCADE,
        user_id      INT       REFERENCES users(id) ON DELETE CASCADE,
        rating       INT       CHECK (rating BETWEEN 1 AND 5),
        comment      TEXT,
        created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(menu_item_id, user_id)
      )
    `);
    logger.info('✓ Menu Item Reviews table ready');

    // ── Store Reviews Table ─────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS store_reviews (
        id         SERIAL PRIMARY KEY,
        store_id   INT       REFERENCES vendor_stores(id) ON DELETE CASCADE,
        user_id    INT       REFERENCES users(id) ON DELETE CASCADE,
        rating     INT       CHECK (rating BETWEEN 1 AND 5),
        comment    TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, user_id)
      )
    `);
    logger.info('✓ Store Reviews table ready');

    // ── Delivery Assignments Table ─────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS delivery_assignments (
        id                  SERIAL PRIMARY KEY,
        order_id            INT         NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        delivery_partner_id INT         REFERENCES delivery_partners(id),
        status              VARCHAR(50) DEFAULT 'assigned',
        assigned_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
        accepted_at         TIMESTAMP,
        picked_up_at        TIMESTAMP,
        delivered_at        TIMESTAMP,
        cancellation_reason TEXT
      )
    `);
    logger.info('✓ Delivery Assignments table ready');

    // ── Payments Table ─────────────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS payments (
        id             SERIAL PRIMARY KEY,
        order_id       INT          REFERENCES orders(id) ON DELETE CASCADE,
        amount         NUMERIC(10,2),
        payment_method VARCHAR(50),
        status         VARCHAR(50)  DEFAULT 'pending',
        transaction_id VARCHAR(255),
        created_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
        updated_at     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Ensure transaction_id column exists
    await query(`
      ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)
    `);
    
    logger.info('✓ Payments table ready');

    // ── Vendor Payouts Table ───────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS vendor_payouts (
        id            SERIAL PRIMARY KEY,
        vendor_id     INT          REFERENCES users(id),
        total_orders  INT,
        total_amount  NUMERIC(10,2),
        payout_amount NUMERIC(10,2),
        payout_status VARCHAR(50)  DEFAULT 'pending',
        payout_date   TIMESTAMP,
        created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Vendor Payouts table ready');

    // ── Delivery Earnings Table ────────────────────────────────────────────
    await query(`
      CREATE TABLE IF NOT EXISTS delivery_earnings (
        id                  SERIAL PRIMARY KEY,
        delivery_partner_id INT          REFERENCES delivery_partners(id),
        order_id            INT          REFERENCES orders(id),
        amount              NUMERIC(10,2),
        status              VARCHAR(50)  DEFAULT 'pending',
        settled_at          TIMESTAMP,
        created_at          TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('✓ Delivery Earnings table ready');

    // ── Additional Indexes ─────────────────────────────────────────────────
    await query(`CREATE INDEX IF NOT EXISTS idx_users_role              ON users(role)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_addresses_user          ON addresses(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_vendor_details_user     ON vendor_details(user_id)`);

    // Populate domain from category for any products missing domain
    await query(`UPDATE products SET domain = LOWER(category) WHERE domain IS NULL AND category IS NOT NULL`);

    // Backfill empty images with remote dummy URLs
    for (const domain of ['food', 'grocery', 'vegetables', 'pharmacy']) {
      await query(
        `UPDATE products
         SET image_url = $1
         WHERE domain = $2 AND (image_url IS NULL OR BTRIM(image_url) = '')`,
        [getDummyImageUrl(domain), domain]
      );
    }

    for (const storeType of ['food', 'grocery', 'vegetables', 'pharmacy']) {
      await query(
        `UPDATE vendor_stores
         SET logo_url = $1
         WHERE store_type = $2 AND (logo_url IS NULL OR BTRIM(logo_url) = '')`,
        [getDummyImageUrl(storeType), storeType]
      );

      await query(
        `UPDATE vendor_stores
         SET banner_url = $1
         WHERE store_type = $2 AND (banner_url IS NULL OR BTRIM(banner_url) = '')`,
        [getDummyImageUrl(storeType), storeType]
      );
    }

    await query(`CREATE INDEX IF NOT EXISTS idx_stores_vendor           ON vendor_stores(vendor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_stores_city             ON vendor_stores(city)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_store          ON products(store_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_vendor         ON products(vendor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_products_domain         ON products(domain)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_vendor           ON orders(vendor_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_store            ON orders(store_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_order_items_order       ON order_items(order_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_product         ON reviews(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_reviews_user            ON reviews(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_menu_reviews_item       ON menu_item_reviews(menu_item_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_delivery_assign_order   ON delivery_assignments(order_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_delivery_assign_partner ON delivery_assignments(delivery_partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_payments_order          ON payments(order_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_delivery_earnings_partner ON delivery_earnings(delivery_partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_product_images_product  ON product_images(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_store_reviews_store     ON store_reviews(store_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_store_reviews_user      ON store_reviews(user_id)`);
    
    // ── Alerts Module Indexes ────────────────────────────────────────────
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_delivery_partner ON orders(delivery_partner_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_payments_status         ON payments(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_vendor_stores_is_active ON vendor_stores(is_active)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_delivery_assign_status  ON delivery_assignments(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_orders_user             ON orders(user_id)`);
    logger.info('✓ Module indexes ready');

    logger.info('✓ Module database initialization completed');
  } catch (error) {
    logger.error('Module database initialization failed:', error);
    throw error;
  }
};

export default initializeModuleTables;
