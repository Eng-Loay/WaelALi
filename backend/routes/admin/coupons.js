const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');

const router = express.Router();
router.use(authAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الكوبونات' });
  }
});

router.post('/', async (req, res) => {
  const { code, discount_type, discount_value, max_uses, expires_at, is_active } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'كود الكوبون مطلوب' });
  try {
    const [result] = await pool.query(
      `INSERT INTO coupons (code, discount_type, discount_value, max_uses, expires_at, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(code).toUpperCase(),
        discount_type === 'fixed' ? 'fixed' : 'percent',
        discount_value || 0,
        max_uses || 0,
        expires_at || null,
        is_active !== false,
      ],
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إضافة الكوبون' });
  }
});

router.put('/:id', async (req, res) => {
  const { code, discount_type, discount_value, max_uses, expires_at, is_active } = req.body;
  try {
    await pool.query(
      `UPDATE coupons SET code=?, discount_type=?, discount_value=?, max_uses=?, expires_at=?, is_active=?
       WHERE id=?`,
      [
        String(code).toUpperCase(),
        discount_type === 'fixed' ? 'fixed' : 'percent',
        discount_value || 0,
        max_uses || 0,
        expires_at || null,
        is_active !== false,
        req.params.id,
      ],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث الكوبون' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف الكوبون' });
  }
});

module.exports = router;
