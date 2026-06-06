const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { query } = require('../config/database');
const { unauthorized, forbidden } = require('../utils/apiResponse');

// ─── Tiny in-memory user cache (avoids DB on every optionalAuth call) ────────
// Key: userId  Value: { user, expiresAt }
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const USER_CACHE_MAX = 500;
const _userCache = new Map();

const _getCached = (id) => {
  const entry = _userCache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _userCache.delete(id); return null; }
  return entry.user;
};

const _setCache = (id, user) => {
  if (_userCache.size >= USER_CACHE_MAX) {
    // Evict the oldest entry
    _userCache.delete(_userCache.keys().next().value);
  }
  _userCache.set(id, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
};

/** Call this whenever a user is deactivated so the cache is invalidated immediately */
const invalidateUserCache = (userId) => _userCache.delete(userId);


/**
 * Verify JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Access token is required');
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return unauthorized(res, 'Access token has expired');
      }
      return unauthorized(res, 'Invalid access token');
    }

    // ⚡ Fast path: read user from the verified JWT payload — no DB round-trip
    if (!decoded.isActive) {
      return forbidden(res, 'Your account has been deactivated');
    }

    req.user = {
      id:        decoded.userId,
      role:      decoded.role,
      first_name: decoded.firstName,
      last_name:  decoded.lastName,
      email:     decoded.email,
      company:   decoded.company,
      is_active: decoded.isActive,
    };

    next();
  } catch (error) {
    return unauthorized(res, 'Authentication failed');
  }
};


/**
 * Role-Based Access Control middleware factory
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, 'Not authenticated');
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(
        res,
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

/**
 * Optional auth — attaches user if token exists, continues if not
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    // Try the cache first
    let user = _getCached(decoded.userId);

    if (!user) {
      // Cache miss — fetch from DB and cache the result
      const result = await query(
        'SELECT id, first_name, last_name, email, role, company FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
        _setCache(decoded.userId, user);
      }
    }

    if (user) req.user = user;
    next();
  } catch {
    next(); // Continue without user
  }
};

module.exports = { authenticate, authorize, optionalAuth, invalidateUserCache };
