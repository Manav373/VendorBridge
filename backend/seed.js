/**
 * VendorBridge — Seed Script
 * Creates demo users for all roles
 * Run: node seed.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const SALT_ROUNDS = 12;

const users = [
  {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex@vendorbridge.com',
    password: 'password123',
    role: 'admin',
    company: 'VendorBridge Corp',
    department: 'IT',
    phone: '+91 98765 00001',
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'manager@vendorbridge.com',
    password: 'manager123',
    role: 'manager',
    company: 'VendorBridge Corp',
    department: 'Procurement',
    phone: '+91 98765 00002',
  },
  {
    firstName: 'Ravi',
    lastName: 'Kumar',
    email: 'officer@vendorbridge.com',
    password: 'officer123',
    role: 'procurement_officer',
    company: 'VendorBridge Corp',
    department: 'Procurement',
    phone: '+91 98765 00003',
  },
  {
    firstName: 'Amit',
    lastName: 'Patel',
    email: 'vendor@vendorbridge.com',
    password: 'vendor123',
    role: 'vendor',
    company: 'Patel Supplies Pvt Ltd',
    department: 'Sales',
    phone: '+91 98765 00004',
  },
];

async function seed() {
  console.log('🌱 Seeding VendorBridge demo users...\n');
  console.log('Connecting to:', process.env.DATABASE_URL?.split('@')[1] ?? 'unknown host');
  console.log('');

  for (const u of users) {
    try {
      const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
      await pool.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, company, department, is_verified, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,true)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           is_verified   = true,
           is_active     = true`,
        [u.firstName, u.lastName, u.email, hash, u.phone, u.role, u.company, u.department]
      );
      console.log(`✅ ${u.role.padEnd(22)} | ${u.email.padEnd(35)} | ${u.password}`);
    } catch (err) {
      console.error(`❌ Failed to seed ${u.email}:`, err.message);
      console.error('   Detail:', err.detail ?? err.stack?.split('\n')[0]);
    }
  }

  await pool.end();
  console.log('\n✨ Seeding complete!');
}

seed().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
