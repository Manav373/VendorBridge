/**
 * VendorBridge — Full Demo Data Seed
 * Inserts vendors, RFQs, quotations, approvals, POs, and invoices
 * Run: node seed-data.js
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const q = (sql, params = []) => pool.query(sql, params);

// ─── HELPERS ──────────────────────────────────────────────────────────
const today      = () => new Date().toISOString().split('T')[0];
const addDays    = (d) => { const dt = new Date(); dt.setDate(dt.getDate() + d); return dt.toISOString().split('T')[0]; };
const subDays    = (d) => { const dt = new Date(); dt.setDate(dt.getDate() - d); return dt.toISOString().split('T')[0]; };
const nextSeq    = async (name) => { const r = await q(`SELECT nextval('${name}') AS v`); return parseInt(r.rows[0].v); };

// ─── VENDORS ──────────────────────────────────────────────────────────
const VENDORS = [
  {
    code: null, name: 'Tata Electronics Ltd', email: 'tata.elec@vendor.com',
    phone: '+91 22 6665 4400', website: 'https://tataelec.com',
    category: 'Electronics', status: 'active', country: 'India', state: 'Maharashtra',
    city: 'Mumbai', address: '24, Nariman Point, Mumbai', pincode: '400021',
    gst: '27AAACT2727Q1ZW', pan: 'AAACT2727Q',
    bank: 'HDFC Bank', account: '50200012345678', ifsc: 'HDFC0001234',
    rating: 4.7, orders: 38, value: 8500000, contact: 'Suresh Mehta',
    notes: 'Preferred electronics supplier. ISO 9001 certified.'
  },
  {
    code: null, name: 'Infosys Office Supplies', email: 'supplies@infosys.com',
    phone: '+91 80 2852 0261', website: 'https://infosys-supplies.com',
    category: 'Office Supplies', status: 'active', country: 'India', state: 'Karnataka',
    city: 'Bangalore', address: '44, Electronics City, Hosur Rd', pincode: '560100',
    gst: '29AABCI1234A1ZK', pan: 'AABCI1234A',
    bank: 'ICICI Bank', account: '001505012345', ifsc: 'ICIC0000015',
    rating: 4.3, orders: 54, value: 3200000, contact: 'Deepa Rao',
    notes: 'Regular stationery and office furniture supplier.'
  },
  {
    code: null, name: 'Mahindra IT Equipment', email: 'procurement@mahindrait.com',
    phone: '+91 20 2720 7000', website: 'https://mahindrait.com',
    category: 'IT Equipment', status: 'active', country: 'India', state: 'Maharashtra',
    city: 'Pune', address: 'Gateway Building, Baner Rd', pincode: '411045',
    gst: '27AABCM1234B1ZP', pan: 'AABCM1234B',
    bank: 'SBI', account: '30112345678', ifsc: 'SBIN0005678',
    rating: 4.5, orders: 21, value: 5600000, contact: 'Ramesh Iyer',
    notes: 'Laptops, servers and networking equipment.'
  },
  {
    code: null, name: 'GreenLeaf Furniture Co.', email: 'sales@greenleaf.co.in',
    phone: '+91 44 4321 9900', website: 'https://greenleaf.co.in',
    category: 'Furniture', status: 'active', country: 'India', state: 'Tamil Nadu',
    city: 'Chennai', address: '8, Anna Salai, Teynampet', pincode: '600018',
    gst: '33AABCG1234C1ZT', pan: 'AABCG1234C',
    bank: 'Axis Bank', account: '912020052341', ifsc: 'UTIB0000123',
    rating: 4.1, orders: 16, value: 1800000, contact: 'Kavitha Subramaniam',
    notes: 'Ergonomic office furniture. Lead time 2-3 weeks.'
  },
  {
    code: null, name: 'Reliance Safety Products', email: 'safety@reliance-safety.com',
    phone: '+91 22 4477 3300', website: 'https://reliance-safety.com',
    category: 'Safety Equipment', status: 'active', country: 'India', state: 'Gujarat',
    city: 'Ahmedabad', address: '15, GIDC Estate, Vatva', pincode: '382445',
    gst: '24AABCR1234D1ZG', pan: 'AABCR1234D',
    bank: 'Bank of Baroda', account: '09870200012345', ifsc: 'BARB0VATVA0',
    rating: 3.9, orders: 9, value: 920000, contact: 'Jignesh Shah',
    notes: 'PPE kits, fire safety equipment and industrial safety gear.'
  },
  {
    code: null, name: 'HCL Printing Solutions', email: 'print@hcl-print.com',
    phone: '+91 120 4500 900', website: 'https://hclprint.com',
    category: 'Printing & Stationery', status: 'active', country: 'India', state: 'Uttar Pradesh',
    city: 'Noida', address: 'Plot 3A, Sector 126, Noida', pincode: '201301',
    gst: '09AABCH1234E1ZN', pan: 'AABCH1234E',
    bank: 'Punjab National Bank', account: '1234500112345', ifsc: 'PUNB0123450',
    rating: 4.2, orders: 31, value: 2100000, contact: 'Anita Gupta',
    notes: 'Managed print services and large-format printing.'
  },
  {
    code: null, name: 'Wipro Catering Services', email: 'catering@wipro-food.com',
    phone: '+91 80 2844 0011', website: 'https://wipro-food.com',
    category: 'Catering & Food', status: 'pending', country: 'India', state: 'Karnataka',
    city: 'Bangalore', address: 'Sarjapur Main Rd, Bellandur', pincode: '560103',
    gst: '29AABCW1234F1ZK', pan: 'AABCW1234F',
    bank: 'Kotak Mahindra Bank', account: '2312345670', ifsc: 'KKBK0000152',
    rating: 3.6, orders: 4, value: 450000, contact: 'Naresh Kumar',
    notes: 'Office cafeteria management and event catering.'
  },
  {
    code: null, name: 'Bharat Logistics Pvt Ltd', email: 'ops@bharatlogistics.in',
    phone: '+91 11 4567 8900', website: 'https://bharatlogistics.in',
    category: 'Logistics & Transport', status: 'inactive', country: 'India', state: 'Delhi',
    city: 'New Delhi', address: '22, Okhla Industrial Area Phase II', pincode: '110020',
    gst: '07AABCB1234G1ZD', pan: 'AABCB1234G',
    bank: 'Union Bank of India', account: '53890123456789', ifsc: 'UBIN0534567',
    rating: 3.2, orders: 7, value: 680000, contact: 'Sanjay Sharma',
    notes: 'Pan-India freight and last-mile delivery. Currently on hold.'
  },
];

// ─── RFQs DATA ────────────────────────────────────────────────────────
const RFQS = [
  {
    title: 'Laptop Procurement Q3 2025',
    desc: 'Purchase of 50 high-performance laptops for the engineering team.',
    category: 'IT Equipment', status: 'completed', priority: 'high',
    deadline: subDays(10), estimated: 2500000,
    items: [
      { name: 'Dell XPS 15 Laptop',     qty: 30, unit: 'pcs', desc: 'i7, 16GB RAM, 512GB SSD' },
      { name: 'MacBook Pro 14"',        qty: 15, unit: 'pcs', desc: 'M3 chip, 16GB, 512GB' },
      { name: 'Lenovo ThinkPad X1',     qty: 5,  unit: 'pcs', desc: 'i5, 16GB RAM, 256GB SSD' },
    ],
  },
  {
    title: 'Office Stationery Bulk Order',
    desc: 'Quarterly stationery replenishment for 3 office locations.',
    category: 'Office Supplies', status: 'active', priority: 'medium',
    deadline: addDays(12), estimated: 180000,
    items: [
      { name: 'A4 Paper Reams',         qty: 500, unit: 'reams', desc: '80 GSM, 500 sheets per ream' },
      { name: 'Ballpoint Pens (Box)',   qty: 100, unit: 'boxes', desc: 'Blue ink, 50 pcs per box' },
      { name: 'Sticky Notes Pack',      qty: 200, unit: 'packs', desc: '76x76mm, 100 sheets per pack' },
      { name: 'File Folders',           qty: 300, unit: 'pcs',  desc: 'A4, polypropylene' },
    ],
  },
  {
    title: 'Ergonomic Office Chair Order',
    desc: 'Replacement of old chairs across 2 floors with ergonomic models.',
    category: 'Furniture', status: 'pending', priority: 'medium',
    deadline: addDays(20), estimated: 600000,
    items: [
      { name: 'Ergonomic Office Chair', qty: 80, unit: 'pcs', desc: 'Lumbar support, adjustable armrests' },
      { name: 'Standing Desk',          qty: 10, unit: 'pcs', desc: 'Height adjustable, 160x80cm' },
    ],
  },
  {
    title: 'Network Infrastructure Upgrade',
    desc: 'Upgrade of core network switches and access points across HQ.',
    category: 'IT Equipment', status: 'active', priority: 'urgent',
    deadline: addDays(8), estimated: 1200000,
    items: [
      { name: 'Cisco Catalyst 9300 Switch', qty: 5, unit: 'pcs', desc: '48-port PoE+ switch' },
      { name: 'Cisco Meraki MR46 AP',       qty: 20, unit: 'pcs', desc: 'Wi-Fi 6, dual-band' },
      { name: 'Fiber Patch Cables 10m',     qty: 50, unit: 'pcs', desc: 'LC-LC duplex, OM3' },
    ],
  },
  {
    title: 'Safety Equipment & PPE Kit',
    desc: 'Annual PPE kit procurement for warehouse and manufacturing floor.',
    category: 'Safety Equipment', status: 'draft', priority: 'high',
    deadline: addDays(30), estimated: 320000,
    items: [
      { name: 'Safety Helmets',       qty: 100, unit: 'pcs',  desc: 'ISI marked, ABS shell' },
      { name: 'Safety Shoes',         qty: 100, unit: 'pairs', desc: 'Steel toe cap, size 6-12' },
      { name: 'High-Vis Vests',       qty: 150, unit: 'pcs',  desc: 'Class 2 reflective' },
      { name: 'Safety Gloves',        qty: 200, unit: 'pairs', desc: 'Cut-resistant, Level D' },
    ],
  },
  {
    title: 'Printer & Toner Cartridge Supply',
    desc: 'Annual managed print contract including hardware and consumables.',
    category: 'Printing & Stationery', status: 'completed', priority: 'low',
    deadline: subDays(5), estimated: 420000,
    items: [
      { name: 'HP LaserJet Pro MFP',  qty: 10, unit: 'pcs',  desc: 'A4 mono, duplex, LAN' },
      { name: 'HP 85A Toner Cartridge', qty: 60, unit: 'pcs', desc: '1600 page yield' },
      { name: 'Printer Paper A4',     qty: 200, unit: 'reams', desc: '75 GSM' },
    ],
  },
];

// ─── MAIN SEED ────────────────────────────────────────────────────────
async function seedData() {
  console.log('\n🌱 VendorBridge — Full Demo Data Seed\n');

  // Get existing user IDs
  const userRes = await q(`SELECT id, role FROM users WHERE email IN (
    'alex@vendorbridge.com','manager@vendorbridge.com','officer@vendorbridge.com'
  )`);
  const users = {};
  for (const row of userRes.rows) users[row.role] = row.id;
  const adminId   = users['admin'];
  const managerId = users['manager'];
  const officerId = users['procurement_officer'];
  console.log(`👤 Users loaded: admin=${adminId?.slice(0,8)}... manager=${managerId?.slice(0,8)}... officer=${officerId?.slice(0,8)}...`);

  // ── VENDORS ──────────────────────────────────────────────────────
  console.log('\n📦 Seeding vendors...');
  const vendorIds = [];
  for (const v of VENDORS) {
    const seq = await nextSeq('vendor_code_seq');
    const code = `VND-${String(seq).padStart(4, '0')}`;
    try {
      const r = await q(
        `INSERT INTO vendors
          (vendor_code, name, email, phone, website, category, status, country, state, city, address, pincode,
           gst_number, pan_number, bank_name, bank_account, bank_ifsc, rating, total_orders, total_value,
           contact_person, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [code, v.name, v.email, v.phone, v.website, v.category, v.status, v.country, v.state,
         v.city, v.address, v.pincode, v.gst, v.pan, v.bank, v.account, v.ifsc,
         v.rating, v.orders, v.value, v.contact, v.notes, adminId]
      );
      vendorIds.push(r.rows[0].id);
      console.log(`  ✅ ${v.name} (${code}) — ${v.status}`);
    } catch (err) {
      console.error(`  ❌ ${v.name}: ${err.message}`);
      vendorIds.push(null);
    }
  }

  // ── RFQs ─────────────────────────────────────────────────────────
  console.log('\n📋 Seeding RFQs...');
  const rfqIds = [];
  for (const rfq of RFQS) {
    const seq = await nextSeq('rfq_number_seq');
    const rfqNum = `RFQ-${String(seq).padStart(5, '0')}`;
    try {
      const r = await q(
        `INSERT INTO rfqs (rfq_number, title, description, category, status, priority, deadline, estimated_value, created_by, assigned_to)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING id`,
        [rfqNum, rfq.title, rfq.desc, rfq.category, rfq.status, rfq.priority,
         rfq.deadline, rfq.estimated, adminId, officerId]
      );
      const rfqId = r.rows[0].id;
      rfqIds.push(rfqId);
      console.log(`  ✅ ${rfqNum} — ${rfq.title}`);

      // Insert items
      for (let i = 0; i < rfq.items.length; i++) {
        const item = rfq.items[i];
        await q(
          `INSERT INTO rfq_items (rfq_id, item_name, description, quantity, unit, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [rfqId, item.name, item.desc, item.qty, item.unit, i]
        );
      }

      // Invite vendors (first 3)
      const invitedVendors = vendorIds.filter(Boolean).slice(0, 3);
      for (const vid of invitedVendors) {
        await q(
          `INSERT INTO rfq_vendors (rfq_id, vendor_id, email_sent, responded)
           VALUES ($1,$2,true,$3)
           ON CONFLICT (rfq_id, vendor_id) DO NOTHING`,
          [rfqId, vid, rfq.status === 'completed']
        );
      }
    } catch (err) {
      console.error(`  ❌ ${rfq.title}: ${err.message}`);
      rfqIds.push(null);
    }
  }

  // ── QUOTATIONS ───────────────────────────────────────────────────
  console.log('\n💬 Seeding quotations...');
  const quotationIds = [];

  // Quotations for RFQ 0 (Laptop — completed)
  const laptopRfqId = rfqIds[0];
  const laptopItemsRes = await q(`SELECT id, item_name, quantity FROM rfq_items WHERE rfq_id = $1 ORDER BY sort_order`, [laptopRfqId]);
  const laptopItems = laptopItemsRes.rows;

  const quotationData = [
    {
      rfqIdx: 0, vendorIdx: 2, status: 'accepted', delivery: 14, validUntil: addDays(30),
      total: 2450000, remarks: 'Best price guaranteed with 1 year on-site warranty.',
      items: [
        { name: 'Dell XPS 15 Laptop',  qty: 30, unit: 'pcs', price: 52000 },
        { name: "MacBook Pro 14\"",    qty: 15, unit: 'pcs', price: 82000 },
        { name: 'Lenovo ThinkPad X1',  qty: 5,  unit: 'pcs', price: 48000 },
      ],
    },
    {
      rfqIdx: 0, vendorIdx: 0, status: 'shortlisted', delivery: 21, validUntil: addDays(30),
      total: 2680000, remarks: 'Includes 2-year extended warranty.',
      items: [
        { name: 'Dell XPS 15 Laptop',  qty: 30, unit: 'pcs', price: 56000 },
        { name: "MacBook Pro 14\"",    qty: 15, unit: 'pcs', price: 88000 },
        { name: 'Lenovo ThinkPad X1',  qty: 5,  unit: 'pcs', price: 54000 },
      ],
    },
    {
      rfqIdx: 1, vendorIdx: 1, status: 'submitted', delivery: 5, validUntil: addDays(15),
      total: 165000, remarks: 'Bulk discount applied. Free delivery.',
      items: [
        { name: 'A4 Paper Reams',       qty: 500, unit: 'reams', price: 210 },
        { name: 'Ballpoint Pens (Box)', qty: 100, unit: 'boxes', price: 350 },
        { name: 'Sticky Notes Pack',    qty: 200, unit: 'packs', price: 90  },
        { name: 'File Folders',         qty: 300, unit: 'pcs',   price: 35  },
      ],
    },
    {
      rfqIdx: 5, vendorIdx: 5, status: 'accepted', delivery: 7, validUntil: subDays(2),
      total: 390000, remarks: 'All items in stock. Same-week delivery.',
      items: [
        { name: 'HP LaserJet Pro MFP',    qty: 10, unit: 'pcs',   price: 18000 },
        { name: 'HP 85A Toner Cartridge', qty: 60, unit: 'pcs',   price: 2200  },
        { name: 'Printer Paper A4',       qty: 200, unit: 'reams', price: 220  },
      ],
    },
  ];

  for (const qt of quotationData) {
    const rfqId = rfqIds[qt.rfqIdx];
    const vendorId = vendorIds[qt.vendorIdx];
    if (!rfqId || !vendorId) continue;
    const seq = await nextSeq('quotation_number_seq');
    const qtNum = `QT-${String(seq).padStart(5, '0')}`;
    try {
      const r = await q(
        `INSERT INTO quotations
          (quotation_number, rfq_id, vendor_id, status, total_amount, delivery_days, valid_until, vendor_remarks, submitted_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
         ON CONFLICT (rfq_id, vendor_id) DO UPDATE SET status = EXCLUDED.status
         RETURNING id`,
        [qtNum, rfqId, vendorId, qt.status, qt.total, qt.delivery, qt.validUntil, qt.remarks]
      );
      const qtId = r.rows[0].id;
      quotationIds.push(qtId);
      console.log(`  ✅ ${qtNum} — ${qt.status} (₹${qt.total.toLocaleString()})`);

      for (let i = 0; i < qt.items.length; i++) {
        const it = qt.items[i];
        await q(
          `INSERT INTO quotation_items (quotation_id, item_name, quantity, unit, unit_price, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [qtId, it.name, it.qty, it.unit, it.price, i]
        );
      }
    } catch (err) {
      console.error(`  ❌ ${qtNum}: ${err.message}`);
    }
  }

  // ── APPROVALS ─────────────────────────────────────────────────────
  console.log('\n✅ Seeding approvals...');
  const approvalIds = [];

  const approvalData = [
    {
      title: 'Laptop Procurement Approval — Q3 2025', desc: 'Approve purchase of 50 laptops for engineering team.',
      amount: 2450000, status: 'approved', priority: 'high',
      requestedBy: officerId, approvedBy: managerId, remarks: 'Approved as per Q3 budget.'
    },
    {
      title: 'Network Infrastructure Upgrade Approval', desc: 'Core network switches and access point upgrade.',
      amount: 1200000, status: 'pending', priority: 'urgent',
      requestedBy: officerId, approvedBy: null, remarks: null
    },
    {
      title: 'Printer & Managed Print Services', desc: 'Annual print contract renewal.',
      amount: 390000, status: 'approved', priority: 'low',
      requestedBy: officerId, approvedBy: managerId, remarks: 'Cost within budget. Approved.'
    },
    {
      title: 'Office Stationery Q3 Purchase', desc: 'Quarterly stationery for 3 offices.',
      amount: 165000, status: 'pending', priority: 'medium',
      requestedBy: officerId, approvedBy: null, remarks: null
    },
    {
      title: 'Ergonomic Chairs Replacement', desc: '80 chairs and 10 standing desks across 2 floors.',
      amount: 600000, status: 'rejected', priority: 'medium',
      requestedBy: officerId, approvedBy: null, remarks: 'Budget exceeded for this quarter. Defer to Q4.'
    },
  ];

  for (const ap of approvalData) {
    const seq = await nextSeq('approval_number_seq');
    const apNum = `APR-${String(seq).padStart(5, '0')}`;
    try {
      const approvedAt = ap.status === 'approved' ? `NOW() - interval '${Math.floor(Math.random()*10)+1} days'` : 'NULL';
      const rejectedAt = ap.status === 'rejected' ? `NOW() - interval '2 days'` : 'NULL';
      const r = await q(
        `INSERT INTO approvals
          (approval_number, title, description, amount, status, priority, requested_by, current_approver, approved_by, remarks,
           approved_at, rejected_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
           ${ap.status === 'approved' ? 'NOW()' : 'NULL'},
           ${ap.status === 'rejected' ? 'NOW()' : 'NULL'})
         RETURNING id`,
        [apNum, ap.title, ap.desc, ap.amount, ap.status, ap.priority,
         ap.requestedBy, managerId, ap.approvedBy, ap.remarks]
      );
      approvalIds.push(r.rows[0].id);
      console.log(`  ✅ ${apNum} — ${ap.status.toUpperCase()} (₹${ap.amount.toLocaleString()})`);
    } catch (err) {
      console.error(`  ❌ ${ap.title}: ${err.message}`);
      approvalIds.push(null);
    }
  }

  // ── PURCHASE ORDERS ───────────────────────────────────────────────
  console.log('\n🛒 Seeding purchase orders...');
  const poIds = [];

  const poData = [
    {
      vendorIdx: 2, rfqIdx: 0, apprIdx: 0, status: 'completed',
      subtotal: 2450000, tax: 441000, shipping: 9000, grand: 2900000, paid: 2900000, due: 0,
      orderDate: subDays(20), deliveryDate: subDays(6),
      billTo: 'VendorBridge Corp, 24 MG Road, Bangalore 560001',
      shipTo: 'VendorBridge Corp HQ, 5th Floor, 24 MG Road, Bangalore',
      notes: 'Deliver before Q3 close. Handle with care.',
      items: [
        { name: 'Dell XPS 15 Laptop',  qty: 30, unit: 'pcs', price: 52000 },
        { name: "MacBook Pro 14\"",    qty: 15, unit: 'pcs', price: 88000 },
        { name: 'Lenovo ThinkPad X1',  qty: 5,  unit: 'pcs', price: 48000 },
      ],
    },
    {
      vendorIdx: 5, rfqIdx: 5, apprIdx: 2, status: 'sent',
      subtotal: 390000, tax: 70200, shipping: 0, grand: 460200, paid: 0, due: 460200,
      orderDate: subDays(3), deliveryDate: addDays(4),
      billTo: 'VendorBridge Corp, 24 MG Road, Bangalore 560001',
      shipTo: 'VendorBridge Corp — IT Dept, 2nd Floor',
      notes: 'Urgently required for Q4 print operations.',
      items: [
        { name: 'HP LaserJet Pro MFP',    qty: 10, unit: 'pcs',   price: 18000 },
        { name: 'HP 85A Toner Cartridge', qty: 60, unit: 'pcs',   price: 2200  },
        { name: 'Printer Paper A4',       qty: 200, unit: 'reams', price: 220  },
      ],
    },
    {
      vendorIdx: 1, rfqIdx: 1, apprIdx: 3, status: 'pending_approval',
      subtotal: 165000, tax: 29700, shipping: 2000, grand: 196700, paid: 0, due: 196700,
      orderDate: today(), deliveryDate: addDays(5),
      billTo: 'VendorBridge Corp, 24 MG Road, Bangalore 560001',
      shipTo: 'Admin Department, Ground Floor',
      notes: 'Please split delivery across 3 locations.',
      items: [
        { name: 'A4 Paper Reams',       qty: 500, unit: 'reams', price: 210 },
        { name: 'Ballpoint Pens (Box)', qty: 100, unit: 'boxes', price: 350 },
        { name: 'Sticky Notes Pack',    qty: 200, unit: 'packs', price: 90  },
        { name: 'File Folders',         qty: 300, unit: 'pcs',   price: 35  },
      ],
    },
  ];

  for (const po of poData) {
    const seq = await nextSeq('po_number_seq');
    const poNum = `PO-${String(seq).padStart(5, '0')}`;
    const vendorId   = vendorIds[po.vendorIdx];
    const rfqId      = rfqIds[po.rfqIdx];
    const approvalId = approvalIds[po.apprIdx];
    try {
      const r = await q(
        `INSERT INTO purchase_orders
          (po_number, rfq_id, vendor_id, approval_id, status, order_date, delivery_date,
           subtotal, tax_amount, shipping, grand_total, paid_amount, due_amount,
           bill_to, ship_to, notes, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING id`,
        [poNum, rfqId, vendorId, approvalId, po.status, po.orderDate, po.deliveryDate,
         po.subtotal, po.tax, po.shipping, po.grand, po.paid, po.due,
         po.billTo, po.shipTo, po.notes, officerId]
      );
      const poId = r.rows[0].id;
      poIds.push(poId);
      console.log(`  ✅ ${poNum} — ${po.status} (₹${po.grand.toLocaleString()})`);

      for (let i = 0; i < po.items.length; i++) {
        const it = po.items[i];
        await q(
          `INSERT INTO po_items (po_id, item_name, quantity, unit, unit_price, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [poId, it.name, it.qty, it.unit, it.price, i]
        );
      }
    } catch (err) {
      console.error(`  ❌ ${poNum}: ${err.message}`);
      poIds.push(null);
    }
  }

  // ── INVOICES ─────────────────────────────────────────────────────
  console.log('\n🧾 Seeding invoices...');

  const invoiceData = [
    {
      vendorIdx: 2, poIdx: 0, status: 'paid',
      subtotal: 2450000, tax: 18, taxAmt: 441000, discount: 10000,
      grand: 2881000, paid: 2881000, due: 0,
      invoiceDate: subDays(15), dueDate: subDays(5),
      billTo: 'VendorBridge Corp, 24 MG Road, Bangalore 560001',
      notes: 'Payment received. Thank you for your business.',
      paymentTerms: 'Net 30',
    },
    {
      vendorIdx: 5, poIdx: 1, status: 'sent',
      subtotal: 390000, tax: 18, taxAmt: 70200, discount: 0,
      grand: 460200, paid: 0, due: 460200,
      invoiceDate: subDays(1), dueDate: addDays(29),
      billTo: 'VendorBridge Corp, 24 MG Road, Bangalore 560001',
      notes: 'Please process payment within 30 days.',
      paymentTerms: 'Net 30',
    },
    {
      vendorIdx: 0, poIdx: null, status: 'overdue',
      subtotal: 850000, tax: 18, taxAmt: 153000, discount: 0,
      grand: 1003000, paid: 0, due: 1003000,
      invoiceDate: subDays(45), dueDate: subDays(15),
      billTo: 'VendorBridge Corp, 24 MG Road, Bangalore 560001',
      notes: 'OVERDUE: Payment was due on ' + subDays(15) + '. Please clear immediately.',
      paymentTerms: 'Net 30',
    },
  ];

  for (const inv of invoiceData) {
    const seq = await nextSeq('invoice_number_seq');
    const invNum = `INV-${String(seq).padStart(5, '0')}`;
    const vendorId = vendorIds[inv.vendorIdx];
    const poId     = inv.poIdx !== null ? poIds[inv.poIdx] : null;
    try {
      const paidAt = inv.status === 'paid' ? `NOW() - interval '5 days'` : 'NULL';
      await q(
        `INSERT INTO invoices
          (invoice_number, po_id, vendor_id, status, invoice_date, due_date,
           subtotal, tax_percent, tax_amount, discount, grand_total, paid_amount, due_amount,
           bill_to, notes, payment_terms, paid_at, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
           ${inv.status === 'paid' ? 'NOW()' : 'NULL'},$17)`,
        [invNum, poId, vendorId, inv.status, inv.invoiceDate, inv.dueDate,
         inv.subtotal, inv.tax, inv.taxAmt, inv.discount, inv.grand, inv.paid, inv.due,
         inv.billTo, inv.notes, inv.paymentTerms, officerId]
      );
      console.log(`  ✅ ${invNum} — ${inv.status.toUpperCase()} (₹${inv.grand.toLocaleString()})`);
    } catch (err) {
      console.error(`  ❌ ${invNum}: ${err.message}`);
    }
  }

  await pool.end();

  console.log('\n' + '═'.repeat(60));
  console.log('✨ All demo data seeded successfully!');
  console.log('═'.repeat(60));
  console.log(`  📦 Vendors:        ${VENDORS.length}`);
  console.log(`  📋 RFQs:           ${RFQS.length}`);
  console.log(`  💬 Quotations:     ${quotationData.length}`);
  console.log(`  ✅ Approvals:      ${approvalData.length}`);
  console.log(`  🛒 Purchase Orders:${poData.length}`);
  console.log(`  🧾 Invoices:       ${invoiceData.length}`);
  console.log('═'.repeat(60) + '\n');
}

seedData().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
