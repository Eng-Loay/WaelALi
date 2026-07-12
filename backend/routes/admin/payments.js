const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');

const router = express.Router();
router.use(authAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.*, s.name AS subscriber_name, c.title_ar AS course_title, cp.code AS coupon_code
      FROM payments p
      LEFT JOIN subscribers s ON s.id = p.subscriber_id
      LEFT JOIN courses c ON c.id = p.course_id
      LEFT JOIN coupons cp ON cp.id = p.coupon_id
      ORDER BY p.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل المدفوعات' });
  }
});

router.post('/', async (req, res) => {
  const { subscriber_id, course_id, coupon_id, amount, method, status, note } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO payments (subscriber_id, course_id, coupon_id, amount, method, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        subscriber_id || null,
        course_id || null,
        coupon_id || null,
        amount || 0,
        method || 'cash',
        status || 'paid',
        note || null,
      ],
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إضافة الدفعة' });
  }
});

router.put('/:id', async (req, res) => {
  const { subscriber_id, course_id, coupon_id, amount, method, status, note } = req.body;
  try {
    await pool.query(
      `UPDATE payments SET subscriber_id=?, course_id=?, coupon_id=?, amount=?, method=?, status=?, note=?
       WHERE id=?`,
      [
        subscriber_id || null,
        course_id || null,
        coupon_id || null,
        amount || 0,
        method || 'cash',
        status || 'paid',
        note || null,
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث الدفعة' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف الدفعة' });
  }
});

module.exports = router;
