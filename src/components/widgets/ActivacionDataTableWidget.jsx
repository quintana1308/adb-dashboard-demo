import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const ActivacionDataTableWidget = forwardRef(({ 
  filtros, 
  tipo, 
  rpcFunction, 
  columns 
}, ref) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: 'sucursal', direction: 'asc' })
  const [totales, setTotales] = useState({})
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const tableRef = useRef(null)
  const pageSize = 100 // Tamaño de página para scroll infinito

  // Exponer función de refresh al componente padre
  useImperativeHandle(ref, () => ({
    refreshData: () => {
      setData([])
      setPage(1)
      setHasMore(true)
      setTotalRecords(0)
      setTotales({})
      fetchData(true) // true para reset completo
    }
  }))

  const [sorting, setSorting] = useState({
    column: 'sucursal',
    direction: 'ASC'
  })
  const observer = useRef()

  // Reset data when filters or sorting change
  useEffect(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    fetchData(true)
  }, [filtros, sorting])

  // Infinite scroll observer
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

  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    setError(null)
    
    try {
      const pageToFetch = isInitial ? 1 : page
      

      // Preparar parámetros para la función RPC
      const params = {
        p_mes: filtros.mes === 'All' ? null : filtros.mes,
        p_region: filtros.region === 'All' ? null : filtros.region,
        p_estado: filtros.estado === 'All' ? null : filtros.estado,
        p_aliado: filtros.aliado === 'All' ? null : filtros.aliado,
        p_sucursal: filtros.sucursal === 'All' ? null : filtros.sucursal,
        p_page: pageToFetch,
        p_page_size: pageSize,
        p_sort_column: sorting.column,
        p_sort_direction: sorting.direction
      }

      // Para SKU, agregar parámetro adicional si existe
      if (rpcFunction === 'get_act_aliados_sku' || rpcFunction === 'get_act_aliados_sku_v2') {
        params.p_sku = filtros.sku === 'All' ? null : filtros.sku
      }


      const { data: result, error: rpcError } = await supabase.rpc(rpcFunction, params)

      if (rpcError) {
        console.error('Error en RPC:', rpcError)
        throw rpcError
      }

      if (!result || result.length === 0) {
        if (isInitial) {
          setData([])
          setTotalRecords(0)
        }
        setHasMore(false)
        return
      }


      const newTotalRecords = result[0]?.total_count || 0
      setTotalRecords(newTotalRecords)

      if (isInitial) {
        setData(result)
      } else {
        setData(prevData => [...prevData, ...result])
      }

      // Check if there are more pages
      const totalPages = Math.ceil(newTotalRecords / pageSize)
      setHasMore(pageToFetch < totalPages)

    } catch (error) {
      console.error(`Error cargando datos de ${tipo}:`, error)
      setError(error.message)
      if (isInitial) {
        setData([])
      }
    } finally {
      if (isInitial) {
        setLoading(false)
      } else {
        setLoadingMore(false)
      }
    }
  }

  const loadMore = () => {
    if (!hasMore || loadingMore) return
    setPage(prev => prev + 1)
    fetchData(false)
  }

  const handleSort = (columnKey) => {
    setSorting(prev => ({
      column: columnKey,
      direction: prev.column === columnKey && prev.direction === 'ASC' ? 'DESC' : 'ASC'
    }))
  }

  const getSortIcon = (columnKey) => {
    if (sorting.column !== columnKey) {
      return <ChevronUp className="w-3 h-3 opacity-30" />
    }
    return sorting.direction === 'ASC' ? 
      <ChevronUp className="w-3 h-3 text-slate-600" /> : 
      <ChevronDown className="w-3 h-3 text-slate-600" />
  }

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '-'
    
    // Formatear porcentajes
    if (column.key.includes('porcentaje')) {
      return `${value}%`
    }
    
    // Formatear números grandes con separadores de miles
    if (typeof value === 'number' && (column.key === 'a2024' || column.key === 'a2025' || column.key === 'c2024' || column.key === 'c2025')) {
      return value.toLocaleString()
    }
    
    return value
  }

  // Calcular totales para las columnas numéricas
  const calculateTotals = () => {
    if (!data || data.length === 0) return {}
    
    const totals = {}
    const numericColumns = ['a2024', 'c2024', 'a2025', 'c2025']
    
    numericColumns.forEach(col => {
      totals[col] = data.reduce((sum, row) => {
        const value = row[col]
        return sum + (typeof value === 'number' ? value : 0)
      }, 0)
    })
    
    return totals
  }



  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error al cargar los datos</div>
          <div className="text-sm text-gray-500">{error}</div>
          <button 
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-purolomo-red text-white rounded transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
      {/* Tabla con altura fija y scroll */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[800px] table-auto md:table-fixed">
            <thead className="bg-gradient-to-r from-slate-200 to-slate-300 border-b-2 border-slate-400 sticky top-0 z-10">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`px-2 md:px-6 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider ${
                      column.align === 'right' ? 'text-right' : 'text-left'
                    } ${column.sortable ? 'cursor-pointer hover:bg-slate-400 transition-colors' : ''} ${
                      index < columns.length - 1 ? 'border-r border-gray-300' : ''
                    } whitespace-nowrap`}
                    onClick={() => column.sortable && handleSort(column.key)}
                    style={{ 
                      width: column.width || 'auto',
                      minWidth: column.width ? '0' : 'auto',
                      maxWidth: column.width || 'none'
                    }}
                  >
                    <div className={`flex items-center ${column.align === 'right' ? 'justify-end' : 'justify-start'} space-x-1`}>
                      <span className="truncate">{column.label}</span>
                      {column.sortable && getSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 md:px-6 py-12 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                      <span className="text-sm md:text-base text-gray-500">Cargando datos...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 md:px-6 py-12 text-center text-sm md:text-base text-gray-500">
                    No se encontraron datos con los filtros seleccionados
                  </td>
                </tr>
              ) : (
                <>
                  {data.map((row, index) => {
                    const isLast = index === data.length - 1
                    return (
                      <tr 
                        key={index}
                        ref={isLast ? lastElementRef : null}
                        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {columns.map((column, colIndex) => (
                          <td
                            key={column.key}
                            className={`px-2 md:px-6 py-2 text-xs md:text-sm text-gray-900 ${
                              column.align === 'right' ? 'text-right' : 'text-left'
                            } ${colIndex < columns.length - 1 ? 'border-r border-gray-200' : ''} ${column.key === 'sucursal' ? 'w-[250px]' : ''}`}
                          >
                            <div 
                              className={`${column.key === 'sucursal' ? 'truncate' : ''}`}
                              title={column.key === 'sucursal' ? formatValue(row[column.key], column) : undefined}
                            >
                              {formatValue(row[column.key], column)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                  
                  {/* Loading more indicator */}
                  {loadingMore && (
                    <tr>
                      <td colSpan={columns.length} className="px-2 md:px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span className="text-xs md:text-sm text-gray-500">Cargando más datos...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fila de totales fija - siempre visible */}
      {!loading && data.length > 0 && (
        <div className="border-t-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] table-auto">
              <tbody>
                <tr className="font-semibold">
                  {columns.map((column, colIndex) => {
                    const totals = calculateTotals()
                    return (
                      <td
                        key={column.key}
                        className={`px-2 md:px-6 py-2 whitespace-nowrap text-xs md:text-sm text-blue-900 ${
                          column.align === 'right' ? 'text-right' : 'text-left'
                        } ${colIndex < columns.length - 1 ? 'border-r border-blue-200' : ''} ${
                          column.key === 'sucursal' ? 'w-[250px]' : ''
                        }`}
                      >
                        {colIndex === 0 
                          ? `TOTAL: ${totalRecords.toLocaleString()}`
                          : column.key === 'mes' || column.key.includes('porcentaje')
                            ? ''
                            : totals[column.key] 
                              ? formatValue(totals[column.key], column)
                              : ''
                        }
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
})

ActivacionDataTableWidget.displayName = 'ActivacionDataTableWidget'

export default ActivacionDataTableWidget
