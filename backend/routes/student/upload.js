const express = require('express');
const authStudent = require('../../middleware/authStudent');
const { createUploader, KINDS } = require('../../middleware/upload');

const router = express.Router();
router.use(authStudent);

router.post('/:kind', (req, res) => {
  const kind = req.params.kind;
  if (!KINDS[kind]) {
    return res.status(400).json({ success: false, message: 'نوع الرفع غير مدعوم' });
  }

  const uploader = createUploader(kind);
  uploader.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || 'فشل رفع الملف' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم اختيار ملف' });
    }
    const publicUrl = `/uploads/${KINDS[kind].dir}/${req.file.filename}`;
    res.json({ success: true, data: { url: publicUrl } });
  });
});

module.exports = router;
