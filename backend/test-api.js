const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function test() {
  const user = await pool.query("SELECT id, role FROM users WHERE email = 'alex@vendorbridge.com'");
  if (user.rows.length === 0) {
    console.log("Admin user not found in DB");
    process.exit(1);
  }
  
  const adminId = user.rows[0].id;
  const token = jwt.sign({ userId: adminId, role: 'admin' }, process.env.JWT_SECRET);
  
  try {
    const res = await fetch('http://localhost:5000/api/reports/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    console.log("DASHBOARD OK:", JSON.stringify(data));
  } catch (err) {
    console.log("DASHBOARD ERR:", err.message);
  }

  process.exit(0);
}

test();
