const invoiceService = require('../services/invoice.service');
const purchaseOrderService = require('../services/purchaseOrder.service');
const { query } = require('../config/database');
const { success, created } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

const createInvoice = async (req, res, next) => {
  try {
    let vendorId;

    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0) {
        throw new AppError('No vendor profile associated with your user account', 403);
      }
      vendorId = vendorResult.rows[0].id;
      req.body.vendorId = vendorId;

      // Verify that the linked PO exists and belongs to this vendor
      if (req.body.poId) {
        const po = await purchaseOrderService.getPOById(req.body.poId);
        if (po.vendor_id !== vendorId) {
          throw new AppError('The linked Purchase Order does not belong to you', 403);
        }
      }
    } else {
      vendorId = req.body.vendorId;
      if (!vendorId) {
        throw new AppError('vendorId is required in request body', 400);
      }
    }

    const invoice = await invoiceService.createInvoice(req.body, req.user.id);
    return created(res, invoice, 'Invoice created successfully');
  } catch (err) { next(err); }
};

const getInvoices = async (req, res, next) => {
  try {
    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0) {
        return success(res, { invoices: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
      }
      req.query.vendorId = vendorResult.rows[0].id;
    }

    const result = await invoiceService.getInvoices(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0 || invoice.vendor_id !== vendorResult.rows[0].id) {
        throw new AppError('Access denied', 403);
      }
    }

    return success(res, invoice);
  } catch (err) { next(err); }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0 || invoice.vendor_id !== vendorResult.rows[0].id) {
        throw new AppError('Access denied', 403);
      }
      // Vendors can only draft or send an invoice, they can't mark it paid
      if (req.body.status !== 'sent' && req.body.status !== 'draft') {
        throw new AppError("Vendors can only mark invoice as 'draft' or 'sent'", 400);
      }
    }

    const updatedInvoice = await invoiceService.updateInvoiceStatus(
      req.params.id,
      req.body.status,
      req.body.paidAmount,
      req.user.id
    );
    return success(res, updatedInvoice, `Invoice status updated to ${req.body.status}`);
  } catch (err) { next(err); }
};

const getInvoiceByPO = async (req, res, next) => {
  try {
    const po = await purchaseOrderService.getPOById(req.params.poId);

    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0 || po.vendor_id !== vendorResult.rows[0].id) {
        throw new AppError('Access denied', 403);
      }
    }

    const invoice = await invoiceService.getInvoiceByPO(req.params.poId);
    return success(res, invoice);
  } catch (err) { next(err); }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  getInvoiceByPO,
};
