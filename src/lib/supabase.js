import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase
// NOTA: Estas variables deben ser proporcionadas por el usuario
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
  // Configuración de timeout para funciones RPC
  realtime: {
    timeout: 60000, // 60 segundos
  },
  // Timeout para requests HTTP (incluye RPC)
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(120000) // 120 segundos (2 minutos)
    })
  }
})

// Función para autenticar usuario
export const signInWithPassword = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

// Función para cerrar sesión
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Función para obtener el usuario actual
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Función para escuchar cambios en la autenticación
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}
