import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import SyncButton from './SyncButton'

const SincronizacionVentasTable = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(50)
  const [sortColumn, setSortColumn] = useState('ALIADO')
  const [sortDirection, setSortDirection] = useState('ASC')

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Obtener datos paginados y ordenados
      const { data: sincronizacionData, error: dataError } = await supabase.rpc(
        'get_sincronizacion_ventas',
        {
          p_page: currentPage,
          p_page_size: pageSize,
          p_sort_column: sortColumn,
          p_sort_direction: sortDirection
        }
      )

      if (dataError) throw dataError

      // Obtener conteo total para paginación
      const { data: countData, error: countError } = await supabase.rpc(
        'get_sincronizacion_ventas_count'
      )

      if (countError) throw countError

      setData(sincronizacionData)
      setTotalCount(countData)
      setError(null)
    } catch (err) {
      console.error('Error al cargar datos de sincronización:', err)
      setError('Error al cargar datos. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentPage, sortColumn, sortDirection]) // Removido pageSize ya que es constante

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Si ya estamos ordenando por esta columna, cambiamos la dirección
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC')
    } else {
      // Si es una nueva columna, ordenamos ascendente por defecto
      setSortColumn(column)
      setSortDirection('ASC')
    }
    // Volvemos a la primera página al cambiar el ordenamiento
    setCurrentPage(1)
  }

  const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return '-'
    try {
      const date = new Date(dateTimeStr)
      return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es })
    } catch (error) {
      return dateTimeStr
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Callback cuando la sincronización se completa
  const handleSyncComplete = (success, error) => {
    if (success) {
      // Recargar datos después de sincronización exitosa
      fetchData()
    }
  }

  const renderSortIcon = (column) => {
    if (sortColumn !== column) return null
    
    return sortDirection === 'ASC' 
      ? <ArrowUp className="inline w-4 h-4 ml-1" /> 
      : <ArrowDown className="inline w-4 h-4 ml-1" />
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="text-red-600 p-4 text-center">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 bg-[#1c398e] text-white font-semibold flex items-center justify-between">
        <span>Sincronización de ventas</span>
        <SyncButton 
          onSyncComplete={handleSyncComplete}
          buttonText="Sincronizar Datos"
          disabled={loading}
        />
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('ALIADO')}
              >
                Aliado {renderSortIcon('ALIADO')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('SUCURSAL')}
              >
                Sucursal {renderSortIcon('SUCURSAL')}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('ULTIMA_FECHA_CARGA')}
              >
                Última sincronización {renderSortIcon('ULTIMA_FECHA_CARGA')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              Array(5).fill(0).map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No hay datos de sincronización disponibles
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={`${row.aliadoid}-${row.sucursalid}-${index}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {row.aliado}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {row.sucursal}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(row.ultima_fecha_carga)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1 || loading}
            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage === 1 || loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Anterior
          </button>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
              currentPage >= totalPages || loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{data.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              de <span className="font-medium">{totalCount}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1 || loading}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 || loading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Anterior</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {/* Números de página */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Lógica para mostrar páginas alrededor de la actual
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-[#1c398e] border-[#1c398e] text-white'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={handleNextPage}
                disabled={currentPage >= totalPages || loading}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage >= totalPages || loading ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Siguiente</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SincronizacionVentasTable
