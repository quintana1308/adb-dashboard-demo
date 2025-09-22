import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header, x-requested-with, accept, accept-language, cache-control, pragma',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { 
      anio = 'All',
      mes = 'All', 
      dia = 'All',
      cliente = 'All',
      vendedor = 'All',
      productoid = 'All',
      producto = 'All',
      categoria = 'All'
    } = await req.json();

    // Obtener el conteo total primero
    const { data: countData, error: countError } = await supabaseClient.rpc('count_ventas_generales', {
      p_anio: anio,
      p_mes: mes,
      p_dia: dia,
      p_cliente: cliente,
      p_vendedor: vendedor,
      p_productoid: productoid,
      p_producto: producto,
      p_categoria: categoria
    });

    if (countError) {
      console.error('Error al contar ventas generales:', countError);
      return new Response(
        JSON.stringify({ error: countError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener los datos (limitados a 10000 registros para evitar timeout)
    const { data, error } = await supabaseClient.rpc('get_ventas_generales', {
      p_anio: anio,
      p_mes: mes,
      p_dia: dia,
      p_cliente: cliente,
      p_vendedor: vendedor,
      p_productoid: productoid,
      p_producto: producto,
      p_categoria: categoria
    });

    if (error) {
      console.error('Error al obtener ventas generales:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        data: data || [], 
        totalCount: countData || 0 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error en get-ventas-generales:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
