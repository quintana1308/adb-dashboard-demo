import { useEffect, useState } from 'react'
import { getCurrentUser } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { HiOutlineChartBar, HiOutlineUserAdd, HiOutlineCurrencyDollar, HiOutlineClipboardList } from 'react-icons/hi'
import fondoImg from '../assets/fondo.png'
import Footer from './Footer'
import DashboardHeader from './DashboardHeader'
import SincronizacionVentasTable from './SincronizacionVentasTable'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [showVentasDropdown, setShowVentasDropdown] = useState(false)
  const [showActivacionDropdown, setShowActivacionDropdown] = useState(false)
  const [showFinanzasDropdown, setShowFinanzasDropdown] = useState(false)
  const [showCobranzaDropdown, setShowCobranzaDropdown] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setLoading(false)
    }
    loadUser()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showVentasDropdown && !event.target.closest('.ventas-dropdown-container')) {
        setShowVentasDropdown(false)
      }
      if (showActivacionDropdown && !event.target.closest('.activacion-dropdown-container')) {
        setShowActivacionDropdown(false)
      }
      if (showFinanzasDropdown && !event.target.closest('.finanzas-dropdown-container')) {
        setShowFinanzasDropdown(false)
      }
      if (showCobranzaDropdown && !event.target.closest('.cobranza-dropdown-container')) {
        setShowCobranzaDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVentasDropdown, showActivacionDropdown, showFinanzasDropdown, showCobranzaDropdown])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative" style={{ backgroundImage: `url(${fondoImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      {/* Header */}
      <DashboardHeader title="Dashboard Principal" showBackButton={false}>
        {/* No hay menú específico para el dashboard principal */}
      </DashboardHeader>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-8 md:py-16 px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
          {/* Dashboard de Ventas */}
          <div className="flex-1 relative ventas-dropdown-container">
            <div 
              onClick={() => setShowVentasDropdown(!showVentasDropdown)}
              className="relative bg-purolomo-red hover:bg-blue-700 transition-colors rounded-2xl p-6 md:p-8 h-32 md:h-40 flex items-center cursor-pointer shadow-xl"
            >
              <div className="flex-1">
                <h2 className="text-white font-bold leading-tight mb-2 text-xl md:text-2xl lg:text-3xl" style={{ fontFamily: 'Open Sans' }}>
                  DASHBOARD DE<br />VENTAS
                </h2>
                <p className="text-white font-medium text-sm md:text-base lg:text-xl" style={{ fontFamily: 'Open Sans' }}>VENTAS</p>
              </div>
              <div className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2">
                <div className="rounded-full p-2 md:p-4 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center bg-blue-800">
                  <HiOutlineChartBar className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2">
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-white transition-transform ${showVentasDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {/* Dropdown de Ventas */}
            {showVentasDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/dashboard/ventas/consolidado-general')
                      setShowVentasDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiOutlineChartBar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Ventas Consolidado</div>
                      <div className="text-sm text-gray-500">Dashboard general de ventas</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard/ventas/ventas')
                      setShowVentasDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiOutlineChartBar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Ventas Detallado</div>
                      <div className="text-sm text-gray-500">Análisis detallado por grupo y mes</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard/ventas/region-grupo-tipo')
                      setShowVentasDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiOutlineChartBar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Ventas Región Grupo Tipo</div>
                      <div className="text-sm text-gray-500">Análisis por región, grupo y tipo</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard/ventas/region-aliado-sku')
                      setShowVentasDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiOutlineChartBar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Ventas Región Aliado SKU</div>
                      <div className="text-sm text-gray-500">Análisis por región, aliado y SKU</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dashboard de Finanzas */}
          <div className="flex-1 relative finanzas-dropdown-container">
            <div 
              onClick={() => setShowFinanzasDropdown(!showFinanzasDropdown)}
              className="relative bg-slate-700 hover:bg-slate-800 transition-colors rounded-2xl p-6 md:p-8 h-32 md:h-40 flex items-center cursor-pointer shadow-xl"
            >
              <div className="flex-1">
                <h2 className="text-white font-bold leading-tight mb-2 text-xl md:text-2xl lg:text-3xl" style={{ fontFamily: 'Open Sans' }}>
                  DASHBOARD DE<br />FINANZAS
                </h2>
                <p className="text-white font-medium text-sm md:text-base lg:text-xl" style={{ fontFamily: 'Open Sans' }}>FINANZAS</p>
              </div>
              <div className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2">
                <div className="rounded-full p-2 md:p-4 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center bg-slate-900">
                  <HiOutlineCurrencyDollar className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2">
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-white transition-transform ${showFinanzasDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {/* Dropdown de Finanzas */}
            {showFinanzasDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/dashboard/finanzas/rentabilidad')
                      setShowFinanzasDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <HiOutlineCurrencyDollar className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Rentabilidad</div>
                      <div className="text-sm text-gray-500">Tabla de rentabilidad con filtros</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard/finanzas/egresos')
                      setShowFinanzasDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                      <HiOutlineCurrencyDollar className="w-4 h-4 text-slate-700" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Egresos Operativos</div>
                      <div className="text-sm text-gray-500">Gestión de gastos y egresos</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dashboard de Cobranza */}
          <div className="flex-1 relative cobranza-dropdown-container">
            <div 
              onClick={() => setShowCobranzaDropdown(!showCobranzaDropdown)}
              className="relative bg-orange-600 hover:bg-orange-700 transition-colors rounded-2xl p-6 md:p-8 h-32 md:h-40 flex items-center cursor-pointer shadow-xl"
            >
              <div className="flex-1">
                <h2 className="text-white font-bold leading-tight mb-2 text-xl md:text-2xl lg:text-3xl" style={{ fontFamily: 'Open Sans' }}>
                  DASHBOARD DE<br />COBRANZA
                </h2>
                <p className="text-white font-medium text-sm md:text-base lg:text-xl" style={{ fontFamily: 'Open Sans' }}>COBRANZA</p>
              </div>
              <div className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2">
                <div className="rounded-full p-2 md:p-4 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center bg-orange-800">
                  <HiOutlineClipboardList className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2">
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-white transition-transform ${showCobranzaDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {/* Dropdown de Cobranza */}
            {showCobranzaDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/dashboard/finanzas/cobranza')
                      setShowCobranzaDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <HiOutlineClipboardList className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Cuentas por Cobrar</div>
                      <div className="text-sm text-gray-500">Gestión de cobranza y cartera</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dashboard de Activación */}
          <div className="flex-1 relative activacion-dropdown-container">
            <div 
              onClick={() => setShowActivacionDropdown(!showActivacionDropdown)}
              className="relative bg-purolomo-green hover:bg-green-700 transition-colors rounded-2xl p-6 md:p-8 h-32 md:h-40 flex items-center cursor-pointer shadow-xl"
            >
              <div className="flex-1">
                <h2 className="text-white font-bold leading-tight mb-2 text-xl md:text-2xl lg:text-3xl" style={{ fontFamily: 'Open Sans' }}>
                  DASHBOARD DE<br />ACTIVACIÓN
                </h2>
                <p className="text-white font-medium text-sm md:text-base lg:text-xl" style={{ fontFamily: 'Open Sans' }}>ACTIVACIÓN</p>
              </div>
              <div className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2">
                <div className="rounded-full p-2 md:p-4 w-12 h-12 md:w-20 md:h-20 flex items-center justify-center bg-green-800">
                  <HiOutlineUserAdd className="w-6 h-6 md:w-10 md:h-10 text-white" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2">
                <ChevronDown className={`w-4 h-4 md:w-5 md:h-5 text-white transition-transform ${showActivacionDropdown ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {/* Dropdown de Activación */}
            {showActivacionDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                <div className="py-2">
                  <button
                    onClick={() => {
                      navigate('/dashboard/activacion/departamentos')
                      setShowActivacionDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <HiOutlineUserAdd className="w-4 h-4 text-purolomo-green" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Activación por Departamentos</div>
                      <div className="text-sm text-gray-500">Análisis por departamentos</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard/activacion/grupos')
                      setShowActivacionDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <HiOutlineUserAdd className="w-4 h-4 text-purolomo-green" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Activación por Grupos</div>
                      <div className="text-sm text-gray-500">Análisis por grupos</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard/activacion/marcas')
                      setShowActivacionDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <HiOutlineUserAdd className="w-4 h-4 text-purolomo-green" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Activación por Marcas</div>
                      <div className="text-sm text-gray-500">Análisis por marcas</div>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      navigate('/dashboard/activacion/sku')
                      setShowActivacionDropdown(false)
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                  >
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <HiOutlineUserAdd className="w-4 h-4 text-purolomo-green" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Activación por SKU</div>
                      <div className="text-sm text-gray-500">Análisis por SKU</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tabla de Sincronización de Ventas */}
        <div className="w-full max-w-6xl mt-8">
          <SincronizacionVentasTable />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Dashboard
