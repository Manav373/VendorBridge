const logger = require('../config/logger');
const { error } = require('../utils/apiResponse');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    ip: req.ip,
  });

  // PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return error(res, `Duplicate entry: ${extractPgDetail(err.detail)}`, 409);
      case '23503': // foreign_key_violation
        return error(res, 'Referenced resource does not exist', 400);
      case '23502': // not_null_violation
        return error(res, `Required field missing: ${err.column}`, 400);
      case '22P02': // invalid_text_representation
        return error(res, 'Invalid data format provided', 400);
      case '42P01': // undefined_table
        return error(res, 'Database configuration error', 500);
      default:
        if (err.code.startsWith('23')) {
          return error(res, 'Database constraint violation', 400);
        }
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token has expired', 401);
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 'File size exceeds the allowed limit (10MB)', 400);
    }
    return error(res, `File upload error: ${err.message}`, 400);
  }

  // Custom AppError
  if (err.isOperational) {
    return error(res, err.message, err.statusCode || 500);
  }

  // Default 500
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return error(res, message, 500);
};

const extractPgDetail = (detail = '') => {
  const match = detail.match(/Key \((.+?)\)=/);
  return match ? match[1] : 'field';
};

/**
 * Operational error class
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 handler
 */
const notFoundHandler = (req, res) => {
  return error(res, `Route ${req.method} ${req.path} not found`, 404);
};

module.exports = { errorHandler, notFoundHandler, AppError };
