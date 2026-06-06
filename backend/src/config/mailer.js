const nodemailer = require('nodemailer');
const config = require('./env');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: config.mail.host,
  port: config.mail.port,
  secure: config.mail.secure,
  auth: config.mail.auth,
});

const verifyMailer = async () => {
  try {
    await transporter.verify();
    logger.info('✅  Email transporter ready');
    return true;
  } catch (error) {
    logger.warn('⚠️  Email transporter not ready (emails will be skipped)', { error: error.message });
    return false;
  }
};

module.exports = { transporter, verifyMailer };
