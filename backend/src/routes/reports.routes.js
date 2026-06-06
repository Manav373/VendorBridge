const express = require('express');
const reportsController = require('../controllers/reports.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'procurement_officer', 'manager'));

router.get('/dashboard', reportsController.getDashboardStats);
router.get('/spending', reportsController.getSpendingReport);
router.get('/vendor-performance', reportsController.getVendorPerformanceReport);
router.get('/monthly-trends', reportsController.getMonthlyTrends);
router.get('/procurement-stats', reportsController.getProcurementStats);

module.exports = router;
