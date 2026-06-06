const { query } = require('../config/database');

/**
 * Create a notification for a user
 */
const createNotification = async ({ userId, type, title, message, entityId, entityType }) => {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, entity_id, entity_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, type, title, message || null, entityId || null, entityType || null]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Notification creation failed:', error.message);
  }
};

/**
 * Send notification to multiple users
 */
const notifyMany = async (userIds, { type, title, message, entityId, entityType }) => {
  for (const userId of userIds) {
    await createNotification({ userId, type, title, message, entityId, entityType });
  }
};

/**
 * Get notifications for a user
 */
const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false }) => {
  const offset = (page - 1) * limit;
  const where = unreadOnly ? 'WHERE user_id = $1 AND is_read = false' : 'WHERE user_id = $1';

  const countResult = await query(`SELECT COUNT(*) FROM notifications ${where}`, [userId]);
  const total = parseInt(countResult.rows[0].count);

  const unreadCount = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );

  const result = await query(
    `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return {
    notifications: result.rows,
    unreadCount: parseInt(unreadCount.rows[0].count),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId, userId) => {
  const result = await query(
    'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *',
    [notificationId, userId]
  );
  return result.rows[0];
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  await query(
    'UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false',
    [userId]
  );
};

/**
 * Delete a notification
 */
const deleteNotification = async (notificationId, userId) => {
  await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [notificationId, userId]);
};

module.exports = {
  createNotification,
  notifyMany,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
