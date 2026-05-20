const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'uploads/chat';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain'
]);

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Unsupported file type'));
};

const chatUpload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 5
  },
  fileFilter
});

module.exports = { chatUpload };
