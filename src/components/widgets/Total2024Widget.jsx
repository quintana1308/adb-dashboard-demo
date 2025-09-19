import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp } from 'lucide-react'

const Total2024Widget = ({ filtros = {}, forceRefresh = 0 }) => {
  const [loading, setLoading] = useState(true)
  const [total2024, setTotal2024] = useState(0)
  const lastFiltrosRef = useRef(null)

  useEffect(() => {
    // Verificar si los filtros realmente han cambiado
    const currentFiltros = JSON.stringify(filtros)
    if (lastFiltrosRef.current !== currentFiltros) {
      lastFiltrosRef.current = currentFiltros
      fetchTotal2024()
    }
  }, [filtros.mes, filtros.aliado, filtros.sucursal, filtros.marca, filtros.rubro, filtros.portafolio_interno, filtros.consumo_masivo, filtros.version, filtros.presentacion, filtros.region, filtros.sku, filtros.tipo_cliente])

  // useEffect para manejar la recarga forzada
  useEffect(() => {
    if (forceRefresh > 0) {
      fetchTotal2024()
    }
  }, [forceRefresh])

  const fetchTotal2024 = async () => {
    setLoading(true)
    try {
      // Preparar parámetros para la función RPC
      const params = {
        p_mes: filtros.mes === 'All' ? null : [filtros.mes],
        p_aliado: filtros.aliado === 'All' ? null : [filtros.aliado],
        p_sucursal: filtros.sucursal === 'All' ? null : [filtros.sucursal],
        p_marca: filtros.marca === 'All' ? null : [filtros.marca],
        p_rubro: filtros.rubro === 'All' ? null : [filtros.rubro],
        p_portafolio_interno: filtros.portafolio_interno === 'All' ? null : [filtros.portafolio_interno],
        p_consumo_masivo: filtros.consumo_masivo === 'All' ? null : [filtros.consumo_masivo],
        p_version: filtros.version === 'All' ? null : [filtros.version],
        p_presentacion: filtros.presentacion === 'All' ? null : [filtros.presentacion],
        p_region: filtros.region === 'All' ? null : [filtros.region],
        p_sku: filtros.sku === 'All' ? null : [filtros.sku],
        p_tipo_cliente: filtros.tipo_cliente === 'All' ? null : [filtros.tipo_cliente]
      }
      
      // Llamar a la función RPC que ejecuta la consulta SQL en la base de datos
      const { data, error } = await supabase.rpc('get_ventas_total_2024', params)
      
      if (error) {
        console.error('Error en RPC get_ventas_total_2024:', error)
        throw error
      }
      
      const resultado = parseFloat(data) || 0
      
      setTotal2024(resultado)
    } catch (error) {
      console.error('Error fetching total 2024:', error)
      setTotal2024(0)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 relative overflow-hidden rounded-lg shadow-sm" style={{ backgroundColor: '#10b981' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-3">
            <div className="h-5 bg-white/20 rounded w-24 animate-pulse"></div>
            <div className="h-9 bg-white/20 rounded w-32 animate-pulse"></div>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded animate-pulse"></div>
        </div>
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      </div>
    )
  }

  return (
    <div 
      className="p-4 text-white rounded-lg shadow-sm"
      style={{ backgroundColor: '#10b981' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide">TOTAL 2024</p>
          <p className="text-2xl font-bold text-white mt-1">
            {total2024?.toLocaleString('es-ES', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}
          </p>
        </div>
        <TrendingUp className="w-8 h-8 text-white/80" />
      </div>
    </div>
  )
}

export default Total2024Widget
