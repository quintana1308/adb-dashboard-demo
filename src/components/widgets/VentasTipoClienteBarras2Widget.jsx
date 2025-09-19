import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const VentasTipoClienteBarras2Widget = ({ filtros, forceRefresh, onTipoClienteClick }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isLoadingRef = useRef(false)

  // Función para procesar los filtros antes de enviarlos
  const procesarFiltros = (filtros) => {
    const filtrosProcesados = {};
    
    // Recorrer cada filtro y convertir 'All' a null
    Object.keys(filtros).forEach(key => {
      if (filtros[key] === 'All') {
        filtrosProcesados[key] = null;
      } else {
        filtrosProcesados[key] = [filtros[key]];
      }
    });
    
    return filtrosProcesados;
  };

  const fetchData = async () => {
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      // Procesar los filtros
      const filtrosProcesados = procesarFiltros(filtros);

      // Llamar a la Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('get-ventas-tipo-cliente-barras', {
        body: filtrosProcesados
      })

      if (functionError) {
        console.error('Error en Edge Function:', functionError)
        throw functionError
      }

      if (functionData) {
        setData(functionData)
      }
    } catch (error) {
      console.error('Error al cargar datos del widget VentasTipoClienteBarras2:', error)
      setError(error.message)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  useEffect(() => {
    fetchData()
  }, [filtros, forceRefresh])

  // Función para manejar clic en las barras
  const handleBarClick = (data, index) => {
    if (onTipoClienteClick && data && data.TIPOCLIENTE) {
      onTipoClienteClick(data.TIPOCLIENTE)
    }
  }

  // Función para renderizar las etiquetas con fondo transparente y anti-solapamiento
  const renderLabelWithBackground = (props) => {
    const { x, y, width, height, value, index } = props;
    
    // Solo mostrar etiqueta si el valor es mayor a 0
    if (!value || value === 0) return null;
    
    // Formatear el valor
    const formattedValue = value.toLocaleString('es-CO', { 
      notation: 'compact', 
      compactDisplay: 'short',
      maximumFractionDigits: 1
    });
    
    // Calcular posición Y alternada para evitar solapamiento
    const baseY = y - 8;
    const offsetY = index % 2 === 0 ? baseY : baseY - 16;
    
    // Calcular dimensiones del fondo
    const textWidth = Math.max(formattedValue.length * 6.5, 30); // Mínimo 30px de ancho
    const textHeight = 16;
    const padding = 4;
    
    return (
      <g>
        {/* Fondo oscuro transparente con sombra */}
        <rect
          x={x + width / 2 - textWidth / 2 - padding}
          y={offsetY - textHeight / 2 - padding}
          width={textWidth + padding * 2}
          height={textHeight + padding * 2}
          fill="rgba(0, 0, 0, 0.05)"
          rx="6"
          ry="6"
          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
        />
        {/* Texto */}
        <text 
          x={x + width / 2} 
          y={offsetY} 
          fill="black" 
          textAnchor="middle" 
          fontSize="10"
          fontWeight="600"
          dominantBaseline="middle"
        >
          {formattedValue}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`Tipo Cliente: ${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.dataKey}: ${entry.value.toLocaleString('es-CO', { 
                minimumFractionDigits: 0, 
                maximumFractionDigits: 0 
              })}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
        
        {/* Skeleton para gráfico de barras horizontal */}
        <div className="h-80 md:h-96 overflow-x-auto">
          <div className="flex items-end justify-center space-x-2 px-4 min-w-[600px] h-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex flex-col items-center space-y-2 flex-1">
                {/* Barras animadas con alturas aleatorias */}
                <div className="flex space-x-1 items-end">
                  <div 
                    className="bg-green-200 rounded-t animate-pulse" 
                    style={{ 
                      height: `${Math.random() * 120 + 40}px`,
                      width: '14px'
                    }}
                  ></div>
                  <div 
                    className="bg-red-200 rounded-t animate-pulse" 
                    style={{ 
                      height: `${Math.random() * 100 + 30}px`,
                      width: '14px'
                    }}
                  ></div>
                </div>
                {/* Etiquetas del eje X */}
                <div className="h-3 bg-gray-200 rounded w-10 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Leyenda skeleton */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
          </div>
        </div>
        
        {/* Shimmer effect global */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-red-600 mb-2">Error al cargar datos</p>
            <p className="text-gray-500 text-sm">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-3 px-4 py-2 text-sm rounded-lg transition-colors"
              style={{ backgroundColor: '#ee2624', color: 'white' }}
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-500">No hay datos disponibles</p>
            <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros</p>
          </div>
        </div>
      </div>
    )
  }

  // Preparar datos para exportar
  const prepareExportData = () => {
    return data.map(item => ({
      'Tipo Cliente': item.TIPOCLIENTE,
      '2024': item['2024'] ? item['2024'].toLocaleString('es-CO') : '0',
      '2025': item['2025'] ? item['2025'].toLocaleString('es-CO') : '0'
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
      {/* Barra de acciones */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton onRefresh={fetchData} />
        <ExpandWidgetButton title="Ventas por Tipo de Cliente (Barras 2)">
          <div className="h-[600px] overflow-x-auto">
            <div className="h-full" style={{ minWidth: '600px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 40
                  }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="TIPOCLIENTE" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                    tick={{ fontSize: 11, fill: '#666' }}
                    tickMargin={8}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickFormatter={(value) => value.toLocaleString('es-CO', { 
                      notation: 'compact', 
                      compactDisplay: 'short' 
                    })}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '60px', paddingBottom: '10px' }}
                    verticalAlign="bottom"
                    height={50}
                    iconSize={12}
                  />
                  <Bar 
                    dataKey="2024" 
                    fill="#10b981" 
                    name="2024"
                    radius={[2, 2, 0, 0]}
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <LabelList content={renderLabelWithBackground} />
                  </Bar>
                  <Bar 
                    dataKey="2025" 
                    fill="#3b82f6" 
                    name="2025"
                    radius={[2, 2, 0, 0]}
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <LabelList content={renderLabelWithBackground} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ExpandWidgetButton>
        <ExcelExportButton
          data={prepareExportData()}
          filename="ventas_tipo_cliente_barras2"
          title="Reporte de Ventas por Tipo de Cliente (Barras 2)"
          sheetName="Ventas Tipo Cliente 2"
          columns={[
            { header: 'Tipo Cliente', key: 'Tipo Cliente', width: 20 },
            { header: '2024', key: '2024', width: 15 },
            { header: '2025', key: '2025', width: 15 }
          ]}
        />
      </div>

      {/* Contenedor con scroll horizontal cuando sea necesario */}
      <div className="overflow-x-auto">
        <div className="h-80 md:h-96" style={{ minWidth: '600px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 40
              }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="TIPOCLIENTE" 
                angle={-45}
                textAnchor="end"
                height={70}
                interval={0}
                tick={{ fontSize: 11, fill: '#666' }}
                tickMargin={8}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#666' }}
                tickFormatter={(value) => value.toLocaleString('es-CO', { 
                  notation: 'compact', 
                  compactDisplay: 'short' 
                })}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '60px', paddingBottom: '10px' }}
                verticalAlign="bottom"
                height={50}
                iconSize={12}
              />
              <Bar 
                dataKey="2024" 
                fill="#10b981" 
                name="2024"
                radius={[2, 2, 0, 0]}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                <LabelList content={renderLabelWithBackground} />
              </Bar>
              <Bar 
                dataKey="2025" 
                fill="#3b82f6" 
                name="2025"
                radius={[2, 2, 0, 0]}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              >
                <LabelList content={renderLabelWithBackground} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Indicador de scroll cuando hay overflow */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">← Desliza horizontalmente para ver más →</p>
      </div>
    </div>
  )
}

export default VentasTipoClienteBarras2Widget
