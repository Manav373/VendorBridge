const { query, getClient } = require('../config/database');
const { generateApprovalNumber } = require('../utils/generateId');
const { getPaginationParams, buildPaginationMeta } = require('../utils/pagination');
const activityLogService = require('./activityLog.service');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { AppError } = require('../middleware/errorHandler');

const DEFAULT_TIMELINE = [
  { step: 'Quotation Selected', sort_order: 0 },
  { step: 'Department Review', sort_order: 1 },
  { step: 'Finance Approval', sort_order: 2 },
  { step: 'Final Authorization', sort_order: 3 },
];

/**
 * Create an approval request
 */
const createApproval = async (data, requestedBy) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const approvalNumber = await generateApprovalNumber();

    const result = await client.query(
      `INSERT INTO approvals (approval_number, rfq_id, quotation_id, title, description, amount, status, priority, requested_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        approvalNumber, data.rfqId || null, data.quotationId || null,
        data.title, data.description || null, data.amount || null,
        'pending', data.priority || 'medium', requestedBy,
      ]
    );

    const approval = result.rows[0];

    // Create timeline steps
    for (const step of DEFAULT_TIMELINE) {
      await client.query(
        `INSERT INTO approval_timeline (approval_id, step_name, step_status, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [approval.id, step.step, step.sort_order === 0 ? 'completed' : 'waiting', step.sort_order]
      );
    }

    await client.query('COMMIT');

    await activityLogService.log({
      userId: requestedBy,
      module: 'approval',
      action: 'APPROVAL_REQUESTED',
      description: `Approval requested: ${approvalNumber} - ${data.title}`,
      entityType: 'approval',
      entityId: approval.id,
    });

    return await getApprovalById(approval.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get approval by ID with timeline
 */
const getApprovalById = async (approvalId) => {
  const result = await query(
    `SELECT a.*,
       req.first_name || ' ' || req.last_name AS requested_by_name,
       req.email AS requested_by_email,
       appr.first_name || ' ' || appr.last_name AS approved_by_name,
       rej.first_name || ' ' || rej.last_name AS rejected_by_name
     FROM approvals a
     LEFT JOIN users req ON a.requested_by = req.id
     LEFT JOIN users appr ON a.approved_by = appr.id
     LEFT JOIN users rej ON a.rejected_by = rej.id
     WHERE a.id = $1`,
    [approvalId]
  );

  if (result.rows.length === 0) throw new AppError('Approval not found', 404);
  const approval = result.rows[0];

  // Fetch timeline
  const timeline = await query(
    `SELECT at.*, u.first_name || ' ' || u.last_name AS actioned_by_name_joined
     FROM approval_timeline at
     LEFT JOIN users u ON at.actioned_by = u.id
     WHERE at.approval_id = $1
     ORDER BY at.sort_order`,
    [approvalId]
  );
  approval.timeline = timeline.rows;

  return approval;
};

/**
 * Get all approvals with filters
 */
const getApprovals = async (queryParams) => {
  const { page, limit, offset } = getPaginationParams(queryParams);
  const { status, priority, search } = queryParams;

  let conditions = [];
  let values = [];
  let idx = 1;

  if (status) { conditions.push(`a.status = $${idx++}`); values.push(status); }
  if (priority) { conditions.push(`a.priority = $${idx++}`); values.push(priority); }
  if (search) {
    conditions.push(`(a.title ILIKE $${idx} OR a.approval_number ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM approvals a ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  const result = await query(
    `SELECT a.*,
       u.first_name || ' ' || u.last_name AS requested_by_name
     FROM approvals a
     LEFT JOIN users u ON a.requested_by = u.id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    [...values, limit, offset]
  );

  return { approvals: result.rows, pagination: buildPaginationMeta(total, page, limit) };
};

/**
 * Approve a request
 */
const approveRequest = async (approvalId, approverId, remarks) => {
  const approval = await getApprovalById(approvalId);

  if (approval.status !== 'pending') {
    throw new AppError(`Cannot approve an approval that is ${approval.status}`, 400);
  }

  // Get approver info
  const approverResult = await query(
    'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
    [approverId]
  );
  if (approverResult.rows.length === 0) throw new AppError('Approver not found', 404);
  const approver = approverResult.rows[0];

  // Update approval
  await query(
    `UPDATE approvals SET status = 'approved', approved_by = $1, approved_at = NOW(), remarks = $2 WHERE id = $3`,
    [approverId, remarks || null, approvalId]
  );

  // Update timeline — move next step to completed
  const pendingStep = approval.timeline.find(s => s.step_status === 'waiting' || s.step_status === 'pending');
  if (pendingStep) {
    await query(
      `UPDATE approval_timeline SET step_status = 'completed', actioned_by = $1, actioned_by_name = $2, actioned_at = NOW(), remarks = $3
       WHERE id = $4`,
      [approverId, `${approver.first_name} ${approver.last_name}`, remarks || null, pendingStep.id]
    );
  }

  // Notify requester
  const requesterResult = await query(
    'SELECT email, first_name || \' \' || last_name AS name FROM users WHERE id = $1',
    [approval.requested_by]
  );

  if (requesterResult.rows.length > 0) {
    const requester = requesterResult.rows[0];
    await notificationService.createNotification({
      userId: approval.requested_by,
      type: 'approval',
      title: 'Approval Granted ✅',
      message: `Your approval request ${approval.approval_number} has been approved`,
      entityId: approvalId,
      entityType: 'approval',
    });

    const updatedApproval = await getApprovalById(approvalId);
    emailService.sendApprovalEmail({
      recipientEmail: requester.email,
      recipientName: requester.name,
      approval: updatedApproval,
      status: 'approved',
      remarks,
    }).catch(() => {});
  }

  await activityLogService.log({
    userId: approverId,
    module: 'approval',
    action: 'APPROVAL_APPROVED',
    description: `Approval ${approval.approval_number} approved by ${approver.first_name} ${approver.last_name}`,
    entityType: 'approval',
    entityId: approvalId,
  });

  return await getApprovalById(approvalId);
};

/**
 * Reject a request
 */
const rejectRequest = async (approvalId, rejectorId, remarks) => {
  const approval = await getApprovalById(approvalId);

  if (approval.status !== 'pending') {
    throw new AppError(`Cannot reject an approval that is ${approval.status}`, 400);
  }

  const rejectorResult = await query(
    'SELECT id, first_name, last_name, email FROM users WHERE id = $1',
    [rejectorId]
  );
  const rejector = rejectorResult.rows[0];

  await query(
    `UPDATE approvals SET status = 'rejected', rejected_by = $1, rejected_at = NOW(), remarks = $2 WHERE id = $3`,
    [rejectorId, remarks || null, approvalId]
  );

  // Update timeline
  const pendingStep = approval.timeline.find(s => ['waiting', 'pending'].includes(s.step_status));
  if (pendingStep) {
    await query(
      `UPDATE approval_timeline SET step_status = 'rejected', actioned_by = $1, actioned_by_name = $2, actioned_at = NOW(), remarks = $3
       WHERE id = $4`,
      [rejectorId, `${rejector.first_name} ${rejector.last_name}`, remarks, pendingStep.id]
    );
  }

  // Notify requester
  const requesterResult = await query(
    'SELECT email, first_name || \' \' || last_name AS name FROM users WHERE id = $1',
    [approval.requested_by]
  );

  if (requesterResult.rows.length > 0) {
    const requester = requesterResult.rows[0];
    await notificationService.createNotification({
      userId: approval.requested_by,
      type: 'approval',
      title: 'Approval Rejected ❌',
      message: `Your approval request ${approval.approval_number} has been rejected`,
      entityId: approvalId,
      entityType: 'approval',
    });

    const updatedApproval = await getApprovalById(approvalId);
    emailService.sendApprovalEmail({
      recipientEmail: requester.email,
      recipientName: requester.name,
      approval: updatedApproval,
      status: 'rejected',
      remarks,
    }).catch(() => {});
  }

  await activityLogService.log({
    userId: rejectorId,
    module: 'approval',
    action: 'APPROVAL_REJECTED',
    description: `Approval ${approval.approval_number} rejected`,
    entityType: 'approval',
    entityId: approvalId,
  });

  return await getApprovalById(approvalId);
};

module.exports = { createApproval, getApprovalById, getApprovals, approveRequest, rejectRequest };
