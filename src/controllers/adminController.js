/**
 * Admin Controller
 * Handles admin panel operations - metrics, user management, reports
 */

import pool from '../config/database.js';
import logger from '../utils/logger.js';
import * as userService from '../services/userService.js';
import { validate, validateDeliveryPartner } from '../validators/index.js';

// ==================== DASHBOARD ====================

/**
 * Get Dashboard Metrics
 * Returns key metrics: customers, vendors, deliveries, revenue, orders
 */
export const getDashboardMetrics = async (req, res) => {
  try {
    // Run all queries in parallel for better performance
    const [
      customersResult,
      currentMonthCustomersResult,
      previousMonthCustomersResult,
      storesResult,
      currentMonthVendorsResult,
      previousMonthVendorsResult,
      ordersResult,
      currentMonthRevenueResult,
      previousMonthRevenueResult,
      deliveryPartnersResult,
      currentMonthDPResult,
      previousMonthDPResult,
      activeOrdersResult,
    ] = await Promise.all([
      // Total customers
      pool.query(`SELECT COUNT(*) as total FROM users WHERE role = 'customer'`),
      // Customers added this month
      pool.query(`
        SELECT COUNT(*) as total FROM users
        WHERE role = 'customer' AND created_at >= date_trunc('month', CURRENT_DATE)
      `),
      // Customers added last month
      pool.query(`
        SELECT COUNT(*) as total FROM users
        WHERE role = 'customer'
          AND created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          AND created_at < date_trunc('month', CURRENT_DATE)
      `),
      // Total vendor stores
      pool.query(`SELECT COUNT(*) as total FROM vendor_stores`),
      // Vendors added this month
      pool.query(`
        SELECT COUNT(*) as total FROM vendor_stores
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      `),
      // Vendors added last month
      pool.query(`
        SELECT COUNT(*) as total FROM vendor_stores
        WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          AND created_at < date_trunc('month', CURRENT_DATE)
      `),
      // Total orders + revenue
      pool.query(`
        SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM orders
      `),
      // Revenue this month
      pool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      `),
      // Revenue last month
      pool.query(`
        SELECT COALESCE(SUM(total_amount), 0) as revenue FROM orders
        WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          AND created_at < date_trunc('month', CURRENT_DATE)
      `),
      // Total delivery partners
      pool.query(`SELECT COUNT(*) as total FROM delivery_partners`),
      // Delivery partners added this month
      pool.query(`
        SELECT COUNT(*) as total FROM delivery_partners
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      `),
      // Delivery partners added last month
      pool.query(`
        SELECT COUNT(*) as total FROM delivery_partners
        WHERE created_at >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
          AND created_at < date_trunc('month', CURRENT_DATE)
      `),
      // Active orders (last 24 hours)
      pool.query(`
        SELECT COUNT(*) as total FROM orders
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        AND status NOT IN ('delivered', 'cancelled')
      `),
    ]);

    const totalCustomers = parseInt(customersResult.rows[0].total);
    const currentMonthCustomers = parseInt(currentMonthCustomersResult.rows[0].total);
    const previousMonthCustomers = parseInt(previousMonthCustomersResult.rows[0].total);

    const totalStores = parseInt(storesResult.rows[0].total);
    const currentMonthVendors = parseInt(currentMonthVendorsResult.rows[0].total);
    const previousMonthVendors = parseInt(previousMonthVendorsResult.rows[0].total);

    const totalOrders = parseInt(ordersResult.rows[0].total);
    const totalRevenue = parseFloat(ordersResult.rows[0].revenue);
    const currentMonthRevenue = parseFloat(currentMonthRevenueResult.rows[0].revenue);
    const previousMonthRevenue = parseFloat(previousMonthRevenueResult.rows[0].revenue);

    const totalDeliveryPartners = parseInt(deliveryPartnersResult.rows[0].total);
    const currentMonthDP = parseInt(currentMonthDPResult.rows[0].total);
    const previousMonthDP = parseInt(previousMonthDPResult.rows[0].total);

    const activeOrders = parseInt(activeOrdersResult.rows[0].total);

    res.json({
      success: true,
      data: {
        customers: {
          total: totalCustomers,
          current: currentMonthCustomers,
          previous: previousMonthCustomers,
        },
        vendors: {
          total: totalStores,
          current: currentMonthVendors,
          previous: previousMonthVendors,
        },
        deliveryPartners: {
          total: totalDeliveryPartners,
          current: currentMonthDP,
          previous: previousMonthDP,
        },
        revenue: {
          total: `₹${totalRevenue.toLocaleString('en-IN')}`,
          current: currentMonthRevenue,
          previous: previousMonthRevenue,
        },
        orders: {
          total: totalOrders,
          active: activeOrders,
        },
      }
    });
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard metrics',
      error: error.message
    });
  }
};

// ==================== USERS MANAGEMENT ====================

/**
 * Get All Users/Customers
 * Returns paginated list of users
 */
export const getAdminUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    const whereClauses = [`role = 'customer'`];
    const params = [];

    // Filter by status
    if (status) {
      params.push(status);
      whereClauses.push(`status = $${params.length}`);
    }

    // Search by name or email
    if (search) {
      params.push(`%${search}%`, `%${search}%`);
      whereClauses.push(`(full_name ILIKE $${params.length - 1} OR email ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM users WHERE ${whereSql}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const query = `SELECT id, mobile_number, email, full_name, profile_image_url, is_verified, is_active, status, role, created_at, updated_at, last_login
                   FROM users
                   WHERE ${whereSql}
                   ORDER BY created_at DESC
                   LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const result = await pool.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

/**
 * Update User By ID (Admin)
 */
export const updateAdminUser = async (req, res) => {
  try {
    const adminUserId = req.user.userId || req.user.id;
    const targetUserId = parseInt(req.params.id, 10);

    if (Number.isNaN(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user id'
      });
    }

    const updatedUser = await userService.updateUserByAdmin(
      adminUserId,
      req.user.role,
      targetUserId,
      req.body
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Error updating user by admin:', error);
    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Toggle User Status (active/blocked)
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

// ==================== VENDORS MANAGEMENT ====================

/**
 * Create Vendor Store (Admin)
 */
export const createAdminVendor = async (req, res) => {
  try {
    const { name, storeType, ownerName, businessName, description, deliveryTime, deliveryCharge, logoUrl, bannerUrl, latitude, longitude } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Store name is required' });
    }

    let vendorId = null;
    if (ownerName || businessName) {
      const vendorResult = await pool.query(
        `INSERT INTO vendor_details (vendor_name, business_name) VALUES ($1, $2) RETURNING id`,
        [ownerName || null, businessName || null]
      );
      vendorId = vendorResult.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO vendor_stores (name, store_type, vendor_id, description, delivery_time, delivery_charge, logo_url, banner_url, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, storeType || null, vendorId, description || null, deliveryTime || null, deliveryCharge || null, logoUrl || null, bannerUrl || null, latitude || null, longitude || null]
    );

    res.status(201).json({
      success: true,
      message: 'Vendor store created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to create vendor', error: error.message });
  }
};

/**
 * Get All Vendors/Stores
 */
export const getAdminVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT vs.id, vs.name, vs.store_type, vd.vendor_name as owner, vd.business_name, vs.approval_status as status, vs.created_at as created
                 FROM vendor_stores vs
                 LEFT JOIN vendor_details vd ON vs.vendor_id = vd.id`;
    const params = [];

    // Filter by status
    if (status) {
      query += ` WHERE vs.approval_status = $${params.length + 1}`;
      params.push(status);
    }

    // Search by name or vendor name
    if (search) {
      const whereClause = params.length > 0 ? ' AND ' : ' WHERE ';
      query += `${whereClause}(vs.name ILIKE $${params.length + 1} OR vd.vendor_name ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countResult = await pool.query(
      query.replace(/SELECT vs\.id.*?FROM/s, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    query += ` ORDER BY vs.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching vendors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors',
      error: error.message
    });
  }
};

/**
 * Get Vendor Store By ID
 */
export const getAdminVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT vs.id, vs.name, vs.store_type, vs.description, vs.rating, vs.delivery_time, vs.delivery_charge,
              vs.logo_url, vs.banner_url, vs.latitude, vs.longitude, vs.is_active, vs.approval_status,
              vd.vendor_name, vd.business_name, vd.business_type, vd.gst_number, vd.is_verified as vendor_verified,
              vs.created_at, vs.updated_at
       FROM vendor_stores vs
       LEFT JOIN vendor_details vd ON vs.vendor_id = vd.id
       WHERE vs.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching vendor by id:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor',
      error: error.message
    });
  }
};

/**
 * Approve Vendor
 */
export const approveVendor = async (req, res) => {
  console.log(req.params);
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE vendor_stores SET approval_status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: 'Vendor approved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error approving vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve vendor',
      error: error.message
    });
  }
};

/**
 * Reject Vendor
 */
export const rejectVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE vendor_stores SET approval_status = 'rejected', updated_at = NOW() 
       WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    res.json({
      success: true,
      message: 'Vendor rejected successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error rejecting vendor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject vendor',
      error: error.message
    });
  }
};

// ==================== ORDERS MANAGEMENT ====================

/**
 * Get All Orders
 */
export const getAdminOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `SELECT o.id, o.order_number, u.full_name as customer_name, 
                     r.name as store_name, o.total_amount as amount, 
                     o.status, o.created_at,
                     dp.name as delivery_partner_name
                     FROM orders o
                     JOIN users u ON o.user_id = u.id
                     JOIN vendor_stores r ON o.store_id = r.id
                     LEFT JOIN delivery_assignments da ON da.order_id = o.id
                     LEFT JOIN delivery_partners dp ON da.delivery_partner_id = dp.id`;
    const params = [];

    // Filter by status
    if (status) {
      baseQuery += ` WHERE o.status = $${params.length + 1}`;
      params.push(status);
    }

    // Search by order number or customer name
    if (search) {
      const whereClause = params.length > 0 ? ' AND ' : ' WHERE ';
      baseQuery += `${whereClause}(o.order_number ILIKE $${params.length + 1} OR u.full_name ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countQuery = baseQuery.replace(
      `SELECT o.id, o.order_number, u.full_name as customer_name, 
                     r.name as store_name, o.total_amount as amount, 
                     o.status, o.created_at,
                     dp.name as delivery_partner_name`,
      `SELECT COUNT(*) as total`
    );
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results - ordered by id DESC
    const query = baseQuery + ` ORDER BY o.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const paginatedParams = [...params, limit, offset];

    const result = await pool.query(query, paginatedParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

/**
 * Get Order Detail by ID
 */
export const getAdminOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await pool.query(
      `SELECT o.id, o.order_number, o.user_id, u.full_name as customer_name, u.mobile_number as customer_phone,
              o.store_id, vs.name as store_name, o.vendor_id,
              o.total_amount, o.delivery_charge, o.discount_amount, o.final_amount,
              o.status, o.payment_method, o.created_at, o.completed_at,
              a.address_line1, a.address_line2, a.city, a.postal_code
       FROM orders o
       JOIN users u ON o.user_id = u.id
       LEFT JOIN vendor_stores vs ON o.store_id = vs.id
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const itemsResult = await pool.query(
      `SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, oi.price
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...orderResult.rows[0],
        items: itemsResult.rows
      }
    });
  } catch (error) {
    logger.error('Error fetching order detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order detail',
      error: error.message
    });
  }
};

// ==================== REPORTS & ANALYTICS ====================

/**
 * Get Orders Report
 */
export const getOrdersReport = async (req, res) => {
  try {
    const { startDate, endDate, granularity = 'daily' } = req.query;

    // Daily orders trend
    const dailyOrdersResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate, endDate]);

    // Order status distribution
    const statusDistResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
      GROUP BY status
    `, [startDate, endDate]);

    // Summary metrics
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        AVG(total_amount) as avg_order_value
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2
    `, [startDate, endDate]);

    const summary = summaryResult.rows[0];

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders: parseInt(summary.total_orders),
          completedOrders: parseInt(summary.completed_orders),
          cancelledOrders: parseInt(summary.cancelled_orders),
          avgOrderValue: parseFloat(summary.avg_order_value || 0).toFixed(2)
        },
        dailyOrders: dailyOrdersResult.rows.map(row => ({
          date: row.date.toISOString().split('T')[0],
          orders: parseInt(row.orders)
        })),
        statusDistribution: statusDistResult.rows.map(row => ({
          status: row.status,
          count: parseInt(row.count)
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching orders report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders report',
      error: error.message
    });
  }
};

/**
 * Get Revenue Report
 */
export const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Daily revenue trend
    const dailyRevenueResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'delivered'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [startDate, endDate]);

    // Revenue by category (store)
    const byCategoryResult = await pool.query(`
      SELECT 
        r.name as name,
        SUM(o.total_amount) as value
      FROM orders o
      JOIN vendor_stores r ON o.store_id = r.id
      WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'delivered'
      GROUP BY r.id, r.name
      ORDER BY value DESC
      LIMIT 5
    `, [startDate, endDate]);

    // Summary
    const summaryResult = await pool.query(`
      SELECT 
        SUM(total_amount) as total_revenue,
        SUM(total_amount) * 0.1 as commission,
        SUM(total_amount) * 0.9 as vendor_payouts
      FROM orders
      WHERE created_at >= $1 AND created_at <= $2 AND status = 'delivered'
    `, [startDate, endDate]);

    const summary = summaryResult.rows[0];
    const totalRevenue = parseFloat(summary.total_revenue || 0);
    const commission = parseFloat(summary.commission || 0);

    // Top vendors
    const topVendorsResult = await pool.query(`
      SELECT 
        r.id,
        r.name,
        COUNT(o.id) as orders,
        SUM(o.total_amount) as revenue
      FROM orders o
      JOIN vendor_stores r ON o.store_id = r.id
      WHERE o.created_at >= $1 AND o.created_at <= $2 AND o.status = 'delivered'
      GROUP BY r.id, r.name
      ORDER BY revenue DESC
      LIMIT 5
    `, [startDate, endDate]);

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: Math.round(totalRevenue),
          commission: Math.round(commission),
          vendorPayouts: Math.round(totalRevenue * 0.9),
          netRevenue: Math.round(commission)
        },
        dailyRevenue: dailyRevenueResult.rows.map(row => ({
          date: row.date.toISOString().split('T')[0],
          revenue: parseInt(row.revenue || 0)
        })),
        revenueByCategory: byCategoryResult.rows.map(row => ({
          name: row.name,
          value: parseInt(row.value || 0)
        })),
        topVendors: topVendorsResult.rows.map(row => ({
          id: row.id,
          name: row.name,
          orders: parseInt(row.orders),
          revenue: parseInt(row.revenue || 0),
          commission: Math.round(parseInt(row.revenue || 0) * 0.1)
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching revenue report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue report',
      error: error.message
    });
  }
};

// ==================== DELIVERY PARTNERS MANAGEMENT ====================

/**
 * Get Pending Delivery Partners
 */
export const getPendingDeliveryPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, name, mobile_number as mobile, email,
              vehicle_type || ' (' || COALESCE(vehicle_number, '') || ')' AS vehicle,
              rating, total_deliveries, status, is_available,
              COALESCE(approval_status, 'pending') AS approval_status,
              created_at
       FROM delivery_partners
       WHERE COALESCE(approval_status, 'pending') = 'pending'
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM delivery_partners
       WHERE COALESCE(approval_status, 'pending') = 'pending'`
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching pending delivery partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending delivery partners',
      error: error.message
    });
  }
};

/**
 * Get All Delivery Partners
 */
export const getAllDeliveryPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `SELECT id, name, mobile_number as mobile, email,
     vehicle_type || ' (' || vehicle_number || ')' AS vehicle, 
     rating, total_deliveries, status, is_available,
     COALESCE(approval_status, 'approved') AS approval_status
     FROM delivery_partners`;
    const params = [];

    // Filter by status or approval_status
    if (status) {
      const approvalStatuses = ['pending', 'approved', 'rejected'];
      if (approvalStatuses.includes(status)) {
        query += ` WHERE COALESCE(approval_status, 'approved') = $${params.length + 1}`;
      } else {
        query += ` WHERE status = $${params.length + 1}`;
      }
      params.push(status);
    }

    // Search by name or mobile number
    if (search) {
      const whereClause = params.length > 0 ? ' AND ' : ' WHERE ';
      query += `${whereClause}(name ILIKE $${params.length + 1} OR mobile_number ILIKE $${params.length + 2})`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countResult = await pool.query(
      query.replace(/SELECT .+? FROM/s, 'SELECT COUNT(*) as total FROM'),
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching delivery partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery partners',
      error: error.message
    });
  }
};

/**
 * Get Delivery Partner by ID
 */
export const getDeliveryPartnerById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, mobile_number, email, vehicle_type, vehicle_number,
              rating, total_deliveries, status, is_available,
              latitude, longitude, created_at
       FROM delivery_partners WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error fetching delivery partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delivery partner',
      error: error.message
    });
  }
};

/**
 * Create New Delivery Partner
 */
export const createDeliveryPartner = async (req, res) => {
  try {
    const { error, value } = validate(validateDeliveryPartner, req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        error: error.details
      });
    }

    const {
      name,
      mobile_number,
      email,
      vehicle_type,
      vehicle_number,
      latitude,
      longitude
    } = value;

    const result = await pool.query(
      `INSERT INTO delivery_partners 
       (name, mobile_number, email, vehicle_type, vehicle_number, rating, total_deliveries, status, is_available, approval_status, latitude, longitude)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number,
                 rating, total_deliveries, status, is_available, approval_status,
                 latitude, longitude, created_at`,
      [name, mobile_number, email || null, vehicle_type, vehicle_number, 5.0, 0, 'active', true, 'pending', latitude || null, longitude || null]
    );

    res.status(201).json({
      success: true,
      message: 'Delivery partner created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating delivery partner:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        message: 'Mobile number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create delivery partner',
      error: error.message
    });
  }
};

/**
 * Update Delivery Partner
 */
export const updateDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      vehicle_type,
      vehicle_number,
      status,
      is_available,
      latitude,
      longitude
    } = req.body;

    // Build dynamic update query
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      fields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (vehicle_type !== undefined) {
      fields.push(`vehicle_type = $${paramCount++}`);
      values.push(vehicle_type);
    }
    if (vehicle_number !== undefined) {
      fields.push(`vehicle_number = $${paramCount++}`);
      values.push(vehicle_number);
    }
    if (status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (is_available !== undefined) {
      fields.push(`is_available = $${paramCount++}`);
      values.push(is_available);
    }
    if (latitude !== undefined) {
      fields.push(`latitude = $${paramCount++}`);
      values.push(latitude);
    }
    if (longitude !== undefined) {
      fields.push(`longitude = $${paramCount++}`);
      values.push(longitude);
    }

    values.push(id);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const result = await pool.query(
      `UPDATE delivery_partners 
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number,
                 rating, total_deliveries, status, is_available,
                 latitude, longitude, created_at`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery partner updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating delivery partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery partner',
      error: error.message
    });
  }
};

/**
 * Toggle Delivery Partner Status
 */
export const toggleDeliveryPartnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Allowed values: active, inactive, suspended'
      });
    }

    const result = await pool.query(
      `UPDATE delivery_partners 
       SET status = $1
       WHERE id = $2
       RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number,
                 rating, total_deliveries, status, is_available,
                 latitude, longitude, created_at`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery partner status updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating delivery partner status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery partner status',
      error: error.message
    });
  }
};

/**
 * Toggle Delivery Partner Availability
 */
export const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_available } = req.body;

    if (is_available === undefined) {
      return res.status(400).json({
        success: false,
        message: 'is_available field is required'
      });
    }

    const result = await pool.query(
      `UPDATE delivery_partners 
       SET is_available = $1
       WHERE id = $2
       RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number,
                 rating, total_deliveries, status, is_available,
                 latitude, longitude, created_at`,
      [is_available, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery partner availability updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating delivery partner availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery partner availability',
      error: error.message
    });
  }
};

/**
 * Delete Delivery Partner
 */
export const deleteDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM delivery_partners WHERE id = $1 RETURNING id, name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery partner deleted successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error deleting delivery partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete delivery partner',
      error: error.message
    });
  }
};

/**
 * Approve Delivery Partner
 */
export const approveDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE delivery_partners SET approval_status = 'approved' WHERE id = $1
       RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number,
                 rating, total_deliveries, status, is_available, approval_status,
                 latitude, longitude, created_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery partner approved successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error approving delivery partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve delivery partner',
      error: error.message
    });
  }
};

/**
 * Reject Delivery Partner
 */
export const rejectDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE delivery_partners SET approval_status = 'rejected' WHERE id = $1
       RETURNING id, name, mobile_number, email, vehicle_type, vehicle_number,
                 rating, total_deliveries, status, is_available, approval_status,
                 latitude, longitude, created_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Delivery partner not found'
      });
    }

    res.json({
      success: true,
      message: 'Delivery partner rejected successfully',
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error rejecting delivery partner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject delivery partner',
      error: error.message
    });
  }
};

/**
 * Get Available Delivery Partners
 */
export const getAvailableDeliveryPartners = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, name, mobile_number, email, vehicle_type, vehicle_number,
              rating, total_deliveries, status, is_available,
              latitude, longitude, created_at
       FROM delivery_partners 
       WHERE is_available = TRUE AND status = 'active'
       ORDER BY rating DESC, total_deliveries DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM delivery_partners 
       WHERE is_available = TRUE AND status = 'active'`
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching available delivery partners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available delivery partners',
      error: error.message
    });
  }
};
