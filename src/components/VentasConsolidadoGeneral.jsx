import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Calendar, Users, Filter, RefreshCw, FilterX, Maximize, ChevronDown, ChevronUp } from 'lucide-react'
import Footer from './Footer'
import DashboardHeader from './DashboardHeader'
import VentasNavMenu from './VentasNavMenu'
import ToneladasWidget from './widgets/ToneladasWidget'
import CajasWidget from './widgets/CajasWidget'
import SincronizacionWidget from './widgets/SincronizacionWidget'
import TopAliadosWidget from './widgets/TopAliadosWidget'
import TopProductosWidget from './widgets/TopProductosWidget'
import ProductosListWidget from './widgets/ProductosListWidget'

const VentasConsolidadoGeneral = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [filtrosData, setFiltrosData] = useState({
    meses: [],
    aliados: [],
    marcas: []
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    mes: 'All',
    aliado: 'All', 
    marca: 'All'
  })

  // Estado para filtros interactivos (desde clics en gráficos)
  const [filtrosInteractivos, setFiltrosInteractivos] = useState({
    gpo: 'All',
    aliado_especifico: 'All'
  })
  
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)

  // Ref para evitar dobles llamadas
  const isInitializedRef = useRef(false)
  
  // Estado para controlar la recarga de widgets
  const [forceRefresh, setForceRefresh] = useState(0)

  const fetchFiltros = async () => {
    if (loading || isInitializedRef.current) return // Prevenir llamados dobles
    isInitializedRef.current = true
    setLoading(true)
    try {
      // Usar función RPC optimizada para obtener valores únicos directamente
      const { data: filtrosResult, error } = await supabase.rpc('get_filtros_ventas_consolidado')

      if (error) {
        console.error('Error al cargar filtros:', error)
        throw error
      }

      // Procesar los resultados de la función RPC
      const filtrosMap = {}
      filtrosResult?.forEach(row => {
        filtrosMap[row.campo] = row.valores || []
      })

      setFiltrosData({
        meses: filtrosMap.mes || [],
        aliados: filtrosMap.aliado || [], // Contiene rubros (gpo)
        marcas: filtrosMap.marca || []
      })

    } catch (error) {
      console.error('Error cargando filtros:', error)
      // En caso de error, establecer arrays vacíos
      setFiltrosData({
        meses: [],
        aliados: [],
        marcas: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isInitializedRef.current) {
      fetchFiltros()
    }
  }, []) // Array de dependencias vacío para ejecutar solo una vez

  const limpiarFiltros = () => {
    setFiltrosSeleccionados({
      mes: 'All',
      aliado: 'All', 
      marca: 'All'
    })
    setFiltrosInteractivos({
      gpo: 'All',
      aliado_especifico: 'All'
    })
  }

  // Función para recargar todos los widgets
  const recargarWidgets = () => {
    // Incrementar el contador para forzar re-render de todos los widgets
    setForceRefresh(prev => prev + 1)
  }

  const handleFiltroChange = (tipo, valor) => {
    setFiltrosSeleccionados(prev => ({
      ...prev,
      [tipo]: valor
    }))
  }

  // Función para manejar clics interactivos en gráficos
  const handleInteractiveFilter = (tipo, valor) => {
    setFiltrosInteractivos(prev => ({
      ...prev,
      [tipo]: valor
    }))
    // No llamar recargarWidgets() aquí - los widgets se recargan automáticamente por el useEffect
  }

  // Filtros para pasar a los widgets (combinando filtros básicos e interactivos)
  const filtrosCombinados = {
    ...filtrosSeleccionados,
    ...filtrosInteractivos
  }

  // Mostrar el dashboard inmediatamente, los widgets manejan su propia carga

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Consolidado General">
        <VentasNavMenu currentPage="consolidado-general" />
      </DashboardHeader>

      {/* Segunda Barra - Filtros e Iconos */}
      <div className="bg-white px-4 sm:px-6 py-2 border-b" style={{ borderBottomColor: '#f3f4f6' }}>
        {/* Header de filtros con botón de colapsar en móvil */}
        <div className="flex items-center justify-between md:hidden">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
            <button
              onClick={() => setFiltrosColapsados(!filtrosColapsados)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {filtrosColapsados ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
          
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={recargarWidgets}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Recargar todos los widgets"
              style={{ color: '#3b82f6' }}
            >
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={limpiarFiltros}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Limpiar todos los filtros"
              style={{ color: '#3b82f6' }}
            >
              <FilterX className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button 
              onClick={() => document.documentElement.requestFullscreen()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Pantalla completa"
              style={{ color: '#3b82f6' }}
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Filtros y acciones en desktop - misma fila */}
        <div className={`${filtrosColapsados ? 'hidden' : 'block'} md:block`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Contenedor de filtros */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap md:flex-nowrap gap-3 sm:gap-4 md:gap-6 mt-3 md:mt-0">
              {/* Filtro Mes */}
              <div className="flex items-center space-x-2 min-w-0">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Mes:</label>
                <select 
                  value={filtrosSeleccionados.mes}
                  onChange={(e) => handleFiltroChange('mes', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-auto"
                  disabled={loading}
                >
                  <option value="All">All</option>
                  {filtrosData.meses.map(item => (
                    <option key={item.mes} value={item.mes}>{item.mes}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Rubro */}
              <div className="flex items-center space-x-2 min-w-0">
                <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Rubro:</label>
                <select 
                  value={filtrosSeleccionados.aliado}
                  onChange={(e) => handleFiltroChange('aliado', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-auto"
                  disabled={loading}
                >
                  <option value="All">All</option>
                  {filtrosData.aliados.map(item => (
                    <option key={item.aliado} value={item.aliado}>{item.aliado}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Marca */}
              <div className="flex items-center space-x-2 min-w-0">
                <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Marca:</label>
                <select 
                  value={filtrosSeleccionados.marca}
                  onChange={(e) => handleFiltroChange('marca', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-auto"
                  disabled={loading}
                >
                  <option value="All">All</option>
                  {filtrosData.marcas.map(item => (
                    <option key={item.marca} value={item.marca}>{item.marca}</option>
                  ))}
                </select>
              </div>
            </div>



            {/* Lado derecho: Acciones en desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <button 
                onClick={recargarWidgets}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Recargar todos los widgets"
                style={{ color: '#3b82f6' }}
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={limpiarFiltros}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Limpiar todos los filtros"
                style={{ color: '#3b82f6' }}
              >
                <FilterX className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button 
                onClick={() => document.documentElement.requestFullscreen()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Pantalla completa"
                style={{ color: '#3b82f6' }}
              >
                <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
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
            Consolidado General
          </h1>
        </div>

        {/* Primera Fila: Toneladas/Cajas + Sincronización + Lista de Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          {/* Columna 1: Toneladas y Cajas apilados */}
          <div className="space-y-4 sm:space-y-6 sm:col-span-2 lg:col-span-1">
            <ToneladasWidget filtros={filtrosCombinados} forceRefresh={forceRefresh} />
            <CajasWidget filtros={filtrosCombinados} forceRefresh={forceRefresh} />
          </div>

          {/* Columna 2: Sincronización */}
          <div>
            <SincronizacionWidget filtros={filtrosCombinados} />
          </div>

          {/* Columnas 3-4: Lista de Productos (span 2 columnas) */}
          <div className="lg:col-span-2">
            <ProductosListWidget filtros={filtrosCombinados} forceRefresh={forceRefresh} />
          </div>
        </div>

        {/* Segunda Fila: Gráficos */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
          {/* Gráfico de Barras - 60% (3 columnas de 5) */}
          <div className="xl:col-span-3">
            <TopAliadosWidget 
              filtros={filtrosCombinados} 
              forceRefresh={forceRefresh}
              onAliadoClick={(aliado) => handleInteractiveFilter('aliado_especifico', aliado)}
            />
          </div>

          {/* Gráfico Circular - 40% (2 columnas de 5) */}
          <div className="xl:col-span-2">
            <TopProductosWidget 
              filtros={filtrosCombinados}
              forceRefresh={forceRefresh}
              onGrupoClick={(gpo) => handleInteractiveFilter('gpo', gpo)}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default VentasConsolidadoGeneral
