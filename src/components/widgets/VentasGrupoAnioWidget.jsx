import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const VentasGrupoAnioWidget = ({ filtros, forceRefresh, onGrupoClick }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isLoadingRef = useRef(false)

  const fetchData = async () => {
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      setLoading(true)
      setError(null)

      // Llamar a la Edge Function
      const { data: functionData, error: functionError } = await supabase.functions.invoke('get-ventas-grupo-anio', {
        body: {
          mes: filtros.mes,
          aliado: filtros.aliado,
          sucursal: filtros.sucursal,
          marca: filtros.marca,
          rubro: filtros.rubro,
          portafolio_interno: filtros.portafolio_interno,
          consumo_masivo: filtros.consumo_masivo,
          version: filtros.version,
          presentacion: filtros.presentacion,
          estado: filtros.estado
        }
      })

      if (functionError) {
        console.error('Error en Edge Function:', functionError)
        throw functionError
      }

      if (functionData) {
        setData(functionData)
      }
    } catch (error) {
      console.error('Error al cargar datos del widget VentasGrupoAnio:', error)
      setError(error.message)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  useEffect(() => {
    fetchData()
  }, [filtros, forceRefresh])

  // Función para manejar el clic en las barras
  const handleBarClick = (data, index) => {
    if (onGrupoClick && data && data.gpo) {
      onGrupoClick(data.gpo)
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
          <p className="font-semibold text-gray-900">{`GPO: ${label}`}</p>
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-28 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        
        {/* Skeleton para gráfico de barras */}
        <div className="h-80 md:h-96 flex items-end justify-center space-x-2 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-2 flex-1">
              {/* Barras animadas con alturas aleatorias */}
              <div className="flex space-x-1 items-end">
                <div 
                  className="bg-green-200 rounded-t animate-pulse" 
                  style={{ 
                    height: `${Math.random() * 120 + 40}px`,
                    width: '8px'
                  }}
                ></div>
                <div 
                  className="bg-red-200 rounded-t animate-pulse" 
                  style={{ 
                    height: `${Math.random() * 100 + 30}px`,
                    width: '8px'
                  }}
                ></div>
              </div>
              {/* Etiquetas del eje X */}
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Leyenda skeleton */}
        <div className="flex justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 rounded animate-pulse"></div>
            <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
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
              style={{ backgroundColor: '#10b981', color: 'white' }}
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
      'Grupo': item.gpo,
      'Ventas 2024': item['2024'] ? item['2024'].toLocaleString('es-CO') : '0',
      'Ventas 2025': item['2025'] ? item['2025'].toLocaleString('es-CO') : '0',
      'Diferencia': item['2025'] && item['2024'] ? (item['2025'] - item['2024']).toLocaleString('es-CO') : '0',
      'Crecimiento (%)': item['2025'] && item['2024'] ? `${(((item['2025'] - item['2024']) / item['2024']) * 100).toFixed(2)}%` : '0%'
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
      {/* Barra de acciones */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton onRefresh={fetchData} />
        <ExpandWidgetButton title="Ventas por Grupo - Comparativo Anual">
          <div className="overflow-x-auto">
            <div className="h-96 lg:h-[600px]" style={{ minWidth: '800px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60
                  }}
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="gpo" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#666' }}
                    tickMargin={10}
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
                    wrapperStyle={{ paddingTop: '70px', paddingBottom: '10px' }}
                    verticalAlign="bottom"
                    height={60}
                    iconSize={14}
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
          filename="ventas_grupo_comparativo_anual"
          title="Reporte de Ventas por Grupo - Comparativo Anual"
          sheetName="Ventas Grupo Anual"
          columns={[
            { header: 'Grupo', key: 'Grupo', width: 25 },
            { header: 'Ventas 2024', key: 'Ventas 2024', width: 15 },
            { header: 'Ventas 2025', key: 'Ventas 2025', width: 15 },
            { header: 'Diferencia', key: 'Diferencia', width: 15 },
            { header: 'Crecimiento (%)', key: 'Crecimiento (%)', width: 15 }
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
                dataKey="gpo" 
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

export default VentasGrupoAnioWidget
