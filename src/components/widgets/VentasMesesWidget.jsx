import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const VentasMesesWidget = ({ filtros, forceRefresh, onMesClick }) => {
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
      const { data: functionData, error: functionError } = await supabase.functions.invoke('get-ventas-detallado-meses-2024-2025', {
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
      console.error('Error al cargar datos del widget VentasMeses:', error)
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
    if (onMesClick && data && data.MES) {
      onMesClick(data.MES)
    }
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{`Mes: ${label}`}</p>
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

  // Función para renderizar las etiquetas del segmento inferior (2024)
  const renderBottomStackLabel = (props) => {
    const { x, y, width, height, value } = props;
    
    // Solo mostrar etiqueta si el valor es mayor a 0
    if (!value || value === 0) return null;
    
    // Formatear el valor
    const formattedValue = value.toLocaleString('es-CO', { 
      notation: 'compact', 
      compactDisplay: 'short',
      maximumFractionDigits: 1
    });
    
    // Calcular posición en el centro del segmento
    const centerY = y + height / 2;
    
    // Calcular dimensiones del fondo
    const textWidth = Math.max(formattedValue.length * 6.5, 30);
    const textHeight = 16;
    const padding = 4;
    
    return (
      <g>
        {/* Fondo blanco semitransparente con borde */}
        <rect
          x={x + width / 2 - textWidth / 2 - padding}
          y={centerY - textHeight / 2 - padding}
          width={textWidth + padding * 2}
          height={textHeight + padding * 2}
          fill="rgba(255, 255, 255, 0.45)"
          stroke="rgba(0, 0, 0, 0.2)"
          strokeWidth={1}
          rx="4"
          ry="4"
        />
        {/* Texto */}
        <text 
          x={x + width / 2} 
          y={centerY} 
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

  // Función para renderizar las etiquetas del segmento superior (2025)
  const renderTopStackLabel = (props) => {
    //console.log('renderTopStackLabel props:', props); // Debug
    const { x, y, width, height, value, payload, index } = props;
    
    // Buscar el dato original en el array de datos
    const originalData = data[index];
    //console.log('originalData:', originalData); // Debug
    
    // Obtener el valor real de 2025 desde los datos originales
    const actualValue2025 = originalData && originalData['2025'] ? originalData['2025'] : 0;
    //console.log('actualValue2025:', actualValue2025); // Debug
    
    // Solo mostrar etiqueta si el valor es mayor a 0
    if (!actualValue2025 || actualValue2025 === 0) return null;
    
    // Formatear el valor
    const formattedValue = actualValue2025.toLocaleString('es-CO', { 
      notation: 'compact', 
      compactDisplay: 'short',
      maximumFractionDigits: 1
    });
    
    // Calcular posición en el centro del segmento
    const centerY = y + height / 2;
    
    // Calcular dimensiones del fondo
    const textWidth = Math.max(formattedValue.length * 6.5, 30);
    const textHeight = 16;
    const padding = 4;
    
    return (
      <g>
        {/* Fondo blanco semitransparente con borde */}
        <rect
          x={x + width / 2 - textWidth / 2 - padding}
          y={centerY - textHeight / 2 - padding}
          width={textWidth + padding * 2}
          height={textHeight + padding * 2}
          fill="rgba(255, 255, 255, 0.45)"
          stroke="rgba(0, 0, 0, 0.2)"
          strokeWidth={1}
          rx="4"
          ry="4"
        />
        {/* Texto */}
        <text 
          x={x + width / 2} 
          y={centerY} 
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        
        {/* Leyenda skeleton */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-200 rounded animate-pulse"></div>
              <div className="h-3 bg-gray-200 rounded w-8 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton para gráfico de barras apiladas */}
        <div className="h-80 md:h-96 flex items-end justify-center space-x-3 px-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="flex flex-col items-center space-y-2 flex-1">
              {/* Barra apilada animada */}
              <div className="flex flex-col items-center">
                <div 
                  className="bg-red-200 rounded-t animate-pulse w-6" 
                  style={{ height: `${Math.random() * 80 + 20}px` }}
                ></div>
                <div 
                  className="bg-green-200 rounded-b animate-pulse w-6" 
                  style={{ height: `${Math.random() * 100 + 30}px` }}
                ></div>
              </div>
              {/* Etiquetas del eje X */}
              <div className="h-3 bg-gray-200 rounded w-6 animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Shimmer effect global */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-80 md:h-96">
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
        <div className="flex items-center justify-center h-80 md:h-96">
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
      'Mes': item.MES,
      'Ventas 2024': item['2024'] ? item['2024'].toLocaleString('es-CO') : '0',
      'Ventas 2025': item['2025'] ? item['2025'].toLocaleString('es-CO') : '0',
      'Diferencia': item['2025'] && item['2024'] ? (item['2025'] - item['2024']).toLocaleString('es-CO') : '0',
      'Crecimiento (%)': item['2025'] && item['2024'] ? `${(((item['2025'] - item['2024']) / item['2024']) * 100).toFixed(2)}%` : '0%'
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Barra de acciones */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton onRefresh={fetchData} />
        <ExpandWidgetButton title="Ventas Mensuales - Comparativo 2024 vs 2025">
          <div className="space-y-4">
            {/* Leyenda expandida */}
            <div className="flex justify-center">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
                  <span className="text-sm text-gray-700 font-medium">2024</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
                  <span className="text-sm text-gray-700 font-medium">2025</span>
                </div>
              </div>
            </div>
            
            <div className="h-96 lg:h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="MES" 
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
                  <Bar 
                    dataKey="2024" 
                    stackId="a"
                    fill="#10b981" 
                    name="2024"
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <LabelList content={renderBottomStackLabel} />
                  </Bar>
                  <Bar 
                    dataKey="2025" 
                    stackId="a"
                    fill="#3b82f6" 
                    name="2025"
                    onClick={handleBarClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <LabelList content={renderTopStackLabel} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ExpandWidgetButton>
        <ExcelExportButton
          data={prepareExportData()}
          filename="ventas_mensuales_comparativo"
          title="Reporte de Ventas Mensuales - Comparativo 2024 vs 2025"
          sheetName="Ventas Mensuales"
          columns={[
            { header: 'Mes', key: 'Mes', width: 15 },
            { header: 'Ventas 2024', key: 'Ventas 2024', width: 15 },
            { header: 'Ventas 2025', key: 'Ventas 2025', width: 15 },
            { header: 'Diferencia', key: 'Diferencia', width: 15 },
            { header: 'Crecimiento (%)', key: 'Crecimiento (%)', width: 15 }
          ]}
        />
      </div>

      {/* Leyenda arriba */}
      <div className="flex justify-center mb-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }}></div>
            <span className="text-sm text-gray-700 font-medium">2024</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span className="text-sm text-gray-700 font-medium">2025</span>
          </div>
        </div>
      </div>
      
      {/* Contenedor con scroll horizontal cuando sea necesario */}
      <div className="overflow-x-auto">
        <div className="h-80 md:h-96" style={{ minWidth: '600px' }}>
          <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 10,
              bottom: 40
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="MES" 
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
              tick={{ fontSize: 11, fill: '#666' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#666' }}
              tickFormatter={(value) => value.toLocaleString('es-CO', { 
                notation: 'compact', 
                compactDisplay: 'short' 
              })}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="2024" 
              stackId="a"
              fill="#10b981" 
              name="2024"
              onClick={handleBarClick}
              style={{ cursor: 'pointer' }}
            >
              <LabelList content={renderBottomStackLabel} />
            </Bar>
            <Bar 
              dataKey="2025" 
              stackId="a"
              fill="#3b82f6" 
              name="2025"
              onClick={handleBarClick}
              style={{ cursor: 'pointer' }}
            >
              <LabelList content={renderTopStackLabel} />
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

export default VentasMesesWidget
