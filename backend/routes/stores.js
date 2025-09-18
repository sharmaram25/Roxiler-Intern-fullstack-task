const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, requireRole } = require('../middleware/auth');

// Add new store (admin only)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { name, email, address, owner_id } = req.body;
  if (!name || !email || !address) {
    return res.status(400).json({ message: 'All fields required.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, address, owner_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Email already exists.' });
    }
    res.status(500).json({ message: 'Server error.' });
  }
});

// List all stores (with optional filters)
router.get('/', auth, async (req, res) => {
  const { name, address, sort = 'name', order = 'asc' } = req.query;
  let base = 'SELECT s.id,s.name,s.email,s.address,s.owner_id, COALESCE(AVG(r.rating),0) as avg_rating, MAX(ur.rating) as user_rating';
  base += ' FROM stores s';
  base += ' LEFT JOIN ratings r ON s.id = r.store_id';
  base += ' LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = $1';
  let where = [];
  let params = [req.user.id];
  if (name) { params.push(`%${name}%`); where.push(`s.name ILIKE $${params.length}`); }
  if (address) { params.push(`%${address}%`); where.push(`s.address ILIKE $${params.length}`); }
  if (where.length) base += ' WHERE ' + where.join(' AND ');
  base += ' GROUP BY s.id';
  if (['name','email','address'].includes(sort)) base += ` ORDER BY s.${sort} ${order === 'desc' ? 'DESC':'ASC'}`;
  try {
    const result = await pool.query(base, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
