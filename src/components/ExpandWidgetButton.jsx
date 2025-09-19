import { useState } from 'react'

const ExpandWidgetButton = ({ 
  children,
  title = 'Widget',
  className = '',
  disabled = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsExpanded(false)
    }
  }

  return (
    <>
      <button
        onClick={toggleExpand}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center
          transition-all duration-200 ease-in-out
          ${disabled
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:text-blue-700'
          }
          ${className}
        `}
        title="Expandir widget a pantalla completa"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>

      {/* Modal de pantalla completa */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-full overflow-hidden">
            {/* Header del modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                title="Cerrar vista expandida"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenido del widget expandido */}
            <div className="p-6 h-full overflow-auto" style={{ height: 'calc(100% - 73px)' }}>
              <div className="h-full">
                {children}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ExpandWidgetButton
