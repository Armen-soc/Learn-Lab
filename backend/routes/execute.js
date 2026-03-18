'use strict';
const express   = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { validateCode, checkSyntax } = require('../utils/codeValidator');
const { executeInDocker } = require('../utils/dockerExecutor');
const { saveSubmission, getSubmission } = require('../utils/database');

const router = express.Router();

const MAX_CODE_BYTES    = 64 * 1024;
const ALLOWED_LANGUAGES = ['python','javascript','bash','cpp'];

const execLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => String(req.user?.id || req.ip),
  message: { error: 'Rate limit reached. Max 30 submissions per 10 minutes.' }
});

/**
 * POST /api/execute
 * Execute code in Docker container with safety checks
 */
router.post('/',
  requireAuth,
  execLimiter,
  [
    body('code').isString().isLength({ min: 1, max: MAX_CODE_BYTES }).withMessage('Code must be 1 byte – 64 KB'),
    body('language').isIn(ALLOWED_LANGUAGES).withMessage(`Language must be one of: ${ALLOWED_LANGUAGES.join(', ')}`),
    body('courseId').isString().isLength({ min: 1, max: 80 }),
    body('moduleId').isString().isLength({ min: 1, max: 80 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: errors.array()[0].msg });

    const { code, language, courseId, moduleId } = req.body;
    const userId = req.user.id;

    // Step 1: Validate code for malicious patterns
    const validation = validateCode(code, language);
    if (!validation.safe) {
      return res.status(403).json({
        error: 'Code contains potentially dangerous patterns',
        issues: validation.issues,
        status: 'rejected',
      });
    }

    // Step 2: Check syntax
    const syntaxCheck = checkSyntax(code, language);
    if (!syntaxCheck.valid) {
      return res.status(422).json({
        error: 'Syntax error in code',
        details: syntaxCheck.error,
        status: 'syntax_error',
      });
    }

    try {
      // Step 3: Execute code in Docker
      console.log(`[EXEC] Executing ${language} code for user ${userId}, course ${courseId}`);
      const execResult = await executeInDocker(code, language, {
        userId,
        timeout: 30000,
      });

      // Step 4: Save to database
      const submission = await saveSubmission(
        userId,
        courseId,
        moduleId,
        code,
        language,
        execResult
      );

      // Step 5: Return success response
      const status = execResult.exitCode === 0 ? 'success' : 'error';
      return res.json({
        submissionId: submission.id,
        status,
        message: status === 'success' 
          ? 'Code executed successfully and saved to database'
          : 'Code executed with errors but was saved to database',
        stdout: execResult.stdout,
        stderr: execResult.stderr,
        exitCode: execResult.exitCode,
        executionTime: execResult.executionTime,
        timestamp: submission.executed_at,
        createdAt: submission.created_at,
      });
    } catch (err) {
      console.error('[EXEC] Execution error:', err.message);
      return res.status(500).json({
        error: 'Code execution failed',
        details: err.message,
        status: 'execution_failed',
      });
    }
  }
);

/**
 * GET /api/execute/:submissionId
 * Retrieve submission details
 */
router.get('/:submissionId', requireAuth, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await getSubmission(submissionId);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Verify user owns this submission
    if (submission.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    return res.json(submission);
  } catch (err) {
    console.error('[EXEC] Failed to retrieve submission:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve submission' });
  }
});

module.exports = router;
