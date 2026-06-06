require('dotenv').config();

const required = [
  'JWT_SECRET', 'JWT_REFRESH_SECRET',
  'MAIL_USER', 'MAIL_PASS',
  'GROQ_API_KEY',
];

const hasDbConfig = process.env.DATABASE_URL || (
  process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD
);

const missing = required.filter(key => !process.env[key]);
if (!hasDbConfig) {
  missing.push('DATABASE_URL (or DB_HOST, DB_NAME, DB_USER, and DB_PASSWORD)');
}

if (missing.length > 0) {
  console.error(`❌  Missing required environment variables: ${missing.join(', ')}`);
  console.error('    Copy .env.example to .env and fill in all values.');
  process.exit(1);
}

module.exports = {
  server: {
    port: parseInt(process.env.PORT) || 5000,
    env: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },
  db: process.env.DATABASE_URL ? {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  } : {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
    from: process.env.MAIL_FROM || `VendorBridge <${process.env.MAIL_USER}>`,
  },
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760,
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,xlsx,docx,jpg,jpeg,png').split(','),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 200,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  },
  otp: {
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES) || 15,
  },
};
