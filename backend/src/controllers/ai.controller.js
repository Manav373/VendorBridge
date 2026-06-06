const aiService = require('../services/ai.service');
const reportsService = require('../services/reports.service');
const { success } = require('../utils/apiResponse');

const getVendorRecommendation = async (req, res, next) => {
  try {
    const { rfqId } = req.body;
    const recommendation = await aiService.getVendorRecommendation(rfqId);
    return success(res, recommendation);
  } catch (err) { next(err); }
};

const analyzeQuotations = async (req, res, next) => {
  try {
    const { rfqId } = req.body;
    const analysis = await aiService.analyzeQuotations(rfqId);
    return success(res, analysis);
  } catch (err) { next(err); }
};

const getProcurementInsights = async (req, res, next) => {
  try {
    const stats = await reportsService.getDashboardStats();
    const insights = await aiService.getProcurementInsights(stats);
    return success(res, insights);
  } catch (err) { next(err); }
};

const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const response = await aiService.chatWithAssistant(message, history || []);
    return success(res, response);
  } catch (err) { next(err); }
};

const getSmartNotifications = async (req, res, next) => {
  try {
    const notifications = await aiService.getSmartNotifications();
    return success(res, notifications);
  } catch (err) { next(err); }
};

module.exports = {
  getVendorRecommendation,
  analyzeQuotations,
  getProcurementInsights,
  chatWithAssistant,
  getSmartNotifications,
};
