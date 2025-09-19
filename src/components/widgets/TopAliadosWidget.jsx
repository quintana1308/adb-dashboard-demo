import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell,
  LabelList
} from 'recharts'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const TopAliadosWidget = ({ filtros = {}, onAliadoClick, forceRefresh = 0 }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const lastFiltrosRef = useRef(null)

  useEffect(() => {
    // Verificar si los filtros realmente han cambiado
    const currentFiltros = JSON.stringify(filtros)
    if (lastFiltrosRef.current !== currentFiltros) {
      lastFiltrosRef.current = currentFiltros
      fetchTopAliados()
    }
  }, [filtros.mes, filtros.aliado, filtros.marca, filtros.gpo, filtros.aliado_especifico])

  // useEffect para manejar la recarga forzada
  useEffect(() => {
    if (forceRefresh > 0) {
      fetchTopAliados()
    }
  }, [forceRefresh])

  const fetchTopAliados = async () => {
    setLoading(true)
    try {
      // Preparar parámetros para la función RPC
      const params = {
        p_mes: filtros.mes === 'All' ? null : filtros.mes,
        p_aliado: filtros.aliado === 'All' ? null : filtros.aliado,
        p_marca: filtros.marca === 'All' ? null : filtros.marca,
        p_limit: 10,
        p_gpo: filtros.gpo === 'All' ? null : filtros.gpo,
        p_aliado_especifico: filtros.aliado_especifico === 'All' ? null : filtros.aliado_especifico
      }
      
      // Llamar a la función RPC que ejecuta la consulta SQL en la base de datos
      const { data: result, error } = await supabase.rpc('get_ventas_consolidado_top_aliados', params)
      
      if (error) {
        console.error('Error en RPC get_ventas_consolidado_top_aliados:', error)
        throw error
      }
      
      // Transformar los datos para el gráfico comparativo por años
      const aliadosMap = {}
      
      result.forEach(row => {
        const aliado = row.aliado
        const año = parseInt(row.año)
        const toneladas = Math.round(parseFloat(row.toneladas) || 0)
        
        if (!aliadosMap[aliado]) {
          aliadosMap[aliado] = {
            aliado: aliado,
            "2024": 0,
            "2025": 0
          }
        }
        
        // Asignar el valor al año correspondiente
        if (año === 2024) {
          aliadosMap[aliado]["2024"] = toneladas
        } else if (año === 2025) {
          aliadosMap[aliado]["2025"] = toneladas
        }
      })
      
      // Convertir a array y ordenar por total
      const chartData = Object.values(aliadosMap)
        .map(item => ({
          ...item,
          total: (item["2024"] || 0) + (item["2025"] || 0)
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10)
      
      setData(chartData)
    } catch (error) {
      console.error('Error fetching top aliados:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        </div>
        
        {/* Skeleton para gráfico de barras */}
        <div className="space-y-4 h-96">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="flex-1 bg-gray-100 rounded h-6 relative overflow-hidden">
                <div 
                  className="h-full bg-red-200 rounded animate-pulse" 
                  style={{ width: `${Math.random() * 60 + 20}%` }}
                ></div>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-12 animate-pulse"></div>
            </div>
          ))}
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay datos disponibles</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            No se encontraron aliados para los filtros seleccionados. 
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
          onRefresh={fetchTopAliados}
        />
        <ExpandWidgetButton title="Top Aliados por Ventas">
          <ResponsiveContainer width="100%" height={600}>
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
              barCategoryGap="15%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="aliado" 
                type="category" 
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value, name) => [value.toLocaleString(), name]}
              />
              <Legend />
              <Bar 
                dataKey="2024" 
                fill="#10b981" 
                name="2024" 
                barSize={30}
              >
                <LabelList 
                  dataKey="2024" 
                  position="center" 
                  fill="white" 
                  fontSize={12}
                  fontWeight="bold"
                  formatter={(value) => value > 0 ? value.toLocaleString() : ''}
                />
              </Bar>
              <Bar 
                dataKey="2025" 
                fill="#3b82f6" 
                name="2025" 
                barSize={30}
              >
                <LabelList 
                  dataKey="2025" 
                  position="center" 
                  fill="white" 
                  fontSize={12}
                  fontWeight="bold"
                  formatter={(value) => value > 0 ? value.toLocaleString() : ''}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ExpandWidgetButton>
        <ExcelExportButton
          data={data}
          filename="top_aliados_ventas"
          title="Reporte de Top Aliados por Ventas"
          sheetName="Top Aliados"
          columns={[
            {
              key: 'aliado',
              header: 'Aliado',
              formatter: (value) => String(value || '').toUpperCase()
            },
            {
              key: '2024',
              header: 'Ventas 2024 (Ton)',
              formatter: (value) => (value || 0).toLocaleString()
            },
            {
              key: '2025',
              header: 'Ventas 2025 (Ton)',
              formatter: (value) => (value || 0).toLocaleString()
            },
            {
              key: 'total',
              header: 'Total (Ton)',
              formatter: (value) => (value || 0).toLocaleString()
            }
          ]}
        />
      </div>
      
      <ResponsiveContainer width="100%" height={500}>
        <BarChart 
          data={data} 
          layout="vertical" 
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            dataKey="aliado" 
            type="category" 
            width={130}
            tick={{ fontSize: 10 }}
          />
          <Tooltip 
            formatter={(value, name) => [value.toLocaleString(), name]}
          />
          <Legend />
          <Bar 
            dataKey="2024" 
            fill="#10b981" 
            name="2024" 
            barSize={25}
            onClick={(data) => {
              if (onAliadoClick && data && data.aliado) {
                onAliadoClick(data.aliado)
              }
            }}
            style={{ cursor: onAliadoClick ? 'pointer' : 'default' }}
          >
            <LabelList 
              dataKey="2024" 
              position="center" 
              fill="white" 
              fontSize={11}
              fontWeight="bold"
              formatter={(value) => value > 0 ? value.toLocaleString() : ''}
            />
          </Bar>
          <Bar 
            dataKey="2025" 
            fill="#3b82f6" 
            name="2025" 
            barSize={25}
            onClick={(data) => {
              if (onAliadoClick && data && data.aliado) {
                onAliadoClick(data.aliado)
              }
            }}
            style={{ cursor: onAliadoClick ? 'pointer' : 'default' }}
          >
            <LabelList 
              dataKey="2025" 
              position="center" 
              fill="white" 
              fontSize={11}
              fontWeight="bold"
              formatter={(value) => value > 0 ? value.toLocaleString() : ''}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default TopAliadosWidget
