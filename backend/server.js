'use strict';
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes     = require('./routes/auth');
const courseRoutes   = require('./routes/courses');
const progressRoutes = require('./routes/progress');
const executeRoutes  = require('./routes/execute');
const graphRoutes    = require('./routes/graph');
const { pool }       = require('./pool');
const { initDB }     = require('./utils/database');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '128kb' }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/courses',  courseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/execute',  executeRoutes);
app.use('/api/graph',    graphRoutes);

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Initialize database on startup
initDB().catch(err => console.error('[INIT] Database initialization error:', err));

app.listen(PORT, async () => {
  console.log(`\n  LearnLab running at http://localhost:${PORT}\n`);
  
  // Verify database connection
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Database connected');
  } catch (err) {
    console.error('[DB] Database connection failed:', err.message);
  }
});
