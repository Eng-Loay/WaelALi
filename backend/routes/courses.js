const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const featured = req.query.featured === 'true';
    let query = `
      SELECT c.*, g.name_ar as grade_name 
      FROM courses c 
      JOIN grades g ON c.grade_id = g.id
    `;
    if (featured) {
      query += ' WHERE c.is_featured = TRUE';
    }
    query += ' ORDER BY c.created_at DESC';
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, g.name_ar as grade_name 
       FROM courses c 
       JOIN grades g ON c.grade_id = g.id 
       WHERE c.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

module.exports = router;
