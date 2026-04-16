/**
 * User Repository
 * Database queries for user management
 */

import { query, transaction } from '../config/database.js';

/**
 * Find user by mobile number
 */
export const findUserByMobile = async (mobileNumber) => {
  const result = await query(
    'SELECT * FROM users WHERE mobile_number = $1',
    [mobileNumber]
  );
  return result.rows[0];
};

/**
 * Find user by ID
 */
export const findUserById = async (userId) => {
  const result = await query(
    'SELECT id, mobile_number, email, full_name, profile_image_url, is_verified, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
};

/**
 * Find user auth details by ID
 */
export const findUserAuthById = async (userId) => {
  const result = await query(
    'SELECT id, mobile_number, password_hash FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0];
};

/**
 * Find user by username
 */
export const findUserByUsername = async (username) => {
  const result = await query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};

/**
 * Find user by email
 */
export const findUserByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

/**
 * Create new user
 */
export const createUser = async (mobileNumber, email, fullName, passwordHash) => {
  const result = await query(
    `INSERT INTO users (mobile_number, email, full_name, password_hash, is_verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, mobile_number, email, full_name, created_at`,
    [mobileNumber, email || null, fullName, passwordHash, false]
  );
  return result.rows[0];
};

/**
 * Update user verification status
 */
export const updateUserVerification = async (userId) => {
  const result = await query(
    'UPDATE users SET is_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
    [userId]
  );
  return result.rows[0];
};

/**
 * Update user last login
 */
export const updateUserLastLogin = async (userId) => {
  const result = await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id',
    [userId]
  );
  return result.rows[0];
};

/**
 * Update user password
 */
export const updateUserPassword = async (userId, passwordHash, password) => {
  const result = await query(
    'UPDATE users SET password_hash = $1, password = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id',
    [passwordHash, password, userId]
  );
  return result.rows[0];
};

/**
 * Update user profile
 */
export const updateUserProfile = async (userId, fullName, email, profileImageUrl) => {
  const result = await query(
    `UPDATE users SET full_name = $1, email = $2, profile_image_url = $3, 
     updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, mobile_number, email, full_name, profile_image_url`,
    [fullName, email, profileImageUrl, userId]
  );
  return result.rows[0];
};

/**
 * Get all users (admin)
 */
export const getAllUsers = async (limit = 10, offset = 0) => {
  const result = await query(
    `SELECT id, mobile_number, email, full_name, is_verified, is_active, created_at 
     FROM users LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
};

/**
 * Count total users
 */
export const countUsers = async () => {
  const result = await query('SELECT COUNT(*) FROM users');
  return parseInt(result.rows[0].count);
};

/**
 * Check if user is admin
 */
export const isUserAdmin = async (userId) => {
  const result = await query(
    'SELECT role FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    return false;
  }

  return result.rows[0].role === 'admin';
};

/**
 * Admin update user by ID
 */
export const updateUserByAdmin = async (userId, updateData) => {
  const fields = [];
  const values = [];
  let index = 1;

  for (const [column, value] of Object.entries(updateData)) {
    fields.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(userId);

  const result = await query(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${index}
     RETURNING id, mobile_number, email, full_name, profile_image_url, is_verified, is_active, status, role, created_at, updated_at, last_login`,
    values
  );

  return result.rows[0];
};

export default {
  findUserByMobile,
  findUserById,
  findUserAuthById,
  findUserByEmail,
  createUser,
  updateUserVerification,
  updateUserLastLogin,
  updateUserPassword,
  updateUserProfile,
  getAllUsers,
  countUsers,
  isUserAdmin,
  updateUserByAdmin
};
