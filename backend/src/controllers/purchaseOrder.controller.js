const purchaseOrderService = require('../services/purchaseOrder.service');
const { query } = require('../config/database');
const { success, created, forbidden } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

const createPO = async (req, res, next) => {
  try {
    // Only internal procurement/managers/admins can create POs
    if (req.user.role === 'vendor') {
      throw new AppError('Access denied', 403);
    }
    const po = await purchaseOrderService.createPO(req.body, req.user.id);
    return created(res, po, 'Purchase Order created successfully');
  } catch (err) { next(err); }
};

const getPOs = async (req, res, next) => {
  try {
    // If vendor, filter by their own vendor ID
    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0) {
        return success(res, { purchaseOrders: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
      }
      req.query.vendorId = vendorResult.rows[0].id;
    }

    const result = await purchaseOrderService.getPOs(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const getPOById = async (req, res, next) => {
  try {
    const po = await purchaseOrderService.getPOById(req.params.id);

    // If vendor, restrict access to their own POs only
    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0 || po.vendor_id !== vendorResult.rows[0].id) {
        throw new AppError('Access denied', 403);
      }
    }

    return success(res, po);
  } catch (err) { next(err); }
};

const updatePOStatus = async (req, res, next) => {
  try {
    // Both procurement officers (to cancel/send) and vendors (to acknowledge) can update status, but with validation
    const po = await purchaseOrderService.getPOById(req.params.id);

    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0 || po.vendor_id !== vendorResult.rows[0].id) {
        throw new AppError('Access denied', 403);
      }

      // Vendors can only transition to 'acknowledged'
      if (req.body.status !== 'acknowledged') {
        throw new AppError("Vendors are only allowed to acknowledge POs (status: 'acknowledged')", 400);
      }
    }

    const updatedPo = await purchaseOrderService.updatePOStatus(req.params.id, req.body.status, req.user.id);
    return success(res, updatedPo, `Purchase Order status updated to ${req.body.status}`);
  } catch (err) { next(err); }
};

const updatePO = async (req, res, next) => {
  try {
    if (req.user.role === 'vendor') {
      throw new AppError('Access denied', 403);
    }
    const po = await purchaseOrderService.updatePO(req.params.id, req.body, req.user.id);
    return success(res, po, 'Purchase Order updated successfully');
  } catch (err) { next(err); }
};

const sendPOEmail = async (req, res, next) => {
  try {
    if (req.user.role === 'vendor') {
      throw new AppError('Access denied', 403);
    }
    await purchaseOrderService.sendPOEmail(req.params.id, req.user.id);
    return success(res, null, 'Purchase Order email sent to vendor successfully');
  } catch (err) { next(err); }
};

module.exports = {
  createPO,
  getPOs,
  getPOById,
  updatePOStatus,
  updatePO,
  sendPOEmail,
};
