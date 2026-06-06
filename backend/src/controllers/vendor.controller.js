const vendorService = require('../services/vendor.service');
const { success, created, notFound } = require('../utils/apiResponse');

const createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.createVendor(req.body, req.user.id);
    return created(res, vendor, 'Vendor created successfully');
  } catch (err) { next(err); }
};

const getVendors = async (req, res, next) => {
  try {
    const result = await vendorService.getVendors(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const getVendorById = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    return success(res, vendor);
  } catch (err) { next(err); }
};

const updateVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendor(req.params.id, req.body, req.user.id);
    return success(res, vendor, 'Vendor updated successfully');
  } catch (err) { next(err); }
};

const deleteVendor = async (req, res, next) => {
  try {
    await vendorService.deleteVendor(req.params.id, req.user.id);
    return success(res, null, 'Vendor deleted successfully');
  } catch (err) { next(err); }
};

const updateVendorStatus = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendorStatus(req.params.id, req.body.status, req.user.id);
    return success(res, vendor, `Vendor status updated to ${req.body.status}`);
  } catch (err) { next(err); }
};

const getVendorCategories = async (req, res, next) => {
  try {
    const categories = await vendorService.getVendorCategories();
    return success(res, categories);
  } catch (err) { next(err); }
};

const getVendorStats = async (req, res, next) => {
  try {
    const stats = await vendorService.getVendorStats();
    return success(res, stats);
  } catch (err) { next(err); }
};

module.exports = { createVendor, getVendors, getVendorById, updateVendor, deleteVendor, updateVendorStatus, getVendorCategories, getVendorStats };
