const { transporter } = require('../config/mailer');
const config = require('../config/env');
const logger = require('../config/logger');
const {
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
} = require('../utils/emailTemplates');

const sendMail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: config.mail.from,
      to,
      subject,
      html,
      text: text || 'Please view this email in an HTML-capable client.',
    });
    logger.info('Email sent', { to, subject, messageId: info.messageId });
    return info;
  } catch (error) {
    logger.error('Email send failed', { to, subject, error: error.message });
    // Don't throw — email failures shouldn't break the main flow
  }
};

const sendWelcomeEmail = async (user) => {
  const template = welcomeEmail({
    firstName: user.first_name,
    email: user.email,
    role: user.role,
  });
  return sendMail({ to: user.email, ...template });
};

const sendForgotPasswordEmail = async (user, otp) => {
  const template = forgotPasswordEmail({ firstName: user.first_name, otp });
  return sendMail({ to: user.email, ...template });
};

const sendRFQInvitationEmail = async ({ vendorEmail, vendorName, rfq, items }) => {
  const quotationLink = `${config.server.clientUrl}/quotations/submit?rfq=${rfq.id}`;
  const template = rfqInvitationEmail({ vendorName, rfq, items, quotationLink });
  return sendMail({ to: vendorEmail, ...template });
};

const sendApprovalEmail = async ({ recipientEmail, recipientName, approval, status, remarks }) => {
  const template = approvalEmail({ recipientName, approval, status, remarks });
  return sendMail({ to: recipientEmail, ...template });
};

const sendInvoiceEmail = async ({ recipientEmail, recipientName, invoice, items }) => {
  const template = invoiceEmail({ recipientName, invoice, items });
  return sendMail({ to: recipientEmail, ...template });
};

const sendPOEmail = async ({ vendorEmail, vendorName, po, items }) => {
  const template = purchaseOrderEmail({ vendorName, po, items });
  return sendMail({ to: vendorEmail, ...template });
};

const sendGenericNotification = async ({ to, subject, message }) => {
  return sendMail({
    to,
    subject,
    html: `<div style="font-family:sans-serif;padding:20px;"><h2>${subject}</h2><p>${message}</p></div>`,
  });
};

// ─── New email senders ────────────────────────────────────────────────────────

/**
 * Notify vendor when their quotation is accepted
 */
const sendQuotationAcceptedEmail = async ({ vendorEmail, vendorName, quotation, po }) => {
  const template = quotationAcceptedEmail({ vendorName, quotation, po });
  return sendMail({ to: vendorEmail, ...template });
};

/**
 * Notify vendor when their quotation is rejected / not selected
 */
const sendQuotationRejectedEmail = async ({ vendorEmail, vendorName, quotation, reason }) => {
  const template = quotationRejectedEmail({ vendorName, quotation, reason });
  return sendMail({ to: vendorEmail, ...template });
};

/**
 * Notify vendor when their account status changes (active / suspended / inactive)
 */
const sendVendorStatusEmail = async ({ vendorEmail, vendorName, status, reason }) => {
  const template = vendorStatusEmail({ vendorName, vendorEmail, status, reason });
  return sendMail({ to: vendorEmail, ...template });
};

/**
 * Notify vendor when their invoice is marked as paid
 */
const sendInvoicePaidEmail = async ({ recipientEmail, recipientName, invoice }) => {
  const template = invoicePaidEmail({ recipientName, invoice });
  return sendMail({ to: recipientEmail, ...template });
};

/**
 * Notify all assigned vendors when an RFQ status changes (closed/cancelled/completed)
 */
const sendRFQStatusEmail = async ({ vendorEmail, vendorName, rfq, newStatus }) => {
  const template = rfqStatusEmail({ vendorName, rfq, newStatus });
  return sendMail({ to: vendorEmail, ...template });
};

/**
 * Send acknowledgement to vendor when their quotation is received
 */
const sendQuotationReceivedEmail = async ({ vendorEmail, vendorName, quotation }) => {
  const template = quotationReceivedEmail({ vendorName, quotation });
  return sendMail({ to: vendorEmail, ...template });
};

module.exports = {
  sendMail,
  sendWelcomeEmail,
  sendForgotPasswordEmail,
  sendRFQInvitationEmail,
  sendApprovalEmail,
  sendInvoiceEmail,
  sendPOEmail,
  sendGenericNotification,
  sendQuotationAcceptedEmail,
  sendQuotationRejectedEmail,
  sendVendorStatusEmail,
  sendInvoicePaidEmail,
  sendRFQStatusEmail,
  sendQuotationReceivedEmail,
};


