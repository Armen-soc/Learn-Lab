#!/usr/bin/env node
'use strict';

const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

// Middleware
app.use(express.static(path.join(__dirname)));

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Frontend server error:', err);
  res.status(500).json({ error: 'Server error' });
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`🎨 Frontend server running at http://${HOST}:${PORT}`);
  console.log(`📂 Serving files from ${__dirname}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n✓ Shutting down frontend server...');
  server.close(() => {
    console.log('✓ Frontend server closed');
    process.exit(0);
  });
});
