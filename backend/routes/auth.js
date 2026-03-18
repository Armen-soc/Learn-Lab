'use strict';
const express   = require('express');
const bcrypt    = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { pool }       = require('../pool');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many auth attempts, please wait 15 minutes.' }
});

// Register
router.post('/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name must be 2–120 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be 6–128 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });

    const { name, email, password } = req.body;
    try {
      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role, created_at`,
        [name, email, hash]
      );
      const user = result.rows[0];
      const token = signToken({ id: user.id, email: user.email, role: user.role });
      res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, since: user.created_at } });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
      throw err;
    }
  }
);

// Login
router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Invalid credentials' });

    const { email, password } = req.body;
    const result = await pool.query(
      'SELECT id, name, email, role, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, since: user.created_at } });
  }
);

// Get profile
router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// Update profile
router.patch('/me', requireAuth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 120 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });

    const fields = [], values = [];
    let idx = 1;
    if (req.body.name)  { fields.push(`name = $${idx++}`);  values.push(req.body.name); }
    if (req.body.email) { fields.push(`email = $${idx++}`); values.push(req.body.email); }
    if (!fields.length) return res.status(422).json({ error: 'Nothing to update' });

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, role`,
      values
    );
    res.json(result.rows[0]);
  }
);

// Change password
router.post('/change-password', requireAuth, authLimiter,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6, max: 128 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });

    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const ok = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  }
);

module.exports = router;
