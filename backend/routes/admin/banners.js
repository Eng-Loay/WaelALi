const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');

const router = express.Router();
router.use(authAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM banners ORDER BY sort_order, id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل البانرات' });
  }
});

router.post('/', async (req, res) => {
  const { title_ar, image_url, is_active, sort_order } = req.body;
  if (!title_ar) return res.status(400).json({ success: false, message: 'عنوان البانر مطلوب' });
  try {
    const [result] = await pool.query(
      `INSERT INTO banners (title_ar, image_url, is_active, sort_order)
       VALUES (?, ?, ?, ?)`,
      [title_ar, image_url || null, is_active !== false, sort_order || 0],
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إضافة البانر' });
  }
});

router.put('/:id', async (req, res) => {
  const { title_ar, image_url, is_active, sort_order } = req.body;
  try {
    await pool.query(
      `UPDATE banners SET title_ar=?, image_url=?, is_active=?, sort_order=? WHERE id=?`,
      [title_ar, image_url || null, is_active !== false, sort_order || 0, req.params.id],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث البانر' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM banners WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف البانر' });
  }
});

module.exports = router;
