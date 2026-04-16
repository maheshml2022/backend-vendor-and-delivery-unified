/**
 * Vendor Detail Repository
 * Data access for vendor business details
 */

import { query } from '../config/database.js';

/**
 * Get vendor details by user ID
 */
export const getByUserId = async (userId) => {
  const result = await query(
    `SELECT * FROM vendor_details WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
};

/**
 * Create vendor details
 */
export const create = async (userId, data) => {
  const result = await query(
    `INSERT INTO vendor_details (user_id, business_name, business_type)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, data.businessName || null, data.businessType || null]
  );
  return result.rows[0];
};

/**
 * Upsert vendor details (create or update)
 */
export const upsert = async (userId, data) => {
  const result = await query(
    `INSERT INTO vendor_details (user_id, business_name, business_type, gst_number, pan_number, bank_account_number, ifsc_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       business_name       = COALESCE(EXCLUDED.business_name, vendor_details.business_name),
       business_type       = COALESCE(EXCLUDED.business_type, vendor_details.business_type),
       gst_number          = COALESCE(EXCLUDED.gst_number, vendor_details.gst_number),
       pan_number          = COALESCE(EXCLUDED.pan_number, vendor_details.pan_number),
       bank_account_number = COALESCE(EXCLUDED.bank_account_number, vendor_details.bank_account_number),
       ifsc_code           = COALESCE(EXCLUDED.ifsc_code, vendor_details.ifsc_code),
       updated_at          = NOW()
     RETURNING *`,
    [userId, data.businessName, data.businessType, data.gstNumber, data.panNumber, data.bankAccountNumber, data.ifscCode]
  );
  return result.rows[0];
};
