const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/', async (req, res) => {
  const {
    name,
    first_name,
    last_name,
    email,
    phone,
    parent_phone,
    governorate,
    address,
    grade_id,
  } = req.body;

  const fullName = (name || `${first_name || ''} ${last_name || ''}`).trim();
  if (!fullName) {
    return res.status(400).json({ error: 'الاسم مطلوب' });
  }
  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ error: 'رقم الطالب مطلوب' });
  }
  if (!parent_phone || !String(parent_phone).trim()) {
    return res.status(400).json({ error: 'رقم ولي الأمر مطلوب' });
  }
  if (!governorate || !String(governorate).trim()) {
    return res.status(400).json({ error: 'المحافظة مطلوبة' });
  }
  if (!address || !String(address).trim()) {
    return res.status(400).json({ error: 'العنوان مطلوب' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO subscribers (name, email, phone, parent_phone, governorate, address, grade_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        email ? String(email).trim() : null,
        String(phone).trim(),
        String(parent_phone).trim(),
        String(governorate).trim(),
        String(address).trim(),
        grade_id || null,
      ],
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
