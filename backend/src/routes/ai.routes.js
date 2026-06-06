const express = require('express');
const Joi = require('joi');
const aiController = require('../controllers/ai.controller');
const { authenticate, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

const rfqBodySchema = Joi.object({
  rfqId: Joi.string().uuid().required(),
});

const chatBodySchema = Joi.object({
  message: Joi.string().required(),
  history: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'model', 'assistant').required(),
      content: Joi.string().required(),
    })
  ).optional(),
});

router.use(authenticate);
router.use(authorize('admin', 'procurement_officer', 'manager'));

router.post('/vendor-recommendation', validate(rfqBodySchema), aiController.getVendorRecommendation);
router.post('/quotation-analysis', validate(rfqBodySchema), aiController.analyzeQuotations);
router.post('/procurement-insights', aiController.getProcurementInsights);
router.post('/chat', validate(chatBodySchema), aiController.chatWithAssistant);
router.get('/smart-notifications', aiController.getSmartNotifications);

module.exports = router;
