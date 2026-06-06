const express = require('express');
const Joi = require('joi');
const rfqController = require('../controllers/rfq.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { handleUpload } = require('../middleware/upload');

const router = express.Router();

const createRFQSchema = Joi.object({
  title: Joi.string().max(500).required(),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(100).required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  deadline: Joi.date().greater('now').required(),
  estimatedValue: Joi.number().precision(2).positive().allow(null),
  notes: Joi.string().allow(null, ''),
  items: Joi.array().items(Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null, ''),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().max(30).default('pcs'),
  })).min(1).required(),
});

const updateRFQSchema = Joi.object({
  title: Joi.string().max(500).optional(),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(100).optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  deadline: Joi.date().optional(),
  estimatedValue: Joi.number().precision(2).positive().allow(null),
  notes: Joi.string().allow(null, ''),
  items: Joi.array().items(Joi.object({
    id: Joi.string().uuid().optional(),
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null, ''),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().max(30).default('pcs'),
  })).min(1).optional(),
});

const assignVendorsSchema = Joi.object({
  vendorIds: Joi.array().items(Joi.string().uuid().required()).min(1).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'active', 'pending', 'completed', 'cancelled').required(),
});

router.use(authenticate);

// CRUD
router.get('/', rfqController.getRFQs);
router.post('/', authorize('admin', 'procurement_officer'), validate(createRFQSchema), rfqController.createRFQ);

router.get('/:id', rfqController.getRFQById);
router.put('/:id', authorize('admin', 'procurement_officer'), validate(updateRFQSchema), rfqController.updateRFQ);
router.delete('/:id', authorize('admin', 'procurement_officer'), rfqController.deleteRFQ);

// Assignments and status
router.post('/:id/assign-vendors', authorize('admin', 'procurement_officer'), validate(assignVendorsSchema), rfqController.assignVendors);
router.patch('/:id/status', authorize('admin', 'procurement_officer', 'manager'), validate(updateStatusSchema), rfqController.updateRFQStatus);

// Attachments with entityType population
router.post(
  '/:id/attachments',
  authorize('admin', 'procurement_officer'),
  (req, res, next) => {
    req.params.entityType = 'rfq';
    next();
  },
  handleUpload('files'),
  rfqController.uploadAttachments
);

module.exports = router;
