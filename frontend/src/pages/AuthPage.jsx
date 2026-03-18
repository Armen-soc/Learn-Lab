import { useState } from 'react'
import { useNavigate } from 'react-router'
import { login, register } from '../api'
import { useAppContext } from '../context'
import I18N from '../i18n'
import Toast from '../components/Toast'

export default function AuthPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const { setUser, setToken } = useAppContext()

  const handleLogin = async (e) => {
    e.preventDefault()
    const email = e.target.email?.value
    const password = e.target.password?.value

    if (!email || !password) {
      setToast({ type: 'error', message: 'Please fill all fields' })
      return
    }

    setLoading(true)
    try {
      const data = await login(email, password)
      setUser(data.user)
      setToken(data.token)
      navigate('/learn')
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    const name = e.target.name?.value
    const email = e.target.email?.value
    const password = e.target.password?.value

    if (!name || !email || !password) {
      setToast({ type: 'error', message: 'Please fill all fields' })
      return
    }

    setLoading(true)
    try {
      const data = await register(name, email, password)
      setUser(data.user)
      setToken(data.token)
      navigate('/learn')
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center mb-4">
            <div className="text-4xl">📚</div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900">LearnLab</h2>
          
          {/* Tabs */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 px-4 rounded font-medium transition ${
                tab === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {I18N.t('auth_signin')}
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 px-4 rounded font-medium transition ${
                tab === 'register'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {I18N.t('auth_create_account')}
            </button>
          </div>
        </div>

        {/* Forms */}
        <div className="p-6">
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {I18N.t('auth_email')}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {I18N.t('auth_password')}
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Signing in...' : I18N.t('auth_signin_btn')}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {I18N.t('auth_name')}
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {I18N.t('auth_email')}
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {I18N.t('auth_password')}
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {loading ? 'Creating account...' : I18N.t('auth_create_btn')}
              </button>
            </form>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

  

