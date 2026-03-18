'use strict';
const express = require('express');
const { pool } = require('../pool');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT course_id, module_id, completed, completed_at FROM module_progress WHERE user_id = $1',
    [req.user.id]
  );
  res.json(result.rows);
});

router.get('/stats', requireAuth, async (req, res) => {
  const [prog, subs] = await Promise.all([
    pool.query('SELECT COUNT(*) AS completed FROM module_progress WHERE user_id = $1 AND completed = TRUE', [req.user.id]),
    pool.query('SELECT COUNT(*) AS total FROM submissions WHERE user_id = $1', [req.user.id]),
  ]);
  res.json({
    modulesCompleted: parseInt(prog.rows[0].completed),
    totalSubmissions: parseInt(subs.rows[0].total),
  });
});

router.get('/graph-problems', requireAuth, async (req, res) => {
  try {
    // Get problems solved by difficulty
    const result = await pool.query(
      `SELECT 
        difficulty,
        COUNT(DISTINCT problem_id) as solved_count
      FROM graph_submissions 
      WHERE user_id = $1 AND all_tests_passed = TRUE
      GROUP BY difficulty
      ORDER BY 
        CASE 
          WHEN difficulty = 'easy' THEN 1
          WHEN difficulty = 'medium' THEN 2
          WHEN difficulty = 'hard' THEN 3
          ELSE 4
        END`,
      [req.user.id]
    );

    // Get all solved problems with details
    const problemsResult = await pool.query(
      `SELECT 
        problem_id,
        problem_title,
        difficulty,
        all_tests_passed,
        pass_percentage,
        submitted_at,
        tests_passed,
        total_tests
      FROM graph_submissions 
      WHERE user_id = $1 AND all_tests_passed = TRUE
      ORDER BY submitted_at DESC
      LIMIT 100`,
      [req.user.id]
    );

    // Get total available problems by difficulty (from the fixed list)
    const availableProblems = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    // Count current solved by difficulty
    const solvedByDifficulty = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    result.rows.forEach(row => {
      solvedByDifficulty[row.difficulty] = row.solved_count;
    });

    // Calculate total problems (this should match the total in graph-problems.json)
    // For now we'll calculate from the result, but ideally we'd load from JSON
    res.json({
      solvedByDifficulty,
      solvedProblems: problemsResult.rows,
      totalSolved: result.rows.reduce((sum, row) => sum + row.solved_count, 0)
    });
  } catch (err) {
    console.error('Failed to get graph problems progress:', err);
    res.status(500).json({ error: 'Failed to load graph problems progress' });
  }
});

router.post('/:courseId/:moduleId/complete', requireAuth, async (req, res) => {
  const { courseId, moduleId } = req.params;
  await pool.query(
    `INSERT INTO module_progress (user_id, course_id, module_id, completed, completed_at)
     VALUES ($1, $2, $3, TRUE, NOW())
     ON CONFLICT (user_id, course_id, module_id)
     DO UPDATE SET completed = TRUE, completed_at = NOW()`,
    [req.user.id, courseId, moduleId]
  );
  res.json({ message: 'Module marked as complete' });
});

router.get('/:courseId/:moduleId/submissions', requireAuth, async (req, res) => {
  const { courseId, moduleId } = req.params;
  const result = await pool.query(
    `SELECT id, language, code, created_at
     FROM submissions
     WHERE user_id = $1 AND course_id = $2 AND module_id = $3
     ORDER BY created_at DESC LIMIT 20`,
    [req.user.id, courseId, moduleId]
  );
  res.json(result.rows);
});

module.exports = router;
