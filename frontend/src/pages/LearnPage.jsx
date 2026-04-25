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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 px-4 lg:px-0">
      {/* Sidebar */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-6">
          {/* Courses Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-md overflow-hidden">
            <h3 className="font-black text-gray-500 mb-5 px-1 uppercase text-xs tracking-widest">
              📚 {I18N.t('side_courses')}
            </h3>
            
            <div className="space-y-1 mb-8 max-h-[50vh] overflow-y-auto pr-2">
              {courses.map((course) => {
                const isSelected = selectedCourse === course.id
                const isExpanded = expandedCourse === course.id
                
                return (
                  <div key={course.id} className="space-y-1">
                    <button
                      onClick={() => handleCourseClick(course.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-sm font-bold transition-all duration-200 ${
                        isSelected 
                          ? 'text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-600 pl-3 shadow-sm' 
                          : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent hover:border-gray-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-lg transition-transform duration-300">{isExpanded ? '▾' : '▸'}</span>
                        <span className="truncate">{course.title}</span>
                      </span>
                    </button>

                    {isExpanded && course.modules && (
                      <div className="ml-3 mt-2 space-y-1 border-l-2 border-blue-200 pl-3 animate-in slide-in-from-top-1 duration-200">
                        {course.modules.map((mod) => {
                          const isDone = (progress?.[course.id] || new Set()).has(mod.id)
                          const isActive = selectedModule?.moduleId === mod.id
                          return (
                            <button
                              key={mod.id}
                              onClick={() => handleModuleClick(course.id, mod.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 ${
                                isActive 
                                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                                  : isDone 
                                    ? 'text-green-700 bg-green-50 hover:bg-green-100 font-bold' 
                                    : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <span className="text-base leading-none flex-shrink-0">
                                {isDone ? '✓' : '○'}
                              </span>
                              <span className="truncate flex-1">{mod.title}</span>
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
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-5 shadow-md">
            <h3 className="font-black text-gray-500 mb-5 px-1 uppercase text-xs tracking-widest">
              🎯 Graph Challenges
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/learn/problems/all')}
                className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                All Levels
              </button>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { key: 'easy', label: I18N.t('acc_easy'), color: 'from-green-500 to-green-600', lightColor: 'bg-green-50 text-green-700 border-green-200' },
                  { key: 'medium', label: I18N.t('acc_medium'), color: 'from-yellow-500 to-yellow-600', lightColor: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                  { key: 'hard', label: I18N.t('acc_hard'), color: 'from-red-500 to-red-600', lightColor: 'bg-red-50 text-red-700 border-red-200' }
                ].map(level => (
                  <button
                    key={level.key}
                    onClick={() => navigate(`/learn/problems/${level.key}`)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold border-2 transition-all shadow-sm hover:shadow-md active:scale-95 ${level.lightColor}`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
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
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12">
              <div className="flex items-center text-xs text-blue-100 font-bold uppercase tracking-wider mb-4">
                <button onClick={() => handleCourseClick(selectedModule.courseId)} className="hover:text-white transition duration-200">
                  {moduleData.course.title}
                </button>
                <span className="mx-3 text-blue-300">/</span>
                <span className="text-blue-200">{moduleData.module.title}</span>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight mb-2">{moduleData.module.title}</h1>
              <p className="text-blue-100 text-lg font-medium max-w-2xl">{moduleData.module.description}</p>
            </div>

            <div className="p-8 lg:p-16">
              {/* Progress Indicator */}
              {(progress?.[selectedModule.courseId] || new Set()).has(selectedModule.moduleId) && (
                <div className="mb-12 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl text-green-800 flex items-start shadow-sm">
                  <div className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center mr-5 flex-shrink-0 font-bold text-lg shadow-lg">✓</div>
                  <div>
                    <p className="font-bold text-xl">{I18N.t('common_success')}!</p>
                    <p className="text-sm opacity-90 mt-1">You have successfully mastered this module.</p>
                  </div>
                </div>
              )}

              {moduleData.module.type === 'lesson' && moduleData.module.content && (
                <div className="mt-2 space-y-8">
                  <div className="space-y-8 text-gray-700 leading-relaxed">
                    {moduleData.module.content.split('\n\n').map((section, i) => {
                      const lines = section.split('\n')
                      return (
                        <div key={i} className="space-y-4">
                          {lines.map((line, lineIdx) => {
                            if (line.startsWith('###')) {
                              return (
                                <div key={lineIdx} className="pt-6 mt-8 border-t border-gray-200">
                                  <h3 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{line.replace('###', '').trim()}</h3>
                                </div>
                              )
                            }
                            if (line.startsWith('##')) {
                              return (
                                <h2 key={lineIdx} className="text-2xl font-bold text-blue-700 mt-10 mb-4">{line.replace('##', '').trim()}</h2>
                              )
                            }
                            if (line.startsWith('**') && line.endsWith('**')) {
                              return (
                                <p key={lineIdx} className="text-lg font-bold text-gray-900 bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
                                  {line.replace(/\*\*/g, '')}
                                </p>
                              )
                            }
                            if (line.startsWith('- ')) {
                              return (
                                <div key={lineIdx} className="flex gap-4 items-start">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <p className="text-base leading-relaxed text-gray-700">{line.replace('- ', '')}</p>
                                </div>
                              )
                            }
                            if (line.trim() === '') {
                              return null
                            }
                            return (
                              <p key={lineIdx} className="text-lg leading-relaxed text-gray-700 mb-4">
                                {line}
                              </p>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {moduleData.module.type === 'challenge' && (
                <div className="mt-16 pt-16 border-t-2 border-gray-200">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg">⌨️</div>
                    <div>
                      <h3 className="text-3xl font-black text-gray-900">Coding Challenge</h3>
                      <p className="text-gray-500 font-medium mt-1">Apply your knowledge to solve this problem</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 mb-10 text-blue-900 font-semibold text-lg leading-relaxed shadow-sm">
                    <p className="whitespace-pre-wrap">{moduleData.module.challenge?.instructions}</p>
                  </div>

                  <div className="h-[600px] mb-10 shadow-2xl rounded-2xl overflow-hidden ring-1 ring-gray-200">
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
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-5 px-8 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-blue-300/40 flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    {submitting ? (
                      <>
                        <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying Solution...</span>
                      </>
                    ) : (
                      <>
                        <span>✓ Submit Solution</span>
                        <span className="text-2xl">→</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : selectedCourse && courseData ? (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header with Gradient */}
            <div className="h-40 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 p-8 lg:p-12 flex items-end relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -mr-48 -mt-48"></div>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tight relative z-10">{courseData.title}</h1>
            </div>
            
            <div className="p-8 lg:p-16 space-y-16">
              {/* Description Section */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">About This Course</h2>
                <p className="text-2xl text-gray-700 leading-relaxed font-medium">
                  {courseData.description}
                </p>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

              {/* Learning Modules Section */}
              <div>
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-8">Learning Modules</h2>
                <div className="grid grid-cols-1 gap-4">
                  {courseData.modules.map((mod, idx) => {
                    const isDone = (progress?.[courseData.id] || new Set()).has(mod.id)
                    return (
                      <button
                        key={mod.id}
                        onClick={() => handleModuleClick(courseData.id, mod.id)}
                        className="group flex items-center gap-6 p-8 bg-gradient-to-br from-gray-50 to-gray-50 hover:from-blue-50 hover:to-indigo-50 rounded-2xl border-2 border-gray-100 hover:border-blue-300 transition-all duration-300 text-left shadow-sm hover:shadow-md"
                      >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0 transition-all duration-300 shadow-sm ${
                          isDone 
                            ? 'bg-gradient-to-br from-green-400 to-green-500 text-white shadow-lg shadow-green-200' 
                            : 'bg-white text-gray-700 font-black group-hover:text-blue-600 border-2 border-gray-100 group-hover:border-blue-300'
                        }`}>
                          {isDone ? '✓' : String(idx + 1).padStart(2, '0')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-1">{mod.title}</h3>
                          <p className="text-sm text-gray-500 font-medium">Click to start this module</p>
                        </div>
                        <div className="text-gray-300 group-hover:text-blue-500 transition-all transform group-hover:translate-x-2 text-2xl flex-shrink-0">→</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg p-16 text-center animate-in fade-in duration-700 relative">
            {/* Decorative Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400 rounded-full opacity-5 -mr-40 -mt-40"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-400 rounded-full opacity-5 -ml-40 -mb-40"></div>
            </div>

            <div className="relative z-10">
              <div className="mb-8 text-8xl drop-shadow-sm">📚</div>
              <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">
                {I18N.t('welcome_title')}
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
                {I18N.t('welcome_subtitle')}
              </p>
              <p className="text-lg text-blue-700 font-bold bg-blue-100 inline-block px-8 py-3 rounded-full mb-16 shadow-sm">
                {I18N.t('welcome_select')}
              </p>
              
              <div className="pt-12 border-t border-gray-200">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-8">Explore Challenges</p>
                <button
                  onClick={() => navigate('/learn/problems/all')}
                  className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-12 py-5 rounded-2xl font-bold text-lg hover:from-black hover:to-gray-900 transition-all shadow-xl hover:shadow-gray-400/30 active:scale-95 flex items-center mx-auto gap-3 hover:gap-4"
                >
                  <span>{I18N.t('graph_title')}</span>
                  <span className="text-2xl transform group-hover:translate-x-1 transition-transform">↗</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
