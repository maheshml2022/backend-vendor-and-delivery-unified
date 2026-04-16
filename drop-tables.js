/**
 * Drop all database tables
 * Clears old schema for fresh recreation
 */

import { query } from './src/config/database.js';
import logger from './src/utils/logger.js';

const dropAllTables = async () => {
  try {
    logger.info('Dropping all tables...');

    const dropQueries = [
      'DROP TABLE IF EXISTS products CASCADE',
      'DROP TABLE IF EXISTS order_items CASCADE',
      'DROP TABLE IF EXISTS orders CASCADE',
      'DROP TABLE IF EXISTS delivery_partners CASCADE',
      'DROP TABLE IF EXISTS cart CASCADE',
      'DROP TABLE IF EXISTS menu_items CASCADE',
      'DROP TABLE IF EXISTS vendor_stores CASCADE',
      'DROP TABLE IF EXISTS vendor_details CASCADE',
      'DROP TABLE IF EXISTS addresses CASCADE',
      'DROP TABLE IF EXISTS otps CASCADE',
      'DROP TABLE IF EXISTS users CASCADE'
    ];

    for (const dropQuery of dropQueries) {
      await query(dropQuery);
    }

    logger.info('✓ All tables dropped successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to drop tables:', error);
    process.exit(1);
  }
};

dropAllTables();
