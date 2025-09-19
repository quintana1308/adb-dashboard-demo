import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp, TrendingDown } from 'lucide-react'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const VentasTipoClienteWidget = ({ filtros, forceRefresh }) => {
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
      const { data: functionData, error: functionError } = await supabase.functions.invoke('get-ventas-tipo-cliente-detallado', {
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
          region: filtros.region,
          estado: filtros.estado,
          tipo_cliente: filtros.tipo_cliente
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
      console.error('Error al cargar datos del widget VentasTipoCliente:', error)
      setError(error.message)
    } finally {
      setLoading(false)
      isLoadingRef.current = false
    }
  }

  useEffect(() => {
    fetchData()
  }, [filtros, forceRefresh])

  const formatNumber = (value, isPercentage = false) => {
    if (value === null || value === undefined) return '-'
    
    if (isPercentage) {
      return `${(value * 100).toFixed(2)}%`
    }
    
    return value.toLocaleString('es-CO', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  const formatDifference = (value) => {
    if (value === null || value === undefined) return '-'
    
    const percentage = (value * 100).toFixed(2)
    const isPositive = value >= 0
    
    return (
      <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
        {isPositive ? '+' : ''}{percentage}%
        {getVariationIcon(isPositive)}
      </span>
    )
  }

  const getVariationIcon = (isPositive) => {
    if (isPositive) {
      return <TrendingUp className="h-3 w-3 text-green-500 inline ml-1" />
    } else {
      return <TrendingDown className="h-3 w-3 text-red-500 inline ml-1" />
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-4 h-[500px] flex flex-col relative overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="overflow-x-auto">
            <table className="border-collapse border border-gray-200 min-w-full">
              {/* Header skeleton */}
              <thead className="sticky top-0 z-10" style={{ backgroundColor: '#1c398e' }}>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                    TIPO CLIENTE
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                    2024 (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                    2024
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                    2025 (%)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                    2025
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                    DIFERENCIA
                  </th>
                </tr>
              </thead>
              {/* Body skeleton */}
              <tbody className="bg-white">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <tr key={i} className={`border-b border-gray-200 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 border-r border-gray-200">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                    <td className="px-4 py-3 text-right border-r border-gray-200">
                      <div className="h-4 bg-gray-100 rounded w-16 animate-pulse ml-auto"></div>
                    </td>
                    <td className="px-4 py-3 text-right border-r border-gray-200">
                      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse ml-auto"></div>
                    </td>
                    <td className="px-4 py-3 text-right border-r border-gray-200">
                      <div className="h-4 bg-gray-100 rounded w-16 animate-pulse ml-auto"></div>
                    </td>
                    <td className="px-4 py-3 text-right border-r border-gray-200">
                      <div className="h-4 bg-gray-100 rounded w-20 animate-pulse ml-auto"></div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="h-4 bg-gray-100 rounded w-16 animate-pulse ml-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Shimmer effect global */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-6">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-500">No hay datos disponibles</p>
            <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros</p>
          </div>
        </div>
      </div>
    )
  }

  // Calcular totales
  const calculateTotals = () => {
    const totales = {
      total2024Percentage: 0,
      total2024: 0,
      total2025Percentage: 0,
      total2025: 0,
      totalDiferencia: 0
    }

    data.forEach(item => {
      totales.total2024Percentage += (item['2024 (%)'] || 0)
      totales.total2024 += (item['2024'] || 0)
      totales.total2025Percentage += (item['2025 (%)'] || 0)
      totales.total2025 += (item['2025'] || 0)
      totales.totalDiferencia += (item['DIFERENCIA'] || 0)
    })

    return totales
  }

  const totales = calculateTotals()

  // Preparar datos para exportar (incluyendo totales)
  const prepareExportData = () => {
    const exportData = data.map(item => ({
      'Tipo Cliente': item['TIPO CLIENTE'],
      '2024 (%)': item['2024 (%)'] ? `${item['2024 (%)'].toFixed(2)}%` : '0.00%',
      '2024': item['2024'] ? item['2024'].toLocaleString('es-CO') : '0',
      '2025 (%)': item['2025 (%)'] ? `${item['2025 (%)'].toFixed(2)}%` : '0.00%',
      '2025': item['2025'] ? item['2025'].toLocaleString('es-CO') : '0',
      'Diferencia': item['DIFERENCIA'] ? item['DIFERENCIA'].toLocaleString('es-CO') : '0'
    }));
    
    // Agregar fila de totales
    exportData.push({
      'Tipo Cliente': 'TOTALES',
      '2024 (%)': `${totales.total2024Percentage.toFixed(2)}%`,
      '2024': totales.total2024.toLocaleString('es-CO'),
      '2025 (%)': `${totales.total2025Percentage.toFixed(2)}%`,
      '2025': totales.total2025.toLocaleString('es-CO'),
      'Diferencia': totales.totalDiferencia.toLocaleString('es-CO')
    });
    
    return exportData;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-4 h-[500px] flex flex-col">
      {/* Barra de acciones */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton onRefresh={fetchData} />
        <ExpandWidgetButton title="Ventas por Tipo de Cliente">
          <div className="h-[600px] overflow-auto">
            <div className="overflow-x-auto">
              <table className="border-collapse border border-gray-200 min-w-full">
                <thead className="sticky top-0 z-10" style={{ backgroundColor: '#1c398e' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                      TIPO CLIENTE
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                      2024 (%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                      2024
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                      2025 (%)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                      2025
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                      DIFERENCIA
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {data.map((row, index) => (
                    <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                        {row['TIPO CLIENTE']}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                        {formatNumber(row['2024 (%)'], true)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                        {formatNumber(row['2024'])}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                        {formatNumber(row['2025 (%)'], true)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                        {formatNumber(row['2025'])}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatDifference(row['DIFERENCIA'])}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 border-r border-gray-200 bg-gray-200">
                      TOTALES
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-blue-50">
                      {formatNumber(totales.total2024Percentage, true)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-blue-100">
                      {formatNumber(totales.total2024)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-green-50">
                      {formatNumber(totales.total2025Percentage, true)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-green-100">
                      {formatNumber(totales.total2025)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-right">
                      {formatDifference(totales.totalDiferencia)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </ExpandWidgetButton>
        <ExcelExportButton
          data={prepareExportData()}
          filename="ventas_tipo_cliente"
          title="Reporte de Ventas por Tipo de Cliente"
          sheetName="Ventas Tipo Cliente"
          columns={[
            { header: 'Tipo Cliente', key: 'Tipo Cliente', width: 20 },
            { header: '2024 (%)', key: '2024 (%)', width: 12 },
            { header: '2024', key: '2024', width: 15 },
            { header: '2025 (%)', key: '2025 (%)', width: 12 },
            { header: '2025', key: '2025', width: 15 },
            { header: 'Diferencia', key: 'Diferencia', width: 15 }
          ]}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="overflow-x-auto">
          <table className="border-collapse border border-gray-200 min-w-full">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: '#1c398e' }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                  TIPO CLIENTE
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                  2024 (%)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                  2024
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                  2025 (%)
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider border-r border-gray-200">
                  2025
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                  DIFERENCIA
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.map((row, index) => (
                <tr key={index} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                    {row['TIPO CLIENTE']}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                    {formatNumber(row['2024 (%)'], true)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                    {formatNumber(row['2024'])}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                    {formatNumber(row['2025 (%)'], true)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right border-r border-gray-200">
                    {formatNumber(row['2025'])}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatDifference(row['DIFERENCIA'])}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 border-t-2 border-gray-300">
              <tr className="border-b border-gray-200">
                <td className="px-4 py-3 text-sm font-bold text-gray-800 border-r border-gray-200 bg-gray-200">
                  TOTALES
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-blue-50">
                  {formatNumber(totales.total2024Percentage, true)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-blue-100">
                  {formatNumber(totales.total2024)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-green-50">
                  {formatNumber(totales.total2025Percentage, true)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-800 text-right border-r border-gray-200 bg-green-100">
                  {formatNumber(totales.total2025)}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  {formatDifference(totales.totalDiferencia)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export default VentasTipoClienteWidget
