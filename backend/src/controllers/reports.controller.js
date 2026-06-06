const reportsService = require('../services/reports.service');
const { success } = require('../utils/apiResponse');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await reportsService.getDashboardStats();
    return success(res, stats);
  } catch (err) { next(err); }
};

const getSpendingReport = async (req, res, next) => {
  try {
    const fromDate = req.query.fromDate || null;
    const toDate = req.query.toDate || null;
    const report = await reportsService.getSpendingSummary(fromDate, toDate);
    const categorySpend = await reportsService.getSpendByCategory();
    const monthlyTrend = await reportsService.getMonthlySpendTrend(parseInt(req.query.months) || 6);

    return success(res, {
      summary: report,
      byCategory: categorySpend,
      monthlyTrend: monthlyTrend,
    });
  } catch (err) { next(err); }
};

const getVendorPerformanceReport = async (req, res, next) => {
  try {
    const stats = await reportsService.getVendorPerformance();
    const topVendors = await reportsService.getTopVendors(parseInt(req.query.limit) || 5);
    return success(res, {
      performance: stats,
      topVendors: topVendors,
    });
  } catch (err) { next(err); }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const trends = await reportsService.getMonthlySpendTrend(months);
    return success(res, trends);
  } catch (err) { next(err); }
};

const getProcurementStats = async (req, res, next) => {
  try {
    const stats = await reportsService.getProcurementStats();
    return success(res, stats);
  } catch (err) { next(err); }
};

module.exports = {
  getDashboardStats,
  getSpendingReport,
  getVendorPerformanceReport,
  getMonthlyTrends,
  getProcurementStats,
};
