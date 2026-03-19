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

router.get('/', requireAuth, (req, res) => {
  const lang = req.query.lang || 'en';
  res.json(COURSES.map(c => ({
    id: c.id, 
    title: typeof c.title === 'object' ? (c.title[lang] || c.title['en']) : c.title, 
    description: typeof c.description === 'object' ? (c.description[lang] || c.description['en']) : c.description, 
    moduleCount: c.modules.length,
    modules: c.modules.map(m => ({
      id: m.id,
      title: typeof m.title === 'object' ? (m.title[lang] || m.title['en']) : m.title
    }))
  })));
});

router.get('/:courseId', requireAuth, (req, res) => {
  const lang = req.query.lang || 'en';
  const course = COURSES.find(c => c.id === req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  
  const localizedCourse = {
    ...course,
    title: typeof course.title === 'object' ? (course.title[lang] || course.title['en']) : course.title,
    description: typeof course.description === 'object' ? (course.description[lang] || course.description['en']) : course.description,
    modules: course.modules.map(m => ({
      ...m,
      title: typeof m.title === 'object' ? (m.title[lang] || m.title['en']) : m.title
    }))
  };
  res.json(localizedCourse);
});

router.get('/:courseId/modules/:moduleId', requireAuth, (req, res) => {
  const lang = req.query.lang || 'en';
  const course = COURSES.find(c => c.id === req.params.courseId);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  const mod = course.modules.find(m => m.id === req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Module not found' });
  
  const localizedMod = {
    ...mod,
    title: typeof mod.title === 'object' ? (mod.title[lang] || mod.title['en']) : mod.title,
    content: typeof mod.content === 'object' ? (mod.content[lang] || mod.content['en']) : mod.content,
    challenge: mod.challenge ? {
      ...mod.challenge,
      instructions: typeof mod.challenge.instructions === 'object' ? (mod.challenge.instructions[lang] || mod.challenge.instructions['en']) : mod.challenge.instructions
    } : null
  };

  res.json({ 
    course: { 
      id: course.id, 
      title: typeof course.title === 'object' ? (course.title[lang] || course.title['en']) : course.title 
    }, 
    module: localizedMod 
  });
});

module.exports = router;
