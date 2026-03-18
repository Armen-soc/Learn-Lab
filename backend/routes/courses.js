'use strict';
const express = require('express');
const fs      = require('fs');
const path    = require('path');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

let COURSES = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, '../courses.json'), 'utf8');
  COURSES = JSON.parse(raw);
  console.log(`Loaded ${COURSES.length} courses`);
} catch (err) {
  console.error('Failed to load courses.json:', err.message);
}

router.get('/', requireAuth, (_req, res) => {
  res.json(COURSES.map(c => ({
    id: c.id, title: c.title, description: c.description, moduleCount: c.modules.length,
  })));
});

router.get('/:courseId', requireAuth, (req, res) => {
  const course = COURSES.find(c => c.id === req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

router.get('/:courseId/modules/:moduleId', requireAuth, (req, res) => {
  const course = COURSES.find(c => c.id === req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const mod = course.modules.find(m => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Module not found' });
  res.json({ course: { id: course.id, title: course.title }, module: mod });
});

module.exports = router;
