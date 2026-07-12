const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM features ORDER BY sort_order ASC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch features' });
  }
});

module.exports = router;
