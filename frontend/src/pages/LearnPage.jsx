import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAppContext } from '../context'
import { api } from '../api'
import I18N from '../i18n'
import CodeEditor from '../components/CodeEditor'
import Toast from '../components/Toast'

export default function LearnPage() {
  const navigate = useNavigate()
  const { courses, progress, setProgress } = useAppContext()
  const [expandedCourse, setExpandedCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [courseData, setCourseData] = useState(null)
  const [moduleData, setModuleData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [lang, setLang] = useState(() => localStorage.getItem('ll_lang') || 'en')

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (e) => {
      setLang(e.detail.lang)
    }
    window.addEventListener('languageChange', handleLanguageChange)
    return () => window.removeEventListener('languageChange', handleLanguageChange)
  }, [])

  // Re-fetch content when language changes
  useEffect(() => {
    if (selectedModule) {
      handleModuleClick(selectedModule.courseId, selectedModule.moduleId)
    } else if (selectedCourse) {
      handleCourseClick(selectedCourse)
    }
  }, [lang])

  const handleCourseClick = async (courseId) => {
    setLoading(true)
    setSelectedCourse(courseId)
    setSelectedModule(null)
    setExpandedCourse(courseId)
    try {
      const data = await api('GET', `/courses/${courseId}`)
      setCourseData(data)
    } catch (err) {
      console.error('Failed to load course:', err)
      setToast({ type: 'error', message: 'Failed to load course details' })
    } finally {
      setLoading(false)
    }
  }

  const handleModuleClick = async (courseId, moduleId) => {
    setLoading(true)
    setSelectedModule({ courseId, moduleId })
    setSelectedCourse(courseId)
    try {
      const data = await api('GET', `/courses/${courseId}/modules/${moduleId}`)
      setModuleData(data)
      if (data.module.type === 'challenge') {
        setCode(data.module.challenge?.starterCode || '// Write your solution here')
        setLanguage(data.module.challenge?.language || 'javascript')
      }
    } catch (err) {
      console.error('Failed to load module:', err)
      setToast({ type: 'error', message: 'Failed to load module content' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitChallenge = async () => {
    if (!code.trim()) {
      setToast({ type: 'warning', message: I18N.t('common_enter_code') })
      return
    }

    setSubmitting(true)
    try {
      const result = await api('POST', '/execute', {
        code,
        language,
        moduleId: selectedModule.moduleId,
        courseId: selectedModule.courseId,
      })

      if (result.success) {
        setToast({ type: 'success', message: I18N.t('common_solution_accepted') })
        
        // Update progress
        const newProgress = { ...progress }
        if (!newProgress[selectedModule.courseId]) {
          newProgress[selectedModule.courseId] = new Set()
        }
        newProgress[selectedModule.courseId].add(selectedModule.moduleId)
        setProgress(newProgress)
      } else {
        setToast({ type: 'error', message: result.error || 'Solution incorrect' })
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

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
        <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 px-3 uppercase text-xs tracking-widest text-gray-500">
            {I18N.t('side_courses')}
          </h3>
          
          <div className="space-y-1 mb-6">
            {courses.map((course) => {
              const isSelected = selectedCourse === course.id
              const isExpanded = expandedCourse === course.id
              
              return (
                <div key={course.id} className="space-y-1">
                  <button
                    onClick={() => handleCourseClick(course.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center justify-between text-sm font-semibold transition-all duration-200 ${
                      isSelected 
                        ? 'text-blue-700 bg-blue-50 border-l-4 border-blue-600 pl-2' 
                        : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    <span className="flex items-center">
                      <span className="mr-2 opacity-50">{isExpanded ? '▾' : '▸'}</span>
                      {course.title}
                    </span>
                  </button>

                  {isExpanded && course.modules && (
                    <div className="ml-4 space-y-1 mt-1 border-l border-gray-100 pl-2 animate-in slide-in-from-top-1 duration-200">
                      {course.modules.map((mod) => {
                        const isDone = (progress?.[course.id] || new Set()).has(mod.id)
                        const isActive = selectedModule?.moduleId === mod.id
                        return (
                          <button
                            key={mod.id}
                            onClick={() => handleModuleClick(course.id, mod.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-xs transition-all duration-200 ${
                              isActive 
                                ? 'bg-blue-600 text-white font-bold shadow-sm' 
                                : isDone 
                                  ? 'text-green-700 font-medium hover:bg-green-50' 
                                  : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <span className="flex items-center">
                              <span className="mr-2 text-base leading-none">
                                {isDone ? '✓' : '○'}
                              </span>
                              {mod.title}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Graph Algorithms Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 px-3 uppercase text-xs tracking-widest text-gray-500">
            {I18N.t('side_graphs')}
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/learn/problems/all')}
              className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all shadow-sm border border-blue-100"
            >
              All Levels
            </button>
            <div className="grid grid-cols-1 gap-2">
              {[
                { key: 'easy', label: I18N.t('acc_easy'), color: 'bg-green-50 text-green-700 border-green-100' },
                { key: 'medium', label: I18N.t('acc_medium'), color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                { key: 'hard', label: I18N.t('acc_hard'), color: 'bg-red-50 text-red-700 border-red-100' }
              ].map(level => (
                <button
                  key={level.key}
                  onClick={() => navigate(`/learn/problems/${level.key}`)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold ${level.color} border hover:opacity-80 transition-all shadow-sm`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-24 text-center shadow-sm">
            <div className="inline-block w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">{I18N.t('common_loading')}</p>
          </div>
        ) : selectedModule && moduleData ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md animate-in fade-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center text-xs text-gray-400 font-bold uppercase tracking-wider mb-3">
                <button onClick={() => handleCourseClick(selectedModule.courseId)} className="hover:text-blue-600 transition">
                  {moduleData.course.title}
                </button>
                <span className="mx-2 text-gray-300">/</span>
                <span className="text-blue-600">{moduleData.module.title}</span>
              </div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{moduleData.module.title}</h1>
            </div>

            <div className="p-8 lg:p-12">
              {/* Progress Indicator */}
              {(progress?.[selectedModule.courseId] || new Set()).has(selectedModule.moduleId) && (
                <div className="mb-10 p-5 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-center shadow-sm">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center mr-4 flex-shrink-0 font-bold">✓</div>
                  <div>
                    <p className="font-bold text-lg">{I18N.t('common_success')}!</p>
                    <p className="text-sm opacity-90">You have successfully mastered this module.</p>
                  </div>
                </div>
              )}

              <div className="prose prose-blue max-w-none text-gray-700">
                <p className="text-xl leading-relaxed text-gray-600 mb-8 font-medium italic border-l-4 border-blue-100 pl-6">
                  {moduleData.module.description}
                </p>
                
                {moduleData.module.type === 'lesson' && moduleData.module.content && (
                  <div className="mt-8 space-y-6">
                    <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm leading-relaxed text-lg">
                      <div className="prose-headings:text-gray-900 prose-headings:font-bold prose-p:text-gray-700">
                        {moduleData.module.content.split('\n\n').map((para, i) => {
                          if (para.startsWith('###')) {
                            return <h3 key={i} className="text-2xl font-bold mt-8 mb-4 text-gray-900">{para.replace('###', '').trim()}</h3>
                          }
                          return <p key={i} className="mb-4 leading-relaxed">{para}</p>
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {moduleData.module.type === 'challenge' && (
                <div className="mt-12 pt-12 border-t border-gray-100">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-200">⌨️</div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Coding Challenge</h3>
                      <p className="text-gray-500 font-medium">Apply your knowledge to solve this problem</p>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 text-blue-900 font-semibold text-lg shadow-sm">
                    {moduleData.module.challenge?.instructions}
                  </div>

                  <div className="h-[500px] mb-8 shadow-xl rounded-xl overflow-hidden ring-1 ring-gray-200">
                    <CodeEditor
                      value={code}
                      onChange={setCode}
                      language={language}
                      onLanguageChange={setLanguage}
                    />
                  </div>

                  <button
                    onClick={handleSubmitChallenge}
                    disabled={submitting}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying Solution...
                      </>
                    ) : (
                      <>
                        <span>Submit Solution</span>
                        <span className="text-2xl">→</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : selectedCourse && courseData ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 flex items-end">
              <h1 className="text-4xl font-black text-white tracking-tight">{courseData.title}</h1>
            </div>
            
            <div className="p-10">
              <div className="max-w-3xl">
                <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-4">Course Overview</h2>
                <p className="text-2xl text-gray-700 leading-relaxed font-medium mb-12">
                  {courseData.description}
                </p>

                <h2 className="text-xl font-bold text-gray-400 uppercase tracking-widest mb-6">Learning Modules</h2>
                <div className="grid grid-cols-1 gap-4">
                  {courseData.modules.map((mod, idx) => {
                    const isDone = (progress?.[courseData.id] || new Set()).has(mod.id)
                    return (
                      <button
                        key={mod.id}
                        onClick={() => handleModuleClick(courseData.id, mod.id)}
                        className="group flex items-center p-6 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all duration-300 text-left"
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl mr-6 transition-all duration-300 ${
                          isDone ? 'bg-green-500 text-white shadow-green-100 shadow-lg' : 'bg-white text-gray-400 group-hover:text-blue-600 shadow-sm'
                        }`}>
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{mod.title}</h3>
                          <p className="text-sm text-gray-500 font-medium">Click to start this module</p>
                        </div>
                        <div className="text-gray-300 group-hover:text-blue-400 transition-all transform group-hover:translate-x-1 text-2xl">→</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center shadow-sm animate-in fade-in duration-700">
            <div className="mb-8 text-7xl drop-shadow-sm">📚</div>
            <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
              {I18N.t('welcome_title')}
            </h1>
            <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              {I18N.t('welcome_subtitle')}
            </p>
            <p className="text-lg text-blue-600 font-bold bg-blue-50 inline-block px-6 py-2 rounded-full mb-12">
              {I18N.t('welcome_select')}
            </p>
            
            <div className="pt-12 border-t border-gray-100">
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-6">Or dive into challenges</p>
              <button
                onClick={() => navigate('/learn/problems/all')}
                className="bg-gray-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-black transition-all shadow-xl hover:shadow-gray-200 active:scale-95 flex items-center mx-auto gap-3"
              >
                <span>{I18N.t('graph_title')}</span>
                <span className="text-2xl">↗</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
