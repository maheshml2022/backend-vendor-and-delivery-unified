/**
 * Admin Migration Script
 * Adds username column and sets admin credentials with bcrypt-hashed password.
 * 
 * Usage: node src/db/migrate-admin.js
 */

import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ERROR: Set ADMIN_PASSWORD in .env before running migration');
  process.exit(1);
}

async function migrateAdmin() {
  try {
    // 1. Add username column if missing
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'username'
        ) THEN
          ALTER TABLE users ADD COLUMN username VARCHAR(100) UNIQUE;
        END IF;
      END $$;
    `);
    console.log('✓ username column ensured');

    // 2. Hash the password with bcrypt
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    console.log('✓ Password hashed');

    // 3. Update admin user
    const result = await query(
      `UPDATE users
       SET username = $1, password_hash = $2
       WHERE role = 'admin'
       RETURNING id, username, role`,
      [ADMIN_USERNAME, passwordHash]
    );

    if (result.rowCount === 0) {
      console.log('⚠ No admin user found. Creating one...');
      await query(
        `INSERT INTO users (mobile_number, username, email, password_hash, full_name, is_verified, status, role)
         VALUES ($1, $2, $3, $4, $5, true, 'active', 'admin')`,
        ['9999999990', ADMIN_USERNAME, 'admin@dailybox.com', passwordHash, 'Admin User']
      );
      console.log('✓ Admin user created');
    } else {
      console.log(`✓ Updated ${result.rowCount} admin user(s):`, result.rows);
    }

    console.log('\n✅ Migration complete!');
    console.log(`   Username: ${ADMIN_USERNAME}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migrateAdmin();
