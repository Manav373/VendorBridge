const express = require('express');
const Joi = require('joi');
const purchaseOrderController = require('../controllers/purchaseOrder.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createPOSchema = Joi.object({
  rfqId: Joi.string().uuid().optional(),
  quotationId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().required(),
  approvalId: Joi.string().uuid().optional(),
  status: Joi.string().valid('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'completed', 'cancelled').default('draft'),
  orderDate: Joi.date().optional(),
  deliveryDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  taxPercent: Joi.number().precision(2).default(18),
  shipping: Joi.number().precision(2).default(0),
  billTo: Joi.string().allow(null, ''),
  shipTo: Joi.string().allow(null, ''),
  notes: Joi.string().allow(null, ''),
  terms: Joi.string().allow(null, ''),
  items: Joi.array().items(Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null, ''),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().max(30).default('pcs'),
    unitPrice: Joi.number().precision(2).positive().required(),
  })).min(1).required(),
});

const updatePOSchema = Joi.object({
  deliveryDate: Joi.date().optional(),
  dueDate: Joi.date().optional(),
  notes: Joi.string().allow(null, ''),
  terms: Joi.string().allow(null, ''),
  billTo: Joi.string().allow(null, ''),
  shipTo: Joi.string().allow(null, ''),
});

const updatePOStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'pending_approval', 'approved', 'sent', 'acknowledged', 'completed', 'cancelled').required(),
});

router.use(authenticate);

// CRUD
router.get('/', purchaseOrderController.getPOs);
router.post('/', authorize('admin', 'procurement_officer'), validate(createPOSchema), purchaseOrderController.createPO);

router.get('/:id', purchaseOrderController.getPOById);
router.put('/:id', authorize('admin', 'procurement_officer'), validate(updatePOSchema), purchaseOrderController.updatePO);

// Status transition
router.patch('/:id/status', validate(updatePOStatusSchema), purchaseOrderController.updatePOStatus);
router.post('/:id/send-email', authorize('admin', 'procurement_officer'), purchaseOrderController.sendPOEmail);

module.exports = router;
