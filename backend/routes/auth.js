'use strict';
const express   = require('express');
const bcrypt    = require('bcryptjs');
const crypto    = require('crypto');
const rateLimit = require('express-rate-limit');
const { body, query, validationResult } = require('express-validator');
const { pool }       = require('../pool');
const { signToken, requireAuth } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');

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
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, verification_token, is_verified)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email`,
        [name, email, hash, verificationToken, false]
      );
      
      const user = result.rows[0];
      
      // Send verification email
      try {
        await sendVerificationEmail(email, name, verificationToken);
      } catch (mailErr) {
        console.error('Failed to send verification email:', mailErr);
        // We continue anyway, but maybe inform the user or log it
      }

      res.status(201).json({ 
        message: 'Registration successful. Please check your email to verify your account.',
        user: { id: user.id, name: user.name, email: user.email } 
      });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
      throw err;
    }
  }
);

// Verify Email
router.get('/verify-email',
  [
    query('token').notEmpty().withMessage('Token is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { token } = req.query;
    
    try {
      const result = await pool.query(
        'UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
        [token]
      );

      if (result.rowCount === 0) {
        return res.status(400).json({ error: 'Invalid or expired verification token' });
      }

      res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (err) {
      console.error('Verification error:', err);
      res.status(500).json({ error: 'Internal server error during verification' });
    }
  }
);

// Resend Verification
router.post('/resend-verification',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required')
  ],
  async (req, res) => {
    const { email } = req.body;
    
    try {
      const userResult = await pool.query(
        'SELECT id, name, is_verified FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rowCount === 0) {
        return res.json({ message: 'If that email exists, a new verification link has been sent.' });
      }

      const user = userResult.rows[0];
      if (user.is_verified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }

      const newToken = crypto.randomBytes(32).toString('hex');
      await pool.query(
        'UPDATE users SET verification_token = $1 WHERE id = $2',
        [newToken, user.id]
      );

      await sendVerificationEmail(email, user.name, newToken);

      res.json({ message: 'If that email exists, a new verification link has been sent.' });
    } catch (err) {
      console.error('Resend error:', err);
      res.status(500).json({ error: 'Internal server error' });
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
      'SELECT id, name, email, role, password_hash, is_verified, created_at FROM users WHERE email = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.is_verified) {
      return res.status(403).json({ 
        error: 'Email not verified. Please check your inbox or resend the verification email.',
        unverified: true 
      });
    }

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
