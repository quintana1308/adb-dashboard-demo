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

    console.log('Parámetros recibidos:', { anio, mes, codigoruta })

    // Convertir parámetros: 'All' o null se convierten a null
    const anioNum = anio && anio !== 'All' ? parseInt(anio) : null
    const mesParam = mes && mes !== 'All' ? mes : null
    const codigorutaParam = codigoruta && codigoruta !== 'All' ? codigoruta : null

    console.log('Parámetros procesados:', { anioNum, mesParam, codigorutaParam })

    // Obtener el conteo total primero
    console.log('Llamando count_activacion_vendedor con:', { p_anio: anioNum, p_mes: mesParam, p_codigoruta: codigorutaParam })
    
    // Probar con una consulta SQL directa primero
    const { count: testCount, error: testError } = await supabaseClient
      .from('ACTIVACION_VENDEDOR')
      .select('*', { count: 'exact', head: true });
    console.log('Test count directo:', { count: testCount, error: testError })
    
    // También probar con una consulta RPC simple
    const { data: simpleCount, error: simpleError } = await supabaseClient.rpc('count_activacion_vendedor');
    console.log('Simple RPC count:', { simpleCount, simpleError })
    
    const { data: countData, error: countError } = await supabaseClient.rpc('count_activacion_vendedor', {
      p_anio: anioNum,
      p_mes: mesParam,
      p_codigoruta: codigorutaParam
    });
    console.log('Resultado count:', { countData, countError })

    if (countError) {
      console.error('Error al contar activación vendedor:', countError);
      return new Response(
        JSON.stringify({ error: countError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener los datos (limitados a 10000 registros para evitar timeout)
    const { data, error } = await supabaseClient.rpc('get_activacion_vendedor', {
      p_anio: anioNum,
      p_mes: mesParam,
      p_codigoruta: codigorutaParam
    });

    if (error) {
      console.error('Error al obtener activación vendedor:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Datos obtenidos: ${data?.length || 0} registros, Total: ${countData}`);

    return new Response(
      JSON.stringify({ 
        data: data || [], 
        totalCount: countData || 0,
        debug: {
          parametrosRecibidos: { anio, mes, codigoruta },
          parametrosProcesados: { anioNum, mesParam, codigorutaParam },
          countData,
          dataLength: data?.length || 0,
          testCount: testCount,
          testError: testError,
          simpleCount: simpleCount,
          simpleError: simpleError
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error general:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
