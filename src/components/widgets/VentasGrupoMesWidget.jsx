import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp, TrendingDown } from 'lucide-react'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const VentasGrupoMesWidget = ({ filtros, forceRefresh }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: result, error } = await supabase.rpc('get_ventas_detallado_grupo_mes', {
        p_mes: filtros.mes || 'All',
        p_aliado: filtros.aliado || 'All',
        p_sucursal: filtros.sucursal || 'All',
        p_marca: filtros.marca || 'All',
        p_gpo: filtros.portafolio_interno || 'All',
        p_rubro: filtros.rubro || 'All',
        p_consumo_masivo: filtros.consumo_masivo || 'All',
        p_version: filtros.version || 'All',
        p_presentacion: filtros.presentacion || 'All',
        p_estado: filtros.estado || 'All'
      })

      if (error) {
        console.error('Error en RPC get_ventas_ventas_grupo_mes:', error)
        throw error
      }

      setData(result || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filtros, forceRefresh])

  // Procesar datos para la tabla con doble agrupación
  const processTableData = () => {
    if (!data || data.length === 0) return { grupos: [], meses: [] }

    // Obtener lista única de meses ordenados
    const mesesSet = new Set()
    const gruposMap = new Map()

    data.forEach(item => {
      mesesSet.add(item.mes)
      
      if (!gruposMap.has(item.gpo)) {
        gruposMap.set(item.gpo, {
          grupo: item.gpo,
          data2024: {},
          data2025: {},
          total2024: 0,
          total2025: 0
        })
      }
      
      const grupo = gruposMap.get(item.gpo)
      const valor2024 = parseFloat(item['2024']) || 0
      const valor2025 = parseFloat(item['2025']) || 0
      
      grupo.data2024[item.mes] = valor2024
      grupo.data2025[item.mes] = valor2025
      grupo.total2024 += valor2024
      grupo.total2025 += valor2025
    })

    // Ordenar meses
    const mesesOrdenados = Array.from(mesesSet).sort((a, b) => {
      const mesesOrder = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      return mesesOrder.indexOf(a) - mesesOrder.indexOf(b)
    })

    return {
      grupos: Array.from(gruposMap.values()).sort((a, b) => a.grupo.localeCompare(b.grupo)),
      meses: mesesOrdenados
    }
  }

  const { grupos, meses } = processTableData()

  // Calcular totales generales por mes y año
  const calculateTotals = () => {
    const totales = {
      meses2024: {},
      meses2025: {},
      total2024: 0,
      total2025: 0
    }

    // Inicializar totales por mes
    meses.forEach(mes => {
      totales.meses2024[mes] = 0
      totales.meses2025[mes] = 0
    })

    // Sumar todos los valores
    grupos.forEach(grupo => {
      totales.total2024 += grupo.total2024
      totales.total2025 += grupo.total2025
      
      meses.forEach(mes => {
        totales.meses2024[mes] += grupo.data2024[mes] || 0
        totales.meses2025[mes] += grupo.data2025[mes] || 0
      })
    })

    return totales
  }

  const totales = calculateTotals()

  const formatNumber = (num) => {
    if (num === 0) return '0.00'
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num)
  }

  const getVariationIcon = (val2024, val2025) => {
    if (val2025 > val2024) {
      return <TrendingUp className="h-3 w-3 text-green-500 inline ml-1" />
    } else if (val2025 < val2024) {
      return <TrendingDown className="h-3 w-3 text-red-500 inline ml-1" />
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
        
        {/* Skeleton para tabla */}
        <div className="space-y-3">
          {/* Header de tabla */}
          <div className="flex space-x-2 pb-2 border-b border-gray-100">
            <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            ))}
          </div>
          
          {/* Filas de tabla */}
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex space-x-2 py-2">
              <div className="h-4 bg-gray-100 rounded w-24 animate-pulse"></div>
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-4 bg-gray-100 rounded w-16 animate-pulse"></div>
              ))}
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
        <div className="text-center py-8">
          <p className="text-red-600">Error: {error}</p>
        </div>
      </div>
    )
  }

  // Preparar datos para exportación
  const prepareExportData = () => {
    const exportData = []
    grupos.forEach(grupo => {
      // Fila 2024
      const row2024 = { grupo: `${grupo.grupo} (2024)` }
      meses.forEach(mes => {
        row2024[mes] = grupo.data2024[mes] || 0
      })
      row2024['Total'] = grupo.total2024
      exportData.push(row2024)
      
      // Fila 2025
      const row2025 = { grupo: `${grupo.grupo} (2025)` }
      meses.forEach(mes => {
        row2025[mes] = grupo.data2025[mes] || 0
      })
      row2025['Total'] = grupo.total2025
      exportData.push(row2025)
    })
    return exportData
  }

  const exportColumns = [
    { key: 'grupo', header: 'Grupo - Año', formatter: (value) => String(value || '') },
    ...meses.map(mes => ({
      key: mes,
      header: mes,
      formatter: (value) => (value || 0).toLocaleString()
    })),
    { key: 'Total', header: 'Total', formatter: (value) => (value || 0).toLocaleString() }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-2 md:p-4 h-[500px] flex flex-col">
      {/* Barra de botones superior */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton 
          onRefresh={fetchData}
        />
        <ExpandWidgetButton title="Ventas por Grupo y Mes">
          <div className="h-[600px] relative">
            <div className="overflow-auto h-full">
              <table className="border-collapse border border-gray-200 w-full" style={{ minWidth: '800px' }}>
                <thead className="bg-blue-900 text-white sticky top-0 z-10">
                  <tr>
                    <th className="text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200" style={{ width: '160px', maxWidth: '160px' }}>
                      <div className="px-2 py-2">Grupo - Mes</div>
                    </th>
                    {meses.map((mes) => (
                      <th key={mes} className="text-center text-xs font-medium uppercase tracking-wider border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                        <div className="px-2 py-2">{mes}</div>
                      </th>
                    ))}
                    <th className="text-center text-xs font-medium uppercase tracking-wider border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                      <div className="px-2 py-2">Total</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {grupos.map((grupo, index) => (
                    <React.Fragment key={grupo.grupo}>
                      {/* Fila 2024 */}
                      <tr key={`${grupo.grupo}-2024`} className="border-b border-gray-200">
                        <td className="border-r border-gray-200 bg-blue-900 text-white" style={{ width: '160px', maxWidth: '160px' }} rowSpan={2}>
                          <div className="px-2 py-2 h-full flex items-start justify-between">
                            {/* Columna izquierda - Nombre del rubro */}
                            <div className="flex-1 min-w-0">
                              <span className="font-semibold text-xs truncate block">{grupo.grupo}</span>
                            </div>
                            {/* Columna derecha - Badges de años */}
                            <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
                              <div className="text-xs bg-blue-700 px-2 py-1 rounded text-white font-medium">2024</div>
                              <div className="text-xs px-2 py-1 rounded text-white font-medium" style={{ backgroundColor: '#10b981' }}>2025</div>
                            </div>
                          </div>
                        </td>
                        {meses.map((mes) => (
                          <td key={`${grupo.grupo}-2024-${mes}`} className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                            <div className="px-2 py-1">
                              <span className="text-blue-700 font-medium text-xs">
                                {formatNumber(grupo.data2024[mes] || 0)}
                              </span>
                            </div>
                          </td>
                        ))}
                        {/* Columna Total 2024 */}
                        <td className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                          <div className="px-2 py-1">
                            <span className="text-blue-700 font-bold text-xs">
                              {formatNumber(grupo.total2024)}
                            </span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Fila 2025 */}
                      <tr key={`${grupo.grupo}-2025`} className="border-b border-gray-200">
                        {meses.map((mes) => (
                          <td key={`${grupo.grupo}-2025-${mes}`} className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                            <div className="px-2 py-1">
                              <span className="text-gray-600 font-medium text-xs">
                                {formatNumber(grupo.data2025[mes] || 0)}
                                {getVariationIcon(grupo.data2024[mes] || 0, grupo.data2025[mes] || 0)}
                              </span>
                            </div>
                          </td>
                        ))}
                        {/* Columna Total 2025 */}
                        <td className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                          <div className="px-2 py-1">
                            <span className="text-gray-600 font-bold text-xs">
                              {formatNumber(grupo.total2025)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  {/* Fila de totales 2024 */}
                  <tr className="border-b border-gray-200">
                    <td className="border-r border-gray-200 bg-gray-200" style={{ width: '160px', maxWidth: '160px' }} rowSpan={2}>
                      <div className="px-2 py-2 h-full flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-xs text-gray-800 block">TOTALES</span>
                        </div>
                        <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
                          <div className="text-xs bg-blue-700 px-2 py-1 rounded text-white font-medium">2024</div>
                          <div className="text-xs px-2 py-1 rounded text-white font-medium" style={{ backgroundColor: '#10b981' }}>2025</div>
                        </div>
                      </div>
                    </td>
                    {meses.map((mes) => (
                      <td key={`total-2024-${mes}`} className="text-center border-r border-gray-200 bg-blue-50" style={{ width: '110px', minWidth: '110px' }}>
                        <div className="px-2 py-1">
                          <span className="text-blue-800 font-bold text-xs">
                            {formatNumber(totales.meses2024[mes] || 0)}
                          </span>
                        </div>
                      </td>
                    ))}
                    <td className="text-center border-r border-gray-200 bg-blue-100" style={{ width: '110px', minWidth: '110px' }}>
                      <div className="px-2 py-1">
                        <span className="text-blue-800 font-bold text-xs">
                          {formatNumber(totales.total2024)}
                        </span>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Fila de totales 2025 */}
                  <tr className="border-b border-gray-200">
                    {meses.map((mes) => (
                      <td key={`total-2025-${mes}`} className="text-center border-r border-gray-200 bg-green-50" style={{ width: '110px', minWidth: '110px' }}>
                        <div className="px-2 py-1">
                          <span className="text-gray-800 font-bold text-xs">
                            {formatNumber(totales.meses2025[mes] || 0)}
                            {getVariationIcon(totales.meses2024[mes] || 0, totales.meses2025[mes] || 0)}
                          </span>
                        </div>
                      </td>
                    ))}
                    <td className="text-center border-r border-gray-200 bg-green-100" style={{ width: '110px', minWidth: '110px' }}>
                      <div className="px-2 py-1">
                        <span className="text-gray-800 font-bold text-xs">
                          {formatNumber(totales.total2025)}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </ExpandWidgetButton>
        <ExcelExportButton
          data={prepareExportData()}
          filename="ventas_grupo_mes"
          title="Reporte de Ventas por Grupo y Mes"
          sheetName="Ventas Grupo-Mes"
          columns={exportColumns}
        />
      </div>
      {grupos.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="border-collapse border border-gray-200" style={{ minWidth: '800px' }}>
              <thead className="bg-blue-900 text-white sticky top-0 z-10">
                <tr>
                  <th className="text-left text-xs font-medium uppercase tracking-wider border-r border-gray-200" style={{ width: '160px', maxWidth: '160px' }}>
                    <div className="px-2 py-2">Grupo - Mes</div>
                  </th>
                  {meses.map((mes) => (
                    <th key={mes} className="text-center text-xs font-medium uppercase tracking-wider border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                      <div className="px-2 py-2">{mes}</div>
                    </th>
                  ))}
                  <th className="text-center text-xs font-medium uppercase tracking-wider border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                    <div className="px-2 py-2">Total</div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {grupos.map((grupo, index) => (
                  <React.Fragment key={grupo.grupo}>
                    {/* Fila 2024 */}
                    <tr key={`${grupo.grupo}-2024`} className="border-b border-gray-200">
                      <td className="border-r border-gray-200 bg-blue-900 text-white" style={{ width: '160px', maxWidth: '160px' }} rowSpan={2}>
                        <div className="px-2 py-2 h-full flex items-start justify-between">
                          {/* Columna izquierda - Nombre del rubro */}
                          <div className="flex-1 min-w-0">
                            <span className="font-semibold text-xs truncate block">{grupo.grupo}</span>
                          </div>
                          {/* Columna derecha - Badges de años */}
                          <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
                            <div className="text-xs bg-blue-700 px-2 py-1 rounded text-white font-medium">2024</div>
                            <div className="text-xs px-2 py-1 rounded text-white font-medium" style={{ backgroundColor: '#10b981' }}>2025</div>
                          </div>
                        </div>
                      </td>
                      {meses.map((mes) => (
                        <td key={`${grupo.grupo}-2024-${mes}`} className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                          <div className="px-2 py-1">
                            <span className="text-blue-700 font-medium text-xs">
                              {formatNumber(grupo.data2024[mes] || 0)}
                            </span>
                          </div>
                        </td>
                      ))}
                      {/* Columna Total 2024 */}
                      <td className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                        <div className="px-2 py-1">
                          <span className="text-blue-700 font-bold text-xs">
                            {formatNumber(grupo.total2024)}
                          </span>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Fila 2025 */}
                    <tr key={`${grupo.grupo}-2025`} className="border-b border-gray-200">
                      {meses.map((mes) => (
                        <td key={`${grupo.grupo}-2025-${mes}`} className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                          <div className="px-2 py-1">
                            <span className="text-gray-600 font-medium text-xs">
                              {formatNumber(grupo.data2025[mes] || 0)}
                              {getVariationIcon(grupo.data2024[mes] || 0, grupo.data2025[mes] || 0)}
                            </span>
                          </div>
                        </td>
                      ))}
                      {/* Columna Total 2025 */}
                      <td className="text-center border-r border-gray-200" style={{ width: '110px', minWidth: '110px' }}>
                        <div className="px-2 py-1">
                          <span className="text-gray-600 font-bold text-xs">
                            {formatNumber(grupo.total2025)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                {/* Fila de totales 2024 */}
                <tr className="border-b border-gray-200">
                  <td className="border-r border-gray-200 bg-gray-200" style={{ width: '160px', maxWidth: '160px' }} rowSpan={2}>
                    <div className="px-2 py-2 h-full flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-xs text-gray-800 block">TOTALES</span>
                      </div>
                      <div className="flex flex-col space-y-1 ml-2 flex-shrink-0">
                        <div className="text-xs bg-blue-700 px-2 py-1 rounded text-white font-medium">2024</div>
                        <div className="text-xs px-2 py-1 rounded text-white font-medium" style={{ backgroundColor: '#10b981' }}>2025</div>
                      </div>
                    </div>
                  </td>
                  {meses.map((mes) => (
                    <td key={`total-2024-${mes}`} className="text-center border-r border-gray-200 bg-blue-50" style={{ width: '110px', minWidth: '110px' }}>
                      <div className="px-2 py-1">
                        <span className="text-blue-800 font-bold text-xs">
                          {formatNumber(totales.meses2024[mes] || 0)}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="text-center border-r border-gray-200 bg-blue-100" style={{ width: '110px', minWidth: '110px' }}>
                    <div className="px-2 py-1">
                      <span className="text-blue-800 font-bold text-xs">
                        {formatNumber(totales.total2024)}
                      </span>
                    </div>
                  </td>
                </tr>
                
                {/* Fila de totales 2025 */}
                <tr className="border-b border-gray-200">
                  {meses.map((mes) => (
                    <td key={`total-2025-${mes}`} className="text-center border-r border-gray-200 bg-green-50" style={{ width: '110px', minWidth: '110px' }}>
                      <div className="px-2 py-1">
                        <span className="text-gray-800 font-bold text-xs">
                          {formatNumber(totales.meses2025[mes] || 0)}
                          {getVariationIcon(totales.meses2024[mes] || 0, totales.meses2025[mes] || 0)}
                        </span>
                      </div>
                    </td>
                  ))}
                  <td className="text-center border-r border-gray-200 bg-green-100" style={{ width: '110px', minWidth: '110px' }}>
                    <div className="px-2 py-1">
                      <span className="text-gray-800 font-bold text-xs">
                        {formatNumber(totales.total2025)}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
        <span>Total de grupos: {grupos.length}</span>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span>2024</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-600 rounded"></div>
            <span>2025</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VentasGrupoMesWidget
