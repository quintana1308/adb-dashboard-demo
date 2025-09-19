import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  RefreshCw, 
  Calendar,
  Filter,
  Users,
  FilterX,
  Maximize,
  MapPin,
  Building,
  Package,
  ChevronDown,
  ChevronUp,
  Search,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import ActivacionDataTableWidget from './widgets/ActivacionDataTableWidget'
import ActivacionExcelExportButton from './ActivacionExcelExportButton'
import DashboardHeader from './DashboardHeader'

const ActivacionAliadosSku = () => {
  const navigate = useNavigate()
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [filtrosData, setFiltrosData] = useState({
    meses: [],
    regiones: [],
    estados: [],
    aliados: [],
    sucursales: [],
    skus: []
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    mes: 'All',
    region: 'All',
    estado: 'All',
    aliado: 'All',
    sucursal: 'All',
    sku: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)
  const [skuSearchTerm, setSkuSearchTerm] = useState('')
  const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false)
  const skuDropdownRef = useRef(null)

  useEffect(() => {
    fetchFiltros()
  }, [])

  const fetchFiltros = async (aliadoSeleccionado = null, sucursalSeleccionada = null) => {
    setLoading(true)
    try {
      
      // Usar función RPC específica para SKU que maneja filtros dependientes
      // incluyendo SKUs dinámicos por sucursal
      const { data: filtrosResult, error } = await supabase.rpc('get_filtros_activacion_sku_v2', {
        p_aliado: aliadoSeleccionado,
        p_sucursal: sucursalSeleccionada
      })

      if (error) {
        console.error('Error en RPC get_filtros_activacion_sku_v2:', error)
        throw error
      }

      // Procesar los resultados de la función RPC
      const filtrosMap = {}
      filtrosResult?.forEach(row => {
        filtrosMap[row.campo] = row.valores || []
      })

      setFiltrosData({
        meses: filtrosMap.mes || [],
        regiones: filtrosMap.region || [],
        estados: filtrosMap.estado || [],
        aliados: filtrosMap.aliado || [],
        sucursales: filtrosMap.sucursal || [],
        skus: filtrosMap.sku || []
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

  const handleFiltroChange = async (tipo, valor) => {
    setFiltrosSeleccionados(prev => ({
      ...prev,
      [tipo]: valor
    }))

    // Si se cambió el aliado, actualizar las sucursales y SKUs disponibles
    if (tipo === 'aliado') {
      // Resetear sucursal y SKU cuando cambie el aliado
      setFiltrosSeleccionados(prev => ({
        ...prev,
        aliado: valor,
        sucursal: 'All',
        sku: 'All'
      }))
      
      // Recargar filtros con el nuevo aliado seleccionado
      const aliadoParaFiltro = valor === 'All' ? null : valor
      await fetchFiltros(aliadoParaFiltro, null)
    }

    // Si se cambió la sucursal, actualizar los SKUs disponibles
    if (tipo === 'sucursal') {
      // Resetear SKU cuando cambie la sucursal
      setFiltrosSeleccionados(prev => ({
        ...prev,
        sucursal: valor,
        sku: 'All'
      }))
      
      // Recargar filtros con la nueva sucursal seleccionada
      const aliadoParaFiltro = filtrosSeleccionados.aliado === 'All' ? null : filtrosSeleccionados.aliado
      const sucursalParaFiltro = valor === 'All' ? null : valor
      await fetchFiltros(aliadoParaFiltro, sucursalParaFiltro)
    }
  }

  const limpiarFiltros = async () => {
    setFiltrosSeleccionados({
      mes: 'All',
      region: 'All',
      estado: 'All',
      aliado: 'All',
      sucursal: 'All',
      sku: 'All'
    })
    setSkuSearchTerm('')
    setIsSkuDropdownOpen(false)
    // Recargar filtros sin aliado ni sucursal específicos para mostrar todos
    await fetchFiltros(null, null)
  }

  // Filtrar SKUs basado en el término de búsqueda
  const filteredSkus = filtrosData.skus?.filter(sku => 
    sku.toLowerCase().includes(skuSearchTerm.toLowerCase())
  ) || []

  // Manejar selección de SKU
  const handleSkuSelect = (sku) => {
    handleFiltroChange('sku', sku)
    setSkuSearchTerm('')
    setIsSkuDropdownOpen(false)
  }

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (skuDropdownRef.current && !skuDropdownRef.current.contains(event.target)) {
        setIsSkuDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Activación - Aliados SKU">
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
            className="text-white border-b-2 border-white pb-1 font-semibold"
          >
            Aliados - SKU
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
            }}
            defaultValue="sku"
          >
            <option value="departamentos" className="text-black">Aliados - Departamentos</option>
            <option value="grupos" className="text-black">Aliados - Grupos</option>
            <option value="marcas" className="text-black">Aliados - Marcas</option>
            <option value="sku" className="text-black">Aliados - SKU</option>
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
            <ActivacionExcelExportButton
              filtros={filtrosSeleccionados}
              rpcFunction="get_act_aliados_sku_v2"
              columns={[
                { key: 'sucursal', label: 'SUCURSAL' },
                { key: 'estado', label: 'ESTADO' },
                { key: 'sku', label: 'SKU' },
                { key: 'mes', label: 'MES' },
                { key: 'a2024', label: 'A2024', align: 'right' },
                { key: 'c2024', label: 'C2024', align: 'right' },
                { key: 'porcentaje_2024', label: '2024 (%)', align: 'right' },
                { key: 'a2025', label: 'A2025', align: 'right' },
                { key: 'c2025', label: 'C2025', align: 'right' },
                { key: 'porcentaje_2025', label: '2025 (%)', align: 'right' }
              ]}
              filename="activacion_aliados_sku"
              title="Reporte de Activación - Aliados SKU"
            />
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
                  {filtrosData.meses?.map(mes => (
                    <option key={mes} value={mes}>{mes}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Región */}
              <div className="flex items-center space-x-2 min-w-0">
                <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.region}
                  onChange={(e) => handleFiltroChange('region', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Región</option>
                  {filtrosData.regiones?.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Estado */}
              <div className="flex items-center space-x-2 min-w-0">
                <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.estado}
                  onChange={(e) => handleFiltroChange('estado', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Estado</option>
                  {filtrosData.estados?.map(estado => (
                    <option key={estado} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Aliado */}
              <div className="flex items-center space-x-2 min-w-0">
                <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.aliado}
                  onChange={(e) => handleFiltroChange('aliado', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Aliado</option>
                  {filtrosData.aliados?.map(aliado => (
                    <option key={aliado} value={aliado}>{aliado}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Sucursal */}
              <div className="flex items-center space-x-2 min-w-0">
                <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.sucursal}
                  onChange={(e) => handleFiltroChange('sucursal', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Sucursal</option>
                  {filtrosData.sucursales?.map(sucursal => (
                    <option key={sucursal} value={sucursal}>{sucursal}</option>
                  ))}
                </select>
              </div>

              {/* Filtro SKU con búsqueda */}
              <div className="flex items-center space-x-2 min-w-0 relative" ref={skuDropdownRef}>
                <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative min-w-0 flex-1 sm:flex-none sm:w-32 md:w-40">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between min-h-[32px]"
                    onClick={() => setIsSkuDropdownOpen(!isSkuDropdownOpen)}
                  >
                    <span className="truncate">
                      {filtrosSeleccionados.sku === 'All' ? 'SKU' : filtrosSeleccionados.sku}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isSkuDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isSkuDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-64 overflow-hidden">
                      {/* Campo de búsqueda */}
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar SKU..."
                            value={skuSearchTerm}
                            onChange={(e) => setSkuSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {skuSearchTerm && (
                            <button
                              onClick={() => setSkuSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Lista de opciones */}
                      <div className="max-h-48 overflow-y-auto">
                        <div 
                          className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => handleSkuSelect('All')}
                        >
                          <span className="font-medium text-gray-500">Todos los SKUs</span>
                        </div>
                        
                        {filteredSkus.length > 0 ? (
                          filteredSkus.map(sku => (
                            <div
                              key={sku}
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleSkuSelect(sku)}
                            >
                              {sku}
                            </div>
                          ))
                        ) : skuSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron SKUs que coincidan con "{skuSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay SKUs disponibles
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
              <ActivacionExcelExportButton
                filtros={filtrosSeleccionados}
                rpcFunction="get_act_aliados_sku_v2"
                columns={[
                  { key: 'sucursal', label: 'SUCURSAL' },
                  { key: 'estado', label: 'ESTADO' },
                  { key: 'sku', label: 'SKU' },
                  { key: 'mes', label: 'MES' },
                  { key: 'a2024', label: 'A2024', align: 'right' },
                  { key: 'c2024', label: 'C2024', align: 'right' },
                  { key: 'porcentaje_2024', label: '2024 (%)', align: 'right' },
                  { key: 'a2025', label: 'A2025', align: 'right' },
                  { key: 'c2025', label: 'C2025', align: 'right' },
                  { key: 'porcentaje_2025', label: '2025 (%)', align: 'right' }
                ]}
                filename="activacion_aliados_sku"
                title="Reporte de Activación - Aliados SKU"
              />
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
            Activación - Aliados SKU
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <ActivacionDataTableWidget 
            ref={widgetRef}
            filtros={filtrosSeleccionados}
            tipo="sku"
            rpcFunction="get_act_aliados_sku_v2"
            columns={[
              { key: 'sucursal', label: 'SUCURSAL', sortable: true, width: '250px' },
              { key: 'estado', label: 'ESTADO', sortable: true },
              { key: 'sku', label: 'SKU', sortable: true },
              { key: 'mes', label: 'MES', sortable: true },
              { key: 'a2024', label: 'A2024', sortable: true, align: 'right' },
              { key: 'c2024', label: 'C2024', sortable: true, align: 'right' },
              { key: 'porcentaje_2024', label: '2024 (%)', sortable: true, align: 'right' },
              { key: 'a2025', label: 'A2025', sortable: true, align: 'right' },
              { key: 'c2025', label: 'C2025', sortable: true, align: 'right' },
              { key: 'porcentaje_2025', label: '2025 (%)', sortable: true, align: 'right' }
            ]}
          />
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default ActivacionAliadosSku
