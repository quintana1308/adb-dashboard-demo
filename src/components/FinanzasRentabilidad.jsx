import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  RefreshCw,
  Calendar,
  Filter,
  Users,
  FilterX,
  Maximize,
  Search,
  X,
  Tag,
  Package,
  User,
  DollarSign
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import DashboardHeader from './DashboardHeader'
import FinanzasDataTableWidget from './widgets/FinanzasDataTableWidget'

const FinanzasRentabilidad = () => {
  const navigate = useNavigate()
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [filtrosData, setFiltrosData] = useState({
    anios: [],
    meses: [],
    clientes: [],
    vendedores: [],
    categorias: [],
    productos: []
  })
  const [totales, setTotales] = useState({ ventaBrutaTotal: 0, costoBrutoTotal: 0, utilidadPct: 0 })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    anio: 'All',
    mes: 'All',
    cliente: 'All',
    vendedor: 'All',
    categoria: 'All',
    producto: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)

  // Buscador del producto
  const [prodSearchTerm, setProdSearchTerm] = useState('')
  const [isProdDropdownOpen, setIsProdDropdownOpen] = useState(false)
  const prodDropdownRef = useRef(null)

  useEffect(() => {
    fetchFiltros()
  }, [])

  const fetchFiltros = async () => {
    if (loading) return // Prevenir llamados dobles
    setLoading(true)
    try {
      const { data: filtrosResult, error } = await supabase.rpc('get_filtros_rentabilidad_v2')
      
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
        clientes: filtrosMap.cliente || [],
        vendedores: filtrosMap.vendedor || [],
        categorias: filtrosMap.categoria || [],
        productos: filtrosMap.producto || []
      })

    } catch (error) {
      console.error('Error cargando filtros:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshAll = () => {
    fetchFiltros()
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

  const limpiarFiltros = async () => {
    setFiltrosSeleccionados({
      anio: 'All',
      mes: 'All',
      cliente: 'All',
      vendedor: 'All',
      categoria: 'All',
      producto: 'All'
    })
    setProdSearchTerm('')
    setIsProdDropdownOpen(false)
    await fetchFiltros()
  }

  // Filtrar productos basado en el término de búsqueda
  const filteredProductos = filtrosData.productos?.filter(p =>
    (p || '').toLowerCase().includes(prodSearchTerm.toLowerCase())
  ) || []

  // Manejar selección de producto
  const handleProductoSelect = (prod) => {
    handleFiltroChange('producto', prod)
    setProdSearchTerm('')
    setIsProdDropdownOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (prodDropdownRef.current && !prodDropdownRef.current.contains(event.target)) {
        setIsProdDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Finanzas - Rentabilidad">
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <button className="text-white border-b-2 border-white pb-1 font-semibold">
            Rentabilidad
          </button>
        </nav>
        {/* Menú móvil */}
        <div className="md:hidden">
          <select className="bg-transparent border border-white/30 rounded px-2 py-1 text-sm text-white" defaultValue="rentabilidad">
            <option value="rentabilidad" className="text-black">Rentabilidad</option>
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
              {/* Simple chevron icon using plus/minus as visual cue */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-3 mt-3 md:mt-0">
              {/* Año */}
              <div className="flex items-center space-x-2 min-w-0">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.anio}
                  onChange={(e) => handleFiltroChange('anio', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-24"
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
              {/* Cliente */}
              <div className="flex items-center space-x-2 min-w-0">
                <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.cliente}
                  onChange={(e) => handleFiltroChange('cliente', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-32"
                  disabled={loading}
                >
                  <option value="All">Cliente</option>
                  {filtrosData.clientes?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {/* Vendedor */}
              <div className="flex items-center space-x-2 min-w-0">
                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.vendedor}
                  onChange={(e) => handleFiltroChange('vendedor', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-32"
                  disabled={loading}
                >
                  <option value="All">Vendedor</option>
                  {filtrosData.vendedores?.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              {/* Categoria */}
              <div className="flex items-center space-x-2 min-w-0">
                <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.categoria}
                  onChange={(e) => handleFiltroChange('categoria', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-32"
                  disabled={loading}
                >
                  <option value="All">Categoría</option>
                  {filtrosData.categorias?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {/* Producto con buscador */}
              <div className="flex items-center space-x-2 min-w-0 relative" ref={prodDropdownRef}>
                <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative min-w-0 flex-1 sm:flex-none sm:w-40 md:w-48">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between min-h-[32px]"
                    onClick={() => setIsProdDropdownOpen(!isProdDropdownOpen)}
                  >
                    <span className="truncate">
                      {filtrosSeleccionados.producto === 'All' ? 'Producto' : filtrosSeleccionados.producto}
                    </span>
                    <span className={`w-3 h-3 text-gray-500 ${isProdDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                  {isProdDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={prodSearchTerm}
                            onChange={(e) => setProdSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {prodSearchTerm && (
                            <button
                              onClick={() => setProdSearchTerm('')}
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
                          onClick={() => handleProductoSelect('All')}
                        >
                          <span className="font-medium text-gray-500">Todos los productos</span>
                        </div>
                        {filteredProductos.length > 0 ? (
                          filteredProductos.map(p => (
                            <div key={p} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer" onClick={() => handleProductoSelect(p)}>
                              {p}
                            </div>
                          ))
                        ) : prodSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron productos que coincidan con "{prodSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay productos disponibles
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
            Finanzas - Rentabilidad
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tabla (ocupa 4 columnas en desktop) */}
          <div className="lg:col-span-4">
            <FinanzasDataTableWidget
              ref={widgetRef}
              filtros={filtrosSeleccionados}
              rpcFunction="get_rentabilidad_v2"
              columns={[
                { key: 'anio', label: 'AÑO', sortable: true },
                { key: 'mes', label: 'MES', sortable: true },
                { key: 'cliente', label: 'CLIENTE', sortable: true },
                { key: 'vendedor', label: 'VENDEDOR', sortable: true },
                { key: 'categoria', label: 'CATEGORIA', sortable: true },
                { key: 'producto', label: 'PRODUCTO', sortable: true },
                { key: 'venta_bruta', label: 'VENTA BRUTA', sortable: true, align: 'right' },
                { key: 'costo_bruto', label: 'COSTO BRUTO', sortable: true, align: 'right' }
              ]}
              totalsRpcFunction="get_rentabilidad_totales_v2"
              onTotalsChange={(t) => setTotales(t)}
            />
          </div>

          {/* Métricas a la derecha (más compactas) */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Venta Bruta Total</div>
                  <div id="ventaBrutaTotal" className="text-lg font-bold text-gray-900">
                    {totales.ventaBrutaTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Costo Bruto Total</div>
                  <div id="costoBrutoTotal" className="text-lg font-bold text-gray-900">
                    {totales.costoBrutoTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Utilidad (%)</div>
                  <div id="utilidadPct" className="text-lg font-bold text-gray-900">
                    {totales.utilidadPct.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
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

export default FinanzasRentabilidad
