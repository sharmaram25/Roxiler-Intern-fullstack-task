const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth, requireRole } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// Admin create user (admin or store owner or other admin)
router.post('/', auth, requireRole('admin'), async (req, res) => {
  const { name, email, password, address, role } = req.body;
  if (!name || !email || !password || !address || !role) {
    return res.status(400).json({ message: 'All fields required.' });
  }
  if (!['admin','user','owner'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, address, role) VALUES ($1,$2,$3,$4,$5) RETURNING id,name,email,address,role',
      [name, email, hashed, address, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'Email exists.' });
    res.status(500).json({ message: 'Server error.' });
  }
});

// List users (admin) with filters
router.get('/', auth, requireRole('admin'), async (req, res) => {
  const { name, email, address, role, sort = 'name', order = 'asc' } = req.query;
  let query = 'SELECT id,name,email,address,role FROM users';
  let where = [];
  let params = [];
  if (name) { params.push(`%${name}%`); where.push(`name ILIKE $${params.length}`); }
  if (email) { params.push(`%${email}%`); where.push(`email ILIKE $${params.length}`); }
  if (address) { params.push(`%${address}%`); where.push(`address ILIKE $${params.length}`); }
  if (role) { params.push(role); where.push(`role = $${params.length}`); }
  if (where.length) query += ' WHERE ' + where.join(' AND ');
  if (['name','email','role'].includes(sort)) query += ` ORDER BY ${sort} ${order === 'desc' ? 'DESC':'ASC'}`;
  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get user detail (admin)
router.get('/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const userRes = await pool.query('SELECT id,name,email,address,role FROM users WHERE id = $1', [req.params.id]);
    if (!userRes.rows.length) return res.status(404).json({ message: 'Not found.' });
    const user = userRes.rows[0];
    if (user.role === 'owner') {
      const ratingRes = await pool.query('SELECT COALESCE(AVG(r.rating),0) as owner_rating FROM stores s LEFT JOIN ratings r ON s.id = r.store_id WHERE s.owner_id = $1', [user.id]);
      user.owner_rating = ratingRes.rows[0].owner_rating;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// User change password (self)
router.put('/password/change', auth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Both passwords required.' });
  if (!/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/.test(newPassword)) {
    return res.status(400).json({ message: 'New password invalid.' });
  }
  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = userRes.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Old password wrong.' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
