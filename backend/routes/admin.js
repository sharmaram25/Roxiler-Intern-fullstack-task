const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/stats', auth, requireRole('admin'), async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM users');
    const stores = await pool.query('SELECT COUNT(*) FROM stores');
    const ratings = await pool.query('SELECT COUNT(*) FROM ratings');
    res.json({ total_users: Number(users.rows[0].count), total_stores: Number(stores.rows[0].count), total_ratings: Number(ratings.rows[0].count) });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;