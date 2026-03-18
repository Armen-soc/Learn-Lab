import { useState, useEffect } from 'react'
import { useAppContext } from '../context'
import { api } from '../api'
import I18N from '../i18n'

export default function AccountPage() {
  const { user, courses, progress } = useAppContext()
  const [graphProgress, setGraphProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lang, setLang] = useState(() => localStorage.getItem('ll_lang') || 'en')

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLang(e.detail.lang)
    }
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  useEffect(() => {
    const loadGraphProgress = async () => {
      try {
        const data = await api('GET', '/progress/graph-problems')
        setGraphProgress(data)
      } catch (err) {
        console.error('Failed to load graph progress:', err)
        // Set default empty structure to prevent errors
        setGraphProgress({
          solvedByDifficulty: { easy: 0, medium: 0, hard: 0 },
          solvedProblems: [],
          totalSolved: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    loadGraphProgress()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Calculate course progress
  let totalCompleted = 0
  let totalModules = 0

  if (courses && Array.isArray(courses)) {
    courses.forEach((course) => {
      const completed = (progress?.[course.id] || new Set()).size
      const total = course.modules ? course.modules.length : 0
      totalCompleted += completed
      totalModules += total
    })
  }

  const totalPercentage = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-l-4 border-l-green-600' }
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-l-4 border-l-yellow-600' }
      case 'hard':
        return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-l-4 border-l-red-600' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-l-4 border-l-gray-600' }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{I18N.t('acc_settings')}</h1>
        <p className="text-gray-500 mt-1">{I18N.t('acc_subtitle')}</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{I18N.t('acc_profile')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">{I18N.t('acc_name')}</p>
            <p className="text-lg font-medium text-gray-900">{user?.name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{I18N.t('acc_email')}</p>
            <p className="text-lg font-medium text-gray-900">{user?.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">{I18N.t('acc_joined')}</p>
            <p className="text-lg font-medium text-gray-900">
              {formatDate(user?.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{I18N.t('acc_progress')}</h2>

        {/* Overall Course Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="font-medium text-gray-900">{I18N.t('acc_overall')}</p>
            <p className="font-bold text-lg text-gray-900">{totalPercentage}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${totalPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Course Progress */}
        {courses && courses.length > 0 && (
          <div className="space-y-3 mb-8">
            {courses.map((course) => {
              const completed = (progress?.[course.id] || new Set()).size
              const total = course.modules ? course.modules.length : 0
              const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <div key={course.id}>
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm text-gray-700">{course.title}</p>
                    <p className="text-xs text-gray-600">
                      {completed}/{total}
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Graph Problems Progress */}
        {!loading && graphProgress && (
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-bold text-gray-900 mb-4">{I18N.t('acc_problems')}</h3>

            {/* Difficulty Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { key: 'easy', label: I18N.t('acc_easy'), color: 'bg-green-50 text-green-700' },
                { key: 'medium', label: I18N.t('acc_medium'), color: 'bg-yellow-50 text-yellow-700' },
                { key: 'hard', label: I18N.t('acc_hard'), color: 'bg-red-50 text-red-700' },
              ].map((diff) => (
                <div key={diff.key} className={`${diff.color} rounded-lg p-4 text-center`}>
                  <p className="text-sm font-medium opacity-75 mb-1">{diff.label}</p>
                  <p className="text-3xl font-bold">
                    {graphProgress?.solvedByDifficulty?.[diff.key] || 0}
                  </p>
                </div>
              ))}
            </div>

            {/* Overall Problems Counter */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">{I18N.t('acc_total_problems')}</p>
              <p className="text-3xl font-bold text-gray-900">{graphProgress?.totalSolved || 0}</p>
            </div>

            {/* Solved Problems List */}
            {graphProgress?.solvedProblems && graphProgress.solvedProblems.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4">{I18N.t('acc_solved')}</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {graphProgress.solvedProblems.map((problem) => {
                    const colors = getDifficultyColor(problem.difficulty)
                    const solvedDate = new Date(problem.submitted_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })

                    return (
                      <div
                        key={problem.problem_id}
                        className={`${colors.bg} ${colors.border} p-4 rounded-lg flex justify-between items-center`}
                      >
                        <div className="flex-1">
                          <p className={`font-medium ${colors.text} mb-1`}>{problem.problem_title}</p>
                          <p className="text-xs text-gray-600">
                            ✓ {I18N.t('common_success')} ({problem.tests_passed}/{problem.total_tests})
                          </p>
                        </div>
                        <div className="flex gap-2 items-center">
                          <span className={`px-3 py-1 rounded text-xs font-medium ${colors.text}`}>
                            {problem.difficulty}
                          </span>
                          <span className="text-xs text-gray-600">{solvedDate}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 mt-2">{I18N.t('common_loading')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
