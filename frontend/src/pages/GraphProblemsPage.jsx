import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api } from '../api'
import I18N from '../i18n'

export default function GraphProblemsPage() {
  const navigate = useNavigate()
  const { difficulty = 'all' } = useParams()
  const [problems, setProblems] = useState([])
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentDifficulty, setCurrentDifficulty] = useState(difficulty)

  useEffect(() => {
    loadProblems()
  }, [currentDifficulty])

  const loadProblems = async () => {
    setLoading(true)
    try {
      const response = await api('GET', '/graph/problems')
      let allProblems = response.problems || response.data || (Array.isArray(response) ? response : [])
      
      if (currentDifficulty !== 'all') {
        allProblems = allProblems.filter(p => p.difficulty === currentDifficulty)
      }
      
      setProblems(allProblems)
      setError(null)
    } catch (err) {
      console.error('Failed to load problems:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDifficultyChange = (diff) => {
    setCurrentDifficulty(diff)
    setSelectedProblem(null)
    navigate(`/learn/problems/${diff}`)
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' }
      case 'medium':
        return { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' }
      case 'hard':
        return { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
      default:
        return { bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-800' }
    }
  }

  if (selectedProblem) {
    return <ProblemDetail problem={selectedProblem} onBack={() => setSelectedProblem(null)} />
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
          <h3 className="font-bold text-gray-900 mb-4">{I18N.t('side_graphs')}</h3>
          <div className="space-y-2">
            {['all', 'easy', 'medium', 'hard'].map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`w-full px-3 py-2 rounded text-sm font-medium transition ${
                  currentDifficulty === level
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {level === 'all' && 'All Levels'}
                {level === 'easy' && I18N.t('acc_easy')}
                {level === 'medium' && I18N.t('acc_medium')}
                {level === 'hard' && I18N.t('acc_hard')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{I18N.t('graph_title')}</h1>
          <p className="text-gray-600">{I18N.t('graph_subtitle')}</p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
            <p className="text-gray-500 ml-2">{I18N.t('common_loading')}</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        {!loading && problems.length === 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500">{I18N.t('common_loading')}</p>
          </div>
        )}

        {!loading && problems.length > 0 && (
          <div className="space-y-3">
            {problems.map((problem) => {
              const colors = getDifficultyColor(problem.difficulty)
              return (
                <button
                  key={problem.id}
                  onClick={() => setSelectedProblem(problem)}
                  className={`w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 transition ${colors.bg}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{problem.title}</h3>
                    <span className={`px-3 py-1 rounded text-xs font-bold capitalize ${colors.badge}`}>
                      {problem.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{problem.description}</p>
                  <div className="flex gap-3 text-xs text-gray-600">
                    <span>⏱️ {problem.timeLimit}ms</span>
                    <span>💾 {problem.memoryLimit}MB</span>
                    <span>🧪 {problem.testCaseCount || 5} tests</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ProblemDetail({ problem, onBack }) {
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [showTemplate, setShowTemplate] = useState(false)

  const getTemplate = () => {
    if (language === 'python') {
      if (problem.id === 'graph_001') {
        return `from collections import deque

def bfs(nodes, edges, startNode):
    graph = [[] for _ in range(nodes)]
    for u, v in edges:
        graph[u].append(v)
        graph[v].append(u)
    
    visited = [False] * nodes
    queue = deque([startNode])
    visited[startNode] = True
    result = []
    
    while queue:
        node = queue.popleft()
        result.append(node)
        for neighbor in graph[node]:
            if not visited[neighbor]:
                visited[neighbor] = True
                queue.append(neighbor)
    
    return result`;
      } else if (problem.id === 'graph_002') {
        return `def dijkstra(nodes, edges, source):
    graph = [[] for _ in range(nodes)]
    for u, v, weight in edges:
        graph[u].append((v, weight))
        graph[v].append((u, weight))
    
    dist = [float('inf')] * nodes
    dist[source] = 0
    visited = [False] * nodes
    
    for _ in range(nodes):
        minDist = float('inf')
        minNode = -1
        for j in range(nodes):
            if not visited[j] and dist[j] < minDist:
                minDist = dist[j]
                minNode = j
        if minNode == -1:
            break
        visited[minNode] = True
        for neighbor, weight in graph[minNode]:
            if not visited[neighbor] and dist[minNode] + weight < dist[neighbor]:
                dist[neighbor] = dist[minNode] + weight
    
    return dist`;
      }
    } else {
      if (problem.id === 'graph_001') {
        return `function bfs(nodes, edges, startNode) {
  const graph = Array.from({ length: nodes }, () => []);
  
  for (const [u, v] of edges) {
    graph[u].push(v);
    graph[v].push(u);
  }
  
  const visited = new Array(nodes).fill(false);
  const queue = [startNode];
  visited[startNode] = true;
  const result = [];
  
  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);
    for (const neighbor of graph[node]) {
      if (!visited[neighbor]) {
        visited[neighbor] = true;
        queue.push(neighbor);
      }
    }
  }
  
  return result;
}`;
      } else if (problem.id === 'graph_002') {
        return `function dijkstra(nodes, edges, source) {
  const graph = Array.from({ length: nodes }, () => []);
  
  for (const [u, v, weight] of edges) {
    graph[u].push([v, weight]);
    graph[v].push([u, weight]);
  }
  
  const dist = new Array(nodes).fill(Infinity);
  dist[source] = 0;
  const visited = new Array(nodes).fill(false);
  
  for (let i = 0; i < nodes; i++) {
    let minDist = Infinity;
    let minNode = -1;
    
    for (let j = 0; j < nodes; j++) {
      if (!visited[j] && dist[j] < minDist) {
        minDist = dist[j];
        minNode = j;
      }
    }
    
    if (minNode === -1) break;
    visited[minNode] = true;
    
    for (const [neighbor, weight] of graph[minNode]) {
      if (!visited[neighbor] && dist[minNode] + weight < dist[neighbor]) {
        dist[neighbor] = dist[minNode] + weight;
      }
    }
  }
  
  return dist;
}`;
      }
    }
    return '// Write your solution here';
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert(I18N.t('common_enter_code'))
      return
    }

    setSubmitting(true)
    try {
      const response = await api('POST', '/graph/submit', {
        code,
        language,
        problemId: problem.id,
        courseId: 'graph',
        moduleId: problem.id,
      })
      setResult(response)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-700 font-medium mb-4"
      >
        ← {I18N.t('graph_back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problem Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{problem.title}</h2>
          <p className="text-gray-600 mb-4">{problem.description}</p>
          
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">Constraints:</h3>
              <ul className="text-gray-600 text-sm space-y-1">
                <li>⏱️ Time Limit: {problem.timeLimit}ms</li>
                <li>💾 Memory Limit: {problem.memoryLimit}MB</li>
              </ul>
            </div>

            {problem.testCases && problem.testCases.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Example Test Cases:</h3>
                <div className="space-y-2">
                  {problem.testCases.slice(0, 2).map((tc, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                      <p className="font-mono text-gray-700">Input: {JSON.stringify(tc.input)}</p>
                      <p className="font-mono text-gray-700">Output: {JSON.stringify(tc.output)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
          <div className="mb-4 flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Language:</label>
            <button
              onClick={() => setShowTemplate(!showTemplate)}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {showTemplate ? 'Hide' : 'Show'} Template
            </button>
          </div>

          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 mb-4"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
          </select>

          {showTemplate && (
            <div className="mb-4 bg-gray-50 border border-gray-300 rounded p-3 text-sm text-gray-700 font-mono max-h-60 overflow-y-auto">
              <p className="font-bold mb-2">📋 Solution Template:</p>
              <pre className="whitespace-pre-wrap text-xs">{getTemplate()}</pre>
              <p className="text-xs text-gray-600 mt-2">Copy this and modify it with your solution</p>
            </div>
          )}

          <div className="mb-4 flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Code:</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Write your solution here or click 'Show Template' for an example..."
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setCode(getTemplate())}
              className="flex-1 bg-gray-600 text-white py-2 rounded-md font-medium hover:bg-gray-700 transition"
            >
              📋 Paste Template
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {submitting ? '⏳ Running...' : '▶️ Run Tests'}
            </button>
          </div>

          {result && (
            <div className={`mt-4 p-4 rounded-md border-2 ${
              result.allTestsPassed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`font-bold text-lg mb-2 ${
                result.allTestsPassed 
                  ? 'text-green-700' 
                  : 'text-red-700'
              }`}>
                {result.allTestsPassed ? '✅ All Tests Passed!' : `❌ ${result.testsFailed} Test(s) Failed`}
              </p>
              <p className="text-sm mb-3">
                {result.testsPassed}/{result.totalTests} tests passed ({result.passPercentage}%)
              </p>
              
              {!result.allTestsPassed && result.testDetails && result.testDetails.length > 0 && (
                <div className="space-y-2 text-sm">
                  <p className="font-semibold text-gray-800">📋 Test Results:</p>
                  {result.testDetails.map((test, idx) => (
                    <div key={idx} className={`bg-white p-2 rounded border text-xs ${
                      test.status === 'passed' ? 'border-green-200' : 'border-red-200'
                    }`}>
                      <p className={`font-semibold ${test.status === 'passed' ? 'text-green-700' : 'text-red-700'}`}>
                        Test {test.testId}: {test.description}
                      </p>
                      <p className="text-gray-700 mt-1">Status: <span className={test.status === 'passed' ? 'text-green-600' : 'text-red-600'}>{test.status.toUpperCase()}</span></p>
                      {test.status === 'failed' && (
                        <div className="mt-2 bg-gray-50 p-1 rounded font-mono text-xs text-gray-700">
                          <p>Expected: <code>{JSON.stringify(test.expected)}</code></p>
                          <p>Got: <code>{JSON.stringify(test.actual)}</code></p>
                        </div>
                      )}
                      {test.error && (
                        <p className="mt-1 text-red-600">⚠️ Error: {test.error}</p>
                      )}
                      {test.executionTime && (
                        <p className="mt-1 text-gray-600">⏱️ Execution time: {test.executionTime}ms</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
