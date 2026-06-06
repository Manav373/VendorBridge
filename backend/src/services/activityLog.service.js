const { query } = require('../config/database');

/**
 * Log an activity event
 */
const log = async ({
  userId = null,
  userName = 'System',
  module,
  action,
  description,
  entityType = null,
  entityId = null,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) => {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, user_name, module, action, description, entity_type, entity_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, userName, module, action, description, entityType, entityId, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    // Activity logging should never crash the main flow
    console.error('Activity log failed:', error.message);
  }
};

/**
 * Get all activity logs with pagination and filters
 */
const getLogs = async ({ page = 1, limit = 20, module: mod, userId, search }) => {
  const offset = (page - 1) * limit;
  let conditions = [];
  let values = [];
  let idx = 1;

  if (mod) { conditions.push(`module = $${idx++}`); values.push(mod); }
  if (userId) { conditions.push(`user_id = $${idx++}`); values.push(userId); }
  if (search) {
    conditions.push(`(action ILIKE $${idx} OR description ILIKE $${idx} OR user_name ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM activity_logs ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT al.*, u.first_name, u.last_name
     FROM activity_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return {
    logs: result.rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Get logs for a specific module
 */
const getModuleLogs = async (module, limit = 50) => {
  const result = await query(
    'SELECT * FROM activity_logs WHERE module = $1 ORDER BY created_at DESC LIMIT $2',
    [module, limit]
  );
  return result.rows;
};

module.exports = { log, getLogs, getModuleLogs };
