import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-my-custom-header, x-requested-with, accept, accept-language, cache-control, pragma',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

Deno.serve(async (req) => {
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

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  )

  try {
    const url = new URL(req.url)
    const anio = url.searchParams.get('anio') || null
    const mes = url.searchParams.get('mes') || null
    const codigoruta = url.searchParams.get('codigoruta') || null

    console.log('Parámetros recibidos para totales:', { anio, mes, codigoruta })

    // Convertir parámetros: 'All' o null se convierten a null
    const anioNum = anio && anio !== 'All' ? parseInt(anio) : null
    const mesParam = mes && mes !== 'All' ? mes : null
    const codigorutaParam = codigoruta && codigoruta !== 'All' ? codigoruta : null

    console.log('Parámetros procesados para totales:', { anioNum, mesParam, codigorutaParam })

    const { data, error } = await supabaseClient.rpc('get_activacion_vendedor_totales', {
      p_anio: anioNum,
      p_mes: mesParam,
      p_codigoruta: codigorutaParam
    });

    if (error) {
      console.error('Error al obtener totales de activación vendedor:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Totales obtenidos:', data);

    return new Response(
      JSON.stringify(data?.[0] || {}),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error general en totales:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
