const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM grades ORDER BY FIELD(stage, \'secondary\', \'preparatory\'), year_order DESC, sort_order DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

router.get('/:id/courses', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM courses WHERE grade_id = ? ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

module.exports = router;
