import { useNavigate, useLocation } from 'react-router'
import { useAppContext } from '../context'
import I18N from '../i18n'

export default function Navigation({ onLanguageChange, currentLang }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()

  const handleLanguageChange = (e) => {
    const lang = e.target.value
    localStorage.setItem('ll_lang', lang)
    I18N.setLang(lang)
    onLanguageChange(lang)
  }

  const handleLogout = () => {
    localStorage.removeItem('ll_token')
    localStorage.removeItem('ll_user')
    window.location.href = '/'
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-8">
          <button
            onClick={() => navigate('/learn')}
            className="text-2xl font-bold cursor-pointer hover:opacity-80 transition"
          >
            Learn<span className="text-blue-600">Lab</span>
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/learn')}
              className={`px-4 py-2 rounded font-medium transition ${
                location.pathname === '/learn'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {I18N.t('nav_courses')}
            </button>
            <button
              onClick={() => navigate('/account')}
              className={`px-4 py-2 rounded font-medium transition ${
                location.pathname === '/account'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {I18N.t('nav_account')}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={currentLang}
            onChange={handleLanguageChange}
            className="px-3 py-1 border border-gray-300 rounded font-medium bg-white cursor-pointer"
          >
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="am">AM</option>
          </select>

          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="text-sm text-gray-700 font-medium">{user?.name?.split(' ')[0]}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium ml-2 transition"
            >
              {I18N.t('nav_logout')}
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}
