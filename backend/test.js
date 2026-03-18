/**
 * Test file for code execution functionality
 * Run with: node test.js
 */

const { validateCode, checkSyntax } = require('./utils/codeValidator');
const { executeInDocker } = require('./utils/dockerExecutor');

console.log('\n========== CODE EXECUTION SYSTEM TESTS ==========\n');

// Test 1: Code Validation
console.log('TEST 1: Code Validation');
console.log('------------------------');

const maliciousCode = `
import os
os.system('rm -rf /')
`;

const safeCode = `
def hello():
    print("Hello, World!")

hello()
`;

const validation1 = validateCode(maliciousCode, 'python');
console.log('Malicious code validation:', validation1);
console.log('Issues found:', validation1.issues.length > 0 ? validation1.issues : 'None');

const validation2 = validateCode(safeCode, 'python');
console.log('\nSafe code validation:', validation2);
console.log('Issues found:', validation2.issues.length > 0 ? validation2.issues : 'None');

// Test 2: Syntax Checking
console.log('\n\nTEST 2: Syntax Checking');
console.log('------------------------');

const validJs = `
function add(a, b) {
  return a + b;
}
console.log(add(5, 3));
`;

const invalidJs = `
function broken(
  return 123;
`;

const syntaxCheck1 = checkSyntax(validJs, 'javascript');
console.log('Valid JavaScript:', syntaxCheck1);

const syntaxCheck2 = checkSyntax(invalidJs, 'javascript');
console.log('Invalid JavaScript:', syntaxCheck2);

// Test 3: Code Execution
console.log('\n\nTEST 3: Code Execution');
console.log('------------------------');

(async () => {
  // Python
  const pythonCode = `
x = 5
y = 10
print(f"Sum: {x + y}")
`;

  console.log('Executing Python code...');
  const pyResult = await executeInDocker(pythonCode, 'python', { userId: 'test-user' });
  console.log('Result:', pyResult);

  // JavaScript
  const jsCode = `
const arr = [1, 2, 3, 4, 5];
const sum = arr.reduce((a, b) => a + b, 0);
console.log('Array sum:', sum);
`;

  console.log('\nExecuting JavaScript code...');
  const jsResult = await executeInDocker(jsCode, 'javascript', { userId: 'test-user' });
  console.log('Result:', jsResult);

  // Bash
  const bashCode = `
echo "Current working directory:"
pwd
echo "Files in current directory:"
ls -la
`;

  console.log('\nExecuting Bash code...');
  const bashResult = await executeInDocker(bashCode, 'bash', { userId: 'test-user' });
  console.log('Result:', bashResult);

  // C++
  const cppCode = `
#include <iostream>
using namespace std;

int main() {
    int sum = 0;
    for(int i = 1; i <= 10; i++) {
        sum += i;
    }
    cout << "Sum 1-10: " << sum << endl;
    return 0;
}
`;

  console.log('\nExecuting C++ code...');
  const cppResult = await executeInDocker(cppCode, 'cpp', { userId: 'test-user' });
  console.log('Result:', cppResult);

  console.log('\n========== TESTS COMPLETE ==========\n');
  process.exit(0);
})();
