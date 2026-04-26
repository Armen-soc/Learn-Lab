'use strict';
require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const fs        = require('fs');
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

const allowedOrigins = [
  'https://learn-lab-2.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '128kb' }));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
}));

// Serve frontend
const frontendPath = process.env.FRONTEND_PATH || 
  (fs.existsSync(path.join(__dirname, '../frontend')) 
    ? path.join(__dirname, '../frontend') 
    : path.join(__dirname, '../../frontend'));

app.use(express.static(frontendPath));

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
  const indexPath = path.join(frontendPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not found. Please build the frontend first.');
  }
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
