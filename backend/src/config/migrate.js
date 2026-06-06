require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

async function migrate() {
  const client = await pool.connect();
  try {
    const schemaPath = path.join(__dirname, '../../migrations/schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    console.log('🔄  Running database migration...');
    await client.query(sql);
    console.log('✅  Database migration completed successfully!');
  } catch (error) {
    console.error('❌  Migration failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
