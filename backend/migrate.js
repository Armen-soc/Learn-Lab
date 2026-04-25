'use strict';
require('dotenv').config();
const { pool } = require('./pool');

/**
 * Migration script to initialize and update database schema
 */
async function migrateDatabase() {
  try {
    console.log('[MIGRATE] Starting database migration...\n');

    // 1. Users table
    console.log('[MIGRATE] Checking users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password_hash VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if columns exist (for existing tables)
    const checkUserColumns = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users';
    `);
    const existingUserColumns = checkUserColumns.rows.map(row => row.column_name);
    
    if (!existingUserColumns.includes('is_verified')) {
      console.log('[MIGRATE] Adding is_verified to users');
      await pool.query('ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE');
    }
    if (!existingUserColumns.includes('verification_token')) {
      console.log('[MIGRATE] Adding verification_token to users');
      await pool.query('ALTER TABLE users ADD COLUMN verification_token VARCHAR(255)');
    }
    console.log('[MIGRATE] ✓ Users table ready');

    // 2. Module progress table
    console.log('[MIGRATE] Checking module_progress table...');
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
    console.log('[MIGRATE] ✓ Module progress table ready');

    // 3. Submissions table
    console.log('[MIGRATE] Checking submissions table...');
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'submissions'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('[MIGRATE] Creating submissions table...');
      await pool.query(`
        CREATE TABLE submissions (
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
      console.log('[MIGRATE] ✓ Submissions table created');
    } else {
      console.log('[MIGRATE] Submissions table already exists, checking columns...');
      
      const checkColumns = await pool.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'submissions';
      `);

      const existingColumns = checkColumns.rows.map(row => row.column_name);
      
      const requiredColumns = [
        { name: 'execution_status', type: 'VARCHAR(20)', default: "'pending'" },
        { name: 'stdout', type: 'TEXT', default: "''" },
        { name: 'stderr', type: 'TEXT', default: "''" },
        { name: 'exit_code', type: 'INT', default: null },
        { name: 'execution_time', type: 'INT', default: null },
        { name: 'is_safe', type: 'BOOLEAN', default: 'true' },
        { name: 'executed_at', type: 'TIMESTAMP', default: null },
      ];

      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          console.log(`[MIGRATE] Adding column: ${col.name}`);
          const defaultClause = col.default ? ` DEFAULT ${col.default}` : '';
          await pool.query(`
            ALTER TABLE submissions
            ADD COLUMN ${col.name} ${col.type}${defaultClause};
          `);
          console.log(`[MIGRATE] ✓ Column '${col.name}' added`);
        }
      }
    }

    // 4. Graph submissions table
    console.log('[MIGRATE] Checking graph_submissions table...');
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
    console.log('[MIGRATE] ✓ Graph submissions table ready');

    console.log('\n[MIGRATE] ✓ Database migration completed successfully');
    await pool.end();
  } catch (err) {
    console.error('[MIGRATE] Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

migrateDatabase();
