import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, MapPin, Filter, RefreshCw, FilterX, Maximize, ChevronDown, ChevronUp, TrendingUp, Users, Percent, FileText, Search, X } from 'lucide-react'
import ActivacionDataTableWidget from './widgets/ActivacionDataTableWidget'
import { supabase } from '../lib/supabase'
import Footer from './Footer'
import DashboardHeader from './DashboardHeader'

const ActivacionVendedor = () => {
  const navigate = useNavigate()
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [filtrosData, setFiltrosData] = useState({
    anios: [],
    meses: [],
    codigorutas: []
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    anio: 'All',
    mes: 'All',
    codigoruta: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)

  // Buscador de código de ruta
  const [codigoRutaSearchTerm, setCodigoRutaSearchTerm] = useState('')
  const [isCodigoRutaDropdownOpen, setIsCodigoRutaDropdownOpen] = useState(false)
  const codigoRutaDropdownRef = useRef(null)

  // Cargar filtros al montar el componente
  useEffect(() => {
    fetchFiltros()
  }, [])

  const fetchFiltros = async () => {
    if (loading) return // Prevenir llamados dobles
    setLoading(true)
    try {
      const { data: filtrosResult, error } = await supabase.rpc('get_filtros_activacion_vendedor')
      
      if (error) {
        console.error('Error al cargar filtros:', error)
        throw error
      }

      const aniosUnicos = [...new Set(filtrosResult.map(item => item.anios))].sort((a, b) => b - a)
      const mesesUnicos = [...new Set(filtrosResult.map(item => item.meses))].sort()
      const codigorutasUnicos = [...new Set(filtrosResult.map(item => item.codigorutas))].sort()

      setFiltrosData({
        anios: aniosUnicos,
        meses: mesesUnicos,
        codigorutas: codigorutasUnicos
      })

    } catch (error) {
      console.error('Error cargando filtros:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAllWidgets = () => {
    fetchFiltros()
    // Refrescar también el widget de la tabla
    if (widgetRef.current && widgetRef.current.refreshData) {
      widgetRef.current.refreshData()
    }
  }

  const handleFiltroChange = (tipo, valor) => {
    setFiltrosSeleccionados(prev => ({
      ...prev,
      [tipo]: valor
    }))
  }

  const limpiarFiltros = async () => {
    setFiltrosSeleccionados({
      anio: 'All',
      mes: 'All',
      codigoruta: 'All'
    })
    setCodigoRutaSearchTerm('')
    setIsCodigoRutaDropdownOpen(false)
    await fetchFiltros()
  }

  // Filtrar códigos de ruta basado en el término de búsqueda
  const filteredCodigoRutas = filtrosData.codigorutas?.filter(cr =>
    (cr || '').toLowerCase().includes(codigoRutaSearchTerm.toLowerCase())
  ) || []

  // Manejar selección de código de ruta
  const handleCodigoRutaSelect = (codigoruta) => {
    handleFiltroChange('codigoruta', codigoruta)
    setCodigoRutaSearchTerm('')
    setIsCodigoRutaDropdownOpen(false)
  }

  // Manejar click fuera del dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (codigoRutaDropdownRef.current && !codigoRutaDropdownRef.current.contains(event.target)) {
        setIsCodigoRutaDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Activación - Vendedor">
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <button 
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => navigate('/dashboard/activacion/departamentos')}
          >
            Aliados - Departamentos
          </button>
          <button 
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => navigate('/dashboard/activacion/grupos')}
          >
            Aliados - Grupos
          </button>
          <button 
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => navigate('/dashboard/activacion/marcas')}
          >
            Aliados - Marcas
          </button>
          <button 
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => navigate('/dashboard/activacion/sku')}
          >
            Aliados - SKU
          </button>
          <button 
            className="text-white border-b-2 border-white pb-1 font-semibold"
          >
            Activacion - Vendedor
          </button>
        </nav>
        {/* Menú móvil */}
        <div className="md:hidden">
          <select 
            className="bg-transparent border border-white/30 rounded px-2 py-1 text-sm text-white"
            onChange={(e) => {
              const value = e.target.value
              if (value === 'departamentos') navigate('/dashboard/activacion/departamentos')
              else if (value === 'grupos') navigate('/dashboard/activacion/grupos')
              else if (value === 'marcas') navigate('/dashboard/activacion/marcas')
              else if (value === 'sku') navigate('/dashboard/activacion/sku')
            }}
            defaultValue="vendedor"
          >
            <option value="departamentos" className="text-black">Aliados - Departamentos</option>
            <option value="grupos" className="text-black">Aliados - Grupos</option>
            <option value="marcas" className="text-black">Aliados - Marcas</option>
            <option value="sku" className="text-black">Aliados - SKU</option>
            <option value="vendedor" className="text-black">Activacion - Vendedor</option>
          </select>
        </div>
      </DashboardHeader>

      {/* Segunda Barra - Filtros e Iconos */}
      <div className="bg-white px-4 sm:px-6 py-2 border-b" style={{ borderBottomColor: '#f3f4f6' }}>
        {/* Barra de filtros colapsable en mobile */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
            <button onClick={() => setFiltrosColapsados(!filtrosColapsados)} className="p-1 hover:bg-gray-100 rounded transition-colors">
              {filtrosColapsados ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={refreshAllWidgets} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refrescar" style={{ color: '#3b82f6' }}>
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={limpiarFiltros} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Limpiar filtros" style={{ color: '#3b82f6' }}>
              <FilterX className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={() => document.documentElement.requestFullscreen()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Pantalla completa" style={{ color: '#3b82f6' }}>
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Filtros y acciones en desktop - misma fila */}
        <div className={`${filtrosColapsados ? 'hidden' : 'block'} md:block`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Contenedor de filtros */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3 sm:gap-4 md:gap-3 mt-3 md:mt-0">
              {/* Filtro Año */}
              <div className="flex items-center space-x-2 min-w-0">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.anio}
                  onChange={(e) => handleFiltroChange('anio', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Año</option>
                  {filtrosData.anios.map(anio => (
                    <option key={anio} value={anio}>{anio}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Mes */}
              <div className="flex items-center space-x-2 min-w-0">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.mes}
                  onChange={(e) => handleFiltroChange('mes', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Mes</option>
                  {filtrosData.meses.map(mes => (
                    <option key={mes} value={mes}>{mes}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Código Ruta con buscador */}
              <div className="flex items-center space-x-2 relative" ref={codigoRutaDropdownRef}>
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between appearance-none w-36"
                    onClick={() => setIsCodigoRutaDropdownOpen(!isCodigoRutaDropdownOpen)}
                    style={{ height: '32px' }}
                  >
                    <span className="truncate text-sm">
                      {filtrosSeleccionados.codigoruta === 'All' ? 'Código Ruta' : filtrosSeleccionados.codigoruta}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCodigoRutaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isCodigoRutaDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-64 overflow-hidden w-96">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar código de ruta..."
                            value={codigoRutaSearchTerm}
                            onChange={(e) => setCodigoRutaSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {codigoRutaSearchTerm && (
                            <button
                              onClick={() => setCodigoRutaSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCodigoRutas.length > 0 ? (
                          <>
                            <div 
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                handleFiltroChange('codigoruta', 'All')
                                setIsCodigoRutaDropdownOpen(false)
                                setCodigoRutaSearchTerm('')
                              }}
                            >
                              <span className="font-medium text-gray-900">Todos los códigos de ruta</span>
                            </div>
                            {filteredCodigoRutas.map(codigoruta => (
                              <div 
                                key={codigoruta}
                                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  handleFiltroChange('codigoruta', codigoruta)
                                  setIsCodigoRutaDropdownOpen(false)
                                  setCodigoRutaSearchTerm('')
                                }}
                              >
                                {codigoruta}
                              </div>
                            ))}
                          </>
                        ) : codigoRutaSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron códigos de ruta que coincidan con "{codigoRutaSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay códigos de ruta disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Iconos de acción en desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <button 
                onClick={refreshAllWidgets}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refrescar"
                style={{ color: '#3b82f6' }}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={limpiarFiltros}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Limpiar filtros"
                style={{ color: '#3b82f6' }}
              >
                <FilterX className="w-5 h-5" />
              </button>
              <button 
                onClick={() => document.documentElement.requestFullscreen()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Pantalla completa"
                style={{ color: '#3b82f6' }}
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-4 sm:p-6 flex-1">
        {/* Título del dashboard - Solo en mobile/tablet */}
        <div className="lg:hidden mb-6">
          <h1 
            className="font-bold text-gray-900 text-2xl border-l-4 pl-4 py-2" 
            style={{
              fontFamily: 'Open Sans, sans-serif',
              fontWeight: '700',
              borderLeftColor: '#ec1e06'
            }}
          >
            Activación - Vendedor
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <ActivacionDataTableWidget 
            ref={widgetRef}
            filtros={filtrosSeleccionados}
            tipo="vendedor"
            rpcFunction="get_activacion_vendedor"
            columns={[
              { key: 'anio', label: 'AÑO', sortable: true },
              { key: 'mes', label: 'MES', sortable: true },
              { key: 'codigoruta', label: 'CÓDIGO RUTA', sortable: true },
              { key: 'vendedor', label: 'VENDEDOR', sortable: true, width: '250px' },
              { key: 'porcentaje_acumulado_mes', label: '% ACUMULADO MES', sortable: true, align: 'right' },
              { key: 'activacion_acumulada_mes', label: 'ACTIVACIÓN ACUMULADA', sortable: true, align: 'right' },
              { key: 'cartera_general', label: 'CARTERA GENERAL', sortable: true, align: 'right' },
              { key: 'cartera_semana1', label: 'CARTERA S1', sortable: true, align: 'right' },
              { key: 'cartera_semana2', label: 'CARTERA S2', sortable: true, align: 'right' },
              { key: 'cartera_semana3', label: 'CARTERA S3', sortable: true, align: 'right' },
              { key: 'cartera_semana4', label: 'CARTERA S4', sortable: true, align: 'right' },
              { key: 'cartera_semana5', label: 'CARTERA S5', sortable: true, align: 'right' },
              { key: 'cartera_semana6', label: 'CARTERA S6', sortable: true, align: 'right' },
              { key: 'activacion_semana1', label: 'ACTIVACIÓN S1', sortable: true, align: 'right' },
              { key: 'activacion_semana2', label: 'ACTIVACIÓN S2', sortable: true, align: 'right' },
              { key: 'activacion_semana3', label: 'ACTIVACIÓN S3', sortable: true, align: 'right' },
              { key: 'activacion_semana4', label: 'ACTIVACIÓN S4', sortable: true, align: 'right' },
              { key: 'activacion_semana5', label: 'ACTIVACIÓN S5', sortable: true, align: 'right' },
              { key: 'activacion_semana6', label: 'ACTIVACIÓN S6', sortable: true, align: 'right' },
              { key: 'porcentaje_semana1', label: '% S1', sortable: true, align: 'right' },
              { key: 'porcentaje_semana2', label: '% S2', sortable: true, align: 'right' },
              { key: 'porcentaje_semana3', label: '% S3', sortable: true, align: 'right' },
              { key: 'porcentaje_semana4', label: '% S4', sortable: true, align: 'right' },
              { key: 'porcentaje_semana5', label: '% S5', sortable: true, align: 'right' },
              { key: 'porcentaje_semana6', label: '% S6', sortable: true, align: 'right' }
            ]}
          />
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default ActivacionVendedor
