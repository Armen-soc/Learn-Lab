import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router'
import { AppProvider, useAppContext } from './context'
import { api } from './api'
import I18N from './i18n'
import AuthPage from './pages/AuthPage'
import LearnPage from './pages/LearnPage'
import AccountPage from './pages/AccountPage'
import GraphProblemsPage from './pages/GraphProblemsPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import Navigation from './components/Navigation'
import Toast from './components/Toast'

function AppContent() {
  const navigate = useNavigate()
  const { user, setUser, setToken, setCourses, setProgress } = useAppContext()
  const [toast, setToast] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('ll_lang') || 'en')

  // Handle language changes
  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLang(e.detail.lang)
    }
    
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  // Check session on mount and when language changes
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('ll_token')
      const storedUser = localStorage.getItem('ll_user')
      
      if (token && storedUser) {
        try {
          // Re-fetch me to ensure session is still valid, though we could skip this for speed on lang change
          // const me = await api('GET', '/auth/me')
          // setUser(me)
          // setToken(token)
          
          const [courses, progress] = await Promise.all([
            api('GET', '/courses'),
            api('GET', '/progress'),
          ])
          
          setCourses(courses)
          
          const progressMap = {}
          for (const row of progress) {
            if (row.completed) {
              if (!progressMap[row.course_id]) {
                progressMap[row.course_id] = new Set()
              }
              progressMap[row.course_id].add(row.module_id)
            }
          }
          setProgress(progressMap)
        } catch (err) {
          console.error('Session check failed:', err)
          // Don't logout on re-fetch error if it's just a network issue, 
          // but if it's 401 api() already handles logout
        }
      }
    }
    
    checkSession()
  }, [lang])

  if (!user) {
    return (
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="*" element={<AuthPage />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navigation onLanguageChange={setLang} currentLang={lang} />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/learn/problems" element={<GraphProblemsPage />} />
          <Route path="/learn/problems/:difficulty" element={<GraphProblemsPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="*" element={<LearnPage />} />
        </Routes>
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </Router>
  )
}

export default App
