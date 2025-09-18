const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../middleware/auth');

// Submit or update rating
router.post('/:storeId', auth, async (req, res) => {
  const { rating } = req.body;
  const { storeId } = req.params;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be 1-5.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO ratings (user_id, store_id, rating) VALUES ($1, $2, $3) ON CONFLICT (user_id, store_id) DO UPDATE SET rating = $3 RETURNING *',
      [req.user.id, storeId, rating]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});


module.exports = router;
