const express = require('express');
const authAdmin = require('../../middleware/authAdmin');
const { createUploader, KINDS } = require('../../middleware/upload');

const router = express.Router();

router.post('/:kind', authAdmin, (req, res) => {
  const kind = KINDS[req.params.kind] ? req.params.kind : 'image';
  const uploader = createUploader(kind);

  uploader.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'فشل رفع الملف' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار ملف' });
    }

    const publicUrl = `/uploads/${KINDS[kind].dir}/${req.file.filename}`;
    res.json({
      success: true,
      data: {
        url: publicUrl,
        filename: req.file.filename,
        kind,
        mimetype: req.file.mimetype,
        size: req.file.size,
      },
    });
  });
});

module.exports = router;
