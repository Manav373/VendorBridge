const express = require('express');
const Joi = require('joi');
const vendorController = require('../controllers/vendor.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const vendorBodySchema = {
  name: Joi.string().max(255).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(30).allow(null, ''),
  website: Joi.string().max(255).allow(null, ''),
  category: Joi.string().max(100).required(),
  country: Joi.string().max(100).allow(null, ''),
  state: Joi.string().max(100).allow(null, ''),
  city: Joi.string().max(100).allow(null, ''),
  address: Joi.string().allow(null, ''),
  pincode: Joi.string().max(20).allow(null, ''),
  gstNumber: Joi.string().max(50).allow(null, ''),
  panNumber: Joi.string().max(30).allow(null, ''),
  bankName: Joi.string().max(100).allow(null, ''),
  bankAccount: Joi.string().max(50).allow(null, ''),
  bankIfsc: Joi.string().max(20).allow(null, ''),
  contactPerson: Joi.string().max(100).allow(null, ''),
  notes: Joi.string().allow(null, ''),
  userId: Joi.string().uuid().allow(null),
};

const createVendorSchema = Joi.object(vendorBodySchema);

const updateVendorSchema = Joi.object({
  ...vendorBodySchema,
  name: Joi.string().max(255).optional(),
  email: Joi.string().email().optional(),
  category: Joi.string().max(100).optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('active', 'inactive', 'pending', 'suspended').required(),
});

router.use(authenticate);

// Category and Stats routes (must be before :id routes)
router.get('/categories', vendorController.getVendorCategories);
router.get('/stats', authorize('admin', 'procurement_officer', 'manager'), vendorController.getVendorStats);

// CRUD
router.get('/', authorize('admin', 'procurement_officer', 'manager'), vendorController.getVendors);
router.post('/', authorize('admin', 'procurement_officer', 'manager'), validate(createVendorSchema), vendorController.createVendor);

router.get('/:id', vendorController.getVendorById);
router.put('/:id', validate(updateVendorSchema), vendorController.updateVendor);
router.delete('/:id', authorize('admin', 'procurement_officer'), vendorController.deleteVendor);

// Status route
router.patch('/:id/status', authorize('admin', 'manager'), validate(updateStatusSchema), vendorController.updateVendorStatus);

module.exports = router;
