const API_URL = 'http://localhost:4000/api'

export const api = async (method, path, body = null) => {
  const token = localStorage.getItem('ll_token')
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`
  }

  if (body) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(API_URL + path, options)
  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    // Only redirect to home if we have a token (session expired)
    // If no token, it's likely a login attempt with invalid credentials
    if (token) {
      localStorage.removeItem('ll_token')
      localStorage.removeItem('ll_user')
      window.location.href = '/'
      throw new Error('Session expired')
    }
  }

  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }

  return data
}

export const login = async (email, password) => {
  const data = await api('POST', '/auth/login', { email, password })
  localStorage.setItem('ll_token', data.token)
  localStorage.setItem('ll_user', JSON.stringify(data.user))
  return data
}

export const register = async (name, email, password) => {
  const data = await api('POST', '/auth/register', { name, email, password })
  localStorage.setItem('ll_token', data.token)
  localStorage.setItem('ll_user', JSON.stringify(data.user))
  return data
}

export const logout = () => {
  localStorage.removeItem('ll_token')
  localStorage.removeItem('ll_user')
  window.location.href = '/'
}

export const getCourses = () => api('GET', '/courses')
export const getProgress = () => api('GET', '/progress')
export const getGraphProblems = () => api('GET', '/progress/graph-problems')
export const submitGraphProblem = (courseId, moduleId, problemId, code, language) =>
  api('POST', '/graph/submit', { courseId, moduleId, problemId, code, language })
