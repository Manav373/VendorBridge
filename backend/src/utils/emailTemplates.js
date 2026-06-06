/**
 * Email HTML templates for VendorBridge
 */

const baseLayout = (content, title = 'VendorBridge Notification') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #e2e8f0; }
    .container { max-width: 680px; margin: 0 auto; background: #1e293b; }
    .header { background: linear-gradient(135deg, #065f46 0%, #064e3b 100%); padding: 32px 40px; text-align: center; }
    .logo { display: inline-flex; align-items: center; gap: 10px; text-decoration: none; }
    .logo-icon { width: 40px; height: 40px; background: #10b981; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; }
    .logo-text { font-size: 22px; font-weight: 700; color: #fff; }
    .logo-sub { font-size: 11px; color: #6ee7b7; }
    .content { padding: 40px; }
    .card { background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin: 20px 0; }
    h1 { font-size: 24px; font-weight: 700; color: #f1f5f9; margin-bottom: 8px; }
    h2 { font-size: 18px; font-weight: 600; color: #e2e8f0; margin-bottom: 12px; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.7; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-green { background: #064e3b; color: #34d399; }
    .badge-blue { background: #1e3a5f; color: #60a5fa; }
    .badge-orange { background: #431407; color: #fb923c; }
    .badge-red { background: #450a0a; color: #f87171; }
    .btn { display: inline-block; padding: 12px 28px; background: #10b981; color: #fff; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; margin: 16px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    th { background: #1e293b; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; }
    td { padding: 10px 12px; border-bottom: 1px solid #1e293b; color: #e2e8f0; font-size: 13px; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: 700; color: #10b981; font-size: 14px; background: #064e3b20; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
    .meta-item { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px 16px; }
    .meta-label { font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .meta-value { font-size: 14px; color: #f1f5f9; font-weight: 500; }
    .otp-box { background: #064e3b; border: 2px solid #10b981; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; }
    .otp-code { font-size: 40px; font-weight: 800; color: #34d399; letter-spacing: 10px; font-family: monospace; }
    .footer { padding: 24px 40px; background: #0f172a; border-top: 1px solid #1e293b; text-align: center; }
    .footer p { font-size: 12px; color: #475569; }
    .divider { border: none; border-top: 1px solid #334155; margin: 20px 0; }
    .highlight { color: #10b981; font-weight: 600; }
    .warning-box { background: #431407; border: 1px solid #ea580c; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .success-box { background: #064e3b; border: 1px solid #059669; border-radius: 8px; padding: 16px; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">
        <div class="logo-icon">⚡</div>
        <div>
          <div class="logo-text">VendorBridge</div>
          <div class="logo-sub">Enterprise ERP Platform</div>
        </div>
      </div>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VendorBridge ERP. All rights reserved.</p>
      <p style="margin-top:6px;">This is an automated message. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Welcome email after signup
 */
const welcomeEmail = ({ firstName, email, role }) => ({
  subject: '🎉 Welcome to VendorBridge ERP',
  html: baseLayout(`
    <h1>Welcome, ${firstName}! 👋</h1>
    <p>Your VendorBridge account has been created successfully. You can now access the platform and start managing your procurement workflows.</p>
    <div class="card">
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Email</div>
          <div class="meta-value">${email}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Role</div>
          <div class="meta-value">${role.replace('_', ' ').toUpperCase()}</div>
        </div>
      </div>
    </div>
    <a class="btn" href="${process.env.CLIENT_URL}/login">Sign In to VendorBridge</a>
  `, 'Welcome to VendorBridge'),
});

/**
 * Password reset OTP email
 */
const forgotPasswordEmail = ({ firstName, otp }) => ({
  subject: '🔐 VendorBridge - Password Reset Code',
  html: baseLayout(`
    <h1>Reset Your Password</h1>
    <p>Hi ${firstName}, we received a request to reset your VendorBridge account password. Use the OTP below to proceed.</p>
    <div class="otp-box">
      <div style="font-size:12px;color:#6ee7b7;font-weight:600;margin-bottom:12px;text-transform:uppercase;">Your One-Time Password</div>
      <div class="otp-code">${otp}</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:12px;">Valid for <strong style="color:#34d399">15 minutes</strong></div>
    </div>
    <div class="warning-box">
      <p style="color:#fb923c;margin:0;">⚠️ Never share this OTP with anyone. VendorBridge staff will never ask for this code.</p>
    </div>
    <p>If you didn't request this, please ignore this email or contact support if you suspect unauthorized access.</p>
  `, 'Password Reset'),
});

/**
 * RFQ invitation email to vendor with full quotation form in email
 */
const rfqInvitationEmail = ({ vendorName, rfq, items, quotationLink }) => ({
  subject: `📋 RFQ Invitation: ${rfq.rfq_number} - ${rfq.title}`,
  html: baseLayout(`
    <h1>Request for Quotation</h1>
    <p>Dear <span class="highlight">${vendorName}</span>, you have been invited to submit a quotation for the following procurement request.</p>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <h2 style="margin:0;">${rfq.title}</h2>
        <span class="badge badge-orange">${rfq.priority?.toUpperCase() || 'MEDIUM'} PRIORITY</span>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">RFQ Number</div>
          <div class="meta-value highlight">${rfq.rfq_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Category</div>
          <div class="meta-value">${rfq.category}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Submission Deadline</div>
          <div class="meta-value" style="color:#f87171;">📅 ${new Date(rfq.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="badge badge-green">ACTIVE</span></div>
        </div>
      </div>

      ${rfq.description ? `<hr class="divider"><p>${rfq.description}</p>` : ''}
    </div>

    <h2>📦 Items Required</h2>
    <div class="card" style="padding:0;overflow:hidden;">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item Description</th>
            <th>Quantity</th>
            <th>Unit</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.item_name}</td>
              <td>${item.quantity}</td>
              <td>${item.unit}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <h2>💰 Your Quotation Form</h2>
    <p>Please fill in your pricing for each item below and submit your quotation through the portal:</p>
    
    <div class="card" style="padding:0;overflow:hidden;">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Item Description</th>
            <th>Qty</th>
            <th>Unit</th>
            <th>Unit Price (₹)</th>
            <th>Total (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${item.item_name}</td>
              <td>${item.quantity}</td>
              <td>${item.unit}</td>
              <td style="color:#94a3b8;font-style:italic;">Enter price</td>
              <td style="color:#94a3b8;font-style:italic;">Auto-calculated</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="5" style="text-align:right;padding-right:16px;">Grand Total</td>
            <td>₹ _____________</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="success-box">
      <p style="color:#34d399;margin:0;font-weight:600;">📌 Additional Quotation Details Required:</p>
      <ul style="color:#6ee7b7;margin-top:8px;padding-left:20px;font-size:13px;">
        <li>Delivery Timeline (in working days)</li>
        <li>Quotation Validity Date</li>
        <li>Payment Terms</li>
        <li>Any additional remarks or conditions</li>
      </ul>
    </div>

    <a class="btn" href="${quotationLink || process.env.CLIENT_URL}">Submit Quotation Online</a>

    <div class="warning-box" style="margin-top:20px;">
      <p style="color:#fb923c;margin:0;font-size:13px;">⏰ <strong>Deadline: ${new Date(rfq.deadline).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</strong> — Quotations submitted after the deadline will not be considered.</p>
    </div>
  `, `RFQ: ${rfq.rfq_number}`),
});

/**
 * Approval notification email
 */
const approvalEmail = ({ recipientName, approval, status, remarks }) => ({
  subject: `${status === 'approved' ? '✅' : '❌'} Approval ${status === 'approved' ? 'Granted' : 'Rejected'}: ${approval.approval_number}`,
  html: baseLayout(`
    <h1>Approval ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h1>
    <p>Hi ${recipientName}, your approval request <span class="highlight">${approval.approval_number}</span> has been <strong>${status}</strong>.</p>
    <div class="card">
      <h2>${approval.title}</h2>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Approval Number</div>
          <div class="meta-value">${approval.approval_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Amount</div>
          <div class="meta-value">₹${Number(approval.amount || 0).toLocaleString('en-IN')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="badge ${status === 'approved' ? 'badge-green' : 'badge-red'}">${status.toUpperCase()}</span></div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Date</div>
          <div class="meta-value">${new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>
      ${remarks ? `<hr class="divider"><p><strong>Remarks:</strong> ${remarks}</p>` : ''}
    </div>
    <a class="btn" href="${process.env.CLIENT_URL}/approvals">View Approval Details</a>
  `, 'Approval Notification'),
});

/**
 * Invoice email
 */
const invoiceEmail = ({ recipientName, invoice, items }) => ({
  subject: `🧾 Invoice ${invoice.invoice_number} from VendorBridge`,
  html: baseLayout(`
    <h1>Invoice</h1>
    <div style="display:flex;justify-content:space-between;margin-bottom:20px;">
      <div>
        <p style="color:#94a3b8;font-size:12px;">INVOICE NUMBER</p>
        <p class="highlight" style="font-size:20px;font-weight:700;">${invoice.invoice_number}</p>
      </div>
      <div style="text-align:right;">
        <span class="badge ${invoice.status === 'paid' ? 'badge-green' : invoice.status === 'overdue' ? 'badge-red' : 'badge-blue'}">${invoice.status?.toUpperCase()}</span>
      </div>
    </div>
    
    <div class="meta-grid">
      <div class="meta-item">
        <div class="meta-label">Invoice Date</div>
        <div class="meta-value">${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Due Date</div>
        <div class="meta-value" style="color:#f87171;">${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'N/A'}</div>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.item_name}</td>
              <td>${item.quantity} ${item.unit || ''}</td>
              <td>₹${Number(item.unit_price).toLocaleString('en-IN')}</td>
              <td>₹${Number(item.total_price).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="3" style="text-align:right;color:#94a3b8;">Subtotal</td><td>₹${Number(invoice.subtotal).toLocaleString('en-IN')}</td></tr>
          <tr><td colspan="3" style="text-align:right;color:#94a3b8;">Tax (${invoice.tax_percent}%)</td><td>₹${Number(invoice.tax_amount).toLocaleString('en-IN')}</td></tr>
          <tr class="total-row"><td colspan="3" style="text-align:right;">Grand Total</td><td>₹${Number(invoice.grand_total).toLocaleString('en-IN')}</td></tr>
        </tfoot>
      </table>
    </div>
    <a class="btn" href="${process.env.CLIENT_URL}/invoices">View Invoice</a>
  `, `Invoice ${invoice.invoice_number}`),
});

/**
 * Purchase Order email
 */
const purchaseOrderEmail = ({ vendorName, po, items }) => ({
  subject: `📦 Purchase Order: ${po.po_number}`,
  html: baseLayout(`
    <h1>Purchase Order</h1>
    <p>Dear <span class="highlight">${vendorName}</span>, a new Purchase Order has been generated for you.</p>

    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
        <h2 style="margin:0;">PO Details</h2>
        <span class="badge badge-green">NEW</span>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">PO Number</div>
          <div class="meta-value highlight">${po.po_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Order Date</div>
          <div class="meta-value">${new Date(po.order_date).toLocaleDateString('en-IN')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Expected Delivery</div>
          <div class="meta-value">${po.delivery_date ? new Date(po.delivery_date).toLocaleDateString('en-IN') : 'N/A'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="badge badge-blue">${(po.status || 'sent').toUpperCase()}</span></div>
        </div>
      </div>
    </div>

    <h2>📦 Order Items</h2>
    <div class="card" style="padding:0;overflow:hidden;">
      <table>
        <thead>
          <tr>
            <th>Item Description</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.item_name}</td>
              <td>${item.quantity} ${item.unit || 'pcs'}</td>
              <td>₹${Number(item.unit_price).toLocaleString('en-IN')}</td>
              <td>₹${Number(item.total_price).toLocaleString('en-IN')}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="3" style="text-align:right;color:#94a3b8;">Subtotal</td><td>₹${Number(po.subtotal).toLocaleString('en-IN')}</td></tr>
          <tr><td colspan="3" style="text-align:right;color:#94a3b8;">Tax (${po.tax_percent || 18}%)</td><td>₹${Number(po.tax_amount).toLocaleString('en-IN')}</td></tr>
          <tr class="total-row"><td colspan="3" style="text-align:right;">Grand Total</td><td>₹${Number(po.grand_total).toLocaleString('en-IN')}</td></tr>
        </tfoot>
      </table>
    </div>

    <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}">Login to VendorBridge</a>
  `, `PO: ${po.po_number}`),
});

/**
 * Quotation accepted email to vendor
 */
const quotationAcceptedEmail = ({ vendorName, quotation, po }) => ({
  subject: `🎉 Quotation Accepted: ${quotation.quotation_number}`,
  html: baseLayout(`
    <h1>Quotation Accepted! 🎉</h1>
    <p>Dear <span class="highlight">${vendorName}</span>, we are pleased to inform you that your quotation has been <strong>accepted</strong>.</p>

    <div class="success-box">
      <p style="color:#34d399;margin:0;font-weight:600;">✅ Your quotation ${quotation.quotation_number} has been selected for procurement.</p>
    </div>

    <div class="card">
      <h2>Quotation Details</h2>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Quotation Number</div>
          <div class="meta-value highlight">${quotation.quotation_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">RFQ Reference</div>
          <div class="meta-value">${quotation.rfq_number || 'N/A'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Total Amount</div>
          <div class="meta-value highlight">₹${Number(quotation.total_amount).toLocaleString('en-IN')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="badge badge-green">ACCEPTED</span></div>
        </div>
      </div>
    </div>

    ${po ? `
    <div class="card">
      <h2>📦 Purchase Order Raised</h2>
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">PO Number</div>
          <div class="meta-value highlight">${po.po_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Expected Delivery</div>
          <div class="meta-value">${po.delivery_date ? new Date(po.delivery_date).toLocaleDateString('en-IN') : 'TBD'}</div>
        </div>
      </div>
    </div>` : ''}

    <p>A Purchase Order will be / has been raised shortly. Please log in to the portal to view the complete details and confirm acceptance.</p>
    <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}">View Details</a>
  `, `Quotation Accepted: ${quotation.quotation_number}`),
});

/**
 * Quotation rejected email to vendor
 */
const quotationRejectedEmail = ({ vendorName, quotation, reason }) => ({
  subject: `❌ Quotation Update: ${quotation.quotation_number}`,
  html: baseLayout(`
    <h1>Quotation Not Selected</h1>
    <p>Dear <span class="highlight">${vendorName}</span>, thank you for submitting your quotation. After careful evaluation, we regret to inform you that your quotation was not selected for this procurement.</p>

    <div class="card">
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Quotation Number</div>
          <div class="meta-value">${quotation.quotation_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">RFQ Reference</div>
          <div class="meta-value">${quotation.rfq_number || 'N/A'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Total Quoted</div>
          <div class="meta-value">₹${Number(quotation.total_amount).toLocaleString('en-IN')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Status</div>
          <div class="meta-value"><span class="badge badge-red">NOT SELECTED</span></div>
        </div>
      </div>
      ${reason ? `<hr class="divider"><p><strong>Remarks:</strong> ${reason}</p>` : ''}
    </div>

    <p>We value your participation and encourage you to continue submitting quotations for future procurement opportunities. You will be notified for upcoming RFQs that match your category.</p>
    <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}">View All RFQs</a>
  `, `Quotation Update: ${quotation.quotation_number}`),
});

/**
 * Vendor status change notification email
 */
const vendorStatusEmail = ({ vendorName, vendorEmail, status, reason }) => {
  const isApproved = status === 'active';
  const isSuspended = status === 'suspended';
  const statusLabel = status.toUpperCase();
  const badgeClass = isApproved ? 'badge-green' : isSuspended ? 'badge-red' : 'badge-orange';

  return {
    subject: `🏢 VendorBridge Account Status Update: ${statusLabel}`,
    html: baseLayout(`
      <h1>Account Status Updated</h1>
      <p>Dear <span class="highlight">${vendorName}</span>, your VendorBridge vendor account status has been updated.</p>

      <div class="card">
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">Vendor Name</div>
            <div class="meta-value">${vendorName}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Email</div>
            <div class="meta-value">${vendorEmail}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">New Status</div>
            <div class="meta-value"><span class="badge ${badgeClass}">${statusLabel}</span></div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Effective Date</div>
            <div class="meta-value">${new Date().toLocaleDateString('en-IN')}</div>
          </div>
        </div>
        ${reason ? `<hr class="divider"><p><strong>Reason:</strong> ${reason}</p>` : ''}
      </div>

      ${isApproved ? `
      <div class="success-box">
        <p style="color:#34d399;margin:0;font-weight:600;">🎉 Your account is now active! You can participate in upcoming RFQs and submit quotations.</p>
      </div>` : ''}

      ${isSuspended ? `
      <div class="warning-box">
        <p style="color:#fb923c;margin:0;">⚠️ Your account has been suspended. Please contact our support team for further assistance.</p>
      </div>` : ''}

      <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}">Go to VendorBridge</a>
    `, 'Account Status Update'),
  };
};

/**
 * Invoice payment confirmation email
 */
const invoicePaidEmail = ({ recipientName, invoice }) => ({
  subject: `✅ Payment Received: Invoice ${invoice.invoice_number}`,
  html: baseLayout(`
    <h1>Payment Confirmed ✅</h1>
    <p>Dear <span class="highlight">${recipientName}</span>, we are pleased to confirm that payment has been processed for invoice <span class="highlight">${invoice.invoice_number}</span>.</p>

    <div class="success-box">
      <p style="color:#34d399;margin:0;font-weight:600;">💰 Payment of ₹${Number(invoice.grand_total).toLocaleString('en-IN')} has been marked as received.</p>
    </div>

    <div class="card">
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Invoice Number</div>
          <div class="meta-value highlight">${invoice.invoice_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Grand Total</div>
          <div class="meta-value highlight">₹${Number(invoice.grand_total).toLocaleString('en-IN')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Payment Status</div>
          <div class="meta-value"><span class="badge badge-green">PAID</span></div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Payment Date</div>
          <div class="meta-value">${new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>
    </div>

    <p>Thank you for your business. This email serves as a payment receipt. Please retain it for your records.</p>
    <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}/invoices">View Invoice</a>
  `, `Payment Received: ${invoice.invoice_number}`),
});

/**
 * RFQ status changed email to vendors
 */
const rfqStatusEmail = ({ vendorName, rfq, newStatus }) => {
  const statusMessages = {
    closed: { emoji: '🔒', label: 'Closed', msg: 'This RFQ has been closed. No further quotations will be accepted.', badgeClass: 'badge-orange' },
    cancelled: { emoji: '🚫', label: 'Cancelled', msg: 'This RFQ has been cancelled. We apologize for any inconvenience.', badgeClass: 'badge-red' },
    completed: { emoji: '✅', label: 'Completed', msg: 'This RFQ has been completed. Thank you for your participation.', badgeClass: 'badge-green' },
  };
  const info = statusMessages[newStatus] || { emoji: '📋', label: newStatus.toUpperCase(), msg: `The RFQ status has been updated to ${newStatus}.`, badgeClass: 'badge-blue' };

  return {
    subject: `${info.emoji} RFQ Status Update: ${rfq.rfq_number} — ${info.label}`,
    html: baseLayout(`
      <h1>RFQ Status Updated</h1>
      <p>Dear <span class="highlight">${vendorName}</span>, the following RFQ you were invited to has been updated.</p>

      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">
          <h2 style="margin:0;">${rfq.title}</h2>
          <span class="badge ${info.badgeClass}">${info.label.toUpperCase()}</span>
        </div>
        <div class="meta-grid">
          <div class="meta-item">
            <div class="meta-label">RFQ Number</div>
            <div class="meta-value highlight">${rfq.rfq_number}</div>
          </div>
          <div class="meta-item">
            <div class="meta-label">Category</div>
            <div class="meta-value">${rfq.category}</div>
          </div>
        </div>
        <hr class="divider">
        <p>${info.msg}</p>
      </div>

      <p>We appreciate your interest and look forward to working with you on future procurement opportunities.</p>
      <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}">View VendorBridge</a>
    `, `RFQ Update: ${rfq.rfq_number}`),
  };
};

/**
 * Quotation received acknowledgement to vendor
 */
const quotationReceivedEmail = ({ vendorName, quotation }) => ({
  subject: `📩 Quotation Received: ${quotation.quotation_number}`,
  html: baseLayout(`
    <h1>Quotation Received</h1>
    <p>Dear <span class="highlight">${vendorName}</span>, we have successfully received your quotation. Our procurement team will review it and get back to you.</p>

    <div class="card">
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Quotation Number</div>
          <div class="meta-value highlight">${quotation.quotation_number}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">RFQ Reference</div>
          <div class="meta-value">${quotation.rfq_number || 'N/A'}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Total Amount</div>
          <div class="meta-value">₹${Number(quotation.total_amount).toLocaleString('en-IN')}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Submitted On</div>
          <div class="meta-value">${new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </div>
    </div>

    <div class="success-box">
      <p style="color:#34d399;margin:0;">🕐 Our team will review your quotation and notify you of the decision within the RFQ deadline period.</p>
    </div>
    <a class="btn" href="${process.env.CLIENT_URL || 'http://localhost:5173'}">View Your Quotations</a>
  `, `Quotation Received: ${quotation.quotation_number}`),
});

module.exports = {
  welcomeEmail,
  forgotPasswordEmail,
  rfqInvitationEmail,
  approvalEmail,
  invoiceEmail,
  purchaseOrderEmail,
  quotationAcceptedEmail,
  quotationRejectedEmail,
  vendorStatusEmail,
  invoicePaidEmail,
  rfqStatusEmail,
  quotationReceivedEmail,
};
