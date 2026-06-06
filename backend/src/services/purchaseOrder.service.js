const { query, getClient } = require('../config/database');
const { generatePONumber } = require('../utils/generateId');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const activityLogService = require('./activityLog.service');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a Purchase Order
 */
const createPO = async (data, createdBy) => {
  const poNumber = await generatePONumber(); // Generate outside transaction to avoid deadlocking pool
  let createdPoId;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Calculate totals
    const items = data.items || [];
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * parseFloat(item.quantity)), 0);
    const taxPercent = parseFloat(data.taxPercent || 18);
    const taxAmount = (subtotal * taxPercent) / 100;
    const shipping = parseFloat(data.shipping || 0);
    const grandTotal = subtotal + taxAmount + shipping;

    const result = await client.query(
      `INSERT INTO purchase_orders (po_number, rfq_id, quotation_id, vendor_id, approval_id, status, order_date, delivery_date, due_date, subtotal, tax_amount, tax_percent, shipping, grand_total, paid_amount, due_amount, bill_to, ship_to, notes, terms, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       RETURNING *`,
      [
        poNumber, data.rfqId || null, data.quotationId || null, data.vendorId,
        data.approvalId || null, data.status || 'draft',
        data.orderDate || new Date().toISOString().split('T')[0],
        data.deliveryDate || null, data.dueDate || null,
        subtotal, taxAmount, taxPercent, shipping, grandTotal, 0, grandTotal,
        data.billTo || null, data.shipTo || null, data.notes || null, data.terms || null, createdBy,
      ]
    );

    const po = result.rows[0];
    createdPoId = po.id;

    // Insert PO items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await client.query(
        'INSERT INTO po_items (po_id, item_name, description, quantity, unit, unit_price, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [po.id, item.name, item.description || null, item.quantity, item.unit || 'pcs', item.unitPrice, i]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  // Do these AFTER releasing the client to avoid deadlocking the connection pool
  await activityLogService.log({
    userId: createdBy,
    module: 'po',
    action: 'PO_CREATED',
    description: `Purchase Order created: ${poNumber}`,
    entityType: 'po',
    entityId: createdPoId,
  });

  const fullPO = await getPOById(createdPoId);

  // Auto-send PO email to vendor if status is 'sent'
  if ((data.status || 'draft') === 'sent' && fullPO.vendor_email) {
    emailService.sendPOEmail({
      vendorEmail: fullPO.vendor_email,
      vendorName: fullPO.vendor_name,
      po: fullPO,
      items: fullPO.items,
    }).catch(() => {});
  }

  return fullPO;
};

/**
 * Get PO by ID with items and vendor info
 */
const getPOById = async (poId) => {
  const result = await query(
    `SELECT po.*,
       v.name AS vendor_name, v.email AS vendor_email, v.address AS vendor_address,
       v.gst_number AS vendor_gst, v.phone AS vendor_phone,
       u.first_name || ' ' || u.last_name AS created_by_name
     FROM purchase_orders po
     JOIN vendors v ON po.vendor_id = v.id
     LEFT JOIN users u ON po.created_by = u.id
     WHERE po.id = $1`,
    [poId]
  );

  if (result.rows.length === 0) throw new AppError('Purchase Order not found', 404);
  const po = result.rows[0];

  const items = await query('SELECT * FROM po_items WHERE po_id = $1 ORDER BY sort_order', [poId]);
  po.items = items.rows;

  return po;
};

/**
 * Get all POs with filters
 */
const getPOs = async (queryParams) => {
  const { page, limit, offset } = getPaginationParams(queryParams);
  const { status, vendorId, search } = queryParams;

  let conditions = [];
  let values = [];
  let idx = 1;

  if (status) { conditions.push(`po.status = $${idx++}`); values.push(status); }
  if (vendorId) { conditions.push(`po.vendor_id = $${idx++}`); values.push(vendorId); }
  if (search) {
    conditions.push(`(po.po_number ILIKE $${idx} OR v.name ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM purchase_orders po JOIN vendors v ON po.vendor_id = v.id ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT po.*, v.name AS vendor_name
     FROM purchase_orders po
     JOIN vendors v ON po.vendor_id = v.id
     ${where}
     ORDER BY po.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return { purchaseOrders: result.rows, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Update PO status
 */
const updatePOStatus = async (poId, status, updatedBy) => {
  const result = await query(
    'UPDATE purchase_orders SET status = $1 WHERE id = $2 RETURNING *',
    [status, poId]
  );

  if (result.rows.length === 0) throw new AppError('Purchase Order not found', 404);

  await activityLogService.log({
    userId: updatedBy,
    module: 'po',
    action: 'PO_STATUS_CHANGED',
    description: `PO ${result.rows[0].po_number} status changed to ${status}`,
    entityType: 'po',
    entityId: poId,
  });

  // Auto-send PO email to vendor when status changes to 'sent'
  if (status === 'sent') {
    const fullPO = await getPOById(poId);
    if (fullPO.vendor_email) {
      emailService.sendPOEmail({
        vendorEmail: fullPO.vendor_email,
        vendorName: fullPO.vendor_name,
        po: fullPO,
        items: fullPO.items,
      }).catch(() => {});
    }
  }

  return result.rows[0];
};

/**
 * Update PO details
 */
const updatePO = async (poId, data, updatedBy) => {
  const result = await query(
    `UPDATE purchase_orders SET
       delivery_date = COALESCE($1, delivery_date),
       due_date = COALESCE($2, due_date),
       notes = COALESCE($3, notes),
       terms = COALESCE($4, terms),
       bill_to = COALESCE($5, bill_to),
       ship_to = COALESCE($6, ship_to)
     WHERE id = $7 RETURNING *`,
    [data.deliveryDate, data.dueDate, data.notes, data.terms, data.billTo, data.shipTo, poId]
  );

  if (result.rows.length === 0) throw new AppError('Purchase Order not found', 404);
  return await getPOById(poId);
};

/**
 * Send PO Email to Vendor
 */
const sendPOEmail = async (poId, userId) => {
  const po = await getPOById(poId);
  if (!po.vendor_email) throw new AppError('Vendor has no email address', 400);

  // Send email
  await emailService.sendPOEmail({
    vendorEmail: po.vendor_email,
    vendorName: po.vendor_name,
    po: po,
    items: po.items,
  });

  // If status is not already advanced past 'sent', update it
  if (['draft', 'pending_approval', 'approved'].includes(po.status)) {
    await updatePOStatus(poId, 'sent', userId);
  }

  return true;
};

module.exports = { createPO, getPOById, getPOs, updatePOStatus, updatePO, sendPOEmail };
