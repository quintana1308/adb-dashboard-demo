-- Otorgar permisos para las funciones de Finanzas - Rentabilidad
-- Proyecto: ADN Dashboard Demo

-- Otorgar permisos de ejecución al rol anon (usado por el frontend)
GRANT EXECUTE ON FUNCTION public.get_filtros_finanzas_rentabilidad() TO anon;
GRANT EXECUTE ON FUNCTION public.get_finanzas_rentabilidad(bigint, text, text, text, text, text, integer, integer, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_finanzas_rentabilidad_totales(bigint, text, text, text, text, text) TO anon;

-- Otorgar permisos de ejecución al rol authenticated (usuarios logueados)
GRANT EXECUTE ON FUNCTION public.get_filtros_finanzas_rentabilidad() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_finanzas_rentabilidad(bigint, text, text, text, text, text, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_finanzas_rentabilidad_totales(bigint, text, text, text, text, text) TO authenticated;
