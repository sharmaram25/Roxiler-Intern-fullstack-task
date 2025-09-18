const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, requireRole } = require('../middleware/auth');

router.get('/stores', auth, requireRole('owner'), async (req, res) => {
  try {
    const stores = await pool.query('SELECT s.id,s.name,s.address, COALESCE(AVG(r.rating),0) as avg_rating, COUNT(r.id) as rating_count FROM stores s LEFT JOIN ratings r ON s.id = r.store_id WHERE s.owner_id = $1 GROUP BY s.id', [req.user.id]);
    res.json(stores.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

router.get('/stores/:id/ratings', auth, requireRole('owner'), async (req, res) => {
  try {
    const store = await pool.query('SELECT id FROM stores WHERE id = $1 AND owner_id = $2', [req.params.id, req.user.id]);
    if (!store.rows.length) return res.status(404).json({ message: 'Not found.' });
    const ratings = await pool.query('SELECT r.id, r.rating, u.name, u.email FROM ratings r JOIN users u ON r.user_id = u.id WHERE r.store_id = $1', [req.params.id]);
    res.json(ratings.rows);
  } catch (err) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;