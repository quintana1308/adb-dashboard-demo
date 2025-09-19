import { useState } from 'react'
import * as XLSX from 'xlsx'

const ExcelExportButton = ({ 
  data = [], 
  filename = 'datos_exportados', 
  sheetName = 'Datos',
  title = 'Reporte de Datos',
  columns = null, // Si no se especifica, se detectan automáticamente
  className = '',
  disabled = false
}) => {
  const [isExporting, setIsExporting] = useState(false)

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

  const detectColumns = (data) => {
    if (!data || data.length === 0) return []
    
    const firstItem = data[0]
    return Object.keys(firstItem).map(key => ({
      key,
      header: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
      formatter: (value) => {
        // Formatear números con decimales
        if (typeof value === 'number' && !Number.isInteger(value)) {
          return value.toFixed(2)
        }
        // Formatear porcentajes
        if (key.toLowerCase().includes('porcentaje') && typeof value === 'number') {
          return `${value.toFixed(2)}%`
        }
        return value
      }
    }))
  }

  const exportToExcel = async () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar')
      return
    }

    setIsExporting(true)

    try {
      // Detectar columnas automáticamente si no se proporcionan
      const columnsToUse = columns || detectColumns(data)
      
      // Crear los datos formateados para Excel
      const excelData = []
      
      // Agregar título
      excelData.push([title])
      excelData.push([]) // Fila vacía
      excelData.push([`Fecha de exportación: ${formatDate()}`])
      excelData.push([]) // Fila vacía
      
      // Agregar encabezados
      const headers = columnsToUse.map(col => col.header)
      excelData.push(headers)
      
      // Agregar datos
      data.forEach(row => {
        const rowData = columnsToUse.map(col => {
          const value = row[col.key]
          return col.formatter ? col.formatter(value) : value
        })
        excelData.push(rowData)
      })
      
      // Crear el libro de trabajo
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(excelData)
      
      // Configurar el ancho de las columnas
      const colWidths = columnsToUse.map((col, index) => {
        const headerLength = col.header.length
        const maxDataLength = Math.max(
          ...data.map(row => {
            const value = row[col.key]
            const formattedValue = col.formatter ? col.formatter(value) : value
            return String(formattedValue || '').length
          })
        )
        return { wch: Math.max(headerLength, maxDataLength, 15) }
      })
      
      ws['!cols'] = colWidths
      
      // Combinar celdas para el título (A1 hasta la última columna)
      const titleRange = `A1:${String.fromCharCode(65 + columnsToUse.length - 1)}1`
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: columnsToUse.length - 1 } }, // Título
        { s: { r: 2, c: 0 }, e: { r: 2, c: columnsToUse.length - 1 } }  // Fecha
      ]
      
      // Estilo para el título
      if (ws['A1']) {
        ws['A1'].s = {
          font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
          alignment: { horizontal: 'center', vertical: 'center' },
          fill: { fgColor: { rgb: "1c398e" } },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        }
      }
      
      // Estilo para la fecha
      if (ws['A3']) {
        ws['A3'].s = {
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
      
      // Estilo para los encabezados
      const headerRow = 5 // Fila donde están los encabezados
      columnsToUse.forEach((col, index) => {
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
      data.forEach((row, rowIndex) => {
        columnsToUse.forEach((col, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRow + rowIndex, c: colIndex })
          if (ws[cellAddress]) {
            ws[cellAddress].s = {
              border: {
                top: { style: 'thin', color: { rgb: "000000" } },
                bottom: { style: 'thin', color: { rgb: "000000" } },
                left: { style: 'thin', color: { rgb: "000000" } },
                right: { style: 'thin', color: { rgb: "000000" } }
              },
              alignment: { horizontal: colIndex === columnsToUse.length - 1 ? 'center' : 'left', vertical: 'center' }
            }
          }
        })
      })
      
      // Agregar la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
      
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
    }
  }

  return (
    <button
      onClick={exportToExcel}
      disabled={disabled || isExporting || !data || data.length === 0}
      className={`
        inline-flex items-center justify-center
        transition-all duration-200 ease-in-out
        ${disabled || !data || data.length === 0
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-blue-600 hover:text-blue-700'
        }
        ${isExporting ? 'opacity-75 cursor-wait' : ''}
        ${className}
      `}
      title={
        disabled || !data || data.length === 0 
          ? 'No hay datos para exportar' 
          : 'Exportar datos a Excel'
      }
    >
      {isExporting ? (
        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )}
    </button>
  )
}

export default ExcelExportButton
