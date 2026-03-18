import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export const useAppContext = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [currentCourse, setCurrentCourse] = useState(null)
  const [currentModule, setCurrentModule] = useState(null)
  const [openCourses, setOpenCourses] = useState({})

  // Initialize from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('ll_token')
    const storedUser = localStorage.getItem('ll_user')
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.error('Failed to load stored session:', err)
        localStorage.removeItem('ll_token')
        localStorage.removeItem('ll_user')
      }
    }
  }, [])

  const value = {
    user,
    setUser,
    token,
    setToken,
    courses,
    setCourses,
    progress,
    setProgress,
    isLoading,
    setIsLoading,
    currentCourse,
    setCurrentCourse,
    currentModule,
    setCurrentModule,
    openCourses,
    setOpenCourses,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
