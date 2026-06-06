const { query, getClient } = require('../config/database');
const { generateVendorCode } = require('../utils/generateId');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const activityLogService = require('./activityLog.service');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { AppError } = require('../middleware/errorHandler');

/**
 * Create a new vendor
 */
const createVendor = async (data, createdBy) => {
  const vendorCode = await generateVendorCode();

  const result = await query(
    `INSERT INTO vendors (vendor_code, name, email, phone, website, category, status, country, state, city, address, pincode, gst_number, pan_number, bank_name, bank_account, bank_ifsc, contact_person, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
     RETURNING *`,
    [
      vendorCode, data.name, data.email, data.phone || null, data.website || null,
      data.category, data.status || 'pending', data.country || null, data.state || null,
      data.city || null, data.address || null, data.pincode || null,
      data.gstNumber || null, data.panNumber || null,
      data.bankName || null, data.bankAccount || null, data.bankIfsc || null,
      data.contactPerson || null, data.notes || null, createdBy,
    ]
  );

  const vendor = result.rows[0];

  await activityLogService.log({
    userId: createdBy,
    module: 'vendor',
    action: 'VENDOR_CREATED',
    description: `New vendor created: ${vendor.name} (${vendor.vendor_code})`,
    entityType: 'vendor',
    entityId: vendor.id,
  });

  return vendor;
};

/**
 * Get all vendors with filters and pagination
 */
const getVendors = async (queryParams) => {
  const { page, limit, offset } = getPaginationParams(queryParams);
  const { status, category, country, search, sortBy = 'created_at', sortOrder = 'DESC' } = queryParams;

  let conditions = [];
  let values = [];
  let idx = 1;

  if (status) { conditions.push(`v.status = $${idx++}`); values.push(status); }
  if (category) { conditions.push(`v.category = $${idx++}`); values.push(category); }
  if (country) { conditions.push(`v.country = $${idx++}`); values.push(country); }
  if (search) {
    conditions.push(`(v.name ILIKE $${idx} OR v.email ILIKE $${idx} OR v.vendor_code ILIKE $${idx} OR v.contact_person ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const allowedSort = ['name', 'rating', 'total_orders', 'total_value', 'created_at', 'status'];
  const sort = allowedSort.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'ASC' ? 'ASC' : 'DESC';

  const countResult = await query(`SELECT COUNT(*) FROM vendors v ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT v.*, u.first_name || ' ' || u.last_name AS created_by_name
     FROM vendors v
     LEFT JOIN users u ON v.created_by = u.id
     ${where}
     ORDER BY v.${sort} ${order}
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return { vendors: result.rows, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Get single vendor by ID
 */
const getVendorById = async (vendorId) => {
  const result = await query(
    `SELECT v.*, u.first_name || ' ' || u.last_name AS created_by_name
     FROM vendors v
     LEFT JOIN users u ON v.created_by = u.id
     WHERE v.id = $1`,
    [vendorId]
  );

  if (result.rows.length === 0) throw new AppError('Vendor not found', 404);
  return result.rows[0];
};

/**
 * Update vendor
 */
const updateVendor = async (vendorId, data, updatedBy) => {
  const existing = await getVendorById(vendorId);

  const result = await query(
    `UPDATE vendors SET
       name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone),
       website = COALESCE($4, website), category = COALESCE($5, category),
       country = COALESCE($6, country), state = COALESCE($7, state), city = COALESCE($8, city),
       address = COALESCE($9, address), pincode = COALESCE($10, pincode),
       gst_number = COALESCE($11, gst_number), pan_number = COALESCE($12, pan_number),
       bank_name = COALESCE($13, bank_name), bank_account = COALESCE($14, bank_account),
       bank_ifsc = COALESCE($15, bank_ifsc), contact_person = COALESCE($16, contact_person),
       notes = COALESCE($17, notes)
     WHERE id = $18
     RETURNING *`,
    [
      data.name, data.email, data.phone, data.website, data.category,
      data.country, data.state, data.city, data.address, data.pincode,
      data.gstNumber, data.panNumber, data.bankName, data.bankAccount, data.bankIfsc,
      data.contactPerson, data.notes, vendorId,
    ]
  );

  await activityLogService.log({
    userId: updatedBy,
    module: 'vendor',
    action: 'VENDOR_UPDATED',
    description: `Vendor updated: ${existing.name}`,
    entityType: 'vendor',
    entityId: vendorId,
  });

  return result.rows[0];
};

/**
 * Delete vendor
 */
const deleteVendor = async (vendorId, deletedBy) => {
  const existing = await getVendorById(vendorId);

  await query('DELETE FROM vendors WHERE id = $1', [vendorId]);

  await activityLogService.log({
    userId: deletedBy,
    module: 'vendor',
    action: 'VENDOR_DELETED',
    description: `Vendor deleted: ${existing.name} (${existing.vendor_code})`,
    entityType: 'vendor',
    entityId: vendorId,
  });
};

/**
 * Update vendor status
 */
const updateVendorStatus = async (vendorId, status, updatedBy, reason) => {
  const result = await query(
    'UPDATE vendors SET status = $1 WHERE id = $2 RETURNING *',
    [status, vendorId]
  );

  if (result.rows.length === 0) throw new AppError('Vendor not found', 404);

  await activityLogService.log({
    userId: updatedBy,
    module: 'vendor',
    action: 'VENDOR_STATUS_CHANGED',
    description: `Vendor ${result.rows[0].name} status changed to ${status}`,
    entityType: 'vendor',
    entityId: vendorId,
  });

  // Notify vendor via email (non-blocking)
  if (result.rows[0].email) {
    emailService.sendVendorStatusEmail({
      vendorEmail: result.rows[0].email,
      vendorName: result.rows[0].name,
      status,
      reason: reason || null,
    }).catch(() => {});
  }

  return result.rows[0];
};

/**
 * Get all unique vendor categories
 */
const getVendorCategories = async () => {
  const result = await query(
    'SELECT DISTINCT category, COUNT(*) as count FROM vendors GROUP BY category ORDER BY count DESC'
  );
  return result.rows;
};

/**
 * Get vendor stats (for dashboard)
 */
const getVendorStats = async () => {
  const result = await query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'active') as active,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'inactive') as inactive,
       COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
       COUNT(*) as total,
       COALESCE(SUM(total_value), 0) as total_value,
       COALESCE(AVG(rating), 0) as avg_rating
     FROM vendors`
  );
  return result.rows[0];
};

module.exports = { createVendor, getVendors, getVendorById, updateVendor, deleteVendor, updateVendorStatus, getVendorCategories, getVendorStats };
