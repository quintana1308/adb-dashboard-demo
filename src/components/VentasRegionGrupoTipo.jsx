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
  Box
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Footer from './Footer'
import VentasNavMenu from './VentasNavMenu'
import DashboardHeader from './DashboardHeader'
import VentasTipoClienteWidget from './widgets/VentasTipoClienteWidget'
import VentasGrupoWidget from './widgets/VentasGrupoWidget'
import VentasTipoClienteBarrasWidget from './widgets/VentasTipoClienteBarrasWidget'
import MapaVenezuelaWidget from './widgets/MapaVenezuelaWidget';

const VentasRegionGrupoTipo = () => {
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
    region: 'All'
  })
  
  // Estados para filtros internos (se activan al hacer click en widgets)
  const [filtrosInternos, setFiltrosInternos] = useState({
    estado: 'All',
    tipo_cliente: 'All'
  })
  const [filtrosColapsados, setFiltrosColapsados] = useState(true)

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
      
      setFiltrosData({
        // Filtros geográficos
        mes: geograficos.mes || [],
        region: geograficos.region || [],
        aliado: geograficos.aliado || [],
        sucursal: geograficos.sucursal || [],
        // Filtros de producto (sin SKU)
        rubro: productos.rubro || [],
        portafolio_interno: productos.portafolio_interno || [],
        consumo_masivo: productos.consumo_masivo || [],
        // Filtros independientes
        marca: independientes.marca || [],
        version: independientes.version || [],
        presentacion: independientes.presentacion || [],
        // Mantener tipo_cliente para compatibilidad
        tipo_cliente: []
      });
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
      region: 'All'
    })
    // También limpiar filtros internos
    setFiltrosInternos({
      estado: 'All',
      tipo_cliente: 'All'
    })
    setForceRefresh(prev => prev + 1)
  }

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
      
      // Filtros de producto: rubro -> portafolio_interno -> consumo_masivo (sin SKU)
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
            consumo_masivo: productosResult.consumo_masivo || []
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
    } else if (tipo === 'portafolio_interno') {
      nuevosFiltros.consumo_masivo = 'All';
    }
    
    setFiltrosSeleccionados(nuevosFiltros);
    
    // Actualizar filtros dependientes
    await actualizarFiltrosDependientes(tipo, valor, nuevosFiltros);
  }

  // Función para manejar filtros internos (estado y tipo_cliente)
  const handleFiltroInternoChange = (tipo, valor) => {
    setFiltrosInternos(prev => ({
      ...prev,
      [tipo]: valor
    }))
    setForceRefresh(prev => prev + 1)
  }

  // Función para combinar filtros principales con internos
  const getFiltrosCombinados = () => {
    return {
      ...filtrosSeleccionados,
      ...filtrosInternos
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <DashboardHeader title="Región - Grupo - Tipo de Negocio">
        <VentasNavMenu currentPage="region-grupo-tipo" />
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

              {/* === FILTROS DE PRODUCTO (Jerarquía: rubro → portafolio → consumo) === */}
              
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

              {/* Filtro Portafolio Interno (Grupo) */}
              <div className="flex items-center space-x-2 min-w-0">
                <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <select 
                  value={filtrosSeleccionados.portafolio_interno}
                  onChange={(e) => handleFiltroChange('portafolio_interno', e.target.value)}
                  className="border border-gray-200 rounded px-2 sm:px-3 py-1 text-sm bg-white text-gray-700 focus:border-gray-300 focus:outline-none min-w-0 flex-1 sm:flex-none sm:w-20 md:w-24"
                  disabled={loading}
                >
                  <option value="All">Portafolio Interno</option>
                  {filtrosData.portafolio_interno && filtrosData.portafolio_interno.map(grupo => (
                    <option key={grupo} value={grupo}>{grupo}</option>
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
            Región - Grupo - Tipo de Negocio
          </h1>
        </div>
        {/* Primera Fila - 50% de altura */}
        <div className="grid grid-cols-1 lg:grid-cols-20 gap-6 mb-6 h-1/2">
          {/* Columna Izquierda - 65% (13/20) */}
          <div className="lg:col-span-13">
            <VentasTipoClienteWidget 
              filtros={getFiltrosCombinados()}
              forceRefresh={forceRefresh}
              onFiltroInternoChange={handleFiltroInternoChange}
            />
          </div>
          
          {/* Columna Derecha - 35% (7/20) */}
          <div className="lg:col-span-7">
            <MapaVenezuelaWidget 
              filtros={getFiltrosCombinados()}
              forceRefresh={forceRefresh}
              onFiltroInternoChange={handleFiltroInternoChange}
            />
          </div>
        </div>

        {/* Segunda Fila - 50% de altura */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-1/2">
          {/* Columna Izquierda - 50% */}
          <div className="lg:col-span-1">
            <VentasGrupoWidget 
              filtros={getFiltrosCombinados()}
              forceRefresh={forceRefresh}
              onFiltroInternoChange={handleFiltroInternoChange}
            />
          </div>
          
          {/* Columna Derecha - 50% */}
          <div className="lg:col-span-1">
            <VentasTipoClienteBarrasWidget 
              filtros={getFiltrosCombinados()}
              forceRefresh={forceRefresh}
              onFiltroInternoChange={handleFiltroInternoChange}
            />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

export default VentasRegionGrupoTipo
