import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle, CheckCircle2, X } from 'lucide-react'
import { syncAPI } from '../utils/syncAPI'
import { useUserPermissions } from '../hooks/useUserPermissions'

const SyncButton = ({ 
  onSyncComplete = () => {}, 
  buttonText = "Sincronizar Datos",
  buttonClassName = "",
  showModal = true,
  disabled = false 
}) => {
  // Hook para verificar permisos del usuario
  const { canSync, userRole, loading: permissionsLoading } = useUserPermissions()
  
  // Estados para la sincronización
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncStatus, setSyncStatus] = useState(null)
  const [showSyncModal, setShowSyncModal] = useState(false)

  // Verificar estado de sincronización cada 3 segundos cuando está activa
  useEffect(() => {
    let interval
    if (isSyncing) {
      interval = setInterval(async () => {
        try {
          const status = await syncAPI.getStatus()
          console.log('Status polling result:', status)
          
          if (!status.running) {
            console.log('Sincronización terminada, actualizando estado')
            setIsSyncing(false)
            setSyncStatus('success')
            
            // Mostrar resumen de resultados si está disponible
            if (status.last_sync) {
              setSyncMessage(`Sincronización completada exitosamente a las ${status.last_sync.timestamp}`)
            } else {
              setSyncMessage('Sincronización completada con éxito')
            }
            
            // Llamar callback de finalización
            onSyncComplete(true)
            
            // No ocultar automáticamente - el usuario debe cerrar manualmente
          } else {
            const minutes = Math.floor(status.duration / 60)
            const seconds = status.duration % 60
            setSyncMessage(`Sincronización en proceso... (${minutes}:${seconds.toString().padStart(2, '0')})`)
          }
        } catch (error) {
          console.error('Error verificando estado de sincronización:', error)
          // Si hay error en el polling, asumir que no hay sincronización activa
          console.log('Error en polling, asumiendo que no hay sincronización activa')
          setIsSyncing(false)
          setSyncStatus('error')
          setSyncMessage('Error al verificar estado de sincronización')
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isSyncing, onSyncComplete])

  // Verificar al cargar el componente si hay sincronización activa
  useEffect(() => {
    const checkInitialSyncStatus = async () => {
      try {
        const status = await syncAPI.getStatus()
        console.log('Initial sync status check:', status)
        
        if (status.running) {
          console.log('Sincronización activa detectada al cargar')
          setIsSyncing(true)
          if (showModal) {
            setShowSyncModal(true)
            const sourceText = status.source === 'cron_plesk' ? 'desde el servidor Plesk' : 
                              status.source === 'api_manual' ? 'manualmente' : 'desde el servidor'
            setSyncMessage(`Sincronización en proceso (iniciada ${sourceText})...`)
            setSyncStatus('loading')
          }
        } else {
          console.log('No hay sincronización activa al cargar')
          // Asegurar que el estado esté limpio
          setIsSyncing(false)
          setShowSyncModal(false)
          setSyncMessage('')
          setSyncStatus(null)
        }
      } catch (error) {
        console.error('Error verificando estado inicial de sincronización:', error)
        // En caso de error, asumir que no hay sincronización activa
        setIsSyncing(false)
        setShowSyncModal(false)
      }
    }
    
    checkInitialSyncStatus()
  }, [showModal])

  const handleSync = async () => {
    console.log('Botón de sincronización presionado')
    
    // Forzar actualización inmediata del estado
    setIsSyncing(true)
    if (showModal) {
      setShowSyncModal(true)
      setSyncMessage('Iniciando sincronización de datos...')
      setSyncStatus('loading')
    }
    
    try {
      console.log('Llamando directamente syncAll...')
      const result = await syncAPI.syncAll()
      console.log('Resultado de syncAll:', result)
      
      if (result.success) {
        console.log('Sincronización iniciada exitosamente')
        if (showModal) {
          setSyncMessage('Sincronización iniciada correctamente. Procesando datos...')
          setSyncStatus('loading')
        }
      } else {
        console.log('Error en sincronización:', result)
        setIsSyncing(false)
        if (showModal) {
          if (result.code === 'SYNC_IN_PROGRESS') {
            setSyncMessage('Ya hay una sincronización en curso desde el servidor')
            setSyncStatus('warning')
          } else {
            setSyncMessage(`Error al iniciar sincronización: ${result.error}`)
            setSyncStatus('error')
          }
          setTimeout(() => {
            setShowSyncModal(false)
            setSyncMessage('')
            setSyncStatus(null)
          }, 6000)
        }
        onSyncComplete(false, result.error)
      }
    } catch (error) {
      console.error('Error completo en handleSync:', error)
      setIsSyncing(false)
      if (showModal) {
        setSyncMessage(`Error de conexión: ${error.message}`)
        setSyncStatus('error')
        setTimeout(() => {
          setShowSyncModal(false)
          setSyncMessage('')
          setSyncStatus(null)
        }, 6000)
      }
      onSyncComplete(false, error.message)
    }
  }

  const closeModal = () => {
    console.log('Cerrando modal, isSyncing:', isSyncing)
    if (!isSyncing) {
      setShowSyncModal(false)
      setSyncMessage('')
      setSyncStatus(null)
    }
  }

  // Función para verificar estado manualmente (para debugging)
  const forceStatusCheck = async () => {
    try {
      const status = await syncAPI.getStatus()
      console.log('Manual status check:', status)
      
      // Si la duración es mayor a 30 minutos (1800 segundos), considerar como proceso colgado
      if (status.running && status.duration > 1800) {
        console.log('Proceso colgado detectado (>30 min), limpiando estado')
        setIsSyncing(false)
        setSyncStatus('error')
        setSyncMessage('Proceso de sincronización expirado. Limpiando estado...')
        return
      }
      
      if (!status.running && isSyncing) {
        console.log('Forzando actualización: sincronización no activa pero estado local dice que sí')
        setIsSyncing(false)
        setSyncStatus('success')
        setSyncMessage('Sincronización completada')
      }
    } catch (error) {
      console.error('Error en verificación manual:', error)
    }
  }

  // Función para limpiar lock del servidor
  const clearServerLock = async () => {
    try {
      const response = await fetch(`https://data-purolomo.com/migrator/clear_lock.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (response.ok) {
        console.log('Lock del servidor limpiado')
        setIsSyncing(false)
        setShowSyncModal(false)
        setSyncMessage('')
        setSyncStatus(null)
      }
    } catch (error) {
      console.error('Error limpiando lock del servidor:', error)
    }
  }

  // No mostrar nada si el usuario no tiene permisos
  if (permissionsLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2">
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span className="text-sm text-gray-500">Verificando permisos...</span>
      </div>
    )
  }

  if (!canSync) {
    return null // No mostrar nada para usuarios sin permisos
  }

  return (
    <>
      {/* Botón de sincronización */}
      <button
        onClick={handleSync}
        disabled={isSyncing || disabled}
        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
          isSyncing || disabled
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-[#10b981] hover:bg-[#158f18] active:bg-[#127a15] hover:shadow-md'
        } text-white ${buttonClassName}`}
        title={`Sincronizar datos (Rol: ${userRole})`}
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Sincronizando...' : buttonText}
      </button>

      {/* Modal de progreso - Esquina inferior izquierda */}
      {showModal && showSyncModal && (
        <div className="fixed bottom-4 left-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-80 border border-gray-200">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">
                Sincronización
              </h3>
              {!isSyncing && (
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Contenido del modal */}
            <div className="p-3">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                syncStatus === 'success' ? 'bg-green-50 text-green-800' :
                syncStatus === 'error' ? 'bg-red-50 text-red-800' :
                syncStatus === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                'bg-blue-50 text-blue-800'
              }`}>
                {/* Icono según el estado */}
                <div className="flex-shrink-0">
                  {syncStatus === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {syncStatus === 'error' && <AlertCircle className="w-5 h-5" />}
                  {syncStatus === 'warning' && <AlertCircle className="w-5 h-5" />}
                  {syncStatus === 'loading' && <RefreshCw className="w-5 h-5 animate-spin" />}
                </div>

                {/* Mensaje */}
                <div className="flex-1">
                  <p className="text-sm font-medium">{syncMessage}</p>
                </div>

                {/* Indicador de progreso visual para sincronización activa */}
                {isSyncing && (
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                )}
              </div>

              {/* Información adicional solo durante sincronización */}
              {isSyncing && (
                <div className="mt-2 text-xs text-gray-600">
                  <p>• Puedes continuar usando la interfaz</p>
                  <p>• Los datos se actualizarán al finalizar</p>
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={forceStatusCheck}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Verificar estado
                    </button>
                    <button 
                      onClick={clearServerLock}
                      className="text-red-600 hover:text-red-800 underline"
                    >
                      Limpiar lock
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer del modal - Solo mostrar botón cerrar cuando termine */}
            {!isSyncing && syncStatus && (
              <div className="px-3 py-2 border-t border-gray-200 flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-xs font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default SyncButton
