import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAppContext } from '../context'
import I18N from '../i18n'

export default function LearnPage() {
  const navigate = useNavigate()
  const { courses, progress } = useAppContext()
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('ll_lang') || 'en')

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLang(e.detail.lang)
    }
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  if (!courses || courses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{I18N.t('common_loading')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4">
          <h3 className="font-bold text-gray-900 mb-4">{I18N.t('side_courses')}</h3>
          
          <div className="space-y-2 mb-6">
            {courses.map((course) => (
              <div key={course.id}>
                <button
                  onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-700 transition"
                >
                  <span>
                    {expandedCourse === course.id ? '▾' : '▸'} {course.title}
                  </span>
                </button>

                {expandedCourse === course.id && course.modules && (
                  <div className="ml-2 space-y-1 mt-2">
                    {course.modules.map((mod) => {
                      const isDone = (progress?.[course.id] || new Set()).has(mod.id)
                      return (
                        <div
                          key={mod.id}
                          className={`px-3 py-1 rounded text-sm text-gray-600 cursor-default ${isDone ? 'font-medium' : ''}`}
                        >
                          {isDone ? '✓' : '○'} {mod.title}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Graph Algorithms Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-bold text-gray-900 mb-4">{I18N.t('side_graphs')}</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/learn/problems/all')}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition"
            >
              All Levels
            </button>
            <button
              onClick={() => navigate('/learn/problems/easy')}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition"
            >
              {I18N.t('acc_easy')}
            </button>
            <button
              onClick={() => navigate('/learn/problems/medium')}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
            >
              {I18N.t('acc_medium')}
            </button>
            <button
              onClick={() => navigate('/learn/problems/hard')}
              className="w-full px-3 py-2 rounded text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition"
            >
              {I18N.t('acc_hard')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="mb-4 text-5xl">📚</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{I18N.t('welcome_title')}</h1>
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">{I18N.t('welcome_subtitle')}</p>
          <p className="text-gray-500 text-base">{I18N.t('welcome_select')}</p>
          
          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-4">Or start with graph algorithm challenges:</p>
            <button
              onClick={() => navigate('/learn/problems/all')}
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              {I18N.t('graph_title')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
