import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import { ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const FinanzasDataTableWidget = forwardRef(({ 
  filtros, 
  rpcFunction,
  totalsRpcFunction,
  columns,
  onTotalsChange,
  onTotalUpdate,
  edgeFunctionName,
  totalsEdgeFunctionName
}, ref) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sorting, setSorting] = useState({ column: columns?.[0]?.key || 'AÑO', direction: 'ASC' })
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

  // Función para calcular el total de gastos generales
  const calculateGastosGeneralesTotal = useCallback((dataArray) => {
    if (!dataArray || dataArray.length === 0) return 0
    
    return dataArray.reduce((total, row) => {
      const gastosGenerales = parseFloat(row.gastosgenerales) || 0
      return total + gastosGenerales
    }, 0)
  }, [])

  useEffect(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    fetchData(true)
    fetchTotals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, sorting])

  // Calcular y enviar el total cuando cambien los datos
  useEffect(() => {
    if (onTotalUpdate && data.length > 0) {
      const total = calculateGastosGeneralesTotal(data)
      onTotalUpdate(total)
    } else if (onTotalUpdate && data.length === 0) {
      onTotalUpdate(0)
    }
  }, [data, onTotalUpdate, calculateGastosGeneralesTotal])

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
    if (isInitial) setLoading(true)
    else setLoadingMore(true)
    setError(null)
    try {
      const pageToFetch = isInitial ? 1 : page

      // Si hay Edge Function, usarla en lugar de RPC
      if (edgeFunctionName) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/${edgeFunctionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': supabase.supabaseKey
          },
          body: JSON.stringify(filtros)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const { data: result, totalCount, error: edgeError } = await response.json()
        
        if (edgeError) {
          throw new Error(edgeError)
        }

        if (!result || result.length === 0) {
          if (isInitial) {
            setData([])
            setTotalRecords(totalCount || 0)
          }
          setHasMore(false)
          return
        }

        // Para Edge Functions, manejamos la paginación en el cliente
        const startIndex = (pageToFetch - 1) * pageSize
        const endIndex = startIndex + pageSize
        const paginatedResult = result.slice(startIndex, endIndex)

        setTotalRecords(totalCount || result.length)

        if (isInitial) {
          setData(paginatedResult)
          setPage(1)
        } else {
          setData(prev => [...prev, ...paginatedResult])
          setPage(prev => prev + 1)
        }

        setHasMore(endIndex < result.length)
        return
      }

      // Lógica RPC original
      const params = {
        p_page: pageToFetch,
        p_page_size: pageSize,
        p_sort_column: sorting.column,
        p_sort_direction: sorting.direction
      }
      
      // Filtros de rentabilidad
      if (filtros.anio !== undefined) params.p_anio = filtros.anio === 'All' ? null : filtros.anio
      if (filtros.mes !== undefined) params.p_mes = filtros.mes === 'All' ? null : filtros.mes
      if (filtros.categoria !== undefined) params.p_categoria = filtros.categoria === 'All' ? null : filtros.categoria
      if (filtros.producto !== undefined) params.p_producto = filtros.producto === 'All' ? null : filtros.producto
      
      // Filtros de cobranza
      if (filtros.diavisita !== undefined) params.p_diavisita = filtros.diavisita === 'All' ? null : filtros.diavisita
      if (filtros.codigoruta !== undefined) params.p_codigoruta = filtros.codigoruta === 'All' ? null : filtros.codigoruta
      
      // Filtros de egresos
      if (filtros.dia !== undefined) params.p_dia = filtros.dia === 'All' ? null : filtros.dia
      if (filtros.clasificacion !== undefined) params.p_clasificacion = filtros.clasificacion === 'All' ? null : filtros.clasificacion
      if (filtros.cuenta !== undefined) params.p_cuenta = filtros.cuenta === 'All' ? null : filtros.cuenta
      if (filtros.centrodecosto !== undefined) params.p_centrodecosto = filtros.centrodecosto === 'All' ? null : filtros.centrodecosto
      if (filtros.nivelcuenta !== undefined) params.p_nivelcuenta = filtros.nivelcuenta === 'All' ? null : filtros.nivelcuenta
      
      // Filtros comunes
      if (filtros.cliente !== undefined) params.p_cliente = filtros.cliente === 'All' ? null : filtros.cliente
      if (filtros.vendedor !== undefined) params.p_vendedor = filtros.vendedor === 'All' ? null : filtros.vendedor

      console.log('Calling RPC function:', rpcFunction, 'with params:', params)
      
      const { data: result, error: rpcError } = await supabase.rpc(rpcFunction, params)
      
      console.log('RPC result:', result)
      console.log('RPC error:', rpcError)
      console.log('Result type:', typeof result)
      console.log('Result length:', result?.length)
      
      if (rpcError) {
        console.error('RPC Error details:', rpcError)
        throw rpcError
      }

      if (!result || result.length === 0) {
        console.log('No data returned from RPC')
        if (isInitial) {
          setData([])
          setTotalRecords(0)
        }
        setHasMore(false)
        return
      }

      const newTotalRecords = result[0]?.total_count || 0
      console.log('Setting total records:', newTotalRecords)
      console.log('Result data sample:', result.slice(0, 2))
      setTotalRecords(newTotalRecords)

      if (isInitial) {
        console.log('Setting initial data, length:', result.length)
        setData(result)
        setPage(1)
      } else {
        console.log('Appending data, length:', result.length)
        setData(prev => [...prev, ...result])
        setPage(prev => prev + 1)
      }

      const totalPages = Math.ceil(newTotalRecords / pageSize)
      setHasMore(result.length === pageSize)
      console.log('Has more pages:', result.length === pageSize)
      setHasMore(pageToFetch < totalPages)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError(err.message)
      if (isInitial) setData([])
    } finally {
      if (isInitial) setLoading(false)
      else setLoadingMore(false)
    }
  }

  const fetchTotals = async () => {
    if ((!totalsRpcFunction && !totalsEdgeFunctionName) || !onTotalsChange) return
    try {
      // Si hay Edge Function para totales, usarla
      if (totalsEdgeFunctionName) {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token

        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/${totalsEdgeFunctionName}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': supabase.supabaseKey
          },
          body: JSON.stringify(filtros)
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const { data: result, error: edgeError } = await response.json()
        
        if (edgeError) {
          throw new Error(edgeError)
        }

        const totals = result || {}
        console.log('Edge Function totals:', totals)
        
        // Manejar totales de ventas generales
        if (totals.ventasunidadestotal !== undefined || totals.ventaskilostotal !== undefined) {
          onTotalsChange({
            ventasUnidadesTotal: totals.ventasunidadestotal ?? 0,
            ventasKilosTotal: totals.ventaskilostotal ?? 0,
            ventasCajasTotal: totals.ventascajastotal ?? 0,
            ventasUsdTotal: totals.ventasusdtotal ?? 0,
            tonelajeTotal: totals.tonelajetotal ?? 0
          })
        }
        return
      }

      // Lógica RPC original
      const params = {}
      
      // Filtros de rentabilidad
      if (filtros.anio !== undefined) params.p_anio = filtros.anio === 'All' ? null : filtros.anio
      if (filtros.mes !== undefined) params.p_mes = filtros.mes === 'All' ? null : filtros.mes
      if (filtros.categoria !== undefined) params.p_categoria = filtros.categoria === 'All' ? null : filtros.categoria
      if (filtros.producto !== undefined) params.p_producto = filtros.producto === 'All' ? null : filtros.producto
      
      // Filtros de cobranza
      if (filtros.diavisita !== undefined) params.p_diavisita = filtros.diavisita === 'All' ? null : filtros.diavisita
      if (filtros.codigoruta !== undefined) params.p_codigoruta = filtros.codigoruta === 'All' ? null : filtros.codigoruta
      
      // Filtros comunes
      if (filtros.cliente !== undefined) params.p_cliente = filtros.cliente === 'All' ? null : filtros.cliente
      if (filtros.vendedor !== undefined) params.p_vendedor = filtros.vendedor === 'All' ? null : filtros.vendedor

      console.log('Calling totals RPC with params:', params)
      const { data: result, error: rpcError } = await supabase.rpc(totalsRpcFunction, params)
      console.log('Totals RPC result:', result, 'Error:', rpcError)
      
      if (rpcError) throw rpcError
      
      const totals = result && result[0] ? result[0] : {}
      console.log('Processed totals:', totals)
      
      // Manejar diferentes tipos de totales
      if (totals.venta_bruta_total !== undefined) {
        // Totales de rentabilidad
        onTotalsChange({
          ventaBrutaTotal: totals.venta_bruta_total ?? 0,
          costoBrutoTotal: totals.costo_bruto_total ?? 0,
          utilidadPct: totals.utilidad_pct ?? 0
        })
      } else if (totals.saldo_total !== undefined) {
        // Totales de cobranza
        onTotalsChange({
          saldoTotal: totals.saldo_total ?? 0,
          valorVencidoTotal: totals.valor_vencido_total ?? 0,
          porcentajeVencimiento: totals.porcentaje_vencimiento ?? 0
        })
      }
    } catch (err) {
      console.error('Error cargando totales:', err)
      // Proporcionar valores por defecto según el tipo de función
      if (totalsRpcFunction?.includes('rentabilidad')) {
        onTotalsChange?.({ ventaBrutaTotal: 0, costoBrutoTotal: 0, utilidadPct: 0 })
      } else if (totalsRpcFunction?.includes('cobranza')) {
        onTotalsChange?.({ saldoTotal: 0, valorVencidoTotal: 0, porcentajeVencimiento: 0 })
      } else if (totalsEdgeFunctionName?.includes('ventas-generales')) {
        onTotalsChange?.({ 
          ventasUnidadesTotal: 0, 
          ventasKilosTotal: 0, 
          ventasCajasTotal: 0, 
          ventasUsdTotal: 0, 
          tonelajeTotal: 0 
        })
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
    if (sorting.column !== columnKey) return <ChevronUp className="w-3 h-3 opacity-30" />
    return sorting.direction === 'ASC' 
      ? <ChevronUp className="w-3 h-3 text-slate-600" /> 
      : <ChevronDown className="w-3 h-3 text-slate-600" />
  }

  const formatValue = (value, column) => {
    if (value === null || value === undefined) return '-'
    
    // Campos monetarios que necesitan formato de número
    const monetaryFields = ['venta_bruta', 'costo_bruto', 'saldo', 'valorvencido', 'gastosgenerales', 'ventas_usd']
    
    // Campos numéricos que necesitan formato con decimales
    const numericFields = ['ventas_kilos', 'ventas_cajas', 'tonelaje']
    
    // Campos de unidades (sin decimales)
    const unitFields = ['ventas_unidades']
    
    if (typeof value === 'number') {
      if (monetaryFields.includes(column.key)) {
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      } else if (numericFields.includes(column.key)) {
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      } else if (unitFields.includes(column.key)) {
        return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      }
    }
    
    // Formatear fechas
    if (column.key === 'dia' || column.key === 'fechadocumento') {
      if (value && typeof value === 'string') {
        return new Date(value).toLocaleDateString()
      }
    }
    
    return value
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <div className="text-red-600 mb-2">Error al cargar los datos</div>
          <div className="text-sm text-gray-500">{error}</div>
          <button onClick={() => fetchData(true)} className="mt-4 px-4 py-2 bg-purolomo-red text-white rounded transition-colors">Reintentar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-160px)]">
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-auto">
          <table className="w-full min-w-[900px] table-auto">
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
                    style={{ width: column.width || 'auto' }}
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
                      <tr key={index} ref={isLast ? lastElementRef : null} className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        {columns.map((column, colIndex) => (
                          <td
                            key={column.key}
                            className={`px-2 md:px-6 py-2 text-xs md:text-sm text-gray-900 ${
                              column.align === 'right' ? 'text-right' : 'text-left'
                            } ${colIndex < columns.length - 1 ? 'border-r border-gray-200' : ''}`}
                          >
                            <div>
                              {formatValue(row[column.key], column)}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )
                  })}
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
      {!loading && (
        <div className="border-t-2 border-blue-300 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="px-4 py-2 text-xs md:text-sm text-blue-900">
            Total registros: {totalRecords.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
})

FinanzasDataTableWidget.displayName = 'FinanzasDataTableWidget'

export default FinanzasDataTableWidget
