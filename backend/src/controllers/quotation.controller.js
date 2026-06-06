const quotationService = require('../services/quotation.service');
const { query } = require('../config/database');
const { success, created, forbidden, notFound } = require('../utils/apiResponse');
const { AppError } = require('../middleware/errorHandler');

const submitQuotation = async (req, res, next) => {
  try {
    let vendorId;

    if (req.user.role === 'vendor') {
      // Find the vendor associated with the logged-in user
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0) {
        throw new AppError('No vendor profile associated with your user account', 403);
      }
      vendorId = vendorResult.rows[0].id;
    } else {
      // Admins/Procurement officers must provide vendorId in body
      vendorId = req.body.vendorId;
      if (!vendorId) {
        throw new AppError('vendorId is required in request body', 400);
      }
    }

    const quotation = await quotationService.submitQuotation(req.body, vendorId, req.user.id);
    return created(res, quotation, 'Quotation submitted successfully');
  } catch (err) { next(err); }
};

const getQuotations = async (req, res, next) => {
  try {
    // If user is a vendor, restrict them to their own quotations
    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0) {
        return success(res, { quotations: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } });
      }
      req.query.vendorId = vendorResult.rows[0].id;
    }

    const result = await quotationService.getQuotations(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const getQuotationById = async (req, res, next) => {
  try {
    const quotation = await quotationService.getQuotationById(req.params.id);

    // If user is a vendor, ensure this quotation belongs to them
    if (req.user.role === 'vendor') {
      const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [req.user.id]);
      if (vendorResult.rows.length === 0 || quotation.vendor_id !== vendorResult.rows[0].id) {
        throw new AppError('Access denied', 403);
      }
    }

    return success(res, quotation);
  } catch (err) { next(err); }
};

const getRFQQuotations = async (req, res, next) => {
  try {
    // Vendors cannot view all quotations for an RFQ
    if (req.user.role === 'vendor') {
      throw new AppError('Access denied', 403);
    }

    const quotations = await quotationService.getRFQQuotations(req.params.rfqId);
    return success(res, quotations);
  } catch (err) { next(err); }
};

const compareQuotations = async (req, res, next) => {
  try {
    // Vendors cannot compare quotations
    if (req.user.role === 'vendor') {
      throw new AppError('Access denied', 403);
    }

    const sortBy = req.query.sortBy || 'total_amount';
    const comparison = await quotationService.compareQuotations(req.params.rfqId, sortBy);
    return success(res, comparison);
  } catch (err) { next(err); }
};

const updateQuotationStatus = async (req, res, next) => {
  try {
    // Only procurement team/managers/admins can update status (shortlist/reject/accept)
    if (req.user.role === 'vendor') {
      throw new AppError('Access denied', 403);
    }

    const quotation = await quotationService.updateQuotationStatus(req.params.id, req.body.status, req.user.id);
    return success(res, quotation, `Quotation status updated to ${req.body.status}`);
  } catch (err) { next(err); }
};

module.exports = {
  submitQuotation,
  getQuotations,
  getQuotationById,
  getRFQQuotations,
  compareQuotations,
  updateQuotationStatus,
};
