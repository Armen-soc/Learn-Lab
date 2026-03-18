'use strict';
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const TEMP_DIR = path.join(__dirname, '../../temp');
const TIMEOUT_MS = 10000; // 10s timeout
const IMAGE_NAME = 'learnlab-executor';

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

/**
 * Executes code in Docker container
 * @param {string} code - The code to execute
 * @param {string} language - Programming language
 * @param {object} options - { timeout, userId }
 * @returns {Promise<object>}
 */
async function executeInDocker(code, language, options = {}) {
  const { timeout = TIMEOUT_MS } = options;
  const sessionId = uuidv4();
  const fileExt = getFileExtension(language);
  const fileName = `script_${sessionId}.${fileExt}`;
  const filePath = path.join(TEMP_DIR, fileName);

  try {
    // Write code to temporary file
    fs.writeFileSync(filePath, code, 'utf8');

    const startTime = Date.now();
    
    // Determine command based on language
    const runCmd = getRunCommand(language, fileName);
    
    // DOCKER RUN COMMAND:
    // --rm: Remove container after run
    // --network none: Disable network for security
    // --memory 128m: Limit RAM
    // --cpus 0.5: Limit CPU
    // -v: Mount temp file into container
    const dockerCmd = `docker run --rm --network none --memory 128m --cpus 0.5 -v "${filePath}:/app/${fileName}:ro" ${IMAGE_NAME} /bin/sh -c "${runCmd}"`;

    const result = await runDockerCommand(dockerCmd, timeout);
    const executionTime = Date.now() - startTime;

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTime,
      safe: true,
    };
  } catch (err) {
    return {
      stdout: '',
      stderr: err.message,
      exitCode: 1,
      executionTime: 0,
      safe: false,
    };
  } finally {
    // Clean up temporary file
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {}
  }
}

function getFileExtension(lang) {
  return { python: 'py', javascript: 'js', bash: 'sh', cpp: 'cpp' }[lang] || 'txt';
}

function getRunCommand(lang, file) {
  switch (lang) {
    case 'python':     return `python3 /app/${file}`;
    case 'javascript': return `node /app/${file}`;
    case 'bash':       return `bash /app/${file}`;
    case 'cpp':        return `g++ /app/${file} -o /app/out && /app/out`;
    default:           return `echo "Unsupported language"`;
  }
}

async function runDockerCommand(cmd, timeout) {
  return new Promise((resolve) => {
    exec(cmd, { timeout, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error && error.killed) {
        resolve({ stdout: '', stderr: 'Execution timed out', exitCode: 124 });
      } else {
        resolve({
          stdout: stdout || '',
          stderr: stderr || (error ? error.message : ''),
          exitCode: error ? (error.code || 1) : 0
        });
      }
    });
  });
}

module.exports = { executeInDocker };
