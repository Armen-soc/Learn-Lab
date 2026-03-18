#!/usr/bin/env node
'use strict';

const { pool } = require('./pool');

/**
 * Fix foreign key constraint on graph_submissions table
 * Removes the problematic constraint that requires valid course/module pairs
 */
async function fixGraphForeignKey() {
  try {
    console.log('[MIGRATION] Starting graph submissions foreign key fix...');

    // Drop the existing graph_submissions table if it has the constraint
    await pool.query(`
      DROP TABLE IF EXISTS graph_submissions CASCADE;
    `);
    console.log('[MIGRATION] Dropped existing graph_submissions table');

    // Recreate graph_submissions WITHOUT foreign key constraint
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
    console.log('[MIGRATION] Recreated graph_submissions table without foreign key constraint');

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_submissions_user 
      ON graph_submissions(user_id);
    `);
    console.log('[MIGRATION] Created index on user_id');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_graph_submissions_problem 
      ON graph_submissions(problem_id);
    `);
    console.log('[MIGRATION] Created index on problem_id');

    console.log('[MIGRATION] ✅ Graph submissions foreign key fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('[MIGRATION] ❌ Error fixing foreign key:', err.message);
    process.exit(1);
  }
}

fixGraphForeignKey();
