import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import ExcelExportButton from '../ExcelExportButton'
import ExpandWidgetButton from '../ExpandWidgetButton'
import RefreshWidgetButton from '../RefreshWidgetButton'

const ProductosListWidget = ({ filtros = {}, forceRefresh = 0 }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])
  const lastFiltrosRef = useRef(null)

  useEffect(() => {
    // Verificar si los filtros realmente han cambiado
    const currentFiltros = JSON.stringify(filtros)
    if (lastFiltrosRef.current !== currentFiltros) {
      lastFiltrosRef.current = currentFiltros
      fetchProductosList()
    }
  }, [filtros.mes, filtros.aliado, filtros.marca, filtros.gpo, filtros.aliado_especifico])

  // useEffect para manejar la recarga forzada
  useEffect(() => {
    if (forceRefresh > 0) {
      fetchProductosList()
    }
  }, [forceRefresh])

  const fetchProductosList = async () => {
    setLoading(true)
    try {
      // Preparar parámetros para la función RPC
      const params = {
        p_mes: filtros.mes === 'All' ? null : filtros.mes,
        p_aliado: filtros.aliado === 'All' ? null : filtros.aliado,
        p_marca: filtros.marca === 'All' ? null : filtros.marca,
        p_gpo: filtros.gpo === 'All' ? null : filtros.gpo,
        p_aliado_especifico: filtros.aliado_especifico === 'All' ? null : filtros.aliado_especifico
      }
      
      // Llamar a la función RPC que ejecuta la consulta SQL en la base de datos
      const { data: result, error } = await supabase.rpc('get_ventas_consolidado_productos_porcentaje', params)
      
      if (error) {
        console.error('Error en RPC get_ventas_consolidado_productos_porcentaje:', error)
        throw error
      }
      
      // Formatear los datos para el componente
      const productosArray = (result || []).map(row => ({
        producto: row.grupo,
        porcentaje: parseFloat(row.porcentaje) || 0
      }))
      
      setData(productosArray)
    } catch (error) {
      console.error('Error fetching productos list:', error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div 
        className="text-black p-6 rounded-lg shadow-lg relative overflow-hidden"
        style={{ height: '260px' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
        </div>
        
        <div className="space-y-3 overflow-y-auto" style={{ height: 'calc(260px - 120px)' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="flex justify-between items-center py-1">
              <div className="flex items-center flex-1 mr-3">
                <div 
                  className="h-3 bg-gray-200 rounded animate-pulse" 
                  style={{ width: `${Math.random() * 120 + 80}px` }}
                ></div>
              </div>
              <div className="flex items-center">
                <div 
                  className="h-3 bg-gray-300 rounded animate-pulse" 
                  style={{ width: `${Math.random() * 20 + 25}px` }}
                ></div>
                <span className="ml-1 text-xs text-gray-500">%</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Shimmer effect global */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>
      </div>
    )
  }

  // Estado vacío cuando no hay datos
  if (!data || data.length === 0) {
    return (
      <div 
        className="text-black p-6 rounded-lg shadow-lg"
        style={{ height: '260px' }}
      >
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-16 h-16 mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-base font-semibold mb-2">No hay datos disponibles</h3>
          <p className="text-xs text-gray-600 max-w-xs leading-relaxed">
            No se encontraron productos para los filtros seleccionados. 
            Verifica los criterios de búsqueda.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="text-black p-6 rounded-lg shadow-lg"
      style={{ height: '260px' }}
    >
      {/* Barra de botones superior */}
      <div className="flex justify-end items-center mb-2 h-6 gap-2">
        <RefreshWidgetButton 
          onRefresh={fetchProductosList}
        />
        <ExpandWidgetButton title="Productos por Porcentaje de Ventas">
          <div className="h-full overflow-y-auto">
            {data.map((producto, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center text-sm py-2 px-3 rounded transition-colors duration-200 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <span className="truncate flex-1 mr-3 uppercase font-medium" title={producto.producto?.toUpperCase()}>
                  {producto.producto?.toUpperCase() || 'N/A'}
                </span>
                <span className="font-semibold text-lg">{producto.porcentaje?.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </ExpandWidgetButton>
        <ExcelExportButton
          data={data}
          filename="productos_porcentaje"
          title="Reporte de Productos por Porcentaje de Ventas"
          sheetName="Productos"
          columns={[
            {
              key: 'producto',
              header: 'Producto',
              formatter: (value) => String(value || '').toUpperCase()
            },
            {
              key: 'porcentaje',
              header: 'Porcentaje (%)',
              formatter: (value) => `${(value || 0).toFixed(2)}%`
            }
          ]}
        />
      </div>
      
      <div className="overflow-y-auto" style={{ height: 'calc(260px - 72px)' }}>
        {data.map((producto, index) => (
          <div 
            key={index} 
            className="flex justify-between items-center text-sm py-1 px-2 rounded transition-colors duration-200 hover:bg-gray-100 cursor-pointer"
          >
            <span className="truncate flex-1 mr-2 uppercase" title={producto.producto?.toUpperCase()}>
              {producto.producto?.toUpperCase() || 'N/A'}
            </span>
            <span className="font-semibold">{producto.porcentaje?.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProductosListWidget
