const fs = require('fs');
const path = require('path');
const multer = require('multer');

const UPLOAD_ROOT = path.join(__dirname, '../uploads');

const KINDS = {
  image: {
    dir: 'images',
    maxSize: 10 * 1024 * 1024,
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  },
  video: {
    dir: 'videos',
    maxSize: 250 * 1024 * 1024,
    mimes: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'],
  },
  pdf: {
    dir: 'pdfs',
    maxSize: 25 * 1024 * 1024,
    mimes: ['application/pdf'],
  },
};

Object.values(KINDS).forEach(({ dir }) => {
  fs.mkdirSync(path.join(UPLOAD_ROOT, dir), { recursive: true });
});

function safeName(original) {
  const ext = path.extname(original || '').toLowerCase();
  const base = path.basename(original || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base || 'file'}${ext}`;
}

function createUploader(kind) {
  const rules = KINDS[kind] || KINDS.image;

  return multer({
    storage: multer.diskStorage({
      destination(_req, _file, cb) {
        const dest = path.join(UPLOAD_ROOT, rules.dir);
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename(_req, file, cb) {
        cb(null, safeName(file.originalname));
      },
    }),
    fileFilter(_req, file, cb) {
      if (rules.mimes.includes(file.mimetype)) {
        cb(null, true);
        return;
      }
      cb(new Error('نوع الملف غير مدعوم'));
    },
    limits: { fileSize: rules.maxSize },
  });
}

module.exports = { createUploader, KINDS, UPLOAD_ROOT };
