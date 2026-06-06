const express = require('express');
const activityLogController = require('../controllers/activityLog.controller');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin', 'manager'));

router.get('/', activityLogController.getLogs);
router.get('/module/:module', activityLogController.getModuleLogs);
router.get('/user/:userId', activityLogController.getUserLogs);

module.exports = router;
