const express = require('express');
const authRoutes = require('./auth.routes');
const vendorRoutes = require('./vendor.routes');
const rfqRoutes = require('./rfq.routes');
const quotationRoutes = require('./quotation.routes');
const approvalRoutes = require('./approval.routes');
const purchaseOrderRoutes = require('./purchaseOrder.routes');
const invoiceRoutes = require('./invoice.routes');
const notificationRoutes = require('./notification.routes');
const activityLogRoutes = require('./activityLog.routes');
const reportsRoutes = require('./reports.routes');
const aiRoutes = require('./ai.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/rfqs', rfqRoutes);
router.use('/quotations', quotationRoutes);
router.use('/approvals', approvalRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/activity-logs', activityLogRoutes);
router.use('/reports', reportsRoutes);
router.use('/ai', aiRoutes);

module.exports = router;
