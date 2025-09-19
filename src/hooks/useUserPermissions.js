import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useUserPermissions = () => {
  const [canSync, setCanSync] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Obtener usuario actual
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        
        if (!currentUser) {
          setCanSync(false)
          setUserRole(null)
          setUser(null)
          setLoading(false)
          return
        }

        setUser(currentUser)

        // Verificar si el usuario puede sincronizar usando la función RPC
        const { data: canSyncData, error: syncError } = await supabase
          .rpc('can_user_sync')

        if (syncError) {
          console.error('Error verificando permisos de sincronización:', syncError)
          setCanSync(false)
        } else {
          setCanSync(canSyncData || false)
        }

        // Obtener el rol del usuario
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role')

        if (roleError) {
          console.error('Error obteniendo rol del usuario:', roleError)
          setUserRole(null)
        } else {
          setUserRole(roleData)
        }

      } catch (error) {
        console.error('Error verificando permisos:', error)
        setCanSync(false)
        setUserRole(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkPermissions()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        checkPermissions()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    canSync,
    userRole,
    loading,
    user,
    refreshPermissions: async () => {
      setLoading(true)
      const checkPermissions = async () => {
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          
          if (!currentUser) {
            setCanSync(false)
            setUserRole(null)
            setUser(null)
            return
          }

          setUser(currentUser)

          const { data: canSyncData } = await supabase.rpc('can_user_sync')
          setCanSync(canSyncData || false)

          const { data: roleData } = await supabase.rpc('get_user_role')
          setUserRole(roleData)

        } catch (error) {
          console.error('Error refrescando permisos:', error)
          setCanSync(false)
          setUserRole(null)
          setUser(null)
        } finally {
          setLoading(false)
        }
      }
      
      await checkPermissions()
    }
  }
}
