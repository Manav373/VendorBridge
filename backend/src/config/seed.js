require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
);

const SALT_ROUNDS = 12;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('🧹 Clearing existing data...');
    await client.query('TRUNCATE users, vendors, rfqs, quotations, approvals, purchase_orders, invoices, notifications, activity_logs CASCADE');
    
    // Reset sequences
    await client.query('ALTER SEQUENCE vendor_code_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE rfq_number_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE quotation_number_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE po_number_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE approval_number_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE invoice_number_seq RESTART WITH 1');

    console.log('🔑 Creating password hashes...');
    const hashedPwd = await bcrypt.hash('password123', SALT_ROUNDS);

    console.log('👤 Inserting users...');
    
    // 1. Admin
    const adminRes = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, company, department, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id`,
      ['Super', 'Admin', 'admin@vendorbridge.com', hashedPwd, 'admin', 'VendorBridge Corp', 'IT']
    );
    const adminId = adminRes.rows[0].id;

    // 2. Procurement Officer
    const poRes = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, company, department, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id`,
      ['Sarah', 'Procure', 'procurement@vendorbridge.com', hashedPwd, 'procurement_officer', 'VendorBridge Corp', 'Procurement']
    );
    const poId = poRes.rows[0].id;

    // 3. Manager
    const managerRes = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, company, department, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id`,
      ['John', 'Manager', 'manager@vendorbridge.com', hashedPwd, 'manager', 'VendorBridge Corp', 'Finance']
    );
    const managerId = managerRes.rows[0].id;

    // 4. Vendor Users
    const vUser1Res = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, company, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      ['Alex', 'Logitech', 'alex@logitech-supply.com', hashedPwd, 'vendor', 'Logitech Distribution']
    );
    const vUser1Id = vUser1Res.rows[0].id;

    const vUser2Res = await client.query(
      `INSERT INTO users (first_name, last_name, email, password_hash, role, company, is_verified)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      ['Elena', 'Apex', 'elena@apextech.com', hashedPwd, 'vendor', 'Apex Tech Solutions']
    );
    const vUser2Id = vUser2Res.rows[0].id;

    console.log('🏢 Inserting vendors...');
    
    // Vendor 1: Logitech Supply
    const vendor1Res = await client.query(
      `INSERT INTO vendors (vendor_code, name, email, phone, category, status, country, state, city, address, pincode, gst_number, pan_number, rating, user_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      ['VND00001', 'Logitech Distribution', 'alex@logitech-supply.com', '+91 9876543210', 'Electronics', 'active', 'India', 'Maharashtra', 'Mumbai', 'G-12, Electronic City', '400001', '27AAAAA1111A1Z1', 'ABCDE1234F', 4.5, vUser1Id, adminId]
    );
    const vendor1Id = vendor1Res.rows[0].id;

    // Vendor 2: Apex Tech Solutions
    const vendor2Res = await client.query(
      `INSERT INTO vendors (vendor_code, name, email, phone, category, status, country, state, city, address, pincode, gst_number, pan_number, rating, user_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING id`,
      ['VND00002', 'Apex Tech Solutions', 'elena@apextech.com', '+91 9876543211', 'Electronics', 'active', 'India', 'Karnataka', 'Bengaluru', '4B, Tech Park', '560001', '29BBBBB2222B2Z2', 'WXYZR9876Q', 4.2, vUser2Id, adminId]
    );
    const vendor2Id = vendor2Res.rows[0].id;

    console.log('📋 Inserting RFQs...');
    
    // RFQ 1: Office Laptops Supply
    const rfq1Res = await client.query(
      `INSERT INTO rfqs (rfq_number, title, description, category, status, priority, deadline, estimated_value, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '10 days', $7, $8) RETURNING id`,
      ['RFQ00001', 'Office Laptops Procurement', 'Bulk requirement of high-performance developers laptops (16GB RAM, 512GB SSD)', 'Electronics', 'active', 'high', 1500000.00, poId]
    );
    const rfq1Id = rfq1Res.rows[0].id;

    // RFQ 1 Line Items
    const rfqItem1Res = await client.query(
      `INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, sort_order)
       VALUES ($1, $2, $3, $4, $5, 0) RETURNING id`,
      [rfq1Id, 'Developer Laptops', '15.6 inch Screen, Core i7, 16GB RAM, 512GB SSD', 20.00, 'pcs']
    );
    const rfqItem1Id = rfqItem1Res.rows[0].id;

    // Assign Vendors to RFQ 1
    await client.query(
      `INSERT INTO rfq_vendors (rfq_id, vendor_id, email_sent, responded)
       VALUES ($1, $2, true, true), ($1, $3, true, true)`,
      [rfq1Id, vendor1Id, vendor2Id]
    );

    console.log('💰 Inserting Quotations...');
    
    // Quotation 1 (from Logitech)
    const quote1Res = await client.query(
      `INSERT INTO quotations (quotation_number, rfq_id, vendor_id, status, total_amount, delivery_days, valid_until, notes, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days', $7, NOW()) RETURNING id`,
      ['QTN00001', rfq1Id, vendor1Id, 'submitted', 1400000.00, 7, 'Special pricing for bulk order']
    );
    const quote1Id = quote1Res.rows[0].id;

    await client.query(
      `INSERT INTO quotation_items (quotation_id, rfq_item_id, item_name, quantity, unit, unit_price)
       VALUES ($1, $2, $3, 20.00, 'pcs', 70000.00)`,
      [quote1Id, rfqItem1Id, 'Developer Laptops']
    );

    // Quotation 2 (from Apex Tech Solutions)
    const quote2Res = await client.query(
      `INSERT INTO quotations (quotation_number, rfq_id, vendor_id, status, total_amount, delivery_days, valid_until, notes, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days', $7, NOW()) RETURNING id`,
      ['QTN00002', rfq1Id, vendor2Id, 'submitted', 1360000.00, 10, 'Standard commercial warranty included']
    );
    const quote2Id = quote2Res.rows[0].id;

    await client.query(
      `INSERT INTO quotation_items (quotation_id, rfq_item_id, item_name, quantity, unit, unit_price)
       VALUES ($1, $2, $3, 20.00, 'pcs', 68000.00)`,
      [quote2Id, rfqItem1Id, 'Developer Laptops']
    );

    console.log('✅ Committing seed transaction...');
    await client.query('COMMIT');
    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
