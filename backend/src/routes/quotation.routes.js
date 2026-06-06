const express = require('express');
const Joi = require('joi');
const quotationController = require('../controllers/quotation.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const submitQuotationSchema = Joi.object({
  rfqId: Joi.string().uuid().required(),
  vendorId: Joi.string().uuid().optional(),
  deliveryDays: Joi.number().integer().positive().allow(null),
  validUntil: Joi.date().greater('now').allow(null),
  notes: Joi.string().allow(null, ''),
  vendorRemarks: Joi.string().allow(null, ''),
  items: Joi.array().items(Joi.object({
    rfqItemId: Joi.string().uuid().required(),
    name: Joi.string().max(255).required(),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().max(30).default('pcs'),
    unitPrice: Joi.number().precision(2).positive().required(),
    notes: Joi.string().allow(null, ''),
  })).min(1).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'submitted', 'shortlisted', 'rejected', 'accepted').required(),
});

router.use(authenticate);

// CRUD / Submission
router.get('/', quotationController.getQuotations);
router.post('/', validate(submitQuotationSchema), quotationController.submitQuotation);

router.get('/:id', quotationController.getQuotationById);
router.patch('/:id/status', authorize('admin', 'procurement_officer', 'manager'), validate(updateStatusSchema), quotationController.updateQuotationStatus);

// RFQ-specific retrieval and comparison
router.get('/rfq/:rfqId', quotationController.getRFQQuotations);
router.get('/rfq/:rfqId/compare', quotationController.compareQuotations);

module.exports = router;
