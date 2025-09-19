import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { 
  Calendar, 
  MapPin, 
  Users, 
  Package, 
  Tag, 
  Building2, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  FilterX, 
  Maximize,
  Layers,
  Briefcase,
  ShoppingCart,
  GitBranch,
  Box,
  Search,
  X
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import VentasNavMenu from './VentasNavMenu'
import DashboardHeader from './DashboardHeader'
import VentasRegionAliadoSkuWidget from './widgets/VentasRegionAliadoSkuWidget'
import VentasTipoClienteBarras2Widget from './widgets/VentasTipoClienteBarras2Widget'
import VentasMesBarrasWidget from './widgets/VentasMesBarrasWidget'
import Total2024Widget from './widgets/Total2024Widget'
import Total2025Widget from './widgets/Total2025Widget'

const VentasRegionAliadoSku = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [loadingFiltros, setLoadingFiltros] = useState(false)
  const [filtrosData, setFiltrosData] = useState({
    mes: [],
    aliado: [],
    sucursal: [],
    marca: [],
    rubro: [],
    portafolio_interno: [],
    consumo_masivo: [],
    version: [],
    presentacion: [],
    region: [],
    sku: [],
    tipo_cliente: []
  })
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState({
    mes: 'All',
    aliado: 'All',
    sucursal: 'All',
    marca: 'All',
    rubro: 'All',
    portafolio_interno: 'All',
    consumo_masivo: 'All',
    version: 'All',
    presentacion: 'All',
    region: 'All',
    sku: 'All',
    tipo_cliente: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)
  const [skuSearchTerm, setSkuSearchTerm] = useState('')
  const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false)
  const skuDropdownRef = useRef(null)

  // Ref para evitar dobles llamadas
  const isInitializedRef = useRef(false)
  
  // Estado para controlar la recarga de widgets
  const [forceRefresh, setForceRefresh] = useState(0)

  const fetchFiltros = async () => {
    if (isInitializedRef.current) return;
    
    try {
      isInitializedRef.current = true;
      setLoadingFiltros(true);
      
      // Llamar a las tres funciones separadas con nombres definitivos
      const [geograficosResult, productosResult, independientesResult] = await Promise.all([
        supabase.rpc('get_filtros_geograficos_ventas'),
        supabase.rpc('get_filtros_producto_ventas'),
        supabase.rpc('get_filtros_independientes_ventas')
      ]);
      
      if (geograficosResult.error) {
        console.error('Error al obtener filtros geográficos:', geograficosResult.error);
        return;
      }
      
      if (productosResult.error) {
        console.error('Error al obtener filtros de producto:', productosResult.error);
        return;
      }
      
      if (independientesResult.error) {
        console.error('Error al obtener filtros independientes:', independientesResult.error);
        return;
      }

      // Combinar todos los filtros
      const geograficos = geograficosResult.data || {};
      const productos = productosResult.data || {};
      const independientes = independientesResult.data || {};
      
      // Debug: Verificar qué datos están llegando
      //console.log('=== DEBUG FILTROS ===');
      //console.log('geograficosResult:', geograficosResult);
      //console.log('productosResult:', productosResult);
      //console.log('independientesResult:', independientesResult);
      //console.log('geograficos data:', geograficos);
      //console.log('productos data:', productos);
      //console.log('independientes data:', independientes);
      
      const nuevosFilterosData = {
        // Filtros geográficos
        mes: geograficos.mes || [],
        region: geograficos.region || [],
        aliado: geograficos.aliado || [],
        sucursal: geograficos.sucursal || [],
        // Filtros de producto
        rubro: productos.rubro || [],
        portafolio_interno: productos.portafolio_interno || [],
        consumo_masivo: productos.consumo_masivo || [],
        sku: productos.sku || [],
        // Filtros independientes
        marca: independientes.marca || [],
        version: independientes.version || [],
        presentacion: independientes.presentacion || [],
        // Mantener tipo_cliente para compatibilidad
        tipo_cliente: []
      };
      
      console.log('nuevosFilterosData:', nuevosFilterosData);
      setFiltrosData(nuevosFilterosData);
    } catch (error) {
      console.error('Error al cargar filtros:', error);
    } finally {
      setLoadingFiltros(false);
    }
  };

  useEffect(() => {
    fetchFiltros()
  }, [])

  const limpiarFiltros = () => {    
    setFiltrosSeleccionados({
      mes: 'All',
      aliado: 'All',
      sucursal: 'All',
      marca: 'All',
      rubro: 'All',
      portafolio_interno: 'All',
      consumo_masivo: 'All',
      version: 'All',
      presentacion: 'All',
      region: 'All',
      sku: 'All',
      tipo_cliente: 'All'
    })
    setSkuSearchTerm('')
    setIsSkuDropdownOpen(false)
    setForceRefresh(prev => prev + 1)
  }

  // Filtrar SKUs basado en el término de búsqueda
  const filteredSkus = filtrosData.sku?.filter(sku => 
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

  // Función para recargar todos los widgets
  const recargarWidgets = () => {    
    setForceRefresh(prev => prev + 1)
  }

  // Función para actualizar filtros dependientes
  const actualizarFiltrosDependientes = async (tipo, valor, filtrosActuales) => {
    try {
      let nuevaData = { ...filtrosData };
      
      // Filtros geográficos: mes -> región -> aliado -> sucursal
      if (['mes', 'region', 'aliado', 'sucursal'].includes(tipo)) {
        const params = {
          p_mes: filtrosActuales.mes !== 'All' ? filtrosActuales.mes : null,
          p_region: filtrosActuales.region !== 'All' ? filtrosActuales.region : null,
          p_aliado: filtrosActuales.aliado !== 'All' ? filtrosActuales.aliado : null,
          p_sucursal: filtrosActuales.sucursal !== 'All' ? filtrosActuales.sucursal : null
        };
        
        if (tipo === 'mes') params.p_mes = valor !== 'All' ? valor : null;
        if (tipo === 'region') params.p_region = valor !== 'All' ? valor : null;
        if (tipo === 'aliado') params.p_aliado = valor !== 'All' ? valor : null;
        if (tipo === 'sucursal') params.p_sucursal = valor !== 'All' ? valor : null;
        
        const { data: geograficosResult, error } = await supabase.rpc('get_filtros_geograficos_ventas', params);
        
        if (!error && geograficosResult) {
          nuevaData = {
            ...nuevaData,
            mes: geograficosResult.mes || [],
            region: geograficosResult.region || [],
            aliado: geograficosResult.aliado || [],
            sucursal: geograficosResult.sucursal || []
          };
        }
      }
      
      // Filtros de producto: rubro -> portafolio_interno -> consumo_masivo -> sku
      if (['rubro', 'portafolio_interno', 'consumo_masivo'].includes(tipo)) {
        const params = {
          p_dep: filtrosActuales.rubro !== 'All' ? filtrosActuales.rubro : null,
          p_gpo: filtrosActuales.portafolio_interno !== 'All' ? filtrosActuales.portafolio_interno : null,
          p_cat: filtrosActuales.consumo_masivo !== 'All' ? filtrosActuales.consumo_masivo : null
        };
        
        if (tipo === 'rubro') params.p_dep = valor !== 'All' ? valor : null;
        if (tipo === 'portafolio_interno') params.p_gpo = valor !== 'All' ? valor : null;
        if (tipo === 'consumo_masivo') params.p_cat = valor !== 'All' ? valor : null;
        
        const { data: productosResult, error } = await supabase.rpc('get_filtros_producto_ventas', params);
        
        if (!error && productosResult) {
          nuevaData = {
            ...nuevaData,
            rubro: productosResult.rubro || [],
            portafolio_interno: productosResult.portafolio_interno || [],
            consumo_masivo: productosResult.consumo_masivo || [],
            sku: productosResult.sku || []
          };
        }
      }
      
      setFiltrosData(nuevaData);
    } catch (error) {
      console.error('Error al actualizar filtros dependientes:', error);
    }
  };

  const handleFiltroChange = async (tipo, valor) => {
    const nuevosFiltros = {
      ...filtrosSeleccionados,
      [tipo]: valor
    };
    
    // Limpiar filtros dependientes cuando cambia un filtro padre
    if (tipo === 'mes') {
      nuevosFiltros.region = 'All';
      nuevosFiltros.aliado = 'All';
      nuevosFiltros.sucursal = 'All';
    } else if (tipo === 'region') {
      nuevosFiltros.aliado = 'All';
      nuevosFiltros.sucursal = 'All';
    } else if (tipo === 'aliado') {
      nuevosFiltros.sucursal = 'All';
    } else if (tipo === 'rubro') {
      nuevosFiltros.portafolio_interno = 'All';
      nuevosFiltros.consumo_masivo = 'All';
      nuevosFiltros.sku = 'All';
    } else if (tipo === 'portafolio_interno') {
      nuevosFiltros.consumo_masivo = 'All';
      nuevosFiltros.sku = 'All';
    } else if (tipo === 'consumo_masivo') {
      nuevosFiltros.sku = 'All';
    }
    
    setFiltrosSeleccionados(nuevosFiltros);
    
    // Actualizar filtros dependientes
    await actualizarFiltrosDependientes(tipo, valor, nuevosFiltros);
  }

  // Función para manejar clic en mes desde el widget
  const handleMesClick = (mes) => {    
    handleFiltroChange('mes', mes)
  }

  // Función para manejar clic en tipo de cliente desde el widget
  const handleTipoClienteClick = (tipoCliente) => {    
    handleFiltroChange('tipo_cliente', tipoCliente)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Región - Aliado - SKU">
        <VentasNavMenu currentPage="region-aliado-sku" />
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
          
          {/* Iconos de acción en mobile */}
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-3 sm:gap-4 md:gap-3 mt-3 md:mt-0">
              {/* === FILTROS GEOGRÁFICOS (Jerarquía: mes → región → aliado → sucursal) === */}
              
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
                  {filtrosData.mes && filtrosData.mes.map(mes => (
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
                  {filtrosData.region && filtrosData.region.map(region => (
                    <option key={region} value={region}>{region}</option>
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
                  {filtrosData.aliado && filtrosData.aliado.map(aliado => (
                    <option key={aliado} value={aliado}>{aliado}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Sucursal */}
              <div className="flex items-center space-x-2 min-w-0">
                <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.sucursal}
                  onChange={(e) => handleFiltroChange('sucursal', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Sucursal</option>
                  {filtrosData.sucursal && filtrosData.sucursal.map(sucursal => (
                    <option key={sucursal} value={sucursal}>{sucursal}</option>
                  ))}
                </select>
              </div>

              {/* === FILTROS DE PRODUCTO (Jerarquía: rubro → portafolio → consumo → sku) === */}
              
              {/* Filtro Rubro */}
              <div className="flex items-center space-x-2 min-w-0">
                <Layers className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.rubro}
                  onChange={(e) => handleFiltroChange('rubro', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Rubro</option>
                  {filtrosData.rubro && filtrosData.rubro.map(rubro => (
                    <option key={rubro} value={rubro}>{rubro}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Portafolio Interno */}
              <div className="flex items-center space-x-2 min-w-0">
                <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.portafolio_interno}
                  onChange={(e) => handleFiltroChange('portafolio_interno', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Portafolio Interno</option>
                  {filtrosData.portafolio_interno && filtrosData.portafolio_interno.map(portafolio => (
                    <option key={portafolio} value={portafolio}>{portafolio}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Consumo Masivo */}
              <div className="flex items-center space-x-2 min-w-0">
                <ShoppingCart className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.consumo_masivo}
                  onChange={(e) => handleFiltroChange('consumo_masivo', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Consumo Masivo</option>
                  {filtrosData.consumo_masivo && filtrosData.consumo_masivo.map(consumo => (
                    <option key={consumo} value={consumo}>{consumo}</option>
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

              {/* === FILTROS INDEPENDIENTES === */}
              
              {/* Filtro Marca */}
              <div className="flex items-center space-x-2 min-w-0">
                <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.marca}
                  onChange={(e) => handleFiltroChange('marca', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Marca</option>
                  {filtrosData.marca && filtrosData.marca.map(marca => (
                    <option key={marca} value={marca}>{marca}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Versión */}
              <div className="flex items-center space-x-2 min-w-0">
                <GitBranch className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.version}
                  onChange={(e) => handleFiltroChange('version', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Versión</option>
                  {filtrosData.version && filtrosData.version.map(version => (
                    <option key={version} value={version}>{version}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Presentación */}
              <div className="flex items-center space-x-2 min-w-0">
                <Box className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.presentacion}
                  onChange={(e) => handleFiltroChange('presentacion', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Presentación</option>
                  {filtrosData.presentacion && filtrosData.presentacion.map(presentacion => (
                    <option key={presentacion} value={presentacion}>{presentacion}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Iconos de acción en desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <button 
                onClick={recargarWidgets}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Recargar todos los widgets"
                style={{ color: '#3b82f6' }}
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={limpiarFiltros}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Limpiar todos los filtros"
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
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
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
            Región - Aliado - SKU
          </h1>
        </div>
        {/* Primera Fila - 50% de altura */}
        <div className="grid grid-cols-1 lg:grid-cols-20 gap-6 mb-6 h-1/2">
          {/* Columna Izquierda - 75% (15/20) - Tabla */}
          <div className="lg:col-span-15">
            <VentasRegionAliadoSkuWidget 
              filtros={filtrosSeleccionados} 
              forceRefresh={forceRefresh} 
            />
          </div>
          
          {/* Columna Derecha - 25% (5/20) - Widgets de Totales */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <div className="flex flex-col overflow-hidden">
              {/* Widget Total 2024 */}
              <div className="mb-4">
                <Total2024Widget 
                  filtros={filtrosSeleccionados} 
                  forceRefresh={forceRefresh} 
                />
              </div>
              
              {/* Widget Total 2025 */}
              <div>
                <Total2025Widget 
                  filtros={filtrosSeleccionados} 
                  forceRefresh={forceRefresh} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Segunda Fila - 50% de altura */}
        <div className="grid grid-cols-1 lg:grid-cols-20 gap-6 h-1/2">
          {/* Columna Izquierda - 65% (13/20) - mismo ancho que tabla de arriba */}
          <div className="lg:col-span-13">
            <VentasTipoClienteBarras2Widget 
              filtros={filtrosSeleccionados} 
              forceRefresh={forceRefresh} 
              onTipoClienteClick={handleTipoClienteClick}
            />
          </div>
          
          {/* Columna Derecha - 35% (7/20) */}
          <div className="lg:col-span-7">
            <VentasMesBarrasWidget 
              filtros={filtrosSeleccionados} 
              forceRefresh={forceRefresh} 
              onMesClick={handleMesClick}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default VentasRegionAliadoSku