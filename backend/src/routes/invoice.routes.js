const express = require('express');
const Joi = require('joi');
const invoiceController = require('../controllers/invoice.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const createInvoiceSchema = Joi.object({
  poId: Joi.string().uuid().optional(),
  vendorId: Joi.string().uuid().optional(),
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled').default('draft'),
  invoiceDate: Joi.date().optional(),
  dueDate: Joi.date().required(),
  taxPercent: Joi.number().precision(2).default(18),
  discount: Joi.number().precision(2).default(0),
  billTo: Joi.string().allow(null, ''),
  notes: Joi.string().allow(null, ''),
  paymentTerms: Joi.string().allow(null, ''),
  items: Joi.array().items(Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow(null, ''),
    quantity: Joi.number().positive().required(),
    unit: Joi.string().max(30).default('pcs'),
    unitPrice: Joi.number().precision(2).positive().required(),
  })).min(1).required(),
});

const updateInvoiceStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled').required(),
  paidAmount: Joi.number().precision(2).positive().optional(),
});

router.use(authenticate);

// CRUD
router.get('/', invoiceController.getInvoices);
router.post('/', validate(createInvoiceSchema), invoiceController.createInvoice);

router.get('/:id', invoiceController.getInvoiceById);

// Update status (e.g. mark paid)
router.patch('/:id/status', validate(updateInvoiceStatusSchema), invoiceController.updateInvoiceStatus);

// Linked PO Invoice
router.get('/po/:poId', invoiceController.getInvoiceByPO);

module.exports = router;
