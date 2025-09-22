import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react'

const ActivacionVendedorDataTableWidget = forwardRef(({ 
  filtros, 
  columns,
  onTotalsChange
}, ref) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sorting, setSorting] = useState({ column: 'anio', direction: 'ASC' })
  const observer = useRef()
  const pageSize = 100

  useImperativeHandle(ref, () => ({
    refreshData: () => {
      setData([])
      setPage(1)
      setHasMore(true)
      setTotalRecords(0)
      fetchData(true)
      fetchTotals()
    }
  }))

  useEffect(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    fetchData(true)
    fetchTotals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, sorting])

  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return
    if (observer.current) observer.current.disconnect()
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })
    if (node) observer.current.observe(node)
  }, [loading, loadingMore, hasMore])

  const fetchData = async (reset = false) => {
    if (reset) {
      setLoading(true)
      setError(null)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams()
      // Siempre enviar los parámetros, incluso si son 'All'
      params.append('anio', filtros.anio || 'All')
      params.append('mes', filtros.mes || 'All')
      params.append('codigoruta', filtros.codigoruta || 'All')
      params.append('page', reset ? '1' : page.toString())
      params.append('pageSize', pageSize.toString())
      params.append('sortColumn', sorting.column)
      params.append('sortDirection', sorting.direction)

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-activacion-vendedor?${params}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const { data: result, totalCount, error: edgeError } = await response.json()

      if (edgeError) {
        throw new Error(edgeError)
      }

      if (reset) {
        setData(result || [])
        setPage(2)
      } else {
        setData(prev => [...prev, ...(result || [])])
        setPage(prev => prev + 1)
      }

      setTotalRecords(totalCount || 0)
      setHasMore((result || []).length === pageSize)

    } catch (error) {
      console.error('Error al cargar datos:', error)
      setError('Error al cargar los datos: ' + error.message)
      if (reset) setData([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchTotals = async () => {
    try {
      const params = new URLSearchParams()
      params.append('anio', filtros.anio || 'All')
      params.append('mes', filtros.mes || 'All')
      params.append('codigoruta', filtros.codigoruta || 'All')

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
      
      const totales = {
        totalActivacionAcumulada: totalesResult.total_activacion_acumulada || 0,
        totalCarteraGeneral: totalesResult.total_cartera_general || 0,
        promedioProcentajeAcumulado: totalesResult.promedio_porcentaje_acumulado || 0
      }

      if (onTotalsChange) {
        onTotalsChange(totales)
      }

    } catch (error) {
      console.error('Error al cargar totales:', error)
    }
  }

  const loadMore = () => {
    if (!hasMore || loading || loadingMore) return
    fetchData(false)
  }

  const handleSort = (columnKey) => {
    const newDirection = sorting.column === columnKey && sorting.direction === 'ASC' ? 'DESC' : 'ASC'
    setSorting({ column: columnKey, direction: newDirection })
  }

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0'
    return new Intl.NumberFormat('es-ES').format(num)
  }

  const formatPercentage = (num) => {
    if (num === null || num === undefined) return '0.00%'
    return `${parseFloat(num).toFixed(2)}%`
  }

  const renderCellValue = (row, column) => {
    const value = row[column.key]
    
    if (column.key.includes('porcentaje')) {
      return formatPercentage(value)
    }
    
    if (column.align === 'right' && typeof value === 'number') {
      return formatNumber(value)
    }
    
    return value || ''
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sorting.column === column.key && (
                      sorting.direction === 'ASC' ? 
                        <ChevronUp className="w-4 h-4" /> : 
                        <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-gray-600">Cargando datos...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                  No hay datos disponibles con los filtros seleccionados
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-50"
                  ref={index === data.length - 1 ? lastElementRef : null}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {renderCellValue(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {loadingMore && (
          <div className="flex items-center justify-center py-4 border-t border-gray-200">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600">Cargando más datos...</span>
          </div>
        )}
        
        {data.length > 0 && !hasMore && (
          <div className="text-center py-4 border-t border-gray-200 text-sm text-gray-500">
            Se han cargado todos los registros ({totalRecords} total)
          </div>
        )}
      </div>
    </div>
  )
})

ActivacionVendedorDataTableWidget.displayName = 'ActivacionVendedorDataTableWidget'

export default ActivacionVendedorDataTableWidget
