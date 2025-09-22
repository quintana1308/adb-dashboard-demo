import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  RefreshCw,
  Calendar,
  Filter,
  FilterX,
  Maximize,
  Search,
  X,
  Tag,
  Building,
  Hash,
  FileText,
  DollarSign
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import DashboardHeader from './DashboardHeader'
import FinanzasDataTableWidget from './widgets/FinanzasDataTableWidget'

const FinanzasEgresos = () => {
  const navigate = useNavigate()
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [filtrosData, setFiltrosData] = useState({
    anios: [],
    meses: [],
    dias: [],
    clasificaciones: [],
    cuentas: [],
    centrosdecosto: [],
    nivelescuenta: []
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    anio: 'All',
    mes: 'All',
    dia: 'All',
    clasificacion: 'All',
    cuenta: 'All',
    centrodecosto: 'All',
    nivelcuenta: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)
  const [totalGastosGenerales, setTotalGastosGenerales] = useState(0)

  // Buscador de cuenta
  const [cuentaSearchTerm, setCuentaSearchTerm] = useState('')
  const [isCuentaDropdownOpen, setIsCuentaDropdownOpen] = useState(false)
  const cuentaDropdownRef = useRef(null)

  useEffect(() => {
    fetchFiltros()
  }, [])

  // Calcular total cuando cambien los filtros
  useEffect(() => {
    fetchTotalGastosGenerales()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtrosSeleccionados])

  const fetchFiltros = async () => {
    if (loading) return // Prevenir llamados dobles
    setLoading(true)
    try {
      const { data: filtrosResult, error } = await supabase.rpc('get_filtros_egresos_v2')
      
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
        anios: filtrosMap.anio || [],
        meses: filtrosMap.mes || [],
        dias: filtrosMap.dia || [],
        clasificaciones: filtrosMap.clasificacion || [],
        cuentas: filtrosMap.cuenta || [],
        centrosdecosto: filtrosMap.centrodecosto || [],
        nivelescuenta: filtrosMap.nivelcuenta || []
      })

    } catch (error) {
      console.error('Error cargando filtros:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAll = () => {
    fetchFiltros()
    fetchTotalGastosGenerales()
    if (widgetRef.current?.refreshData) {
      widgetRef.current.refreshData()
    }
  }

  const handleFiltroChange = async (tipo, valor) => {
    setFiltrosSeleccionados(prev => ({
      ...prev,
      [tipo]: valor
    }))
  }

  // Función para obtener el total real de gastos generales
  const fetchTotalGastosGenerales = async () => {
    try {
      const params = {}
      
      // Aplicar los mismos filtros que en la tabla (solo los que existen en la tabla EGRESOS)
      if (filtrosSeleccionados.anio !== 'All') params.p_anio = filtrosSeleccionados.anio
      if (filtrosSeleccionados.mes !== 'All') params.p_mes = filtrosSeleccionados.mes
      if (filtrosSeleccionados.dia !== 'All') params.p_dia = filtrosSeleccionados.dia
      if (filtrosSeleccionados.clasificacion !== 'All') params.p_clasificacion = filtrosSeleccionados.clasificacion
      if (filtrosSeleccionados.cuenta !== 'All') params.p_cuenta = filtrosSeleccionados.cuenta
      if (filtrosSeleccionados.centrodecosto !== 'All') params.p_centrodecosto = filtrosSeleccionados.centrodecosto
      // Nota: nivelcuenta no existe en la tabla EGRESOS, se omite

      console.log('Fetching total with params:', params)
      
      const { data: result, error } = await supabase.rpc('get_egresos_total_v3', params)
      
      if (error) {
        console.error('Error fetching total:', error)
        return
      }

      const total = result?.[0]?.total_gastos_generales || 0
      console.log('Total fetched:', total)
      setTotalGastosGenerales(total)
      
    } catch (error) {
      console.error('Error calculating total:', error)
    }
  }

  // Función para actualizar el total desde el widget (ya no se usa)
  const handleTotalUpdate = (total) => {
    // Esta función ya no se usa, el total se calcula con RPC
    console.log('Widget total (ignored):', total)
  }

  // Formatear número como moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0)
  }

  const limpiarFiltros = async () => {
    setFiltrosSeleccionados({
      anio: 'All',
      mes: 'All',
      dia: 'All',
      clasificacion: 'All',
      cuenta: 'All',
      centrodecosto: 'All',
      nivelcuenta: 'All'
    })
    setCuentaSearchTerm('')
    setIsCuentaDropdownOpen(false)
    await fetchFiltros()
    fetchTotalGastosGenerales()
  }

  // Filtrar cuentas basado en el término de búsqueda
  const filteredCuentas = filtrosData.cuentas?.filter(c =>
    (c || '').toLowerCase().includes(cuentaSearchTerm.toLowerCase())
  ) || []

  // Manejar selección de cuenta
  const handleCuentaSelect = (cuenta) => {
    handleFiltroChange('cuenta', cuenta)
    setCuentaSearchTerm('')
    setIsCuentaDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cuentaDropdownRef.current && !cuentaDropdownRef.current.contains(event.target)) {
        setIsCuentaDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Egresos Operativos">
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <button className="text-white border-b-2 border-white pb-1 font-semibold">
            Egresos Operativos
          </button>
        </nav>
        {/* Menú móvil */}
        <div className="md:hidden">
          <select className="bg-transparent border border-white/30 rounded px-2 py-1 text-sm text-white" defaultValue="egresos">
            <option value="egresos" className="text-black">Egresos Operativos</option>
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
              {filtrosColapsados ? <span className="text-gray-600">▼</span> : <span className="text-gray-600">▲</span>}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button onClick={refreshAll} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refrescar" style={{ color: '#3b82f6' }}>
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

        {/* Filtros en desktop */}
        <div className={`${filtrosColapsados ? 'hidden' : 'block'} md:block`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3 sm:gap-4 md:gap-3 mt-3 md:mt-0">
              {/* Año */}
              <div className="flex items-center space-x-2 min-w-0">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.anio}
                  onChange={(e) => handleFiltroChange('anio', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20"
                  disabled={loading}
                >
                  <option value="All">Año</option>
                  {filtrosData.anios?.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              {/* Mes */}
              <div className="flex items-center space-x-2 min-w-0">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.mes}
                  onChange={(e) => handleFiltroChange('mes', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-24"
                  disabled={loading}
                >
                  <option value="All">Mes</option>
                  {filtrosData.meses?.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Día */}
              <div className="flex items-center space-x-2 min-w-0">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.dia}
                  onChange={(e) => handleFiltroChange('dia', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-24"
                  disabled={loading}
                >
                  <option value="All">Día</option>
                  {filtrosData.dias?.map(d => (
                    <option key={d} value={d}>{new Date(d).toLocaleDateString()}</option>
                  ))}
                </select>
              </div>

              {/* Clasificación */}
              <div className="flex items-center space-x-2 min-w-0">
                <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.clasificacion}
                  onChange={(e) => handleFiltroChange('clasificacion', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-32"
                  disabled={loading}
                >
                  <option value="All">Clasificación</option>
                  {filtrosData.clasificaciones?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Cuenta con buscador */}
              <div className="flex items-center space-x-2 min-w-0 relative" ref={cuentaDropdownRef}>
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative min-w-0 flex-1 sm:flex-none sm:w-40 md:w-48">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between min-h-[32px]"
                    onClick={() => setIsCuentaDropdownOpen(!isCuentaDropdownOpen)}
                  >
                    <span className="truncate">
                      {filtrosSeleccionados.cuenta === 'All' ? 'Cuenta' : filtrosSeleccionados.cuenta}
                    </span>
                    <span className={`w-3 h-3 text-gray-500 ${isCuentaDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                  {isCuentaDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar cuenta..."
                            value={cuentaSearchTerm}
                            onChange={(e) => setCuentaSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {cuentaSearchTerm && (
                            <button
                              onClick={() => setCuentaSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        <div 
                          className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                          onClick={() => handleCuentaSelect('All')}
                        >
                          <span className="font-medium text-gray-500">Todas las cuentas</span>
                        </div>
                        {filteredCuentas.length > 0 ? (
                          filteredCuentas.map(c => (
                            <div key={c} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer" onClick={() => handleCuentaSelect(c)}>
                              {c}
                            </div>
                          ))
                        ) : cuentaSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron cuentas que coincidan con "{cuentaSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay cuentas disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Centro de Costo */}
              <div className="flex items-center space-x-2 min-w-0">
                <Building className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.centrodecosto}
                  onChange={(e) => handleFiltroChange('centrodecosto', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-32"
                  disabled={loading}
                >
                  <option value="All">Centro Costo</option>
                  {filtrosData.centrosdecosto?.map(cc => (
                    <option key={cc} value={cc}>{cc}</option>
                  ))}
                </select>
              </div>

              {/* Nivel de Cuenta */}
              <div className="flex items-center space-x-2 min-w-0">
                <Hash className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.nivelcuenta}
                  onChange={(e) => handleFiltroChange('nivelcuenta', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-24"
                  disabled={loading}
                >
                  <option value="All">Nivel</option>
                  {filtrosData.nivelescuenta?.map(nc => (
                    <option key={nc} value={nc}>{nc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Iconos de acción en desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <button onClick={refreshAll} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Refrescar" style={{ color: '#3b82f6' }}>
                <RefreshCw className="w-5 h-5" />
              </button>
              <button onClick={limpiarFiltros} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Limpiar filtros" style={{ color: '#3b82f6' }}>
                <FilterX className="w-5 h-5" />
              </button>
              <button onClick={() => document.documentElement.requestFullscreen()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Pantalla completa" style={{ color: '#3b82f6' }}>
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="p-4 sm:p-6 flex-1">
        <div className="lg:hidden mb-6">
          <h1 
            className="font-bold text-gray-900 text-2xl border-l-4 pl-4 py-2" 
            style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '700', borderLeftColor: '#1aa31b' }}
          >
            Egresos Operativos
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tabla (ocupa 4 columnas en desktop) */}
          <div className="lg:col-span-4">
            <FinanzasDataTableWidget
              ref={widgetRef}
              filtros={filtrosSeleccionados}
              rpcFunction="get_egresos_v2"
              onTotalUpdate={handleTotalUpdate}
              columns={[
                { key: 'anio', label: 'AÑO', sortable: true },
                { key: 'mes', label: 'MES', sortable: true },
                { key: 'dia', label: 'DÍA', sortable: true },
                { key: 'gastosgenerales', label: 'GASTOS GENERALES', sortable: true, align: 'right' },
                { key: 'clasificacion', label: 'CLASIFICACIÓN', sortable: true },
                { key: 'cuentacodigo', label: 'CÓDIGO CUENTA', sortable: true },
                { key: 'cuenta', label: 'CUENTA', sortable: true },
                { key: 'centrodecosto', label: 'CENTRO DE COSTO', sortable: true },
                { key: 'descripcion', label: 'DESCRIPCIÓN', sortable: true },
                { key: 'comprobante', label: 'COMPROBANTE', sortable: true, align: 'right' },
                { key: 'tipo', label: 'TIPO', sortable: true },
                { key: 'documento', label: 'DOCUMENTO', sortable: true },
                { key: 'fechadocumento', label: 'FECHA DOCUMENTO', sortable: true }
              ]}
            />
          </div>

          {/* Métricas a la derecha (más compactas) */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Gastos Generales Total</div>
                  <div id="gastosGeneralesTotal" className="text-lg font-bold text-gray-900">
                    {formatCurrency(totalGastosGenerales)}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default FinanzasEgresos
