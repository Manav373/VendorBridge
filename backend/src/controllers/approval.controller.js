const approvalService = require('../services/approval.service');
const { success, created } = require('../utils/apiResponse');

const createApproval = async (req, res, next) => {
  try {
    const approval = await approvalService.createApproval(req.body, req.user.id);
    return created(res, approval, 'Approval request created successfully');
  } catch (err) { next(err); }
};

const getApprovals = async (req, res, next) => {
  try {
    const result = await approvalService.getApprovals(req.query);
    return success(res, result);
  } catch (err) { next(err); }
};

const getApprovalById = async (req, res, next) => {
  try {
    const approval = await approvalService.getApprovalById(req.params.id);
    return success(res, approval);
  } catch (err) { next(err); }
};

const approveRequest = async (req, res, next) => {
  try {
    const approval = await approvalService.approveRequest(req.params.id, req.user.id, req.body.remarks);
    return success(res, approval, 'Request approved successfully');
  } catch (err) { next(err); }
};

const rejectRequest = async (req, res, next) => {
  try {
    const approval = await approvalService.rejectRequest(req.params.id, req.user.id, req.body.remarks);
    return success(res, approval, 'Request rejected successfully');
  } catch (err) { next(err); }
};

module.exports = {
  createApproval,
  getApprovals,
  getApprovalById,
  approveRequest,
  rejectRequest,
};
