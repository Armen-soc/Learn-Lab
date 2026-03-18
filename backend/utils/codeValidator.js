'use strict';

const DANGEROUS_PATTERNS = [
  /rm\s+-rf/i,                    // rm -rf
  /sudo\s+/i,                     // sudo
  /chmod\s+777/i,                 // chmod 777
  /eval\(/i,                      // eval in JavaScript
  /exec\(/i,                      // exec in Python/JS
  /subprocess\.call/i,            // subprocess.call
  /os\.system/i,                  // os.system in Python
  /import\s+os\s*;/i,             // import os (Python malicious pattern)
  /import\s+subprocess/i,         // subprocess imports
  /__import__/i,                  // __import__ dynamic imports
  /open\(\s*['"]\/etc\//i,        // Reading system files
  /socket\./i,                    // Socket operations
  /http\.request/i,               // Making external requests
];

/**
 * Validates code for malicious patterns
 * @param {string} code - The code to validate
 * @param {string} language - The programming language
 * @returns {object} { safe: boolean, issues: string[] }
 */
function validateCode(code, language) {
  const issues = [];

  // Check for size
  if (code.length > 64 * 1024) {
    issues.push('Code exceeds maximum size of 64KB');
  }

  // Check for dangerous patterns
  DANGEROUS_PATTERNS.forEach((pattern) => {
    if (pattern.test(code)) {
      issues.push(`Detected potentially dangerous pattern: ${pattern.source}`);
    }
  });

  // Language-specific validations
  if (language === 'python') {
    if (/import\s+socket/i.test(code)) {
      issues.push('Socket imports are not allowed');
    }
    if (/import\s+requests/i.test(code)) {
      issues.push('Network requests are not allowed');
    }
  }

  if (language === 'javascript') {
    if (/require\s*\(\s*['"]fs['"]\s*\)/i.test(code)) {
      issues.push('File system access is not allowed');
    }
    if (/require\s*\(\s*['"]net['"]\s*\)/i.test(code)) {
      issues.push('Network operations are not allowed');
    }
    if (/require\s*\(\s*['"]http['"]\s*\)/i.test(code)) {
      issues.push('HTTP requests are not allowed');
    }
  }

  if (language === 'bash') {
    if (/\$\{.*(rm|dd|mkfs).*/i.test(code)) {
      issues.push('Destructive shell operations are not allowed');
    }
  }

  if (language === 'cpp') {
    const dangerousCpp = [
      /#include\s+<fstream>/i,
      /system\s*\(/i,
      /fork\s*\(/i,
      /execl|execv|execp/i,
      /remove\s*\(/i,
      /rename\s*\(/i
    ];
    dangerousCpp.forEach(p => {
      if (p.test(code)) issues.push(`Detected potentially dangerous C++ pattern: ${p.source}`);
    });
  }

  return {
    safe: issues.length === 0,
    issues,
  };
}

/**
 * Checks code syntax without full execution
 */
function checkSyntax(code, language) {
  try {
    if (language === 'javascript') {
      new Function(code);
      return { valid: true, error: null };
    }

    const fs = require('fs');
    const path = require('path');
    const { execSync } = require('child_process');
    const tempDir = path.join(__dirname, '../../temp');

    if (language === 'python') {
      const tempFile = path.join(tempDir, 'syntax_check_' + Date.now() + '.py');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(tempFile, code);
      try {
        execSync(`python3 -m py_compile "${tempFile}"`, { encoding: 'utf8', stdio: 'pipe' });
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        return { valid: true, error: null };
      } catch (err) {
        const errMsg = err.stderr ? err.stderr.toString() : err.message;
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        return { valid: false, error: errMsg };
      }
    }

    if (language === 'cpp') {
      const tempFile = path.join(tempDir, 'syntax_check_' + Date.now() + '.cpp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      fs.writeFileSync(tempFile, code);
      try {
        // Compile-only flag (-fsyntax-only) is fastest for syntax checking
        execSync(`g++ -fsyntax-only "${tempFile}"`, { encoding: 'utf8', stdio: 'pipe' });
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        return { valid: true, error: null };
      } catch (err) {
        const errMsg = err.stderr ? err.stderr.toString() : err.message;
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        return { valid: false, error: errMsg };
      }
    }

    return { valid: true, error: null };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = { validateCode, checkSyntax };
