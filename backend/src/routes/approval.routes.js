const express = require('express');
const Joi = require('joi');
const approvalController = require('../controllers/approval.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createApprovalSchema = Joi.object({
  rfqId: Joi.string().uuid().optional(),
  quotationId: Joi.string().uuid().optional(),
  title: Joi.string().max(500).required(),
  description: Joi.string().allow(null, ''),
  amount: Joi.number().precision(2).positive().allow(null),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
});

const remarksSchema = Joi.object({
  remarks: Joi.string().allow(null, ''),
});

router.use(authenticate);
router.use(authorize('admin', 'procurement_officer', 'manager'));

// CRUD
router.get('/', approvalController.getApprovals);
router.post('/', validate(createApprovalSchema), approvalController.createApproval);

router.get('/:id', approvalController.getApprovalById);

// Approve/Reject actions
router.post('/:id/approve', validate(remarksSchema), approvalController.approveRequest);
router.post('/:id/reject', validate(remarksSchema), approvalController.rejectRequest);

module.exports = router;
