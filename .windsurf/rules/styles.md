---
trigger: always_on
---

###SUPABASE

- ID DEL PROYECTO: efmdfbokgrgwmxzvqvio
- SÓLO PUEDES USAR EL MCP SERVER PARA HACER CONSULTAS DE CUALQUIER COSA. NO PUEDES CREAR, EDITAR O ELIMINAR DESDE EL MCP SERVER.
- PARA HACER MODIFICACIONES A LA BD UTILIZA SUPABASE CLI Y MIGRATIONS
- CUALQUIER CAMBIO QUE SE NECESITE HACER EN SUPABASE DEBE HACERSE GENERANDO UN MIGRATION CON EL COMANDO DE SUPABASE CLI.


Manejar solicitudes OPTIONS para CORS en las Edge Functions
Este código los debes colocar siempre en las Edge Functions para eviar el error de CORS en las solicitudes.

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


###Colores usados

Estos son los colores de la marca purolomo. Estos colores se deben usar para combinar las diferentes pantallas del sistema.

- Rojo: #ec1e06
- Verde: #1aa31b