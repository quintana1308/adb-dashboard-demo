import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header, x-requested-with, accept, accept-language, cache-control, pragma',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

Deno.serve(async (req: Request) => {
  // Manejar solicitudes OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Obtener parámetros de la consulta
    const url = new URL(req.url);
    const searchParams = url.searchParams;
    
    // Construir parámetros para la función RPC
    const params: any = {};
    
    // Procesar cada filtro
    const filtros = [
      'mes', 'aliado', 'sucursal', 'marca', 'rubro', 
      'portafolio_interno', 'consumo_masivo', 'version', 
      'presentacion', 'region', 'sku', 'tipo_cliente'
    ];
    
    filtros.forEach(filtro => {
      const valor = searchParams.get(filtro);
      if (valor && valor !== 'All' && valor !== '') {
        if (filtro === 'presentacion') {
          // Para presentacion, convertir a array de números
          params[`p_${filtro}`] = [parseFloat(valor)];
        } else {
          // Para otros filtros, crear array de strings
          params[`p_${filtro}`] = [valor];
        }
      }
    });

    console.log('Parámetros para get_ventas_total_2024:', params);

    // Llamar a la función RPC
    const { data, error } = await supabase.rpc('get_ventas_total_2024', params);
    
    if (error) {
      console.error('Error en RPC get_ventas_total_2024:', error);
      throw error;
    }

    console.log('Resultado get_ventas_total_2024:', data);

    return new Response(
      JSON.stringify({ data }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error en get-ventas-total-2024:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Error interno del servidor',
        details: error.toString()
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500,
      }
    );
  }
});
