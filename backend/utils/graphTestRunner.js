'use strict';
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const GRAPH_PROBLEMS_PATH = path.join(__dirname, '../data/graph-problems.json');

/**
 * Load all graph problems
 */
function loadGraphProblems() {
  try {
    const data = fs.readFileSync(GRAPH_PROBLEMS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[GRAPH] Failed to load problems:', err.message);
    return { problems: [] };
  }
}

/**
 * Get problem by ID
 */
function getProblem(problemId) {
  const { problems } = loadGraphProblems();
  return problems.find(p => p.id === problemId);
}

/**
 * Get all problems
 */
function getAllProblems() {
  const { problems } = loadGraphProblems();
  return problems.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    difficulty: p.difficulty,
    timeLimit: p.timeLimit,
    memoryLimit: p.memoryLimit,
    testCaseCount: p.testCases.length
  }));
}

/**
 * Run user code against all test cases
 */
async function runTestCases(userCode, problemId, language, timeout = 5000) {
  const problem = getProblem(problemId);
  
  if (!problem) {
    return {
      success: false,
      error: `Problem ${problemId} not found`,
      testsPassed: 0,
      testsFailed: 0,
      results: []
    };
  }

  const results = [];
  let testsPassed = 0;
  let testsFailed = 0;

  for (const testCase of problem.testCases) {
    try {
      const result = await runSingleTest(
        userCode,
        language,
        testCase,
        timeout
      );

      results.push({
        testId: testCase.id,
        description: testCase.description,
        status: result.status,
        message: result.message,
        expected: testCase.output,
        actual: result.output,
        executionTime: result.executionTime,
        error: result.error
      });

      if (result.status === 'passed') {
        testsPassed++;
      } else {
        testsFailed++;
      }
    } catch (err) {
      results.push({
        testId: testCase.id,
        description: testCase.description,
        status: 'error',
        message: 'Test execution failed',
        expected: testCase.output,
        actual: null,
        executionTime: 0,
        error: err.message
      });
      testsFailed++;
    }
  }

  return {
    success: testsFailed === 0,
    problemId,
    problemTitle: problem.title,
    testsPassed,
    testsFailed,
    totalTests: problem.testCases.length,
    passPercentage: Math.round((testsPassed / problem.testCases.length) * 100),
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
    results
  };
}

const { executeInDocker } = require('./dockerExecutor');

/**
 * Run single test case
 */
async function runSingleTest(userCode, language, testCase, timeout) {
  try {
    const startTime = Date.now();
    const testInput = JSON.stringify(testCase.input);
    
    // Create wrapper code that passes test input to user function
    const wrappedCode = createWrappedCode(userCode, language, testInput);
    
    // Execute wrapped code in Docker
    const result = await executeInDocker(wrappedCode, language, { timeout });
    const executionTime = Date.now() - startTime;

    if (result.exitCode !== 0) {
      return {
        status: 'error',
        message: 'Code execution failed',
        output: null,
        executionTime,
        error: result.stderr
      };
    }

    // Parse output
    const stdout = result.stdout.trim();
    if (!stdout) {
      return {
        status: 'error',
        message: 'No output from code',
        output: null,
        executionTime,
        error: result.stderr || 'Code produced no output'
      };
    }

    try {
      const output = JSON.parse(stdout);
      
      // Check if output is an error object from Python
      if (output && output.error) {
        return {
          status: 'error',
          message: 'Code execution error',
          output: null,
          executionTime,
          error: output.error
        };
      }
      
      const expected = testCase.output;
      const passed = compareOutputs(output, expected);
      
      return {
        status: passed ? 'passed' : 'failed',
        message: passed ? 'Test passed' : 'Output mismatch',
        output,
        executionTime,
        error: null
      };
    } catch (parseErr) {
      return {
        status: 'error',
        message: 'Failed to parse output',
        output: null,
        executionTime,
        error: `Parse error: ${parseErr.message}. Output was: ${stdout.substring(0, 200)}`
      };
    }
  } catch (err) {
    return {
      status: 'error',
      message: 'Test execution error',
      output: null,
      executionTime: 0,
      error: err.message
    };
  }
}

/**
 * Create wrapped code that runs user function with test input
 */
function createWrappedCode(userCode, language, testInput) {
  const input = JSON.parse(testInput);

  if (language === 'python') {
    return `import json
import sys
${userCode}

# Test execution
try:
    input_data = ${JSON.stringify(input)}
    
    # Call the appropriate function based on input keys
    result = None
    if 'startNode' in input_data:  # BFS
        result = bfs(input_data['nodes'], input_data['edges'], input_data['startNode'])
    elif 'source' in input_data and 'edges' in input_data and len(input_data['edges'][0]) == 3:  # Dijkstra
        result = dijkstra(input_data['nodes'], input_data['edges'], input_data['source'])
    elif 'edges' in input_data and 'startNode' not in input_data:  # Detect cycle
        result = hasCycle(input_data['nodes'], input_data['edges'])
    else:  # Default BFS
        result = bfs(input_data['nodes'], input_data['edges'], input_data.get('startNode', 0))
    
    if result is not None:
        print(json.dumps(result))
    else:
        print(json.dumps([]))
except Exception as e:
    print(json.dumps({"error": str(e)}), file=sys.stderr)
    sys.exit(1)
`;
  }

  if (language === 'javascript') {
    return `${userCode}

// Test execution
try {
  const inputData = ${JSON.stringify(input)};
  
  let result;
  if (inputData.startNode !== undefined && inputData.startNode !== null) {
    result = bfs(inputData.nodes, inputData.edges, inputData.startNode);
  } else if (inputData.source !== undefined && inputData.edges && inputData.edges[0] && inputData.edges[0].length === 3) {
    result = dijkstra(inputData.nodes, inputData.edges, inputData.source);
  } else if (inputData.startNode === undefined) {
    if (inputData.edges && inputData.edges.length > 0) {
      result = hasCycle(inputData.nodes, inputData.edges);
    } else {
      result = connectedComponents(inputData.nodes, inputData.edges) || topologicalSort(inputData.nodes, inputData.edges);
    }
  }
  
  console.log(JSON.stringify(result || []));
} catch (err) {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
}
`;
  }

  if (language === 'cpp') {
    // For C++, we provide a simpler wrapper that expects the user to have specific function signatures.
    // Note: This requires the user code to not have a main function.
    return `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <map>

using namespace std;

${userCode}

int main() {
    // This is a simplified C++ test harness. 
    // In a production environment, we would use a JSON library like nlohmann/json.
    // For now, we manually handle the specific test cases.
    
    // Test execution for BFS (graph_001)
    if ("${input.startNode ? 'yes' : 'no'}" == "yes") {
        vector<vector<int>> edges = {${input.edges ? input.edges.map(e => '{' + e.join(',') + '}').join(',') : ''}};
        vector<int> result = bfs(${input.nodes}, edges, ${input.startNode || 0});
        cout << "[";
        for(size_t i=0; i<result.size(); ++i) {
            cout << result[i] << (i == result.size()-1 ? "" : ",");
        }
        cout << "]" << endl;
    }
    return 0;
}
`;
  }

  return userCode;
}

/**
 * Compare outputs (handle arrays, objects, primitives)
 */
function compareOutputs(actual, expected) {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) return false;
    return expected.every((val, idx) => {
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val) === JSON.stringify(actual[idx]);
      }
      return val === actual[idx];
    });
  }

  if (typeof expected === 'object' && expected !== null) {
    return JSON.stringify(actual) === JSON.stringify(expected);
  }

  return actual === expected;
}

/**
 * Get file extension
 */
function getExtension(language) {
  const exts = { python: 'py', javascript: 'js', cpp: 'cpp' };
  return exts[language] || 'txt';
}

module.exports = {
  loadGraphProblems,
  getProblem,
  getAllProblems,
  runTestCases,
  runSingleTest
};
