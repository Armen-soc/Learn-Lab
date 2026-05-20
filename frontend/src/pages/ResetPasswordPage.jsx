import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { resetPassword } from '../api'
import I18N from '../i18n'
import Toast from '../components/Toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const token = searchParams.get('token')

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            The password reset link is missing or invalid. Please request a new one.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    const password = e.target.password?.value
    const confirmPassword = e.target.confirmPassword?.value

    if (!password || !confirmPassword) {
      setToast({ type: 'error', message: 'Please fill all fields' })
      return
    }

    if (password !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match' })
      return
    }

    if (password.length < 6) {
      setToast({ type: 'error', message: 'Password must be at least 6 characters' })
      return
    }

    setLoading(true)
    try {
      await resetPassword(token, password)
      setToast({ type: 'success', message: 'Password reset successfully! Redirecting to login...' })
      setTimeout(() => {
        navigate('/')
      }, 2000)
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
            <div className="text-4xl">🔐</div>
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900">Reset Password</h2>
          <p className="text-center text-gray-600 text-sm mt-2">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
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
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 bg-gray-200 text-gray-700 py-2 rounded-md font-medium hover:bg-gray-300 transition"
          >
            Back to Login
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
