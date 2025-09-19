import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { TrendingUp, Package, Clock } from 'lucide-react'

const TotalesWidget = ({ filtros = {} }) => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    total_toneladas: 0,
    total_cajas: 0,
    inicio_sincronizacion: null
  })

  useEffect(() => {
    fetchTotales()
  }, [filtros])

  const fetchTotales = async () => {
    setLoading(true)
    try {
      // ESTRATEGIA OPTIMIZADA: Usar agregación directa en Supabase para mejor performance
      
      // Solo aplicar filtros si NO están en 'All'
      const hasFilters = (filtros.mes && filtros.mes !== 'All') || 
                        (filtros.aliado && filtros.aliado !== 'All') || 
                        (filtros.marca && filtros.marca !== 'All')
      
      let baseQuery = supabase.from('HOMOLOGACIONVTA')
      
      if (hasFilters) {
        if (filtros.mes && filtros.mes !== 'All') {
          baseQuery = baseQuery.eq('mes', filtros.mes)
        }
        if (filtros.aliado && filtros.aliado !== 'All') {
          baseQuery = baseQuery.eq('aliado', filtros.aliado)
        }
        if (filtros.marca && filtros.marca !== 'All') {
          baseQuery = baseQuery.eq('marca', filtros.marca)
        }
      }
      
      // Ejecutar las 3 consultas en paralelo para máximo performance
      const [toneladasResult, cajasResult, fechaResult] = await Promise.all([
        // Total toneladas
        baseQuery.select('pesoactual').then(({ data, error }) => {
          if (error) throw error
          const total = data?.reduce((sum, row) => sum + (parseFloat(row.pesoactual) || 0), 0) || 0
          return Math.round(total * 100) / 100 // Redondear a 2 decimales
        }),
        
        // Total cajas  
        baseQuery.select('cajasactual').then(({ data, error }) => {
          if (error) throw error
          const total = data?.reduce((sum, row) => sum + (parseFloat(row.cajasactual) || 0), 0) || 0
          return Math.round(total * 100) / 100 // Redondear a 2 decimales
        }),
        
        // Fecha mínima
        baseQuery.select('upd_sincro').order('upd_sincro', { ascending: true }).limit(1).then(({ data, error }) => {
          if (error) throw error
          return data?.[0]?.upd_sincro || null
        })
      ])
      
      const result = {
        total_toneladas: toneladasResult,
        total_cajas: cajasResult,
        inicio_sincronizacion: fechaResult
      }
      
      if (!result) {
        setData({ total_toneladas: 0, total_cajas: 0, inicio_sincronizacion: null })
        return
      }
      
      setData({
        total_toneladas: result.total_toneladas,
        total_cajas: result.total_cajas,
        inicio_sincronizacion: result.inicio_sincronizacion
      })
    } catch (error) {
      console.error('Error fetching totales:', error)
      setData({
        total_toneladas: 0,
        total_cajas: 0,
        inicio_sincronizacion: null
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Skeleton for TONELADAS */}
        <div className="p-6 rounded-lg shadow-lg relative overflow-hidden" style={{ backgroundColor: '#ee2624' }}>
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
        
        {/* Skeleton for CAJAS */}
        <div className="p-6 rounded-lg shadow-lg relative overflow-hidden" style={{ backgroundColor: '#ee2624' }}>
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-5 bg-white/20 rounded w-16 animate-pulse"></div>
              <div className="h-9 bg-white/20 rounded w-36 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
        
        {/* Skeleton for INICIO DE SINCRONIZACIÓN */}
        <div className="p-6 rounded-lg shadow-lg relative overflow-hidden" style={{ backgroundColor: '#002855' }}>
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="h-5 bg-white/20 rounded w-40 animate-pulse"></div>
              <div className="h-6 bg-white/20 rounded w-28 animate-pulse"></div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded animate-pulse"></div>
          </div>
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div 
        className="text-white p-6 rounded-lg shadow-lg"
        style={{ backgroundColor: '#ee2624' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">TONELADAS</h3>
            <p className="text-3xl font-bold">{data?.total_toneladas?.toLocaleString() || '0'}</p>
          </div>
          <TrendingUp className="w-12 h-12 opacity-80" />
        </div>
      </div>

      <div 
        className="text-white p-6 rounded-lg shadow-lg"
        style={{ backgroundColor: '#ee2624' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">CAJAS</h3>
            <p className="text-3xl font-bold">{data?.total_cajas?.toLocaleString() || '0'}</p>
          </div>
          <Package className="w-12 h-12 opacity-80" />
        </div>
      </div>

      <div 
        className="text-white p-6 rounded-lg shadow-lg"
        style={{ backgroundColor: '#002855' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">INICIO DE SINCRONIZACIÓN</h3>
            <p className="text-sm">
              {data?.inicio_sincronizacion ? 
                new Date(data.inicio_sincronizacion).toLocaleString() : 
                'N/A'
              }
            </p>
          </div>
          <Clock className="w-12 h-12 opacity-80" />
        </div>
      </div>
    </div>
  )
}

export default TotalesWidget
