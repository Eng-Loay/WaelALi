const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');

const router = express.Router();
router.use(authAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الإشعارات' });
  }
});

router.post('/', async (req, res) => {
  const { title_ar, body_ar, audience, is_sent } = req.body;
  if (!title_ar || !body_ar) {
    return res.status(400).json({ success: false, message: 'العنوان والنص مطلوبان' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications (title_ar, body_ar, audience, is_sent)
       VALUES (?, ?, ?, ?)`,
      [title_ar, body_ar, audience || 'all', Boolean(is_sent)],
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إضافة الإشعار' });
  }
});

router.put('/:id', async (req, res) => {
  const { title_ar, body_ar, audience, is_sent } = req.body;
  try {
    await pool.query(
      `UPDATE notifications SET title_ar=?, body_ar=?, audience=?, is_sent=? WHERE id=?`,
      [title_ar, body_ar, audience || 'all', Boolean(is_sent), req.params.id],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث الإشعار' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف الإشعار' });
  }
});

module.exports = router;
