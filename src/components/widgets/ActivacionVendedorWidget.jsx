import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { RefreshCw } from 'lucide-react'

const ActivacionVendedorWidget = forwardRef(({ filtros }, ref) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [totales, setTotales] = useState({
    totalActivacionAcumulada: 0,
    totalCarteraGeneral: 0,
    promedioProcentajeAcumulado: 0
  })

  // Exponer función de refresh al componente padre
  useImperativeHandle(ref, () => ({
    refreshData: () => {
      fetchData()
    }
  }))

  useEffect(() => {
    fetchData()
  }, [filtros])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      // Siempre enviar los parámetros, incluso si son 'All'
      params.append('anio', filtros.anio || 'All')
      params.append('mes', filtros.mes || 'All')
      params.append('codigoruta', filtros.codigoruta || 'All')

      console.log('Fetching data with params:', params.toString())
      console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Full URL:', `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-activacion-vendedor?${params}`)

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-activacion-vendedor?${params}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const { data: result, totalCount, error: edgeError, debug } = await response.json()

      if (edgeError) {
        throw new Error(edgeError)
      }

      console.log('Data received:', result?.length, 'records')
      console.log('Debug info:', debug)
      setData(result || [])
      setTotalRecords(totalCount || result?.length || 0)

      // Actualizar contador de registros en la tarjeta
      const totalRegistrosElement = document.getElementById('totalRegistros')
      if (totalRegistrosElement) {
        totalRegistrosElement.textContent = formatNumber(totalCount || result?.length || 0)
      }

      // Obtener totales
      await fetchTotales()

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos: ' + error.message)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchTotales = async () => {
    try {
      const params = new URLSearchParams()
      // Siempre enviar los parámetros, incluso si son 'All'
      params.append('anio', filtros.anio || 'All')
      params.append('mes', filtros.mes || 'All')
      params.append('codigoruta', filtros.codigoruta || 'All')

      console.log('Fetching totales with params:', params.toString())

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-activacion-vendedor-totales?${params}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const totalesResult = await response.json()
      
      const totalesData = {
        totalActivacionAcumulada: totalesResult.total_activacion_acumulada || 0,
        totalCarteraGeneral: totalesResult.total_cartera_general || 0,
        promedioProcentajeAcumulado: totalesResult.promedio_porcentaje_acumulado || 0
      }

      setTotales(totalesData)

      // Actualizar las tarjetas del lado derecho
      const totalActivacionElement = document.getElementById('totalActivacionAcumulada')
      if (totalActivacionElement) {
        totalActivacionElement.textContent = formatNumber(totalesData.totalActivacionAcumulada)
      }

      const totalCarteraElement = document.getElementById('totalCarteraGeneral')
      if (totalCarteraElement) {
        totalCarteraElement.textContent = formatNumber(totalesData.totalCarteraGeneral)
      }

      const promedioProcentajeElement = document.getElementById('promedioProcentajeAcumulado')
      if (promedioProcentajeElement) {
        promedioProcentajeElement.textContent = formatPercentage(totalesData.promedioProcentajeAcumulado)
      }

    } catch (error) {
      console.error('Error al cargar totales:', error)
    }
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return '0.00%'
    return `${parseFloat(num).toFixed(2)}%`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando datos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-red-600">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Cargando datos...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-600">
          {error}
        </div>
      ) : (
        <div className="h-[calc(100vh-200px)] overflow-y-auto overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Año</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código Ruta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Acumulado Mes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activación Acumulada</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera General</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera S1</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera S2</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera S3</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera S4</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cartera S5</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activación S1</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activación S2</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activación S3</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activación S4</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Activación S5</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% S1</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% S2</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% S3</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% S4</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% S5</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan="22" className="px-6 py-8 text-center text-gray-500">
                    No hay datos disponibles con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.anio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.mes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.codigoruta}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.vendedor}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPercentage(row.porcentaje_acumulado_mes)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.activacion_acumulada_mes)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.cartera_general)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{row.cartera_semana1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.cartera_semana2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.cartera_semana3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.cartera_semana4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.cartera_semana5)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{row.activacion_semana1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.activacion_semana2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.activacion_semana3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.activacion_semana4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatNumber(row.activacion_semana5)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPercentage(row.porcentaje_semana1)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPercentage(row.porcentaje_semana2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPercentage(row.porcentaje_semana3)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPercentage(row.porcentaje_semana4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatPercentage(row.porcentaje_semana5)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
})

ActivacionVendedorWidget.displayName = 'ActivacionVendedorWidget'

export default ActivacionVendedorWidget
