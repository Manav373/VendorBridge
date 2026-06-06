const { Pool } = require('pg');
const config = require('./env');
const logger = require('./logger');

const pool = new Pool(config.db);

pool.on('connect', () => {
  logger.debug('New PostgreSQL client connected');
});

pool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL client error', { error: err.message });
  process.exit(-1);
});

/**
 * Execute a parameterized query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('SQL query executed', { text, duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('SQL query failed', { text, error: error.message });
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);

  // Override release to log long-held clients
  const timeout = setTimeout(() => {
    logger.warn('PostgreSQL client checked out for more than 5 seconds');
  }, 5000);

  client.release = () => {
    clearTimeout(timeout);
    release();
  };

  client.query = async (text, params) => {
    const start = Date.now();
    const result = await originalQuery(text, params);
    const duration = Date.now() - start;
    logger.debug('TX query', { text, duration: `${duration}ms` });
    return result;
  };

  return client;
};

/**
 * Test DB connection
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as time, version() as version');
    logger.info('✅  PostgreSQL connected', {
      time: result.rows[0].time,
      version: result.rows[0].version.split(' ')[0],
    });
    return true;
  } catch (error) {
    logger.error('❌  PostgreSQL connection failed', { error: error.message });
    return false;
  }
};

module.exports = { pool, query, getClient, testConnection };
