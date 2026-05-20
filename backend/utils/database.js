'use strict';
const { pool } = require('../pool');

/**
 * Creates essential tables if they don't exist
 */
async function initDB() {
  try {
    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        verification_token VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DB] Users table initialized');

    // Module progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS module_progress (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        course_id VARCHAR(80) NOT NULL,
        module_id VARCHAR(80) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        UNIQUE (user_id, course_id, module_id)
      );
    `);
    console.log('[DB] Module progress table initialized');

    // Submissions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        course_id VARCHAR(80) NOT NULL,
        module_id VARCHAR(80) NOT NULL,
        code TEXT NOT NULL,
        language VARCHAR(20) NOT NULL,
        execution_status VARCHAR(20) DEFAULT 'pending',
        stdout TEXT DEFAULT '',
        stderr TEXT DEFAULT '',
        exit_code INT,
        execution_time INT,
        is_safe BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP
      );
    `);
    console.log('[DB] Submissions table initialized');

    // Create graph submissions table (no foreign key constraint - graph problems are standalone)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS graph_submissions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id VARCHAR(80),
        module_id VARCHAR(80),
        problem_id VARCHAR(80) NOT NULL,
        problem_title VARCHAR(255) NOT NULL,
        code TEXT NOT NULL,
        language VARCHAR(20) NOT NULL,
        tests_passed INT DEFAULT 0,
        tests_failed INT DEFAULT 0,
        total_tests INT DEFAULT 0,
        pass_percentage INT DEFAULT 0,
        all_tests_passed BOOLEAN DEFAULT false,
        difficulty VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('[DB] Graph submissions table initialized');

    // Create indexes for graph submissions
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_submissions_user ON graph_submissions(user_id);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_submissions_problem ON graph_submissions(problem_id);
    `);
  } catch (err) {
    console.error('[DB] Failed to initialize tables:', err.message);
  }
}

/**
 * Save graph problem submission
 */
async function saveGraphSubmission(submission) {
  try {
    const query = `
      INSERT INTO graph_submissions (
        user_id, course_id, module_id, problem_id, problem_title,
        code, language, tests_passed, tests_failed, total_tests,
        pass_percentage, all_tests_passed, difficulty, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      RETURNING id, created_at, submitted_at;
    `;

    const values = [
      submission.userId,
      submission.courseId,
      submission.moduleId,
      submission.problemId,
      submission.problemTitle,
      submission.code,
      submission.language,
      submission.testsPassed,
      submission.testsFailed,
      submission.totalTests,
      submission.passPercentage,
      submission.allTestsPassed,
      submission.difficulty,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error('[DB] Failed to save graph submission:', err.message);
    throw err;
  }
}

/**
 * Get graph submission by ID
 */
async function getGraphSubmission(submissionId) {
  try {
    const query = `
      SELECT id, user_id, course_id, module_id, problem_id, problem_title,
             code, language, tests_passed, tests_failed, total_tests,
             pass_percentage, all_tests_passed, difficulty, created_at, submitted_at
      FROM graph_submissions
      WHERE id = $1;
    `;

    const result = await pool.query(query, [submissionId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('[DB] Failed to get graph submission:', err.message);
    throw err;
  }
}

/**
 * Save submission with execution results
 */
async function saveSubmission(userId, courseId, moduleId, code, language, results) {
  try {
    const query = `
      INSERT INTO submissions (
        user_id, course_id, module_id, code, language,
        execution_status, stdout, stderr, exit_code, execution_time, is_safe, executed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING id, created_at, executed_at;
    `;

    const values = [
      userId,
      courseId,
      moduleId,
      code,
      language,
      results.exitCode === 0 ? 'success' : 'error',
      results.stdout,
      results.stderr,
      results.exitCode,
      results.executionTime,
      results.safe || false,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error('[DB] Failed to save submission:', err.message);
    throw err;
  }
}

/**
 * Get submission by ID
 */
async function getSubmission(submissionId) {
  try {
    const query = `
      SELECT id, user_id, course_id, module_id, code, language,
             execution_status, stdout, stderr, exit_code, execution_time,
             is_safe, created_at, executed_at
      FROM submissions
      WHERE id = $1;
    `;

    const result = await pool.query(query, [submissionId]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('[DB] Failed to get submission:', err.message);
    throw err;
  }
}

/**
 * Get all submissions for a user
 */
async function getUserSubmissions(userId, limit = 50) {
  try {
    const query = `
      SELECT id, course_id, module_id, language, execution_status, exit_code,
             execution_time, is_safe, created_at, executed_at
      FROM submissions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;

    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (err) {
    console.error('[DB] Failed to get user submissions:', err.message);
    throw err;
  }
}

/**
 * Update submission status
 */
async function updateSubmissionStatus(submissionId, status, results) {
  try {
    const query = `
      UPDATE submissions
      SET execution_status = $1, stdout = $2, stderr = $3,
          exit_code = $4, execution_time = $5, is_safe = $6, executed_at = NOW()
      WHERE id = $7
      RETURNING *;
    `;

    const values = [
      status,
      results.stdout || '',
      results.stderr || '',
      results.exitCode,
      results.executionTime || 0,
      results.safe || false,
      submissionId,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (err) {
    console.error('[DB] Failed to update submission:', err.message);
    throw err;
  }
}

module.exports = {
  initDB,
  saveSubmission,
  getSubmission,
  getUserSubmissions,
  updateSubmissionStatus,
  saveGraphSubmission,
  getGraphSubmission,
};
