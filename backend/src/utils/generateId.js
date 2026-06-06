const { query } = require('../config/database');

/**
 * Generate next vendor code: VB-001, VB-002 ...
 */
const generateVendorCode = async () => {
  const result = await query("SELECT nextval('vendor_code_seq') as seq");
  const seq = result.rows[0].seq;
  return `VB-${String(seq).padStart(3, '0')}`;
};

/**
 * Generate RFQ number: RFQ-2025-001
 */
const generateRFQNumber = async () => {
  const year = new Date().getFullYear();
  const result = await query("SELECT nextval('rfq_number_seq') as seq");
  const seq = result.rows[0].seq;
  return `RFQ-${year}-${String(seq).padStart(3, '0')}`;
};

/**
 * Generate Quotation number: QT-2025-001
 */
const generateQuotationNumber = async () => {
  const year = new Date().getFullYear();
  const result = await query("SELECT nextval('quotation_number_seq') as seq");
  const seq = result.rows[0].seq;
  return `QT-${year}-${String(seq).padStart(3, '0')}`;
};

/**
 * Generate PO number: PO-2025-0001
 */
const generatePONumber = async () => {
  const year = new Date().getFullYear();
  const result = await query("SELECT nextval('po_number_seq') as seq");
  const seq = result.rows[0].seq;
  return `PO-${year}-${String(seq).padStart(4, '0')}`;
};

/**
 * Generate Approval number: APR-2025-001
 */
const generateApprovalNumber = async () => {
  const year = new Date().getFullYear();
  const result = await query("SELECT nextval('approval_number_seq') as seq");
  const seq = result.rows[0].seq;
  return `APR-${year}-${String(seq).padStart(3, '0')}`;
};

/**
 * Generate Invoice number: INV-VB-2025-001
 */
const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const result = await query("SELECT nextval('invoice_number_seq') as seq");
  const seq = result.rows[0].seq;
  return `INV-VB-${year}-${String(seq).padStart(3, '0')}`;
};

/**
 * Generate a numeric OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

module.exports = {
  generateVendorCode,
  generateRFQNumber,
  generateQuotationNumber,
  generatePONumber,
  generateApprovalNumber,
  generateInvoiceNumber,
  generateOTP,
};
