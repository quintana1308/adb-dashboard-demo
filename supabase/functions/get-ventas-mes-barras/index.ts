import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

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

  try {
    // Crear cliente de Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization') }
        }
      }
    );

    // Obtener parámetros del cuerpo de la solicitud
    const body = await req.json();
    const { 
      mes, 
      aliado, 
      sucursal, 
      marca, 
      rubro, 
      portafolio_interno, 
      consumo_masivo, 
      version, 
      presentacion, 
      region,
      sku,
      tipo_cliente 
    } = body;

    // Función para convertir valores de filtro
    const convertirFiltro = (valor: any) => {
      if (!valor || valor === 'All') return null;
      return Array.isArray(valor) ? valor : [valor];
    };

    // Función especial para convertir presentación a numeric
    const convertirFiltroNumerico = (valor: any) => {
      if (!valor || valor === 'All') return null;
      const valores = Array.isArray(valor) ? valor : [valor];
      return valores.map((v: any) => parseFloat(v)).filter((v: number) => !isNaN(v));
    };

    // Llamar a la función RPC con los filtros convertidos
    const { data, error } = await supabaseClient.rpc('get_ventas_mes_barras', {
      p_mes: convertirFiltro(mes),
      p_aliado: convertirFiltro(aliado),
      p_sucursal: convertirFiltro(sucursal),
      p_marca: convertirFiltro(marca),
      p_rubro: convertirFiltro(rubro),
      p_portafolio_interno: convertirFiltro(portafolio_interno),
      p_consumo_masivo: convertirFiltro(consumo_masivo),
      p_version: convertirFiltro(version),
      p_presentacion: convertirFiltroNumerico(presentacion),
      p_region: convertirFiltro(region),
      p_sku: convertirFiltro(sku),
      p_tipo_cliente: convertirFiltro(tipo_cliente)
    });

    if (error) {
      console.error('Error en RPC:', error);
      throw error;
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });

  } catch (error) {
    console.error('Error en Edge Function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
