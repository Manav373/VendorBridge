const Groq = require('groq-sdk');
const config = require('../config/env');
const logger = require('../config/logger');
const { query } = require('../config/database');

const groq = new Groq({ apiKey: config.groq.apiKey });

/**
 * Safe Groq LLaMA AI call with error handling
 */
const safeAICall = async (messages) => {
  try {
    const completion = await groq.chat.completions.create({
      model: config.groq.model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    logger.error('Groq AI call failed', { error: error.message });
    throw new Error('AI service temporarily unavailable. Please try again later.');
  }
};

/**
 * Parse JSON safely from AI response
 */
const parseJSON = (text) => {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { rawResponse: text };
  } catch {
    return { rawResponse: text };
  }
};

/**
 * AI Vendor Recommendation
 * Analyzes RFQ requirements and recommends the best vendors
 */
const getVendorRecommendation = async (rfqId) => {
  const rfqResult = await query(
    `SELECT r.*, array_agg(ri.item_name || ' (' || ri.quantity || ' ' || ri.unit || ')') AS items_list
     FROM rfqs r
     LEFT JOIN rfq_items ri ON ri.rfq_id = r.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [rfqId]
  );

  if (rfqResult.rows.length === 0) throw new Error('RFQ not found');
  const rfq = rfqResult.rows[0];

  const vendorsResult = await query(
    `SELECT v.name, v.category, v.rating, v.total_orders, v.total_value, v.country, v.status,
       COALESCE(AVG(q.delivery_days), 0) AS avg_delivery_days,
       COUNT(DISTINCT q.id) AS quotations_count
     FROM vendors v
     LEFT JOIN quotations q ON q.vendor_id = v.id
     WHERE v.status = 'active'
     GROUP BY v.id
     ORDER BY v.rating DESC
     LIMIT 20`
  );

  const messages = [
    {
      role: 'system',
      content: 'You are a professional procurement AI assistant for VendorBridge ERP. Always respond with valid JSON only, no markdown or extra text.',
    },
    {
      role: 'user',
      content: `
**RFQ Details:**
- Title: ${rfq.title}
- Category: ${rfq.category}
- Priority: ${rfq.priority}
- Deadline: ${rfq.deadline}
- Description: ${rfq.description || 'N/A'}
- Items Required: ${(rfq.items_list || []).join(', ')}

**Available Active Vendors:**
${vendorsResult.rows.map((v, i) =>
  `${i + 1}. ${v.name} | Category: ${v.category} | Rating: ${v.rating}/5 | Country: ${v.country} | Total Orders: ${v.total_orders} | Avg Delivery: ${Math.round(v.avg_delivery_days)} days`
).join('\n')}

**Task:** Recommend the top 3 vendors for this RFQ. For each vendor provide: why they are a good match, potential concerns, and a recommendation score (1-10). Also provide overall procurement strategy.

Respond in this exact JSON format:
{
  "recommendations": [
    { "rank": 1, "vendorName": "...", "score": 9, "reasons": ["..."], "concerns": ["..."], "summary": "..." }
  ],
  "strategy": "...",
  "insights": "..."
}`,
    },
  ];

  const aiResponse = await safeAICall(messages);
  return parseJSON(aiResponse);
};

/**
 * AI Quotation Analysis
 * Analyzes submitted quotations and provides insights
 */
const analyzeQuotations = async (rfqId) => {
  const quotationsResult = await query(
    `SELECT q.quotation_number, q.total_amount, q.delivery_days, q.valid_until, q.vendor_remarks,
       v.name AS vendor_name, v.rating AS vendor_rating,
       array_agg(qi.item_name || ': ₹' || qi.unit_price || '/unit') AS item_prices
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
     WHERE q.rfq_id = $1 AND q.status != 'draft'
     GROUP BY q.id, v.name, v.rating
     ORDER BY q.total_amount ASC`,
    [rfqId]
  );

  if (quotationsResult.rows.length === 0) {
    return { message: 'No quotations available for analysis yet' };
  }

  const messages = [
    {
      role: 'system',
      content: 'You are a procurement analytics AI for VendorBridge ERP. Always respond with valid JSON only, no markdown or extra text.',
    },
    {
      role: 'user',
      content: `
**Quotations Received for RFQ:**
${quotationsResult.rows.map((q, i) =>
  `${i + 1}. ${q.vendor_name} (Rating: ${q.vendor_rating}/5)
   - Total Amount: ₹${Number(q.total_amount).toLocaleString('en-IN')}
   - Delivery: ${q.delivery_days || 'Not specified'} days
   - Valid Until: ${q.valid_until || 'Not specified'}
   - Item Pricing: ${(q.item_prices || []).join(', ')}
   - Vendor Notes: ${q.vendor_remarks || 'None'}`
).join('\n')}

**Task:** Analyze these quotations and provide: best value recommendation (price + delivery + rating), price analysis (savings potential, outliers), risk assessment per vendor, and final recommendation.

Respond in this exact JSON format:
{
  "recommendation": { "vendorName": "...", "reason": "...", "estimatedSavings": "..." },
  "priceAnalysis": { "lowestBid": 0, "highestBid": 0, "averageBid": 0, "priceRange": "..." },
  "vendorAnalysis": [{ "vendor": "...", "score": 9, "pros": [], "cons": [], "riskLevel": "low" }],
  "summary": "...",
  "keyInsights": []
}`,
    },
  ];

  const aiResponse = await safeAICall(messages);
  return parseJSON(aiResponse);
};

/**
 * AI Procurement Insights
 * Generate strategic insights from procurement data
 */
const getProcurementInsights = async (stats) => {
  const messages = [
    {
      role: 'system',
      content: 'You are a strategic procurement AI for VendorBridge ERP. Always respond with valid JSON only, no markdown or extra text.',
    },
    {
      role: 'user',
      content: `
**Current Procurement Data:**
- Total Active RFQs: ${stats.rfqs?.active || 0}
- Pending Approvals: ${stats.approvals?.pending || 0}
- Total Procurement Spend: ₹${Number(stats.totalProcurementSpend || 0).toLocaleString('en-IN')}
- Active Vendors: ${stats.vendors?.active || 0}
- Pending Vendors: ${stats.vendors?.pending || 0}
- Overdue RFQs: ${stats.rfqs?.overdue || 0}
- Completed Purchase Orders: ${stats.purchaseOrders?.approved || 0}
- Overdue Invoices: ${stats.invoices?.overdue || 0}

**Task:** Generate 5 actionable procurement insights and recommendations for the team.

Respond in this exact JSON format:
{
  "insights": [
    {
      "type": "warning",
      "title": "...",
      "description": "...",
      "priority": "high",
      "action": "Recommended action"
    }
  ],
  "overallHealth": "good",
  "summary": "Brief overall assessment"
}`,
    },
  ];

  const aiResponse = await safeAICall(messages);
  return parseJSON(aiResponse);
};

/**
 * AI Assistant Chat
 * General purpose procurement Q&A with conversation history
 */
const chatWithAssistant = async (message, conversationHistory = []) => {
  const [vendorCount, rfqCount, poCount] = await Promise.all([
    query("SELECT COUNT(*) FROM vendors WHERE status = 'active'"),
    query("SELECT COUNT(*) FROM rfqs WHERE status = 'active'"),
    query("SELECT COUNT(*) FROM purchase_orders WHERE status != 'cancelled'"),
  ]);

  // Build messages array with system prompt + history + new message
  const messages = [
    {
      role: 'system',
      content: `You are VendorBridge AI, a professional procurement assistant embedded in the VendorBridge ERP platform.

Current System Context:
- Active Vendors: ${vendorCount.rows[0].count}
- Active RFQs: ${rfqCount.rows[0].count}
- Total Purchase Orders: ${poCount.rows[0].count}

You help procurement professionals with:
- Vendor management advice
- RFQ strategy and best practices
- Quotation evaluation guidance
- Approval workflow questions
- Procurement compliance and governance
- Cost optimization strategies
- Supplier relationship management

Be concise, professional, and actionable. When relevant, mention VendorBridge features.`,
    },
    // Inject last 6 conversation turns for context
    ...conversationHistory.slice(-6).map(h => ({
      role: h.role === 'user' ? 'user' : 'assistant',
      content: h.content,
    })),
    {
      role: 'user',
      content: message,
    },
  ];

  const response = await safeAICall(messages);
  return {
    message: response,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Smart AI Notifications
 * Auto-detect procurement issues and generate alerts
 */
const getSmartNotifications = async () => {
  const [overdueRFQs, pendingApprovals, overdueInvoices, lowRatedVendors] = await Promise.all([
    query("SELECT COUNT(*) FROM rfqs WHERE deadline < NOW() AND status = 'active'"),
    query("SELECT COUNT(*) FROM approvals WHERE status = 'pending' AND created_at < NOW() - INTERVAL '3 days'"),
    query("SELECT COUNT(*) FROM invoices WHERE due_date < NOW() AND status != 'paid' AND status != 'cancelled'"),
    query("SELECT COUNT(*) FROM vendors WHERE rating < 3 AND status = 'active'"),
  ]);

  const notifications = [];

  const od = parseInt(overdueRFQs.rows[0].count);
  if (od > 0) {
    notifications.push({
      type: 'warning',
      priority: 'high',
      title: `${od} RFQ${od > 1 ? 's' : ''} Past Deadline`,
      message: `${od} active RFQ${od > 1 ? 's are' : ' is'} past the submission deadline. Immediate action required.`,
      action: 'View RFQs',
      route: '/rfqs',
    });
  }

  const pa = parseInt(pendingApprovals.rows[0].count);
  if (pa > 0) {
    notifications.push({
      type: 'info',
      priority: 'medium',
      title: `${pa} Stalled Approval${pa > 1 ? 's' : ''}`,
      message: `${pa} approval request${pa > 1 ? 's have' : ' has'} been pending for over 3 days.`,
      action: 'Review Approvals',
      route: '/approvals',
    });
  }

  const oi = parseInt(overdueInvoices.rows[0].count);
  if (oi > 0) {
    notifications.push({
      type: 'error',
      priority: 'high',
      title: `${oi} Overdue Invoice${oi > 1 ? 's' : ''}`,
      message: `${oi} invoice${oi > 1 ? 's are' : ' is'} past due date and unpaid.`,
      action: 'View Invoices',
      route: '/invoices',
    });
  }

  const lv = parseInt(lowRatedVendors.rows[0].count);
  if (lv > 0) {
    notifications.push({
      type: 'warning',
      priority: 'low',
      title: `${lv} Low-Rated Active Vendor${lv > 1 ? 's' : ''}`,
      message: `${lv} active vendor${lv > 1 ? 's have' : ' has'} a rating below 3.0. Consider performance review.`,
      action: 'View Vendors',
      route: '/vendors',
    });
  }

  return { notifications, generatedAt: new Date().toISOString() };
};

module.exports = {
  getVendorRecommendation,
  analyzeQuotations,
  getProcurementInsights,
  chatWithAssistant,
  getSmartNotifications,
};
