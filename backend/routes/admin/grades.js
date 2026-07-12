const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');

const router = express.Router();
router.use(authAdmin);

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM grades ORDER BY FIELD(stage, \'secondary\', \'preparatory\'), year_order, sort_order, id',
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل الصفوف' });
  }
});

router.post('/', async (req, res) => {
  const { name_ar, name_en, description_ar, icon, color, sort_order, stage, year_order } = req.body;
  if (!name_ar || !name_en) {
    return res.status(400).json({ success: false, message: 'اسم الصف عربي وإنجليزي مطلوب' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO grades (name_ar, name_en, description_ar, icon, color, sort_order, stage, year_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name_ar, name_en, description_ar || null, icon || '📚', color || '#E63946', sort_order || 0, stage || 'secondary', year_order || 1],
    );
    res.status(201).json({ success: true, data: { id: result.insertId } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل إضافة الصف' });
  }
});

router.put('/:id', async (req, res) => {
  const { name_ar, name_en, description_ar, icon, color, sort_order, stage, year_order } = req.body;
  try {
    await pool.query(
      `UPDATE grades SET name_ar=?, name_en=?, description_ar=?, icon=?, color=?, sort_order=?, stage=?, year_order=?
       WHERE id=?`,
      [name_ar, name_en, description_ar || null, icon || '📚', color || '#E63946', sort_order || 0, stage || 'secondary', year_order || 1, req.params.id],
    );
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحديث الصف' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM grades WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل حذف الصف' });
  }
});

module.exports = router;
