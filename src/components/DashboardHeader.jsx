import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { signOut, getCurrentUser } from '../lib/supabase'
import logoImg from '../assets/logo-demo.svg'

const DashboardHeader = ({ title, children, showBackButton = true }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.user-dropdown-container')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (!error) {
      navigate('/login')
    }
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      {/* Primera línea - Mobile y Desktop */}
      <div 
        className="text-white px-4 sm:px-6 py-2 sm:py-3 flex items-center"
        style={{
          background: '#3b82f6',
          fontFamily: 'Open Sans, sans-serif',
          minHeight: '64px'
        }}
      >
        <div className="flex items-center justify-between w-full">
          {/* Lado izquierdo: Back button + Logo */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showBackButton && (
              <button 
                onClick={() => navigate('/dashboard')}
                className="p-1 sm:p-2 hover:bg-black/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
            <img 
              src={logoImg} 
              alt="Demo Dashboard" 
              className="h-8 sm:h-10 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/dashboard')}
            />
            {/* Título en desktop */}
            <h1 
              className="hidden sm:block font-bold text-lg truncate" 
              style={{
                fontFamily: 'Open Sans, sans-serif',
                fontWeight: '600'
              }}
            >
              {title}
            </h1>
          </div>

          {/* Lado derecho: Menú usuario + Menú dashboard (desktop) */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Menú dashboard en desktop */}
            <div className="hidden sm:block">
              {children}
            </div>
            
            {/* Menú usuario */}
            <div className="relative user-dropdown-container">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center text-white hover:text-gray-200 transition-colors p-1 sm:p-2 rounded-full hover:bg-white/10"
              >
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{user?.email || 'Usuario'}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default DashboardHeader
