const rfqService = require('../services/rfq.service');
const { query } = require('../config/database');
const { success, created } = require('../utils/apiResponse');
const path = require('path');

const createRFQ = async (req, res, next) => {
  try {
    const rfq = await rfqService.createRFQ(req.body, req.user.id);
    return created(res, rfq, 'RFQ created successfully');
  } catch (err) { next(err); }
};

const getRFQs = async (req, res, next) => {
  try {
    const result = await rfqService.getRFQs(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const getRFQById = async (req, res, next) => {
  try {
    const rfq = await rfqService.getRFQById(req.params.id);
    return success(res, rfq);
  } catch (err) { next(err); }
};

const updateRFQ = async (req, res, next) => {
  try {
    const rfq = await rfqService.updateRFQ(req.params.id, req.body, req.user.id);
    return success(res, rfq, 'RFQ updated successfully');
  } catch (err) { next(err); }
};

const deleteRFQ = async (req, res, next) => {
  try {
    await rfqService.deleteRFQ(req.params.id, req.user.id);
    return success(res, null, 'RFQ deleted successfully');
  } catch (err) { next(err); }
};

const assignVendors = async (req, res, next) => {
  try {
    const rfq = await rfqService.assignVendors(req.params.id, req.body.vendorIds, req.user.id);
    return success(res, rfq, 'Vendors assigned and invitations sent');
  } catch (err) { next(err); }
};

const updateRFQStatus = async (req, res, next) => {
  try {
    const rfq = await rfqService.updateRFQStatus(req.params.id, req.body.status, req.user.id);
    return success(res, rfq, 'RFQ status updated');
  } catch (err) { next(err); }
};

const uploadAttachments = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return success(res, [], 'No files uploaded');
    }

    const attachments = [];
    for (const file of req.files) {
      const result = await query(
        `INSERT INTO attachments (entity_type, entity_id, file_name, original_name, file_path, file_size, mime_type, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        ['rfq', req.params.id, file.filename, file.originalname, file.path, file.size, file.mimetype, req.user.id]
      );
      attachments.push(result.rows[0]);
    }

    return created(res, attachments, `${attachments.length} file(s) uploaded successfully`);
  } catch (err) { next(err); }
};

module.exports = { createRFQ, getRFQs, getRFQById, updateRFQ, deleteRFQ, assignVendors, updateRFQStatus, uploadAttachments };
