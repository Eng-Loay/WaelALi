const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
  const { name, email, phone, grade_id } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'الاسم والبريد الإلكتروني مطلوبان' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO subscribers (name, email, phone, grade_id) VALUES (?, ?, ?, ?)',
      [name, email, phone || null, grade_id || null]
    );
    res.status(201).json({
      message: 'تم التسجيل بنجاح! هنتواصل معاك قريباً',
      id: result.insertId,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
    }
    res.status(500).json({ error: 'فشل التسجيل، حاول مرة أخرى' });
  }
});

module.exports = router;
