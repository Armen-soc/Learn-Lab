'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { runTestCases, getAllProblems, getProblem } = require('../utils/graphTestRunner');
const { validateCode } = require('../utils/codeValidator');
const { saveGraphSubmission, getGraphSubmission } = require('../utils/database');

const router = express.Router();

const MAX_CODE_BYTES = 64 * 1024;
const ALLOWED_LANGUAGES = ['python', 'javascript'];

const graphLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => String(req.user?.id || req.ip),
  message: { error: 'Rate limit reached. Max 50 submissions per 10 minutes.' }
});

/**
 * GET /api/graph/problems
 * Get all available graph problems
 */
router.get('/problems', requireAuth, (req, res) => {
  try {
    const problems = getAllProblems();
    return res.json({
      status: 'ok',
      problemCount: problems.length,
      problems
    });
  } catch (err) {
    console.error('[GRAPH] Failed to get problems:', err.message);
    return res.status(500).json({ error: 'Failed to load problems' });
  }
});

/**
 * GET /api/graph/problems/:problemId
 * Get specific problem details
 */
router.get('/problems/:problemId', requireAuth, (req, res) => {
  try {
    const { problemId } = req.params;
    const problem = getProblem(problemId);

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    return res.json({
      status: 'ok',
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        difficulty: problem.difficulty,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        testCaseCount: problem.testCases.length,
        sampleTestCases: problem.testCases.slice(0, 2) // Only show first 2 for testing
      }
    });
  } catch (err) {
    console.error('[GRAPH] Failed to get problem:', err.message);
    return res.status(500).json({ error: 'Failed to load problem' });
  }
});

/**
 * POST /api/graph/submit
 * Submit code for a graph problem
 */
router.post('/submit',
  requireAuth,
  graphLimiter,
  [
    body('code').isString().isLength({ min: 1, max: MAX_CODE_BYTES }).withMessage('Code required (1-64KB)'),
    body('language').isIn(ALLOWED_LANGUAGES).withMessage('Language must be python or javascript'),
    body('problemId').isString().withMessage('Problem ID required'),
    body('courseId').isString().withMessage('Course ID required'),
    body('moduleId').isString().withMessage('Module ID required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, language, problemId, courseId, moduleId } = req.body;
    const userId = req.user.id;

    // Check if problem exists
    const problem = getProblem(problemId);
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found' });
    }

    // Validate code for malicious patterns
    const validation = validateCode(code, language);
    if (!validation.safe) {
      return res.status(422).json({
        error: 'Code contains dangerous patterns',
        status: 'validation_failed',
        details: validation.issues
      });
    }

    try {
      // Run test cases
      console.log(`[GRAPH] Running tests for user ${userId}, problem ${problemId}`);
      const testResults = await runTestCases(code, problemId, language, problem.timeLimit);

      // Save submission
      const submission = await saveGraphSubmission({
        userId,
        courseId,
        moduleId,
        problemId,
        problemTitle: problem.title,
        code,
        language,
        testsPassed: testResults.testsPassed,
        testsFailed: testResults.testsFailed,
        totalTests: testResults.totalTests,
        passPercentage: testResults.passPercentage,
        allTestsPassed: testResults.success,
        difficulty: problem.difficulty
      });

      // Return results
      const status = testResults.success ? 'success' : 'partial';
      return res.json({
        submissionId: submission.id,
        status,
        message: testResults.success
          ? 'All tests passed! ✅'
          : `${testResults.testsPassed}/${testResults.totalTests} tests passed`,
        problemId,
        problemTitle: problem.title,
        testsPassed: testResults.testsPassed,
        testsFailed: testResults.testsFailed,
        totalTests: testResults.totalTests,
        passPercentage: testResults.passPercentage,
        testDetails: testResults.results,
        timestamp: submission.created_at,
        difficulty: problem.difficulty,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit
      });
    } catch (err) {
      console.error('[GRAPH] Submission error:', err.message);
      return res.status(500).json({
        error: 'Submission failed',
        details: err.message,
        status: 'execution_failed'
      });
    }
  }
);

/**
 * GET /api/graph/submissions/:submissionId
 * Get submission details
 */
router.get('/submissions/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await getGraphSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify ownership
    if (submission.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json({
      status: 'ok',
      submission
    });
  } catch (err) {
    console.error('[GRAPH] Failed to get submission:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve submission' });
  }
});

module.exports = router;
