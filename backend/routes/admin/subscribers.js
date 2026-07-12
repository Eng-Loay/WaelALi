const express = require('express');
const pool = require('../../config/db');
const authAdmin = require('../../middleware/authAdmin');

const router = express.Router();

router.get('/', authAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.*, g.name_ar AS grade_name
      FROM subscribers s
      LEFT JOIN grades g ON g.id = s.grade_id
      ORDER BY s.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'فشل تحميل المشتركين' });
  }
});

module.exports = router;
