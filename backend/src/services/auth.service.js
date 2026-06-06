const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const config = require('../config/env');
const { generateOTP } = require('../utils/generateId');
const emailService = require('./email.service');
const activityLogService = require('./activityLog.service');
const { AppError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 12;

/**
 * Generate JWT access + refresh token pair
 */
const generateTokenPair = (user) => {
  // Embed all fields needed by the auth middleware into the access token
  // so middleware can skip DB lookups on every request
  const payload = {
    userId: user.id,
    role: user.role,
    firstName: user.first_name || user.firstName,
    lastName: user.last_name || user.lastName,
    email: user.email,
    company: user.company,
    isActive: user.is_active !== false, // default true for new signups
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
    issuer: 'vendorbridge',
    audience: 'vendorbridge-client',
  });

  const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
    issuer: 'vendorbridge',
  });

  return { accessToken, refreshToken };
};

/**
 * Register a new user
 */
const signup = async ({ firstName, lastName, email, password, phone, role, company, department }) => {
  // Check if email already exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new AppError('An account with this email already exists', 409);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Insert user
  const result = await query(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, company, department, is_verified)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, first_name, last_name, email, role, company`,
    [firstName, lastName, email, passwordHash, phone || null, role || 'procurement_officer', company || null, department || null, false]
  );

  const user = result.rows[0];

  // Generate tokens (user object passed so payload is embedded)
  const tokens = generateTokenPair({ ...user, is_active: true });

  // Save refresh token
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

  // Send welcome email (non-blocking)
  emailService.sendWelcomeEmail(user).catch(() => {});

  // Log activity
  await activityLogService.log({
    userId: user.id,
    userName: `${firstName} ${lastName}`,
    module: 'auth',
    action: 'USER_REGISTERED',
    description: `New user registered: ${email}`,
    entityType: 'user',
    entityId: user.id,
  });

  return {
    user: { id: user.id, firstName: user.first_name, lastName: user.last_name, email: user.email, role: user.role, company: user.company },
    ...tokens,
  };
};

/**
 * Login with email and password
 */
const login = async ({ email, password, ip, userAgent }) => {
  // Fetch user
  const result = await query(
    'SELECT id, first_name, last_name, email, password_hash, role, company, is_active, is_verified FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid email or password', 401);
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Please contact support.', 403);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate tokens (user object passed so payload is embedded)
  const tokens = generateTokenPair(user);

  // Update last login and refresh token
  await query(
    'UPDATE users SET last_login = NOW(), refresh_token = $1 WHERE id = $2',
    [tokens.refreshToken, user.id]
  );

  // Log activity
  await activityLogService.log({
    userId: user.id,
    userName: `${user.first_name} ${user.last_name}`,
    module: 'auth',
    action: 'USER_LOGIN',
    description: `User logged in`,
    entityType: 'user',
    entityId: user.id,
    ipAddress: ip,
    userAgent,
  });

  return {
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      company: user.company,
      isVerified: user.is_verified,
    },
    ...tokens,
  };
};

/**
 * Refresh access token using refresh token
 */
const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, config.jwt.refreshSecret, { issuer: 'vendorbridge' });
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const result = await query(
    'SELECT id, role, refresh_token, is_active FROM users WHERE id = $1',
    [decoded.userId]
  );

  if (result.rows.length === 0 || result.rows[0].refresh_token !== token) {
    throw new AppError('Invalid refresh token', 401);
  }

  const user = result.rows[0];
  if (!user.is_active) {
    throw new AppError('Account deactivated', 403);
  }

  const tokens = generateTokenPair(user);
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [tokens.refreshToken, user.id]);

  return tokens;
};

/**
 * Logout — invalidate refresh token
 */
const logout = async (userId) => {
  await query('UPDATE users SET refresh_token = NULL WHERE id = $1', [userId]);

  await activityLogService.log({
    userId,
    module: 'auth',
    action: 'USER_LOGOUT',
    description: 'User logged out',
    entityType: 'user',
    entityId: userId,
  });
};

/**
 * Initiate forgot password — send OTP
 */
const forgotPassword = async (email) => {
  const result = await query(
    'SELECT id, first_name, email FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  // Always return success to prevent email enumeration
  if (result.rows.length === 0) return { message: 'If this email exists, an OTP has been sent' };

  const user = result.rows[0];
  const otp = generateOTP(6);
  const expiry = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  await query(
    'UPDATE users SET otp_code = $1, otp_expiry = $2 WHERE id = $3',
    [otp, expiry, user.id]
  );

  // Send OTP email (non-blocking)
  emailService.sendForgotPasswordEmail(user, otp).catch(() => {});

  return { message: 'OTP has been sent to your email address' };
};

/**
 * Reset password with OTP
 */
const resetPassword = async (email, otp, newPassword) => {
  const result = await query(
    'SELECT id, otp_code, otp_expiry FROM users WHERE email = $1 AND is_active = true',
    [email]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid request', 400);
  }

  const user = result.rows[0];

  if (!user.otp_code || user.otp_code !== otp) {
    throw new AppError('Invalid OTP', 400);
  }

  if (new Date() > new Date(user.otp_expiry)) {
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await query(
    'UPDATE users SET password_hash = $1, otp_code = NULL, otp_expiry = NULL, refresh_token = NULL WHERE id = $2',
    [passwordHash, user.id]
  );

  await activityLogService.log({
    userId: user.id,
    module: 'auth',
    action: 'PASSWORD_RESET',
    description: 'User reset their password',
    entityType: 'user',
    entityId: user.id,
  });

  return { message: 'Password has been reset successfully. Please log in.' };
};

/**
 * Change password (authenticated)
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const result = await query('SELECT id, password_hash FROM users WHERE id = $1', [userId]);
  if (result.rows.length === 0) throw new AppError('User not found', 404);

  const isMatch = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query(
    'UPDATE users SET password_hash = $1, refresh_token = NULL WHERE id = $2',
    [passwordHash, userId]
  );

  await activityLogService.log({
    userId,
    module: 'auth',
    action: 'PASSWORD_CHANGED',
    description: 'User changed their password',
    entityType: 'user',
    entityId: userId,
  });
};

/**
 * Get current user profile
 */
const getProfile = async (userId) => {
  const result = await query(
    `SELECT id, first_name, last_name, email, phone, role, company, department, avatar_url, is_verified, last_login, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) throw new AppError('User not found', 404);
  return result.rows[0];
};

/**
 * Update user profile
 */
const updateProfile = async (userId, data) => {
  const { firstName, lastName, phone, company, department } = data;

  const result = await query(
    `UPDATE users SET first_name = COALESCE($1, first_name), last_name = COALESCE($2, last_name),
     phone = COALESCE($3, phone), company = COALESCE($4, company), department = COALESCE($5, department)
     WHERE id = $6
     RETURNING id, first_name, last_name, email, phone, role, company, department`,
    [firstName, lastName, phone, company, department, userId]
  );

  return result.rows[0];
};

module.exports = { signup, login, refreshToken, logout, forgotPassword, resetPassword, changePassword, getProfile, updateProfile };
