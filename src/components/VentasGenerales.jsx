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
  DollarSign,
  Hash,
  Weight,
  Box,
  TrendingUp
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import DashboardHeader from './DashboardHeader'
import VentasNavMenu from './VentasNavMenu'
import FinanzasDataTableWidget from './widgets/FinanzasDataTableWidget'

const VentasGenerales = () => {
  const navigate = useNavigate()
  const widgetRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [filtrosData, setFiltrosData] = useState({
    anios: [],
    meses: [],
    dias: [],
    clientes: [],
    vendedores: [],
    productoids: [],
    productos: [],
    categorias: []
  })
  const [totales, setTotales] = useState({ 
    ventasUnidadesTotal: 0, 
    ventasKilosTotal: 0, 
    ventasCajasTotal: 0, 
    ventasUsdTotal: 0, 
    tonelajeTotal: 0 
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    anio: 'All',
    mes: 'All',
    dia: 'All',
    cliente: 'All',
    vendedor: 'All',
    productoid: 'All',
    producto: 'All',
    categoria: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)

  // Buscador del producto
  const [prodSearchTerm, setProdSearchTerm] = useState('')
  const [isProdDropdownOpen, setIsProdDropdownOpen] = useState(false)
  const prodDropdownRef = useRef(null)
  
  // Estados para otros dropdowns con buscador
  const [clienteSearchTerm, setClienteSearchTerm] = useState('')
  const [isClienteDropdownOpen, setIsClienteDropdownOpen] = useState(false)
  const clienteDropdownRef = useRef(null)
  
  const [vendedorSearchTerm, setVendedorSearchTerm] = useState('')
  const [isVendedorDropdownOpen, setIsVendedorDropdownOpen] = useState(false)
  const vendedorDropdownRef = useRef(null)
  
  const [productoidSearchTerm, setProductoidSearchTerm] = useState('')
  const [isProductoidDropdownOpen, setIsProductoidDropdownOpen] = useState(false)
  const productoidDropdownRef = useRef(null)
  
  const [categoriaSearchTerm, setCategoriaSearchTerm] = useState('')
  const [isCategoriaDropdownOpen, setIsCategoriaDropdownOpen] = useState(false)
  const categoriaDropdownRef = useRef(null)

  useEffect(() => {
    fetchFiltros()
  }, [])

  const fetchFiltros = async () => {
    if (loading) return // Prevenir llamados dobles
    setLoading(true)
    try {
      const { data: filtrosResult, error } = await supabase.rpc('get_filtros_ventas_generales')
      
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
        clientes: filtrosMap.cliente || [],
        vendedores: filtrosMap.vendedor || [],
        productoids: filtrosMap.productoid || [],
        productos: filtrosMap.producto || [],
        categorias: filtrosMap.categoria || []
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
      dia: 'All',
      cliente: 'All',
      vendedor: 'All',
      productoid: 'All',
      producto: 'All',
      categoria: 'All'
    })
    setProdSearchTerm('')
    setIsProdDropdownOpen(false)
    setClienteSearchTerm('')
    setIsClienteDropdownOpen(false)
    setVendedorSearchTerm('')
    setIsVendedorDropdownOpen(false)
    setProductoidSearchTerm('')
    setIsProductoidDropdownOpen(false)
    setCategoriaSearchTerm('')
    setIsCategoriaDropdownOpen(false)
    await fetchFiltros()
  }

  // Filtrar productos basado en el término de búsqueda
  const filteredProductos = filtrosData.productos?.filter(p =>
    (p || '').toLowerCase().includes(prodSearchTerm.toLowerCase())
  ) || []

  // Filtrar clientes basado en el término de búsqueda
  const filteredClientes = filtrosData.clientes?.filter(c =>
    (c || '').toLowerCase().includes(clienteSearchTerm.toLowerCase())
  ) || []

  // Filtrar vendedores basado en el término de búsqueda
  const filteredVendedores = filtrosData.vendedores?.filter(v =>
    (v || '').toLowerCase().includes(vendedorSearchTerm.toLowerCase())
  ) || []

  // Filtrar productoids basado en el término de búsqueda
  const filteredProductoids = filtrosData.productoids?.filter(pid =>
    (pid || '').toLowerCase().includes(productoidSearchTerm.toLowerCase())
  ) || []

  // Filtrar categorias basado en el término de búsqueda
  const filteredCategorias = filtrosData.categorias?.filter(cat =>
    (cat || '').toLowerCase().includes(categoriaSearchTerm.toLowerCase())
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
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(event.target)) {
        setIsClienteDropdownOpen(false)
      }
      if (vendedorDropdownRef.current && !vendedorDropdownRef.current.contains(event.target)) {
        setIsVendedorDropdownOpen(false)
      }
      if (productoidDropdownRef.current && !productoidDropdownRef.current.contains(event.target)) {
        setIsProductoidDropdownOpen(false)
      }
      if (categoriaDropdownRef.current && !categoriaDropdownRef.current.contains(event.target)) {
        setIsCategoriaDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Ventas - Ventas Generales">
        <VentasNavMenu currentPage="ventas-generales" />
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
            <div className="flex flex-wrap items-center gap-3 mt-3 md:mt-0 w-full">
              {/* Año */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.anio}
                  onChange={(e) => handleFiltroChange('anio', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none w-20"
                  disabled={loading}
                >
                  <option value="All">Año</option>
                  {filtrosData.anios?.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              {/* Mes */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.mes}
                  onChange={(e) => handleFiltroChange('mes', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none w-20"
                  disabled={loading}
                >
                  <option value="All">Mes</option>
                  {filtrosData.meses?.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              {/* Día */}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.dia}
                  onChange={(e) => handleFiltroChange('dia', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none w-24"
                  disabled={loading}
                >
                  <option value="All">Día</option>
                  {filtrosData.dias?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              {/* Cliente con buscador */}
              <div className="flex items-center space-x-2 relative" ref={clienteDropdownRef}>
                <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between appearance-none w-32"
                    onClick={() => setIsClienteDropdownOpen(!isClienteDropdownOpen)}
                    style={{ height: '32px' }}
                  >
                    <span className="truncate text-sm">
                      {filtrosSeleccionados.cliente === 'All' ? 'Cliente' : filtrosSeleccionados.cliente}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isClienteDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isClienteDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar cliente..."
                            value={clienteSearchTerm}
                            onChange={(e) => setClienteSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {clienteSearchTerm && (
                            <button
                              onClick={() => setClienteSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredClientes.length > 0 ? (
                          <>
                            <div 
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                handleFiltroChange('cliente', 'All')
                                setIsClienteDropdownOpen(false)
                                setClienteSearchTerm('')
                              }}
                            >
                              <span className="font-medium text-gray-900">Todos los clientes</span>
                            </div>
                            {filteredClientes.map(cliente => (
                              <div 
                                key={cliente}
                                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  handleFiltroChange('cliente', cliente)
                                  setIsClienteDropdownOpen(false)
                                  setClienteSearchTerm('')
                                }}
                              >
                                {cliente}
                              </div>
                            ))}
                          </>
                        ) : clienteSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron clientes que coincidan con "{clienteSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay clientes disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Vendedor con buscador */}
              <div className="flex items-center space-x-2 relative" ref={vendedorDropdownRef}>
                <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between appearance-none w-32"
                    onClick={() => setIsVendedorDropdownOpen(!isVendedorDropdownOpen)}
                    style={{ height: '32px' }}
                  >
                    <span className="truncate text-sm">
                      {filtrosSeleccionados.vendedor === 'All' ? 'Vendedor' : filtrosSeleccionados.vendedor}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isVendedorDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isVendedorDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar vendedor..."
                            value={vendedorSearchTerm}
                            onChange={(e) => setVendedorSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {vendedorSearchTerm && (
                            <button
                              onClick={() => setVendedorSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredVendedores.length > 0 ? (
                          <>
                            <div 
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                handleFiltroChange('vendedor', 'All')
                                setIsVendedorDropdownOpen(false)
                                setVendedorSearchTerm('')
                              }}
                            >
                              <span className="font-medium text-gray-900">Todos los vendedores</span>
                            </div>
                            {filteredVendedores.map(vendedor => (
                              <div 
                                key={vendedor}
                                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  handleFiltroChange('vendedor', vendedor)
                                  setIsVendedorDropdownOpen(false)
                                  setVendedorSearchTerm('')
                                }}
                              >
                                {vendedor}
                              </div>
                            ))}
                          </>
                        ) : vendedorSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron vendedores que coincidan con "{vendedorSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay vendedores disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* ProductoID con buscador */}
              <div className="flex items-center space-x-2 relative" ref={productoidDropdownRef}>
                <Hash className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between appearance-none w-28"
                    onClick={() => setIsProductoidDropdownOpen(!isProductoidDropdownOpen)}
                    style={{ height: '32px' }}
                  >
                    <span className="truncate text-sm">
                      {filtrosSeleccionados.productoid === 'All' ? 'Producto ID' : filtrosSeleccionados.productoid}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isProductoidDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isProductoidDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar código..."
                            value={productoidSearchTerm}
                            onChange={(e) => setProductoidSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {productoidSearchTerm && (
                            <button
                              onClick={() => setProductoidSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredProductoids.length > 0 ? (
                          <>
                            <div 
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                handleFiltroChange('productoid', 'All')
                                setIsProductoidDropdownOpen(false)
                                setProductoidSearchTerm('')
                              }}
                            >
                              <span className="font-medium text-gray-900">Todos los códigos</span>
                            </div>
                            {filteredProductoids.map(productoid => (
                              <div 
                                key={productoid}
                                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  handleFiltroChange('productoid', productoid)
                                  setIsProductoidDropdownOpen(false)
                                  setProductoidSearchTerm('')
                                }}
                              >
                                {productoid}
                              </div>
                            ))}
                          </>
                        ) : productoidSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron códigos que coincidan con "{productoidSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay códigos disponibles
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Producto con buscador */}
              <div className="flex items-center space-x-2 relative" ref={prodDropdownRef}>
                <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between appearance-none w-40"
                    onClick={() => setIsProdDropdownOpen(!isProdDropdownOpen)}
                    style={{ height: '32px' }}
                  >
                    <span className="truncate text-sm">
                      {filtrosSeleccionados.producto === 'All' ? 'Producto' : filtrosSeleccionados.producto}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isProdDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isProdDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-64 overflow-hidden">
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
                        {filteredProductos.length > 0 ? (
                          <>
                            <div 
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                handleFiltroChange('producto', 'All')
                                setIsProdDropdownOpen(false)
                                setProdSearchTerm('')
                              }}
                            >
                              <span className="font-medium text-gray-900">Todos los productos</span>
                            </div>
                            {filteredProductos.map(prod => (
                              <div 
                                key={prod}
                                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  handleFiltroChange('producto', prod)
                                  setIsProdDropdownOpen(false)
                                  setProdSearchTerm('')
                                }}
                              >
                                {prod}
                              </div>
                            ))}
                          </>
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
              {/* Categoria con buscador */}
              <div className="flex items-center space-x-2 relative" ref={categoriaDropdownRef}>
                <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="relative">
                  <div 
                    className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 cursor-pointer flex items-center justify-between appearance-none w-32"
                    onClick={() => setIsCategoriaDropdownOpen(!isCategoriaDropdownOpen)}
                    style={{ height: '32px' }}
                  >
                    <span className="truncate text-sm">
                      {filtrosSeleccionados.categoria === 'All' ? 'Categoría' : filtrosSeleccionados.categoria}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isCategoriaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {isCategoriaDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-[60] max-h-64 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar categoría..."
                            value={categoriaSearchTerm}
                            onChange={(e) => setCategoriaSearchTerm(e.target.value)}
                            className="w-full pl-7 pr-7 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-gray-300"
                            autoFocus
                          />
                          {categoriaSearchTerm && (
                            <button
                              onClick={() => setCategoriaSearchTerm('')}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCategorias.length > 0 ? (
                          <>
                            <div 
                              className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                              onClick={() => {
                                handleFiltroChange('categoria', 'All')
                                setIsCategoriaDropdownOpen(false)
                                setCategoriaSearchTerm('')
                              }}
                            >
                              <span className="font-medium text-gray-900">Todas las categorías</span>
                            </div>
                            {filteredCategorias.map(categoria => (
                              <div 
                                key={categoria}
                                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer"
                                onClick={() => {
                                  handleFiltroChange('categoria', categoria)
                                  setIsCategoriaDropdownOpen(false)
                                  setCategoriaSearchTerm('')
                                }}
                              >
                                {categoria}
                              </div>
                            ))}
                          </>
                        ) : categoriaSearchTerm ? (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No se encontraron categorías que coincidan con "{categoriaSearchTerm}"
                          </div>
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500 italic">
                            No hay categorías disponibles
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
            style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '700', borderLeftColor: '#ec1e06' }}
          >
            Ventas - Ventas Generales
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tabla (ocupa 4 columnas en desktop) */}
          <div className="lg:col-span-4">
            <FinanzasDataTableWidget
              ref={widgetRef}
              filtros={filtrosSeleccionados}
              rpcFunction="get_ventas_generales"
              columns={[
                { key: 'anio', label: 'AÑO', sortable: true },
                { key: 'mes', label: 'MES', sortable: true },
                { key: 'dia', label: 'DÍA', sortable: true },
                { key: 'cliente', label: 'CLIENTE', sortable: true },
                { key: 'vendedor', label: 'VENDEDOR', sortable: true },
                { key: 'productoid', label: 'PRODUCTO ID', sortable: true },
                { key: 'producto', label: 'PRODUCTO', sortable: true },
                { key: 'categoria', label: 'CATEGORÍA', sortable: true },
                { key: 'ventas_unidades', label: 'UNIDADES', sortable: true, align: 'right' },
                { key: 'ventas_kilos', label: 'KILOS', sortable: true, align: 'right' },
                { key: 'ventas_cajas', label: 'CAJAS', sortable: true, align: 'right' },
                { key: 'ventas_usd', label: 'USD', sortable: true, align: 'right' },
                { key: 'tonelaje', label: 'TONELAJE', sortable: true, align: 'right' }
              ]}
              totalsRpcFunction="get_ventas_generales_totales"
              onTotalsChange={(t) => setTotales(t)}
              edgeFunctionName="get-ventas-generales"
              totalsEdgeFunctionName="get-ventas-generales-totales"
            />
          </div>

          {/* Métricas a la derecha (más compactas) */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Ventas Unidades</div>
                  <div id="ventasUnidadesTotal" className="text-lg font-bold text-gray-900">
                    {totales.ventasUnidadesTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Ventas Kilos</div>
                  <div id="ventasKilosTotal" className="text-lg font-bold text-gray-900">
                    {totales.ventasKilosTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center">
                  <Weight className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Ventas Cajas</div>
                  <div id="ventasCajasTotal" className="text-lg font-bold text-gray-900">
                    {totales.ventasCajasTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Box className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Ventas USD</div>
                  <div id="ventasUsdTotal" className="text-lg font-bold text-gray-900">
                    ${totales.ventasUsdTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Tonelaje Total</div>
                  <div id="tonelajeTotal" className="text-lg font-bold text-gray-900">
                    {totales.tonelajeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-600" />
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

export default VentasGenerales
