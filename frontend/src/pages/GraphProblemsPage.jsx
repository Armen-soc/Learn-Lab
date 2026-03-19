import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { api } from '../api'
import I18N from '../i18n'
import CodeEditor from '../components/CodeEditor'
import { formatTime } from '../utils'

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

  const getTemplate = (lang = language) => {
    if (lang === 'python') {
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

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (!code || code === getTemplate(language) || code === '// Write your solution here') {
      setCode(getTemplate(newLang));
    }
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

  useEffect(() => {
    if (!code) setCode(getTemplate());
  }, []);

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
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Time Limit</p>
                <p className="text-lg font-bold text-gray-900">{problem.timeLimit}ms</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Memory Limit</p>
                <p className="text-lg font-bold text-gray-900">{problem.memoryLimit}MB</p>
              </div>
            </div>

            {problem.testCases && problem.testCases.length > 0 && (
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🧪</span> Example Test Cases
                </h3>
                <div className="space-y-3">
                  {problem.testCases.slice(0, 2).map((tc, idx) => (
                    <div key={idx} className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm">
                      <div className="mb-2">
                        <span className="font-bold text-gray-700">Input:</span>
                        <pre className="mt-1 font-mono text-blue-700 bg-white p-2 rounded border border-gray-100 overflow-x-auto">
                          {JSON.stringify(tc.input, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <span className="font-bold text-gray-700">Output:</span>
                        <pre className="mt-1 font-mono text-green-700 bg-white p-2 rounded border border-gray-100 overflow-x-auto">
                          {JSON.stringify(tc.output, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex flex-col space-y-4">
          <div className="h-[500px]">
            <CodeEditor 
              value={code} 
              onChange={setCode} 
              language={language} 
              onLanguageChange={handleLanguageChange} 
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 transition shadow-md flex items-center justify-center"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                {I18N.t('graph_running')}
              </>
            ) : (
              <>
                <span className="mr-2">▶</span> {I18N.t('graph_run_tests')}
              </>
            )}
          </button>

          {result && (
            <div className={`p-6 rounded-lg border-2 ${
              result.allTestsPassed 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            } shadow-sm animate-in fade-in slide-in-from-top-2 duration-300`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold text-xl ${
                  result.allTestsPassed 
                    ? 'text-green-700' 
                    : 'text-red-700'
                }`}>
                  {result.allTestsPassed ? '✅ All Tests Passed!' : `❌ ${result.testsFailed} Test(s) Failed`}
                </h3>
                <div className="text-sm font-bold bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  {result.testsPassed} / {result.totalTests} Passed
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden border border-gray-100">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${result.allTestsPassed ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${result.passPercentage}%` }}
                ></div>
              </div>
              
              {!result.allTestsPassed && result.testDetails && result.testDetails.length > 0 && (
                <div className="space-y-3">
                  <p className="font-bold text-gray-800 text-sm uppercase tracking-wider">Detailed Results:</p>
                  {result.testDetails.map((test, idx) => (
                    <div key={idx} className={`bg-white p-4 rounded-lg border shadow-sm transition-all ${
                      test.status === 'passed' ? 'border-green-100 bg-green-50/30' : 'border-red-100'
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <p className={`font-bold flex items-center ${test.status === 'passed' ? 'text-green-700' : 'text-red-700'}`}>
                          <span className="mr-2">{test.status === 'passed' ? '✓' : '✗'}</span>
                          Test {test.testId}: {test.description}
                        </p>
                        {test.executionTime && (
                          <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border">
                            {formatTime(test.executionTime)}
                          </span>
                        )}
                      </div>
                      
                      {test.status === 'failed' && (
                        <div className="mt-3 space-y-2">
                          {test.error && (
                            <div className="p-2 bg-red-50 text-red-600 rounded text-xs font-mono border border-red-100">
                              Error: {test.error}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Expected</p>
                              <pre className="font-mono text-xs text-gray-700 overflow-x-auto">
                                {JSON.stringify(test.expected)}
                              </pre>
                            </div>
                            <div className="bg-gray-50 p-2 rounded border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Actual</p>
                              <pre className="font-mono text-xs text-red-600 overflow-x-auto">
                                {JSON.stringify(test.actual)}
                              </pre>
                            </div>
                          </div>
                        </div>
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
