import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp } from 'lucide-react'

const ToneladasWidget = ({ filtros = {}, forceRefresh = 0 }) => {
  const [loading, setLoading] = useState(true)
  const [toneladas, setToneladas] = useState(0)
  const lastFiltrosRef = useRef(null)

  useEffect(() => {
    // Verificar si los filtros realmente han cambiado
    const currentFiltros = JSON.stringify(filtros)
    if (lastFiltrosRef.current !== currentFiltros) {
      lastFiltrosRef.current = currentFiltros
      fetchToneladas()
    }
  }, [filtros.mes, filtros.aliado, filtros.marca, filtros.gpo, filtros.aliado_especifico])

  // useEffect para manejar la recarga forzada
  useEffect(() => {
    if (forceRefresh > 0) {
      fetchToneladas()
    }
  }, [forceRefresh])

  const fetchToneladas = async () => {
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
      const { data, error } = await supabase.rpc('get_ventas_consolidado_total_toneladas', params)
      
      if (error) {
        console.error('Error en RPC get_ventas_consolidado_total_toneladas:', error)
        throw error
      }
      
      const resultado = parseFloat(data) || 0
      
      setToneladas(resultado)
    } catch (error) {
      console.error('Error fetching toneladas:', error)
      setToneladas(0)
    } finally {
      setLoading(false)
    }
  }



  if (loading) {
    return (
      <div className="p-6 rounded-lg shadow-lg relative overflow-hidden" style={{ backgroundColor: '#10b981' }}>
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
      className="p-6 rounded-lg shadow-lg text-white"
      style={{ backgroundColor: '#10b981' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">TONELADAS</p>
          <p className="text-3xl font-bold text-white">
            {toneladas?.toLocaleString('es-ES', { 
              minimumFractionDigits: 2, 
              maximumFractionDigits: 2 
            }) || '0.00'}
          </p>
        </div>
        <TrendingUp className="w-12 h-12 text-white/80" />
      </div>
    </div>
  )
}

export default ToneladasWidget
