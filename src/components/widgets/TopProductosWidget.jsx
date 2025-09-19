import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const COLORS = ['#3b82f6', '#10b981', '#FF8042', '#00C49F', '#FFBB28', '#8884d8', '#82ca9d', '#ffc658']

const TopProductosWidget = ({ filtros = {}, onGrupoClick, forceRefresh = 0 }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const isLoadingRef = useRef(false)

  useEffect(() => {
    fetchTopProductos()
  }, [filtros.mes, filtros.aliado, filtros.marca, filtros.gpo, filtros.aliado_especifico])

  // useEffect para manejar la recarga forzada
  useEffect(() => {
    if (forceRefresh > 0) {
      fetchTopProductos()
    }
  }, [forceRefresh])

  const fetchTopProductos = async () => {
    if (isLoadingRef.current) {
      return
    }
    
    isLoadingRef.current = true
    setLoading(true)
    try {
      // Usar la función RPC para obtener datos por grupo
      const { data: result, error } = await supabase.rpc('get_ventas_consolidado_top_productos_gpo', {
        p_mes: filtros.mes || null,
        p_aliado: filtros.aliado || null,
        p_marca: filtros.marca || null,
        p_limit: 15,
        p_gpo: filtros.gpo === 'All' ? null : filtros.gpo,
        p_aliado_especifico: filtros.aliado_especifico === 'All' ? null : filtros.aliado_especifico
      })
      
      if (error) throw error
      if (!result) {
        setData([])
        return
      }
      
      // Mapear los datos de la RPC al formato esperado por el gráfico
      const topProductos = result.map(row => ({
        sku: row.gpo, // Usar grupo en lugar de SKU individual
        toneladas: Math.round(parseFloat(row.toneladas) || 0),
        porcentaje: parseFloat(row.porcentaje) || 0
      }))
      
      // Ordenar por orden alfabético
      topProductos.sort((a, b) => a.sku.localeCompare(b.sku))

      setData(topProductos)
    } catch (error) {
      console.error('Error fetching top productos:', error)
      setData([])
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-28 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
        </div>
        
        {/* Skeleton para gráfico circular */}
        <div className="flex items-center justify-center h-96">
          <div className="relative">
            {/* Círculo exterior */}
            <div className="w-60 h-60 rounded-full border-8 border-gray-200 animate-pulse"></div>
            {/* Círculo interior (donut) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-white border-4 border-gray-100"></div>
            </div>
            {/* Segmentos simulados */}
            <div className="absolute inset-0">
              <div className="w-60 h-60 rounded-full border-8 border-transparent border-t-red-200 animate-spin" style={{ animationDuration: '3s' }}></div>
              <div className="absolute inset-0 w-60 h-60 rounded-full border-8 border-transparent border-r-blue-200 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
              <div className="absolute inset-0 w-60 h-60 rounded-full border-8 border-transparent border-b-gray-300 animate-spin" style={{ animationDuration: '5s' }}></div>
            </div>
          </div>
        </div>
        
        {/* Shimmer effect global */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    )
  }

  // Estado vacío cuando no hay datos
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            No se encontraron productos para los filtros seleccionados. 
            Intenta ajustar los criterios de búsqueda o verifica que haya datos sincronizados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      {/* Barra de botones superior */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton 
          onRefresh={fetchTopProductos}
        />
        <ExpandWidgetButton title="Top Productos por Ventas">
          <div className="space-y-4">
            {/* Labels expandidos */}
            <div className="flex flex-wrap gap-3 justify-center">
              {data.map((entry, index) => (
                <div key={`legend-${index}`} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-4 h-4 rounded-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-700 font-medium">{entry.sku}</span>
                  <span className="text-gray-500">({entry.toneladas.toLocaleString()} ton)</span>
                </div>
              ))}
            </div>
            
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={100}
                  outerRadius={200}
                  paddingAngle={2}
                  dataKey="toneladas"
                  label={({ toneladas, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
                    if (percent <= 0.03) return ''
                    
                    const RADIAN = Math.PI / 180
                    const radius = outerRadius + 40
                    const x = cx + radius * Math.cos(-midAngle * RADIAN)
                    const y = cy + radius * Math.sin(-midAngle * RADIAN)
                    
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="#374151" 
                        textAnchor={x > cx ? 'start' : 'end'} 
                        dominantBaseline="central"
                        fontSize="14"
                        fontWeight="bold"
                      >
                        {Math.round(toneladas).toLocaleString()}
                      </text>
                    )
                  }}
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [Math.round(value).toLocaleString(), props.payload.sku]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ExpandWidgetButton>
        <ExcelExportButton
          data={data}
          filename="top_productos_ventas"
          title="Reporte de Top Productos por Ventas"
          sheetName="Top Productos"
          columns={[
            {
              key: 'sku',
              header: 'Producto',
              formatter: (value) => String(value || '').toUpperCase()
            },
            {
              key: 'toneladas',
              header: 'Ventas (Ton)',
              formatter: (value) => (value || 0).toLocaleString()
            },
            {
              key: 'porcentaje',
              header: 'Porcentaje (%)',
              formatter: (value) => `${(value || 0).toFixed(2)}%`
            }
          ]}
        />
      </div>
      
      {/* Labels arriba con colores como en la imagen de referencia */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-1 text-xs">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            ></div>
            <span className="text-gray-700 font-medium">{entry.sku}</span>
          </div>
        ))}
      </div>
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={160}
            paddingAngle={2}
            dataKey="toneladas"
            onClick={(data) => {
              if (onGrupoClick && data && data.sku) {
                onGrupoClick(data.sku)
              }
            }}
            style={{ cursor: onGrupoClick ? 'pointer' : 'default' }}
            label={({ toneladas, percent, cx, cy, midAngle, innerRadius, outerRadius }) => {
              // Solo mostrar label si el porcentaje es mayor a 3% para evitar solapamiento
              if (percent <= 0.03) return ''
              
              // Calcular posición fuera de la torta
              const RADIAN = Math.PI / 180
              const radius = outerRadius + 30 // Posicionar fuera de la torta
              const x = cx + radius * Math.cos(-midAngle * RADIAN)
              const y = cy + radius * Math.sin(-midAngle * RADIAN)
              
              return (
                <text 
                  x={x} 
                  y={y} 
                  fill="#374151" 
                  textAnchor={x > cx ? 'start' : 'end'} 
                  dominantBaseline="central"
                  fontSize="12"
                  fontWeight="bold"
                >
                  {Math.round(toneladas).toLocaleString()}
                </text>
              )
            }}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name, props) => [Math.round(value).toLocaleString(), props.payload.sku]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TopProductosWidget
