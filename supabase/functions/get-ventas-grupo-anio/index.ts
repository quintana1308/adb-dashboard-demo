import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Configuración de Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// Función para crear un cliente de Supabase con el token de autenticación
function createSupabaseClient(authToken) {
  return createClient(supabaseUrl, authToken ? supabaseAnonKey : supabaseServiceKey || supabaseAnonKey, authToken ? {
    global: {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    }
  } : undefined);
}
// Manejador principal de la solicitud
Deno.serve(async (req)=>{
  // Manejar solicitudes OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header, x-requested-with, accept, accept-language, cache-control, pragma',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  try {
    // Verificar método
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Método no permitido'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    // Obtener los datos de la solicitud
    const requestBody = await req.json().catch(()=>({}));
    const { rubro = 'All', consumo_masivo = 'All', marca = 'All', version = 'All', presentacion = 'All', mes = 'All', aliado = 'All', sucursal = 'All', portafolio_interno = 'All', estado = 'All' } = requestBody;
    console.log('Filtros recibidos:', requestBody);
    // Verificar que todas las variables de entorno estén definidas
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Variables de entorno no configuradas correctamente',
        url: supabaseUrl ? 'OK' : 'Missing',
        key: supabaseAnonKey ? 'OK' : 'Missing'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    // Obtener el token de autenticación del encabezado
    const authHeader = req.headers.get('Authorization');
    const authToken = authHeader ? authHeader.replace('Bearer ', '') : undefined;
    // Crear cliente de Supabase con el token de autenticación si está disponible
    const supabase = createSupabaseClient(authToken);
    // Llamar a la función RPC con los parámetros correctos
    const { data, error } = await supabase.rpc('get_ventas_grupo_anio_data', {
      p_mes: mes,
      p_aliado: aliado,
      p_sucursal: sucursal,
      p_marca: marca,
      p_gpo: portafolio_interno,
      p_rubro: rubro,
      p_consumo_masivo: consumo_masivo,
      p_version: version,
      p_presentacion: presentacion,
      p_estado: estado
    });
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        error: 'Database query failed',
        details: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    console.log('Datos procesados:', data?.length || 0, 'grupos');
    // Responder con el resultado
    return new Response(JSON.stringify(data || []), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error en el procesamiento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});
