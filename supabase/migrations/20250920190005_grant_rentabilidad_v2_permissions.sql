-- Otorgar permisos explícitos para las funciones v2 de rentabilidad
-- Proyecto: ADN Dashboard Demo

-- Otorgar permisos de ejecución al rol anon (usado por el frontend)
GRANT EXECUTE ON FUNCTION public.get_filtros_rentabilidad_v2() TO anon;
GRANT EXECUTE ON FUNCTION public.get_rentabilidad_v2(text, text, text, text, text, text, integer, integer, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_rentabilidad_totales_v2(text, text, text, text, text, text) TO anon;

-- Otorgar permisos de ejecución al rol authenticated (usuarios logueados)
GRANT EXECUTE ON FUNCTION public.get_filtros_rentabilidad_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rentabilidad_v2(text, text, text, text, text, text, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_rentabilidad_totales_v2(text, text, text, text, text, text) TO authenticated;
