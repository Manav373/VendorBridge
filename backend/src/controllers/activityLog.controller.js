const activityLogService = require('../services/activityLog.service');
const { success } = require('../utils/apiResponse');

const getLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const module = req.query.module || null;
    const userId = req.query.userId || null;
    const search = req.query.search || null;

    const result = await activityLogService.getLogs({ page, limit, module, userId, search });
    return success(res, result);
  } catch (err) { next(err); }
};

const getModuleLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await activityLogService.getModuleLogs(req.params.module, limit);
    return success(res, logs);
  } catch (err) { next(err); }
};

const getUserLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || null;

    const result = await activityLogService.getLogs({ page, limit, userId: req.params.userId, search });
    return success(res, result);
  } catch (err) { next(err); }
};

module.exports = {
  getLogs,
  getModuleLogs,
  getUserLogs,
};
