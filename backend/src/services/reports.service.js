const { query } = require('../config/database');

/**
 * Dashboard summary stats
 */
const getDashboardStats = async () => {
  const [vendors, rfqs, approvals, pos, invoices, spending] = await Promise.all([
    query(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'active') AS active,
      COUNT(*) FILTER (WHERE status = 'pending') AS pending
      FROM vendors`),

    query(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'active') AS active,
      COUNT(*) FILTER (WHERE status = 'draft') AS draft,
      COUNT(*) FILTER (WHERE status = 'completed') AS completed,
      COUNT(*) FILTER (WHERE deadline < NOW() AND status NOT IN ('completed','cancelled')) AS overdue
      FROM rfqs`),

    query(`SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'pending') AS pending FROM approvals`),

    query(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'approved') AS approved,
      COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval,
      COALESCE(SUM(grand_total),0) AS total_value
      FROM purchase_orders`),

    query(`SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = 'paid') AS paid,
      COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
      COALESCE(SUM(grand_total), 0) AS total_value,
      COALESCE(SUM(paid_amount), 0) AS paid_amount
      FROM invoices`),

    query(`SELECT COALESCE(SUM(grand_total), 0) AS total_spend FROM purchase_orders WHERE status != 'cancelled'`),
  ]);

  return {
    vendors: vendors.rows[0],
    rfqs: rfqs.rows[0],
    approvals: approvals.rows[0],
    purchaseOrders: pos.rows[0],
    invoices: invoices.rows[0],
    totalProcurementSpend: spending.rows[0].total_spend,
  };
};

/**
 * Monthly spend trend (last 6 months)
 */
const getMonthlySpendTrend = async (months = 6) => {
  const result = await query(`
    SELECT
      TO_CHAR(DATE_TRUNC('month', order_date), 'Mon YYYY') AS month,
      DATE_TRUNC('month', order_date) AS month_date,
      COALESCE(SUM(grand_total), 0) AS spend,
      COUNT(*) AS order_count
    FROM purchase_orders
    WHERE order_date >= DATE_TRUNC('month', NOW()) - INTERVAL '${months - 1} months'
      AND status != 'cancelled'
    GROUP BY DATE_TRUNC('month', order_date)
    ORDER BY month_date ASC
  `);
  return result.rows;
};

/**
 * Spend by category
 */
const getSpendByCategory = async () => {
  const result = await query(`
    SELECT
      r.category,
      COALESCE(SUM(po.grand_total), 0) AS spend,
      COUNT(po.id) AS order_count
    FROM purchase_orders po
    JOIN rfqs r ON po.rfq_id = r.id
    WHERE po.status != 'cancelled'
    GROUP BY r.category
    ORDER BY spend DESC
  `);
  return result.rows;
};

/**
 * Top vendors by spend
 */
const getTopVendors = async (limit = 5) => {
  const result = await query(`
    SELECT
      v.id, v.name, v.vendor_code, v.category, v.rating,
      COALESCE(SUM(po.grand_total), 0) AS total_spend,
      COUNT(po.id) AS order_count,
      COUNT(DISTINCT q.rfq_id) AS rfqs_responded
    FROM vendors v
    LEFT JOIN purchase_orders po ON po.vendor_id = v.id AND po.status != 'cancelled'
    LEFT JOIN quotations q ON q.vendor_id = v.id
    GROUP BY v.id
    ORDER BY total_spend DESC
    LIMIT $1
  `, [limit]);
  return result.rows;
};

/**
 * Vendor performance analytics
 */
const getVendorPerformance = async () => {
  const result = await query(`
    SELECT
      v.id, v.name, v.vendor_code, v.category, v.rating,
      v.total_orders,
      COALESCE(SUM(po.grand_total), 0) AS total_spend,
      COUNT(DISTINCT q.rfq_id) AS rfqs_participated,
      COUNT(DISTINCT q.id) AS quotations_submitted,
      COUNT(DISTINCT po.id) AS pos_received,
      COALESCE(AVG(q.delivery_days), 0) AS avg_delivery_days
    FROM vendors v
    LEFT JOIN quotations q ON q.vendor_id = v.id
    LEFT JOIN purchase_orders po ON po.vendor_id = v.id AND po.status != 'cancelled'
    GROUP BY v.id
    ORDER BY total_spend DESC
  `);
  return result.rows;
};

/**
 * Procurement statistics
 */
const getProcurementStats = async () => {
  const [rfqStats, quotationStats, poStats] = await Promise.all([
    query(`
      SELECT
        COUNT(*) AS total_rfqs,
        COUNT(*) FILTER (WHERE status = 'active') AS active_rfqs,
        COUNT(*) FILTER (WHERE deadline < NOW() AND status NOT IN ('completed','cancelled')) AS overdue_rfqs,
        COALESCE(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/86400), 0) AS avg_rfq_duration_days
      FROM rfqs
    `),

    query(`
      SELECT
        COUNT(*) AS total_quotations,
        COUNT(DISTINCT rfq_id) AS rfqs_with_quotations,
        COALESCE(AVG(total_amount), 0) AS avg_quotation_value,
        COALESCE(MIN(total_amount), 0) AS min_quotation_value,
        COALESCE(MAX(total_amount), 0) AS max_quotation_value
      FROM quotations WHERE status != 'draft'
    `),

    query(`
      SELECT
        COUNT(*) AS total_pos,
        COALESCE(SUM(grand_total), 0) AS total_po_value,
        COALESCE(AVG(grand_total), 0) AS avg_po_value,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed_pos
      FROM purchase_orders
    `),
  ]);

  return {
    rfq: rfqStats.rows[0],
    quotation: quotationStats.rows[0],
    purchaseOrders: poStats.rows[0],
  };
};

/**
 * Spending summary (full report)
 */
const getSpendingSummary = async (fromDate, toDate) => {
  const dateFilter = fromDate && toDate
    ? `AND order_date BETWEEN '${fromDate}' AND '${toDate}'`
    : '';

  const result = await query(`
    SELECT
      COALESCE(SUM(grand_total), 0) AS total_spend,
      COALESCE(SUM(tax_amount), 0) AS total_tax,
      COALESCE(SUM(shipping), 0) AS total_shipping,
      COUNT(*) AS total_orders,
      COALESCE(AVG(grand_total), 0) AS avg_order_value,
      COALESCE(MAX(grand_total), 0) AS largest_order
    FROM purchase_orders
    WHERE status != 'cancelled' ${dateFilter}
  `);

  return result.rows[0];
};

module.exports = {
  getDashboardStats,
  getMonthlySpendTrend,
  getSpendByCategory,
  getTopVendors,
  getVendorPerformance,
  getProcurementStats,
  getSpendingSummary,
};
