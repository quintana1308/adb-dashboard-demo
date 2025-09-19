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
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import ActivacionDataTableWidget from './widgets/ActivacionDataTableWidget'
import ActivacionExcelExportButton from './ActivacionExcelExportButton'
import DashboardHeader from './DashboardHeader'

const ActivacionAliadosMarcas = () => {
  const navigate = useNavigate()
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [filtrosData, setFiltrosData] = useState({
    meses: [],
    regiones: [],
    estados: [],
    aliados: [],
    sucursales: []
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    mes: 'All',
    region: 'All',
    estado: 'All',
    aliado: 'All',
    sucursal: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)

  useEffect(() => {
    fetchFiltros()
  }, [])

  const fetchFiltros = async (aliadoSeleccionado = null) => {
    setLoading(true)
    try {
      
      // Usar función RPC optimizada para obtener filtros únicos
      // La función RPC v2 permite filtrar sucursales por aliado
      const { data: filtrosResult, error } = await supabase.rpc('get_filtros_activacion_v2', {
        p_tipo: 'MAR',
        p_aliado: aliadoSeleccionado
      })

      if (error) {
        console.error('Error en RPC get_filtros_activacion_v2:', error)
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
        sucursales: filtrosMap.sucursal || []
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

    // Si se cambió el aliado, actualizar las sucursales disponibles
    if (tipo === 'aliado') {
      // Resetear sucursal cuando cambie el aliado
      setFiltrosSeleccionados(prev => ({
        ...prev,
        aliado: valor,
        sucursal: 'All'
      }))
      
      // Recargar filtros con el nuevo aliado seleccionado
      const aliadoParaFiltro = valor === 'All' ? null : valor
      await fetchFiltros(aliadoParaFiltro)
    }
  }

  const limpiarFiltros = async () => {
    setFiltrosSeleccionados({
      mes: 'All',
      region: 'All',
      estado: 'All',
      aliado: 'All',
      sucursal: 'All'
    })
    // Recargar filtros sin aliado específico para mostrar todas las sucursales
    await fetchFiltros(null)
  }

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
      <DashboardHeader title="Activación - Aliados Marcas">
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
            className="text-white border-b-2 border-white pb-1 font-semibold"
          >
            Aliados - Marcas
          </button>
          <button 
            className="text-white/80 hover:text-white transition-colors"
            onClick={() => navigate('/dashboard/activacion/sku')}
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
              else if (value === 'sku') navigate('/dashboard/activacion/sku')
            }}
            defaultValue="marcas"
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
              rpcFunction="get_act_aliados_marcas_v2"
              columns={[
                { key: 'sucursal', label: 'SUCURSAL' },
                { key: 'estado', label: 'ESTADO' },
                { key: 'marca', label: 'MARCA' },
                { key: 'mes', label: 'MES' },
                { key: 'a2024', label: 'A2024', align: 'right' },
                { key: 'c2024', label: 'C2024', align: 'right' },
                { key: 'porcentaje_2024', label: '2024 (%)', align: 'right' },
                { key: 'a2025', label: 'A2025', align: 'right' },
                { key: 'c2025', label: 'C2025', align: 'right' },
                { key: 'porcentaje_2025', label: '2025 (%)', align: 'right' }
              ]}
              filename="activacion_aliados_marcas"
              title="Reporte de Activación - Aliados Marcas"
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
            </div>

            {/* Iconos de acción en desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <ActivacionExcelExportButton
                filtros={filtrosSeleccionados}
                rpcFunction="get_act_aliados_marcas_v2"
                columns={[
                  { key: 'sucursal', label: 'SUCURSAL' },
                  { key: 'estado', label: 'ESTADO' },
                  { key: 'marca', label: 'MARCA' },
                  { key: 'mes', label: 'MES' },
                  { key: 'a2024', label: 'A2024', align: 'right' },
                  { key: 'c2024', label: 'C2024', align: 'right' },
                  { key: 'porcentaje_2024', label: '2024 (%)', align: 'right' },
                  { key: 'a2025', label: 'A2025', align: 'right' },
                  { key: 'c2025', label: 'C2025', align: 'right' },
                  { key: 'porcentaje_2025', label: '2025 (%)', align: 'right' }
                ]}
                filename="activacion_aliados_marcas"
                title="Reporte de Activación - Aliados Marcas"
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
            Activación - Aliados Marcas
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <ActivacionDataTableWidget 
            ref={widgetRef}
            filtros={filtrosSeleccionados}
            tipo="marcas"
            rpcFunction="get_act_aliados_marcas_v2"
            columns={[
              { key: 'sucursal', label: 'SUCURSAL', sortable: true, width: '250px' },
              { key: 'estado', label: 'ESTADO', sortable: true },
              { key: 'marca', label: 'MARCA', sortable: true },
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

export default ActivacionAliadosMarcas
