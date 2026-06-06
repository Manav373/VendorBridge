const { query, getClient } = require('../config/database');
const { generateRFQNumber } = require('../utils/generateId');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const activityLogService = require('./activityLog.service');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a new RFQ with items
 */
const createRFQ = async (data, createdBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const rfqNumber = await generateRFQNumber();

    const rfqResult = await client.query(
      `INSERT INTO rfqs (rfq_number, title, description, category, status, priority, deadline, estimated_value, created_by, assigned_to, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        rfqNumber, data.title, data.description || null, data.category,
        data.status || 'draft', data.priority || 'medium', data.deadline,
        data.estimatedValue || null, createdBy, data.assignedTo || createdBy, data.notes || null,
      ]
    );

    const rfq = rfqResult.rows[0];

    // Insert line items
    if (data.items && data.items.length > 0) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        await client.query(
          'INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
          [rfq.id, item.name, item.description || null, item.qty || item.quantity || 1, item.unit || 'pcs', i]
        );
      }
    }

    await client.query('COMMIT');

    await activityLogService.log({
      userId: createdBy,
      module: 'rfq',
      action: 'RFQ_CREATED',
      description: `RFQ created: ${rfq.rfq_number} - ${rfq.title}`,
      entityType: 'rfq',
      entityId: rfq.id,
    });

    return await getRFQById(rfq.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get all RFQs with filters and pagination
 */
const getRFQs = async (queryParams) => {
  const { page, limit, offset } = getPaginationParams(queryParams);
  const { status, category, priority, search, createdBy, sortBy = 'created_at', sortOrder = 'DESC' } = queryParams;

  let conditions = [];
  let values = [];
  let idx = 1;

  if (status) { conditions.push(`r.status = $${idx++}`); values.push(status); }
  if (category) { conditions.push(`r.category = $${idx++}`); values.push(category); }
  if (priority) { conditions.push(`r.priority = $${idx++}`); values.push(priority); }
  if (createdBy) { conditions.push(`r.created_by = $${idx++}`); values.push(createdBy); }
  if (search) {
    conditions.push(`(r.title ILIKE $${idx} OR r.rfq_number ILIKE $${idx} OR r.description ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM rfqs r ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT r.*,
       u.first_name || ' ' || u.last_name AS created_by_name,
       a.first_name || ' ' || a.last_name AS assigned_to_name,
       (SELECT COUNT(*) FROM rfq_items WHERE rfq_id = r.id) AS item_count,
       (SELECT COUNT(*) FROM rfq_vendors WHERE rfq_id = r.id) AS vendor_count,
       (SELECT COUNT(*) FROM quotations WHERE rfq_id = r.id) AS quotation_count
     FROM rfqs r
     LEFT JOIN users u ON r.created_by = u.id
     LEFT JOIN users a ON r.assigned_to = a.id
     ${where}
     ORDER BY r.${sortBy} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return { rfqs: result.rows, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Get single RFQ with items, vendors, and quotations
 */
const getRFQById = async (rfqId) => {
  const result = await query(
    `SELECT r.*,
       u.first_name || ' ' || u.last_name AS created_by_name,
       a.first_name || ' ' || a.last_name AS assigned_to_name
     FROM rfqs r
     LEFT JOIN users u ON r.created_by = u.id
     LEFT JOIN users a ON r.assigned_to = a.id
     WHERE r.id = $1`,
    [rfqId]
  );

  if (result.rows.length === 0) throw new AppError('RFQ not found', 404);
  const rfq = result.rows[0];

  // Fetch items
  const items = await query('SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY sort_order', [rfqId]);
  rfq.items = items.rows;

  // Fetch assigned vendors
  const vendors = await query(
    `SELECT rv.*, v.name AS vendor_name, v.email AS vendor_email, v.category, v.rating
     FROM rfq_vendors rv
     JOIN vendors v ON rv.vendor_id = v.id
     WHERE rv.rfq_id = $1`,
    [rfqId]
  );
  rfq.vendors = vendors.rows;

  // Fetch attachments
  const attachments = await query(
    "SELECT * FROM attachments WHERE entity_type = 'rfq' AND entity_id = $1",
    [rfqId]
  );
  rfq.attachments = attachments.rows;

  return rfq;
};

/**
 * Update RFQ
 */
const updateRFQ = async (rfqId, data, updatedBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE rfqs SET
         title = COALESCE($1, title), description = COALESCE($2, description),
         category = COALESCE($3, category), status = COALESCE($4, status),
         priority = COALESCE($5, priority), deadline = COALESCE($6, deadline),
         estimated_value = COALESCE($7, estimated_value), notes = COALESCE($8, notes)
       WHERE id = $9 RETURNING *`,
      [data.title, data.description, data.category, data.status, data.priority, data.deadline, data.estimatedValue, data.notes, rfqId]
    );

    if (result.rows.length === 0) throw new AppError('RFQ not found', 404);

    // Update items if provided
    if (data.items) {
      await client.query('DELETE FROM rfq_items WHERE rfq_id = $1', [rfqId]);
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        await client.query(
          'INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, sort_order) VALUES ($1,$2,$3,$4,$5,$6)',
          [rfqId, item.name, item.description || null, item.qty || item.quantity || 1, item.unit || 'pcs', i]
        );
      }
    }

    await client.query('COMMIT');

    await activityLogService.log({
      userId: updatedBy,
      module: 'rfq',
      action: 'RFQ_UPDATED',
      description: `RFQ updated: ${result.rows[0].rfq_number}`,
      entityType: 'rfq',
      entityId: rfqId,
    });

    return await getRFQById(rfqId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete RFQ
 */
const deleteRFQ = async (rfqId, deletedBy) => {
  const rfq = await getRFQById(rfqId);
  if (['active', 'completed'].includes(rfq.status)) {
    throw new AppError('Cannot delete an active or completed RFQ', 400);
  }

  await query('DELETE FROM rfqs WHERE id = $1', [rfqId]);

  await activityLogService.log({
    userId: deletedBy,
    module: 'rfq',
    action: 'RFQ_DELETED',
    description: `RFQ deleted: ${rfq.rfq_number} - ${rfq.title}`,
    entityType: 'rfq',
    entityId: rfqId,
  });
};

/**
 * Assign vendors to RFQ and send email invitations
 */
const assignVendors = async (rfqId, vendorIds, assignedBy) => {
  const rfq = await getRFQById(rfqId);

  for (const vendorId of vendorIds) {
    await query(
      `INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES ($1, $2) ON CONFLICT (rfq_id, vendor_id) DO NOTHING`,
      [rfqId, vendorId]
    );
  }

  // Update RFQ status to active when vendors are assigned
  if (rfq.status === 'draft') {
    await query("UPDATE rfqs SET status = 'active' WHERE id = $1", [rfqId]);
  }

  // Send email invitations to vendors (non-blocking)
  const vendorResult = await query(
    'SELECT v.name, v.email FROM vendors v WHERE v.id = ANY($1::uuid[])',
    [vendorIds]
  );

  const items = await query('SELECT * FROM rfq_items WHERE rfq_id = $1 ORDER BY sort_order', [rfqId]);

  for (const vendor of vendorResult.rows) {
    emailService.sendRFQInvitationEmail({
      vendorEmail: vendor.email,
      vendorName: vendor.name,
      rfq,
      items: items.rows,
    }).catch(() => {});

    // Mark email as sent
    await query(
      'UPDATE rfq_vendors SET email_sent = true WHERE rfq_id = $1 AND vendor_id = (SELECT id FROM vendors WHERE email = $2)',
      [rfqId, vendor.email]
    );
  }

  await activityLogService.log({
    userId: assignedBy,
    module: 'rfq',
    action: 'VENDORS_ASSIGNED',
    description: `${vendorIds.length} vendor(s) assigned to RFQ ${rfq.rfq_number}`,
    entityType: 'rfq',
    entityId: rfqId,
  });

  return await getRFQById(rfqId);
};

/**
 * Update RFQ status
 */
const updateRFQStatus = async (rfqId, status, updatedBy) => {
  const result = await query(
    'UPDATE rfqs SET status = $1 WHERE id = $2 RETURNING *',
    [status, rfqId]
  );

  if (result.rows.length === 0) throw new AppError('RFQ not found', 404);

  await activityLogService.log({
    userId: updatedBy,
    module: 'rfq',
    action: 'RFQ_STATUS_CHANGED',
    description: `RFQ ${result.rows[0].rfq_number} status changed to ${status}`,
    entityType: 'rfq',
    entityId: rfqId,
  });

  // Notify all assigned vendors when RFQ is closed, cancelled, or completed
  if (['closed', 'cancelled', 'completed'].includes(status)) {
    const rfq = result.rows[0];
    const vendorResult = await query(
      `SELECT v.name, v.email FROM vendors v
       JOIN rfq_vendors rv ON rv.vendor_id = v.id
       WHERE rv.rfq_id = $1 AND v.email IS NOT NULL`,
      [rfqId]
    );
    for (const vendor of vendorResult.rows) {
      emailService.sendRFQStatusEmail({
        vendorEmail: vendor.email,
        vendorName: vendor.name,
        rfq,
        newStatus: status,
      }).catch(() => {});
    }
  }

  return result.rows[0];
};

module.exports = { createRFQ, getRFQs, getRFQById, updateRFQ, deleteRFQ, assignVendors, updateRFQStatus };
