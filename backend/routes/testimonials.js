const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM testimonials ORDER BY created_at DESC LIMIT 10'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch testimonials' });
  }
});

module.exports = router;
