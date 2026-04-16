/**
 * Vendor Dashboard Service
 * Business logic for vendor dashboard metrics
 */

import { query } from '../../../config/database.js';
import * as reviewRepo from '../../../models/reviewRepository.js';

export const getDashboard = async (vendorId) => {
  const [pendingRes, activeRes, totalRes, earningsRes, topItemsRes] = await Promise.all([
    query(`SELECT COUNT(*) FROM orders WHERE vendor_id = $1 AND status = 'pending'`, [vendorId]),
    query(`SELECT COUNT(*) FROM orders WHERE vendor_id = $1 AND status IN ('accepted','preparing','ready')`, [vendorId]),
    query(`SELECT COUNT(*) FROM orders WHERE vendor_id = $1`, [vendorId]),
    query(`SELECT COALESCE(SUM(final_amount), 0) as earnings FROM orders WHERE vendor_id = $1 AND DATE(created_at) = CURRENT_DATE`, [vendorId]),
    query(`
      SELECT p.name, COUNT(*) as count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.vendor_id = $1
      GROUP BY p.name ORDER BY count DESC LIMIT 5
    `, [vendorId])
  ]);

  const averageRating = await reviewRepo.getVendorAverageRating(vendorId);

  const recentOrders = await query(
    `SELECT o.*,
       json_agg(json_build_object('id', oi.id, 'product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price)) as items
     FROM orders o
     LEFT JOIN order_items oi ON o.id = oi.order_id
     WHERE o.vendor_id = $1
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT 5`,
    [vendorId]
  );

  return {
    pendingOrders: parseInt(pendingRes.rows[0].count),
    activeOrders: parseInt(activeRes.rows[0].count),
    totalOrders: parseInt(totalRes.rows[0].count),
    todayEarnings: parseFloat(earningsRes.rows[0].earnings),
    averageRating: parseFloat(averageRating) || 0,
    topItems: topItemsRes.rows.map(r => ({ name: r.name, count: parseInt(r.count) })),
    recentOrders: recentOrders.rows.map(o => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      finalAmount: parseFloat(o.final_amount) || 0,
      createdAt: o.created_at,
      items: o.items || []
    }))
  };
};
