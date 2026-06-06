const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');
const { error } = require('../utils/apiResponse');

// Ensure upload directory exists
const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const entityDir = path.join(uploadDir, req.params.entityType || 'misc');
    if (!fs.existsSync(entityDir)) {
      fs.mkdirSync(entityDir, { recursive: true });
    }
    cb(null, entityDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (config.upload.allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type .${ext} is not allowed. Allowed: ${config.upload.allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize,
    files: 5,
  },
});

// Error handling wrapper for multer
const handleUpload = (fieldName) => (req, res, next) => {
  upload.array(fieldName, 5)(req, res, (err) => {
    if (err) {
      return error(res, err.message, 400);
    }
    next();
  });
};

module.exports = { upload, handleUpload };
