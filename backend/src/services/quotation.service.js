const { query, getClient } = require('../config/database');
const { generateQuotationNumber } = require('../utils/generateId');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const activityLogService = require('./activityLog.service');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Submit a quotation
 */
const submitQuotation = async (data, vendorId, createdBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const quotationNumber = await generateQuotationNumber();

    // Calculate total
    const totalAmount = (data.items || []).reduce((sum, item) => {
      return sum + (parseFloat(item.unitPrice) * parseFloat(item.quantity));
    }, 0);

    const result = await client.query(
      `INSERT INTO quotations (quotation_number, rfq_id, vendor_id, status, total_amount, delivery_days, valid_until, notes, vendor_remarks, submitted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       RETURNING *`,
      [
        quotationNumber, data.rfqId, vendorId, 'submitted', totalAmount,
        data.deliveryDays || null, data.validUntil || null,
        data.notes || null, data.vendorRemarks || null,
      ]
    );

    const quotation = result.rows[0];

    // Insert items
    if (data.items && data.items.length > 0) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        await client.query(
          `INSERT INTO quotation_items (quotation_id, rfq_item_id, item_name, quantity, unit, unit_price, notes, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [quotation.id, item.rfqItemId || null, item.name, item.quantity, item.unit || 'pcs', item.unitPrice, item.notes || null, i]
        );
      }
    }

    // Mark vendor as responded in rfq_vendors
    await client.query(
      'UPDATE rfq_vendors SET responded = true WHERE rfq_id = $1 AND vendor_id = $2',
      [data.rfqId, vendorId]
    );

    await client.query('COMMIT');

    // Notify procurement team + send ack email to vendor
    const rfqResult = await query('SELECT r.created_by, r.rfq_number FROM rfqs r WHERE r.id = $1', [data.rfqId]);
    if (rfqResult.rows.length > 0) {
      const rfq = rfqResult.rows[0];
      await notificationService.createNotification({
        userId: rfq.created_by,
        type: 'quotation',
        title: 'New Quotation Received',
        message: `A new quotation ${quotationNumber} has been submitted for RFQ ${rfq.rfq_number}`,
        entityId: quotation.id,
        entityType: 'quotation',
      });
    }

    // Send acknowledgement email to vendor (non-blocking)
    const vendorResult = await query('SELECT v.email, v.name FROM vendors v WHERE v.id = $1', [vendorId]);
    if (vendorResult.rows.length > 0) {
      const fullQuotation = await getQuotationById(quotation.id);
      emailService.sendQuotationReceivedEmail({
        vendorEmail: vendorResult.rows[0].email,
        vendorName: vendorResult.rows[0].name,
        quotation: fullQuotation,
      }).catch(() => {});
    }

    await activityLogService.log({
      userId: createdBy,
      module: 'quotation',
      action: 'QUOTATION_SUBMITTED',
      description: `Quotation ${quotationNumber} submitted for RFQ`,
      entityType: 'quotation',
      entityId: quotation.id,
    });

    return await getQuotationById(quotation.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get quotation by ID
 */
const getQuotationById = async (quotationId) => {
  const result = await query(
    `SELECT q.*,
       v.name AS vendor_name, v.email AS vendor_email, v.rating AS vendor_rating, v.vendor_code,
       r.rfq_number, r.title AS rfq_title, r.deadline, r.category
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     JOIN rfqs r ON q.rfq_id = r.id
     WHERE q.id = $1`,
    [quotationId]
  );

  if (result.rows.length === 0) throw new AppError('Quotation not found', 404);
  const quotation = result.rows[0];

  // Fetch items
  const items = await query(
    'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order',
    [quotationId]
  );
  quotation.items = items.rows;

  return quotation;
};

/**
 * Get all quotations with filters
 */
const getQuotations = async (queryParams) => {
  const { page, limit, offset } = getPaginationParams(queryParams);
  const { status, rfqId, vendorId, search } = queryParams;

  let conditions = [];
  let values = [];
  let idx = 1;

  if (status) { conditions.push(`q.status = $${idx++}`); values.push(status); }
  if (rfqId) { conditions.push(`q.rfq_id = $${idx++}`); values.push(rfqId); }
  if (vendorId) { conditions.push(`q.vendor_id = $${idx++}`); values.push(vendorId); }
  if (search) {
    conditions.push(`(q.quotation_number ILIKE $${idx} OR v.name ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM quotations q JOIN vendors v ON q.vendor_id = v.id ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT q.*,
       v.name AS vendor_name, v.rating AS vendor_rating,
       r.rfq_number, r.title AS rfq_title
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     JOIN rfqs r ON q.rfq_id = r.id
     ${where}
     ORDER BY q.submitted_at DESC NULLS LAST
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return { quotations: result.rows, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Get all quotations for an RFQ (for comparison)
 */
const getRFQQuotations = async (rfqId) => {
  const result = await query(
    `SELECT q.*,
       v.name AS vendor_name, v.email AS vendor_email, v.rating AS vendor_rating,
       v.vendor_code, v.country
     FROM quotations q
     JOIN vendors v ON q.vendor_id = v.id
     WHERE q.rfq_id = $1 AND q.status != 'draft'
     ORDER BY q.total_amount ASC`,
    [rfqId]
  );

  const quotations = result.rows;

  // Fetch items for each quotation
  for (const q of quotations) {
    const items = await query(
      'SELECT * FROM quotation_items WHERE quotation_id = $1 ORDER BY sort_order',
      [q.id]
    );
    q.items = items.rows;
  }

  return quotations;
};

/**
 * Compare quotations for an RFQ
 */
const compareQuotations = async (rfqId, sortBy = 'total_amount') => {
  const quotations = await getRFQQuotations(rfqId);

  if (quotations.length === 0) return { quotations: [], analysis: null };

  // Find lowest price
  const lowestPrice = Math.min(...quotations.map(q => parseFloat(q.total_amount)));
  const fastestDelivery = Math.min(...quotations.filter(q => q.delivery_days).map(q => q.delivery_days));
  const highestRating = Math.max(...quotations.map(q => parseFloat(q.vendor_rating || 0)));

  // Add comparison flags
  const enriched = quotations.map(q => ({
    ...q,
    isLowestPrice: parseFloat(q.total_amount) === lowestPrice,
    isFastestDelivery: q.delivery_days === fastestDelivery,
    isHighestRated: parseFloat(q.vendor_rating || 0) === highestRating,
    savingsVsLowest: parseFloat(q.total_amount) - lowestPrice,
    savingsPercent: lowestPrice > 0 ? (((parseFloat(q.total_amount) - lowestPrice) / lowestPrice) * 100).toFixed(2) : 0,
  }));

  // Sort
  const sorted = enriched.sort((a, b) => {
    if (sortBy === 'delivery_days') return (a.delivery_days || 999) - (b.delivery_days || 999);
    if (sortBy === 'vendor_rating') return (parseFloat(b.vendor_rating) || 0) - (parseFloat(a.vendor_rating) || 0);
    return parseFloat(a.total_amount) - parseFloat(b.total_amount);
  });

  return {
    quotations: sorted,
    analysis: {
      totalQuotations: quotations.length,
      lowestPrice,
      highestPrice: Math.max(...quotations.map(q => parseFloat(q.total_amount))),
      averagePrice: (quotations.reduce((s, q) => s + parseFloat(q.total_amount), 0) / quotations.length).toFixed(2),
      fastestDelivery,
      highestRating,
      recommendedVendor: sorted[0]?.vendor_name,
    },
  };
};

/**
 * Update quotation status
 */
const updateQuotationStatus = async (quotationId, status, updatedBy, reason) => {
  const result = await query(
    'UPDATE quotations SET status = $1 WHERE id = $2 RETURNING *',
    [status, quotationId]
  );

  if (result.rows.length === 0) throw new AppError('Quotation not found', 404);

  await activityLogService.log({
    userId: updatedBy,
    module: 'quotation',
    action: 'QUOTATION_STATUS_CHANGED',
    description: `Quotation ${result.rows[0].quotation_number} status changed to ${status}`,
    entityType: 'quotation',
    entityId: quotationId,
  });

  // Send email to vendor on accepted / rejected
  if (status === 'accepted' || status === 'rejected') {
    const fullQuotation = await getQuotationById(quotationId);
    if (status === 'accepted') {
      emailService.sendQuotationAcceptedEmail({
        vendorEmail: fullQuotation.vendor_email,
        vendorName: fullQuotation.vendor_name,
        quotation: fullQuotation,
        po: null,
      }).catch(() => {});
    } else {
      emailService.sendQuotationRejectedEmail({
        vendorEmail: fullQuotation.vendor_email,
        vendorName: fullQuotation.vendor_name,
        quotation: fullQuotation,
        reason: reason || null,
      }).catch(() => {});
    }
  }

  return result.rows[0];
};

module.exports = { submitQuotation, getQuotationById, getQuotations, getRFQQuotations, compareQuotations, updateQuotationStatus };
