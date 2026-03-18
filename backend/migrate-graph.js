'use strict';
require('dotenv').config();
const { pool } = require('./pool');

/**
 * Migration to add graph_submissions table
 */
async function migrate() {
  try {
    console.log('[MIGRATE] Creating graph_submissions table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS graph_submissions (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        course_id VARCHAR(80) NOT NULL,
        module_id VARCHAR(80) NOT NULL,
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
        submitted_at TIMESTAMP
      );
    `);

    console.log('[MIGRATE] ✓ graph_submissions table created');

    // Verify table structure
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'graph_submissions'
      ORDER BY ordinal_position;
    `);

    console.log('\n[MIGRATE] Table structure:');
    console.log('─'.repeat(50));
    result.rows.forEach((col, idx) => {
      console.log(`  ${idx + 1}. ${col.column_name.padEnd(20)} ${col.data_type}`);
    });
    console.log('─'.repeat(50));

    console.log('\n[MIGRATE] ✓ Migration completed successfully');
    await pool.end();
  } catch (err) {
    console.error('[MIGRATE] Error:', err.message);
    process.exit(1);
  }
}

migrate();
