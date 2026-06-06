const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./src/config/env');
const logger = require('./src/config/logger');
const { testConnection } = require('./src/config/database');
const { requestLogger } = require('./src/middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./src/middleware/errorHandler');
const routes = require('./src/routes');

const app = express();

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows image access
}));

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // In development, allow requests with no origin (like mobile apps or curl)
    if (!origin || config.server.env === 'development' || origin === config.server.clientUrl) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.server.env === 'development',
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  message: { message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.server.env === 'development',
});

// Apply general rate limiter
app.use(generalLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

// Serving uploaded files static directory
app.use('/uploads', express.static(path.join(__dirname, config.upload.dir)));

// Healthcheck endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  if (dbStatus) {
    return res.status(200).json({ status: 'UP', database: 'CONNECTED', timestamp: new Date() });
  } else {
    return res.status(500).json({ status: 'DOWN', database: 'DISCONNECTED', timestamp: new Date() });
  }
});

// Apply auth rate limiter specifically to auth routes
app.use('/api/auth', authLimiter);

// Register API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

const PORT = config.server.port;

const startServer = async () => {
  try {
    const isDbConnected = await testConnection();
    if (!isDbConnected) {
      logger.error('❌  Could not establish database connection. Exiting...');
      process.exit(1);
    }

    app.listen(PORT, () => {
      logger.info(`🚀  Server running in ${config.server.env} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('❌  Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
