import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

const ActivacionExcelExportButton = ({ 
  filtros,
  rpcFunction,
  columns,
  tipo = 'activacion',
  filename = 'activacion_datos',
  title = 'Reporte de Activación',
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  const formatDate = () => {
    const now = new Date()
    return now.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(/[/:]/g, '-')
  }

  const fetchAllData = async () => {
    const allData = []
    let page = 1
    const pageSize = 1000 // Páginas grandes para eficiencia
    let hasMore = true
    let totalRecords = 0

    while (hasMore) {
      try {
        // Preparar parámetros para la función RPC (igual que en ActivacionDataTableWidget)
        const params = {
          p_mes: filtros.mes === 'All' ? null : filtros.mes,
          p_region: filtros.region === 'All' ? null : filtros.region,
          p_estado: filtros.estado === 'All' ? null : filtros.estado,
          p_aliado: filtros.aliado === 'All' ? null : filtros.aliado,
          p_sucursal: filtros.sucursal === 'All' ? null : filtros.sucursal,
          p_page: page,
          p_page_size: pageSize,
          p_sort_column: 'sucursal',
          p_sort_direction: 'ASC'
        }

        // Para SKU, agregar parámetro adicional si existe
        if (rpcFunction === 'get_act_aliados_sku') {
          params.p_sku = filtros.sku === 'All' ? null : filtros.sku
        }

        const { data: result, error } = await supabase.rpc(rpcFunction, params)

        if (error) {
          console.error('Error en RPC:', error)
          throw error
        }

        if (!result || result.length === 0) {
          hasMore = false
          break
        }

        // Obtener total de registros de la primera página
        if (page === 1) {
          totalRecords = result[0]?.total_count || 0
          setProgress({ current: 0, total: totalRecords })
        }

        // Agregar datos a la colección completa
        allData.push(...result)
        
        // Actualizar progreso
        setProgress({ current: allData.length, total: totalRecords })

        // Verificar si hay más páginas
        const totalPages = Math.ceil(totalRecords / pageSize)
        hasMore = page < totalPages

        page++

        // Pequeña pausa para no sobrecargar el servidor
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }

      } catch (error) {
        console.error(`Error descargando página ${page}:`, error)
        throw error
      }
    }

    return allData
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

  const exportToExcel = async () => {
    setIsExporting(true)
    setProgress({ current: 0, total: 0 })

    try {
      // Descargar todos los datos
      const allData = await fetchAllData()

      if (!allData || allData.length === 0) {
        alert('No hay datos para exportar con los filtros seleccionados')
        return
      }

      // Crear los datos formateados para Excel
      const excelData = []
      
      // Agregar título
      excelData.push([title])
      excelData.push([]) // Fila vacía
      excelData.push([`Fecha de exportación: ${formatDate()}`])
      excelData.push([`Total de registros: ${allData.length.toLocaleString()}`])
      
      // Agregar filtros aplicados
      const filtrosAplicados = []
      if (filtros.mes !== 'All') filtrosAplicados.push(`Mes: ${filtros.mes}`)
      if (filtros.region !== 'All') filtrosAplicados.push(`Región: ${filtros.region}`)
      if (filtros.estado !== 'All') filtrosAplicados.push(`Estado: ${filtros.estado}`)
      if (filtros.aliado !== 'All') filtrosAplicados.push(`Aliado: ${filtros.aliado}`)
      if (filtros.sucursal !== 'All') filtrosAplicados.push(`Sucursal: ${filtros.sucursal}`)
      if (filtros.sku !== 'All') filtrosAplicados.push(`SKU: ${filtros.sku}`)
      
      if (filtrosAplicados.length > 0) {
        excelData.push([`Filtros aplicados: ${filtrosAplicados.join(', ')}`])
      }
      
      excelData.push([]) // Fila vacía
      
      // Agregar encabezados
      const headers = columns.map(col => col.label)
      excelData.push(headers)
      
      // Agregar datos
      allData.forEach(row => {
        const rowData = columns.map(col => {
          const value = row[col.key]
          return formatValue(value, col)
        })
        excelData.push(rowData)
      })
      
      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      
      // Configurar el ancho de las columnas
      const colWidths = columns.map((col) => {
        const headerLength = col.label.length
        const maxDataLength = Math.max(
          ...allData.map(row => {
            const value = row[col.key]
            const formattedValue = formatValue(value, col)
            return String(formattedValue || '').length
          })
        )
        return { wch: Math.max(headerLength, maxDataLength, 15) }
      })
      
      ws['!cols'] = colWidths
      
      // Combinar celdas para el título y información
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } }, // Título
        { s: { r: 2, c: 0 }, e: { r: 2, c: columns.length - 1 } }, // Fecha
        { s: { r: 3, c: 0 }, e: { r: 3, c: columns.length - 1 } }, // Total registros
      ]
      
      if (filtrosAplicados.length > 0) {
        ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: columns.length - 1 } }) // Filtros
      }
      
      // Estilo para el título
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "ec1e06" } },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        }
      }
      
      // Estilo para la información
      const infoRows = ['A3', 'A4']
      if (filtrosAplicados.length > 0) infoRows.push('A5')
      
      infoRows.forEach(cellRef => {
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { italic: true, sz: 10, bold: true },
            alignment: { horizontal: 'center', vertical: 'center' },
            fill: { fgColor: { rgb: "f8f9fa" } },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          }
        }
      })
      
      // Estilo para los encabezados
      const headerRow = filtrosAplicados.length > 0 ? 7 : 6 // Ajustar según si hay filtros
      columns.forEach((col, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: index })
        if (ws[cellAddress]) {
          ws[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "1aa31b" } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: "000000" } },
              bottom: { style: 'thin', color: { rgb: "000000" } },
              left: { style: 'thin', color: { rgb: "000000" } },
              right: { style: 'thin', color: { rgb: "000000" } }
            }
          }
        }
      })
      
      // Estilo para las celdas de datos
      allData.forEach((row, rowIndex) => {
        columns.forEach((col, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRow + rowIndex, c: colIndex })
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              border: {
                top: { style: 'thin', color: { rgb: "000000" } },
                bottom: { style: 'thin', color: { rgb: "000000" } },
                left: { style: 'thin', color: { rgb: "000000" } },
                right: { style: 'thin', color: { rgb: "000000" } }
              },
              alignment: { 
                horizontal: col.align === 'right' ? 'right' : 'left', 
                vertical: 'center' 
              }
            }
          }
        })
      })
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Datos')
      
      // Generar el nombre del archivo con timestamp
      const timestamp = formatDate()
      const finalFilename = `${filename}_${timestamp}.xlsx`
      
      // Descargar el archivo
      XLSX.writeFile(wb, finalFilename)
      
      
    } catch (error) {
      console.error('Error al exportar a Excel:', error)
      alert('Error al generar el archivo Excel. Por favor, inténtalo de nuevo.')
    } finally {
      setIsExporting(false)
      setProgress({ current: 0, total: 0 })
    }
  }

  return (
    <>
      <button
        onClick={exportToExcel}
        disabled={isExporting}
        className={`
          p-2 hover:bg-gray-100 rounded-lg transition-colors
          ${isExporting
            ? 'text-gray-400 cursor-not-allowed'
            : 'text-blue-600 hover:text-blue-700'
          }
          ${className}
        `}
        title={isExporting ? 'Descargando datos...' : 'Exportar todos los datos a Excel'}
        style={{ color: isExporting ? undefined : '#3b82f6' }}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
        ) : (
          <Download className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </button>

      {/* Modal de progreso */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mb-4">
                <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Descargando datos
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Por favor espera mientras descargamos todos los datos...
              </p>
              
              {progress.total > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progreso</span>
                    <span>{progress.current.toLocaleString()} / {progress.total.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round((progress.current / progress.total) * 100)}% completado
                  </div>
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                No cierres esta ventana hasta que termine la descarga
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ActivacionExcelExportButton
