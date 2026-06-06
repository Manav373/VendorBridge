const { query, getClient } = require('../config/database');
const { generateInvoiceNumber } = require('../utils/generateId');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const activityLogService = require('./activityLog.service');
const emailService = require('./email.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate / Create an invoice (from a PO)
 */
const createInvoice = async (data, createdBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const invoiceNumber = await generateInvoiceNumber();

    const items = data.items || [];
    const subtotal = items.reduce((s, i) => s + parseFloat(i.unitPrice) * parseFloat(i.quantity), 0);
    const taxPercent = parseFloat(data.taxPercent ?? 18);
    const taxAmount = (subtotal * taxPercent) / 100;
    const discount = parseFloat(data.discount || 0);
    const grandTotal = subtotal + taxAmount - discount;

    const result = await client.query(
      `INSERT INTO invoices (invoice_number, po_id, vendor_id, status, invoice_date, due_date, subtotal, tax_percent, tax_amount, discount, grand_total, paid_amount, due_amount, bill_to, notes, payment_terms, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING *`,
      [
        invoiceNumber, data.poId || null, data.vendorId, data.status || 'draft',
        data.invoiceDate || new Date().toISOString().split('T')[0],
        data.dueDate || null, subtotal, taxPercent, taxAmount, discount,
        grandTotal, 0, grandTotal, data.billTo || null, data.notes || null,
        data.paymentTerms || null, createdBy,
      ]
    );

    const invoice = result.rows[0];

    // Insert items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await client.query(
        'INSERT INTO invoice_items (invoice_id, item_name, description, quantity, unit, unit_price, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [invoice.id, item.name, item.description || null, item.quantity, item.unit || 'pcs', item.unitPrice, i]
      );
    }

    // If linked to a PO, update PO with invoice reference
    if (data.poId) {
      await client.query(
        "UPDATE purchase_orders SET status = 'completed' WHERE id = $1 AND status != 'completed'",
        [data.poId]
      );
    }

    await client.query('COMMIT');

    await activityLogService.log({
      userId: createdBy,
      module: 'invoice',
      action: 'INVOICE_CREATED',
      description: `Invoice created: ${invoiceNumber}`,
      entityType: 'invoice',
      entityId: invoice.id,
    });

    const fullInvoice = await getInvoiceById(invoice.id);

    // Send invoice email (non-blocking)
    const vendorResult = await query('SELECT email, name FROM vendors WHERE id = $1', [data.vendorId]);
    if (vendorResult.rows.length > 0) {
      emailService.sendInvoiceEmail({
        recipientEmail: vendorResult.rows[0].email,
        recipientName: vendorResult.rows[0].name,
        invoice: fullInvoice,
        items: fullInvoice.items,
      }).catch(() => {});
    }

    return fullInvoice;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get invoice by ID
 */
const getInvoiceById = async (invoiceId) => {
  const result = await query(
    `SELECT i.*,
       v.name AS vendor_name, v.email AS vendor_email, v.gst_number AS vendor_gst,
       po.po_number,
       u.first_name || ' ' || u.last_name AS created_by_name
     FROM invoices i
     JOIN vendors v ON i.vendor_id = v.id
     LEFT JOIN purchase_orders po ON i.po_id = po.id
     LEFT JOIN users u ON i.created_by = u.id
     WHERE i.id = $1`,
    [invoiceId]
  );

  if (result.rows.length === 0) throw new AppError('Invoice not found', 404);
  const invoice = result.rows[0];

  const items = await query('SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY sort_order', [invoiceId]);
  invoice.items = items.rows;

  return invoice;
};

/**
 * Get all invoices with filters
 */
const getInvoices = async (queryParams) => {
  const { page, limit, offset } = getPaginationParams(queryParams);
  const { status, vendorId, search } = queryParams;

  let conditions = [];
  let values = [];
  let idx = 1;

  if (status) { conditions.push(`i.status = $${idx++}`); values.push(status); }
  if (vendorId) { conditions.push(`i.vendor_id = $${idx++}`); values.push(vendorId); }
  if (search) {
    conditions.push(`(i.invoice_number ILIKE $${idx} OR v.name ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) FROM invoices i JOIN vendors v ON i.vendor_id = v.id ${where}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT i.*, v.name AS vendor_name, po.po_number
     FROM invoices i
     JOIN vendors v ON i.vendor_id = v.id
     LEFT JOIN purchase_orders po ON i.po_id = po.id
     ${where}
     ORDER BY i.invoice_date DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return { invoices: result.rows, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Update invoice status (e.g., mark as paid)
 */
const updateInvoiceStatus = async (invoiceId, status, paidAmount, updatedBy) => {
  let setPaid = '';
  const values = [status];
  let idx = 2;

  if (status === 'paid') {
    const inv = await getInvoiceById(invoiceId);
    setPaid = `, paid_amount = $${idx++}, due_amount = 0, paid_at = NOW()`;
    values.push(paidAmount || inv.grand_total);
  }

  values.push(invoiceId);
  const result = await query(
    `UPDATE invoices SET status = $1 ${setPaid} WHERE id = $${idx} RETURNING *`,
    values
  );

  if (result.rows.length === 0) throw new AppError('Invoice not found', 404);

  await activityLogService.log({
    userId: updatedBy,
    module: 'invoice',
    action: 'INVOICE_STATUS_CHANGED',
    description: `Invoice ${result.rows[0].invoice_number} status changed to ${status}`,
    entityType: 'invoice',
    entityId: invoiceId,
  });

  // Send payment confirmation email to vendor when marked as paid
  if (status === 'paid') {
    const fullInvoice = await getInvoiceById(invoiceId);
    const vendorResult = await query('SELECT email, name FROM vendors WHERE id = $1', [fullInvoice.vendor_id]);
    if (vendorResult.rows.length > 0) {
      emailService.sendInvoicePaidEmail({
        recipientEmail: vendorResult.rows[0].email,
        recipientName: vendorResult.rows[0].name,
        invoice: fullInvoice,
      }).catch(() => {});
    }
  }

  return result.rows[0];
};

/**
 * Get invoice for a specific PO
 */
const getInvoiceByPO = async (poId) => {
  const result = await query('SELECT id FROM invoices WHERE po_id = $1 LIMIT 1', [poId]);
  if (result.rows.length === 0) throw new AppError('No invoice found for this PO', 404);
  return await getInvoiceById(result.rows[0].id);
};

module.exports = { createInvoice, getInvoiceById, getInvoices, updateInvoiceStatus, getInvoiceByPO };
